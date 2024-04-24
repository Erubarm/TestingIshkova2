document.getElementById('registerForm').addEventListener('submit', event => {
	event.preventDefault()

	const username = document.getElementById('username').value
	const password = document.getElementById('password').value

	fetch('/register', {
		method: 'POST',
		headers: { 'Content-type': 'application/json' },
		body: JSON.stringify({ username, password }),
	})
		.then(response => {
			if (response.ok) {
				return response.text()
			} else {
				throw new Error('Ошибка регистрации')
			}
		})
		.then(data => {
			alert(data)

			window.location.href = '/login.html'
		})

		.catch(error => {
			alert(error.message)
		})
})
