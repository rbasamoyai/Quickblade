import { ImageResource } from "../../resource_management/ResourceLoading.js";

export default class PlayerTextures {
	
	#underBody;
	#arms;
	#head;
	
	constructor(type) {
		this.#underBody = new ImageResource("entities/player_under_body_" + type);
		this.#arms = new ImageResource("entities/player_arms_" + type);
		this.#head = new ImageResource("entities/player_head_" + type);
	}
	
	get underBody() { return this.#underBody; }
	get arms() { return this.#arms; }
	get head() { return this.#head; }
	
	isReady() { return this.underBody.resourceReady && this.arms.resourceReady && this.head.resourceReady; }
	
}