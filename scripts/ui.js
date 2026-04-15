// ============================================================
// IMPORTS – Template-Generatoren und API-Funktion einbinden
// ============================================================
import { fetchPokemonData } from "./api.js";
import {
  generatePokemonCardHTML,
  generatePokemonDetailHTML,
  generateEvolutionItemHTML,
} from "./template.js";

// ============================================================
// DOM-REFERENZEN – Zentrale UI-Elemente einmalig cachen
// ============================================================
const pokemonGridContainer = document.getElementById("pokemonContainer");
const loadingSpinnerElement = document.getElementById("spinner");
const pokemonDetailDialog = document.getElementById("detailDialog");
const pokemonDetailContent = document.getElementById("detailContent");

// ============================================================
// EXPORT: toggleLoading – Lade-Overlay ein- oder ausblenden
// ============================================================

// Beim Ausblenden wird der Spinner mit 1 s Verzögerung versteckt,
// damit ein abruptes Verschwinden vermieden wird.
export function toggleLoading(show) {
  if (show) {
    loadingSpinnerElement?.classList.remove("hidden");
  } else {
    setTimeout(() => {
      loadingSpinnerElement?.classList.add("hidden");
    }, 1000);
  }
}

// ============================================================
// EXPORT: clearGrid – Pokémon-Grid leeren
// ============================================================
export function clearGrid() {
  pokemonGridContainer.innerHTML = "";
}

// ============================================================
// EXPORT: showNoResults – Hinweis anzeigen, wenn Suche leer ist
// ============================================================
export function showNoResults() {
  pokemonGridContainer.innerHTML =
    '<p class="txtNoResult">No Pokémon found!</p>';
}

// ============================================================
// EXPORT: toggleLoadMoreButton – „Load more"-Button ein-/ausblenden
// ============================================================
export function toggleLoadMoreButton(visible) {
  const loadMoreButton = document.getElementById("loadMoreBtn");
  loadMoreButton.style.display = visible ? "inline-block" : "none";
}

// ============================================================
// EXPORT: renderPokemonList – Liste von Pokémon als Karten rendern
// ============================================================

// Iteriert über alle übergebenen Pokémon und delegiert die Kartenerstellung
// an renderPokemonCard. openDetailFn wird beim Klick auf eine Karte aufgerufen.
export function renderPokemonList(pokemonList, openDetailFn) {
  pokemonList.forEach((pokemon) => renderPokemonCard(pokemon, openDetailFn));
}

// ============================================================
// EXPORT: renderPokemonCard – Einzelne Pokémon-Karte ins Grid einfügen
// ============================================================

// Erstellt ein div.card-Element, weist den primären Typ als CSS-Klasse zu
// (für die Hintergrundfarbe aus pokemontypes.css) und hängt es ans Grid.
export function renderPokemonCard(pokemonData, openDetailFn) {
  if (!pokemonData) return;

  const cardElement = document.createElement("div");
  const primaryType = pokemonData.types[0].type.name;

  cardElement.className = `card ${primaryType}`;
  cardElement.innerHTML = generatePokemonCardHTML(pokemonData);
  // Klick auf Karte öffnet den Detail-Dialog
  cardElement.onclick = () => openDetailFn(pokemonData);

  pokemonGridContainer.appendChild(cardElement);
}

// ============================================================
// EXPORT: openPokemonDetailDialog – Detail-Dialog öffnen und befüllen
// ============================================================

// Bestimmt den Index des angeklickten Pokémon in der angezeigten Liste,
// öffnet den Dialog, sperrt das Hintergrund-Scrollen und startet das Rendern.
export async function openPokemonDetailDialog(
  pokemonData,
  displayedPokemons,
  updateIndexFn,
) {
  const index = displayedPokemons.findIndex((p) => p.name === pokemonData.name);
  updateIndexFn(index);

  // Platzhalter anzeigen, solange die Details geladen werden
  pokemonDetailContent.innerHTML = "<p>Loading Pokémon...</p>";
  pokemonDetailDialog?.showModal();
  document.body.style.overflow = "hidden"; // Hintergrund-Scroll verhindern

  await renderPokemonDetail(pokemonData);
}

// ============================================================
// EXPORT: renderPokemonDetail – Detailansicht eines Pokémon rendern
// ============================================================

// Lädt die Evolutionskette und fügt den fertigen HTML-String in den Dialog ein.
// Wird auch von der Vor/Zurück-Navigation in script.js aufgerufen.
export async function renderPokemonDetail(pokemonData) {
  try {
    const evolutionHTML = await getEvolutionChain(pokemonData);
    pokemonDetailContent.innerHTML = generatePokemonDetailHTML(
      pokemonData,
      evolutionHTML,
    );
  } catch (error) {
    pokemonDetailContent.innerHTML = "<p>Error loading Pokémon details</p>";
    console.error("Error rendering Pokémon detail:", error);
  }
}

// ============================================================
// INTERN: getEvolutionChain – Evolutionskette von der API laden
// ============================================================

// Ruft zuerst die Spezies-URL des Pokémon ab, um an die Evolutionsketten-URL
// zu gelangen, und startet dann das rekursive Rendering der Kette.
async function getEvolutionChain(pokemonData) {
  const speciesResponse = await fetch(pokemonData.species.url);
  const speciesData = await speciesResponse.json();

  if (!speciesData.evolution_chain) return "No evolution data available";

  const evolutionResponse = await fetch(speciesData.evolution_chain.url);
  const evolutionData = await evolutionResponse.json();

  // Kette beginnend beim Basis-Pokémon rekursiv rendern
  return renderEvolutionChain(evolutionData.chain);
}

// ============================================================
// INTERN: renderEvolutionChain – Evolutionskette rekursiv aufbauen
// ============================================================

// Verarbeitet einen Knoten der Evolutionskette (chainNode) und ruft sich für
// jede Weiterentwicklung (evolves_to) rekursiv auf. Zwischen den Stufen wird
// ein Pfeil-Element eingefügt.
async function renderEvolutionChain(chainNode) {
  if (!chainNode) return "";

  // Vollständige Daten für das aktuelle Evolutionsstadium laden
  const pokemonData = await fetchPokemonData(chainNode.species.name);
  let html = generateEvolutionItemHTML(pokemonData);

  if (chainNode.evolves_to.length) {
    // Alle Weiterentwicklungen parallel rendern
    const childrenHTML = await Promise.all(
      chainNode.evolves_to.map(renderEvolutionChain),
    );
    // Jedes Kind mit einem Pfeil-Trenner anhängen
    html += childrenHTML
      .map((childHtml) => `<span class="evo-arrow">→</span>${childHtml}`)
      .join("");
  }

  return html;
}

// ============================================================
// EXPORT (global): toggleAccordion – Akkordeon öffnen / schließen
// ============================================================

// Wird direkt aus dem HTML via onclick="toggleAccordion(this)" aufgerufen.
// Beim Öffnen werden die Stat-Balken animiert: von 0% auf den gespeicherten
// Zielwert (data-width), um eine Einblend-Animation zu erzeugen.
export function toggleAccordion(btn) {
  btn.classList.toggle("open");
  const body = btn.nextElementSibling;
  body.classList.toggle("open");

  if (body.classList.contains("open")) {
    const bars = body.querySelectorAll(".stat-fill");
    bars.forEach((bar) => {
      bar.style.width = "0%";
      // Kurze Verzögerung nötig, damit der Browser den Reset rendert
      // bevor die Animation zur Zielbreite startet
      setTimeout(() => {
        bar.style.width = bar.getAttribute("data-width");
      }, 50);
    });
  }
}

// Als globale Funktion registrieren, damit das onclick-Attribut im HTML greift
window.toggleAccordion = toggleAccordion;

// ============================================================
// EVENT LISTENER – Scroll-Sperre beim Schließen des Dialogs aufheben
// ============================================================
pokemonDetailDialog?.addEventListener("close", () => {
  document.body.style.overflow = "";
});
