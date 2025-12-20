'use client';

import { useState } from 'react';
import { useVeridex } from '../lib/VeridexContext';

const formatSolBalance = (sol: number): string => {
    if (sol === 0) return '0';
    if (sol < 0.0001) return '< 0.0001';
    if (sol < 1) return sol.toFixed(4);
    if (sol < 1000) return sol.toFixed(4);
    return sol.toFixed(2);
};

const formatUsdValue = (value: number): string => {
    if (value === 0) return '$0.00';
    if (value < 0.01) return '< $0.01';
    if (value < 1000) return `$${value.toFixed(2)}`;
    if (value < 1000000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${(value / 1000000).toFixed(2)}M`;
};

const truncateAddress = (address: string, chars: number = 6): string => {
    if (address.length <= chars * 2) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

interface SolanaBalanceCardProps {
    className?: string;
    showReceiveButton?: boolean;
}

export function SolanaBalanceCard({ className = '', showReceiveButton = true }: SolanaBalanceCardProps) {
    const {
        solanaVaultAddress,
        solanaBalance,
        isLoadingSolanaBalance,
        refreshSolanaBalance,
    } = useVeridex();

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshSolanaBalance();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleCopyAddress = async () => {
        if (!solanaVaultAddress) return;
        try {
            await navigator.clipboard.writeText(solanaVaultAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            console.error('Failed to copy address');
        }
    };

    const openExplorer = () => {
        if (!solanaVaultAddress) return;
        window.open(
            `https://explorer.solana.com/address/${solanaVaultAddress}?cluster=devnet`,
            '_blank'
        );
    };

    // Don't render if no Solana vault address (user hasn't registered with passkey)
    if (!solanaVaultAddress) {
        return (
            <div className={`bg-gradient-to-br from-purple-900/30 to-indigo-900/30 backdrop-blur-lg rounded-2xl border border-purple-500/30 overflow-hidden ${className}`}>
                <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <p className="text-purple-300 text-sm">
                        Register with a passkey to generate your Solana vault address
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-gradient-to-br from-purple-900/30 to-indigo-900/30 backdrop-blur-lg rounded-2xl border border-purple-500/30 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="p-6 border-b border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {/* Solana Logo */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
                            <svg viewBox="0 0 101 88" className="w-5 h-5" fill="currentColor">
                                <path d="M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H1.93563C1.55849 88 1.18957 87.8926 0.874202 87.6912C0.558829 87.4897 0.310607 87.2029 0.159259 86.8659C0.00791004 86.5289 -0.0400879 86.1561 0.0213784 85.7929C0.0828447 85.4298 0.251352 85.0928 0.506131 84.8249L17.1784 67.4051C17.5408 67.0267 17.9794 66.725 18.4667 66.5765C18.954 66.428 19.4797 66.3217 20.0109 66.3217H99.0495C99.4267 66.3217 99.7956 66.4291 100.111 66.6306C100.426 66.832 100.675 67.1188 100.826 67.4558C100.977 67.7929 101.025 68.1656 100.964 68.5765C100.902 68.9874 100.734 69.3065 100.48 69.3817Z" fill="url(#paint0_linear)"/>
                                <path d="M83.8068 34.3032C83.4444 33.9248 83.0058 33.6231 82.5185 33.4169C82.0312 33.2107 81.5055 33.1044 80.9743 33.1047H1.93563C1.55849 33.1047 1.18957 33.2121 0.874202 33.4135C0.558829 33.615 0.310607 33.9018 0.159259 34.2388C0.00791004 34.5758 -0.0400879 34.9486 0.0213784 35.3118C0.0828447 35.6749 0.251352 36.0119 0.506131 36.2798L17.1784 53.6996C17.5408 54.078 17.9794 54.3797 18.4667 54.5765C18.954 54.7733 19.4797 54.879 20.0109 54.879H99.0495C99.4267 54.879 99.7956 54.7717 100.111 54.5765C100.426 54.3813 100.675 54.0945 100.826 53.7575C100.977 53.4205 101.025 53.0477 100.964 52.6845C100.902 52.3214 100.734 51.9844 100.48 51.7165L83.8068 34.3032Z" fill="url(#paint1_linear)"/>
                                <path d="M17.1784 1.19852C17.5408 0.820147 17.9794 0.518434 18.4667 0.31221C18.954 0.105765 19.4797 -0.000488281 20.0109 0H99.0495C99.4267 0 99.7956 0.107443 100.111 0.308865C100.426 0.510287 100.675 0.797116 100.826 1.13412C100.977 1.47113 101.025 1.84388 100.964 2.20703C100.902 2.57018 100.734 2.90716 100.48 3.17508L83.8068 20.5765C83.4444 20.9549 83.0058 21.2566 82.5185 21.4628C82.0312 21.669 81.5055 21.7753 80.9743 21.775H1.93563C1.55849 21.775 1.18957 21.6676 0.874202 21.4662C0.558829 21.2647 0.310607 20.9779 0.159259 20.6409C0.00791004 20.3039 -0.0400879 19.9311 0.0213784 19.568C0.0828447 19.2048 0.251352 18.8679 0.506131 18.5999L17.1784 1.19852Z" fill="url(#paint2_linear)"/>
                                <defs>
                                    <linearGradient id="paint0_linear" x1="8.52588" y1="90.0973" x2="88.9933" y2="63.0073" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#00FFA3"/>
                                        <stop offset="1" stopColor="#DC1FFF"/>
                                    </linearGradient>
                                    <linearGradient id="paint1_linear" x1="8.52588" y1="56.9766" x2="88.9933" y2="29.8866" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#00FFA3"/>
                                        <stop offset="1" stopColor="#DC1FFF"/>
                                    </linearGradient>
                                    <linearGradient id="paint2_linear" x1="8.52588" y1="23.8561" x2="88.9933" y2="-3.23391" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#00FFA3"/>
                                        <stop offset="1" stopColor="#DC1FFF"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Solana</h3>
                            <p className="text-xs text-purple-300">Devnet</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isLoadingSolanaBalance || isRefreshing}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Refresh balance"
                    >
                        <svg 
                            className={`w-5 h-5 text-purple-300 ${isRefreshing ? 'animate-spin' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {/* Balance Display */}
                <div className="text-center py-4">
                    {isLoadingSolanaBalance ? (
                        <div className="animate-pulse">
                            <div className="h-10 bg-white/10 rounded-lg w-32 mx-auto mb-2" />
                            <div className="h-4 bg-white/10 rounded w-20 mx-auto" />
                        </div>
                    ) : (
                        <>
                            <p className="text-4xl font-bold text-white mb-1">
                                {formatSolBalance(solanaBalance?.sol ?? 0)} <span className="text-xl text-purple-300">SOL</span>
                            </p>
                            {solanaBalance?.usdValue != null && solanaBalance.usdValue > 0 && (
                                <p className="text-purple-300 text-sm">{formatUsdValue(solanaBalance.usdValue)}</p>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Vault Address Section */}
            {solanaVaultAddress && (
                <div className="p-4 border-b border-purple-500/20">
                    <p className="text-xs text-purple-300 mb-2">Vault Address (PDA)</p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm text-white bg-black/30 px-3 py-2 rounded-lg font-mono truncate">
                            {truncateAddress(solanaVaultAddress, 8)}
                        </code>
                        <button
                            onClick={handleCopyAddress}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Copy address"
                        >
                            {copied ? (
                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            )}
                        </button>
                        <button
                            onClick={openExplorer}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="View on Explorer"
                        >
                            <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Actions */}
            {showReceiveButton && solanaVaultAddress && (
                <div className="p-4">
                    <div className="flex gap-2">
                        <button
                            onClick={handleCopyAddress}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Receive SOL
                        </button>
                    </div>
                    <p className="text-xs text-purple-300/70 text-center mt-3">
                        Send SOL to your vault address to receive funds
                    </p>
                </div>
            )}

            {/* No vault address state */}
            {!solanaVaultAddress && (
                <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <p className="text-purple-300 text-sm">
                        Register with a passkey to generate your Solana vault address
                    </p>
                </div>
            )}
        </div>
    );
}

// Compact version for showing in lists or sidebars
interface SolanaBalanceRowProps {
    onClick?: () => void;
}

export function SolanaBalanceRow({ onClick }: SolanaBalanceRowProps) {
    const { solanaVaultAddress, solanaBalance, isLoadingSolanaBalance } = useVeridex();

    if (!solanaVaultAddress) return null;

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-colors group"
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">SOL</span>
                </div>
                <div className="text-left">
                    <p className="text-white font-medium">Solana</p>
                    <p className="text-gray-400 text-sm">Devnet</p>
                </div>
            </div>
            <div className="text-right">
                {isLoadingSolanaBalance ? (
                    <div className="animate-pulse">
                        <div className="h-4 bg-white/10 rounded w-16" />
                    </div>
                ) : (
                    <>
                        <p className="text-white font-medium">
                            {formatSolBalance(solanaBalance?.sol ?? 0)} SOL
                        </p>
                        {solanaBalance?.usdValue != null && solanaBalance.usdValue > 0 && (
                            <p className="text-gray-400 text-sm">{formatUsdValue(solanaBalance.usdValue)}</p>
                        )}
                    </>
                )}
            </div>
        </button>
    );
}

export default SolanaBalanceCard;
