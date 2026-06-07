const fs = require("fs");
const fetch = require("node-fetch");
require("dotenv").config();

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TOKEN = process.env.TWITCH_TOKEN;

const SHEET_URL =
  "https://opensheet.elk.sh/1_YJy2GkrbkD6hpWd18whfSXklwGY2WPr3kgbQaQYdnM/jogos";

const GAMES_FILE = "./games-3.json";

if (!CLIENT_ID || !TOKEN) {
  console.error(
    "❌ TWITCH_CLIENT_ID ou TWITCH_TOKEN não configurados."
  );
  process.exit(1);
}

async function fetchGameData(name) {

  try {

    const safeName =
      name.replace(/"/g, '\\"');

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
          search "${safeName}";
          fields name,cover.url;
          limit 1;
        `
      }
    );

    if (!response.ok) {

      console.log(
        `❌ Erro IGDB (${response.status}) - ${name}`
      );

      return null;
    }

    const data =
      await response.json();

    return data.length
      ? data[0]
      : null;

  } catch (error) {

    console.log(
      `❌ Erro ao consultar ${name}`
    );

    return null;
  }
}

async function generate() {

  console.log(
    "📥 Baixando planilha..."
  );

  const sheetResponse =
    await fetch(SHEET_URL);

  const sheetGames =
    await sheetResponse.json();

  console.log(
    `📚 ${sheetGames.length} jogos encontrados na planilha`
  );

  let existingGames = [];

  if (
    fs.existsSync(GAMES_FILE)
  ) {

    existingGames =
      JSON.parse(
        fs.readFileSync(
          GAMES_FILE,
          "utf8"
        )
      );
  }

  console.log(
    `📦 ${existingGames.length} jogos encontrados no cache`
  );

  const cacheMap =
    new Map();

  existingGames.forEach(game => {

    const key =
      `${game.Nome}|${game.Fonte}`
        .toLowerCase()
        .trim();

    cacheMap.set(key, game);
  });

  const results = [];

  let newGames = 0;

  for (const sheetGame of sheetGames) {

    const nome =
      sheetGame.Nome?.trim();

    const genero =
      sheetGame.Genero ||
      sheetGame.Gênero ||
      "";

    const plataforma =
      sheetGame.Plataforma ||
      "";

    const fonte =
      sheetGame.Fonte ||
      "";

    if (!nome) continue;

    const key =
      `${nome}|${fonte}`
        .toLowerCase()
        .trim();

    // Jogo já existe
    if (
      cacheMap.has(key)
    ) {

      const cached =
        cacheMap.get(key);

      results.push({
        Nome: nome,
        Plataforma: plataforma,
        Genero: genero,
        Fonte: fonte,
        coverUrl:
          cached.coverUrl || null
      });

      continue;
    }

    newGames++;

    console.log(
      `🔍 Novo jogo: ${nome}`
    );

    let coverUrl = null;

    const data =
      await fetchGameData(nome);

    if (
      data?.cover?.url
    ) {

      coverUrl =
        `https:${data.cover.url.replace(
          "t_thumb",
          "t_cover_big"
        )}`;

      console.log(
        `✅ Capa encontrada`
      );

    } else {

      console.log(
        `⚠ Sem capa`
      );
    }

    results.push({
      Nome: nome,
      Plataforma: plataforma,
      Genero: genero,
      Fonte: fonte,
      coverUrl
    });

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          300
        )
    );
  }

  fs.writeFileSync(
    GAMES_FILE,
    JSON.stringify(
      results,
      null,
      2
    )
  );

  console.log(
    `🎉 Biblioteca atualizada`
  );

  console.log(
    `📚 Total: ${results.length}`
  );

  console.log(
    `🆕 Novos jogos: ${newGames}`
  );
}

generate();
