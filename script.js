const catchBtn = document.getElementById("catch-btn");
const resetBtn = document.getElementById("reset-btn");
const pokemonName = document.getElementById("pokemon-name");
const pokemonImg = document.getElementById("pokemon-img");
const shinyImg = document.getElementById("shiny-img");
const pokemonTypes = document.getElementById("pokemon-types");
const dexNumber = document.getElementById("dex");
const entry = document.getElementById("entry");
const empty = document.getElementById("empty");
const errorBox = document.getElementById("error");
const count = document.getElementById("count");
const grid = document.getElementById("dex-grid");

const TOTAL = 151;
const SPRITE = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

// The colours each type has in the games.
const TYPE_COLORS = {
  normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C", grass: "#7AC74C",
  ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1", ground: "#E2BF65", flying: "#A98FF3",
  psychic: "#F95587", bug: "#A6B91A", rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC",
  dark: "#705746", steel: "#B7B7CE", fairy: "#D685AD",
};

// PokéAPI names are slugs; a few Pokémon need their real spelling.
const SPECIAL_NAMES = { "nidoran-f": "Nidoran ♀", "nidoran-m": "Nidoran ♂", "mr-mime": "Mr. Mime", farfetchd: "Farfetch’d" };

function displayName(slug) {
  return SPECIAL_NAMES[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
}

function readableTextOn(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.45 ? "#1d2026" : "#ffffff";
}

// Caught Pokémon are remembered in this browser only.
function loadCaught() {
  try { return new Set(JSON.parse(localStorage.getItem("caught") || "[]")); } catch { return new Set(); }
}
function saveCaught(caught) {
  try { localStorage.setItem("caught", JSON.stringify([...caught])); } catch { /* private mode: keep it in memory */ }
}
const caught = loadCaught();

function getRandomPokemonId() {
  return Math.floor(Math.random() * TOTAL) + 1;
}

async function fetchPokemon(id) {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  if (!response.ok) throw new Error(`PokéAPI answered ${response.status}`);
  const pokemonData = await response.json();

  return {
    id,
    name: pokemonData.name,
    sprite: pokemonData.sprites.front_default,
    shiny_sprite: pokemonData.sprites.front_shiny,
    types: pokemonData.types.map((typeInfo) => typeInfo.type.name),
  };
}

function renderGrid(latestId) {
  grid.replaceChildren(
    ...Array.from({ length: TOTAL }, (_, i) => {
      const id = i + 1;
      const cell = document.createElement("li");
      if (caught.has(id)) {
        cell.className = id === latestId ? "caught latest" : "caught";
        const img = document.createElement("img");
        img.src = SPRITE(id);
        img.alt = `#${id}`;
        img.loading = "lazy";
        cell.append(img);
      } else {
        cell.textContent = id;
        cell.setAttribute("aria-label", `#${id}, not caught yet`);
      }
      return cell;
    })
  );
  count.textContent = `Caught ${caught.size} of ${TOTAL}`;
  resetBtn.hidden = caught.size === 0;
}

function showPokemon(pokemon) {
  const name = displayName(pokemon.name);
  dexNumber.textContent = `#${String(pokemon.id).padStart(3, "0")}`;
  pokemonName.textContent = name;
  pokemonImg.src = pokemon.sprite || "";
  pokemonImg.alt = name;
  shinyImg.src = pokemon.shiny_sprite || "";
  shinyImg.alt = `Shiny ${name}`;
  pokemonTypes.replaceChildren(
    ...pokemon.types.map((type) => {
      const chip = document.createElement("li");
      const color = TYPE_COLORS[type] || "#888888";
      chip.textContent = type;
      chip.style.background = color;
      chip.style.color = readableTextOn(color);
      return chip;
    })
  );
  empty.hidden = true;
  entry.hidden = false;
  entry.classList.remove("arrived");
  void entry.offsetWidth; // restart the arrival animation
  entry.classList.add("arrived");
}

async function displayPokemon() {
  catchBtn.disabled = true;
  catchBtn.textContent = "Looking…";
  errorBox.hidden = true;
  try {
    const pokemon = await fetchPokemon(getRandomPokemonId());
    showPokemon(pokemon);
    caught.add(pokemon.id);
    saveCaught(caught);
    renderGrid(pokemon.id);
  } catch (err) {
    errorBox.textContent = "Couldn't reach PokéAPI. Check your connection and press Catch again.";
    errorBox.hidden = false;
    console.error(err);
  } finally {
    catchBtn.disabled = false;
    catchBtn.textContent = "Catch another";
  }
}

catchBtn.addEventListener("click", displayPokemon);
resetBtn.addEventListener("click", () => {
  caught.clear();
  saveCaught(caught);
  renderGrid();
});

renderGrid();
