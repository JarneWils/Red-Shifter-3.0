import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import * as THREE from 'three';

export class Player {
  constructor(camera, renderer, worldSize = 100, scene) {
    this.camera = camera;
    this.controls = new PointerLockControls(camera, renderer.domElement);

    this.enabled = false;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.jumpSpeed = 12;
    this.canJump = false;
    this.gravity = 40;
    this.speed = 10;

    this.worldSize = worldSize;

    // Maak hier de player cube aan en voeg toe aan de scene
    this.playerMesh = this.createPlayerMesh();
    if (scene) {
      scene.add(this.playerMesh);
    }

    this.setupEvents();
  }

  createPlayerMesh() {
    const geometry = new THREE.BoxGeometry(1, 1.8, 1); // 1 breed, 2 hoog, 1 diep
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true, // kan je weghalen als je 'm vol wilt
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Positioneer cube zo dat onderkant op vloerY ligt (hier 1.5)
    return mesh;
  }

  setupEvents() {
    const onKeyDown = event => {
      event.preventDefault();

      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.moveForward = true;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft = true;
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.moveBackward = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.moveRight = true;
          break;
        case 'Space':
          if (this.canJump) {
            this.velocity.y = this.jumpSpeed;
            this.canJump = false;
          }
          break;
      }
    };

    const onKeyUp = event => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.moveForward = false;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.moveBackward = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.moveRight = false;
          break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
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

    // Reset horizontale snelheid
    this.velocity.x = 0;
    this.velocity.z = 0;

    // Richting bepalen op basis van toetsen
    this.direction.set(0, 0, 0);
    if (this.moveForward) this.direction.z += 1;
    if (this.moveBackward) this.direction.z -= 1;
    if (this.moveLeft) this.direction.x -= 1;
    if (this.moveRight) this.direction.x += 1;

    this.direction.normalize();

    // Horizontale beweging toepassen
    this.velocity.x = this.direction.x * this.speed;
    this.velocity.z = this.direction.z * this.speed;

    // Zwaartekracht toepassen (verticale snelheid aanpassen)
    this.velocity.y -= this.gravity * delta;

    // Huidige positie van speler
    const position = this.controls.object.position;

    // --- BEWEGING TOEPASSEN ---

    // Horizontaal bewegen via controls (forward, right)
    this.controls.moveRight(this.velocity.x * delta);
    this.controls.moveForward(this.velocity.z * delta);

    // Verticaal positie bijwerken op basis van verticale snelheid
    position.y += this.velocity.y * delta;

    // Vloer collision detectie
    const floorY = 3.5;
    const epsilon = 0.05;
    if (position.y <= floorY + epsilon) {
      this.velocity.y = 0;
      position.y = floorY;
      this.canJump = true;
    }

    // Wereldgrenzen toepassen om buiten kaart te voorkomen
    position.x = Math.max(0.5, Math.min(position.x, this.worldSize - 0.5));
    position.z = Math.max(0.5, Math.min(position.z, this.worldSize - 0.5));

    // --- SYNCHRONISEER PLAYER CUBE MET CAMERA ---

    if (this.playerMesh) {
      // Positioneer de cube zo dat z’n onderkant op vloerY ligt
      this.playerMesh.position.set(
        position.x,
        position.y - 0.5, // camera zit op ~1.5m, cube is 2 hoog, dus +0.5 om midden cube gelijk te zetten met controls
        position.z
      );

      // Alleen Y-rotatie synchroniseren, zodat cube draait met camera horizontaal
      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      euler.setFromQuaternion(this.controls.getObject().quaternion);

      this.playerMesh.rotation.set(0, euler.y, 0);
    }
  }

  getControls() {
    return this.controls;
  }
}
