import logMessage from "../Logging.js";

class ResourceLinked {
	
	#resourceId;
	resourceReady = false;
	
	constructor(resourceId) {
		this.#resourceId = resourceId;
	}
	
	get resourceId() { return this.#resourceId; }
	
}

export class ImageResource extends ResourceLinked {
	
	#imageResource;
	
	constructor(resourceId) {
		super(resourceId);
		
		if (isWebWorker()) {
			this.#imageResource = null;
		} else {
			this.#imageResource = new Image();
			this.#imageResource.onload = () => {
				this.resourceReady = true;
				logMessage(`Loaded asset ${this.resourceId}`);
			};
			this.#imageResource.src = "resources/" + this.resourceId + ".png";
		}
	}
	
	get imageResource() { return this.#imageResource; }
		
}

function isWebWorker() {
	return typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
}