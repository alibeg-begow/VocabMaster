/**
 * @fileoverview Test engine — English→Turkmen and Turkmen→English test modes
 */

const TestEngine = (() => {
  let testWords = [];
  let currentQuestionIndex = 0;
  let results = [];
  let testMode = ''; // 'en-to-tm' or 'tm-to-en'
  let startTime = 0;
  let timerInterval = null;
  let isSubmitting = false;

  /**
   * Render the test mode selection screen
   * @param {HTMLElement} container
   */
  async function render(container) {
    const learnedWords = await StorageManager.getLearnedWords();

    if (learnedWords.length === 0) {
      container.innerHTML = `
        <div class="empty-state-full fade-in">
          <div class="empty-icon">📝</div>
          <h2>No Words Ready for Testing</h2>
          <p>You haven't marked any words as learned yet. Go to Flashcards to start learning!</p>
          <a href="#/flashcards" class="btn btn-primary">🃏 Go to Flashcards</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="test-selection fade-in">
        <h2>📝 Test Your Knowledge</h2>
        <p class="test-info">You have <strong>${learnedWords.length}</strong> learned words ready for testing.</p>
        
        <div class="test-mode-cards">
          <button class="test-mode-card" id="mode-en-to-tm">
            <div class="mode-flags">🇬🇧 → 🇹🇲</div>
            <h3>English → Turkmen</h3>
            <p>See the English word, type the Turkmen translation</p>
          </button>
          <button class="test-mode-card" id="mode-tm-to-en">
            <div class="mode-flags">🇹🇲 → 🇬🇧</div>
            <h3>Turkmen → English</h3>
            <p>See the Turkmen translation, type the English word</p>
          </button>
        </div>
      </div>
    `;

    container.querySelector('#mode-en-to-tm').addEventListener('click', () => startTest('en-to-tm', container));
    container.querySelector('#mode-tm-to-en').addEventListener('click', () => startTest('tm-to-en', container));
  }

  /**
   * Start a test with the given mode
   * @param {string} mode
   * @param {HTMLElement} container
   */
  async function startTest(mode, container) {
    testMode = mode;
    const learnedWords = await StorageManager.getLearnedWords();
    testWords = shuffleArray(learnedWords);
    currentQuestionIndex = 0;
    results = [];
    startTime = Date.now();
    isSubmitting = false;

    renderQuestion(container);
    startTimer();
  }

  /**
   * Start the elapsed time timer
   */
  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const timerEl = document.getElementById('test-timer');
      if (timerEl) timerEl.textContent = formatTime(elapsed);
    }, 1000);
  }

  /**
   * Render the current question
   * @param {HTMLElement} container
   */
  function renderQuestion(container) {
    if (currentQuestionIndex >= testWords.length) {
      finishTest(container);
      return;
    }

    const word = testWords[currentQuestionIndex];
    const total = testWords.length;
    const pct = ((currentQuestionIndex) / total * 100).toFixed(0);
    const prompt = testMode === 'en-to-tm' ? word.word : word.translation;
    const promptLabel = testMode === 'en-to-tm' ? 'English Word' : 'Turkmen Word';
    const answerLabel = testMode === 'en-to-tm' ? 'Type the Turkmen translation' : 'Type the English word';

    container.innerHTML = `
      <div class="test-question fade-in">
        <div class="test-header-bar">
          <div class="test-progress-info">
            Question ${currentQuestionIndex + 1} of ${total}
          </div>
          <div class="test-timer" id="test-timer">${formatTime(Math.floor((Date.now() - startTime) / 1000))}</div>
        </div>
        <div class="progress-bar-container test-progress-bar">
          <div class="progress-bar" style="width: ${pct}%"></div>
        </div>

        <div class="question-card">
          <div class="question-label">${promptLabel}:</div>
          <div class="question-prompt">${escapeHtml(prompt)}</div>
          ${testMode === 'en-to-tm' && word.transcription ? `<div class="question-transcription">${escapeHtml(word.transcription)}</div>` : ''}
        </div>

        <div class="answer-section">
          <label class="answer-label">${answerLabel}:</label>
          <input type="text" id="test-answer-input" class="answer-input" 
                 placeholder="Type your answer..." autocomplete="off" autofocus>
          <button class="btn btn-primary submit-answer-btn" id="submit-answer-btn">
            Submit Answer ↵
          </button>
        </div>

        <div class="answer-feedback hidden" id="answer-feedback"></div>
      </div>
    `;

    const input = container.querySelector('#test-answer-input');
    const submitBtn = container.querySelector('#submit-answer-btn');

    // Focus input
    setTimeout(() => input?.focus(), 100);

    // Submit on Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitAnswer(container);
      }
    });

    submitBtn.addEventListener('click', () => submitAnswer(container));
  }

  /**
   * Submit the current answer
   * @param {HTMLElement} container
   */
  async function submitAnswer(container) {
    if (isSubmitting) return;
    isSubmitting = true;

    const input = document.getElementById('test-answer-input');
    const feedbackEl = document.getElementById('answer-feedback');
    const word = testWords[currentQuestionIndex];
    const userAnswer = (input?.value || '').trim();

    const correctAnswer = testMode === 'en-to-tm' ? word.translation : word.word;
    const isCorrect = compareAnswers(userAnswer, correctAnswer);

    results.push({
      wordId: word.id,
      word: word.word,
      translation: word.translation,
      correctAnswer,
      userAnswer,
      isCorrect,
    });

    // Show feedback
    feedbackEl.classList.remove('hidden');
    const submitBtn = document.getElementById('submit-answer-btn');
    if (submitBtn) submitBtn.disabled = true;
    if (input) input.disabled = true;

    if (isCorrect) {
      feedbackEl.className = 'answer-feedback feedback-correct';
      feedbackEl.innerHTML = `<span class="feedback-icon">✅</span> Correct!`;
      // Move to next after delay
      await sleep(APP_CONSTANTS.CORRECT_DELAY);
    } else {
      feedbackEl.className = 'answer-feedback feedback-incorrect';
      feedbackEl.innerHTML = `
        <span class="feedback-icon">❌</span> Incorrect!
        <div class="correct-answer">Correct answer: <strong>${escapeHtml(correctAnswer)}</strong></div>
      `;
      // Silently unmark as learned
      try {
        await StorageManager.setLearned(word.id, false);
      } catch (e) {
        console.error('Failed to unmark word:', e);
      }
      await sleep(APP_CONSTANTS.INCORRECT_DELAY);
    }

    currentQuestionIndex++;
    isSubmitting = false;
    renderQuestion(container);
  }

  /**
   * Finish the test and show loading, then results
   * @param {HTMLElement} container
   */
  async function finishTest(container) {
    if (timerInterval) clearInterval(timerInterval);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const correctCount = results.filter(r => r.isCorrect).length;
    const incorrectCount = results.length - correctCount;
    const percentage = results.length > 0 ? Math.round((correctCount / results.length) * 1000) / 10 : 0;

    // Prepare test data
    const testData = {
      mode: testMode,
      totalQuestions: results.length,
      correctCount,
      incorrectCount,
      percentage,
      timeTaken,
      results,
    };

    // Show loading
    container.innerHTML = `
      <div class="test-loading fade-in">
        <div class="spinner spinner-large"></div>
        <h2 id="analysis-status">Analyzing your results with AI...</h2>
        <p>Please wait while we generate personalized feedback.</p>
      </div>
    `;

    // Get Gemini feedback
    let geminiFeedback = '';
    try {
      const feedbackPayload = {
        totalQuestions: testData.totalQuestions,
        correctCount: testData.correctCount,
        incorrectCount: testData.incorrectCount,
        percentage: testData.percentage,
        testMode: testMode === 'en-to-tm' ? 'english-to-turkmen' : 'turkmen-to-english',
        correctWords: results.filter(r => r.isCorrect).map(r => ({ word: r.word, translation: r.translation })),
        incorrectWords: results.filter(r => !r.isCorrect).map(r => ({ word: r.word, translation: r.translation, userAnswer: r.userAnswer })),
      };

      geminiFeedback = await GeminiAPI.getTestFeedback(feedbackPayload, (msg) => {
        const statusEl = document.getElementById('analysis-status');
        if (statusEl) statusEl.textContent = msg;
      });
    } catch (error) {
      console.error('Failed to get Gemini feedback:', error);
      geminiFeedback = 'AI feedback could not be generated at this time. Please check your API key and internet connection.';
    }

    // Save test to IndexedDB
    testData.geminiFeedback = geminiFeedback;
    try {
      await StorageManager.saveTest(testData);
    } catch (e) {
      console.error('Failed to save test:', e);
    }

    // Show results
    Results.render(container, testData);
    if (typeof App !== 'undefined') App.updateWordCount();
  }

  /**
   * Cleanup when leaving test view
   */
  function cleanup() {
    if (timerInterval) clearInterval(timerInterval);
  }

  return { render, cleanup };
})();
