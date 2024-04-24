let currentTest = null

document.addEventListener('DOMContentLoaded', function () {
	// Функция для получения параметров из URL
	function getQueryParam(param) {
		const urlParams = new URLSearchParams(window.location.search)
		return urlParams.get(param)
	}

	// Получаем testId из URL
	const testId = getQueryParam('testId')

	// Проверяем, есть ли testId
	if (testId) {
		fetch(`/api/tests/${testId}`)
			.then(response => response.json())
			.then(test => {
				currentTest = test
				console.log('Получен тест:', test)
				const questionsContainer = document.getElementById('test-questions')
				// Очищаем контейнер вопросов
				questionsContainer.innerHTML = ''

				// Добавляем вопросы теста на страницу
				test.questions.forEach((question, index) => {
					const questionElement = document.createElement('div')
					questionElement.className = 'question'
					questionElement.innerHTML = `
											<p><b>Вопрос ${index + 1}:</b> ${question.text}</p>
											<label>
													<input type="radio" name="question${index}" value="Да"> Да
											</label>
											<label>
													<input type="radio" name="question${index}" value="Нет"> Нет
											</label>
									`
					questionsContainer.appendChild(questionElement)
				})
			})
			.catch(error => {
				console.error('Ошибка при получении теста:', error)
			})
	} else {
		console.error('testId не указан в URL')
	}

	// Обработчик для кнопки отправки теста
	document.getElementById('submit-test').addEventListener('click', function () {
		if (!currentTest) {
			console.error('Тест не загружен или не определен')
			return
		}

		const answers = {}
		currentTest.questions.forEach((question, index) => {
			// Получаем выбранное значение радиокнопки для каждого вопроса
			const radios = document.getElementsByName(`question${index}`)
			for (const radio of radios) {
				if (radio.checked) {
					answers[question.id] = radio.value
					break
				}
			}
		})

		// Отправляем ответы на сервер
		fetch(`/api/tests/${testId}/submit`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ answers }),
		})
			.then(response => {
				if (!response.ok) {
					throw new Error('Проблема с отправкой ответов на сервер')
				}
				return response.json()
			})
			.then(result => {
				// Выводим результат теста
				console.log('Результат теста:', result)
				alert(
					`Вы ответили правильно на ${result.correctAnswersCount} из ${result.totalQuestions} вопросов.`
				)
				// Здесь можно отобразить результат пользователю, например, с помощью alert или на странице
			})
			.catch(error => {
				console.error('Ошибка:', error)
			})
	})
})
