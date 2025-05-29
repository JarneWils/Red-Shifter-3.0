export class ControlPanel {
  constructor() {
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.jump = false;

    this.weapons = ['gun', 'block'];
    this.selectedWeaponIndex = 0;

    this.gun = false;
    this.block = false;

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onWheel = this._onWheel.bind(this);
  }

  startListening() {
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('wheel', this._onWheel);
  }

  stopListening() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('wheel', this._onWheel);
  }

  _selectWeapon(index) {
    this.selectedWeaponIndex = index;

    this.gun = index === 0;
    this.block = index === 1;
  }

  _onWheel(event) {
    const direction = Math.sign(event.deltaY); // 1 = scroll naar beneden, -1 = omhoog
    let newIndex = this.selectedWeaponIndex + direction;

    if (newIndex < 0) newIndex = this.weapons.length - 1;
    if (newIndex >= this.weapons.length) newIndex = 0;

    this._selectWeapon(newIndex);
  }

  _onKeyDown(event) {
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
        this.jump = true;
        break;
    }

    switch (event.key) {
      case '1':
      case '&':
        this._selectWeapon(0);
        break;
      case '2':
      case 'é':
        this._selectWeapon(1);
        break;
    }
  }

  _onKeyUp(event) {
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
      case 'Space':
        this.jump = false;
        break;
    }
  }
}
