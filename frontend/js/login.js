document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("toggle-login");
  const registerBtn = document.getElementById("toggle-register");
  const loginForm = document.getElementById("form-login");
  const registerForm = document.getElementById("form-register");

  // Toggle between login & register
  loginBtn.addEventListener("click", () => {
    loginBtn.classList.add("active");
    registerBtn.classList.remove("active");

    registerForm.classList.remove("active");
    setTimeout(() => {
      loginForm.classList.add("active");
    }, 50);
  });

  registerBtn.addEventListener("click", () => {
    registerBtn.classList.add("active");
    loginBtn.classList.remove("active");

    loginForm.classList.remove("active");
    setTimeout(() => {
      registerForm.classList.add("active");
    }, 50);
  });

  // Show/Hide password
  const passwordToggles = document.querySelectorAll(".toggle-password");
  passwordToggles.forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      const input = toggle.parentElement.querySelector("input");

      if (input.type === "password") {
        input.type = "text";
        toggle.textContent = "Hide";
      } else {
        input.type = "password";
        toggle.textContent = "Show";
      }
    });
  });

  // ================= SIGNUP =================
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fname = document.getElementById("reg-fname").value;
    const lname = document.getElementById("reg-lname").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;

    try {
      const response = await fetch("http://localhost:5001/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: fname,
          lastName: lname,
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful! Please login.");
        loginBtn.click();
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("Server error during signup");
    }
  });

  // ================= LOGIN =================
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    const msgEl = document.getElementById("login-message");

    try {
      if (msgEl) {
        msgEl.textContent = "Logging in...";
        msgEl.style.color = "inherit";
      }

      const response = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (msgEl) {
          msgEl.textContent = "✅ Login successful! Redirecting...";
          msgEl.style.color = "green";
        }

        // Save JWT token
        localStorage.setItem("token", data.token);

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = "/dashboard.html";
        }, 1500);
      } else {
        if (msgEl) {
          msgEl.textContent = "❌ " + (data.message || "Login failed");
          msgEl.style.color = "red";
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      if (msgEl) {
        msgEl.textContent = "❌ Server error during login";
        msgEl.style.color = "red";
      }
    }
  });
});