import { Player } from "./Player";
import { Game } from "./scenes/Game";

export class KeyboardController {
    private keyW: Phaser.Input.Keyboard.Key;
    private keyA: Phaser.Input.Keyboard.Key;
    private keyS: Phaser.Input.Keyboard.Key;
    private keyD: Phaser.Input.Keyboard.Key;

    constructor(private scene: Game) {
        // KEYS
        this.keyW = this.scene.input.keyboard!.addKey("W");
        this.keyA = this.scene.input.keyboard!.addKey("A");
        this.keyS = this.scene.input.keyboard!.addKey("S");
        this.keyD = this.scene.input.keyboard!.addKey("D");
    }

    updateKeyboardMovement(player: Player) {
        if (this.scene.disableKeyboard) return;

        player.setVelocity(0);
        let directionX = 0;
        let directionY = 0;

        // Y-Richtung prüfen
        if (this.keyW?.isDown) {
            directionY = -1;
            player.currentDirectionY = directionY;
            if (!this.keyA?.isDown && !this.keyD?.isDown) {
                player.currentDirectionX = 0;
            }
        } else if (this.keyS?.isDown) {
            directionY = 1;
            player.currentDirectionY = directionY;
            if (!this.keyA?.isDown && !this.keyD?.isDown) {
                player.currentDirectionX = 0;
            }
        }

        // X-Richtung prüfen
        if (this.keyA?.isDown) {
            directionX = -1;
            player.currentDirectionX = directionX;
            if (!this.keyW?.isDown && !this.keyS?.isDown) {
                player.currentDirectionY = 0;
            }
        } else if (this.keyD?.isDown) {
            directionX = 1;
            player.currentDirectionX = directionX;
            if (!this.keyW?.isDown && !this.keyS?.isDown) {
                player.currentDirectionY = 0;
            }
        }

        player.move(directionX, directionY);
    }
}
