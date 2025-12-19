import csv
import json
import re

INPUT_CSV = "waypoints.csv"
OUTPUT_JSON = "waypoints.json"

REQUIRED_COLUMNS = [
    "Waypoint",
    "Notes",
    "ProcedureType",
    "Procedure Name",
    "Airport",
    "Waypoint Coordinates",
    "State",
    "State Location (from Airport)",
    "Airports",
]

COORD_RE = re.compile(r"^\s*([0-9.]+)°\s*([NS])\s*/\s*([0-9.]+)°\s*([EW])\s*$")

def parse_coords(coord_text: str):
    if not coord_text:
        return None, None

    m = COORD_RE.match(coord_text.strip())
    if not m:
        return None, None

    lat = float(m.group(1))
    lat_dir = m.group(2)
    lon = float(m.group(3))
    lon_dir = m.group(4)

    if lat_dir == "S":
        lat = -lat
    if lon_dir == "W":
        lon = -lon

    return lat, lon

def main():
    # utf-8-sig removes BOM issues from Airtable exports
    with open(INPUT_CSV, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)

        missing = [c for c in REQUIRED_COLUMNS if c not in (reader.fieldnames or [])]
        # If Airtable sometimes omits some optional columns, you can relax this later.
        if missing:
            raise SystemExit(
                f"CSV is missing these columns: {missing}\n"
                f"Found columns: {reader.fieldnames}\n"
            )

        rows = []

        for r in reader:
            name = (r.get("Waypoint") or "").strip().upper()
            if not name:
                continue

            coord_text = (r.get("Waypoint Coordinates") or "").strip()
            lat, lon = parse_coords(coord_text)

            state = (r.get("State Location (from Airport)") or "").strip()
            if not state:
                state = (r.get("State") or "").strip()

            airport = (r.get("Airport") or "").strip()
            if not airport:
                airport = (r.get("Airports") or "").strip()

            rows.append({
                "waypoint": name,
                "state": state,
                "airport": airport,
                "procedure_type": (r.get("ProcedureType") or "").strip(),
                "procedure_name": (r.get("Procedure Name") or "").strip(),
                "origin": (r.get("Notes") or "").strip(),
                "coordinates_text": coord_text,
                "lat": lat,
                "lon": lon,
            })

    # Write ONCE, after the loop
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(rows, f, indent=2, ensure_ascii=False)

    print(f"Wrote {len(rows)} waypoints to {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
