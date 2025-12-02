import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './BattleArena.css';

function BattleArena({ contracts, account }) {
  const [myHens, setMyHens] = useState([]);
  const [allHens, setAllHens] = useState([]);
  const [selectedHen, setSelectedHen] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [battleHistory, setBattleHistory] = useState([]);
  const [activeBattle, setActiveBattle] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [view, setView] = useState('select'); // select, battle, history
  const [isFighting, setIsFighting] = useState(false);

  useEffect(() => {
    if (contracts.henNFT && account) {
      loadHens();
      loadBattleHistory();
    }
  }, [contracts, account]);

  const loadHens = async () => {
    setLoading(true);
    try {
      const henIds = await contracts.henNFT.getHensByOwner(account);
      const owned = [];

      for (let i = 0; i < henIds.length; i++) {
        const henId = henIds[i];
        const traits = await contracts.henNFT.getHenTraits(henId);
        const power = await contracts.henNFT.getHenPower(henId);
        const stats = await contracts.henBattle.getHenBattleStats(henId);

        owned.push({
          id: henId.toString(),
          traits: {
            strength: Number(traits.strength),
            speed: Number(traits.speed),
            stamina: Number(traits.stamina),
            intelligence: Number(traits.intelligence),
            luck: Number(traits.luck),
            generation: Number(traits.generation),
          },
          power: Number(power),
          wins: Number(stats.wins),
          losses: Number(stats.losses),
          winRate: Number(stats.winRate),
          cooldownRemaining: Number(stats.cooldownRemaining),
        });
      }

      setMyHens(owned);

      // For development: use your own other hens as opponents
      // In production, this would load hens from different players
      const opponents = owned.filter(hen => hen.id !== (selectedHen?.id || ''));
      
      setAllHens(opponents);
    } catch (error) {
      console.error('Error loading hens:', error);
    }
    setLoading(false);
  };

  const loadBattleHistory = async () => {
    try {
      const battles = await contracts.henBattle.getPlayerBattles(account);
      const history = [];

      for (let i = battles.length - 1; i >= Math.max(0, battles.length - 10); i--) {
        const battleId = battles[i];
        const battle = await contracts.henBattle.getBattle(battleId);
        
        if (battle.isComplete) {
          history.push({
            id: battleId.toString(),
            hen1Id: battle.hen1Id.toString(),
            hen2Id: battle.hen2Id.toString(),
            winnerId: battle.winnerId.toString(),
            player1: battle.player1,
            player2: battle.player2,
            endTime: Number(battle.endTime),
            reward: ethers.formatEther(battle.rewardAmount),
          });
        }
      }

      setBattleHistory(history);
    } catch (error) {
      console.error('Error loading battle history:', error);
    }
  };

  const startBattle = async () => {
    if (!selectedHen || !opponent) {
      alert('Please select your hen and an opponent!');
      return;
    }

    if (selectedHen.cooldownRemaining > 0) {
      alert(`Your hen is on cooldown for ${formatTime(selectedHen.cooldownRemaining)}`);
      return;
    }

    if (opponent.cooldownRemaining > 0) {
      alert(`Opponent is on cooldown for ${formatTime(opponent.cooldownRemaining)}`);
      return;
    }

    setLoading(true);
    setBattleLog([`⚔️ Battle initiated between Hen #${selectedHen.id} and Hen #${opponent.id}!`]);
    setView('battle');
    setIsFighting(true);

    try {
      // Check if contract exists
      if (!contracts.henBattle) {
        throw new Error('Battle contract not initialized');
      }

      setBattleLog(prev => [...prev, '📝 Preparing battle transaction...']);
      
      const tx = await contracts.henBattle.createBattle(
        selectedHen.id,
        opponent.id
      );
      
      setBattleLog(prev => [...prev, '📝 Transaction submitted...']);
      setBattleLog(prev => [...prev, `🔗 TX Hash: ${tx.hash.slice(0, 10)}...`]);
      setBattleLog(prev => [...prev, '⏳ Waiting for confirmation...']);
      
      const receipt = await tx.wait();
      
      setBattleLog(prev => [...prev, `✅ Battle executed in block #${receipt.blockNumber}!`]);
      setBattleLog(prev => [...prev, '🎲 Processing battle results...']);

      // Parse battle events
      let battleCompleteEvent = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contracts.henBattle.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          if (parsed && parsed.name === 'BattleComplete') {
            battleCompleteEvent = parsed;
            break;
          }
        } catch (e) {
          // Skip logs that can't be parsed
          continue;
        }
      }

      if (battleCompleteEvent) {
        const winnerId = battleCompleteEvent.args.winnerId.toString();
        const loserId = battleCompleteEvent.args.loserId.toString();
        const rewardAmount = ethers.formatEther(battleCompleteEvent.args.rewardAmount);

        setActiveBattle({
          winnerId,
          loserId,
          winner: battleCompleteEvent.args.winner,
          rewardAmount,
        });

        setBattleLog(prev => [...prev, `🏆 Hen #${winnerId} wins the battle!`]);
        setBattleLog(prev => [...prev, `💔 Hen #${loserId} was defeated`]);
        setBattleLog(prev => [...prev, `💰 Winner receives ${rewardAmount} tokens!`]);

        if (winnerId === selectedHen.id) {
          setBattleLog(prev => [...prev, '🎉 🎊 VICTORY! Your hen won! 🎊 🎉']);
        } else {
          setBattleLog(prev => [...prev, '😢 Defeat! Train harder for the next battle!']);
        }
      } else {
        setBattleLog(prev => [...prev, '⚠️ Battle completed but results not found in logs']);
      }

      // Stop fighting animation
      setTimeout(() => {
        setIsFighting(false);
      }, 1000);

      // Reload data after battle
      setTimeout(() => {
        loadHens();
        loadBattleHistory();
      }, 2000);

    } catch (error) {
      console.error('Error starting battle:', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas';
        } else if (error.message.includes('Hen 1 on cooldown')) {
          errorMessage = 'Your hen is on cooldown';
        } else if (error.message.includes('Hen 2 on cooldown')) {
          errorMessage = 'Opponent hen is on cooldown';
        } else {
          errorMessage = error.message;
        }
      }
      
      setBattleLog(prev => [...prev, `❌ Battle failed: ${errorMessage}`]);
      alert(`Battle Error: ${errorMessage}`);
      
      // Return to selection on error
      setTimeout(() => {
        setView('select');
        setLoading(false);
      }, 3000);
      return;
    }
    setLoading(false);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const renderHenCard = (hen, isSelected, onSelect, showStats = true) => {
    const isOnCooldown = hen.cooldownRemaining > 0;

    return (
      <div 
        key={hen.id}
        className={`battle-hen-card ${isSelected ? 'selected' : ''} ${isOnCooldown ? 'cooldown' : ''}`}
        onClick={() => !isOnCooldown && onSelect && onSelect(hen)}
      >
        {isOnCooldown && (
          <div className="cooldown-badge">
            🕐 {formatTime(hen.cooldownRemaining)}
          </div>
        )}
        <div className="battle-hen-header">
          <h4>Hen #{hen.id}</h4>
          <span className="power-badge">⚡ {hen.power}</span>
        </div>
        {showStats && (
          <>
            <div className="battle-stats-grid">
              <div className="battle-stat">
                <span className="stat-icon">💪</span>
                <span>{hen.traits.strength}</span>
              </div>
              <div className="battle-stat">
                <span className="stat-icon">⚡</span>
                <span>{hen.traits.speed}</span>
              </div>
              <div className="battle-stat">
                <span className="stat-icon">❤️</span>
                <span>{hen.traits.stamina}</span>
              </div>
              <div className="battle-stat">
                <span className="stat-icon">🧠</span>
                <span>{hen.traits.intelligence}</span>
              </div>
              <div className="battle-stat">
                <span className="stat-icon">🍀</span>
                <span>{hen.traits.luck}</span>
              </div>
            </div>
            <div className="battle-record">
              <span className="win-badge">{hen.wins}W</span>
              <span className="loss-badge">{hen.losses}L</span>
              <span className="winrate-badge">{hen.winRate}%</span>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="battle-arena-container">
      <div className="battle-header">
        <h2>⚔️ Battle Arena</h2>
        <p>Challenge other players' hens in epic combat</p>
      </div>

      <div className="battle-nav">
        <button 
          className={view === 'select' ? 'active' : ''} 
          onClick={() => setView('select')}
        >
          ⚔️ New Battle
        </button>
        <button 
          className={view === 'history' ? 'active' : ''} 
          onClick={() => setView('history')}
        >
          📜 Battle History
        </button>
      </div>

      {view === 'select' && (
        <>
          <div className="battle-selection">
            <div className="your-hen-section">
              <h3>👤 Your Hen</h3>
              {selectedHen ? (
                <div className="selected-fighter">
                  {renderHenCard(selectedHen, true, null)}
                  <button onClick={() => setSelectedHen(null)} className="change-btn">
                    Change Hen
                  </button>
                </div>
              ) : (
                <div className="empty-selection">
                  <p>Select your hen to battle</p>
                </div>
              )}
            </div>

            <div className="vs-symbol">VS</div>

            <div className="opponent-section">
              <h3>🎯 Opponent</h3>
              {opponent ? (
                <div className="selected-fighter">
                  {renderHenCard(opponent, true, null)}
                  <button onClick={() => setOpponent(null)} className="change-btn">
                    Change Opponent
                  </button>
                </div>
              ) : (
                <div className="empty-selection">
                  <p>Select an opponent</p>
                </div>
              )}
            </div>
          </div>

          {selectedHen && opponent && (
            <div className="battle-actions">
              <button 
                onClick={startBattle} 
                disabled={loading}
                className="start-battle-btn"
              >
                {loading ? '⚔️ Battle in Progress...' : '⚔️ Start Battle!'}
              </button>
            </div>
          )}

          <div className="hens-selection-area">
            {!selectedHen ? (
              <div className="selection-section">
                <h3>🐔 Select Your Hen</h3>
                {loading ? (
                  <div className="loading-hens">Loading your hens...</div>
                ) : myHens.length === 0 ? (
                  <div className="no-hens">
                    <p>You don't have any hens yet!</p>
                    <p>Go to the Marketplace to mint your first hen.</p>
                  </div>
                ) : (
                  <div className="hens-grid">
                    {myHens.map(hen => renderHenCard(hen, false, setSelectedHen))}
                  </div>
                )}
              </div>
            ) : !opponent && (
              <div className="selection-section">
                <h3>🎯 Select Opponent</h3>
                {myHens.filter(hen => hen.id !== selectedHen.id).length === 0 ? (
                  <div className="no-hens">
                    <p>You need at least 2 hens to battle!</p>
                    <p>Go mint another hen to practice battles.</p>
                  </div>
                ) : (
                  <div className="hens-grid">
                    {myHens.filter(hen => hen.id !== selectedHen.id).map(hen => renderHenCard(hen, false, setOpponent))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {view === 'battle' && (
        <div className="battle-view">
          <div className={`battle-participants ${isFighting ? 'fighting' : ''}`}>
            <div className={`participant hen-left ${isFighting ? 'attacking' : ''}`}>
              <div className="hen-fighter">
                {selectedHen && renderHenCard(selectedHen, false, null, false)}
                {isFighting && (
                  <div className="attack-effects">
                    <span className="punch-left">👊</span>
                    <span className="spark">💥</span>
                  </div>
                )}
              </div>
            </div>
            <div className="battle-vs-container">
              <div className={`battle-vs ${isFighting ? 'shaking' : ''}`}>⚔️</div>
              {isFighting && <div className="battle-sparks">✨💥✨</div>}
            </div>
            <div className={`participant hen-right ${isFighting ? 'attacking' : ''}`}>
              <div className="hen-fighter">
                {opponent && renderHenCard(opponent, false, null, false)}
                {isFighting && (
                  <div className="attack-effects">
                    <span className="punch-right">👊</span>
                    <span className="spark">💥</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="battle-log-container">
            <h3>⚔️ Battle Log</h3>
            <div className="battle-log">
              {battleLog.map((log, index) => (
                <div key={index} className="log-entry">
                  {log}
                </div>
              ))}
            </div>
          </div>

          {activeBattle && (
            <div className="battle-result">
              <div className="result-header">
                <h2>
                  {activeBattle.winnerId === selectedHen.id ? '🎉 Victory!' : '😢 Defeat'}
                </h2>
                <p className="result-subtitle">
                  {activeBattle.winnerId === selectedHen.id 
                    ? `Congratulations! Hen #${selectedHen.id} emerged victorious!` 
                    : `Better luck next time! Hen #${opponent.id} won this battle.`}
                </p>
              </div>
              
              <div className="result-stats">
                <div className="result-stat">
                  <span className="stat-icon">🏆</span>
                  <span className="stat-label">Winner</span>
                  <span className="stat-value">Hen #{activeBattle.winnerId}</span>
                </div>
                <div className="result-stat">
                  <span className="stat-icon">🎯</span>
                  <span className="stat-label">Battle Complete</span>
                  <span className="stat-value">Success!</span>
                </div>
              </div>

              <div className="result-actions">
                <button onClick={() => {
                  setView('select');
                  setSelectedHen(null);
                  setOpponent(null);
                  setActiveBattle(null);
                  setBattleLog([]);
                  setIsFighting(false);
                }} className="btn-new-battle">
                  ⚔️ New Battle
                </button>
                <button onClick={() => setView('history')} className="btn-view-history">
                  📜 View History
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'history' && (
        <div className="battle-history-section">
          <h3>📜 Recent Battles</h3>
          {battleHistory.length === 0 ? (
            <div className="empty-history">
              <p>No battle history yet. Start your first battle!</p>
            </div>
          ) : (
            <div className="history-list">
              {battleHistory.map(battle => (
                <div key={battle.id} className="history-item">
                  <div className="history-header">
                    <span className="battle-id">Battle #{battle.id}</span>
                    <span className="battle-date">{formatDate(battle.endTime)}</span>
                  </div>
                  <div className="history-content">
                    <div className="history-combatants">
                      <span className={battle.winnerId === battle.hen1Id ? 'winner' : ''}>
                        Hen #{battle.hen1Id}
                      </span>
                      <span className="vs-text">vs</span>
                      <span className={battle.winnerId === battle.hen2Id ? 'winner' : ''}>
                        Hen #{battle.hen2Id}
                      </span>
                    </div>
                    <div className="history-result">
                      <span className="winner-text">
                        🏆 Winner: Hen #{battle.winnerId}
                      </span>
                      <span className="reward-text">
                        💰 {battle.reward} tokens
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BattleArena;