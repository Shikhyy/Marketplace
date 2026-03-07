<div align="center">
  <img src="frontend/public/icon.png" alt="Walrus x402 Logo" width="120" height="120" />
  
  # 🎥 Walrus x402 (Content Hub)
  
  **A decentralized, premium content marketplace built on Base Sepolia & Walrus.**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
  [![Base Sepolia](https://img.shields.io/badge/Base-Sepolia-blue?logo=base)](https://base.org)
  [![Foundry](https://img.shields.io/badge/Foundry-Toolkit-orange)](https://getfoundry.sh/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

> **Empowering creators with direct monetization and true digital ownership.**
> Creators can monetize high-quality video content directly via smart contracts, offering **Rentals (24h access)** and **Subscriptions/Lifetime Access**. Content is securely stored on decentralized networks (IPFS/Walrus) and payments are settled in USDC/ETH.

## ✨ Key Features

### 🔐 For Consumers
*   ⚡ **Crypto Native Payments:** Pay seamlessly with **ETH** or **USDC** on Base Sepolia.
*   ⏳ **Flexible Access Models:**
    *   **Rent:** Get 24-hour access for a fraction of the price.
    *   **Buy/Subscribe:** Purchase lifetime access to support your favorite creators.
*   📚 **Unified Library:** A personalized dashboard to track active rentals and purchased content.
*   🛡️ **Privacy First:** Login securely using just your wallet via **Privy**.

### 🎨 For Creators
*   💰 **100% Revenue:** Receive direct payments to your wallet—no middlemen.
*   ⛓️ **On-Chain Ownership:** Your catalog and access rights are registered immutably on the blockchain.
*   🗄️ **Decentralized Storage:** Videos stored on **Walrus / IPFS**, ensuring maximum censorship resistance.
*   🖱️ **Easy Uploads:** Intuitive drag-and-drop studio interface for publishing.

---

## 🏗️ Project Architecture

This repository is set up as a monorepo containing both the frontend application and the smart contracts.

| Directory | Description | Technology Stack |
| :--- | :--- | :--- |
| [`/frontend`](./frontend) | The Next.js web application for creators & consumers. | Next.js 15, Tailwind CSS, Viem, Privy, Framer Motion |
| [`/contracts`](./contracts) | Smart contracts for content access, rentals & payments. | Solidity, Foundry (Forge, Cast, Anvil) |

---

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18+)
*   [Foundry](https://getfoundry.sh/) (for contract development)
*   A Web3 Wallet (Metamask, Coinbase Wallet, etc.)
*   Testnet ETH on Base Sepolia ([Get Faucet here](https://briefcase.coinbase.com/bridge))

### 1️⃣ Smart Contracts Setup

Ensure you have Foundry installed. If not, follow instructions [here](https://book.getfoundry.sh/getting-started/installation).

```bash
cd contracts
forge install
forge build
forge test
```

*See the [Contracts README](./contracts/README.md) for deployment and additional Foundry commands.*

### 2️⃣ Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
```

**Environment Variables**
Create a `.env` file in the `frontend` directory (using `.env.example` as a template):

```env
# Privy Settings
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

# Database & Storage
DATABASE_URL=your_postgres_database_url
NEXT_PUBLIC_LIGHTHOUSE_API_KEY=your_lighthouse_api_key

# Blockchain
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
CONTENT_SIGNING_SECRET=your_jwt_signing_secret
```

**Run Development Server**
```bash
npm run dev
```
Navigate to `http://localhost:3000` to explore the Content Hub!

---

## ⛓️ Smart Contracts Info

Currently deployed on **Base Sepolia**:

| Contract | Address |
| :--- | :--- |
| **CreatorHub** | `0xc567c6112720d8190caa4e93086cd36e2ae01d37` |
| **USDC (Testnet)** | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |

**Key Capabilities:**
*   `rentContent(uint256)`: Pay to get 24h conditional access.
*   `subscribe(address)`: Monthly subscription processing.
*   `checkRental(address, uint256)`: On-chain verification of access rights.

---

## 🚀 Deployment (Vercel)

Deploying the frontend is optimized with the pre-configured root `vercel.json` and `package.json`.

1. Import this repository into your Vercel dashboard.
2. Leave the Framework and Root Directory exactly as they are (Vercel uses the root config to build `/frontend`).
3. Add the required Environment Variables (*Privy, DB, Lighthouse, etc.*).
4. Click **Deploy**.

---

## 🤝 Contributing

Contributions are always welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
