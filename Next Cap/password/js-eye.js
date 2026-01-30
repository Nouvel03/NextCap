const passwordInput = document.getElementById("code");
const toggleButton = document.querySelector(".toggle-password");
const toggleIcon = toggleButton.querySelector("img");

toggleButton.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";

    passwordInput.type = isPassword ? "text" : "password";
    toggleIcon.src = isPassword
        ? "images/eye-alt-svgrepo-com.svg"
        : "images/eye-slash-svgrepo-com.svg";
});
