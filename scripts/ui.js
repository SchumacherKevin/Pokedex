import { fetchPokemonData } from "./api.js";
import {
  generatePokemonCardHTML,
  generatePokemonDetailHTML,
  generateEvolutionItemHTML,
  animateStats,
} from "./template.js";

const pokemonGridContainer = document.getElementById("pokemonContainer");
const loadingSpinnerElement = document.getElementById("spinner");
const previousPageButton = document.getElementById("prevBtn");
const pokemonDetailDialog = document.getElementById("detailDialog");
const pokemonDetailContent = document.getElementById("detailContent");

export function toggleLoading(show) {
  loadingSpinnerElement?.classList.toggle("hidden", !show);
}

export function clearGrid() {
  pokemonGridContainer.innerHTML = "";
}

export function showNoResults() {
  pokemonGridContainer.innerHTML =
    '<p class="txtNoResult">No Pokémon found!</p>';
}

export function togglePreviousButton(previousUrl) {
  previousPageButton.style.display = previousUrl ? "inline-block" : "none";
}

export function toggleLoadMoreButton(visible) {
  const loadMoreButton = document.getElementById("loadMoreBtn");
  loadMoreButton.style.display = visible ? "inline-block" : "none";
}

export function renderPokemonList(pokemonList, openDetailFn) {
  pokemonList.forEach((pokemon) => renderPokemonCard(pokemon, openDetailFn));
}

export function renderPokemonCard(pokemonData, openDetailFn) {
  if (!pokemonData) return;

  const cardElement = document.createElement("div");
  const primaryType = pokemonData.types[0].type.name;

  cardElement.className = `card ${primaryType}`;
  cardElement.innerHTML = generatePokemonCardHTML(pokemonData);
  cardElement.onclick = () => openDetailFn(pokemonData);

  pokemonGridContainer.appendChild(cardElement);
}

export async function openPokemonDetailDialog(
  pokemonData,
  displayedPokemons,
  updateIndexFn,
) {
  const index = displayedPokemons.findIndex((p) => p.name === pokemonData.name);
  updateIndexFn(index);

  pokemonDetailContent.innerHTML = "<p>Loading Pokémon...</p>";
  pokemonDetailDialog?.showModal();

  await renderPokemonDetail(pokemonData);
}

export async function renderPokemonDetail(pokemonData) {
  try {
    const evolutionHTML = await getEvolutionChain(pokemonData);
    pokemonDetailContent.innerHTML = generatePokemonDetailHTML(
      pokemonData,
      evolutionHTML,
    );
    animateStats();
  } catch (error) {
    pokemonDetailContent.innerHTML = "<p>Error loading Pokémon details</p>";
    console.error("Error rendering Pokémon detail:", error);
  }
}

async function getEvolutionChain(pokemonData) {
  const speciesResponse = await fetch(pokemonData.species.url);
  const speciesData = await speciesResponse.json();

  if (!speciesData.evolution_chain) return "No evolution data available";

  const evolutionResponse = await fetch(speciesData.evolution_chain.url);
  const evolutionData = await evolutionResponse.json();

  return renderEvolutionChain(evolutionData.chain);
}

async function renderEvolutionChain(chainNode) {
  if (!chainNode) return "";

  const pokemonData = await fetchPokemonData(chainNode.species.name);
  let html = generateEvolutionItemHTML(pokemonData);

  if (chainNode.evolves_to.length) {
    const childrenHTML = await Promise.all(
      chainNode.evolves_to.map(renderEvolutionChain),
    );
    html += childrenHTML
      .map((childHtml) => `<span class="evo-arrow">→</span>${childHtml}`)
      .join("");
  }

  return html;
}
