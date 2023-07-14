import * as LevelChunk from "../LevelChunk.js";
import * as QBTiles from "../../index/QBTiles.js";
import BiIntMap from "../../BiIntMap.js";

export default class AbstractLevelLayerGenerator {

	#rand;
	#chunks = new BiIntMap();
	#msgLogger;
	#defaultTile;
	
	/**
	 * Layer generators should not construct their own random generator.
	 */
	constructor(rand, msgLogger, defaultTile) {
		this.#rand = rand;
		this.#msgLogger = msgLogger;
		this.#defaultTile = defaultTile;
	}
	
	generateLayer(depth, motionScale, visualScale = 1) {
	}
	
	getTile(x, y) {
		let cx = LevelChunk.toChunkSection(x);
		let cy = LevelChunk.toChunkSection(y);
		let tx = LevelChunk.toChunkCoord(x);
		let ty = LevelChunk.toChunkCoord(y);
		return this.#chunks.has(cx, cy) ? this.#chunks.get(cx, cy).getTile(tx, ty) : QBTiles.AIR;
	}
	
	setTile(x, y, tile) {
		let cx = LevelChunk.toChunkSection(x);
		let cy = LevelChunk.toChunkSection(y);
		let tx = LevelChunk.toChunkCoord(x);
		let ty = LevelChunk.toChunkCoord(y);
		if (!this.#chunks.has(cx, cy)) this.#chunks.set(cx, cy, new LevelChunk.LevelChunk(cx, cy, this.#defaultTile));
		this.#chunks.get(cx, cy).setTile(tx, ty, tile);
	}
	
	get rand() { return this.#rand; }
	get msgLogger() { return this.#msgLogger; }
	get chunks() { return this.#chunks; }
	get defaultTile() { return this.#defaultTile; }
	
}