import * as THREE from 'three';

export class GunManager {
  constructor(camera, scene, controlPanel, socket, playerId, world, players) {
    this.controlPanel = controlPanel;
    this.camera = camera;
    this.scene = scene;
    this.bullets = [];
    this.remoteBullets = [];
    this.raycaster = new THREE.Raycaster();
    this.active = false;

    this.world = world;
    this.players = players;

    this.socket = socket;
    this.playerId = playerId;

    this._boundShoot = this.shoot.bind(this);

    this.socket.on('bulletFired', data => {
      if (data.id === this.playerId) return;

      const origin = new THREE.Vector3(data.origin.x, data.origin.y, data.origin.z);
      const direction = new THREE.Vector3(data.direction.x, data.direction.y, data.direction.z);

      this.spawnBullet(origin, direction, true);
    });
  }

  setActive(isActive) {
    if (this.active === isActive) return;
    this.active = isActive;

    if (isActive) {
      document.addEventListener('mousedown', this._boundShoot);
    } else {
      document.removeEventListener('mousedown', this._boundShoot);
    }
  }

  spawnBullet(origin, direction, isRemote = false) {
    const geometry = new THREE.SphereGeometry(0.03, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: isRemote ? 0xff0000 : 0xffffff });
    const bullet = new THREE.Mesh(geometry, material);

    bullet.position.copy(origin);
    bullet.userData.velocity = direction.clone().multiplyScalar(40);

    this.scene.add(bullet);

    if (isRemote) {
      this.remoteBullets.push(bullet);
    } else {
      this.bullets.push(bullet);
    }
  }

  shoot() {
    if (!this.active || !this.controlPanel?.gun) return;

    const center = new THREE.Vector2(0, 0);
    this.raycaster.setFromCamera(center, this.camera);

    const direction = this.raycaster.ray.direction.clone();
    const origin = this.raycaster.ray.origin.clone();

    this.socket.emit('shootBullet', {
      id: this.playerId,
      origin: origin,
      direction: direction,
    });

    this.spawnBullet(origin, direction);
  }

  checkCollision(bullet) {
    const pos = bullet.position.clone();
    const x = Math.floor(pos.x);
    const y = Math.floor(pos.y);
    const z = Math.floor(pos.z);

    const block = this.world.getBlock(x, y, z);
    if (!block) return false;

    // Alleen verwijderen als het GEEN empty block is
    return block.id !== 0; // assuming 0 is empty.id
  }

  checkPlayerCollision(bullet) {
    for (let player of this.players) {
      if (player.id === this.playerId) continue; // sla jezelf over

      const playerPos = player.mesh.position;
      const distance = bullet.position.distanceTo(playerPos);

      if (distance < 1) {
        this.scene.remove(bullet);
        console.log('bullet removed');
        console.log('damage -1');
        return true;
      }
    }

    return false;
  }

  updateBulletList(list, delta) {
    for (let i = list.length - 1; i >= 0; i--) {
      const bullet = list[i];
      bullet.position.add(bullet.userData.velocity.clone().multiplyScalar(delta));

      if (bullet.position.length() > 100 || this.checkCollision(bullet)) {
        this.scene.remove(bullet);
        console.log('bullet removed');
        list.splice(i, 1);
      }
    }
  }

  update(delta) {
    this.updateBulletList(this.remoteBullets, delta);

    if (!this.active || !this.controlPanel?.gun) return;

    this.updateBulletList(this.bullets, delta);
  }
}
