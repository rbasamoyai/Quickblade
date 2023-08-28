export default class AbstractScreen {

	#textRenderer;

	constructor(textRenderer) {
		this.#textRenderer = textRenderer;
	}
	
	render(canvas, ctx, dt) {}
	
	pausesLevel(level) {}
	
	get textRenderer() { return this.#textRenderer; }

}