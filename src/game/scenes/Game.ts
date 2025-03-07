import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { Player } from "../player";
import { initAnimations } from "../animations";
import { Enemy } from "../enemy";

export class Game extends Scene {
    private player: Player;
    private bullets: Phaser.Physics.Arcade.Group;
    private enemies: Phaser.Physics.Arcade.Group;

    constructor() {
        super("Game");
    }

    preload() {
        this.load.setPath("assets");
        this.load.atlas("sprites", "sprites.png", "sprites.json");
        this.load.image("background", "bg.png");
        this.load.audio('bullet', 'shot.wav');
        this.load.audio('enemy_die', 'enemy_die.wav');
        this.load.audio('music', 'music.mp3');
    }

    create() {
        // Endlos scrollender Hintergrund
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const background = this.add
            .tileSprite(
                0,
                0,
                this.cameras.main.width,
                this.cameras.main.height,
                "background"
            )
            .setOrigin(0, 0)
            .setScrollFactor(1);

        // Physik-System aktivieren
        this.physics.world.setBounds(
            0,
            0,
            this.cameras.main.width,
            this.cameras.main.height
        );

        // Spieler mit Spritesheet erstellen
        this.player = new Player(this, 500, 500);

        // Kamera folgt dem Spieler
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setFollowOffset(0, 100);

        // Projektile-Gruppe erstellen
        this.bullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Image,
            maxSize: 3,
        });

        // Gegner-Gruppe erstellen
        this.enemies = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
        });

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

        // Gegner spawnen
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true,
        });

        initAnimations(this);
        EventBus.emit("current-scene-ready", this);

        // Debug-Toggle-Event-Listener hinzufügen
        EventBus.on('toggle-debug', (debugEnabled: boolean) => {
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

        const music = this.sound.add('music');
        music.play();
    }

    update() {
        this.player.update();
    }

    private shoot() {
        const bullet = this.bullets.get(
            this.player.x,
            this.player.y,
            "sprites",
            "ammo-0"
        );

        let bulletSound = this.sound.add('bullet');
        bulletSound.play();

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setVelocityX(this.player.currentDirectionX * 400);
            bullet.setVelocityY(this.player.currentDirectionY * 400);

            // Projektil nach 1 Sekunde zerstören
            this.time.delayedCall(1200, () => {
                bullet.destroy();
            });
        }
    }

    private spawnEnemy() {
        const x = Phaser.Math.Between(50, this.cameras.main.width - 50);
        const y = this.player.y - 400;

        const enemy = new Enemy(this, x, y, this.player);

        this.enemies.add(enemy);
        // const enemy = this.enemies.create(x, y, 'enemy');
        //enemy.setVelocityY(50);

        // Gegner nach 5 Sekunden zerstören
        // this.time.delayedCall(5000, () => {
        //     enemy.destroy();
        // });
    }

    private handleBulletEnemyCollision(
        bullet: Phaser.Physics.Arcade.Image,
        enemy: Enemy
    ) {
        bullet.destroy();
        enemy.die();
    }

    // Optional: Cleanup im destroy
    destroy() {
        EventBus.removeListener('toggle-debug');
        super.destroy();
    }
}
