// Deterministic per-user referral code — no backend storage needed since it's
// derived from the user's own id, so it's stable and unique across accounts.
export const getReferralCode = (user) => {
  if (!user?.id) return '';
  return `AGRI${(Number(user.id) + 1000).toString(36).toUpperCase()}`;
};

export const getReferralLink = (code) => `https://agriai.app/invite/${code}`;

export const getReferralMessage = (user) => {
  const code = getReferralCode(user);
  return `Join me on AgriAI — smart farming tools for better yields! Use my referral code ${code} when you sign up: ${getReferralLink(code)}`;
};
