import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './Marketplace.css';

function Marketplace({ contracts, account, loadMyHens }) {
const [listings, setListings] = useState([]);
const [myHens, setMyHens] = useState([]);
const [loading, setLoading] = useState(false);
const [listTokenId, setListTokenId] = useState('');
const [listPrice, setListPrice] = useState('');

useEffect(() => {
if (contracts.henNFT && account) {
loadAll();
}
}, [contracts, account]);

const loadAll = async () => {
setLoading(true);
try {
await Promise.all([loadListings(), loadMine()]);
} catch (e) {
console.error('Marketplace load error:', e);
}
setLoading(false);
};

const loadMine = async () => {
try {
const ids = await contracts.henNFT.getHensByOwner(account);
const arr = ids.map((id) => id.toString());
setMyHens(arr);
} catch (e) {
console.error('Failed to load my hens:', e);
}
};

const MAX_SCAN = 250; // dev-friendly upper bound
const loadListings = async () => {
const results = [];
try {
for (let tokenId = 1; tokenId <= MAX_SCAN; tokenId++) {
try {
const l = await contracts.henNFT.listings(tokenId);
if (l.isActive) {
results.push({
tokenId,
price: l.price,
priceEth: ethers.formatEther(l.price),
seller: l.seller,
isMine: l.seller?.toLowerCase() === account.toLowerCase(),
});
}
} catch (_) {
// token may not exist yet
}
}
} catch (e) {
console.error('Error loading listings:', e);
}
setListings(results);
};

const handleList = async () => {
if (!listTokenId || !listPrice) {
alert('Select a tokenId and enter a price');
return;
}
setLoading(true);
try {
const wei = ethers.parseEther(listPrice);
const tx = await contracts.henNFT.listHen(Number(listTokenId), wei);
await tx.wait();
alert('✅ Listed successfully');
setListPrice('');
setListTokenId('');
await loadAll();
if (loadMyHens) loadMyHens();
} catch (e) {
console.error('List failed:', e);
alert('List failed: ' + (e.data?.message || e.message));
}
setLoading(false);
};

const handleBuy = async (item) => {
setLoading(true);
try {
const tx = await contracts.henNFT.buyHen(item.tokenId, { value: item.price });
await tx.wait();
alert('🎉 Purchase complete!');
await loadAll();
if (loadMyHens) loadMyHens();
} catch (e) {
console.error('Buy failed:', e);
alert('Buy failed: ' + (e.data?.message || e.message));
}
setLoading(false);
};

const handleDelist = async (tokenId) => {
setLoading(true);
try {
const tx = await contracts.henNFT.delistHen(tokenId);
await tx.wait();
alert('🗑️ Delisted');
await loadAll();
} catch (e) {
console.error('Delist failed:', e);
alert('Delist failed: ' + (e.data?.message || e.message));
}
setLoading(false);
};

return (
<div className="marketplace-container container">
<div className="marketplace-header hero-modern panel">
<h2 className="h2">🏪 Marketplace</h2>
<p className="subtitle">Buy and sell your hens</p>
</div>
  <div className="panel stack-md">
    <h3 className="h3">List a Hen</h3>
    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
      <select
        value={listTokenId}
        onChange={(e) => setListTokenId(e.target.value)}
        className="btn"
      >
        <option value="">Select your Hen</option>
        {myHens.map((id) => (
          <option key={id} value={id}>
            Hen #{id}
          </option>
        ))}
      </select>
        <input
          className="btn"
          placeholder="Price (ETH)"
          type="number"
          step="0.001"
          min="0.0001"
          value={listPrice}
          onChange={(e) => setListPrice(e.target.value)}
        />
      <button
        className="btn btn-primary"
        disabled={loading || !listTokenId || !listPrice}
        onClick={handleList}
      >
        {loading ? 'Listing...' : 'List Hen'}
      </button>
    </div>
  </div>

  {loading ? (
    <div className="loading panel">Loading marketplace listings...</div>
  ) : listings.length === 0 ? (
    <div className="empty-state panel">
      <p className="subtitle">No hens are currently listed for sale</p>
      <p className="muted">List one of yours above or check back later!</p>
    </div>
  ) : (
    <div className="grid-responsive">
      {listings.map((item) => (
        <div key={item.tokenId} className="card">
          <div className="card-header">
            <div className="card-title">Hen #{item.tokenId}</div>
            {item.isMine ? <span className="badge">Your listing</span> : null}
          </div>
          <div className="card-subtitle">
            Seller: {item.seller.slice(0, 6)}...{item.seller.slice(-4)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="h3">💰 {item.priceEth} ETH</div>
            {item.isMine ? (
              <button
                className="btn btn-danger"
                disabled={loading}
                onClick={() => handleDelist(item.tokenId)}
              >
                Delist
              </button>
            ) : (
              <button
                className="btn btn-primary"
                disabled={loading}
                onClick={() => handleBuy(item)}
              >
                Buy
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )}
</div>
);
}
export default Marketplace;