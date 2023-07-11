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

import { Level } from "../common/level/Level.js";
import { LevelChunk } from "../common/level/LevelChunk.js";
import Camera from "./Camera.js";
import QBRandom from "../common/QBRandom.js";
import { Creature } from "../common/entity/Creature.js";
import { LevelGenerator } from "../common/level/generation/LevelGeneration.js";

import * as QBEntities from "../common/index/QBEntities.js";
import * as QBTiles from "../common/index/QBTiles.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothEnabled = false;

const worker = new Worker("./src/server/QuickbladeServer.js", { type: "module" });

const RANDOM = new QBRandom(null);

const RENDER_LEVEL = 0;
const RENDER_DEATH_SCREEN = 1;
const RENDER_LOADING_SCREEN = 2;

const camera = new Camera();
let gameState = RENDER_LOADING_SCREEN;
let controlledEntity = null;

let expectedChunkCount = -1;
let loadChunks = [];
let clientLevel = null;

worker.onmessage = evt => {
	switch (evt.data.type) {
		case "qb:expected_chunk_count": {
			expectedChunkCount = evt.data.count;
			gameState = RENDER_LOADING_SCREEN;
			console.log(`Loading ${expectedChunkCount} chunks...`)
			break;
		}
		case "qb:load_chunk": {
			loadChunks.push(new LevelChunk(evt.data.x, evt.data.y, QBTiles.AIR, evt.data.tiles));
			if (expectedChunkCount === loadChunks.length) {
				clientLevel = new Level(loadChunks);
				clientLevel.setCamera(camera);
				expectedChunkCount = -1;
				loadChunks = [];
				gameState = RENDER_LEVEL;
				console.log("Client is ready.")
				worker.postMessage({ type: "qb:client_ready" });
			}
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
			console.log(`Set controller to entity id ${controlledEntity}.`);
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
	console.log(`Caught error from worker thread: ${err.message}`);
};

let inputFlags = 0;

let inputMode = "jump";
let mouseX = 0;
let mouseY = 0;
let tracked = null;

let lastFrameMs = new Date().getTime();
let lastTickMs = new Date().getTime();

let stopped = false;

function mainRender() {
	let curMs = Date.now();
	let dt = (curMs - lastTickMs) * TICK_DT;
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	ctx.save();
	
	if (gameState == RENDER_LEVEL && clientLevel) {
		ctx.save();
		ctx.scale(SCALE, -SCALE);
		ctx.translate(0, -15);

		ctx.save();
		clientLevel.render(ctx, dt);	
		ctx.restore();
		
		if (tracked) {
			ctx.strokeStyle = "#FFFF00";
			ctx.globalAlpha = 1;
			ctx.lineWidth = 0.125;
			
			ctx.save();
			let ds = tracked.displacement(dt);
			let dm = [mouseX * 16 - 8, mouseY * -15 + 8];
			
			camera.lerp(ctx, dt);
			ctx.translate(ds[0], ds[1]);
			
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(dm[0], dm[1]);
			
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
		clientLevel.renderMinimap(ctx, dt);
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
	camera.setState([tracked.x, tracked.y], [tracked.ox, tracked.oy]);
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
		let inputVec = [camera.x - ds[0] + mouseX * 16 - 8, camera.y - ds[1] + mouseY * -15 + 8];
		worker.postMessage({
			type: "qb:jump_input",
			vec: inputVec
		});
	}
};

window.requestAnimationFrame(mainRender);