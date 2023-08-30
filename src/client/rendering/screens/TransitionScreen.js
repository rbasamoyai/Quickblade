import AbstractScreen from "./AbstractScreen.js";

export default class TransitionScreen extends AbstractScreen {

	#beforeScreen;
	#afterScreen;
	#screenChange;
	#time;
	#halfTime;
	#fadeColor;
	
	constructor(textRenderer, beforeScreen, afterScreen, screenChange, time, fadeColor = "black") {
		super(textRenderer);
		this.#beforeScreen = beforeScreen;
		this.#afterScreen = afterScreen;
		this.#screenChange = screenChange;
		this.#time = time;
		this.#halfTime = this.#time / 2;
		this.#fadeColor = fadeColor;
	}
	
	render(canvas, ctx, dt) {
		let time = this.timeElapsed();
		if (time < this.#halfTime) {
			this.#beforeScreen?.render(canvas, ctx, dt);
			ctx.fillStyle = this.#fadeColor;
			ctx.globalAlpha = clamp(time / this.#halfTime, 0, 1);
			ctx.fillRect(0, 0, 256, 224);
			this.#afterScreen?.reset();
		} else if (time < this.#time) {
			this.#afterScreen?.render(canvas, ctx, dt);
			ctx.fillStyle = this.#fadeColor;
			ctx.globalAlpha = clamp(1 - (time - this.#halfTime) / this.#halfTime, 0, 1);
			ctx.fillRect(0, 0, 256, 224);
			this.#beforeScreen?.reset();
		} else {
			this.#afterScreen?.render(canvas, ctx, dt);
			this.#screenChange(this.#afterScreen);
		}
	}

}

function clamp(a, min, max) {
	if (a < min) return min;
	return a > max ? max : a;
}