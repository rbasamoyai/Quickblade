import AbstractLevelLayerGenerator from "./AbstractLevelLayerGenerator.js";

import * as QBTiles from "../../index/QBTiles.js";
import * as Direction from "../../Direction.js";
import { CHUNK_SIZE } from "../LevelChunk.js";
import WeightedCollection from "../../WeightedCollection.js";
import BiIntMap from "../../BiIntMap.js";
import BiIntSet from "../../BiIntSet.js";
import UniqueBiIntQueue from "../../UniqueBiIntQueue.js";
import LevelLayer from "../LevelLayer.js";

export default class WaveFunctionCollapseLayerGenerator extends AbstractLevelLayerGenerator {

	#bottomLeft;
	#dimensions;
	
	#config;
	#tiles = new Map();
	#baseSet;

	constructor(rand, msgLogger, bottomLeft, dimensions, config, emptyTile = QBTiles.GEN_ROCK_BACKGROUND) {
		super(rand, msgLogger, emptyTile);
		this.#bottomLeft = bottomLeft;
		this.#dimensions = dimensions;
		this.#config = config;
		this.#init();
	}
	
	generateLayer(depth, motionScale, visualScale = 1) {
		let initialPos = [this.#bottomLeft[0] * CHUNK_SIZE, this.#bottomLeft[1] * CHUNK_SIZE];
		
		let possibleMap = new BiIntMap();
		possibleMap.set(...initialPos, new Set(this.#tiles.keys()));
		
		let collapsed = new BiIntSet();
		
		let SIZE = this.#dimensions[0] * this.#dimensions[1] * CHUNK_SIZE * CHUNK_SIZE;
		let MAX_ITER = SIZE * 2;
		
		let p = 0;
		for ( ; p < MAX_ITER; ++p) {
			if (possibleMap.size < 1) break;
			
			// Getting position with least posibilities
			let pos = null;
			let possibilities = null;
			
			let pCount = this.#tiles.keys().size + 1;
			for (const [pos1, set] of possibleMap.entries()) {
				if (set.size > pCount || set.size === pCount && !this.rand.nextBoolean()) continue;
				pCount = set.size;
				pos = pos1;
				possibilities = set;
			}
			
			if (!pos || !possibilities || possibilities.size < 1) {
				this.msgLogger("Failed to generate with WFC, stopping WFC generation: state of no possibilities reached");
				return;
			}
			
			// Collapse
			let choices = this.#baseSet.intersectSet(possibilities);
			let tile = choices.choose(this.rand);
			if (!tile) {
				//console.log(this.#baseSet);
				//console.log(possibilities);
				this.msgLogger("Failed to generate with WFC, stopping WFC generation: no tile reached during collapse");
				return;
			}
			this.setTile(...pos, tile);
			collapsed.add(...pos);
			possibleMap.delete(...pos);
			
			// Propagate
			let frontier = new UniqueBiIntQueue(); 
			frontier.push(...pos);
			
			for (let q = 0; q < MAX_ITER && frontier.size > 0; ++q) {
				let pos1 = frontier.poll();
				let thisPossibleTiles = possibleMap.get(...pos1);
				
				for (const dir of Direction.values()) {
					let pos2 = Direction.offset(pos1, dir);
					if (!this.hasPos(...pos2) || collapsed.has(...pos2)) continue;
					
					if (!possibleMap.has(...pos2)) possibleMap.set(...pos2, new Set(this.#tiles.keys()));
					let otherPossible = possibleMap.get(...pos2);
					
					let possibleNeighbors;
					if (collapsed.has(...pos1)) {
						possibleNeighbors = new Set(this.#tiles.get(this.getTile(...pos1)).get(dir).keys());
					} else {
						possibleNeighbors = new Set();
						for (const pTile of thisPossibleTiles) {
							if (!this.#tiles.has(pTile)) continue;
							let weightedSet = this.#tiles.get(pTile).get(dir);
							for (const tile of weightedSet.keys()) possibleNeighbors.add(tile);
						}
					}
					
					for (const oTile of otherPossible) {
						if (possibleNeighbors.has(oTile)) continue;
						otherPossible.delete(oTile);
						frontier.push(...pos2);
					}
				}
			}
			console.log(p);
		}
		console.log(p);
		console.log(MAX_ITER);
		return new LevelLayer(this.chunks, depth, motionScale, visualScale);
	}
	
	#init() {
		let width = this.#config.width;
		let height = this.#config.sample.length;
		this.#baseSet = new WeightedCollection();
		
		for (let ty = 0; ty < height; ++ty) {
			for (let tx = 0; tx < width; ++tx) {
				let tile = this.#getConfigTile(tx, ty);
				this.#baseSet.add(tile, 1);
				
				if (!this.#tiles.has(tile)) this.#tiles.set(tile, new TileInfo());
				let info = this.#tiles.get(tile);
				
				if (tx > 0) info.add(Direction.LEFT, this.#getConfigTile(tx - 1, ty));
				if (tx < width - 1) info.add(Direction.RIGHT, this.#getConfigTile(tx + 1, ty));
				if (ty > 0) info.add(Direction.UP, this.#getConfigTile(tx, ty - 1));
				if (ty < height - 1) info.add(Direction.DOWN, this.#getConfigTile(tx, ty + 1));
			}
		}
		
		let sx = this.#bottomLeft[0];
		let sy = this.#bottomLeft[1];
		let ex = sx + this.#dimensions[0];
		let ey = sy + this.#dimensions[1];
		
		for (let cy = sy; cy < ey; ++cy) {
			for (let cx = sx; cx < ex; ++cx) {
				this.allocChunk(cx, cy);
			}
		}
	}
	
	#getConfigTile(x, y) {
		if (y < 0 || this.#config.sample.length <= y) return QBTiles.AIR;
		let row = this.#config.sample[y];
		return 0 <= x && x < row.length ? QBTiles.getFromIdKey(this.#config.key[row.charAt(x)]) : QBTiles.AIR;
	}
	
}

class TileInfo {
	
	#adjacent = new Map();
	
	constructor() {
	}
	
	add(dir, tile) {
		if (!this.#adjacent.has(dir)) this.#adjacent.set(dir, new WeightedCollection());
		let weightsForDir = this.#adjacent.get(dir);
		weightsForDir.add(tile, 1);
	}
	
	get(dir) {
		return this.#adjacent.has(dir) ? this.#adjacent.get(dir) : WeightedCollection.EMPTY;
	}
	
}