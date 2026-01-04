'use client';

import React, { useRef, useState, useCallback } from 'react';

interface VaultAddresses {
  base?: string | null;
  optimism?: string | null;
  arbitrum?: string | null;
  solana?: string | null;
  aptos?: string | null;
  sui?: string | null;
}

interface ShareCardProps {
  username: string;
  vaultAddresses: VaultAddresses;
  onShare: () => void;
}

/**
 * ShareCard - A visually stunning card that users can screenshot or share
 * Shows their passkey wallet creation achievement with vault addresses
 * 
 * Supports:
 * - Social media share button
 * - Native share API (mobile)
 * - Screenshot hint for Instagram/TikTok
 */
export function ShareCard({ username, vaultAddresses, onShare }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showScreenshotHint, setShowScreenshotHint] = useState(false);

  // Count active chains
  const activeChains = Object.values(vaultAddresses).filter(Boolean).length;

  // Truncate address for display
  const truncateAddress = (address: string | null | undefined) => {
    if (!address) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Native share API for mobile
  const handleNativeShare = useCallback(async () => {
    const shareData = {
      title: 'My Veridex Wallet',
      text: `I just created a cross-chain passkey wallet! 🔐 ${activeChains} chains, no seed phrase. Try it: veridex.network`,
      url: 'https://veridex.network',
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed, fall back to modal
        onShare();
      }
    } else {
      onShare();
    }
  }, [activeChains, onShare]);

  // Show screenshot hint for Instagram/TikTok
  const handleScreenshotHint = useCallback(() => {
    setShowScreenshotHint(true);
    setTimeout(() => setShowScreenshotHint(false), 3000);
  }, []);

  const chainIcons: Record<string, { icon: string; color: string; name: string }> = {
    base: { icon: '🔵', color: 'from-blue-500 to-blue-600', name: 'Base' },
    optimism: { icon: '🔴', color: 'from-red-500 to-red-600', name: 'Optimism' },
    arbitrum: { icon: '🔷', color: 'from-blue-400 to-cyan-500', name: 'Arbitrum' },
    solana: { icon: '🟣', color: 'from-purple-500 to-indigo-600', name: 'Solana' },
    aptos: { icon: '🟢', color: 'from-green-500 to-emerald-600', name: 'Aptos' },
    sui: { icon: '🔵', color: 'from-cyan-400 to-teal-500', name: 'Sui' },
    // starknet removed for now
  };

  return (
    <div className="relative">
      {/* The shareable card */}
      <div
        ref={cardRef}
        className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-8 border border-white/20 shadow-2xl"
        style={{ minWidth: '340px', maxWidth: '420px' }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">Veridex</h3>
              <p className="text-gray-400 text-sm">Passkey Wallet</p>
            </div>
          </div>

          {/* Achievement Banner */}
          <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl p-4 mb-6 border border-pink-500/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🎉</span>
              <span className="text-white font-semibold">Wallet Created!</span>
            </div>
            <p className="text-gray-300 text-sm">
              I just created a cross-chain wallet with my fingerprint 🤯
            </p>
          </div>

          {/* User Info */}
          <div className="mb-6">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Identity</p>
            <p className="text-white font-mono text-lg">@{username}</p>
          </div>

          {/* Chain Addresses */}
          <div className="space-y-2 mb-6">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
              {activeChains} Chain{activeChains !== 1 ? 's' : ''} Connected
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(vaultAddresses).map(([chain, address]) => {
                if (!address) return null;
                const chainInfo = chainIcons[chain];
                return (
                  <div
                    key={chain}
                    className={`bg-gradient-to-r ${chainInfo?.color || 'from-gray-500 to-gray-600'} bg-opacity-20 rounded-lg px-3 py-2 flex items-center gap-2`}
                    style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))` }}
                  >
                    <span className="text-sm">{chainInfo?.icon || '⬡'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium">{chainInfo?.name || chain}</p>
                      <p className="text-gray-400 text-[10px] font-mono truncate">
                        {truncateAddress(address)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs">No seed phrase</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400 text-xs">No gas fees</span>
            </div>
            <div className="text-gray-500 text-xs">veridex.network</div>
          </div>
        </div>
        
        {/* Screenshot hint overlay */}
        {showScreenshotHint && (
          <div className="absolute inset-0 bg-black/80 rounded-3xl flex items-center justify-center">
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-white font-semibold mb-2">Screenshot this card!</p>
              <p className="text-gray-400 text-sm">Perfect for Instagram Stories & TikTok</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 space-y-2">
        {/* Primary Share Button */}
        <button
          onClick={handleNativeShare}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share My Wallet
        </button>
        
        {/* Screenshot hint for Instagram/TikTok */}
        <button
          onClick={handleScreenshotHint}
          className="w-full py-3 bg-white/5 text-gray-300 font-medium rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Screenshot for Instagram/TikTok
        </button>
      </div>
    </div>
  );
}

export default ShareCard;
