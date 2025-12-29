'use client';

import { useState } from 'react';

// Types for transaction summary (Issue #26)
// These mirror the types from @veridex/sdk but are defined locally
// to avoid build dependency issues in the test-app

type RiskLevel = 'info' | 'warning' | 'high' | 'critical';
type RiskWarningType = 'new_recipient' | 'large_transaction' | 'contract_interaction' | 'full_balance' | 'unknown_token' | 'cross_chain' | 'config_change';
type ActionDisplayType = 'transfer' | 'bridge' | 'execute' | 'config';

interface RiskWarning {
  level: RiskLevel;
  type: RiskWarningType;
  message: string;
  details?: string;
}

interface TokenDisplay {
  symbol: string;
  name: string;
  address: string;
  amount: string;
  rawAmount: bigint;
  decimals: number;
  iconUrl?: string;
  isVerified?: boolean;
}

interface RecipientDisplay {
  address: string;
  displayName?: string;
  isContract?: boolean;
  isNewRecipient?: boolean;
}

interface ChainDisplay {
  chainId: number;
  name: string;
  iconUrl?: string;
}

interface TransferDetails {
  token: TokenDisplay;
  recipient: RecipientDisplay;
  chain: ChainDisplay;
  formattedAmount: string;
  usdValue?: string;
}

interface BridgeDetails extends TransferDetails {
  sourceChain: ChainDisplay;
  destinationChain: ChainDisplay;
  estimatedTime?: string;
  bridgeFee?: string;
}

interface ExecuteDetails {
  target: RecipientDisplay;
  functionName: string;
  value: bigint;
  valueDisplay: string;
  calldata: string;
  decodedArgs?: Record<string, unknown>;
  chain: ChainDisplay;
}

interface ConfigDetails {
  configType: number;
  configTypeDisplay: string;
  description: string;
  changes: Array<{ field: string; newValue: string }>;
  chain: ChainDisplay;
}

type ActionDetails = TransferDetails | BridgeDetails | ExecuteDetails | ConfigDetails;

interface TransactionSummaryType {
  id: string;
  actionType: ActionDisplayType;
  title: string;
  description: string;
  details: ActionDetails;
  risks: RiskWarning[];
  gasCost: {
    amount: bigint;
    formatted: string;
    usdValue?: string;
  };
  expiresIn: string;
  expiresAt: number;
  technicalDetails: {
    actionId: number;
    actionType: string;
    nonce: string;
    targetChain: number;
    payloadHash: string;
    rawPayload: string;
  };
}

interface TransactionSummaryProps {
  summary: TransactionSummaryType;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Human-Readable Transaction Summary Component (Issue #26)
 * 
 * Security-critical: This component displays exactly what users are signing
 * before biometric authentication. It must:
 * 1. Clearly show action type (Transfer, Bridge, Execute, Config)
 * 2. Display human-readable amounts (not raw wei)
 * 3. Show recipient with proper formatting
 * 4. Highlight risk warnings prominently
 * 5. Provide expandable technical details
 * 6. Allow user to cancel before signing
 */
export function TransactionSummary({
  summary,
  onConfirm,
  onCancel,
  isLoading = false,
}: TransactionSummaryProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Get action icon based on type
  const getActionIcon = () => {
    switch (summary.actionType) {
      case 'transfer':
        return (
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        );
      case 'bridge':
        return (
          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'execute':
        return (
          <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      case 'config':
        return (
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Get color scheme based on risk level
  const getRiskLevelColor = (level: RiskWarning['level']) => {
    switch (level) {
      case 'critical':
        return 'bg-red-500/20 border-red-500/50 text-red-200';
      case 'high':
        return 'bg-orange-500/20 border-orange-500/50 text-orange-200';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200';
      case 'info':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-200';
      default:
        return 'bg-gray-500/20 border-gray-500/50 text-gray-200';
    }
  };

  // Get icon for risk level
  const getRiskIcon = (level: RiskWarning['level']) => {
    switch (level) {
      case 'critical':
      case 'high':
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Sort warnings by severity
  const sortedWarnings = [...summary.risks].sort((a, b) => {
    const order: Record<RiskLevel, number> = { critical: 0, high: 1, warning: 2, info: 3 };
    return order[a.level] - order[b.level];
  });

  // Check for critical/high warnings
  const hasCriticalWarnings = sortedWarnings.some(w => w.level === 'critical' || w.level === 'high');

  return (
    <div className="space-y-6">
      {/* Header with action type */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
          {getActionIcon()}
        </div>
        <h3 className="text-xl font-bold text-white">{summary.title}</h3>
        <p className="text-gray-400 mt-2">{summary.description}</p>
      </div>

      {/* Risk Warnings - Show prominently if any */}
      {sortedWarnings.length > 0 && (
        <div className="space-y-3">
          {sortedWarnings.map((warning, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border ${getRiskLevelColor(warning.level)}`}
            >
              <div className="flex items-start gap-3">
                {getRiskIcon(warning.level)}
                <div>
                  <p className="font-medium">{warning.message}</p>
                  {warning.details && (
                    <p className="text-sm opacity-80 mt-1">{warning.details}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Details */}
      <div className="bg-white/5 rounded-xl p-4 space-y-4">
        {/* Token & Amount */}
        {summary.details && 'token' in summary.details && summary.details.token && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Amount</span>
            <div className="text-right">
              <span className="text-white font-medium text-lg">
                {summary.details.formattedAmount} {summary.details.token.symbol}
              </span>
              {summary.details.usdValue && (
                <p className="text-gray-400 text-sm">≈ ${summary.details.usdValue}</p>
              )}
            </div>
          </div>
        )}

        {/* Recipient */}
        {summary.details && 'recipient' in summary.details && summary.details.recipient && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">To</span>
            <div className="text-right">
              <span className="text-white font-mono text-sm">
                {summary.details.recipient.displayName || summary.details.recipient.address}
              </span>
              {summary.details.recipient.isNewRecipient && (
                <p className="text-yellow-400 text-xs mt-1">⚠️ First time sending to this address</p>
              )}
            </div>
          </div>
        )}

        {/* Chain Info */}
        {summary.details && 'chain' in summary.details && summary.details.chain && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Network</span>
            <span className="text-white">{summary.details.chain.name}</span>
          </div>
        )}

        {/* Bridge-specific: Destination Chain */}
        {summary.details && 'destinationChain' in summary.details && summary.details.destinationChain && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">From</span>
              <span className="text-white">{(summary.details as any).sourceChain?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">To</span>
              <span className="text-purple-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {summary.details.destinationChain.name}
              </span>
            </div>
            {summary.details.estimatedTime && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Est. Time</span>
                <span className="text-gray-300">{summary.details.estimatedTime}</span>
              </div>
            )}
          </>
        )}

        {/* Execute-specific: Contract Call */}
        {summary.details && 'functionName' in summary.details && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Contract</span>
              <span className="text-white font-mono text-sm">
                {(summary.details as any).target?.displayName || (summary.details as any).target?.address}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Function</span>
              <span className="text-yellow-400 font-mono">{summary.details.functionName}</span>
            </div>
            {summary.details.valueDisplay && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Value</span>
                <span className="text-white">{summary.details.valueDisplay}</span>
              </div>
            )}
          </>
        )}

        {/* Config-specific: Changes */}
        {summary.details && 'configTypeDisplay' in summary.details && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Config Type</span>
              <span className="text-blue-400">{summary.details.configTypeDisplay}</span>
            </div>
            {summary.details.changes?.map((change: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-gray-400">{change.field}</span>
                <span className="text-white font-mono text-sm">{change.newValue}</span>
              </div>
            ))}
          </>
        )}

        {/* Divider */}
        <div className="border-t border-white/10 pt-4 mt-4">
          {/* Gas Costs */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Network Fee</span>
            <span className="text-white">{summary.gasCost.formatted}</span>
          </div>
          {summary.gasCost.usdValue && (
            <div className="flex justify-between items-center mt-1">
              <span></span>
              <span className="text-gray-400 text-sm">≈ ${summary.gasCost.usdValue}</span>
            </div>
          )}
        </div>

        {/* Expiration */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Expires in</span>
          <span className="text-gray-400">{summary.expiresIn}</span>
        </div>
      </div>

      {/* Technical Details (Expandable) */}
      <div className="border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full px-4 py-3 flex items-center justify-between text-gray-400 hover:bg-white/5 transition"
        >
          <span className="text-sm">Technical Details</span>
          <svg
            className={`w-5 h-5 transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showTechnicalDetails && summary.technicalDetails && (
          <div className="px-4 pb-4 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-gray-500">Action Type</span>
              <span className="text-gray-300">{summary.technicalDetails.actionType} ({summary.technicalDetails.actionId})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Nonce</span>
              <span className="text-gray-300">{summary.technicalDetails.nonce}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Target Chain</span>
              <span className="text-gray-300">{summary.technicalDetails.targetChain}</span>
            </div>
            {summary.technicalDetails.payloadHash && (
              <div>
                <span className="text-gray-500">Payload Hash</span>
                <p className="text-gray-300 break-all mt-1">{summary.technicalDetails.payloadHash}</p>
              </div>
            )}
            {summary.technicalDetails.rawPayload && (
              <div>
                <span className="text-gray-500">Raw Payload</span>
                <p className="text-gray-300 break-all mt-1 max-h-20 overflow-y-auto">
                  {summary.technicalDetails.rawPayload}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`flex-1 py-3 font-semibold rounded-xl transition disabled:opacity-50 ${
            hasCriticalWarnings
              ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing...
            </span>
          ) : hasCriticalWarnings ? (
            'Confirm Anyway'
          ) : (
            'Confirm & Sign'
          )}
        </button>
      </div>

      {/* Security Notice */}
      <p className="text-center text-xs text-gray-500">
        You&apos;ll be asked to authenticate with your passkey after confirming.
        <br />
        Review all details carefully before proceeding.
      </p>
    </div>
  );
}

export default TransactionSummary;
