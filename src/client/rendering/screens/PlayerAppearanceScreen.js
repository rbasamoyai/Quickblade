import AbstractScreen from "./AbstractScreen.js";

import Widget from "./widgets/Widget.js";
import Button from "./widgets/Button.js";

import { ImageResource } from "../../../common/resource_management/ResourceLoading.js";
import * as TextRenderer from "../TextRenderer.js";
import * as WidgetTextures from "./widgets/WidgetTextures.js";
import * as EntityTextures from "../../../common/entity/textures/EntityTextures.js";

const MIRROR = new ImageResource("ui/mirror");

export default class PlayerAppearanceScreen extends AbstractScreen {
	
	#skinColor = randInt(0, 4);
	#eyeColor = randInt(0, 5);
	
	constructor(confirmCallback) {
		super();
		
		this.addWidget(WidgetTextures.daggerButton(this, true, 24, 96, b => this.#cycleSkin(-1)));
		this.addWidget(WidgetTextures.daggerButton(this, false, 88, 96, b => this.#cycleSkin(1)));
		
		this.addWidget(WidgetTextures.daggerButton(this, true, 24, 112, b => this.#cycleEyes(-1)));
		this.addWidget(WidgetTextures.daggerButton(this, false, 88, 112, b => this.#cycleEyes(1)));
		
		this.addWidget(new Button(this, 140, 184, 10, 3, "Confirm", b => confirmCallback(this.#createPlayerAppearance())));
	}
	
	renderBg(canvas, ctx, dt) {
		ctx.fillStyle = "#0078B8";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.imageSmoothingEnabled = false;
		
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
		ctx.drawImage(MIRROR.imageResource, 120, 56);
		
		WidgetTextures.WINDOW.render(ctx, 32, 24, 24, 3);
		WidgetTextures.WINDOW.render(ctx, 16, 88, 12, 9);
		WidgetTextures.TEXT.render(ctx, "Player Appearance", 128, 32, TextRenderer.CENTER_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
		WidgetTextures.TEXT.render(ctx, "Skin", 64, 96, TextRenderer.CENTER_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
		WidgetTextures.TEXT.render(ctx, "Eyes", 64, 112, TextRenderer.CENTER_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
		
		// Render player
		ctx.save();
		ctx.translate(128, 72);
		ctx.transform(-3, 0, 0, 3, 104, 0);
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