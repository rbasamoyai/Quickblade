import BiIntSet from "./BiIntSet.js";

export default class UniqueBiIntQueue {

	#contained = new BiIntSet();
	#queue = [];
	
	constructor() {
	}
	
	get size() { return this.#contained.size; }
	
	push(x, y) {
		if (this.#contained.has(x, y)) return;
		this.#queue.push([x, y]);
		this.#contained.add(x, y);
	}
	
	pop() {
		if (this.#queue.length === 0) return null;
		let coords = this.#queue.pop();
		this.#contained.delete(...coords);
		return coords;
	}
	
	poll() {
		if (this.#queue.length === 0) return null;
		let coords = this.#queue.shift();
		this.#contained.delete(...coords);
		return coords;
	}
	
	[Symbol.iterator]() {
		return this.#queue;
	}

}