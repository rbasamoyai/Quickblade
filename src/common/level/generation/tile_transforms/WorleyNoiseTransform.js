import AbstractTileTransform from "./AbstractTileTransform.js";

import BiIntMap from "../../../BiIntMap.js";
import Vec2 from "../../../Vec2.js";
import { CHUNK_SIZE } from "../../LevelChunk.js";

export default class WorleyNoiseTransform extends AbstractTileTransform {
	
	#scale;
	#subdivisions;
	
	#targetTile;
	#otherTiles;
	#points = new BiIntMap();
	
	constructor(gen, rand, scale, targetTile, ...otherTiles) {
		super();
		
		this.#scale = 2 ** clamp(scale, 2, 5);
		this.#subdivisions = Math.ceil(CHUNK_SIZE / this.#scale);
		
		this.#targetTile = targetTile;
		this.#otherTiles = [...otherTiles];
		let len = this.#otherTiles.length;
		
		for (const [pos, chunk] of gen.chunks.entries()) {
			let bx = pos[0] * this.#subdivisions;
			let by = pos[1] * this.#subdivisions;
			for (let ty = 0; ty < this.#subdivisions; ++ty) {
				for (let tx = 0; tx < this.#subdivisions; ++tx) {
					let pointLoc = new Vec2(gen.rand.nextFloat(), gen.rand.nextFloat()).scale(this.#scale);
					let tile = gen.rand.nextInt(0, len);
					this.#points.set(bx + tx, by + ty, { pos: pointLoc, tile: this.#otherTiles[tile] });
				}
			}
		}
	}
	
	apply(tile, gen, rand, x, y) {
		if (tile !== this.#targetTile) return;
		let sbx = this.#toSubchunkSection(x);
		let sby = this.#toSubchunkSection(y);
		if (!this.#points.has(sbx, sby)) return;
		
		let tx = this.#toSubchunkCoord(x) + 0.5;
		let ty = this.#toSubchunkCoord(y) + 0.5;
		
		let minDist = Infinity;
		let closestPoint = null;
		
		for (let sy = -1; sy <= 1; ++sy) {
			for (let sx = -1; sx <= 1; ++sx) {
				let sbx1 = sbx + sx;
				let sby1 = sby + sy;
				if (!this.#points.has(sbx1, sby1)) continue;
				let point = this.#points.get(sbx1, sby1);
				let dist = point.pos.add(sx * this.#scale - tx, sy * this.#scale - ty).lengthSqr();
				if (closestPoint && dist >= minDist) continue;
				minDist = dist;
				closestPoint = point;
			}
		}
		if (closestPoint) gen.setTile(x, y, closestPoint.tile);
	}
	
	#toSubchunkCoord(v) {
		return v < 0 ? (this.#scale + v % this.#scale) % this.#scale : v % this.#scale;
	}
	
	#toSubchunkSection(v) {
		return Math.floor(v / this.#scale);
	}
	
}

function clamp(v, min, max) {
	return v < min ? min : v < max ? v: max;
}