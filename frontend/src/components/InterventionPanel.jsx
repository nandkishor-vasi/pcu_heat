import { useState } from "react";

const INTERVENTIONS = [
  { key: "tree_plantation",     label: "Tree Plantation",        icon: "",   max: 50, step: 5,  unit: "trees" },
  { key: "cool_roof",           label: "Cool Roof Coating",      icon: "",   max: 20, step: 1,  unit: "rooftop units" },
  { key: "green_corridor",      label: "Green Corridor",         icon: "",   max: 5,  step: 1,  unit: "segments" },
  { key: "mist_cooling",        label: "Smart Mist Station",     icon: "",   max: 3,  step: 1,  unit: "stations" },
  { key: "reflective_pavement", label: "Reflective Pavement",    icon: "",   max: 10, step: 1,  unit: "sections" },
];

export default function InterventionPanel({ onSimulate, result, loading }) {
  const [selected, setSelected] = useState(null);
  const [units, setUnits] = useState(5);

  const iv = INTERVENTIONS.find((i) => i.key === selected);

  return (
    <div className="intervention-panel">
      <p className="panel-desc">
        Select a cooling intervention and quantity, then run the simulation to see the projected temperature drop and ROI.
      </p>

      <div className="iv-grid">
        {INTERVENTIONS.map((iv) => (
          <button
            key={iv.key}
            className={`iv-card ${selected === iv.key ? "active" : ""}`}
            onClick={() => { setSelected(iv.key); setUnits(iv.step); }}
          >
            <span className="iv-icon">{iv.icon}</span>
            <span className="iv-label">{iv.label}</span>
          </button>
        ))}
      </div>

      {iv && (
        <div className="units-control">
          <label>
            Quantity: <strong>{units} {iv.unit}</strong>
          </label>
          <input
            type="range"
            min={iv.step}
            max={iv.max}
            step={iv.step}
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))}
          />
          <div className="range-labels">
            <span>{iv.step}</span><span>{iv.max}</span>
          </div>
        </div>
      )}

      <button
        className={`simulate-btn ${!selected ? "disabled" : ""}`}
        disabled={!selected || loading}
        onClick={() => onSimulate(selected, units)}
      >
        {loading ? "Simulating..." : "Run Simulation"}
      </button>

      {result && <SimResult result={result} />}
    </div>
  );
}

function SimResult({ result }) {
  const pct = Math.min(100, (result.temp_drop / result.original_lst) * 100 * 10);

  return (
    <div className="sim-result">
      <div className="result-header">
        <span className="result-title">Simulation Result</span>
        <span className={`severity-tag ${result.new_severity}`}>{result.new_severity.toUpperCase()}</span>
      </div>

      <div className="temp-comparison">
        <div className="temp-before">
          <span className="temp-label">Before</span>
          <span className="temp-num hot">{result.original_lst}°C</span>
        </div>
        <div className="temp-arrow">→</div>
        <div className="temp-after">
          <span className="temp-label">After</span>
          <span className="temp-num cool">{result.new_lst}°C</span>
        </div>
        <div className="temp-drop-badge">−{result.temp_drop}°C</div>
      </div>

      <div className="result-metrics">
        <ResultMetric label="Total Cost" value={`₹${result.total_cost_inr.toLocaleString("en-IN")}`} />
        <ResultMetric label="Cooling ROI" value={`${result.cooling_roi}°C / ₹1L`} highlight />
        <ResultMetric label="Heat Reduction Score" value={`${result.heat_reduction_score}/100`} />
      </div>

      <div className="hrs-bar-wrapper">
        <div className="hrs-label">Heat Reduction Score</div>
        <div className="hrs-bar-track">
          <div
            className="hrs-bar-fill"
            style={{ width: `${result.heat_reduction_score}%` }}
          />
        </div>
      </div>

      <p className="recommendation">{result.recommendation}</p>
    </div>
  );
}

function ResultMetric({ label, value, highlight }) {
  return (
    <div className={`result-metric ${highlight ? "highlight" : ""}`}>
      <span className="rm-value">{value}</span>
      <span className="rm-label">{label}</span>
    </div>
  );
}
