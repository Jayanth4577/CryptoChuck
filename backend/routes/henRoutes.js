import express from 'express';
import { ContractService } from '../services/contractService.js';

const router = express.Router();

// Get hen details by token ID
router.get('/hen/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const henDetails = await ContractService.getHenDetails(tokenId);
    res.json({ success: true, data: henDetails });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all hens owned by an address
router.get('/user/:address/hens', async (req, res) => {
  try {
    const { address } = req.params;
    const hens = await ContractService.getUserHens(address);
    res.json({ success: true, data: hens });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get mint price
router.get('/mint-price', async (req, res) => {
  try {
    const price = await ContractService.getMintPrice();
    res.json({ success: true, data: { price } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
