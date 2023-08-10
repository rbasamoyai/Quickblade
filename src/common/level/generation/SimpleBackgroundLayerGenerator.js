import AbstractLevelLayerGenerator from "./AbstractLevelLayerGenerator.js";
import SimplePalettedTileTransform from "./tile_transforms/SimplePalettedTileTransform.js";
import LevelLayer from "../LevelLayer.js";

import * as QBTiles from "../../index/QBTiles.js";

export default class SimpleBackgroundLayerGenerator extends AbstractLevelLayerGenerator {
	
	#bottomLeft;
	#dimensions;
	#transform;
	
	constructor(rand, msgLogger, bottomLeft, dimensions, ...tilesAndWeights) {
		super(rand, msgLogger, QBTiles.AIR);
		this.#bottomLeft = bottomLeft;
		this.#dimensions = dimensions;
		this.#transform = new SimplePalettedTileTransform(this, QBTiles.AIR, ...tilesAndWeights);
		
		let sx = this.#bottomLeft[0];
		let sy = this.#bottomLeft[1];
		let ex = sx + this.#dimensions[0];
		let ey = sy + this.#dimensions[1];
		
		for (let cy = sy; cy < ey; ++cy) {
			for (let cx = sx; cx < ex; ++cx) {
				this.allocChunk(cx, cy);
			}
		}
	}
	
	generateLayer(depth, motionScale, visualScale = 1) {
		this.applyTileTransform(this.#transform);
		return new LevelLayer(this.chunks, depth, motionScale, visualScale);
	}

}