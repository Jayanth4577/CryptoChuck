import express from 'express';
import { ContractService } from '../services/contractService.js';

const router = express.Router();

// Get breeding cooldown
router.get('/cooldown', async (req, res) => {
  try {
    const cooldown = await ContractService.getBreedingCooldown();
    res.json({ success: true, data: { cooldown } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get breeding cost
router.get('/cost', async (req, res) => {
  try {
    const cost = await ContractService.getBreedingCost();
    res.json({ success: true, data: { cost } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
