import ServerInputHandler from "./ServerInputHandler.js";
import { Level } from "../common/Level.js";
import * as QBEntities from "../common/index/QBEntities.js";
const serverLevel = new Level([]);

const input = new ServerInputHandler();

let updateControl = null;

let controlledEntity = QBEntities.PLAYER.create(4, 2, serverLevel);
serverLevel.addTicked(controlledEntity);
serverLevel.snapshots.push(controlledEntity.getLoadSnapshot());

input.setEntity(controlledEntity);
updateControl = controlledEntity.id;

let otherEntity = QBEntities.IMP.create(8, 2, serverLevel);
serverLevel.addTicked(otherEntity);
serverLevel.snapshots.push(otherEntity.getLoadSnapshot());

const TICK_TARGET = 30;

let stopped = false;

onmessage = evt => {
	switch (evt.data.type) {
		case "qb:kb_input_update": {
			input.updateInput(evt.data.state | 0);
			break;
		}
		case "qb:jump_input": {
			input.handleJump(evt.data.vec);
			break;
		}
	}
};

function mainloop() {
	let startMs = Date.now();
	input.tick();
	if (serverLevel) {
		serverLevel.tick();	
	}
	while (Date.now() - startMs < TICK_TARGET) {}
	if (serverLevel) {
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