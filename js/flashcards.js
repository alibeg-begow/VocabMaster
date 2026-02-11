/**
 * @fileoverview Flashcard carousel with category tabs, flip animation, and learned toggle
 */

const Flashcards = (() => {
  let allWords = [];
  let displayWords = [];
  let currentIndex = 0;
  let isFlipped = false;
  let selectedCategory = 'all';
  let categories = [];

  /**
   * Render the flashcards view
   * @param {HTMLElement} container
   */
  async function render(container) {
    allWords = await StorageManager.getAllWords();
    categories = [...new Set(allWords.map(w => w.category).filter(Boolean))].sort();

    if (allWords.length === 0) {
      container.innerHTML = `
        <div class="empty-state-full fade-in">
          <div class="empty-icon">🃏</div>
          <h2>No Flashcards Yet</h2>
          <p>Upload some vocabulary words first to start learning with flashcards.</p>
          <a href="#/upload" class="btn btn-primary">📤 Upload Words</a>
        </div>
      `;
      return;
    }

    filterByCategory();

    container.innerHTML = `
      <div class="flashcards-section fade-in">
        <div class="flashcard-header">
          <h2>🃏 Flashcards</h2>
          <div class="category-tabs" id="flashcard-category-tabs">
            <button class="tab-btn ${selectedCategory === 'all' ? 'tab-active' : ''}" data-cat="all">
              All (${allWords.length})
            </button>
            ${categories.map(cat => {
              const count = allWords.filter(w => w.category === cat).length;
              return `<button class="tab-btn ${selectedCategory === cat ? 'tab-active' : ''}" 
                              data-cat="${escapeHtml(cat)}">${escapeHtml(cat)} (${count})</button>`;
            }).join('')}
          </div>
        </div>

        <div class="flashcard-progress" id="flashcard-progress"></div>
        <div class="category-progress" id="category-progress"></div>

        <div class="flashcard-stage">
          <button class="nav-btn nav-prev" id="fc-prev" title="Previous (←)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div class="flashcard-container" id="flashcard-container">
            <div class="flashcard" id="flashcard">
              <div class="flashcard-inner" id="flashcard-inner">
                <div class="flashcard-front" id="fc-front"></div>
                <div class="flashcard-back" id="fc-back"></div>
              </div>
            </div>
          </div>

          <button class="nav-btn nav-next" id="fc-next" title="Next (→)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        <div class="flashcard-controls">
          <div class="learned-toggle-wrapper" id="learned-toggle-wrapper"></div>
        </div>

        <div class="flashcard-hint">
          <kbd>←</kbd> Previous &nbsp; <kbd>→</kbd> Next &nbsp; <kbd>Space</kbd> Flip Card
        </div>
      </div>
    `;

    bindEvents(container);
    renderCard();
    updateProgress();
  }

  /**
   * Filter words by selected category
   */
  function filterByCategory() {
    if (selectedCategory === 'all') {
      displayWords = [...allWords];
    } else {
      displayWords = allWords.filter(w => w.category === selectedCategory);
    }
    currentIndex = 0;
    isFlipped = false;
  }

  /**
   * Bind events
   * @param {HTMLElement} container
   */
  function bindEvents(container) {
    // Category tabs
    container.querySelector('#flashcard-category-tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      selectedCategory = btn.dataset.cat;
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-active'));
      btn.classList.add('tab-active');
      filterByCategory();
      renderCard();
      updateProgress();
    });

    // Navigation
    container.querySelector('#fc-prev').addEventListener('click', prevCard);
    container.querySelector('#fc-next').addEventListener('click', nextCard);

    // Flip
    container.querySelector('#flashcard').addEventListener('click', flipCard);

    // Keyboard
    document.addEventListener('keydown', handleKeyboard);
  }

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} e
   */
  function handleKeyboard(e) {
    // Only handle if flashcards view is active
    if (!document.querySelector('.flashcards-section')) {
      document.removeEventListener('keydown', handleKeyboard);
      return;
    }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowLeft') { e.preventDefault(); prevCard(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); nextCard(); }
    else if (e.key === ' ') { e.preventDefault(); flipCard(); }
  }

  /** Go to previous card */
  function prevCard() {
    if (displayWords.length === 0) return;
    isFlipped = false;
    currentIndex = (currentIndex - 1 + displayWords.length) % displayWords.length;
    renderCard();
    updateProgress();
  }

  /** Go to next card */
  function nextCard() {
    if (displayWords.length === 0) return;
    isFlipped = false;
    currentIndex = (currentIndex + 1) % displayWords.length;
    renderCard();
    updateProgress();
  }

  /** Flip the current card */
  function flipCard() {
    isFlipped = !isFlipped;
    const inner = document.getElementById('flashcard-inner');
    if (inner) {
      inner.classList.toggle('flipped', isFlipped);
    }
  }

  /**
   * Render the current flashcard content
   */
  function renderCard() {
    if (displayWords.length === 0) {
      const front = document.getElementById('fc-front');
      const back = document.getElementById('fc-back');
      if (front) front.innerHTML = '<div class="fc-empty">No words in this category.</div>';
      if (back) back.innerHTML = '';
      return;
    }

    const word = displayWords[currentIndex];
    const inner = document.getElementById('flashcard-inner');
    const flashcard = document.getElementById('flashcard');

    if (inner) inner.classList.remove('flipped');
    isFlipped = false;

    // Front
    const front = document.getElementById('fc-front');
    if (front) {
      front.innerHTML = `
        <div class="fc-word">${escapeHtml(word.word)}</div>
        <div class="fc-transcription">${escapeHtml(word.transcription)}</div>
        <div class="fc-flip-hint">Click to flip</div>
      `;
    }

    // Back
    const back = document.getElementById('fc-back');
    if (back) {
      back.innerHTML = `
        <div class="fc-translation">${escapeHtml(word.translation)}</div>
        <span class="category-badge fc-category">${escapeHtml(word.category || 'Other')}</span>
        <div class="fc-sentences">
          ${(word.sentences || []).map((s, i) => `<div class="fc-sentence">${i + 1}. ${escapeHtml(s)}</div>`).join('')}
        </div>
      `;
    }

    // Learned status - card border
    if (flashcard) {
      flashcard.classList.toggle('card-learned', !!word.learned);
    }

    // Learned toggle
    const toggleWrapper = document.getElementById('learned-toggle-wrapper');
    if (toggleWrapper) {
      toggleWrapper.innerHTML = `
        <label class="learned-toggle">
          <input type="checkbox" id="learned-checkbox" ${word.learned ? 'checked' : ''}>
          <span class="toggle-slider"></span>
          <span class="toggle-label">${word.learned ? '✅ Learned' : 'Mark as learned'}</span>
        </label>
      `;
      toggleWrapper.querySelector('#learned-checkbox').addEventListener('change', async (e) => {
        const learned = e.target.checked;
        await StorageManager.setLearned(word.id, learned);
        word.learned = learned;
        // Update in allWords too
        const aw = allWords.find(w => w.id === word.id);
        if (aw) aw.learned = learned;
        
        const flashcard = document.getElementById('flashcard');
        if (flashcard) flashcard.classList.toggle('card-learned', learned);
        
        const label = toggleWrapper.querySelector('.toggle-label');
        if (label) label.textContent = learned ? '✅ Learned' : 'Mark as learned';

        showToast(learned ? 'Word marked as learned!' : 'Word unmarked.', learned ? 'success' : 'info');
        updateProgress();
        if (typeof App !== 'undefined') App.updateWordCount();
      });
    }
  }

  /**
   * Update progress indicators
   */
  function updateProgress() {
    // Card progress
    const progEl = document.getElementById('flashcard-progress');
    if (progEl && displayWords.length > 0) {
      const pct = ((currentIndex + 1) / displayWords.length * 100).toFixed(0);
      progEl.innerHTML = `
        <div class="progress-text">Card ${currentIndex + 1} of ${displayWords.length}</div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${pct}%"></div>
        </div>
      `;
    } else if (progEl) {
      progEl.innerHTML = '';
    }

    // Category progress
    const catProgEl = document.getElementById('category-progress');
    if (catProgEl) {
      const catWords = selectedCategory === 'all' ? allWords : allWords.filter(w => w.category === selectedCategory);
      const learnedCount = catWords.filter(w => w.learned).length;
      const catName = selectedCategory === 'all' ? 'All Words' : selectedCategory;
      catProgEl.innerHTML = `
        <span class="cat-progress-text">Category: ${escapeHtml(catName)} — ${learnedCount}/${catWords.length} learned</span>
      `;
    }
  }

  /**
   * Cleanup when leaving flashcards view
   */
  function cleanup() {
    document.removeEventListener('keydown', handleKeyboard);
  }

  return { render, cleanup };
})();
