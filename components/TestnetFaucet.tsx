'use client';

import React, { useState } from 'react';

interface TestnetFaucetProps {
  vaultAddress: string;
  chainName: string;
  onSuccess?: () => void;
}

/**
 * TestnetFaucet - Component to claim testnet tokens
 * 
 * Supports Base Sepolia faucet integration
 * Shows user-friendly UI with loading states
 */
export function TestnetFaucet({ vaultAddress, chainName, onSuccess }: TestnetFaucetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Faucet URLs for different chains
  const faucetUrls: Record<string, string> = {
    'Base Sepolia': 'https://console.optimism.io/faucet',
    'Optimism Sepolia': 'https://console.optimism.io/faucet',
    'Arbitrum Sepolia': 'https://www.hackquest.io/faucets',
    'Solana Devnet': 'https://faucet.solana.com/',
    'Aptos Testnet': 'https://aptos.dev/network/faucet',
    'Sui Testnet': 'https://faucet.sui.io/',
  };

  const handleClaimTokens = async () => {
    setIsLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      // For Base Sepolia, we can try to use the direct API if available
      // Otherwise, we open the faucet in a new tab with the address pre-filled
      const faucetUrl = faucetUrls[chainName];
      
      if (faucetUrl) {
        // Copy address to clipboard for easy pasting
        await navigator.clipboard.writeText(vaultAddress);
        
        // Open faucet in new tab
        window.open(faucetUrl, '_blank');
        
        setStatus('success');
        onSuccess?.();
      } else {
        setErrorMessage(`No faucet available for ${chainName}`);
        setStatus('error');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to claim tokens';
      setErrorMessage(message);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-yellow-200 font-semibold mb-1">Claim Testnet Tokens</h3>
          <p className="text-yellow-300/70 text-sm mb-3">
            Get free test ETH to try sending transactions. Your address will be copied automatically.
          </p>
          
          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-400 text-sm mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Address copied! Paste it in the faucet to claim tokens.
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-400 text-sm mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {errorMessage}
            </div>
          )}
          
          <button
            onClick={handleClaimTokens}
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Opening Faucet...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Get Free Test ETH
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TestnetFaucet;
