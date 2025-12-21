const SUPABASE_URL = "https://jobycjifggynmfszpdto.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvYnljamlmZ2d5bm1mc3pwZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjAyOTcsImV4cCI6MjA4MTg5NjI5N30.BJGf2NVlBP_-qqsp4TFYnjn9RdvqAC1wkj8j9MkXinQ";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabaseConnection() {
  const { data, error } = await supabaseClient
    .from("waypoints")
    .select("fixipedia_id, name, state, latitude, longitude")
    .limit(5);

  if (error) {
    console.error("Supabase test FAILED:", error);
    alert("Supabase test FAILED. Open console (F12).");
    return;
  }

  console.log("Supabase test OK:", data);
  alert("Supabase test OK! Check console.");
}

document.addEventListener("DOMContentLoaded", async () => {
  await testSupabaseConnection(); // temporary test

  // Common: load data once
  let allWaypoints = [];


  async function loadWaypoints() {
    const res = await fetch("./waypoints.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log("Loaded waypoints:", data.length);
    return data;
  }

  // Detect which page we're on by checking for page-specific elements
  const searchInput = document.getElementById("searchInput");
  const waypointList = document.getElementById("waypointList");
  const resultsTitle = document.getElementById("resultsTitle");
  const resultsHint = document.getElementById("resultsHint");
    // Read filters from URL (used by States / Airports pages)
  const urlParams = new URLSearchParams(window.location.search);
  const stateFilter = (urlParams.get("state") || "").trim();
  const airportFilter = (urlParams.get("airport") || "").trim();

  if (stateFilter) searchInput.value = stateFilter;
  if (airportFilter) searchInput.value = airportFilter;


  const statesList = document.getElementById("statesList");
  const airportsList = document.getElementById("airportsList");

  // If none of the expected containers exist, do nothing.
  const isWaypointsPage = !!(searchInput && waypointList && resultsTitle && resultsHint);
  const isStatesPage = !!statesList;
  const isAirportsPage = !!airportsList;

  try {
    allWaypoints = await loadWaypoints();
  } catch (e) {
    console.error("Fetch error:", e);

    // Put a friendly message wherever we can
    if (resultsTitle) resultsTitle.textContent = "Results";
    if (resultsHint) resultsHint.textContent = "Could not load waypoints.json (check Live Server root / file location).";
    if (waypointList) waypointList.innerHTML = "";
    if (statesList) statesList.innerHTML = "<li>Could not load waypoints.json.</li>";
    if (airportsList) airportsList.innerHTML = "<li>Could not load waypoints.json.</li>";
    return;
  }

  // -------------------------
  // STATES PAGE
  // -------------------------
  function renderStatesPage() {
    const states = new Set();

    allWaypoints.forEach(wp => {
      const s = (wp.state || "").trim();
      if (s) states.add(s);
    });

    const sorted = [...states].sort((a, b) => a.localeCompare(b));
    statesList.innerHTML = sorted
      .map(s => `<li><a href="index.html?state=${encodeURIComponent(s)}">${s}</a></li>`)
      .join("");

    console.log("States rendered:", sorted.length);
  }

  // -------------------------
  // AIRPORTS PAGE
  // -------------------------
  function renderAirportsPage() {
    // Use a Set for unique airport values
    const airports = new Set();

    allWaypoints.forEach(wp => {
      const a = (wp.airport || "").trim();
      if (a) airports.add(a);
    });

    const sorted = [...airports].sort((a, b) => a.localeCompare(b));
    airportsList.innerHTML = sorted
      .map(a => `<li><a href="index.html?airport=${encodeURIComponent(a)}">${a}</a></li>`)
      .join("");

    console.log("Airports rendered:", sorted.length);
  }

  // -------------------------
  // WAYPOINT SEARCH PAGE (your original logic)
  // -------------------------
  if (isWaypointsPage) {
    const urlParams = new URLSearchParams(window.location.search);
    const stateFilter = (urlParams.get("state") || "").trim();
    const airportFilter = (urlParams.get("airport") || "").trim();

    if (stateFilter) searchInput.value = stateFilter;
    if (airportFilter) searchInput.value = airportFilter;

    const RECENTS_KEY = "fixopedia_recent_waypoints";
    const MAX_RECENTS = 6;

    function saveRecent(name) {
      if (!name) return;
      const current = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
      const updated = [name, ...current.filter(n => n !== name)].slice(0, MAX_RECENTS);
      localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
    }

    function getRecents() {
      return JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    }

    function navigateToWaypoint(name) {
      window.location.href = `waypoint.html?name=${encodeURIComponent(name)}`;
    }

    function renderCards(list) {
      waypointList.innerHTML = "";
      list.forEach(wp => {
        const li = document.createElement("li");
        li.className = "waypoint";
        li.innerHTML = `
          <h3>${wp.waypoint || ""}</h3>
          <p><strong>State:</strong> ${wp.state || ""}</p>
          <p><strong>Airport:</strong> ${wp.airport || ""}</p>
          <p><strong>Origin:</strong> ${wp.origin || ""}</p>
        `;
        li.addEventListener("click", () => {
          saveRecent(wp.waypoint);
          navigateToWaypoint(wp.waypoint);
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

      resultsHint.textContent = "Click a recent waypoint to open its detail page.";

      recents.forEach(name => {
        const li = document.createElement("li");
        li.className = "waypoint";
        li.innerHTML = `<h3>${name}</h3>`;
        li.addEventListener("click", () => navigateToWaypoint(name));
        waypointList.appendChild(li);
      });
    }

    function updateUI() {
      const query = searchInput.value.trim().toLowerCase();

      if (!query) {
        showRecentsUI();
        return;
      }

      resultsTitle.textContent = "Results";
      resultsHint.textContent = "";

      const filtered = allWaypoints.filter(wp => {
        const hay = `${wp.waypoint} ${wp.state} ${wp.airport} ${wp.procedure_type} ${wp.procedure_name} ${wp.origin}`.toLowerCase();
        return hay.includes(query);
      });

      renderCards(filtered);
    }

    searchInput.addEventListener("keyup", updateUI);
    updateUI();
  }

  // Run page renderers if their containers exist
  if (isStatesPage) renderStatesPage();
  if (isAirportsPage) renderAirportsPage();
});
