import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const resultsHint = document.getElementById("resultsHint");
  const airportList = document.getElementById("airportList");

  let searchTimer = null;

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderAirports(rows) {
    if (!rows || rows.length === 0) {
      airportList.innerHTML = `<div class="empty">No airports found.</div>`;
      return;
    }

    airportList.innerHTML = rows
      .map((a) => {
        const id = escapeHtml(a.airport_id);
        const name = escapeHtml(a.airport_name);
        const icao = escapeHtml(a.icao);
        const iata = escapeHtml(a.iata);
        const state = escapeHtml(a.state);
        const country = escapeHtml(a.country);

        const codes = [icao, iata].filter(Boolean).join(" / ");
        const subLeft = [state, country].filter(Boolean).join(", ");
        const subRight = codes ? `Codes: ${codes}` : "";

        return `
          <a class="card" href="airport.html?id=${encodeURIComponent(a.airport_id)}">
            <div class="card-title">${id} — ${name}</div>
            <div class="card-sub">${[subLeft, subRight].filter(Boolean).join(" • ")}</div>
          </a>
        `;
      })
      .join("");
  }

  async function fetchAirports(term) {
    const q = (term || "").trim();
    resultsHint.textContent = q ? `Results for “${q}”` : "Type to search airports…";

    let query = supabase
      .from("airports")
      .select("airport_id,airport_name,icao,iata,state,country")
      .order("airport_id", { ascending: true })
      .limit(200);

    if (q) {
      query = query.or(
        `airport_id.ilike.%${q}%,airport_name.ilike.%${q}%,icao.ilike.%${q}%,iata.ilike.%${q}%,state.ilike.%${q}%,country.ilike.%${q}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      airportList.innerHTML = `<div class="error">Error loading airports: ${escapeHtml(error.message)}</div>`;
      return;
    }

    renderAirports(data);
    resultsHint.textContent = q ? `Results (${data.length})` : `Showing ${data.length} airports (type to search)`;
  }

  fetchAirports("");

  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => fetchAirports(searchInput.value), 250);
  });
});
