const grid = document.getElementById("grid");
const search = document.getElementById("search");

let jogos = [];

fetch("games.json")
  .then(res => res.json())
  .then(data => {
    jogos = data;
    render(jogos);
  });

function render(lista) {
  grid.innerHTML = "";

  lista.forEach(jogo => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${jogo.coverUrl || 'https://placehold.co/300x400?text=Sem+Capa'}">
      <p>${jogo.Nome}</p>
    `;

    grid.appendChild(card);
  });
}

function renderSourceFilters(games) {
  const sourceContainer = document.getElementById("source-filters");

  // Pega todas as fontes únicas
  const sources = [...new Set(games.map(game => game.Source))].sort();

  sourceContainer.innerHTML = '';

  sources.forEach(source => {
    const label = document.createElement("label");
    label.style.marginRight = "10px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = source;
    checkbox.classList.add("source-checkbox");

    checkbox.addEventListener("change", renderGames);

    label.appendChild(checkbox);
    label.append(` ${source}`);

    sourceContainer.appendChild(label);
  });
}

search.addEventListener("input", () => {
  const termo = search.value.toLowerCase();
  const filtrado = jogos.filter(j =>
    j.Nome.toLowerCase().includes(termo)
  );
  render(filtrado);
});
