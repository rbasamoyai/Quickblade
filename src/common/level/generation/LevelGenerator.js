import Level from "../Level.js";

import TraversableLayerGenerator from "./TraversableLayerGenerator.js";
import WaveFunctionCollapseLayerGenerator from "./WaveFunctionCollapseLayerGenerator.js";

import QBRandom from "../../QBRandom.js";
import Vec2 from "../../Vec2.js";

export default class LevelGenerator {

	#seed;
	#rand;
	#msgLogger;
	#layers = new Map();
	
	constructor(seed, msgLogger = console.log) {
		this.#seed = seed ? seed : Date.now();
		this.#rand = new QBRandom(seed);
		this.#msgLogger = msgLogger;
		this.#msgLogger(`Dungeon seed: ${this.#seed}`);
	}
	
	async generateLevel() {
		this.#msgLogger("Loading generation assets...");
		let bgCfgFile = await this.loadFile("generation/dungeon_background_1.json");
		let backgroundGenConfig = await bgCfgFile.json();
		
		// Make main layer as well as other layers.
		// Pick from a theme pool.
		let mainLayerGenerator = new TraversableLayerGenerator(this.#rand, this.#msgLogger);
		let mainLayer = mainLayerGenerator.generateLayer(0, new Vec2(1, 1));
		this.#layers.set(0, mainLayer);
		
		let bottomLeft = mainLayer.bottomLeft;
		let dimensions = mainLayer.dimensions;
		
		let backgroundGen1 = new WaveFunctionCollapseLayerGenerator(this.#rand, this.#msgLogger, bottomLeft, dimensions, backgroundGenConfig);
		this.#layers.set(1, backgroundGen1.generateLayer(0, new Vec2(0.5, 1)));
		
		this.#msgLogger("Done generating dungeon.");
		return new Level(this.#layers);
	}
	
	async loadFile(path) {
		let fullPath = "../../resources/" + path;
		this.#msgLogger(`Loading ${fullPath}`);
		try {
			return fetch(fullPath);
		} catch (err) {
			this.#msgLogger(err);
		}
	}

}