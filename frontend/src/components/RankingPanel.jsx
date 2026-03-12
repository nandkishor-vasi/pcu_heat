export default function RankingPanel({ rankings }) {
  if (!rankings) return <div className="loading-rank">Loading rankings...</div>;

  const { cell, rankings: list } = rankings;
  const maxRoi = Math.max(...list.map((r) => r.cooling_roi));

  return (
    <div className="ranking-panel">
      <p className="panel-desc">
        Best cooling interventions for this zone, ranked by <strong>Cooling ROI</strong> (°C drop per ₹1 lakh spent).
        This is your precision spending guide.
      </p>

      <div className="rank-list">
        {list.map((item) => (
          <div key={item.intervention} className={`rank-row ${item.rank === 1 ? "top" : ""}`}>
            <div className="rank-num">{item.rank === 1 ? "#1" : `#${item.rank}`}</div>
            <div className="rank-icon">{item.icon}</div>
            <div className="rank-info">
              <div className="rank-name">{item.name}</div>
              <div className="rank-roi-bar-track">
                <div
                  className="rank-roi-bar-fill"
                  style={{ width: `${(item.cooling_roi / maxRoi) * 100}%` }}
                />
              </div>
            </div>
            <div className="rank-stats">
              <span className="rank-drop">−{item.temp_drop}°C</span>
              <span className="rank-roi">{item.cooling_roi} ROI</span>
              <span className="rank-cost">₹{(item.cost_inr / 100000).toFixed(1)}L</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rank-footnote">
        ROI = °C temperature drop per ₹1 lakh invested · Based on {cell.zone} zone characteristics
      </div>
    </div>
  );
}
