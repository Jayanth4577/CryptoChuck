import express from 'express';
import { ContractService } from '../services/contractService.js';

const router = express.Router();

// Get active battles
router.get('/active', async (req, res) => {
  try {
    const battles = await ContractService.getActiveBattles();
    res.json({ success: true, data: battles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get minimum wager
router.get('/min-wager', async (req, res) => {
  try {
    const minWager = await ContractService.getMinWager();
    res.json({ success: true, data: { minWager } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
