import Vec2 from "./Vec2.js";

export const UP = 0;
export const LEFT = 1;
export const DOWN = 2;
export const RIGHT = 3;

export function values() {
	return [UP, LEFT, DOWN, RIGHT];
}

export function nearest(x, y) {
	let th = Math.atan2(y, x);
	if (Math.abs(th) > Math.PI * 0.75) return LEFT;
	if (Math.abs(th) > Math.PI * 0.25) return th > 0 ? UP : DOWN;
	return RIGHT;
}

export function random(rand) {
	return values()[rand.nextInt(0, 4)];
}

export function opposite(dir) {
	if (dir < 0) dir = dir % 4 + 4;
	return (dir + 2) % 4;
}

export function clockwise(dir) {
	if (dir < 0) dir = dir % 4 + 4;
	return (dir + 3) % 4;
}

export function counterclockwise(dir) {
	if (dir < 0) dir = dir % 4 + 4;
	return (dir + 1) % 4;
}

export function isVertical(dir) {
	return dir % 2 === 0;
}

export function isHorizontal(dir) {
	return !isVertical(dir);
}

export function normal(dir) {
	if (dir < 0) dir = dir % 4 + 4;
	switch (dir) {
		case UP: return new Vec2(0, 1);
		case LEFT: return new Vec2(-1, 0);
		case DOWN: return new Vec2(0, -1);
		case RIGHT: return new Vec2(1, 0);
		default: return new Vec2(0, 0);
	}
}