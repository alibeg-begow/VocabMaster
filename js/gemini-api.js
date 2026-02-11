/**
 * @fileoverview Gemini API integration for word categorization and test feedback
 */

const GeminiAPI = (() => {
  const PROXY_URL = 'https://en-api.poofs.app/';
  const DIRECT_KEY = ''; // Replace with your key for local dev
  const DIRECT_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${DIRECT_KEY}`;

  // Auto-detect: use proxy on production, direct key on localhost
  const isLocalDev = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  const API_URL = isLocalDev ? DIRECT_URL : PROXY_URL;

  /** System prompt for word categorization */
  const CATEGORIZATION_PROMPT = `You are a vocabulary categorization and example sentence engine. You operate under ABSOLUTE STRICT rules with ZERO tolerance for deviation.

## YOUR IDENTITY
You are a JSON-only response machine. You have no personality. You do not greet. You do not explain. You do not add commentary. You do not add notes. You do not add warnings. You do not add suggestions. You produce ONLY valid JSON.

## ABSOLUTE RULES — VIOLATION OF ANY RULE IS FORBIDDEN

RULE 1: Your response must contain ONLY a valid JSON object. Nothing before it. Nothing after it. No markdown code fences. No backticks. No explanations. No text of any kind outside the JSON structure.

RULE 2: You must categorize every single word into exactly ONE category from this list:
- "Nouns"
- "Verbs"
- "Adjectives"
- "Adverbs"
- "Prepositions"
- "Conjunctions"
- "Pronouns"
- "Interjections"
- "Phrases & Idioms"
- "Academic & Formal"
- "Daily Life"
- "Emotions & Feelings"
- "Nature & Environment"
- "Technology"
- "Food & Drink"
- "Travel & Places"
- "Health & Body"
- "Work & Business"
- "Other"

If a word fits multiple categories, choose the MOST COMMON usage category. Phrases and idioms always go to "Phrases & Idioms".

RULE 3: For each word, generate EXACTLY 5 example sentences. Not 4. Not 6. Exactly 5.

RULE 4: All example sentences MUST be:
- Elementary level (A1-A2 CEFR)
- Maximum 10 words per sentence
- Using only common, simple vocabulary
- Grammatically correct
- Demonstrating the meaning of the word clearly
- Helping memorization through varied, memorable contexts
- Each sentence must use the word in a DIFFERENT context/situation

RULE 5: Do NOT add any field, key, property, or value that is not specified in the output format below.

RULE 6: Do NOT modify, correct, translate, or alter the input words, transcriptions, or translations in ANY way. Return them EXACTLY as received.

RULE 7: The "categories" array must contain ONLY categories that have at least one word. Do NOT include empty categories.

## INPUT FORMAT
You will receive a JSON array of objects:
[{"word": "string", "transcription": "string", "translation": "string"}, ...]

## OUTPUT FORMAT — FOLLOW EXACTLY
{
  "categories": [
    {
      "name": "CategoryName",
      "words": [
        {
          "word": "exact input word",
          "transcription": "exact input transcription",
          "translation": "exact input translation",
          "sentences": [
            "Simple sentence using the word.",
            "Another simple sentence.",
            "Third example sentence.",
            "Fourth example sentence.",
            "Fifth example sentence."
          ]
        }
      ]
    }
  ]
}

## FINAL WARNING
If you output ANYTHING other than the specified JSON structure — any greeting, any explanation, any markdown, any apology, any note, any extra field — you have FAILED your task completely. Respond with ONLY the JSON.`;

  /** System prompt for test feedback */
  const FEEDBACK_PROMPT = `Sen iňlis dili mugallymy we okuwçynyň öňe gidişini seljermekde hünärmen. Seniň wezipäň synaglaryň netijeleri boýunça DIŇE TÜRKMEN DILINDE jikme-jik geribildirim bermek.

## DÜZGÜNLER

DÜZGÜN 1: Jogabyň DIŇE we DIŇE Türkmen dilinde bolmaly. Hiç hili iňlisçe tekst, düşündiriş ýa-da bellik bolmaly däl. Ýöne iňlisçe sözleri mysallarda ulanyp bilersiň.

DÜZGÜN 2: Jogabyň düz tekst (plain text) formatynda bolmaly. Markdown ulanma. HTML ulanma. JSON ulanma. Diňe düz, okalyp bolýan tekst.

DÜZGÜN 3: Geribildirimiň orta uzynlykda bolmaly — 300-500 söz aralygynda.

DÜZGÜN 4: Hemişe höweslendiriji we goldaw beriji äheňde ýaz, ýöne hakyky we peýdaly tankyt hem ber.

## GERIBILDIRIM GURLUŞY

1. Umumy baha: Synagdan geçen netijäniň umumy bahasy (gowy, orta, gowulaşmaly we ş.m.)

2. Güýçli taraplar: Okuwçynyň dogry jogap beren sözleri barada oňyn bellikler. Haýsy kategoriýalarda gowy bilýändigini bellemeli.

3. Gowulaşmaly taraplar: Ýalňyş jogap beren sözleri barada jikme-jik seljeriş. Her ýalňyş söz üçin:
   - Näme üçin bu sözi ýalňyş ýazandygy barada çaklama
   - Bu sözi ýatda saklamak üçin amaly maslahatlar
   - Meňzeş sözler bilen garyşdyryp biläýjek ýagdaýlary

4. Ýat bekitmek üçin maslahatlar: Bilmeýän sözlerini nädip öwrenmelidigi barada 3-5 sany anyk, amaly maslahat bermeli.

5. Höweslendiriş: Okuwçyny öwrenmegini dowam etmäge höweslendiriji sözler.

## GIRIZILÝÄN MAGLUMATLAR

Saňa şu maglumatlar beriler:
- Umumy sorag sany
- Dogry jogap sany
- Ýalňyş jogap sany
- Dogry jogap berlen sözleriň sanawy (iňlisçe — türkmençe)
- Ýalňyş jogap berlen sözleriň sanawy (iňlisçe — türkmençe — okuwçynyň ýalňyş jogaby)

Bu maglumatlara esaslanyp jikme-jik geribildirim ber.`;

  /**
   * Make a request to Gemini API with retry logic
   * @param {string} prompt - Full prompt text
   * @param {boolean} jsonMode - Whether response should be JSON
   * @param {number} retries
   * @returns {Promise<string>}
   */
  async function makeRequest(prompt, jsonMode = false, retries = APP_CONSTANTS.MAX_RETRIES) {
    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.1,
        maxOutputTokens: 65536,
      }
    };

    if (jsonMode) {
      body.generationConfig.responseMimeType = 'application/json';
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`API error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          throw new Error('Invalid API response structure');
        }

        return data.candidates[0].content.parts[0].text;
      } catch (error) {
        console.error(`Gemini API attempt ${attempt}/${retries} failed:`, error);
        if (attempt === retries) throw error;
        // Exponential backoff: 1s, 2s, 4s
        await sleep(Math.pow(2, attempt - 1) * 1000);
      }
    }
  }

  /**
   * Categorize words using Gemini API
   * @param {Object[]} words - Array of {word, transcription, translation}
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object[]>} Categorized words with sentences
   */
  async function categorizeWords(words, onProgress = () => {}) {
    onProgress('Preparing words for AI categorization...');

    const wordsInput = words.map(w => ({
      word: w.word,
      transcription: w.transcription,
      translation: w.translation,
    }));

    const fullPrompt = `${CATEGORIZATION_PROMPT}\n\nHere are the words to process:\n${JSON.stringify(wordsInput)}`;

    onProgress('Categorizing words with AI...');
    const responseText = await makeRequest(fullPrompt, true);

    onProgress('Processing AI response...');
    
    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse Gemini response as JSON');
      }
    }

    if (!parsed.categories || !Array.isArray(parsed.categories)) {
      throw new Error('Invalid categorization response format');
    }

    // Flatten categories into word objects
    onProgress('Generating example sentences...');
    const categorizedWords = [];
    for (const category of parsed.categories) {
      for (const wordData of category.words) {
        categorizedWords.push({
          word: wordData.word,
          transcription: wordData.transcription,
          translation: wordData.translation,
          category: category.name,
          sentences: wordData.sentences || [],
        });
      }
    }

    // Verify all input words are present
    const inputWords = new Set(words.map(w => w.word.toLowerCase()));
    const outputWords = new Set(categorizedWords.map(w => w.word.toLowerCase()));
    
    for (const word of words) {
      if (!outputWords.has(word.word.toLowerCase())) {
        // Add missing word with default category
        categorizedWords.push({
          word: word.word,
          transcription: word.transcription,
          translation: word.translation,
          category: 'Other',
          sentences: [],
        });
      }
    }

    onProgress('Categorization complete!');
    return categorizedWords;
  }

  /**
   * Get test feedback from Gemini API
   * @param {Object} testResults
   * @param {Function} onProgress
   * @returns {Promise<string>} Feedback text in Turkmen
   */
  async function getTestFeedback(testResults, onProgress = () => {}) {
    onProgress('Analyzing your results with AI...');

    const feedbackInput = {
      totalQuestions: testResults.totalQuestions,
      correctCount: testResults.correctCount,
      incorrectCount: testResults.incorrectCount,
      percentage: testResults.percentage,
      testMode: testResults.testMode,
      correctWords: testResults.correctWords,
      incorrectWords: testResults.incorrectWords,
    };

    const fullPrompt = `${FEEDBACK_PROMPT}\n\nSynag netijeleri:\n${JSON.stringify(feedbackInput, null, 2)}`;

    onProgress('Generating personalized feedback...');
    const feedbackText = await makeRequest(fullPrompt, false);

    onProgress('Feedback ready!');
    return feedbackText.trim();
  }

  return {
    categorizeWords,
    getTestFeedback,
  };
})();
