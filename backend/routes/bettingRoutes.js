import express from 'express';
import { ContractService } from '../services/contractService.js';

const router = express.Router();

// Get active bets
router.get('/active', async (req, res) => {
  try {
    const bets = await ContractService.getActiveBets();
    res.json({ success: true, data: bets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get minimum bet amount
router.get('/min-amount', async (req, res) => {
  try {
    const minBet = await ContractService.getMinBetAmount();
    res.json({ success: true, data: { minBet } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
