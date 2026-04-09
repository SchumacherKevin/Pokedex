const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/pokemon";
const cachedPokemons = new Map();

export async function fetchAllPokemons(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch all Pokémon");
  const data = await response.json();
  return data.results;
}

export async function fetchPokemonData(identifier) {
  const isFullUrl =
    typeof identifier === "string" && identifier.startsWith("http");

  const cached = getCachedPokemon(identifier, isFullUrl);
  if (cached) return cached;

  const apiUrl = isFullUrl
    ? identifier
    : `${POKEAPI_BASE_URL}/${identifier.toString().toLowerCase()}`;

  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error(`Pokémon not found: ${identifier}`);
  const pokemonData = await response.json();

  cachePokemon(pokemonData);
  return pokemonData;
}

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

function cachePokemon(pokemonData) {
  cachedPokemons.set(pokemonData.id, pokemonData);
  cachedPokemons.set(pokemonData.name.toLowerCase(), pokemonData);
}

export function extractPokemonIdFromUrl(url) {
  const match = url.match(/\/pokemon\/(\d+)\/?$/);
  return match ? parseInt(match[1], 10) : null;
}
