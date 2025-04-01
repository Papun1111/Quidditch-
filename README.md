
---

# Quidditch Market Dashboard

A full-stack fintech simulation platform inspired by the magical world of Quidditch. The platform integrates real-time stock data, predictive analytics powered by TensorFlow.js, and immersive VR trading experiences. It also features interactive dashboards, dynamic charts, and a VR trading pit with ambient crowd noise that reacts to market changes.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

## Overview

Quidditch Market Dashboard is a simulation and trading platform designed for retail traders and institutions who want to experiment with algorithmic trading and VR-based market analysis. The system integrates live data (or dummy fallback data) from multiple sources, uses TensorFlow.js for predictive analytics, and offers a unique VR trading pit experience.

---

## Features

- **Real-time Stock Data Integration:**  
  Fetches live market data using Alpha Vantage, Yahoo Finance, or fallback dummy data.
  
- **Predictive Analytics:**  
  Uses TensorFlow.js to analyze historical data, forecast price trends, and generate actionable recommendations (Buy, Sell, or Hold) based on your holdings.
  
- **Interactive Dashboards:**  
  Displays market metrics, trading summaries, and risk analysis with dynamic charts (Bar, Pie, Histogram) using Recharts.
  
- **VR Trading Pit:**  
  Offers an immersive VR experience where ambient crowd noise, visual animations, and real-time analytics react to market changes.
  
- **WebSockets Integration:**  
  Uses Socket.IO for real-time updates across the platform.
  
- **User Authentication & Authorization:**  
  Secure signup/login with JWT and role-based access control.

---

## Tech Stack

### Backend
- **Node.js** [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
- **Express.js** [![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
- **MongoDB** [![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
- **Socket.IO** [![Socket.IO](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
- **TensorFlow.js** [![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/js)
- **Node Cache** [![node-cache](https://img.shields.io/badge/node--cache-000000?style=for-the-badge)](https://www.npmjs.com/package/node-cache)

### Frontend
- **React** [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
- **Tailwind CSS** [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
- **Framer Motion** [![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
- **Recharts** [![Recharts](https://img.shields.io/badge/Recharts-FE9A2E?style=for-the-badge)](http://recharts.org/)
- **React Three Fiber** [![React Three Fiber](https://img.shields.io/badge/React_Three_Fiber-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- **Socket.IO Client** [![Socket.IO Client](https://img.shields.io/badge/Socket.io_Client-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

---

## Installation & Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```

2. **Install backend dependencies:**

   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the `backend` folder with the following:

   ```env
   PORT=3000
   MONGO_URL=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ALPHAVANTAGE_API_KEY=your_alpha_vantage_api_key
   YAHOO_FINANCE_API_KEY=your_yahoo_finance_api_key (optional)
   ```

4. **Install frontend dependencies:**

   ```bash
   cd ../frontend
   npm install
   ```

5. **Start the backend server:**

   ```bash
   cd ../backend
   npm start
   ```

6. **Start the frontend development server:**

   ```bash
   cd ../frontend
   npm start
   ```

---

## Usage

- **Sign Up / Login:**  
  Create an account or log in to access the platform.
  
- **Dashboard:**  
  Navigate through the sidebar to view holdings, positions, place orders, view stock trends, analyze risk, and explore the VR Trading Pit.
  
- **VR Trading Pit:**  
  Experience a 3D immersive VR trading pit with ambient audio that changes based on market dynamics. The system updates dynamically via Socket.IO.
  
- **Predictive Analytics:**  
  Get AI-driven recommendations on which stocks to buy or sell based on historical trends and your current holdings.

---

## Project Structure

```
/backend
  ├── index.js                # Main server file (Express, MongoDB, API endpoints, TensorFlow predictions, VR Trading Pit, etc.)
  ├── model/
  │     ├── userModels.js     # Mongoose models for users
  │     ├── OrdersModel.js    # Mongoose models for orders
  │     └── HoldingsModel.js  # Mongoose models for holdings
  └── .env                    # Environment variables
/frontend
  ├── public/
  │     └── assets/           # Audio files, images, etc.
  ├── src/
  │     ├── components/
  │     │     ├── Holdings.tsx
  │     │     ├── Positions.tsx
  │     │     ├── OrderForm.tsx
  │     │     ├── StockTrends.tsx
  │     │     ├── TradingSummary.tsx
  │     │     ├── TeamPerformance.tsx
  │     │     ├── OptionChain.tsx
  │     │     ├── PortfolioRisk.tsx
  │     │     ├── VRTradingPit.tsx   # Contains 3D scene, ambient audio and charts for VR Trading Pit
  │     │     └── TFPredictionsHoldings.tsx  # TensorFlow predictions for holdings
  │     ├── pages/
  │     │     └── Dashboard.tsx
  │     ├── App.tsx             # Main app routing
  │     └── index.tsx           # ReactDOM.render
  └── package.json
```

---

## API Endpoints

- **Authentication:**
  - `POST /api/signup` – Create a new user.
  - `POST /api/login` – User login.

- **Holdings & Orders:**
  - `GET /api/holdings` – Get user's holdings.
  - `POST /api/newOrder` – Place a new order.

- **Market Data:**
  - `GET /api/positions` – Get current positions with live data.
  - `GET /api/stock-trends` – Get market trends.
  - `GET /api/all-stocks` – Get available stocks.

- **Analytics:**
  - `GET /api/trading-summary` – Get trading summary.
  - `GET /api/portfolio-risk` – Get portfolio risk analysis.
  - `GET /api/team-performance` – Get team performance metrics.
  - `GET /api/option-chain/:symbol` – Get option chain for a stock.

- **Predictive Analytics:**
  - `GET /api/tf-holdings-predictions` – AI predictions for your holdings (using TensorFlow.js).

- **VR Trading Pit:**
  - `GET /api/vr-trading-pit` – Get data for VR trading pit.
  - WebSocket broadcast on `vrData` for live updates.

- **Status:**
  - `GET /api/status` – Get server and API provider status.

---

## Future Enhancements

- **Advanced Machine Learning Models:**  
  Improve prediction models by incorporating additional market features and optimizing neural network architectures.

- **Real-Time Trading Integration:**  
  Integrate with brokerage APIs to enable live trading (paper trading initially).

- **Enhanced VR Experience:**  
  Expand the VR trading pit with more interactive elements, dynamic audio, and real-time market simulation.

- **Mobile Optimization:**  
  Refine the responsive design and add mobile-specific features.

- **User Analytics & Reporting:**  
  Provide detailed performance reports, historical data analysis, and personalized insights.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

### Contact

For more information or contributions, please contact [gohanmohapatra@gmail.com](mailto:your-email@example.com).

---

*Enjoy trading in a world where magic meets markets!* 

---
