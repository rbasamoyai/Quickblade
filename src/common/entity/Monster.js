import { Creature } from "./Creature.js";
import * as QBEntities from "../index/QBEntities.js";

import Vec2 from "../Vec2.js";

const RANDOM_KNOCKBACK_BOUNDARY = 0.01;
const KNOCKBACK = 0.25;

export class Monster extends Creature {
	
	constructor(x, y, level, layer, id, type) {
		super(x, y, level, layer, id, type);
	}
	
	tick() {
		super.tick();
		
		// TODO: infighting?
		let collided = this.layer.getEntities().filter(e => QBEntities.PLAYER.is(e)).find(e => this.collideWithEntity(e));
		if (collided?.hurt(1, this)) {
			let x = collided.x - this.x;
			let dy = collided.isOnGround() ? 0.1 : collided.dy;
			if (x < -RANDOM_KNOCKBACK_BOUNDARY) {
				collided.setVelocity(new Vec2(-KNOCKBACK, dy));
			} else if (x > RANDOM_KNOCKBACK_BOUNDARY) {
				collided.setVelocity(new Vec2(KNOCKBACK, dy));
			} else {
				let dx = Math.random() > 0.5 ? KNOCKBACK : -KNOCKBACK;
				collided.setVelocity(new Vec2(dx, dy));
			}
		}
	}
	
}