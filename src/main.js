import { Environment } from './world/Environment.js';
import { Physics } from './world/Physics.js';
import { Player } from './components/Player.js';
import { Weapon } from './components/Weapon.js';
import { GameManager } from './systems/GameManager.js';
import * as THREE from 'three';

const environment = new Environment();
const physics = new Physics();
const player = new Player(environment.camera, document.body, physics.world);
const weapon = new Weapon(environment.scene, environment.camera, physics.world);

const gameManager = new GameManager(player, physics, environment);
player.setGameManager(gameManager);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();

  if (!gameManager.isPaused && !gameManager.isGameOver) {
    physics.update(dt);
    player.update(dt);
    weapon.update();
  }

  gameManager.update(dt);
  environment.render();
}

animate();
