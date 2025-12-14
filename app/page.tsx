'use client';

import { useState, useEffect } from 'react';
import { useVeridex } from '@/lib/VeridexContext';
import { ethers } from 'ethers';

export default function Home() {
  const {
    sdk,
    credential,
    signer,
    address,
    isConnected,
    isRegistered,
    vaultAddress,
    register,
    login,
    connectWallet,
    disconnectWallet,
    logout,
    deleteCredential,
    hasStoredCredential,
  } = useVeridex();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasExistingCredential, setHasExistingCredential] = useState(false);

  // Check if there's a stored credential on mount
  useEffect(() => {
    setHasExistingCredential(hasStoredCredential());
  }, [hasStoredCredential, isRegistered]);

  // Transfer form state
  const [transferTarget, setTransferTarget] = useState('10005'); // Optimism Sepolia
  const [transferToken, setTransferToken] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

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
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await login();
      setSuccess('Logged in successfully!');
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
      setSuccess('Wallet connected!');
    } catch (err: any) {
      setError(err.message || 'Wallet connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVault = async () => {
    if (!sdk || !signer) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const vault = await sdk.createVault(signer);
      setSuccess(`Vault created at: ${vault}`);
    } catch (err: any) {
      setError(err.message || 'Vault creation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sdk || !signer) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await sdk.transfer(
        {
          targetChain: parseInt(transferTarget),
          token: transferToken,
          recipient: transferRecipient,
          amount: ethers.parseUnits(transferAmount, 6), // Assuming 6 decimals for USDC
        },
        signer
      );

      setSuccess(
        `Transfer dispatched! TX: ${result.transactionHash.slice(0, 10)}... Sequence: ${result.sequence}`
      );
      setTransferToken('');
      setTransferRecipient('');
      setTransferAmount('');
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
            Veridex SDK Test App
          </h1>
          <p className="text-gray-300 text-lg">
            Passkey-based Cross-Chain Authentication
          </p>
        </header>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Passkey Status</h3>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isRegistered ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-white font-medium">
                {isRegistered ? 'Registered' : 'Not Registered'}
              </span>
            </div>
            {credential && (
              <p className="text-xs text-gray-400 mt-2 truncate">
                Key: {credential.keyHash.slice(0, 20)}...
              </p>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Wallet Status</h3>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-white font-medium">
                {isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            {address && (
              <p className="text-xs text-gray-400 mt-2 truncate">
                {address}
              </p>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Vault Status</h3>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${vaultAddress ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-white font-medium">
                {vaultAddress ? 'Created' : 'Not Created'}
              </span>
            </div>
            {vaultAddress && (
              <p className="text-xs text-gray-400 mt-2 truncate">
                {vaultAddress}
              </p>
            )}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200">
            {success}
          </div>
        )}

        {/* Info Banner */}
        {isRegistered && !vaultAddress && (
          <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-blue-200 font-semibold mb-1">Contract Deployment Required</h3>
                <p className="text-blue-300 text-sm">
                  Vault operations require the VeridexHub contract to be deployed on Base Sepolia.
                  If you see "missing revert data" errors, the contract may not be deployed yet.
                </p>
                <p className="text-blue-300 text-sm mt-2">
                  To deploy: Run <code className="bg-blue-900/30 px-2 py-0.5 rounded">npm run deploy:testnet</code> in the <code className="bg-blue-900/30 px-2 py-0.5 rounded">packages/evm</code> directory.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Authentication */}
          <div className="space-y-6">
            {/* Sign In Card - Show when not registered but has stored credential */}
            {!isRegistered && hasExistingCredential && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">Welcome Back</h2>
                <p className="text-gray-300 mb-6">
                  Sign in with your existing passkey
                </p>
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign In with Passkey'}
                </button>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-gray-400 text-sm text-center mb-3">
                    Or register a new passkey
                  </p>
                  <button
                    onClick={() => setHasExistingCredential(false)}
                    className="w-full py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
                  >
                    Create New Passkey
                  </button>
                </div>
              </div>
            )}

            {/* Register Card - Show when not registered and no stored credential (or user chose to create new) */}
            {!isRegistered && !hasExistingCredential && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">Register Passkey</h2>
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
                      placeholder="alice"
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
                      placeholder="Alice"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Registering...' : 'Register Passkey'}
                  </button>
                </form>
                {hasStoredCredential() && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <button
                      onClick={() => setHasExistingCredential(true)}
                      className="w-full py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Logged In Card */}
            {isRegistered && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">Signed In</h2>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Passkey Authenticated</p>
                    <p className="text-gray-400 text-sm truncate max-w-[200px]">
                      {credential?.keyHash?.slice(0, 16)}...
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
                >
                  Sign Out
                </button>
                <button
                  onClick={() => {
                    deleteCredential();
                    setHasExistingCredential(false);
                  }}
                  className="w-full mt-2 py-2 text-red-400 text-sm hover:text-red-300 transition-all"
                >
                  Delete Passkey Data
                </button>
              </div>
            )}

            {/* Wallet Connection */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Wallet Connection</h2>
              {!isConnected ? (
                <button
                  onClick={handleConnectWallet}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50"
                >
                  {loading ? 'Connecting...' : 'Connect MetaMask'}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
                    <p className="text-green-200 text-sm">Connected to Base Sepolia</p>
                    <p className="text-green-100 font-mono text-xs mt-1">{address}</p>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="w-full py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>

            {/* Vault Management */}
            {isRegistered && isConnected && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">Vault Management</h2>
                {!vaultAddress ? (
                  <button
                    onClick={handleCreateVault}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Vault'}
                  </button>
                ) : (
                  <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
                    <p className="text-green-200 text-sm mb-2">Vault Created</p>
                    <p className="text-green-100 font-mono text-xs break-all">{vaultAddress}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Transfer Card */}
            {isRegistered && isConnected && vaultAddress && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">Cross-Chain Transfer</h2>
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Target Chain
                    </label>
                    <select
                      value={transferTarget}
                      onChange={(e) => setTransferTarget(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="10005">Optimism Sepolia</option>
                      <option value="10003">Arbitrum Sepolia</option>
                      <option value="10004">Base Sepolia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Token Address
                    </label>
                    <input
                      type="text"
                      value={transferToken}
                      onChange={(e) => setTransferToken(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0x..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      value={transferRecipient}
                      onChange={(e) => setTransferRecipient(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0x..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amount (USDC)
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="100"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Transferring...' : 'Transfer Tokens'}
                  </button>
                </form>
              </div>
            )}

            {/* Info Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">How to Test</h2>
              <ol className="space-y-3 text-gray-300">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  <span>Register a new passkey with your username</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  <span>Connect your MetaMask wallet to Base Sepolia</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  <span>Create a vault for your passkey</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </span>
                  <span>Test cross-chain transfers using your passkey</span>
                </li>
              </ol>
            </div>

            {/* SDK Info */}
            {credential && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4">Credential Details</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-400">Credential ID</p>
                    <p className="text-white font-mono text-xs break-all">{credential.credentialId}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Key Hash</p>
                    <p className="text-white font-mono text-xs break-all">{credential.keyHash}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Public Key X</p>
                    <p className="text-white font-mono text-xs break-all">{credential.publicKeyX.toString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Public Key Y</p>
                    <p className="text-white font-mono text-xs break-all">{credential.publicKeyY.toString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
