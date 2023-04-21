import { Creature } from "./Creature.js";
import * as QBEntities from "../index/QBEntities.js";

export class Monster extends Creature {
	
	constructor(x, y, level, id, type) {
		super(x, y, level, id, type);
	}
	
	tick() {
		let collided = this.level.getEntities().filter(e => QBEntities.PLAYER.is(e)).find(e => this.collide(e));
		if (collided) {
			collided.hurt(1, this);
		}
		
		super.tick();
	}
	
	
}