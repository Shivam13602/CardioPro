/**
 * A collection of motivational quotes for workouts
 */

// List of motivational quotes
const MOTIVATIONAL_QUOTES = [
  "The only bad workout is the one that didn't happen.",
  "No matter how slow you go, you're still lapping everyone on the couch.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Fitness is not about being better than someone else, it's about being better than you used to be.",
  "The harder you work, the luckier you get.",
  "Success starts with self-discipline.",
  "The only place where success comes before work is in the dictionary.",
  "Don't stop when you're tired. Stop when you're done.",
  "Sweat is just fat crying.",
  "Sore today, strong tomorrow.",
  "Train insane or remain the same.",
  "Your health is an investment, not an expense.",
  "What seems impossible today will soon become your warm-up.",
  "The difference between try and triumph is a little umph.",
  "Good things come to those who sweat.",
  "The best project you'll ever work on is you.",
  "You don't have to be great to start, but you have to start to be great.",
  "Push harder than yesterday if you want a different tomorrow.",
  "Be stronger than your excuses.",
  "Don't wish for it, work for it.",
  "It's going to be a journey. It's not a sprint to get in shape.",
  "The body achieves what the mind believes.",
  "Motivation is what gets you started. Habit is what keeps you going.",
  "It never gets easier, you just get stronger.",
  "You're only one workout away from a good mood.",
  "The only person you are destined to become is the person you decide to be.",
  "Strive for progress, not perfection.",
  "Fall in love with taking care of your body.",
  "Believe you can and you're halfway there.",
  "The hard days are the best because that's when champions are made.",
  "If it doesn't challenge you, it doesn't change you.",
  "The successful warrior is the average person with laser-like focus.",
  "Today I will do what others won't, so tomorrow I can accomplish what others can't.",
  "Every step is progress, no matter how small.",
  "What you do today can improve all your tomorrows.",
  "You don't find willpower, you create it.",
  "Just believe in yourself. Even if you don't, pretend that you do and, at some point, you will.",
  "The only way to define your limits is by going beyond them.",
  "Do something today that your future self will thank you for."
];

/**
 * Get a random motivational quote
 * @returns {string} - A random motivational quote
 */
export const getRandomMotivationalQuote = () => {
  const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[randomIndex];
};

/**
 * Get a specific motivational quote by index
 * @param {number} index - Index of the quote to get
 * @returns {string} - The motivational quote at the specified index
 */
export const getQuoteByIndex = (index) => {
  if (index < 0 || index >= MOTIVATIONAL_QUOTES.length) {
    return getRandomMotivationalQuote();
  }
  return MOTIVATIONAL_QUOTES[index];
};

/**
 * Get all motivational quotes
 * @returns {string[]} - All motivational quotes
 */
export const getAllQuotes = () => {
  return [...MOTIVATIONAL_QUOTES];
};

/**
 * Get a set of quotes for a sequence
 * @param {number} count - Number of quotes to get
 * @returns {string[]} - Array of motivational quotes
 */
export const getQuoteSequence = (count) => {
  const quotes = [];
  const totalQuotes = MOTIVATIONAL_QUOTES.length;
  
  // If requesting more quotes than available, return all quotes
  if (count >= totalQuotes) {
    return [...MOTIVATIONAL_QUOTES];
  }
  
  // Get random quotes without repeating
  const usedIndices = new Set();
  while (quotes.length < count) {
    const randomIndex = Math.floor(Math.random() * totalQuotes);
    if (!usedIndices.has(randomIndex)) {
      usedIndices.add(randomIndex);
      quotes.push(MOTIVATIONAL_QUOTES[randomIndex]);
    }
  }
  
  return quotes;
}; 