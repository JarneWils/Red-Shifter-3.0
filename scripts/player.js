import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { ControlPanel } from './controlPanel.js';

import * as THREE from 'three';

export class Player {
  constructor(camera, renderer, worldSize = 100, scene, world) {
    this.camera = camera;
    this.controls = new PointerLockControls(camera, renderer.domElement);

    this.world = world;

    this.enabled = false;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    this.playerHeight = 1.5;
    this.playerWidth = 0.5;
    this.wireframe = false;

    this.controlsPanel = new ControlPanel();
    this.controlsPanel.startListening();

    this.jumpSpeed = 12;
    this.canJump = false;
    this.gravity = 40;
    this.speed = 8;

    this.worldSize = worldSize;

    // Maak hier de player cube aan en voeg toe aan de scene
    this.playerMesh = this.createPlayerMesh();
    if (scene) {
      scene.add(this.playerMesh);
    }
  }

  createPlayerMesh() {
    const geometry = new THREE.BoxGeometry(this.playerWidth, this.playerHeight, this.playerWidth); // 1 breed, 1.8 hoog, 1 diep
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: this.wireframe,
    });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  enable() {
    this.controls.lock();
    this.enabled = true;
  }

  disable() {
    this.controls.unlock();
    this.enabled = false;
  }

  update(delta) {
    if (!this.enabled) return;

    this.velocity.x = 0;
    this.velocity.z = 0;

    this.direction.set(0, 0, 0);
    if (this.controlsPanel.moveForward) this.direction.z += 1; // forward = -z
    if (this.controlsPanel.moveBackward) this.direction.z -= 1;
    if (this.controlsPanel.moveLeft) this.direction.x -= 1;
    if (this.controlsPanel.moveRight) this.direction.x += 1;
    this.direction.normalize();

    this.velocity.x = this.direction.x * this.speed;
    this.velocity.z = this.direction.z * this.speed;

    const position = this.controls.object.position;

    this.controls.moveRight(this.velocity.x * delta);
    this.controls.moveForward(this.velocity.z * delta);

    // SPRINGEN: als jump ingedrukt én kan springen, geef verticale velocity
    if (this.controlsPanel.jump && this.canJump) {
      this.velocity.y = this.jumpSpeed;
      this.canJump = false;
    }

    // Gravity toepassen
    this.velocity.y -= this.gravity * delta;

    // Verticale positie updaten
    position.y += this.velocity.y * delta;

    // --- COLLISIONS ---

    const halfWidth = this.playerWidth / 2;
    const halfDepth = this.playerWidth / 2;

    let playerMinX = position.x - halfWidth;
    let playerMaxX = position.x + halfWidth;
    let playerMinY = position.y - this.playerHeight;
    let playerMaxY = position.y;
    let playerMinZ = position.z - halfDepth;
    let playerMaxZ = position.z + halfDepth;

    const minX = Math.floor(playerMinX);
    const maxX = Math.floor(playerMaxX);
    const minY = Math.floor(playerMinY);
    const maxY = Math.floor(playerMaxY);
    const minZ = Math.floor(playerMinZ);
    const maxZ = Math.floor(playerMaxZ);

    let onGround = false;

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const block = this.world.getBlock(x, y, z);
          if (!block || block.id === 0) continue;

          const blockMinX = x;
          const blockMaxX = x + 1;
          const blockMinY = y;
          const blockMaxY = y + 1;
          const blockMinZ = z;
          const blockMaxZ = z + 1;

          const overlapX = playerMaxX > blockMinX && playerMinX < blockMaxX;
          const overlapY = playerMaxY > blockMinY && playerMinY < blockMaxY;
          const overlapZ = playerMaxZ > blockMinZ && playerMinZ < blockMaxZ;

          if (overlapX && overlapY && overlapZ) {
            const overlapLeft = playerMaxX - blockMinX;
            const overlapRight = blockMaxX - playerMinX;
            const overlapDown = playerMaxY - blockMinY;
            const overlapUp = blockMaxY - playerMinY;
            const overlapFront = playerMaxZ - blockMinZ;
            const overlapBack = blockMaxZ - playerMinZ;

            const overlaps = [
              { axis: 'x', amount: overlapLeft, dir: -1 },
              { axis: 'x', amount: overlapRight, dir: 1 },
              { axis: 'y', amount: overlapDown, dir: -1 },
              { axis: 'y', amount: overlapUp, dir: 1 },
              { axis: 'z', amount: overlapFront, dir: -1 },
              { axis: 'z', amount: overlapBack, dir: 1 },
            ].filter(o => o.amount > 0);

            overlaps.sort((a, b) => a.amount - b.amount);

            const smallest = overlaps[0];

            switch (smallest.axis) {
              case 'x':
                position.x += smallest.amount * smallest.dir;
                this.velocity.x = 0;
                break;
              case 'y':
                position.y += smallest.amount * smallest.dir;
                this.velocity.y = 0;
                if (smallest.dir === 1) {
                  onGround = true;
                }
                break;
              case 'z':
                position.z += smallest.amount * smallest.dir;
                this.velocity.z = 0;
                break;
            }

            // bbox updaten na correctie
            playerMinX = position.x - halfWidth;
            playerMaxX = position.x + halfWidth;
            playerMinY = position.y - this.playerHeight;
            playerMaxY = position.y;
            playerMinZ = position.z - halfDepth;
            playerMaxZ = position.z + halfDepth;
          }
        }
      }
    }

    this.canJump = onGround;

    // Binnen wereldlimieten houden
    position.x = Math.max(0.5, Math.min(position.x, this.worldSize - 0.5));
    position.z = Math.max(0.5, Math.min(position.z, this.worldSize - 0.5));
    // Y-limiet kan je zelf toevoegen indien nodig

    // Player mesh updaten
    if (this.playerMesh) {
      this.playerMesh.position.set(
        position.x,
        position.y - this.playerHeight / 2 + 0.2,
        position.z
      );

      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      euler.setFromQuaternion(this.controls.object.quaternion);

      this.playerMesh.rotation.set(0, euler.y, 0);
    }
  }
  getControls() {
    return this.controls;
  }
}
