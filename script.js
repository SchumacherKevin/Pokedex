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

const URL_ALL_POKEMON =
  "https://pokeapi.co/api/v2/pokemon/?offset=0&limit=100000";
const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/pokemon";
const POKEMON_PAGE_LIMIT = 20;

let allPokemons = [];
let currentlyDisplayedPokemons = [];
let currentlySelectedPokemonIndex = 0;
let nextPageUrl = null;

const loadMoreButton = document.getElementById("loadMoreBtn");
const backButton = document.getElementById("backBtn");
const detailDialog = document.getElementById("detailDialog");
const searchInputRef = document.getElementById("searchInput");
const searchButtonRef = document.getElementById("searchBtn");
const prevDialogBtn = document.getElementById("prevDialogBtn");
const nextDialogBtn = document.getElementById("nextDialogBtn");
const closeDialogBtn = document.getElementById("closeDialogBtn");

setupEventListeners();
initializeApplication();

function setupEventListeners() {
  searchButtonRef.addEventListener("click", handleSearch);
  searchInputRef.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSearch();
  });

  loadMoreButton.addEventListener("click", () => {
    if (nextPageUrl) loadMorePokemons(nextPageUrl);
  });

  backButton.addEventListener("click", handleBack);

  prevDialogBtn.addEventListener("click", showPreviousPokemon);
  nextDialogBtn.addEventListener("click", showNextPokemon);
  closeDialogBtn.addEventListener("click", () => detailDialog.close());

  detailDialog.addEventListener("click", (e) => {
    if (e.target === detailDialog) detailDialog.close();
  });
}

async function initializeApplication() {
  allPokemons = await fetchAllPokemons(URL_ALL_POKEMON);
  await loadMorePokemons();
}

async function handleSearch() {
  const query = searchInputRef.value.trim().toLowerCase();

  if (!query) {
    await handleBack();
    return;
  }

  nextPageUrl = null;
  toggleLoadMoreButton(false);
  toggleBackButton(true);

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

async function handleBack() {
  searchInputRef.value = "";
  toggleBackButton(false);
  currentlyDisplayedPokemons = [];
  clearGrid();
  nextPageUrl = null;
  await loadMorePokemons();
}

async function loadMorePokemons(pageUrl) {
  toggleLoading(true);
  try {
    const response = await fetch(
      pageUrl || `${POKEAPI_BASE_URL}?limit=${POKEMON_PAGE_LIMIT}`,
    );
    if (!response.ok) throw new Error("Error loading Pokémon page");

    const data = await response.json();
    nextPageUrl = data.next;
    toggleLoadMoreButton(!!nextPageUrl);

    const pokemonList = await Promise.all(
      data.results.map((p) => fetchPokemonData(p.url)),
    );
    const newPokemons = pokemonList.filter(Boolean);

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

function toggleBackButton(visible) {
  backButton.style.display = visible ? "inline-block" : "none";
}

async function handleOpenDetail(pokemonData) {
  await openPokemonDetailDialog(
    pokemonData,
    currentlyDisplayedPokemons,
    (index) => {
      currentlySelectedPokemonIndex = index;
    },
  );
}

async function showNextPokemon() {
  if (currentlySelectedPokemonIndex < currentlyDisplayedPokemons.length - 1) {
    currentlySelectedPokemonIndex++;
  } else if (nextPageUrl) {
    const previousLength = currentlyDisplayedPokemons.length;
    await loadMorePokemons(nextPageUrl);
    currentlySelectedPokemonIndex = previousLength;
  } else {
    return;
  }
  await renderPokemonDetail(
    currentlyDisplayedPokemons[currentlySelectedPokemonIndex],
  );
}

async function showPreviousPokemon() {
  if (currentlySelectedPokemonIndex > 0) {
    currentlySelectedPokemonIndex--;
  } else {
    return;
  }
  await renderPokemonDetail(
    currentlyDisplayedPokemons[currentlySelectedPokemonIndex],
  );
}
