import ServerInputHandler from "./ServerInputHandler.js";

import * as QBEntities from "../common/index/QBEntities.js";
import * as QBTiles from "../common/index/QBTiles.js";
import * as QBItems from "../common/index/QBItems.js";

import PlayerAppearance from "../common/entity/PlayerAppearance.js";

import LevelGenerator from "../common/level/generation/LevelGenerator.js";

import logMessage from "../common/Logging.js";
import Vec2 from "../common/Vec2.js";

const input = new ServerInputHandler();

let clientReady = false;
let serverLevel = null;

onmessage = evt => {
	switch (evt.data.type) {
		case "qb:generate_new_level": {
			onLevelGenerate(evt.data.seed);
			break;
		}
		case "qb:pause": {
			if (serverLevel) {
				serverLevel.setPaused(evt.data.pause);
			}
			break;
		}
		case "qb:kb_input_update": {
			input.updateInput(evt.data.state | 0);
			break;
		}
		case "qb:jump_input": {
			input.handleJump(new Vec2(...evt.data.vec));
			break;
		}
		case "qb:client_ready": {
			initController(evt.data.appearance);
			clientReady = true;
			logMessage("Client ready, server starting.");
			break;
		}
		case "qb:drop_item": {
			if (!serverLevel) break;
			let entity = serverLevel.getEntityById(evt.data.player);
			entity?.dropItem(evt.data.slot, evt.data.count);
			break;
		}
	}
};

const TICK_TARGET = 30;

let controlledEntity = null;
let updateControl = null;
let stopped = false;

async function onLevelGenerate(seed) {
	clientReady = false;
	
	let levelGenerator = new LevelGenerator(seed, logMessage);
	serverLevel = await levelGenerator.generateLevel(console.log);
	serverLevel.setPaused(true);
	let layers = serverLevel.getAllLayers();
	
	let serializedLayers = [];
	for (const [depth, layer] of layers.entries()) {
		serializedLayers.push([depth, layer.getLayerData()]);
	}
	postMessage({ type: "qb:expected_level_data", layers: serializedLayers });
	
	let p = 0;
	for (const [depth, layer] of layers.entries()) {
		for (const [pos, chunk] of layer.getAllChunks().entries()) {
			postMessage({
				type: "qb:load_level_data_packet",
				layer: depth,
				x: pos[0],
				y: pos[1],
				tiles: chunk.getAllTiles()
			});
		}
	}
	
	let mainLayer = serverLevel.getLayer(0);
	
	//for (let i = 0; i < 5; ++i) {
		let item = QBEntities.ITEM.create(4, 0, serverLevel, mainLayer);
		//item.setItem(QBItems.GOLD, Math.floor(Math.random() * 75) + 12);
		item.setItem(QBItems.GOLD, 9999);
		let dx = Math.random() * 0.05 - 0.025;
		item.setVelocity(new Vec2(dx, 0));
		serverLevel.addTicked(item, 0);
		serverLevel.snapshots.push(item.getLoadSnapshot());
	//}
	
	//let otherEntity = QBEntities.IMP.create(4, 2, serverLevel, mainLayer);
	//serverLevel.addTicked(otherEntity, 0);
	//serverLevel.snapshots.push(otherEntity.getLoadSnapshot());
}

function initController(appearance) {
	if (!serverLevel) return;
	let mainLayer = serverLevel.getLayer(0);
	
	controlledEntity = QBEntities.PLAYER.create(0, 0, serverLevel, mainLayer);
	controlledEntity.appearance = new PlayerAppearance(appearance.skinColor, appearance.eyeColor);
	//controlledEntity.noGravity = true;
	
	serverLevel.addTicked(controlledEntity, 0);
	serverLevel.snapshots.push(controlledEntity.getLoadSnapshot());

	input.setEntity(controlledEntity);
	updateControl = controlledEntity.id;
}

function mainloop() {
	let startMs = Date.now();
	if (serverLevel && clientReady) {
		if (!serverLevel.isPaused()) {
			input.tick();
			serverLevel.tick();
		}
		postMessage({
			type: "qb:update_client",
			time: Date.now(),
			entityData: [...serverLevel.snapshots]
		});
		serverLevel.snapshots.splice(0, serverLevel.snapshots.length);
		if (updateControl || updateControl == 0) {
			postMessage({
				type: "qb:update_controlled_entity",
				id: updateControl
			});
			updateControl = null;
		}
		if (controlledEntity && !controlledEntity.isAlive()) {
			postMessage({
				type: "qb:player_dead"
			});
		}
	}
	while (Date.now() - startMs < TICK_TARGET) {}
	setTimeout(mainloop, 0);
}

mainloop();