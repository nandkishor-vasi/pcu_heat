export default function HotspotsList({ hotspots, onSelect, selectedCell }) {
  return (
    <div className="hotspots-list">
      <div className="panel-label">TOP HOTSPOTS</div>
      {hotspots.map((cell, i) => (
        <div
          key={cell.id}
          className={`hotspot-row ${selectedCell?.id === cell.id ? "selected" : ""}`}
          onClick={() => onSelect(cell)}
        >
          <span className="hs-rank">#{i + 1}</span>
          <div className="hs-info">
            <span className="hs-zone">{cell.zone}</span>
            <span className="hs-coords">[{cell.row},{cell.col}]</span>
          </div>
          <span className={`hs-temp severity-text ${cell.severity}`}>{cell.lst}°C</span>
        </div>
      ))}
    </div>
  );
}
