import { Creature } from "./Creature.js";

const INITIAL_ATTACK_INVUL = 3;

export class Player extends Creature {
	
	#isAttacking = false;
	#invulnerability = 0;
	
	constructor(x, y, level, id, type) {
		super(x, y, level, id, type);
	}
	
	getUpdateSnapshot() {
		let result = super.getUpdateSnapshot();
		result.isAttacking = this.#isAttacking;
		result.invulnerability = this.#invulnerability;
		return result;
	}
	
	readUpdateSnapshot(data) {
		super.readUpdateSnapshot(data);
		this.#isAttacking = data.isAttacking;
		this.#invulnerability = data.invulnerability;
	}
	
	isInvulnerable() { return super.isInvulnerable() || this.#invulnerability > 0; }
	
	hurt(damage, attacker) {
		if (!super.hurt(damage, attacker)) return false;
		if (this.#invulnerability > 0) {
			--this.#invulnerability;
			this.hurtTime = 5;
		}
		return true;
	}
	
	tick() {
		super.tick();
		
		if (!this.noGravity && this.isOnGround()) {
			this.#isAttacking = false;
			this.#invulnerability = 0;
		}
	}
	
	onJump() {
		super.onJump();
		this.#isAttacking = true;
		this.#invulnerability = INITIAL_ATTACK_INVUL;
	}
	
	canControl() { return !this.isHurt(); }
	
	getFillStyle() {
		return this.#invulnerability ? "#ffffff" : super.getFillStyle();
	}
	
}