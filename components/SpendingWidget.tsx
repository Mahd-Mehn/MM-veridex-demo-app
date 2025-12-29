'use client';

/**
 * Spending Widget Component (Issue #27)
 * 
 * Dashboard widget showing current spending status:
 * - Progress bar for daily limit usage
 * - Current spent vs limit amounts
 * - Countdown to limit reset
 * - Quick action to adjust limits
 * 
 * This component is designed to be embedded in the main wallet dashboard.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';

// ============================================================================
// Types (Local to avoid build dependency issues)
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

interface SpendingWidgetProps {
  /** Current spending limits data */
  limits?: SpendingLimits;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Error message */
  error?: string;
  
  /** Token decimals for formatting */
  tokenDecimals?: number;
  
  /** Token symbol */
  tokenSymbol?: string;
  
  /** ETH price for USD conversion */
  ethPriceUsd?: number;
  
  /** Callback when "Adjust Limits" is clicked */
  onAdjustLimits?: () => void;
  
  /** Callback when "Unpause" is clicked */
  onUnpause?: () => void;
  
  /** Callback to refresh data */
  onRefresh?: () => void;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Compact mode for smaller displays */
  compact?: boolean;
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

function calculatePercentage(spent: bigint, limit: bigint): number {
  if (limit === 0n) return 0;
  const percentage = Number((spent * 10000n) / limit) / 100;
  return Math.min(100, Math.max(0, percentage));
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

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return '#ef4444'; // Red
  if (percentage >= 70) return '#f59e0b'; // Orange/Yellow
  return '#22c55e'; // Green
}

// ============================================================================
// Main Component
// ============================================================================

export function SpendingWidget({
  limits,
  isLoading = false,
  error,
  tokenDecimals = 18,
  tokenSymbol = 'ETH',
  ethPriceUsd = 2000,
  onAdjustLimits,
  onUnpause,
  onRefresh,
  className = '',
  compact = false,
}: SpendingWidgetProps) {
  // Live countdown state
  const [countdown, setCountdown] = useState<string>('--:--');
  
  // Update countdown every minute
  useEffect(() => {
    if (!limits) return;
    
    const updateCountdown = () => {
      const now = Date.now();
      const remaining = limits.dayResetTime.getTime() - now;
      setCountdown(formatDuration(remaining));
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [limits]);
  
  // Computed values
  const usedPercentage = useMemo(() => {
    if (!limits || limits.dailyLimit === 0n) return 0;
    return calculatePercentage(limits.dailySpent, limits.dailyLimit);
  }, [limits]);
  
  const progressColor = useMemo(() => getProgressColor(usedPercentage), [usedPercentage]);
  
  const hasNoLimit = limits && limits.dailyLimit === 0n;
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`spending-widget spending-widget--loading ${className}`}>
        <div className="spending-widget__header">
          <span className="spending-widget__icon">📊</span>
          <span className="spending-widget__title">Daily Spending</span>
        </div>
        <div className="spending-widget__skeleton">
          <div className="spending-widget__skeleton-bar"></div>
          <div className="spending-widget__skeleton-text"></div>
        </div>
        <style>{styles}</style>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={`spending-widget spending-widget--error ${className}`}>
        <div className="spending-widget__header">
          <span className="spending-widget__icon">⚠️</span>
          <span className="spending-widget__title">Daily Spending</span>
        </div>
        <p className="spending-widget__error-text">{error}</p>
        {onRefresh && (
          <button onClick={onRefresh} className="spending-widget__retry">
            Retry
          </button>
        )}
        <style>{styles}</style>
      </div>
    );
  }
  
  // No limits configured
  if (!limits) {
    return (
      <div className={`spending-widget spending-widget--empty ${className}`}>
        <div className="spending-widget__header">
          <span className="spending-widget__icon">📊</span>
          <span className="spending-widget__title">Daily Spending</span>
        </div>
        <p className="spending-widget__empty-text">
          No spending limits configured
        </p>
        {onAdjustLimits && (
          <button onClick={onAdjustLimits} className="spending-widget__action-btn">
            Set Up Limits
          </button>
        )}
        <style>{styles}</style>
      </div>
    );
  }
  
  // Paused state
  if (limits.isPaused) {
    return (
      <div className={`spending-widget spending-widget--paused ${className}`}>
        <div className="spending-widget__header">
          <span className="spending-widget__icon">⏸️</span>
          <span className="spending-widget__title">Vault Paused</span>
        </div>
        <p className="spending-widget__paused-text">
          Withdrawals are currently disabled
        </p>
        {onUnpause && (
          <button onClick={onUnpause} className="spending-widget__action-btn spending-widget__action-btn--warning">
            Unpause Vault
          </button>
        )}
        <style>{styles}</style>
      </div>
    );
  }
  
  // No limit set (unlimited)
  if (hasNoLimit) {
    return (
      <div className={`spending-widget spending-widget--unlimited ${className}`}>
        <div className="spending-widget__header">
          <span className="spending-widget__icon">♾️</span>
          <span className="spending-widget__title">Daily Spending</span>
        </div>
        <p className="spending-widget__unlimited-text">
          No daily limit set
        </p>
        <p className="spending-widget__unlimited-warning">
          Consider setting a limit for added security
        </p>
        {onAdjustLimits && (
          <button onClick={onAdjustLimits} className="spending-widget__action-btn">
            Set Limits
          </button>
        )}
        <style>{styles}</style>
      </div>
    );
  }
  
  // Normal state with limits
  return (
    <div className={`spending-widget ${compact ? 'spending-widget--compact' : ''} ${className}`}>
      <div className="spending-widget__header">
        <span className="spending-widget__icon">📊</span>
        <span className="spending-widget__title">Daily Spending</span>
      </div>
      
      {/* Progress Bar */}
      <div className="spending-widget__progress-container">
        <div className="spending-widget__progress-bar">
          <div 
            className="spending-widget__progress-fill"
            style={{ 
              width: `${usedPercentage}%`,
              backgroundColor: progressColor,
            }}
          />
        </div>
        <div className="spending-widget__progress-labels">
          <span className="spending-widget__spent">
            {formatUsd(limits.dailySpent, ethPriceUsd, tokenDecimals)}
          </span>
          <span className="spending-widget__limit">
            / {formatUsd(limits.dailyLimit, ethPriceUsd, tokenDecimals)}
          </span>
        </div>
      </div>
      
      {/* Remaining Amount */}
      <div className="spending-widget__remaining">
        <span className="spending-widget__remaining-label">Remaining:</span>
        <span className="spending-widget__remaining-value">
          {formatEth(limits.dailyRemaining, tokenDecimals)} {tokenSymbol}
        </span>
      </div>
      
      {/* Reset Countdown */}
      <div className="spending-widget__reset">
        <span className="spending-widget__reset-icon">🔄</span>
        <span className="spending-widget__reset-text">
          Resets in {countdown}
        </span>
      </div>
      
      {/* Action Button */}
      {onAdjustLimits && (
        <button onClick={onAdjustLimits} className="spending-widget__action-btn">
          Adjust Limits
        </button>
      )}
      
      <style>{styles}</style>
    </div>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = `
  .spending-widget {
    background: #1a1a2e;
    border-radius: 16px;
    border: 1px solid #2d2d44;
    padding: 20px;
    font-family: system-ui, -apple-system, sans-serif;
    color: #fff;
    min-width: 280px;
  }

  .spending-widget--compact {
    padding: 16px;
  }

  .spending-widget__header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .spending-widget__icon {
    font-size: 20px;
  }

  .spending-widget__title {
    font-size: 16px;
    font-weight: 600;
  }

  .spending-widget__progress-container {
    margin-bottom: 16px;
  }

  .spending-widget__progress-bar {
    height: 12px;
    background: #2d2d44;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .spending-widget__progress-fill {
    height: 100%;
    border-radius: 6px;
    transition: width 0.3s ease, background-color 0.3s ease;
  }

  .spending-widget__progress-labels {
    display: flex;
    justify-content: center;
    font-size: 18px;
    font-weight: 600;
  }

  .spending-widget__spent {
    color: #fff;
  }

  .spending-widget__limit {
    color: #888;
    margin-left: 4px;
  }

  .spending-widget__remaining {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    padding: 12px;
    background: #252540;
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .spending-widget__remaining-label {
    color: #888;
  }

  .spending-widget__remaining-value {
    font-weight: 600;
    color: #22c55e;
  }

  .spending-widget__reset {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 13px;
    color: #888;
    margin-bottom: 16px;
  }

  .spending-widget__reset-icon {
    font-size: 14px;
  }

  .spending-widget__action-btn {
    width: 100%;
    padding: 12px;
    background: #252540;
    border: 1px solid #3d3d5c;
    border-radius: 10px;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .spending-widget__action-btn:hover {
    background: #3d3d5c;
    border-color: #6366f1;
  }

  .spending-widget__action-btn--warning {
    background: #7c2d12;
    border-color: #f97316;
  }

  .spending-widget__action-btn--warning:hover {
    background: #9a3412;
  }

  /* Loading State */
  .spending-widget__skeleton {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .spending-widget__skeleton-bar {
    height: 12px;
    background: #2d2d44;
    border-radius: 6px;
    margin-bottom: 12px;
  }

  .spending-widget__skeleton-text {
    height: 24px;
    background: #2d2d44;
    border-radius: 4px;
    width: 60%;
    margin: 0 auto;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Error State */
  .spending-widget--error {
    border-color: #7c2d12;
  }

  .spending-widget__error-text {
    font-size: 14px;
    color: #f97316;
    text-align: center;
    margin: 0 0 12px 0;
  }

  .spending-widget__retry {
    width: 100%;
    padding: 10px;
    background: #252540;
    border: 1px solid #444;
    border-radius: 8px;
    color: #fff;
    cursor: pointer;
  }

  /* Empty State */
  .spending-widget__empty-text {
    font-size: 14px;
    color: #888;
    text-align: center;
    margin: 0 0 16px 0;
  }

  /* Paused State */
  .spending-widget--paused {
    border-color: #7c2d12;
  }

  .spending-widget__paused-text {
    font-size: 14px;
    color: #f97316;
    text-align: center;
    margin: 0 0 16px 0;
  }

  /* Unlimited State */
  .spending-widget__unlimited-text {
    font-size: 16px;
    text-align: center;
    margin: 0 0 4px 0;
  }

  .spending-widget__unlimited-warning {
    font-size: 12px;
    color: #f59e0b;
    text-align: center;
    margin: 0 0 16px 0;
  }
`;

export default SpendingWidget;
