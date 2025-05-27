import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { World } from './world';
import { createUI } from './ui';
import { Player } from './player';

const skyColor = 'rgb(15, 25, 30)';
const fogColor = 'rgb(15, 25, 30)';

const stats = new Stats();
document.body.append(stats.dom);

// render
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(skyColor);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// camera
const playerCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
playerCamera.position.set(20, 10, 20);

// Orbit camera
const orbitCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
orbitCamera.position.set(20, 10, 20);

// scene
const scene = new THREE.Scene();
const world = new World();
world.generate();
scene.add(world);

// Fog
let isFog = true;
if (isFog === true) {
  scene.fog = new THREE.Fog(fogColor, 5, 40);
}

// controls
const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.target.set(50, 0, 50);
controls.rotateSpeed = 0.6;
controls.update();

const player = new Player(playerCamera, renderer, world.size.width, scene, world);
scene.add(player.controls.object);

let usingFirstPerson = false;

document.addEventListener('keydown', e => {
  if (e.code === 'KeyP') {
    usingFirstPerson = !usingFirstPerson;

    if (usingFirstPerson) {
      player.enable();
      controls.enabled = false;
      currentCamera = playerCamera;
    } else {
      player.disable();
      controls.enabled = true;
      currentCamera = orbitCamera;
    }
  }
});

// lights
function setupLights() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.position.set(world.size.width, 100, world.size.width);
  sun.castShadow = true;
  sun.shadow.camera.top = 100;
  sun.shadow.camera.bottom = -100;
  sun.shadow.camera.left = -100;
  sun.shadow.camera.right = 100;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 220;
  sun.shadow.bias = -0.001;
  sun.shadow.mapSize = new THREE.Vector2(512, 512);
  scene.add(sun);

  const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);
  scene.add(shadowHelper);
}

//Loop
let clock = new THREE.Clock();
let currentCamera = orbitCamera; // begin met orbit
const cameraHelper = new THREE.CameraHelper(playerCamera);
scene.add(cameraHelper);

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  stats.update();

  if (usingFirstPerson) {
    player.update(delta);
  } else {
    controls.update(); // alleen nodig bij orbit controls
  }

  cameraHelper.update(); // cameraHelper volgt altijd playerCamera

  renderer.render(scene, currentCamera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

setupLights();
// createUI(world);
animate();
