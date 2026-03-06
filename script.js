const gamesContainer = document.getElementById("gamesContainer");
const searchInput = document.getElementById("searchInput");

// 🔹 Configuração das lojas (cores + ícones)
const storeConfig = {
  Steam: {
    color: "#1b2838",
    icon: "https://wellfsilva.github.io/minha-biblioteca/lojas/steam_white.svg"
  },
  "Steam Family": {
    color: "#294b63",
    icon: "https://wellfsilva.github.io/minha-biblioteca/lojas/steam_white.svg"
  },
  Epic: {
    color: "#2a2a2a",
    icon: "https://wellfsilva.github.io/minha-biblioteca/lojas/epic_white.svg"
  },
  Amazon: {
    color: "#ff9900",
    icon: "https://wellfsilva.github.io/minha-biblioteca/lojas/amazon_games_white.svg"
  },
  GOG: {
    color: "#86328a",
    icon: "https://wellfsilva.github.io/minha-biblioteca/lojas/gog_white.svg"
  },
  EA: {
    color: "#0055ff",
    icon: "https://wellfsilva.github.io/minha-biblioteca/lojas/ea_white.svg"
  },
  Ubisoft: {
    color: "#e82e53",
    icon: "https://wellfsilva.github.io/minha-biblioteca/lojas/ubisoft_white.svg"
  },
  Switch: {
    color: "#e60012",
    icon: "https://wellfsilva.github.io/minha-biblioteca/lojas/switch_white.svg"
  }
};

let games = [];

// 🔹 Carrega JSON
fetch("https://wellfsilva.github.io/minha-biblioteca/games-3.json")
  .then(res => res.json())
  .then(data => {
    games = data || [];
    renderSourceFilters(games);
    renderGames();
  })
  .catch(err => {
    console.error("Erro ao carregar games.json:", err);
  });

const clearBtn = document.getElementById("clearSearch");

// 🔹 Filtro por nome
searchInput.addEventListener("input", () => {

  // mostra ou esconde botão X
  clearBtn.style.display = searchInput.value ? "block" : "none";

  renderGames();
});

// 🔹 botão limpar busca
clearBtn.addEventListener("click", () => {

  searchInput.value = "";
  clearBtn.style.display = "none";

  renderGames();
});

// 🔹 Renderiza filtros de fontes
function renderSourceFilters(games) {
  const sourceContainer = document.getElementById("source-filters");

  const sources = [
    ...new Set(
      games
        .map(game => game.Fonte)
        .filter(Boolean)
    )
  ].sort();

  sourceContainer.innerHTML = '';

  sources.forEach(source => {
    const config = storeConfig[source] || { color: "#444", icon: "" };

    const label = document.createElement("label");
    label.className = "store-option";

    label.innerHTML = `
      <input type="checkbox" value="${source}" class="source-checkbox">
      <span class="store-tag" style="boder:1px solid ${config.color}">
        ${config.icon ? `<img class="icon" src="${config.icon}" />` : ""}
        ${source}
      </span>
    `;

    sourceContainer.appendChild(label);
  });

  document.querySelectorAll(".source-checkbox").forEach(cb =>
    cb.addEventListener("change", renderGames)
  );
}

// 🔹 Botão Selecionar Todos
document
  .getElementById("select-all-sources")
  ?.addEventListener("click", () => {

    const checkboxes = document.querySelectorAll(".source-checkbox");
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);

    checkboxes.forEach(cb => cb.checked = !allChecked);
    renderGames();
  });

// 🔹 Renderiza jogos
function renderGames() {
  const searchTerm = (searchInput.value || "")
    .toLowerCase()
    .trim();

  const selectedSources = Array.from(
    document.querySelectorAll(".source-checkbox:checked")
  ).map(cb => cb.value);

  gamesContainer.innerHTML = '';

  games
    .filter(game => {
      const nome = (game.Nome || "").toLowerCase();
      return nome.includes(searchTerm);
    })
    .filter(game => {
      if (selectedSources.length === 0) return true;
      return selectedSources.includes(game.Fonte);
    })
    .forEach(game => {

      const config = storeConfig[game.Fonte] || {
        color: "#444",
        icon: ""
      };

      const gameDiv = document.createElement("div");
      gameDiv.className = "game";

      gameDiv.innerHTML = `
        <img src="${game.coverUrl || 'https://placehold.co/300x400/283228/283228/png'}" 
             alt="${game.Nome || 'Sem nome'}">
             
        <div class="game-title">
          ${game.Nome || "Sem nome"}
        </div>

        <div class="store-badge" style="background:${config.color}">
          ${config.icon ? `<img src="${config.icon}" />` : ""}
          <span>${game.Fonte || "Desconhecida"}</span>
        </div>
      `;

      gamesContainer.appendChild(gameDiv);
    });
}