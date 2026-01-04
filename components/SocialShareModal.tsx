'use client';

import React, { useState } from 'react';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  vaultAddresses: {
    base?: string | null;
    optimism?: string | null;
    arbitrum?: string | null;
    solana?: string | null;
    aptos?: string | null;
    sui?: string | null;
  };
}

/**
 * SocialShareModal - Share your wallet creation on social media
 * Supports Twitter/X, Telegram, WhatsApp, LinkedIn, and copy link
 * Optimized for viral sharing with platform-specific messaging
 */
export function SocialShareModal({ isOpen, onClose, username, vaultAddresses }: SocialShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Count active chains
  const activeChains = Object.values(vaultAddresses).filter(Boolean).length;

  // Platform-specific share text - optimized for virality
  const getShareText = (platform: 'twitter' | 'farcaster' | 'telegram' | 'whatsapp' | 'linkedin') => {
    const baseEmoji = '🔐';
    const fireEmoji = '🔥';
    const rocketEmoji = '🚀';
    
    switch (platform) {
      case 'twitter':
        // Short, punchy, hashtag-optimized
        return `I just created a cross-chain wallet with my face ${baseEmoji}

No seed phrase to lose
No gas fees to pay
${activeChains} chains, 1 identity

The future of crypto UX is here ${rocketEmoji}`;
      
      case 'farcaster':
        // Crypto-native, technical but accessible
        return `gm. just tried veridex ${baseEmoji}

passkey → wallet on ${activeChains} chains. no seed phrase. no gas.

built on webauthn + wormhole. this is the UX we needed. ${fireEmoji}`;
      
      case 'telegram':
        // Informal, group-chat friendly
        return `Just discovered something wild ${baseEmoji}

Created a crypto wallet using just FaceID/TouchID:
✓ No seed phrase
✓ No gas fees  
✓ Works on ${activeChains} chains

This is actually what mainstream adoption looks like`;
      
      case 'whatsapp':
        // Personal, conversational
        return `Hey! Check this out - I just created a crypto wallet with my fingerprint/face ${baseEmoji}

No complicated seed phrases to write down
No gas fees to worry about
Works across ${activeChains} different blockchains

This is the easiest crypto onboarding I've ever seen`;
      
      case 'linkedin':
        // Professional, thought-leadership angle
        return `The crypto UX problem may finally be solved.

I just created a cross-chain wallet using only WebAuthn (FaceID/TouchID):

• No seed phrase to secure
• Zero gas fees  
• Instant deployment on ${activeChains} chains
• Full self-custody

This is what mainstream crypto adoption requires. The tech is here.`;
      
      default:
        return `I just created a cross-chain passkey wallet! No seed phrase, no gas fees.`;
    }
  };

  const shareUrl = 'https://veridex.network';
  const hashtags = ['Veridex', 'Web3', 'Passkeys', 'Crypto'];

  // Social share handlers
  const shareToTwitter = () => {
    const text = getShareText('twitter');
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}&hashtags=${hashtags.join(',')}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareToFarcaster = () => {
    const text = getShareText('farcaster');
    const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text + '\n\n' + shareUrl)}`;
    window.open(farcasterUrl, '_blank', 'width=600,height=400');
  };

  const shareToTelegram = () => {
    const text = getShareText('telegram');
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    const text = getShareText('whatsapp');
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + shareUrl)}`;
    window.open(whatsappUrl, '_blank', 'width=600,height=400');
  };

  const shareToLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=400');
  };

  const copyToClipboard = async () => {
    try {
      const text = getShareText('twitter'); // Use Twitter format as default
      await navigator.clipboard.writeText(`${text}\n\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const socialButtons = [
    {
      name: 'X (Twitter)',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      onClick: shareToTwitter,
      color: 'bg-black hover:bg-gray-900',
    },
    {
      name: 'Farcaster',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.24 0H5.76C2.58 0 0 2.58 0 5.76v12.48C0 21.42 2.58 24 5.76 24h12.48c3.18 0 5.76-2.58 5.76-5.76V5.76C24 2.58 21.42 0 18.24 0zM12 18.72c-3.72 0-6.72-3-6.72-6.72S8.28 5.28 12 5.28s6.72 3 6.72 6.72-3 6.72-6.72 6.72z" />
        </svg>
      ),
      onClick: shareToFarcaster,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      name: 'Telegram',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
      onClick: shareToTelegram,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      name: 'WhatsApp',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      onClick: shareToWhatsApp,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      onClick: shareToLinkedIn,
      color: 'bg-blue-700 hover:bg-blue-800',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Share Your Achievement!</h2>
          <p className="text-gray-400">
            Show the world you&apos;re ahead of the curve
          </p>
        </div>

        {/* Preview */}
        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-white/5">
          <p className="text-gray-300 text-sm whitespace-pre-line line-clamp-4">
            {getShareText('twitter').slice(0, 150)}...
          </p>
          <p className="text-gray-500 text-xs mt-2">
            ✨ Each platform gets custom messaging
          </p>
        </div>

        {/* Social Buttons Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {socialButtons.map((button) => (
            <button
              key={button.name}
              onClick={button.onClick}
              className={`${button.color} text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:scale-105`}
            >
              {button.icon}
              <span className="text-xs font-medium">{button.name}</span>
            </button>
          ))}
          
          {/* Copy Link Button */}
          <button
            onClick={copyToClipboard}
            className={`${copied ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'} text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-all`}
          >
            {copied ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            )}
            <span className="text-xs font-medium">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Username Badge */}
        <div className="text-center pt-4 border-t border-white/10">
          <span className="text-gray-500 text-sm">Sharing as </span>
          <span className="text-purple-400 font-mono">@{username}</span>
        </div>
      </div>
    </div>
  );
}

export default SocialShareModal;
