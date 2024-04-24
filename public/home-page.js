function logout() {
	fetch('/logout', { method: 'POST' })
		.then(response => {
			if (response.ok) {
				// Перенаправляем на страницу входа
				window.location.href = '/login.html'
			} else {
				throw new Error('Произошла ошибка при выходе из системы.')
			}
		})
		.catch(error => {
			console.error(error)
		})
}

// Функция для получения и отображения имени пользователя
function fetchUsername() {
	fetch('/api/user')
		.then(response => response.json())
		.then(data => {
			document.getElementById('username').textContent = data.username
		})
		.catch(error => {
			console.error(error)
		})
}

// Функция для получения и отображения списка тестов
function fetchTests() {
	fetch('/api/tests')
		.then(response => response.json())
		.then(tests => {
			const testsListElement = document.getElementById('tests-list')
			testsListElement.innerHTML = '' // Очищаем список
			tests.forEach(test => {
				const listItem = document.createElement('li')
				listItem.textContent = test.name // Предполагается, что у тестов есть свойство 'name'
				// Добавляем обработчик клика, который будет перенаправлять пользователя на страницу теста
				listItem.addEventListener('click', () => {
					window.location.href = `/test-page.html?testId=${test.id}`
				})
				testsListElement.appendChild(listItem)
			})
		})
		.catch(error => {
			console.error(error)
		})
}

document.getElementById('create-test').addEventListener('click', function () {
	window.location.href = '/create-test.html' // Перенаправление на страницу создания теста
})

// Вызываем функции при загрузке страницы
fetchUsername()
fetchTests()
