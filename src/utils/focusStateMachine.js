/**
 * Focus Loop State Machine
 * States: Idle, Focusing, Warning, Penalizing, Breaking
 */

export const FOCUS_STATES = {
  IDLE: 'idle',
  FOCUSING: 'focusing',
  WARNING: 'warning',
  PENALIZING: 'penalizing',
  BREAKING: 'breaking',
};

export class FocusStateMachine {
  constructor() {
    this.state = FOCUS_STATES.IDLE;
    this.authorizedExit = false;
    this.listeners = [];
    this.hpDrainListeners = [];
    this.warningTimer = null;
    this.hpDrainInterval = null;
  }

  setAuthorizedExit(value) {
    this.authorizedExit = value;
  }

  /**
   * Subscribe to state changes
   * @param {Function} callback - Callback function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Subscribe to HP drain events
   * @param {Function} callback - Callback function that receives damage amount
   */
  onHPDrain(callback) {
    this.hpDrainListeners.push(callback);
    return () => {
      this.hpDrainListeners = this.hpDrainListeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners of state change
   */
  notify() {
    this.listeners.forEach(callback => callback(this.state));
  }

  /**
   * Transition to a new state
   * @param {string} newState - New state
   */
  transition(newState) {
    if (Object.values(FOCUS_STATES).includes(newState)) {
      this.state = newState;
      this.notify();
    }
  }

  /**
   * Start focus session
   */
  startFocus() {
    this.transition(FOCUS_STATES.FOCUSING);
    this.setupVisibilityListeners();
  }

  /**
   * Start break phase
   */
  startBreak() {
    this.clearTimers();
    this.transition(FOCUS_STATES.BREAKING);
  }

  /**
   * Setup document visibility listeners for yellow zone
   */
  setupVisibilityListeners() {
    const handleVisibilityChange = () => {
      if (this.authorizedExit) return; // Skip penalty if authorized

      if (document.hidden && this.state === FOCUS_STATES.FOCUSING) {
        this.transition(FOCUS_STATES.WARNING);
        // Start 5 second countdown before HP drain
        this.warningTimer = setTimeout(() => {
          this.transition(FOCUS_STATES.PENALIZING);
          this.startHPDrain();
        }, 5000);
      } else if (!document.hidden && this.state === FOCUS_STATES.WARNING) {
        this.clearWarningTimer();
        this.transition(FOCUS_STATES.FOCUSING);
      } else if (!document.hidden && this.state === FOCUS_STATES.PENALIZING) {
        this.stopHPDrain();
        this.transition(FOCUS_STATES.FOCUSING);
      }
    };

    const handleBlur = () => {
      if (this.state === FOCUS_STATES.FOCUSING) {
        handleVisibilityChange();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    // Store cleanup function
    this.cleanup = () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      this.clearTimers();
    };
  }

  /**
   * Start HP drain (10 HP every 5 seconds)
   */
  startHPDrain() {
    if (this.hpDrainInterval) return;

    // Apply immediate damage once upon entering penalty
    this.hpDrainListeners.forEach(callback => {
      if (typeof callback === 'function') {
        callback(10);
      }
    });

    this.hpDrainInterval = setInterval(() => {
      // Emit HP drain event to all HP drain listeners
      this.hpDrainListeners.forEach(callback => {
        if (typeof callback === 'function') {
          callback(10);
        }
      });
    }, 5000);
  }

  /**
   * Stop HP drain
   */
  stopHPDrain() {
    if (this.hpDrainInterval) {
      clearInterval(this.hpDrainInterval);
      this.hpDrainInterval = null;
    }
  }

  /**
   * Force an immediate penalty (used for extension violations)
   */
  forcePenalty() {
    this.clearWarningTimer();
    this.transition(FOCUS_STATES.PENALIZING);
    this.startHPDrain();
  }

  /**
   * Clear warning timer
   */
  clearWarningTimer() {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  /**
   * Clear all timers
   */
  clearTimers() {
    this.clearWarningTimer();
    this.stopHPDrain();
  }

  /**
   * Reset to idle state
   */
  reset() {
    this.clearTimers();
    if (this.cleanup) {
      this.cleanup();
    }
    this.transition(FOCUS_STATES.IDLE);
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }
}
