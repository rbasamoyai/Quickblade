import BiIntSet from "../../BiIntSet.js";

export default class EdgeMap extends BiIntSet {
	
	constructor() {
		super();
	}
	
	add(v1, v2) {
		if (v1 !== v2) super.add(v1, v2);
	}
	
	delete(v1, v2) {
		super.delete(v1, v2);
		super.delete(v2, v1);
	}
	
	has(v1, v2) {
		return super.has(v1, v2) || super.has(v2, v1);
	}
	
	connectedTo(v) {
		let ret = [];
		for (const edge of this.values()) {
			if (edge[0] === v) ret.push(edge[1]);
			else if (edge[1] === v) ret.push(edge[0]);
		}
		return ret;
	}
	
	matches(p1, p2) {
		return p1[0] === p2[0] && p1[1] === p2[1] || p1[0] === p2[1] && p1[1] === p2[0];
	}

}