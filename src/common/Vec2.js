export default class Vec2 {
	
	#x;
	#y;
	
	constructor(x, y) {
		this.#x = x;
		this.#y = y;
	}
	
	get x() { return this.#x; }
	get y() { return this.#y; }
	
	add(x, y) { return new Vec2(this.x + x, this.y + y); }
	add(vec) { return this.add(vec.x, vec.y); }
	
	subtract(x, y) { return this.add(-x, -y); }
	subtract(x, y) { return this.subtract(vec.x, vec.y); }
	
	multiply(x, y) { return new Vec2(this.x * x, this.y * y); }
	multiply(vec) { return this.multiply(vec.x, vec.y); }
	scale(s) { return this.multiply(s, s); }
	reverse() { return this.multiply(-1); }
	
	lengthSqr() { return this.x * this.x + this.y * this.y; }
	length() { return Math.sqrt(this.lengthSqr()); }
	
	dot(vec) { return this.x * vec.x + this.y * vec.y; }
	
}