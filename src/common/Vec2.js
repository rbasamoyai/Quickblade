export default class Vec2 {
	
	#x;
	#y;
	
	static ZERO = new Vec2(0, 0);
	
	constructor(x, y) {
		this.#x = x;
		this.#y = y;
	}
	
	get x() { return this.#x; }
	get y() { return this.#y; }
	
	add(x, y) { return new Vec2(this.x + x, this.y + y); }
	addVec(vec) { return this.add(vec.x, vec.y); }
	
	subtract(x, y) { return this.add(-x, -y); }
	subtractVec(vec) { return this.subtract(vec.x, vec.y); }
	
	multiply(x, y) { return new Vec2(this.x * x, this.y * y); }
	multiplyVec(vec) { return this.multiply(vec.x, vec.y); }
	scale(s) { return this.multiply(s, s); }
	reverse() { return this.multiply(-1); }
	normalize() { return this.lengthSqr() < 1e-4 ? ZERO : this.scale(1 / this.length()); }
	
	lengthSqr() { return this.x * this.x + this.y * this.y; }
	length() { return Math.sqrt(this.lengthSqr()); }
	
	dot(vec) { return this.x * vec.x + this.y * vec.y; }
	
	roundOffEps() {
		return new Vec2(Math.round((this.x + Number.EPSILON) * 1e4) * 1e-4, Math.round((this.y + Number.EPSILON) * 1e4) * 1e-4);
	}
	
	toArray() { return [this.x, this.y]; }
	
}