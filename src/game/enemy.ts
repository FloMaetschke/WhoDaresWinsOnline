import { Math, Scene } from 'phaser';

import { Actor } from './actor';
import { Player } from './player';

export class Enemy extends Actor {
  private target: Player;
  private AGRESSOR_RADIUS = 500;
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    target: Player,
  ) {
    super(scene, x, y, "sprites");
    this.target = target;
    // ADD TO SCENE
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // PHYSICS MODEL
    this.getBody().setSize(16, 16);
    this.getBody().setOffset(0, 0);
  }


  public static initAnimations(scene: Scene): void {
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

}
  


  preUpdate(): void {
    if (
      Phaser.Math.Distance.BetweenPoints(
        { x: this.x, y: this.y },
        { x: this.target.x, y: this.target.y },
      ) < this.AGRESSOR_RADIUS
    ) {
      this.getBody().setVelocityX(this.target.x - this.x);
      this.getBody().setVelocityY(this.target.y - this.y);
    } else {
      this.getBody().setVelocity(0);
    }
  }
  public setTarget(target: Player): void {
    this.target = target;
  }
}