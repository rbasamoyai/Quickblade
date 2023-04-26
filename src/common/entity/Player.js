import { Creature } from "./Creature.js";
import { Monster } from "./Monster.js";
import { AABB } from "../Collision.js";

const INITIAL_ATTACK_INVUL = 3;
const RANDOM_KNOCKBACK_BOUNDARY = 0.01;
const KNOCKBACK = 0.5;

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
		
		if (this.#isAttacking) {
			let collided = this.level.getEntities().filter(e => e instanceof Monster).find(e => this.collide(e));
			if (collided?.hurt(1, this)) {
				let x = collided.x - this.x;
				let dy = collided.isOnGround() ? 0.1 : collided.dy;
				if (x < -RANDOM_KNOCKBACK_BOUNDARY) {
					collided.setVelocity([-KNOCKBACK, dy]);
				} else if (x > RANDOM_KNOCKBACK_BOUNDARY) {
					collided.setVelocity([KNOCKBACK, dy]);
				} else {
					let dx = Math.random() > 0.5 ? KNOCKBACK : -KNOCKBACK;
					collided.setVelocity([dx, dy]);
				}
			}
		}
	}
	
	getHitboxes() {
		if (!this.#isAttacking) return [];
		let sx = this.facingRight ? this.x + 0.5 : this.x - 2.5;
		return [new AABB(sx, this.y - 2, 2, 2)];
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