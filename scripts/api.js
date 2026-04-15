// ============================================================
// KONSTANTEN & CACHE – Basis-URL und In-Memory-Zwischenspeicher
// ============================================================

// Basis-URL für alle Einzelabrufe von Pokémon-Daten
const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/pokemon";

// Map als einfacher In-Memory-Cache: Pokémon werden nach ID und Name gespeichert,
// damit wiederholte Requests dieselben Daten nicht erneut vom Server laden
const cachedPokemons = new Map();

// ============================================================
// EXPORT: fetchAllPokemons – Alle Pokémon-Namen vorab laden
// ============================================================

// Lädt die komplette Namensliste (name + url) aller Pokémon.
// Wird einmalig beim App-Start aufgerufen und für die clientseitige Suche benötigt.
export async function fetchAllPokemons(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch all Pokémon");
  const data = await response.json();
  return data.results; // Array aus { name, url }
}

// ============================================================
// EXPORT: fetchPokemonData – Einzelnes Pokémon laden (mit Cache)
// ============================================================

// Akzeptiert entweder eine vollständige URL oder einen Namen/eine ID.
// Gibt gecachte Daten zurück, wenn das Pokémon bereits geladen wurde.
export async function fetchPokemonData(identifier) {
  const isFullUrl = typeof identifier === "string" && identifier.startsWith("http");

  // Cache-Treffer prüfen – verhindert doppelte API-Calls
  const cached = getCachedPokemon(identifier, isFullUrl);
  if (cached) return cached;

  // URL zusammenbauen: entweder direkt verwenden oder aus Name/ID ableiten
  const apiUrl = isFullUrl
    ? identifier
    : `${POKEAPI_BASE_URL}/${identifier.toString().toLowerCase()}`;

  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error(`Pokémon not found: ${identifier}`);
  const pokemonData = await response.json();

  // Ergebnis cachen und zurückgeben
  cachePokemon(pokemonData);
  return pokemonData;
}

// ============================================================
// INTERN: getCachedPokemon – Pokémon aus dem Cache lesen
// ============================================================

// Sucht nach einem gecachten Eintrag. Bei vollständigen URLs wird die ID
// aus der URL extrahiert; sonst wird nach Name oder numerischer ID gesucht.
function getCachedPokemon(identifier, isFullUrl) {
  if (isFullUrl) {
    const id = extractPokemonIdFromUrl(identifier);
    return cachedPokemons.get(id) || null;
  }
  return (
    cachedPokemons.get(identifier.toString().toLowerCase()) ||
    cachedPokemons.get(Number(identifier)) ||
    null
  );
}

// ============================================================
// INTERN: cachePokemon – Pokémon in den Cache schreiben
// ============================================================

// Speichert ein Pokémon doppelt: einmal per numerischer ID und einmal per Name.
// So kann es später flexibel über beide Schlüssel abgerufen werden.
function cachePokemon(pokemonData) {
  cachedPokemons.set(pokemonData.id, pokemonData);
  cachedPokemons.set(pokemonData.name.toLowerCase(), pokemonData);
}

// ============================================================
// EXPORT: extractPokemonIdFromUrl – ID aus PokeAPI-URL auslesen
// ============================================================

// Extrahiert die numerische Pokémon-ID aus einer URL wie
// „https://pokeapi.co/api/v2/pokemon/25/" → 25
export function extractPokemonIdFromUrl(url) {
  const match = url.match(/\/pokemon\/(\d+)\/?$/);
  return match ? parseInt(match[1], 10) : null;
}
