export default class ControlMapping {

	currentKey;
	#defaultKey;
	
	constructor(defaultKey, currentKey) {
		this.#defaultKey = defaultKey;
		this.currentKey = currentKey ? currentKey : this.#defaultKey;
	}
	
	resetDefault() { this.currentKey = this.#defaultKey; }

}