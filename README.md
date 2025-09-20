# PM Demo - Web3 Prediction Market Platform

A minimal Web3 blockchain prediction market platform similar to Polymarket and Kalshi, built for demonstration purposes.

![PM Demo Homepage](https://github.com/user-attachments/assets/fcc4e36f-3f37-4339-bce7-14bfbc07ac83)

## 🎯 Overview

This project demonstrates the core functionality of a decentralized prediction market where users can:
- Create prediction markets on any topic
- Buy and sell positions on market outcomes
- View real-time odds based on market activity
- Resolve markets and claim rewards

## 🚀 Features Implemented

### ✅ Current Features

- **Market Display**: View all active prediction markets with real-time odds
- **Market Creation**: Create new prediction markets with custom questions and options
- **Position Trading**: Place bets on market outcomes (UI complete - ready for Web3 integration)
- **Real-time Odds**: Dynamic odds calculation based on stake distribution
- **Responsive UI**: Mobile-friendly interface built with Next.js and Tailwind CSS
- **Market Management**: Track market expiration times and volumes

![Betting Modal](https://github.com/user-attachments/assets/a821e81f-c28b-4d7b-89b4-3a6eceb11364)

![Create Market Modal](https://github.com/user-attachments/assets/091af255-f640-449f-8c38-b07c834c1895)

![Multiple Markets](https://github.com/user-attachments/assets/47254ee9-bb04-43bb-87d3-9bb6616f957e)

### 🏗️ Smart Contract Architecture

The `PredictionMarket.sol` contract includes:
- Market creation and management
- Position buying with ETH
- Market resolution by authorized users
- Reward distribution to winners
- Emergency functions for contract safety

## 📁 Project Structure

```
PM-demo/
├── frontend/                 # Next.js React frontend
│   ├── src/app/
│   │   ├── page.tsx         # Main prediction market interface
│   │   └── layout.tsx       # App layout and metadata
│   └── package.json
├── contracts/               # Smart contract development
│   ├── contracts/
│   │   └── PredictionMarket.sol  # Main prediction market contract
│   ├── scripts/
│   │   └── deploy.ts        # Deployment script
│   ├── hardhat.config.ts    # Hardhat configuration
│   └── package.json
└── README.md
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Smart Contracts**: Solidity, Hardhat
- **Blockchain Integration**: Ready for ethers.js/wagmi integration
- **Styling**: Tailwind CSS with responsive design

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd PM-demo
```

2. **Setup Frontend**
```bash
cd frontend
npm install
npm run dev
```
Visit `http://localhost:3000` to see the application.

3. **Setup Smart Contracts** (Optional - for development)
```bash
cd contracts
npm install
# Note: Requires compatible Node.js version for Hardhat
```

### Running the Demo

1. Start the frontend development server
2. Explore the prediction markets interface
3. Test market creation and betting functionality
4. View responsive design on different screen sizes

## 🎮 Demo Functionality

The current implementation provides a fully functional UI with mock data to demonstrate:

1. **Browse Markets**: View existing prediction markets with odds and volume
2. **Place Bets**: Click on any market option to open betting modal
3. **Create Markets**: Use "Create Market" button to add new prediction markets
4. **Real-time Updates**: See odds update based on stake distribution

## 🚀 Deployment

### GitHub Pages Deployment

This application is configured for automatic deployment to GitHub Pages. The deployment happens automatically when changes are pushed to the main branch.

#### Live Demo
- **URL**: [https://ghubliming.github.io/PM-demo/](https://ghubliming.github.io/PM-demo/)

#### Automatic Deployment Setup
1. **GitHub Actions**: The repository includes a workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys the app
2. **Static Export**: Next.js is configured for static export in `next.config.ts`
3. **Build Process**: The frontend is built using `npm run export` which generates static files in the `out/` directory

#### Manual Deployment (if needed)
To deploy manually or set up in your own repository:

1. **Enable GitHub Pages**:
   - Go to repository Settings > Pages
   - Set source to "GitHub Actions"

2. **Build and Deploy**:
```bash
cd frontend
npm install
NODE_ENV=production npm run export
```

The static files will be generated in `frontend/out/` and automatically deployed by GitHub Actions.

#### Configuration Details
- **Base Path**: Configured for `/PM-demo` to work with GitHub Pages subdirectory
- **Static Export**: All pages are pre-rendered as static HTML
- **Asset Optimization**: Images and assets are optimized for static hosting
- **No Jekyll**: `.nojekyll` file included to prevent GitHub Jekyll processing

## 🔮 Future Development Roadmap

### Phase 1: Web3 Integration
- [ ] Connect wallet functionality (MetaMask, WalletConnect)
- [ ] Deploy smart contracts to testnet
- [ ] Integrate ethers.js for blockchain interactions
- [ ] Real ETH transactions for betting

### Phase 2: Enhanced Features
- [ ] Market categories and filtering
- [ ] User portfolio and position tracking
- [ ] Market resolution voting mechanism
- [ ] Liquidity pool integration

### Phase 3: Advanced Functionality
- [ ] Multi-outcome markets (beyond binary)
- [ ] Market maker functionality
- [ ] Advanced charting and analytics
- [ ] Social features and comments

### Phase 4: Production Ready
- [ ] Mainnet deployment
- [ ] Security audits
- [ ] Performance optimizations
- [ ] Mobile app development

## 🔧 Development Notes

### Frontend Development
- Built with Next.js 15 and React 18
- Uses TypeScript for type safety
- Tailwind CSS for styling
- Responsive design for mobile/desktop

### Smart Contract Development
- Solidity 0.8.19 compatible
- Includes comprehensive market management
- Gas-optimized for cost efficiency
- Security features for fund protection

### Integration Points
- Ready for Web3 wallet integration
- Contract ABI generation prepared
- Frontend hooks structure for blockchain calls
- Event listening setup for real-time updates

## 🤝 Contributing

This is a demo project showcasing prediction market functionality. Key areas for contribution:

1. **Web3 Integration**: Connect the UI to actual smart contracts
2. **Testing**: Add comprehensive test suites
3. **UI/UX**: Enhance user experience and design
4. **Security**: Review and improve contract security

## 📄 License

This project is intended for demonstration and educational purposes.

## 🏆 Comparison to Existing Platforms

**Similar to Polymarket:**
- Binary outcome markets
- Real-time odds display
- Market creation tools

**Similar to Kalshi:**
- Event-based predictions
- User-friendly interface
- Market resolution system

**Unique Features:**
- Open-source and fully decentralized
- Customizable market creation
- No platform fees (only gas costs)

---

Built with ❤️ for the Web3 community. This demonstration showcases the potential of decentralized prediction markets.