/**
 * @fileoverview Word table with advanced filtering, sorting, and pagination
 */

const LearningPanel = (() => {
  /** State */
  let allWords = [];
  let filteredWords = [];
  let currentPage = 1;
  let itemsPerPage = APP_CONSTANTS.DEFAULT_ITEMS_PER_PAGE;
  let expandedRowId = null;
  const togglingSet = new Set(); // Guard against rapid double-click on toggle

  /** Filter state */
  let filters = {
    search: '',
    categories: [],
    learnedStatus: 'all', // 'all' | 'learned' | 'not-learned'
    sortBy: 'az-en',
    minLength: 0,
    maxLength: 100,
  };

  /**
   * Render the word table panel
   * @param {HTMLElement} container
   */
  async function render(container) {
    allWords = await StorageManager.getAllWords();
    const categories = [...new Set(allWords.map(w => w.category).filter(Boolean))].sort();

    container.innerHTML = `
      <div class="word-table-section fade-in">
        <div class="table-toolbar">
          <div class="toolbar-row">
            <div class="search-box">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" id="word-search" placeholder="Search words, transcription, translation..." 
                     value="${escapeHtml(filters.search)}">
            </div>
            <div class="toolbar-compact">
              <select id="sort-select" class="toolbar-select">
                <option value="az-en" ${filters.sortBy === 'az-en' ? 'selected' : ''}>A → Z (English)</option>
                <option value="za-en" ${filters.sortBy === 'za-en' ? 'selected' : ''}>Z → A (English)</option>
                <option value="az-tm" ${filters.sortBy === 'az-tm' ? 'selected' : ''}>A → Z (Turkmen)</option>
                <option value="za-tm" ${filters.sortBy === 'za-tm' ? 'selected' : ''}>Z → A (Turkmen)</option>
                <option value="short-long" ${filters.sortBy === 'short-long' ? 'selected' : ''}>Shortest → Longest</option>
                <option value="long-short" ${filters.sortBy === 'long-short' ? 'selected' : ''}>Longest → Shortest</option>
                <option value="category" ${filters.sortBy === 'category' ? 'selected' : ''}>By Category</option>
                <option value="learned-first" ${filters.sortBy === 'learned-first' ? 'selected' : ''}>Learned First</option>
                <option value="not-learned-first" ${filters.sortBy === 'not-learned-first' ? 'selected' : ''}>Not Learned First</option>
                <option value="newest" ${filters.sortBy === 'newest' ? 'selected' : ''}>Recently Added</option>
                <option value="oldest" ${filters.sortBy === 'oldest' ? 'selected' : ''}>Oldest First</option>
              </select>
              <select id="learned-filter" class="toolbar-select">
                <option value="all" ${filters.learnedStatus === 'all' ? 'selected' : ''}>All Words</option>
                <option value="learned" ${filters.learnedStatus === 'learned' ? 'selected' : ''}>Learned Only</option>
                <option value="not-learned" ${filters.learnedStatus === 'not-learned' ? 'selected' : ''}>Not Learned Only</option>
              </select>
              <select id="items-per-page" class="toolbar-select">
                ${APP_CONSTANTS.ITEMS_PER_PAGE_OPTIONS.map(opt => 
                  `<option value="${opt}" ${itemsPerPage == opt ? 'selected' : ''}>${opt}</option>`
                ).join('')}
              </select>
            </div>
          </div>
          <div class="toolbar-row">
            <div class="category-filter">
              <label>Categories:</label>
              <div class="category-chips" id="category-chips">
                ${categories.map(cat => `
                  <button class="chip ${filters.categories.includes(cat) ? 'chip-active' : ''}" 
                          data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>
                `).join('')}
              </div>
            </div>
          </div>
          <div class="toolbar-row">
            <div class="length-filter">
              <label>Word Length:</label>
              <input type="number" id="min-length" class="length-input" placeholder="Min" 
                     min="0" max="100" value="${filters.minLength || ''}">
              <span>—</span>
              <input type="number" id="max-length" class="length-input" placeholder="Max" 
                     min="0" max="100" value="${filters.maxLength >= 100 ? '' : filters.maxLength}">
            </div>
            <div class="active-filters" id="active-filters"></div>
            <button class="btn btn-ghost" id="clear-all-filters">Clear All Filters</button>
          </div>
          <div class="toolbar-row toolbar-info">
            <span class="word-count" id="word-count-display">Showing 0 of 0 words</span>
            <div class="bulk-actions">
              <button class="btn btn-sm btn-secondary" id="mark-all-learned">Mark All as Learned</button>
              <button class="btn btn-sm btn-secondary" id="mark-all-not-learned">Mark All as Not Learned</button>
              <button class="btn btn-sm btn-accent" id="mark-filtered-learned">Mark Filtered as Learned</button>
            </div>
          </div>
        </div>

        <div class="table-container" id="word-table-container">
          <table class="word-table" id="word-table">
            <thead>
              <tr>
                <th class="th-num">#</th>
                <th>English Word</th>
                <th>Transcription</th>
                <th>Turkmen Translation</th>
                <th>Category</th>
                <th class="th-status">Status</th>
                <th class="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody id="word-table-body"></tbody>
          </table>
        </div>

        <div class="pagination" id="pagination"></div>
      </div>
    `;

    bindEvents(container);
    applyFiltersAndRender();
  }

  /**
   * Bind event listeners
   * @param {HTMLElement} container
   */
  function bindEvents(container) {
    // Search
    const searchInput = container.querySelector('#word-search');
    searchInput.addEventListener('input', debounce((e) => {
      filters.search = e.target.value;
      currentPage = 1;
      applyFiltersAndRender();
    }, 250));

    // Sort
    container.querySelector('#sort-select').addEventListener('change', (e) => {
      filters.sortBy = e.target.value;
      applyFiltersAndRender();
    });

    // Learned filter
    container.querySelector('#learned-filter').addEventListener('change', (e) => {
      filters.learnedStatus = e.target.value;
      currentPage = 1;
      applyFiltersAndRender();
    });

    // Items per page
    container.querySelector('#items-per-page').addEventListener('change', (e) => {
      itemsPerPage = e.target.value === 'All' ? 'All' : parseInt(e.target.value);
      currentPage = 1;
      applyFiltersAndRender();
    });

    // Category chips
    container.querySelector('#category-chips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const cat = chip.dataset.category;
      if (filters.categories.includes(cat)) {
        filters.categories = filters.categories.filter(c => c !== cat);
        chip.classList.remove('chip-active');
      } else {
        filters.categories.push(cat);
        chip.classList.add('chip-active');
      }
      currentPage = 1;
      applyFiltersAndRender();
    });

    // Length filter
    container.querySelector('#min-length').addEventListener('input', debounce((e) => {
      filters.minLength = parseInt(e.target.value) || 0;
      currentPage = 1;
      applyFiltersAndRender();
    }, 300));

    container.querySelector('#max-length').addEventListener('input', debounce((e) => {
      filters.maxLength = parseInt(e.target.value) || 100;
      currentPage = 1;
      applyFiltersAndRender();
    }, 300));

    // Clear all filters
    container.querySelector('#clear-all-filters').addEventListener('click', () => {
      filters = { search: '', categories: [], learnedStatus: 'all', sortBy: 'az-en', minLength: 0, maxLength: 100 };
      searchInput.value = '';
      container.querySelector('#sort-select').value = 'az-en';
      container.querySelector('#learned-filter').value = 'all';
      container.querySelector('#min-length').value = '';
      container.querySelector('#max-length').value = '';
      container.querySelectorAll('.chip').forEach(c => c.classList.remove('chip-active'));
      currentPage = 1;
      applyFiltersAndRender();
    });

    // Bulk actions
    container.querySelector('#mark-all-learned').addEventListener('click', async () => {
      if (!confirm(`Mark all ${allWords.length} words as learned?`)) return;
      const ids = allWords.map(w => w.id);
      await StorageManager.setMultipleLearned(ids, true);
      showToast('All words marked as learned!', 'success');
      allWords = await StorageManager.getAllWords();
      applyFiltersAndRender();
      if (typeof App !== 'undefined') App.updateWordCount();
    });

    container.querySelector('#mark-all-not-learned').addEventListener('click', async () => {
      if (!confirm(`Mark all ${allWords.length} words as not learned?`)) return;
      const ids = allWords.map(w => w.id);
      await StorageManager.setMultipleLearned(ids, false);
      showToast('All words marked as not learned.', 'info');
      allWords = await StorageManager.getAllWords();
      applyFiltersAndRender();
      if (typeof App !== 'undefined') App.updateWordCount();
    });

    container.querySelector('#mark-filtered-learned').addEventListener('click', async () => {
      if (!confirm(`Mark ${filteredWords.length} filtered words as learned?`)) return;
      const ids = filteredWords.map(w => w.id);
      await StorageManager.setMultipleLearned(ids, true);
      showToast(`${ids.length} filtered words marked as learned!`, 'success');
      allWords = await StorageManager.getAllWords();
      applyFiltersAndRender();
      if (typeof App !== 'undefined') App.updateWordCount();
    });
  }

  /**
   * Apply current filters, sort, and re-render the table
   */
  function applyFiltersAndRender() {
    let words = [...allWords];

    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      words = words.filter(w =>
        w.word.toLowerCase().includes(q) ||
        w.transcription.toLowerCase().includes(q) ||
        w.translation.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      words = words.filter(w => filters.categories.includes(w.category));
    }

    // Learned status filter
    if (filters.learnedStatus === 'learned') {
      words = words.filter(w => w.learned);
    } else if (filters.learnedStatus === 'not-learned') {
      words = words.filter(w => !w.learned);
    }

    // Word length filter
    if (filters.minLength > 0) {
      words = words.filter(w => w.word.length >= filters.minLength);
    }
    if (filters.maxLength < 100) {
      words = words.filter(w => w.word.length <= filters.maxLength);
    }

    // Sort
    words = sortWords(words, filters.sortBy);

    filteredWords = words;

    // Update count display
    const countEl = document.getElementById('word-count-display');
    if (countEl) {
      countEl.textContent = `Showing ${filteredWords.length} of ${allWords.length} words`;
    }

    // Update active filters display
    renderActiveFilters();

    // Paginate and render
    renderTable();
    renderPagination();
  }

  /**
   * Sort words by given criterion
   * @param {Object[]} words
   * @param {string} sortBy
   * @returns {Object[]}
   */
  function sortWords(words, sortBy) {
    const sorted = [...words];
    switch (sortBy) {
      case 'az-en': return sorted.sort((a, b) => a.word.localeCompare(b.word));
      case 'za-en': return sorted.sort((a, b) => b.word.localeCompare(a.word));
      case 'az-tm': return sorted.sort((a, b) => a.translation.localeCompare(b.translation));
      case 'za-tm': return sorted.sort((a, b) => b.translation.localeCompare(a.translation));
      case 'short-long': return sorted.sort((a, b) => a.word.length - b.word.length);
      case 'long-short': return sorted.sort((a, b) => b.word.length - a.word.length);
      case 'category': return sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
      case 'learned-first': return sorted.sort((a, b) => (b.learned ? 1 : 0) - (a.learned ? 1 : 0));
      case 'not-learned-first': return sorted.sort((a, b) => (a.learned ? 1 : 0) - (b.learned ? 1 : 0));
      case 'newest': return sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      case 'oldest': return sorted.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      default: return sorted;
    }
  }

  /**
   * Render the table body with current page of words
   */
  function renderTable() {
    const tbody = document.getElementById('word-table-body');
    if (!tbody) return;

    const start = itemsPerPage === 'All' ? 0 : (currentPage - 1) * itemsPerPage;
    const end = itemsPerPage === 'All' ? filteredWords.length : start + itemsPerPage;
    const pageWords = filteredWords.slice(start, end);

    if (pageWords.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="7" class="empty-table">
          ${allWords.length === 0 
            ? '<div class="empty-state"><p>📚 No words uploaded yet.</p><p>Go to <a href="#/upload">Upload Words</a> to get started!</p></div>'
            : '<div class="empty-state"><p>No words match your current filters.</p></div>'
          }
        </td></tr>
      `;
      return;
    }

    tbody.innerHTML = pageWords.map((word, idx) => {
      const globalIdx = start + idx + 1;
      const isExpanded = expandedRowId === word.id;
      return `
        <tr class="word-row ${word.learned ? 'row-learned' : ''} ${isExpanded ? 'row-expanded' : ''}" 
            data-id="${word.id}">
          <td class="td-num">${globalIdx}</td>
          <td class="td-word"><strong>${escapeHtml(word.word)}</strong></td>
          <td class="td-transcription">${escapeHtml(word.transcription)}</td>
          <td class="td-translation">${escapeHtml(word.translation)}</td>
          <td><span class="category-badge">${escapeHtml(word.category || 'Other')}</span></td>
          <td class="td-status">
            <button class="status-toggle ${word.learned ? 'learned' : ''}" 
                    data-id="${word.id}" title="${word.learned ? 'Learned' : 'Not learned'}">
              ${word.learned ? '✅' : '❌'}
            </button>
          </td>
          <td class="td-actions">
            <button class="btn-icon expand-btn" data-id="${word.id}" 
                    title="${isExpanded ? 'Collapse' : 'Show sentences'}">
              ${isExpanded ? '▲' : '▼'}
            </button>
          </td>
        </tr>
        ${isExpanded ? `
          <tr class="sentence-row">
            <td colspan="7">
              <div class="sentences-container">
                <h4>Example Sentences:</h4>
                ${(word.sentences || []).map((s, si) => `
                  <div class="sentence-bubble">${si + 1}. ${escapeHtml(s)}</div>
                `).join('')}
                ${(!word.sentences || word.sentences.length === 0) 
                  ? '<p class="no-sentences">No example sentences available.</p>' : ''}
              </div>
            </td>
          </tr>
        ` : ''}
      `;
    }).join('');

    // Bind row events
    tbody.querySelectorAll('.status-toggle').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        if (togglingSet.has(id)) return; // Prevent race condition on rapid clicks
        togglingSet.add(id);
        try {
          const newStatus = await StorageManager.toggleLearned(id);
          // Update local data
          const word = allWords.find(w => w.id === id);
          if (word) word.learned = newStatus;
          applyFiltersAndRender();
          showToast(newStatus ? 'Word marked as learned!' : 'Word marked as not learned.', 
                    newStatus ? 'success' : 'info');
          if (typeof App !== 'undefined') App.updateWordCount();
        } finally {
          togglingSet.delete(id);
        }
      });
    });

    tbody.querySelectorAll('.expand-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        expandedRowId = expandedRowId === id ? null : id;
        renderTable();
      });
    });

    // Click row to expand
    tbody.querySelectorAll('.word-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = parseInt(row.dataset.id);
        expandedRowId = expandedRowId === id ? null : id;
        renderTable();
      });
    });
  }

  /**
   * Render pagination controls
   */
  function renderPagination() {
    const paginationEl = document.getElementById('pagination');
    if (!paginationEl || itemsPerPage === 'All') {
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(filteredWords.length / itemsPerPage);
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    let html = '';
    html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>`;

    const maxBtns = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxBtns / 2));
    let endPage = Math.min(totalPages, startPage + maxBtns - 1);
    if (endPage - startPage < maxBtns - 1) startPage = Math.max(1, endPage - maxBtns + 1);

    if (startPage > 1) {
      html += `<button class="page-btn" data-page="1">1</button>`;
      if (startPage > 2) html += `<span class="page-ellipsis">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `<button class="page-btn ${i === currentPage ? 'page-active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += `<span class="page-ellipsis">...</span>`;
      html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>`;

    paginationEl.innerHTML = html;

    paginationEl.querySelectorAll('.page-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.dataset.page);
        renderTable();
        renderPagination();
        document.getElementById('word-table-container')?.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  /**
   * Render active filter tags
   */
  function renderActiveFilters() {
    const el = document.getElementById('active-filters');
    if (!el) return;

    const tags = [];
    if (filters.search) tags.push({ label: `Search: "${filters.search}"`, clear: () => { filters.search = ''; document.getElementById('word-search').value = ''; } });
    if (filters.categories.length > 0) {
      filters.categories.forEach(cat => {
        tags.push({ label: cat, clear: () => {
          filters.categories = filters.categories.filter(c => c !== cat);
          document.querySelector(`.chip[data-category="${cat}"]`)?.classList.remove('chip-active');
        }});
      });
    }
    if (filters.learnedStatus !== 'all') {
      tags.push({ label: filters.learnedStatus === 'learned' ? 'Learned' : 'Not Learned', clear: () => { filters.learnedStatus = 'all'; document.getElementById('learned-filter').value = 'all'; } });
    }
    if (filters.minLength > 0) tags.push({ label: `Min: ${filters.minLength} chars`, clear: () => { filters.minLength = 0; document.getElementById('min-length').value = ''; } });
    if (filters.maxLength < 100) tags.push({ label: `Max: ${filters.maxLength} chars`, clear: () => { filters.maxLength = 100; document.getElementById('max-length').value = ''; } });

    if (tags.length === 0) {
      el.innerHTML = '';
      return;
    }

    el.innerHTML = tags.map((tag, i) => `
      <span class="filter-tag">${escapeHtml(tag.label)} <button class="filter-tag-close" data-idx="${i}">&times;</button></span>
    `).join('');

    el.querySelectorAll('.filter-tag-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        tags[idx].clear();
        currentPage = 1;
        applyFiltersAndRender();
      });
    });
  }

  return { render };
})();
