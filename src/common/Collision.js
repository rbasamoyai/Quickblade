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
		
		let relVel = thisVel.subtractVec(otherVel);
		let relVelR = new Vec2(1 / relVel.x, 1 / relVel.y);
		let transl = mainBox.bottomLeft.subtractVec(startPoint);
		let near = transl.multiplyVec(relVelR);
		let far = transl.add(mainBox.width, mainBox.height).multiplyVec(relVelR);
		if (Number.isNaN(near.x) || Number.isNaN(far.x) || Number.isNaN(near.y) || Number.isNaN(far.y)) return HitResult.miss();
		if (near.x > far.x) {
			let tmp = near.x;
			near = new Vec2(far.x, near.y);
			far = new Vec2(tmp, far.y);
		}
		if (near.y > far.y) {
			let tmp = near.y;
			near = new Vec2(near.x, far.y);
			far = new Vec2(far.x, tmp);
		}
		
		if (near.x > far.y || near.y > far.x) return HitResult.miss();
		let tNear = Math.max(near.x, near.y);
		let tFar = Math.min(far.x, far.y);
		if (tNear >= 1 || tFar <= 0) return HitResult.miss();
		
		if (tNear < 0 && Math.abs(tNear) > Math.abs(tFar)) {
			let pos = startPoint.addVec(thisVel.scale(tFar));
			if (far.y > far.x) {
				return HitResult.hit(pos, tFar, relVel.x < 0 ? Direction.LEFT : Direction.RIGHT);
			} else if (far.y < far.x) {
				return HitResult.hit(pos, tFar, relVel.y < 0 ? Direction.DOWN : Direction.UP);
			} else {
				return HitResult.miss();
			}
		} else {
			let pos = startPoint.addVec(thisVel.scale(tNear));
			if (near.x > near.y) {
				return HitResult.hit(pos, tNear, relVel.x < 0 ? Direction.RIGHT : Direction.LEFT);
			} else if (near.x < near.y) {
				return HitResult.hit(pos, tNear, relVel.y < 0 ? Direction.UP : Direction.DOWN);
			} else {
				return HitResult.miss();
			}
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