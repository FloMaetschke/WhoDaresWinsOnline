import { Scale } from "phaser";
import { Game } from "./scenes/Game";

export class ScreenSetup {
    private virtualWidth: number = 304;
    private virtualHeight: number = 192;
    private scene: Game; // Änderung zu Game statt Scene
    private isMobile: boolean;
    private touchControls: { container: HTMLDivElement | null; fireButton: HTMLDivElement | null; joystickArea: HTMLDivElement | null } = {
        container: null,
        fireButton: null,
        joystickArea: null
    };

    constructor(scene: Game) { // Änderung zu Game
        this.scene = scene;
        this.isMobile = this.checkIfMobile();
        this.initialize();
    }

    private checkIfMobile(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    private initialize(): void {
        // Konfiguriere die Kamera für "Pixelart"-Look
        this.scene.cameras.main.setSize(this.virtualWidth, this.virtualHeight);

        // Skaliere die Kamera um die Browserhöhe auszunutzen
        const scale = window.innerHeight / this.virtualHeight;

        // Setze den Zoom so, dass das Bild die Browserhöhe ausfüllt
        this.scene.cameras.main.setZoom(1);

        // Scale Manager konfigurieren
        this.scene.scale.setGameSize(this.virtualWidth, this.virtualHeight);
        this.scene.scale.setZoom(scale);

        // Zentriere das Spiel im Browser
        this.scene.scale.autoCenter = Scale.CENTER_BOTH;

        if (this.isMobile) {
            this.setupMobileControls();
            this.scene.disableKeyboard = true;
        }

        // Anpassen beim Ändern der Fenstergröße
        this.setupResizeListener();
    }

    private setupMobileControls(): void {
        // Container für Touch-Steuerung
        this.touchControls.container = document.createElement('div');
        this.touchControls.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;

        // Feuerknopf (links)
        this.touchControls.fireButton = document.createElement('div');
        this.touchControls.fireButton.style.cssText = `
            position: absolute;
            left: 20px;
            bottom: 20px;
            width: 60px;
            height: 60px;
            background: rgba(255, 0, 0, 0.5);
            border-radius: 50%;
            pointer-events: auto;
        `;

        // Joystick-Bereich (rechts)
        this.touchControls.joystickArea = document.createElement('div');
        this.touchControls.joystickArea.style.cssText = `
            position: absolute;
            right: 20px;
            bottom: 20px;
            width: 120px;
            height: 120px;
            background: rgba(128, 128, 128, 0.3);
            border-radius: 50%;
            pointer-events: auto;
        `;

        this.touchControls.container.appendChild(this.touchControls.fireButton);
        this.touchControls.container.appendChild(this.touchControls.joystickArea);
        document.body.appendChild(this.touchControls.container);

        this.setupTouchEvents();
    }

    private setupTouchEvents(): void {
        if (!this.touchControls.fireButton || !this.touchControls.joystickArea) return;

        // Feuerknopf Events
        this.touchControls.fireButton.addEventListener('touchstart', () => {
            this.scene.player.shoot();
        });

        // Joystick Events
        let isDragging = false;
        let startX = 0;
        let startY = 0;

        this.touchControls.joystickArea.addEventListener('touchstart', (e) => {
            isDragging = true;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        });

        this.touchControls.joystickArea.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;

            const threshold = 20;
            const player = this.scene.player;
            
            let directionX = 0;
            let directionY = 0;

            if (Math.abs(deltaX) > threshold) {
                directionX = deltaX > 0 ? 1 : -1;
            }
            if (Math.abs(deltaY) > threshold) {
                directionY = deltaY > 0 ? 1 : -1;
            }

            player.move(directionX, directionY);
        });

        this.touchControls.joystickArea.addEventListener('touchend', () => {
            isDragging = false;
            this.scene.player.move(0, 0);
        });
    }

    private setupResizeListener(): void {
        window.addEventListener("resize", () => {
            const newScale = window.innerHeight / this.virtualHeight;
            this.scene.scale.setZoom(newScale);
        });
    }

    public getVirtualWidth(): number {
        return this.virtualWidth;
    }

    public getVirtualHeight(): number {
        return this.virtualHeight;
    }

    public cleanup(): void {
        if (this.isMobile && this.touchControls.container) {
            document.body.removeChild(this.touchControls.container);
        }
    }
}
