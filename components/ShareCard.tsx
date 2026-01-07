'use client';

import React, { useRef, useState, useCallback } from 'react';
import html2canvas from 'html2canvas';

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
 * - Social media share button with image
 * - Native share API (mobile) with card image
 * - Screenshot capture and download
 */
export function ShareCard({ username, vaultAddresses, onShare }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showScreenshotHint, setShowScreenshotHint] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Count active chains
  const activeChains = Object.values(vaultAddresses).filter(Boolean).length;

  // Truncate address for display
  const truncateAddress = (address: string | null | undefined) => {
    if (!address) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Capture card as image blob
  const captureCardImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
      });
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    } catch (err) {
      console.error('Failed to capture card:', err);
      return null;
    }
  }, []);

  // Download card as image
  const downloadCardImage = useCallback(async () => {
    setIsCapturing(true);
    try {
      const blob = await captureCardImage();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `veridex-wallet-${username}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsCapturing(false);
    }
  }, [captureCardImage, username]);

  // Native share API with image support
  const handleNativeShare = useCallback(async () => {
    setIsCapturing(true);
    try {
      const blob = await captureCardImage();
      
      const shareText = `I just created a cross-chain passkey wallet! 🔐 ${activeChains} chains, no seed phrase. Try it: demo.veridex.network`;
      
      // Try sharing with image first (if supported)
      if (blob && navigator.share && navigator.canShare) {
        const file = new File([blob], 'veridex-wallet.png', { type: 'image/png' });
        const shareDataWithImage: ShareData = {
          title: 'My Veridex Wallet',
          text: shareText,
          url: 'https://demo.veridex.network',
          files: [file],
        };
        
        if (navigator.canShare(shareDataWithImage)) {
          try {
            await navigator.share(shareDataWithImage);
            return;
          } catch (err) {
            // User cancelled or share with image failed, try without image
            console.log('Share with image cancelled or failed, trying without');
          }
        }
      }
      
      // Fallback: share without image
      const shareData: ShareData = {
        title: 'My Veridex Wallet',
        text: shareText,
        url: 'https://demo.veridex.network',
      };
      
      if (navigator.share && navigator.canShare?.(shareData)) {
        try {
          await navigator.share(shareData);
          return;
        } catch (err) {
          // User cancelled or share failed
        }
      }
      
      // Final fallback: open modal
      onShare();
    } finally {
      setIsCapturing(false);
    }
  }, [activeChains, captureCardImage, onShare]);

  // Show screenshot hint for Instagram/TikTok
  const handleScreenshotHint = useCallback(async () => {
    // Download the image automatically
    await downloadCardImage();
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
            <div className="text-gray-500 text-xs">demo.veridex.network</div>
          </div>
        </div>
        
        {/* Download success overlay */}
        {showScreenshotHint && (
          <div className="absolute inset-0 bg-black/80 rounded-3xl flex items-center justify-center">
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold mb-2">Card Downloaded! ✨</p>
              <p className="text-gray-400 text-sm">Share it on Instagram Stories & TikTok</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 space-y-2">
        {/* Primary Share Button */}
        <button
          onClick={handleNativeShare}
          disabled={isCapturing}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
        >
          {isCapturing ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Capturing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share My Wallet
            </>
          )}
        </button>
        
        {/* Download image for Instagram/TikTok */}
        <button
          onClick={handleScreenshotHint}
          disabled={isCapturing}
          className="w-full py-3 bg-white/5 text-gray-300 font-medium rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/10 disabled:opacity-70"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Card for Stories
        </button>
      </div>
    </div>
  );
}

export default ShareCard;
