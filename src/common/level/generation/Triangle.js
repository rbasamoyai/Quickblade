export default class Triangle {
	
	#vert1;
	#id1;
	#vert2;
	#id2;
	#vert3;
	#id3;
	
	#cached = false;
	#circumX = null;
	#circumY = null;
	#radiusSqr = null;
	
	constructor(vert1, id1, vert2, id2, vert3, id3) {
		this.#vert1 = vert1;
		this.#id1 = id1;
		this.#vert2 = vert2;
		this.#id2 = id2;
		this.#vert3 = vert3;
		this.#id3 = id3;
	}
	
	// From https://youtu.be/4ySSsESzw2Y?t=173.
	inCircumcircle(x, y) {
		if (!this.#cached) {
			let f1 = this.#vert2.y - this.#vert3.y;
			let f2 = this.#vert3.y - this.#vert1.y;
			let f3 = this.#vert1.y - this.#vert2.y;
			let dRecip = 0.5 / (this.#vert1.x * f1 + this.#vert2.x * f2 + this.#vert3.x * f3);
			
			let f4 = this.#vert1.lengthSqr();
			let f5 = this.#vert2.lengthSqr();
			let f6 = this.#vert3.lengthSqr();
			
			this.#circumX = dRecip * (f4 * f1 + f5 * f2 + f6 * f3);
			this.#circumY = dRecip * (f4 * (this.#vert3.x - this.#vert2.x) + f5 * (this.#vert1.x - this.#vert3.x) + f6 * (this.#vert2.x - this.#vert1.x));
			
			let f7 = this.#vert1.x - this.#circumX;
			let f8 = this.#vert1.y - this.#circumY;
			this.#radiusSqr = f7 * f7 + f8 * f8;
			this.#cached = true;
		}
		let rx = x - this.#circumX;
		let ry = y - this.#circumY;
		return this.#radiusSqr > rx * rx + ry * ry;
	}
	
	allEdges() {
		return [[this.#id1, this.#id2], [this.#id2, this.#id3], [this.#id3, this.#id1]];
	}
	
	resolveEdges() {
		// Vertices with IDs less than 0, e.g. -1, are temporary vertices and usually belong to the initial
		// super-triangle used in the Bowyer-Watson method for Delaunay triangulation.
		let ret = [];
		if (this.#id1 >= 0 && this.#id2 >= 0) ret.push([this.#id1, this.#id2]);
		if (this.#id2 >= 0 && this.#id3 >= 0) ret.push([this.#id2, this.#id3]);
		if (this.#id3 >= 0 && this.#id1 >= 0) ret.push([this.#id3, this.#id1]);
		return ret;
	}
	
	allVerts() {
		let ret = new Map();
		ret.set(this.#id1, this.#vert1);
		ret.set(this.#id2, this.#vert2);
		ret.set(this.#id3, this.#vert3);
		return ret;
	}
	
}