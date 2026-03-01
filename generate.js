const fetch = require("node-fetch");
const fs = require("fs");
require("dotenv").config();

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const SHEET_URL = process.env.SHEET_URL;

async function getAccessToken() {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" }
  );

  const data = await res.json();
  return data.access_token;
}

async function getCover(gameName, token) {
  const res = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": CLIENT_ID,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "text/plain"
    },
    body: `fields name,cover.image_id; search "${gameName}"; limit 1;`
  });

  const data = await res.json();

  if (data.length && data[0].cover) {
    const imageId = data[0].cover.image_id;
    return `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;
  }

  return null;
}

async function main() {
  const token = await getAccessToken();

  const sheetRes = await fetch(SHEET_URL);
  const sheetData = await sheetRes.json();

  const finalGames = [];

  for (const game of sheetData) {
    console.log("Buscando capa:", game.Nome);

    const coverUrl = await getCover(game.Nome, token);

    finalGames.push({
      Nome: game.Nome,
      Plataforma: game.Plataforma,
      Genero: game.Gênero,
      Fonte: game.Fonte,
      coverUrl
    });
  }

  fs.writeFileSync("./public/games.json", JSON.stringify(finalGames, null, 2));

  console.log("✅ games.json atualizado com sucesso!");
}

main();