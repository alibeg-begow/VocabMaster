/**
 * @fileoverview Test results display with statistics, word breakdown, and Gemini feedback
 */

const Results = (() => {
  /**
   * Render the results page
   * @param {HTMLElement} container
   * @param {Object} testData
   */
  function render(container, testData) {
    const {
      mode, totalQuestions, correctCount, incorrectCount,
      percentage, timeTaken, results: wordResults, geminiFeedback
    } = testData;

    const avgTime = totalQuestions > 0 ? (timeTaken / totalQuestions).toFixed(1) : 0;
    const modeLabel = mode === 'en-to-tm' ? 'English → Turkmen' : 'Turkmen → English';
    const accuracyColor = getAccuracyColor(percentage);
    const dateStr = testData.createdAt ? formatDate(testData.createdAt) : formatDate(Date.now());

    container.innerHTML = `
      <div class="results-section fade-in">
        <h2>📊 Test Results</h2>

        <div class="results-stats-grid">
          <div class="stat-card stat-circle-card">
            <div class="score-circle" id="score-circle" data-pct="${percentage}">
              <svg viewBox="0 0 120 120">
                <circle class="score-bg" cx="60" cy="60" r="52"/>
                <circle class="score-fill" cx="60" cy="60" r="52" 
                        stroke="${accuracyColor}"
                        stroke-dasharray="${2 * Math.PI * 52}" 
                        stroke-dashoffset="${2 * Math.PI * 52 * (1 - percentage / 100)}"/>
              </svg>
              <div class="score-text">
                <span class="score-number" id="score-number">0</span>
                <span class="score-pct">%</span>
              </div>
            </div>
            <div class="stat-label">Accuracy</div>
          </div>

          <div class="stat-card">
            <div class="stat-value" style="color: ${THEME_COLORS.success}">✅ ${correctCount}</div>
            <div class="stat-label">Correct Answers</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: ${THEME_COLORS.danger}">❌ ${incorrectCount}</div>
            <div class="stat-label">Incorrect Answers</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totalQuestions}</div>
            <div class="stat-label">Total Questions</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${formatTime(timeTaken)}</div>
            <div class="stat-label">Time Taken</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${avgTime}s</div>
            <div class="stat-label">Avg. per Question</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${modeLabel}</div>
            <div class="stat-label">Test Mode</div>
          </div>
          <div class="stat-card">
            <div class="stat-value stat-value-sm">${dateStr}</div>
            <div class="stat-label">Date & Time</div>
          </div>
        </div>

        <div class="results-breakdown">
          <h3>Word Breakdown</h3>
          <div class="table-container">
            <table class="word-table results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>English Word</th>
                  <th>Correct Answer</th>
                  <th>Your Answer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${(wordResults || []).map((r, i) => `
                  <tr class="${r.isCorrect ? 'row-correct' : 'row-incorrect'}">
                    <td>${i + 1}</td>
                    <td>${escapeHtml(r.word)}</td>
                    <td>${escapeHtml(r.correctAnswer)}</td>
                    <td>${escapeHtml(r.userAnswer || '(empty)')}</td>
                    <td>${r.isCorrect
                      ? '<span class="status-correct">✅</span>'
                      : '<span class="status-incorrect">❌ <small>(unmarked)</small></span>'
                    }</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="gemini-feedback-card">
          <div class="feedback-header">
            <span class="ai-badge">🤖 AI</span>
            <h3>AI Analysis & Recommendations</h3>
          </div>
          <div class="feedback-body">
            ${formatFeedbackText(geminiFeedback || '')}
          </div>
        </div>

        <div class="results-actions">
          <button class="btn btn-primary" id="retake-test-btn">🔄 Retake Test</button>
          <a href="#/flashcards" class="btn btn-secondary">🃏 Go to Flashcards</a>
          <a href="#/dashboard" class="btn btn-secondary">📊 View Dashboard</a>
          <a href="#/table" class="btn btn-ghost">🏠 Back to Home</a>
        </div>
      </div>
    `;

    // Animate score circle count-up
    animateScoreCircle(percentage);

    // Retake button
    container.querySelector('#retake-test-btn')?.addEventListener('click', () => {
      window.location.hash = '#/test';
    });
  }

  /**
   * Render results for a saved test (from dashboard)
   * @param {HTMLElement} container
   * @param {number} testId
   */
  async function renderSavedTest(container, testId) {
    const testData = await StorageManager.getTest(testId);
    if (!testData) {
      container.innerHTML = '<div class="empty-state-full"><h2>Test not found</h2></div>';
      return;
    }
    render(container, testData);
  }

  /**
   * Format feedback text into paragraphs
   * @param {string} text
   * @returns {string}
   */
  function formatFeedbackText(text) {
    if (!text) return '<p>No feedback available.</p>';
    return text
      .split('\n')
      .filter(line => line.trim())
      .map(line => `<p>${escapeHtml(line)}</p>`)
      .join('');
  }

  /**
   * Animate the score circle count-up
   * @param {number} targetPct
   */
  function animateScoreCircle(targetPct) {
    const numberEl = document.getElementById('score-number');
    if (!numberEl) return;

    let current = 0;
    const duration = 1500;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      current = Math.round(easedProgress * targetPct * 10) / 10;
      numberEl.textContent = Math.round(current);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  return { render, renderSavedTest };
})();
