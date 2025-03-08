import { Scale, Scene } from "phaser";

export class ScreenSetup {
    private virtualWidth: number = 304;
    private virtualHeight: number = 192;
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
        this.initialize();
    }

    private initialize(): void {
        // Konfiguriere die Kamera für "Pixelart"-Look
        this.scene.cameras.main.setSize(this.virtualWidth, this.virtualHeight);

        // Skaliere die Kamera um die Browserhöhe auszunutzen
        const scale = window.innerHeight / this.virtualHeight;

        // Setze den Zoom so, dass das Bild die Browserhöhe ausfüllt
        this.scene.cameras.main.setZoom(1); // Zurücksetzen, falls vorher geändert wurde

        // Scale Manager konfigurieren
        this.scene.scale.setGameSize(this.virtualWidth, this.virtualHeight);
        this.scene.scale.setZoom(scale);

        // Zentriere das Spiel im Browser
        this.scene.scale.autoCenter = Scale.CENTER_BOTH;

        // Anpassen beim Ändern der Fenstergröße
        this.setupResizeListener();
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
}