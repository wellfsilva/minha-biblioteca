async function generate() {

  const games = JSON.parse(fs.readFileSync(gamesFile));

  // Carrega cache existente
  let existingGames = [];

  if (fs.existsSync("./public/games-3.json")) {
    existingGames = JSON.parse(
      fs.readFileSync("./public/games-3.json", "utf8")
    );
  }

  console.log(
    `📦 Cache carregado: ${existingGames.length} jogos`
  );

  // Índice rápido
  const cacheMap = new Map();

  existingGames.forEach(game => {

    const key =
      `${game.Nome}|${game.Fonte}`
        .toLowerCase()
        .trim();

    cacheMap.set(key, game);
  });

  const results = [];

  for (const game of games) {

    const gameName = game.Nome || game.name;

    const cacheKey =
      `${gameName}|${game.Fonte}`
        .toLowerCase()
        .trim();

    // ✔ Jogo já existe no cache
    if (cacheMap.has(cacheKey)) {

      const cachedGame = cacheMap.get(cacheKey);

      results.push({
        Nome: game.Nome,
        Plataforma: game.Plataforma || "",
        Genero: game.Genero || game.Gênero || "",
        Fonte: game.Fonte || "",
        coverUrl: cachedGame.coverUrl || null
      });

      console.log(`✔ Cache: ${gameName}`);

      continue;
    }

    // 🔍 Novo jogo
    console.log(`🔍 Novo jogo: ${gameName}`);

    const data = await fetchGameData(gameName);

    if (!data) {

      console.log(
        `❌ Não encontrado: ${gameName}`
      );

      continue;
    }

    let coverFile = "";

    if (data.cover?.url) {

      coverFile =
        gameName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          + ".jpg";

      await downloadCover(
        data.cover.url,
        coverFile
      );
    }

    results.push({
      Nome: game.Nome,
      Plataforma: game.Plataforma || "",
      Genero: game.Genero || game.Gênero || "",
      Fonte: game.Fonte || "",
      coverUrl: data.cover?.url
        ? `https:${data.cover.url.replace("t_thumb", "t_cover_big")}`
        : null
    });

    // evita limite da API
    await new Promise(r =>
      setTimeout(r, 300)
    );
  }

  fs.writeFileSync(
    "./public/games-3.json",
    JSON.stringify(results, null, 2)
  );

  console.log(
    `✅ Catálogo atualizado (${results.length} jogos)`
  );
  }

  generate();