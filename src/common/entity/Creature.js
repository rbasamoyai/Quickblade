import { Entity, EntityProperties } from "./Entity.js";

import Vec2 from "../Vec2.js";

const DEFAULT_HURT_TIME = 15;

export class Creature extends Entity {
	
	#hp;
	#maxHp;
	hurtTime = 0;
	hasImpulse = false;
	
	constructor(x, y, level, id, type) {
		super(x, y, level, id, type);
		this.#maxHp = type.properties.maxHp;
		this.#hp = this.#maxHp;
	}
	
	tick() {
		if (this.isHurt()) {
			--this.hurtTime;
		} else {
			this.hurtTime = 0;
		}
		super.tick();

		if (this.dx < 0) {
			this.facingRight = false;
		} else if (this.dx > 0) {
			this.facingRight = true;
		}
		if (!this.hasNoGravity() && this.isOnGround() && !this.hasImpulse) {
			this.setVelocity(new Vec2(this.dx * this.groundFriction(), this.dy));
		}
		this.hasImpulse = false;
	}
	
	getUpdateSnapshot() {
		let result = super.getUpdateSnapshot();
		result.hp = this.#hp;
		result.maxHp = this.#maxHp;
		result.hurtTime = this.hurtTime;
		return result;
	}
	
	readUpdateSnapshot(data) {
		super.readUpdateSnapshot(data);
		this.#hp = data.hp;
		this.#maxHp = data.maxHp;
		this.hurtTime = data.hurtTime;
	}
	
	get hp() { return this.#hp; }
	set hp(hp) { this.#hp = hp; }
	get maxHp() { return this.#maxHp }
	set maxHp(maxHp) { this.#maxHp = maxHp; }
	
	hurt(damage, attacker) {
		if (this.isInvulnerable(attacker)) return false;
		this.#hp = Math.floor(this.#hp - damage);
		this.hurtTime = DEFAULT_HURT_TIME;
		if (this.#hp <= 0) {
			this.kill();
		}
		return true;
	}
	
	isInvulnerable(attacker) { return this.isHurt(); }
	isHurt() { return this.hurtTime > 0; }
	
	groundFriction() {
		return this.isHurt() ? 0.6 : super.groundFriction();
	}
	
	getFillStyle() {
		let f = clamp(this.hurtTime / 15, 0, 1);
		let i = 159 + 96 * f;
		return `rgb(255, ${i}, ${i})`;
	}
	
}

export class CreatureProperties extends EntityProperties {
	
	maxHp;
	
	constructor() { super(); }
	
	maxHpCount(maxHp) {
		this.maxHp = maxHp;
		return this;
	}
	
}

function clamp(a, min, max) {
	return a < min ? min : a > max ? max : a;
}