export default class WeightedCollection {

	static EMPTY = new WeightedCollection();

	#objects = [];
	#weights = [];
	#weightSum = 0;
	
	constructor() {
	}
	
	static of(...weightedChoices) {
		let map = new WeightedCollection();
		let sz = Math.ceil(weightedChoices.length / 2);
		for (let i = 0; i < sz; ++i) {
			let b = 2 * i;
			let obj = weightedChoices[b];
			let weight = weightedChoices.length === b + 1 ? 1 : weightedChoices[b+1];
			map.add(obj, weight);
		}
		return map;
	}
	
	add(o, weight) {
		this.#weightSum += weight;
		let index = this.#objects.indexOf(o);
		if (index === -1) {
			this.#objects.push(o);
			this.#weights.push(weight);
		} else {
			this.#weights[index] += weight;
		}
	}
	
	remove(o) {
		let index = this.#objects.indexOf(o);
		if (index === -1) return;
		this.#objects.splice(index, 1);
		this.#weightSum -= this.#weights[index];
		this.#weights.splice(index, 1);
	}
	
	// From: https://stackoverflow.com/a/1761646
	choose(rand, defVal = null) {
		let r = rand.nextFloat() * this.#weightSum;
		for (const [i, weight] of this.#weights.entries()) {
			if (r < weight) return this.#objects[i];
			r -= weight;
		}
		return defVal;
	}
	
	intersection(other) {
		let inter = new WeightedCollection();
		let set = new Set(this.#objects);
		for (const [obj, weight] of other.entries()) {
			if (set.has(obj)) inter.add(obj, this.#weights[this.#objects.indexOf(obj)] + weight);
		}
		return inter;
	}
	
	intersectSet(set) {
		let inter = new WeightedCollection();
		for (const [obj, weight] of this.entries()) {
			if (set.has(obj)) inter.add(obj, weight);
		}
		return inter;
	}
	
	keys() { return this.#objects[Symbol.iterator](); }
	
	values() { return this.#weights[Symbol.iterator](); }
	
	entries() {
		let objIter = this.#objects[Symbol.iterator]();
		let weightIter = this.#weights[Symbol.iterator]();
		return {
			next() {
				let obj = objIter.next();
				let weight = weightIter.next();
				return !obj.done && !weight.done ? { value: [obj.value, weight.value], done: false } : { value: null, done: true };
			},
			[Symbol.iterator]() { return this; }
		};
	}
	
	copy() {
		let c = new WeightedCollection();
		for (const [obj, weight] of this.entries()) c.add(obj, weight);
		return c;
	}
	
	

}