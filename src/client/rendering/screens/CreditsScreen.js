import AbstractScreen from "./AbstractScreen.js";

import Widget from "./widgets/Widget.js";
import Button from "./widgets/Button.js";
import * as TextRenderer from "../TextRenderer.js";
import * as WidgetTextures from "./widgets/WidgetTextures.js";
import { ImageResource } from "../../../common/resource_management/ResourceLoading.js";
import TransitionScreen from "./TransitionScreen.js";

import { TITLE_GRAPHIC } from "./TitleScreen.js";

export default class CreditsScreen extends AbstractScreen {
	
	#backButton;
	
	constructor(titleScreen, screenChange) {
		super();
		
		this.#backButton = WidgetTextures.daggerButton(this, true, 16, 200, b => {
			screenChange(new TransitionScreen(this, titleScreen, screenChange, 2000));
		});
		this.addWidget(this.#backButton);
		
		this.addWidget(new Button(this, 64, 168, 16, 3, "Go to source", b => {
			window.open("https://github.com/rbasamoyai/Quickblade", "_blank");
		}));
	}
	
	renderBg(ctx, dt) {
		ctx.imageSmoothingEnabled = false;
		ctx.clearRect(0, 0, 256, 224);
		
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
		
		WidgetTextures.WINDOW.render(ctx, 24, 80, 26, 10);
		
		WidgetTextures.TEXT.render(ctx, "Programming, Art,", 32, 88, TextRenderer.LEFT_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
		WidgetTextures.TEXT.render(ctx, "and Design", 32, 96, TextRenderer.LEFT_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
		WidgetTextures.TEXT.render(ctx, "rbasamoyai", 224, 104, TextRenderer.RIGHT_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
		WidgetTextures.TEXT.render(ctx, "2023", 128, 120, TextRenderer.CENTER_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
		WidgetTextures.TEXT.render(ctx, "MIT License", 128, 128, TextRenderer.CENTER_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
		
		if (this.#backButton.isHovered()) {
			WidgetTextures.TEXT.render(ctx, "Back to title screen", 40, 200, TextRenderer.LEFT_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
		}
	}
	
	pausesLevel(level) { return true; }
	
}