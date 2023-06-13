import { Level } from "./Level.js";
import QBRandom from "../QBRandom.js";

export class LevelGenerator {
	
	#nodes = 0;
	#seed;
	#rand;
	maxDepth = 3;
	
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
		// Generate each feature with random deviations from each other
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
			
			let feature = new LevelFeature("feature");
			if (i + 1 == length && depth == 0) {
				// Wrap feature in end feature.
				feature = new LevelFeature("end");
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

class LevelFeature {
	
	#id;
	
	constructor(id) {
		this.#id = id;
	}
	
	generateFeature(rand, x, y) {}
	
	get id() { return this.#id; }
	
}

class ChamberFeature extends LevelFeature {
	
	constructor() {
		super("chamber");
	}
	
	generateFeature(rand, x, y) {
		
	}
	
}