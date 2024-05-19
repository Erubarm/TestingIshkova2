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
      <fieldset>
        <legend>Правильный ответ</legend>
        <label>
          <input type="radio" id="question-answer-yes-${questionIndex}" name="question-answer-${questionIndex}" value="Да">
          Да
        </label>
        <label>
          <input type="radio" id="question-answer-no-${questionIndex}" name="question-answer-${questionIndex}" value="Нет">
          Нет
        </label>
      </fieldset>
      <button type="button" onclick="removeQuestion(this)" class="delete-question-btn">Удалить вопрос</button>
    </div>
  `
    questionsContainer.insertAdjacentHTML('beforeend', questionHtml)
}


// Функция для удаления вопроса из теста
function removeQuestion(button) {
	button.parentElement.remove()
}

function generateUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
   }


function submitTest() {
	const testId = generateUUID(); // Функция для генерации уникального ID теста
    const testTitle = document.getElementById('test-title').value;
    const questionElements = document.querySelectorAll('.question-block');
    const questions = Array.from(questionElements).map(questionElement => {
        const questionId = generateUUID(); // Генерация уникального ID для вопроса
        const text = questionElement.querySelector('.question-text-input').value;
        const correctAnswer = questionElement.querySelector('input[type="radio"]:checked').value;

        return {
            id: questionId, // Добавление уникального ID в объект вопроса
            text,
            correctAnswer,
        };
    });

    const test = {
    	id: testId,
        title: testTitle,
        questions,
    };

    // Отправка теста на сервер
    fetch('/api/tests', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(test),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Проблема с отправкой теста на сервер');
        }
        return response.json();
    })
    .then(result => {
        // Обработка результата
        console.log('Тест успешно создан:', result);
        window.location.href = `/home-page.html`;
    })
    .catch(error => {
        // Обработка ошибки
        console.error('Ошибка:', error);
    });
}

document
	.getElementById('add-question-btn')
	.addEventListener('click', addQuestion)

// Прослушиватель событий для кнопки отправки теста
document.getElementById('submit-test-btn').addEventListener('click', submitTest);

// Добавление первого вопроса, когда DOM полностью загружен
document.addEventListener('DOMContentLoaded', function () {
	// Вызов addQuestion внутри этого обработчика гарантирует, что DOM загружен
	addQuestion()
})
