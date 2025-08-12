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

function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  const episodesContainer = document.createElement("div");
  episodesContainer.className = "episode-grid";
  rootElem.appendChild(episodesContainer);

  episodeList.forEach((episode) => {
    const card = document.createElement("div");
    card.className = "episode-card";

    // Title and episode code box
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

    // Summary
    const summary = document.createElement("div");
    summary.className = "episode-summary";
    summary.innerHTML = episode.summary || "";

    // TVMaze link for the episode
    const link = document.createElement("a");
    link.href = episode.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View on TVMaze";

    // Build card
    card.appendChild(titleBox);
    card.appendChild(img);
    card.appendChild(summary);
    card.appendChild(link);

    episodesContainer.appendChild(card);
  });
}

// Caching for shows and episodes
const showCache = {};
const episodeCache = {};

function setupControls(shows, onShowChange, onSearch, onEpisodeSelect) {
  // Remove old controls if any
  const oldControls = document.getElementById("controls");
  if (oldControls) oldControls.remove();

  const controls = document.createElement("div");
  controls.id = "controls";
  controls.style.display = "flex";
  controls.style.justifyContent = "flex-start";
  controls.style.alignItems = "center";
  controls.style.gap = "1em";
  controls.style.margin = "1em";

  // Show selector
  const showSelect = document.createElement("select");
  showSelect.id = "show-select";
  showSelect.style.padding = "0.5em";
  showSelect.style.fontSize = "1rem";
  shows.forEach((show) => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    showSelect.appendChild(option);
  });
  controls.appendChild(showSelect);

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

  // Insert controls above the root element
  const rootElem = document.getElementById("root");
  rootElem.parentNode.insertBefore(controls, rootElem);

  // Event listeners
  showSelect.addEventListener("change", () => onShowChange(showSelect.value));
  input.addEventListener("input", (e) => onSearch(e.target.value));
  episodeSelect.addEventListener("change", (e) => onEpisodeSelect(e.target.value));

  return { showSelect, episodeSelect, input, matchCount };
}

function populateEpisodeSelect(episodeSelect, episodes) {
  episodeSelect.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select an episode...";
  episodeSelect.appendChild(defaultOption);

  episodes.forEach((episode, idx) => {
    const option = document.createElement("option");
    option.value = idx;
    option.textContent = `S${pad(episode.season)}E${pad(episode.number)} - ${episode.name}`;
    episodeSelect.appendChild(option);
  });
}

function main() {
  showMessage("Loading shows...");
  fetch("https://api.tvmaze.com/shows")
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((shows) => {
      // Sort shows alphabetically, case-insensitive
      shows.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      shows.forEach(show => showCache[show.id] = show);

      // Setup controls and initial show
      let currentEpisodes = [];
      let currentShowId = shows[0].id;
      let filteredEpisodes = [];

      function render(episodes) {
        makePageForEpisodes(episodes);
        controls.matchCount.textContent = `Displaying ${episodes.length}/${currentEpisodes.length} episodes.`;
      }

      function handleShowChange(showId) {
        controls.input.value = "";
        controls.episodeSelect.value = "";
        showEpisodes(showId);
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

      function handleEpisodeSelect(idx) {
        if (idx === "") {
          render(filteredEpisodes.length ? filteredEpisodes : currentEpisodes);
          return;
        }
        render([filteredEpisodes.length ? filteredEpisodes[idx] : currentEpisodes[idx]]);
        controls.input.value = "";
      }

      function showEpisodes(showId) {
        currentShowId = showId;
        if (episodeCache[showId]) {
          currentEpisodes = episodeCache[showId];
          filteredEpisodes = currentEpisodes;
          populateEpisodeSelect(controls.episodeSelect, currentEpisodes);
          render(currentEpisodes);
        } else {
          showMessage("Loading episodes...");
          fetch(`https://api.tvmaze.com/shows/${showId}/episodes`)
            .then((response) => {
              if (!response.ok) throw new Error("Network response was not ok");
              return response.json();
            })
            .then((episodes) => {
              episodeCache[showId] = episodes;
              currentEpisodes = episodes;
              filteredEpisodes = episodes;
              populateEpisodeSelect(controls.episodeSelect, episodes);
              render(episodes);
            })
            .catch(() => {
              showMessage("Error loading episodes. Please try again later.", true);
            });
        }
      }

      const controls = setupControls(
        shows,
        handleShowChange,
        handleSearch,
        handleEpisodeSelect
      );

      showEpisodes(currentShowId);
    })
    .catch(() => {
      showMessage("Error loading shows. Please try again later.", true);
    });
}

window.onload = main;