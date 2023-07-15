import LevelLayer from "./LevelLayer.js";
import logMessage from "../Logging.js";
import * as LevelChunk from "./LevelChunk.js";
import * as QBEntities from "../index/QBEntities.js";
import * as QBTiles from "../index/QBTiles.js";

export default class SimulatedLevelLayer extends LevelLayer {

	#loaded = new Map();
	#snapshots = [];
	
	constructor(chunks, depth, motionScale, visualScale = 1) {
		super(chunks, depth, motionScale, visualScale);
	}
	
	tick() {
		//logMessage(`Ticking ${this.#loaded.size} entities`);
		
		let removed = [];
		for (const [id, entity] of this.#loaded.entries()) {
			/* let disp = entity.displacement(1);
			entity.setPos(disp[0], disp[1]);
			entity.newPath(); */
			
			entity.tick();
			if (entity.removed) {
				removed.push(id);
				this.#snapshots.push({
					type: "qb:remove_entity",
					id: id,
					layer: this.depth
				});
			} else {
				this.#snapshots.push(entity.getUpdateSnapshot());
			}
		}
		for (const id of removed) {
			this.#loaded.delete(id);
		}
		
		/*let startTime = 0;
		
		  for (let i = 0; i < MAX_ITERS; ++i) {
			
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
	
	// TODO: layers and entities
	
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
	
	loadEntity(data) {
		switch (data.type) {
			case "qb:load_entity": {
				logMessage(`Loading entity with id ${data.id} on client`);
				let type = QBEntities.getFromId(data.entityType);
				if (type) {
					let newEntity = type.create(data.pos[0], data.pos[1], this.level, this, data.id);
					this.addTicked(newEntity);
				} else {
					logMessage(`Error loading entity with id ${data.id} on client: Invalid type ${data.entityType}`);
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
					logMessage(`Killed entity with id ${data.id} on client`);
				}
				break;
			}
		}
	}
	
	render(ctx, dt, camera, snapScale) {
		super.render(ctx, dt, camera, snapScale);
		
		ctx.save();
		camera.lerp(ctx, dt, snapScale);
		for (const entity of this.#loaded.values()) {
			ctx.save();
			let d = entity.displacement(dt, snapScale);
			ctx.translate(d.x, d.y);
			entity.render(ctx, dt);
			ctx.restore();
		}
		ctx.restore();
	}
	
	renderMinimap(ctx, dt, camera) {
		ctx.fillStyle = "black";
		
		ctx.save();
		ctx.scale(4, 4);
		
		ctx.translate(-this.dimensions[0] - 2, 0);
		
		ctx.fillRect(0, 0, this.dimensions[0] + 2, this.dimensions[1] + 2);
		
		let chunks = this.getAllChunks();
		for (const chunk of chunks.values()) {			
			ctx.fillStyle = "white";
			let d = camera.displacement(dt);
			if (chunk.x === LevelChunk.toChunkSection(Math.floor(d.x)) && chunk.y === LevelChunk.toChunkSection(Math.floor(d.y)))
				ctx.fillStyle = "red";
			
			let x = chunk.x - this.bottomLeft[0];
			let y = chunk.y - this.bottomLeft[1];
			
			ctx.save();
			ctx.translate(x + 1, this.dimensions[1] - y);
			ctx.fillRect(0, 0, 1, 1);
			ctx.restore();
		}
		
		ctx.restore();
	}
	
	addSnapshots(snapshots) {
		snapshots.push(...this.#snapshots);
		this.#snapshots.splice(0, this.#snapshots.length);
	}
	
	getLayerData() {
		let obj = super.getLayerData();
		obj.type = "qb:simulated_layer";
		return obj;
	}

}