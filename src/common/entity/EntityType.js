export default class EntityType {

	#provider;
	properties;
	#id;

	constructor(provider, id, properties) {
		this.properties = properties;
		this.#provider = provider;
		this.#id = id;
	}
	
	create(x, y, level, layer, id) {
		return new this.#provider(x, y, level, layer, id, this);
	}
	
	get id() { return this.#id; }
	
	is(entity) { return this == entity.type; }

}