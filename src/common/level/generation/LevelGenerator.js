import Level from "../Level.js";

import TraversableLayerGenerator from "./TraversableLayerGenerator.js";

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
	
	generateLevel() {
		// Make main layer as well as other layers.
		// Pick from a theme pool.
		let mainLayerGenerator = new TraversableLayerGenerator(this.#rand, this.#msgLogger);
		this.#layers.set(0, mainLayerGenerator.generateLayer(0, new Vec2(1, 1)));
		
		this.#msgLogger("Done generating dungeon.");
		return new Level(this.#layers);
	}

}