import AbstractTileTransform from "./AbstractTileTransform.js";
import WeightedCollection from "../../../WeightedCollection.js";
import { AIR } from "../../../index/QBTiles.js";

export default class SimplePalettedTileTransform extends AbstractTileTransform {
	
	#targetTile;
	#tiles;
	
	constructor(gen, targetTile, ...tilesAndChances) {
		super();
		this.#targetTile = targetTile;
		this.#tiles = WeightedCollection.of(...tilesAndChances);
	}
	
	apply(tile, gen, rand, x, y) {
		if (tile === this.#targetTile) gen.setTile(x, y, this.#tiles.choose(rand, AIR));
	}
	
}