export default class EdgeSet {

	#encodedSet = new Set();
	
	constructor() {
	}
	
	clear() { this.#encodedSet.clear(); } 
	
	add(v1, v2) {
		if (v1 !== v2) this.#encodedSet.add(encode(v1, v2));
	}
	
	delete(v1, v2) {
		this.#encodedSet.delete(encode(v1, v2));
		this.#encodedSet.delete(encode(v2, v1));
	}
	
	has(v1, v2) {
		return this.#encodedSet.has(encode(v1, v2)) || this.#encodedSet.has(encode(v2, v1));
	}
	
	values() {
		let baseIter = this.#encodedSet.values();
		return {
			next() {
				let base = baseIter.next();
				return { value: decode(base.value), done: base.done };
			},
			[Symbol.iterator]() { return this; }
		};
	}
	
	connectedTo(v) {
		let ret = [];
		for (const edge of this.values()) {
			if (edge[0] === v) ret.push(edge[1]);
			else if (edge[1] === v) ret.push(edge[0]);
		}
		return ret;
	}

}

function encode(v1, v2) {
	return v1 << 16 | v2 & 0xFFFF;
}

function decode(c) {
	let v2 = c & 0xFFFF;
	if (v2 & 0x8000) v2 |= 0xFFFF0000;
	return [c >> 16, v2];
}