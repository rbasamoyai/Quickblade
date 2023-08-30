import { ImageResource } from "../../../../common/resource_management/ResourceLoading.js";
import BoxRenderer from "../../BoxRenderer.js";
import Widget from "./Widget.js";

export const BACKGROUND = new ImageResource("ui/background");
export const FRAME = new ImageResource("ui/frame");

export const SELECTOR_LEFT = new ImageResource("ui/selector_left");
export const SELECTOR_LEFT_HOVERED = new ImageResource("ui/selector_left_hovered");
export const SELECTOR_RIGHT = new ImageResource("ui/selector_right");
export const SELECTOR_RIGHT_HOVERED = new ImageResource("ui/selector_right_hovered");

export const WINDOW = new BoxRenderer("ui/window");
export const BUTTON = new BoxRenderer("ui/button");
export const BUTTON_HOVERED = new BoxRenderer("ui/button_hovered");

export function daggerButton(screen, left, x, y, callback) {
	return new Widget(screen, x, y, 16, 8, callback, left ? SELECTOR_LEFT : SELECTOR_RIGHT, left ? SELECTOR_LEFT_HOVERED : SELECTOR_RIGHT_HOVERED);
}