import { Entity } from "./Entity.js";
import * as QBEntities from "../index/QBEntities.js";
import * as QBItems from "../index/QBItems.js";

export default class ItemEntity extends Entity {
	
	#item = null;
	#itemCount = 0;
	#age = 0;
	
	constructor(x, y, level, layer, id, type) {
		super(x, y, level, layer, id, type);
	}
	
	getUpdateSnapshot() {
		let result = super.getUpdateSnapshot();
		result.itemCount = this.#itemCount;
		result.itemId = QBItems.getIdKey(this.#item);
		result.age = this.#age;
		return result;
	}
	
	readUpdateSnapshot(data) {
		super.readUpdateSnapshot(data);
		this.#itemCount = data.itemCount;
		this.#item = QBItems.getFromIdKey(data.itemId);
		this.#age = data.age;
	}
	
	setItem(item, count) {
		this.#item = item;
		this.#itemCount = count;
	}
	
	getItem() {
		return this.#itemCount < 1 ? null : this.#item;
	}
	
	getItemCount() { return this.#itemCount; }
	
	isEmpty() { return !this.#item || this.#itemCount < 1; }
	
	tick() {
		super.tick();
		let collided = this.layer.getEntities().filter(e => QBEntities.PLAYER.is(e)).find(e => this.collideWithEntity(e));
		collided?.pickUp(this);
		if (this.isEmpty()) this.kill();
		this.#age++;
	}
	
	render(ctx, dt) {
		if (this.isEmpty()) return;
		ctx.save();
		let f = 1/16;
		ctx.transform(f, 0, 0, -f, this.#item.textureSize * f * -0.5, this.#item.textureSize * f);
		this.#item.render(ctx, dt, this.#age);
		ctx.restore();
	}
	
}