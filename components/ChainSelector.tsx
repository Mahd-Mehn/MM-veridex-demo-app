'use client';

import { useState } from 'react';

export interface ChainOption {
    id: number;
    name: string;
    symbol: string;
    logo?: string;
    color: string;
    /** Whether this is an EVM chain (default: true) */
    isEvm?: boolean;
    /** Native token symbol */
    nativeToken?: string;
    /** Explorer URL template */
    explorerUrl?: string;
}

export const SUPPORTED_CHAINS: ChainOption[] = [
    { id: 10004, name: 'Base Sepolia', symbol: 'BASE', color: 'from-blue-500 to-blue-600', isEvm: true, nativeToken: 'ETH', explorerUrl: 'https://sepolia.basescan.org' },
    { id: 10005, name: 'Optimism Sepolia', symbol: 'OP', color: 'from-red-500 to-red-600', isEvm: true, nativeToken: 'ETH', explorerUrl: 'https://sepolia-optimism.etherscan.io' },
    { id: 10003, name: 'Arbitrum Sepolia', symbol: 'ARB', color: 'from-cyan-500 to-blue-600', isEvm: true, nativeToken: 'ETH', explorerUrl: 'https://sepolia.arbiscan.io' },
    { id: 1, name: 'Solana Devnet', symbol: 'SOL', color: 'from-purple-500 to-cyan-400', isEvm: false, nativeToken: 'SOL', explorerUrl: 'https://explorer.solana.com' },
    { id: 21, name: 'Sui Testnet', symbol: 'SUI', color: 'from-cyan-500 to-teal-500', isEvm: false, nativeToken: 'SUI', explorerUrl: 'https://suiscan.xyz/testnet' },
    { id: 22, name: 'Aptos Testnet', symbol: 'APT', color: 'from-green-500 to-emerald-600', isEvm: false, nativeToken: 'APT', explorerUrl: 'https://explorer.aptoslabs.com' },
    // Starknet removed for now - will be re-enabled once fully integrated
    // { id: 50001, name: 'Starknet Sepolia', symbol: 'STRK', color: 'from-orange-500 to-pink-600', isEvm: false, nativeToken: 'ETH', explorerUrl: 'https://sepolia.starkscan.co' },
];

/** Helper to check if a chain is Solana */
export const isSolanaChain = (chainId: number): boolean => chainId === 1;

/** Helper to check if a chain is Sui */
export const isSuiChain = (chainId: number): boolean => chainId === 21;

/** Helper to check if a chain is Aptos */
export const isAptosChain = (chainId: number): boolean => chainId === 22;

/** Helper to check if a chain is Starknet */
export const isStarknetChain = (chainId: number): boolean => chainId === 50001;

/** Helper to check if a chain is EVM */
export const isEvmChain = (chainId: number): boolean => {
    const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
    return chain?.isEvm !== false;
};

interface ChainSelectorProps {
    selectedChainId: number;
    onSelect: (chainId: number) => void;
    showAllBalances?: boolean;
}

export function ChainSelector({ selectedChainId, onSelect, showAllBalances }: ChainSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedChain = SUPPORTED_CHAINS.find(c => c.id === selectedChainId) || SUPPORTED_CHAINS[0];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition"
            >
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${selectedChain.color}`} />
                <span className="text-white font-medium">{selectedChain.symbol}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 rounded-xl border border-white/10 shadow-xl z-20 overflow-hidden">
                        <div className="p-2">
                            <p className="text-xs text-gray-400 px-2 py-1">Select Network</p>
                            {SUPPORTED_CHAINS.map((chain) => (
                                <button
                                    key={chain.id}
                                    onClick={() => {
                                        onSelect(chain.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                                        chain.id === selectedChainId 
                                            ? 'bg-white/10 text-white' 
                                            : 'text-gray-300 hover:bg-white/5'
                                    }`}
                                >
                                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${chain.color}`} />
                                    <span className="flex-1 text-left">{chain.name}</span>
                                    {chain.id === selectedChainId && (
                                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                        {showAllBalances && (
                            <div className="border-t border-white/10 p-2">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-full text-left px-3 py-2 text-purple-400 hover:bg-white/5 rounded-lg transition text-sm"
                                >
                                    View All Chains →
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

interface ChainTabsProps {
    selectedChainId: number;
    onSelect: (chainId: number) => void;
}

export function ChainTabs({ selectedChainId, onSelect }: ChainTabsProps) {
    return (
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
            {SUPPORTED_CHAINS.map((chain) => (
                <button
                    key={chain.id}
                    onClick={() => onSelect(chain.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        chain.id === selectedChainId
                            ? 'bg-white/10 text-white shadow'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${chain.color}`} />
                    <span className="text-sm font-medium">{chain.symbol}</span>
                </button>
            ))}
        </div>
    );
}
