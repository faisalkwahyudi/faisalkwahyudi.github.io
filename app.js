// ============================================
// APP.JS - Interactive Features & Mobile Menu
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeMobileMenu();
    initializeNavigation();
    initializeBackToTop();
    initializeIntersectionObserver();
    initializeActiveSection();
});

// ============================================
// MOBILE MENU TOGGLE
// ============================================
function initializeMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const navItems = document.querySelectorAll('.bottom-nav .nav-item, .desk-nav-item');

    if (!menuToggle) return;

    // Toggle menu
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        sidebar.classList.toggle('active');
    });

    // Close menu when clicking nav items
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            sidebar.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            menuToggle.classList.remove('active');
            sidebar.classList.remove('active');
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            menuToggle.classList.remove('active');
            sidebar.classList.remove('active');
        }
    });
}

// ============================================
// SMOOTH NAVIGATION & ANCHOR LINKS
// ============================================
function initializeNavigation() {
    const navLinks = document.querySelectorAll('a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            // Don't prevent default if it's just "#"
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = document.querySelector('.mobile-header')?.offsetHeight || 0;
                const offset = target.offsetTop - headerHeight;

                window.scrollTo({
                    top: offset,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// BACK TO TOP BUTTON
// ============================================
function initializeBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ============================================
// ACTIVE SECTION TRACKING
// ============================================
function initializeActiveSection() {
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-item, .desk-nav-item');

    const options = {
        threshold: [0.1, 0.5],
        rootMargin: '-100px 0px -66% 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                updateActiveNav(id);
            }
        });
    }, options);

    sections.forEach(section => observer.observe(section));
}

function updateActiveNav(sectionId) {
    const navItems = document.querySelectorAll('.nav-item, .desk-nav-item');

    navItems.forEach(item => {
        item.classList.remove('active');
        const href = item.getAttribute('href');
        if (href === `#${sectionId}`) {
            item.classList.add('active');
        }
    });
}

// ============================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ============================================
function initializeIntersectionObserver() {
    const cards = document.querySelectorAll('.card');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'slideUp 0.6s ease-out';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    cards.forEach(card => observer.observe(card));
}

// ============================================
// LAZY LOAD IMAGES
// ============================================
function lazyLoadImages() {
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
}

// ============================================
// DETAIL EXPAND/COLLAPSE HANDLERS
// ============================================
function setupDetailHandlers() {
    document.querySelectorAll('.read-details').forEach(details => {
        const summary = details.querySelector('summary');
        if (!summary) return;

        const closedText = summary.textContent.trim() || 'Baca detail';
        const openText = 'Tutup';

        const updateText = () => {
            summary.textContent = details.open ? openText : closedText;
        };

        updateText();
        details.addEventListener('toggle', updateText);
    });
}

// ============================================
// RESPONSIVE VIEWPORT HANDLING
// ============================================
let lastKnownScrollPosition = 0;
let isScrolling = false;

window.addEventListener('scroll', () => {
    lastKnownScrollPosition = window.scrollY;
    
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            updateHeaderVisibility();
            isScrolling = false;
        });
        isScrolling = true;
    }
});

function updateHeaderVisibility() {
    const header = document.querySelector('.mobile-header');
    if (!header) return;

    if (lastKnownScrollPosition > 200) {
        header.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
    } else {
        header.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.08)';
    }
}

// ============================================
// HANDLE WINDOW RESIZE FOR RESPONSIVE
// ============================================
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        handleResponsiveChanges();
    }, 250);
});

function handleResponsiveChanges() {
    const width = window.innerWidth;
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.getElementById('menuToggle');

    // Close mobile menu when resizing to desktop
    if (width > 767 && sidebar && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        if (menuToggle) {
            menuToggle.classList.remove('active');
        }
    }
}

// ============================================
// TOUCH SUPPORT FOR MOBILE
// ============================================
let touchStartX = 0;
let touchEndX = 0;

function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
        // Swiped left - close menu
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.querySelector('.sidebar');
        if (menuToggle && sidebar) {
            menuToggle.classList.remove('active');
            sidebar.classList.remove('active');
        }
    }
    if (touchEndX > touchStartX + 50) {
        // Swiped right - open menu (only if not already open)
        if (window.innerWidth <= 767) {
            const menuToggle = document.getElementById('menuToggle');
            const sidebar = document.querySelector('.sidebar');
            if (menuToggle && sidebar && !sidebar.classList.contains('active')) {
                menuToggle.classList.add('active');
                sidebar.classList.add('active');
            }
        }
    }
}

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

// ============================================
// KEYBOARD NAVIGATION SUPPORT
// ============================================
document.addEventListener('keydown', (e) => {
    // Tab navigation
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
});

// ============================================
// PERFORMANCE OPTIMIZATION
// ============================================
// Debounce function for multiple event listeners
function debounce(func, wait) {
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

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================
// Add focus visible styles
document.addEventListener('focusin', (e) => {
    if (e.target.matches('a, button, input, select, textarea')) {
        e.target.style.outline = '2px solid #2980b9';
        e.target.style.outlineOffset = '2px';
    }
});

document.addEventListener('focusout', (e) => {
    if (e.target.matches('a, button, input, select, textarea')) {
        e.target.style.outline = '';
        e.target.style.outlineOffset = '';
    }
});

// ============================================
// INITIALIZATION
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupDetailHandlers();
        lazyLoadImages();
    });
} else {
    setupDetailHandlers();
    lazyLoadImages();
}

// Log initialization
console.log('✓ Interactive features loaded');
