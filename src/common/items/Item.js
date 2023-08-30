import { ImageResource } from "../resource_management/ResourceLoading.js";

export class Item extends ImageResource {

	#stacksTo;
	#frameCount;
	#frameSpeed;
	#textureSize;
	#maxStacks;
	#name;

	constructor(properties) {
		super(properties.textureV);
		this.#stacksTo = properties.stacksToV;
		this.#frameCount = properties.frameCountV;
		this.#frameSpeed = properties.frameSpeedV;
		this.#name = properties.nameV;
		this.#textureSize = properties.textureSizeV;
		this.#maxStacks = properties.maxStacksV;
	}
	
	render(ctx, dt, timeElapsed) {
		let frame = Math.floor((timeElapsed + dt) / this.#frameSpeed % this.#frameCount);
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(this.imageResource, frame * this.#textureSize, 0, this.#textureSize, this.#textureSize, 0, 0, this.#textureSize, this.#textureSize);
	}
	
	get stacksTo() { return this.#stacksTo; }
	get maxStacks() { return this.#maxStacks; }
	get name() { return this.#name; }
	get textureSize() { return this.#textureSize; }

}

export class ItemProperties {
	
	stacksToV = 10;
	frameCountV = 1;
	frameSpeedV = 0.5;
	textureSizeV = 16;
	maxStacksV = -1;
	textureV;
	nameV;
	
	constructor(texture, name) {
		this.textureV = texture;
		this.nameV = name;
	}
	
	stacksTo(v) {
		this.stacksToV = v;
		return this;
	}
	
	frameCount(v) {
		this.frameCountV = v;
		return this;
	}
	
	frameSpeed(v) {
		this.frameSpeedV = v;
		return this;
	}
	
	textureSize(v) {
		this.textureSizeV = v;
		return this;
	}
	
	maxStacks(v) {
		this.maxStacksV = v;
		return this;
	}
	
	unlimitedStacks() {
		return this.maxStacks(-1);
	}
	
}