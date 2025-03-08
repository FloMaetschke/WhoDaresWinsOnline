import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { Player } from "../player";
import { Enemy } from "../enemy";
import { GameMap } from "../GameMap";

export class Game extends Scene {
    private player: Player;
    private bullets: Phaser.Physics.Arcade.Group;
    private enemies: Phaser.Physics.Arcade.Group;
    private enemyBullets: Phaser.Physics.Arcade.Group;
    private gameMap: any;

    constructor() {
        super("Game");
    }

    create() {
        // Definiere virtuelle Größe
        const virtualWidth = 304;
        const virtualHeight = 192;

        // Konfiguriere die Kamera für "Pixelart"-Look
        this.cameras.main.setSize(virtualWidth, virtualHeight);

        // Skaliere die Kamera um die Browserhöhe auszunutzen
        const scale = window.innerHeight / virtualHeight;

        // Setze den Zoom so, dass das Bild die Browserhöhe ausfüllt
        this.cameras.main.setZoom(1); // Zurücksetzen, falls vorher geändert wurde

        // Scale Manager konfigurieren
        this.scale.setGameSize(virtualWidth, virtualHeight);
        this.scale.setZoom(scale);

        // Zentriere das Spiel im Browser
        this.scale.autoCenter = Phaser.Scale.CENTER_BOTH;

        // Anpassen beim Ändern der Fenstergröße
        window.addEventListener("resize", () => {
            const newScale = window.innerHeight / virtualHeight;
            this.scale.setZoom(newScale);
        });

        // Container für Spieler und Gegner (über der Karte)
        const entityContainer = this.add.container(0, 0);
        entityContainer.setDepth(1);

        this.gameMap = new GameMap(this);

        const { startX, startY } = this.gameMap.getPlayerStartPosition();
        this.player = new Player(this, startX, startY);

        // Spieler-Tiefe anpassen, damit er über der Tilemap liegt
        this.player.setDepth(10);

        // Auch für Gegner und Projektile
        this.enemies = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
        });
        this.enemies.setDepth(10);

        this.bullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Image,
            maxSize: 3,
        });
        this.bullets.setDepth(11); // Projektile über allem

        // Nach der Erstellung der anderen Gruppen
        this.enemyBullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Image,
            maxSize: 10,
        });
        this.enemyBullets.setDepth(11); // Gleiche Tiefe wie Spieler-Projektile

        // Kamera folgt dem Spieler in der Mitte des Bildschirms
        this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
        this.cameras.main.setFollowOffset(0, 0);

        // Schießen mit Leertaste
        this.input.keyboard!.on("keydown-SPACE", () => {
            this.shoot();
        });

        // Kollisionen einrichten
        this.physics.add.collider(
            this.bullets,
            this.enemies,
            (object1, object2) => {
                const bullet = object1 as Phaser.Physics.Arcade.Image;
                const enemy = object2 as Phaser.Physics.Arcade.Sprite;
                this.handleBulletEnemyCollision(bullet, enemy);
            },
            undefined,
            this
        );

        // Kollision zwischen Feindkugeln und Spieler einrichten
        this.physics.add.collider(
            this.enemyBullets,
            this.player,
            (object1, object2) => {
                const bullet = object1 as Phaser.Physics.Arcade.Image;
                const player = object2 as Player;
                this.handleEnemyBulletPlayerCollision(bullet, player);
            },
            undefined,
            this
        );

        // Gegner spawnen
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true,
        });

        // Erste Chunks um Spieler laden
        this.gameMap.updateChunks(this.player);

        // Rest des Codes wie zuvor
        EventBus.emit("current-scene-ready", this);

        // Debug-Toggle-Event-Listener hinzufügen
        EventBus.on("toggle-debug", (debugEnabled: boolean) => {
            // Debug-Einstellungen aktualisieren
            const world = this.physics.world;

            // Debug-Modus setzen
            (world as any).drawDebug = debugEnabled;
            (this.game.config.physics.arcade as any).debug = debugEnabled;

            // Wenn Debug deaktiviert wird und Debug-Grafik existiert
            if (!debugEnabled && world.debugGraphic) {
                world.debugGraphic.clear();
                world.debugGraphic.destroy();
                world.debugGraphic = null;
            }

            // Wenn Debug aktiviert wird
            if (debugEnabled) {
                // Alte Debug-Grafik aufräumen falls vorhanden
                if (world.debugGraphic) {
                    world.debugGraphic.clear();
                    world.debugGraphic.destroy();
                    world.debugGraphic = null;
                }
                // Neue Debug-Grafik erstellen
                (world as any).createDebugGraphic();
            }
        });
    }

    update() {
        this.player.update();

        // Prüfen, ob neue Chunks geladen werden müssen
        this.gameMap.updateChunks(this.player);
    }

    private shoot() {
        const bullet = this.bullets.get(
            this.player.x,
            this.player.y,
            "sprites",
            "ammo-0"
        );

        let bulletSound = this.sound.add("bullet");
        bulletSound.play();

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setVelocityX(this.player.currentDirectionX * 150);
            bullet.setVelocityY(this.player.currentDirectionY * 150);

            // Projektil nach 1 Sekunde zerstören
            this.time.delayedCall(1200, () => {
                bullet.destroy();
            });
        }
    }

    private spawnEnemy() {
        if (this.enemies.countActive(true) >= 5) return;

        // Gegner um den Spieler herum spawnen, aber außerhalb des Bildschirms
        const camera = this.cameras.main;

        // Zufällige Position am Rand des Sichtfelds der Kamera
        let x, y;
        const side = Phaser.Math.Between(0, 3); // 0: oben, 1: rechts, 2: unten, 3: links

        switch (side) {
            case 0: // Oben
                x = Phaser.Math.Between(
                    this.player.x - camera.width / 2,
                    this.player.x + camera.width / 2
                );
                y = this.player.y - camera.height / 2 - 50; // Etwas außerhalb des Bildschirms
                break;
            case 1: // Rechts
                x = this.player.x + camera.width / 2 + 50;
                y = Phaser.Math.Between(
                    this.player.y - camera.height / 2,
                    this.player.y + camera.height / 2
                );
                break;
            case 2: // Unten
                x = Phaser.Math.Between(
                    this.player.x - camera.width / 2,
                    this.player.x + camera.width / 2
                );
                y = this.player.y + camera.height / 2 + 50;
                break;
            case 3: // Links
                x = this.player.x - camera.width / 2 - 50;
                y = Phaser.Math.Between(
                    this.player.y - camera.height / 2,
                    this.player.y + camera.height / 2
                );
                break;
        }

        const enemy = new Enemy(this, x, y, this.player);
        enemy.setDepth(10); // Gleiche Tiefe wie Spieler
        this.enemies.add(enemy);
    }

    private handleBulletEnemyCollision(
        bullet: Phaser.Physics.Arcade.Image,
        enemy: Enemy
    ) {
        bullet.destroy();
        enemy.die();
    }

    // Neue Methode für Feindkugel-Spieler-Kollision
    private handleEnemyBulletPlayerCollision(
        player: Player,
        bullet: Phaser.Physics.Arcade.Image
    ) {
        bullet.destroy();
        player.die(); //Spieler töten
    }

    // Methode für Gegner, damit sie schießen können
    public enemyShoot(enemy: Enemy) {
        const bullet = this.enemyBullets.get(
            enemy.x,
            enemy.y,
            "sprites",
            "ammo-0" // Gleiche Munition wie Spieler verwenden
        );

        const bulletSound = this.sound.add("bullet");
        bulletSound.play();

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);

            // Die Schussrichtung entspricht der Bewegungsrichtung des Gegners
            const speed = 150;

            // Verwende die aktuelle Bewegungsrichtung des Gegners
            bullet.setVelocityX(enemy.currentDirectionX * speed);
            bullet.setVelocityY(enemy.currentDirectionY * speed);

            // Nach 1 Sekunde zerstören
            this.time.delayedCall(1000, () => {
                bullet.destroy();
            });
        }
    }

    // Optional: Cleanup im destroy
    destroy() {
        // Chunks aufräumen
        for (const layer of this.activeChunks.values()) {
            layer.destroy();
        }
        this.activeChunks.clear();
        this.loadedChunks.clear();

        // Animationen NICHT löschen beim Destroy

        EventBus.removeListener("toggle-debug");
        super.destroy();
    }
}
