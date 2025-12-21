import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", async () => {
  const airportTitle = document.getElementById("airportTitle");
  const airportMeta = document.getElementById("airportMeta");

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // 1) Read ?id= from the URL
  const params = new URLSearchParams(window.location.search);
  const airportId = (params.get("id") || "").trim();

  if (!airportId) {
    airportTitle.textContent = "Airport not found";
    airportMeta.innerHTML = `<div class="error">Missing <code>?id=</code> in the URL.</div>`;
    return;
  }

  // 2) Fetch airport record from Supabase
  const { data: airport, error } = await supabase
    .from("airports")
    .select("airport_id, airport_name, icao, iata, state, country, latitude, longitude")
    .eq("airport_id", airportId)
    .single();

  if (error || !airport) {
    airportTitle.textContent = "Airport not found";
    airportMeta.innerHTML = `<div class="error">No airport found for ID: <b>${escapeHtml(airportId)}</b></div>`;
    return;
  }

  // 3) Render the page
  airportTitle.textContent = `${airport.airport_id} — ${airport.airport_name}`;

  const codes = [airport.icao, airport.iata].filter(Boolean).join(" / ");
  const location = [airport.state, airport.country].filter(Boolean).join(", ");

  const lines = [];
  if (location) lines.push(`<div><b>Location:</b> ${escapeHtml(location)}</div>`);
  if (codes) lines.push(`<div><b>Codes:</b> ${escapeHtml(codes)}</div>`);
  if (airport.latitude != null && airport.longitude != null) {
    lines.push(`<div><b>Coordinates:</b> ${airport.latitude}, ${airport.longitude}</div>`);
  }

  airportMeta.innerHTML = lines.join("") || `<div class="empty">No details available.</div>`;
});
