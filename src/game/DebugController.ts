import { Scene } from "phaser";
import { EventBus } from "./EventBus";

export class DebugController {
    private scene: Scene;
    private world: Phaser.Physics.Arcade.World;

    constructor(scene: Scene) {
        this.scene = scene;
        this.world = scene.physics.world;

        this.initializeDebugListener();
    }

    private initializeDebugListener(): void {
        EventBus.on("toggle-debug", (debugEnabled: boolean) => {
            this.updateDebugState(debugEnabled);
        });
    }

    private updateDebugState(debugEnabled: boolean): void {
        // Debug-Modus setzen
        (this.world as any).drawDebug = debugEnabled;
        (this.scene.game.config.physics.arcade as any).debug = debugEnabled;

        if (!debugEnabled) {
            this.clearDebugGraphics();
        } else {
            this.recreateDebugGraphics();
        }
    }

    private clearDebugGraphics(): void {
        if (this.world.debugGraphic) {
            this.world.debugGraphic.clear();
            this.world.debugGraphic.destroy();
            this.world.debugGraphic = null;
        }
    }

    private recreateDebugGraphics(): void {
        // Alte Debug-Grafik aufräumen falls vorhanden
        this.clearDebugGraphics();
        // Neue Debug-Grafik erstellen
        (this.world as any).createDebugGraphic();
    }

    public destroy(): void {
        EventBus.removeListener("toggle-debug");
    }
}