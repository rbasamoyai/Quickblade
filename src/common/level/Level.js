import { Entity } from "../entity/Entity.js";
import * as QBEntities from "../index/QBEntities.js";
import * as QBTiles from "../index/QBTiles.js";
import * as LevelChunk from "./LevelChunk.js";

import Vec2 from "../Vec2.js";
import BiIntMap from "../BiIntMap.js";

const MAX_ITERS = 6;

export class Level {

	#chunks;
	#paddingChunk;
	
	#loaded = new Map();
	#camera;
	snapshots = [];
	#bottomLeft;
	#dimensions;
	
	constructor(cs, chunkPaddingTile = QBTiles.BACK_WALL) {
		this.#chunks = cs;
		this.#paddingChunk = new LevelChunk.LevelChunk(0, 0, chunkPaddingTile);
		
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		
		for (const chunk of this.#chunks.values()) {
			minX = Math.min(minX, chunk.x);
			minY = Math.min(minY, chunk.y);
			maxX = Math.max(maxX, chunk.x);
			maxY = Math.max(maxY, chunk.y);
		}
		
		if (Number.isFinite(minX) && Number.isFinite(minY) && Number.isFinite(maxX) && Number.isFinite(maxY)) {
			this.#bottomLeft = [minX, minY];
			this.#dimensions = [maxX - minX + 1, maxY - minY + 1];
		} else {
			this.#bottomLeft = [0, 0];
			this.#dimensions = [0, 0];
		}
	}
	
	tick() {
		let d = new Date();
		let s = `[${d.toLocaleTimeString("en-US", { hour12: false })}]`;
		//console.log(`${s} Ticking ${this.#loaded.size} entities`);
		
		this.#loaded.forEach((entity, id, m) => {
			/* let disp = entity.displacement(1);
			entity.setPos(disp[0], disp[1]);
			entity.newPath(); */
			
			entity.tick();
			if (!entity.removed) this.snapshots.push(entity.getUpdateSnapshot());
		});
		this.#loaded.forEach((entity, id, m) => {
			if (entity.removed) this.#loaded.delete(id);
		});
		
		let startTime = 0;
		
		/*for (let i = 0; i < MAX_ITERS; ++i) {
			
			let movementBoxes = new Map();
			let dt = 1 - startTime;
			
			this.#loaded.forEach((entity, id, m) => {
				let disp = entity.displacement(startTime);
				movementBoxes.put(id, entity.getAABB().move(disp[0], disp[1]).expandTowards(entity.dx * dt, entity.dy * dt));
			});
			
			let checkmap = new Map();
			movementBoxes.forEach((box, id, m) => {
				checkmap.set(id, []);
				movementBoxes.forEach((box1, id1, m1) => {
					if (id !== id1 && box.collideBox(box1)) checkmap.get(id).push(id1);
				});
			});
			
			let earliestCollisionTimes = new Map();		
			checkmap.forEach((checks, id, m) => {
				let entity = this.#loaded.get(id);
				let eId = null;
				let et = -1; // TODO: check with level first if physics enabled
				for (const id1 of checks) {
					let ct = entity.collideEntities(this.#loaded.get(id1));
					if (ct === -1 || ct >= et) continue;
					et = ct;
					eId = id1;
				}
				if (et !== -1) earliestCollisionTimes.set(id, { withId: eId, time: et });
			});
			
			let aTimes = [];
			for (const entry of earliestCollisionTimes.entries()) {
				aTimes.push(entry);
			}
			aTimes.sort((a, b) => (a[1].time > b[1].time) - (a[1].time < b[1].time));
			
			let etFinal = null;
			for (const et of aTimes) {
				let entity = this.#loaded.get(et[0]);
				if (!entity) continue;
				if (!et[1].withId && entity.onCollideLevel()) {
					etFinal = et;
					break;
				}
				let other = this.#loaded.get(et[1].withId);
				if (other && entity.onCollideEntity(other)) {
					etFinal = et;
					break;
				}
			}
			if (!etFinal) break;
			startTime = etFinal[1].time;
			
			let affected = this.#loaded.get(etFinal[0]);
			if (affected) {
				affected.updatePath(startTime);
			}
		}*/
		
		
	}
	
	getEntities() {
		let entities = [];
		for (const entity of this.#loaded.values()) {
			entities.push(entity);
		}
		return entities;
	}
	
	getEntitiesMatching(pred) { return this.getEntities().filter(pred); }	
	getEntitiesIn(aabb) { return this.getEntitiesMatching(e => e.getAABB().collideBox(aabb)); }
	
	addTicked(entity) { this.#loaded.set(entity.id, entity); }
	removeTicked(entity) { this.#loaded.delete(entity.id); }
	getEntityById(id) { return this.#loaded.get(id); }
	
	loadEntities(entityData) {
		for (const data of entityData) {
			switch (data.type) {
				case "qb:load_entity": {	
					let d = new Date();
					let s = `[${d.toLocaleTimeString("en-US", { hour12: false })}]`;
					console.log(`${s} Loading entity with id ${data.id} on client`);
					let type = QBEntities.getFromId(data.entityType);
					if (type) {
						let newEntity = type.create(data.pos[0], data.pos[1], this, data.id);
						this.addTicked(newEntity);
					} else {
						s = `[${d.toLocaleTimeString("en-US", { hour12: false })}]`;
						console.log(`${s} Error loading entity with id ${data.id} on client: Invalid type ${data.entityType}`);
					}
					break;
				}
				case "qb:update_entity": {
					let entity = this.getEntityById(data.id);
					if (entity) entity.readUpdateSnapshot(data);
					break;
				}
				case "qb:remove_entity": {
					let entity1 = this.getEntityById(data.id);
					if (entity1) {
						this.removeTicked(entity1);
						entity1.removed = true;
						let d = new Date();
						let s = `[${d.toLocaleTimeString("en-US", { hour12: false })}]`;
						console.log(`${s} Killed entity with id ${data.id} on client`);
					}
					break;
				}
			}
		}
	}
	
	getTile(x, y) {
		let cx = LevelChunk.toChunkSection(x);
		let cy = LevelChunk.toChunkSection(y);
		let tx = LevelChunk.toChunkCoord(x);
		let ty = LevelChunk.toChunkCoord(y);
		return this.#chunks.has(cx, cy) ? this.#chunks.get(cx, cy).getTile(tx, ty) : QBTiles.AIR;
	}
	
	setTile(x, y, tile) {
		let cx = LevelChunk.toChunkSection(x);
		let cy = LevelChunk.toChunkSection(y);
		let tx = LevelChunk.toChunkCoord(x);
		let ty = LevelChunk.toChunkCoord(y);
		this.#chunks.get(cx, cy)?.setTile(tx, ty, tile);
	}
	
	render(ctx, dt, scale) {
		ctx.fillStyle = "#cfffff";
		ctx.fillRect(0, 0, 16, 16);
		
		let minCX = -1;
		let minCY = -1;
		let maxCX = 1;
		let maxCY = 1;
		if (this.#camera) {
			this.#camera.lerp(ctx, dt, scale);
			let bounds = this.#camera.bounds(dt);
			minCX = bounds.minCX;
			minCY = bounds.minCY;
			maxCX = bounds.maxCX;
			maxCY = bounds.maxCY;
		}
		
		for (let cy = minCY; cy <= maxCY; ++cy) {
			for (let cx = minCX; cx <= maxCX; ++cx) {
				ctx.save();
				ctx.transform(1, 0, 0, 1, cx * LevelChunk.CHUNK_SIZE, cy * LevelChunk.CHUNK_SIZE);
				let chunk = this.#chunks.has(cx, cy) ? this.#chunks.get(cx, cy) : this.#paddingChunk;
				chunk.render(ctx, dt);
				ctx.restore();
			}
		}
		
		for (const entity of this.#loaded.values()) {
			ctx.save();
			let d = entity.displacement(dt, scale);
			ctx.translate(d.x, d.y);
			entity.render(ctx, dt);
			ctx.restore();
		}
	}
	
	renderMinimap(ctx, dt) {
		ctx.fillStyle = "black";
		
		ctx.save();
		ctx.scale(4, 4);
		
		ctx.translate(-this.#dimensions[0] - 2, 0);
		
		ctx.fillRect(0, 0, this.#dimensions[0] + 2, this.#dimensions[1] + 2);
		
		for (const chunk of this.#chunks.values()) {			
			ctx.fillStyle = "white";
			if (this.#camera) {
				let d = this.#camera.displacement(dt);
				if (chunk.x === LevelChunk.toChunkSection(Math.floor(d.x)) && chunk.y === LevelChunk.toChunkSection(Math.floor(d.y)))
					ctx.fillStyle = "red";
			}
			
			let x = chunk.x - this.#bottomLeft[0];
			let y = chunk.y - this.#bottomLeft[1];
			
			ctx.save();
			ctx.translate(x + 1, this.#dimensions[1] - y);
			ctx.fillRect(0, 0, 1, 1);
			ctx.restore();
		}
		
		ctx.restore();
	}
	
	setCamera(camera) { this.#camera = camera; }
	
	getAllChunks() { return this.#chunks; }

}