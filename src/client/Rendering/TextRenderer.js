import { ImageResource } from "../../common/resource_management/ResourceLoading.js";

export const LEFT_ALIGN = 0;
export const RIGHT_ALIGN = 1;
export const CENTER_ALIGN = 2;

const INVALID_POINT = "?".charCodeAt(0);

export class TextRenderer extends ImageResource {

	#bufferCanvas = new OffscreenCanvas(256, 8);

	constructor(image) {
		super(image);
	}
	
	render(ctx, text, x, y, align = LEFT_ALIGN, scale = 1, tint = "white") {
		if (!this.resourceReady || text.length < 1) return;
		
		let bufctx = this.#bufferCanvas.getContext("2d");
		bufctx.globalAlpha = 0;
		bufctx.fillRect(0, 0, this.#bufferCanvas.width, this.#bufferCanvas.height);
		bufctx.globalAlpha = 1;
		
		bufctx.imageSmoothingEnabled = false;
		bufctx.globalCompositeOperation = "source-over";
		bufctx.save();
		for (const c of text) {
			let point = c.charCodeAt(0);
			if (point > 255) point = INVALID_POINT;
			let px = point % 16 * 8;
			let py = Math.floor(point / 16) * 8;
			bufctx.drawImage(this.imageResource, px, py, 8, 8, 0, 0, 8, 8);
			bufctx.translate(8, 0);
		}
		bufctx.restore();
		bufctx.globalCompositeOperation = "source-in";
		bufctx.fillStyle = tint;
		bufctx.fillRect(0, 0, text.length * 8, 8);
		
		ctx.save();
		ctx.translate(x, y);
		ctx.scale(scale, scale);
		switch (align) {
			case RIGHT_ALIGN: {
				ctx.translate(-8 * text.length, 0);
				break;
			}
			case CENTER_ALIGN: {
				ctx.translate(Math.floor(-4 * text.length), 0);
				break;
			}
		}
		
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(this.#bufferCanvas, 0, 0, text.length * 8, 8, 0, 0, text.length * 8, 8);
		
		ctx.restore();
	}

}