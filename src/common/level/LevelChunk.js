import * as QBTiles from "../index/QBTiles.js";

export const CHUNK_SIZE = 32;

export class LevelChunk {
	
	#tiles = [];
	#pos;
	
	constructor(x, y, tile = QBTiles.AIR) {
		this.#pos = [x, y];
		let padId = QBTiles.getIdNum(tile);
		for (let i = 0; i < CHUNK_SIZE; ++i) {
			let row = [];
			for (let j = 0; j < CHUNK_SIZE; ++j) {
				row.push(padId);
			}
			this.#tiles.push(row);
		}
	}
	
	#validateChunkPos(tx, ty) {
		return 0 <= tx && tx < CHUNK_SIZE && 0 <= ty && ty < CHUNK_SIZE;
	}
	
	getTile(tx, ty) {
		return this.#validateChunkPos(tx, ty) ? this.#tiles[ty][tx] : QBTiles.AIR;
	}
	
	setTile(tx, ty, tile) {
		if (this.#validateChunkPos(tx, ty)) this.#tiles[ty][tx] = QBTiles.getIdNum(tile);
	}
	
	render(ctx, dt) {
		ctx.save();
		
		for (let ty = 0; ty < CHUNK_SIZE; ++ty) {
			ctx.save();
			for (let tx = 0; tx < CHUNK_SIZE; ++tx) {
				let tile = QBTiles.getFromIdNum(this.#tiles[ty][tx]);
				ctx.save();
				ctx.transform(1, 0, 0, -1, 0, 1);
				tile.render(ctx);
				ctx.restore();
				ctx.translate(1, 0);
			}
			ctx.restore();
			ctx.translate(0, 1);
		}
		
		ctx.restore();
	}
	
	get x() { return this.#pos[0]; }
	get y() { return this.#pos[1]; }
	
}

export function getChunkPos(x, y) { return [toChunkCoord(x), toChunkCoord(y)]; }

export function toChunkCoord(v) { return v < 0 ? CHUNK_SIZE + v % CHUNK_SIZE : v % CHUNK_SIZE; }

export function getChunkSection(x, y) { return [toChunkSection(x), toChunkSection(y)]; }
export function toChunkSection(v) { return Math.floor(v / CHUNK_SIZE); }

export function chunkInRange(chunk, startX, startY, endX, endY) {
	return startX <= chunk.x && chunk.x <= endX  && startY <= chunk.y && chunk.y < endY;
}