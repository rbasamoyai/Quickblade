import { ImageResource } from "../../resource_management/ResourceLoading.js";

export class Tile extends ImageResource {
	
	#canCollide;
	#noRender;
	#replaceable;
	
	constructor(properties) {
		super(properties.textureV);
		this.#canCollide = properties.canCollideV;
		this.#noRender = properties.noRenderV;
		this.#replaceable = properties.replaceableV;
	}
	
	canCollide(entity) { return this.#canCollide; }
	
	render(ctx) {
		if (!this.resourceReady || this.#noRender) return;
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(this.imageResource, 0, 0, 1, 1);
	}
	
	get replaceable() { return this.#replaceable; }
	
}

export class TileProperties {
	
	canCollideV = false;
	noRenderV = false;
	replaceableV = false;
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
	
	replaceable() {
		this.replaceableV = true;
		return this;
	}
	
}