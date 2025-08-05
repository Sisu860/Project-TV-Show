function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  const episodesContainer = document.createElement("div");
  episodesContainer.id = "episodes-container";
  rootElem.appendChild(episodesContainer);

  function pad(num) {
    return num.toString().padStart(2, "0");
  }

  episodeList.forEach((episode) => {
    const card = document.createElement("div");
    card.className = "episode-card";

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

  // Attribution link at the bottom
  const credit = document.createElement("p");
  credit.style.textAlign = "center";
  credit.style.margin = "2em 0";
  credit.innerHTML = `Data originally from <a href="https://tvmaze.com/" target="_blank" rel="noopener noreferrer">TVMaze.com</a>`;
  rootElem.appendChild(credit);
}

function setupSearchInput(episodes) {
  const input = document.getElementById("search-input");
  const matchCount = document.getElementById("match-count");
  const selectOptions = document.getElementById("episode-select");
  const showAllBtn = document.getElementById("show-all-button");

  function pad(num) {
    return num.toString().padStart(2, "0");
  }

  function update(filteredEpisodes) {
    makePageForEpisodes(filteredEpisodes);
    matchCount.textContent = `${filteredEpisodes.length} of ${episodes.length} episodes match your search.`;
  }

  input.addEventListener("input", function (event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    const filteredEpisodes = episodes.filter(
      (episode) =>
        episode.name.toLowerCase().includes(searchTerm) ||
        episode.summary?.toLowerCase().includes(searchTerm)
    );
    update(filteredEpisodes);
    showAllBtn.style.display =
      filteredEpisodes.length < episodes.length ? "inline-block" : "none";
    selectOptions.value = "";
  });

  function populateSelectOptions() {
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select an episode...";
    selectOptions.appendChild(defaultOption);

    episodes.forEach((episode, index) => {
      const option = document.createElement("option");
      const code = `S${pad(episode.season)}E${pad(episode.number)}`;
      option.value = index;
      option.textContent = `${code} - ${episode.name}`;
      selectOptions.appendChild(option);
    });
  }
  selectOptions.addEventListener("change", function (event) {
    const selectedIndex = event.target.value;
    if (selectedIndex === "") return;

    const selectedEpisode = [episodes[selectedIndex]];
    update(selectedEpisode);
    showAllBtn.style.display = "inline-block";
    input.value = "";
  });

  showAllBtn.addEventListener("click", () => {
    update(episodes);
    input.value = "";
    selectOptions.value = "";
    showAllBtn.style.display = "none";
  });

  populateSelectOptions();
  update(episodes);
}

function setup() {
  const episodes = getAllEpisodes();
  makePageForEpisodes(episodes);
  setupSearchInput(episodes);
}

window.onload = setup;
