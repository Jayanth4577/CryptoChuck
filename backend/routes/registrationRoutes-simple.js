import express from 'express';
import { ethers } from 'ethers';

const router = express.Router();

// Simple in-memory storage (in production, use a database)
const registeredUsers = new Map();

// Rate limiting
const registrationAttempts = new Map();
const MAX_ATTEMPTS_PER_IP = 5;
const ATTEMPT_WINDOW = 60 * 60 * 1000; // 1 hour

/**
 * POST /api/registration/register
 * Register new user (no free hens - user mints their own)
 */
router.post('/register', async (req, res) => {
    try {
        const { walletAddress, email } = req.body;
        
        // Validate wallet address
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
        } else {
            attempts.count = 0;
            attempts.firstAttempt = Date.now();
        }
        
        attempts.count++;
        registrationAttempts.set(clientIP, attempts);
        
        // Check if already registered
        const normalizedAddress = walletAddress.toLowerCase();
        if (registeredUsers.has(normalizedAddress)) {
            return res.status(400).json({
                success: false,
                error: 'Wallet already registered'
            });
        }
        
        // Register user
        const userData = {
            walletAddress: normalizedAddress,
            email: email || null,
            registeredAt: new Date().toISOString(),
        };
        
        registeredUsers.set(normalizedAddress, userData);
        
        console.log(`✅ New user registered: ${walletAddress}`);
        
        return res.json({
            success: true,
            message: 'Registration successful! Get Sepolia ETH from faucets to mint your hens.',
            data: {
                walletAddress: userData.walletAddress,
                registeredAt: userData.registeredAt
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            error: 'Registration failed. Please try again.'
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
        
        const normalizedAddress = address.toLowerCase();
        const isRegistered = registeredUsers.has(normalizedAddress);
        const userData = registeredUsers.get(normalizedAddress);
        
        return res.json({
            success: true,
            isRegistered,
            data: userData || null
        });
        
    } catch (error) {
        console.error('Check registration error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to check registration'
        });
    }
});

/**
 * GET /api/registration/stats
 * Get registration statistics
 */
router.get('/stats', async (req, res) => {
    try {
        return res.json({
            success: true,
            data: {
                totalRegistrations: registeredUsers.size,
                registeredAddresses: Array.from(registeredUsers.keys())
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get statistics'
        });
    }
});

export default router;
