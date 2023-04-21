import { Creature } from "./Creature.js";
import * as QBEntities from "../index/QBEntities.js";

const RANDOM_KNOCKBACK_BOUNDARY = 0.01;
const KNOCKBACK = 0.25;

export class Monster extends Creature {
	
	constructor(x, y, level, id, type) {
		super(x, y, level, id, type);
	}
	
	tick() {
		super.tick();
		
		let collided = this.level.getEntities().filter(e => QBEntities.PLAYER.is(e)).find(e => this.collide(e));
		if (collided?.hurt(1, this)) {
			let x = collided.x - this.x;
			let dy = collided.isOnGround() ? 0.1 : collided.dy;
			if (x < -RANDOM_KNOCKBACK_BOUNDARY) {
				collided.setVelocity([-KNOCKBACK, dy]);
			} else if (x > RANDOM_KNOCKBACK_BOUNDARY) {
				collided.setVelocity([KNOCKBACK, dy]);
			} else {
				let dx = Math.random() > 0.5 ? KNOCKBACK : -KNOCKBACK;
				collided.setVelocity([dx, dy]);
			}
		}
	}
	
	
}