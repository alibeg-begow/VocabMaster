/**
 * @fileoverview Main app initialization, hash-based routing, navigation, theme toggle
 */

const App = (() => {
  let currentView = '';
  let sidebarOpen = false;

  /**
   * Initialize the application
   */
  async function init() {
    // Initialize IndexedDB
    await StorageManager.openDB();

    // Load theme preference
    const savedTheme = localStorage.getItem('vocabmaster-theme') || 'light';
    setTheme(savedTheme);

    // Bind global events
    bindNavigation();
    bindThemeToggle();
    bindKeyboardShortcuts();
    bindSidebar();

    // Update word count
    await updateWordCount();

    // Route to current hash
    handleRoute();

    // Listen for hash changes
    window.addEventListener('hashchange', handleRoute);
  }

  /**
   * Handle hash-based routing
   */
  function handleRoute() {
    const hash = window.location.hash || '#/table';
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // Cleanup previous view
    if (currentView === 'flashcards') Flashcards.cleanup();
    if (currentView === 'test') TestEngine.cleanup();

    // Parse route
    const route = hash.split('/')[1] || 'table';
    currentView = route;

    // Update active nav
    updateActiveNav(route);

    // Close sidebar on mobile
    closeSidebar();

    // Route
    switch (route) {
      case 'table':
        LearningPanel.render(mainContent);
        break;
      case 'flashcards':
        Flashcards.render(mainContent);
        break;
      case 'upload':
        ExcelParser.renderUploadUI(mainContent);
        break;
      case 'test':
        TestEngine.render(mainContent);
        break;
      case 'dashboard':
        UserDashboard.render(mainContent);
        break;
      default:
        LearningPanel.render(mainContent);
        break;
    }
  }

  /**
   * Update active navigation items
   * @param {string} route
   */
  function updateActiveNav(route) {
    // Sidebar nav
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.route === route);
    });
    // Top nav
    document.querySelectorAll('.top-nav-link').forEach(link => {
      const linkRoute = link.dataset.route || '';
      // "Learning Panel" covers table, flashcards, upload
      if (linkRoute === 'learning') {
        link.classList.toggle('active', ['table', 'flashcards', 'upload'].includes(route));
      } else {
        link.classList.toggle('active', linkRoute === route);
      }
    });
  }

  /**
   * Bind navigation links
   */
  function bindNavigation() {
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const target = el.dataset.nav;
        window.location.hash = `#/${target}`;
      });
    });
  }

  /**
   * Bind theme toggle
   */
  function bindThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      setTheme(next);
      localStorage.setItem('vocabmaster-theme', next);
    });
  }

  /**
   * Set the theme
   * @param {string} theme - 'light' or 'dark'
   */
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
  }

  /**
   * Bind keyboard shortcuts
   */
  function bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only when not in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if (e.altKey && e.key === 'u') {
        e.preventDefault();
        window.location.hash = '#/upload';
      } else if (e.altKey && e.key === 't') {
        e.preventDefault();
        window.location.hash = '#/test';
      } else if (e.altKey && e.key === 'd') {
        e.preventDefault();
        window.location.hash = '#/dashboard';
      }
    });
  }

  /**
   * Bind sidebar toggle (mobile)
   */
  function bindSidebar() {
    const hamburger = document.getElementById('hamburger-btn');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (hamburger) {
      hamburger.addEventListener('click', toggleSidebar);
    }
    if (overlay) {
      overlay.addEventListener('click', closeSidebar);
    }
  }

  /** Toggle sidebar */
  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    document.getElementById('sidebar')?.classList.toggle('sidebar-open', sidebarOpen);
    document.getElementById('sidebar-overlay')?.classList.toggle('visible', sidebarOpen);
  }

  /** Close sidebar */
  function closeSidebar() {
    sidebarOpen = false;
    document.getElementById('sidebar')?.classList.remove('sidebar-open');
    document.getElementById('sidebar-overlay')?.classList.remove('visible');
  }

  /**
   * Update the word count badge in the header
   */
  async function updateWordCount() {
    try {
      const count = await StorageManager.getWordCount();
      const badge = document.getElementById('word-count-badge');
      if (badge) {
        badge.textContent = count;
        badge.title = `${count} words`;
      }
    } catch (e) {
      console.error('Failed to update word count:', e);
    }
  }

  return { init, updateWordCount, handleRoute };
})();

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init().catch(err => {
    console.error('Failed to initialize app:', err);
  });
});
