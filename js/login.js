document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('toggle-login');
  const registerBtn = document.getElementById('toggle-register');
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');

  loginBtn.addEventListener('click', () => {
    loginBtn.classList.add('active');
    registerBtn.classList.remove('active');
    
    registerForm.classList.remove('active');
    setTimeout(() => {
      loginForm.classList.add('active');
    }, 50);
  });

  registerBtn.addEventListener('click', () => {
    registerBtn.classList.add('active');
    loginBtn.classList.remove('active');
    
    loginForm.classList.remove('active');
    setTimeout(() => {
      registerForm.classList.add('active');
    }, 50);
  });
});
