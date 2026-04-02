(function () {
    // Check if the user is authenticated by looking for their jwt token in session storage
    if (!sessionStorage.getItem("email")) {
        // Not authenticated, redirect to login
        window.location.href = "login-v2.html";
    }
})();
