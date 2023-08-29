export default class PlayerAppearance {

	#skinColor;
	#eyeColor;

	constructor(skinColor, eyeColor) {
		this.#skinColor = skinColor;
		this.#eyeColor = eyeColor;
	}
	
	get skinColor() { return this.#skinColor; }
	get eyeColor() { return this.#eyeColor; }
	
	static random() {
		return new PlayerAppearance(randInt(0, 4), randInt(0, 5));
	}

}

function randInt(start, end) {
	return Math.floor(Math.random() * (end - start) + start);
}