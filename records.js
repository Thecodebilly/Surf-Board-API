const { containsProfanity } = require('./profanity');

// Matches the device leaderboard, which keeps 23 characters and shows 12.
const MAX_NAME_LENGTH = 20;
// The records.score column is a Postgres INTEGER.
const MAX_SCORE = 2147483647;

// Returns { name, score } ready to insert, or { error } for a 400.
const validateRecord = (body) => {
  const { name, score } = body || {};

  if (typeof name !== 'string' || !name.trim()) {
    return { error: 'name is required and must be a non-empty string' };
  }

  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    return { error: `score is required and must be a whole number from 0 to ${MAX_SCORE}` };
  }

  const cleanName = name.trim().slice(0, MAX_NAME_LENGTH).trim();

  if (containsProfanity(cleanName)) {
    return { error: 'Profanity is not allowed in player names' };
  }

  return { name: cleanName, score };
};

module.exports = {
  validateRecord
};
