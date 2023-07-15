export default class BiIntMap {

	#encodedMap = new Map();
	
	constructor() {
	}
	
	clear() { this.#encodedMap.clear(); } 
	
	set(v1, v2, e) { this.#encodedMap.set(encode(v1, v2), e); }
	get(v1, v2) { return this.#encodedMap.get(encode(v1, v2)); }	
	delete(v1, v2) { this.#encodedMap.delete(encode(v1, v2)); }
	has(v1, v2) { return this.#encodedMap.has(encode(v1, v2)); }
	
	keys() {
		let baseIter = this.#encodedMap.keys();
		return {
			next() {
				let base = baseIter.next();
				return { value: base.value ? decode(base.value) : null, done: base.done };
			},
			[Symbol.iterator]() { return this; }
		};
	}
	
	values() {
		return this.#encodedMap.values();
	}
	
	entries() {
		let baseIter = this.#encodedMap.entries();
		return {
			next() {
				let base = baseIter.next();
				return { value: base.value ? [decode(base.value[0]), base.value[1]] : null, done: base.done };
			},
			[Symbol.iterator]() { return this; }
		};
	}
	
	get size() { return this.#encodedMap.size; }
	
	matches(p1, p2) { return p1[0] === p2[0] && p1[1] === p2[1]; }

}

function encode(v1, v2) {
	return v1.toString() + "," + v2.toString();
}

function decode(c) {
	let sepI = c.indexOf(",");
	return [Number.parseInt(c.substring(0, sepI)), Number.parseInt(c.substring(sepI + 1))];
}