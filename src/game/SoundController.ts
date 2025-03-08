import { Scene } from "phaser";
import { EventBus } from "./EventBus";

export class SoundController {
    private scene: Scene;
    private isBrowserFocused: boolean = true;

    constructor(scene: Scene) {
        this.scene = scene;
        this.setupFocusListeners();
    }

    private setupFocusListeners(): void {
        window.addEventListener('focus', () => {
            this.isBrowserFocused = true;
        });

        window.addEventListener('blur', () => {
            this.isBrowserFocused = false;
        });
    }

    public playSound(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
        if (this.isBrowserFocused) {
            this.scene.sound.add(key, config).play();
        }
    }

    public cleanup(): void {
        window.removeEventListener('focus', () => {
            this.isBrowserFocused = true;
        });

        window.removeEventListener('blur', () => {
            this.isBrowserFocused = false;
        });
    }
}