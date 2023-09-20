export default class ControlOptions {

    moveLeft;
    moveRight;
    moveUp;
    moveDown;
    interactSelect;
    jumpModeBack;
    inventory;
    cyclePreviousWeapon;
    cycleNextWeapon;

    constructor(moveLeft, moveRight, moveUp, moveDown, interactSelect, jumpModeBack, inventory, cyclePreviousWeapon, cycleNextWeapon) {
        this.moveLeft = moveLeft;
        this.moveRight = moveRight;
        this.moveUp = moveUp;
        this.moveDown = moveDown;
        this.interactSelect = interactSelect;
        this.jumpModeBack = jumpModeBack;
        this.inventory = inventory;
        this.cyclePreviousWeapon = cyclePreviousWeapon;
        this.cycleNextWeapon = cycleNextWeapon;
    }

    loadSettings(obj) {
        
    }

}