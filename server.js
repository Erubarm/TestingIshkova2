const express = require('express')
const bcrypt = require('bcrypt')
const fs = require('fs')
const path = require('path')
const { use } = require('bcrypt/promises')
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
		const { username, password } = req.body
		// Проверяем, не существует ли уже пользователь с таким именем
		const users = JSON.parse(fs.readFileSync('users.json', 'utf8'))
		const userExists = users.find(user => user.username === username)
		if (userExists) {
			return res.status(409).send('Пользователь уже существует.')
		}
		// Хэшируем пароль
		const hashedPassword = await bcrypt.hash(password, 10)
		// Создаем нового пользователя
		const newUser = { username, password: hashedPassword, completedTests: [] }
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
		const { username, password } = req.body
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
		next() // Пользователь авторизован, продолжаем обработку запроса
	} else {
		res.status(401).json({ message: 'Пользователь не авторизован' }) // Пользователь не авторизован, возвращаем ошибку
	}
}

// Применяем middleware ко всем API эндпоинтам, которые требуют авторизации
app.use('/api', checkAuthentication)

app.get('/api/user', (req, res) => {
	// Возвращаем данные пользователя
	res.json({ username: req.session.user.username })
})

app.get('/api/tests', (req, res) => {
	if (req.session.user) {
		const testsFilePath = path.join(__dirname, 'tests.json')

		fs.readFile(testsFilePath, 'utf8', (err, data) => {
			if (err) {
				console.error(err)
				res.status(500).json({ message: 'Ошибка при загрузке списка тестов' })
			} else {
				res.json(JSON.parse(data))
			}
		})
	} else {
		res.status(401).json({ message: 'Пользователь не авторизован' })
	}
})

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
				questions: test.questions.map(q => ({ id: q.id, text: q.text })),
			}
			res.json(testWithoutAnswers)
		} else {
			console.log('Тест с таким ID не найден')
			res.status(404).send('Тест не найден')
		}
	})
})

// Эндпоинт для обработки ответов на тест
app.post(`/api/tests/:testId/submit`, (req, res) => {
	const testId = req.params.testId
	const providedAnswers = req.body.answers // Предполагается, что ответы приходят в формате { questionId: answer, ... }

	readTestsFile((err, tests) => {
		if (err) {
			res.status(500).send('Ошибка при загрузке тестов')
			return
		}
		const test = tests.find(t => t.id === testId)
		if (!test) {
			res.status(404).send('Тест не найден')
			return
		}

		let correctAnswersCount = 0
		test.questions.forEach(question => {
			const providedAnswer = providedAnswers[question.id]
			if (providedAnswer && providedAnswer === question.correctAnswer) {
				correctAnswersCount++
			}
		})

		const result = {
			testId: testId,
			correctAnswersCount: correctAnswersCount,
			totalQuestions: test.questions.length,
		}

		res.json(result)
	})
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`))
