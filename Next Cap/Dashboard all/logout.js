function logout() {
    if (confirm("Are you sure you want to log out?")) {
        // Clear specific key
        localStorage.removeItem('nextcap_user_email');
        // Clear all just in case
        localStorage.clear();
        sessionStorage.clear();

        // Force redirect
        window.location.href = '../Login page/nextcap_login.html';
    }
}
