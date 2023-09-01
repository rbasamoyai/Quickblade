import Widget from "./Widget.js";
import * as WidgetTextures from "./WidgetTextures.js";
import * as TextRenderer from "../../TextRenderer.js";

export default class Button extends Widget {
	
	#text;
	#textRenderer;
	#regularBox;
	#hoverBox;
	#tileWidth;
	#tileHeight;
	#textScale;
	#textColor;
	
	constructor(screen, x, y, tileWidth, tileHeight, text, clickCallback, regularBox = WidgetTextures.BUTTON,
	            hoverBox = WidgetTextures.BUTTON_HOVERED, textRenderer = WidgetTextures.TEXT, textScale = 1, textColor = "#806020") {
		super(screen, x, y, tileWidth * 8, tileHeight * 8, clickCallback, null, null);
		this.#text = text;
		this.#regularBox = regularBox;
		this.#hoverBox = hoverBox ? hoverBox : regularBox;
		this.#textRenderer = textRenderer;
		this.#tileWidth = tileWidth;
		this.#tileHeight = tileHeight;
		this.#textScale = textScale;
		this.#textColor = textColor;
	}
	
	render(ctx, dt) {
		if (this.isHovered()) {
			this.#hoverBox?.render(ctx, this.x, this.y, this.#tileWidth, this.#tileHeight);
		} else {
			this.#regularBox?.render(ctx, this.x, this.y, this.#tileWidth, this.#tileHeight);
		}
		this.#textRenderer.render(ctx, this.#text, this.x + this.width / 2, this.y + this.height / 2 - this.#textScale * 4,
			TextRenderer.CENTER_ALIGN, this.#textScale, this.#textColor);
	}
	
}