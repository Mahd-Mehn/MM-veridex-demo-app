# Veridex SDK Test Application

A comprehensive Next.js 15 test application for the Veridex Protocol SDK, featuring passkey-based cross-chain authentication, gasless token transfers, and multi-chain vault management.

## START Features

- **Passkey Registration & Login**: Test WebAuthn passkey creation and authentication
- **Gasless Transfers**: Send tokens without paying gas - relayer covers all fees
- **Wormhole Queries**: Fetch Guardian-attested balances across all chains
- **Multi-Chain Vaults**: Automatic sponsored vault creation on all supported chains
- **Cross-Chain Transfers**: Execute token transfers across different chains using passkeys
- **Beautiful UI**: Modern glassmorphic design with real-time status indicators

## NOTE Prerequisites

- Node.js 18+ installed
- MetaMask browser extension (optional - only needed for gas-paying flows)
- Base Sepolia testnet ETH (optional - gasless transfers don't require user ETH)
- A WebAuthn-compatible device (most modern browsers support this)

##  Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   
   Create `.env.local` from the example:
   ```bash
   cp .env.local.example .env.local
   ```

   Configure the following:
   ```env
   # Required: Relayer URL (run locally or use hosted)
   NEXT_PUBLIC_RELAYER_URL=http://localhost:3001
   
   # Optional: Wormhole Query API key (for Guardian-attested balances)
   NEXT_PUBLIC_WORMHOLE_QUERY_API_KEY=your-api-key-here
   
   # Optional: Sponsor key for gasless vault creation
   NEXT_PUBLIC_VERIDEX_SPONSOR_KEY=0x...
   ```

3. **Start the Relayer** (in separate terminal)
   ```bash
   cd ../packages/relayer
   npm run dev
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   
   > **Note:** Uses `--webpack` flag for compatibility with local SDK symlinks.

5. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

##  Testing Flow

### 1. Register a Passkey

- Enter a username (e.g., "alice")
- Enter a display name (e.g., "Alice")
- Click "Register Passkey"
- Follow your browser's WebAuthn prompt to create a passkey
- Your credential will be saved to localStorage

### 2. Connect Wallet (Optional)

For gasless transfers, wallet connection is **not required**. The relayer pays all gas fees.

For legacy gas-paying flows:
- Click "Connect MetaMask"
- Approve the connection in MetaMask
- The app will automatically switch to Base Sepolia
- Ensure you have some testnet ETH for gas fees

### 3. Create Vaults (Automatic)

With sponsored vault creation enabled:
- Vaults are automatically created on all supported chains
- The sponsor wallet pays for deployment gas
- No user interaction required

For manual vault creation:
- Connect your wallet first
- Click "Create Vault"
- Approve the transaction in MetaMask

### 4. Test Gasless Transfer

The app uses **gasless transfers by default**:
- Select a target chain (Optimism Sepolia, Arbitrum Sepolia)
- Enter a recipient address
- Enter the amount to transfer
- Click "Send" 
- Authenticate with your passkey when prompted
- **No wallet approval needed** - relayer pays the gas!

The transfer flow:
1. SDK fetches nonce from relayer
2. You sign with your passkey
3. Relayer submits to Hub chain (paying gas)
4. Relayer automatically relays VAA to destination chain

##  Passkey Authentication

The app uses WebAuthn for secure, passwordless authentication:

- **Registration**: Creates a new passkey credential tied to your device
- **Login**: Authenticates using your existing passkey
- **Signing**: Uses the passkey to sign cross-chain transactions

Credentials are stored in localStorage and include:
- Credential ID
- Public Key (X and Y coordinates)
- Key Hash (used for vault identification)

## NETWORK Supported Chains

The test app is configured for Base Sepolia as the hub chain:

| Chain | Wormhole ID | Type | Role |
|-------|-------------|------|------|
| Base Sepolia | 10004 | EVM | Hub |
| Optimism Sepolia | 10005 | EVM | Spoke |
| Arbitrum Sepolia | 10003 | EVM | Spoke |
| Solana Devnet | 1 | Solana | Spoke |
| Aptos Testnet | 22 | Aptos | Spoke |

## PACKAGE SDK Usage Example

```typescript
import { VeridexSDK, EVMClient } from '@veridex/sdk';
import { ethers } from 'ethers';

// Initialize SDK with relayer (for gasless)
const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const evmClient = new EVMClient({
  provider,
  testnet: true,
  hubAddress: '0xf189b649ecb44708165f36619ED24ff917eF1f94',
});

const sdk = new VeridexSDK({
  chain: evmClient,
  testnet: true,
  relayerUrl: 'http://localhost:3001',
  queryApiKey: process.env.WORMHOLE_QUERY_API_KEY,
});

// Register passkey
const credential = await sdk.passkey.register('alice', 'Alice');

// Get vault address (derived from keyHash)
const vaultAddress = await sdk.getVaultAddress();

// Gasless transfer - no wallet needed!
const result = await sdk.transferViaRelayer({
  targetChain: 10005, // Optimism Sepolia
  token: 'native',
  recipient: '0x...',
  amount: ethers.parseEther('0.01'),
});

console.log('TX:', result.transactionHash);
```

##  Project Structure

```
test-app/
├── app/
│   ├── globals.css      # Tailwind + glassmorphic styles
│   ├── layout.tsx       # Root layout with VeridexProvider
│   └── page.tsx         # Main wallet/send UI
├── components/
│   ├── BalanceDisplay.tsx   # Multi-chain balance cards
│   ├── ChainSelector.tsx    # Chain tab navigation
│   ├── QRCode.tsx           # Receive QR code modal
│   └── SendForm.tsx         # Transfer form (gasless + legacy)
├── lib/
│   ├── config.ts            # Chain configurations
│   └── VeridexContext.tsx   # React context with SDK
└── .env.local               # Environment variables
}, signer);
```

##  UI Components

The app features:

- **Status Cards**: Real-time display of passkey, wallet, and vault status
- **Registration Form**: Clean form for passkey creation
- **Transfer Form**: Comprehensive form for cross-chain transfers
- **Credential Details**: Display of public key coordinates and key hash
- **Error/Success Messages**: User-friendly feedback for all operations

## TOOLS Troubleshooting

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

## DOCS Resources

- [Veridex Protocol Documentation](https://github.com/Veridex-Protocol/demo)
- [WebAuthn Guide](https://webauthn.guide/)
- [Wormhole Documentation](https://docs.wormhole.com/)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)

##  Project Structure

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

## SECURITY Security Notes

- This is a **test application** for development purposes only
- Never use real funds or production keys
- Passkeys are stored in localStorage (not recommended for production)
- Always verify transactions before signing

## NOTE License

MIT
