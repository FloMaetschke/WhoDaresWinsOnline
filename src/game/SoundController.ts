import { Scene } from "phaser";

export class SoundController {
    private scene: Scene;
    private isBrowserFocused: boolean = true;
    private muteIcon: HTMLDivElement;

    constructor(scene: Scene) {
        this.scene = scene;
        this.setupFocusListeners();
        this.createMuteIcon();
    }

    private createMuteIcon(): void {
        this.muteIcon = document.createElement('div');
        this.muteIcon.style.cssText = `
            position: fixed;
            top: calc(30% - 50px);
            right: calc(50% - 50px);
            width: 100px;
            height: 100px;
            background-image: url('/assets/icons/mute.png');
            background-size: contain;
            background-repeat: no-repeat;
            z-index: 1000;
            opacity: 0.7;
            display: none;
            pointer-events: none;
        `;
        
        document.body.appendChild(this.muteIcon);
    }

    private setupFocusListeners(): void {
        const focusHandler = () => {
            this.isBrowserFocused = true;
            this.muteIcon.style.display = 'none';
        };

        const blurHandler = () => {
            this.isBrowserFocused = false;
            this.muteIcon.style.display = 'block';
        };

        window.addEventListener('focus', focusHandler);
        window.addEventListener('blur', blurHandler);

        // Referenzen für cleanup speichern
        this.focusHandler = focusHandler;
        this.blurHandler = blurHandler;
    }

    public playSound(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
        if (this.isBrowserFocused) {
            this.scene.sound.add(key, config).play();
        }
    }

    public cleanup(): void {
        window.removeEventListener('focus', this.focusHandler);
        window.removeEventListener('blur', this.blurHandler);
        if (this.muteIcon) {
            this.muteIcon.remove();
        }
    }

    private focusHandler: () => void;
    private blurHandler: () => void;
}
