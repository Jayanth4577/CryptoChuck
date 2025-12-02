import express from 'express';
import { ContractService } from '../services/contractService.js';

const router = express.Router();

// Get active races
router.get('/active', async (req, res) => {
  try {
    const races = await ContractService.getActiveRaces();
    res.json({ success: true, data: races });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get race entry fee
router.get('/entry-fee', async (req, res) => {
  try {
    const entryFee = await ContractService.getRaceEntryFee();
    res.json({ success: true, data: { entryFee } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
