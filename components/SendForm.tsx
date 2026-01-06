'use client';

import { useState, useEffect } from 'react';
import type { TokenInfo, PreparedTransfer, CrossChainProgress } from '@veridex/sdk';
import { ethers } from 'ethers';

// Chain options for cross-chain transfers (includes both EVM and non-EVM chains)
const CHAIN_OPTIONS = [
    { id: 10004, name: 'Base Sepolia', symbol: 'BASE', isEvm: true },
    { id: 10005, name: 'Optimism Sepolia', symbol: 'OP', isEvm: true },
    { id: 10003, name: 'Arbitrum Sepolia', symbol: 'ARB', isEvm: true },
    { id: 1, name: 'Solana Devnet', symbol: 'SOL', isEvm: false },
    { id: 21, name: 'Sui Testnet', symbol: 'SUI', isEvm: false },
    { id: 22, name: 'Aptos Testnet', symbol: 'APT', isEvm: false },
    { id: 50001, name: 'Starknet Sepolia', symbol: 'STRK', isEvm: false },
];

interface TransferParams {
    targetChain: number;
    token: string;
    recipient: string;
    amount: bigint;
}

interface BridgeParams {
    sourceChain: number;
    destinationChain: number;
    token: string;
    recipient: string;
    amount: bigint;
}

interface SendFormProps {
    tokens: TokenInfo[];
    currentChainId: number;
    /** Gasless transfer - user only needs passkey, no wallet required */
    onSendGasless?: (params: TransferParams) => Promise<{ transactionHash: string; sequence: bigint }>;
    /** Gasless bridge - for cross-chain transfers */
    onBridgeGasless?: (params: BridgeParams) => Promise<{ transactionHash: string; sequence: bigint }>;
    /** Legacy: Prepare transfer (requires wallet) */
    onPrepare?: (params: TransferParams) => Promise<PreparedTransfer>;
    /** Legacy: Execute prepared transfer (requires wallet) */
    onSend?: (prepared: PreparedTransfer) => Promise<{ transactionHash: string; sequence: bigint }>;
    isLoading: boolean;
    vaultAddress: string;
    /** Get vault address for a specific chain (for cross-chain self-transfer detection) */
    getVaultAddressForChain?: (wormholeChainId: number) => string | null;
}

export function SendForm({
    tokens,
    currentChainId,
    onSendGasless,
    onBridgeGasless,
    onPrepare,
    onSend,
    isLoading,
    vaultAddress,
    getVaultAddressForChain,
}: SendFormProps) {
    // Use gasless flow if available
    const isGasless = !!onSendGasless;
    
    const [step, setStep] = useState<'form' | 'confirm' | 'sending' | 'success'>('form');
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedToken, setSelectedToken] = useState(tokens[0]?.address || 'native');
    const [targetChain, setTargetChain] = useState(currentChainId);
    const [prepared, setPrepared] = useState<PreparedTransfer | null>(null);
    const [error, setError] = useState('');
    const [txHash, setTxHash] = useState('');
    const [sequence, setSequence] = useState<bigint | null>(null);

    const isCrossChain = targetChain !== currentChainId;
    const targetChainInfo = CHAIN_OPTIONS.find(c => c.id === targetChain);
    const isTargetSolana = targetChainInfo?.id === 1;
    const isTargetSui = targetChainInfo?.id === 21;
    const isTargetAptos = targetChainInfo?.id === 22;
    const isTargetStarknet = targetChainInfo?.id === 50001;
    
    // Check if source chain is Solana (sending FROM Solana vault)
    const currentChainInfo = CHAIN_OPTIONS.find(c => c.id === currentChainId);
    const isSourceSolana = currentChainInfo && !currentChainInfo.isEvm;

    // For Solana-originated transfers, force target to be Solana for now
    // (cross-chain Solana → EVM requires additional Token Bridge integration)
    const effectiveTargetChain = isSourceSolana ? 1 : targetChain;
    const isSolanaSameChain = isSourceSolana && effectiveTargetChain === 1;

    // Get selected token info
    const tokenInfo = isSourceSolana 
        ? {
            symbol: 'SOL',
            decimals: 9, // Solana uses 9 decimals for SOL
            name: 'Solana',
            address: 'native',
        }
        : tokens.find(t => t.address === selectedToken) || {
            symbol: 'ETH',
            decimals: 18,
            name: 'Ethereum',
            address: 'native',
        };

    // Check if recipient is the user's own vault (self-transfer warning)
    // For cross-chain transfers, check the target chain's vault address
    const targetChainVaultAddress = getVaultAddressForChain?.(targetChain) ?? null;
    const isSelfTransfer = recipient && (
        // Check against current chain vault
        (vaultAddress && recipient.toLowerCase() === vaultAddress.toLowerCase()) ||
        // Check against target chain vault (for cross-chain self-transfers)
        (targetChainVaultAddress && recipient.toLowerCase() === targetChainVaultAddress.toLowerCase())
    );
    const isCrossChainSelfTransfer = isSelfTransfer && isCrossChain && 
        targetChainVaultAddress && recipient.toLowerCase() === targetChainVaultAddress.toLowerCase();

    // Validate address based on target chain
    const isValidAddress = (addr: string): boolean => {
        if (isTargetSolana) {
            // Solana addresses are base58 encoded, typically 32-44 characters
            // Basic validation: alphanumeric (no 0, O, I, l to avoid confusion)
            const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
            return base58Regex.test(addr);
        }
        if (isTargetSui) {
            // Sui addresses are 0x + 64 hex characters (32 bytes)
            // Must start with 0x and be exactly 66 characters
            return /^0x[0-9a-fA-F]{64}$/.test(addr);
        }
        if (isTargetAptos) {
            // Aptos addresses are 0x + up to 64 hex characters (32 bytes)
            // Can be shorter (will be left-padded with zeros)
            return /^0x[0-9a-fA-F]{1,64}$/.test(addr);
        }
        if (isTargetStarknet) {
            // Starknet addresses are felt252 (0x + up to 64 hex chars)
            // Must be valid hex and within felt252 range (< 2^251)
            if (!/^0x[0-9a-fA-F]{1,64}$/.test(addr)) {
                return false;
            }
            // Basic range check: ensure it's not too large for felt252
            // Felt252 max ≈ 0x0800000000000011000000000000000000000000000000000000000000000000
            try {
                const num = BigInt(addr);
                const FELT252_MAX = BigInt('0x0800000000000011000000000000000000000000000000000000000000000000');
                return num < FELT252_MAX;
            } catch {
                return false;
            }
        }
        return ethers.isAddress(addr);
    };

    const handlePrepare = async () => {
        if (!recipient || !amount) {
            setError('Please fill in all fields');
            return;
        }

        if (!isValidAddress(recipient)) {
            setError(
                isTargetSolana 
                    ? 'Invalid Solana address (base58, 32-44 chars)'
                    : isTargetSui
                    ? 'Invalid Sui address (0x + 64 hex chars)'
                    : isTargetAptos
                    ? 'Invalid Aptos address (0x + up to 64 hex chars)'
                    : isTargetStarknet
                    ? 'Invalid Starknet address (0x + hex, felt252 range)'
                    : 'Invalid recipient address'
            );
            return;
        }

        setError('');

        try {
            const amountBigInt = ethers.parseUnits(amount, tokenInfo.decimals);
            
            // If gasless, skip prepare step and go straight to confirm
            if (isGasless) {
                // Store params for gasless send
                setPrepared({
                    params: {
                        targetChain,
                        token: selectedToken,
                        recipient,
                        amount: amountBigInt,
                    },
                } as any);
                setStep('confirm');
                return;
            }
            
            // Legacy flow: prepare transfer
            if (onPrepare) {
                const prep = await onPrepare({
                    targetChain,
                    token: selectedToken,
                    recipient,
                    amount: amountBigInt,
                });
                setPrepared(prep);
                setStep('confirm');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to prepare transfer');
        }
    };

    const handleSend = async () => {
        setStep('sending');
        setError('');

        try {
            // Check if this is a cross-chain transfer (destination differs from source)
            const isCrossChainSend = prepared?.params && prepared.params.targetChain !== currentChainId;
            
            // Gasless flow: route to bridge for cross-chain, transfer for same-chain
            if (isGasless && prepared?.params) {
                if (isCrossChainSend && onBridgeGasless) {
                    // Use bridge for cross-chain transfers
                    const bridgeParams = {
                        sourceChain: currentChainId,
                        destinationChain: prepared.params.targetChain,
                        token: prepared.params.token,
                        recipient: prepared.params.recipient,
                        amount: prepared.params.amount,
                    };
                    console.log('[SendForm] Cross-chain transfer detected, using bridge:', bridgeParams);
                    const result = await onBridgeGasless(bridgeParams);
                    setTxHash(result.transactionHash);
                    setSequence(result.sequence);
                    setStep('success');
                    return;
                } else if (onSendGasless) {
                    // Same-chain transfer
                    console.log('[SendForm] Same-chain transfer:', prepared.params);
                    const result = await onSendGasless(prepared.params);
                    setTxHash(result.transactionHash);
                    setSequence(result.sequence);
                    setStep('success');
                    return;
                }
            }
            
            // Legacy flow: use onSend with prepared transfer
            if (onSend && prepared) {
                const result = await onSend(prepared);
                setTxHash(result.transactionHash);
                setSequence(result.sequence);
                setStep('success');
            }
        } catch (err: any) {
            setError(err.message || 'Transfer failed');
            setStep('confirm');
        }
    };

    const resetForm = () => {
        setStep('form');
        setRecipient('');
        setAmount('');
        setPrepared(null);
        setError('');
        setTxHash('');
        setSequence(null);
    };

    // Render based on current step
    
    // Show "Coming Soon" only for Solana → EVM cross-chain transfers
    // Solana-to-Solana (same chain) transfers ARE supported
    const isSolanaCrossChain = isSourceSolana && targetChain !== 1;
    if (isSolanaCrossChain) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Solana → EVM Bridge</h3>
                <p className="text-purple-400 font-semibold mb-2">Coming Soon!</p>
                <p className="text-gray-400 text-sm mb-6">
                    Cross-chain transfers from Solana to EVM chains require Token Bridge integration.
                </p>
                
                <div className="bg-white/5 rounded-xl p-4 text-left mb-4">
                    <p className="text-sm text-gray-300 mb-3">
                        <span className="text-green-400 font-medium">OK What you can do now:</span>
                    </p>
                    <ul className="text-sm text-gray-400 space-y-2 ml-4">
                        <li>• <span className="text-white">Send within Solana</span> to other Solana wallets</li>
                        <li>• <span className="text-white">Receive funds</span> on your Solana vault</li>
                        <li>• <span className="text-white">Send TO Solana</span> from EVM chains</li>
                    </ul>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-left">
                    <p className="text-xs text-green-300 mb-2"> To send within Solana:</p>
                    <p className="text-sm text-gray-400">
                        Select &quot;Solana Devnet&quot; as the destination chain to send to another Solana wallet.
                    </p>
                </div>
            </div>
        );
    }
    
    if (step === 'success') {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Transfer Sent!</h3>
                <p className="text-gray-400 text-sm mb-4">
                    Your {isCrossChain ? 'cross-chain' : ''} transfer has been dispatched
                </p>

                <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
                    <div className="mb-3">
                        <p className="text-xs text-gray-400">Transaction Hash</p>
                        <p className="text-white font-mono text-sm break-all">{txHash}</p>
                    </div>
                    {sequence !== null && (
                        <div>
                            <p className="text-xs text-gray-400">VAA Sequence</p>
                            <p className="text-white font-mono">{sequence.toString()}</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={resetForm}
                    className="w-full py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition"
                >
                    Send Another
                </button>
            </div>
        );
    }

    if (step === 'sending') {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <svg className="w-8 h-8 text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sending...</h3>
                <p className="text-gray-400 text-sm">
                    {isCrossChain 
                        ? 'Dispatching cross-chain transfer via Wormhole'
                        : 'Signing and sending transaction'}
                </p>
            </div>
        );
    }

    if (step === 'confirm' && prepared) {
        const willUseBridge = isCrossChain && !!onBridgeGasless;
        const currentChainName = CHAIN_OPTIONS.find(c => c.id === currentChainId)?.name;
        const targetChainName = CHAIN_OPTIONS.find(c => c.id === targetChain)?.name;
        
        return (
            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">
                    {willUseBridge ? 'Confirm Bridge' : 'Confirm Transfer'}
                </h3>

                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Amount</span>
                        <span className="text-white font-medium">
                            {amount} {tokenInfo.symbol}
                        </span>
                    </div>
                    {willUseBridge && (
                        <div className="flex justify-between">
                            <span className="text-gray-400">From</span>
                            <span className="text-white">
                                {currentChainName}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-gray-400">{willUseBridge ? 'To Chain' : 'Network'}</span>
                        <span className="text-white">
                            {targetChainName}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Recipient</span>
                        <span className="text-white font-mono text-sm">
                            {recipient.slice(0, 8)}...{recipient.slice(-6)}
                        </span>
                    </div>
                    {isCrossChain && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Transfer Type</span>
                            <span className={`flex items-center gap-1 ${willUseBridge ? 'text-blue-400' : 'text-purple-400'}`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                {willUseBridge ? 'Wormhole Bridge' : 'Cross-Chain Transfer'}
                            </span>
                        </div>
                    )}
                    {willUseBridge && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-200">
                            <p className="font-medium mb-1">🌉 How this works:</p>
                            <p className="text-blue-300/80">
                                Your {currentChainName} vault will bridge funds via Wormhole Token Bridge to {targetChainName}.
                            </p>
                        </div>
                    )}
                    <div className="border-t border-white/10 pt-4">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Estimated Fee</span>
                            <span className="text-white">{prepared.formattedCost}</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={() => setStep('form')}
                        className="flex-1 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isLoading}
                        className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
                    >
                        Confirm & Sign
                    </button>
                </div>
            </div>
        );
    }

    // Form step
    return (
        <div className="space-y-4">
            {/* Recipient */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Recipient Address
                </label>
                <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        isSelfTransfer ? 'border-yellow-500/50' : 'border-white/10'
                    }`}
                    placeholder={isSourceSolana || isTargetSolana ? "Solana address..." : "0x..."}
                />
                {isSelfTransfer && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                        {isCrossChainSelfTransfer ? (
                            // Cross-chain to own vault - this is good, will use bridge!
                            <div className="flex items-center gap-2 text-blue-400">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>
                                    Bridging to your {targetChainInfo?.name || 'destination chain'} vault via Wormhole.
                                </span>
                            </div>
                        ) : (
                            // Same-chain self-transfer warning
                            <div className="flex items-center gap-2 text-yellow-400">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>This is your own vault address. You&apos;re sending funds to yourself.</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Quick action: Use my vault on destination chain */}
            {isCrossChain && targetChainVaultAddress && !isSelfTransfer && (
                <button
                    type="button"
                    onClick={() => setRecipient(targetChainVaultAddress)}
                    className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Bridge to my {targetChainInfo?.name} vault
                </button>
            )}

            {/* Token Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Token
                </label>
                <select
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    {isSourceSolana ? (
                        // Solana tokens
                        <option value="native">SOL (Native)</option>
                    ) : (
                        // EVM tokens
                        <>
                            <option value="native">ETH (Native)</option>
                            {tokens.filter(t => t.address !== 'native').map((token) => (
                                <option key={token.address} value={token.address}>
                                    {token.symbol} - {token.name}
                                </option>
                            ))}
                        </>
                    )}
                </select>
            </div>

            {/* Amount */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount
                </label>
                <div className="relative">
                    <input
                        type="number"
                        step="any"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 pr-16"
                        placeholder="0.00"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        {tokenInfo.symbol}
                    </span>
                </div>
            </div>

            {/* Target Chain */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Destination Chain
                </label>
                <select
                    value={targetChain}
                    onChange={(e) => setTargetChain(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    {CHAIN_OPTIONS.map((chain) => (
                        <option key={chain.id} value={chain.id}>
                            {chain.name} {chain.id === currentChainId ? '(Current)' : ''}
                        </option>
                    ))}
                </select>
            </div>

            {isCrossChain && (
                <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-purple-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-sm font-medium">Cross-Chain Transfer</span>
                    </div>
                    <p className="text-purple-200/70 text-xs mt-1">
                        This transfer will be sent via Wormhole to the destination chain
                    </p>
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
                    {error}
                </div>
            )}

            <button
                onClick={handlePrepare}
                disabled={isLoading || !recipient || !amount}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Preparing...' : 'Continue'}
            </button>
        </div>
    );
}
