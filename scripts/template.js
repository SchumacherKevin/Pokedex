// =========================
// HTML GENERATION FUNCTIONS
// =========================
function generatePokemonCardHTML(pokemon) {
  const typesHTML = pokemon.types
    .map(
      (typeEntry) =>
        `<span class="type-badge ${typeEntry.type.name}">
          ${typeEntry.type.name}
        </span>`,
    )
    .join(" ");

  return `
    <div class="pokemon-card-header">
      <h3>#${pokemon.id.toString().padStart(3, "0")} ${pokemon.name}</h3>
      ${typesHTML}
    </div>

    <div class="pokemon-card-img">
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
    </div>
  `;
}

// =========================
// DETAIL VIEW
// =========================
function generatePokemonDetailHTML(pokemon, evolutionHTML) {
  const typesHTML = pokemon.types
    .map(
      (typeEntry) =>
        `<span class="type-badge ${typeEntry.type.name}">
          ${typeEntry.type.name}
        </span>`,
    )
    .join(" ");

  return `
    <div class="pokemon-detail-header">
      <h2>#${pokemon.id.toString().padStart(3, "0")} ${pokemon.name}</h2>
      ${typesHTML}
    </div>

    <div class="pokemon-detail-img">
      <img src="${pokemon.sprites.other["official-artwork"].front_default}" 
           alt="${pokemon.name}">
    </div>

    <h3>Stats</h3>
    <div class="stats-container">
      ${generateStatsHTML(pokemon)}
    </div>

    <h3>Evolution</h3>
    <div class="evolution-chain">
      ${evolutionHTML}
    </div>
  `;
}

// =========================
// STATS (FIXED + IMPROVED)
// =========================
function generateStatsHTML(pokemon) {
  return pokemon.stats
    .map((statEntry) => {
      const value = statEntry.base_stat;

      const percent = Math.min((value / 255) * 100, 100);

      return `
        <div class="stat-row">
          <div class="stat-name">${formatStatName(statEntry.stat.name)}</div>
            <div class="stat-value">${value}</div>
          <div class="stat-bar">
            <div class="stat-fill" style="width:0%" data-width="${percent}%"></div>
          </div>

        </div>
      `;
    })
    .join("");
}

// =========================
// EVOLUTION
// =========================
function generateEvolutionItemHTML(pokemon) {
  return `
    <div class="evo-item">
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
      <p>${pokemon.name}</p>
    </div>
  `;
}

// =========================
// HELPER
// =========================
function formatStatName(name) {
  const map = {
    hp: "HP",
    attack: "ATK",
    defense: "DEF",
    "special-attack": "SP-ATK",
    "special-defense": "SP-DEF",
    speed: "SPD",
  };

  return map[name] || name.toUpperCase();
}

// =========================
// ANIMATE STATS (WICHTIG)
// =========================
function animateStats() {
  const bars = document.querySelectorAll(".stat-fill");

  bars.forEach((bar) => {
    const width = bar.getAttribute("data-width");

    setTimeout(() => {
      bar.style.width = width;
    }, 100);
  });
}
