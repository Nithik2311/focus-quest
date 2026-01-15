/**
 * XP calculation module - modularized for security
 */

const XP_PER_POMODORO = 200;
const XP_PER_MINUTE_FOCUS = 0; // Flat rate as requested
export const XP_BONUS_QUEST_COMPLETION = 200; // Bonus for finishing all cycles

/**
 * Calculates XP earned for a completed Pomodoro cycle
 * @param {number} focusMinutes - Minutes spent in focus mode
 * @returns {number} XP earned
 */
export const calculatePomodoroXP = (focusMinutes) => {
  const baseXP = XP_PER_POMODORO;
  // Simple flat rate per cycle
  return baseXP;
};

/**
 * Calculates level based on total XP
 * @param {number} totalXP - Total XP accumulated
 * @returns {number} Current level
 */
export const calculateLevel = (totalXP) => {
  // Linear progression: 1000 XP per level
  // Level 1: 0-999, Level 2: 1000-1999, etc.
  return Math.floor(totalXP / 1000) + 1;
};

/**
 * Calculates XP needed for next level
 * @param {number} currentLevel - Current level
 * @returns {number} XP needed for next level
 */
export const getXPForNextLevel = (currentLevel) => {
  return currentLevel * 1000;
};

/**
 * Calculates XP progress percentage for current level
 * @param {number} totalXP - Total XP accumulated
 * @returns {number} Progress percentage (0-100)
 */
export const getLevelProgress = (totalXP) => {
  const currentLevel = calculateLevel(totalXP);
  // XP threshold where this level started
  const xpForCurrentLevel = (currentLevel - 1) * 1000;
  // XP required to reach next level
  const xpForNextLevel = currentLevel * 1000;

  const xpInCurrentLevel = totalXP - xpForCurrentLevel;
  const xpNeededForLevel = 1000; // Always 1000 per level now

  return Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100));
};
