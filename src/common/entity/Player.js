import { Creature } from "./Creature.js";
import { Monster } from "./Monster.js";
import { AABB } from "../Collision.js";
import * as EntityTextures from "./textures/EntityTextures.js";
import PlayerAppearance from "./PlayerAppearance.js";
import * as QBItems from "../index/QBItems.js";
import * as QBEntities from "../index/QBEntities.js";


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
	
	#inventory = [];
	
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
		
		result.inventory = [];
		for (const [item, count] of this.#inventory) {
			let key = QBItems.getIdKey(item);
			if (!key) continue;
			result.inventory.push([key, count]);
		}
		
		return result;
	}
	
	readUpdateSnapshot(data) {
		super.readUpdateSnapshot(data);
		this.#isAttacking = data.isAttacking;
		this.#invulnerability = data.invulnerability;
		this.#runTime = data.runTime;
		this.#appearance = new PlayerAppearance(data.skinColor, data.eyeColor);
		
		this.#inventory = [];
		for (const [id, count] of data.inventory) {
			let item = QBItems.getFromIdKey(id);
			if (!item || count < 1) continue;
			this.#inventory.push([item, count]);
		}
	}
	
	get inventory() { return this.#inventory; }
	
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
		
		let adx = Math.abs(this.dx);
		if (this.isOnGround() && adx > 0.01) {
			if (this.#runTime < 1) this.#runTime = 1;
			this.#runTime += adx;
			if (this.#runTime > 6) {
				this.#runTime = 1;
			}
		} else {
			this.#runTime = 0;
		}
		
		this.#inventory = this.#inventory.filter((e, i, arr) => {
			return e[0] && e[1] > 0;
		});
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
			ax = 32 * Math.min(Math.floor(this.#runTime), 6);
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

	pickUpItems() {
		let collided = this.layer.getEntities().filter(e => QBEntities.ITEM.is(e)).find(e => e.collideWithEntity(this));
		if (collided) this.pickUp(collided);
	}
	
	pickUp(itemEntity) {
		if (itemEntity.isEmpty()) return;
		let item = itemEntity.getItem();
		let oldCount = itemEntity.getItemCount();
		let count = oldCount;
		let stacksCountItem = 0;
		for (let i = 0; i < this.#inventory.length; ++i) {
			let entry = this.#inventory[i];
			let otherItem = entry[0];
			if (otherItem !== item) continue;
			++stacksCountItem;
			let maxDiff = item.stacksTo - entry[1];
			if (maxDiff < 1) continue;
			let addedCount = Math.min(maxDiff, count);
			entry[1] += addedCount;
			itemEntity.setItem(item, count - addedCount);
			count = itemEntity.getItemCount();
		}
		let maxSlots = 36;
		if (count > 0 && (item.maxStacks === -1 || stacksCountItem < item.maxStacks) && this.#inventory.length < maxSlots) {
			let fillableSlots = maxSlots - this.#inventory.length;
			if (item.maxStacks !== -1) fillableSlots = Math.min(item.maxStacks, fillableSlots);
			
			for (let i = 0; i < fillableSlots; ++i) {
				count = itemEntity.getItemCount();
				let maxCount = Math.min(item.stacksTo, count);
				this.#inventory.push([item, maxCount]);
				itemEntity.setItem(item, count - maxCount);
			}
		}
		count = itemEntity.getItemCount();
		if (count !== oldCount) {
			postMessage?.({ type: "qb:notification", id: this.id, text: `Picked up ${item.name} x${oldCount - count}` });
		}
	}

	dropItem(slotIndex, count) {
		if (slotIndex < 0 || this.#inventory.length <= slotIndex) return;
		let slot = this.#inventory[slotIndex];
		count = Math.min(slot[1], count);
		let itemEntity = QBEntities.ITEM.create(this.pos.x, this.pos.y + 0.25, this.level, this.layer);
		itemEntity.setItem(slot[0], count);
		slot[1] -= count;
		if (slot[1] < 1) this.#inventory.splice(slotIndex, 1);
		this.level.addTicked(itemEntity, this.layer.depth);
		this.level.snapshots.push(itemEntity.getLoadSnapshot());
		this.level.snapshots.push(this.getUpdateSnapshot());
	}
	
}