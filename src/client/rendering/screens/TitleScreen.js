import AbstractScreen from "./AbstractScreen.js";

import Widget from "./widgets/Widget.js";
import Button from "./widgets/Button.js";
import * as TextRenderer from "../TextRenderer.js";
import * as WidgetTextures from "./widgets/WidgetTextures.js";
import { ImageResource } from "../../../common/resource_management/ResourceLoading.js";
import TransitionScreen from "./TransitionScreen.js";

const TITLE_GRAPHIC = new ImageResource("ui/title");
const ROMAN_YELLOW = "#FFB800"; // Sourced from flag of Rome, adjusted for 16-bit color

export default class TitleScreen extends AbstractScreen {
	
	#callback;
	#screenChange;
	
	constructor(textRenderer, callback, screenChange) {
		super(textRenderer);
		this.#callback = callback;
		this.#screenChange = screenChange;
		
		this.addWidget(WidgetTextures.daggerButton(this, false, 80, 152, b => this.#executeCallback(0)));
		this.addWidget(WidgetTextures.daggerButton(this, false, 80, 160, b => this.#executeCallback(1)));
		this.addWidget(WidgetTextures.daggerButton(this, false, 80, 168, b => this.#executeCallback(2)));
	}
	
	renderBg(canvas, ctx, dt) {
		ctx.imageSmoothingEnabled = false;
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, 256, 224);
		
		let shift = Math.floor(this.timeElapsed() / 1000 % 1 * 32);
		
		ctx.save();
		ctx.translate(shift - 32, 0);
		for (let y = 0; y < 8; ++y) {
			ctx.save();
			for (let x = 0; x < 9; ++x) {
				ctx.drawImage(WidgetTextures.BACKGROUND.imageResource, 0, 0);
				ctx.translate(32, 0);
			}
			ctx.restore();
			ctx.translate(0, 32);
		}
		ctx.restore();
		
		ctx.drawImage(WidgetTextures.FRAME.imageResource, 0, 0);
		ctx.drawImage(TITLE_GRAPHIC.imageResource, 0, 0);
		
		WidgetTextures.WINDOW.render(ctx, 72, 144, 14, 5);
		
		this.textRenderer.render(ctx, "Start", 104, 152, TextRenderer.LEFT_ALIGN, 1, ROMAN_YELLOW);
		this.textRenderer.render(ctx, "Settings", 104, 160, TextRenderer.LEFT_ALIGN, 1, ROMAN_YELLOW);
		this.textRenderer.render(ctx, "Credits", 104, 168, TextRenderer.LEFT_ALIGN, 1, ROMAN_YELLOW);
	}
	
	#executeCallback(value) {
		let screen = this.#callback(value);
		if (screen) this.#screenChange(new TransitionScreen(this.textRenderer, this, screen, this.#screenChange, 2000));
	}
	
	pausesLevel(level) { return true; }
	
}