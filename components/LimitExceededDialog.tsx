'use client';

/**
 * Limit Exceeded Dialog Component (Issue #27)
 * 
 * Modal dialog shown when user tries to exceed their spending limits.
 * Provides clear information about the violation and actionable options:
 * - Send partial amount (within remaining limit)
 * - Increase limit (requires passkey signature)
 * - Wait for reset (shows countdown)
 * 
 * Security: This is a UX-only enforcement. On-chain enforcement is authoritative.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

interface LimitViolationSuggestion {
  action: 'send_partial' | 'increase_limit' | 'wait_for_reset' | 'unpause_vault';
  label: string;
  data?: {
    amount?: bigint;
    waitTimeMs?: number;
    newLimit?: bigint;
  };
}

interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  message: string;
  allowedAmount?: bigint;
  excessAmount?: bigint;
  waitTime?: number;
  suggestions?: LimitViolationSuggestion[];
}

interface LimitExceededDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  
  /** Callback to close the dialog */
  onClose: () => void;
  
  /** The limit check result from SDK */
  limitCheck: LimitCheckResult;
  
  /** Amount the user tried to send */
  attemptedAmount: bigint;
  
  /** Current daily limit */
  dailyLimit: bigint;
  
  /** Amount already spent today */
  dailySpent: bigint;
  
  /** Time until daily reset (ms) */
  timeUntilReset: number;
  
  /** Token decimals */
  tokenDecimals?: number;
  
  /** Token symbol */
  tokenSymbol?: string;
  
  /** ETH price for USD display */
  ethPriceUsd?: number;
  
  /** Callback when user chooses to send partial amount */
  onSendPartial?: (amount: bigint) => void;
  
  /** Callback when user chooses to increase limit */
  onIncreaseLimit?: (newLimit: bigint) => void;
  
  /** Callback when user chooses to wait */
  onWait?: () => void;
  
  /** Callback when user chooses to cancel */
  onCancel?: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatEth(wei: bigint, decimals: number = 18): string {
  if (wei === 0n) return '0';
  const divisor = 10n ** BigInt(decimals);
  const whole = wei / divisor;
  const fraction = wei % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 4);
  const trimmedFraction = fractionStr.replace(/0+$/, '');
  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole.toLocaleString();
}

function formatUsd(wei: bigint, ethPriceUsd: number, decimals: number = 18): string {
  if (wei === 0n) return '$0';
  const divisor = 10n ** BigInt(decimals);
  const ethAmount = Number(wei) / Number(divisor);
  const usdAmount = ethAmount * ethPriceUsd;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(usdAmount);
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// ============================================================================
// Main Component
// ============================================================================

export function LimitExceededDialog({
  isOpen,
  onClose,
  limitCheck,
  attemptedAmount,
  dailyLimit,
  dailySpent,
  timeUntilReset,
  tokenDecimals = 18,
  tokenSymbol = 'ETH',
  ethPriceUsd = 2000,
  onSendPartial,
  onIncreaseLimit,
  onWait,
  onCancel,
}: LimitExceededDialogProps) {
  // Live countdown
  const [countdown, setCountdown] = useState<string>(formatDuration(timeUntilReset));
  
  useEffect(() => {
    if (!isOpen) return;
    
    const start = Date.now();
    const initialRemaining = timeUntilReset;
    
    const updateCountdown = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, initialRemaining - elapsed);
      setCountdown(formatDuration(remaining));
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [isOpen, timeUntilReset]);
  
  // Compute remaining allowance
  const remainingAllowance = useMemo(() => {
    return dailyLimit > dailySpent ? dailyLimit - dailySpent : 0n;
  }, [dailyLimit, dailySpent]);
  
  // Handlers
  const handleSendPartial = useCallback(() => {
    if (remainingAllowance > 0n && onSendPartial) {
      onSendPartial(remainingAllowance);
      onClose();
    }
  }, [remainingAllowance, onSendPartial, onClose]);
  
  const handleIncreaseLimit = useCallback(() => {
    if (onIncreaseLimit) {
      // Suggest a limit that would allow this transaction
      const suggestedLimit = dailySpent + attemptedAmount;
      onIncreaseLimit(suggestedLimit);
      onClose();
    }
  }, [dailySpent, attemptedAmount, onIncreaseLimit, onClose]);
  
  const handleWait = useCallback(() => {
    onWait?.();
    onClose();
  }, [onWait, onClose]);
  
  const handleCancel = useCallback(() => {
    onCancel?.();
    onClose();
  }, [onCancel, onClose]);
  
  // Don't render if not open
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="limit-dialog__backdrop" 
        onClick={handleCancel}
        aria-hidden="true"
      />
      
      {/* Dialog */}
      <div className="limit-dialog" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="limit-dialog__header">
          <span className="limit-dialog__warning-icon">⚠️</span>
          <h2 className="limit-dialog__title">Transaction Exceeds Limit</h2>
        </div>
        
        {/* Amount Summary */}
        <div className="limit-dialog__summary">
          <div className="limit-dialog__summary-row">
            <span className="limit-dialog__summary-label">You're trying to send:</span>
            <span className="limit-dialog__summary-value limit-dialog__summary-value--highlight">
              {formatEth(attemptedAmount, tokenDecimals)} {tokenSymbol}
              <span className="limit-dialog__usd">
                ({formatUsd(attemptedAmount, ethPriceUsd, tokenDecimals)})
              </span>
            </span>
          </div>
          <div className="limit-dialog__summary-row">
            <span className="limit-dialog__summary-label">Daily limit:</span>
            <span className="limit-dialog__summary-value">
              {formatEth(dailyLimit, tokenDecimals)} {tokenSymbol}
              <span className="limit-dialog__usd">
                ({formatUsd(dailyLimit, ethPriceUsd, tokenDecimals)})
              </span>
            </span>
          </div>
          <div className="limit-dialog__summary-row">
            <span className="limit-dialog__summary-label">Already spent today:</span>
            <span className="limit-dialog__summary-value">
              {formatEth(dailySpent, tokenDecimals)} {tokenSymbol}
              <span className="limit-dialog__usd">
                ({formatUsd(dailySpent, ethPriceUsd, tokenDecimals)})
              </span>
            </span>
          </div>
          <div className="limit-dialog__summary-row limit-dialog__summary-row--remaining">
            <span className="limit-dialog__summary-label">Remaining:</span>
            <span className="limit-dialog__summary-value limit-dialog__summary-value--remaining">
              {formatEth(remainingAllowance, tokenDecimals)} {tokenSymbol}
              <span className="limit-dialog__usd">
                ({formatUsd(remainingAllowance, ethPriceUsd, tokenDecimals)})
              </span>
            </span>
          </div>
        </div>
        
        {/* Message */}
        <p className="limit-dialog__message">{limitCheck.message}</p>
        
        {/* Options */}
        <div className="limit-dialog__options">
          <h3 className="limit-dialog__options-title">Options:</h3>
          
          {/* Send Partial */}
          {remainingAllowance > 0n && (
            <button
              onClick={handleSendPartial}
              className="limit-dialog__option limit-dialog__option--primary"
            >
              <span className="limit-dialog__option-icon">💸</span>
              <div className="limit-dialog__option-content">
                <span className="limit-dialog__option-title">
                  Send {formatEth(remainingAllowance, tokenDecimals)} {tokenSymbol} now
                </span>
                <span className="limit-dialog__option-subtitle">
                  Within your remaining daily limit
                </span>
              </div>
            </button>
          )}
          
          {/* Increase Limit */}
          <button
            onClick={handleIncreaseLimit}
            className="limit-dialog__option"
          >
            <span className="limit-dialog__option-icon">⬆️</span>
            <div className="limit-dialog__option-content">
              <span className="limit-dialog__option-title">
                Increase daily limit
              </span>
              <span className="limit-dialog__option-subtitle">
                Requires passkey signature
              </span>
            </div>
          </button>
          
          {/* Wait for Reset */}
          <button
            onClick={handleWait}
            className="limit-dialog__option"
          >
            <span className="limit-dialog__option-icon">⏰</span>
            <div className="limit-dialog__option-content">
              <span className="limit-dialog__option-title">
                Wait {countdown} for limit reset
              </span>
              <span className="limit-dialog__option-subtitle">
                Your limit resets automatically
              </span>
            </div>
          </button>
        </div>
        
        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="limit-dialog__cancel"
        >
          Cancel
        </button>
      </div>
      
      {/* Styles */}
      <style>{`
        .limit-dialog__backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          z-index: 1000;
        }

        .limit-dialog {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 440px;
          background: #1a1a2e;
          border-radius: 20px;
          border: 1px solid #2d2d44;
          padding: 24px;
          z-index: 1001;
          font-family: system-ui, -apple-system, sans-serif;
          color: #fff;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .limit-dialog__header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .limit-dialog__warning-icon {
          font-size: 28px;
        }

        .limit-dialog__title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .limit-dialog__summary {
          background: #252540;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .limit-dialog__summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #2d2d44;
        }

        .limit-dialog__summary-row:last-child {
          border-bottom: none;
        }

        .limit-dialog__summary-row--remaining {
          padding-top: 12px;
          margin-top: 4px;
          border-top: 1px dashed #3d3d5c;
        }

        .limit-dialog__summary-label {
          font-size: 13px;
          color: #888;
        }

        .limit-dialog__summary-value {
          font-size: 14px;
          font-weight: 500;
          text-align: right;
        }

        .limit-dialog__summary-value--highlight {
          color: #f97316;
          font-size: 16px;
          font-weight: 600;
        }

        .limit-dialog__summary-value--remaining {
          color: #22c55e;
        }

        .limit-dialog__usd {
          display: block;
          font-size: 11px;
          color: #888;
          font-weight: 400;
          margin-top: 2px;
        }

        .limit-dialog__message {
          font-size: 14px;
          color: #ccc;
          text-align: center;
          margin: 0 0 20px 0;
          line-height: 1.5;
        }

        .limit-dialog__options {
          margin-bottom: 16px;
        }

        .limit-dialog__options-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px 0;
          color: #888;
        }

        .limit-dialog__option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: #252540;
          border: 1px solid #3d3d5c;
          border-radius: 12px;
          cursor: pointer;
          text-align: left;
          margin-bottom: 8px;
          transition: all 0.2s ease;
        }

        .limit-dialog__option:hover {
          background: #2d2d50;
          border-color: #6366f1;
        }

        .limit-dialog__option--primary {
          background: #1e3a5f;
          border-color: #3b82f6;
        }

        .limit-dialog__option--primary:hover {
          background: #1e4a7f;
        }

        .limit-dialog__option-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .limit-dialog__option-content {
          flex: 1;
        }

        .limit-dialog__option-title {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }

        .limit-dialog__option-subtitle {
          display: block;
          font-size: 12px;
          color: #888;
          margin-top: 2px;
        }

        .limit-dialog__cancel {
          width: 100%;
          padding: 14px;
          background: transparent;
          border: 1px solid #444;
          border-radius: 12px;
          color: #888;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .limit-dialog__cancel:hover {
          border-color: #666;
          color: #fff;
        }
      `}</style>
    </>
  );
}

export default LimitExceededDialog;
