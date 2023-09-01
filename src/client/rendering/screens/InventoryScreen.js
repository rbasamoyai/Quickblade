import AbstractScreen from "./AbstractScreen.js";
import * as WidgetTextures from "./widgets/WidgetTextures.js";
import * as TextRenderer from "../TextRenderer.js";

const UP_ARROW = String.fromCharCode(2);
const DOWN_ARROW = String.fromCharCode(3);

export default class InventoryScreen extends AbstractScreen {
	
	#player;
	#currentKey;
	#keyTimer;
	#scrollUp = false;
	#scrollDown = false;
	#repeatScroll = false;
	#currentIndex = 0;
	#submenuOpen = false;
	#submenuIndex = 0;
	#itemMenuTimer = 0;
	#dropMenuOpen = 0;
	#dropAmount = 1;
	
	#prevTime;
	#baseIndex = 0;
	#messageCallback;
	
	constructor(player, messageCallback) {
		super();
		this.#player = player;
		this.#prevTime = this.timeElapsed();
		this.#messageCallback = messageCallback;
	}
	
	renderBg(ctx, dt) {
		let t = this.timeElapsed();
		let frameDelta = t - this.#prevTime;
		this.#prevTime = t;
		
		let flag = t >= 500;
		for (const widget of this.widgets) {
			widget.setActive(flag);
		}
		let height = Math.floor(Math.min(t / 500, 1) * 16);
		WidgetTextures.WINDOW.render(ctx, 0, 32, 14, height);
		
		if (!flag) return;
		let inventory = this.#player.inventory;
		
		if (this.#scrollUp !== this.#scrollDown) {
			let d = this.#scrollUp ? -1 : 1;
			let advTimeMs = this.#repeatScroll ? 250 : 750;
			this.#keyTimer += frameDelta;
			if (this.#keyTimer >= advTimeMs) {
				this.#repeatScroll = true;
				this.#keyTimer = 0;
				if (this.#dropMenuOpen && 0 <= this.#currentIndex && this.#currentIndex < inventory.length) {
					let slot = inventory[this.#currentIndex];
					let minCount = Math.min(slot[0].stacksTo, slot[1]);
					this.#dropAmount = clamp(this.#dropAmount + d, 1, minCount);
				} else if (!this.#submenuOpen) {
					this.#changeIndex(this.#currentIndex + d);
				}
			}
		} else {
			this.#keyTimer = 0;
		}
		
		WidgetTextures.TEXT.render(ctx, "Inventory", 56, 40, TextRenderer.CENTER_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
		
		ctx.save();
		ctx.translate(8, 48);
		let lim = Math.min(inventory.length, this.#baseIndex + 12);
		for (let i = this.#baseIndex; i < lim; ++i) {
			let slot = inventory[i];
			WidgetTextures.TEXT.render(ctx, slot[0].name, 8, 0, TextRenderer.LEFT_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
			if (slot[0].stacksTo > 1) {
				WidgetTextures.TEXT.render(ctx, `x${slot[1]}`, 96, 0, TextRenderer.RIGHT_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
			}
			ctx.translate(0, 8)
		}
		ctx.restore();
		
		if (inventory.length > 0) {
			WidgetTextures.TEXT.render(ctx, ">", 8, 48 + (this.#currentIndex - this.#baseIndex) * 8, TextRenderer.LEFT_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
		}
		if (this.#baseIndex > 0) {
			WidgetTextures.TEXT.render(ctx, UP_ARROW, 8, 40, TextRenderer.LEFT_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
		}
		if (inventory.length - this.#baseIndex > 12) {
			WidgetTextures.TEXT.render(ctx, DOWN_ARROW, 8, 144, TextRenderer.LEFT_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
		}
		if (this.#currentIndex < 0 || inventory.length <= this.#currentIndex) {
			this.#currentIndex = 0;
			this.#submenuIndex = 0;
			this.#submenuOpen = false;
			this.#dropAmount = 1;
			this.#dropMenuOpen = false;
		} else {
			let item = inventory[this.#currentIndex][0];
			ctx.save();
			ctx.translate(112, 40);

			ctx.save();
			item.renderSubmenu(ctx, dt, t / 33);
			ctx.restore();

			if (this.#submenuOpen) {
				let actions = item.getSubmenuActions(this.#player, inventory[this.#currentIndex][1], this, this.#messageCallback);
				WidgetTextures.WINDOW.render(ctx, -8, -8, 8, actions.length + 2);
				WidgetTextures.TEXT.render(ctx, ">", 0, 8 * this.#submenuIndex, TextRenderer.LEFT_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
				ctx.save();
				for (const action of actions) {
					WidgetTextures.TEXT.render(ctx, action.name, 8, 0, TextRenderer.LEFT_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
					ctx.translate(0, 8);
				}
				ctx.restore();

				if (this.#dropMenuOpen) {
					ctx.save();
					ctx.translate(56, 0);
					WidgetTextures.WINDOW.render(ctx, -8, -8, 11, 4);
					WidgetTextures.TEXT.render(ctx, "How much?", 0, 0, TextRenderer.LEFT_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
					let val = this.#dropAmount.toString();
					WidgetTextures.TEXT.render(ctx, "x", 72 - 8 * val.length, 8, TextRenderer.RIGHT_ALIGN, 1, WidgetTextures.ROMAN_YELLOW);
					WidgetTextures.TEXT.render(ctx, val, 72, 8, TextRenderer.RIGHT_ALIGN);
					ctx.restore();
				}
			}
			ctx.restore();
		}
	}
	
	onKeyboardInput(code, action) {
		if (code === "KeyF" && action === 1) {
			this.close();
		}

		let inventory = this.#player.inventory;
		let slot = 0 <= this.#currentIndex && this.#currentIndex < inventory.length ? inventory[this.#currentIndex] : null;
		let actions = slot ? slot[0].getSubmenuActions(this.#player, slot[1], this, this.#messageCallback) : [];
		
		if (code === "KeyW") {
			this.#scrollUp = action === 1;
			this.#keyTimer = 0;
			this.#repeatScroll = false;
			if (this.#scrollUp) {
				if (this.#dropMenuOpen && slot) {
					let minCount = Math.min(slot[0].stacksTo, slot[1]);
					this.#dropAmount = clamp(this.#dropAmount + 1, 1, minCount);
				} else if (this.#submenuOpen && slot) {
					this.#submenuIndex = clamp(this.#submenuIndex - 1, 0, actions.length - 1);
				} else {
					this.#changeIndex(this.#currentIndex - 1);
				}
			}
		}
		if (code === "KeyS") {
			this.#scrollDown = action === 1;
			this.#keyTimer = 0;
			this.#repeatScroll = false;
			if (this.#scrollDown) {
				if (this.#dropMenuOpen && slot) {
					let minCount = Math.min(slot[0].stacksTo, slot[1]);
					this.#dropAmount = clamp(this.#dropAmount - 1, 1, minCount);
				} else if (this.#submenuOpen && slot) {
					this.#submenuIndex = clamp(this.#submenuIndex + 1, 0, actions.length - 1);
				} else {
					this.#changeIndex(this.#currentIndex + 1);
				}
			}
		}
		if (this.#dropMenuOpen) {
			if (code === "KeyC" && action === 1) {
				this.#messageCallback({ type: "qb:drop_item", player: this.#player.id, slot: this.#currentIndex, count: this.#dropAmount });
				this.#dropAmount = 1;
				this.#dropMenuOpen = false;
			}
			if (code === "KeyV" && action === 1) {
				this.#dropAmount = 1;
				this.#dropMenuOpen = false;
			}
		} else if (this.#submenuOpen) {
			if (code === "KeyC" && action === 1) {
				if (0 <= this.#submenuIndex && this.#submenuIndex < actions.length) {
					actions[this.#submenuIndex].run();
				}
			}
			if (code === "KeyV" && action === 1) {
				this.#submenuIndex = 0;
				this.#submenuOpen = false;
				this.#dropAmount = 1;
				this.#dropMenuOpen = false;
			}
		} else if (code === "KeyC" && action === 1) {
			this.#submenuOpen = true;
		}
	}
	
	pausesLevel(level) { return true; }
	
	#changeIndex(v) {
		this.#currentIndex = clamp(v, 0, this.#player.inventory.length - 1);
		let diff = this.#currentIndex - this.#baseIndex;
		if (diff > 11) {
			this.#baseIndex += diff - 11;
		} else if (diff < 0) {
			this.#baseIndex += diff;
		}
	}

	openDropMenu() {
		this.#dropMenuOpen = true;
	}
	
}

function clamp(a, min, max) {
	if (a < min) return min;
	return a > max ? max : a;
}