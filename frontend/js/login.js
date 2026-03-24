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

  const passwordToggles = document.querySelectorAll('.toggle-password');
  passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const input = toggle.parentElement.querySelector('input');
      if (input.type === 'password') {
        input.type = 'text';
        toggle.textContent = 'Hide';
      } else {
        input.type = 'password';
        toggle.textContent = 'Show';
      }
    });
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fname = document.getElementById('reg-fname').value;
    const lname = document.getElementById('reg-lname').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    const btn = registerForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Registering...';
    btn.disabled = true;

    try {
      const response = await fetch('http://localhost:5001/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ firstName: fname, lastName: lname, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('\n================================');
        console.log(`✅ [SUCCESS] Data successfully sent to the remote backend!`);
        console.log(`User registered: ${fname} ${lname} (${email})`);
        console.log('================================\n');

        alert('Registration successful! You can now log in.');
        loginBtn.click(); // Switch to login tab
      } else {
        alert('Error: ' + (data.message || 'Registration failed'));
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert('Network error. Is the backend running?');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
});
