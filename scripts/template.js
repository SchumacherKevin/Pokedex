export function generatePokemonCardHTML(pokemon) {
  const typesHTML = pokemon.types
    .map((typeEntry) => `
      <span class="type-badge ${typeEntry.type.name}">
        ${typeEntry.type.name}
      </span>
    `)
    .join(" ");

  return `
    <div class="pokemon-card-header">
      <h3>#${pokemon.id.toString().padStart(3, "0")} <br> ${pokemon.name}</h3>
      ${typesHTML}
    </div>
    <div class="pokemon-card-img">
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
    </div>
  `;
}

export function generatePokemonDetailHTML(pokemon, evolutionHTML) {
  const typesHTML = pokemon.types
    .map((typeEntry) => `
      <span class="type-badge ${typeEntry.type.name}">
        ${typeEntry.type.name}
      </span>
    `)
    .join(" ");

  return `
    <div class="pokemon-detail-header">
      <h2>#${pokemon.id.toString().padStart(3, "0")} ${pokemon.name}</h2>
      ${typesHTML}
    </div>

    <div class="pokemon-detail-img">
      <img src="${pokemon.sprites.other["official-artwork"].front_default}" alt="${pokemon.name}">
    </div>

    <div class="accordion">
      <button class="accordion-btn" onclick="toggleAccordion(this)">
        <span>Stats</span>
        <span class="accordion-arrow">▼</span>
      </button>
      <div class="accordion-body">
        <div class="stats-container">
          ${generateStatsHTML(pokemon)}
        </div>
      </div>
    </div>

    <div class="accordion">
      <button class="accordion-btn" onclick="toggleAccordion(this)">
        <span>Evolution</span>
        <span class="accordion-arrow">▼</span>
      </button>
      <div class="accordion-body">
        <div class="evolution-chain">
          ${evolutionHTML}
        </div>
      </div>
    </div>
  `;
}

export function generateStatsHTML(pokemon) {
  return pokemon.stats
    .map((statEntry) => {
      const value = statEntry.base_stat;
      const percent = Math.min((value / 255) * 100, 100);

      return `
        <div class="stat-row">
          <div class="stat-name">${formatStatName(statEntry.stat.name)}</div>
          <div class="stat-value">${value}</div>
          <div class="stat-bar">
            <div class="stat-fill" style="width: 0%" data-width="${percent}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

export function generateEvolutionItemHTML(pokemon) {
  return `
    <div class="evo-item">
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
      <p>${pokemon.name}</p>
    </div>
  `;
}

export function formatStatName(name) {
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
