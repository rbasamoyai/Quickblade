import AbstractScreen from "./AbstractScreen.js";
import * as TextRenderer from "../TextRenderer.js";

export default class DeathScreen extends AbstractScreen {
	
	constructor(textRenderer) {
		super(textRenderer);
	}
	
	render(canvas, ctx, dt) {
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		
		ctx.save();
		ctx.translate(canvas.width / 2, 208);
		ctx.scale(4, 4);
		this.textRenderer.render(ctx, "YOU DIED", TextRenderer.CENTER_ALIGN, "crimson");
		ctx.restore();
	}
	
	pausesLevel(level) { return true; }
	
}