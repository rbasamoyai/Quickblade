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
	for (const [key, value] of tilesKey.entries()) {
		if (value === tile) return key;
	}
	return null;
}

export function getIdNum(tile) {
	return tilesNumeric.indexOf(tile);
}

function noTexture() {
	return new TileProperties("block/missing");
}

export const AIR = register("qb:air", Tile, noTexture().canCollide(false).noRender().replaceable());

export const ROCK_1 = register("qb:rock_1", Tile, new TileProperties("block/rock_1").canCollide(true));
export const ROCK_2 = register("qb:rock_2", Tile, new TileProperties("block/rock_2").canCollide(true));
export const ROCK_3 = register("qb:rock_3", Tile, new TileProperties("block/rock_3").canCollide(true));
export const ROCK_BACKGROUND_1 = register("qb:rock_background_1", Tile, new TileProperties("block/rock_background_1").canCollide(false));
export const ROCK_BACKGROUND_2 = register("qb:rock_background_2", Tile, new TileProperties("block/rock_background_2").canCollide(false));
export const ROCK_FLOOR = register("qb:rock_floor", Tile, new TileProperties("block/rock_floor").canCollide(true));

export const ROOM_FLOOR = register("qb:room_floor", Tile, new TileProperties("block/room_floor").canCollide(true));
export const ROOM_WALL_1 = register("qb:room_wall_1", Tile, new TileProperties("block/room_wall_1").canCollide(true));
export const ROOM_BACKGROUND_1 = register("qb:room_background_1", Tile, new TileProperties("block/room_background_1").canCollide(false));
export const ROOM_COLLAPSED_WALL_1 = register("qb:room_collapsed_wall_1", Tile, new TileProperties("block/room_collapsed_wall_1").canCollide(false));
export const ROOM_COLLAPSED_WALL_2 = register("qb:room_collapsed_wall_2", Tile, new TileProperties("block/room_collapsed_wall_2").canCollide(false));

export const BACKGROUND_0 = register("qb:background_0", Tile, new TileProperties("block/background_0"));
export const BACKGROUND_1 = register("qb:background_1", Tile, new TileProperties("block/background_1"));
export const BACKGROUND_2 = register("qb:background_2", Tile, new TileProperties("block/background_2"));
export const BACKGROUND_3 = register("qb:background_3", Tile, new TileProperties("block/background_3"));
export const BACKGROUND_4 = register("qb:background_4", Tile, new TileProperties("block/background_4"));
export const BACKGROUND_5 = register("qb:background_5", Tile, new TileProperties("block/background_5"));
export const BACKGROUND_6 = register("qb:background_6", Tile, new TileProperties("block/background_6"));
export const BACKGROUND_7 = register("qb:background_7", Tile, new TileProperties("block/background_7"));
export const BACKGROUND_8 = register("qb:background_8", Tile, new TileProperties("block/background_8"));
export const BACKGROUND_9 = register("qb:background_9", Tile, new TileProperties("block/background_9"));

export const GEN_ROCK = register("qb:gen_rock", Tile, noTexture().canCollide(true).replaceable());
export const GEN_ROCK_BACKGROUND = register("qb:gen_rock_background", Tile, noTexture().canCollide(false).replaceable());
export const GEN_ROOM = register("qb:gen_room", Tile, noTexture().canCollide(true).replaceable());
export const GEN_ROOM_BACKGROUND = register("qb:gen_room_background", Tile, noTexture().canCollide(false).replaceable());
export const GEN_ROOM_ROCK_BACKGROUND = register("qb:gen_room_background", Tile, noTexture().canCollide(false).replaceable());
export const GEN_COLLAPSED_ROOM_WALL = register("qb:gen_collapsed_room_wall", Tile, noTexture().canCollide(false).replaceable());
