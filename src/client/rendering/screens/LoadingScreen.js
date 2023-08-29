import AbstractScreen from "./AbstractScreen.js";
import * as TextRenderer from "../TextRenderer.js";

export default class LoadingScreen extends AbstractScreen {
	
	#startTime;
	
	constructor(textRenderer) {
		super(textRenderer);
		this.#startTime = Date.now();
	}
	
	renderBg(canvas, ctx, dt) {
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		let diff = Date.now() - this.#startTime;
		let count = Math.floor(diff / 500 % 4);
		let suffix = ".".repeat(count) + " ".repeat(3 - count);
		this.textRenderer.render(ctx, "Loading" + suffix, 128, 104, TextRenderer.CENTER_ALIGN, 2);
	}
	
	pausesLevel(level) { return true; }
	
}