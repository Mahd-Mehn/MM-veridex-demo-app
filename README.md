# Veridex SDK Test Application

A comprehensive Next.js test application for the Veridex Protocol SDK, featuring passkey-based cross-chain authentication and token transfers.

## 🚀 Features

- **Passkey Registration & Login**: Test WebAuthn passkey creation and authentication
- **Wallet Connection**: Connect MetaMask to Base Sepolia testnet
- **Vault Management**: Create and manage cross-chain vaults
- **Cross-Chain Transfers**: Execute token transfers across different chains using passkeys
- **Beautiful UI**: Modern glassmorphic design with real-time status indicators

## 📋 Prerequisites

- Node.js 18+ installed
- MetaMask browser extension
- Base Sepolia testnet ETH (for gas fees)
- A WebAuthn-compatible device (most modern browsers support this)

## 🛠️ Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configuration**
   The app is pre-configured to use Base Sepolia testnet with the following settings:
   - Chain ID: 84532 (Base Sepolia)
   - Wormhole Chain ID: 10004
   - RPC URL: Alchemy endpoint
   - Hub Contract: `0xf189b649ecb44708165f36619ED24ff917eF1f94`
   - Wormhole Core Bridge: `0x79A1027a6A159502049F10906D333EC57E95F083`

   You can modify these in `lib/config.ts` if needed.

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Testing Flow

### 1. Register a Passkey

- Enter a username (e.g., "alice")
- Enter a display name (e.g., "Alice")
- Click "Register Passkey"
- Follow your browser's WebAuthn prompt to create a passkey
- Your credential will be saved to localStorage

### 2. Connect Wallet

- Click "Connect MetaMask"
- Approve the connection in MetaMask
- The app will automatically switch to Base Sepolia (or prompt you to add the network)
- Ensure you have some testnet ETH for gas fees

### 3. Create a Vault

- Once both passkey and wallet are connected, click "Create Vault"
- Approve the transaction in MetaMask
- Your vault address will be displayed once created

### 4. Test Cross-Chain Transfer

- Select a target chain (Optimism Sepolia, Arbitrum Sepolia, or Base Sepolia)
- Enter a token address (e.g., USDC contract address)
- Enter a recipient address
- Enter the amount to transfer
- Click "Transfer Tokens"
- Authenticate with your passkey when prompted
- Approve the transaction in MetaMask

## 🔑 Passkey Authentication

The app uses WebAuthn for secure, passwordless authentication:

- **Registration**: Creates a new passkey credential tied to your device
- **Login**: Authenticates using your existing passkey
- **Signing**: Uses the passkey to sign cross-chain transactions

Credentials are stored in localStorage and include:
- Credential ID
- Public Key (X and Y coordinates)
- Key Hash (used for vault identification)

## 🌐 Supported Chains

The test app is configured for Base Sepolia as the hub chain, with support for cross-chain transfers to:

- **Base Sepolia** (Wormhole Chain ID: 10004)
- **Optimism Sepolia** (Wormhole Chain ID: 10005)
- **Arbitrum Sepolia** (Wormhole Chain ID: 10003)

## 📦 SDK Usage Example

```typescript
import { VeridexSDK } from '@veridex/sdk';
import { EVMClient } from '@veridex/sdk/chains/evm';
import { ethers } from 'ethers';

// Initialize SDK
const evmClient = new EVMClient({
  chainId: 84532,
  wormholeChainId: 10004,
  rpcUrl: 'https://base-sepolia.g.alchemy.com/v2/YOUR_KEY',
  hubContractAddress: '0xf189b649ecb44708165f36619ED24ff917eF1f94',
  wormholeCoreBridge: '0x79A1027a6A159502049F10906D333EC57E95F083',
});

const sdk = new VeridexSDK({ chain: evmClient });

// Register passkey
const credential = await sdk.passkey.register('alice', 'Alice');

// Connect wallet
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Create vault
const vaultAddress = await sdk.createVault(signer);

// Transfer tokens
const result = await sdk.transfer({
  targetChain: 10005, // Optimism Sepolia
  token: '0x...', // Token address
  recipient: '0x...', // Recipient address
  amount: ethers.parseUnits('100', 6), // Amount
}, signer);
```

## 🎨 UI Components

The app features:

- **Status Cards**: Real-time display of passkey, wallet, and vault status
- **Registration Form**: Clean form for passkey creation
- **Transfer Form**: Comprehensive form for cross-chain transfers
- **Credential Details**: Display of public key coordinates and key hash
- **Error/Success Messages**: User-friendly feedback for all operations

## 🔧 Troubleshooting

### Passkey Registration Fails
- Ensure you're using a WebAuthn-compatible browser (Chrome, Firefox, Safari, Edge)
- Check that you're on HTTPS or localhost
- Try a different authenticator (platform vs cross-platform)

### Wallet Connection Issues
- Make sure MetaMask is installed and unlocked
- Check that you're on the correct network (Base Sepolia)
- Ensure you have testnet ETH for gas fees

### Vault Creation Fails
- Verify you have a registered passkey
- Ensure your wallet is connected
- Check you have sufficient ETH for gas

### Transfer Fails
- Verify the vault exists
- Check token address is valid
- Ensure vault has sufficient token balance
- Verify recipient address is correct

## 📚 Resources

- [Veridex Protocol Documentation](https://github.com/Veridex-Protocol/demo)
- [WebAuthn Guide](https://webauthn.guide/)
- [Wormhole Documentation](https://docs.wormhole.com/)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)

## 🏗️ Project Structure

```
test-app/
├── app/
│   ├── layout.tsx          # Root layout with VeridexProvider
│   ├── page.tsx            # Main test interface
│   └── globals.css         # Global styles
├── lib/
│   ├── config.ts           # SDK configuration
│   └── VeridexContext.tsx  # React context for SDK state
└── package.json            # Dependencies
```

## 🔐 Security Notes

- This is a **test application** for development purposes only
- Never use real funds or production keys
- Passkeys are stored in localStorage (not recommended for production)
- Always verify transactions before signing

## 📝 License

MIT
