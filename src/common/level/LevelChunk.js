import * as QBTiles from "../index/QBTiles.js";

export const CHUNK_SIZE = 32;

export class LevelChunk {
	
	#tiles = [];
	#pos;
	
	constructor(x, y) {
		this.#pos = [x, y];
		for (let i = 0; i < CHUNK_SIZE; ++i) {
			let row = [];
			for (let j = 0; j < CHUNK_SIZE; ++j) {
				row.push(0);
			}
			this.#tiles.push(row);
		}
	}
	
	#validateChunkPos(cx, cy) {
		return 0 <= cx && cx < CHUNK_SIZE && 0 <= cy && cy < CHUNK_SIZE;
	}
	
	getTile(cx, cy) {
		return this.#validateChunkPos(cx, cy) ? this.#tiles[cy][cx] : QBTiles.AIR;
	}
	
	setTile(cx, cy, tile) {
		if (this.#validateChunkPos(cx, cy)) this.#tiles[cy][cx] = QBTiles.getIdNum(tile);
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

export function getChunkPos(x, y) {
	return [x % CHUNK_SIZE, y % CHUNK_SIZE];
}