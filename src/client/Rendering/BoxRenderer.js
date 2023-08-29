import { ImageResource } from "../../common/resource_management/ResourceLoading.js";

export default class BoxRenderer extends ImageResource {
	
	constructor(image) {
		super(image);
	}
	
	render(ctx, x, y, width, height) {
		if (width < 1 || height < 1) return;
		ctx.imageSmoothingEnabled = false;
		ctx.save();
		ctx.translate(x, y);
		
		for (let ty = 0; ty < height; ++ty) {
			ctx.save();
			for (let tx = 0; tx < width; ++tx) {
				let ax;
				if (tx === 0) {
					ax = 0;
				} else if (tx < width - 1) {
					ax = 8;
				} else {
					ax = 16;
				}
				let ay;
				if (ty === 0) {
					ay = 0;
				} else if (ty < height - 1) {
					ay = 8;
				} else {
					ay = 16;
				}
				ctx.drawImage(this.imageResource, ax, ay, 8, 8, 0, 0, 8, 8);
				ctx.translate(8, 0);
			}
			ctx.restore();
			ctx.translate(0, 8);
		}
		
		ctx.restore();
	}
	
}