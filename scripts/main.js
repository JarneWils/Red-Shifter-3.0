import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { World } from './world';
// import { createUI } from './ui';
import { Player } from './player';
import { io } from 'socket.io-client';
import { ControlPanel } from './controlPanel';
import { GunManager } from './gunManager.js';

const controlPanel = new ControlPanel();
controlPanel.startListening();

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------SERVER------------------------------------------
//-------------------------------------------------------------------------------------------------

const socket = io(import.meta.env.PROD ? undefined : 'http://localhost:3000');

let localPlayerId = null;
let lastGunActiveState = false;
let gunManager = null;

// players
let player = null;
socket.on('connect', () => {
  socket.on('currentPlayers', players => {
    for (const id in players) {
      if (id !== localPlayerId) {
        Player.addRemotePlayer(id, scene);
      }
    }
  });

  localPlayerId = socket.id;
  player = new Player(
    playerCamera,
    renderer,
    world.size.width,
    scene,
    world,
    localPlayerId,
    socket
  );

  scene.add(player.controls.object);
  gunManager = new GunManager(playerCamera, scene, controlPanel, socket, localPlayerId, world);

  socket.on('bulletFired', data => {
    console.log('⛳ bulletFired binnen:', data, 'local:', localPlayerId);
    if (!gunManager || data.id === localPlayerId) return;

    gunManager.spawnBullet(
      new THREE.Vector3(data.origin.x, data.origin.y, data.origin.z),
      new THREE.Vector3(data.direction.x, data.direction.y, data.direction.z),
      true
    );
  });

  animate();
});

socket.on('newPlayer', playerData => {
  Player.addRemotePlayer(playerData.id, scene);
});

socket.on('playerMoved', data => {
  Player.updateRemotePlayer(data.id, data);
});

socket.on('playerDisconnected', id => {
  Player.removeRemotePlayer(id, scene);
});

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------Main Script-------------------------------------
//-------------------------------------------------------------------------------------------------

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
  scene.fog = new THREE.Fog(fogColor, 10, 40);
}

// controls
const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.target.set(50, 0, 50);
controls.rotateSpeed = 0.6;
controls.update();

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

  const sun = new THREE.DirectionalLight(0xffffff, 3.5);
  sun.position.set(world.size.width - 20, 60, world.size.width);
  sun.castShadow = true;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -60;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 130;
  sun.shadow.bias = -0.001;
  sun.shadow.mapSize = new THREE.Vector2(512, 512);
  scene.add(sun);

  const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);
  scene.add(shadowHelper);
}

// Item selector
const items = document.querySelectorAll('.item');

function updateUI() {
  items.forEach((item, index) => {
    item.classList.remove('active');

    if ((index === 0 && controlPanel.gun) || (index === 1 && controlPanel.block)) {
      item.classList.add('active');
    }
  });
}

//Loop
let clock = new THREE.Clock();
let currentCamera = orbitCamera; // begin met orbit
const cameraHelper = new THREE.CameraHelper(playerCamera);
// scene.add(cameraHelper);

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  stats.update();

  if (usingFirstPerson) {
    player.update(delta);

    const shouldBeActive = controlPanel.gun;
    if (gunManager && shouldBeActive !== lastGunActiveState) {
      gunManager.setActive(shouldBeActive);
      lastGunActiveState = shouldBeActive;
    }
  } else {
    if (gunManager && lastGunActiveState) {
      gunManager.setActive(false);
      lastGunActiveState = false;
    }

    controls.update();
  }

  // 🚀 Altijd gunManager updaten
  if (gunManager) gunManager.update(delta);

  updateUI();
  cameraHelper.update();
  renderer.render(scene, currentCamera);
}

window.addEventListener('resize', () => {
  playerCamera.aspect = window.innerWidth / window.innerHeight;
  playerCamera.updateProjectionMatrix();

  orbitCamera.aspect = window.innerWidth / window.innerHeight;
  orbitCamera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

setupLights();
// createUI(world);
animate();
