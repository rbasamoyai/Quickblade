import ServerInputHandler from "./ServerInputHandler.js";
import { Level } from "../common/level/Level.js";

import * as QBEntities from "../common/index/QBEntities.js";
import * as QBTiles from "../common/index/QBTiles.js";

import { LevelGenerator } from "../common/level/generation/LevelGeneration.js";

import Vec2 from "../common/Vec2.js";

const input = new ServerInputHandler();

let clientReady = false;

onmessage = evt => {
	switch (evt.data.type) {
		case "qb:kb_input_update": {
			input.updateInput(evt.data.state | 0);
			break;
		}
		case "qb:jump_input": {
			input.handleJump(new Vec2(...evt.data.vec));
			break;
		}
		case "qb:client_ready": {
			clientReady = true;
			console.log("Client ready, server starting.");
			break;
		}
	}
};

const TICK_TARGET = 30;

const levelSeed = 1;
const levelGenerator = new LevelGenerator(levelSeed);
const serverLevel = levelGenerator.generateLevel(msg => console.log(msg));

postMessage({ type: "qb:expected_chunk_count", count: serverLevel.getAllChunks().length });
serverLevel.getAllChunks().forEach(chunk => postMessage(chunk.serialize()));

let updateControl = null;

let controlledEntity = QBEntities.PLAYER.create(4, 2, serverLevel);
controlledEntity.noGravity = true;
serverLevel.addTicked(controlledEntity);
serverLevel.snapshots.push(controlledEntity.getLoadSnapshot());

input.setEntity(controlledEntity);
updateControl = controlledEntity.id;

//let otherEntity = QBEntities.IMP.create(8, 2, serverLevel);
//serverLevel.addTicked(otherEntity);
//serverLevel.snapshots.push(otherEntity.getLoadSnapshot());

let stopped = false;

function mainloop() {
	let startMs = Date.now();
	input.tick();
	if (serverLevel && clientReady) {
		serverLevel.tick();	
	}
	while (Date.now() - startMs < TICK_TARGET) {}
	if (serverLevel && clientReady) {
		postMessage({
			type: "qb:update_client",
			time: Date.now(),
			entityData: serverLevel.snapshots
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
	setTimeout(mainloop, 0);
}

mainloop();