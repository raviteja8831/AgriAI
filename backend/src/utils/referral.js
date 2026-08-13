// Mirrors mobile/src/utils/referral.js — codes are derived from the user id
// (no separate code column needed), so decoding just reverses the encoding.
const CODE_PREFIX = 'AGRI';
const CODE_OFFSET = 1000;

exports.getReferralCode = (userId) => {
  if (!userId) return '';
  return `${CODE_PREFIX}${(Number(userId) + CODE_OFFSET).toString(36).toUpperCase()}`;
};

exports.decodeReferralCode = (code) => {
  if (typeof code !== 'string' || !code.toUpperCase().startsWith(CODE_PREFIX)) return null;
  const value = parseInt(code.slice(CODE_PREFIX.length), 36);
  if (!Number.isFinite(value)) return null;
  const userId = value - CODE_OFFSET;
  return userId > 0 ? userId : null;
};
