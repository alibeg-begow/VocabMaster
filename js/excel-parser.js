/**
 * @fileoverview Excel upload & parsing logic using SheetJS
 * Auto-detects which columns contain English words, transcription, and Turkmen translation.
 */

const ExcelParser = (() => {

  // ─── COLUMN DETECTION HELPERS ─────────────────────────

  /**
   * Check if a string looks like a phonetic transcription.
   * Transcriptions typically contain IPA brackets [], //, or IPA-specific characters.
   * @param {string} val
   * @returns {boolean}
   */
  function isTranscription(val) {
    if (!val) return false;
    // Wrapped in [], //, or contains many IPA-like special characters
    if (/^\s*[\[\/]/.test(val) && /[\]\/]\s*$/.test(val)) return true;
    // Contains multiple IPA characters (ə, ɪ, ʌ, ː, θ, ð, ŋ, æ, ʃ, ʒ, ɑ, ɔ, ʊ etc.)
    const ipaChars = (val.match(/[əɪʌːθðŋæʃʒɑɔʊɛɜɒʍʰˈˌ\u0250-\u02AF]/g) || []).length;
    if (ipaChars >= 1) return true;
    // Contains brackets or slashes with phonetic-ish content
    if (/[\[\/].*[\]\/]/.test(val)) return true;
    return false;
  }

  /**
   * Check if a string is primarily composed of Latin/English characters.
   * @param {string} val
   * @returns {number} Score 0-1 of how "English/Latin" the string is.
   */
  function englishScore(val) {
    if (!val) return 0;
    const cleaned = val.replace(/[\s\-'.,!?;:()]/g, '');
    if (cleaned.length === 0) return 0;
    const latinChars = (cleaned.match(/[a-zA-Z]/g) || []).length;
    return latinChars / cleaned.length;
  }

  /**
   * Check if a string contains Turkmen-specific characters or looks like Turkmen.
   * Turkmen uses Latin alphabet with special letters: ä, ç, ş, ň, ö, ü, ý, ž
   * @param {string} val
   * @returns {number} Score — higher means more likely Turkmen.
   */
  function turkmenScore(val) {
    if (!val) return 0;
    const cleaned = val.replace(/[\s\-'.,!?;:()]/g, '');
    if (cleaned.length === 0) return 0;
    // Turkmen-specific chars: ä ç ş ň ö ü ý ž Ä Ç Ş Ň Ö Ü Ý Ž
    const turkmenSpecific = (cleaned.match(/[äçşňöüýžÄÇŞŇÖÜÝŽ]/g) || []).length;
    // Also Latin-based
    const latinChars = (cleaned.match(/[a-zA-ZäçşňöüýžÄÇŞŇÖÜÝŽ]/g) || []).length;
    const latinRatio = latinChars / cleaned.length;
    // Cyrillic check — if it has Cyrillic, it's not Turkmen (could be Russian)
    const cyrillicChars = (cleaned.match(/[\u0400-\u04FF]/g) || []).length;
    if (cyrillicChars > 0) return 0;
    // If it has Turkmen-specific chars, give a big bonus
    if (turkmenSpecific > 0) return 0.8 + (turkmenSpecific / cleaned.length) * 0.2;
    // Otherwise it could be either English or Turkmen — return low score
    return latinRatio * 0.3;
  }

  /**
   * Check if a string contains Cyrillic (Russian/other)
   * @param {string} val
   * @returns {boolean}
   */
  function isCyrillic(val) {
    if (!val) return false;
    const cleaned = val.replace(/[\s\-'.,!?;:()]/g, '');
    const cyrillic = (cleaned.match(/[\u0400-\u04FF]/g) || []).length;
    return cyrillic / Math.max(cleaned.length, 1) > 0.5;
  }

  /**
   * Check if a string contains CJK / Japanese characters
   * @param {string} val
   * @returns {boolean}
   */
  function isCJK(val) {
    if (!val) return false;
    return /[\u3000-\u9FFF\uF900-\uFAFF]/.test(val);
  }

  /**
   * Detect header row by checking if first row values match known header names.
   * @param {Array} row
   * @returns {boolean}
   */
  function isHeaderRow(row) {
    if (!row || row.length < 2) return false;
    const headerKeywords = /^(#|no|number|word|english|söz|soz|transcription|pronunciation|phonetic|translation|turkmen|türkmen|terjime|meaning|definition|column|col|rus|russian|japan|japanese|idx|index)/i;
    let matches = 0;
    for (let i = 0; i < Math.min(row.length, 10); i++) {
      if (headerKeywords.test(String(row[i] || '').trim())) matches++;
    }
    return matches >= 2; // at least 2 cells look like headers
  }

  /**
   * Auto-detect which columns are English, Transcription, and Turkmen.
   * Analyzes all data rows and returns the best column indices.
   * Also detects columns to IGNORE (Cyrillic/Russian, CJK/Japanese, purely numeric, etc.)
   * 
   * @param {Array[]} rows - Data rows (excluding header)
   * @param {number} totalCols - Number of columns
   * @returns {{engCol: number, transCol: number, tmCol: number, detectionInfo: string}}
   */
  function detectColumns(rows, totalCols) {
    if (totalCols < 2) throw new Error('Excel file must have at least 2 columns.');

    // Sample up to 30 rows for analysis
    const sampleRows = rows.slice(0, Math.min(30, rows.length));

    // Score each column
    const colScores = [];
    for (let c = 0; c < totalCols; c++) {
      const values = sampleRows.map(r => String(r[c] || '').trim()).filter(Boolean);
      if (values.length === 0) {
        colScores.push({ col: c, type: 'empty', engScore: 0, tmScore: 0, transCount: 0, cyrCount: 0, cjkCount: 0, numCount: 0 });
        continue;
      }

      let engSum = 0, tmSum = 0, transCount = 0, cyrCount = 0, cjkCount = 0, numCount = 0;
      for (const val of values) {
        if (isTranscription(val)) transCount++;
        engSum += englishScore(val);
        tmSum += turkmenScore(val);
        if (isCyrillic(val)) cyrCount++;
        if (isCJK(val)) cjkCount++;
        if (/^\d+$/.test(val.trim())) numCount++;
      }

      colScores.push({
        col: c,
        type: 'data',
        engScore: engSum / values.length,
        tmScore: tmSum / values.length,
        transCount,
        transPct: transCount / values.length,
        cyrCount,
        cyrPct: cyrCount / values.length,
        cjkCount,
        cjkPct: cjkCount / values.length,
        numCount,
        numPct: numCount / values.length,
        sampleSize: values.length,
      });
    }

    // Step 1: Identify the transcription column (highest transcription percentage)
    let transCol = -1;
    let bestTransPct = 0;
    for (const cs of colScores) {
      if (cs.transPct > 0.3 && cs.transPct > bestTransPct) {
        bestTransPct = cs.transPct;
        transCol = cs.col;
      }
    }

    // Step 2: Identify columns to IGNORE (Cyrillic, CJK, purely numeric, empty)
    const ignoreCols = new Set();
    for (const cs of colScores) {
      if (cs.type === 'empty') { ignoreCols.add(cs.col); continue; }
      if (cs.cyrPct > 0.5) { ignoreCols.add(cs.col); continue; } // Russian column
      if (cs.cjkPct > 0.3) { ignoreCols.add(cs.col); continue; } // Japanese/CJK column
      if (cs.numPct > 0.8) { ignoreCols.add(cs.col); continue; } // Row number column
      if (cs.col === transCol) continue; // Don't ignore transcription
    }

    // Step 3: Among remaining non-ignored, non-transcription columns,
    // find the English column (highest pure-English score) and Turkmen column
    const candidateCols = colScores.filter(cs => 
      !ignoreCols.has(cs.col) && cs.col !== transCol && cs.type !== 'empty'
    );

    let engCol = -1, tmCol = -1;

    if (candidateCols.length >= 2) {
      // Sort candidates: the one with highest English score (and low Turkmen score) = English
      // The one with highest Turkmen score = Turkmen
      // English words are pure a-z, Turkmen has special chars (ä, ç, ş, ň, ö, ü, ý, ž)
      
      // Find the column with highest Turkmen-specific character density
      let bestTm = -1, bestTmScore = -1;
      for (const cs of candidateCols) {
        if (cs.tmScore > bestTmScore) {
          bestTmScore = cs.tmScore;
          bestTm = cs.col;
        }
      }

      // Among the rest, find the column with highest English score
      let bestEng = -1, bestEngScore = -1;
      for (const cs of candidateCols) {
        if (cs.col === bestTm) continue;
        if (cs.engScore > bestEngScore) {
          bestEngScore = cs.engScore;
          bestEng = cs.col;
        }
      }

      // If Turkmen score is very low (no special chars found), use position heuristic:
      // Usually English comes before Turkmen in spreadsheet column order
      if (bestTmScore < 0.4 && bestEngScore > 0.5) {
        // Both columns look Latin without clear distinction
        // Check if one has more "simple English" patterns (shorter words, common letters)
        const avgLenA = getAvgWordLength(sampleRows, candidateCols[0].col);
        const avgLenB = getAvgWordLength(sampleRows, candidateCols[1].col);
        
        // The Turkmen translation column often has longer text or phrases
        // English vocab words tend to be shorter
        if (avgLenA <= avgLenB) {
          bestEng = candidateCols[0].col;
          bestTm = candidateCols[1].col;
        } else {
          bestEng = candidateCols[1].col;
          bestTm = candidateCols[0].col;
        }
      }

      engCol = bestEng;
      tmCol = bestTm;
    } else if (candidateCols.length === 1) {
      // Only one candidate — it's probably English, and maybe transcription is inline
      engCol = candidateCols[0].col;
    }

    // Step 4: If we still don't have a transcription column, look if it was ignored or doesn't exist
    // Transcription is optional in some files
    if (transCol === -1) {
      // Check if any ignored column could be transcription
      for (const cs of colScores) {
        if (ignoreCols.has(cs.col) && cs.transPct > 0.3) {
          transCol = cs.col;
          ignoreCols.delete(cs.col);
          break;
        }
      }
    }

    // Build detection info string
    const colNames = [];
    for (let c = 0; c < totalCols; c++) {
      if (c === engCol) colNames.push(`Col ${c + 1}: English`);
      else if (c === transCol) colNames.push(`Col ${c + 1}: Transcription`);
      else if (c === tmCol) colNames.push(`Col ${c + 1}: Turkmen`);
      else if (ignoreCols.has(c)) colNames.push(`Col ${c + 1}: ignored`);
      else colNames.push(`Col ${c + 1}: unused`);
    }

    return {
      engCol,
      transCol,
      tmCol,
      detectionInfo: `Detected layout: ${colNames.join(' | ')}`,
    };
  }

  /**
   * Get average word/cell length for a column across sample rows
   * @param {Array[]} rows
   * @param {number} col
   * @returns {number}
   */
  function getAvgWordLength(rows, col) {
    let total = 0, count = 0;
    for (const row of rows) {
      const val = String(row[col] || '').trim();
      if (val) { total += val.length; count++; }
    }
    return count > 0 ? total / count : 0;
  }

  // ─── MAIN PARSE FUNCTION ─────────────────────────────

  /**
   * Parse an Excel file and extract words.
   * Automatically detects which columns contain English, Transcription, and Turkmen.
   * Ignores columns with Russian, Japanese, row numbers, etc.
   * 
   * @param {File} file
   * @returns {Promise<Object>} { words, errors, duplicates, totalRows, skippedHeader, detectionInfo }
   */
  async function parseFile(file) {
    // Validate file size (max 5 MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File too large. Maximum file size is 5 MB.');
    }

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    const validExts = ['.xlsx', '.xls'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      throw new Error('Invalid file type. Please upload an .xlsx or .xls file.');
    }

    // Read file
    const data = await readFileAsArrayBuffer(file);
    
    // Parse with SheetJS
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    
    if (!firstSheet) {
      throw new Error('The Excel file appears to be empty.');
    }

    // Convert to JSON (array of arrays)
    const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

    if (!rawData || rawData.length === 0) {
      throw new Error('No data found in the Excel file.');
    }

    // Detect header row
    let startRow = 0;
    if (isHeaderRow(rawData[0])) {
      startRow = 1;
    }

    // Get data rows (skip header)
    const dataRows = rawData.slice(startRow).filter(row => 
      row && row.some(cell => String(cell || '').trim() !== '')
    );

    if (dataRows.length === 0) {
      throw new Error('No data rows found in the Excel file.');
    }

    // Find max column count
    const totalCols = Math.max(...rawData.map(r => (r ? r.length : 0)));

    // ── Auto-detect column roles ──
    const { engCol, transCol, tmCol, detectionInfo } = detectColumns(dataRows, totalCols);

    if (engCol === -1) {
      throw new Error('Could not detect the English word column. Please ensure your file has English words.');
    }
    if (tmCol === -1) {
      throw new Error('Could not detect the Turkmen translation column. Please ensure your file has Turkmen translations.');
    }

    // ── Extract words using detected columns ──
    const words = [];
    const errors = [];
    const seenWords = new Set();
    const duplicates = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = startRow + i + 1; // 1-based original row number

      const word = String(row[engCol] || '').trim();
      const transcription = transCol !== -1 ? String(row[transCol] || '').trim() : '';
      const translation = String(row[tmCol] || '').trim();

      // Skip completely empty rows
      if (!word && !transcription && !translation) continue;

      // Validate required fields
      if (!word) {
        errors.push(`Row ${rowNum}: English word is empty`);
        continue;
      }
      if (!translation) {
        errors.push(`Row ${rowNum}: Turkmen translation is empty for "${word}"`);
        continue;
      }

      // Check for duplicates
      const wordLower = word.toLowerCase();
      if (seenWords.has(wordLower)) {
        duplicates.push(word);
        continue;
      }
      seenWords.add(wordLower);

      words.push({
        word,
        transcription: transcription || '—',
        translation,
      });
    }

    // Validate word count
    if (words.length < APP_CONSTANTS.MIN_WORDS) {
      throw new Error(`Too few words: found ${words.length}, minimum is ${APP_CONSTANTS.MIN_WORDS}. Please add more words to your file.`);
    }

    if (words.length > APP_CONSTANTS.MAX_WORDS) {
      throw new Error(`Too many words: found ${words.length}, maximum is ${APP_CONSTANTS.MAX_WORDS}. Please reduce the number of words.`);
    }

    return {
      words,
      errors,
      duplicates,
      totalRows: dataRows.length,
      skippedHeader: startRow > 0,
      detectionInfo,
    };
  }

  /**
   * Read a File as ArrayBuffer
   * @param {File} file
   * @returns {Promise<ArrayBuffer>}
   */
  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(new Uint8Array(e.target.result));
      reader.onerror = () => reject(new Error('Failed to read the file.'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Render the upload UI
   * @param {HTMLElement} container
   */
  function renderUploadUI(container) {
    container.innerHTML = `
      <div class="upload-section fade-in">
        <div class="upload-header">
          <h2>📤 Upload Words</h2>
          <p>Upload an Excel file (.xlsx or .xls) with your English vocabulary words.</p>
        </div>
        
        <div class="upload-instructions">
          <h3>File Format Requirements:</h3>
          <div class="format-table">
            <div class="format-row format-header">
              <span>Column A</span>
              <span>Column B</span>
              <span>Column C</span>
            </div>
            <div class="format-row">
              <span>English Word</span>
              <span>Transcription</span>
              <span>Turkmen Translation</span>
            </div>
            <div class="format-row format-example">
              <span>apple</span>
              <span>[ˈæpəl]</span>
              <span>alma</span>
            </div>
          </div>
          <ul class="upload-rules">
            <li>Minimum <strong>10</strong> words, maximum <strong>200</strong> words</li>
            <li>Header row is automatically detected and skipped</li>
            <li><strong>Smart detection:</strong> the app automatically finds which column is English, Transcription, and Turkmen</li>
            <li>Extra columns (Russian, Japanese, numbers, etc.) are automatically ignored</li>
            <li>Duplicate English words will be warned and skipped</li>
          </ul>
        </div>

        <div class="upload-dropzone" id="upload-dropzone">
          <div class="dropzone-content">
            <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p class="dropzone-text">Drag & drop your Excel file here</p>
            <p class="dropzone-subtext">or</p>
            <label class="btn btn-primary upload-btn-label">
              Browse Files
              <input type="file" id="file-input" accept=".xlsx,.xls" hidden>
            </label>
          </div>
        </div>

        <div id="upload-progress" class="upload-progress hidden">
          <div class="spinner"></div>
          <p class="progress-text" id="upload-progress-text">Processing...</p>
        </div>

        <div id="upload-errors" class="upload-errors hidden"></div>
        <div id="preview-section" class="preview-section hidden"></div>
      </div>
    `;

    // Bind events
    const dropzone = container.querySelector('#upload-dropzone');
    const fileInput = container.querySelector('#file-input');

    // Drag & drop
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) handleFile(files[0], container);
    });

    // File input
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) handleFile(e.target.files[0], container);
    });
  }

  /**
   * Handle a selected/dropped file
   * @param {File} file
   * @param {HTMLElement} container
   */
  async function handleFile(file, container) {
    const progressEl = container.querySelector('#upload-progress');
    const progressText = container.querySelector('#upload-progress-text');
    const errorsEl = container.querySelector('#upload-errors');
    const previewEl = container.querySelector('#preview-section');
    const dropzone = container.querySelector('#upload-dropzone');

    // Reset
    errorsEl.classList.add('hidden');
    errorsEl.innerHTML = '';
    previewEl.classList.add('hidden');
    progressEl.classList.remove('hidden');
    progressText.textContent = 'Reading file...';

    try {
      const result = await parseFile(file);

      progressEl.classList.add('hidden');

      // Show info and warnings
      errorsEl.classList.remove('hidden');
      let html = '';
      // Always show detection info
      if (result.detectionInfo) {
        html += `<div class="info-box">🔍 ${escapeHtml(result.detectionInfo)}</div>`;
      }
      if (result.skippedHeader) {
        html += `<div class="info-box">ℹ️ Header row detected and skipped automatically.</div>`;
      }
      if (result.duplicates.length > 0) {
        html += `<div class="warning-box"><strong>⚠️ Duplicates skipped:</strong> ${result.duplicates.map(d => escapeHtml(d)).join(', ')}</div>`;
      }
      if (result.errors.length > 0) {
        html += `<div class="error-box"><strong>❌ Row errors:</strong><ul>${result.errors.map(e => `<li>${escapeHtml(e)}</li>`).join('')}</ul></div>`;
      }
      if (!html) {
        errorsEl.classList.add('hidden');
      } else {
        errorsEl.innerHTML = html;
      }

      // Show preview
      renderPreview(result.words, previewEl, container);

    } catch (error) {
      progressEl.classList.add('hidden');
      errorsEl.classList.remove('hidden');
      errorsEl.innerHTML = `<div class="error-box"><strong>❌ Error:</strong> ${escapeHtml(error.message)}</div>`;
    }
  }

  /**
   * Render word preview table
   * @param {Object[]} words
   * @param {HTMLElement} previewEl
   * @param {HTMLElement} container
   */
  function renderPreview(words, previewEl, container) {
    previewEl.classList.remove('hidden');
    previewEl.innerHTML = `
      <h3>📋 Preview — ${words.length} words found</h3>
      <div class="preview-table-wrapper">
        <table class="preview-table">
          <thead>
            <tr>
              <th>#</th>
              <th>English Word</th>
              <th>Transcription</th>
              <th>Turkmen Translation</th>
            </tr>
          </thead>
          <tbody>
            ${words.map((w, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${escapeHtml(w.word)}</td>
                <td class="transcription">${escapeHtml(w.transcription)}</td>
                <td>${escapeHtml(w.translation)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="preview-actions">
        <button class="btn btn-secondary" id="cancel-upload-btn">Cancel</button>
        <button class="btn btn-primary" id="confirm-upload-btn">
          ✨ Confirm & Categorize with AI
        </button>
      </div>
    `;

    // Confirm button
    previewEl.querySelector('#confirm-upload-btn').addEventListener('click', async () => {
      await confirmAndCategorize(words, container);
    });

    // Cancel button
    previewEl.querySelector('#cancel-upload-btn').addEventListener('click', () => {
      previewEl.classList.add('hidden');
      container.querySelector('#upload-errors').classList.add('hidden');
    });
  }

  /**
   * Confirm upload and send to Gemini for categorization
   * @param {Object[]} words
   * @param {HTMLElement} container
   */
  async function confirmAndCategorize(words, container) {
    const progressEl = container.querySelector('#upload-progress');
    const progressText = container.querySelector('#upload-progress-text');
    const previewEl = container.querySelector('#preview-section');
    const errorsEl = container.querySelector('#upload-errors');

    previewEl.classList.add('hidden');
    errorsEl.classList.add('hidden');
    progressEl.classList.remove('hidden');

    try {
      // Send to Gemini
      const categorizedWords = await GeminiAPI.categorizeWords(words, (msg) => {
        progressText.textContent = msg;
      });

      progressText.textContent = 'Saving to database...';

      // Check for existing words and remove duplicates
      const existingWords = await StorageManager.getAllWords();
      const existingSet = new Set(existingWords.map(w => w.word.toLowerCase()));
      const newWords = categorizedWords.filter(w => !existingSet.has(w.word.toLowerCase()));
      const skippedCount = categorizedWords.length - newWords.length;

      if (newWords.length > 0) {
        await StorageManager.addWords(newWords);
      }

      progressEl.classList.add('hidden');

      let message = `Successfully uploaded ${newWords.length} words!`;
      if (skippedCount > 0) {
        message += ` (${skippedCount} duplicates skipped)`;
      }
      showToast(message, 'success');

      // Update word count in header
      if (typeof App !== 'undefined' && App.updateWordCount) {
        App.updateWordCount();
      }

      // Navigate to word table
      window.location.hash = '#/table';

    } catch (error) {
      progressEl.classList.add('hidden');
      errorsEl.classList.remove('hidden');
      errorsEl.innerHTML = `
        <div class="error-box">
          <strong>❌ Categorization Error:</strong> ${escapeHtml(error.message)}
          <br><br>
          <button class="btn btn-secondary" id="retry-upload-btn">Try Again</button>
        </div>
      `;
      errorsEl.querySelector('#retry-upload-btn')?.addEventListener('click', () => {
        window.location.hash = '#/upload';
      });
    }
  }

  return {
    parseFile,
    renderUploadUI,
  };
})();
