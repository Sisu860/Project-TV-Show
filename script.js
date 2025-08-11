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
  console.log(
    "Setup called with:",
    shows.length,
    "shows and",
    episodes?.length || 0,
    "episodes"
  );

  // Remove existing controls if they exist
  const existingControls = document.querySelector(
    "div[style*='display: flex']"
  );
  if (existingControls) {
    existingControls.remove();
  }

  // ==================== UNIFIED CONTROLS ====================
  // Create controls container with new order: Episode dropdown → Show dropdown → Search bar
  const controls = document.createElement("div");
  controls.className = "unified-controls";
  controls.style.display = "flex";
  controls.style.justifyContent = "flex-start";
  controls.style.alignItems = "center";
  controls.style.gap = "1em";
  controls.style.margin = "1em";

  // 1. EPISODE SELECT DROPDOWN (leftmost)
  const episodeSelect = document.createElement("select");
  episodeSelect.id = "episode-select";
  episodeSelect.style.padding = "0.5em";
  episodeSelect.style.fontSize = "1rem";
  episodeSelect.style.minWidth = "200px";
  controls.appendChild(episodeSelect);

  // 2. SHOW SELECT DROPDOWN (middle)
  const showSelect = document.createElement("select");
  showSelect.id = "show-select";
  showSelect.style.padding = "0.5em";
  showSelect.style.fontSize = "1rem";
  showSelect.style.minWidth = "200px";
  controls.appendChild(showSelect);

  // 3. UNIFIED SEARCH BAR (rightmost)
  const unifiedSearchInput = document.createElement("input");
  unifiedSearchInput.type = "text";
  unifiedSearchInput.id = "unified-search-input";
  unifiedSearchInput.placeholder = "Search shows or episodes...";
  unifiedSearchInput.style.padding = "0.5em";
  unifiedSearchInput.style.width = "300px";
  unifiedSearchInput.style.fontSize = "1rem";
  controls.appendChild(unifiedSearchInput);

  // 4. MATCH COUNT (far right)
  const matchCount = document.createElement("span");
  matchCount.id = "match-count";
  matchCount.style.marginLeft = "1em";
  matchCount.style.fontSize = "1rem";
  controls.appendChild(matchCount);

  // Insert controls above the root element
  const rootElem = document.getElementById("root");
  rootElem.parentNode.insertBefore(controls, rootElem);

  // ==================== POPULATION FUNCTIONS ====================

  // Function to populate show dropdown
  function populateShowSelect(showsToDisplay) {
    showSelect.innerHTML = "";

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

  // Function to populate episode dropdown
  function populateEpisodeSelect(episodesToDisplay) {
    console.log(
      "Populating episode dropdown with:",
      episodesToDisplay?.length || 0,
      "episodes"
    );
    episodeSelect.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent =
      episodesToDisplay && episodesToDisplay.length > 0
        ? "Select an episode..."
        : "No episodes available";
    episodeSelect.appendChild(defaultOption);

    if (episodesToDisplay && episodesToDisplay.length > 0) {
      episodesToDisplay.forEach((episode, idx) => {
        const option = document.createElement("option");
        option.value = idx;
        option.textContent = `S${pad(episode.season)}E${pad(
          episode.number
        )} - ${episode.name}`;
        episodeSelect.appendChild(option);
      });
      console.log("Added", episodesToDisplay.length, "episodes to dropdown");
    }
  }

  // Function to update display and count
  function updateDisplay(filteredEpisodes) {
    if (filteredEpisodes && filteredEpisodes.length > 0) {
      makePageForEpisodes(filteredEpisodes);
      matchCount.textContent = `Displaying ${filteredEpisodes.length}/${
        episodes ? episodes.length : 0
      } episodes.`;
    } else if (episodes && episodes.length > 0) {
      makePageForEpisodes(episodes);
      matchCount.textContent = `Displaying ${episodes.length}/${episodes.length} episodes.`;
    } else {
      matchCount.textContent = "Select a show to view episodes.";
    }
  }

  // Initial population
  populateShowSelect(shows);
  populateEpisodeSelect(episodes);
  updateDisplay(episodes);

  // ==================== EVENT LISTENERS ====================

  // Unified search - searches both shows and episodes
  unifiedSearchInput.addEventListener("input", function (event) {
    const searchTerm = event.target.value.toLowerCase().trim();

    if (!episodes || episodes.length === 0) {
      // If no episodes loaded, search shows only
      const filteredShows = shows.filter((show) =>
        show.name.toLowerCase().includes(searchTerm)
      );
      populateShowSelect(filteredShows);
    } else {
      // If episodes are loaded, search episodes
      const filteredEpisodes = episodes.filter(
        (episode) =>
          episode.name.toLowerCase().includes(searchTerm) ||
          episode.summary?.toLowerCase().includes(searchTerm)
      );
      populateEpisodeSelect(filteredEpisodes);
      updateDisplay(filteredEpisodes);
      episodeSelect.value = "";
    }
  });

  // Show selection event
  showSelect.addEventListener("change", function (event) {
    const selectedShowId = event.target.value;
    if (selectedShowId === "") {
      const rootElem = document.getElementById("root");
      rootElem.innerHTML = "";
      populateEpisodeSelect([]);
      updateDisplay([]);
      return;
    }
    loadEpisodesForShow(selectedShowId);
  });

  // Episode selection event
  episodeSelect.addEventListener("change", function (event) {
    const selectedIndex = event.target.value;
    console.log("Episode selected, index:", selectedIndex);

    if (selectedIndex === "" || !episodes || episodes.length === 0) {
      console.log("No valid episode selected, showing all episodes");
      updateDisplay(episodes);
      return;
    }

    const selectedEpisode = [episodes[parseInt(selectedIndex)]];
    console.log("Selected episode:", selectedEpisode[0]?.name);
    updateDisplay(selectedEpisode);
    unifiedSearchInput.value = "";
  });
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
// Test function to validate episode data structure
function validateEpisodeData(episodes) {
  if (!episodes || !Array.isArray(episodes)) {
    console.error("Episodes is not a valid array:", episodes);
    return false;
  }

  const firstEpisode = episodes[0];
  if (!firstEpisode) {
    console.error("No episodes in array");
    return false;
  }

  const requiredFields = ["name", "season", "number"];
  const missingFields = requiredFields.filter(
    (field) => !firstEpisode.hasOwnProperty(field)
  );

  if (missingFields.length > 0) {
    console.error("Missing required fields in episode data:", missingFields);
    return false;
  }

  console.log("Episode data validation passed. Sample episode:", {
    name: firstEpisode.name,
    season: firstEpisode.season,
    number: firstEpisode.number,
  });

  return true;
}

async function loadEpisodesForShow(showId) {
  console.log("Loading episodes for show ID:", showId);

  if (cache.episodes[showId]) {
    console.log(
      "Episodes found in cache:",
      cache.episodes[showId].length,
      "episodes"
    );
    const shows = await loadShows(); // Get shows from cache
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

    console.log("Loaded episodes from API:", episodes.length, "episodes");

    // Validate episode data structure
    if (!validateEpisodeData(episodes)) {
      throw new Error("Invalid episode data structure");
    }

    cache.episodes[showId] = episodes; // Cache the episodes for this show
    const shows = await loadShows();
    setup(shows, episodes);
  } catch (error) {
    console.error("Error loading episodes:", error);
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
