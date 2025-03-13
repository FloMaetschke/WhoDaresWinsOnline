import { Game } from "./scenes/Game";
import { Player } from "./Player";

export class TouchController {
    private touchControls: {
        container: HTMLDivElement | null;
        fireButton: HTMLDivElement | null;
        joystickArea: HTMLDivElement | null;
    } = {
        container: null,
        fireButton: null,
        joystickArea: null,
    };

    constructor(private scene: Game, private player: Player) {
        if (this.checkIfMobile()) {
            this.setupMobileControls();
            this.scene.disableKeyboard = true;
        }
    }

    private checkIfMobile(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
    }

    private setupMobileControls(): void {
        // Container für Touch-Steuerung
        this.touchControls.container = document.createElement("div");
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
        this.touchControls.fireButton = document.createElement("div");
        this.touchControls.fireButton.innerHTML = "FIRE";
        this.touchControls.fireButton.style.cssText = `
            position: absolute;
            left: 10px;
            top: 5%;
            width: 100px;
            height: 90%;
            background: red;
            border-radius: 10px;
            pointer-events: auto;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 12px;
            color: white;
            transform: none;
        `;

        // Joystick-Bereich (rechts)
        this.touchControls.joystickArea = document.createElement("div");
        this.touchControls.joystickArea.innerHTML = "MOVE";
        this.touchControls.joystickArea.style.cssText = `
            position: absolute;
            right: 10px;
            bottom: calc(50% - 55px);
            width: 110px;
            height: 110px;
            background: rgba(128, 128, 128, 0.3);
            border-radius: 50%;
            pointer-events: auto;
            font-size: 12px;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        this.touchControls.container.appendChild(this.touchControls.fireButton);
        this.touchControls.container.appendChild(this.touchControls.joystickArea);
        document.body.appendChild(this.touchControls.container);

        this.setupTouchEvents();
    }

    private setupTouchEvents(): void {
        if (!this.touchControls.fireButton || !this.touchControls.joystickArea) return;

        // Feuerknopf Events
        this.touchControls.fireButton.addEventListener("touchstart", () => {
            this.player.shoot();
        });

        // Joystick Events
        let isDragging = false;
        let startX = 0;
        let startY = 0;

        this.touchControls.joystickArea.addEventListener("touchstart", (e) => {
            isDragging = true;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        });

        this.touchControls.joystickArea.addEventListener("touchmove", (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const touch = e.touches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;

            const threshold = 20;
            
            let directionX = 0;
            let directionY = 0;

            if (Math.abs(deltaX) > threshold) {
                directionX = deltaX > 0 ? 1 : -1;
                this.player.currentDirectionX = directionX;
            }
            if (Math.abs(deltaY) > threshold) {
                directionY = deltaY > 0 ? 1 : -1;
                this.player.currentDirectionY = directionY;
            }

            if (Math.abs(deltaX) <= threshold) {
                this.player.currentDirectionX = 0;
            }

            if (Math.abs(deltaY) <= threshold) {
                this.player.currentDirectionY = 0;
            }
            this.player.currentDirectionX  = directionX;
            this.player.currentDirectionY  = directionY;
            this.player.move(directionX, directionY);
        });

        this.touchControls.joystickArea.addEventListener("touchend", () => {
            isDragging = false;
            //this.player.currentDirectionX = 0;
            //this.player.currentDirectionY = 0;
            this.player.move(0, 0);
        });
    }

    public cleanup(): void {
        if (this.touchControls.container) {
            document.body.removeChild(this.touchControls.container);
        }
    }
}