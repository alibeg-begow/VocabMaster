/**
 * @fileoverview IndexedDB wrapper for VocabMaster — CRUD for words, tests, settings
 */

const StorageManager = (() => {
  let db = null;

  /**
   * Open / initialize the IndexedDB database
   * @returns {Promise<IDBDatabase>}
   */
  async function openDB() {
    if (db) return db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(APP_CONSTANTS.DB_NAME, APP_CONSTANTS.DB_VERSION);

      request.onupgradeneeded = (e) => {
        const database = e.target.result;

        // Words store
        if (!database.objectStoreNames.contains('words')) {
          const wordsStore = database.createObjectStore('words', { keyPath: 'id', autoIncrement: true });
          wordsStore.createIndex('word', 'word', { unique: true });
          wordsStore.createIndex('category', 'category', { unique: false });
          wordsStore.createIndex('learned', 'learned', { unique: false });
          wordsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Tests store
        if (!database.objectStoreNames.contains('tests')) {
          const testsStore = database.createObjectStore('tests', { keyPath: 'id', autoIncrement: true });
          testsStore.createIndex('createdAt', 'createdAt', { unique: false });
          testsStore.createIndex('mode', 'mode', { unique: false });
        }

        // Settings store
        if (!database.objectStoreNames.contains('settings')) {
          database.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (e) => {
        db = e.target.result;
        resolve(db);
      };

      request.onerror = (e) => {
        console.error('IndexedDB open error:', e.target.error);
        reject(e.target.error);
      };
    });
  }

  /**
   * Generic transaction helper
   * @param {string} storeName
   * @param {'readonly'|'readwrite'} mode
   * @returns {Promise<{store: IDBObjectStore, tx: IDBTransaction}>}
   */
  async function getStore(storeName, mode = 'readonly') {
    const database = await openDB();
    const tx = database.transaction(storeName, mode);
    return { store: tx.objectStore(storeName), tx };
  }

  /**
   * Wrap an IDBRequest in a promise
   * @param {IDBRequest} request
   * @returns {Promise<any>}
   */
  function promisify(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ─── WORDS ────────────────────────────────────────────

  /**
   * Add a single word
   * @param {Object} wordData
   * @returns {Promise<number>} the new word id
   */
  async function addWord(wordData) {
    const { store } = await getStore('words', 'readwrite');
    const data = {
      ...wordData,
      learned: wordData.learned || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return promisify(store.add(data));
  }

  /**
   * Add multiple words at once
   * @param {Object[]} wordsArray
   * @returns {Promise<number[]>} array of new ids
   */
  async function addWords(wordsArray) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('words', 'readwrite');
      const store = tx.objectStore('words');
      const ids = [];
      for (const wordData of wordsArray) {
        const data = {
          ...wordData,
          learned: wordData.learned || false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const req = store.add(data);
        req.onsuccess = () => ids.push(req.result);
      }
      tx.oncomplete = () => resolve(ids);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Get all words
   * @returns {Promise<Object[]>}
   */
  async function getAllWords() {
    const { store } = await getStore('words');
    return promisify(store.getAll());
  }

  /**
   * Get a word by id
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async function getWord(id) {
    const { store } = await getStore('words');
    return promisify(store.get(id));
  }

  /**
   * Get learned words (handles both boolean and numeric indexing)
   * @returns {Promise<Object[]>}
   */
  async function getLearnedWords() {
    const allWords = await getAllWords();
    return allWords.filter(w => w.learned === true);
  }

  /**
   * Update a word
   * @param {number} id
   * @param {Object} updates
   * @returns {Promise<void>}
   */
  async function updateWord(id, updates) {
    const { store } = await getStore('words', 'readwrite');
    const existing = await promisify(store.get(id));
    if (!existing) throw new Error(`Word with id ${id} not found`);
    const updated = { ...existing, ...updates, updatedAt: Date.now() };
    return promisify(store.put(updated));
  }

  /**
   * Toggle learned status for a word
   * @param {number} id
   * @returns {Promise<boolean>} new learned status
   */
  async function toggleLearned(id) {
    const { store } = await getStore('words', 'readwrite');
    const existing = await promisify(store.get(id));
    if (!existing) throw new Error(`Word with id ${id} not found`);
    existing.learned = !existing.learned;
    existing.updatedAt = Date.now();
    await promisify(store.put(existing));
    return existing.learned;
  }

  /**
   * Set learned status for a word
   * @param {number} id
   * @param {boolean} learned
   * @returns {Promise<void>}
   */
  async function setLearned(id, learned) {
    return updateWord(id, { learned });
  }

  /**
   * Set learned status for multiple words
   * @param {number[]} ids
   * @param {boolean} learned
   * @returns {Promise<void>}
   */
  async function setMultipleLearned(ids, learned) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('words', 'readwrite');
      const store = tx.objectStore('words');
      let pending = ids.length;
      if (pending === 0) { resolve(); return; }
      for (const id of ids) {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const word = getReq.result;
          if (word) {
            word.learned = learned;
            word.updatedAt = Date.now();
            store.put(word);
          }
          pending--;
          if (pending === 0) resolve();
        };
      }
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Delete a word
   * @param {number} id
   * @returns {Promise<void>}
   */
  async function deleteWord(id) {
    const { store } = await getStore('words', 'readwrite');
    return promisify(store.delete(id));
  }

  /**
   * Clear all words
   * @returns {Promise<void>}
   */
  async function clearAllWords() {
    const { store } = await getStore('words', 'readwrite');
    return promisify(store.clear());
  }

  /**
   * Get word count
   * @returns {Promise<number>}
   */
  async function getWordCount() {
    const { store } = await getStore('words');
    return promisify(store.count());
  }

  /**
   * Get unique categories from stored words
   * @returns {Promise<string[]>}
   */
  async function getCategories() {
    const words = await getAllWords();
    return [...new Set(words.map(w => w.category).filter(Boolean))].sort();
  }

  /**
   * Check if a word already exists
   * @param {string} word
   * @returns {Promise<boolean>}
   */
  async function wordExists(word) {
    const { store } = await getStore('words');
    const index = store.index('word');
    const result = await promisify(index.get(word));
    return !!result;
  }

  // ─── TESTS ────────────────────────────────────────────

  /**
   * Save a test result
   * @param {Object} testData
   * @returns {Promise<number>}
   */
  async function saveTest(testData) {
    const { store } = await getStore('tests', 'readwrite');
    const data = { ...testData, createdAt: Date.now() };
    return promisify(store.add(data));
  }

  /**
   * Get all tests
   * @returns {Promise<Object[]>}
   */
  async function getAllTests() {
    const { store } = await getStore('tests');
    return promisify(store.getAll());
  }

  /**
   * Get a test by id
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async function getTest(id) {
    const { store } = await getStore('tests');
    return promisify(store.get(id));
  }

  /**
   * Clear all tests
   * @returns {Promise<void>}
   */
  async function clearAllTests() {
    const { store } = await getStore('tests', 'readwrite');
    return promisify(store.clear());
  }

  // ─── SETTINGS ─────────────────────────────────────────

  /**
   * Get a setting value
   * @param {string} key
   * @param {*} defaultValue
   * @returns {Promise<*>}
   */
  async function getSetting(key, defaultValue = null) {
    const { store } = await getStore('settings');
    const result = await promisify(store.get(key));
    return result ? result.value : defaultValue;
  }

  /**
   * Set a setting value
   * @param {string} key
   * @param {*} value
   * @returns {Promise<void>}
   */
  async function setSetting(key, value) {
    const { store } = await getStore('settings', 'readwrite');
    return promisify(store.put({ key, value }));
  }

  // ─── DATA MANAGEMENT ─────────────────────────────────

  /**
   * Export all data as JSON
   * @returns {Promise<Object>}
   */
  async function exportData() {
    const words = await getAllWords();
    const tests = await getAllTests();
    return {
      version: 1,
      exportDate: new Date().toISOString(),
      words,
      tests,
    };
  }

  /**
   * Import data from JSON
   * @param {Object} data
   * @returns {Promise<{words: number, tests: number}>}
   */
  async function importData(data) {
    if (!data || !data.words) throw new Error('Invalid import data format');
    
    // Clear existing data
    await clearAllWords();
    await clearAllTests();

    // Import words
    let wordCount = 0;
    if (data.words && data.words.length > 0) {
      const database = await openDB();
      await new Promise((resolve, reject) => {
        const tx = database.transaction('words', 'readwrite');
        const store = tx.objectStore('words');
        for (const word of data.words) {
          const { id, ...wordData } = word;
          store.add(wordData);
          wordCount++;
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }

    // Import tests
    let testCount = 0;
    if (data.tests && data.tests.length > 0) {
      const database = await openDB();
      await new Promise((resolve, reject) => {
        const tx = database.transaction('tests', 'readwrite');
        const store = tx.objectStore('tests');
        for (const test of data.tests) {
          const { id, ...testData } = test;
          store.add(testData);
          testCount++;
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }

    return { words: wordCount, tests: testCount };
  }

  /**
   * Clear all data from all stores
   * @returns {Promise<void>}
   */
  async function clearAllData() {
    await clearAllWords();
    await clearAllTests();
    const { store } = await getStore('settings', 'readwrite');
    await promisify(store.clear());
  }

  /**
   * Batch update multiple words in a single transaction
   * @param {Array<{id: number, updates: Object}>} wordUpdates - Array of {id, updates}
   * @returns {Promise<void>}
   */
  async function batchUpdateWords(wordUpdates) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('words', 'readwrite');
      const store = tx.objectStore('words');
      for (const { id, updates } of wordUpdates) {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const existing = getReq.result;
          if (existing) {
            const updated = { ...existing, ...updates, updatedAt: Date.now() };
            store.put(updated);
          }
        };
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }


  /**
   * Get dashboard statistics
   * @returns {Promise<Object>}
   */
  async function getDashboardStats() {
    const words = await getAllWords();
    const tests = await getAllTests();

    const totalWords = words.length;
    const learnedWords = words.filter(w => w.learned).length;
    const notLearnedWords = totalWords - learnedWords;
    const totalTests = tests.length;

    let avgScore = 0, bestScore = 0;
    if (tests.length > 0) {
      avgScore = tests.reduce((sum, t) => sum + (t.percentage || 0), 0) / tests.length;
      bestScore = Math.max(...tests.map(t => t.percentage || 0));
    }

    // Calculate streak (consecutive days with tests)
    let streak = 0;
    if (tests.length > 0) {
      const sortedTests = [...tests].sort((a, b) => b.createdAt - a.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const testDays = new Set(sortedTests.map(t => {
        const d = new Date(t.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }));

      // Start from today; if no test today, start from yesterday (allow "not yet today")
      let checkDate = new Date(today);
      if (!testDays.has(checkDate.getTime())) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (testDays.has(checkDate.getTime())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1); // DST-safe date subtraction
      }
    }

    // Category breakdown
    const categoryBreakdown = {};
    for (const word of words) {
      const cat = word.category || 'Uncategorized';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { total: 0, learned: 0 };
      }
      categoryBreakdown[cat].total++;
      if (word.learned) categoryBreakdown[cat].learned++;
    }

    return {
      totalWords,
      learnedWords,
      notLearnedWords,
      totalTests,
      avgScore: Math.round(avgScore * 10) / 10,
      bestScore: Math.round(bestScore * 10) / 10,
      streak,
      categoryBreakdown,
      recentFailedWords: words.filter(w => !w.learned)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, 10),
    };
  }

  return {
    openDB,
    addWord, addWords, getAllWords, getWord, getLearnedWords,
    updateWord, toggleLearned, setLearned, setMultipleLearned,
    deleteWord, clearAllWords, getWordCount, getCategories, wordExists,
    saveTest, getAllTests, getTest, clearAllTests,
    getSetting, setSetting,
    exportData, importData, clearAllData,
    getDashboardStats,
    batchUpdateWords,
  };
})();
