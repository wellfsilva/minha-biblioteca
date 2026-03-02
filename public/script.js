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
      <img src="${jogo.coverUrl || 'https://placehold.co/600x400?text=Sem+Capa'}">
      <p>${jogo.Nome}</p>
    `;

    grid.appendChild(card);
  });
}

search.addEventListener("input", () => {
  const termo = search.value.toLowerCase();
  const filtrado = jogos.filter(j =>
    j.Nome.toLowerCase().includes(termo)
  );
  render(filtrado);
});
