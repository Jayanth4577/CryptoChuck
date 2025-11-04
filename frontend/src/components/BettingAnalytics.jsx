import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './BettingAnalytics.css';

function BettingAnalytics({ contracts, account }) {
  const [view, setView] = useState('betting'); // betting, analytics
  const [bettingView, setBettingView] = useState('battles'); // battles, races
  const [activeBattles, setActiveBattles] = useState([]);
  const [activeRaces, setActiveRaces] = useState([]);
  const [myBets, setMyBets] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [selectedHen, setSelectedHen] = useState(null);

  useEffect(() => {
    if (contracts.bettingSystem && account) {
      loadBettingData();
      loadAnalytics();
    }
  }, [contracts, account]);

  const loadBettingData = async () => {
    setLoading(true);
    try {
      // Load user stats
      const stats = await contracts.bettingSystem.getUserStats(account);
      setUserStats({
        totalBattleBets: Number(stats.totalBattleBets),
        totalRaceBets: Number(stats.totalRaceBets),
        totalWagered: ethers.formatEther(stats.totalWagered),
        totalWon: ethers.formatEther(stats.totalWon),
      });

      // Load user's bets
      const battleBetIds = await contracts.bettingSystem.getUserBattleBets(account);
      const raceBetIds = await contracts.bettingSystem.getUserRaceBets(account);
      
      const bets = [];
      
      // Load last 10 battle bets
      for (let i = Math.max(0, battleBetIds.length - 10); i < battleBetIds.length; i++) {
        const betId = battleBetIds[i];
        const bet = await contracts.bettingSystem.getBattleBet(betId);
        bets.push({
          id: betId.toString(),
          type: 'battle',
          eventId: bet.battleId.toString(),
          henId: bet.henId.toString(),
          amount: ethers.formatEther(bet.amount),
          payout: ethers.formatEther(bet.payout),
          claimed: bet.claimed,
        });
      }

      // Load last 10 race bets
      for (let i = Math.max(0, raceBetIds.length - 10); i < raceBetIds.length; i++) {
        const betId = raceBetIds[i];
        const bet = await contracts.bettingSystem.getRaceBet(betId);
        bets.push({
          id: betId.toString(),
          type: 'race',
          eventId: bet.raceId.toString(),
          henId: bet.henId.toString(),
          position: Number(bet.position),
          amount: ethers.formatEther(bet.amount),
          payout: ethers.formatEther(bet.payout),
          claimed: bet.claimed,
        });
      }

      setMyBets(bets);

      // Load active battles (simplified)
      const battles = [];
      for (let i = 1; i <= 5; i++) {
        try {
          const battle = await contracts.henBattle.getBattle(i);
          if (!battle.isComplete) {
            const odds1 = await contracts.bettingSystem.getBattleOdds(i, battle.hen1Id);
            const odds2 = await contracts.bettingSystem.getBattleOdds(i, battle.hen2Id);
            
            battles.push({
              id: i,
              hen1Id: battle.hen1Id.toString(),
              hen2Id: battle.hen2Id.toString(),
              odds1: (Number(odds1) / 100).toFixed(2),
              odds2: (Number(odds2) / 100).toFixed(2),
            });
          }
        } catch (error) {
          continue;
        }
      }
      setActiveBattles(battles);

      // Load active races (simplified)
      const races = [];
      for (let i = 1; i <= 5; i++) {
        try {
          const participants = await contracts.henRacing.getRaceParticipants(i);
          if (participants.length > 0) {
            races.push({
              id: i,
              participants: participants.map(p => p.toString()),
            });
          }
        } catch (error) {
          continue;
        }
      }
      setActiveRaces(races);

    } catch (error) {
      console.error('Error loading betting data:', error);
    }
    setLoading(false);
  };

  const loadAnalytics = async () => {
    try {
      // Calculate analytics
      const totalHens = 100; // Simplified
      let totalBattles = 0;
      let totalRaces = 0;
      let totalVolume = 0;

      setAnalytics({
        totalHens,
        totalBattles,
        totalRaces,
        totalVolume: '10.5', // Mock data
        activeUsers: '45',
        avgBetSize: '0.05',
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const placeBet = async () => {
    if (!selectedEvent || !selectedHen || !betAmount) {
      alert('Please select event, hen, and bet amount!');
      return;
    }

    setLoading(true);
    try {
      const amount = ethers.parseEther(betAmount);
      
      let tx;
      if (bettingView === 'battles') {
        tx = await contracts.bettingSystem.placeBattleBet(
          selectedEvent.id,
          selectedHen,
          { value: amount }
        );
      } else {
        tx = await contracts.bettingSystem.placeRaceBet(
          selectedEvent.id,
          selectedHen,
          1, // Betting on 1st place
          { value: amount }
        );
      }

      await tx.wait();
      alert('✅ Bet placed successfully!');
      setBetAmount('');
      setSelectedEvent(null);
      setSelectedHen(null);
      loadBettingData();
    } catch (error) {
      console.error('Error placing bet:', error);
      alert('Failed to place bet: ' + error.message);
    }
    setLoading(false);
  };

  const claimWinnings = async (bet) => {
    setLoading(true);
    try {
      let tx;
      if (bet.type === 'battle') {
        tx = await contracts.bettingSystem.claimBattleBet(bet.id);
      } else {
        tx = await contracts.bettingSystem.claimRaceBet(bet.id);
      }

      await tx.wait();
      alert(`💰 Claimed ${bet.payout} ETH!`);
      loadBettingData();
    } catch (error) {
      console.error('Error claiming:', error);
      alert('Failed to claim: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="betting-analytics-container">
      <div className="betting-header">
        <h2>🎰 Betting & Analytics</h2>
        <p>Place bets and track your performance</p>
      </div>

      <div className="main-nav">
        <button 
          className={view === 'betting' ? 'active' : ''} 
          onClick={() => setView('betting')}
        >
          🎰 Betting
        </button>
        <button 
          className={view === 'analytics' ? 'active' : ''} 
          onClick={() => setView('analytics')}
        >
          📊 Analytics
        </button>
      </div>

      {view === 'betting' && (
        <>
          {userStats && (
            <div className="user-stats-banner">
              <div className="stat-box">
                <span className="stat-label">Total Bets</span>
                <span className="stat-value">
                  {userStats.totalBattleBets + userStats.totalRaceBets}
                </span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total Wagered</span>
                <span className="stat-value">{parseFloat(userStats.totalWagered).toFixed(4)} ETH</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total Won</span>
                <span className="stat-value">{parseFloat(userStats.totalWon).toFixed(4)} ETH</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Profit/Loss</span>
                <span className={`stat-value ${parseFloat(userStats.totalWon) - parseFloat(userStats.totalWagered) >= 0 ? 'profit' : 'loss'}`}>
                  {(parseFloat(userStats.totalWon) - parseFloat(userStats.totalWagered)).toFixed(4)} ETH
                </span>
              </div>
            </div>
          )}

          <div className="betting-nav">
            <button 
              className={bettingView === 'battles' ? 'active' : ''} 
              onClick={() => setBettingView('battles')}
            >
              ⚔️ Battle Betting
            </button>
            <button 
              className={bettingView === 'races' ? 'active' : ''} 
              onClick={() => setBettingView('races')}
            >
              🏁 Race Betting
            </button>
            <button 
              className={bettingView === 'my-bets' ? 'active' : ''} 
              onClick={() => setBettingView('my-bets')}
            >
              📋 My Bets ({myBets.length})
            </button>
          </div>

          {bettingView === 'battles' && (
            <div className="betting-section">
              <h3>⚔️ Active Battles</h3>
              {activeBattles.length === 0 ? (
                <div className="empty-state">No active battles available for betting</div>
              ) : (
                <div className="events-grid">
                  {activeBattles.map(battle => (
                    <div key={battle.id} className="betting-event-card">
                      <h4>Battle #{battle.id}</h4>
                      <div className="betting-options">
                        <div 
                          className="betting-option"
                          onClick={() => {
                            setSelectedEvent(battle);
                            setSelectedHen(battle.hen1Id);
                          }}
                        >
                          <span>Hen #{battle.hen1Id}</span>
                          <span className="odds">{battle.odds1}x</span>
                        </div>
                        <div className="vs-text">VS</div>
                        <div 
                          className="betting-option"
                          onClick={() => {
                            setSelectedEvent(battle);
                            setSelectedHen(battle.hen2Id);
                          }}
                        >
                          <span>Hen #{battle.hen2Id}</span>
                          <span className="odds">{battle.odds2}x</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {bettingView === 'races' && (
            <div className="betting-section">
              <h3>🏁 Active Races</h3>
              {activeRaces.length === 0 ? (
                <div className="empty-state">No active races available for betting</div>
              ) : (
                <div className="events-grid">
                  {activeRaces.map(race => (
                    <div key={race.id} className="betting-event-card">
                      <h4>Race #{race.id}</h4>
                      <p>{race.participants.length} participants</p>
                      <button 
                        onClick={() => setSelectedEvent(race)}
                        className="bet-btn"
                      >
                        Place Bet
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {bettingView === 'my-bets' && (
            <div className="my-bets-section">
              <h3>📋 My Bets</h3>
              {myBets.length === 0 ? (
                <div className="empty-state">You haven't placed any bets yet</div>
              ) : (
                <div className="bets-list">
                  {myBets.map(bet => (
                    <div key={bet.id} className="bet-card">
                      <div className="bet-header">
                        <span className="bet-type">
                          {bet.type === 'battle' ? '⚔️ Battle' : '🏁 Race'} #{bet.eventId}
                        </span>
                        <span className={`bet-status ${bet.claimed ? 'claimed' : 'pending'}`}>
                          {bet.claimed ? '✅ Claimed' : '⏳ Pending'}
                        </span>
                      </div>
                      <div className="bet-details">
                        <span>Hen #{bet.henId}</span>
                        {bet.position && <span>Position: {bet.position}</span>}
                        <span>Bet: {bet.amount} ETH</span>
                        {bet.payout > 0 && <span className="payout">Payout: {bet.payout} ETH</span>}
                      </div>
                      {!bet.claimed && bet.payout > 0 && (
                        <button 
                          onClick={() => claimWinnings(bet)}
                          className="claim-btn"
                          disabled={loading}
                        >
                          💰 Claim Winnings
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedEvent && (
            <div className="bet-modal">
              <div className="bet-modal-content">
                <h3>Place Your Bet</h3>
                <p>Event: {bettingView === 'battles' ? 'Battle' : 'Race'} #{selectedEvent.id}</p>
                <p>Selected Hen: #{selectedHen}</p>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max="10"
                  placeholder="Bet amount (ETH)"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                />
                <div className="modal-actions">
                  <button onClick={() => {
                    setSelectedEvent(null);
                    setBetAmount('');
                  }}>Cancel</button>
                  <button onClick={placeBet} disabled={loading}>
                    {loading ? 'Placing...' : 'Confirm Bet'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {view === 'analytics' && analytics && (
        <div className="analytics-section">
          <h3>📊 Platform Analytics</h3>
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-icon">🐔</div>
              <div className="analytics-content">
                <span className="analytics-label">Total Hens</span>
                <span className="analytics-value">{analytics.totalHens}</span>
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-icon">⚔️</div>
              <div className="analytics-content">
                <span className="analytics-label">Total Battles</span>
                <span className="analytics-value">{analytics.totalBattles}</span>
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-icon">🏁</div>
              <div className="analytics-content">
                <span className="analytics-label">Total Races</span>
                <span className="analytics-value">{analytics.totalRaces}</span>
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-icon">💰</div>
              <div className="analytics-content">
                <span className="analytics-label">Total Volume</span>
                <span className="analytics-value">{analytics.totalVolume} ETH</span>
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-icon">👥</div>
              <div className="analytics-content">
                <span className="analytics-label">Active Users</span>
                <span className="analytics-value">{analytics.activeUsers}</span>
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-icon">📊</div>
              <div className="analytics-content">
                <span className="analytics-label">Avg Bet Size</span>
                <span className="analytics-value">{analytics.avgBetSize} ETH</span>
              </div>
            </div>
          </div>

          {userStats && (
            <>
              <h3>📈 Your Performance</h3>
              <div className="performance-chart">
                <div className="performance-stat">
                  <span className="perf-label">Win Rate</span>
                  <div className="perf-bar">
                    <div 
                      className="perf-fill" 
                      style={{width: `${(userStats.totalWon / (userStats.totalWagered || 1)) * 100}%`}}
                    ></div>
                  </div>
                  <span className="perf-value">
                    {((userStats.totalWon / (userStats.totalWagered || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="performance-breakdown">
                  <div className="breakdown-item">
                    <span>Battle Bets:</span>
                    <span>{userStats.totalBattleBets}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Race Bets:</span>
                    <span>{userStats.totalRaceBets}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>ROI:</span>
                    <span className={(parseFloat(userStats.totalWon) / parseFloat(userStats.totalWagered || 1) - 1) >= 0 ? 'positive' : 'negative'}>
                      {(((parseFloat(userStats.totalWon) / parseFloat(userStats.totalWagered || 1)) - 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default BettingAnalytics;