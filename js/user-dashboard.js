/**
 * @fileoverview User progress dashboard with analytics and test history
 */

const UserDashboard = (() => {
  /**
   * Render the dashboard
   * @param {HTMLElement} container
   */
  async function render(container) {
    const stats = await StorageManager.getDashboardStats();
    const tests = await StorageManager.getAllTests();
    const sortedTests = [...tests].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const learnedPct = stats.totalWords > 0 ? Math.round((stats.learnedWords / stats.totalWords) * 100) : 0;

    container.innerHTML = `
      <div class="dashboard-section fade-in">
        <h2>📊 Dashboard</h2>

        <!-- Stats Overview -->
        <div class="dashboard-stats-grid">
          <div class="dash-stat-card">
            <div class="dash-stat-icon">📚</div>
            <div class="dash-stat-value">${stats.totalWords}</div>
            <div class="dash-stat-label">Total Words</div>
          </div>
          <div class="dash-stat-card">
            <div class="dash-stat-icon">✅</div>
            <div class="dash-stat-value">${stats.learnedWords} <small>(${learnedPct}%)</small></div>
            <div class="dash-stat-label">Words Learned</div>
          </div>
          <div class="dash-stat-card">
            <div class="dash-stat-icon">❌</div>
            <div class="dash-stat-value">${stats.notLearnedWords}</div>
            <div class="dash-stat-label">Words Not Learned</div>
          </div>
          <div class="dash-stat-card">
            <div class="dash-stat-icon">📝</div>
            <div class="dash-stat-value">${stats.totalTests}</div>
            <div class="dash-stat-label">Tests Taken</div>
          </div>
          <div class="dash-stat-card">
            <div class="dash-stat-icon">📈</div>
            <div class="dash-stat-value">${stats.avgScore}%</div>
            <div class="dash-stat-label">Average Score</div>
          </div>
          <div class="dash-stat-card">
            <div class="dash-stat-icon">🏆</div>
            <div class="dash-stat-value">${stats.bestScore}%</div>
            <div class="dash-stat-label">Best Score</div>
          </div>
          <div class="dash-stat-card">
            <div class="dash-stat-icon">🔥</div>
            <div class="dash-stat-value">${stats.streak}</div>
            <div class="dash-stat-label">Day Streak</div>
          </div>
        </div>

        <!-- Category Breakdown -->
        <div class="dashboard-card">
          <h3>Category Breakdown</h3>
          ${Object.keys(stats.categoryBreakdown).length > 0 ? `
            <div class="category-breakdown">
              ${Object.entries(stats.categoryBreakdown).sort((a, b) => b[1].total - a[1].total).map(([cat, data]) => {
                const pct = data.total > 0 ? Math.round((data.learned / data.total) * 100) : 0;
                return `
                  <div class="cat-break-row">
                    <div class="cat-break-info">
                      <span class="cat-break-name">${escapeHtml(cat)}</span>
                      <span class="cat-break-count">${data.learned}/${data.total}</span>
                    </div>
                    <div class="progress-bar-container">
                      <div class="progress-bar" style="width: ${pct}%; background: ${getAccuracyColor(pct)}"></div>
                    </div>
                    <span class="cat-break-pct">${pct}%</span>
                  </div>
                `;
              }).join('')}
            </div>
          ` : '<p class="empty-text">No words uploaded yet.</p>'}
        </div>

        <!-- Test Score Chart (CSS-based) -->
        ${sortedTests.length > 0 ? `
          <div class="dashboard-card">
            <h3>Test Score History</h3>
            <div class="score-chart">
              ${sortedTests.slice(0, 20).reverse().map((t, i) => {
                const color = getAccuracyColor(t.percentage);
                return `
                  <div class="chart-bar-wrapper" title="${formatDate(t.createdAt)}: ${t.percentage}%">
                    <div class="chart-bar" style="height: ${Math.max(t.percentage, 5)}%; background: ${color}"></div>
                    <div class="chart-label">${t.percentage}%</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Test History Table -->
        <div class="dashboard-card">
          <h3>Test History</h3>
          ${sortedTests.length > 0 ? `
            <div class="table-container">
              <table class="word-table test-history-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date & Time</th>
                    <th>Mode</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Time</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  ${sortedTests.map((t, i) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${formatDate(t.createdAt)}</td>
                      <td>${t.mode === 'en-to-tm' ? 'EN → TM' : 'TM → EN'}</td>
                      <td>${t.correctCount}/${t.totalQuestions}</td>
                      <td><span style="color: ${getAccuracyColor(t.percentage)}">${t.percentage}%</span></td>
                      <td>${formatTime(t.timeTaken || 0)}</td>
                      <td><button class="btn btn-sm btn-ghost view-test-btn" data-id="${t.id}">View</button></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : '<p class="empty-text">No tests taken yet. Go take a test to see your history here!</p>'}
        </div>

        <!-- Words to Review -->
        ${stats.recentFailedWords.length > 0 ? `
          <div class="dashboard-card">
            <h3>📖 Words to Review</h3>
            <div class="review-words-grid">
              ${stats.recentFailedWords.map(w => `
                <div class="review-word-card">
                  <div class="review-word-en">${escapeHtml(w.word)}</div>
                  <div class="review-word-tm">${escapeHtml(w.translation)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Data Management -->
        <div class="dashboard-card data-management">
          <h3>⚙️ Data Management</h3>
          <div class="data-actions">
            <button class="btn btn-secondary" id="export-data-btn">📥 Export Data (JSON)</button>
            <label class="btn btn-secondary import-btn-label">
              📤 Import Data (JSON)
              <input type="file" id="import-data-input" accept=".json" hidden>
            </label>
            <button class="btn btn-accent" id="recategorize-btn">🔄 Re-categorize Words</button>
            <button class="btn btn-danger" id="clear-all-btn">🗑️ Clear All Data</button>
          </div>
        </div>
      </div>
    `;

    bindEvents(container);
  }

  /**
   * Bind dashboard events
   * @param {HTMLElement} container
   */
  function bindEvents(container) {
    // View test details
    container.querySelectorAll('.view-test-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const testId = parseInt(btn.dataset.id);
        await Results.renderSavedTest(container, testId);
        // Add "Back to Dashboard" button after rendering results
        const backBtn = document.createElement('div');
        backBtn.className = 'results-actions';
        backBtn.style.marginTop = '16px';
        backBtn.innerHTML = '<button class="btn btn-secondary" id="back-to-dashboard-btn">← Back to Dashboard</button>';
        container.appendChild(backBtn);
        backBtn.querySelector('#back-to-dashboard-btn').addEventListener('click', () => render(container));
      });
    });

    // Export data
    container.querySelector('#export-data-btn')?.addEventListener('click', async () => {
      try {
        const data = await StorageManager.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vocabmaster-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Data exported successfully!', 'success');
      } catch (error) {
        showToast('Failed to export data: ' + error.message, 'error');
      }
    });

    // Import data
    container.querySelector('#import-data-input')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const result = await StorageManager.importData(data);
        showToast(`Imported ${result.words} words and ${result.tests} tests!`, 'success');
        render(container); // Re-render dashboard
        if (typeof App !== 'undefined') App.updateWordCount();
      } catch (error) {
        showToast('Failed to import data: ' + error.message, 'error');
      }
    });

    // Re-categorize
    container.querySelector('#recategorize-btn')?.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to re-categorize all words? This will send them to Gemini API again.')) return;
      try {
        const words = await StorageManager.getAllWords();
        if (words.length === 0) {
          showToast('No words to re-categorize.', 'warning');
          return;
        }

        container.innerHTML = `
          <div class="test-loading fade-in">
            <div class="spinner spinner-large"></div>
            <h2 id="recat-status">Re-categorizing words...</h2>
          </div>
        `;

        const wordsInput = words.map(w => ({
          word: w.word,
          transcription: w.transcription,
          translation: w.translation,
        }));

        const categorized = await GeminiAPI.categorizeWords(wordsInput, (msg) => {
          const el = document.getElementById('recat-status');
          if (el) el.textContent = msg;
        });

        // Batch update all words in a single transaction
        const wordUpdates = [];
        for (const catWord of categorized) {
          const existing = words.find(w => w.word.toLowerCase() === catWord.word.toLowerCase());
          if (existing) {
            wordUpdates.push({
              id: existing.id,
              updates: { category: catWord.category, sentences: catWord.sentences },
            });
          }
        }
        if (wordUpdates.length > 0) {
          await StorageManager.batchUpdateWords(wordUpdates);
        }

        showToast('Words re-categorized successfully!', 'success');
        render(container);
      } catch (error) {
        showToast('Re-categorization failed: ' + error.message, 'error');
        render(container);
      }
    });

    // Clear all data
    container.querySelector('#clear-all-btn')?.addEventListener('click', async () => {
      if (!confirm('⚠️ Are you sure you want to delete ALL data? This cannot be undone!')) return;
      if (!confirm('This will permanently remove all words, test history, and settings. Continue?')) return;
      try {
        await StorageManager.clearAllData();
        showToast('All data has been cleared.', 'info');
        if (typeof App !== 'undefined') App.updateWordCount();
        render(container);
      } catch (error) {
        showToast('Failed to clear data: ' + error.message, 'error');
      }
    });
  }

  return { render };
})();
