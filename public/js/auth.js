// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  // Handle login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      console.log('Login form submitted');
      alert('Login functionality would be implemented here');

      // Optional redirect after login success
      // window.location.href = '/'; 
    });
  }

  // Handle signup form submission
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      console.log('Signup form submitted');
      alert('Signup functionality would be implemented here');

      // Optional redirect to login page
      // window.location.href = '/login'; 
    });
  }

  // Handle loading animation fade-out
  setTimeout(function () {
    const loadingAnimation = document.getElementById('loading-animation');
    if (loadingAnimation) {
      loadingAnimation.style.opacity = '0';
      setTimeout(function () {
        loadingAnimation.remove();
      }, 500);
    }
  }, 1500);
});
