import AsyncStorage from '@react-native-async-storage/async-storage';

// Local-only wallet balances — there's no backend wallet/ledger yet, so these
// just persist a per-user number on-device and credit a one-time joining
// bonus the first time they're read. Real accrual (e.g. crediting a reward
// once a referred friend actually signs up) needs backend support to detect
// that event and isn't wired up here.
const CASHBACK_JOINING_BONUS = 100;
const COINS_JOINING_BONUS = 1000;

const cashbackKeyFor = (userId) => `cashback_balance_${userId}`;
const coinsKeyFor = (userId) => `coins_balance_${userId}`;

const getBalance = async (userId, key, joiningBonus) => {
  if (!userId) return 0;
  const stored = await AsyncStorage.getItem(key);
  if (stored !== null) return Number(stored);
  await AsyncStorage.setItem(key, String(joiningBonus));
  return joiningBonus;
};

const addBalance = async (userId, key, joiningBonus, amount) => {
  if (!userId) return 0;
  const current = await getBalance(userId, key, joiningBonus);
  const next = current + amount;
  await AsyncStorage.setItem(key, String(next));
  return next;
};

export const getCashbackBalance = (userId) =>
  getBalance(userId, cashbackKeyFor(userId), CASHBACK_JOINING_BONUS);

export const addCashback = (userId, amount) =>
  addBalance(userId, cashbackKeyFor(userId), CASHBACK_JOINING_BONUS, amount);

export const getCoinsBalance = (userId) =>
  getBalance(userId, coinsKeyFor(userId), COINS_JOINING_BONUS);

export const addCoins = (userId, amount) =>
  addBalance(userId, coinsKeyFor(userId), COINS_JOINING_BONUS, amount);
