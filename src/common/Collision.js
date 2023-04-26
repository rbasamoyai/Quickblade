export class AABB {
	
	topLeft;
	width;
	height;
	
	constructor(x, y, w, h) {
		this.topLeft = [x, y];
		this.width = w;
		this.height = h;
	}
	
	collideBox(other) {
		let minX = Math.min(this.topLeft[0], other.topLeft[0]);
		let maxX = Math.max(this.topLeft[0] + this.width, other.topLeft[0] + other.width);
		let minY = Math.min(this.topLeft[1], other.topLeft[1]);
		let maxY = Math.max(this.topLeft[1] + this.height, other.topLeft[1] + other.height);
		
		return maxX - minX <= this.width + other.width && maxY - minY <= this.height + other.height;
	}
	
	expandTowards(ex, ey) {
		let nx = ex < 0 ? this.topLeft[0] + ex : this.topLeft[0];
		let ny = ey < 0 ? this.topLeft[1] + ey : this.topLeft[1];
		let nw = ex > 0 ? this.width + ex : this.width;
		let nh = ey > 0 ? this.height + ey : this.height;
		return new AABB(nx, ny, nw, nh);
	}
	
	move(x, y) {
		return new AABB(this.topLeft[0] + x, this.topLeft[1] + y, this.width, this.height);
	}

}

export function collide(bb1, bb2, vel1, vel2) {
	let relVel = [1 / (vel1[0] - vel2[0]), 1 / (vel1[1] - vel2[1])];
		
	let startX = bb2.topLeft[0] - bb1.topLeft[0];
	let x1 = (startX - bb1.width) * relVel[0];
	let x2 = (startX + bb2.width) * relVel[0];
	if ((x1 < 0 || 1 <= x1) && (x2 < 0 || 1 <= x2)) {
		let minX = Math.min(bb1.topLeft[0], bb2.topLeft[0]);
		let maxX = Math.max(bb1.topLeft[0] + bb1.width, bb2.topLeft[0] + bb2.width);
		if (maxX - minX > bb1.width + bb2.width) return false;
	}
	if (x1 > x2) {
		let tmp = x1;
		x1 = x2;
		x2 = tmp;
	}
	x1 = Math.max(0, x1);
	x2 = Math.min(1, x2);
	
	let startY = bb2.topLeft[1] - bb1.topLeft[1];
	let y1 = (startY - bb1.height) * relVel[1];
	let y2 = (startY + bb2.height) * relVel[1];
	if ((y1 < 0 || 1 <= y1) && (y2 < 0 || 1 <= y2)) {
		let minY = Math.min(bb1.topLeft[1], bb2.topLeft[1]);
		let maxY = Math.max(bb1.topLeft[1] + bb1.height, bb2.topLeft[1] + bb2.height);
		if (maxY - minY > bb1.height + bb2.height) return false;
	}
	if (y1 > y2) {
		let tmp = y1;
		y1 = y2;
		y2 = tmp;
	}
	y1 = Math.max(0, y1);
	y2 = Math.min(1, y2);
	
	return x1 <= y2 && y1 <= x2; //? Math.max(x1, y1) : -1;
}