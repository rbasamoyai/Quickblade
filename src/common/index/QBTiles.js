import { Tile, TileProperties } from "../level/tiles/Tile.js";

const tilesKey = new Map();
const tilesNumeric = [];

function register(id, provider, properties) {
	let tile = new provider(properties);
	tilesKey.set(id, tile);
	tilesNumeric.push(tile);
	return tile;
}

export function getFromIdKey(id) {
	return tilesKey.has(id) ? tilesKey.get(id) : AIR;
}

export function getFromIdNum(id) {
	return 0 <= id && id < tilesNumeric.length ? tilesNumeric[id] : AIR;
}

export function getIdKey(tile) {
	for (const entry of tilesKey.entries()) {
		if (entry.value === tile) return entry.key;
	}
	return null;
}

export function getIdNum(tile) {
	return tilesNumeric.indexOf(tile);
}

export const AIR = register("qb:air", Tile, new TileProperties("block/missing").canCollide(false).noRender().replaceable());

export const BACK_WALL = register("qb:back_wall", Tile, new TileProperties("block/back_wall").replaceable().canCollide(true));

export const BACK_WALL_1 = register("qb:back_wall", Tile, new TileProperties("block/back_wall_1").replaceable().canCollide(true));
export const BACK_WALL_2 = register("qb:back_wall", Tile, new TileProperties("block/back_wall_2").replaceable().canCollide(true));
//export const BACK_WALL_3 = register("qb:back_wall", Tile, new TileProperties("block/back_wall").replaceable().canCollide(true));

export const BLOCK = register("qb:block", Tile, new TileProperties("block/block").canCollide(true));
export const BACKGROUND = register("qb:background", Tile, new TileProperties("block/background").canCollide(false));

export const GEN_BACKGROUND = register("qb:gen_background", Tile, new TileProperties("block/gen_background").canCollide(false).replaceable());
export const GEN_ROCK = register("qb:gen_rock", Tile, new TileProperties("block/gen_rock").canCollide(true).replaceable());
export const GEN_ROOM = register("qb:gen_room", Tile, new TileProperties("block/gen_room").canCollide(true).replaceable());
