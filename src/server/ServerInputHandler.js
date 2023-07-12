import Vec2 from "../common/Vec2.js";

const MAX_JUMP = 0.6;
const INPUT_SCALE = 0.8;

export default class ServerInputHandler {
	
	#leftImp = false;
	#rightImp = false;
	#upImp = false;
	#downImp = false;
	#entity = null;
	#queuedJump = null;
	
	constructor() {
	}
	
	updateInput(msg) {
		this.#leftImp = msg & 1;
		this.#rightImp = msg & 2;
		this.#upImp = msg & 4;
		this.#downImp = msg & 8;
	}
	
	handleJump(vec) {
		if (this.#queuedJump || !this.#entity || this.#entity.noGravity) return;
		this.#queuedJump = vec;
	}
	
	setEntity(entity) { this.#entity = entity; };
	
	tick() {
		if (!this.#entity?.canControl()) return;
		let max = 0.5;
		let newVel = new Vec2(this.#entity.dx, this.#entity.dy);
		let onGround = this.#entity.isOnGround();
		let flying = this.#entity.noGravity;
		let cdx = onGround || flying ? 0.05 : 0.025;
		let modified = false;
		
		if (onGround) {
			if (this.#queuedJump) {
				let magnitude = Math.sqrt(this.#queuedJump[0] * this.#queuedJump[0] + this.#queuedJump[1] * this.#queuedJump[1]);
				let k = Math.min(1, MAX_JUMP / magnitude) * INPUT_SCALE;
				newVel = newVel.addVec(this.#queuedJump.scale(k));
				modified = true;
			} else if (!this.#leftImp && !this.#rightImp) {
				newVel = newVel.multiply(this.#entity.groundFriction(), 1);
				modified = true;
			}
		}
		if (this.#leftImp && !this.#rightImp) {
			newVel = new Vec2(this.#entity.dx > 0 && onGround ? 0 : this.#entity.dx > -max ? Math.max(-max, this.#entity.dx - cdx) : this.#entity.dx, newVel.y);
			modified = true;
		}
		if (this.#rightImp && !this.#leftImp) {
			newVel = new Vec2(this.#entity.dx < 0 && onGround ? 0 : this.#entity.dx < max ? Math.min(max, this.#entity.dx + cdx) : this.#entity.dx, newVel.y);
			modified = true;
		}
		
		if (flying) {
			let nx;
			if (this.#leftImp && !this.#rightImp) {
				nx = -0.5;
			} else if (!this.#leftImp && this.#rightImp) {
				nx = 0.5;
			} else {
				nx = 0;
			}
			let ny;			
			if (this.#upImp && !this.#downImp) {
				ny = 0.5;
			} else if (!this.#upImp && this.#downImp) {
				ny = -0.5;
			} else {
				ny = 0;
			}
			newVel = new Vec2(nx, ny);
			modified = true;
		}
		
		
		if (modified) {
			this.#entity.setVelocity(newVel);
			this.#entity.hasImpulse = true;
		}
		this.#entity.onJump();
		this.#queuedJump = null;
	}
	
}