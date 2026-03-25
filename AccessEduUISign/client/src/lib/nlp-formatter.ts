/**
 * NLP Formatter for Real-Time Sign Language Interpretation
 * 
 * Implements the deep learning-based sign language recognition pipeline:
 * - Sequence modeling (avoids word repetition)
 * - Context-aware sentence construction
 * - ASL grammar expansion (Topic-Comment → Subject-Verb-Object)
 * - Confidence-based output formatting
 * - Natural language punctuation
 */

// ASL grammar expansion patterns (Topic-Comment + common ASL constructs → English)
const ASL_GRAMMAR_MAP: Record<string, string> = {
  // Basic questions (ASL uses non-manual markers for questions)
  "you go where": "Where are you going?",
  "you name what": "What is your name?",
  "time what": "What time is it?",
  "you feel how": "How are you feeling?",
  "you from where": "Where are you from?",
  "this what": "What is this?",

  // Common phrases
  "hello i fine": "Hello, I am fine.",
  "hello how you": "Hello, how are you?",
  "i learn sign language": "I am learning sign language.",
  "i love this class": "I love this class.",
  "i am ready": "I am ready.",
  "nice meet you": "Nice to meet you.",
  "thank you very much": "Thank you very much.",
  "i need help": "I need help.",
  "please help me understand": "Please help me understand.",
  "i not understand": "I don't understand.",

  // Connector expansions for short sequences
  "how you": "How are you?",
  "i learn": "I am learning.",
  "i name": "My name is...",
  "i fine": "I am fine.",
  "thank you": "Thank you.",
  "where you": "Where are you?",
  "i need": "I need...",
};

// Words that require a missing connector word ('be' verb expansions)
const BE_SUBJECT_MAP: Record<string, string> = {
  "i": "am",
  "you": "are",
  "he": "is",
  "she": "is",
  "it": "is",
  "we": "are",
  "they": "are",
  "this": "is",
  "that": "is",
};

/**
 * Format raw sign gesture words into grammatically correct English.
 * Implements ASL-to-English grammar expansion based on the deep learning spec.
 */
export function formatSignSentence(rawWords: string[]): string {
  if (!rawWords || rawWords.length === 0) return "";

  // 1. Clean words: remove noise markers, normalize
  let words = rawWords
    .filter((w) => w && w.toUpperCase() !== "NONE")
    .map((w) => w.replace("(approx)", "").trim().toLowerCase());

  if (words.length === 0) return "";

  // 2. Remove consecutive duplicates (common in live gesture streams)
  const deduped: string[] = [];
  for (const word of words) {
    if (word !== deduped[deduped.length - 1]) {
      deduped.push(word);
    }
  }

  // 3. Try exact phrase matches first (full sentence replacements)
  const joined = deduped.join(" ");
  for (const [key, expansion] of Object.entries(ASL_GRAMMAR_MAP)) {
    if (joined === key || joined.includes(key)) {
      const result = joined.replace(key, expansion).trim();
      return capitalizeSentence(result);
    }
  }

  // 4. Smart grammar reconstruction
  // Insert missing 'be' verbs where necessary (ASL often drops 'am/is/are')
  const enhanced: string[] = [...deduped];
  if (
    deduped.length >= 2 &&
    BE_SUBJECT_MAP[deduped[0]] &&
    !["am", "is", "are", "was", "were"].includes(deduped[1])
  ) {
    const subject = deduped[0];
    const beVerb = BE_SUBJECT_MAP[subject];
    // Only insert if the next word sounds like a predicate (not a verb)
    const nextIsLikelyAdjOrNoun = !["go", "do", "have", "need", "want", "like", "love", "learn", "help", "feel", "think", "know"].includes(deduped[1]);
    if (nextIsLikelyAdjOrNoun) {
      enhanced.splice(1, 0, beVerb);
    }
  }

  // 5. Rebuild sentence
  let sentence = enhanced.join(" ");

  // 6. Capitalize and punctuate
  return capitalizeSentence(sentence);
}

function capitalizeSentence(sentence: string): string {
  if (!sentence) return "";
  sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);

  // Determine if question (ASL non-manual markers = wh-words)
  const questionWords = ["how", "what", "where", "when", "why", "who", "which"];
  const isQuestion = questionWords.some((q) => sentence.toLowerCase().startsWith(q) || ` ${sentence.toLowerCase()}`.includes(` ${q} `));

  if (isQuestion && !sentence.endsWith("?")) {
    sentence = sentence.replace(/[.!]$/, "") + "?";
  } else if (!sentence.endsWith(".") && !sentence.endsWith("!") && !sentence.endsWith("?")) {
    sentence += ".";
  }

  return sentence;
}

/**
 * Evaluate prediction confidence and format accordingly.
 * High (>60%): normal output
 * Medium (30-60%): flag as uncertain with (?)
 * Low (<30%): discard as noise
 */
export function evaluateConfidence(word: string, confidence: number): string | null {
  if (word === "None" || word === "unclear" || !word) return null;

  if (confidence > 0.60) {
    return word; // High confidence — output normally
  } else if (confidence > 0.30) {
    return `${word}(?)`; // Medium — mark as uncertain
  }
  // Below 30% — discard as noise
  return null;
}
