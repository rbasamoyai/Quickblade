import { Level } from "../Level.js";
import * as LevelChunk from "../LevelChunk.js";
import * as QBTiles from "../../index/QBTiles.js";
import { AABB } from "../../Collision.js";

import QBRandom from "../../QBRandom.js";
import Vec2 from "../../Vec2.js";
import * as Direction from "../../Direction.js";
import Triangle from "./Triangle.js";
import EdgeSet from "./EdgeSet.js";

export class LevelGenerator {
	
	#nodes = 0;
	#seed;
	#rand;
	#chunks = [];
	maxDepth = 3;
	#levelFeatures = [];
	#defaultTile;
	#msgLogger;
	
	constructor(seed, msgLogger = console.log, defaultTile = QBTiles.BACK_WALL) {
		this.#seed = seed ? seed : Date.now();
		this.#rand = new QBRandom(seed);
		this.#defaultTile = defaultTile;
		this.#msgLogger = msgLogger;
	}
	
	generateLevel() {
		this.#addRoomsToGenerate();		
		this.#msgLogger(`Generating ${this.#levelFeatures.length} rooms...`);
		
		this.#msgLogger(`Connecting rooms...`);
		let graph = this.#connectRoomsToEachOther();
		
		// for (const edge of graph.values()) this.#msgLogger(edge);
		
		this.#msgLogger(`Constructing rooms...`);
		for (const feature of this.#levelFeatures) {
			feature.generateFeature(this.#rand, this);
		}
		
		this.#msgLogger(`Connecting rooms...`);
		this.#connectFeatures(graph);
		
		// Chunks are padded out so as to hide open air.
		
		// Add entities.
		
		return new Level(this.#chunks);
	}
	
	#addRoomsToGenerate() {
		let roomCount = this.#rand.nextInt(23, 32);
		let start = new ChamberFeature(0, this.#rand, 0, 0);
		this.#levelFeatures.push(start);
		
		let p = 0;
		let MAX_ITERS = 100000;
		while (this.#levelFeatures.length < roomCount && p++ < MAX_ITERS) {
			let len = this.#levelFeatures.length;
			
			// TODO: Add more features and pick a feature from a pool.
			let newFeature = new ChamberFeature(len, this.#rand, 0, 0);
			
			let oldFeature = this.#levelFeatures[this.#rand.nextInt(0, len)];
			
			for (let i = 0; i < 3; ++i) {
				if (this.#tryPlacingRoomAroundOther(newFeature, oldFeature)) break;
			}
		}
	}
	
	#tryPlacingRoomAroundOther(feature, oldFeature) {		
		let point = oldFeature.getPointForFeature(this.#rand, feature);
		feature.setPos(point.x, point.y);
		let newProfile = feature.featureProfile();
		for (const otherFeature of this.#levelFeatures) {
			if (otherFeature.featureProfile().collideBox(newProfile)) return false;
		}
		this.#levelFeatures.push(feature);
		return true;
	}
	
	#connectRoomsToEachOther() {
		let baseGraph = this.#generateDelaunayGraph();
		let graph = new EdgeSet();
		
		// Stage 1: Minimum Spanning Tree via Prim's algorithm
		let featuresIterated = new Set([this.#rand.nextInt(0, this.#levelFeatures.length)]);
		while (featuresIterated.size < this.#levelFeatures.length) {
			let added = null;
			let distSqr = Infinity;
			
			for (const base of featuresIterated.values()) {
				let feature = this.#levelFeatures[base];
				
				for (const connected of baseGraph.connectedTo(base)) {
					if (featuresIterated.has(connected)) continue;
					let connectedFeature = this.#levelFeatures[connected];
					let dx = connectedFeature.x - feature.x;
					let dy = connectedFeature.y - feature.y;
					let distSqr1 = dx * dx + dy * dy;
					if (added !== null && distSqr1 >= distSqr) continue;
					added = [connected, base];
					distSqr = distSqr1;
				}
			}
			if (!added) break;
			graph.add(added[0], added[1]);
			featuresIterated.add(added[0]);
		}
		
		// Stage 2: Add non-linearity by adding some of the remaining graph connections.
		let connectionChance = 0.0625;
		for (const edge of baseGraph.values()) {
			if (!graph.has(edge[0], edge[1]) && this.#rand.nextFloat() < connectionChance) {
				graph.add(edge[0], edge[1]);
			}
		}
		this.#msgLogger(`Shrunk connection count from ${baseGraph.size} to ${graph.size}`);
		
		return graph;
	}
	
	#generateDelaunayGraph() {
		// Implementation of Bowyer-Watson algorithm for Delaunay triangulation from Wikipedia:
		// https://en.wikipedia.org/wiki/Bowyer%E2%80%93Watson_algorithm
		let graph = new EdgeSet();
		if (this.#levelFeatures.size === 0) return graph;
		let triangles = [];
		
		let superTri = this.#makeSuperTriangle();
		triangles.push(superTri);
		let superTriVerts = superTri.allVerts();
		
		for (const feature of this.#levelFeatures) {
			let badTriangles = [];
			
			for (const tri of triangles) {
				if (tri.inCircumcircle(feature.x, feature.y)) badTriangles.push(tri);
			}
			
			let polygon = new EdgeSet();
			let dupeEdges = new EdgeSet();
			for (const tri of badTriangles) {
				let edges = tri.allEdges();
				for (const edge of edges) {
					if (dupeEdges.has(edge[0], edge[1])) continue;
					if (polygon.has(edge[0], edge[1])) {
						dupeEdges.add(edge[0], edge[1]);
						polygon.delete(edge[0], edge[1]);
					} else {
						polygon.add(edge[0], edge[1]);
					}
				}
				triangles.splice(triangles.indexOf(tri), 1);
			}
			
			let vert3 = new Vec2(feature.x, feature.y);
			
			for (const edge of polygon.values()) {
				let vert1Id = edge[0];
				let vert2Id = edge[1];
				
				let vert1;
				if (vert1Id < 0) {
					vert1 = superTriVerts.get(vert1Id);
				} else {
					let assocFeature = this.#levelFeatures[vert1Id];
					vert1 = new Vec2(assocFeature.x, assocFeature.y);
				}
				
				let vert2;
				if (vert2Id < 0) {
					vert2 = superTriVerts.get(vert2Id);
				} else {
					let assocFeature = this.#levelFeatures[vert2Id];
					vert2 = new Vec2(assocFeature.x, assocFeature.y);
				}
				
				triangles.push(new Triangle(vert1, vert1Id, vert2, vert2Id, vert3, feature.id));
			}
		}
		
		for (const tri of triangles) {
			for (const edge of tri.resolveEdges()) {
				graph.add(edge[0], edge[1]);
			}
		}
		return graph;
	}
	
	#makeSuperTriangle() {
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		
		for (const feature of this.#levelFeatures) {
			minX = Math.min(minX, feature.x);
			minY = Math.min(minY, feature.y);
			maxX = Math.max(maxX, feature.x);
			maxY = Math.max(maxY, feature.y);
		}
		
		let xf = maxX - minX;
		let yf = maxY - minY;
		let r = Math.sqrt(xf * xf + yf * yf) * 0.75;
		let r1 = r * 1.7321; // ~= r * sqrt 3
		
		let superTriMx = (maxX - minX) * 0.5;
		let superTriMy = (maxY - minY) * 0.5;
		
		let superTriV1 = new Vec2(superTriMx - r1, superTriMy - r);
		let superTriV2 = new Vec2(superTriMx + r1, superTriMy - r);
		let superTriV3 = new Vec2(superTriMx, superTriMy + 2 * r);
		return new Triangle(superTriV1, -1, superTriV2, -2, superTriV3, -3);
	}
	
	#connectFeatures(graph) {
		let points = new EdgeSet();
		for (const edge of graph.values()) {
			let feature1 = this.#levelFeatures[edge[0]];
			let feature2 = this.#levelFeatures[edge[1]];
			
			let point1 = new Vec2(Math.round(feature1.x), Math.round(feature1.y));
			let point2 = new Vec2(Math.round(feature2.x), Math.round(feature2.y));
			
			// Primitive line algorithm that uses just enough samples, might use Bezier curves later
			let diff = point2.subtractVec(point1);
			if (diff.lengthSqr() < 1e-4) continue;
			let dir = diff.normalize().scale(0.5);
			let samples = Math.ceil(diff.length() * 2);
			
			for (let i = 0; i < samples; ++i) {
				let pos = dir.scale(i).addVec(point1);
				points.add(Math.floor(pos.x), Math.floor(pos.y));
			}
		}
		
		// Pass 1: walls on replaceable tiles, e.g. back walls
		for (const pt of points.values()) {
			let ox = pt[0];
			let oy = pt[1];
			
			for (let ty = -2; ty < 3; ++ty) {
				for (let tx = -2; tx < 3; ++tx) {
					if (ty * ty + tx * tx > 8) continue;
					
					let tx1 = ox + tx;
					let ty1 = oy + ty;
					let tile = QBTiles.getFromIdNum(this.getTile(tx1, ty1));
					if (tile.replaceable) this.setTile(tx1, ty1, QBTiles.BLOCK);
				}
			}
		}
		
		// Pass 2: background on walls
		for (const pt of points.values()) {
			let ox = pt[0];
			let oy = pt[1];
			
			for (let ty = -1; ty < 2; ++ty) {
				for (let tx = -1; tx < 2; ++tx) {
					if (ty * ty + tx * tx > 3) continue;
					
					let tx1 = ox + tx;
					let ty1 = oy + ty;
					this.setTile(tx1, ty1, QBTiles.BACKGROUND);
				}
			}
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
		
		let newChunk = new LevelChunk.LevelChunk(cx, cy, this.#defaultTile);
		newChunk.setTile(tx, ty, tile);
		this.#chunks.push(newChunk);
	}
	
}

class LevelFeature {
	
	#typeId;
	#id;
	#pos;
	
	constructor(typeId, id, rand, x, y) {
		this.#typeId = typeId;
		this.#id = id;
		this.#pos = new Vec2(x, y);
	}
	
	generateFeature(rand, gen) {}
	
	getPointForFeature(rand, otherFeature) {
		let thisProfile = this.featureProfile();
		let otherProfile = otherFeature.featureProfile();
		
		let minX = thisProfile.topLeft[0] - otherProfile.width * 0.75;
		let minY = thisProfile.topLeft[1] - otherProfile.height * 0.75;
		let width = thisProfile.width + otherProfile.width * 1.5;
		let height = thisProfile.height + otherProfile.height * 1.5;
		
		let f = rand.nextFloat();
		switch (Direction.random(rand)) {
			case Direction.UP: return new Vec2(minX + width * f, minY + height);
			case Direction.DOWN: return new Vec2(minX + width * f, minY);
			case Direction.LEFT: return new Vec2(minX, minY + height * f);
			default /* Direction.RIGHT */: return new Vec2(minX + width, minY + height * f);
		}
	}
	
	getTunnelingPoint(rand, otherFeature) {
		return this.#pos.copy();
	}
	
	featureProfile() {
		return new AABB(this.x, this.y, 1, 1);
	}
	
	get type() { return this.#typeId; }
	get id() { return this.#id; }
	
	setPos(x, y) { this.#pos = new Vec2(x, y); }
	get x() { return this.#pos.x; }
	get y() { return this.#pos.y; }
	
}

class ChamberFeature extends LevelFeature {

	#width;
	#height;
	
	constructor(id, rand, x, y) {
		super("chamber", id, rand, x, y);
		this.#width = rand.nextInt(12, 32);
		this.#height = rand.nextInt(8, 16);
	}
	
	generateFeature(rand, gen) {
		let ox = this.#getBottomLeftX();
		let oy = this.#getBottomLeftY();
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
	
	getTunnelingPoint(rand, otherFeature) {
		let th = Math.atan(otherFeature.y - this.y, otherFeature.x - this.x);
		th += rand.nextGaussian(0, 45);
		return pointOnBox(this.#width, this.#height).add(this.x, this.y);
	}
	
	featureProfile() {
		return new AABB(this.#getBottomLeftX() - 1, this.#getBottomLeftY() - 1, this.#width + 2, this.#height + 2);
	}
	
	#getBottomLeftX() {
		return Math.floor(this.x - this.#width / 2);
	}
	
	#getBottomLeftY() {
		return Math.floor(this.y - this.#height / 2);
	}
	
}

class EndFeature extends LevelFeature {
	
	#wrapped;
	
	constructor(rand, wrapped) {
		super("end", -1, rand, wrapped.x, wrapped.y);
		this.#wrapped = wrapped;
	}
	
	generateFeature(rand, gen) {
		this.#wrapped.generateFeature(rand, gen);
	}
	
	getPointForFeature(rand, otherFeature) {
		return this.#wrapped.getPointForFeature(rand, otherFeature);
	}
	
	getTunnelingPoint(rand, otherFeature) {
		return this.#wrapped.getTunnelingPoint(rand, otherFeature);
	}
	
	featureProfile() {
		return this.#wrapped.featureProfile();
	}
	
	get id() { return this.#wrapped.id; }
	
	setPos(x, y) { this.#wrapped.setPos(x, y); }
	get x() { return this.#wrapped.x; }
	get y() { return this.#wrapped.y; }
	
}

const EPSILION = 0.0001
const TWO_PI = Math.PI * 2;

function pointOnBox(w, h, th) {
	th = (th % TWO_PI + TWO_PI) % TWO_PI;
	if (th > Math.PI) th -= TWO_PI;
	if (Math.abs(th - Math.PI / 2) < EPSILION) return new Vec2(h/2, 0);
	if (Math.abs(th - Math.PI / -2) < EPSILION) return new Vec2(-h/2, 0);
	let l = Math.sqrt(w*w/4 + h*h/4);
	let x1 = clamp(Math.cos(th) * l, -w/2, w/2);
	let y1 = Math.sin(th) * l;
	let y2 = clamp(y1, -h/2, h/2);
	return -h/2 <= y1 && y1 < h/2 ? new Vec2(x1, x1 * Math.tan(th)) : new Vec2(y2 / Math.tan(th), y2);
}

function clamp(x, min, max) {
	return x < min ? min : x > max ? max : x;
}