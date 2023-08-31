import AbstractScreen from "./AbstractScreen.js";
import * as TextRenderer from "../TextRenderer.js";

export default class DeathScreen extends AbstractScreen {
	
	constructor() {
		super();
	}
	
	renderBg(ctx, dt) {
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, 256, 224);
		WidgetTextures.TEXT.render(ctx, "YOU DIED", 128, 104, TextRenderer.CENTER_ALIGN, 2, "#D81038");
	}
	
	pausesLevel(level) { return true; }
	
}