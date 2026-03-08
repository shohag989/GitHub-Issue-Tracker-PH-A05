function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (username === "admin" && password === "admin123") {
    localStorage.setItem("isLoggedIn", "true");
    window.location.href = "main.html";
  } else {
    alert("Invalid credentials. Please use admin/admin123");
  }
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById("password");
  const toggleIcon = document.getElementById("passwordToggleIcon");
  const toggleButton = document.getElementById("passwordToggleButton");

  if (!passwordInput || !toggleIcon || !toggleButton) return;

  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";

  // Update icon and aria-label
  if (isHidden) {
    toggleIcon.className = "fa-regular fa-eye-slash text-[18px]";
    toggleButton.setAttribute("aria-label", "Hide password");
  } else {
    toggleIcon.className = "fa-regular fa-eye text-[18px]";
    toggleButton.setAttribute("aria-label", "Show password");
  }
}
