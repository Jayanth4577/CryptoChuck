import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './RaceTrack.css';

function RaceTrack({ contracts, account }) {
  const [myHens, setMyHens] = useState([]);
  const [pendingRaces, setPendingRaces] = useState([]);
  const [activeRaces, setActiveRaces] = useState([]);
  const [completedRaces, setCompletedRaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedHen, setSelectedHen] = useState(null);
  const [view, setView] = useState('pending'); // pending, active, my-hens, results
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createEntryFee, setCreateEntryFee] = useState('0.01');
  const [createMaxParticipants, setCreateMaxParticipants] = useState(10);

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
      const pending = [];
      const active = [];
      const completed = [];

      // Get total number of races created
      const raceCounter = await contracts.henRacing.raceCounter();
      const totalRaces = Number(raceCounter);

      // Load all races up to raceCounter
      for (let i = 1; i <= totalRaces; i++) {
        try {
          // Get race data from contract
          const raceData = await contracts.henRacing.races(i);
          const participants = await contracts.henRacing.getRaceParticipants(i);
          
          const race = {
            id: i,
            startTime: Number(raceData.startTime),
            entryFee: ethers.formatEther(raceData.entryFee),
            maxParticipants: Number(raceData.maxParticipants),
            prizePool: ethers.formatEther(raceData.prizePool),
            participants: participants.map(p => p.toString()),
            isActive: raceData.isActive,
            isComplete: raceData.isComplete,
          };

          // Check if race is complete
          if (race.isComplete) {
            const results = await contracts.henRacing.getRaceResults(i);
            race.results = results.map(r => ({
              henId: r.henId.toString(),
              position: Number(r.position),
              prize: ethers.formatEther(r.prize),
            }));
            completed.push(race);
          } else if (race.isActive && race.startTime > 0) {
            // Race has started (startTime set)
            active.push(race);
          } else if (race.isActive) {
            // Race not started yet (startTime = 0)
            pending.push(race);
          }
        } catch (error) {
          console.error(`Error loading race ${i}:`, error);
          continue;
        }
      }

      setPendingRaces(pending);
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
      // Get the race entry fee
      const raceData = await contracts.henRacing.races(raceId);
      const entryFee = raceData.entryFee;
      
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

  const startRace = async (raceId) => {
    setLoading(true);
    try {
      const tx = await contracts.henRacing.startRace(raceId);
      await tx.wait();
      alert('🏁 Race started! It will complete in 30 seconds.');
      loadRaces();
      
      // Auto-complete after 30 seconds
      setTimeout(() => {
        completeRace(raceId);
      }, 31000); // 31s to ensure blockchain timestamp passed
    } catch (error) {
      console.error('Error starting race:', error);
      alert('Failed to start race: ' + error.message);
    }
    setLoading(false);
  };

  const completeRace = async (raceId) => {
    try {
      const tx = await contracts.henRacing.completeRace(raceId);
      await tx.wait();
      alert('🏆 Race completed! Check results tab.');
      loadRaces();
    } catch (error) {
      console.error('Error completing race:', error);
      // Silently fail if already completed
    }
  };

  const createRace = async () => {
    setLoading(true);
    try {
      const entryFee = ethers.parseEther(createEntryFee);
      const tx = await contracts.henRacing.createRace(entryFee, createMaxParticipants);
      await tx.wait();
      alert('🏁 Race created successfully!');
      setShowCreateModal(false);
      loadRaces();
    } catch (error) {
      console.error('Error creating race:', error);
      alert('Failed to create race: ' + error.message);
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

  const renderPendingRaceCard = (race) => {
    const spotsLeft = race.maxParticipants - race.participants.length;
    const isFull = spotsLeft === 0;
    const hasMinParticipants = race.participants.length >= 5;
    const canStart = hasMinParticipants;

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
            <span className="info-value">{race.participants.length}/{race.maxParticipants}</span>
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
        <div className="race-actions">
          {!isFull && (
            <button 
              onClick={() => setSelectedRace(race)} 
              className="enter-race-btn"
              disabled={loading}
            >
              Enter Race
            </button>
          )}
          {canStart && (
            <button 
              onClick={() => startRace(race.id)} 
              className="start-race-btn"
              disabled={loading}
            >
              {loading ? 'Starting...' : 'Start Race'}
            </button>
          )}
        </div>
        {!hasMinParticipants && (
          <div className="race-warning">
            ⚠️ Minimum 5 participants required to start
          </div>
        )}
      </div>
    );
  };

  const renderActiveRaceCard = (race) => {
    const now = Date.now() / 1000;
    const timeElapsed = Math.floor(now - race.startTime);
    const timeRemaining = Math.max(0, 30 - timeElapsed);
    const canComplete = timeElapsed >= 30;

    return (
      <div key={race.id} className="race-card active">
        <div className="race-card-header">
          <h3>🏁 Race #{race.id}</h3>
          <span className="race-status racing">
            🏃 Racing
          </span>
        </div>
        <div className="race-info">
          <div className="race-info-item">
            <span className="info-label">Prize Pool:</span>
            <span className="info-value">{race.prizePool} ETH</span>
          </div>
          <div className="race-info-item">
            <span className="info-label">Participants:</span>
            <span className="info-value">{race.participants.length}</span>
          </div>
          <div className="race-info-item">
            <span className="info-label">Time Remaining:</span>
            <span className="info-value countdown">{timeRemaining}s</span>
          </div>
        </div>
        <div className="racing-indicator">
          <div className="speed-lines"></div>
          <p>🏁 Race in progress...</p>
        </div>
        {canComplete && (
          <button 
            onClick={() => completeRace(race.id)} 
            className="complete-race-btn"
            disabled={loading}
          >
            {loading ? 'Completing...' : 'Complete Race'}
          </button>
        )}
      </div>
    );
  };

  const renderCompletedRace = (race) => {
    // Only show top 3 results
    const topResults = race.results ? race.results.filter(r => r.position <= 3).slice(0, 3) : [];
    
    return (
      <div key={race.id} className="completed-race-card">
        <div className="race-header">
          <h3>🏁 Race #{race.id}</h3>
          <span className="completed-badge">✅ Completed</span>
        </div>
        <div className="race-results">
          <h4>🏆 Top 3 Winners</h4>
          <div className="results-list">
            {topResults.map((result, index) => (
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
          onClick={() => setShowCreateModal(true)} 
          className="create-race-btn-nav"
          disabled={pendingRaces.length >= 2}
        >
          ➕ Create Race
        </button>
        <button 
          className={view === 'pending' ? 'active' : ''} 
          onClick={() => setView('pending')}
        >
          ⏳ Pending Races ({pendingRaces.length})
        </button>
        <button 
          className={view === 'active' ? 'active' : ''} 
          onClick={() => setView('active')}
        >
          🏃 Racing ({activeRaces.length})
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

      {view === 'pending' && (
        <div className="races-section">
          {loading ? (
            <div className="loading">Loading races...</div>
          ) : pendingRaces.length === 0 ? (
            <div className="empty-state">
              <p>No pending races available!</p>
              <p>All races have started or completed</p>
            </div>
          ) : (
            <div className="races-grid">
              {pendingRaces.map(renderPendingRaceCard)}
            </div>
          )}
        </div>
      )}

      {view === 'active' && (
        <div className="races-section">
          {loading ? (
            <div className="loading">Loading races...</div>
          ) : activeRaces.length === 0 ? (
            <div className="empty-state">
              <p>No active races right now!</p>
              <p>Check pending races to start one</p>
            </div>
          ) : (
            <div className="races-grid">
              {activeRaces.map(renderActiveRaceCard)}
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

      {/* Create Race Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏁 Create Custom Race</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="create-race-form">
                <div className="form-group">
                  <label>Entry Fee (ETH)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    min="0.001"
                    max="1"
                    value={createEntryFee}
                    onChange={(e) => setCreateEntryFee(e.target.value)}
                    placeholder="0.01"
                  />
                  <span className="form-hint">Min: 0.001 ETH, Max: 1 ETH</span>
                </div>
                <div className="form-group">
                  <label>Max Participants</label>
                  <input 
                    type="number" 
                    min="5"
                    max="20"
                    value={createMaxParticipants}
                    onChange={(e) => setCreateMaxParticipants(parseInt(e.target.value))}
                  />
                  <span className="form-hint">Min: 5, Max: 20</span>
                </div>
                <div className="prize-preview">
                  <h4>Prize Pool Preview (if full):</h4>
                  <div className="preview-prizes">
                    <span>🥇 1st: {(parseFloat(createEntryFee) * createMaxParticipants * 0.5).toFixed(4)} ETH</span>
                    <span>🥈 2nd: {(parseFloat(createEntryFee) * createMaxParticipants * 0.3).toFixed(4)} ETH</span>
                    <span>🥉 3rd: {(parseFloat(createEntryFee) * createMaxParticipants * 0.2).toFixed(4)} ETH</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={createRace} className="btn-confirm" disabled={loading}>
                {loading ? 'Creating...' : 'Create Race'}
              </button>
            </div>
          </div>
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