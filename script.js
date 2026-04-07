// CONFIGURATION
const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/pokemon"; // API Basis-URL
const POKEMON_PAGE_LIMIT = 20; // Anzahl Pokémon pro Seite

// APPLICATION STATE
let nextPageUrl = null; // URL für die nächste Pokémon-Seite
let previousPageUrl = null; // URL für die vorherige Pokémon-Seite

let cachedPokemonsList = []; // Cache für bereits geladene Pokémon-Daten
let currentlyDisplayedPokemons = []; // Pokémon, die aktuell im Grid angezeigt werden
let currentlySelectedPokemonIndex = 0; // Index des aktuell ausgewählten Pokémon im Detaildialog

// DOM ELEMENT REFERENCES
const pokemonGridContainer = document.getElementById("pokemonContainer"); // Grid für Pokémon-Karten
const loadingSpinnerElement = document.getElementById("spinner"); // Spinner-Element
const loadMorePokemonsButton = document.getElementById("loadMoreBtn"); // "Load More"-Button
const previousPageButton = document.getElementById("prevBtn"); // "Previous Page"-Button
const pokemonDetailDialog = document.getElementById("detailDialog"); // Dialog für Pokémon-Details
const pokemonDetailContent = document.getElementById("detailContent"); // Inhalt des Detaildialogs

// INITIALIZATION
initializeApplication();

// Startet die Anwendung und lädt die erste Pokémon-Seite
async function initializeApplication() {
  await loadPokemonPage();
}

// POKEMON LIST LOADING
async function loadPokemonPage(pageUrl) {
  try {
    showLoadingSpinner(true);

    // API-Aufruf für Pokémon-Liste
    const apiResponse = await fetch(
      pageUrl || `${POKEAPI_BASE_URL}?limit=${POKEMON_PAGE_LIMIT}`,
    );
    if (!apiResponse.ok) throw new Error("Fehler beim Laden der Pokémon-Liste");

    const pokemonListData = await apiResponse.json();

    // Speichern der Pagination-URLs
    nextPageUrl = pokemonListData.next;
    previousPageUrl = pokemonListData.previous;

    // Grid leeren
    pokemonGridContainer.innerHTML = "";

    // Pokémon-Daten laden (parallel)
    const pokemonDataPromises = pokemonListData.results.map((pokemonEntry) =>
      fetchPokemonData(pokemonEntry.url),
    );
    currentlyDisplayedPokemons = await Promise.all(pokemonDataPromises);

    // Karten rendern
    currentlyDisplayedPokemons.forEach((pokemonData) => {
      if (pokemonData) renderPokemonCard(pokemonData);
    });

    // "Previous Page"-Button anzeigen/ausblenden
    previousPageButton.style.display = previousPageUrl
      ? "inline-block"
      : "none";
  } catch (loadingError) {
    console.error("Fehler beim Laden der Seite:", loadingError);
  } finally {
    showLoadingSpinner(false);
  }
}

// FETCH INDIVIDUAL POKEMON DATA
async function fetchPokemonData(pokemonIdentifier) {
  const isFullUrl =
    typeof pokemonIdentifier === "string" &&
    pokemonIdentifier.startsWith("http");

  // Prüfen, ob Pokémon bereits im Cache ist
  const pokemonIdFromUrl = isFullUrl
    ? extractPokemonIdFromUrl(pokemonIdentifier)
    : null;
  const cachedPokemonData = cachedPokemonsList.find((cachedPokemon) =>
    isFullUrl
      ? cachedPokemon.url === pokemonIdentifier ||
        cachedPokemon.id === pokemonIdFromUrl
      : cachedPokemon.name.toLowerCase() ===
          String(pokemonIdentifier).toLowerCase() ||
        String(cachedPokemon.id) === String(pokemonIdentifier),
  );

  if (cachedPokemonData) return cachedPokemonData;

  // API-URL bestimmen
  const apiUrl = isFullUrl
    ? pokemonIdentifier
    : `${POKEAPI_BASE_URL}/${pokemonIdentifier.toString().toLowerCase()}`;

  try {
    const apiResponse = await fetch(apiUrl);
    if (!apiResponse.ok)
      throw new Error(`Pokémon nicht gefunden: ${pokemonIdentifier}`);

    const pokemonData = await apiResponse.json();
    pokemonData.url = apiUrl; // URL im Datenobjekt speichern

    cachedPokemonsList.push(pokemonData); // Cache aktualisieren
    return pokemonData;
  } catch (fetchError) {
    console.error("Fehler beim Abrufen des Pokémon:", fetchError);
    return null;
  }
}

// Hilfsfunktion: Extrahiert die Pokémon-ID aus einer URL
function extractPokemonIdFromUrl(pokemonUrl) {
  const matchResult = pokemonUrl.match(/\/pokemon\/(\d+)\/?$/);
  return matchResult ? parseInt(matchResult[1], 10) : null;
}

// RENDERING FUNCTIONS
function renderPokemonCard(pokemonData) {
  if (!pokemonData) return;

  const pokemonCardElement = document.createElement("div");
  const primaryPokemonType = pokemonData.types[0].type.name;

  pokemonCardElement.className = `card ${primaryPokemonType}`;
  pokemonCardElement.innerHTML = generatePokemonCardHTML(pokemonData);

  // Klick öffnet den Detaildialog
  pokemonCardElement.onclick = () => openPokemonDetailDialog(pokemonData);

  pokemonGridContainer.appendChild(pokemonCardElement);
}

// DETAIL DIALOG FUNCTIONS
async function openPokemonDetailDialog(pokemonData) {
  try {
    // Index des aktuell ausgewählten Pokémon speichern
    currentlySelectedPokemonIndex = currentlyDisplayedPokemons.findIndex(
      (pokemon) => pokemon.name === pokemonData.name,
    );

    // Ladezustand anzeigen
    pokemonDetailContent.innerHTML = "<p>Lade Pokémon...</p>";

    if (pokemonDetailDialog) pokemonDetailDialog.showModal();

    await renderPokemonDetail(pokemonData);
  } catch (dialogError) {
    console.error("Fehler beim Öffnen des Dialogs:", dialogError);
  }
}

// Rendert die Detailinformationen eines Pokémon
async function renderPokemonDetail(pokemonData) {
  let evolutionChainHTML = "Keine Evolutionsdaten verfügbar";

  try {
    // Species-Daten abrufen
    const speciesResponse = await fetch(pokemonData.species.url);
    if (!speciesResponse.ok)
      throw new Error("Fehler beim Laden der Pokémon-Spezies");
    const speciesData = await speciesResponse.json();

    // Evolution-Kette abrufen
    if (speciesData.evolution_chain) {
      const evolutionResponse = await fetch(speciesData.evolution_chain.url);
      if (!evolutionResponse.ok)
        throw new Error("Fehler beim Laden der Evolution-Kette");
      const evolutionData = await evolutionResponse.json();

      evolutionChainHTML = await renderPokemonEvolutionChain(
        evolutionData.chain,
      );
    }

    // Detail HTML rendern
    pokemonDetailContent.innerHTML = generatePokemonDetailHTML(
      pokemonData,
      evolutionChainHTML,
    );

    // Statistiken animieren
    animateStats();
  } catch (detailError) {
    console.error("Fehler beim Rendern der Pokémon-Details:", detailError);
    pokemonDetailContent.innerHTML = `<p>Fehler beim Laden der Details</p>`;
  }
}

// EVOLUTION CHAIN RENDERING
async function renderPokemonEvolutionChain(evolutionChainNode) {
  if (!evolutionChainNode) return "";

  try {
    const evolutionPokemonData = await fetchPokemonData(
      evolutionChainNode.species.name,
    );
    let evolutionHTML = generateEvolutionItemHTML(evolutionPokemonData);

    if (evolutionChainNode.evolves_to.length > 0) {
      const evolutionChildrenHTML = await Promise.all(
        evolutionChainNode.evolves_to.map((childNode) =>
          renderPokemonEvolutionChain(childNode),
        ),
      );

      evolutionHTML += evolutionChildrenHTML
        .map((childHtml) => `<span class="evo-arrow">→</span>${childHtml}`)
        .join("");
    }

    return evolutionHTML;
  } catch (evolutionError) {
    console.error("Fehler beim Rendern der Evolution:", evolutionError);
    return "";
  }
}

// DIALOG NAVIGATION FUNCTIONS
async function showNextPokemonInDialog() {
  try {
    if (currentlySelectedPokemonIndex < currentlyDisplayedPokemons.length - 1) {
      currentlySelectedPokemonIndex++;
      await renderPokemonDetail(
        currentlyDisplayedPokemons[currentlySelectedPokemonIndex],
      );
      return;
    }

    // Nächste Seite laden, falls vorhanden
    if (nextPageUrl) {
      await loadPokemonPage(nextPageUrl);
      currentlySelectedPokemonIndex = 0;
      await renderPokemonDetail(
        currentlyDisplayedPokemons[currentlySelectedPokemonIndex],
      );
    }
  } catch (navigationError) {
    console.error(
      "Fehler beim Anzeigen des nächsten Pokémon:",
      navigationError,
    );
  }
}

async function showPreviousPokemonInDialog() {
  try {
    if (currentlySelectedPokemonIndex > 0) {
      currentlySelectedPokemonIndex--;
      await renderPokemonDetail(
        currentlyDisplayedPokemons[currentlySelectedPokemonIndex],
      );
      return;
    }

    // Vorherige Seite laden, falls vorhanden
    if (previousPageUrl) {
      await loadPokemonPage(previousPageUrl);
      currentlySelectedPokemonIndex = currentlyDisplayedPokemons.length - 1;
      await renderPokemonDetail(
        currentlyDisplayedPokemons[currentlySelectedPokemonIndex],
      );
    }
  } catch (navigationError) {
    console.error(
      "Fehler beim Anzeigen des vorherigen Pokémon:",
      navigationError,
    );
  }
}

// BUTTON EVENT LISTENERS
loadMorePokemonsButton.onclick = async () => {
  if (nextPageUrl) await loadPokemonPage(nextPageUrl);
};

previousPageButton.onclick = async () => {
  if (previousPageUrl) await loadPokemonPage(previousPageUrl);
};

// LOADING SPINNER FUNCTIONS
function showLoadingSpinner(shouldShow) {
  if (!loadingSpinnerElement) return;

  if (shouldShow) {
    loadingSpinnerElement.classList.remove("hidden"); // Spinner sichtbar
  } else {
    loadingSpinnerElement.classList.add("hidden"); // Spinner ausblenden
  }
}

// DIALOG CONTROL FUNCTIONS
function closePokemonDetailDialog() {
  if (pokemonDetailDialog) pokemonDetailDialog.close();
}

// Klick auf Backdrop schließt Dialog
if (pokemonDetailDialog) {
  pokemonDetailDialog.addEventListener("click", (event) => {
    if (event.target === pokemonDetailDialog) pokemonDetailDialog.close();
  });
}
