export default class BiIntSet {

	#encodedSet = new Set();
	
	constructor() {
	}
	
	clear() { this.#encodedSet.clear(); } 
	
	add(v1, v2) { this.#encodedSet.add(encode(v1, v2)); }
	delete(v1, v2) { this.#encodedSet.delete(encode(v1, v2)); }
	has(v1, v2) { return this.#encodedSet.has(encode(v1, v2)); }
	
	values() {
		let baseIter = this.#encodedSet.values();
		return {
			next() {
				let base = baseIter.next();
				return { value: base.value ? decode(base.value) : null, done: base.done };
			},
			[Symbol.iterator]() { return this; }
		};
	}
	
	get size() { return this.#encodedSet.size; }
	
	matches(p1, p2) { return p1[0] === p2[0] && p1[1] === p2[1]; }

}

function encode(v1, v2) {
	return v1.toString() + "," + v2.toString();
}

function decode(c) {
	let sepI = c.indexOf(",");
	return [Number.parseInt(c.substring(0, sepI)), Number.parseInt(c.substring(sepI + 1))];
}