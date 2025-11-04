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

      // Load potential opponents (simplified - first 20 hens)
      const opponents = [];
      for (let i = 1; i <= 20; i++) {
        try {
          const owner = await contracts.henNFT.ownerOf(i);
          if (owner.toLowerCase() !== account.toLowerCase()) {
            const traits = await contracts.henNFT.getHenTraits(i);
            const power = await contracts.henNFT.getHenPower(i);
            const stats = await contracts.henBattle.getHenBattleStats(i);

            opponents.push({
              id: i.toString(),
              owner: owner,
              traits: {
                strength: Number(traits.strength),
                speed: Number(traits.speed),
                stamina: Number(traits.stamina),
                intelligence: Number(traits.intelligence),
                luck: Number(traits.luck),
              },
              power: Number(power),
              wins: Number(stats.wins),
              losses: Number(stats.losses),
              winRate: Number(stats.winRate),
              cooldownRemaining: Number(stats.cooldownRemaining),
            });
          }
        } catch (error) {
          continue;
        }
      }

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

    try {
      const tx = await contracts.henBattle.createBattle(selectedHen.id, opponent.id);
      
      setBattleLog(prev => [...prev, '📝 Transaction submitted...']);
      setBattleLog(prev => [...prev, '⏳ Waiting for confirmation...']);
      
      const receipt = await tx.wait();
      
      setBattleLog(prev => [...prev, '✅ Battle executed on blockchain!']);
      setBattleLog(prev => [...prev, '🎲 Processing results...']);

      // Listen for battle events
      const battleCompleteEvent = receipt.logs.find(log => {
        try {
          const parsed = contracts.henBattle.interface.parseLog(log);
          return parsed.name === 'BattleComplete';
        } catch {
          return false;
        }
      });

      if (battleCompleteEvent) {
        const parsed = contracts.henBattle.interface.parseLog(battleCompleteEvent);
        const winnerId = parsed.args.winnerId.toString();
        const loserId = parsed.args.loserId.toString();

        setActiveBattle({
          winnerId,
          loserId,
          winner: parsed.args.winner,
        });

        setBattleLog(prev => [...prev, `🏆 Hen #${winnerId} wins the battle!`]);
        setBattleLog(prev => [...prev, `💔 Hen #${loserId} loses the battle`]);
        setBattleLog(prev => [...prev, `💰 Winner receives battle rewards!`]);

        if (winnerId === selectedHen.id) {
          setBattleLog(prev => [...prev, '🎉 Victory! Your hen won!']);
        } else {
          setBattleLog(prev => [...prev, '😢 Defeat! Better luck next time!']);
        }
      }

      setTimeout(() => {
        loadHens();
        loadBattleHistory();
      }, 2000);

    } catch (error) {
      console.error('Error starting battle:', error);
      setBattleLog(prev => [...prev, `❌ Battle failed: ${error.message}`]);
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
                <div className="hens-grid">
                  {myHens.map(hen => renderHenCard(hen, false, setSelectedHen))}
                </div>
              </div>
            ) : !opponent && (
              <div className="selection-section">
                <h3>🎯 Select Opponent</h3>
                <div className="hens-grid">
                  {allHens.map(hen => renderHenCard(hen, false, setOpponent))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {view === 'battle' && (
        <div className="battle-view">
          <div className="battle-participants">
            <div className="participant">
              {renderHenCard(selectedHen, false, null, false)}
            </div>
            <div className="battle-vs">⚔️</div>
            <div className="participant">
              {renderHenCard(opponent, false, null, false)}
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
              <h2>
                {activeBattle.winnerId === selectedHen.id ? '🎉 Victory!' : '😢 Defeat'}
              </h2>
              <button onClick={() => {
                setView('select');
                setSelectedHen(null);
                setOpponent(null);
                setActiveBattle(null);
                setBattleLog([]);
              }} className="new-battle-btn">
                ⚔️ New Battle
              </button>
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