const fs = require("fs");
const fetch = require("node-fetch");

if (process.env.GITHUB_ACTIONS !== "true") {
  require("dotenv").config();
}

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

console.log("CLIENT_ID:", !!CLIENT_ID);
console.log("CLIENT_SECRET:", !!CLIENT_SECRET);

const SHEET_URL =
  "https://opensheet.elk.sh/1_YJy2GkrbkD6hpWd18whfSXklwGY2WPr3kgbQaQYdnM/jogos";

const GAMES_FILE = "./games-3.json";

async function getTwitchToken() {

  console.log("🔑 Obtendo token da Twitch...");

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`,
    {
      method: "POST"
    }
  );

  if (!response.ok) {

    throw new Error(
      `Erro ao gerar token Twitch (${response.status})`
    );
  }

  const data = await response.json();

  return data.access_token;
}

async function fetchGameData(name, token) {

  try {

    const safeName =
      name.replace(/"/g, '\\"');

    const response = await fetch(
      "https://api.igdb.com/v4/games",
      {
        method: "POST",
        headers: {
          "Client-ID": CLIENT_ID,
          "Authorization": `Bearer ${token}`,
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
      `❌ Falha ao consultar ${name}`
    );

    return null;
  }
}

async function generate() {

  if (!CLIENT_ID || !CLIENT_SECRET) {

    console.error(
      "❌ TWITCH_CLIENT_ID ou TWITCH_CLIENT_SECRET não configurados."
    );

    process.exit(1);
  }

  const token =
    await getTwitchToken();

  console.log(
    "📥 Carregando planilha..."
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

    if (!nome) continue;

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

    const key =
      `${nome}|${fonte}`
        .toLowerCase()
        .trim();

    // Mantém capa existente
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

    const gameData =
      await fetchGameData(
        nome,
        token
      );

    if (
      gameData?.cover?.url
    ) {

      coverUrl =
        `https:${gameData.cover.url.replace(
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
          350
        )
    );
  }

  fs.writeFileSync(
    GAMES_FILE,
    JSON.stringify(
      results,
      null,
      2
    ),
    "utf8"
  );

  console.log("");
  console.log("🎉 Biblioteca atualizada!");
  console.log(
    `📚 Total de jogos: ${results.length}`
  );
  console.log(
    `🆕 Jogos novos encontrados: ${newGames}`
  );
}

generate().catch(error => {

  console.error(
    "❌ Erro fatal:",
    error.message
  );

  process.exit(1);
});
