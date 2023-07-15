import AbstractTileTransform from "./AbstractTileTransform.js";
import { AIR } from "../../../index/QBTiles.js";

export default class SimplePalettedTileTransform extends AbstractTileTransform {
	
	#targetTile;
	#palette = [];
	#weights = [];
	#weightSum = 0;
	
	constructor(gen, targetTile, ...tilesAndChances) {
		super();
		
		this.#targetTile = targetTile;
		
		let sz = Math.ceil(tilesAndChances.length / 2);
		for (let i = 0; i < sz; ++i) {
			let b = 2 * i;
			this.#palette.push(tilesAndChances[b]);
			let weight = tilesAndChances.length === b + 1 ? 1 : tilesAndChances[b+1];
			this.#weights.push(weight);
			this.#weightSum += weight;
		}
	}
	
	apply(tile, gen, rand, x, y) {
		if (tile === this.#targetTile) gen.setTile(x, y, this.#chooseTile(rand));
	}
	
	// From: https://stackoverflow.com/a/1761646
	#chooseTile(rand) {
		let r = rand.nextFloat() * this.#weightSum;
		for (const [i, weight] of this.#weights.entries()) {
			if (r < weight) return this.#palette[i];
			r -= weight;
		}
		return QBTiles.AIR;
	}
	
}