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
const UPSCALE = 3;
const WORLD_SCREEN_SCALE = 16;
const SNAP_SCALE = 16;
const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT = 224;
let RENDER_DEBUG_INFO = false;
let CONTROLLER = -1;

import Level from "../common/level/Level.js";
import { LevelChunk } from "../common/level/LevelChunk.js";
import LevelLayer from "../common/level/LevelLayer.js";
import SimulatedLevelLayer from "../common/level/SimulatedLevelLayer.js";

import * as TextRenderer from "./rendering/TextRenderer.js";
import Camera from "./rendering/Camera.js";
import QBRandom from "../common/QBRandom.js";
import { Creature } from "../common/entity/Creature.js";
import { Player } from "../common/entity/Player.js";

import * as QBEntities from "../common/index/QBEntities.js";
import * as QBTiles from "../common/index/QBTiles.js";
import * as QBItems from "../common/index/QBItems.js";

import "../common/entity/textures/EntityTextures.js";
import * as WidgetTextures from "./rendering/screens/widgets/WidgetTextures.js";

import logMessage from "../common/Logging.js";
import BiIntMap from "../common/BiIntMap.js";
import Vec2 from "../common/Vec2.js";

import TitleScreen from "./rendering/screens/TitleScreen.js";
import CreditsScreen from "./rendering/screens/CreditsScreen.js";
import PlayerAppearanceScreen from "./rendering/screens/PlayerAppearanceScreen.js";
import LoadingScreen from "./rendering/screens/LoadingScreen.js";
import DeathScreen from "./rendering/screens/DeathScreen.js";
import InventoryScreen from "./rendering/screens/InventoryScreen.js";

import PlayerAppearance from "../common/entity/PlayerAppearance.js";

import ControlMapping from "./input/ControlMapping.js";
import ControlOptions from "./input/ControlOptions.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothEnabled = false;

//import LevelGenerator from "../common/level/generation/LevelGenerator.js";

const worker = new Worker("./src/server/QuickbladeServer.js", { type: "module" });

const RANDOM = new QBRandom(null);

const RENDER_LEVEL = 0;
const RENDER_ONLY_SCREEN = 1;

const camera = new Camera();
let controlledEntity = null;

let levelDataQueue = [];

let expectedLayers = null;
let loadLayers = null;
let busy = false;

let renderLevel = false;
let clientLevel = null;
let currentScreen = null;

const NOTIFICATION_CANVAS = new OffscreenCanvas(176, 8);
let notificationQueue = [];
let notifTimer = -1;

worker.onmessage = evt => {
	switch (evt.data.type) {
		case "qb:expected_level_data": {
			expectedLayers = new Map(evt.data.layers);
			loadLayers = new Map();
			pumpLayerDataQueue();
			
			renderLevel = false;
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
			setScreen(new DeathScreen());
			break;
		}
		case "qb:notification": {
			if (controlledEntity !== evt.data.id) break;
			notificationQueue.push(evt.data.text);
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

let appearance = null;

setScreen(new TitleScreen((v, screen) => {
	switch (v) {
		case 0: {
			return new PlayerAppearanceScreen(p => {
				appearance = p;
				requestNewLevel(1);
			});
		}
		case 1: {
			// Settings
			break;
		}
		case 2: {
			return new CreditsScreen(screen, setScreen);
		}
	}
	return null;
}, setScreen));

function requestNewLevel(seed) {
	clientLevel = null;
	setScreen(new LoadingScreen());
	worker.postMessage({ type: "qb:generate_new_level", seed: seed });
}

function setScreen(screen) {
	currentScreen = screen;
	worker.postMessage({ type: "qb:pause", pause: screen && screen.pausesLevel(clientLevel) })
}

function pumpLayerDataQueue(layer, chunk) {
	let p = 0;
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
	
	renderLevel = true;
	logMessage("Client is ready.")
	
	if (!appearance) appearance = PlayerAppearance.random();
	worker.postMessage({ type: "qb:client_ready", appearance: appearance });
	appearance = null;
	setScreen(null);
	return true;
}

function mainRender() {
	updateController();
	
	let curMs = Date.now();
	let dt = (curMs - lastTickMs) * TICK_DT;
	if (dt > 1) dt = 1;
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	if (currentScreen?.isClosed()) {
		setScreen(null);
	}
	
	ctx.save();
	ctx.scale(UPSCALE, UPSCALE);
	
	if (renderLevel && clientLevel) {
		ctx.save();
		ctx.scale(WORLD_SCREEN_SCALE, -WORLD_SCREEN_SCALE);
		ctx.translate(0, -15);

		ctx.save();
		clientLevel.render(ctx, dt, SNAP_SCALE);	
		ctx.restore();
		
		if (tracked && inputMode === "jump" && !currentScreen) {
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
			
			ctx.save();
			ctx.translate(mouseX * 16, mouseY * -15 + 15);
			ctx.fillStyle = "#00FF00";
			ctx.globalAlpha = 0.2;
			ctx.beginPath();
			ctx.arc(0, 0, 1, 0, 2 * Math.PI);
			ctx.fill();
			ctx.restore();
		}
		
		ctx.restore();
		
		ctx.save();
		ctx.translate(SCREEN_WIDTH, 0);
		clientLevel.renderMinimap(ctx, dt, camera);
		ctx.restore();
	}
	
	if (currentScreen) {
		ctx.save();
		currentScreen.render(ctx, dt);
		ctx.restore();
	} else if (renderLevel && clientLevel && isControlling()) {
		let entity = clientLevel.getEntityById(controlledEntity);
		if (entity instanceof Creature) {
			WidgetTextures.TEXT.render(ctx, `HP:${entity.hp}/${entity.maxHp}`, 0, 0);
		}
	}
	
	if (!currentScreen && notificationQueue.length > 0) {
		let notif = notificationQueue[0];
		let extraText = Math.max(notif.length - 22, 0);
		let textScrollTime = extraText * 250;
		
		let bufctx = NOTIFICATION_CANVAS.getContext("2d");
		bufctx.clearRect(0, 0, NOTIFICATION_CANVAS.width, NOTIFICATION_CANVAS.height);
		
		notifTimer += curMs - lastFrameMs;
		if (notifTimer > 3500 + textScrollTime) {
			notifTimer = 0;
			notificationQueue.shift();
		} else if (notifTimer <= 3000 + textScrollTime) {
			WidgetTextures.WINDOW.render(ctx, 32, 184, 24, 3);
			bufctx.save();
			if (extraText > 0) {
				let prog = clamp((notifTimer - 1500) / textScrollTime, 0, 1);
				let scroll = Math.floor(-8 * extraText * prog);
				bufctx.translate(scroll, 0);
			}
			WidgetTextures.TEXT.render(bufctx, notif, 0, 0, TextRenderer.LEFT_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
			bufctx.restore();
		}
		
		ctx.save();
		ctx.globalCompositeOperation = "source-over";
		ctx.drawImage(NOTIFICATION_CANVAS, 40, 192);
		ctx.restore();
	}
	
	if (RENDER_DEBUG_INFO) {
		WidgetTextures.TEXT.render(ctx, `FPS:${Math.ceil(1000 / (curMs - lastFrameMs))}`, 0, 208);
		if (clientLevel && isControlling()) {
			let entity = clientLevel.getEntityById(controlledEntity);
			let x = entity.x.toFixed(3);
			let y = entity.y.toFixed(3);
			WidgetTextures.TEXT.render(ctx, `Pos:(${x},${y})`, 0, 216);
		}
	}
	ctx.restore();
	
	lastFrameMs = curMs;
	if (!stopped) window.requestAnimationFrame(mainRender);
}

function clamp(a, min, max) {
	if (a < min) return min;
	return a > max ? max : a;
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

//////// Mouse and keyboard input ////////

// TODO: load cookies
let KEY_CONTROLS = new ControlOptions(
	new ControlMapping("KeyA"), // Move Left
	new ControlMapping("KeyD"), // Move Right
	new ControlMapping("KeyW"), // Move Up
	new ControlMapping("KeyS"), // Move Down
	new ControlMapping("KeyC"), // Interact/Select
	new ControlMapping("KeyV"), // Jump Mode/Back
	new ControlMapping("KeyF") // Inventory
);

let PRESSED_KEYS = {};

document.onkeydown = evt => {
	if (PRESSED_KEYS[evt.code]) return;
	PRESSED_KEYS[evt.code] = true;
	
	if (currentScreen) {
		currentScreen.onKeyboardInput(evt.code, 1, KEY_CONTROLS);
	} else if (!isUsingGamepad()) {
		if (evt.code === KEY_CONTROLS.moveLeft.currentKey) inputFlags |= 1;
		if (evt.code === KEY_CONTROLS.moveRight.currentKey) inputFlags |= 2;
		if (evt.code === KEY_CONTROLS.moveUp.currentKey) inputFlags |= 4;
		if (evt.code === KEY_CONTROLS.moveDown.currentKey) inputFlags |= 8;
		if (evt.code === KEY_CONTROLS.interactSelect.currentKey) inputFlags |= 16;
		updateKbInput();
	}
	
	if (evt.code === KEY_CONTROLS.inventory.currentKey && clientLevel && tracked instanceof Player && !currentScreen) {
		inputFlags = 0;
		updateKbInput();
		setScreen(new InventoryScreen(tracked, msg => worker.postMessage(msg)));
	}
};

document.onkeyup = evt => {
	if (!PRESSED_KEYS[evt.code]) return;
	delete PRESSED_KEYS[evt.code];
	
	if (currentScreen) {
		currentScreen.onKeyboardInput(evt.code, 0, KEY_CONTROLS);
	} else if (!isUsingGamepad()) {
		if (evt.code === KEY_CONTROLS.moveLeft.currentKey) inputFlags &= ~1;
		if (evt.code === KEY_CONTROLS.moveRight.currentKey) inputFlags &= ~2;
		if (evt.code === KEY_CONTROLS.moveUp.currentKey) inputFlags &= ~4;
		if (evt.code === KEY_CONTROLS.moveDown.currentKey) inputFlags &= ~8;
		if (evt.code === KEY_CONTROLS.interactSelect.currentKey) inputFlags &= ~16;
		updateKbInput();
	}
};

document.oncontextmenu = evt => {
	inputFlags = 0;
	updateKbInput();
};

document.onmousedown = evt => {
	if (evt.target.id === "gameCanvas" && evt.detail > 1) evt.preventDefault();
};


canvas.onmousemove = evt => {
	let ox = mouseX;
	let oy = mouseY;
	mouseX = evt.offsetX / canvas.width;
	mouseY = evt.offsetY / canvas.height;
	currentScreen?.onMouseMove(mouseX * SCREEN_WIDTH, mouseY * SCREEN_HEIGHT, ox * SCREEN_WIDTH, oy * SCREEN_HEIGHT);
};

canvas.oncontextmenu = evt => {
	return false;
};

canvas.onclick = evt => {
	if (currentScreen) {
		currentScreen.onMouseClick(mouseX, mouseY);
	} else if (inputMode === "jump" && clientLevel && camera && tracked && !isUsingGamepad()) {
		let ds = tracked.displacement(0);
		let inputVec = [camera.x - ds.x + mouseX * 16 - 8, camera.y - ds.y + mouseY * -15 + 8];
		worker.postMessage({
			type: "qb:jump_input",
			vec: inputVec
		});
	}
};

//////// Controller support ////////

// TODO: load button from cookies
let GAMEPAD_CONTROLS = new ControlOptions(
	new ControlMapping(14), // Move Left
	new ControlMapping(15), // Move Right
	new ControlMapping(12), // Move Up
	new ControlMapping(13), // Move Down
	new ControlMapping(0), // Interact/Select
	new ControlMapping(1), // Jump Mode/Back
	new ControlMapping(2), // Inventory
	new ControlMapping(4), // Quick Swap Previous Weapon
	new ControlMapping(5), // Quick Swap Next Weapon
);

let PREVIOUS_GAMEPAD_INPUTS = [];

window.addEventListener("gamepadconnected", evt => {
	if (isUsingGamepad()) return;
	CONTROLLER = evt.gamepad.index;
	PREVIOUS_GAMEPAD_INPUTS = [];
	PRESSED_KEYS = {};
	logMessage(`Connected gamepad with index ${evt.gamepad.index}: ${evt.gamepad.id}`);

	if (currentScreen) {
		let sz = evt.gamepad.buttons.length;
		for (let i = 0; i < sz; ++i) {
			currentScreen.onKeyboardInput(i, 0, GAMEPAD_CONTROLS);
		}
	}
	inputFlags = 0;
	updateKbInput();
});

window.addEventListener("gamepaddisconnected", evt => {
	if (!isUsingGamepad()) return;
	CONTROLLER = -1;
	PREVIOUS_GAMEPAD_INPUTS = [];
	PRESSED_KEYS = {};
	logMessage(`Disconnected gamepad with index ${evt.gamepad.index}: ${evt.gamepad.id}`);

	if (currentScreen) {
		let sz = evt.gamepad.buttons.length;
		for (let i = 0; i < sz; ++i) {
			currentScreen.onKeyboardInput(i, 0, GAMEPAD_CONTROLS);
		}
	}
	inputFlags = 0;
	updateKbInput();
});

function updateController() {
	let gamepad = getGamepad();
	if (!gamepad || !gamepad.connected) return;

	for (const [index, button] of gamepad.buttons.entries()) {
		if (index >= PREVIOUS_GAMEPAD_INPUTS.length) PREVIOUS_GAMEPAD_INPUTS.push(button.pressed);
		if (PREVIOUS_GAMEPAD_INPUTS[index] === button.pressed) continue;
		PREVIOUS_GAMEPAD_INPUTS[index] = button.pressed;
		
		currentScreen?.onKeyboardInput(index, button.pressed ? 1 : 0, GAMEPAD_CONTROLS);

		if (index === GAMEPAD_CONTROLS.inventory.currentKey && button.pressed && clientLevel && tracked instanceof Player && !currentScreen) {
			inputFlags = 0;
			updateKbInput();
			setScreen(new InventoryScreen(tracked, msg => worker.postMessage(msg)));
		}
	}
	
	if (!currentScreen) {
		let newFlags = 0;
		if (getButton(gamepad, GAMEPAD_CONTROLS.moveLeft.currentKey)?.pressed) newFlags |= 1;
		if (getButton(gamepad, GAMEPAD_CONTROLS.moveRight.currentKey)?.pressed) newFlags |= 2;
		if (getButton(gamepad, GAMEPAD_CONTROLS.moveUp.currentKey)?.pressed) newFlags |= 4;
		if (getButton(gamepad, GAMEPAD_CONTROLS.moveDown.currentKey)?.pressed) newFlags |= 8;
		if (getButton(gamepad, GAMEPAD_CONTROLS.interactSelect.currentKey)?.pressed) newFlags |= 16;
		if (inputFlags !== newFlags) {
			inputFlags = newFlags;
			updateKbInput();
		}
	}
}

function isUsingGamepad() {
	return 0 <= CONTROLLER && CONTROLLER < window.navigator.getGamepads().length;
}

function getGamepad() {
	return isUsingGamepad() ? window.navigator.getGamepads()[CONTROLLER] : null;
}

function getButton(gamepad, i) {
	return Number.isInteger(i) && 0 <= i && i < gamepad.buttons.length ? gamepad.buttons[i] : null;
}

window.requestAnimationFrame(mainRender);