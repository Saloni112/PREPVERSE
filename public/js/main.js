// Navbar scroll effect
window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar-custom');
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Animate feature cards on scroll
const featureCards = document.querySelectorAll('.feature-card');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = entry.target.getAttribute('data-delay') || 0;
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
});

featureCards.forEach(card => {
  observer.observe(card);
});

// Search functionality
const searchIcon = document.querySelector('.search-icon');
const searchInput = document.getElementById('mainSearch');

if (searchIcon && searchInput) {
  searchIcon.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch();
    }
  });
}

function performSearch() {
  const searchTerm = searchInput.value.trim();
  if (searchTerm !== '') {
    console.log('Searching for:', searchTerm);
    alert('Search functionality would show results for: ' + searchTerm);
  }
}

// Loading animation control
window.addEventListener('load', function() {
  setTimeout(function() {
    const loadingAnimation = document.getElementById('loading-animation');
    if (loadingAnimation) {
      loadingAnimation.style.opacity = '0';
      setTimeout(function() {
        loadingAnimation.remove();
      }, 500);
    }
  }, 1500);
});