import AbstractScreen from "./AbstractScreen.js";
import * as TextRenderer from "../TextRenderer.js";

export default class TitleScreen extends AbstractScreen {
	
	constructor(textRenderer) {
		super(textRenderer);
	}
	
	render(canvas, ctx, dt) {
		
	}
	
	pausesLevel(level) { return true; }
	
}