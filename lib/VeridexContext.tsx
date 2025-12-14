'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { VeridexSDK, PasskeyCredential } from '@veridex/sdk';
import { EVMClient } from '@veridex/sdk/chains/evm';
import { ethers } from 'ethers';
import { config } from '@/lib/config';

interface VeridexContextType {
    sdk: VeridexSDK | null;
    credential: PasskeyCredential | null;
    signer: ethers.Signer | null;
    address: string | null;
    isConnected: boolean;
    isRegistered: boolean;
    vaultAddress: string | null;
    register: (username: string, displayName: string) => Promise<void>;
    login: () => Promise<void>;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    logout: () => void;
}

const VeridexContext = createContext<VeridexContextType | undefined>(undefined);

export function VeridexProvider({ children }: { children: ReactNode }) {
    const [sdk, setSdk] = useState<VeridexSDK | null>(null);
    const [credential, setCredential] = useState<PasskeyCredential | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [vaultAddress, setVaultAddress] = useState<string | null>(null);

    // Initialize SDK on mount
    useEffect(() => {
        const evmClient = new EVMClient({
            chainId: config.chainId,
            wormholeChainId: config.wormholeChainId,
            rpcUrl: config.rpcUrl,
            hubContractAddress: config.hubContract,
            wormholeCoreBridge: config.wormholeCoreBridge,
            name: config.chainName,
            explorerUrl: config.explorerUrl,
        });

        const veridexSdk = new VeridexSDK({
            chain: evmClient,
        });

        setSdk(veridexSdk);

        // Try to load existing credential
        const savedCred = veridexSdk.passkey.loadFromLocalStorage();
        if (savedCred) {
            veridexSdk.setCredential(savedCred);
            setCredential(savedCred);
            loadVaultAddress(veridexSdk);
        }
    }, []);

    const loadVaultAddress = async (sdk: VeridexSDK) => {
        try {
            const vaultInfo = await sdk.getVaultInfo();
            setVaultAddress(vaultInfo?.address || null);
        } catch (error) {
            // Don't throw - vault might not exist yet or contract might not be deployed
            console.warn('Could not load vault address:', error);
            setVaultAddress(null);
        }
    };

    const register = async (username: string, displayName: string) => {
        if (!sdk) throw new Error('SDK not initialized');

        try {
            const cred = await sdk.passkey.register(username, displayName);
            sdk.setCredential(cred);
            setCredential(cred);
            sdk.passkey.saveToLocalStorage();

            // Load vault address
            await loadVaultAddress(sdk);
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const login = async () => {
        if (!sdk) throw new Error('SDK not initialized');

        try {
            // Create a challenge
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            // Sign with passkey
            await sdk.passkey.sign(challenge);

            // Load credential from storage
            const cred = sdk.passkey.loadFromLocalStorage();
            if (cred) {
                sdk.setCredential(cred);
                setCredential(cred);
                await loadVaultAddress(sdk);
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const connectWallet = async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
            throw new Error('MetaMask not installed');
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);

            // Request account access
            await provider.send('eth_requestAccounts', []);

            // Get signer
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            // Check if we're on the right network
            const network = await provider.getNetwork();
            if (Number(network.chainId) !== config.chainId) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: `0x${config.chainId.toString(16)}` }],
                    });
                } catch (switchError: any) {
                    // Chain not added, try to add it
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: `0x${config.chainId.toString(16)}`,
                                chainName: config.chainName,
                                rpcUrls: [config.rpcUrl],
                                blockExplorerUrls: [config.explorerUrl],
                            }],
                        });
                    } else {
                        throw switchError;
                    }
                }
            }

            setSigner(signer);
            setAddress(address);
        } catch (error) {
            console.error('Wallet connection error:', error);
            throw error;
        }
    };

    const disconnectWallet = () => {
        setSigner(null);
        setAddress(null);
    };

    const logout = () => {
        if (sdk) {
            sdk.passkey.removeFromLocalStorage();
        }
        setCredential(null);
        setVaultAddress(null);
    };

    return (
        <VeridexContext.Provider
            value={{
                sdk,
                credential,
                signer,
                address,
                isConnected: !!signer && !!address,
                isRegistered: !!credential,
                vaultAddress,
                register,
                login,
                connectWallet,
                disconnectWallet,
                logout,
            }}
        >
            {children}
        </VeridexContext.Provider>
    );
}

export function useVeridex() {
    const context = useContext(VeridexContext);
    if (context === undefined) {
        throw new Error('useVeridex must be used within a VeridexProvider');
    }
    return context;
}

// Extend Window interface for TypeScript
declare global {
    interface Window {
        ethereum?: any;
    }
}
