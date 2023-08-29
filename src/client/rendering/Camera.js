import Vec2 from "../../common/Vec2.js";

export default class Camera {

	#pos = Vec2.ZERO;
	#oldPos = Vec2.ZERO;
	layer;
	
	static #NORMAL_MOTION = new Vec2(1, 1);

	constructor(initialLayer = 0) {
		this.layer = initialLayer;
	}
	
	setState(pos, oldPos) {
		this.#pos = pos;
		this.#oldPos = oldPos;
	}
	
	displacement(dt, snapScale, motionScale = Camera.#NORMAL_MOTION) {
		let d = this.#oldPos.addVec(this.#pos.subtractVec(this.#oldPos).scale(dt)).multiplyVec(motionScale);
		if (!snapScale) return d;
		return new Vec2(Math.floor(d.x * snapScale), Math.floor(d.y * snapScale)).scale(1 / snapScale);
	}
	
	lerp(ctx, dt, snapScale, motionScale = Camera.#NORMAL_MOTION) {
		let d = this.displacement(dt, snapScale, motionScale);
		ctx.translate(8 - d.x, 7 - d.y);
	}
	
	bounds(dt, motionScale = Camera.#NORMAL_MOTION) {
		let d = this.displacement(dt, null, motionScale);
		return {
			minX: Math.floor(d.x - 8),
			minY: Math.floor(d.y - 7),
			maxX: Math.floor(d.x + 8),
			maxY: Math.floor(d.y + 8)
		};
	}
	
	get x() { return this.#pos.x; }
	get y() { return this.#pos.y; }
	
	
}