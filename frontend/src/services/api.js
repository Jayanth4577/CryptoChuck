// API service for backend communication
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Generic API request handler
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Hen NFT API calls
export const henAPI = {
  /**
   * Get hen details by token ID
   */
  async getHenDetails(tokenId) {
    return apiRequest(`/api/hens/hen/${tokenId}`);
  },

  /**
   * Get all hens owned by an address
   */
  async getUserHens(address) {
    return apiRequest(`/api/hens/user/${address}/hens`);
  },

  /**
   * Get current mint price
   */
  async getMintPrice() {
    return apiRequest('/api/hens/mint-price');
  },
};

// Breeding API calls
export const breedingAPI = {
  /**
   * Get breeding cooldown period
   */
  async getBreedingCooldown() {
    return apiRequest('/api/breeding/cooldown');
  },

  /**
   * Get breeding cost
   */
  async getBreedingCost() {
    return apiRequest('/api/breeding/cost');
  },
};

// Battle API calls
export const battleAPI = {
  /**
   * Get all active battles
   */
  async getActiveBattles() {
    return apiRequest('/api/battles/active');
  },

  /**
   * Get minimum wager amount
   */
  async getMinWager() {
    return apiRequest('/api/battles/min-wager');
  },
};

// Racing API calls
export const racingAPI = {
  /**
   * Get all active races
   */
  async getActiveRaces() {
    return apiRequest('/api/racing/active');
  },

  /**
   * Get race entry fee
   */
  async getRaceEntryFee() {
    return apiRequest('/api/racing/entry-fee');
  },
};

// Betting API calls
export const bettingAPI = {
  /**
   * Get all active bets
   */
  async getActiveBets() {
    return apiRequest('/api/betting/active');
  },

  /**
   * Get minimum bet amount
   */
  async getMinBetAmount() {
    return apiRequest('/api/betting/min-amount');
  },
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return { success: false, error: error.message };
  }
};

export default {
  henAPI,
  breedingAPI,
  battleAPI,
  racingAPI,
  bettingAPI,
  healthCheck,
};
