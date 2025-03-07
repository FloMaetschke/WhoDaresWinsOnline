import { Scene } from "phaser";

export function initAnimations(scene: Scene): void {
    initPlayerAnimations(scene);
    initEnemyAnimations(scene);
}


function initPlayerAnimations(scene: Scene): void {
    scene.anims.create({
        key: "player-up",
        frames: scene.anims.generateFrameNames("sprites", {
            prefix: "player-up-",
            end: 2,
        }),
        frameRate: 10,
        repeat: -1,
    });
    scene.anims.create({
        key: "player-down",
        frames: scene.anims.generateFrameNames("sprites", {
            prefix: "player-down-",
            end: 2,
        }),
        frameRate: 10,
        repeat: -1,
    });
    scene.anims.create({
        key: "player-left",
        frames: scene.anims.generateFrameNames("sprites", {
            prefix: "player-left-",
            end: 2,
        }),
        frameRate: 10,
        repeat: -1,
    });
    scene.anims.create({
        key: "player-right",
        frames: scene.anims.generateFrameNames("sprites", {
            prefix: "player-right-",
            end: 2,
        }),
        frameRate: 10,
        repeat: -1,
    });
    scene.anims.create({
        key: "player-up-left",
        frames: scene.anims.generateFrameNames("sprites", {
            prefix: "player-up-left-",
            end: 2,
        }),
        frameRate: 10,
        repeat: -1,
    });
    scene.anims.create({
        key: "player-up-right",
        frames: scene.anims.generateFrameNames("sprites", {
            prefix: "player-up-right-",
            end: 2,
        }),
        frameRate: 10,
        repeat: -1,
    });
    scene.anims.create({
        key: "player-down-left",
        frames: scene.anims.generateFrameNames("sprites", {
            prefix: "player-down-left-",
            end: 2,
        }),
        frameRate: 10,
        repeat: -1,
    });
    scene.anims.create({
        key: "player-down-right",
        frames: scene.anims.generateFrameNames("sprites", {
            prefix: "player-down-right-",
            end: 2,
        }),
        frameRate: 10,
        repeat: -1,
    });

}

function initEnemyAnimations(scene: Scene): void {
    scene.anims.create({
        key: "enemy-up",
        frames: scene.anims.generateFrameNames("sprites", {
            prefix: "enemy-up-",
            end: 2,
        }),
        frameRate: 10,
        repeat: -1,
    });
    scene.anims.create({
        key: "enemy-down",
        frames: scene.anims.generateFrameNames("sprites", {
            prefix: "enemy-down-",
            end: 2,
        }),
        frameRate: 10,
        repeat: -1,
    });
    scene.anims.create({
        key: "enemy-left",
        frames: scene.anims.generateFrameNames("sprites", {
            prefix: "enemy-left-",
            end: 2,
        }),
        frameRate: 10,
        repeat: -1,
    });
    scene.anims.create({
        key: "enemy-right",
        frames: scene.anims.generateFrameNames("sprites", {
            prefix: "enemy-right-",
            end: 2,
        }),
        frameRate: 10,
        repeat: -1,
    });
    scene.anims.create({
        key: "enemy-up-left",
        frames: scene.anims.generateFrameNames("sprites", {
            prefix: "enemy-up-left-",
            end: 2,
        }),
        frameRate: 10,
        repeat: -1,
    });
    scene.anims.create({
        key: "enemy-up-right",
        frames: scene.anims.generateFrameNames("sprites", {
            prefix: "enemy-up-right-",
            end: 2,
        }),
        frameRate: 10,
        repeat: -1,
    });
    scene.anims.create({
        key: "enemy-down-left",
        frames: scene.anims.generateFrameNames("sprites", {
            prefix: "enemy-down-left-",
            end: 2,
        }),
        frameRate: 10,
        repeat: -1,
    });
    scene.anims.create({
        key: "enemy-down-right",
        frames: scene.anims.generateFrameNames("sprites", {
            prefix: "enemy-down-right-",
            end: 2,
        }),
        frameRate: 10,
        repeat: -1,
    });
    scene.anims.create({
        key: "enemy-die",
        frames: scene.anims.generateFrameNames("sprites", {
            prefix: "enemy-die-",
            end: 2,
        }),
        frameRate: 10,
        repeat: -1,
    });
}
