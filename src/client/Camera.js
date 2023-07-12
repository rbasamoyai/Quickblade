import Vec2 from "../common/Vec2.js";

export default class Camera {

	#pos = Vec2.ZERO;
	#oldPos = Vec2.ZERO;

	constructor() {
	}
	
	setState(pos, oldPos) {
		this.#pos = pos;
		this.#oldPos = oldPos;
	}
	
	displacement(dt) {
		return this.#oldPos.addVec(this.#pos.subtractVec(this.#oldPos).scale(dt));
	}
	
	lerp(ctx, dt) {
		let d = this.displacement(dt);
		ctx.translate(8 - d.x, 7 - d.y);
	}
	
	get x() { return this.#pos.x; }
	get y() { return this.#pos.y; }
	
}