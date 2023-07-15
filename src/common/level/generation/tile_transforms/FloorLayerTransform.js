import SimplePalettedTileTransform from "./SimplePalettedTileTransform.js";

export default class FloorLayerTransform extends SimplePalettedTileTransform {
	
	#aboveTargetTile;
	
	constructor(gen, targetTile, aboveTargetTile, ...tilesAndChances) {
		super(gen, targetTile, ...tilesAndChances);
		this.#aboveTargetTile = aboveTargetTile;
	}
	
	apply(tile, gen, rand, x, y) {
		if (gen.getTile(x, y + 1) === this.#aboveTargetTile) super.apply(tile, gen, rand, x, y);
	}
	
}