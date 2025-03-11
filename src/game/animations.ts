import { Scene } from "phaser";

export function initAnimations(scene: Scene): void {
    const animationManager = scene.anims;

    // Player Animationen
    if (!animationManager.exists('player-up')) {
        animationManager.create({
            key: "player-up",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "player-up-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }
    if (!animationManager.exists('player-down')) {
        animationManager.create({
            key: "player-down",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "player-down-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }
    if (!animationManager.exists('player-left')) {
        animationManager.create({
            key: "player-left",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "player-left-",
                end: 2,
            }),
            frameRate: 20,
            repeat: -1,
        });
    }
    if (!animationManager.exists('player-right')) {
        animationManager.create({
            key: "player-right",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "player-right-",
                end: 2,
            }),
            frameRate: 20,
            repeat: -1,
        });
    }
    if (!animationManager.exists('player-up-left')) {
        animationManager.create({
            key: "player-up-left",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "player-up-left-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }
    if (!animationManager.exists('player-up-right')) {
        animationManager.create({
            key: "player-up-right",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "player-up-right-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }
    if (!animationManager.exists('player-down-left')) {
        animationManager.create({
            key: "player-down-left",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "player-down-left-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }
    if (!animationManager.exists('player-down-right')) {
        animationManager.create({
            key: "player-down-right",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "player-down-right-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }
    if (!animationManager.exists('player-dead')) {
        animationManager.create({
            key: "player-dead",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "player-dead-",
                end: 0,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }

    // Enemy Animationen
    if (!animationManager.exists('enemy-up')) {
        animationManager.create({
            key: "enemy-up",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "enemy-up-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }
    if (!animationManager.exists('enemy-down')) {
        animationManager.create({
            key: "enemy-down",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "enemy-down-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }
    if (!animationManager.exists('enemy-left')) {
        animationManager.create({
            key: "enemy-left",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "enemy-left-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }
    if (!animationManager.exists('enemy-right')) {
        animationManager.create({
            key: "enemy-right",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "enemy-right-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }
    if (!animationManager.exists('enemy-up-left')) {
        animationManager.create({
            key: "enemy-up-left",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "enemy-up-left-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }
    if (!animationManager.exists('enemy-up-right')) {
        animationManager.create({
            key: "enemy-up-right",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "enemy-up-right-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }
    if (!animationManager.exists('enemy-down-left')) {
        animationManager.create({
            key: "enemy-down-left",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "enemy-down-left-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }
    if (!animationManager.exists('enemy-down-right')) {
        animationManager.create({
            key: "enemy-down-right",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "enemy-down-right-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }
    if (!animationManager.exists('enemy-die')) {
        animationManager.create({
            key: "enemy-die",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "enemy-die-",
                end: 1,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }
}

export function clearAnimations(scene: Phaser.Scene) {
    scene.anims.removeAll();
}
