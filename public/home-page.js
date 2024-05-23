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
			    const listItem = document.createElement('li');
			    listItem.textContent = test.title;
			    const favButton = document.createElement('button');
			    favButton.innerHTML += `
					<img src="./assets/icons/star.svg" alt="star" width="24" height=24">
			    `;
			    favButton.addEventListener('click', function(event) {
			        event.stopPropagation(); // Предотвращаем переход по клику на элемент списка
			        addToFavorites(test.id); // Функция добавления в избранное
					favButton.innerHTML = `<img src="./assets/icons/star-active.svg" alt="star" width="24" height=24">`
			    });
			    listItem.appendChild(favButton);
			    listItem.addEventListener('click', () => {
			        window.location.href = `/test-page.html?testId=${test.id}`;
			    });
			    testsListElement.appendChild(listItem);
			});
		})
		.catch(error => {
			console.error(error)
		})
}

document.getElementById('create-test').addEventListener('click', function () {
	window.location.href = '/create-test.html' // Перенаправление на страницу создания теста
})

function addToFavorites(testId) {
    fetch('/api/favorites/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testId: testId }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Не удалось добавить тест в избранное.');
        }
        alert('Тест добавлен в избранное.');
    })
    .catch(error => {
        console.error(error);
    });
}

// Вызываем функции при загрузке страницы
fetchUsername()
fetchTests()
