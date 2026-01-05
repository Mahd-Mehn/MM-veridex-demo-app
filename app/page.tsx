'use client';

import { useState, useEffect } from 'react';
import { useVeridex } from '@/lib/VeridexContext';
import { BalanceCard } from '@/components/BalanceDisplay';
import { SolanaBalanceCard } from '@/components/SolanaBalanceDisplay';
import { SendForm } from '@/components/SendForm';
import { ReceiveModal } from '@/components/QRCode';
import { ChainTabs, SUPPORTED_CHAINS, isSolanaChain, isEvmChain, isSuiChain, isAptosChain, isStarknetChain } from '@/components/ChainSelector';
import { SyncConfirmationModal } from '@/components/SyncConfirmationModal';
import { SyncWarningBanner, SecuritySettings } from '@/components/SyncWarningBanner';
import { SpendingWidget } from '@/components/SpendingWidget';
import { SpendingSettings } from '@/components/SpendingSettings';
import { ShareCard } from '@/components/ShareCard';
import { SocialShareModal } from '@/components/SocialShareModal';
import { TestnetFaucet } from '@/components/TestnetFaucet';
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
    chainBalances,
    isLoadingBalances,
    refreshBalances,
    refreshBalancesForChain,
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
    // Multi-chain vault addresses
    suiVaultAddress,
    aptosVaultAddress,
    starknetVaultAddress,
    getVaultAddressForChain,
    // Sui
    suiBalance,
    isLoadingSuiBalance,
    refreshSuiBalance,
    // Aptos
    aptosBalance,
    isLoadingAptosBalance,
    refreshAptosBalance,
    // Starknet
    starknetBalance,
    isLoadingStarknetBalance,
    refreshStarknetBalance,
    // Backup passkey (Issue #22/#25)
    hasBackupPasskey,
    isAddingBackupPasskey,
    addBackupPasskey,
    // Issue #27: Spending Limits
    spendingLimits,
    isLoadingSpendingLimits,
    refreshSpendingLimits,
    unpauseVault,
    setDailyLimit,
    pauseVault,
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
  const [showSpendingSettings, setShowSpendingSettings] = useState(false);
  // Viral share feature
  const [showShareCard, setShowShareCard] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUsername, setShareUsername] = useState('');
  const [pendingShareAfterSync, setPendingShareAfterSync] = useState(false);

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

  // Refresh balances when selected chain changes (for EVM chains)
  useEffect(() => {
    const chainIsEvm = isEvmChain(selectedChain);
    if (chainIsEvm && vaultAddress && !chainBalances[selectedChain]) {
      // Fetch balances for the newly selected chain
      refreshBalancesForChain(selectedChain);
    }
  }, [selectedChain, vaultAddress, chainBalances, refreshBalancesForChain]);

  // Refresh balances when selected chain changes (for non-EVM chains)
  useEffect(() => {
    if (isSolanaChain(selectedChain) && solanaVaultAddress && !solanaBalance) {
      refreshSolanaBalance();
    }
    if (isSuiChain(selectedChain) && suiVaultAddress && !suiBalance) {
      refreshSuiBalance();
    }
    if (isAptosChain(selectedChain) && aptosVaultAddress && !aptosBalance) {
      refreshAptosBalance();
    }
    if (isStarknetChain(selectedChain) && starknetVaultAddress && !starknetBalance) {
      refreshStarknetBalance();
    }
  }, [
    selectedChain, 
    solanaVaultAddress, solanaBalance, refreshSolanaBalance,
    suiVaultAddress, suiBalance, refreshSuiBalance,
    aptosVaultAddress, aptosBalance, refreshAptosBalance,
    starknetVaultAddress, starknetBalance, refreshStarknetBalance
  ]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const cleanUsername = username.trim();
      const cleanDisplayName = displayName.trim() || cleanUsername;
      setShareUsername(cleanUsername);
      setPendingShareAfterSync(true);
      await register(cleanUsername, cleanDisplayName);
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
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900">
        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            {/* Logo/Header */}
            <div className="text-center mb-8">
              {/* Animated Logo */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse opacity-50 blur-xl" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              
              <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
                Create your first passkey wallet in 10 seconds
              </h1>
              <p className="text-xl text-gray-300 mb-4">
                No seed phrase. No email. Just FaceID / TouchID.
              </p>
              
              {/* Value Props */}
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full text-green-300 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  No seed phrase
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Zero gas fees
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  6 chains, 1 identity
                </span>
              </div>
              
              {/* Demo Video Link */}
              <a 
                href="https://youtu.be/CgSvFqrVGAw"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition text-sm group"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                Watch the 30-second demo
              </a>
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

          {/* Main Actions - Always show both options */}
          <div className="space-y-4">
            {/* Sign In with Existing Passkey - Primary CTA */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">I have a passkey wallet</h2>
                  <p className="text-gray-400 text-sm">Sign in with FaceID / TouchID</p>
                </div>
              </div>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Sign In with Passkey
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-500 text-sm">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Create New Wallet - Secondary option, collapsible */}
            {!hasExistingCredential ? (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Create new wallet</h2>
                    <p className="text-gray-400 text-sm">First time? Set up in 10 seconds</p>
                  </div>
                </div>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Choose a username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g. satoshi"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all disabled:opacity-50 border border-white/10"
                  >
                    {loading ? 'Creating...' : 'Create Wallet'}
                  </button>
                </form>
              </div>
            ) : (
              <button
                onClick={() => setHasExistingCredential(false)}
                className="w-full py-4 bg-white/5 text-gray-300 font-medium rounded-xl hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create a new wallet instead
              </button>
            )}
          </div>
          
          {/* Chain Badges */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-xs mb-3">Instant vaults on</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {[
                { name: 'Base', icon: '🔵' },
                { name: 'Optimism', icon: '🔴' },
                { name: 'Arbitrum', icon: '🔷' },
                { name: 'Solana', icon: '🟣' },
                { name: 'Aptos', icon: '🟢' },
                { name: 'Sui', icon: '🔵' },
              ].map(chain => (
                <span key={chain.name} className="px-2 py-1 bg-white/5 rounded text-gray-400 text-xs flex items-center gap-1">
                  <span>{chain.icon}</span>
                  <span>{chain.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
        </div>
        
        {/* Footer */}
        <footer className="p-4 text-center">
          <p className="text-gray-500 text-sm">
            Built with ❤️ using{' '}
            <a href="https://www.w3.org/TR/webauthn/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
              WebAuthn
            </a>
            {' '}+{' '}
            <a href="https://wormhole.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
              Wormhole
            </a>
          </p>
        </footer>
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
        {(vaultAddress || solanaVaultAddress || suiVaultAddress || aptosVaultAddress || starknetVaultAddress) && (
          <div className={`mb-6 backdrop-blur-lg rounded-2xl p-6 border ${
            isSolanaChain(selectedChain) 
              ? 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/30' 
              : isSuiChain(selectedChain)
              ? 'bg-gradient-to-br from-cyan-900/30 to-teal-900/30 border-cyan-500/30'
              : isAptosChain(selectedChain)
              ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30'
              : isStarknetChain(selectedChain)
              ? 'bg-gradient-to-br from-orange-900/30 to-pink-900/30 border-orange-500/30'
              : 'bg-white/10 border-white/20'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Your Vault</h3>
              <ChainTabs selectedChainId={selectedChain} onSelect={setSelectedChain} />
            </div>
            
            {/* Chain-specific vault address display */}
            {(() => {
              const currentVaultAddress = getVaultAddressForChain(selectedChain);
              const chainInfo = SUPPORTED_CHAINS.find(c => c.id === selectedChain);
              const isNonEvm = isSolanaChain(selectedChain) || isSuiChain(selectedChain) || isAptosChain(selectedChain) || isStarknetChain(selectedChain);
              
              // Get explorer URL for non-EVM chains
              const getExplorerUrl = () => {
                if (!currentVaultAddress) return null;
                if (isSolanaChain(selectedChain)) {
                  return `https://explorer.solana.com/address/${currentVaultAddress}?cluster=devnet`;
                }
                if (isSuiChain(selectedChain)) {
                  return `https://suiscan.xyz/testnet/account/${currentVaultAddress}`;
                }
                if (isAptosChain(selectedChain)) {
                  return `https://explorer.aptoslabs.com/account/${currentVaultAddress}?network=testnet`;
                }
                if (isStarknetChain(selectedChain)) {
                  return `https://sepolia.starkscan.co/contract/${currentVaultAddress}`;
                }
                return chainInfo?.explorerUrl ? `${chainInfo.explorerUrl}/address/${currentVaultAddress}` : null;
              };

              const textColorClass = isSolanaChain(selectedChain) ? 'text-purple-200'
                : isSuiChain(selectedChain) ? 'text-cyan-200'
                : isAptosChain(selectedChain) ? 'text-green-200'
                : isStarknetChain(selectedChain) ? 'text-orange-200'
                : 'text-gray-400';

              const iconColorClass = isSolanaChain(selectedChain) ? 'text-purple-300'
                : isSuiChain(selectedChain) ? 'text-cyan-300'
                : isAptosChain(selectedChain) ? 'text-green-300'
                : isStarknetChain(selectedChain) ? 'text-orange-300'
                : 'text-gray-300';

              return (
                <>
                  <p className={`${textColorClass} font-mono text-sm break-all`}>
                    {currentVaultAddress || 'Not available - vault not yet created'}
                  </p>

                  {/* Non-EVM chain specific content */}
                  {isNonEvm && currentVaultAddress && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isSolanaChain(selectedChain) && (
                          isLoadingSolanaBalance ? (
                            <div className="animate-pulse h-5 w-20 bg-white/10 rounded" />
                          ) : (
                            <span className="text-white font-medium">
                              {(solanaBalance?.sol ?? 0).toFixed(4)} SOL
                            </span>
                          )
                        )}
                        {isSuiChain(selectedChain) && (
                          isLoadingSuiBalance ? (
                            <div className="animate-pulse h-5 w-20 bg-white/10 rounded" />
                          ) : (
                            <span className="text-white font-medium">
                              {(suiBalance?.sui ?? 0).toFixed(4)} SUI
                            </span>
                          )
                        )}
                        {isAptosChain(selectedChain) && (
                          isLoadingAptosBalance ? (
                            <div className="animate-pulse h-5 w-20 bg-white/10 rounded" />
                          ) : (
                            <span className="text-white font-medium">
                              {(aptosBalance?.apt ?? 0).toFixed(4)} APT
                            </span>
                          )
                        )}
                        {isStarknetChain(selectedChain) && (
                          isLoadingStarknetBalance ? (
                            <div className="animate-pulse h-5 w-20 bg-white/10 rounded" />
                          ) : (
                            <span className="text-white font-medium">
                              {(starknetBalance?.strk ?? 0).toFixed(4)} STRK
                            </span>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isSolanaChain(selectedChain) && (
                          <button
                            onClick={refreshSolanaBalance}
                            disabled={isLoadingSolanaBalance}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh balance"
                          >
                            <svg 
                              className={`w-4 h-4 ${iconColorClass} ${isLoadingSolanaBalance ? 'animate-spin' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        )}
                        {isSuiChain(selectedChain) && (
                          <button
                            onClick={refreshSuiBalance}
                            disabled={isLoadingSuiBalance}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh balance"
                          >
                            <svg 
                              className={`w-4 h-4 ${iconColorClass} ${isLoadingSuiBalance ? 'animate-spin' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        )}
                        {isAptosChain(selectedChain) && (
                          <button
                            onClick={refreshAptosBalance}
                            disabled={isLoadingAptosBalance}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh balance"
                          >
                            <svg 
                              className={`w-4 h-4 ${iconColorClass} ${isLoadingAptosBalance ? 'animate-spin' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        )}
                        {isStarknetChain(selectedChain) && (
                          <button
                            onClick={refreshStarknetBalance}
                            disabled={isLoadingStarknetBalance}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh balance"
                          >
                            <svg 
                              className={`w-4 h-4 ${iconColorClass} ${isLoadingStarknetBalance ? 'animate-spin' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (currentVaultAddress) {
                              navigator.clipboard.writeText(currentVaultAddress);
                              setSuccess(`${chainInfo?.name || 'Address'} copied!`);
                            }
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Copy address"
                        >
                          <svg className={`w-4 h-4 ${iconColorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        {getExplorerUrl() && (
                          <button
                            onClick={() => window.open(getExplorerUrl()!, '_blank')}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="View on Explorer"
                          >
                            <svg className={`w-4 h-4 ${iconColorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ready status for non-EVM chains */}
                  {isNonEvm && currentVaultAddress && (
                    <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Ready to receive {chainInfo?.nativeToken || 'tokens'}</span>
                    </div>
                  )}

                  {/* EVM chain content */}
                  {!isNonEvm && (
                    <>
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
                </>
              );
            })()}
          </div>
        )}

        {/* Spending Limits Widget (Issue #27) - Only show for EVM vaults when deployed */}
        {vaultDeployed && !isSolanaChain(selectedChain) && (
          <div className="mb-6">
            <SpendingWidget
              limits={spendingLimits || undefined}
              isLoading={isLoadingSpendingLimits}
              tokenDecimals={18}
              tokenSymbol="ETH"
              onRefresh={refreshSpendingLimits}
              onUnpause={isConnected ? unpauseVault : undefined}
              onAdjustLimits={() => setShowSpendingSettings(true)}
            />
          </div>
        )}

        {/* Action Buttons - Always show when registered */}
        <div className="grid grid-cols-4 gap-3 mb-6">
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
          {/* Share Button - Viral Feature */}
          <button
            onClick={() => {
              const currentUsername = credential?.credentialId ? credential.credentialId.slice(0, 8) : 'anon';
              setShareUsername(currentUsername);
              setShowShareCard(true);
            }}
            className="py-4 rounded-xl font-medium transition flex flex-col items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 hover:from-purple-500/30 hover:to-pink-500/30 border border-pink-500/30"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
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

            {/* Testnet Faucet - Show when vault is ready but balance is low */}
            {vaultAddress && vaultDeployed && isEvmChain(selectedChain) && (
              <TestnetFaucet
                vaultAddress={vaultAddress}
                chainName={SUPPORTED_CHAINS.find(c => c.id === selectedChain)?.name || 'Base Sepolia'}
                onSuccess={() => {
                  setSuccess('Address copied! Paste it in the faucet to claim tokens.');
                  // Refresh balances after a delay to pick up new tokens
                  setTimeout(() => refreshBalances(), 5000);
                }}
              />
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
          ) : isSuiChain(selectedChain) ? (
            // Sui Balance Display
            suiVaultAddress && (
              <div className="bg-gradient-to-br from-cyan-900/30 to-teal-900/30 backdrop-blur-lg rounded-2xl border border-cyan-500/30 overflow-hidden">
                <div className="p-6 border-b border-cyan-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center font-bold text-white">
                        SUI
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Sui Testnet</h3>
                        <p className="text-cyan-300/70 text-sm">Native Balance</p>
                      </div>
                    </div>
                    <button
                      onClick={refreshSuiBalance}
                      disabled={isLoadingSuiBalance}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <svg className={`w-5 h-5 text-cyan-300 ${isLoadingSuiBalance ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-center py-6">
                    {isLoadingSuiBalance ? (
                      <div className="animate-pulse h-10 w-32 bg-white/10 rounded mx-auto" />
                    ) : (
                      <p className="text-3xl font-bold text-white">{(suiBalance?.sui ?? 0).toFixed(4)} <span className="text-cyan-300">SUI</span></p>
                    )}
                  </div>
                </div>
              </div>
            )
          ) : isAptosChain(selectedChain) ? (
            // Aptos Balance Display
            aptosVaultAddress && (
              <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-lg rounded-2xl border border-green-500/30 overflow-hidden">
                <div className="p-6 border-b border-green-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center font-bold text-white">
                        APT
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Aptos Testnet</h3>
                        <p className="text-green-300/70 text-sm">Native Balance</p>
                      </div>
                    </div>
                    <button
                      onClick={refreshAptosBalance}
                      disabled={isLoadingAptosBalance}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <svg className={`w-5 h-5 text-green-300 ${isLoadingAptosBalance ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-center py-6">
                    {isLoadingAptosBalance ? (
                      <div className="animate-pulse h-10 w-32 bg-white/10 rounded mx-auto" />
                    ) : (
                      <p className="text-3xl font-bold text-white">{(aptosBalance?.apt ?? 0).toFixed(4)} <span className="text-green-300">APT</span></p>
                    )}
                  </div>
                </div>
              </div>
            )
          ) : isStarknetChain(selectedChain) ? (
            // Starknet Balance Display
            starknetVaultAddress && (
              <div className="bg-gradient-to-br from-orange-900/30 to-pink-900/30 backdrop-blur-lg rounded-2xl border border-orange-500/30 overflow-hidden">
                <div className="p-6 border-b border-orange-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-400 flex items-center justify-center font-bold text-white text-xs">
                        STRK
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Starknet Sepolia</h3>
                        <p className="text-orange-300/70 text-sm">Native Balance</p>
                      </div>
                    </div>
                    <button
                      onClick={refreshStarknetBalance}
                      disabled={isLoadingStarknetBalance}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <svg className={`w-5 h-5 text-orange-300 ${isLoadingStarknetBalance ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-center py-6">
                    {isLoadingStarknetBalance ? (
                      <div className="animate-pulse h-10 w-32 bg-white/10 rounded mx-auto" />
                    ) : (
                      <p className="text-3xl font-bold text-white">{(starknetBalance?.strk ?? 0).toFixed(4)} <span className="text-orange-300">STRK</span></p>
                    )}
                  </div>
                </div>
              </div>
            )
          ) : (
            // EVM Balance Display - use chain-specific balances
            vaultAddress && (
              <BalanceCard
                balances={chainBalances[selectedChain] ?? vaultBalances}
                isLoading={isLoadingBalances}
                onRefresh={() => refreshBalancesForChain(selectedChain)}
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
          address={getVaultAddressForChain(selectedChain) || ''}
          chainName={SUPPORTED_CHAINS.find(c => c.id === selectedChain)?.name || 'Unknown'}
          onCopy={() => setSuccess('Address copied!')}
          isSolana={isSolanaChain(selectedChain)}
        />

        {/* Sync Confirmation Modal (Issue #25) */}
        <SyncConfirmationModal
          isOpen={showSyncModal}
          onComplete={() => {
            setShowSyncModal(false);
            if (pendingShareAfterSync) {
              setShowShareCard(true);
              setPendingShareAfterSync(false);
            }
          }}
          onAddBackupPasskey={handleAddBackupPasskey}
        />

        {/* Viral Share Card Overlay */}
        {showShareCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowShareCard(false)}
            />
            <div className="relative w-full max-w-md">
              <button
                onClick={() => setShowShareCard(false)}
                className="absolute -top-2 -right-2 p-2 bg-slate-800 rounded-full border border-white/10 text-gray-400 hover:text-white z-10"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <ShareCard
                username={shareUsername || 'anon'}
                vaultAddresses={{
                  base: getVaultAddressForChain(10004) ?? vaultAddress ?? null,
                  optimism: getVaultAddressForChain(10005) ?? null,
                  arbitrum: getVaultAddressForChain(10003) ?? null,
                  solana: solanaVaultAddress ?? null,
                  sui: suiVaultAddress ?? null,
                  aptos: aptosVaultAddress ?? null,
                }}
                onShare={() => setShowShareModal(true)}
              />
            </div>
          </div>
        )}

        {/* Social Share Modal */}
        <SocialShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          username={shareUsername || 'anon'}
          vaultAddresses={{
            base: getVaultAddressForChain(10004) ?? vaultAddress ?? null,
            optimism: getVaultAddressForChain(10005) ?? null,
            arbitrum: getVaultAddressForChain(10003) ?? null,
            solana: solanaVaultAddress ?? null,
            sui: suiVaultAddress ?? null,
            aptos: aptosVaultAddress ?? null,
          }}
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

        {/* Spending Settings Modal (Issue #27) */}
        {showSpendingSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSpendingSettings(false)} />
            <div className="relative w-full max-w-lg mx-4">
              <button
                onClick={() => setShowSpendingSettings(false)}
                className="absolute -top-2 -right-2 p-2 bg-slate-800 rounded-full border border-white/10 text-gray-400 hover:text-white z-10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <SpendingSettings
                limits={spendingLimits || undefined}
                isLoading={isLoadingSpendingLimits}
                tokenDecimals={18}
                tokenSymbol="ETH"
                onSetDailyLimit={isConnected ? setDailyLimit : undefined}
                onPauseVault={isConnected ? pauseVault : undefined}
                onUnpauseVault={isConnected ? unpauseVault : undefined}
                onRefresh={refreshSpendingLimits}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
