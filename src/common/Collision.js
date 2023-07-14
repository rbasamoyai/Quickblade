import Vec2 from "./Vec2.js";
import * as Direction from "./Direction.js";

export class AABB {
	
	bottomLeft;
	width;
	height;
	
	constructor(x, y, w, h) {
		this.bottomLeft = new Vec2(x, y);
		this.width = w;
		this.height = h;
	}
	
	centerPoint() {
		return new Vec2(this.bottomLeft.x + this.width * 0.5, this.bottomLeft.y + this.height * 0.5);
	}
	
	hasPoint(x, y) {
		return this.bottomLeft.x <= x && x < this.bottomLeft.x + this.width
			&& this.bottomLeft.y <= y && y < this.bottomLeft.y + this.height;
	}
	
	collideBox(other, thisVel = Vec2.ZERO, otherVel = Vec2.ZERO) {	
		let mainBox = other.conflate(this);
		let startPoint = this.centerPoint();
		let diff = startPoint.subtractVec(mainBox.centerPoint());
		
		let relVelX = thisVel.x - otherVel.x;
		let relVelY = thisVel.y - otherVel.y;
		
		let nearX = (mainBox.bottomLeft.x - startPoint.x) / relVelX;
		let farX = (mainBox.bottomLeft.x - startPoint.x + mainBox.width) / relVelX;
		if (Number.isNaN(nearX) || Number.isNaN(farX)) return HitResult.miss();
		if (farX < nearX) {
			let tmp = farX;
			farX = nearX;
			nearX = tmp;
		}
		
		let nearY = (mainBox.bottomLeft.y - startPoint.y) / relVelY;
		let farY = (mainBox.bottomLeft.y - startPoint.y + mainBox.height) / relVelY;
		if (Number.isNaN(nearY) || Number.isNaN(farY)) return HitResult.miss();
		if (farY < nearY) {
			let tmp = farY;
			farY = nearY;
			nearY = tmp;
		}
		
		if (nearX > farY || nearY > farX) return HitResult.miss();
		let tNear = Math.max(nearX, nearY);
		let tFar = Math.min(farX, farY);
		if (tNear > 1 || tFar <= 0) return HitResult.miss();
		let t = tNear;
		let pos = startPoint.addVec(thisVel.scale(t));
		if (nearX > nearY) {
			return HitResult.hit(pos, t, diff.x > 0 ? Direction.RIGHT : Direction.LEFT);
		} else {
			return HitResult.hit(pos, t, diff.y > 0 ? Direction.UP : Direction.DOWN);
		}
	}
	
	intersect(other) {
		return this.intersectionXOf(other) <= this.width + other.width
			&& this.intersectionYOf(other) <= this.height + other.height;
	}
	
	intersectionXOf(other) {
		let minX = Math.min(this.bottomLeft.x, other.bottomLeft.x);
		let maxX = Math.max(this.bottomLeft.x + this.width, other.bottomLeft.x + other.width);
		return maxX - minX;
	}
	
	intersectionYOf(other) {
		let minY = Math.min(this.bottomLeft.y, other.bottomLeft.y);
		let maxY = Math.max(this.bottomLeft.y + this.height, other.bottomLeft.y + other.height);
		return maxY - minY;
	}
	
	expandTowards(ex, ey) {
		let nx = ex < 0 ? this.bottomLeft.x + ex : this.bottomLeft.x;
		let ny = ey < 0 ? this.bottomLeft.y + ey : this.bottomLeft.y;
		let nw = this.width + Math.abs(ex);
		let nh = this.height + Math.abs(ey);
		return new AABB(nx, ny, nw, nh);
	}
	
	inflate(x, y) {
		return new AABB(this.bottomLeft.x - x, this.bottomLeft.y - y, this.width + x + x, this.height + y + y);
	}
	
	inflateAll(s) { return this.inflate(s, s); }
	
	conflate(other) {
		return this.inflate(other.width * 0.5, other.height * 0.5);
	}
	
	move(x, y) {
		return new AABB(this.bottomLeft.x + x, this.bottomLeft.y + y, this.width, this.height);
	}

}

export class HitResult {
	
	#hit;
	#pos;
	#time;
	#face;
	
	constructor(hit, pos, time, face) {
		this.#hit = hit;
		this.#pos = pos;
		this.#time = time;
		this.#face = face;
	}
	
	get hit() { return this.#hit; }
	get pos() { return this.#pos; }
	get time() { return this.#time; }
	get face() { return this.#face; }
	
	static miss() { return new HitResult(false); }
	static hit(pos, time, face) { return new HitResult(true, pos, time, face); }
	
}