import { ImageResource } from "../../resource_management/ResourceLoading.js";
import PlayerTextures from "./PlayerTextures.js";

function make(a, f) {
	f(a);
	return a;
}

export const PLAYER_BODY = make([], (a) => {
	for (let i = 0; i < 4; ++i) {
		a.push(new PlayerTextures(i));
	}
});

export const PLAYER_EYES = make([], (a) => {
	for (let i = 0; i < 5; ++i) {
		a.push(new ImageResource("entities/player_eyes_" + i));
	}
})

export const TUNIC = new ImageResource("entities/tunic");
export const SANDALS = new ImageResource("entities/sandals");