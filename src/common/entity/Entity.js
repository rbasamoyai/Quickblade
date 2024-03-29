import { AABB } from "../Collision.js";
import Vec2 from "../Vec2.js";
import * as QBTiles from "../index/QBTiles.js";
import * as Direction from "../Direction.js";

let COUNTER = 0;

export class Entity {
	
	// TODO: replace pos, oldPos, and vel with path system
	
	#pos;
	#oldPos;
	#vel;
	//#path = new Timeline();
	#level;
	#layer;
	#id;
	#width;
	#height;
	#isOnGround = false;
	noGravity = false;
	#type;
	removed = false;
	facingRight = true;
	
	constructor(x, y, level, layer, id, type) {
		this.#type = type;
		this.#width = type.properties.width;
		this.#height = type.properties.height;
		
		this.#pos = new Vec2(x, y);
		this.#oldPos = this.#pos;
		this.#vel = Vec2.ZERO;
		
		//this.newPath();
		
		this.#level = level;
		this.#layer = layer;
		this.#id = id ? id : COUNTER++;
	}
	
	getLoadSnapshot() {
		return {
			type: "qb:load_entity",
			id: this.id,
			pos: this.pos.toArray(),
			entityType: this.#type.id,
			layer: this.layer.depth
		};
	}
	
	get id() { return this.#id; }
	
	getUpdateSnapshot() {
		return {
			type: "qb:update_entity",
			id: this.id,
			pos: this.pos.toArray(),
			oldPos: this.oldPos.toArray(),
			vel: this.vel.toArray(),
			facingRight: this.facingRight,
			layer: this.layer.depth,
			onGround: this.isOnGround()
		};
	}
	
	readUpdateSnapshot(data) {
		this.setPos(new Vec2(...data.pos));
		this.setOldPos(new Vec2(...data.oldPos));
		this.setVelocity(new Vec2(...data.vel));
		this.facingRight = data.facingRight;
		this.#isOnGround = data.onGround;
	}
	
	tick() {
		this.#oldPos = this.#pos;
		
		if (!this.hasNoGravity()) {
			this.setVelocity(new Vec2(this.dx, this.dy - 0.02));
		}
		this.setVelocity(this.vel.roundOffEps());
		this.moveAndCollide();	
		
		this.move(this.dx, this.dy);
	}
	
	moveAndCollide() {
		// Broad phase: get box from position to dx and do checks
		let aabb = this.getAABB();
		let odx = this.dx;
		let testVel = new Vec2(this.dx, this.noGravity ? this.dy : this.dy - 0.02);
		let broadAABB = aabb.expandTowards(testVel.x, testVel.y);
		
		let minX = Math.floor(broadAABB.bottomLeft.x);
		let minY = Math.floor(broadAABB.bottomLeft.y);
		let maxX = Math.floor(broadAABB.bottomLeft.x + broadAABB.width);
		let maxY = Math.floor(broadAABB.bottomLeft.y + broadAABB.height);
		
		// First pass: order
		let results = [];
		for (let ty = minY; ty <= maxY; ++ty) {
			for (let tx = minX; tx <= maxX; ++tx) {
				let tile = this.layer.getTile(tx, ty);
				if (!tile.canCollide(this)) continue;
				let result = aabb.collideBox(new AABB(tx, ty, 1, 1), testVel);
				if (!result.hit || !Number.isFinite(result.face)) continue;
				
				let normal = Direction.normal(result.face);
				let nextTile = this.layer.getTile(tx + normal.x, ty + normal.y);
				if (nextTile.canCollide(this) && tile.getTileLength(result.face) <= nextTile.getTileLength(Direction.opposite(result.face))) {
					continue;
				}
				
				result.tx = tx;
				result.ty = ty;
				results.push(result);
			}
		}
		results.sort(compareHitResults);
		
		// Second pass: push
		let onGround = false;
		for (const res of results) {
			let res1 = aabb.collideBox(new AABB(res.tx, res.ty, 1, 1), this.vel);
			if (!res1.hit || !Number.isFinite(res1.face)) continue;
			let tile = this.layer.getTile(res.tx, res.ty);
			tile.pushOff(this, res.tx, res.ty, res1.face, res1.time);
			onGround ||= res1.face === Direction.UP;
		}
		this.#isOnGround = onGround;
	}
	
	getAABB() {
		return new AABB(this.x - this.#width / 2, this.y, this.#width, this.#height);
	}
	
	collideWithEntity(other) {
		let hitboxes = this.getHitboxes();
		let hurtboxes = other.getHurtboxes();
		
		for (const hitbox of hitboxes) {
			for (const hurtbox of hurtboxes) {
				if (hitbox.collideBox(hurtbox, this.vel, other.vel).hit) return true;
			}
		}
		return false;
	}
	
	isOnGround() {
		return this.#isOnGround;
	}
	
	hasNoGravity() {
		return this.noGravity;
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
	get layer() { return this.#layer; }
	setLayer(layer) { this.#layer = layer; }
	
	get type() { return this.#type; }
	
	hurt(damage, attacker) { return false; }

	kill() {
		this.removed = true;
	}
	
	isInvulnerable(attacker) { return false; }
	isHurt() { return false; }
	
	isAlive() { return !this.removed; }
	
	render(ctx, dt) {
		ctx.globalAlpha = 0.5;
		
		ctx.save();
		ctx.translate(-this.x, -this.y);
		ctx.fillStyle = "#009f00";
		let hitboxes = this.getHitboxes();
		for (const bb of hitboxes) {
			ctx.fillRect(bb.bottomLeft.x, bb.bottomLeft.y, bb.width, bb.height);
		}
		
		ctx.fillStyle = this.getFillStyle();
		let hurtboxes = this.getHurtboxes();
		for (const bb of hurtboxes) {
			ctx.fillRect(bb.bottomLeft.x, bb.bottomLeft.y, bb.width, bb.height);
		}
		ctx.restore();
		
		ctx.fillStyle = "#00ff00";
		ctx.globalAlpha = 1;
		
		ctx.beginPath();
		ctx.arc(0, 0, 0.125, 0, 2 * Math.PI);
		ctx.fill();
	}
	
	getFillStyle() { return "#ff9f9f"; }
	
	displacement(dt, snapScale) {
		/* let sx = this.x;
		let sy = this.y;
		for (const seg of this.#path) {
			if (dt < seg.ts) break;
			let dt = Math.min(dt, seg.te) - seg.ts;
			sx += seg.vel[0] * dt;
			sy += seg.vel[1] * dt;
		}
		return [sx, sy]; */
		let d = this.#oldPos.addVec(this.#pos.subtractVec(this.#oldPos).scale(dt));
		if (!snapScale) return d;
		return new Vec2(Math.floor(d.x * snapScale), Math.floor(d.y * snapScale)).scale(1 / snapScale);
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

function compareHitResults(a, b) {
	if (Number.isNaN(a.time) || Number.isNaN(b.time)) return 0;
	if (a.time < b.time) return -1;
	return a.time > b.time ? 1 : 0;
}