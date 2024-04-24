document.getElementById('loginForm').addEventListener('submit', event => {
	event.preventDefault()

	const username = document.getElementById('username').value
	const password = document.getElementById('password').value

	fetch('/login', {
		method: 'POST',
		headers: { 'Content-type': 'application/json' },
		body: JSON.stringify({ username, password }),
	})
		.then(response => {
			if (response.ok) {
				return response.text()
			} else {
				throw new Error('Ошибка авторизации')
			}
		})
		.then(data => {
			alert(data)
			// Переадресация на защищенную страницу после успешной авторизации
			window.location.href = '/home-page.html'
		})
		.catch(error => {
			alert(error.message)
		})
})
