'use client';

import { useState, useEffect } from 'react';
import type { PortfolioBalance, TokenBalance } from '@veridex/sdk';

interface BalanceCardProps {
    balances: PortfolioBalance | null;
    isLoading: boolean;
    onRefresh: () => void;
    chainName: string;
}

const formatBalance = (balance: string, decimals: number = 18): string => {
    const num = Number(balance) / Math.pow(10, decimals);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return `${(num / 1000).toFixed(2)}K`;
    return `${(num / 1000000).toFixed(2)}M`;
};

const formatUsdValue = (value: number): string => {
    if (value === 0) return '$0.00';
    if (value < 0.01) return '< $0.01';
    if (value < 1000) return `$${value.toFixed(2)}`;
    if (value < 1000000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${(value / 1000000).toFixed(2)}M`;
};

// Token icons mapping (using emojis for now - can be replaced with actual icons)
const tokenIcons: Record<string, string> = {
    ETH: '⟠',
    WETH: '⟠',
    USDC: '💵',
    USDT: '💵',
    DAI: '🔶',
    WBTC: '₿',
    LINK: '🔗',
    UNI: '🦄',
    default: '🪙',
};

const getTokenIcon = (symbol: string): string => {
    return tokenIcons[symbol.toUpperCase()] || tokenIcons.default;
};

interface TokenRowProps {
    token: TokenBalance;
    onClick?: () => void;
}

function TokenRow({ token, onClick }: TokenRowProps) {
    const balance = formatBalance(token.balance.toString(), token.decimals);
    const usdValue = token.usdValue ? formatUsdValue(token.usdValue) : null;

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-colors group"
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-lg">
                    {getTokenIcon(token.symbol)}
                </div>
                <div className="text-left">
                    <p className="text-white font-medium">{token.symbol}</p>
                    <p className="text-gray-400 text-sm">{token.name || token.symbol}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-white font-medium">{balance}</p>
                {usdValue && (
                    <p className="text-gray-400 text-sm">{usdValue}</p>
                )}
            </div>
        </button>
    );
}

export function BalanceCard({ balances, isLoading, onRefresh, chainName }: BalanceCardProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await onRefresh();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    // Calculate total portfolio value
    const totalValue = balances?.tokens.reduce((sum, t) => sum + (t.usdValue || 0), 0) || 0;

    // Filter to show tokens with balance
    const tokensWithBalance = balances?.tokens.filter(t => BigInt(t.balance) > 0n) || [];
    const zeroBalanceTokens = balances?.tokens.filter(t => BigInt(t.balance) === 0n) || [];

    return (
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Your Balance</h3>
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading || isRefreshing}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <svg 
                            className={`w-5 h-5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {/* Total Value */}
                <div className="text-center py-4">
                    {isLoading ? (
                        <div className="animate-pulse">
                            <div className="h-10 bg-white/10 rounded-lg w-32 mx-auto mb-2" />
                            <div className="h-4 bg-white/10 rounded w-20 mx-auto" />
                        </div>
                    ) : (
                        <>
                            <p className="text-4xl font-bold text-white mb-1">
                                {formatUsdValue(totalValue)}
                            </p>
                            <p className="text-gray-400 text-sm">{chainName}</p>
                        </>
                    )}
                </div>
            </div>

            {/* Token List */}
            <div className="divide-y divide-white/5">
                {isLoading ? (
                    <div className="p-4 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 animate-pulse">
                                <div className="w-10 h-10 rounded-full bg-white/10" />
                                <div className="flex-1">
                                    <div className="h-4 bg-white/10 rounded w-20 mb-2" />
                                    <div className="h-3 bg-white/10 rounded w-32" />
                                </div>
                                <div className="h-4 bg-white/10 rounded w-16" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {tokensWithBalance.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-gray-400 mb-2">No tokens yet</p>
                                <p className="text-gray-500 text-sm">
                                    Receive tokens to see them here
                                </p>
                            </div>
                        ) : (
                            <div className="py-2">
                                {tokensWithBalance.map((token) => (
                                    <TokenRow key={token.address} token={token} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Show all tokens option */}
            {zeroBalanceTokens.length > 0 && !isLoading && (
                <div className="p-4 border-t border-white/10">
                    <details className="group">
                        <summary className="flex items-center justify-between cursor-pointer text-gray-400 hover:text-white transition">
                            <span className="text-sm">Show all tokens ({zeroBalanceTokens.length})</span>
                            <svg className="w-4 h-4 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </summary>
                        <div className="mt-2 py-2">
                            {zeroBalanceTokens.map((token) => (
                                <TokenRow key={token.address} token={token} />
                            ))}
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
}

interface BalanceSummaryProps {
    nativeBalance: string;
    nativeSymbol: string;
    usdValue?: number;
}

export function BalanceSummary({ nativeBalance, nativeSymbol, usdValue }: BalanceSummaryProps) {
    const balance = formatBalance(nativeBalance);

    return (
        <div className="text-center py-6">
            <p className="text-5xl font-bold text-white mb-2">
                {balance} <span className="text-2xl text-gray-400">{nativeSymbol}</span>
            </p>
            {usdValue !== undefined && (
                <p className="text-gray-400 text-lg">{formatUsdValue(usdValue)}</p>
            )}
        </div>
    );
}
