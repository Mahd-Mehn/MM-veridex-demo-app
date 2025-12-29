'use client';

/**
 * Spending Limits Settings Component (Issue #27)
 * 
 * Full settings page for managing spending limits:
 * - View and edit daily limit
 * - View and edit per-transaction limit
 * - See current day's spending
 * - View recent transaction history
 * - Pause/unpause vault
 * - Reset daily counter (informational - resets automatically)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

interface SpendingLimits {
  dailyLimit: bigint;
  dailySpent: bigint;
  dailyRemaining: bigint;
  dayResetTime: Date;
  timeUntilReset: number;
  transactionLimit: bigint;
  isPaused: boolean;
  lastUpdated: Date;
  chainId: number;
}

interface SpendingTransaction {
  hash: string;
  amount: bigint;
  formattedAmount: string;
  tokenSymbol: string;
  recipient: string;
  recipientDisplay: string;
  timestamp: Date;
  relativeTime: string;
  type: 'transfer' | 'bridge' | 'execute';
  countedAgainstLimit: boolean;
}

interface SpendingSettingsProps {
  /** Current spending limits */
  limits?: SpendingLimits;
  
  /** Recent transactions */
  transactions?: SpendingTransaction[];
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Error message */
  error?: string;
  
  /** Token decimals */
  tokenDecimals?: number;
  
  /** Token symbol */
  tokenSymbol?: string;
  
  /** ETH price for USD display */
  ethPriceUsd?: number;
  
  /** Callback when daily limit is changed */
  onSetDailyLimit?: (newLimit: bigint) => Promise<void>;
  
  /** Callback when transaction limit is changed */
  onSetTransactionLimit?: (newLimit: bigint) => Promise<void>;
  
  /** Callback to pause vault */
  onPauseVault?: () => Promise<void>;
  
  /** Callback to unpause vault */
  onUnpauseVault?: () => Promise<void>;
  
  /** Callback to refresh data */
  onRefresh?: () => void;
  
  /** Additional CSS classes */
  className?: string;
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

function parseEthToWei(ethAmount: string, decimals: number = 18): bigint {
  if (!ethAmount || ethAmount === '0') return 0n;
  const [whole, fraction = ''] = ethAmount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole || '0') * 10n ** BigInt(decimals) + BigInt(paddedFraction);
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ============================================================================
// Main Component
// ============================================================================

export function SpendingSettings({
  limits,
  transactions = [],
  isLoading = false,
  error,
  tokenDecimals = 18,
  tokenSymbol = 'ETH',
  ethPriceUsd = 2000,
  onSetDailyLimit,
  onSetTransactionLimit,
  onPauseVault,
  onUnpauseVault,
  onRefresh,
  className = '',
}: SpendingSettingsProps) {
  // State
  const [editingDaily, setEditingDaily] = useState(false);
  const [editingTx, setEditingTx] = useState(false);
  const [dailyInput, setDailyInput] = useState('');
  const [txInput, setTxInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<string>('--:--');

  // Update countdown
  useEffect(() => {
    if (!limits) return;
    
    const updateCountdown = () => {
      const now = Date.now();
      const remaining = limits.dayResetTime.getTime() - now;
      setCountdown(formatDuration(remaining));
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [limits]);

  // Handlers
  const handleEditDaily = useCallback(() => {
    if (limits) {
      setDailyInput(formatEth(limits.dailyLimit, tokenDecimals));
    }
    setEditingDaily(true);
  }, [limits, tokenDecimals]);

  const handleEditTx = useCallback(() => {
    if (limits) {
      setTxInput(formatEth(limits.transactionLimit, tokenDecimals));
    }
    setEditingTx(true);
  }, [limits, tokenDecimals]);

  const handleSaveDaily = useCallback(async () => {
    if (!onSetDailyLimit) return;
    setIsSubmitting(true);
    try {
      const newLimit = parseEthToWei(dailyInput, tokenDecimals);
      await onSetDailyLimit(newLimit);
      setEditingDaily(false);
    } catch (err) {
      console.error('Failed to set daily limit:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [dailyInput, tokenDecimals, onSetDailyLimit]);

  const handleSaveTx = useCallback(async () => {
    if (!onSetTransactionLimit) return;
    setIsSubmitting(true);
    try {
      const newLimit = parseEthToWei(txInput, tokenDecimals);
      await onSetTransactionLimit(newLimit);
      setEditingTx(false);
    } catch (err) {
      console.error('Failed to set transaction limit:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [txInput, tokenDecimals, onSetTransactionLimit]);

  const handlePauseToggle = useCallback(async () => {
    if (!limits) return;
    setIsSubmitting(true);
    try {
      if (limits.isPaused) {
        await onUnpauseVault?.();
      } else {
        await onPauseVault?.();
      }
    } catch (err) {
      console.error('Failed to toggle pause:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [limits, onPauseVault, onUnpauseVault]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`spending-settings ${className}`}>
        <div className="spending-settings__loading">
          <div className="spending-settings__spinner"></div>
          <p>Loading spending limits...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`spending-settings spending-settings--error ${className}`}>
        <h2 className="spending-settings__title">Security Settings</h2>
        <div className="spending-settings__error">
          <span className="spending-settings__error-icon">⚠️</span>
          <p>{error}</p>
          {onRefresh && (
            <button onClick={onRefresh} className="spending-settings__retry">
              Retry
            </button>
          )}
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // No limits data
  if (!limits) {
    return (
      <div className={`spending-settings ${className}`}>
        <h2 className="spending-settings__title">Security Settings</h2>
        <p className="spending-settings__empty">
          Unable to load spending limits. Please try again.
        </p>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className={`spending-settings ${className}`}>
      <h2 className="spending-settings__title">Security Settings</h2>

      {/* Pause Banner */}
      {limits.isPaused && (
        <div className="spending-settings__pause-banner">
          <span className="spending-settings__pause-icon">⏸️</span>
          <div className="spending-settings__pause-content">
            <strong>Vault Paused</strong>
            <p>All withdrawals are currently disabled</p>
          </div>
        </div>
      )}

      {/* Limit Settings */}
      <div className="spending-settings__section">
        {/* Daily Limit */}
        <div className="spending-settings__row">
          <div className="spending-settings__row-info">
            <span className="spending-settings__row-label">Daily Limit:</span>
            {!editingDaily ? (
              <span className="spending-settings__row-value">
                {limits.dailyLimit === 0n ? 'Unlimited' : (
                  <>
                    {formatEth(limits.dailyLimit, tokenDecimals)} {tokenSymbol}
                    <span className="spending-settings__usd">
                      ({formatUsd(limits.dailyLimit, ethPriceUsd, tokenDecimals)})
                    </span>
                  </>
                )}
              </span>
            ) : (
              <div className="spending-settings__edit-group">
                <input
                  type="text"
                  value={dailyInput}
                  onChange={(e) => setDailyInput(e.target.value)}
                  className="spending-settings__input"
                  placeholder="0.0"
                />
                <span className="spending-settings__input-suffix">{tokenSymbol}</span>
              </div>
            )}
          </div>
          <div className="spending-settings__row-actions">
            {!editingDaily ? (
              <button onClick={handleEditDaily} className="spending-settings__edit-btn">
                Edit
              </button>
            ) : (
              <>
                <button 
                  onClick={handleSaveDaily} 
                  className="spending-settings__save-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '...' : 'Save'}
                </button>
                <button 
                  onClick={() => setEditingDaily(false)} 
                  className="spending-settings__cancel-btn"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Transaction Limit */}
        <div className="spending-settings__row">
          <div className="spending-settings__row-info">
            <span className="spending-settings__row-label">Transaction Limit:</span>
            {!editingTx ? (
              <span className="spending-settings__row-value">
                {limits.transactionLimit === 0n ? 'Unlimited' : (
                  <>
                    {formatEth(limits.transactionLimit, tokenDecimals)} {tokenSymbol}
                    <span className="spending-settings__usd">
                      ({formatUsd(limits.transactionLimit, ethPriceUsd, tokenDecimals)})
                    </span>
                  </>
                )}
              </span>
            ) : (
              <div className="spending-settings__edit-group">
                <input
                  type="text"
                  value={txInput}
                  onChange={(e) => setTxInput(e.target.value)}
                  className="spending-settings__input"
                  placeholder="0.0"
                />
                <span className="spending-settings__input-suffix">{tokenSymbol}</span>
              </div>
            )}
          </div>
          <div className="spending-settings__row-actions">
            {!editingTx ? (
              <button onClick={handleEditTx} className="spending-settings__edit-btn">
                Edit
              </button>
            ) : (
              <>
                <button 
                  onClick={handleSaveTx} 
                  className="spending-settings__save-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '...' : 'Save'}
                </button>
                <button 
                  onClick={() => setEditingTx(false)} 
                  className="spending-settings__cancel-btn"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Today's Spending */}
        <div className="spending-settings__row spending-settings__row--readonly">
          <div className="spending-settings__row-info">
            <span className="spending-settings__row-label">Today's Spending:</span>
            <span className="spending-settings__row-value">
              {formatEth(limits.dailySpent, tokenDecimals)} {tokenSymbol}
              <span className="spending-settings__usd">
                ({formatUsd(limits.dailySpent, ethPriceUsd, tokenDecimals)})
              </span>
            </span>
          </div>
        </div>

        {/* Remaining */}
        <div className="spending-settings__row spending-settings__row--readonly">
          <div className="spending-settings__row-info">
            <span className="spending-settings__row-label">Remaining:</span>
            <span className="spending-settings__row-value spending-settings__row-value--remaining">
              {limits.dailyLimit === 0n ? 'Unlimited' : (
                <>
                  {formatEth(limits.dailyRemaining, tokenDecimals)} {tokenSymbol}
                </>
              )}
            </span>
          </div>
          <span className="spending-settings__reset-time">
            Resets in {countdown}
          </span>
        </div>
      </div>

      {/* Transaction History */}
      <div className="spending-settings__section">
        <h3 className="spending-settings__section-title">Last 24h Transactions</h3>
        {transactions.length === 0 ? (
          <p className="spending-settings__no-transactions">
            No transactions in the last 24 hours
          </p>
        ) : (
          <div className="spending-settings__transactions">
            {transactions.map((tx) => (
              <div key={tx.hash} className="spending-settings__transaction">
                <div className="spending-settings__tx-info">
                  <span className="spending-settings__tx-amount">
                    -{tx.formattedAmount} {tx.tokenSymbol}
                  </span>
                  <span className="spending-settings__tx-recipient">
                    to {tx.recipientDisplay || truncateAddress(tx.recipient)}
                  </span>
                </div>
                <span className="spending-settings__tx-time">{tx.relativeTime}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="spending-settings__actions">
        <button
          onClick={handlePauseToggle}
          disabled={isSubmitting}
          className={`spending-settings__action-btn ${
            limits.isPaused 
              ? 'spending-settings__action-btn--unpause' 
              : 'spending-settings__action-btn--pause'
          }`}
        >
          {limits.isPaused ? '▶️ Unpause Wallet' : '⏸️ Pause Wallet'}
        </button>
        
        <button
          onClick={onRefresh}
          disabled={isSubmitting}
          className="spending-settings__action-btn spending-settings__action-btn--refresh"
        >
          🔄 Refresh
        </button>
      </div>

      <style>{styles}</style>
    </div>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = `
  .spending-settings {
    max-width: 600px;
    background: #1a1a2e;
    border-radius: 16px;
    border: 1px solid #2d2d44;
    padding: 24px;
    font-family: system-ui, -apple-system, sans-serif;
    color: #fff;
  }

  .spending-settings__title {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 24px 0;
  }

  .spending-settings__pause-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #7c2d12;
    border-radius: 12px;
    margin-bottom: 24px;
  }

  .spending-settings__pause-icon {
    font-size: 24px;
  }

  .spending-settings__pause-content strong {
    display: block;
    font-size: 16px;
  }

  .spending-settings__pause-content p {
    font-size: 13px;
    color: #fdba74;
    margin: 4px 0 0 0;
  }

  .spending-settings__section {
    background: #252540;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
  }

  .spending-settings__section-title {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 16px 0;
    color: #888;
  }

  .spending-settings__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #2d2d44;
  }

  .spending-settings__row:last-child {
    border-bottom: none;
  }

  .spending-settings__row--readonly {
    opacity: 0.8;
  }

  .spending-settings__row-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .spending-settings__row-label {
    font-size: 13px;
    color: #888;
  }

  .spending-settings__row-value {
    font-size: 16px;
    font-weight: 600;
  }

  .spending-settings__row-value--remaining {
    color: #22c55e;
  }

  .spending-settings__usd {
    font-size: 12px;
    color: #888;
    font-weight: 400;
    margin-left: 8px;
  }

  .spending-settings__row-actions {
    display: flex;
    gap: 8px;
  }

  .spending-settings__edit-btn {
    padding: 6px 16px;
    background: #3d3d5c;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .spending-settings__edit-btn:hover {
    background: #6366f1;
  }

  .spending-settings__edit-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .spending-settings__input {
    width: 120px;
    padding: 8px 12px;
    background: #1a1a2e;
    border: 1px solid #3d3d5c;
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    outline: none;
  }

  .spending-settings__input:focus {
    border-color: #6366f1;
  }

  .spending-settings__input-suffix {
    font-size: 14px;
    color: #888;
  }

  .spending-settings__save-btn {
    padding: 6px 16px;
    background: #6366f1;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 13px;
    cursor: pointer;
  }

  .spending-settings__save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spending-settings__cancel-btn {
    padding: 6px 12px;
    background: transparent;
    border: 1px solid #444;
    border-radius: 8px;
    color: #888;
    font-size: 13px;
    cursor: pointer;
  }

  .spending-settings__reset-time {
    font-size: 12px;
    color: #888;
  }

  .spending-settings__no-transactions {
    font-size: 14px;
    color: #888;
    text-align: center;
    padding: 16px 0;
    margin: 0;
  }

  .spending-settings__transactions {
    max-height: 200px;
    overflow-y: auto;
  }

  .spending-settings__transaction {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #2d2d44;
  }

  .spending-settings__transaction:last-child {
    border-bottom: none;
  }

  .spending-settings__tx-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .spending-settings__tx-amount {
    font-size: 14px;
    font-weight: 500;
    color: #f87171;
  }

  .spending-settings__tx-recipient {
    font-size: 12px;
    color: #888;
  }

  .spending-settings__tx-time {
    font-size: 12px;
    color: #888;
  }

  .spending-settings__actions {
    display: flex;
    gap: 12px;
  }

  .spending-settings__action-btn {
    flex: 1;
    padding: 14px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .spending-settings__action-btn--pause {
    background: #7c2d12;
    border: 1px solid #f97316;
    color: #fff;
  }

  .spending-settings__action-btn--pause:hover {
    background: #9a3412;
  }

  .spending-settings__action-btn--unpause {
    background: #166534;
    border: 1px solid #22c55e;
    color: #fff;
  }

  .spending-settings__action-btn--unpause:hover {
    background: #15803d;
  }

  .spending-settings__action-btn--refresh {
    background: #252540;
    border: 1px solid #3d3d5c;
    color: #fff;
    flex: 0 0 auto;
    width: 120px;
  }

  .spending-settings__action-btn--refresh:hover {
    background: #3d3d5c;
  }

  .spending-settings__action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spending-settings__loading {
    text-align: center;
    padding: 40px 0;
  }

  .spending-settings__spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #2d2d44;
    border-top-color: #6366f1;
    border-radius: 50%;
    margin: 0 auto 16px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .spending-settings__error {
    text-align: center;
    padding: 24px;
    background: #252540;
    border-radius: 12px;
  }

  .spending-settings__error-icon {
    font-size: 32px;
    display: block;
    margin-bottom: 12px;
  }

  .spending-settings__error p {
    color: #f97316;
    margin: 0 0 16px 0;
  }

  .spending-settings__retry {
    padding: 10px 24px;
    background: #3d3d5c;
    border: none;
    border-radius: 8px;
    color: #fff;
    cursor: pointer;
  }

  .spending-settings__empty {
    text-align: center;
    color: #888;
    padding: 40px 0;
  }
`;

export default SpendingSettings;
