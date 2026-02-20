# 🎥 Content Hub x402

**A decentralized, premium content marketplace on Base Sepolia.**

Creators can monetize their high-quality video content directly through smart contracts, offering both **Rentals (24h access)** and **Lifetime Access**. Content is securely stored on IPFS (via Lighthouse) and payments are handled in USDC/ETH.

![App Screenshot](public/icon.png)

## ✨ Key Features

### 🔐 For Consumers
- **Crypto Payments**: Pay seamlessly with **ETH** or **USDC** on Base Sepolia.
- **Flexible Access**:
    - **Rent**: Get 24-hour access for a fraction of the price.
    - **Buy**: Purchase lifetime access to support your favorite creators.
- **My Library**: A unified dashboard to view your active rentals and purchased content.
- **Privacy First**: Login securely with just your wallet via **Privy**.

### 🎨 For Creators
- **Direct Monetization**: Receive 100% of revenue directly to your wallet.
- **On-Chain Ownership**: Your catalog is registered on the blockchain.
- **Decentralized Storage**: Videos are stored on **Walrus / IPFS**, ensuring censorship resistance.
- **Easy Uploads**: Drag-and-drop studio interface for publishing.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4 + Framer Motion
- **Blockchain**: Foundry (Smart Contracts) + Viem (Frontend)
- **Authentication**: Privy
- **Storage**: Lighthouse (IPFS)
- **Network**: Base Sepolia Testnet

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Web3 Wallet (Metamask, Coinbase Wallet, etc.)
- Testnet ETH on Base Sepolia (Get it [here](https://briefcase.coinbase.com/bridge))

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/content-hub-x402.git
   cd content-hub-x402
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file based on `.env.example`:
   ```env
   NEXT_PUBLIC_PRIVY_APP_ID=your_privy_id
   NEXT_PUBLIC_LIGHTHOUSE_API_KEY=your_lighthouse_key
   # ... other keys
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the app.

## ⛓️ Smart Contracts

Deployed on **Base Sepolia**.

| Contract | Address |
|----------|---------|
| **CreatorHub** | `0xc567c6112720d8190caa4e93086cd36e2ae01d37` |
| **USDC (Testnet)** | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |

### Key Functions
- `rentContent(uint256 contentId)`: Pay ETH to get 24h access.
- `subscribe(address creator)`: Monthly subscription to a creator.
- `checkRental(address user, uint256 contentId)`: Verifies access status.

## 🚀 Vercel Deployment

Deploying this application to Vercel is highly optimized because of the pre-configured root `vercel.json` and `package.json`.

1. **Import the repository** into your Vercel dashboard.
2. **Leave the Framework and Root Directory exactly as they are**. Vercel will automatically execute the root build script that builds the Next.js app inside `frontend`.
3. **Add the following Environment Variables**:

```env
# Privy Settings (Required for wallet login)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

# PostgreSQL Database
DATABASE_URL=your_postgres_database_url

# Security
CONTENT_SIGNING_SECRET=your_jwt_signing_secret

# IPFS Storage
NEXT_PUBLIC_LIGHTHOUSE_API_KEY=your_lighthouse_api_key

# Blockchain Provider (Optional)
NEXT_PUBLIC_RPC_URL=your_base_sepolia_rpc_url
```

4. Click **Deploy**.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
