from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import math

app = FastAPI(title="Urban Heat AI Mitigation System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Simulated city grid (10x10) for Pimpri-Chinchwad area ──────────────────
# Each cell represents a ~1km² zone with:
#   lst  = Land Surface Temperature (°C)
#   ndvi = Normalized Difference Vegetation Index (-1 to 1, higher = greener)
#   ndbi = Normalized Difference Built-up Index (-1 to 1, higher = more concrete)
#   zone = land-use label

CITY_GRID = []

ZONE_TYPES = [
    "Industrial",
    "Dense Residential",
    "Commercial",
    "Sparse Residential",
    "Green Park",
    "Mixed Use",
    "Transport Hub",
]

random.seed(42)

for row in range(10):
    for col in range(10):
        # Create realistic thermal patterns:
        # - Industrial belt on left/top
        # - Green zones on edges
        # - Hot dense center
        base_temp = 32.0
        center_heat = math.exp(-((row - 4.5) ** 2 + (col - 4.5) ** 2) / 8) * 8
        industrial_heat = (1 - col / 9) * 4 if row < 4 else 0
        noise = random.uniform(-1.5, 1.5)

        lst = base_temp + center_heat + industrial_heat + noise
        ndvi = max(-0.2, 0.6 - (lst - 32) / 20 + random.uniform(-0.1, 0.1))
        ndbi = max(-0.3, min(0.8, (lst - 32) / 15 + random.uniform(-0.1, 0.1)))

        if lst > 39:
            zone = "Industrial"
        elif lst > 37:
            zone = "Dense Residential"
        elif lst > 36:
            zone = "Commercial"
        elif ndvi > 0.4:
            zone = "Green Park"
        elif lst > 34:
            zone = "Mixed Use"
        elif col == 0 or col == 9 or row == 9:
            zone = "Transport Hub"
        else:
            zone = "Sparse Residential"

        CITY_GRID.append(
            {
                "id": row * 10 + col,
                "row": row,
                "col": col,
                "lst": round(lst, 2),
                "ndvi": round(ndvi, 3),
                "ndbi": round(ndbi, 3),
                "zone": zone,
                "severity": (
                    "critical" if lst > 38
                    else "high" if lst > 36
                    else "moderate" if lst > 34
                    else "low"
                ),
            }
        )


# ── Intervention simulation logic ──────────────────────────────────────────

INTERVENTIONS = {
    "tree_plantation": {
        "name": "Tree Plantation",
        "icon": "",
        "cost_per_unit": 5000,  # ₹ per tree
        "units_label": "trees",
        "base_cooling": 0.08,   # °C per tree
        "max_trees": 50,
        "ndvi_boost": 0.03,
    },
    "cool_roof": {
        "name": "Cool Roof Coating",
        "icon": "",
        "cost_per_unit": 80000,  # ₹ per 100m² roof
        "units_label": "rooftop units",
        "base_cooling": 0.15,
        "max_units": 20,
        "ndbi_reduction": 0.04,
    },
    "green_corridor": {
        "name": "Green Corridor",
        "icon": "",
        "cost_per_unit": 200000,  # ₹ per 100m stretch
        "units_label": "corridor segments",
        "base_cooling": 0.25,
        "max_units": 5,
        "ndvi_boost": 0.08,
    },
    "mist_cooling": {
        "name": "Smart Mist Station",
        "icon": "",
        "cost_per_unit": 150000,  # ₹ per station
        "units_label": "mist stations",
        "base_cooling": 0.4,
        "max_units": 3,
        "energy_kwh_per_day": 12,
    },
    "reflective_pavement": {
        "name": "Reflective Pavement",
        "icon": "",
        "cost_per_unit": 120000,  # ₹ per 500m²
        "units_label": "pavement sections",
        "base_cooling": 0.12,
        "max_units": 10,
        "ndbi_reduction": 0.02,
    },
}


class SimulationRequest(BaseModel):
    cell_id: int
    intervention_type: str
    units: int


@app.get("/")
def root():
    return {"message": "Urban Heat AI Mitigation System API"}


@app.get("/api/grid")
def get_grid():
    """Return the full city thermal grid."""
    stats = {
        "max_lst": max(c["lst"] for c in CITY_GRID),
        "min_lst": min(c["lst"] for c in CITY_GRID),
        "avg_lst": round(sum(c["lst"] for c in CITY_GRID) / len(CITY_GRID), 2),
        "critical_zones": sum(1 for c in CITY_GRID if c["severity"] == "critical"),
        "high_zones": sum(1 for c in CITY_GRID if c["severity"] == "high"),
        "total_cells": len(CITY_GRID),
    }
    return {"grid": CITY_GRID, "stats": stats, "city": "Pimpri-Chinchwad, Maharashtra"}


@app.get("/api/hotspots")
def get_hotspots():
    """Return top 5 hotspot zones ranked by LST."""
    sorted_cells = sorted(CITY_GRID, key=lambda x: x["lst"], reverse=True)
    return {"hotspots": sorted_cells[:5]}


@app.get("/api/interventions")
def get_interventions():
    """Return available intervention types."""
    return {"interventions": INTERVENTIONS}


@app.post("/api/simulate")
def simulate_intervention(req: SimulationRequest):
    """
    Simulate the cooling impact of an intervention on a specific cell.
    Returns temperature drop, cost, and Cooling ROI score.
    """
    cell = next((c for c in CITY_GRID if c["id"] == req.cell_id), None)
    if not cell:
        return {"error": "Cell not found"}

    iv = INTERVENTIONS.get(req.intervention_type)
    if not iv:
        return {"error": "Unknown intervention"}

    # Effectiveness multipliers based on zone type
    zone_multipliers = {
        "Industrial": 1.4,
        "Dense Residential": 1.2,
        "Commercial": 1.15,
        "Transport Hub": 1.1,
        "Mixed Use": 1.0,
        "Sparse Residential": 0.85,
        "Green Park": 0.4,
    }
    multiplier = zone_multipliers.get(cell["zone"], 1.0)

    # NDVI boost amplifies tree/corridor effectiveness
    if req.intervention_type in ("tree_plantation", "green_corridor"):
        ndvi_penalty = max(0, cell["ndvi"] * 0.5)  # already green = less impact
        multiplier *= 1 - ndvi_penalty

    units = max(1, req.units)
    temp_drop = round(iv["base_cooling"] * units * multiplier, 2)
    total_cost = iv["cost_per_unit"] * units
    new_lst = round(cell["lst"] - temp_drop, 2)

    # Cooling ROI = °C drop per ₹1 lakh spent
    cooling_roi = round((temp_drop / (total_cost / 100000)), 3)

    # Heat Reduction Score (0-100)
    hrs = min(100, round((temp_drop / cell["lst"]) * 1000, 1))

    new_severity = (
        "critical" if new_lst > 38
        else "high" if new_lst > 36
        else "moderate" if new_lst > 34
        else "low"
    )

    return {
        "cell_id": req.cell_id,
        "zone": cell["zone"],
        "original_lst": cell["lst"],
        "new_lst": new_lst,
        "temp_drop": temp_drop,
        "total_cost_inr": total_cost,
        "cooling_roi": cooling_roi,
        "heat_reduction_score": hrs,
        "new_severity": new_severity,
        "intervention": iv["name"],
        "units": units,
        "recommendation": (
            "Highly recommended — strong thermal return on investment"
            if cooling_roi > 0.05
            else "Moderate impact — consider combining with other interventions"
            if cooling_roi > 0.02
            else "Low immediate impact — better suited for green zones"
        ),
    }


@app.get("/api/ranking/{cell_id}")
def rank_interventions(cell_id: int):
    """
    For a given cell, rank ALL interventions by Cooling ROI.
    This is the core 'precision cooling advisor' feature.
    """
    cell = next((c for c in CITY_GRID if c["id"] == cell_id), None)
    if not cell:
        return {"error": "Cell not found"}

    zone_multipliers = {
        "Industrial": 1.4, "Dense Residential": 1.2,
        "Commercial": 1.15, "Transport Hub": 1.1,
        "Mixed Use": 1.0, "Sparse Residential": 0.85, "Green Park": 0.4,
    }
    multiplier = zone_multipliers.get(cell["zone"], 1.0)

    rankings = []
    for key, iv in INTERVENTIONS.items():
        # Use median units for comparison
        if key == "tree_plantation":
            units = 25
        elif key == "mist_cooling":
            units = 2
        else:
            units = 5

        m = multiplier
        if key in ("tree_plantation", "green_corridor"):
            m *= 1 - max(0, cell["ndvi"] * 0.5)

        temp_drop = round(iv["base_cooling"] * units * m, 2)
        cost = iv["cost_per_unit"] * units
        roi = round(temp_drop / (cost / 100000), 4)

        rankings.append({
            "intervention": key,
            "name": iv["name"],
            "icon": iv["icon"],
            "temp_drop": temp_drop,
            "cost_inr": cost,
            "cooling_roi": roi,
            "heat_reduction_score": min(100, round((temp_drop / cell["lst"]) * 1000, 1)),
        })

    rankings.sort(key=lambda x: x["cooling_roi"], reverse=True)
    for i, r in enumerate(rankings):
        r["rank"] = i + 1

    return {"cell": cell, "rankings": rankings}
