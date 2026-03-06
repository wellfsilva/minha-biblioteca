import fs from "fs";
import fetch from "node-fetch";
import path from "path";

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TOKEN = process.env.TWITCH_TOKEN;

const gamesFile = "./games.json";
const coversDir = "./public/covers";

if (!fs.existsSync(coversDir)) {
  fs.mkdirSync(coversDir, { recursive: true });
}

async function fetchGameData(name) {

  const response = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": CLIENT_ID,
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "text/plain"
    },
    body: `
      search "${name}";
      fields name, cover.url;
      limit 1;
    `
  });

  const data = await response.json();

  if (!data.length) return null;

  return data[0];
}

async function downloadCover(url, filename) {

  const filepath = path.join(coversDir, filename);

  // verifica se a capa já existe
  if (fs.existsSync(filepath)) {
    console.log(`✔ Cover já existe: ${filename}`);
    return;
  }

  const fullUrl = url.replace("t_thumb", "t_cover_big");

  const res = await fetch(`https:${fullUrl}`);
  const buffer = await res.arrayBuffer();

  fs.writeFileSync(filepath, Buffer.from(buffer));

  console.log(`⬇ Downloaded: ${filename}`);
}

async function generate() {

  const games = JSON.parse(fs.readFileSync(gamesFile));

  const results = [];

  for (const game of games) {

    const data = await fetchGameData(game.Nome || game.name);

    if (!data) {
      console.log(`❌ Não encontrado: ${game.Nome}`);
      continue;
    }

    let coverFile = "";

    if (data.cover?.url) {

      coverFile = `${(game.Nome || game.name)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")}.jpg`;

      await downloadCover(data.cover.url, coverFile);
    }

    results.push({
      name: data.name,
      plataforma: game.Plataforma,
      genero: game.Gênero,
      fonte: game.Fonte,
      cover: `covers/${coverFile}`
    });

    // pequeno delay para evitar limite da API
    await new Promise(r => setTimeout(r, 300));
  }

  fs.writeFileSync(
    "./public/games.json",
    JSON.stringify(results, null, 2)
  );

  console.log("✅ Catálogo atualizado!");
}

generate();
