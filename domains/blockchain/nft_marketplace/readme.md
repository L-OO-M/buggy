<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Rubik+Glitch&size=42&duration=2500&pause=1000&color=00FFF9&center=true&vCenter=true&width=900&height=70&lines=A3TH%23R%21A;AETHERIA" alt="AETHERIA" />
  <br/>
  <img src="https://readme-typing-svg.demolab.com?font=Orbitron&weight=700&size=22&duration=3500&pause=1500&color=FF00C8&center=true&vCenter=true&width=900&height=40&lines=Zero-G+3D+Spatial+NFT+Marketplace" alt="Zero-G 3D Spatial NFT Marketplace" />
</div>

<img align="right" src="https://media.giphy.com/media/bpmNf92LmkoMw/giphy.gif" width="200" alt="Space Animation"/>

AETHERIA is an interactive, futuristic NFT marketplace designed around the concept of a zero-gravity digital universe. It combines a dark cyberpunk aesthetic, immersive 3D visualizations, and marketplace simulation features to create an engaging environment for discovering, creating, collecting, and trading digital assets.

Explore a collection of digital artifacts, interact with real-time 3D objects, participate in simulated auctions, and build your own digital NFT vault.

## ✨ Features

### 🌌 Immersive 3D Experience

  <img align="right" src="https://media.giphy.com/media/6ErZhfDZ4TMpa/giphy.gif" width="300" alt="Space Animation"/>

- Interactive 3D environment powered by Three.js.
- Animated zero-gravity particles and floating geometric artifacts.
- Mouse-responsive 3D visualizations.
- Interactive gravity controls and wireframe effects.
- Multiple 3D geometric models, including:
  - Hypercube
  - Torus Knot
  - Prism
  - Singularity
  - Crystal
  - Dodecahedron

### 🖼️ NFT Marketplace
- Explore a curated collection of digital collectibles.
- Browse NFTs across multiple categories:
  - Cyberpunk
  - Quantum Relics
  - Zero-G Debris
  - Generative Shards
- Search NFTs by title, description, and category.
- Filter collections by price.
- Sort NFTs by price, rarity, and listing date.
- View detailed NFT information, including creator, owner, traits, and rarity.

### ⚡ NFT Minting Studio
- Create custom NFT listings.
- Upload digital media.
- Support for image, video, and audio media types.
- Configure NFT descriptions, categories, pricing, and creator royalties.
- Select 3D artifact models and customize NFT traits.

### 🔨 Auctions & Bidding
- Participate in simulated NFT auctions.
- Place bids on listed collectibles.
- Track bidding activity and auction timelines.
- View the highest bidder and current offers.

### 👛 Digital Wallet & User Vault
- Simulated wallet and user identity management.
- Wallet-style interface with ETH balance.
- Explore MetaMask, Phantom, Google, and email authentication options.
- Claim simulated test ETH through the faucet.
- View purchased and minted collectibles in My Vault.
- List and delist owned NFTs.

### 📡 Activity & Notifications
- Marketplace activity feed for transactions and listings.
- Notifications for important marketplace events.
- Cross-tab synchronization using the Browser BroadcastChannel API.
- Local persistence of marketplace NFT data using browser storage.

### 🛒 Custom Marketplace
- Dedicated custom NFT marketplace interface.
- Explore custom-created digital collectibles separately from the main collection.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | Component-based UI development |
| TypeScript | Type safety and maintainable code |
| Vite 6 | Development server and build tooling |
| Tailwind CSS 3 | Utility-first styling |
| Three.js | Interactive 3D graphics and rendering |
| Lucide React | Icons and interface elements |
| HTML5 / CSS3 | Web structure and styling |
| Browser APIs | Local storage, session storage, and cross-tab communication |

---

## 📂 Project Structure

```text
nft_marketplace/
│
├── public/
│
├── src/
│   ├── components/
│   │   ├── ActivityFeed.tsx
│   │   ├── AuthModal.tsx
│   │   ├── CustomMarketPage.tsx
│   │   ├── MintModal.tsx
│   │   ├── Navbar.tsx
│   │   ├── NFT3DViewer.tsx
│   │   ├── NFTCard.tsx
│   │   ├── NFTDetailModal.tsx
│   │   ├── NotificationToast.tsx
│   │   └── ThreeCanvas.tsx
│   │
│   ├── context/
│   │   └── MarketplaceContext.tsx
│   │
│   ├── data/
│   │   └── mockNFTs.ts
│   │
│   ├── types/
│   │   └── nft.ts
│   │
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── index.html
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

Follow these steps to run AETHERIA locally.

### Prerequisites

Make sure you have the following installed:

- Node.js (v18 or later recommended)
- npm or pnpm
- Git

### 1. Clone the Repository

```bash
git clone <your-repository-url>
```

### 2. Navigate to the Project

```bash
cd nft_marketplace
```

### 3. Install Dependencies

Using npm:

```bash
npm install
```

Alternatively, using pnpm:

```bash
pnpm install
```

### 4. Start the Development Server

Using npm:

```bash
npm run dev
```

Or using pnpm:

```bash
pnpm dev
```

### 5. Open in Browser

Visit:

```text
http://localhost:5173
```

The application should now be running locally.

---

## 🏗️ Production Build

To generate an optimized production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

The generated production files are stored in the `dist/` directory.

---

## 💾 Data Persistence & Application Architecture

AETHERIA currently uses a frontend-based marketplace simulation.

- **React Context API:** Manages shared marketplace state, user profiles, wallet information, and NFT operations.
- **Local Storage:** Persists NFT marketplace data between browser sessions.
- **Session Storage:** Maintains the active user session.
- **BroadcastChannel API:** Synchronizes selected marketplace events across browser tabs.

The marketplace uses predefined sample NFT data to populate the initial collection.

> **Note:** This is a frontend prototype. Wallet balances, transactions, minting, bidding, and marketplace operations are simulated. The current implementation does not include deployed smart contracts, blockchain transaction settlement, or a production backend.

---

## 🔮 Future Enhancements

Potential improvements for future versions include:

- Smart contract integration using Solidity.
- On-chain NFT minting and trading.
- IPFS-based decentralized media storage.
- Real MetaMask and Phantom wallet integration.
- Blockchain-based auction settlement.
- Backend APIs and persistent database integration.
- Advanced NFT analytics and collection insights.
- Enhanced security and transaction verification.

---

## 📚 Learning & Exploring

<img src="https://media.giphy.com/media/7NoNw4pMNTvgc/giphy.gif" width="300" align="right" alt="Space Animation"/>

AETHERIA is not just a project; it's also a space to learn, experiment, and explore the world of Web3 development.

Whether you're new to blockchain or already exploring decentralized technologies, here are some concepts worth learning through this project.

### 🔗 Smart Contracts & Solidity

Learn how blockchain-based programs can power NFT marketplaces.

**Explore how they can be used in AETHERIA:**
- **NFT Minting:** Create unique digital assets using ERC-721 and ERC-1155 standards.
- **Ownership Verification:** Store and verify NFT ownership directly on-chain.
- **Marketplace Transactions:** Handle NFT listings, purchases, and transfers through smart contracts.
- **Royalties:** Enable creators to receive a percentage from secondary sales.
- **Auctions:** Manage bidding, auction deadlines, and payments programmatically.

### 🌐 Decentralized Applications (DApps)

Understand how frontend applications interact with blockchain networks.

**Explore their potential in AETHERIA:**
- **Wallet Connectivity:** Integrate MetaMask and other Web3 wallets.
- **Blockchain Interaction:** Connect React applications with smart contracts using Ethers.js or Viem.
- **On-Chain Data:** Retrieve NFT ownership, transactions, and marketplace activity.
- **Decentralized Storage:** Use IPFS to store NFT images and metadata.
- **Testnet Deployment:** Experiment with blockchain transactions without using real funds.


### 🚀 Learning Path

If you're interested in exploring Web3 through AETHERIA, here's a suggested starting path:

1. Understand blockchain fundamentals and how transactions work.
2. Learn Solidity basics and write your first smart contract.
3. Explore ERC-721 and ERC-1155 NFT standards.
4. Build and test contracts using Remix or Hardhat.
5. Connect a React frontend with a blockchain wallet.
6. Experiment with NFT minting and marketplace transactions.
7. Explore decentralized storage using IPFS.

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Commit your changes:

   ```bash
   git commit -m "Add: your feature description"
   ```

4. Push your branch:

   ```bash
   git push origin feature/your-feature-name
   ```

5. Open a Pull Request.

---

## 📜 License

This project is available under the license specified in the repository.

---

<p align="center">
  <strong>AETHERIA</strong><br/>
  <em>Enter the Zero-G Universe. Discover Beyond Dimensions.</em>
</p>