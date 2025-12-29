'use client';

import React, { useEffect, useState } from 'react';
import {
  getSyncStatus,
  shouldShowWarningBanner,
  shouldShowWeeklyReminder,
  recordReminderShown,
  dismissReminder,
  getRiskLevel,
  getSyncInstructions,
} from '@/lib/platformSync';

interface SyncWarningBannerProps {
  /** Callback when user clicks "Add Backup Passkey" */
  onAddBackupPasskey?: () => void;
  /** Callback when user clicks "Update Sync Status" */
  onUpdateSyncStatus?: () => void;
  /** Whether to show the banner (can be controlled externally) */
  show?: boolean;
}

/**
 * Persistent warning banner shown to users who haven't confirmed
 * their passkey is synced, or who explicitly said it's not synced.
 *
 * Shows weekly reminders for at-risk users.
 */
export function SyncWarningBanner({
  onAddBackupPasskey,
  onUpdateSyncStatus,
  show,
}: SyncWarningBannerProps) {
  const [visible, setVisible] = useState(false);
  const [isReminder, setIsReminder] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Check if we should show the banner
    const shouldShow = show ?? shouldShowWarningBanner();

    if (shouldShow) {
      setVisible(true);

      // Check if this is a weekly reminder
      if (shouldShowWeeklyReminder()) {
        setIsReminder(true);
        recordReminderShown();
      }
    } else {
      setVisible(false);
    }
  }, [show]);

  const handleDismiss = () => {
    if (isReminder) {
      dismissReminder();
    }
    setVisible(false);
  };

  if (!visible) return null;

  const status = getSyncStatus();
  const riskLevel = getRiskLevel();
  const instructions = getSyncInstructions();

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'high':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-200',
          icon: 'text-red-400',
        };
      case 'medium':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          text: 'text-yellow-200',
          icon: 'text-yellow-400',
        };
      default:
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-200',
          icon: 'text-blue-400',
        };
    }
  };

  const colors = getRiskColor();

  const getMessage = () => {
    if (isReminder) {
      return 'Weekly Reminder: Your wallet may be at risk if you lose this device.';
    }

    switch (status.userChoice) {
      case 'no':
        return 'Your passkey is not synced. If you lose this device, you will lose access to your wallet.';
      case 'not-sure':
        return 'You haven\'t confirmed if your passkey syncs. Consider adding a backup for safety.';
      default:
        return 'Please confirm your passkey sync status to ensure wallet security.';
    }
  };

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-xl p-4 mb-6`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${colors.icon}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`${colors.text} font-medium text-sm`}>{getMessage()}</p>

          {/* Expanded Instructions */}
          {expanded && (
            <div className="mt-4">
              <p className="text-gray-400 text-sm mb-2">
                How to enable passkey sync on {instructions.platform}:
              </p>
              <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside mb-4">
                {instructions.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              {instructions.note && (
                <p className="text-gray-500 text-xs italic">{instructions.note}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            {onAddBackupPasskey && (
              <button
                onClick={onAddBackupPasskey}
                className="text-sm px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-red-600 transition"
              >
                Add Backup Passkey
              </button>
            )}
            {onUpdateSyncStatus && (
              <button
                onClick={onUpdateSyncStatus}
                className="text-sm px-3 py-1.5 bg-white/10 text-gray-300 font-medium rounded-lg hover:bg-white/20 transition"
              >
                Update Status
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm px-3 py-1.5 text-gray-400 hover:text-white transition"
            >
              {expanded ? 'Hide instructions' : 'How to enable sync'}
            </button>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-500 hover:text-white transition"
          title="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Security settings section component that shows passkey sync status
 * and allows updating it.
 */
interface SecuritySettingsProps {
  onAddBackupPasskey?: () => void;
  onUpdateSyncStatus?: () => void;
  hasBackupPasskey?: boolean;
}

export function SecuritySettings({
  onAddBackupPasskey,
  onUpdateSyncStatus,
  hasBackupPasskey = false,
}: SecuritySettingsProps) {
  const status = getSyncStatus();
  const riskLevel = getRiskLevel();
  const instructions = getSyncInstructions();

  const getStatusBadge = () => {
    switch (status.userChoice) {
      case 'yes':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Synced
          </span>
        );
      case 'no':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Not Synced
          </span>
        );
      case 'not-sure':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            Unknown
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Not Set
          </span>
        );
    }
  };

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Security
        </h3>
      </div>

      <div className="divide-y divide-white/5">
        {/* Passkey Sync Status */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 text-sm">Passkey Cloud Sync</span>
            {getStatusBadge()}
          </div>
          <p className="text-gray-500 text-xs mb-3">
            Synced passkeys can be used on multiple devices. Non-synced passkeys are lost if the device is lost.
          </p>
          {onUpdateSyncStatus && (
            <button
              onClick={onUpdateSyncStatus}
              className="text-sm text-purple-400 hover:text-purple-300 transition"
            >
              Update sync status →
            </button>
          )}
        </div>

        {/* Backup Passkey */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 text-sm">Backup Passkey</span>
            {hasBackupPasskey ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Configured
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                Not Set
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs mb-3">
            Register a backup passkey on another device for recovery if you lose access to your primary device.
          </p>
          {onAddBackupPasskey && !hasBackupPasskey && (
            <button
              onClick={onAddBackupPasskey}
              className="text-sm text-orange-400 hover:text-orange-300 transition"
            >
              Add backup passkey →
            </button>
          )}
        </div>

        {/* Platform Instructions (if at risk) */}
        {riskLevel !== 'low' && (
          <div className="p-4 bg-yellow-500/5">
            <p className="text-yellow-200/80 text-sm font-medium mb-2">
              How to enable passkey sync on {instructions.platform}:
            </p>
            <ol className="text-yellow-200/60 text-xs space-y-1 list-decimal list-inside">
              {instructions.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            {instructions.note && (
              <p className="text-yellow-200/50 text-xs mt-2 italic">{instructions.note}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
