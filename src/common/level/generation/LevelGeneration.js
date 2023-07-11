import { Level } from "../Level.js";
import * as LevelChunk from "../LevelChunk.js";
import * as QBTiles from "../../index/QBTiles.js";
import { AABB } from "../../Collision.js";

import QBRandom from "../../QBRandom.js";
import Vec2 from "../../Vec2.js";

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
	
	generateLevel(msgLogger) {
		this.#addRoomsToGenerate();		
		msgLogger(`Generating ${this.#levelFeatures.length} rooms`);
		
		// Phase 2: connecting rooms
		this.#connectRoomsToEachOther();
		
		// Phase 3: generating features
		// The level features are added to chunks.
		
		for (const feature of this.#levelFeatures) {
			feature.generateFeature(this.#rand, this);
		}
		
		// After generation, pathways are generated between features.
		
		// Chunks are padded out so as to hide open air.
		
		// Add entities.
		
		return new Level(this.#chunks);
	}
	
	#addRoomsToGenerate() {
		let roomCount = this.#rand.nextInt(23, 32);
		let start = new ChamberFeature(0, this.#rand, 0, 0);
		this.#levelFeatures.push(start);
		
		// Add more rooms.
		
		let p = 0;
		let MAX_ITERS = 100000;
		while (this.#levelFeatures.length < roomCount && p++ < MAX_ITERS) {
			let len = this.#levelFeatures.length;
			
			// Pick feature from pool.
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
		if (this.#levelFeatures.size === 0) return /*something*/;
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
		this.#pos = [x, y];
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
		switch (rand.nextInt(0, 4)) {
			case 0: return new Vec2(minX + width * f, minY + height); // Up
			case 1: return new Vec2(minX + width * f, minY); // Down
			case 2: return new Vec2(minX, minY + height * f) // Left
			default: return new Vec2(minX + width, minY + height * f); // Right, 3
		}
	}
	
	featureProfile() {
		return new AABB(this.x, this.y, 1, 1);
	}
	
	get type() { return this.#typeId; }
	get id() { return this.#id; }
	
	setPos(x, y) { this.#pos = [x, y]; }
	get x() { return this.#pos[0]; }
	get y() { return this.#pos[1]; }
	
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