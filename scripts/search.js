// ============================================================
// IMPORTS – Benötigte API- und UI-Funktionen einbinden
// ============================================================
import { fetchPokemonData } from "./api.js";
import {
  clearGrid,
  showNoResults,
  renderPokemonList,
  toggleLoading,
} from "./ui.js";

// ============================================================
// EXPORT: initSearchPokemon – Suche ausführen und Ergebnisse rendern
// ============================================================

// Filtert die vorab geladene Pokémon-Liste clientseitig nach dem Suchbegriff,
// lädt die vollständigen Daten der Treffer und zeigt sie im Grid an.
//
// Parameter:
//   query             – Suchbegriff (bereits lowercase, getrimmt)
//   allPokemons       – Komplette Namensliste aller Pokémon (name + url)
//   displayedPokemons – Referenz auf die aktuell angezeigte Liste (wird mutiert)
//   setIndex          – Callback, um currentlySelectedPokemonIndex zu setzen
//   openDetailFn      – Callback zum Öffnen des Detail-Dialogs beim Karten-Klick
export async function initSearchPokemon(
  query,
  allPokemons,
  displayedPokemons,
  setIndex,
  openDetailFn,
) {
  // Mindestlänge 3 Zeichen, um zu viele Ergebnisse und unnötige Requests zu vermeiden
  if (!query || query.length < 3) return;

  toggleLoading(true);
  clearGrid(); // Vorherige Karten entfernen

  try {
    // Clientseitig filtern: alle Pokémon, deren Name den Suchbegriff enthält
    const matchingNames = allPokemons
      .filter((entry) => entry.name.includes(query))
      .map((entry) => entry.name);

    // Keine Treffer → Hinweis anzeigen und abbrechen
    if (!matchingNames.length) {
      showNoResults();
      return;
    }

    // Vollständige Pokémon-Daten aller Treffer parallel laden (nutzt den Cache)
    const fetchedPokemons = await Promise.all(matchingNames.map(fetchPokemonData));

    // Angezeigte Liste leeren und mit Suchergebnissen befüllen (In-place-Mutation,
    // damit die Referenz in script.js weiterhin gültig bleibt)
    displayedPokemons.length = 0;
    displayedPokemons.push(...fetchedPokemons.filter(Boolean));

    // Index auf das erste Ergebnis zurücksetzen
    setIndex(0);

    // Ergebniskarten im Grid rendern
    renderPokemonList(displayedPokemons, openDetailFn);
  } catch (error) {
    console.error("Error during Pokémon search:", error);
  } finally {
    toggleLoading(false);
  }
}
