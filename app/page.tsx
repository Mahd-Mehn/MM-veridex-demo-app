'use client';

import { useState, useEffect } from 'react';
import { useVeridex } from '@/lib/VeridexContext';
import { BalanceCard } from '@/components/BalanceDisplay';
import { SolanaBalanceCard } from '@/components/SolanaBalanceDisplay';
import { SendForm } from '@/components/SendForm';
import { ReceiveModal } from '@/components/QRCode';
import { ChainTabs, SUPPORTED_CHAINS, isSolanaChain, isEvmChain } from '@/components/ChainSelector';
import { SyncConfirmationModal } from '@/components/SyncConfirmationModal';
import { SyncWarningBanner, SecuritySettings } from '@/components/SyncWarningBanner';
import { needsSyncConfirmation, shouldShowWarningBanner, clearSyncStatus } from '@/lib/platformSync';
import { config } from '@/lib/config';

type Tab = 'wallet' | 'send' | 'activity';

export default function Home() {
  const {
    sdk,
    credential,
    signer,
    address,
    isConnected,
    isRegistered,
    vaultAddress,
    vaultDeployed,
    isLoading,
    register,
    login,
    connectWallet,
    disconnectWallet,
    logout,
    deleteCredential,
    hasStoredCredential,
    createVault,
    vaultBalances,
    isLoadingBalances,
    refreshBalances,
    getTokenList,
    prepareTransfer,
    executeTransfer,
    transferGasless,
    pendingTransactions,
    bridgeProgress,
    // Sponsored vault creation (automatic, but expose loading state)
    isCreatingSponsoredVaults,
    // Solana
    solanaVaultAddress,
    solanaBalance,
    isLoadingSolanaBalance,
    refreshSolanaBalance,
    // Backup passkey (Issue #22/#25)
    hasBackupPasskey,
    isAddingBackupPasskey,
    addBackupPasskey,
  } = useVeridex();

  const [activeTab, setActiveTab] = useState<Tab>('wallet');
  const [selectedChain, setSelectedChain] = useState<number>(config.wormholeChainId);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasExistingCredential, setHasExistingCredential] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  // Sync confirmation modal state (Issue #25)
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);

  // Check for stored credential on mount
  useEffect(() => {
    setHasExistingCredential(hasStoredCredential());
  }, [hasStoredCredential, isRegistered]);

  // Refresh balances when vault address changes
  useEffect(() => {
    if (vaultAddress) {
      // Refresh balances regardless of wallet connection
      // (we can read balances without being connected)
      refreshBalances();
    }
  }, [vaultAddress]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await register(username, displayName);
      setSuccess('Passkey registered successfully!');
      setUsername('');
      setDisplayName('');
      // Show sync confirmation modal after registration (Issue #25)
      setShowSyncModal(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await login();
      setSuccess('Welcome back!');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    setLoading(true);
    setError('');
    try {
      await connectWallet();
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVault = async () => {
    setLoading(true);
    setError('');
    try {
      await createVault();
      setSuccess('Vault created successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to create vault');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding backup passkey (Issue #25)
  const handleAddBackupPasskey = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first to add a backup passkey');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await addBackupPasskey();
      setSuccess('Backup passkey added successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to add backup passkey');
    } finally {
      setLoading(false);
    }
  };

  // Handle updating sync status (Issue #25)
  const handleUpdateSyncStatus = () => {
    setShowSyncModal(true);
  };

  // Show onboarding if not registered
  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Veridex Wallet</h1>
            <p className="text-gray-400">Passkey-powered cross-chain wallet</p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200 text-sm">
              {success}
            </div>
          )}

          {/* Welcome Back - Show when credential exists */}
          {hasExistingCredential && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-4">
              <h2 className="text-xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-gray-400 text-sm mb-6">
                Sign in with your passkey to access your wallet
              </p>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Sign In with Passkey
                  </>
                )}
              </button>
              <div className="mt-4 pt-4 border-t border-white/10 text-center">
                <button
                  onClick={() => setHasExistingCredential(false)}
                  className="text-gray-400 hover:text-white text-sm transition"
                >
                  Create a new wallet instead
                </button>
              </div>
            </div>
          )}

          {/* Create New Wallet */}
          {!hasExistingCredential && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-2">Create Your Wallet</h2>
              <p className="text-gray-400 text-sm mb-6">
                Set up a passkey to secure your cross-chain wallet
              </p>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter a username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Your name"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Wallet'}
                </button>
              </form>
              {hasStoredCredential() && (
                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                  <button
                    onClick={() => setHasExistingCredential(true)}
                    className="text-gray-400 hover:text-white text-sm transition"
                  >
                    ← Sign in with existing passkey
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main wallet UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg">Veridex</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Wallet Connection Status */}
            {!isConnected ? (
              <button
                onClick={handleConnectWallet}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-red-600 transition text-sm"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-white text-sm font-mono">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>
            )}

            {/* Settings/Logout */}
            <div className="relative group">
              <button className="p-2 hover:bg-white/10 rounded-lg transition">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-xl border border-white/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="p-2">
                  <button
                    onClick={() => setShowSecuritySettings(true)}
                    className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white/10 rounded-lg transition text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Security
                  </button>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white/10 rounded-lg transition text-sm"
                  >
                    Sign Out
                  </button>
                  <button
                    onClick={() => {
                      deleteCredential();
                      clearSyncStatus();
                      setHasExistingCredential(false);
                    }}
                    className="w-full text-left px-3 py-2 text-red-400 hover:bg-white/10 rounded-lg transition text-sm"
                  >
                    Delete Wallet
                  </button>
                  {isConnected && (
                    <button
                      onClick={disconnectWallet}
                      className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white/10 rounded-lg transition text-sm"
                    >
                      Disconnect Wallet
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-300 hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200 text-sm flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="text-green-300 hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Sync Warning Banner (Issue #25) */}
        {shouldShowWarningBanner() && !showSyncModal && (
          <SyncWarningBanner
            onAddBackupPasskey={handleAddBackupPasskey}
            onUpdateSyncStatus={handleUpdateSyncStatus}
          />
        )}

        {/* Vault Address Card */}
        {(vaultAddress || solanaVaultAddress) && (
          <div className={`mb-6 backdrop-blur-lg rounded-2xl p-6 border ${
            isSolanaChain(selectedChain) 
              ? 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/30' 
              : 'bg-white/10 border-white/20'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Your Vault</h3>
              <ChainTabs selectedChainId={selectedChain} onSelect={setSelectedChain} />
            </div>
            
            {/* Chain-specific content */}
            {isSolanaChain(selectedChain) ? (
              // Solana Vault Content
              <>
                <p className="text-purple-200 font-mono text-sm break-all">{solanaVaultAddress || 'Not available'}</p>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isLoadingSolanaBalance ? (
                      <div className="animate-pulse h-5 w-20 bg-white/10 rounded" />
                    ) : (
                      <span className="text-white font-medium">
                        {(solanaBalance?.sol ?? 0).toFixed(4)} SOL
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={refreshSolanaBalance}
                      disabled={isLoadingSolanaBalance}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Refresh balance"
                    >
                      <svg 
                        className={`w-4 h-4 text-purple-300 ${isLoadingSolanaBalance ? 'animate-spin' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (solanaVaultAddress) {
                          navigator.clipboard.writeText(solanaVaultAddress);
                          setSuccess('Solana address copied!');
                        }
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Copy address"
                    >
                      <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => window.open(`https://explorer.solana.com/address/${solanaVaultAddress}?cluster=devnet`, '_blank')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="View on Explorer"
                    >
                      <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Ready to receive SOL</span>
                </div>
              </>
            ) : (
              // EVM Vault Content
              <>
                <p className="text-gray-400 font-mono text-sm break-all">{vaultAddress}</p>
                
                {/* Show subtle loading indicator while vaults are being created in background */}
                {isCreatingSponsoredVaults && (
                  <div className="mt-3 flex items-center gap-2 text-gray-400 text-sm">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Setting up your wallet...</span>
                  </div>
                )}

                {/* Show vault status - green checkmark when ready */}
                {vaultDeployed && !isCreatingSponsoredVaults && (
                  <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Ready to send & receive</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Action Buttons - Always show when registered */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => {
              // Check for appropriate address based on chain
              const currentAddress = isSolanaChain(selectedChain) ? solanaVaultAddress : vaultAddress;
              if (!currentAddress) {
                setError('No wallet address found for selected chain');
                return;
              }
              if (isCreatingSponsoredVaults && !isSolanaChain(selectedChain)) {
                setError('Please wait, your wallet is being set up...');
                return;
              }
              // Allow opening Send tab even for Solana - it will show Coming Soon message
              setActiveTab('send');
            }}
            className={`py-4 rounded-xl font-medium transition flex flex-col items-center gap-2 ${
              activeTab === 'send' 
                ? 'bg-purple-500 text-white' 
                : isCreatingSponsoredVaults && !isSolanaChain(selectedChain)
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
            Send
          </button>
          <button
            onClick={() => {
              // Check for appropriate address based on chain
              const currentAddress = isSolanaChain(selectedChain) ? solanaVaultAddress : vaultAddress;
              if (!currentAddress) {
                setError('No wallet address found for selected chain');
                return;
              }
              setShowReceiveModal(true);
            }}
            className="py-4 rounded-xl font-medium transition flex flex-col items-center gap-2 bg-white/10 text-gray-300 hover:bg-white/20"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
            Receive
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-4 rounded-xl font-medium transition flex flex-col items-center gap-2 ${
              activeTab === 'activity' 
                ? 'bg-purple-500 text-white' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Activity
          </button>
        </div>

        {/* Setup prompts - Passkey-first approach */}
        {activeTab === 'wallet' && (
          <div className="mb-6 space-y-4">
            {/* Wallet ready - can receive funds */}
            {vaultAddress && !vaultDeployed && !isCreatingSponsoredVaults && (
              <div className="bg-purple-500/20 border border-purple-500/30 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-purple-200 font-semibold mb-1">Your Wallet is Ready!</h3>
                    <p className="text-purple-300/70 text-sm mb-3">
                      Your wallet address is generated. You can receive funds at this address now.
                    </p>
                    <div className="bg-black/30 rounded-lg p-3 mb-4">
                      <p className="text-gray-400 text-xs mb-1">Your Wallet Address</p>
                      <p className="text-white font-mono text-sm break-all">{vaultAddress}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setShowReceiveModal(true)}
                        className="px-4 py-2 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-400 transition"
                      >
                        Show QR Code
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(vaultAddress);
                          setSuccess('Address copied!');
                        }}
                        className="px-4 py-2 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition"
                      >
                        Copy Address
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vault deployed - fully operational with gasless transfers */}
            {vaultAddress && vaultDeployed && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-green-200 text-sm">
                      <strong>Ready to send!</strong> Transfers are gasless - just use your passkey to sign.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Content Area */}
        {activeTab === 'wallet' && (
          isSolanaChain(selectedChain) ? (
            // Solana Balance Display
            solanaVaultAddress && (
              <SolanaBalanceCard showReceiveButton={false} />
            )
          ) : (
            // EVM Balance Display
            vaultAddress && (
              <BalanceCard
                balances={vaultBalances}
                isLoading={isLoadingBalances}
                onRefresh={refreshBalances}
                chainName={SUPPORTED_CHAINS.find(c => c.id === selectedChain)?.name || 'Unknown'}
              />
            )
          )
        )}

        {activeTab === 'send' && (vaultAddress || solanaVaultAddress) && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Send</h3>
              <button
                onClick={() => setActiveTab('wallet')}
                className="text-gray-400 hover:text-white transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SendForm
              tokens={getTokenList()}
              currentChainId={selectedChain}
              onSendGasless={async (params) => {
                // Gasless transfers work the same way for all chains:
                // 1. User signs with passkey
                // 2. Relayer submits to Hub (Base)
                // 3. Hub emits VAA to target chain
                // 4. Relayer delivers to spoke (EVM or Solana)
                const result = await transferGasless({
                  targetChain: params.targetChain,
                  token: params.token,
                  recipient: params.recipient,
                  amount: params.amount,
                });
                setActiveTab('wallet');
                return result;
              }}
              isLoading={isLoading}
              vaultAddress={(isSolanaChain(selectedChain) ? solanaVaultAddress : vaultAddress) ?? ''}
            />
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Activity</h3>
              <button
                onClick={() => setActiveTab('wallet')}
                className="text-gray-400 hover:text-white transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {pendingTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-400 mb-2">No pending transactions</p>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  Outgoing transactions you initiate will appear here. 
                  Incoming deposits are reflected in your balance.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTransactions.map((tx) => (
                  <div key={tx.hash} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.status === 'confirmed' ? 'bg-green-500/20' :
                      tx.status === 'pending' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                    }`}>
                      {tx.status === 'confirmed' ? (
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : tx.status === 'pending' ? (
                        <svg className="w-5 h-5 text-yellow-400 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Transaction</p>
                      <p className="text-gray-400 text-sm font-mono">
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      tx.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                      tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bridge Progress Overlay */}
        {bridgeProgress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{bridgeProgress.message}</h3>
              <p className="text-gray-400 text-sm mb-4">
                Step {bridgeProgress.step} of {bridgeProgress.totalSteps}
              </p>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${(bridgeProgress.step / bridgeProgress.totalSteps) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Receive Modal */}
        <ReceiveModal
          isOpen={showReceiveModal}
          onClose={() => setShowReceiveModal(false)}
          address={(isSolanaChain(selectedChain) ? solanaVaultAddress : vaultAddress) || ''}
          chainName={SUPPORTED_CHAINS.find(c => c.id === selectedChain)?.name || 'Unknown'}
          onCopy={() => setSuccess('Address copied!')}
          isSolana={isSolanaChain(selectedChain)}
        />

        {/* Sync Confirmation Modal (Issue #25) */}
        <SyncConfirmationModal
          isOpen={showSyncModal}
          onComplete={() => setShowSyncModal(false)}
          onAddBackupPasskey={handleAddBackupPasskey}
        />

        {/* Security Settings Modal (Issue #25) */}
        {showSecuritySettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSecuritySettings(false)} />
            <div className="relative w-full max-w-md mx-4">
              <button
                onClick={() => setShowSecuritySettings(false)}
                className="absolute -top-2 -right-2 p-2 bg-slate-800 rounded-full border border-white/10 text-gray-400 hover:text-white z-10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <SecuritySettings
                onAddBackupPasskey={handleAddBackupPasskey}
                onUpdateSyncStatus={handleUpdateSyncStatus}
                hasBackupPasskey={hasBackupPasskey}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
