/**
 * Platform Sync Detection Tests (Issue #25)
 *
 * Tests for the platform sync heuristic, localStorage persistence,
 * and weekly reminder logic.
 */

import {
  estimateSyncStatus,
  getPlatformName,
  getSyncStatus,
  saveSyncStatus,
  confirmSyncChoice,
  clearSyncStatus,
  shouldShowWarningBanner,
  shouldShowWeeklyReminder,
  recordReminderShown,
  dismissReminder,
  getSyncInstructions,
  needsSyncConfirmation,
  getRiskLevel,
  SyncStatus,
  SyncUserChoice,
} from '../platformSync';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
});

// Mock navigator.userAgent
const mockUserAgent = (ua: string) => {
  Object.defineProperty(navigator, 'userAgent', {
    value: ua,
    writable: true,
    configurable: true,
  });
};

describe('Platform Sync Detection', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe('estimateSyncStatus', () => {
    it('returns "likely" for iPhone', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)');
      expect(estimateSyncStatus()).toBe('likely');
    });

    it('returns "likely" for iPad', () => {
      mockUserAgent('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)');
      expect(estimateSyncStatus()).toBe('likely');
    });

    it('returns "likely" for Mac', () => {
      mockUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      expect(estimateSyncStatus()).toBe('likely');
    });

    it('returns "likely" for Android with Chrome', () => {
      mockUserAgent('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/118.0');
      expect(estimateSyncStatus()).toBe('likely');
    });

    it('returns "unlikely" for Windows', () => {
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      expect(estimateSyncStatus()).toBe('unlikely');
    });

    it('returns "unknown" for Linux', () => {
      mockUserAgent('Mozilla/5.0 (X11; Linux x86_64)');
      expect(estimateSyncStatus()).toBe('unknown');
    });
  });

  describe('getPlatformName', () => {
    it('returns "iPhone" for iPhone user agent', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)');
      expect(getPlatformName()).toBe('iPhone');
    });

    it('returns "Mac" for macOS user agent', () => {
      mockUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      expect(getPlatformName()).toBe('Mac');
    });

    it('returns "Windows" for Windows user agent', () => {
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      expect(getPlatformName()).toBe('Windows');
    });
  });

  describe('Persistence', () => {
    it('getSyncStatus returns default values when nothing stored', () => {
      const status = getSyncStatus();
      expect(status.userChoice).toBeNull();
      expect(status.confirmedAt).toBeNull();
      expect(status.lastReminderAt).toBeNull();
      expect(status.reminderDismissed).toBe(false);
    });

    it('saveSyncStatus persists to localStorage', () => {
      const status: SyncStatus = {
        heuristic: 'likely',
        userChoice: 'yes',
        confirmedAt: Date.now(),
        lastReminderAt: null,
        reminderDismissed: false,
      };
      saveSyncStatus(status);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('confirmSyncChoice saves user choice', () => {
      confirmSyncChoice('no');
      const status = getSyncStatus();
      expect(status.userChoice).toBe('no');
      expect(status.confirmedAt).not.toBeNull();
    });

    it('clearSyncStatus removes from localStorage', () => {
      confirmSyncChoice('yes');
      clearSyncStatus();
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('Warning Banner Logic', () => {
    it('shows banner when user has not confirmed', () => {
      expect(shouldShowWarningBanner()).toBe(true);
    });

    it('hides banner when user confirms "yes"', () => {
      confirmSyncChoice('yes');
      expect(shouldShowWarningBanner()).toBe(false);
    });

    it('shows banner when user says "no"', () => {
      confirmSyncChoice('no');
      expect(shouldShowWarningBanner()).toBe(true);
    });

    it('shows banner when user is "not-sure"', () => {
      confirmSyncChoice('not-sure');
      expect(shouldShowWarningBanner()).toBe(true);
    });
  });

  describe('Weekly Reminder Logic', () => {
    it('does not show reminder for confirmed synced users', () => {
      confirmSyncChoice('yes');
      expect(shouldShowWeeklyReminder()).toBe(false);
    });

    it('does not show reminder when not confirmed', () => {
      expect(shouldShowWeeklyReminder()).toBe(false);
    });

    it('shows reminder for "no" users after a week', () => {
      // Confirm choice a week ago
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000) - 1000;
      saveSyncStatus({
        heuristic: 'unlikely',
        userChoice: 'no',
        confirmedAt: oneWeekAgo,
        lastReminderAt: null,
        reminderDismissed: false,
      });
      expect(shouldShowWeeklyReminder()).toBe(true);
    });

    it('does not show reminder if dismissed', () => {
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000) - 1000;
      saveSyncStatus({
        heuristic: 'unlikely',
        userChoice: 'no',
        confirmedAt: oneWeekAgo,
        lastReminderAt: null,
        reminderDismissed: true,
      });
      expect(shouldShowWeeklyReminder()).toBe(false);
    });

    it('recordReminderShown updates lastReminderAt', () => {
      confirmSyncChoice('no');
      recordReminderShown();
      const status = getSyncStatus();
      expect(status.lastReminderAt).not.toBeNull();
    });

    it('dismissReminder sets reminderDismissed', () => {
      confirmSyncChoice('no');
      dismissReminder();
      const status = getSyncStatus();
      expect(status.reminderDismissed).toBe(true);
    });
  });

  describe('Platform Instructions', () => {
    it('returns Apple instructions for iPhone', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)');
      const instructions = getSyncInstructions();
      expect(instructions.platform).toBe('Apple');
      expect(instructions.steps.length).toBeGreaterThan(0);
    });

    it('returns Android instructions for Android Chrome', () => {
      mockUserAgent('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/118.0');
      const instructions = getSyncInstructions();
      expect(instructions.platform).toBe('Android / Chrome');
    });

    it('returns Windows instructions for Windows', () => {
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      const instructions = getSyncInstructions();
      expect(instructions.platform).toBe('Windows');
      expect(instructions.steps.some(s => s.includes("don't sync"))).toBe(true);
    });
  });

  describe('Risk Assessment', () => {
    it('needsSyncConfirmation returns true initially', () => {
      expect(needsSyncConfirmation()).toBe(true);
    });

    it('needsSyncConfirmation returns false after confirmation', () => {
      confirmSyncChoice('yes');
      expect(needsSyncConfirmation()).toBe(false);
    });

    it('getRiskLevel returns "low" for synced users', () => {
      confirmSyncChoice('yes');
      expect(getRiskLevel()).toBe('low');
    });

    it('getRiskLevel returns "high" for non-synced users', () => {
      confirmSyncChoice('no');
      expect(getRiskLevel()).toBe('high');
    });

    it('getRiskLevel returns "medium" for unsure users', () => {
      confirmSyncChoice('not-sure');
      expect(getRiskLevel()).toBe('medium');
    });
  });
});
