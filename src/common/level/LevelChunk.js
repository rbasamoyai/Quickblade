const CHUNK_SIZE = 32;

export default class LevelChunk {
	
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
		return this.#validateChunkPos(cx, cy) ? this.#tiles[cy][cx] : 0;
	}
	
	setTile(cx, cy, id) {
		if (this.#validateChunkPos) this.#tiles[cy][cx] = id;
	}
	
}

export function getChunkPos(x, y) {
	return [x % CHUNK_SIZE, y % CHUNK_SIZE];
}