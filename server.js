const express = require('express')
const bcrypt = require('bcrypt')
const fs = require('fs')
const path = require('path')
const {
	use
} = require('bcrypt/promises')
const session = require('express-session')
const app = express()

app.use(express.json())
app.use(express.static('public'))
app.use(
	session({
		secret: '9cf9c653-1601-4c61-bb6a-9c8ae9ccc607',
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			maxAge: 24 * 60 * 60 * 1000,
		},
	})
)

app.post('/register', async (req, res) => {
	try {
		const {
			username,
			password
		} = req.body
		// Проверяем, не существует ли уже пользователь с таким именем
		const users = JSON.parse(fs.readFileSync('users.json', 'utf8'))
		const userExists = users.find(user => user.username === username)
		if (userExists) {
			return res.status(409).send('Пользователь уже существует.')
		}
		// Хэшируем пароль
		const hashedPassword = await bcrypt.hash(password, 10)
		// Создаем нового пользователя
		const newUser = {
			username,
			password: hashedPassword,
			completedTests: []
		}
		users.push(newUser)
		// Сохраняем обновленный список пользователей
		fs.writeFileSync('users.json', JSON.stringify(users, null, 2))
		res.status(201).send('Пользователь зарегистрирован.')
	} catch (error) {
		res.status(500).send('Ошибка сервера.')
	}
})

app.post('/login', async (req, res) => {
	try {
		const {
			username,
			password
		} = req.body
		const users = JSON.parse(fs.readFileSync('users.json', 'utf8'))
		const user = users.find(user => user.username === username)
		if (!user) {
			return res.status(401).send('Пользователь не найден.')
		}
		const isMatch = await bcrypt.compare(password, user.password)
		if (!isMatch) {
			return res.status(401).send('Неверный пароль.')
		}

		req.session.user = {
			id: user.id,
			username: user.username,
		}

		if (req.session.user) {
			res.send('Сессия успешно создана и пользователь авторизован')
		} else {
			res.status(500).send('Ошибка создания сессии')
		}
	} catch (error) {
		console.error(error)
		res.status(500).send('Ошибка сервера.')
	}
})

app.post('/logout', (req, res) => {
	console.log('Попытка выхода из системы для пользователя:', req.session.user)
	req.session.destroy(err => {
		if (err) {
			console.error('Ошибка при уничтожении сессии:', err)
			res.status(500).send('Ошибка при выходе из системы')
		} else {
			console.log('Сессия успешно уничтожена')
			res.clearCookie('connect.sid') // Используйте имя вашего cookie, если оно было изменено
			res.sendStatus(200)
		}
	})
})

function checkAuthentication(req, res, next) {
	if (req.session.user) {
		console.log('Пользователь авторизован:', req.session.user.username);
		next();
	} else {
		console.log('Попытка доступа неавторизованным пользователем');
		res.status(401).json({
			message: 'Пользователь не авторизован'
		});
	}
}

// Применяем middleware ко всем API эндпоинтам, которые требуют авторизации
app.use('/api', checkAuthentication)

app.get('/api/user', (req, res) => {
	// Возвращаем данные пользователя
	res.json({
		username: req.session.user.username
	})
})

app.get('/api/tests', (req, res) => {
	if (req.session.user) {
		const testsFilePath = path.join(__dirname, 'tests.json')

		fs.readFile(testsFilePath, 'utf8', (err, data) => {
			if (err) {
				console.error(err)
				res.status(500).json({
					message: 'Ошибка при загрузке списка тестов'
				})
			} else {
				res.json(JSON.parse(data))
			}
		})
	} else {
		res.status(401).json({
			message: 'Пользователь не авторизован'
		})
	}
})



// Эндпоинт для создания нового теста
app.post('/api/tests', (req, res) => {
	const newTest = req.body; // Получаем данные нового теста из тела запроса
	const testsFilePath = path.join(__dirname, 'tests.json'); // Путь к файлу tests.json

	// Чтение текущего содержимого файла tests.json
	fs.readFile(testsFilePath, 'utf8', (err, data) => {
		if (err) {
			// Если произошла ошибка чтения файла
			console.error('Ошибка при чтении файла tests.json:', err);
			res.status(500).json({
				message: 'Ошибка при чтении файла tests.json'
			});
			return;
		}

		// Парсинг существующих данных файла tests.json
		const tests = JSON.parse(data);
		// Добавление нового теста в массив тестов
		tests.unshift(newTest);

		// Запись обновленного массива тестов обратно в файл tests.json
		fs.writeFile(testsFilePath, JSON.stringify(tests, null, 2), (err) => {
			if (err) {
				// Если произошла ошибка записи в файл
				console.error('Ошибка при записи в файл tests.json:', err);
				res.status(500).json({
					message: 'Ошибка при записи в файл tests.json'
				});
				return;
			}
			// Отправка ответа об успешном создании теста
			res.status(201).json({
				message: 'Тест успешно создан'
			});
		});
	});
});

function readTestsFile(callback) {
	const filePath = path.join(__dirname, 'tests.json')
	fs.readFile(filePath, 'utf8', (err, data) => {
		if (err) {
			callback(err, null)
		} else {
			callback(null, JSON.parse(data))
		}
	})
}

// Эндпоинт для получения вопросов теста по его ID
app.get(`/api/tests/:testId`, (req, res) => {
	const testId = req.params.testId
	readTestsFile((err, tests) => {
		if (err) {
			res.status(500).send('Ошибка при загрузке тестов')
			return
		}
		const test = tests.find(t => t.id === testId)
		console.log('Запрошен тест с ID:', testId)
		if (test) {
			console.log('Найден тест:', test)
			// Отправляем тест без правильных ответов
			const testWithoutAnswers = {
				...test,
				questions: test.questions.map(q => ({
					id: q.id,
					text: q.text
				})),
			}
			res.json(testWithoutAnswers)
		} else {
			console.log('Тест с таким ID не найден')
			res.status(404).send('Тест не найден')
		}
	})
})

function addCompletedTestToUser(username, testId, correctAnswersCount, totalQuestions) {
	const usersFilePath = path.join(__dirname, 'users.json');
	fs.readFile(usersFilePath, 'utf8', (err, data) => {
		if (err) {
			console.error('Ошибка при чтении файла users.json:', err);
			return;
		}

		const users = JSON.parse(data);
		const user = users.find(u => u.username === username);
		if (user) {
			const completedTest = {
				testId: testId,
				score: correctAnswersCount,
				total: totalQuestions
			};

			if (!user.completedTests) {
				user.completedTests = []; // Если у пользователя нет массива completedTests, создаем его
			}
			user.completedTests.push(completedTest);

			fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
				if (err) {
					console.error('Ошибка при записи в файл users.json:', err);
				} else {
					console.log(`Результаты теста для пользователя ${username} обновлены.`);
				}
			});
		} else {
			console.error('Пользователь не найден:', username);
		}
	});
}

// Эндпоинт для обработки ответов на тест и записи результатов для пользователя
app.post(`/api/tests/:testId/submit`, (req, res) => {
	const testId = req.params.testId;
	const providedAnswers = req.body.answers; // Предполагается, что ответы приходят в формате { questionId: answer, ... }

	readTestsFile((err, tests) => {
		if (err) {
			res.status(500).send('Ошибка при загрузке тестов');
			return;
		}
		const test = tests.find(t => t.id === testId);
		if (!test) {
			res.status(404).send('Тест не найден');
			return;
		}

		// Рассчитываем количество правильных ответов
		let correctAnswersCount = 0;
		console.log('Предоставленные ответы:', providedAnswers);
		test.questions.forEach(question => {
			console.log('Правильный ответ:', question.correctAnswer);
			const providedAnswer = providedAnswers[question.id];
			console.log('Ответ пользователя:', providedAnswer);

			if (providedAnswer && providedAnswer === question.correctAnswer) {
				correctAnswersCount++;
			}
		});

		// Получаем название теста
		const testName = test.title;

		// Ищем пользователя и добавляем информацию о тесте
		const username = req.session.user.username; // Получаем имя пользователя из сессии
		const usersFilePath = path.join(__dirname, 'users.json');
		const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
		const user = usersData.find(u => u.username === username);

		if (user) {
			// Если пользователь найден, добавляем информацию о пройденном тесте
			const completedTestInfo = {
				testName,
				score: correctAnswersCount,
			};
			if (!user.completedTests) {
				user.completedTests = []; // Если у пользователя нет массива completedTests, создаем его
			}
			user.completedTests.push(completedTestInfo);

			// Записываем обновленные данные пользователей обратно в файл
			fs.writeFileSync(usersFilePath, JSON.stringify(usersData, null, 2));

			// Отправляем результаты теста пользователю
			res.json({
				testId: testId,
				testName: testName,
				score: correctAnswersCount,
				totalQuestions: test.questions.length
			});
		} else {
			res.status(404).send('Пользователь не найден');
		}
	});
});

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`))