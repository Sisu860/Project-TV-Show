function pad(num) {
  return num.toString().padStart(2, "0");
}

function showMessage(message, isError = false) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";
  const msg = document.createElement("div");
  msg.textContent = message;
  msg.style.textAlign = "center";
  msg.style.margin = "2em";
  msg.style.fontSize = "1.2em";
  msg.style.color = isError ? "red" : "#222";
  rootElem.appendChild(msg);
}

function createSummary(summaryText, maxLength = 120) {
  if (!summaryText) return "";
  const plainText = summaryText.replace(/<[^>]+>/g, "");
  if (plainText.length <= maxLength) return plainText;

  const shortText = plainText.slice(0, maxLength) + "... ";
  const container = document.createElement("span");
  container.textContent = shortText;

  const readMore = document.createElement("a");
  readMore.href = "#";
  readMore.textContent = "Read more";
  readMore.style.color = "#1a0dab";
  readMore.style.cursor = "pointer";
  readMore.addEventListener("click", function (e) {
    e.preventDefault();
    container.textContent = plainText;
  });

  container.appendChild(readMore);
  return container;
}

// --- Data cache ---
const showCache = {};
const episodeCache = {};

async function fetchShows() {
  if (Object.keys(showCache).length) return Object.values(showCache);
  const res = await fetch("https://api.tvmaze.com/shows");
  const shows = await res.json();
  shows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  shows.forEach(show => showCache[show.id] = show);
  return shows;
}

async function fetchEpisodes(showId) {
  if (episodeCache[showId]) return episodeCache[showId];
  const res = await fetch(`https://api.tvmaze.com/shows/${showId}/episodes`);
  const episodes = await res.json();
  episodeCache[showId] = episodes;
  return episodes;
}

// --- Shows Listing View ---
function makeShowsListing(shows, onShowClick) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  // Always remove episode controls when showing the shows grid
  const oldControls = document.getElementById("controls");
  if (oldControls) oldControls.remove();

  // Show count
  const showCount = document.createElement("div");
  showCount.textContent = `Total shows: ${shows.length}`;
  showCount.style.margin = "1em";
  showCount.style.fontWeight = "bold";
  showCount.style.color = "#ffd700";
  rootElem.appendChild(showCount);

  // Show search input
  const searchDiv = document.createElement("div");
  searchDiv.style.display = "flex";
  searchDiv.style.gap = "1em";
  searchDiv.style.margin = "1em";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search shows...";
  searchInput.style.width = "300px";
  searchInput.style.padding = "0.5em";
  searchInput.style.fontSize = "1rem";
  searchDiv.appendChild(searchInput);

  rootElem.appendChild(searchDiv);

  // Shows grid
  const showsGrid = document.createElement("div");
  showsGrid.className = "episode-grid";
  rootElem.appendChild(showsGrid);

  function renderShows(filteredShows) {
    showsGrid.innerHTML = "";
    filteredShows.forEach(show => {
      const card = document.createElement("div");
      card.className = "episode-card";
      card.style.cursor = "pointer";

      // Title at the top
      const titleBox = document.createElement("div");
      titleBox.className = "episode-title-box";
      titleBox.textContent = show.name;
      card.appendChild(titleBox);

      // Image
      const img = document.createElement("img");
      img.src = show.image?.medium || "";
      img.alt = show.name;
      card.appendChild(img);

      // TVMaze link for the show
      const link = document.createElement("a");
      link.href = show.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "View on TVMaze";
      card.appendChild(link);

      // Info (genres, status, rating, runtime)
      const info = document.createElement("div");
      info.className = "episode-info";
      info.innerHTML = `
        <strong>Genres:</strong> ${show.genres.join(", ")}<br>
        <strong>Status:</strong> ${show.status}<br>
        <strong>Rating:</strong> ${show.rating?.average ?? "N/A"}<br>
        <strong>Runtime:</strong> ${show.runtime ?? "N/A"} min
      `;
      card.appendChild(info);

      // Summary at the bottom
      const summary = document.createElement("div");
      summary.className = "episode-summary";
      const summaryContent = createSummary(show.summary || "");
      if (typeof summaryContent === "string") {
        summary.textContent = summaryContent;
      } else {
        summary.appendChild(summaryContent);
      }
      card.appendChild(summary);

      card.addEventListener("click", () => onShowClick(show.id));
      showsGrid.appendChild(card);
    });
  }

  // Initial render
  renderShows(shows);

  // Show search functionality
  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = shows.filter(show =>
      show.name.toLowerCase().includes(term) ||
      show.genres.join(" ").toLowerCase().includes(term) ||
      (show.summary || "").toLowerCase().includes(term)
    );
    renderShows(filtered);
  });
}

// --- Episodes Controls ---
function setupEpisodeControls(episodes, onSearch, onEpisodeSelect) {
  const oldControls = document.getElementById("controls");
  if (oldControls) oldControls.remove();

  const controls = document.createElement("div");
  controls.id = "controls";
  controls.style.display = "flex";
  controls.style.justifyContent = "flex-start";
  controls.style.alignItems = "center";
  controls.style.gap = "1em";
  controls.style.margin = "1em";

  // Episode select dropdown
  const episodeSelect = document.createElement("select");
  episodeSelect.id = "episode-select";
  episodeSelect.style.padding = "0.5em";
  episodeSelect.style.fontSize = "1rem";
  controls.appendChild(episodeSelect);

  // Search input for text
  const input = document.createElement("input");
  input.type = "text";
  input.id = "search-input";
  input.placeholder = "Search episodes...";
  input.style.padding = "0.5em";
  input.style.width = "250px";
  input.style.fontSize = "1rem";
  controls.appendChild(input);

  // Match count
  const matchCount = document.createElement("span");
  matchCount.id = "match-count";
  matchCount.style.marginLeft = "1em";
  matchCount.style.fontSize = "1rem";
  controls.appendChild(matchCount);

  const rootElem = document.getElementById("root");
  rootElem.parentNode.insertBefore(controls, rootElem);

  // Populate episode select
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select an episode...";
  episodeSelect.appendChild(defaultOption);

  episodes.forEach((episode) => {
    const option = document.createElement("option");
    option.value = episode.id;
    option.textContent = `S${pad(episode.season)}E${pad(episode.number)} - ${episode.name}`;
    episodeSelect.appendChild(option);
  });

  // Event listeners
  input.addEventListener("input", (e) => onSearch(e.target.value));
  episodeSelect.addEventListener("change", (e) => onEpisodeSelect(e.target.value));

  return { episodeSelect, input, matchCount };
}

// --- Episodes View Rendering ---
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  const oldGrid = document.querySelector(".episode-grid");
  if (oldGrid) oldGrid.remove();

  const episodesContainer = document.createElement("div");
  episodesContainer.className = "episode-grid";
  rootElem.appendChild(episodesContainer);

  episodeList.forEach((episode) => {
    const card = document.createElement("div");
    card.className = "episode-card";

    // Title and episode code
    const titleBox = document.createElement("div");
    titleBox.className = "episode-title-box";

    const title = document.createElement("span");
    title.className = "episode-title";
    title.textContent = episode.name;

    const episodeCode = document.createElement("span");
    episodeCode.className = "episode-code";
    episodeCode.textContent = `S${pad(episode.season)}E${pad(episode.number)}`;

    titleBox.appendChild(title);
    titleBox.appendChild(document.createTextNode(" – "));
    titleBox.appendChild(episodeCode);

    // Image
    const img = document.createElement("img");
    img.src = episode.image?.medium || "";
    img.alt = episode.name;

    // TVMaze link
    const link = document.createElement("a");
    link.href = episode.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View on TVMaze";

    // Info (airdate, rating, runtime)
    const info = document.createElement("div");
    info.className = "episode-info";
    info.innerHTML = `
      <strong>Airdate:</strong> ${episode.airdate || "N/A"}<br>
      <strong>Rating:</strong> ${episode.rating?.average ?? "N/A"}<br>
      <strong>Runtime:</strong> ${episode.runtime ?? "N/A"} min
    `;

    // Summary
    const summary = document.createElement("div");
    summary.className = "episode-summary";
    const summaryContent = createSummary(episode.summary || "");
    if (typeof summaryContent === "string") {
      summary.textContent = summaryContent;
    } else {
      summary.appendChild(summaryContent);
    }

    card.appendChild(titleBox);
    card.appendChild(img);
    card.appendChild(link);
    card.appendChild(info);
    card.appendChild(summary);

    episodesContainer.appendChild(card);
  });
}

function makeEpisodesView(show, episodes, onBack) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  // Back link
  const backLink = document.createElement("a");
  backLink.href = "#";
  backLink.textContent = "← Back to shows";
  backLink.className = "back-btn";
  backLink.addEventListener("click", (e) => {
    e.preventDefault();
    onBack();
  });
  rootElem.appendChild(backLink);

  // Show title
  const showTitle = document.createElement("h2");
  showTitle.textContent = show.name;
  showTitle.style.marginLeft = "1em";
  rootElem.appendChild(showTitle);

  let currentEpisodes = episodes;
  let filteredEpisodes = episodes;

  function render(episodesToShow) {
    makePageForEpisodes(episodesToShow);
    controls.matchCount.textContent = `Displaying ${episodesToShow.length}/${currentEpisodes.length} episodes.`;
  }

  function handleSearch(searchTerm) {
    searchTerm = searchTerm.toLowerCase().trim();
    filteredEpisodes = currentEpisodes.filter(
      (ep) =>
        ep.name.toLowerCase().includes(searchTerm) ||
        ep.summary?.toLowerCase().includes(searchTerm)
    );
    render(filteredEpisodes);
    controls.episodeSelect.value = "";
  }

  function handleEpisodeSelect(selectedId) {
    if (!selectedId) {
      render(filteredEpisodes.length ? filteredEpisodes : currentEpisodes);
      return;
    }
    const selectedEpisode = (filteredEpisodes.length ? filteredEpisodes : currentEpisodes)
      .find(ep => ep.id == selectedId);
    if (selectedEpisode) render([selectedEpisode]);
    controls.input.value = "";
  }

  const controls = setupEpisodeControls(
    episodes,
    handleSearch,
    handleEpisodeSelect
  );
  render(episodes);
}

// --- Main ---
function main() {
  showMessage("Loading shows...");
  fetchShows().then(shows => {
    makeShowsListing(
      shows,
      async (showId) => {
        showMessage("Loading episodes...");
        const episodes = await fetchEpisodes(showId);
        makeEpisodesView(showCache[showId], episodes, () => main());
      }
    );
  });
}

window.onload = main;