import { Actor } from "./actor";
import { Player } from "./Player";
import { Game } from "./scenes/Game"; // Importiere die Game-Szene

// Definiere die möglichen Zustände des Gegners
enum EnemyState {
    SEARCH_PLAYER = "SEARCH_PLAYER",
    WANDER_AROUND = "WANDER_AROUND",
    DYING = "DYING",
    SNIPER = "SNIPER",
    LEAVE_SNIPER = "LEAVE_SNIPER",
}

export class Enemy extends Actor {
    private target: Player;
    private AGRESSOR_RADIUS = 500;
    public currentDirectionX = 0;
    public currentDirectionY = 0;
    private wanderTimer: number = 0;
    private wanderDirection = { x: 0, y: 0 };
    private wanderEvent: Phaser.Time.TimerEvent | null = null;
    private shootTimer: Phaser.Time.TimerEvent | null = null;
    private speed = 50;

    // Statusvariablen der Zustandsmaschine
    private currentState: EnemyState = EnemyState.WANDER_AROUND;
    private stateTimers: Map<EnemyState, number> = new Map();

    // Bewegungsmuster für den SEARCH_PLAYER-Zustand
    private movementPattern = {
        direction: { x: 0, y: 0 },
        duration: 0,
        timer: 0,
    };
    hideOut: import("d:/Who Dares Wins Online/src/game/Entity").Entity;

    constructor(public scene: Game, x: number, y: number, target: Player) {
        super(scene, x, y, "enemy-down-right-0");
        this.target = target;

        this.getBody().setSize(13, 20);
        this.getBody().setOffset(1, 0);

        // Physik aktivieren
        this.getBody().enable = true;

        // Initial animation starten
        this.sprite.anims.play("enemy-down");

        // Starte im Wander-Zustand
        this.enterState(EnemyState.WANDER_AROUND);

        // Schuss-Timer starten
        this.setupShootTimer();
        console.log("Enemy created");
        this.scene.gameMap.addEnemyWaterCollision(this);
    }

    // Neue Methode für Schuss-Timer
    private setupShootTimer(): void {
        // Prüfen, ob die Szene verfügbar ist
        if (!this.scene || !this.scene.time) {
            // Wenn nicht, Verarbeitung abbrechen
            return;
        }
        let shootDelay = Phaser.Math.Between(500, 1000);
        if(this.currentState === EnemyState.SNIPER) {
            shootDelay = Phaser.Math.Between(1000, 3000);
        }

         // Zufällige Zeit zwischen 0.5 und 1 Sekunden

        this.shootTimer = this.scene.time.addEvent({
            delay: shootDelay,
            callback: this.tryToShoot, // Methoden-Referenz statt anonymer Funktion
            callbackScope: this, // Wichtig: Setzt den Kontext für die Callback-Methode
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
        // Nur schießen, wenn in Sicht und mit 80% Wahrscheinlichkeit
        if (
            this.currentState !== EnemyState.DYING &&
            Phaser.Math.Between(1, 100) <= 80
        ) {
            this.scene.shootingController.shoot(
                this,
                "player",
                this.currentDirectionX,
                this.currentDirectionY
            );
        }

        // Timer neu starten mit neuer zufälliger Verzögerung, wenn die Szene noch existiert
        if (this.scene && this.scene.time) {
            this.setupShootTimer();
        }
    }

    // Zustandsmanagement-Methoden
    private enterState(newState: EnemyState): void {
        console.log("Enemy state changed to", newState);
        const oldState = this.currentState;
        this.currentState = newState;

        // Aufräumen des alten Zustands
        this.exitState(oldState);

        // Setup für den neuen Zustand
        switch (newState) {
            case EnemyState.WANDER_AROUND:
                this.startWandering();
                break;

            case EnemyState.SEARCH_PLAYER:
                // Anfängliche Richtung zum Spieler berechnen
                this.movementPattern.timer = 0; // Erzwinge neue Richtungswahl
                break;

            case EnemyState.SNIPER:
                this.movementPattern.timer = 0; // Erzwinge neue Richtungswahl
                this.sprite.setDepth(50000000000);
                break;
            
            case EnemyState.LEAVE_SNIPER:
                this.hideOut.setData("is_occupied", undefined);
                this.sprite.play("enemy-up");
                this.hideOut.enemyBulletCollider.active = true;
                this.getBody().setVelocityY(-1 * this.speed);
                break;

            case EnemyState.DYING:
                // Kollisionen deaktivieren
                this.getBody().enable = false;

                // Tod-Animation abspielen
                this.sprite.anims.play("enemy-die");

                // Nach 1 Sekunde zerstören
                this.scene.time.delayedCall(1000, () => {
                    this.destroy();
                });
                break;
        }
    }

    private exitState(state: EnemyState): void {
        switch (state) {
            case EnemyState.WANDER_AROUND:
                // Wander-Timer aufräumen
                if (this.wanderEvent) {
                    this.wanderEvent.destroy();
                    this.wanderEvent = null;
                }
                break;
        }
    }

    private updateState(): void {
        if (this.currentState === EnemyState.DYING) {
            // Im DYING-Zustand nichts weiter tun
            return;
        }

        if (this.currentState === EnemyState.SNIPER) {
            this.currentDirectionY = 1;
            this.getBody().setVelocityX(0);
            this.getBody().setVelocityY(0);

            if (this.scene.player.x < this.x - 25) {
                this.sprite.anims.play("enemy-ducked-aim-down-left");
                this.currentDirectionX = -1;
            } else if (this.scene.player.x > this.x + 25) {
                this.sprite.anims.play("enemy-ducked-aim-down-right");
                this.currentDirectionX = 1;
            } else {
                this.sprite.anims.play("enemy-ducked-aim-down");
                this.currentDirectionX = 0;
            }

            if (this.scene.player.y < this.y + 25) {
                this.enterState(EnemyState.LEAVE_SNIPER);
            }
            return;
        }

        if (this.currentState === EnemyState.LEAVE_SNIPER) {
            if (this.y < this.hideOut.y - 20) {
                this.enterState(EnemyState.WANDER_AROUND);
            }
            return;
        }

        if (this.searchSniperLocaiton()) {
            return;
        }

        const distanceToPlayer = this.distanceToPlayer();

        // Zustandswechsel basierend auf Spielerentfernung
        if (distanceToPlayer < this.AGRESSOR_RADIUS && distanceToPlayer > 150) {
            if (this.currentState !== EnemyState.SEARCH_PLAYER) {
                this.enterState(EnemyState.SEARCH_PLAYER);
            }
        } else {
            if (this.currentState !== EnemyState.WANDER_AROUND) {
                this.enterState(EnemyState.WANDER_AROUND);
            }
        }
    }

    searchSniperLocaiton() {
        if(this.y > this.scene.player.y - 20) return false; // Nicht unterhalb vom Player in die Deckung gehen!
        let result = false;
        this.scene.gameMap.allEntities.forEach((entity) => {
            if (entity.getType() === "rock") {
                //filter
                if (
                    Phaser.Math.Distance.BetweenPoints(
                        { x: this.x, y: this.y },
                        { x: entity.x, y: entity.y }
                    ) < 20 // Distanz zur deckung
                ) {
                    if (entity.getData("is_occupied") === undefined) {
                        entity.setData("is_occupied", true);
                        this.hideOut = entity;
                        this.hideOut.enemyBulletCollider.active = false;

                        this.setPosition(entity.x + 5, entity.y - 11);
                        entity.setDepth(0);
                        this.getBody().setVelocityX(0);
                        this.getBody().setVelocityY(0);
                        this.enterState(EnemyState.SNIPER);
                        result = true;
                        return;
                    }
                }
            }
        });
        return result;
    }

    private startWandering(): void {
        // Nur 45°-Richtungen erlauben
        const directions = [
            { x: 0, y: -1 }, // N
            { x: 1, y: -1 }, // NE
            { x: 1, y: 0 }, // E
            { x: 1, y: 1 }, // SE
            { x: 0, y: 1 }, // S
            { x: -1, y: 1 }, // SW
            { x: -1, y: 0 }, // W
            { x: -1, y: -1 }, // NW
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
            if (this.sprite.anims.currentAnim) {
                animationKey = this.sprite.anims.currentAnim.key;
            } else {
                animationKey = "enemy-down"; // Standardanimation
            }
        }

        // Spiele die Animation nur ab, wenn sich die Richtung geändert hat
        // oder wenn keine Animation läuft
        if (
            !this.sprite.anims.isPlaying ||
            this.sprite.anims.currentAnim?.key !== animationKey
        ) {
            this.sprite.anims.play(animationKey, true);
        }
    }

    update(time: number, delta: number): void {
        super.update(time, delta);

        // Zustandsübergang prüfen
        this.updateState();

        // Statusspezifische Updates
        switch (this.currentState) {
            case EnemyState.WANDER_AROUND:
                this.handleWandering();
                break;

            case EnemyState.SEARCH_PLAYER:
                this.followPlayerInSteps();
                break;

            case EnemyState.DYING:
                this.alpha = 0.5 + Math.abs(Math.sin(time / 100)) * 0.2;
                this.getBody().setVelocityX(0);
                this.getBody().setVelocityY(0);
                break;
        }
    }

    onWaterCollision(): void {
        // Ändere die Wanderrichtung
        const newDirection = {
            x: -this.wanderDirection.x,
            y: -this.wanderDirection.y,
        };
        this.wanderDirection = newDirection;

        if (this.currentState === EnemyState.WANDER_AROUND) {
            this.startWandering();
        }
    }

    public setTarget(target: Player): void {
        this.target = target;
    }

    public die() {
        // Sound abspielen
        (this.scene as Game).soundController.playSound("enemy_die");

        // In DYING-Zustand wechseln
        this.enterState(EnemyState.DYING);
    }

    // Methode um den Spieler in 45°-Schritten zu verfolgen
    private followPlayerInSteps(): void {
        // Reduziere Timer und prüfe, ob eine neue Richtung gewählt werden soll
        this.movementPattern.timer -= this.scene.game.loop.delta;

        // Wenn Timer abgelaufen oder keine Bewegungsrichtung festgelegt
        if (
            this.movementPattern.timer <= 0 ||
            (this.movementPattern.direction.x === 0 &&
                this.movementPattern.direction.y === 0)
        ) {
            // Richtung zum Spieler
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;

            // Alle möglichen 45°-Richtungen
            const directions = [
                { x: 0, y: -1 }, // N
                { x: 1, y: -1 }, // NE
                { x: 1, y: 0 }, // E
                { x: 1, y: 1 }, // SE
                { x: 0, y: 1 }, // S
                { x: -1, y: 1 }, // SW
                { x: -1, y: 0 }, // W
                { x: -1, y: -1 }, // NW
            ];

            // Gewichtete Richtungswahl - Richtungen zum Spieler bevorzugen
            const weights = directions.map((dir) => {
                // Skalarprodukt berechnen (wie stark die Richtung zum Spieler zeigt)
                const dotProduct =
                    dir.x * Math.sign(dx) + dir.y * Math.sign(dy);
                // Höheres Gewicht für Richtungen zum Spieler
                return Math.max(0.1, (dotProduct + 1) / 2);
            });

            // Zufällige Richtung basierend auf Gewichtung wählen
            const totalWeight = weights.reduce(
                (sum, weight) => sum + weight,
                0
            );
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
        this.getBody().setVelocityX(
            this.movementPattern.direction.x * this.speed
        );
        this.getBody().setVelocityY(
            this.movementPattern.direction.y * this.speed
        );

        // Animations-Richtung aktualisieren
        this.currentDirectionX = this.movementPattern.direction.x;
        this.currentDirectionY = this.movementPattern.direction.y;
        this.updateAnimation();
    }
}
