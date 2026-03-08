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
