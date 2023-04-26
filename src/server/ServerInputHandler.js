const MAX_JUMP = 0.6;
const INPUT_SCALE = 0.8;

export default class ServerInputHandler {
	
	#leftImp = false;
	#rightImp = false;
	#upImp = false;
	#entity = null;
	#queuedJump = null;
	
	constructor() {
	}
	
	updateInput(msg) {
		this.#leftImp = msg & 1;
		this.#rightImp = msg & 2;
		this.#upImp = msg & 4;
	}
	
	handleJump(vec) {
		if (this.#queuedJump) return;
		this.#queuedJump = vec;
	}
	
	setEntity(entity) { this.#entity = entity; };
	
	tick() {
		if (!this.#entity?.canControl()) return;
		let max = 0.5;
		let newVel = [this.#entity.dx, this.#entity.dy];
		let onGround = this.#entity.isOnGround();
		let cdx = onGround ? 0.05 : 0.025;
		let modified = false;
		
		if (onGround) {
			if (this.#queuedJump) {
				let magnitude = Math.sqrt(this.#queuedJump[0] * this.#queuedJump[0] + this.#queuedJump[1] * this.#queuedJump[1]);
				let k = Math.min(1, MAX_JUMP / magnitude) * INPUT_SCALE;
				newVel[0] += this.#queuedJump[0] * k;
				newVel[1] += this.#queuedJump[1] * k;
				modified = true;
			} else if (!this.#leftImp && !this.#rightImp) {
				newVel[0] = newVel[0] * this.#entity.groundFriction();
				modified = true;
			}
		}
		if (this.#leftImp && !this.#rightImp) {
			newVel[0] = this.#entity.dx > 0 && onGround ? 0 : this.#entity.dx > -max ? Math.max(-max, this.#entity.dx - cdx) : this.#entity.dx;
			modified = true;
		}
		if (this.#rightImp && !this.#leftImp) {
			newVel[0] = this.#entity.dx < 0 && onGround ? 0 : this.#entity.dx < max ? Math.min(max, this.#entity.dx + cdx) : this.#entity.dx;
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