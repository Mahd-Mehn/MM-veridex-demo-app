'use client';

import React, { useRef, useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { logger } from '@/lib/logger';

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
      // Clone the element and convert oklch colors to rgb for html2canvas compatibility
      const clone = cardRef.current.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '-9999px';
      // Force explicit dimensions to avoid layout issues
      clone.style.width = cardRef.current.offsetWidth + 'px';
      document.body.appendChild(clone);
      
      // Convert oklch colors to fallback colors and fix layout issues
      const convertOklchColors = (element: HTMLElement) => {
        const computed = window.getComputedStyle(element);
        const props = ['color', 'backgroundColor', 'borderColor'];
        props.forEach(prop => {
          const value = computed.getPropertyValue(prop);
          if (value.includes('oklch')) {
            // Fallback to a solid color based on the element's context
            if (prop === 'color') {
              element.style.color = 'white';
            } else if (prop === 'backgroundColor') {
              element.style.backgroundColor = '#1e1b4b'; // dark purple fallback
            }
          }
        });
        // Also check gradients in background-image
        const bgImage = computed.getPropertyValue('background-image');
        if (bgImage.includes('oklch')) {
          // Keep the gradient but it may render as transparent
          // The inline styles in the component should handle this
        }
        
        // Force text rendering for monospace elements
        if (computed.fontFamily.includes('monospace') || computed.fontFamily.includes('ui-monospace')) {
          element.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
          element.style.letterSpacing = '0.02em';
        }
        
        // Ensure truncated text shows properly
        if (element.classList.contains('truncate') || computed.textOverflow === 'ellipsis') {
          const text = element.textContent || '';
          element.style.whiteSpace = 'nowrap';
          element.style.overflow = 'hidden';
          element.style.textOverflow = 'ellipsis';
          element.style.display = 'block';
        }
        
        Array.from(element.children).forEach(child => {
          if (child instanceof HTMLElement) {
            convertOklchColors(child);
          }
        });
      };
      
      convertOklchColors(clone);
      
      const canvas = await html2canvas(clone, {
        backgroundColor: '#0f0a1f', // Fallback dark background
        scale: 2,
        useCORS: true,
        logging: false,
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight,
        // Remove unsupported CSS functions
        onclone: (doc) => {
          // Additional cleanup and font forcing
          const style = doc.createElement('style');
          style.textContent = `
            * {
              --tw-ring-color: rgba(139, 92, 246, 0.5) !important;
            }
            [style*="monospace"], [style*="ui-monospace"] {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
              letter-spacing: 0.02em !important;
            }
          `;
          doc.head.appendChild(style);
        }
      });
      
      document.body.removeChild(clone);
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    } catch (err) {
      logger.error('Failed to capture card:', err);
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
            logger.log('Share with image cancelled or failed, trying without');
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
      {/* The shareable card - using inline styles for html2canvas compatibility */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl p-8 shadow-2xl"
        style={{ 
          minWidth: '340px', 
          maxWidth: '420px',
          background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Decorative elements */}
        <div 
          className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl" 
          style={{ background: 'linear-gradient(to bottom right, rgba(236, 72, 153, 0.3), rgba(168, 85, 247, 0.3))' }}
        />
        <div 
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl" 
          style={{ background: 'linear-gradient(to top right, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2))' }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(to bottom right, #a855f7, #ec4899)' }}
            >
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.25rem' }}>Veridex</h3>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Passkey Wallet</p>
            </div>
          </div>

          {/* Achievement Banner */}
          <div 
            className="rounded-2xl p-4 mb-6"
            style={{ 
              background: 'linear-gradient(to right, rgba(236, 72, 153, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(236, 72, 153, 0.3)'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🎉</span>
              <span style={{ color: 'white', fontWeight: '600' }}>Wallet Created!</span>
            </div>
            <p style={{ color: '#d1d5db', fontSize: '0.875rem' }}>
              I just created a cross-chain wallet with my fingerprint 🤯
            </p>
          </div>

          {/* User Info */}
          <div className="mb-6">
            <p style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Identity</p>
            <p style={{ color: 'white', fontFamily: 'monospace', fontSize: '1.125rem' }}>@{username}</p>
          </div>

          {/* Chain Addresses */}
          <div className="space-y-2 mb-6">
            <p style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              {activeChains} Chain{activeChains !== 1 ? 's' : ''} Connected
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(vaultAddresses).map(([chain, address]) => {
                if (!address) return null;
                const chainInfo = chainIcons[chain];
                return (
                  <div
                    key={chain}
                    className="rounded-lg px-3 py-2 flex items-center gap-2"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                      minWidth: 0,
                    }}
                  >
                    <span style={{ fontSize: '0.875rem', flexShrink: 0 }}>{chainInfo?.icon || '⬡'}</span>
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <p style={{ color: 'white', fontSize: '0.75rem', fontWeight: '500', margin: 0 }}>{chainInfo?.name || chain}</p>
                      <p style={{ 
                        color: '#9ca3af', 
                        fontSize: '9px', 
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        letterSpacing: '0.02em',
                      }}>
                        {truncateAddress(address)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="flex items-center gap-2">
              <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>No seed phrase</span>
              <span style={{ color: '#4b5563' }}>•</span>
              <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>No gas fees</span>
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>demo.veridex.network</div>
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
