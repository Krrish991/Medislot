// ============================================
// NAVIGATION SCROLL EFFECT
// ============================================
const nav = document.getElementById('nav');
const mobileMenuButton = document.querySelector('.mobile-menu-btn');

mobileMenuButton?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('mobile-open');
  mobileMenuButton.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('mobile-open');
    mobileMenuButton?.setAttribute('aria-expanded', 'false');
  });
});

window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// ============================================
// SCROLL REVEAL ANIMATION
// ============================================
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

// ============================================
// FAQ ACCORDION
// ============================================
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
  const question = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');
  
  question.addEventListener('click', () => {
    const isActive = item.classList.contains('active');
    
    // Close all
    faqItems.forEach(i => {
      i.classList.remove('active');
      i.querySelector('.faq-answer').style.maxHeight = '0';
    });
    
    // Open clicked if it wasn't active
    if (!isActive) {
      item.classList.add('active');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

// ============================================
// SMOOTH SCROLL FOR NAV LINKS
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const offset = 80;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ============================================
// COUNTER ANIMATION FOR STATS
// ============================================
const animateCounter = (element, target, duration = 2000) => {
  const start = 0;
  const startTime = performance.now();
  
  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * easeOut);
    
    if (target >= 1000) {
      element.textContent = (current / 1000).toFixed(current >= 1000 ? 0 : 1) + 'K+';
    } else {
      element.textContent = current + '+';
    }
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      // Restore original text
      element.textContent = element.dataset.original;
    }
  };
  
  requestAnimationFrame(update);
};

// ============================================
// PARALLAX EFFECT ON HERO FLOATING CARDS
// ============================================
const heroVisual = document.querySelector('.hero-visual');
if (heroVisual && window.innerWidth > 768) {
  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    
    const cards = document.querySelectorAll('.floating-card');
    cards.forEach((card, index) => {
      const factor = (index + 1) * 0.5;
      card.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
    });
  });
}

// ============================================
// BOOKING TIME SELECTION
// ============================================
document.querySelectorAll('.booking-time').forEach(time => {
  time.addEventListener('click', function() {
    document.querySelectorAll('.booking-time').forEach(t => t.classList.remove('selected'));
    this.classList.add('selected');
  });
});

// ============================================
// BOOKING CALENDAR DAY SELECTION
// ============================================
document.querySelectorAll('.booking-cal-day:not(.disabled)').forEach(day => {
  day.addEventListener('click', function() {
    document.querySelectorAll('.booking-cal-day').forEach(d => d.classList.remove('selected'));
    this.classList.add('selected');
  });
});

document.querySelectorAll('[data-register]').forEach(control => {
  control.addEventListener('click', () => {
    window.location.href = 'register.html';
  });
});

// Browsing and booking are protected actions. Send visitors through the
// existing sign-in page before they can access patient-only functionality.
document.querySelectorAll('.doctor-book-btn, .booking-confirm-btn').forEach(control => {
  control.addEventListener('click', () => {
    window.location.href = 'login.html';
  });
});

// ============================================
// INITIALIZE
// ============================================
console.log('🏥 Medislot Landing Page Loaded');
