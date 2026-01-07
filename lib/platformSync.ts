/**
 * Platform Sync Detection and Warnings (Issue #25)
 *
 * The WebAuthn API does NOT expose whether a passkey is synced to the cloud.
 * This module provides:
 * 1. Heuristic detection based on platform/browser
 * 2. localStorage persistence for user confirmation
 * 3. Weekly reminder logic for at-risk users
 */

import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export type SyncLikelihood = 'likely' | 'unlikely' | 'unknown';

export type SyncUserChoice = 'yes' | 'no' | 'not-sure';

export interface SyncStatus {
  /** Heuristic-estimated sync likelihood based on platform */
  heuristic: SyncLikelihood;
  /** User's explicit confirmation (null if not yet confirmed) */
  userChoice: SyncUserChoice | null;
  /** Timestamp when user confirmed their choice */
  confirmedAt: number | null;
  /** Timestamp of last reminder shown */
  lastReminderAt: number | null;
  /** Whether user has dismissed the current reminder */
  reminderDismissed: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'veridex_sync_status';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// ============================================================================
// Platform Detection Heuristic
// ============================================================================

/**
 * Estimate whether the user's passkey is likely synced to the cloud
 * based on platform and browser detection.
 *
 * - Apple devices (iPhone/iPad/Mac) → likely (iCloud Keychain)
 * - Android + Chrome → likely (Google Password Manager)
 * - Windows → unlikely (Windows Hello has no automatic sync)
 * - Other → unknown
 */
export function estimateSyncStatus(): SyncLikelihood {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }

  const ua = navigator.userAgent;

  // Apple devices with iCloud likely enabled
  if (/iPhone|iPad|Mac/.test(ua)) {
    return 'likely';
  }

  // Android with Chrome (Google sync likely)
  if (/Android/.test(ua) && /Chrome/.test(ua)) {
    return 'likely';
  }

  // Windows Hello - no automatic sync
  if (/Windows/.test(ua)) {
    return 'unlikely';
  }

  // Linux, hardware security keys, or other unknown platforms
  return 'unknown';
}

/**
 * Get a human-readable platform name for display
 */
export function getPlatformName(): string {
  if (typeof navigator === 'undefined') {
    return 'Unknown';
  }

  const ua = navigator.userAgent;

  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Linux/.test(ua)) return 'Linux';

  return 'Unknown';
}

// ============================================================================
// Persistence
// ============================================================================

/**
 * Get the current sync status from localStorage
 */
export function getSyncStatus(): SyncStatus {
  if (typeof window === 'undefined') {
    return {
      heuristic: estimateSyncStatus(),
      userChoice: null,
      confirmedAt: null,
      lastReminderAt: null,
      reminderDismissed: false,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<SyncStatus>;
      return {
        heuristic: parsed.heuristic ?? estimateSyncStatus(),
        userChoice: parsed.userChoice ?? null,
        confirmedAt: parsed.confirmedAt ?? null,
        lastReminderAt: parsed.lastReminderAt ?? null,
        reminderDismissed: parsed.reminderDismissed ?? false,
      };
    }
  } catch (err) {
    logger.warn('Failed to parse sync status from localStorage:', err);
  }

  return {
    heuristic: estimateSyncStatus(),
    userChoice: null,
    confirmedAt: null,
    lastReminderAt: null,
    reminderDismissed: false,
  };
}

/**
 * Save sync status to localStorage
 */
export function saveSyncStatus(status: SyncStatus): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
  } catch (err) {
    logger.warn('Failed to save sync status to localStorage:', err);
  }
}

/**
 * Record the user's sync confirmation choice
 */
export function confirmSyncChoice(choice: SyncUserChoice): void {
  const current = getSyncStatus();
  saveSyncStatus({
    ...current,
    userChoice: choice,
    confirmedAt: Date.now(),
    lastReminderAt: null,
    reminderDismissed: false,
  });
}

/**
 * Clear sync status (e.g., when deleting credential)
 */
export function clearSyncStatus(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    logger.warn('Failed to clear sync status from localStorage:', err);
  }
}

// ============================================================================
// Risk Assessment
// ============================================================================

/**
 * Determine if the user should be shown a warning banner
 * Returns true if:
 * - User has not confirmed their sync status, OR
 * - User explicitly said "no" or "not-sure"
 */
export function shouldShowWarningBanner(): boolean {
  const status = getSyncStatus();

  // Not confirmed yet → show banner
  if (status.userChoice === null) {
    return true;
  }

  // User confirmed synced → no banner
  if (status.userChoice === 'yes') {
    return false;
  }

  // User said no or not-sure → show banner
  return true;
}

/**
 * Check if it's time to show a weekly reminder
 * Only shows reminder if:
 * - User is at risk (no/not-sure)
 * - At least one week has passed since last reminder
 * - User hasn't dismissed the current reminder
 */
export function shouldShowWeeklyReminder(): boolean {
  const status = getSyncStatus();

  // Only for at-risk users
  if (status.userChoice === 'yes' || status.userChoice === null) {
    return false;
  }

  // Check if reminder was dismissed
  if (status.reminderDismissed) {
    return false;
  }

  // Check if a week has passed since last reminder
  const lastReminder = status.lastReminderAt ?? status.confirmedAt ?? 0;
  const now = Date.now();

  return now - lastReminder >= ONE_WEEK_MS;
}

/**
 * Record that a reminder was shown
 */
export function recordReminderShown(): void {
  const current = getSyncStatus();
  saveSyncStatus({
    ...current,
    lastReminderAt: Date.now(),
    reminderDismissed: false,
  });
}

/**
 * Record that user dismissed the reminder
 */
export function dismissReminder(): void {
  const current = getSyncStatus();
  saveSyncStatus({
    ...current,
    reminderDismissed: true,
  });
}

// ============================================================================
// Platform-Specific Guidance
// ============================================================================

export interface SyncInstructions {
  platform: string;
  steps: string[];
  note?: string;
}

/**
 * Get platform-specific instructions for enabling passkey sync
 */
export function getSyncInstructions(): SyncInstructions {
  const platform = getPlatformName();

  switch (platform) {
    case 'iPhone':
    case 'iPad':
    case 'Mac':
      return {
        platform: 'Apple',
        steps: [
          'Go to Settings > [Your Name] > iCloud',
          'Enable "Keychain"',
          'Your passkeys will sync across Apple devices signed in with the same Apple ID',
        ],
        note: 'Requires iOS 16+ / macOS Ventura+',
      };

    case 'Android':
      return {
        platform: 'Android / Chrome',
        steps: [
          'Open Chrome Settings > Passwords',
          'Ensure "Offer to save passwords" is enabled',
          'Sign in to Google to sync across devices',
        ],
        note: 'Requires Android 14+ or Chrome 118+',
      };

    case 'Windows':
      return {
        platform: 'Windows',
        steps: [
          'Windows Hello passkeys do not sync by default',
          'Consider registering a backup passkey on a mobile device',
          'Or use a cross-platform authenticator like a hardware security key',
        ],
        note: 'Windows passkeys are device-bound',
      };

    default:
      return {
        platform: 'Unknown Platform',
        steps: [
          'Check your browser/OS settings for passkey sync options',
          'Consider registering a backup passkey on another device',
        ],
      };
  }
}

/**
 * Check if user needs to confirm sync status (first time after registration)
 */
export function needsSyncConfirmation(): boolean {
  const status = getSyncStatus();
  return status.userChoice === null;
}

/**
 * Get risk level for display purposes
 */
export function getRiskLevel(): 'low' | 'medium' | 'high' {
  const status = getSyncStatus();

  // Confirmed synced
  if (status.userChoice === 'yes') {
    return 'low';
  }

  // Heuristic says likely synced but not confirmed
  if (status.userChoice === null && status.heuristic === 'likely') {
    return 'medium';
  }

  // Explicitly not synced
  if (status.userChoice === 'no') {
    return 'high';
  }

  // Not sure or unknown heuristic
  return 'medium';
}
