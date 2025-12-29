'use client';

import React, { useState } from 'react';
import {
  SyncUserChoice,
  estimateSyncStatus,
  confirmSyncChoice,
  getSyncInstructions,
  getPlatformName,
} from '@/lib/platformSync';

interface SyncConfirmationModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onAddBackupPasskey?: () => void;
}

/**
 * Post-registration modal asking user to confirm if their passkey is synced
 * to the cloud. Required selection - user cannot dismiss without choosing.
 */
export function SyncConfirmationModal({
  isOpen,
  onComplete,
  onAddBackupPasskey,
}: SyncConfirmationModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<SyncUserChoice | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  if (!isOpen) return null;

  const heuristic = estimateSyncStatus();
  const platform = getPlatformName();
  const instructions = getSyncInstructions();

  const handleContinue = () => {
    if (!selectedChoice) return;
    confirmSyncChoice(selectedChoice);
    onComplete();
  };

  const handleAddBackup = () => {
    if (!selectedChoice) return;
    confirmSyncChoice(selectedChoice);
    onAddBackupPasskey?.();
    onComplete();
  };

  const getHeuristicHint = () => {
    switch (heuristic) {
      case 'likely':
        return (
          <div className="flex items-center gap-2 text-green-400 text-sm mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>You&apos;re on {platform} - passkeys are likely synced automatically</span>
          </div>
        );
      case 'unlikely':
        return (
          <div className="flex items-center gap-2 text-yellow-400 text-sm mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>You&apos;re on {platform} - passkeys typically don&apos;t sync by default</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-slate-800 rounded-2xl border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Passkey Created!</h2>
              <p className="text-gray-400 text-sm">One more step to secure your wallet</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            <h3 className="text-white font-semibold">Is this passkey synced to the cloud?</h3>
          </div>

          {getHeuristicHint()}

          {/* Options */}
          <div className="space-y-3 mb-6">
            <label
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                selectedChoice === 'yes'
                  ? 'bg-green-500/20 border-green-500/50'
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              <input
                type="radio"
                name="syncChoice"
                value="yes"
                checked={selectedChoice === 'yes'}
                onChange={() => setSelectedChoice('yes')}
                className="mt-1 w-4 h-4 text-green-500 bg-transparent border-white/30 focus:ring-green-500 focus:ring-offset-0"
              />
              <div>
                <span className="text-white font-medium">Yes, I have iCloud Keychain / Google Password Manager enabled</span>
                <p className="text-gray-400 text-sm mt-1">My passkey will sync to other devices automatically</p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                selectedChoice === 'no'
                  ? 'bg-red-500/20 border-red-500/50'
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              <input
                type="radio"
                name="syncChoice"
                value="no"
                checked={selectedChoice === 'no'}
                onChange={() => setSelectedChoice('no')}
                className="mt-1 w-4 h-4 text-red-500 bg-transparent border-white/30 focus:ring-red-500 focus:ring-offset-0"
              />
              <div>
                <span className="text-white font-medium">No, this passkey is only on this device</span>
                <p className="text-gray-400 text-sm mt-1">I use Windows Hello or a hardware security key</p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                selectedChoice === 'not-sure'
                  ? 'bg-yellow-500/20 border-yellow-500/50'
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              <input
                type="radio"
                name="syncChoice"
                value="not-sure"
                checked={selectedChoice === 'not-sure'}
                onChange={() => setSelectedChoice('not-sure')}
                className="mt-1 w-4 h-4 text-yellow-500 bg-transparent border-white/30 focus:ring-yellow-500 focus:ring-offset-0"
              />
              <div>
                <span className="text-white font-medium">I&apos;m not sure</span>
                <p className="text-gray-400 text-sm mt-1">I don&apos;t know if my passkey syncs</p>
              </div>
            </label>
          </div>

          {/* Warning */}
          {(selectedChoice === 'no' || selectedChoice === 'not-sure') && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-yellow-200 font-medium text-sm">
                    If your passkey is not synced and you lose this device, your wallet will be permanently inaccessible.
                  </p>
                  <p className="text-yellow-200/70 text-sm mt-2">
                    We strongly recommend:
                  </p>
                  <ul className="text-yellow-200/70 text-sm mt-1 list-disc list-inside space-y-1">
                    <li>Enabling cloud sync for your passkey</li>
                    <li>OR registering a backup passkey on another device</li>
                    <li>OR setting up guardian recovery</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Platform Instructions Toggle */}
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm mb-4 transition"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showInstructions ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>How to enable passkey sync on {instructions.platform}</span>
          </button>

          {showInstructions && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl mb-6">
              <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
                {instructions.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              {instructions.note && (
                <p className="text-purple-300/70 text-xs mt-3 italic">{instructions.note}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={handleContinue}
            disabled={!selectedChoice}
            className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
          {(selectedChoice === 'no' || selectedChoice === 'not-sure') && onAddBackupPasskey && (
            <button
              onClick={handleAddBackup}
              disabled={!selectedChoice}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Backup Passkey
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
