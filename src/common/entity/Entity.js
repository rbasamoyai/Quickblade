import { AABB, collide } from "../Collision.js";
import Vec2 from "../Vec2.js";

let COUNTER = 0;

export class Entity {
	
	// TODO: replace pos, oldPos, and vel with path system
	
	#pos;
	#oldPos;
	#vel;
	//#path = new Timeline();
	#level;
	#id;
	#width;
	#height;
	noGravity = false;
	#type;
	removed = false;
	facingRight = true;
	
	constructor(x, y, level, id, type) {
		this.#type = type;
		this.#width = type.properties.width;
		this.#height = type.properties.height;
		
		this.#pos = new Vec2(x, y);
		this.#oldPos = this.#pos;
		this.#vel = Vec2.ZERO;
		
		//this.newPath();
		
		this.#level = level;
		this.#id = id ? id : COUNTER++;
	}
	
	getLoadSnapshot() {
		return {
			type: "qb:load_entity",
			id: this.#id,
			pos: this.#pos.toArray(),
			entityType: this.#type.id
		};
	}
	
	get id() { return this.#id; }
	
	getUpdateSnapshot() {
		return {
			type: "qb:update_entity",
			id: this.#id,
			pos: this.#pos.toArray(),
			oldPos: this.#oldPos.toArray(),
			vel: this.#vel.toArray(),
			facingRight: this.facingRight
		};
	}
	
	readUpdateSnapshot(data) {
		this.setPos(new Vec2(...data.pos));
		this.setOldPos(new Vec2(...data.oldPos));
		this.setVelocity(new Vec2(...data.vel));
		this.facingRight = data.facingRight;
	}
	
	tick() {
		this.#oldPos = this.#pos;
		
		if (!this.noGravity) {
			this.#vel = new Vec2(this.dx, this.isOnGround() && this.dy <= 0.0001 ? 0 : this.dy - 0.02);
		}
		
		// Collision
		
		// Broad phase: get box from position to dx and do checks
		
		
		
		
		this.move(this.dx, this.dy);
	}
	
	moveAndCollide() {
		
	}
	
	isOnGround() {
		return this.y <= 2; // TODO collision
	}
	
	getAABB() {
		return new AABB(this.x - this.#width / 2, this.y - this.#height, this.#width, this.#height);
	}
	
	collide(other) {
		let hitboxes = this.getHitboxes();
		let hurtboxes = other.getHurtboxes();
		
		let otherVel = [other.dx, other.dy];
		
		for (const hitbox of hitboxes) {
			for (const hurtbox of hurtboxes) {
				if (collide(hitbox, hurtbox, this.#vel, otherVel)) return true;
			}
		}
		return false;
	}
	
	getHitboxes() {
		return [this.getAABB()];
	}
	
	getHurtboxes() {
		return [this.getAABB()];
	}
	
	onCollideEntity(other) {
		return false;
	}
	
	onCollideLevel() {
		return false;
	}
	
	get pos() { return this.#pos; }
	get x() { return this.#pos.x; }
	get y() { return this.#pos.y; }
	setPos(pos) { this.#pos = pos; }
	move(dx, dy) { this.#pos = this.#pos.add(dx, dy); }
	
	get oldPos() { return this.#oldPos; }
	get ox() { return this.#oldPos.x; }
	get oy() { return this.#oldPos.y; }
	setOldPos(oldPos) { this.#oldPos = oldPos; }
	
	get vel() { return this.#vel; }
	get dx() { return this.#vel.x; }
	get dy() { return this.#vel.y; }
	setVelocity(vel) { this.#vel = vel; }
	
	onJump() {}
	
	groundFriction() { return 0; }
	
	canControl() { return false; }
	
/* 	newPath() {
		this.#path.clear();
		this.#path.set(0, this.#vel);
	}
	
	updatePath(t) {
		this.#path.set(t, this.#vel);
	} */
	
	get level() { return this.#level; }
	
	get type() { return this.#type; }
	
	hurt(damage, attacker) { return false; }

	kill() {
		this.removed = true;
		this.#level.snapshots.push({
			type: "qb:remove_entity",
			id: this.#id
		});
	}
	
	isInvulnerable(attacker) { return false; }
	isHurt() { return false; }
	
	isAlive() { return !this.removed; }
	
	render(ctx, dt) {
		ctx.globalAlpha = 0.5;
		
		ctx.fillStyle = "#009f00";
		let hitboxes = this.getHitboxes();
		for (const bb of hitboxes) {
			ctx.fillRect(bb.topLeft[0] - this.x, bb.topLeft[1] - this.y + bb.height, bb.width, bb.height);
		}
		
		ctx.fillStyle = this.getFillStyle();
		let hurtboxes = this.getHurtboxes();
		for (const bb of hurtboxes) {
			ctx.fillRect(bb.topLeft[0] - this.x, bb.topLeft[1] - this.y + bb.height, bb.width, bb.height);
		}
		
		ctx.fillStyle = "#00ff00";
		ctx.globalAlpha = 1;
		
		ctx.beginPath();
		ctx.arc(0, 0, 0.125, 0, 2 * Math.PI);
		ctx.fill();
	}
	
	getFillStyle() { return "#ff9f9f"; }
	
	displacement(dt) {
		/* let sx = this.x;
		let sy = this.y;
		for (const seg of this.#path) {
			if (dt < seg.ts) break;
			let dt = Math.min(dt, seg.te) - seg.ts;
			sx += seg.vel[0] * dt;
			sy += seg.vel[1] * dt;
		}
		return [sx, sy]; */
		return this.#oldPos.addVec(this.#pos.subtractVec(this.#oldPos).scale(dt));
	}
	
}

export class EntityProperties {

	width;
	height;
	
	constructor() {
	}
	
	dimensions(width, height) {
		this.width = width;
		this.height = height;
		return this;
	}
	
}