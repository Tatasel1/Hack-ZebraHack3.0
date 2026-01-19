document.addEventListener('DOMContentLoaded', function() {

    const siteContent = document.getElementById('site-content');
    const navbar = document.querySelector('.navbar');
    const menuIcon = document.querySelector('.menu-icon');

    const nextBtn = document.querySelector('.next-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const slider = document.querySelector('.slider');
    const slides = document.querySelectorAll('.slide');
    const numberOfSlides = slides.length;
    let slideNumber = 0;
    let slideInterval;

    const logoutBtn = document.querySelector('.logout-btn');
    const modalOverlay = document.querySelector('.modal-overlay');
    const loginFormWrapper = document.querySelector('.form-wrapper.login');
    const registerFormWrapper = document.querySelector('.form-wrapper.register');
    const loginForm = loginFormWrapper ? loginFormWrapper.querySelector('form') : null;
    const registerForm = registerFormWrapper ? registerFormWrapper.querySelector('form') : null;
    const registerLinkBtns = document.querySelectorAll('.register-link-btn');
    const loginLinkBtns = document.querySelectorAll('.login-link-btn');

    function closeAuthModal() {
        if (modalOverlay) modalOverlay.classList.remove('active');
        document.body.classList.add('logged-in');
    }

    function openAuthModal() {
        if (modalOverlay) modalOverlay.classList.add('active');
        document.body.classList.remove('logged-in');

        if (loginFormWrapper) loginFormWrapper.classList.add('active');
        if (registerFormWrapper) registerFormWrapper.classList.remove('active');
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            alert('Ați ieșit din cont cu succes!');
            openAuthModal();
        });
    }
    registerLinkBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginFormWrapper) loginFormWrapper.classList.remove('active');
            if (registerFormWrapper) registerFormWrapper.classList.add('active');
        });
    });

    loginLinkBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (registerFormWrapper) registerFormWrapper.classList.remove('active');
            if (loginFormWrapper) loginFormWrapper.classList.add('active');
        });
    });

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = registerForm.querySelector('input[type="text"]').value;
            const email = registerForm.querySelector('input[type="email"]').value;
            const password = registerForm.querySelector('input[type="password"]').value;

            if (!username || !email || !password) {
                alert('Vă rugăm completați toate câmpurile!');
                return;
            }

            let users = JSON.parse(localStorage.getItem('users')) || [];

            if (users.find(u => u.username === username || u.email === email)) {
                alert('Eroare: Numele de utilizator sau emailul este deja înregistrat!');
                return;
            }

            users.push({ username, email, password });
            localStorage.setItem('users', JSON.stringify(users));

            alert('Înregistrare reușită! Vă puteți loga acum.');

            if (registerFormWrapper) registerFormWrapper.classList.remove('active');
            if (loginFormWrapper) loginFormWrapper.classList.add('active');
            registerForm.reset();
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const usernameInput = loginForm.querySelector('input[type="text"]').value;
            const passwordInput = loginForm.querySelector('input[type="password"]').value;

            const users = JSON.parse(localStorage.getItem('users')) || [];

            const foundUser = users.find(u => u.username === usernameInput);

            if (!foundUser) {
                alert('Contul nu există. Vă rugăm să vă înregistrați.');
            } else if (foundUser.password !== passwordInput) {
                alert('Parolă incorectă.');
            } else {
                alert('Login reușit! Bine ați venit, ' + foundUser.username + '!');

                localStorage.setItem('isLoggedIn', 'true');
                closeAuthModal();
            }
        });
    }

    function checkLoginState() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

        if (isLoggedIn) {
            closeAuthModal();
        } else {
            openAuthModal();
        }
    }

    checkLoginState();

    if (menuIcon && navbar) {
        menuIcon.addEventListener('click', () => {
            navbar.classList.toggle('active');

            if (navbar.classList.contains('active')) {
                menuIcon.classList.remove('bx-menu');
                menuIcon.classList.add('bx-x');
            } else {
                menuIcon.classList.remove('bx-x');
                menuIcon.classList.add('bx-menu');
            }
        });

        navbar.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navbar.classList.remove('active');
                menuIcon.classList.remove('bx-x');
                menuIcon.classList.add('bx-menu');
            });
        });
    }
});
