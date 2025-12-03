import express from 'express';
import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { provider, contracts } from '../config/contracts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Load UserRegistry ABI
const registryAbiPath = join(__dirname, '../abis/UserRegistry.json');
let UserRegistryABI;
try {
  const abiFile = readFileSync(registryAbiPath, 'utf-8');
  UserRegistryABI = JSON.parse(abiFile).abi;
} catch (error) {
  console.error('Error loading UserRegistry ABI:', error.message);
  UserRegistryABI = [];
}

const USER_REGISTRY_ADDRESS = process.env.USER_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000';

// Sponsorship wallet (funded wallet that pays for new user mints)
const SPONSOR_PRIVATE_KEY = process.env.SPONSOR_PRIVATE_KEY || '';
const sponsorWallet = SPONSOR_PRIVATE_KEY ? new ethers.Wallet(SPONSOR_PRIVATE_KEY, provider) : null;

// Rate limiting - track registration attempts
const registrationAttempts = new Map();
const MAX_ATTEMPTS_PER_IP = 3;
const ATTEMPT_WINDOW = 60 * 60 * 1000; // 1 hour

/**
 * POST /api/registration/register
 * Register new user and sponsor 2 free hen mints
 * Body: { walletAddress, email (optional) }
 */
router.post('/register', async (req, res) => {
    try {
        const { walletAddress, email } = req.body;
        
        // Validate input
        if (!walletAddress || !ethers.isAddress(walletAddress)) {
            return res.status(400).json({
                success: false,
                error: 'Valid wallet address required'
            });
        }
        
        // Rate limiting by IP
        const clientIP = req.ip || req.connection.remoteAddress;
        const attempts = registrationAttempts.get(clientIP) || { count: 0, firstAttempt: Date.now() };
        
        if (Date.now() - attempts.firstAttempt < ATTEMPT_WINDOW) {
            if (attempts.count >= MAX_ATTEMPTS_PER_IP) {
                return res.status(429).json({
                    success: false,
                    error: 'Too many registration attempts. Please try again later.'
                });
            }
            attempts.count++;
        } else {
            attempts.count = 1;
            attempts.firstAttempt = Date.now();
        }
        registrationAttempts.set(clientIP, attempts);
        
        // Check if sponsor wallet is configured
        if (!sponsorWallet) {
            return res.status(503).json({
                success: false,
                error: 'Sponsorship service not configured. Please contact admin.'
            });
        }
        
        // Check if user is already registered
        const registryContract = new ethers.Contract(USER_REGISTRY_ADDRESS, UserRegistryABI, provider);
        const isAlreadyRegistered = await registryContract.isRegistered(walletAddress);
        
        if (isAlreadyRegistered) {
            return res.status(400).json({
                success: false,
                error: 'Wallet address already registered'
            });
        }
        
        // Register user in UserRegistry contract
        const registryWithSigner = registryContract.connect(sponsorWallet);
        const registerTx = await registryWithSigner.registerUser(walletAddress, email || '');
        await registerTx.wait();
        
        // Sponsor 2 hen mints for the new user
        const henNFTContract = contracts.henNFT.connect(sponsorWallet);
        
        // Mint 2 hens and send to user's wallet
        const mintPrice = ethers.parseEther('0.01'); // Price per hen
        const totalCost = mintPrice * BigInt(2);
        
        const mintTx = await henNFTContract.batchMintHens(2, {
            value: totalCost,
            gasLimit: 500000 // Set gas limit to avoid estimation issues
        });
        
        const receipt = await mintTx.wait();
        
        // Extract minted token IDs from events
        const mintEvents = receipt.logs
            .filter(log => log.topics[0] === henNFTContract.interface.getEvent('HenMinted').topicHash)
            .map(log => henNFTContract.interface.parseLog(log));
        
        const tokenIds = mintEvents.map(event => event.args.tokenId.toString());
        
        // Transfer hens to user
        for (const tokenId of tokenIds) {
            const transferTx = await henNFTContract['safeTransferFrom(address,address,uint256)'](
                sponsorWallet.address,
                walletAddress,
                tokenId
            );
            await transferTx.wait();
        }
        
        res.json({
            success: true,
            message: 'Registration successful! You received 2 free hens!',
            data: {
                walletAddress,
                henTokenIds: tokenIds,
                registrationTime: Date.now(),
                transactionHash: mintTx.hash
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle specific errors
        if (error.message.includes('already registered')) {
            return res.status(400).json({
                success: false,
                error: 'Wallet already registered'
            });
        }
        
        if (error.message.includes('insufficient funds')) {
            return res.status(503).json({
                success: false,
                error: 'Sponsorship wallet needs funding. Please contact admin.'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Registration failed. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/registration/check/:address
 * Check if wallet is registered
 */
router.get('/check/:address', async (req, res) => {
    try {
        const { address } = req.params;
        
        if (!ethers.isAddress(address)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid wallet address'
            });
        }
        
        const registryContract = new ethers.Contract(USER_REGISTRY_ADDRESS, UserRegistryABI, provider);
        const isRegistered = await registryContract.isRegistered(address);
        
        let userInfo = null;
        if (isRegistered) {
            userInfo = await registryContract.getUserInfo(address);
        }
        
        res.json({
            success: true,
            isRegistered,
            userInfo: isRegistered ? {
                registrationTime: userInfo.registrationTime.toString(),
                hensReceived: userInfo.hensReceived.toString(),
                email: userInfo.email
            } : null
        });
        
    } catch (error) {
        console.error('Check registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check registration status'
        });
    }
});

/**
 * GET /api/registration/stats
 * Get registration statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const registryContract = new ethers.Contract(USER_REGISTRY_ADDRESS, UserRegistryABI, provider);
        const totalRegistrations = await registryContract.totalRegistrations();
        
        res.json({
            success: true,
            stats: {
                totalRegistrations: totalRegistrations.toString(),
                sponsorWalletConfigured: !!sponsorWallet,
                maxFreeHens: 2
            }
        });
        
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
});

export default router;
