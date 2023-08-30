import { Item, ItemProperties } from "../items/Item.js";

const ITEMS_KEY = new Map();
const ITEMS_BY_ID = [];

function register(id, provider, properties) {
	let item = new provider(properties);
	ITEMS_KEY.set(id, item);
	ITEMS_BY_ID.push(item);
	return item;
}

export function getFromIdKey(id) {
	return ITEMS_KEY.has(id) ? ITEMS_KEY.get(id) : null;
}

export function getFromIdNum(id) {
	return 0 <= id && id < ITEMS_BY_ID.length ? ITEMS_BY_ID[id] : null;
}

export function getIdKey(item) {
	for (const [key, value] of ITEMS_KEY.entries()) {
		if (value === item) return key;
	}
	return null;
}

export function getIdNum(item) {
	return ITEMS_BY_ID.indexOf(item);
}

export const GOLD = register("qb:gold", Item, new ItemProperties("item/gold", "Gold").stacksTo(9999).maxStacks(1).frameCount(12).frameSpeed(3.75));