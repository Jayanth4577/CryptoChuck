import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './RaceTrack.css';

function RaceTrack({ contracts, account }) {
  const [myHens, setMyHens] = useState([]);
  const [activeRaces, setActiveRaces] = useState([]);
  const [completedRaces, setCompletedRaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedHen, setSelectedHen] = useState(null);
  const [view, setView] = useState('races'); // races, my-hens, results

  useEffect(() => {
    if (contracts.henNFT && account) {
      loadHens();
      loadRaces();
    }
  }, [contracts, account]);

  const loadHens = async () => {
    try {
      const henIds = await contracts.henNFT.getHensByOwner(account);
      const hensData = [];

      for (let i = 0; i < henIds.length; i++) {
        const henId = henIds[i];
        const traits = await contracts.henNFT.getHenTraits(henId);
        const power = await contracts.henNFT.getHenPower(henId);
        const raceStats = await contracts.henRacing.getHenRaceStats(henId);

        hensData.push({
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
          totalRaces: Number(raceStats.totalRaces),
          wins: Number(raceStats.wins),
          totalPrizes: ethers.formatEther(raceStats.totalPrizes),
        });
      }

      setMyHens(hensData);
    } catch (error) {
      console.error('Error loading hens:', error);
    }
  };

  const loadRaces = async () => {
    setLoading(true);
    try {
      // Load first 10 races (simplified)
      const active = [];
      const completed = [];

      for (let i = 1; i <= 10; i++) {
        try {
          const participants = await contracts.henRacing.getRaceParticipants(i);
          
          if (participants.length > 0) {
            const race = {
              id: i,
              participants: participants.map(p => p.toString()),
              maxParticipants: 20, // From contract
              entryFee: '0.005', // From contract
              prizePool: (participants.length * 0.005).toString(),
            };

            // Check if race is complete (simplified check)
            const results = await contracts.henRacing.getRaceResults(i);
            if (results.length > 0) {
              race.results = results.map(r => ({
                henId: r.henId.toString(),
                position: Number(r.position),
                prize: ethers.formatEther(r.prize),
              }));
              completed.push(race);
            } else {
              active.push(race);
            }
          }
        } catch (error) {
          continue;
        }
      }

      setActiveRaces(active);
      setCompletedRaces(completed);
    } catch (error) {
      console.error('Error loading races:', error);
    }
    setLoading(false);
  };

  const enterRace = async (raceId, henId) => {
    setLoading(true);
    try {
      const entryFee = ethers.parseEther('0.005');
      const tx = await contracts.henRacing.enterRace(raceId, henId, {
        value: entryFee,
      });
      
      await tx.wait();
      alert('🏁 Successfully entered race!');
      loadRaces();
      loadHens();
      setSelectedHen(null);
    } catch (error) {
      console.error('Error entering race:', error);
      alert('Failed to enter race: ' + error.message);
    }
    setLoading(false);
  };

  const renderHenCard = (hen, onSelect) => {
    const winRate = hen.totalRaces > 0 
      ? ((hen.wins / hen.totalRaces) * 100).toFixed(0) 
      : 0;

    return (
      <div 
        key={hen.id}
        className="race-hen-card"
        onClick={() => onSelect && onSelect(hen)}
      >
        <div className="race-hen-header">
          <h4>Hen #{hen.id}</h4>
          <span className="speed-badge">⚡ {hen.traits.speed}</span>
        </div>
        <div className="race-stats-compact">
          <div className="race-stat">
            <span>💪</span>
            <span>{hen.traits.strength}</span>
          </div>
          <div className="race-stat">
            <span>❤️</span>
            <span>{hen.traits.stamina}</span>
          </div>
          <div className="race-stat">
            <span>🍀</span>
            <span>{hen.traits.luck}</span>
          </div>
        </div>
        <div className="race-record">
          <span className="races-count">🏁 {hen.totalRaces} races</span>
          <span className="wins-count">🏆 {hen.wins} wins</span>
          <span className="win-rate">{winRate}% win rate</span>
        </div>
        <div className="total-prizes">
          💰 {parseFloat(hen.totalPrizes).toFixed(4)} ETH earned
        </div>
      </div>
    );
  };

  const renderRaceCard = (race) => {
    const spotsLeft = 20 - race.participants.length;
    const isFull = spotsLeft === 0;

    return (
      <div key={race.id} className={`race-card ${isFull ? 'full' : ''}`}>
        <div className="race-card-header">
          <h3>🏁 Race #{race.id}</h3>
          <span className="race-status">
            {isFull ? '🔴 Full' : '🟢 Open'}
          </span>
        </div>
        <div className="race-info">
          <div className="race-info-item">
            <span className="info-label">Entry Fee:</span>
            <span className="info-value">{race.entryFee} ETH</span>
          </div>
          <div className="race-info-item">
            <span className="info-label">Prize Pool:</span>
            <span className="info-value">{race.prizePool} ETH</span>
          </div>
          <div className="race-info-item">
            <span className="info-label">Participants:</span>
            <span className="info-value">{race.participants.length}/20</span>
          </div>
          <div className="race-info-item">
            <span className="info-label">Spots Left:</span>
            <span className="info-value">{spotsLeft}</span>
          </div>
        </div>
        <div className="prize-distribution">
          <h4>🏆 Prize Distribution</h4>
          <div className="prizes">
            <div className="prize-item">
              <span>🥇 1st:</span>
              <span>{(parseFloat(race.prizePool) * 0.5).toFixed(4)} ETH</span>
            </div>
            <div className="prize-item">
              <span>🥈 2nd:</span>
              <span>{(parseFloat(race.prizePool) * 0.3).toFixed(4)} ETH</span>
            </div>
            <div className="prize-item">
              <span>🥉 3rd:</span>
              <span>{(parseFloat(race.prizePool) * 0.2).toFixed(4)} ETH</span>
            </div>
          </div>
        </div>
        {!isFull && (
          <button 
            onClick={() => setSelectedRace(race)} 
            className="enter-race-btn"
            disabled={loading}
          >
            Enter Race
          </button>
        )}
      </div>
    );
  };

  const renderCompletedRace = (race) => {
    return (
      <div key={race.id} className="completed-race-card">
        <div className="race-header">
          <h3>🏁 Race #{race.id}</h3>
          <span className="completed-badge">✅ Completed</span>
        </div>
        <div className="race-results">
          <h4>🏆 Results</h4>
          <div className="results-list">
            {race.results && race.results.slice(0, 3).map((result, index) => (
              <div key={index} className={`result-item position-${result.position}`}>
                <span className="position">
                  {result.position === 1 ? '🥇' : result.position === 2 ? '🥈' : '🥉'}
                </span>
                <span className="hen-id">Hen #{result.henId}</span>
                <span className="prize">💰 {result.prize} ETH</span>
              </div>
            ))}
          </div>
        </div>
        <div className="race-stats">
          <span>Total Participants: {race.participants.length}</span>
          <span>Prize Pool: {race.prizePool} ETH</span>
        </div>
      </div>
    );
  };

  return (
    <div className="race-track-container">
      <div className="race-header">
        <h2>🏁 Race Track</h2>
        <p>Enter races and compete for prizes!</p>
      </div>

      <div className="race-nav">
        <button 
          className={view === 'races' ? 'active' : ''} 
          onClick={() => setView('races')}
        >
          🏁 Active Races ({activeRaces.length})
        </button>
        <button 
          className={view === 'my-hens' ? 'active' : ''} 
          onClick={() => setView('my-hens')}
        >
          🐔 My Hens ({myHens.length})
        </button>
        <button 
          className={view === 'results' ? 'active' : ''} 
          onClick={() => setView('results')}
        >
          📊 Results ({completedRaces.length})
        </button>
      </div>

      {view === 'races' && (
        <div className="races-section">
          {loading ? (
            <div className="loading">Loading races...</div>
          ) : activeRaces.length === 0 ? (
            <div className="empty-state">
              <p>No active races available!</p>
              <p>Check back soon for new races</p>
            </div>
          ) : (
            <div className="races-grid">
              {activeRaces.map(renderRaceCard)}
            </div>
          )}
        </div>
      )}

      {view === 'my-hens' && (
        <div className="my-hens-race-section">
          <h3>🐔 Your Racing Hens</h3>
          {myHens.length === 0 ? (
            <div className="empty-state">
              <p>You don't have any hens yet!</p>
              <button onClick={() => window.location.href = '/'} className="mint-btn">
                Mint Your First Hen
              </button>
            </div>
          ) : (
            <div className="hens-race-grid">
              {myHens.map(hen => renderHenCard(hen))}
            </div>
          )}
        </div>
      )}

      {view === 'results' && (
        <div className="results-section">
          {completedRaces.length === 0 ? (
            <div className="empty-state">
              <p>No completed races yet!</p>
            </div>
          ) : (
            <div className="completed-races-grid">
              {completedRaces.map(renderCompletedRace)}
            </div>
          )}
        </div>
      )}

      {/* Race Entry Modal */}
      {selectedRace && (
        <div className="modal-overlay" onClick={() => setSelectedRace(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Enter Race #{selectedRace.id}</h3>
              <button className="modal-close" onClick={() => setSelectedRace(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="race-details">
                <p>Entry Fee: <strong>{selectedRace.entryFee} ETH</strong></p>
                <p>Prize Pool: <strong>{selectedRace.prizePool} ETH</strong></p>
                <p>Spots Available: <strong>{20 - selectedRace.participants.length}</strong></p>
              </div>
              <h4>Select Your Hen</h4>
              {selectedHen ? (
                <div className="selected-hen-display">
                  {renderHenCard(selectedHen, null)}
                  <button 
                    onClick={() => setSelectedHen(null)} 
                    className="change-hen-btn"
                  >
                    Change Hen
                  </button>
                </div>
              ) : (
                <div className="hen-selection-grid">
                  {myHens.map(hen => (
                    <div 
                      key={hen.id}
                      className="selectable-hen"
                      onClick={() => setSelectedHen(hen)}
                    >
                      <span>Hen #{hen.id}</span>
                      <span>⚡ {hen.traits.speed}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => setSelectedRace(null)} 
                className="btn-cancel"
              >
                Cancel
              </button>
              <button 
                onClick={() => enterRace(selectedRace.id, selectedHen.id)} 
                className="btn-confirm"
                disabled={!selectedHen || loading}
              >
                {loading ? 'Entering...' : 'Enter Race'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="race-guide">
        <h3>📚 Racing Guide</h3>
        <div className="guide-grid">
          <div className="guide-item">
            <span className="guide-icon">⚡</span>
            <h4>Speed Matters</h4>
            <p>Speed is the primary attribute for racing success</p>
          </div>
          <div className="guide-item">
            <span className="guide-icon">❤️</span>
            <h4>Stamina Helps</h4>
            <p>Stamina provides consistency throughout the race</p>
          </div>
          <div className="guide-item">
            <span className="guide-icon">🍀</span>
            <h4>Luck Factor</h4>
            <p>Luck can give unexpected boosts during races</p>
          </div>
          <div className="guide-item">
            <span className="guide-icon">🏆</span>
            <h4>Top 3 Win</h4>
            <p>1st gets 50%, 2nd gets 30%, 3rd gets 20% of prize pool</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RaceTrack;