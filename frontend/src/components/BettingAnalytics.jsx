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
      
      // Auto-refresh every 15 seconds to check for completed events
      const interval = setInterval(() => {
        loadBettingData();
      }, 15000);
      
      return () => clearInterval(interval);
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
      
      // Load last 20 battle bets (show more history)
      for (let i = Math.max(0, battleBetIds.length - 20); i < battleBetIds.length; i++) {
        const betId = battleBetIds[i];
        try {
          const bet = await contracts.bettingSystem.getBattleBet(betId);
          const battleId = bet.battleId.toString();
          
          // Check if battle is complete
          let isComplete = false;
          let wonBet = false;
          try {
            const battle = await contracts.henBattle.getBattle(battleId);
            isComplete = battle.isComplete;
            if (isComplete) {
              wonBet = battle.winnerId.toString() === bet.henId.toString();
            }
          } catch (err) {
            console.debug(`Battle ${battleId} check failed:`, err.message);
          }
          
          bets.push({
            id: betId.toString(),
            type: 'battle',
            eventId: battleId,
            henId: bet.henId.toString(),
            amount: ethers.formatEther(bet.amount),
            payout: ethers.formatEther(bet.payout),
            claimed: bet.claimed,
            isComplete: isComplete,
            won: wonBet,
          });
        } catch (err) {
          console.debug(`Skipping bet ${betId}:`, err.message);
        }
      }

      // Load last 20 race bets
      for (let i = Math.max(0, raceBetIds.length - 20); i < raceBetIds.length; i++) {
        const betId = raceBetIds[i];
        try {
          const bet = await contracts.bettingSystem.getRaceBet(betId);
          const raceId = bet.raceId.toString();
          
          // Check if race is complete
          let isComplete = false;
          let wonBet = false;
          try {
            const race = await contracts.henRacing.getRace(raceId);
            isComplete = race.isComplete;
            if (isComplete && race.winners && race.winners.length > 0) {
              // Check if hen placed in the bet position
              const position = Number(bet.position);
              if (position > 0 && position <= race.winners.length) {
                wonBet = race.winners[position - 1].toString() === bet.henId.toString();
              }
            }
          } catch (err) {
            console.debug(`Race ${raceId} check failed:`, err.message);
          }
          
          bets.push({
            id: betId.toString(),
            type: 'race',
            eventId: raceId,
            henId: bet.henId.toString(),
            position: Number(bet.position),
            amount: ethers.formatEther(bet.amount),
            payout: ethers.formatEther(bet.payout),
            claimed: bet.claimed,
            isComplete: isComplete,
            won: wonBet,
          });
        } catch (err) {
          console.debug(`Skipping bet ${betId}:`, err.message);
        }
      }

      // Sort bets by ID (newest first)
      bets.sort((a, b) => parseInt(b.id) - parseInt(a.id));
      
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

    const betValue = parseFloat(betAmount);
    if (betValue < 0.001) {
      alert('Minimum bet is 0.001 ETH');
      return;
    }
    if (betValue > 10) {
      alert('Maximum bet is 10 ETH');
      return;
    }

    setLoading(true);
    try {
      const amount = ethers.parseEther(betAmount.toString());
      
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
      alert('Failed to place bet: ' + (error.reason || error.message));
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
                <span className="stat-value">{Math.max(0, parseFloat(userStats.totalWagered || 0)).toFixed(4)} ETH</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total Won</span>
                <span className="stat-value">{Math.max(0, parseFloat(userStats.totalWon || 0)).toFixed(4)} ETH</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Profit/Loss</span>
                <span className={`stat-value ${(parseFloat(userStats.totalWon || 0) - parseFloat(userStats.totalWagered || 0)) >= 0 ? 'profit' : 'loss'}`}>
                  {(parseFloat(userStats.totalWon || 0) - parseFloat(userStats.totalWagered || 0)).toFixed(4)} ETH
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
              <div className="section-header-with-refresh">
                <h3>📋 My Bets</h3>
                <button 
                  onClick={() => loadBettingData()} 
                  disabled={loading}
                  className="refresh-btn"
                  title="Refresh bet status"
                >
                  {loading ? '⏳' : '🔄'} Refresh
                </button>
              </div>
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
                        <span className={`bet-status ${bet.claimed ? 'claimed' : bet.isComplete ? 'complete' : 'pending'}`}>
                          {bet.claimed ? (
                            bet.payout > 0 ? '✅ Won & Claimed' : '❌ Lost'
                          ) : bet.isComplete ? (
                            bet.won ? '🎉 Won - Claim Now!' : '❌ Lost'
                          ) : (
                            '⏳ Event In Progress'
                          )}
                        </span>
                      </div>
                      <div className="bet-details">
                        <span>🐔 Hen #{bet.henId}</span>
                        {bet.position && <span>📍 Position: {bet.position}</span>}
                        <span>💰 Bet: {bet.amount} ETH</span>
                        {bet.payout > 0 && <span className="payout">💵 Payout: {bet.payout} ETH</span>}
                      </div>
                      {!bet.claimed && !bet.isComplete && (
                        <div className="bet-status-info">
                          <p className="waiting-text">
                            ⏳ Waiting for {bet.type === 'battle' ? 'battle' : 'race'} #{bet.eventId} to complete
                          </p>
                          <p className="help-text">
                            Go to {bet.type === 'battle' ? '⚔️ Battle Arena' : '🏁 Racing'} to complete the event
                          </p>
                        </div>
                      )}
                      {!bet.claimed && bet.isComplete && bet.won && bet.payout > 0 && (
                        <button 
                          onClick={() => claimWinnings(bet)}
                          className="claim-btn"
                          disabled={loading}
                        >
                          💰 Claim {bet.payout} ETH
                        </button>
                      )}
                      {bet.claimed && bet.payout === 0 && (
                        <div className="bet-result lost">
                          Your hen didn't win this time
                        </div>
                      )}
                      {bet.claimed && bet.payout > 0 && (
                        <div className="bet-result won">
                          🎉 Won {bet.payout} ETH!
                        </div>
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
                <div className="bet-info-box">
                  <p className="bet-limits">Min: 0.001 ETH | Max: 10 ETH</p>
                </div>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max="10"
                  placeholder="Bet amount (ETH)"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="bet-input"
                />
                <div className="quick-amounts">
                  <button onClick={() => setBetAmount('0.001')} className="quick-btn">0.001 ETH</button>
                  <button onClick={() => setBetAmount('0.01')} className="quick-btn">0.01 ETH</button>
                  <button onClick={() => setBetAmount('0.1')} className="quick-btn">0.1 ETH</button>
                  <button onClick={() => setBetAmount('1')} className="quick-btn">1 ETH</button>
                </div>
                <div className="modal-actions">
                  <button onClick={() => {
                    setSelectedEvent(null);
                    setBetAmount('');
                    setSelectedHen(null);
                  }} className="btn-cancel">Cancel</button>
                  <button 
                    onClick={placeBet} 
                    disabled={loading || !betAmount || parseFloat(betAmount) < 0.001}
                    className="btn-confirm"
                  >
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