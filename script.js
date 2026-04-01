let allPokemon = []

let currentPokemon = []

async function getAllPokemon() {
    let allPokemonasHTTP = await fetch ("https://pokeapi.co/api/v2/pokemon/")
    let pokemons = await allPokemonasHTTP.json()
    allPokemon.push("pokemons")
}