import * as THREE from 'three';

export class GunManager {
  constructor(camera, scene, controlPanel) {
    this.controlPanel = controlPanel;
    this.camera = camera;
    this.scene = scene;
    this.bullets = [];
    this.raycaster = new THREE.Raycaster();
    this.active = false;

    this._boundShoot = this.shoot.bind(this); // voor makkelijk toevoegen/verwijderen
  }

  setActive(isActive) {
    if (this.active === isActive) return; // niets doen als geen verandering
    this.active = isActive;

    if (isActive) {
      document.addEventListener('mousedown', this._boundShoot);
    } else {
      document.removeEventListener('mousedown', this._boundShoot);
    }
  }

  shoot() {
    if (!this.active || !this.controlPanel?.gun) return;

    // Richting van het midden van het scherm
    const center = new THREE.Vector2(0, 0); // NDC midden van scherm
    this.raycaster.setFromCamera(center, this.camera);

    const direction = this.raycaster.ray.direction.clone();
    const origin = this.raycaster.ray.origin.clone();

    const geometry = new THREE.SphereGeometry(0.03, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const bullet = new THREE.Mesh(geometry, material);

    bullet.position.copy(origin);
    bullet.userData.velocity = direction.multiplyScalar(40); // snelheid

    this.scene.add(bullet);
    this.bullets.push(bullet);
  }

  update(delta) {
    if (!this.active || !this.controlPanel?.gun) return;

    this.bullets.forEach((bullet, index) => {
      bullet.position.add(bullet.userData.velocity.clone().multiplyScalar(delta));

      if (bullet.position.length() > 100) {
        this.scene.remove(bullet);
        this.bullets.splice(index, 1);
      }
    });
  }
}
