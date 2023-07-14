import Vec2 from "../common/Vec2.js";
import { toChunkSection } from "../common/level/LevelChunk.js";

export default class Camera {

	#pos = Vec2.ZERO;
	#oldPos = Vec2.ZERO;
	layer;

	constructor(initialLayer = 0) {
		this.layer = initialLayer;
	}
	
	setState(pos, oldPos) {
		this.#pos = pos;
		this.#oldPos = oldPos;
	}
	
	displacement(dt, snapScale) {
		let d = this.#oldPos.addVec(this.#pos.subtractVec(this.#oldPos).scale(dt));
		if (!snapScale) return d;
		return new Vec2(Math.floor(d.x * snapScale), Math.floor(d.y * snapScale)).scale(1 / snapScale);
	}
	
	lerp(ctx, dt, snapScale) {
		let d = this.displacement(dt, snapScale);
		ctx.translate(8 - d.x, 7 - d.y);
	}
	
	bounds(dt) {
		let d = this.displacement(dt);
		return {
			minCX: toChunkSection(Math.floor(d.x - 8)),
			minCY: toChunkSection(Math.floor(d.y - 7)),
			maxCX: toChunkSection(Math.floor(d.x + 8)),
			maxCY: toChunkSection(Math.floor(d.y + 8))
		};
	}
	
	get x() { return this.#pos.x; }
	get y() { return this.#pos.y; }
	
	
}