export default class AbstractScreen {

	#textRenderer;
	#widgets = [];
	#closed = false;

	#startTime = Date.now();

	constructor(textRenderer) {
		this.#textRenderer = textRenderer;
	}
	
	render(canvas, ctx, dt) {
		this.renderBg(canvas, ctx, dt);
		for (const widget of this.#widgets) {
			widget.render(canvas, ctx, dt);
		}
	}
	
	renderBg(canvas, ctx, dt) {}
	
	pausesLevel(level) {}
	
	get textRenderer() { return this.#textRenderer; }
	
	addWidget(widget) {
		this.#widgets.push(widget);
	}
	
	onMouseMove(mouseX, mouseY, oldMouseX, oldMouseY) {
		for (const widget of this.#widgets) {
			widget.setHovered(mouseX, mouseY);
		}
	}
	
	onMouseClick(mouseX, mouseY) {
		for (const widget of this.#widgets) {
			if (widget.isHovered()) widget.invokeCallback();
		}
	}
	
	close() { this.#closed = true; }
	isClosed() { return this.#closed; }
	
	timeElapsed() { return Date.now() - this.#startTime; }
	
	reset() {
		for (const widget of this.#widgets) {
			widget.setHoveredForce(false);
		}
	}

}