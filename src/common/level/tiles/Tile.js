import { ImageResource } from "../../resource_management/ResourceLoading.js";

export class Tile extends ImageResource {
	
	#canCollide;
	#noRender;
	#id;
	
	constructor(properties, id) {
		super(properties.textureV);
		this.#canCollide = properties.canCollideV;
		this.#noRender = properties.noRenderV;
	}
	
	canCollide(entity) { return this.canCollide; }
	
	render(ctx) {
		if (!this.resourceReady || this.#noRender) return;
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(this.imageResource, 0, 0, 1, 1);
	}
	
}

export class TileProperties {
	
	canCollideV = false;
	noRenderV = false;
	textureV;
	
	constructor(texture) {
		this.textureV = texture;
	}
	
	canCollide(flag) {
		this.canCollideV = flag;
		return this;
	}
	
	noRender() {
		this.noRenderV = true;
		return this;
	}
	
}