export default class Widget {

	#screen;
	#x;
	#y;
	#width;
	#height;
	#regularTex;
	#hoverTex;
	#clickCallback;
	
	#isHovered;

	constructor(screen, x, y, width, height, clickCallback, regularTex, hoverTex) {
		this.#screen = screen;
		this.#x = x;
		this.#y = y;
		this.#width = width;
		this.#height = height;
		this.#clickCallback = clickCallback;
		this.#regularTex = regularTex;
		this.#hoverTex = hoverTex ? hoverTex : regularTex;
	}
	
	render(canvas, ctx, dt) {
		ctx.drawImage(this.#isHovered ? this.#hoverTex.imageResource : this.#regularTex.imageResource, this.#x, this.#y);
	}
	
	setHovered(mouseX, mouseY) {
		this.#isHovered = this.#x <= mouseX && mouseX < this.#x + this.#width && this.#y <= mouseY && mouseY < this.#y + this.#height;
	}
	
	setHoveredForce(value) { this.#isHovered = value; }
	
	invokeCallback() {
		this.#clickCallback(this);
	}
	
	isHovered() { return this.#isHovered; }
	
	get x() { return this.#x; }
	get y() { return this.#y; }
	get width() { return this.#width; }
	get height() { return this.#height; }
	
	get screen() { return this.#screen; }

}