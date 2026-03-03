const grid = document.getElementById("grid");
const search = document.getElementById("search");

let jogos = [];

fetch("games.json")
  .then(res => res.json())
  .then(data => {
    jogos = data;
    render(jogos);
  });

function renderGames() {
  const searchTerm = searchInput.value.toLowerCase();
  const genreTerm = genreFilter.value;

  const selectedSources = Array.from(
    document.querySelectorAll(".source-checkbox:checked")
  ).map(cb => cb.value);

  gamesContainer.innerHTML = '';

  games
    .filter(game =>
      game.Name.toLowerCase().includes(searchTerm)
    )
    .filter(game =>
      !genreTerm || game.Genres?.includes(genreTerm)
    )
    .filter(game =>
      selectedSources.length === 0 ||
      selectedSources.includes(game.Source)
    )
    .forEach(game => {
      const config = storeConfig[game.Source] || {
        color: "#444",
        icon: ""
      };

      const gameDiv = document.createElement('div');
      gameDiv.className = 'game';

      gameDiv.innerHTML = `
        <img src="${game.cover || 'placeholder.jpg'}" alt="${game.Name}">
        <div class="game-title">${game.Name}</div>
        <div class="store-badge" style="background:${config.color}">
          ${config.icon ? `<img src="${config.icon}" />` : ""}
          ${game.Source}
        </div>
      `;

      gamesContainer.appendChild(gameDiv);
    });
}

const storeConfig = {
  Steam: {
    color: "#1b2838",
    icon: "https://cdn-icons-png.flaticon.com/512/5968/5968705.png"
  },
  Epic: {
    color: "#2a2a2a",
    icon: "https://cdn-icons-png.flaticon.com/512/5968/5968706.png"
  },
  Amazon: {
    color: "#ff9900",
    icon: "https://cdn-icons-png.flaticon.com/512/5968/5968866.png"
  },
  GOG: {
    color: "#86328a",
    icon: "https://cdn-icons-png.flaticon.com/512/5968/5968704.png"
  }
};

function renderSourceFilters(games) {
  const sourceContainer = document.getElementById("source-filters");
  const sources = [...new Set(games.map(game => game.Source))].sort();

  sourceContainer.innerHTML = '';

  sources.forEach(source => {
    const config = storeConfig[source] || {
      color: "#444",
      icon: ""
    };

    const label = document.createElement("label");
    label.className = "store-option";

    label.innerHTML = `
      <input type="checkbox" value="${source}" class="source-checkbox">
      <span class="store-tag" style="background:${config.color}">
        ${config.icon ? `<img src="${config.icon}" />` : ""}
        ${source}
      </span>
    `;

    sourceContainer.appendChild(label);
  });

  document.querySelectorAll(".source-checkbox").forEach(cb =>
    cb.addEventListener("change", renderGames)
  );
}


search.addEventListener("input", () => {
  const termo = search.value.toLowerCase();
  const filtrado = jogos.filter(j =>
    j.Nome.toLowerCase().includes(termo)
  );
  render(filtrado);
});


document
  .getElementById("select-all-sources")
  .addEventListener("click", () => {
    const checkboxes = document.querySelectorAll(".source-checkbox");
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);

    checkboxes.forEach(cb => cb.checked = !allChecked);
    renderGames();
  });