(function () {
  // Get current page filename
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // For service sub-pages, highlight "Services" nav link
  var activeNavPage = currentPage;
  if (currentPage.startsWith('service-')) {
    activeNavPage = 'services.html';
  }

  // Highlight the active nav link
  document.querySelectorAll('[data-page]').forEach(function (link) {
    var page = link.getAttribute('data-page');
    if (page === activeNavPage) {
      link.classList.add('!text-[#c8102e]', '!border-[#c8102e]');
      link.classList.remove('text-[#475569]');
    }
  });

  // Mobile menu toggle
  var menuBtn = document.getElementById('mobile-menu-btn');
  var mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () {
      mobileMenu.classList.toggle('hidden');
    });
    // Close menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        mobileMenu.classList.add('hidden');
      });
    });
  }

  // Sticky header shadow on scroll
  var header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        header.classList.add('shadow-lg');
      } else {
        header.classList.remove('shadow-lg');
      }
    }, { passive: true });
  }

  // Unified scroll reveal for .reveal and .reveal-on-scroll elements
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('active', 'visible', 'is-visible');
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal, .reveal-on-scroll').forEach(function (el) {
    revealObserver.observe(el);
  });

  // Form input micro-interactions
  document.querySelectorAll('input, textarea, select').forEach(function(el) {
    el.addEventListener('focus', function() {
      var label = el.parentElement.querySelector('label');
      if (label) label.style.color = '#c8102e';
    });
    el.addEventListener('blur', function() {
      var label = el.parentElement.querySelector('label');
      if (label) label.style.color = '';
    });
  });


})();
