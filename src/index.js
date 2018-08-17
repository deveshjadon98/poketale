import './../node_modules/materialize-css/dist/js/materialize.min.js';
import './../node_modules/materialize-css/sass/materialize.scss';
import './scss/main.scss';

const loader = document.getElementsByClassName('preloader-wrapper')[0];
const sectionTitle = document.getElementById('section-title-text');
const loadMore = document.getElementById('load-more');
const pokemonsContainer = document.getElementById('pokemon-list');

//Species Model
class Species {
  constructor(pokemon) {
    this.name = pokemon.name ? pokemon.name : '';
    this.id = pokemon.id ? pokemon.id : '';
  }
}

//Our service for maintaining API calls
class ApiService {
  constructor(url) {
    this.API_URL = url;
    this.limit = 10;
    this.offset = 0;
    this.evolutionChain = new Map();
  }

  //function to handle fetch API errors
  static handleErrors(response) {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response;
  }

  //Card makup for species
  static renderSpecies(pokemon, isEvolution) {
    const cardWrapper = document.createElement('div');
    cardWrapper.className += ' col s12 m6 l3';
    let cta = `<div class="card-action"><a class="waves-effect waves-light btn-small evolution-tree" data-id='${pokemon.id}' data-name='${pokemon.name}'>Evolution Chain</a></div>`
    const card = `<div class="card blue-grey darken-1">
  <div class="card-content white-text">
  <span class="card-title">${pokemon.name}</span>
  </div>
  ${!isEvolution ? cta : ''}
  </div>`
    cardWrapper.insertAdjacentHTML('beforeend', card);
    pokemonsContainer.appendChild(cardWrapper);
  }

  //Logic to get all the evolutions from evolution chain
  evolution(chain) {
    const len = chain.evolves_to.length;
    if (len === 0) {
      this.evolutionChain.set(chain.species.name, chain.species);
    } else {
      for (let i = 0; i < len; i++) {
        const poke = chain.evolves_to[i]
        this.evolutionChain.set(chain.species.name, chain.species);
        this.evolution(poke)
      }
    }
  }

  //Paginated response for species. Offset = 0, Limit = 10 at the beginning
  fetchAllSpecies() {
    sectionTitle.innerHTML = `Species`;
    const speciesUrl = `${this.API_URL}pokemon-species/`;
    loadMore.classList.remove("hidden");
    fetch(`${speciesUrl}?limit=${this.limit}&offset=${this.offset}`)
      .then(ApiService.handleErrors)
      .then((resp) => resp.json())
      .then((data) => {
        loader.classList.add("hidden");
        for (let pokemon of data.results) {
          //getting id from the url coming from API
          let id = parseInt((pokemon.url.slice(0, -1)).replace(speciesUrl, ''));
          ApiService.renderSpecies(new Species({ name: pokemon.name, id: id }), false);
        }
        this.offset = this.offset + 10;
      })
  }

  //can be used for fetching single species details
  fetchOneSpecies(id) {
    let url = `${this.API_URL}pokemon-species/`;
    fetch(`${url}${id}/`)
      .then(ApiService.handleErrors)
      .then((resp) => resp.json())
      .then(function (data) {
      })
  }

  //Similar to fetchAllSpecies, It can also be used for paginated response of evolution chains
  fetchEvolutionChains(limit, offset) {
    let url = `${this.API_URL}evolution-chain/`;
    fetch(`${url}?limit=${limit}&offset=${offset}`)
      .then(ApiService.handleErrors)
      .then((resp) => resp.json())
      .then(function (data) {
      })
  }

  //Reset the offset when coming back to All Species page
  resetOffset() {
    this.offset = 0;
  }

  //Fetch the evolution chain for a single species
  fetchEvolutionChain(id) {
    const speciesUrl = `${this.API_URL}pokemon-species/`;
    const evolutionUrl = `${this.API_URL}evolution-chain/`;
    pokemonsContainer.innerHTML = '';
    fetch(`${evolutionUrl}${id}/`)
      .then(ApiService.handleErrors)
      .then((resp) => resp.json())
      .then((data) => {
        loader.classList.add("hidden");
        let name = data.chain.species.name;
        name = name.charAt(0).toUpperCase() + name.slice(1);
        sectionTitle.innerHTML = `${name}'s Evolution Chain`;
        this.evolution(data.chain);
        if (this.evolutionChain.size > 0) {
          for (let [key, pokemon] of this.evolutionChain) {
            let id = parseInt((pokemon.url.slice(0, -1)).replace(speciesUrl, ''));
            ApiService.renderSpecies(new Species({ name: pokemon.name, id: id }), true);
          }
        } else {
          pokemonsContainer.innerHTML = 'No More Evolutions!';
        }
      })
  }
}

//Our object to handle all the API requests
const api = new ApiService('https://pokeapi.co/api/v2/');
api.fetchAllSpecies();

//Event listeners for get species evolution, get all species and load more
//Search event listeners can also be implemented in the similar manner
document.addEventListener('click', (e) => {
  if (e.target && e.target.className.indexOf('evolution-tree') >= 0) {
    loadMore.classList.add('hidden');
    loader.classList.remove("hidden");
    api.resetOffset();
    api.fetchEvolutionChain(parseInt(e.target.dataset.id));
  }
  if (e.target.id === 'getAllSpecies') {
    loader.classList.remove("hidden");
    pokemonsContainer.innerHTML = '';
    api.resetOffset();
    api.fetchAllSpecies();
  }
  if (e.target.id === 'load-more') {
    loader.classList.remove("hidden");
    api.fetchAllSpecies();
  }
});