const fs = require("fs");
const fetch = require("node-fetch");
require("dotenv").config();

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TOKEN = process.env.TWITCH_TOKEN;

const gamesFile = "./games-3.json";

async function fetchGameData(name) {
  try {
    const response = await fetch(
      "https://api.igdb.com/v4/games",
      {
        method: "POST",
        headers: {
          "Client-ID": CLIENT_ID,
          "Authorization": `Bearer ${TOKEN}`,
          "Content-Type": "text/plain"
        },
        body: `
          search "${name}";
          fields name,cover.url;
          limit 1;
        `
      }
    );

    if (!response.ok) {
      console.error(
        `Erro IGDB (${response.status}) para ${name}`
      );
      return null;
    }

    const data = await response.json();

    if (!data.length) {
      return null;
    }

    return data[0];

  } catch (error) {

    console.error(
      `Erro ao consultar IGDB para ${name}:`,
      error.message
    );

    return null;
  }
}

async function generate() {

  if (!fs.existsSync(gamesFile)) {

    console.error(
      `Arquivo não encontrado: ${gamesFile}`
    );

    return;
  }

  const games = JSON.parse(
    fs.readFileSync(gamesFile, "utf8")
  );

  let updatedCount = 0;

  for (const game of games) {

    // Já possui capa
    if (
      game.coverUrl &&
      game.coverUrl.trim() !== ""
    ) {

      console.log(
        `✔ Já possui capa: ${game.Nome}`
      );

      continue;
    }

    console.log(
      `🔍 Procurando capa: ${game.Nome}`
    );

    const data =
      await fetchGameData(game.Nome);

    if (!data?.cover?.url) {

      console.log(
        `❌ Não encontrado: ${game.Nome}`
      );

      continue;
    }

    game.coverUrl =
      `https:${data.cover.url.replace(
        "t_thumb",
        "t_cover_big"
      )}`;

    updatedCount++;

    console.log(
      `✅ Capa encontrada: ${game.Nome}`
    );

    // Evita atingir limite da API
    await new Promise(
      resolve => setTimeout(resolve, 300)
    );
  }

  fs.writeFileSync(
    gamesFile,
    JSON.stringify(games, null, 2),
    "utf8"
  );

  console.log(
    `🎉 Atualização concluída! ${updatedCount} jogos atualizados.`
  );
}

generate();