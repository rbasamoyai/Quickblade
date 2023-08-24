import * as LevelChunk from "./LevelChunk.js";
import * as QBTiles from "../index/QBTiles.js";

export default class LevelLayer {

	#level;
	#chunks;

	#depth;
	#motionScale;
	#visualScale;
	
	#bottomLeft;
	#dimensions;
	
	constructor(chunks, depth, motionScale, visualScale = 1) {
		this.#chunks = chunks;
		
		this.#depth = depth;
		this.#motionScale = motionScale;
		this.#visualScale = visualScale;
		
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		
		for (const chunk of this.#chunks.values()) {
			minX = Math.min(minX, chunk.x);
			minY = Math.min(minY, chunk.y);
			maxX = Math.max(maxX, chunk.x);
			maxY = Math.max(maxY, chunk.y);
		}
		
		if (Number.isFinite(minX) && Number.isFinite(minY) && Number.isFinite(maxX) && Number.isFinite(maxY)) {
			this.#bottomLeft = [minX, minY];
			this.#dimensions = [maxX - minX + 1, maxY - minY + 1];
		} else {
			this.#bottomLeft = [0, 0];
			this.#dimensions = [0, 0];
		}
	}
	
	get level() { return this.#level; }
	setLevel(level) { this.#level = level; }
	
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
		if (this.#chunks.has(cx, cy)) this.#chunks.get(cx, cy).setTile(tx, ty, tile);
	}
	
	tick() {}
	
	render(ctx, dt, camera, snapScale, motionScale) {
		let bounds = camera.bounds(dt, motionScale);
		
		ctx.save();
		camera.lerp(ctx, dt, snapScale, motionScale);
		ctx.translate(bounds.minX, bounds.minY);
		for (let ty = bounds.minY; ty <= bounds.maxY; ++ty) {
			ctx.save();
			for (let tx = bounds.minX; tx <= bounds.maxX; ++tx) {
				let tile = this.getTile(tx, ty);
				tile.render(ctx);
				ctx.translate(1, 0);
			}
			ctx.restore();
			ctx.translate(0, 1);
		}
		ctx.restore();
	}
	
	getAllChunks() { return this.#chunks; }
	
	get depth() { return this.#depth; }
	get motionScale() { return this.#motionScale; }
	get visualScale() { return this.#visualScale; }
	get bottomLeft() { return this.#bottomLeft; }
	get dimensions() { return this.#dimensions; }
	
	getLayerData() {
		return {
			type: "qb:layer",
			motionScale: this.motionScale.toArray(),
			visualScale: this.visualScale,
			count: this.getAllChunks().size
		};
	}

}