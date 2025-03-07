import { Actor } from "./actor";
import { Player } from "./player";
import { Game } from "./scenes/Game"; // Importiere die Game-Szene

export class Enemy extends Actor {
    private target: Player;
    private AGRESSOR_RADIUS = 500;
    private currentDirectionX = 0;
    private currentDirectionY = 0;
    private wanderTimer: number = 0;
    private isWandering: boolean = false;
    private wanderDirection = { x: 0, y: 0 };
    private wanderEvent: Phaser.Time.TimerEvent | null = null;
    private shootTimer: Phaser.Time.TimerEvent | null = null;
    private dead = false;
    private speed = 50;


    constructor(scene: Phaser.Scene, x: number, y: number, target: Player) {
        super(scene, x, y, "sprites");
        this.target = target;
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Kollisionsbox anpassen
        this.getBody().setSize(13, 20);
        this.getBody().setOffset(1, 0);

        // Physik aktivieren
        this.body!.enable = true;

        // Initial animation starten
        this.anims.play("enemy-down");

        this.startWandering();
        
        // Schuss-Timer starten
        this.setupShootTimer();
    }
    
    // Neue Methode für Schuss-Timer
    private setupShootTimer(): void {
        // Gelegenheitlich schießen, wenn nicht in "Idle"-Zustand
        const shootDelay = Phaser.Math.Between(500, 5000); // Zufällige Zeit zwischen 3 und 8 Sekunden
        
        this.shootTimer = this.scene.time.addEvent({
            delay: shootDelay,
            callback: () => {
                // Nur schießen, wenn in Reichweite und nicht tot
                if (!this.dead ) { //&& this.distanceToPlayer() < this.AGRESSOR_RADIUS) {
                    this.tryToShoot();
                }
                // Timer neu starten mit neuer zufälliger Verzögerung
                this.setupShootTimer();
            },
            callbackScope: this
        });
    }
    
    // Methode zum Überprüfen der Entfernung zum Spieler
    private distanceToPlayer(): number {
        return Phaser.Math.Distance.BetweenPoints(
            { x: this.x, y: this.y },
            { x: this.target.x, y: this.target.y }
        );
    }
    
    // Versuche zu schießen (mit etwas Wahrscheinlichkeit)
    private tryToShoot(): void {
        // Nur schießen, wenn in Sicht und mit 30% Wahrscheinlichkeit
        if (Phaser.Math.Between(1, 100) <= 30) {
            // Verwende die enemyShoot-Methode aus der Game-Szene
            (this.scene as Game).enemyShoot(this);
        }
    }

    private startWandering(): void {
        this.isWandering = true;
        
        // Nur 45°-Richtungen erlauben
        const directions = [
            { x: 0, y: -1 }, // N
            { x: 1, y: -1 }, // NE
            { x: 1, y: 0 },  // E
            { x: 1, y: 1 },  // SE
            { x: 0, y: 1 },  // S
            { x: -1, y: 1 }, // SW
            { x: -1, y: 0 }, // W
            { x: -1, y: -1 } // NW
        ];
    
        const randomDirection =
            directions[Math.floor(Math.random() * directions.length)];
        this.wanderDirection = randomDirection;
    
        if (this.scene?.time) {
            this.wanderTimer = Phaser.Math.Between(2000, 5000); // Variieren der Wanderzeit
            this.wanderEvent = this.scene.time.addEvent({
                delay: this.wanderTimer,
                callback: this.startWandering,
                callbackScope: this,
            });
        }
    }

    private handleWandering(): void {
        if (!this.isWandering) return;

 
        this.getBody().setVelocityX(this.wanderDirection.x * this.speed);
        this.getBody().setVelocityY(this.wanderDirection.y * this.speed);

        this.currentDirectionX = this.wanderDirection.x;
        this.currentDirectionY = this.wanderDirection.y;

        this.updateAnimation();
    }

    private updateAnimation(): void {
        let animationKey = "";

        // Bestimme die Animations-Richtung basierend auf der aktuellen Bewegung
        if (this.currentDirectionY < 0) {
            animationKey =
                this.currentDirectionX < 0
                    ? "enemy-up-left"
                    : this.currentDirectionX > 0
                    ? "enemy-up-right"
                    : "enemy-up";
        } else if (this.currentDirectionY > 0) {
            animationKey =
                this.currentDirectionX < 0
                    ? "enemy-down-left"
                    : this.currentDirectionX > 0
                    ? "enemy-down-right"
                    : "enemy-down";
        } else if (this.currentDirectionX !== 0) {
            animationKey =
                this.currentDirectionX < 0 ? "enemy-left" : "enemy-right";
        } else {
            // Wenn keine Bewegung, behalte die letzte Richtung bei
            if (this.anims.currentAnim) {
                animationKey = this.anims.currentAnim.key;
            } else {
                animationKey = "enemy-down"; // Standardanimation
            }
        }

        // Spiele die Animation nur ab, wenn sich die Richtung geändert hat
        // oder wenn keine Animation läuft
        if (
            !this.anims.isPlaying ||
            this.anims.currentAnim?.key !== animationKey
        ) {
            this.anims.play(animationKey, true);
        }
    }

    preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);
        if (this.dead) {
            this.alpha = 0.5 + Math.abs(Math.sin(time / 100)) * 0.2;
            this.getBody().setVelocityX(0);
            this.getBody().setVelocityY(0);
            return;
        }
         
        const distanceToPlayer = Phaser.Math.Distance.BetweenPoints(
            { x: this.x, y: this.y },
            { x: this.target.x, y: this.target.y }
        );
    
        if (distanceToPlayer < this.AGRESSOR_RADIUS && distanceToPlayer > 150) {
            // Verfolge den Spieler mit 45°-Bewegung
            this.isWandering = false;
            this.followPlayerInSteps();
        } else {
            this.handleWandering();
        }
    }

    public setTarget(target: Player): void {
        this.target = target;
    }

    public die() {
        this.dead = true;
        
        // Wenn tot, alle Timer stoppen
        if (this.wanderEvent) this.wanderEvent.destroy();
        if (this.shootTimer) this.shootTimer.destroy();
        
        // Sound abspielen
        const dieSound = this.scene.sound.add("enemy_die");
        dieSound.play();
        
        // Kollisionen deaktivieren
        this.getBody().enable = false;
        
        // Tod-Animation abspielen
        this.anims.play("enemy-die");
        
        // Nach 1 Sekunde zerstören

        this.scene.time.delayedCall(1000, () => {
            this.destroy();
        });
    }

// Neues Objekt für Bewegungsrichtung und Dauer
private movementPattern = {
    direction: { x: 0, y: 0 },
    duration: 0,
    timer: 0
};

    // Methode um den Spieler in 45°-Schritten zu verfolgen
private followPlayerInSteps(): void {
    // Reduziere Timer und prüfe, ob eine neue Richtung gewählt werden soll
    this.movementPattern.timer -= this.scene.game.loop.delta;
    
    // Wenn Timer abgelaufen oder keine Bewegungsrichtung festgelegt
    if (this.movementPattern.timer <= 0 || 
        (this.movementPattern.direction.x === 0 && this.movementPattern.direction.y === 0)) {
        
        // Richtung zum Spieler
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        
        // Alle möglichen 45°-Richtungen
        const directions = [
            { x: 0, y: -1 },  // N
            { x: 1, y: -1 },  // NE
            { x: 1, y: 0 },   // E
            { x: 1, y: 1 },   // SE
            { x: 0, y: 1 },   // S
            { x: -1, y: 1 },  // SW
            { x: -1, y: 0 },  // W
            { x: -1, y: -1 }  // NW
        ];
        
        // Gewichtete Richtungswahl - Richtungen zum Spieler bevorzugen
        const weights = directions.map(dir => {
            // Skalarprodukt berechnen (wie stark die Richtung zum Spieler zeigt)
            const dotProduct = dir.x * Math.sign(dx) + dir.y * Math.sign(dy);
            // Höheres Gewicht für Richtungen zum Spieler
            return Math.max(0.1, (dotProduct + 1) / 2); 
        });
        
        // Zufällige Richtung basierend auf Gewichtung wählen
        let totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let randomValue = Math.random() * totalWeight;
        let selectedIndex = 0;
        
        for (let i = 0; i < weights.length; i++) {
            randomValue -= weights[i];
            if (randomValue <= 0) {
                selectedIndex = i;
                break;
            }
        }
        
        // Neue Richtung und Dauer setzen
        this.movementPattern.direction = directions[selectedIndex];
        // Zufällige Dauer zwischen 500ms und 2000ms
        this.movementPattern.duration = Phaser.Math.Between(500, 2000);
        this.movementPattern.timer = this.movementPattern.duration;
    }
    
    // Bewegung in der aktuellen Richtung
    const speed = 50;
    this.getBody().setVelocityX(this.movementPattern.direction.x * speed);
    this.getBody().setVelocityY(this.movementPattern.direction.y * speed);
    
    // Animations-Richtung aktualisieren
    this.currentDirectionX = this.movementPattern.direction.x;
    this.currentDirectionY = this.movementPattern.direction.y;
    this.updateAnimation();
}
}
