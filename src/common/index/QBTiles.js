import { Tile, TileProperties } from "../level/tiles/Tile.js";

const tiles = new Map();

function register(id, provider, properties) {
	let tile = new provider(properties, id);
	tiles.set(id, tile);
	return tile;
}

export function getFromId(id) {
	return tiles.get(id);
}

export const AIR = register("qb:air", Tile, new TileProperties("block/missing").canCollide(false).noRender());
export const BLOCK = register("qb:block", Tile, new TileProperties("block/block"));
export const BACKGROUND = register("qb:background", Tile, new TileProperties("block/background").canCollide(false));
