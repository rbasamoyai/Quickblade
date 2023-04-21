import { Entity, EntityProperties } from "./Entity.js";

const DEFAULT_HURT_TIME = 15;

export class Creature extends Entity {
	
	#hp;
	#maxHp;
	hurtTime = 0;
	
	constructor(x, y, level, id, type) {
		super(x, y, level, id, type);
		this.#maxHp = type.properties.maxHp;
		this.#hp = this.#maxHp;
	}
	
	tick() {
		if (this.hurtTime > 0) {
			--this.hurtTime;
		} else {
			this.hurtTime = 0;
		}
		super.tick();
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
		if (this.isInvulnerable(attacker)) return;
		this.#hp = Math.floor(this.#hp - damage);
		this.hurtTime = DEFAULT_HURT_TIME;
		if (this.#hp <= 0) {
			this.kill();
		}
	}
	
	isInvulnerable(attacker) { return this.hurtTime > 0; }
	
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