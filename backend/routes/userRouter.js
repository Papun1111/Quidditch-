// routes/userRouter.js
import express from 'express';
import * as userCtrl from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

router.post('/signup', userCtrl.signup);
router.post('/login',  userCtrl.login);
router.get('/holdings',   authenticateToken, userCtrl.getHoldings);
router.get('/positions',  authenticateToken, userCtrl.getPositions);

export default router;
