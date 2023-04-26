import { AABB, collide } from "../Collision.js";

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
		
		this.#pos = [x, y];
		this.#oldPos = [x, y];
		this.#vel = [0, 0];
		
		//this.newPath();
		
		this.#level = level;
		this.#id = id ? id : COUNTER++;
	}
	
	getLoadSnapshot() {
		return {
			type: "qb:load_entity",
			id: this.#id,
			pos: [this.#pos[0], this.#pos[1]],
			entityType: this.#type.id
		};
	}
	
	get id() { return this.#id; }
	
	getUpdateSnapshot() {
		return {
			type: "qb:update_entity",
			id: this.#id,
			pos: this.#pos,
			oldPos: this.#oldPos,
			vel: this.#vel,
			facingRight: this.facingRight
		};
	}
	
	readUpdateSnapshot(data) {
		this.setPos(data.pos);
		this.setOldPos(data.oldPos);
		this.setVelocity(data.vel);
		this.facingRight = data.facingRight;
	}
	
	tick() {
		this.#oldPos = [this.#pos[0], this.#pos[1]];
		
		if (!this.noGravity) {
			let flag = this.isOnGround();
			this.#vel[1] = flag && this.dy <= 0.0001 ? 0 : this.dy - 0.02;
			if (flag) {
				this.#pos[1] = 2;
			}
		}
		this.move(this.dx, this.dy);
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
	
	get x() { return this.#pos[0]; }
	get y() { return this.#pos[1]; }
	setPos(pos) { this.#pos = pos; }
	move(dx, dy) { this.#pos = [this.x + dx, this.y + dy]; }
	
	get ox() { return this.#oldPos[0]; }
	get oy() { return this.#oldPos[1]; }
	setOldPos(oldPos) { this.#oldPos = oldPos; }
	
	get dx() { return this.#vel[0]; }
	get dy() { return this.#vel[1]; }
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
		let invPartialTicks = 1 - dt;
		return [this.ox * invPartialTicks + this.x * dt, this.oy * invPartialTicks + this.y * dt];
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