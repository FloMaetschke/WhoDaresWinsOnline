import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class Game extends Scene {
    private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private bullets: Phaser.Physics.Arcade.Group;
    private enemies: Phaser.Physics.Arcade.Group;
    private speed: number = 200;

    constructor() {
        super('Game');
    }

    preload() {
        this.load.setPath('assets');
        
        // Spritesheet laden
        this.load.image('sprites', 'sprites-atlas.png');
        this.load.atlas('sprites-atlas', 'sprites-atlas.png', 'sprites-atlas.json');

        this.load.image('bullet', 'bullet.png');
        this.load.image('background', 'bg.png');

    }

    create() {
        // Animation für Aufwärtsbewegung definieren
        this.anims.create({
            key: 'move-up',
            frames: this.anims.generateFrameNumbers('sprites-atlas', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1
        });

        // Endlos scrollender Hintergrund
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const background = this.add.tileSprite(0, 0, this.cameras.main.width, 
            this.cameras.main.height, 'background')
            .setOrigin(0, 0)
            .setScrollFactor(0);

        // Physik-System aktivieren
        this.physics.world.setBounds(0, 0, this.cameras.main.width, 
            this.cameras.main.height);

        // Spieler mit Spritesheet erstellen
        this.player = this.physics.add.sprite(400, 500, 'sprites', 0);
        this.player.setCollideWorldBounds(true);

        // Kamera folgt dem Spieler
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setFollowOffset(0, 100);

        // Steuerung einrichten
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Projektile-Gruppe erstellen
        this.bullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Image,
            maxSize: 3
        });

        // Gegner-Gruppe erstellen
        this.enemies = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite
        });

        // Schießen mit Leertaste
        this.input.keyboard!.on('keydown-SPACE', () => {
            this.shoot();
        });

        // Kollisionen einrichten
        this.physics.add.collider(this.bullets, this.enemies, 
            (object1, object2) => {
                const bullet = object1 as Phaser.Physics.Arcade.Image;
                const enemy = object2 as Phaser.Physics.Arcade.Sprite;
                this.handleBulletEnemyCollision(bullet, enemy);
            }, undefined, this);

        // Gegner spawnen
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        EventBus.emit('current-scene-ready', this);
    }

    update() {
        // Spieler-Bewegung
        const diagonalSpeed = this.speed * 0.7071; // ca. 1/√2 für diagonale Bewegung

        if (this.cursors.left.isDown && this.cursors.up.isDown) {
            this.player.setVelocity(-diagonalSpeed, -diagonalSpeed);
            this.player.play('move-up', true);
        } else if (this.cursors.left.isDown && this.cursors.down.isDown) {
            this.player.setVelocity(-diagonalSpeed, diagonalSpeed);
        } else if (this.cursors.right.isDown && this.cursors.up.isDown) {
            this.player.setVelocity(diagonalSpeed, -diagonalSpeed);
            this.player.play('move-up', true);
        } else if (this.cursors.right.isDown && this.cursors.down.isDown) {
            this.player.setVelocity(diagonalSpeed, diagonalSpeed);
        } else if (this.cursors.left.isDown) {
            this.player.setVelocity(-this.speed, 0);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocity(this.speed, 0);
        } else if (this.cursors.up.isDown) {
            this.player.setVelocity(0, -this.speed);
            this.player.play('move-up', true);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocity(0, this.speed);
        } else {
            this.player.setVelocity(0, 0);
            this.player.stop();
            this.player.setFrame(0);
        }
    }

    private shoot() {
        const bullet = this.bullets.get(this.player.x, this.player.y, 'bullet');
        
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setVelocityY(-400);
            
            // Projektil nach 1 Sekunde zerstören
            this.time.delayedCall(1000, () => {
                bullet.destroy();
            });
        }
    }

    private spawnEnemy() {
        const x = Phaser.Math.Between(50, this.cameras.main.width - 50);
        const y = this.player.y - 400;
        
        const enemy = this.enemies.create(x, y, 'enemy');
        enemy.setVelocityY(50);
        
        // Gegner nach 5 Sekunden zerstören
        this.time.delayedCall(5000, () => {
            enemy.destroy();
        });
    }

    private handleBulletEnemyCollision(bullet: Phaser.Physics.Arcade.Image, 
        enemy: Phaser.Physics.Arcade.Sprite) {
        bullet.destroy();
        enemy.destroy();
    }
}
