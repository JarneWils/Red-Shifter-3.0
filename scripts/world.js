import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { RNG } from './rng';

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x55dd22 });

export class World extends THREE.Group {
  /**
   * @type {{
   * id: number,
   * instanceId: number
   * }[][][]}
   */
  data = [];

  params = {
    seed: 0,
    terrain: {
      scale: 30,
      magnitude: 0.4,
      offset: 0.15,
    },
  };

  constructor(size = { width: 128, height: 32 }) {
    super();
    this.size = size;
  }

  /**
   * generate alles
   */
  generate() {
    this.initializeTerrain();
    this.generateTerrain();
    this.generateMeshes();
  }

  /**
   * initialize terrain data
   */
  initializeTerrain() {
    this.data = [];
    for (let x = 0; x < this.size.width; x++) {
      const slice = [];
      for (let y = 0; y < this.size.height; y++) {
        const row = [];
        for (let z = 0; z < this.size.width; z++) {
          row.push({
            id: 0,
            instanceId: null,
          });
        }
        slice.push(row);
      }
      this.data.push(slice);
    }
  }

  /**
   * generate terrain data for the world
   */
  generateTerrain() {
    const rng = new RNG(this.params.seed);
    const simplex = new SimplexNoise(rng);
    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        // bereken de hoeveelheid noise voor x en z
        const value = simplex.noise(x / this.params.terrain.scale, z / this.params.terrain.scale);

        // scale de noise op basis van offset en magnitude
        const scaledNoise = this.params.terrain.offset + this.params.terrain.magnitude * value;

        // bereken de hoogte van de wereld voor x en z
        let height = Math.floor(this.size.height * scaledNoise);

        // hou de hoogte tussen 0 en de maximum hoogte
        height = Math.max(1, Math.min(height, this.size.height - 1));

        for (let y = 0; y < height; y++) {
          this.setBlockId(x, y, z, 1);
        }
      }
    }
  }

  /**
   * generate 3D meshes
   */
  generateMeshes() {
    this.clear();
    const maxCount = this.size.width * this.size.width * this.size.height;
    const mesh = new THREE.InstancedMesh(geometry, material, maxCount);
    mesh.count = 0;

    const matrix = new THREE.Matrix4();
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++)
        for (let z = 0; z < this.size.width; z++) {
          const blockId = this.getBlock(x, y, z).id;
          const instanceId = mesh.count;
          if (blockId !== 0) {
            matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);
            mesh.setMatrixAt(instanceId, matrix);
            this.setBlockInstanceId(x, y, z, instanceId);
            mesh.count++;
          }
        }
    }

    this.add(mesh);
  }

  //--------------------------------------------------------------------------------
  //------------------------------------ Helper Functions --------------------------
  //--------------------------------------------------------------------------------

  /**
   * verkrijg de data van elke blok per positie
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{id: number, instanceId: number}} instanceId
   */
  getBlock(x, y, z) {
    if (this.inBounds(x, y, z) === true) {
      return this.data[x][y][z];
    } else {
      return null;
    }
  }

  /**
   * geef elke blok een id die het typen bepaalt
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} id
   */
  setBlockId(x, y, z, id) {
    if (this.inBounds(x, y, z) === true) {
      this.data[x][y][z].id = id;
    }
  }

  /**
   * geef de blok een instance id afhankelijk van zijn positie
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} instanceId
   */
  setBlockInstanceId(x, y, z, instanceId) {
    if (this.inBounds(x, y, z) === true) {
      this.data[x][y][z].instanceId = instanceId;
    }
  }

  /**
   * kijk of de mesh in de wereld staat
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  inBounds(x, y, z) {
    if (
      x >= 0 &&
      x < this.size.width &&
      y >= 0 &&
      y < this.size.height &&
      z >= 0 &&
      z < this.size.width
    ) {
      return true;
    } else {
      return false;
    }
  }
}
