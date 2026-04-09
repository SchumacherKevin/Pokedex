import { fetchPokemonData } from "./api.js";
import {
  generatePokemonCardHTML,
  generatePokemonDetailHTML,
  generateEvolutionItemHTML,
} from "./template.js";

const pokemonGridContainer = document.getElementById("pokemonContainer");
const loadingSpinnerElement = document.getElementById("spinner");
const pokemonDetailDialog = document.getElementById("detailDialog");
const pokemonDetailContent = document.getElementById("detailContent");

export function toggleLoading(show) {
  loadingSpinnerElement?.classList.toggle("hidden", !show);
}

export function clearGrid() {
  pokemonGridContainer.innerHTML = "";
}

export function showNoResults() {
  pokemonGridContainer.innerHTML = '<p class="txtNoResult">No Pokémon found!</p>';
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

export async function openPokemonDetailDialog(pokemonData, displayedPokemons, updateIndexFn) {
  const index = displayedPokemons.findIndex((p) => p.name === pokemonData.name);
  updateIndexFn(index);

  pokemonDetailContent.innerHTML = "<p>Loading Pokémon...</p>";
  pokemonDetailDialog?.showModal();
  document.body.style.overflow = "hidden";

  await renderPokemonDetail(pokemonData);
}

export async function renderPokemonDetail(pokemonData) {
  try {
    const evolutionHTML = await getEvolutionChain(pokemonData);
    pokemonDetailContent.innerHTML = generatePokemonDetailHTML(pokemonData, evolutionHTML);
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

export function toggleAccordion(btn) {
  btn.classList.toggle("open");
  const body = btn.nextElementSibling;
  body.classList.toggle("open");

  if (body.classList.contains("open")) {
    const bars = body.querySelectorAll(".stat-fill");
    bars.forEach((bar) => {
      bar.style.width = "0%";
      setTimeout(() => { bar.style.width = bar.getAttribute("data-width"); }, 50);
    });
  }
}

window.toggleAccordion = toggleAccordion;

pokemonDetailDialog?.addEventListener("close", () => {
  document.body.style.overflow = "";
});
