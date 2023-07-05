import { Level } from "./Level.js";
import * as LevelChunk from "./LevelChunk.js";
import QBRandom from "../QBRandom.js";
import * as QBTiles from "../index/QBTiles.js";
import { AABB } from "../Collision.js";

export class LevelGenerator {
	
	#nodes = 0;
	#seed;
	#rand;
	#chunks = [];
	maxDepth = 3;
	#levelFeatures = [];
	#defaultTile;
	
	constructor(seed, defaultTile = QBTiles.BLOCK) {
		this.#seed = seed ? seed : Date.now();
		this.#rand = new QBRandom(seed);
		this.#defaultTile = defaultTile;
	}
	
	generateLevel() {
		// Phase 1: graphs
		// generate start node, set to center of level
		
		let start = new Node(this.#nodes++, new ChamberFeature(this.#rand));
		let mainLength = this.#rand.nextInt(23, 32);
		
		// Generate main branch and recursively generate.
		
		this.generateBranch(start, mainLength, 0);
		
		//start.displayTree(""); // Test: print out nodes.
		console.log(`Generated ${this.#nodes} nodes`);
		
		// Phase 2: organizing level
		// Place the features in a random arrangement so that they do not collide with each other.		
		
		start.setPos(0, 0);
		start.entryPoint = [0, 0];
		this.organizeLevel(start, new Set());
		
		// Phase 3: generating features
		// The level features are added to chunks.
		
		for (const node of this.#levelFeatures) {
			node.setPos(Math.floor(node.x), Math.floor(node.y));
			node.feature.generateFeature(this.#rand, this, node.x, node.y);
		}
		
		// After generation, pathways are generated between features.
		
		// Chunks are padded out so as to hide open air.
		
		return new Level(this.#chunks);
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
			
			let feature = new ChamberFeature(this.#rand);
			if (i + 1 == length && depth == 0) {
				feature = new EndFeature(this.#rand, feature);
			}
			
			let newNode = new Node(this.#nodes++, feature, curNode);
			curNode.children.push(newNode);
			curNode = newNode;
			nodes.push(curNode);
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
				if (node1.feature.id == "end" || node1.children.length >= 3) continue;
				let c = 0.5 ** (node1.children.length + 2);
				if (this.#rand.nextFloat() < c) node = node1;
			} while (!node);
			let branchLength = baseBranchLength + this.#rand.nextInt(-2, 3);
			if (branchLength < 1) continue;
			this.generateBranch(node, branchLength, depth + 1);
		}
	}
	
	organizeLevel(node, pushing) {
		// Movement is best done perpendicular to the direction the new feature was placed in.
		// Nodes are organized breadth-first so as to minimize the amounts of nodes moved in case of a collision.
		// If a moved node collides with another node, the other node moves away in the same direction as the moved node
		//    but with slightly more magnitude.
		
		// If the placed node overlaps with already arranged features, one of the following methods are used:
		// 1. the old feature is moved away from the new feature
		// 2. the new feature is moved away from the old feature
		// The generator prefers method 1 in most cases involving moving a node in a different branch away.
		// However, the generator will always use method 2 if the old feature is an ancestor of the new feature,
		//    as moving the old feature would not change the new feature's relative orientation to it.
		
		/*
		pushing.add(node);
		
		let profile = node.feature.featureProfileOf(node);
		for (const placed of this.#levelFeatures) {
			if (node == placed) continue;
			let otherProfile = placed.feature.featureProfileOf(placed);
			if (!otherProfile.collideBox(profile)) continue;
			
			let intersectX = otherProfile.intersectionXOf(other);
			let intersectY = otherProfile.intersectionYOf(other);
			let intersectMag = Math.sqrt(intersectX * intersectX + intersectY * intersectY);
			
			let pushX = node.x - placed.x;
			let pushY = node.y - placed.y;
			let pushMag = Math.sqrt(pushX * pushX + pushY * pushY);
			
			let flag = intersectMag > 1e-2 && pushMag > 1e-2;
			let s = 1.25 * intersectMag / pushMag;
			let pushVec = flag ? [s * pushX, s * pushY] : [0, 1.25 * (otherProfile.height + profile.height + 0.1)];
			
			if (node.hasAncestorNode(placed) || pushing.has(placed)) {
				node.move(pushVec[0], pushVec[1]);
				organizeLevel(node, pushing);
			} else {
				placed.move(-pushVec[0], -pushVec[1]);
				organizeLevel(placed, pushing);
			}
			
		}*/
		
		// Get exit points away from start point.
		
		if (!this.#levelFeatures.includes(node)) {
			this.#levelFeatures.push(node);
			
			// Get exit points for node and store them
			// Given direction of each node, place them at spot (exit + dir) which is the entry point
			// Set origin to other spot after entry point
			
			let branchStarts = node.feature.getBranchStartingPoints(this.#rand, this, node);
			
			for (const [i, child] of node.children.entries()) {
				let exitPoint = branchStarts[i];
				child.entryPoint = [exitPoint.start[0] + exitPoint.direction[0], exitPoint.start[1] + exitPoint.direction[1]];
				let origin = child.feature.getOriginFromEntry(this.#rand, exitPoint.direction, child.entryPoint);
				child.setPos(origin[0], origin[1]);
				this.organizeLevel(child, pushing);
			}
		}
		//pushing.delete(node);
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
		
		let newChunk = new LevelChunk.LevelChunk(cx, cy, this.#defaultTile);
		newChunk.setTile(tx, ty, tile);
		this.#chunks.push(newChunk);
	}
	
}

class Node {
	
	children = [];
	#ancestors;
	#id;
	#feature;
	#pos = [0, 0];
	entryPoint = [0, 0];
	exitPoints = [];
	
	constructor(id, feature, parent) {
		this.#id = id;
		this.#feature = feature;
		this.#ancestors = parent ? parent.cloneAncestors() : [];
		if (parent) this.#ancestors.push(parent.id);
	}
	
	displayTree(prefix) {
		if (this.children.length == 0) return;
		
		// If only one branch, display flattened. Used to reduce screen space and recursion depth.
		let curNode = this;
		while (curNode.children.length == 1) {
			console.log(prefix + "v--" + curNode.feature.id);
			curNode = curNode.children[0];
		}
		if (curNode.children.length == 0) {
			console.log(prefix + "x--" + curNode.feature.id); 
			return;
		}
		for (let i = 0; i < curNode.children.length; ++i) {
			let node = curNode.children[i];
			console.log(prefix + "+--" + node.feature.id);
			let next = i + 1 == curNode.children.length ? "   " : "|  ";
			node.displayTree(prefix + next);
		}
	}
	
	get id() { return this.#id; }
	get feature() { return this.#feature; }
	
	hasAncestorNode(node) { return this.#ancestors.includes(node.id); }
	cloneAncestors() { return structuredClone(this.#ancestors); }
	
	setPos(x, y) { this.#pos = [x, y]; }
	
	move(x, y) {
		this.#pos = [this.x + x, this.y + y];
		this.entryPoint = [this.entryPoint[0] + x, this.entryPoint[1] + y];
		this.exitPoints = this.exitPoints.map(p => [p[0] + x, p[1] + y]);
		for (const child of this.children) child.move(x, y);
	}
	
	get x() { return this.#pos[0]; }
	get y() { return this.#pos[1]; }

}

const EPSILION = 0.0001
const TWO_PI = Math.PI * 2;

function pointOnBox(w, h, th) {
	th = (th % TWO_PI + TWO_PI) % TWO_PI;
	if (th > Math.PI) th -= TWO_PI;
	if (Math.abs(th - Math.PI / 2) < EPSILION) return [h/2, 0];
	if (Math.abs(th - Math.PI / -2) < EPSILION) return [-h/2, 0];
	let l = Math.sqrt(w*w/4 + h*h/4);
	let x1 = clamp(Math.cos(th) * l, -w/2, w/2);
	let y1 = Math.sin(th) * l;
	let y2 = clamp(y1, -h/2, h/2);
	return -h/2 <= y1 && y1 < h/2 ? [x1, x1 * Math.tan(th)] : [y2 / Math.tan(th), y2];
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
	
	getBranchStartingPoints(rand, gen, node) { 
		return [];
	}
	
	getOriginFromEntry(rand, direction, entryPoint) {
		return entryPoint;
	}
	
	featureProfile(x, y) {
		return new AABB(x, y, 1, 1);
	}
	
	featureProfileOf(node) { return this.featureProfile(node.x, node.y); }
	
	get id() { return this.#id; }
	
}

class ChamberFeature extends LevelFeature {

	#width;
	#height;
	
	constructor(rand) {
		super("chamber", rand);
		this.#width = rand.nextInt(12, 32);
		this.#height = rand.nextInt(8, 16);
	}
	
	generateFeature(rand, gen, x, y) {
		let ox = x - Math.floor(this.#width / 2);
		let oy = y - Math.floor(this.#height / 2);
		for (let ty = 0; ty < this.#height; ++ty) {
			for (let tx = 0; tx < this.#width; ++tx) {
				let tx1 = ox + tx;
				let ty1 = oy + ty;
				
				if (ty == 0 || ty + 1 == this.#height || tx == 0 || tx + 1 == this.#width) {
					gen.setTile(tx1, ty1, QBTiles.BLOCK);
				} else {
					gen.setTile(tx1, ty1, QBTiles.BACKGROUND);
				}
			}
		}
	}
	
	getBranchStartingPoints(rand, gen, node) {
		let ret = [];
		let forward = [node.x - node.entryPoint[0], node.y - node.entryPoint[1]];
		let forwardMag = Math.sqrt(forward[0] * forward[0] + forward[1] * forward[1]);
		
		if (forwardMag < 1e-2) {
			forwardMag = this.#width / 2 + this.#height / 2;
			let th = rand.nextFloat() * Math.PI * 2;
			forward = [Math.cos(th) * forwardMag, Math.sin(th) * forwardMag];
		}
		
		let mag = Math.sqrt(this.#width * this.#width + this.#height * this.#height);
		mag = mag * 0.5 / forwardMag;
		forward = [mag * forward[0], mag * forward[1]];
		
		let flag = rand.nextBoolean();
		
		for (let i = 0; i < node.children.length; ++i) {
			let th = rand.nextGaussian(0, Math.PI / 3);
			if (i > 0) th += (i % 2 == 0) === flag ? 90 : -90;
			let c = Math.cos(th);
			let s = Math.sin(th);
			
			let th1 = Math.atan2(forward[0], forward[1]) + rand.nextGaussian(0, Math.PI / 8);
			let point = pointOnBox(this.#width, this.#height, th1);
			
			ret.push({
				start: [node.x + point[0], node.y + point[1]],
				direction: [forward[0] * c - forward[1] * s, forward[0] * s + forward[1] * c]
			});
		}
		return ret;
	}
	
	getOriginFromEntry(rand, direction, entryPoint) {
		let th = Math.atan2(direction[1], direction[0]) + rand.nextGaussian(0, Math.PI / 8);
		if (Math.abs(th) < Math.PI / 4) return [entryPoint[0] + this.#width / 2, entryPoint[1]]; // Left wall
		if (Math.abs(th) > Math.PI * 3 / 4) return [entryPoint[0] - this.#width / 2, entryPoint[1]]; // Right wall
		return [entryPoint[0], entryPoint[1] + this.#height / (th > 0 ? 2 : -2)]; // Bottom wall (th > 0) or top wall (th < 0)
	}
	
	featureProfile(x, y) {
		return new AABB(x - Math.ceil(this.#width / 2) - 1, y - Math.ceil(this.#height / 2) - 1, this.#width + 2, this.#height + 2);
	}
	
}

class EndFeature extends LevelFeature {
	
	#wrapped;
	
	constructor(rand, wrapped) {
		super("end", rand);
		this.#wrapped = wrapped;
	}
	
	generateFeature(rand, gen, x, y) {
		this.#wrapped.generateFeature(rand, gen, x, y);
	}
	
	getBranchStartingPoints(rand, gen, node) {
		return [];
	}
	
	getOriginFromEntry(rand, direction, entryPoint) {
		return this.#wrapped.getOriginFromEntry(rand, direction, entryPoint);
	}
	
	featureProfile(x, y) {
		return this.#wrapped.featureProfile(x, y);
	}
	
	
}