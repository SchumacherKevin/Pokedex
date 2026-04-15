// ============================================================
// EXPORT: generatePokemonCardHTML – HTML für eine Pokémon-Karte erzeugen
// ============================================================

// Gibt den inneren HTML-String einer Pokémon-Karte zurück.
// Typen werden als farbige Badges mit der passenden CSS-Klasse aus pokemontypes.css gerendert.
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

// ============================================================
// EXPORT: generatePokemonDetailHTML – HTML für den Detail-Dialog erzeugen
// ============================================================

// Baut den vollständigen Inhalt des Detail-Dialogs zusammen.
// Enthält Header mit Typen, das hochauflösende Artwork sowie zwei Akkordeons
// für Stats und die Evolutionskette. Das evolutionHTML-Fragment wird von
// getEvolutionChain() (ui.js) asynchron vorbereitet und hier eingesetzt.
export function generatePokemonDetailHTML(pokemon, evolutionHTML) {
  const typesHTML = pokemon.types
    .map((typeEntry) => `
      <div class="type-badge ${typeEntry.type.name}">
        ${typeEntry.type.name}
      </div>
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

// ============================================================
// EXPORT: generateStatsHTML – Balkendiagramm für alle Basiswerte
// ============================================================

// Erzeugt für jeden Stat eine Zeile mit Name, Zahlenwert und einem animierten
// Fortschrittsbalken. Der tatsächliche Prozentwert wird als data-width-Attribut
// gespeichert und erst beim Öffnen des Akkordeons per JS gesetzt (CSS-Animation).
export function generateStatsHTML(pokemon) {
  return pokemon.stats
    .map((statEntry) => {
      const value = statEntry.base_stat;
      // Maximalwert 255 (höchster möglicher Basiswert in den Pokémon-Spielen)
      const percent = Math.min((value / 255) * 100, 100);

      return `
        <div class="stat-row">
          <div class="stat-name">${formatStatName(statEntry.stat.name)}</div>
          <div class="stat-value">${value}</div>
          <div class="stat-bar">
            <!-- Balken startet bei 0%, wird per JS auf data-width animiert -->
            <div class="stat-fill" style="width: 0%" data-width="${percent}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

// ============================================================
// EXPORT: generateEvolutionItemHTML – HTML für ein Evolutionselement
// ============================================================

// Erzeugt das HTML für ein einzelnes Pokémon innerhalb der Evolutionskette
// (Sprite + Name). Die Verkettung mit Pfeilen übernimmt renderEvolutionChain() in ui.js.
export function generateEvolutionItemHTML(pokemon) {
  return `
    <div class="evo-item">
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
      <p>${pokemon.name}</p>
    </div>
  `;
}

// ============================================================
// EXPORT: formatStatName – Interne Stat-Bezeichnung lesbar machen
// ============================================================

// Wandelt die API-Bezeichnungen (z. B. „special-attack") in kompakte
// Kürzel für die Anzeige um (z. B. „SP-ATK").
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
