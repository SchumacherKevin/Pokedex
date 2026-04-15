// ============================================================
// IMPORTS – Funktionen aus externen Modulen laden
// ============================================================
import { fetchAllPokemons, fetchPokemonData } from "./scripts/api.js";
import { initSearchPokemon } from "./scripts/search.js";
import {
  toggleLoading,
  clearGrid,
  toggleLoadMoreButton,
  renderPokemonList,
  openPokemonDetailDialog,
  renderPokemonDetail,
} from "./scripts/ui.js";

// ============================================================
// KONSTANTEN – API-URLs und Seitenlimit
// ============================================================

// Endpunkt, um alle existierenden Pokémon-Namen zu laden (für die Suche)
const URL_ALL_POKEMON =
  "https://pokeapi.co/api/v2/pokemon/?offset=0&limit=100000";

// Basis-URL für einzelne Pokémon-Abfragen
const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/pokemon";

// Anzahl der Pokémon, die pro „Load more"-Klick geladen werden
const POKEMON_PAGE_LIMIT = 20;

// ============================================================
// GLOBALER STATE – Laufzeitvariablen der Anwendung
// ============================================================

// Vollständige Liste aller Pokémon-Namen (nur Name + URL, kein Detail)
let allPokemons = [];

// Aktuell im Grid angezeigte Pokémon mit vollständigen Daten
let currentlyDisplayedPokemons = [];

// Index des aktuell im Dialog angezeigten Pokémon (für Vor/Zurück-Navigation)
let currentlySelectedPokemonIndex = 0;

// URL der nächsten Seite für paginiertes Laden; null = keine weiteren Seiten
let nextPageUrl = null;

// ============================================================
// DOM-REFERENZEN – Elemente aus dem HTML cachen
// ============================================================
const loadMoreButton = document.getElementById("loadMoreBtn");
const backButton = document.getElementById("backBtn");
const detailDialog = document.getElementById("detailDialog");
const searchInputRef = document.getElementById("searchInput");
const searchButtonRef = document.getElementById("searchBtn");
const prevDialogBtn = document.getElementById("prevDialogBtn");
const nextDialogBtn = document.getElementById("nextDialogBtn");
const closeDialogBtn = document.getElementById("closeDialogBtn");

// ============================================================
// BOOTSTRAP – App initialisieren
// ============================================================
setupEventListeners();
initializeApplication();

// ============================================================
// EVENT LISTENER – Alle Benutzerinteraktionen registrieren
// ============================================================
function setupEventListeners() {
  // Suche per Button-Klick oder Enter-Taste auslösen
  searchButtonRef.addEventListener("click", handleSearch);
  searchInputRef.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSearch();
  });

  // Nächste Pokémon-Seite laden, wenn „Load more" geklickt wird
  loadMoreButton.addEventListener("click", () => {
    if (nextPageUrl) loadMorePokemons(nextPageUrl);
  });

  // Zurück-Button: Suche zurücksetzen und Standardliste wiederherstellen
  backButton.addEventListener("click", handleBack);

  // Dialog-Navigation: vorheriges / nächstes Pokémon anzeigen
  prevDialogBtn.addEventListener("click", showPreviousPokemon);
  nextDialogBtn.addEventListener("click", showNextPokemon);

  // Dialog schließen per ✕-Button oder Klick auf den Backdrop
  closeDialogBtn.addEventListener("click", () => detailDialog.close());
  detailDialog.addEventListener("click", (e) => {
    if (e.target === detailDialog) detailDialog.close();
  });
}

// ============================================================
// INITIALISIERUNG – Alle Pokémon-Namen laden, erste Seite rendern
// ============================================================
async function initializeApplication() {
  // Alle Namen vorab laden – wird für die clientseitige Suche benötigt
  allPokemons = await fetchAllPokemons(URL_ALL_POKEMON);
  // Erste 20 Pokémon mit Details laden und im Grid anzeigen
  await loadMorePokemons();
}

// ============================================================
// SUCHE – Eingabe auswerten und passende Pokémon anzeigen
// ============================================================
async function handleSearch() {
  const query = searchInputRef.value.trim().toLowerCase();

  // Leere Suche → zurück zur normalen Ansicht
  if (!query) {
    await handleBack();
    return;
  }

  // Paginierung deaktivieren während der Suche
  nextPageUrl = null;
  toggleLoadMoreButton(false);
  toggleBackButton(true);

  // Suche ausführen; gibt gefundene Pokémon als Karten aus
  await initSearchPokemon(
    query,
    allPokemons,
    currentlyDisplayedPokemons,
    (index) => {
      currentlySelectedPokemonIndex = index;
    },
    handleOpenDetail,
  );
}

// ============================================================
// ZURÜCK – Suche zurücksetzen und Standardzustand wiederherstellen
// ============================================================
async function handleBack() {
  searchInputRef.value = "";
  toggleBackButton(false);
  currentlyDisplayedPokemons = [];
  clearGrid();
  nextPageUrl = null;
  await loadMorePokemons();
}

// ============================================================
// PAGINIERUNG – Nächste Pokémon-Seite nachladen
// ============================================================
async function loadMorePokemons(pageUrl) {
  toggleLoading(true);
  try {
    // Entweder die übergebene next-URL oder die erste Seite verwenden
    const response = await fetch(
      pageUrl || `${POKEAPI_BASE_URL}?limit=${POKEMON_PAGE_LIMIT}`,
    );
    if (!response.ok) throw new Error("Error loading Pokémon page");

    const data = await response.json();

    // next-URL für den nächsten „Load more"-Klick speichern
    nextPageUrl = data.next;
    toggleLoadMoreButton(!!nextPageUrl);

    // Alle Pokémon der Seite parallel mit vollständigen Daten laden
    const pokemonList = await Promise.all(
      data.results.map((p) => fetchPokemonData(p.url)),
    );
    const newPokemons = pokemonList.filter(Boolean); // fehlerhafte Einträge entfernen

    // Neue Pokémon an die angezeigte Liste anhängen und rendern
    currentlyDisplayedPokemons = [
      ...currentlyDisplayedPokemons,
      ...newPokemons,
    ];
    renderPokemonList(newPokemons, handleOpenDetail);
  } catch (error) {
    console.error("Error loading Pokémon page:", error);
  } finally {
    toggleLoading(false);
  }
}

// ============================================================
// HILFSFUNKTIONEN – Kleine Helfer für UI-Zustände
// ============================================================

// Zurück-Button ein- oder ausblenden
function toggleBackButton(visible) {
  backButton.style.display = visible ? "inline-block" : "none";
}

// Detail-Dialog für ein angeklicktes Pokémon öffnen
async function handleOpenDetail(pokemonData) {
  await openPokemonDetailDialog(
    pokemonData,
    currentlyDisplayedPokemons,
    (index) => {
      currentlySelectedPokemonIndex = index;
    },
  );
}

// ============================================================
// DIALOG-NAVIGATION – Zwischen Pokémon im Detail-Dialog wechseln
// ============================================================

// Nächstes Pokémon anzeigen; bei Bedarf neue Seite nachladen
async function showNextPokemon() {
  if (currentlySelectedPokemonIndex < currentlyDisplayedPokemons.length - 1) {
    currentlySelectedPokemonIndex++;
  } else if (nextPageUrl) {
    // Letzte Karte erreicht → nächste Seite laden und dort weitermachen
    const previousLength = currentlyDisplayedPokemons.length;
    await loadMorePokemons(nextPageUrl);
    currentlySelectedPokemonIndex = previousLength;
  } else {
    return; // Kein weiteres Pokémon verfügbar
  }
  await renderPokemonDetail(
    currentlyDisplayedPokemons[currentlySelectedPokemonIndex],
  );
}

// Vorheriges Pokémon anzeigen; stoppt am ersten Eintrag
async function showPreviousPokemon() {
  if (currentlySelectedPokemonIndex > 0) {
    currentlySelectedPokemonIndex--;
  } else {
    return; // Bereits am Anfang der Liste
  }
  await renderPokemonDetail(
    currentlyDisplayedPokemons[currentlySelectedPokemonIndex],
  );
}
