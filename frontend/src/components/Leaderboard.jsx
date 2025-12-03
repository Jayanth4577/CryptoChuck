import { useState, useEffect } from 'react';
import './Leaderboard.css';

const Leaderboard = ({ contracts, account }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('power'); // 'power', 'wins', 'races'
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    if (contracts.henNFT) {
      loadLeaderboard();
    }
  }, [contracts, sortBy]);

  const loadLeaderboard = async () => {
    if (!contracts.henNFT) {
      console.error('HenNFT contract not loaded');
      return;
    }
    
    setLoading(true);
    try {
      // Get total supply
      const totalSupply = await contracts.henNFT.totalSupply();
      const allHens = [];

      // Load all hens (limit to 50 for performance)
      const maxLoad = Math.min(Number(totalSupply), 50);
      
      for (let i = 1; i <= maxLoad; i++) {
        try {
          const traits = await contracts.henNFT.getHenTraits(i);
          const owner = await contracts.henNFT.ownerOf(i);
          
          const henData = {
            id: i,
            owner: owner,
            strength: Number(traits.strength),
            speed: Number(traits.speed),
            stamina: Number(traits.stamina),
            intelligence: Number(traits.intelligence),
            luck: Number(traits.luck),
            generation: Number(traits.generation),
            wins: Number(traits.wins),
            losses: Number(traits.losses),
            racesWon: Number(traits.racesWon),
            xp: Number(traits.xp || 0),
            trainingLevel: Number(traits.trainingLevel)
          };

          henData.totalPower = henData.strength + henData.speed + henData.stamina + 
                               henData.intelligence + henData.luck;
          henData.winRate = henData.wins + henData.losses > 0 
            ? (henData.wins / (henData.wins + henData.losses) * 100).toFixed(1) 
            : 0;

          allHens.push(henData);
        } catch (err) {
          // Hen might not exist or be burned
          console.debug(`Skipping hen ${i}`);
        }
      }

      if (allHens.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Sort based on selected criteria
      let sorted = [...allHens];
      switch (sortBy) {
        case 'power':
          sorted.sort((a, b) => b.totalPower - a.totalPower);
          break;
        case 'wins':
          sorted.sort((a, b) => b.wins - a.wins);
          break;
        case 'races':
          sorted.sort((a, b) => b.racesWon - a.racesWon);
          break;
        case 'winRate':
          sorted.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
          break;
        default:
          sorted.sort((a, b) => b.totalPower - a.totalPower);
      }

      setLeaderboard(sorted.slice(0, limit));
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
    setLoading(false);
  };

  const calculateLevel = (xp) => {
    if (!xp || xp === 0) return 1;
    const level = Math.floor(Math.sqrt(xp / 100));
    return level === 0 ? 1 : level;
  };

  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return '';
  };

  if (!contracts.henNFT) {
    return (
      <div className="leaderboard-container">
        <div className="empty-state">
          <h3>🏆 Leaderboard</h3>
          <p>Connect your wallet to view the leaderboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2>🏆 Top CryptoChucks</h2>
        <div className="leaderboard-controls">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="power">Total Power</option>
            <option value="wins">Battle Wins</option>
            <option value="races">Race Wins</option>
            <option value="winRate">Win Rate</option>
          </select>
          
          <button 
            onClick={loadLeaderboard} 
            disabled={loading}
            className="btn btn-sm btn-primary"
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {loading && leaderboard.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading top hens...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="empty-state">
          <p>No hens found yet</p>
          <p className="hint">Be the first to mint and compete!</p>
        </div>
      ) : (
        <div className="leaderboard-table">
          <div className="table-header">
            <div className="col-rank">Rank</div>
            <div className="col-hen">Hen</div>
            <div className="col-level">Level</div>
            <div className="col-owner">Owner</div>
            <div className="col-power">Power</div>
            <div className="col-stats">Battle Record</div>
            <div className="col-races">Races Won</div>
          </div>

          {leaderboard.map((hen, index) => {
            const level = calculateLevel(hen.xp);
            return (
            <div 
              key={hen.id} 
              className={`leaderboard-row ${getRankClass(index + 1)} ${hen.owner.toLowerCase() === account?.toLowerCase() ? 'my-hen' : ''}`}
            >
              <div className="col-rank">
                <span className="rank-badge">{getRankBadge(index + 1)}</span>
              </div>
              
              <div className="col-hen">
                <div className="hen-info">
                  <span className="hen-icon">🐔</span>
                  <div>
                    <div className="hen-id">CryptoChuck #{hen.id}</div>
                    <div className="hen-gen">Gen {hen.generation}</div>
                  </div>
                </div>
              </div>

              <div className="col-level">
                <div className="level-display">
                  <span className="level-badge">⭐ {level}</span>
                  <span className="xp-mini">{hen.xp} XP</span>
                </div>
              </div>

              <div className="col-owner">
                <span className="owner-address" title={hen.owner}>
                  {formatAddress(hen.owner)}
                  {hen.owner.toLowerCase() === account?.toLowerCase() && (
                    <span className="you-badge">You</span>
                  )}
                </span>
              </div>

              <div className="col-power">
                <div className="power-badge">{hen.totalPower}</div>
                {hen.trainingLevel > 0 && (
                  <span className="training-mini">💪{hen.trainingLevel}</span>
                )}
              </div>

              <div className="col-stats">
                <div className="battle-stats">
                  <span className="wins">{hen.wins}W</span>
                  <span className="separator">-</span>
                  <span className="losses">{hen.losses}L</span>
                  {hen.wins + hen.losses > 0 && (
                    <span className="win-rate">({hen.winRate}%)</span>
                  )}
                </div>
              </div>

              <div className="col-races">
                <span className="race-wins">🏁 {hen.racesWon}</span>
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
