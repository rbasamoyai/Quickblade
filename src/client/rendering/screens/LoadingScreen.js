import AbstractScreen from "./AbstractScreen.js";
import * as TextRenderer from "../TextRenderer.js";
import * as WidgetTextures from "./widgets/WidgetTextures.js";

export default class LoadingScreen extends AbstractScreen {
	
	#startTime;
	
	constructor() {
		super();
		this.#startTime = Date.now();
	}
	
	renderBg(ctx, dt) {
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, 256, 224);
		let count = Math.floor(this.timeElapsed() / 500 % 4);
		let suffix = ".".repeat(count) + " ".repeat(3 - count);
		WidgetTextures.TEXT.render(ctx, "Loading" + suffix, 128, 104, TextRenderer.CENTER_ALIGN, 2);
	}
	
	pausesLevel(level) { return true; }
	
}