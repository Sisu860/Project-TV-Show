// Cache for fetched data to avoid duplicate requests
const cache = {
  shows: null,
  episodes: {},
};

function pad(num) {
  return num.toString().padStart(2, "0");
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

function setup(shows, episodes = null) {
  // Remove existing controls if they exist
  const existingControls = document.querySelector(
    "div[style*='display: flex']"
  );
  if (existingControls) {
    existingControls.remove();
  }
  // Create top controls container
  const controls = document.createElement("div");
  controls.style.display = "flex";
  controls.style.justifyContent = "flex-start";
  controls.style.alignItems = "center";
  controls.style.gap = "1em";
  controls.style.margin = "1em";

  // Show search input
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "show-search-input";
  searchInput.placeholder = "Search shows...";
  searchInput.style.padding = "0.5em";
  searchInput.style.fontSize = "1rem";
  controls.appendChild(searchInput);

  // Show select dropdown
  const showSelect = document.createElement("select");
  showSelect.id = "show-select";
  showSelect.style.padding = "0.5em";
  showSelect.style.fontSize = "1rem";
  controls.appendChild(showSelect);

  // Populate show select with all shows initially
  function populateShowSelect(showsToDisplay) {
    showSelect.innerHTML = ""; // Clear existing options
    
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select a show...";
    showSelect.appendChild(defaultOption);

    showsToDisplay.forEach((show) => {
      const option = document.createElement("option");
      option.value = show.id;
      option.textContent = show.name;
      showSelect.appendChild(option);
    });
  }

  // Initial population with all shows
  populateShowSelect(shows);

  searchInput.addEventListener("input", function (event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    const filteredShows = shows.filter((show) =>
      show.name.toLowerCase().includes(searchTerm)
    );
    
    populateShowSelect(filteredShows);
  });

  showSelect.addEventListener("change", function (event) {
    const selectedShowId = event.target.value;
    if (selectedShowId === "") {
      const rootElem = document.getElementById("root");
      rootElem.innerHTML = "";
      return;
    }
    loadEpisodesForShow(selectedShowId);
  });

  // Only add episode-related controls if episodes exist
  if (episodes && episodes.length > 0) {
    // Episode search input
    const episodeSearchInput = document.createElement("input");
    episodeSearchInput.type = "text";
    episodeSearchInput.id = "episode-search-input";
    episodeSearchInput.placeholder = "Search episodes...";
    episodeSearchInput.style.padding = "0.5em";
    episodeSearchInput.style.width = "250px";
    episodeSearchInput.style.fontSize = "1rem";
    controls.appendChild(episodeSearchInput);

    // Episode select dropdown
    const select = document.createElement("select");
    select.id = "episode-select";
    select.style.padding = "0.5em";
    select.style.fontSize = "1rem";
    controls.appendChild(select);

    // Populate episode select options
    function populateEpisodeSelect(episodesToDisplay) {
      select.innerHTML = "";
      
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select an episode...";
      select.appendChild(defaultOption);

      episodesToDisplay.forEach((episode, idx) => {
        const option = document.createElement("option");
        option.value = idx;
        option.textContent = `S${pad(episode.season)}E${pad(episode.number)} - ${episode.name}`;
        select.appendChild(option);
      });
    }

    populateEpisodeSelect(episodes);

    // Match count
    const matchCount = document.createElement("span");
    matchCount.id = "match-count";
    matchCount.style.marginLeft = "1em";
    matchCount.style.fontSize = "1rem";
    controls.appendChild(matchCount);

    // Insert controls above the root element
    const rootElem = document.getElementById("root");
    rootElem.parentNode.insertBefore(controls, rootElem);

    function update(filteredEpisodes) {
      makePageForEpisodes(filteredEpisodes);
      matchCount.textContent = `Displaying ${filteredEpisodes.length}/${episodes.length} episodes.`;
    }

    episodeSearchInput.addEventListener("input", function (event) {
      const searchTerm = event.target.value.toLowerCase().trim();
      const filteredEpisodes = episodes.filter(
        (episode) =>
          episode.name.toLowerCase().includes(searchTerm) ||
          episode.summary?.toLowerCase().includes(searchTerm)
      );
      update(filteredEpisodes);
      select.value = "";
    });

    select.addEventListener("change", function (event) {
      const selectedIndex = event.target.value;
      if (selectedIndex === "") {
        update(episodes);
        return;
      }
      const selectedEpisode = [episodes[selectedIndex]];
      update(selectedEpisode);
      episodeSearchInput.value = "";
    });

    update(episodes);
  } else {
    // If no episodes, just add controls without episode-specific elements
    const rootElem = document.getElementById("root");
    rootElem.parentNode.insertBefore(controls, rootElem);
  }
}

async function loadShows() {
  if (cache.shows) return cache.shows;
  const response = await fetch("https://api.tvmaze.com/shows");
  if (!response.ok) throw new Error("Network response was not ok");
  const shows = await response.json();
  shows.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );
  cache.shows = shows; // Cache the shows
  return shows;
}
async function loadEpisodesForShow(showId) {
  if (cache.episodes[showId]) {
    makePageForEpisodes(cache.episodes[showId]);
    setup(shows, cache.episodes[showId]);
    return;
  }
  showMessage("Loading episodes...");
  try {
    const response = await fetch(
      `https://api.tvmaze.com/shows/${showId}/episodes`
    );
    if (!response.ok) throw new Error("Network response was not ok");
    const episodes = await response.json();

    cache.episodes[showId] = episodes; // Cache the episodes for this show
    const shows = await loadShows();
    setup(shows, episodes);
  } catch (error) {
    showMessage("Error loading episodes. Please try again later.", true);
  }
}

window.onload = async function () {
  showMessage("Loading shows...");
  try {
    const shows = await loadShows();
    setup(shows);
    // Clear the loading message
    const rootElem = document.getElementById("root");
    rootElem.innerHTML = "";
  } catch (error) {
    showMessage("Error loading shows. Please try again later.", true);
  }
};
