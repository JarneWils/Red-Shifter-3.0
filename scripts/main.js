import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { World } from './world';

/**
 * Parameters
 */
const worldSize = 32;
const worldCenter = worldSize / 2;

// render
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xccddff);
document.body.appendChild(renderer.domElement);

// camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
camera.position.set(0, worldCenter, 0);

// controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(worldCenter, 0, worldCenter);
controls.rotateSpeed = 0.6;
controls.update();

// scene
const scene = new THREE.Scene();
const world = new World();
world.generate();
scene.add(world);

// lights
function setupLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight1.position.set(-2, 1, 2);
  directionalLight1.lookAt(0, 0, 0);
  scene.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight2.position.set(0, 3, 0);
  directionalLight2.lookAt(0, 0, 0);
  scene.add(directionalLight2);
}

//loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

setupLights();
animate();
