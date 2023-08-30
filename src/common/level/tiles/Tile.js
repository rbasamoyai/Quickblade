import { ImageResource } from "../../resource_management/ResourceLoading.js";
import * as Direction from "../../Direction.js";
import Vec2 from "../../Vec2.js";

export class Tile extends ImageResource {
	
	#canCollide;
	#noRender;
	#replaceable;
	#imageSize;
	
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
	
	getTileLength(dir) {
		return 1;
	}
	
	pushOff(entity, tx, ty, face, time) {
		let cn = Direction.normal(face);
		let absVel = new Vec2(Math.abs(entity.dx), Math.abs(entity.dy));
		let add = cn.multiplyVec(absVel).scale(1 - time);
		entity.setVelocity(entity.vel.addVec(add));
	}
	
}

export class TileProperties {
	
	canCollideV = false;
	noRenderV = false;
	replaceableV = false;
	textureSize = 16;
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