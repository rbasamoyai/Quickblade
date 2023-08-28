import { ImageResource } from "../../common/resource_management/ResourceLoading.js";

export const LEFT_ALIGN = 0;
export const RIGHT_ALIGN = 1;
export const CENTER_ALIGN = 2;

const INVALID_POINT = "?".charCodeAt(0);

export class TextRenderer extends ImageResource {

	constructor(image) {
		super(image);
	}
	
	render(ctx, text, align = LEFT_ALIGN, tint = "white") {
		if (!this.resourceReady || text.length < 1) return;
		let uw = Math.floor(this.imageResource.width / 16);
		let uh = Math.floor(this.imageResource.height / 16);
		
		ctx.save();
		switch (align) {
			case RIGHT_ALIGN: {
				ctx.translate(-uw * text.length, 0);
				break;
			}
			case CENTER_ALIGN: {
				ctx.translate(Math.floor(-uw * text.length / 2), 0);
				break;
			}
		}
		
		let oldFill = ctx.fillStyle;
		
		ctx.imageSmoothingEnabled = false;
		
		for (const c of text) {
			let point = c.charCodeAt(0);
			if (point > 255) point = INVALID_POINT;
			let px = point % 16 * uw;
			let py = Math.floor(point / 16) * uh;
			
			ctx.fillStyle = tint;
			ctx.globalCompositeOperation = "source-over";
			ctx.drawImage(this.imageResource, px, py, uw, uh, 0, 0, uw, uh);
			ctx.globalCompositeOperation = "multiply";
			ctx.fillRect(0, 0, uw, uh);
			
			ctx.translate(uw, 0);
		}
		
		ctx.restore();
		ctx.fillStyle = oldFill;
		ctx.globalCompositeOperation = "source-over";
	}

}