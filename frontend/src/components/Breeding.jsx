import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './Breeding.css';

function Breeding({ contracts, account, loadMyHens }) {
  const [myHens, setMyHens] = useState([]);
  const [parent1, setParent1] = useState(null);
  const [parent2, setParent2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [breedingInfo, setBreedingInfo] = useState(null);
  const [offspring, setOffspring] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (contracts.henNFT && account) {
      loadHensForBreeding();
    }
  }, [contracts, account]);

  useEffect(() => {
    if (parent1 && parent2) {
      checkBreedingCompatibility();
      previewOffspring();
    }
  }, [parent1, parent2]);

  const loadHensForBreeding = async () => {
    setLoading(true);
    try {
      const henIds = await contracts.henNFT.getHensByOwner(account);
      const hensData = [];

      for (let i = 0; i < henIds.length; i++) {
        const henId = henIds[i];
        const traits = await contracts.henNFT.getHenTraits(henId);
        const power = await contracts.henNFT.getHenPower(henId);
        const breedInfo = await contracts.henBreeding.getBreedingInfo(henId);

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
          breedCount: Number(breedInfo.breedingCount),
          cooldownRemaining: Number(breedInfo.cooldownRemaining),
          offspring: breedInfo.offspringIds,
        });
      }

      setMyHens(hensData);
    } catch (error) {
      console.error('Error loading hens:', error);
    }
    setLoading(false);
  };

  const checkBreedingCompatibility = async () => {
    if (!parent1 || !parent2) return;

    try {
      const result = await contracts.henBreeding.canBreed(parent1.id, parent2.id);
      setBreedingInfo({
        canBreed: result[0],
        reason: result[1],
      });
    } catch (error) {
      console.error('Error checking compatibility:', error);
      setBreedingInfo({
        canBreed: false,
        reason: error.message,
      });
    }
  };

  const previewOffspring = () => {
    if (!parent1 || !parent2) return;

    // Calculate potential offspring traits (rough estimate)
    const estimateAttribute = (attr1, attr2) => {
      const avg = Math.floor((attr1 + attr2) / 2);
      const min = Math.max(1, avg - 10);
      const max = Math.min(100, avg + 10);
      return { min, max, avg };
    };

    setOffspring({
      strength: estimateAttribute(parent1.traits.strength, parent2.traits.strength),
      speed: estimateAttribute(parent1.traits.speed, parent2.traits.speed),
      stamina: estimateAttribute(parent1.traits.stamina, parent2.traits.stamina),
      intelligence: estimateAttribute(parent1.traits.intelligence, parent2.traits.intelligence),
      luck: estimateAttribute(parent1.traits.luck, parent2.traits.luck),
      generation: Math.max(parent1.traits.generation, parent2.traits.generation) + 1,
    });
    setShowPreview(true);
  };

  const breedHens = async () => {
    if (!parent1 || !parent2 || !breedingInfo?.canBreed) {
      alert('Cannot breed these hens: ' + (breedingInfo?.reason || 'Unknown reason'));
      return;
    }

    setLoading(true);
    try {
      const breedingCost = await contracts.henBreeding.BREEDING_COST();
      const tx = await contracts.henBreeding.breedHens(parent1.id, parent2.id, {
        value: breedingCost,
      });
      
      const receipt = await tx.wait();
      
      // Find the BreedingInitiated event
      const event = receipt.logs.find(log => {
        try {
          const parsed = contracts.henBreeding.interface.parseLog(log);
          return parsed.name === 'BreedingInitiated';
        } catch {
          return false;
        }
      });

      if (event) {
        alert('🎉 Breeding successful! Your new hen is being born!');
      } else {
        alert('✅ Breeding complete!');
      }
      
      setParent1(null);
      setParent2(null);
      setShowPreview(false);
      loadHensForBreeding();
      if (loadMyHens) loadMyHens();
    } catch (error) {
      console.error('Error breeding:', error);
      alert('Failed to breed hens: ' + error.message);
    }
    setLoading(false);
  };

  const selectParent = (hen, parentNum) => {
    if (hen.cooldownRemaining > 0) {
      alert(`This hen is on cooldown for ${formatTime(hen.cooldownRemaining)}`);
      return;
    }

    if (parentNum === 1) {
      if (parent2?.id === hen.id) {
        alert('Cannot select the same hen as both parents!');
        return;
      }
      setParent1(hen);
    } else {
      if (parent1?.id === hen.id) {
        alert('Cannot select the same hen as both parents!');
        return;
      }
      setParent2(hen);
    }
  };

  const formatTime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const renderHenCard = (hen, isSelected, onSelect, parentNum) => {
    const isOnCooldown = hen.cooldownRemaining > 0;
    const cannotSelectSameHen = (parentNum === 1 && parent2?.id === hen.id) || 
                                 (parentNum === 2 && parent1?.id === hen.id);

    return (
      <div 
        key={hen.id} 
        className={`breeding-hen-card ${isSelected ? 'selected' : ''} ${isOnCooldown ? 'cooldown' : ''} ${cannotSelectSameHen ? 'disabled' : ''}`}
        onClick={() => !isOnCooldown && !cannotSelectSameHen && onSelect(hen, parentNum)}
      >
        {isOnCooldown && (
          <div className="cooldown-overlay">
            <span>🕐 Cooldown</span>
            <span>{formatTime(hen.cooldownRemaining)}</span>
          </div>
        )}
        <div className="hen-card-header">
          <h4>Hen #{hen.id}</h4>
          <span className="gen-badge">Gen {hen.traits.generation}</span>
        </div>
        <div className="stats-mini">
          <div className="stat-mini">💪 {hen.traits.strength}</div>
          <div className="stat-mini">⚡ {hen.traits.speed}</div>
          <div className="stat-mini">❤️ {hen.traits.stamina}</div>
          <div className="stat-mini">🧠 {hen.traits.intelligence}</div>
          <div className="stat-mini">🍀 {hen.traits.luck}</div>
        </div>
        <div className="hen-power">⭐ Power: {hen.power}</div>
        <div className="breed-count">🧬 Bred: {hen.breedCount} times</div>
        {isSelected && <div className="selected-badge">✓ Selected</div>}
      </div>
    );
  };

  return (
    <div className="breeding-container">
      <div className="breeding-header">
        <h2>🧬 Breeding Laboratory</h2>
        <p>Select two hens to create offspring with unique genetic traits</p>
      </div>

      <div className="breeding-cost-info">
        <div className="info-box">
          <span className="info-label">Breeding Cost:</span>
          <span className="info-value">0.01 ETH</span>
        </div>
        <div className="info-box">
          <span className="info-label">Cooldown Period:</span>
          <span className="info-value">7 Days</span>
        </div>
        <div className="info-box">
          <span className="info-label">Max Generation:</span>
          <span className="info-value">10</span>
        </div>
      </div>

      <div className="parent-selection">
        <div className="parent-section">
          <h3>👨 Parent 1</h3>
          {parent1 ? (
            <div className="selected-parent">
              {renderHenCard(parent1, true, () => setParent1(null), 1)}
              <button onClick={() => setParent1(null)} className="clear-btn">
                Clear Selection
              </button>
            </div>
          ) : (
            <div className="empty-parent">
              <p>Select first parent hen</p>
            </div>
          )}
        </div>

        <div className="breeding-symbol">
          <span className="plus-sign">+</span>
          <span className="dna-icon">🧬</span>
        </div>

        <div className="parent-section">
          <h3>👩 Parent 2</h3>
          {parent2 ? (
            <div className="selected-parent">
              {renderHenCard(parent2, true, () => setParent2(null), 2)}
              <button onClick={() => setParent2(null)} className="clear-btn">
                Clear Selection
              </button>
            </div>
          ) : (
            <div className="empty-parent">
              <p>Select second parent hen</p>
            </div>
          )}
        </div>
      </div>

      {parent1 && parent2 && showPreview && (
        <div className="offspring-preview">
          <h3>👶 Predicted Offspring</h3>
          <div className="preview-card">
            <div className="preview-header">
              <span className="gen-badge">Gen {offspring.generation}</span>
            </div>
            <div className="preview-stats">
              <div className="preview-stat">
                <span className="stat-label">💪 Strength:</span>
                <div className="stat-range">
                  <span>{offspring.strength.min} - {offspring.strength.max}</span>
                  <span className="stat-avg">(avg: {offspring.strength.avg})</span>
                </div>
              </div>
              <div className="preview-stat">
                <span className="stat-label">⚡ Speed:</span>
                <div className="stat-range">
                  <span>{offspring.speed.min} - {offspring.speed.max}</span>
                  <span className="stat-avg">(avg: {offspring.speed.avg})</span>
                </div>
              </div>
              <div className="preview-stat">
                <span className="stat-label">❤️ Stamina:</span>
                <div className="stat-range">
                  <span>{offspring.stamina.min} - {offspring.stamina.max}</span>
                  <span className="stat-avg">(avg: {offspring.stamina.avg})</span>
                </div>
              </div>
              <div className="preview-stat">
                <span className="stat-label">🧠 Intelligence:</span>
                <div className="stat-range">
                  <span>{offspring.intelligence.min} - {offspring.intelligence.max}</span>
                  <span className="stat-avg">(avg: {offspring.intelligence.avg})</span>
                </div>
              </div>
              <div className="preview-stat">
                <span className="stat-label">🍀 Luck:</span>
                <div className="stat-range">
                  <span>{offspring.luck.min} - {offspring.luck.max}</span>
                  <span className="stat-avg">(avg: {offspring.luck.avg})</span>
                </div>
              </div>
            </div>
            <div className="breeding-info-box">
              {breedingInfo?.canBreed ? (
                <div className="can-breed">
                  <span className="status-icon">✅</span>
                  <span>These hens can breed!</span>
                </div>
              ) : (
                <div className="cannot-breed">
                  <span className="status-icon">❌</span>
                  <span>{breedingInfo?.reason || 'Cannot breed'}</span>
                </div>
              )}
            </div>
            <button 
              onClick={breedHens} 
              disabled={loading || !breedingInfo?.canBreed}
              className="breed-button"
            >
              {loading ? 'Breeding...' : '🧬 Breed Hens (0.01 ETH)'}
            </button>
          </div>
        </div>
      )}

      <div className="available-hens-section">
        <h3>🐔 Your Hens ({myHens.length})</h3>
        <p className="selection-hint">
          {!parent1 ? 'Click a hen to select as Parent 1' : !parent2 ? 'Click a hen to select as Parent 2' : 'Both parents selected'}
        </p>
        <div className="hens-grid">
          {loading ? (
            <div className="loading">Loading your hens...</div>
          ) : myHens.length === 0 ? (
            <div className="empty-state">
              <p>You need at least 2 hens to breed!</p>
              <button onClick={() => window.location.href = '/'} className="mint-btn">
                Mint Hens
              </button>
            </div>
          ) : (
            myHens.map(hen => 
              renderHenCard(
                hen, 
                parent1?.id === hen.id || parent2?.id === hen.id,
                selectParent,
                !parent1 ? 1 : 2
              )
            )
          )}
        </div>
      </div>

      <div className="breeding-guide">
        <h3>📚 Breeding Guide</h3>
        <div className="guide-grid">
          <div className="guide-item">
            <span className="guide-icon">🧬</span>
            <h4>Genetics</h4>
            <p>Offspring inherit traits from both parents with random mutations (±5 points)</p>
          </div>
          <div className="guide-item">
            <span className="guide-icon">🕐</span>
            <h4>Cooldown</h4>
            <p>Hens need 7 days rest between breeding sessions</p>
          </div>
          <div className="guide-item">
            <span className="guide-icon">🚫</span>
            <h4>No Inbreeding</h4>
            <p>Hens that have already bred together cannot breed again</p>
          </div>
          <div className="guide-item">
            <span className="guide-icon">📈</span>
            <h4>Generations</h4>
            <p>Maximum 10 generations. Higher generations may have better traits!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Breeding;