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
	
}