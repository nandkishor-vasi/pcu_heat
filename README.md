# Urban Heat AI Mitigation System — MVP

> PCU Ideathon 3.0 | Team Gottem | Showcase Demo

A full-stack precision cooling intelligence platform. Identifies urban heat hotspots from a simulated satellite grid and recommends the most cost-effective mitigation interventions using a **Cooling ROI engine**.

---

## Project Structure

```
urban-heat-mvp/
├── backend/
│   ├── main.py            # FastAPI app — heat data, simulation, ROI ranking
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   └── components/
    │       ├── HeatGrid.jsx         # 10×10 thermal map
    │       ├── StatsBar.jsx         # City-wide stats
    │       ├── HotspotsList.jsx     # Top 5 hotspots
    │       ├── InterventionPanel.jsx # Simulate interventions
    │       └── RankingPanel.jsx     # Cooling ROI ranking
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## Setup & Run

### 1. Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API will be live at: `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs`

---

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Frontend will be live at: `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint                    | Description                              |
|--------|-----------------------------|------------------------------------------|
| GET    | `/api/grid`                 | Full 10×10 city thermal grid + stats     |
| GET    | `/api/hotspots`             | Top 5 hottest zones                      |
| GET    | `/api/interventions`        | Available intervention types             |
| POST   | `/api/simulate`             | Simulate cooling for a cell              |
| GET    | `/api/ranking/{cell_id}`    | Rank all interventions by Cooling ROI    |

### Simulate Request Body
```json
{
  "cell_id": 44,
  "intervention_type": "tree_plantation",
  "units": 25
}
```

---

## Simulation Logic

The system uses zone-aware multipliers to calculate realistic cooling impact:

- **Industrial zones** → 1.4× multiplier (highest gains from greening)
- **Dense Residential** → 1.2×
- **Green Parks** → 0.4× (already cool, minimal gain)

**Cooling ROI** = Temperature drop (°C) / Cost (per ₹1 lakh)

**Heat Reduction Score** = Proportional drop relative to baseline LST (0–100)

---

## Interventions Available

| Intervention         | Base Cooling | Cost/Unit     |
|----------------------|-------------|---------------|
| Tree Plantation      | 0.08°C/tree | ₹5,000/tree   |
| Cool Roof Coating    | 0.15°C/unit | ₹80,000/unit  |
| Green Corridor       | 0.25°C/seg  | ₹2,00,000/seg |
| Smart Mist Station   | 0.40°C/sta  | ₹1,50,000/sta |
| Reflective Pavement  | 0.12°C/sec | ₹1,20,000/sec  |

---

## Next Steps (Post-MVP)

- Replace mock grid with **real Landsat-9 / Sentinel-2** data via Google Earth Engine API
- Train **Random Forest Regressor** on actual NDVI/NDBI/LST correlations
- Add **Mapbox GL JS** for real geographic rendering
- Connect **IoT Smart Mist** trigger via MQTT
- Deploy on **Railway / Render** (FastAPI) + **Vercel** (React)
# pcu_heat
