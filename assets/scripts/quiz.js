const jsonFilePath = './assets/database/questions.json'

// Загрузка JSON и создание теста
fetch(jsonFilePath)
	.then(response => response.json())
	.then(data => createQuiz(data.tests))

function createQuiz(questions) {
	const container = document.getElementById('quiz-container')
	questions.forEach((question, index) => {
		const questionElement = document.createElement('div')
		questionElement.innerHTML = `
      <h3>${question.question}</h3>
      <div>
        <input type="radio" id="yes-${index}" name="answer-${index}" value="yes">
        <label for="yes-${index}">Да</label>
      </div>
      <div>
        <input type="radio" id="no-${index}" name="answer-${index}" value="no">
        <label for="no-${index}">Нет</label>
      </div>
    `
		container.appendChild(questionElement)
	})

	const submitButton = document.createElement('button')
	submitButton.textContent = 'Проверить ответы'
	submitButton.addEventListener('click', () => checkAnswers(questions))
	container.appendChild(submitButton)
}

function checkAnswers(questions) {
	let score = 0
	questions.forEach((question, index) => {
		const selectedAnswer = document.querySelector(
			`input[name=answer-${index}]:checked`
		)
		if (selectedAnswer && selectedAnswer.value === question.correctAnswer) {
			score++
		}
	})

	alert(`Вы правильно ответили на ${score} из ${questions.length} вопросов.`)
}
