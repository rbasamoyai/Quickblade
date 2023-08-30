import EntityType from "../entity/EntityType.js";
import { EntityProperties } from "../entity/Entity.js";
import { CreatureProperties } from "../entity/Creature.js";
import { Player } from "../entity/Player.js";
import { Monster } from "../entity/Monster.js";
import ItemEntity from "../entity/ItemEntity.js";

const types = new Map();

function register(id, provider, properties) {
	let type = new EntityType(provider, id, properties);
	types.set(id, type);
	return type;
}

export function getFromId(id) {
	return types.get(id);
}

export const PLAYER = register("qb:player", Player, new CreatureProperties().maxHpCount(20).dimensions(0.8, 1.4));
export const IMP = register("qb:imp", Monster, new CreatureProperties().maxHpCount(10).dimensions(1, 2));
export const ITEM = register("qb:item", ItemEntity, new EntityProperties().dimensions(0.5, 0.5));
