import { fetchPokemonData } from "./api.js";
import {
  clearGrid,
  showNoResults,
  renderPokemonList,
  toggleLoading,
} from "./ui.js";

export async function initSearchPokemon(
  query,
  allPokemons,
  displayedPokemons,
  setIndex,
  openDetailFn,
) {
  if (!query || query.length < 3) return;

  toggleLoading(true);
  clearGrid();

  try {
    const matchingNames = allPokemons
      .filter((entry) => entry.name.includes(query))
      .map((entry) => entry.name);

    if (!matchingNames.length) {
      showNoResults();
      return;
    }

    const fetchedPokemons = await Promise.all(
      matchingNames.map(fetchPokemonData),
    );

    displayedPokemons.length = 0;
    displayedPokemons.push(...fetchedPokemons.filter(Boolean));
    setIndex(0);

    renderPokemonList(displayedPokemons, openDetailFn);
  } catch (error) {
    console.error("Error during Pokémon search:", error);
  } finally {
    toggleLoading(false);
  }
}
