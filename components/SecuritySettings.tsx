'use client';

/**
 * Security Settings Component (Issue #27)
 * 
 * Optional security settings step during vault registration flow.
 * Allows users to configure spending limits before or after vault creation.
 * 
 * Features:
 * - Preset limit configurations (Conservative, Balanced, Generous, Unlimited)
 * - Custom limit input with USD value display
 * - Daily and per-transaction limits
 * - Clear explanations of security implications
 */

import React, { useState, useCallback, useMemo } from 'react';

// ============================================================================
// Types (Local to avoid build dependency issues)
// ============================================================================

interface LimitPreset {
  id: string;
  name: string;
  description: string;
  dailyLimitUsd: number;
  transactionLimitUsd: number;
  icon: string;
  recommendedFor: string;
}

interface SecuritySettingsConfig {
  dailyLimit: bigint;
  transactionLimit: bigint;
  presetId: string | null;
}

interface SecuritySettingsProps {
  /** Current ETH price in USD for conversion */
  ethPriceUsd?: number;
  
  /** Token decimals (default: 18) */
  tokenDecimals?: number;
  
  /** Token symbol (default: 'ETH') */
  tokenSymbol?: string;
  
  /** Callback when settings change */
  onChange?: (config: SecuritySettingsConfig) => void;
  
  /** Callback when user skips settings */
  onSkip?: () => void;
  
  /** Callback when user confirms settings */
  onContinue?: (config: SecuritySettingsConfig) => void;
  
  /** Initial configuration */
  initialConfig?: Partial<SecuritySettingsConfig>;
  
  /** Whether to show Skip button */
  showSkip?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const LIMIT_PRESETS: LimitPreset[] = [
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Low limits for maximum security',
    dailyLimitUsd: 500,
    transactionLimitUsd: 100,
    icon: '🔒',
    recommendedFor: 'New users or high-value vaults',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Moderate limits for everyday use',
    dailyLimitUsd: 2500,
    transactionLimitUsd: 500,
    icon: '⚖️',
    recommendedFor: 'Regular users',
  },
  {
    id: 'generous',
    name: 'Generous',
    description: 'Higher limits for active traders',
    dailyLimitUsd: 10000,
    transactionLimitUsd: 2500,
    icon: '🚀',
    recommendedFor: 'Active traders and power users',
  },
  {
    id: 'unlimited',
    name: 'No Limits',
    description: 'No spending restrictions (not recommended)',
    dailyLimitUsd: 0,
    transactionLimitUsd: 0,
    icon: '⚠️',
    recommendedFor: 'Advanced users who accept full risk',
  },
];

const DEFAULT_ETH_PRICE = 2000; // Fallback ETH price

// ============================================================================
// Helper Functions
// ============================================================================

function usdToWei(usd: number, ethPriceUsd: number, decimals: number = 18): bigint {
  if (usd === 0) return 0n;
  const ethAmount = usd / ethPriceUsd;
  // Convert to base units with high precision
  const precision = 10 ** 12;
  return BigInt(Math.round(ethAmount * precision)) * (10n ** BigInt(decimals)) / BigInt(precision);
}

function weiToUsd(wei: bigint, ethPriceUsd: number, decimals: number = 18): number {
  if (wei === 0n) return 0;
  const divisor = 10n ** BigInt(decimals);
  const ethAmount = Number(wei) / Number(divisor);
  return ethAmount * ethPriceUsd;
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatEth(wei: bigint, decimals: number = 18): string {
  if (wei === 0n) return '0';
  const divisor = 10n ** BigInt(decimals);
  const whole = wei / divisor;
  const fraction = wei % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 4);
  const trimmedFraction = fractionStr.replace(/0+$/, '');
  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole.toString();
}

// ============================================================================
// Main Component
// ============================================================================

export function SecuritySettings({
  ethPriceUsd = DEFAULT_ETH_PRICE,
  tokenDecimals = 18,
  tokenSymbol = 'ETH',
  onChange,
  onSkip,
  onContinue,
  initialConfig,
  showSkip = true,
  className = '',
}: SecuritySettingsProps) {
  // State
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    initialConfig?.presetId ?? 'balanced'
  );
  const [customDailyUsd, setCustomDailyUsd] = useState<string>('');
  const [customTxUsd, setCustomTxUsd] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Compute current configuration
  const currentConfig = useMemo((): SecuritySettingsConfig => {
    if (isCustomMode) {
      const dailyUsd = parseFloat(customDailyUsd) || 0;
      const txUsd = parseFloat(customTxUsd) || 0;
      return {
        dailyLimit: usdToWei(dailyUsd, ethPriceUsd, tokenDecimals),
        transactionLimit: usdToWei(txUsd, ethPriceUsd, tokenDecimals),
        presetId: null,
      };
    }
    
    const preset = LIMIT_PRESETS.find(p => p.id === selectedPreset);
    if (!preset) {
      return { dailyLimit: 0n, transactionLimit: 0n, presetId: null };
    }
    
    return {
      dailyLimit: usdToWei(preset.dailyLimitUsd, ethPriceUsd, tokenDecimals),
      transactionLimit: usdToWei(preset.transactionLimitUsd, ethPriceUsd, tokenDecimals),
      presetId: preset.id,
    };
  }, [selectedPreset, customDailyUsd, customTxUsd, isCustomMode, ethPriceUsd, tokenDecimals]);

  // Notify parent of changes
  const handleConfigChange = useCallback((config: SecuritySettingsConfig) => {
    onChange?.(config);
  }, [onChange]);

  // Handle preset selection
  const handlePresetSelect = useCallback((presetId: string) => {
    setIsCustomMode(false);
    setSelectedPreset(presetId);
    const preset = LIMIT_PRESETS.find(p => p.id === presetId);
    if (preset) {
      handleConfigChange({
        dailyLimit: usdToWei(preset.dailyLimitUsd, ethPriceUsd, tokenDecimals),
        transactionLimit: usdToWei(preset.transactionLimitUsd, ethPriceUsd, tokenDecimals),
        presetId,
      });
    }
  }, [ethPriceUsd, tokenDecimals, handleConfigChange]);

  // Handle custom mode toggle
  const handleCustomMode = useCallback(() => {
    setIsCustomMode(true);
    setSelectedPreset(null);
  }, []);

  // Handle continue
  const handleContinue = useCallback(() => {
    onContinue?.(currentConfig);
  }, [currentConfig, onContinue]);

  return (
    <div className={`security-settings ${className}`}>
      {/* Header */}
      <div className="security-settings__header">
        <h2 className="security-settings__title">
          🛡️ Security Settings (Optional)
        </h2>
        <p className="security-settings__subtitle">
          Set spending limits to protect your vault from unauthorized access
        </p>
      </div>

      {/* Preset Selection */}
      <div className="security-settings__presets">
        {LIMIT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetSelect(preset.id)}
            className={`security-settings__preset ${
              selectedPreset === preset.id && !isCustomMode
                ? 'security-settings__preset--selected'
                : ''
            } ${preset.id === 'unlimited' ? 'security-settings__preset--warning' : ''}`}
          >
            <span className="security-settings__preset-icon">{preset.icon}</span>
            <span className="security-settings__preset-name">{preset.name}</span>
            <span className="security-settings__preset-description">
              {preset.description}
            </span>
            {preset.dailyLimitUsd > 0 && (
              <span className="security-settings__preset-limits">
                Daily: {formatUsd(preset.dailyLimitUsd)} • Per Tx: {formatUsd(preset.transactionLimitUsd)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Custom Limits Toggle */}
      <button
        onClick={handleCustomMode}
        className={`security-settings__custom-toggle ${
          isCustomMode ? 'security-settings__custom-toggle--active' : ''
        }`}
      >
        ⚙️ Set Custom Limits
      </button>

      {/* Custom Limits Form */}
      {isCustomMode && (
        <div className="security-settings__custom-form">
          <div className="security-settings__input-group">
            <label className="security-settings__label">
              Daily Spending Limit
            </label>
            <div className="security-settings__input-wrapper">
              <span className="security-settings__input-prefix">$</span>
              <input
                type="number"
                value={customDailyUsd}
                onChange={(e) => setCustomDailyUsd(e.target.value)}
                placeholder="1,000"
                className="security-settings__input"
                min="0"
              />
            </div>
            <span className="security-settings__input-hint">
              Maximum you can withdraw per day
              {customDailyUsd && (
                <span className="security-settings__conversion">
                  ≈ {formatEth(usdToWei(parseFloat(customDailyUsd) || 0, ethPriceUsd, tokenDecimals), tokenDecimals)} {tokenSymbol}
                </span>
              )}
            </span>
          </div>

          <div className="security-settings__input-group">
            <label className="security-settings__label">
              Single Transaction Limit
            </label>
            <div className="security-settings__input-wrapper">
              <span className="security-settings__input-prefix">$</span>
              <input
                type="number"
                value={customTxUsd}
                onChange={(e) => setCustomTxUsd(e.target.value)}
                placeholder="500"
                className="security-settings__input"
                min="0"
              />
            </div>
            <span className="security-settings__input-hint">
              Maximum per transaction
              {customTxUsd && (
                <span className="security-settings__conversion">
                  ≈ {formatEth(usdToWei(parseFloat(customTxUsd) || 0, ethPriceUsd, tokenDecimals), tokenDecimals)} {tokenSymbol}
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Current Config Summary */}
      <div className="security-settings__summary">
        <h3 className="security-settings__summary-title">Current Configuration</h3>
        <div className="security-settings__summary-row">
          <span>Daily Limit:</span>
          <span>
            {currentConfig.dailyLimit === 0n
              ? 'Unlimited'
              : `${formatEth(currentConfig.dailyLimit, tokenDecimals)} ${tokenSymbol} (${formatUsd(weiToUsd(currentConfig.dailyLimit, ethPriceUsd, tokenDecimals))})`
            }
          </span>
        </div>
        <div className="security-settings__summary-row">
          <span>Transaction Limit:</span>
          <span>
            {currentConfig.transactionLimit === 0n
              ? 'Unlimited'
              : `${formatEth(currentConfig.transactionLimit, tokenDecimals)} ${tokenSymbol} (${formatUsd(weiToUsd(currentConfig.transactionLimit, ethPriceUsd, tokenDecimals))})`
            }
          </span>
        </div>
      </div>

      {/* 2FA Coming Soon Notice */}
      <div className="security-settings__future">
        <input type="checkbox" disabled className="security-settings__checkbox" />
        <span className="security-settings__future-label">
          Enable 2FA for large transactions
          <span className="security-settings__coming-soon">(Coming soon)</span>
        </span>
      </div>

      {/* Action Buttons */}
      <div className="security-settings__actions">
        {showSkip && (
          <button
            onClick={onSkip}
            className="security-settings__button security-settings__button--secondary"
          >
            Skip
          </button>
        )}
        <button
          onClick={handleContinue}
          className="security-settings__button security-settings__button--primary"
        >
          Continue
        </button>
      </div>

      {/* Styles */}
      <style>{`
        .security-settings {
          max-width: 480px;
          padding: 24px;
          background: #1a1a2e;
          border-radius: 16px;
          border: 1px solid #2d2d44;
          font-family: system-ui, -apple-system, sans-serif;
          color: #fff;
        }

        .security-settings__header {
          text-align: center;
          margin-bottom: 24px;
        }

        .security-settings__title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .security-settings__subtitle {
          font-size: 14px;
          color: #888;
          margin: 0;
        }

        .security-settings__presets {
          display: grid;
          gap: 12px;
          margin-bottom: 16px;
        }

        .security-settings__preset {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 16px;
          background: #252540;
          border: 2px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
        }

        .security-settings__preset:hover {
          background: #2d2d50;
        }

        .security-settings__preset--selected {
          border-color: #6366f1;
          background: #2d2d50;
        }

        .security-settings__preset--warning {
          border-color: #f59e0b;
        }

        .security-settings__preset-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .security-settings__preset-name {
          font-size: 16px;
          font-weight: 600;
        }

        .security-settings__preset-description {
          font-size: 12px;
          color: #888;
          margin-top: 4px;
        }

        .security-settings__preset-limits {
          font-size: 11px;
          color: #6366f1;
          margin-top: 8px;
        }

        .security-settings__custom-toggle {
          width: 100%;
          padding: 12px;
          background: transparent;
          border: 1px dashed #444;
          border-radius: 8px;
          color: #888;
          cursor: pointer;
          margin-bottom: 16px;
          transition: all 0.2s ease;
        }

        .security-settings__custom-toggle:hover,
        .security-settings__custom-toggle--active {
          border-color: #6366f1;
          color: #fff;
        }

        .security-settings__custom-form {
          background: #252540;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .security-settings__input-group {
          margin-bottom: 16px;
        }

        .security-settings__input-group:last-child {
          margin-bottom: 0;
        }

        .security-settings__label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .security-settings__input-wrapper {
          display: flex;
          align-items: center;
          background: #1a1a2e;
          border: 1px solid #444;
          border-radius: 8px;
          overflow: hidden;
        }

        .security-settings__input-prefix {
          padding: 12px;
          color: #888;
          background: #2d2d44;
        }

        .security-settings__input {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 16px;
          outline: none;
        }

        .security-settings__input::placeholder {
          color: #555;
        }

        .security-settings__input-hint {
          display: block;
          font-size: 12px;
          color: #888;
          margin-top: 4px;
        }

        .security-settings__conversion {
          display: block;
          color: #6366f1;
          margin-top: 2px;
        }

        .security-settings__summary {
          background: #252540;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .security-settings__summary-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px 0;
        }

        .security-settings__summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .security-settings__summary-row:last-child {
          margin-bottom: 0;
        }

        .security-settings__summary-row span:first-child {
          color: #888;
        }

        .security-settings__future {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #252540;
          border-radius: 8px;
          margin-bottom: 24px;
          opacity: 0.6;
        }

        .security-settings__checkbox {
          width: 16px;
          height: 16px;
        }

        .security-settings__future-label {
          font-size: 14px;
        }

        .security-settings__coming-soon {
          font-size: 11px;
          color: #888;
          margin-left: 8px;
        }

        .security-settings__actions {
          display: flex;
          gap: 12px;
        }

        .security-settings__button {
          flex: 1;
          padding: 14px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .security-settings__button--secondary {
          background: transparent;
          border: 1px solid #444;
          color: #888;
        }

        .security-settings__button--secondary:hover {
          border-color: #666;
          color: #fff;
        }

        .security-settings__button--primary {
          background: #6366f1;
          border: none;
          color: #fff;
        }

        .security-settings__button--primary:hover {
          background: #5558e3;
        }
      `}</style>
    </div>
  );
}

export default SecuritySettings;
