// Функция для добавления нового вопроса в тест
function addQuestion() {
	const questionsContainer = document.getElementById('questions-container')
	if (!questionsContainer) {
		console.error('Контейнер для вопросов не найден!')
		return
	}
	const questionIndex = questionsContainer.children.length + 1
	const questionHtml = `
    <div class="question-block">
      <label for="question-text-${questionIndex}">Вопрос ${questionIndex}</label>
      <input type="text" id="question-text-${questionIndex}" name="question-text-${questionIndex}" class="question-text-input" placeholder="Введите текст вопроса">
      <label for="question-answer-${questionIndex}">Правильный ответ</label>
      <input type="text" id="question-answer-${questionIndex}" name="question-answer-${questionIndex}" class="question-answer-input" placeholder="Введите правильный ответ">
      <button type="button" onclick="removeQuestion(this)" class="delete-question-btn">Удалить вопрос</button>
    </div>
  `
	questionsContainer.insertAdjacentHTML('beforeend', questionHtml)
}

// Функция для удаления вопроса из теста
function removeQuestion(button) {
	button.parentElement.remove()
}

// Функция для сбора данных из формы и отправки их на сервер
function submitTest() {
	const testTitle = document.getElementById('test-title').value
	const questionElements = document.querySelectorAll('.question-block')
	const questions = Array.from(questionElements).map(questionElement => {
		return {
			text: questionElement.querySelector('.question-text-input').value,
			answer: questionElement.querySelector('.question-answer-input').value,
		}
	})

	const test = {
		title: testTitle,
		questions: questions,
	}

	// Здесь должен быть код для отправки теста на сервер, например:
	fetch('/api/tests', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(test),
	})
		.then(response => {
			if (!response.ok) {
				throw new Error('Проблема с отправкой теста на сервер')
			}
			return response.json()
		})
		.then(result => {
			// Обработка результата, например, можно перенаправить пользователя на страницу с подтверждением создания теста
			window.location.href = `/test-created.html?testId=${result.testId}`
		})
		.catch(error => {
			console.error('Ошибка:', error)
			// Обработка ошибки, например, можно показать сообщение об ошибке пользователю
		})
}

document
	.getElementById('add-question-btn')
	.addEventListener('click', addQuestion)

// Прослушиватель событий для кнопки отправки теста
document.getElementById('submit-test-btn').addEventListener('click', submitTest)

// Добавление первого вопроса, когда DOM полностью загружен
document.addEventListener('DOMContentLoaded', function () {
	// Вызов addQuestion внутри этого обработчика гарантирует, что DOM загружен
	addQuestion()
})
