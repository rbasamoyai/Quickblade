import { Creature } from "./Creature.js";
import { Monster } from "./Monster.js";
import { AABB } from "../Collision.js";
import * as EntityTextures from "./textures/EntityTextures.js";
import PlayerAppearance from "./PlayerAppearance.js";

import Vec2 from "../Vec2.js";

const INITIAL_ATTACK_INVUL = 3;
const RANDOM_KNOCKBACK_BOUNDARY = 0.01;
const KNOCKBACK = 0.5;

export class Player extends Creature {
	
	#isAttacking = false;
	#invulnerability = 0;
	#coyoteTime = 0;
	#runTime = 0;
	
	#appearance = PlayerAppearance.random();
	
	constructor(x, y, level, layer, id, type) {
		super(x, y, level, layer, id, type);
	}
	
	set appearance(a) { this.#appearance = a; }
	
	getUpdateSnapshot() {
		let result = super.getUpdateSnapshot();
		result.isAttacking = this.#isAttacking;
		result.invulnerability = this.#invulnerability;
		result.runTime = this.#runTime;
		result.skinColor = this.#appearance.skinColor;
		result.eyeColor = this.#appearance.eyeColor;
		return result;
	}
	
	readUpdateSnapshot(data) {
		super.readUpdateSnapshot(data);
		this.#isAttacking = data.isAttacking;
		this.#invulnerability = data.invulnerability;
		this.#runTime = data.runTime;
		this.#appearance = new PlayerAppearance(data.skinColor, data.eyeColor);
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
		
		this.#coyoteTime = this.isOnGround() ? 6 : Math.max(0, this.#coyoteTime - 1);
		
		if (!this.hasNoGravity() && this.isOnGround()) {
			this.#isAttacking = false;
			this.#invulnerability = 0;
		}
		
		if (this.#isAttacking) {
			let collided = this.layer.getEntities().filter(e => e instanceof Monster).find(e => this.collideWithEntity(e));
			if (collided?.hurt(1, this)) {
				let x = collided.x - this.x;
				let dy = collided.isOnGround() ? 0.1 : collided.dy;
				if (x < -RANDOM_KNOCKBACK_BOUNDARY) {
					collided.setVelocity(new Vec2(-KNOCKBACK, dy));
				} else if (x > RANDOM_KNOCKBACK_BOUNDARY) {
					collided.setVelocity(new Vec2(KNOCKBACK, dy));
				} else {
					let dx = Math.random() > 0.5 ? KNOCKBACK : -KNOCKBACK;
					collided.setVelocity(new Vec2(dx, dy));
				}
			}
		}
		
		if (this.isOnGround() && Math.abs(this.dx) > 0.01) {
			++this.#runTime;
			if (this.#runTime > 6) {
				this.#runTime = 1;
			}
		} else {
			this.#runTime = 0;
		}
	}
	
	canJump() {
		return !this.hasNoGravity() && this.#coyoteTime > 0 && !this.#isAttacking;
	}
	
	getHitboxes() {
		if (!this.#isAttacking) return [];
		let sx = this.facingRight ? this.x + 0.5 : this.x - 2.5;
		return [new AABB(sx, this.y, 2, 2)];
	}
	
	onJump() {
		super.onJump();
		this.#coyoteTime = 0;
		this.#isAttacking = true;
		this.#invulnerability = INITIAL_ATTACK_INVUL;
	}
	
	canControl() { return !this.isHurt(); }
	
	getFillStyle() {
		return this.#invulnerability ? "#ffffff" : super.getFillStyle();
	}
	
	render(ctx, dt) {
		// TODO: customization, armor
		
		let playerTextures = EntityTextures.PLAYER_BODY[this.#appearance.skinColor];
		let eyes = EntityTextures.PLAYER_EYES[this.#appearance.eyeColor];
		let top = EntityTextures.TUNIC;
		let shoes = EntityTextures.SANDALS;
		
		let ax = 0;
		let ay = 0;
		if (this.isOnGround() && this.#runTime > 0) {
			ax = 32 * Math.min(this.#runTime, 6);
		} else if (!this.isOnGround()) {
			ax = 224;
		}
		
		ctx.save();
		ctx.translate(-1, 2);
		ctx.transform(1, 0, 0, -1, 0, 0);
		if (!this.facingRight) ctx.transform(-1, 0, 0, 1, 2, 0);
		ctx.imageSmoothingEnabled = false;
		
		ctx.drawImage(playerTextures.underBody.imageResource, ax, ay, 32, 32, 0, 0, 2, 2);
		ctx.drawImage(top.imageResource, ax, ay, 32, 32, 0, 0, 2, 2);
		ctx.drawImage(shoes.imageResource, ax, ay, 32, 32, 0, 0, 2, 2);
		ctx.drawImage(playerTextures.arms.imageResource, ax, ay, 32, 32, 0, 0, 2, 2);
		ctx.drawImage(playerTextures.head.imageResource, ax, ay, 32, 32, 0, 0, 2, 2);
		ctx.drawImage(eyes.imageResource, ax, ay, 32, 32, 0, 0, 2, 2);
		
		ctx.restore();
	}
	
}