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