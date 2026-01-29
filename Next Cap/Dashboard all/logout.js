function logout() {
    if (confirm("Are you sure you want to log out?")) {
        localStorage.removeItem('nextcap_user_email');
        window.location.href = '../Login page/nextcap_login.html';
    }
}
