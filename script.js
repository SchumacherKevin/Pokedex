const URL_ALLPOKEMON =
  "https://pokeapi.co/api/v2/pokemon/?offset=0&limit=100000";
const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/pokemon";
const POKEMON_PAGE_LIMIT = 20;

let nextPageUrl = null;
let previousPageUrl = null;

let allPokemons = [];
let cachedPokemonsList = [];
let currentlyDisplayedPokemons = [];
let currentlySelectedPokemonIndex = 0;

let pokemonGridContainer = document.getElementById("pokemonContainer");
let loadingSpinnerElement = document.getElementById("spinner");
let loadMorePokemonsButton = document.getElementById("loadMoreBtn");
let previousPageButton = document.getElementById("prevBtn");
let pokemonDetailDialog = document.getElementById("detailDialog");
let pokemonDetailContent = document.getElementById("detailContent");
let searchInputRef = document.getElementById("searchInput");
let searchBtnRef = document.getElementById("searchBtn");

initializeApplication();

async function initializeApplication() {
  await setAllPokemons();
  await loadPokemonPage();
}

async function setAllPokemons() {
  try {
    let listOfAllPokemon = await fetch(URL_ALLPOKEMON);
    let listOfAllPokemonAsJSON = await listOfAllPokemon.json();
    allPokemons = listOfAllPokemonAsJSON.results;
  } catch (loadingError) {
    console.error("Fehler beim Laden der Seite:");
  }
}

async function searchPokemon(searchString) {
  let searchedResult = [];
  for (let i = 0; i < allPokemons.length; i++) {
    if (allPokemons[i].name.includes(searchString.toLowerCase())) {
      let pokemon = await getPokemonByName(allPokemons[i].name);
      searchedResult.push(pokemon.id);
    }
  }
  return searchedResult;
}

async function initSearchPokemon() {
  let query = searchInputRef.value.trim();

  if (query.length === 0) {
    await loadPokemonPage();
    return;
  }

  if (query.length < 3) return;

  try {
    showLoadingSpinner(true);
    pokemonGridContainer.innerHTML = "";

    let matchingNames = allPokemons
      .filter((p) => p.name.includes(query.toLowerCase()))
      .map((p) => p.name);

    if (matchingNames.length === 0) {
      pokemonGridContainer.innerHTML =
        '<p class="txtNoResult">No Pokemon found!</p>';
      return;
    }

    let pokemonDataList = await Promise.all(
      matchingNames.map((name) => fetchPokemonData(name)),
    );

    currentlyDisplayedPokemons = pokemonDataList.filter(Boolean);
    currentlySelectedPokemonIndex = 0;

    currentlyDisplayedPokemons.forEach((pokemonData) => {
      renderPokemonCard(pokemonData);
    });
  } catch (searchError) {
    console.error("Fehler bei der Suche:", searchError);
  } finally {
    showLoadingSpinner(false);
  }
}

async function loadPokemonPage(pageUrl) {
  try {
    showLoadingSpinner(true);

    let apiResponse = await fetch(
      pageUrl || `${POKEAPI_BASE_URL}?limit=${POKEMON_PAGE_LIMIT}`,
    );
    if (!apiResponse.ok) throw new Error("Fehler beim Laden der Pokémon-Liste");

    let pokemonListData = await apiResponse.json();

    nextPageUrl = pokemonListData.next;
    previousPageUrl = pokemonListData.previous;

    pokemonGridContainer.innerHTML = "";

    let pokemonDataPromises = pokemonListData.results.map((pokemonEntry) =>
      fetchPokemonData(pokemonEntry.url),
    );
    currentlyDisplayedPokemons = await Promise.all(pokemonDataPromises);

    currentlyDisplayedPokemons.forEach((pokemonData) => {
      if (pokemonData) renderPokemonCard(pokemonData);
    });

    previousPageButton.style.display = previousPageUrl
      ? "inline-block"
      : "none";
  } catch (loadingError) {
    console.error("Fehler beim Laden der Seite:", loadingError);
  } finally {
    showLoadingSpinner(false);
  }
}

async function fetchPokemonData(pokemonIdentifier) {
  let isFullUrl =
    typeof pokemonIdentifier === "string" &&
    pokemonIdentifier.startsWith("http");

  let pokemonIdFromUrl = isFullUrl
    ? extractPokemonIdFromUrl(pokemonIdentifier)
    : null;

  let cachedPokemonData = cachedPokemonsList.find((cachedPokemon) =>
    isFullUrl
      ? cachedPokemon.url === pokemonIdentifier ||
        cachedPokemon.id === pokemonIdFromUrl
      : cachedPokemon.name.toLowerCase() ===
          String(pokemonIdentifier).toLowerCase() ||
        String(cachedPokemon.id) === String(pokemonIdentifier),
  );

  if (cachedPokemonData) return cachedPokemonData;

  let apiUrl = isFullUrl
    ? pokemonIdentifier
    : `${POKEAPI_BASE_URL}/${pokemonIdentifier.toString().toLowerCase()}`;

  try {
    let apiResponse = await fetch(apiUrl);
    if (!apiResponse.ok)
      throw new Error(`Pokémon nicht gefunden: ${pokemonIdentifier}`);

    let pokemonData = await apiResponse.json();
    pokemonData.url = apiUrl;

    cachedPokemonsList.push(pokemonData);
    return pokemonData;
  } catch (fetchError) {
    console.error("Fehler beim Abrufen des Pokémon:", fetchError);
    return null;
  }
}

function extractPokemonIdFromUrl(pokemonUrl) {
  let matchResult = pokemonUrl.match(/\/pokemon\/(\d+)\/?$/);
  return matchResult ? parseInt(matchResult[1], 10) : null;
}

function renderPokemonCard(pokemonData) {
  if (!pokemonData) return;

  let pokemonCardElement = document.createElement("div");
  let primaryPokemonType = pokemonData.types[0].type.name;

  pokemonCardElement.className = `card ${primaryPokemonType}`;
  pokemonCardElement.innerHTML = generatePokemonCardHTML(pokemonData);

  pokemonCardElement.onclick = () => openPokemonDetailDialog(pokemonData);

  pokemonGridContainer.appendChild(pokemonCardElement);
}

async function openPokemonDetailDialog(pokemonData) {
  try {
    currentlySelectedPokemonIndex = currentlyDisplayedPokemons.findIndex(
      (pokemon) => pokemon.name === pokemonData.name,
    );

    pokemonDetailContent.innerHTML = "<p>Lade Pokémon...</p>";

    if (pokemonDetailDialog) pokemonDetailDialog.showModal();

    await renderPokemonDetail(pokemonData);
  } catch (dialogError) {
    console.error("Fehler beim Öffnen des Dialogs:", dialogError);
  }
}

async function renderPokemonDetail(pokemonData) {
  let evolutionChainHTML = "Keine Evolutionsdaten verfügbar";

  try {
    let speciesResponse = await fetch(pokemonData.species.url);
    if (!speciesResponse.ok)
      throw new Error("Fehler beim Laden der Pokémon-Spezies");

    let speciesData = await speciesResponse.json();

    if (speciesData.evolution_chain) {
      let evolutionResponse = await fetch(speciesData.evolution_chain.url);
      if (!evolutionResponse.ok)
        throw new Error("Fehler beim Laden der Evolution-Kette");

      let evolutionData = await evolutionResponse.json();

      evolutionChainHTML = await renderPokemonEvolutionChain(
        evolutionData.chain,
      );
    }

    pokemonDetailContent.innerHTML = generatePokemonDetailHTML(
      pokemonData,
      evolutionChainHTML,
    );

    animateStats();
  } catch (detailError) {
    console.error("Fehler beim Rendern der Pokémon-Details:", detailError);
    pokemonDetailContent.innerHTML = `<p>Fehler beim Laden der Details</p>`;
  }
}

async function renderPokemonEvolutionChain(evolutionChainNode) {
  if (!evolutionChainNode) return "";

  try {
    const evolutionPokemonData = await fetchPokemonData(
      evolutionChainNode.species.name,
    );

    let evolutionHTML = generateEvolutionItemHTML(evolutionPokemonData);

    if (evolutionChainNode.evolves_to.length > 0) {
      let evolutionChildrenHTML = await Promise.all(
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

async function showNextPokemonInDialog() {
  try {
    if (currentlySelectedPokemonIndex < currentlyDisplayedPokemons.length - 1) {
      currentlySelectedPokemonIndex++;
      await renderPokemonDetail(
        currentlyDisplayedPokemons[currentlySelectedPokemonIndex],
      );
      return;
    }

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

loadMorePokemonsButton.onclick = async () => {
  if (nextPageUrl) await loadPokemonPage(nextPageUrl);
};

previousPageButton.onclick = async () => {
  if (previousPageUrl) await loadPokemonPage(previousPageUrl);
};

function showLoadingSpinner(shouldShow) {
  if (!loadingSpinnerElement) return;

  if (shouldShow) {
    loadingSpinnerElement.classList.remove("hidden");
  } else {
    loadingSpinnerElement.classList.add("hidden");
  }
}

function closePokemonDetailDialog() {
  if (pokemonDetailDialog) pokemonDetailDialog.close();
}

if (pokemonDetailDialog) {
  pokemonDetailDialog.addEventListener("click", (event) => {
    if (event.target === pokemonDetailDialog) pokemonDetailDialog.close();
  });
}
