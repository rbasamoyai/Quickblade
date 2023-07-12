export default class QBRandom {

	#state;

	constructor(seed) {
		this.#state = seed ? seed : Date.now();
		this.#state >>>= 0;
	}
	
	next() {
		let x = this.#state;
		x ^= x << 13;
		x ^= x >> 17;
		x ^= x << 5;
		x >>>= 0;
		return this.#state = x;
	}
	
	nextInt(start, endExcl) {
		if (endExcl <= start) throw new Error("Invalid range, 'endExcl' must be greater than 'start'");
		let dx = endExcl - start;
		return this.next() % dx + start; 
	}
	
	static #MAX_UINT_RECIP = 1 / (2**32 - 1);
	
	nextFloat() { return this.next() * QBRandom.#MAX_UINT_RECIP; }
	
	// Taken from https://stackoverflow.com/a/36481059.
	nextGaussian(mean = 0, stddev = 1) {
		const u = 1 - this.nextFloat();
		const v = this.nextFloat();
		const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
		return z * stddev + mean;
	}
	
	nextBoolean() { return this.next() % 2 == 0; }

}