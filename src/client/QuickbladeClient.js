function stopErr(err) {
	const box = document.querySelector("#error_box");
	box.textContent = err;
	box.style.display = "block";
	throw err;
}

if (!window.Worker) {
	stopErr("Web Workers are not supported by this browser");
}

const TICK_DT = 1 / 33;
const SCALE = 32;
const SNAP_SCALE = 16;

import Level from "../common/level/Level.js";
import { LevelChunk } from "../common/level/LevelChunk.js";
import LevelLayer from "../common/level/LevelLayer.js";
import SimulatedLevelLayer from "../common/level/SimulatedLevelLayer.js";

import Camera from "./Camera.js";
import QBRandom from "../common/QBRandom.js";
import { Creature } from "../common/entity/Creature.js";

import * as QBEntities from "../common/index/QBEntities.js";
import * as QBTiles from "../common/index/QBTiles.js";

import logMessage from "../common/Logging.js";
import BiIntMap from "../common/BiIntMap.js";
import Vec2 from "../common/Vec2.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothEnabled = false;

//import LevelGenerator from "../common/level/generation/LevelGenerator.js";

const worker = new Worker("./src/server/QuickbladeServer.js", { type: "module" });

const RANDOM = new QBRandom(null);

const RENDER_LEVEL = 0;
const RENDER_DEATH_SCREEN = 1;
const RENDER_LOADING_SCREEN = 2;

const camera = new Camera();
let gameState = RENDER_LOADING_SCREEN;
let controlledEntity = null;

let levelDataQueue = [];

let expectedLayers = null;
let loadLayers = null;
let busy = false;

let levelGraph = null;
let clientLevel = null;

worker.onmessage = evt => {
	switch (evt.data.type) {
		case "qb:expected_level_data": {
			expectedLayers = new Map(evt.data.layers);
			loadLayers = new Map();
			pumpLayerDataQueue();
			
			gameState = RENDER_LOADING_SCREEN;
			break;
		}
		case "qb:load_level_data_packet": {
			levelDataQueue.push(evt.data);
			if (expectedLayers) pumpLayerDataQueue();
			break;
		}
		case "qb:update_client": {
			lastTickMs = evt.data.time;
			if (clientLevel) clientLevel.loadEntities(evt.data.entityData);
			if (isControlling()) {
				updateCamera(controlledEntity);
			}
			break;
		}
		case "qb:update_controlled_entity": {
			controlledEntity = evt.data.id;
			logMessage(`Set controller to entity id ${controlledEntity}.`);
			break;
		}
		case "qb:player_dead": {
			controlledEntity = null;
			clientLevel = null;
			gameState = RENDER_DEATH_SCREEN;
			break;
		}
	}
};

worker.onerror = err => {
	logMessage(`Caught error from worker thread: ${err.message}`);
};

let inputFlags = 0;

let inputMode = "jump";
let mouseX = 0;
let mouseY = 0;
let tracked = null;

let lastFrameMs = new Date().getTime();
let lastTickMs = new Date().getTime();

let stopped = false;

function pumpLayerDataQueue(layer, chunk) {
	let p = 0;
	let MAX_ITERS = 100;
	while (levelDataQueue.length > 0 && p++ < 3) {
		let data = levelDataQueue.shift();
		if (!expectedLayers.has(data.layer)) continue;
		if (!loadLayers.has(data.layer)) {
			loadLayers.set(data.layer, new BiIntMap());
		}
		let map = loadLayers.get(data.layer);
		if (expectedLayers.get(data.layer).count === map.size) continue;
		map.set(data.x, data.y, new LevelChunk(data.x, data.y, QBTiles.AIR, data.tiles));
	}
	trySettingReady();
}

function trySettingReady() {
	for (const [id, data] of expectedLayers.entries()) {
		if (!loadLayers.has(id) || loadLayers.get(id).size < data.count) return false;
	}
	
	let loadLayersFinal = new Map();
	for (const [id, data] of expectedLayers.entries()) {
		let chunks = loadLayers.get(id);
		let motionScale = new Vec2(data.motionScale[0], data.motionScale[1]);
		let visualScale = data.visualScale;
		switch (data.type) {
			case "qb:layer": {
				loadLayersFinal.set(id, new LevelLayer(chunks, id, motionScale, visualScale));
				break;
			}
			case "qb:simulated_layer": {
				loadLayersFinal.set(id, new SimulatedLevelLayer(chunks, id, motionScale, visualScale));
				break;
			}
		}
	}
	clientLevel = new Level(loadLayersFinal);
	clientLevel.setCamera(camera);
	
	expectedLayers = null;
	loadLayers = null;
	
	gameState = RENDER_LEVEL;
	logMessage("Client is ready.")
	worker.postMessage({ type: "qb:client_ready" });
	return true;
}

function mainRender() {
	let curMs = Date.now();
	let dt = (curMs - lastTickMs) * TICK_DT;
	if (dt > 1) dt = 1;
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	ctx.save();
	
	if (gameState == RENDER_LEVEL && clientLevel) {
		ctx.save();
		ctx.scale(SCALE, -SCALE);
		ctx.translate(0, -15);

		ctx.save();
		clientLevel.render(ctx, dt, SNAP_SCALE);	
		ctx.restore();
		
		if (tracked) {
			ctx.strokeStyle = "#FFFF00";
			ctx.globalAlpha = 1;
			ctx.lineWidth = 0.125;
			
			ctx.save();
			let d = tracked.displacement(dt, SNAP_SCALE);
			let dmx = mouseX * 16 - 8;
			let dmy = mouseY * -15 + 8;
			
			camera.lerp(ctx, dt, SNAP_SCALE);
			ctx.translate(d.x, d.y);
			
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(dmx, dmy);
			
			ctx.stroke();
			
			ctx.restore();
		}
		
		ctx.save();
		ctx.translate(mouseX * 16, mouseY * -15 + 15);
		if (inputMode === "jump") {
			ctx.fillStyle = "#00FF00";
			ctx.globalAlpha = 0.2;
			ctx.beginPath();
			ctx.arc(0, 0, 1, 0, 2 * Math.PI);
			ctx.fill();
		}
		ctx.restore();
		
		ctx.restore();
		
		ctx.save();
		ctx.translate(canvas.width, 0);
		clientLevel.renderMinimap(ctx, dt, camera);
		ctx.restore();
	}
	
	let debugFillStyle = "black";
	let debugFont = "12px Times New Roman";
	
	if (gameState == RENDER_LEVEL && clientLevel && isControlling()) {
		let entity = clientLevel.getEntityById(controlledEntity);
		if (entity instanceof Creature) {
			ctx.font = "20px Times New Roman";
			ctx.textAlign = "left";
			ctx.fillText(`HP: ${entity.hp} / ${entity.maxHp}`, 0, 450);
		}
	}
	if (gameState == RENDER_DEATH_SCREEN) {
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		
		ctx.fillStyle = "crimson";
		ctx.font = "40px Times New Roman";
		ctx.textAlign = "center";
		ctx.fillText("YOU DIED", canvas.width / 2, 240);
		
		debugFillStyle = "white";
	} else if (gameState == RENDER_LOADING_SCREEN) {
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		
		ctx.fillStyle = "white";
		ctx.font = "40px Times New Roman";
		ctx.textAlign = "center";
		ctx.fillText("Loading...", canvas.width / 2, 240);
		
		debugFillStyle = "white";
	}
	
	ctx.fillStyle = debugFillStyle;
	ctx.globalAlpha = 1;
	ctx.font = debugFont;
	ctx.textAlign = "left";
	ctx.fillText(`FPS: ${Math.ceil(1000 / (curMs - lastFrameMs))}`, 0, 30);
	if (clientLevel && isControlling()) {
		let entity = clientLevel.getEntityById(controlledEntity);
		let x = entity.x.toFixed(3);
		let y = entity.y.toFixed(3);
		ctx.fillText(`Position: X=${x} Y=${y}`, 0, 60);
	}
	
	ctx.restore();
	
	lastFrameMs = curMs;
	if (!stopped) window.requestAnimationFrame(mainRender);
}

function updateKbInput() {
	worker.postMessage({
		type: "qb:kb_input_update",
		state: inputFlags >> 0
	});
}

function updateCamera(id) {
	if (!clientLevel) return;
	tracked = clientLevel.getEntityById(id);
	if (!tracked) return;
	camera.setState(tracked.pos, tracked.oldPos);
}

function isControlling() { return controlledEntity || controlledEntity == 0; }

document.onkeydown = evt => {
	if (evt.code === "KeyA") inputFlags |= 1; // Left
	if (evt.code === "KeyD") inputFlags |= 2; // Right
	if (evt.code === "KeyW") inputFlags |= 4; // Up
	if (evt.code === "KeyS") inputFlags |= 8; // Down
	updateKbInput();
};

document.onkeyup = evt => {
	if (evt.code === "KeyA") inputFlags &= ~1; // Left
	if (evt.code === "KeyD") inputFlags &= ~2; // Right
	if (evt.code === "KeyW") inputFlags &= ~4; // Up
	if (evt.code === "KeyS") inputFlags &= ~8; // Down
	updateKbInput();
};

document.oncontextmenu = evt => {
	inputFlags = 0;
	updateKbInput();
};

document.onmousedown = evt => {
	if (evt.target.id === "gameCanvas" && evt.detail > 1) evt.preventDefault();
};


canvas.onmousemove = evt => {
	mouseX = evt.offsetX / canvas.width;
	mouseY = evt.offsetY / canvas.height;
};

canvas.onclick = evt => {
	if (inputMode === "jump" && clientLevel && camera && tracked) {
		let ds = tracked.displacement(0);
		let inputVec = [camera.x - ds.x + mouseX * 16 - 8, camera.y - ds.y + mouseY * -15 + 8];
		worker.postMessage({
			type: "qb:jump_input",
			vec: inputVec
		});
	}
};

window.requestAnimationFrame(mainRender);