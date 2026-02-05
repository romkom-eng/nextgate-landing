// ============================================
//  NextGate Landing Page - JavaScript
// ============================================

// ========== Navbar Scroll Effect ==========
window.addEventListener('scroll', function () {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ========== Smooth Scroll for Navigation Links ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const navbarHeight = document.getElementById('navbar').offsetHeight;
            const targetPosition = targetElement.offsetTop - navbarHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ========== Mobile Menu Toggle ==========
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', function () {
        navLinks.classList.toggle('active');
        this.classList.toggle('active');
    });
}

// ========== Animate on Scroll (AOS) Implementation ==========
class AnimateOnScroll {
    constructor() {
        this.items = document.querySelectorAll('[data-aos]');
        this.init();
    }

    init() {
        this.observeElements();
        // Initial check for elements already in view
        this.checkElements();
    }

    observeElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });

        this.items.forEach(item => {
            observer.observe(item);
        });
    }

    checkElements() {
        this.items.forEach(item => {
            const rect = item.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            if (rect.top < windowHeight - 100) {
                item.classList.add('aos-animate');
            }
        });
    }
}

// Initialize AOS when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    new AnimateOnScroll();
});

// ========== Contact Form Handling ==========
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    // Show/hide other category field
    const productCategorySelect = document.getElementById('productCategory');
    const otherCategoryGroup = document.getElementById('otherCategoryGroup');
    const otherCategoryInput = document.getElementById('otherCategory');

    if (productCategorySelect && otherCategoryGroup) {
        productCategorySelect.addEventListener('change', function () {
            if (this.value === 'other') {
                otherCategoryGroup.style.display = 'block';
                otherCategoryInput.required = true;
            } else {
                otherCategoryGroup.style.display = 'none';
                otherCategoryInput.required = false;
                otherCategoryInput.value = '';
            }
        });
    }

    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Get form data
        const formData = {
            companyName: document.getElementById('companyName').value,
            contactName: document.getElementById('contactName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            productCategory: document.getElementById('productCategory').value,
            otherCategory: document.getElementById('otherCategory').value || '',
            message: document.getElementById('message').value
        };

        // Show loading state
        const submitButton = e.target.querySelector('.submit-button');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<span>전송 중...</span>';
        submitButton.disabled = true;

        // Simulate form submission (replace with actual API call)
        setTimeout(() => {
            // Show success message
            alert('문의가 성공적으로 접수되었습니다! 24시간 내에 연락드리겠습니다.');

            // Reset form
            contactForm.reset();
            otherCategoryGroup.style.display = 'none';
            otherCategoryInput.required = false;

            // Restore button
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;

            // Log form data (for demonstration)
            console.log('Form submitted:', formData);
        }, 1500);
    });
}

// ========== Number Counter Animation for Stats ==========
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// ========== Parallax Effect for Hero Background ==========
window.addEventListener('scroll', function () {
    const heroBackground = document.querySelector('.hero-background');
    if (heroBackground) {
        const scrolled = window.scrollY;
        const parallaxSpeed = 0.5;
        heroBackground.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
    }
});

// ========== Add active class to navigation on scroll ==========
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-links a[href^="#"]');

window.addEventListener('scroll', () => {
    let current = '';
    const scrollY = window.scrollY;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${current}`) {
            item.classList.add('active');
        }
    });
});

// ========== Debounce Function for Performance ==========
function debounce(func, wait = 10) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to scroll events
const debouncedScroll = debounce(() => {
    // Scroll-based animations can go here
}, 10);

window.addEventListener('scroll', debouncedScroll);

// ========== Add Loading Animation ==========
window.addEventListener('load', function () {
    document.body.classList.add('loaded');
});

// ========== Easter Egg: Console Message ==========
console.log('%cNextGate 🚀', 'color: #ff6b35; font-size: 24px; font-weight: bold;');
console.log('%c사장님은 제품만 하세요, 미국 시장은 저희가 전부 하겠습니다.', 'color: #1a2332; font-size: 14px;');
console.log('%cDeveloped with ❤️ for Korean manufacturers', 'color: #666; font-size: 12px;');

// ========== Intersection Observer for Lazy Loading Images ==========
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ========== Add Hover Effects to Cards ==========
const cards = document.querySelectorAll('.problem-card, .step-card, .feature-card, .trust-card');

cards.forEach(card => {
    card.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });

    card.addEventListener('mouseleave', function () {
        this.style.transform = '';
    });
});

// ========== Dynamic Copyright Year ==========
const currentYear = new Date().getFullYear();
const copyrightElements = document.querySelectorAll('.footer-bottom p');
copyrightElements.forEach(el => {
    el.textContent = el.textContent.replace('2025', currentYear);
});

// ========== Track User Engagement (Optional Analytics) ==========
function trackEvent(category, action, label) {
    // Placeholder for analytics tracking
    console.log('Event tracked:', { category, action, label });

    // Example: Google Analytics 4
    // if (typeof gtag !== 'undefined') {
    //     gtag('event', action, {
    //         'event_category': category,
    //         'event_label': label
    //     });
    // }
}

// Track CTA button clicks
document.querySelectorAll('.cta-button, .submit-button').forEach(button => {
    button.addEventListener('click', function (e) {
        const buttonText = this.textContent.trim();
        trackEvent('Engagement', 'CTA Click', buttonText);
    });
});

// ========== Add Visual Feedback for Form Inputs ==========
const formInputs = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');

formInputs.forEach(input => {
    input.addEventListener('focus', function () {
        this.parentElement.classList.add('focused');
    });

    input.addEventListener('blur', function () {
        this.parentElement.classList.remove('focused');
        if (this.value) {
            this.parentElement.classList.add('filled');
        } else {
            this.parentElement.classList.remove('filled');
        }
    });
});

// ========== PWA Support (Optional) ==========
if ('serviceWorker' in navigator) {
    // Uncomment to enable service worker
    // window.addEventListener('load', () => {
    //     navigator.serviceWorker.register('/sw.js')
    //         .then(registration => console.log('SW registered:', registration))
    //         .catch(error => console.log('SW registration failed:', error));
    // });
}
