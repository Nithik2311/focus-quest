/**
 * localStorage utilities for state persistence
 */

const STORAGE_KEYS = {
  USER: 'focus_quest_user',
  CHARACTER: 'focus_quest_character',
  STATS: 'focus_quest_stats',
  SESSION: 'focus_quest_session',
};

/**
 * Saves data to localStorage
 * @param {string} key - Storage key
 * @param {any} data - Data to store
 */
export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

/**
 * Retrieves data from localStorage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} Retrieved data or default value
 */
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

/**
 * Removes data from localStorage
 * @param {string} key - Storage key
 */
export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

/**
 * Clears all app data from localStorage
 */
export const clearAllStorage = () => {
  Object.values(STORAGE_KEYS).forEach(key => removeFromStorage(key));
};

export { STORAGE_KEYS };
