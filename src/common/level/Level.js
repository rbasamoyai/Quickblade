import { Entity } from "../entity/Entity.js";
import * as QBEntities from "../index/QBEntities.js";
import * as QBTiles from "../index/QBTiles.js";
import * as LevelChunk from "./LevelChunk.js";
import SimulatedLevelLayer from "./SimulatedLevelLayer.js";

import Vec2 from "../Vec2.js";
import BiIntMap from "../BiIntMap.js";

const MAX_ITERS = 6;

export default class Level {

	#layers;
	
	#camera;
	#bottomLeft;
	#dimensions;
	#loaded = new Map();
	snapshots = [];
	
	constructor(layers) {
		this.#layers = layers;
		for (const layer of this.#layers.values()) {
			layer.setLevel(this);
		}
	}
	
	tick() {
		for (const layer of this.#layers.values()) {
			layer.tick();
			if (layer instanceof SimulatedLevelLayer) layer.addSnapshots(this.snapshots);
		}
	}
	
	// TODO: layers and entities
	
	getEntities(checkDepth) {
		if (checkDepth) {
			let layer = this.getLayer(checkDepth);
			return layer instanceof SimulatedLevelLayer ? [...layer.getEntities()] : [];
		}
		let entities = [];
		for (const layer of this.#layers.values()) {
			if (layer instanceof SimulatedLevelLayer) entities.push(...layer.getEntities());
		}
		return entities;
	}
	
	getEntitiesMatching(pred, checkDepth) { return this.getEntities(checkDepth).filter(pred); }	
	getEntitiesIn(aabb, checkDepth) { return this.getEntitiesMatching(e => e.getAABB().collideBox(aabb), checkDepth); }
	
	addTicked(entity, depth) {
		let layer = this.getLayer(depth);
		if (layer instanceof SimulatedLevelLayer) layer.addTicked(entity);
	}
	
	removeTicked(entity) {
		for (const layer of this.#layers.values()) {
			if (layer instanceof SimulatedLevelLayer) layer.removeTicked(entity);
		}
	}
	
	getEntityById(id) {
		for (const layer of this.#layers.values()) {
			if (!(layer instanceof SimulatedLevelLayer)) continue;
			let e = layer.getEntityById(id);
			if (e) return e;
		}
		return null;
	}
	
	loadEntities(entityData) {
		for (const data of entityData) {
			let layer = this.getLayer(data.layer);
			if (layer instanceof SimulatedLevelLayer) layer.loadEntity(data);
		}
	}
	
	getAllLayers() { return this.#layers; }
	getLayer(depth) { return this.#layers.get(depth); }
	
	render(ctx, dt, snapScale) {
		ctx.fillStyle = "#cfffff";
		ctx.fillRect(0, 0, 16, 16);
		
		if (this.#layers.size === 0) return;
		
		if (!this.#layers.has(this.#camera.layer)) {
			this.#camera.layer = this.#layers.values().next().value.depth;
		}
		let mainLayer = this.getLayer(this.#camera.layer);
		let motionScale = mainLayer.motionScale;
		
		let sortLayers = [...this.#layers.values()];
		sortLayers.sort(compareLayersForRendering);
		
		for (const layer of sortLayers) {
			// Scaling
			ctx.save();
			let motionScale1 = layer.motionScale;
			let motionScale2 = new Vec2(motionScale1.x / motionScale.x, motionScale1.y / motionScale.y);
			layer.render(ctx, dt, this.#camera, snapScale, motionScale2);
			ctx.restore();
		}
	}
	
	renderMinimap(ctx, dt, camera) {
		if (this.#layers.size === 0) return;
		if (!this.#layers.has(this.#camera.layer)) {
			this.#camera.layer = this.#layers.values().next().value.depth;
		}
		let mainLayer = this.getLayer(this.#camera.layer);
		if (mainLayer instanceof SimulatedLevelLayer) mainLayer.renderMinimap(ctx, dt, camera);
	}
	
	setCamera(camera) { this.#camera = camera; }

}

// Greater depth => back of scene, render first
function compareLayersForRendering(a, b) {
	if (a.depth > b.depth) return -1;
	return a.depth < b.depth ? 1 : 0;
}