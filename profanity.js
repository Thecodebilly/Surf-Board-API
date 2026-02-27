const PROFANITY_TERMS = [
  'anal',
  'anus',
  'arse',
  'ass',
  'asshole',
  'bastard',
  'bitch',
  'blowjob',
  'bollock',
  'boner',
  'boob',
  'bullshit',
  'buttplug',
  'clit',
  'cock',
  'coon',
  'crap',
  'cum',
  'cunt',
  'damn',
  'deepthroat',
  'dick',
  'dildo',
  'dyke',
  'fag',
  'faggot',
  'felch',
  'fellatio',
  'fuck',
  'fucker',
  'fucking',
  'goddamn',
  'handjob',
  'hardcore',
  'hentai',
  'homo',
  'jackass',
  'jerkoff',
  'jizz',
  'kike',
  'labia',
  'milf',
  'motherfucker',
  'nazi',
  'nigga',
  'nigger',
  'penis',
  'piss',
  'porn',
  'pornhub',
  'prick',
  'pussy',
  'queer',
  'rimjob',
  'schlong',
  'scrotum',
  'sex',
  'shit',
  'slut',
  'spic',
  'suck',
  'testicle',
  'tit',
  'twat',
  'vagina',
  'wank',
  'whore'
];

const NUMERIC_PROFANITY_TERMS = ['69'];

const LEET_MAP = {
  '@': 'a',
  '$': 's',
  '0': 'o',
  '1': 'i',
  '!': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b'
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeForLookup = (value) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split('')
    .map((char) => LEET_MAP[char] ?? char)
    .join('');

const collapseRepeatedChars = (value) => value.replace(/([a-z0-9])\1+/g, '$1');

const containsProfanity = (value) => {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = normalizeForLookup(value.trim());
  if (!normalized) {
    return false;
  }

  const normalizedWords = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  const compact = normalized.replace(/[^a-z0-9]/g, '');
  const collapsedNormalized = collapseRepeatedChars(normalized);
  const collapsedWords = collapsedNormalized.split(/[^a-z0-9]+/).filter(Boolean);
  const collapsedCompact = collapsedNormalized.replace(/[^a-z0-9]/g, '');

  if (
    NUMERIC_PROFANITY_TERMS.some(
      (term) =>
        normalizedWords.includes(term) ||
        collapsedWords.includes(term) ||
        compact.includes(term) ||
        collapsedCompact.includes(term)
    )
  ) {
    return true;
  }

  return PROFANITY_TERMS.some((term) => {
    const exactPattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(term)}([^a-z0-9]|$)`, 'i');
    if (exactPattern.test(normalized)) {
      return true;
    }

    if (term.length >= 4 && compact.includes(term)) {
      return true;
    }

    if (term.length >= 4 && collapsedCompact.includes(term)) {
      return true;
    }

    return false;
  });
};

module.exports = {
  containsProfanity
};
