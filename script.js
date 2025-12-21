// -----------------------------
// Fixipedia - script.js (clean)
// -----------------------------

// 1) Supabase config
const SUPABASE_URL = "https://jobycjifggynmfszpdto.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvYnljamlmZ2d5bm1mc3pwZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjAyOTcsImV4cCI6MjA4MTg5NjI5N30.BJGf2NVlBP_-qqsp4TFYnjn9RdvqAC1wkj8j9MkXinQ"; // keep your real anon key here
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  // Page elements (some pages won't have all of these)
  const searchInput = document.getElementById("searchInput");
  const waypointList = document.getElementById("waypointList");
  const resultsTitle = document.getElementById("resultsTitle");
  const resultsHint = document.getElementById("resultsHint");

  const statesList = document.getElementById("statesList");
  const airportsList = document.getElementById("airportsList");

  // Identify page type
  const isWaypointsPage = !!(searchInput && waypointList && resultsTitle && resultsHint);
  const isStatesPage = !!statesList;
  const isAirportsPage = !!airportsList;l;kmj

  // URL filters (States/Airports pages link to index.html?state=XX etc.)
  const urlParams = new URLSearchParams(window.location.search);
  const stateFilter = (urlParams.get("state") || "").trim();
  const airportFilter = (urlParams.get("airport") || "").trim();

  if (isWaypointsPage) {
    if (stateFilter) searchInput.value = stateFilter;
    if (airportFilter) searchInput.value = airportFilter;
  }

  // -----------------------------
  // Data loaders
  // -----------------------------
  async function loadWaypointsJson() {
    const res = await fetch("./waypoints.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  }

  async function searchWaypointsSupabase(query) {
    if (!query) return [];

    const { data, error } = await supabaseClient
      .from("waypoints")
      .select("fixipedia_id, name, state, latitude, longitude")
      .ilike("name", `%${query}%`)
      .order("name", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Supabase search error:", error);
      return [];
    }

    return data || [];
  }

  // -----------------------------
// STATES PAGE (Supabase-powered)
// -----------------------------
async function loadStatesSupabase() {
  // Pull distinct non-empty state values
  const { data, error } = await supabaseClient
    .from("waypoints")
    .select("state")
    .not("state", "is", null)
    .neq("state", "");

  if (error) {
    console.error("Supabase states error:", error);
    return [];
  }

  // De-dupe client-side (Supabase select doesn't do DISTINCT in this simple call)
  const states = [...new Set((data || []).map(r => (r.state || "").trim()).filter(Boolean))];
  states.sort((a, b) => a.localeCompare(b));
  return states;
}

async function renderStatesPage() {
  statesList.innerHTML = "<li>Loading states…</li>";

  const states = await loadStatesSupabase();

  if (!states.length) {
    statesList.innerHTML = "<li>No states found.</li>";
    return;
  }

  statesList.innerHTML = states
    .map(s => `<li><a href="index.html?state=${encodeURIComponent(s)}">${s}</a></li>`)
    .join("");
}


  function renderAirportsPage() {
    const airports = new Set();

    allWaypoints.forEach((wp) => {
      const a = (wp.airport || "").trim();
      if (a) airports.add(a);
    });

    const sorted = [...airports].sort((a, b) => a.localeCompare(b));
    airportsList.innerHTML = sorted
      .map((a) => `<li><a href="index.html?airport=${encodeURIComponent(a)}">${a}</a></li>`)
      .join("");
  }

  // -----------------------------
  // WAYPOINT SEARCH PAGE
  // (Supabase-powered)
  // -----------------------------
  if (isWaypointsPage) {
    const RECENTS_KEY = "fixipedia_recent_waypoints";
    const MAX_RECENTS = 6;

    function saveRecent(name) {
      if (!name) return;
      const current = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
      const updated = [name, ...current.filter((n) => n !== name)].slice(0, MAX_RECENTS);
      localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
    }

    function getRecents() {
      return JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    }

    function navigateToWaypoint(wp) {
      // Prefer stable unique id; fall back to name
      if (wp?.fixipedia_id) {
        window.location.href = `waypoint.html?id=${encodeURIComponent(wp.fixipedia_id)}`;
      } else if (wp?.name) {
        window.location.href = `waypoint.html?name=${encodeURIComponent(wp.name)}`;
      }
    }

    function renderCards(list) {
      waypointList.innerHTML = "";

      if (!list || list.length === 0) {
        resultsHint.textContent = "No matches found.";
        return;
      }

      list.forEach((wp) => {
        const li = document.createElement("li");
        li.className = "waypoint";
        li.innerHTML = `
          <h3>${wp.name || ""}</h3>
          <p><strong>State:</strong> ${wp.state || ""}</p>
          <p><strong>Lat/Lon:</strong> ${wp.latitude ?? ""}, ${wp.longitude ?? ""}</p>
        `;

        li.addEventListener("click", () => {
          saveRecent(wp.name);
          navigateToWaypoint(wp);
        });

        waypointList.appendChild(li);
      });
    }

    function showRecentsUI() {
      const recents = getRecents();
      resultsTitle.textContent = "Recent Searches";
      waypointList.innerHTML = "";

      if (recents.length === 0) {
        resultsHint.textContent = "Start typing to search for a waypoint.";
        return;
      }

      resultsHint.textContent = "Click a recent waypoint to search again.";

      recents.forEach((name) => {
        const li = document.createElement("li");
        li.className = "waypoint";
        li.innerHTML = `<h3>${name}</h3>`;
        li.addEventListener("click", () => {
          // Trigger a search using the text
          searchInput.value = name;
          updateUI();
        });
        waypointList.appendChild(li);
      });
    }

    let searchTimer = null;

    async function updateUI() {
      const query = searchInput.value.trim();

      if (!query) {
        showRecentsUI();
        return;
      }

      resultsTitle.textContent = "Results";
      resultsHint.textContent = "Searching…";

      // debounce
      if (searchTimer) clearTimeout(searchTimer);

      searchTimer = setTimeout(async () => {
        const rows = await searchWaypointsSupabase(query);
        resultsHint.textContent = "";
        renderCards(rows);
      }, 250);
    }

    // Attach listener + initial render
    searchInput.addEventListener("keyup", updateUI);
    updateUI();
  }

  // -----------------------------
  // Run page renderers
  // -----------------------------
  if (isStatesPage) renderStatesPage();
});
