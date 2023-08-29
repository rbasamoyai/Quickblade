import AbstractScreen from "./AbstractScreen.js";

import Widget from "./widgets/Widget.js";
import Button from "./widgets/Button.js";

import { ImageResource } from "../../../common/resource_management/ResourceLoading.js";
import * as TextRenderer from "../TextRenderer.js";
import * as WidgetTextures from "./widgets/WidgetTextures.js";
import * as EntityTextures from "../../../common/entity/textures/EntityTextures.js";

const BACKGROUND = new ImageResource("ui/player_customization_0");
const FRAME = new ImageResource("ui/player_customization_1");
const ROMAN_YELLOW = "#FFB800"; // Sourced from flag of Rome, adjusted for 16-bit color

export default class PlayerAppearanceScreen extends AbstractScreen {
	
	#skinColor = randInt(0, 4);
	#eyeColor = randInt(0, 5);
	
	#startTime = Date.now();
	
	constructor(textRenderer, confirmCallback) {
		super(textRenderer);
		
		this.addWidget(new Widget(this, 24, 96, 16, 8, b => this.#cycleSkin(-1), WidgetTextures.SELECTOR_LEFT, WidgetTextures.SELECTOR_LEFT_HOVERED));
		this.addWidget(new Widget(this, 88, 96, 16, 8, b => this.#cycleSkin(1), WidgetTextures.SELECTOR_RIGHT, WidgetTextures.SELECTOR_RIGHT_HOVERED));
		
		this.addWidget(new Widget(this, 24, 112, 16, 8, b => this.#cycleEyes(-1), WidgetTextures.SELECTOR_LEFT, WidgetTextures.SELECTOR_LEFT_HOVERED));
		this.addWidget(new Widget(this, 88, 112, 16, 8, b => this.#cycleEyes(1), WidgetTextures.SELECTOR_RIGHT, WidgetTextures.SELECTOR_RIGHT_HOVERED));
		
		this.addWidget(new Button(this, 140, 184, 10, 3, "Confirm", this.textRenderer, b => confirmCallback(this.#createPlayerAppearance())));
	}
	
	renderBg(canvas, ctx, dt) {
		ctx.fillStyle = "#0078B8";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.imageSmoothingEnabled = false;
		
		let timeElapsed = Date.now() - this.#startTime;
		let shift = Math.floor(timeElapsed / 1000 % 1 * 32);
		
		ctx.save();
		ctx.translate(shift - 32, 0);
		for (let y = 0; y < 8; ++y) {
			ctx.save();
			for (let x = 0; x < 9; ++x) {
				ctx.drawImage(BACKGROUND.imageResource, 0, 0);
				ctx.translate(32, 0);
			}
			ctx.restore();
			ctx.translate(0, 32);
		}
		ctx.restore();
		
		ctx.drawImage(FRAME.imageResource, 0, 0);
		
		WidgetTextures.WINDOW.render(ctx, 32, 24, 24, 3);
		WidgetTextures.WINDOW.render(ctx, 16, 88, 12, 9);
		this.textRenderer.render(ctx, "Player Appearance", 128, 32, TextRenderer.CENTER_ALIGN, 1, ROMAN_YELLOW);
		this.textRenderer.render(ctx, "Skin", 64, 96, TextRenderer.CENTER_ALIGN, 1, ROMAN_YELLOW);
		this.textRenderer.render(ctx, "Eyes", 64, 112, TextRenderer.CENTER_ALIGN, 1, ROMAN_YELLOW);
		
		// Render player
		ctx.save();
		ctx.translate(128, 72);
		ctx.transform(3, 0, 0, 3, 3, 0);
		ctx.imageSmoothingEnabled = false;
		
		let playerTextures = EntityTextures.PLAYER_BODY[this.#skinColor];
		let eyes = EntityTextures.PLAYER_EYES[this.#eyeColor];
		let top = EntityTextures.TUNIC;
		let shoes = EntityTextures.SANDALS;
		
		ctx.drawImage(playerTextures.underBody.imageResource, 0, 0, 32, 32, 0, 0, 32, 32);
		ctx.drawImage(top.imageResource, 0, 0, 32, 32, 0, 0, 32, 32);
		ctx.drawImage(shoes.imageResource, 0, 0, 32, 32, 0, 0, 32, 32);
		ctx.drawImage(playerTextures.arms.imageResource, 0, 0, 32, 32, 0, 0, 32, 32);
		ctx.drawImage(playerTextures.head.imageResource, 0, 0, 32, 32, 0, 0, 32, 32);
		ctx.drawImage(eyes.imageResource, 0, 0, 32, 32, 0, 0, 32, 32);
		
		ctx.restore();
	}
	
	pausesLevel(level) { return true; }
	
	#createPlayerAppearance() {
		return {
			skinColor: this.#skinColor,
			eyeColor: this.#eyeColor
		};
	}
	
	#cycleSkin(d) {
		this.#skinColor = (this.#skinColor + d + 4) % 4;
	}
	
	#cycleEyes(d) {
		this.#eyeColor = (this.#eyeColor + d + 5) % 5;
	}
	
}

function randInt(start, end) {
	return Math.floor(Math.random() * (end - start) + start);
}