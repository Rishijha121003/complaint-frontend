(function () {
    // Check if the user is authenticated by looking for their email in session storage
    if (!sessionStorage.getItem("userEmail")) {
        // Not authenticated, redirect to login
        window.location.href = "login-v2.html";
    }
})();
