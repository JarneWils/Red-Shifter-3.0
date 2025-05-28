import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { World } from './world';
// import { createUI } from './ui';
import { Player } from './player';
import { io } from 'socket.io-client';

/**
 * server
 */
const socket = io('http://localhost:3000');

let localPlayerId = null;

// players
let player = null;

socket.on('connect', () => {
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

  animate();
});

socket.on('currentPlayers', playersData => {
  for (const id in playersData) {
    if (id === socket.id) continue;
    Player.addRemotePlayer(id, scene);
    Player.updateRemotePlayer(id, playersData[id]);
  }
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
  playerCamera.aspect = window.innerWidth / window.innerHeight;
  playerCamera.updateProjectionMatrix();

  orbitCamera.aspect = window.innerWidth / window.innerHeight;
  orbitCamera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

setupLights();
// createUI(world);
animate();
