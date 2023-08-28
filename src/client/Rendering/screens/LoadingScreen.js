import AbstractScreen from "./AbstractScreen.js";
import * as TextRenderer from "../TextRenderer.js";

export default class LoadingScreen extends AbstractScreen {
	
	#startTime;
	
	constructor(textRenderer) {
		super(textRenderer);
		this.#startTime = Date.now();
	}
	
	render(canvas, ctx, dt) {
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		
		let diff = Date.now() - this.#startTime;
		let count = Math.floor(diff / 500 % 4);
		let suffix = ".".repeat(count) + " ".repeat(3 - count);
		
		ctx.save();
		ctx.translate(canvas.width / 2, 208);
		ctx.scale(4, 4);
		this.textRenderer.render(ctx, "Loading" + suffix, TextRenderer.CENTER_ALIGN);
		ctx.restore();
	}
	
	pausesLevel(level) { return true; }
	
}