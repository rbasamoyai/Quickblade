import { Level } from "./Level.js";
import * as LevelChunk from "../LevelChunk.js";
import QBRandom from "../QBRandom.js";
import * as QBTiles from "../index/QBTiles.js";

export class LevelGenerator {
	
	#nodes = 0;
	#seed;
	#rand;
	#chunks = [];
	maxDepth = 3;
	#claimedChunks = [];
	
	constructor(seed) {
		this.#seed = seed ? seed : Date.now();
		this.#rand = new QBRandom(seed);
	}
	
	generateLevel() {
		// Stage 1: graphs
		// generate start node, set to center of level
		
		let start = new Node(new LevelFeature("start"));
		let mainLength = this.#rand.nextInt(23, 32);
		
		// Generate main branch and recursively generate.
		
		this.generateBranch(start, mainLength, 0);
		
		start.displayTree(""); // Test: print out nodes.
		console.log(`Generated ${this.#nodes} nodes`);
		
		// Stage 2: level features
		// Parse tree
		// Generate each feature with random deviations from each other.
		
		// As each feature generates, it claims chunks.
		// This prevents overlap in generation.
		// Features are arranged in such a way so as to prevent overlap.
		// Features are generated from branching off of others starting from a given point around a feature,
		//   with a given direction.
		// The generator tries to fit the feature in the level. It tries to do so in a fan shape.
		
		
		
		// After features are generated, freeform coridors using a brush are added.
		// Most features are generated with "brushes" that move in a given direction and add tiles.
		// Once done generating the feature stores multiple brush positions in their parent node.
		// A node can have multiple children brushes, mainly for branching.
		// The next node picks the brush position that it is associated with and continues from there.
	}
	
	generateBranch(startNode, length, depth) {
		let nodes = [startNode];
		let curNode = startNode;
		for (let i = 0; i < length; ++i) {
			// Choose feature from pool.
			// Pool specifications:
			// The pool is split into different types of features: bends, halls/shafts, and chambers.
			// Bends are a sharp turn in the level.
			// Halls/shafts are long straight rooms.
			// Chambers are large areas with many monsters, possibly even a boss spawn.
			
			let feature = new LevelFeature("feature", this.#rand);
			if (i + 1 == length && depth == 0) {
				// Wrap feature in end feature.
				feature = new LevelFeature("end", this.#rand);
			}
			
			let newNode = new Node(feature);
			curNode.connectedTo.push(newNode);
			curNode = newNode;
			nodes.push(curNode);
			++this.#nodes;
		}
		if (depth + 1 == this.maxDepth) {
			// Generate potential item/other feature at end node?
			return;
		}
		
		let branchCount = length / 6 + this.#rand.nextInt(-2, 3);
		let baseBranchLength = length / 4;
		
		for (let i = 0; i < branchCount; ++i) {
			let node = null;
			do {
				let node1 = nodes[this.#rand.nextInt(0, nodes.length)];
				if (node1.feature.id == "end") continue;
				let c = 0.5 ** (node1.connectedTo.length + 2);
				if (this.#rand.nextFloat() < c) node = node1;
			} while (!node);
			let branchLength = baseBranchLength + this.#rand.nextInt(-2, 3);
			if (branchLength < 1) continue;
			this.generateBranch(node, branchLength, depth + 1);
		}
	}
	
	getTile(x, y) {
		let cx = LevelChunk.toChunkSection(x);
		let cy = LevelChunk.toChunkSection(y);
		let tx = LevelChunk.toChunkCoord(x);
		let ty = LevelChunk.toChunkCoord(y);
		for (const existing of this.#chunks) {
			if (existing.x == cx && existing.y == cy) return existing.getTile(tx, ty);
		}
		return QBTiles.AIR; 
	}
	
	setTile(x, y, tile) {
		let cx = LevelChunk.toChunkSection(x);
		let cy = LevelChunk.toChunkSection(y);
		let tx = LevelChunk.toChunkCoord(x);
		let ty = LevelChunk.toChunkCoord(y);
		
		for (const existing of this.#chunks) {
			if (existing.x == cx && existing.y == cy) {
				existing.setTile(tx, ty, tile);
				return;
			}
		}
		
		let newChunk = new LevelChunk.LevelChunk(cx, cy);
		newChunk.setTile(tx, ty, tile);
		this.#chunks.push(newChunk);
	}
	
}

class Node {
	
	connectedTo = [];
	#feature;
	
	constructor(feature) {
		this.#feature = feature;
	}
	
	displayTree(prefix) {
		if (this.connectedTo.length == 0) return;
		
		// If only one branch, display flattened. Used to reduce screen space and recursion depth.
		let curNode = this;
		while (curNode.connectedTo.length == 1) {
			console.log(prefix + "v--" + curNode.feature.id);
			curNode = curNode.connectedTo[0];
		}
		if (curNode.connectedTo.length == 0) {
			console.log(prefix + "x--" + curNode.feature.id); 
			return;
		}
		for (let i = 0; i < curNode.connectedTo.length; ++i) {
			let node = curNode.connectedTo[i];
			console.log(prefix + "+--" + node.feature.id);
			let next = i + 1 == curNode.connectedTo.length ? "   " : "|  ";
			node.displayTree(prefix + next);
		}
	}
	
	get feature() { return this.#feature; }

}

const EPSILION = 0.0001
const TWO_PI = Math.PI * 2;
function randomPointOnBox(w, h, th) {
	th = (th % TWO_PI + TWO_PI) % TWO_PI;
	if (th > 180) th -= 360;
	if (Math.abs(th - Math.PI / 2) < EPSILION) return [h/2, 0];
	if (Math.abs(th - Math.PI / -2) < EPSILION) return [-h/2, 0];
	let l = Math.sqrt(w*w/4 + h*h/4);
	let x1 = clamp(Math.cos(th) * l, -w/2, w/2);
	let y1 = Math.sin(th) * l;
	let y2 = clamp(y1, -h/2, h/2);
	return -h/2 <= y1 && y1 < h/2 ? [x2, x2 * Math.tan(th)] : [y2 / Math.tan(th) : y2];
}

function clamp(x, min, max) {
	return x < min ? min : x > max ? max : x;
}

class LevelFeature {
	
	#id;
	
	constructor(id, rand) {
		this.#id = id;
	}
	
	generateFeature(rand, gen, x, y) {}
	
	getBranchStartingPoints(rand, gen, x, y, count, ox, oy) {
		let ret = [];
		for (let i = 0; i < count; ++i) ret.push([x,y]);
		return ret;
	}
	
	chunkProfile(ox, oy) {
		return [[0, 0], [1, 1]];
	}
	
	get id() { return this.#id; }
	
}

class ChamberFeature extends LevelFeature {

	#length;
	#height;
	
	constructor(rand) {
		super("chamber", rand);
		this.#length = rand.nextInt(12, 32);
		this.#height = rand.nextInt(8, 16);
	}
	
	generateFeature(rand, gen, x, y) {
		// Generate from [x, y] at top left corner
		for (let ty = 0; ty < this.#height; ++ty) {
			for (let tx = 0; tx < this.#length; ++tx) {
				if (ty == 0 || ty + 1 == this.#height || tx == 0 || tx + 1 == this.#width) {
					gen.setTile(tx, ty, QBTiles.BLOCK);
				} else {
					
				}
			}
		}
	}
	
	getBranchStartingPoints(rand, gen, x, y, count, ox, oy) {
		let ret = [];
		for (let i = 0; i < count; ++i) {
			let th = 360 * rand.nextFloat() - 180;
			let point = randomPointOnBox(this.#length, this.#height, th);
			ret.push([point[0] + x, point[1] + y]);
		}
		return ret;
	}
	
	chunkProfile(ox, oy) {
		let origin = LevelChunk.getChunkSection(ox, oy);
		let start = LevelChunk.getChunkSection(ox - this.#length / 2, oy - this.#height / 2);
		let end = LevelChunk.getChunkSection(ox + this.#length / 2, oy + this.#height / 2);
		return [[start[0] - origin[0], start[1] - origin[1]], [end[0] - origin[0], end[1] - origin[1]];
	}
	
}