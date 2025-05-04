// routes/tradeRouter.js
import express from 'express';
import * as tradeCtrl from '../controllers/tradeController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

router.post('/newOrder',           authenticateToken, tradeCtrl.newOrder);
router.get('/stock-trends',         tradeCtrl.getStockTrends);
router.get('/trading-summary',      authenticateToken, tradeCtrl.getTradingSummary);
router.get('/all-stocks',           tradeCtrl.getAllStocks);
router.get('/team-performance',     tradeCtrl.getTeamPerformance);
router.get('/option-chain/:symbol', tradeCtrl.getOptionChain);
router.get('/portfolio-risk',       authenticateToken, tradeCtrl.getPortfolioRisk);
router.get('/tf-holdings-predictions', authenticateToken, tradeCtrl.getTfHoldingsPredictions);
router.get('/status',               tradeCtrl.getStatus);
router.get('/vr-trading-pit',       tradeCtrl.getVrTradingPit);

export default router;
