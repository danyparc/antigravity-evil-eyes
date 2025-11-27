import { Environment } from './world/Environment.js';
import { Physics } from './world/Physics.js';
import { Player } from './components/Player.js';
import { EyeballEnemy } from './components/Enemy.js';
import { Weapon } from './components/Weapon.js';
import * as THREE from 'three';

const environment = new Environment();
const physics = new Physics();
const player = new Player(environment.camera, document.body, physics.world);
const weapon = new Weapon(environment.scene, environment.camera, physics.world);

const enemies = [];
const clock = new THREE.Clock();

// Game State
let isPaused = false;
let spawnTimer = 0;
const spawnInterval = 3; // Seconds

// Spawn enemies periodically
function spawnEnemy() {
  if (enemies.length < 10) {
    const enemy = new EyeballEnemy(environment.scene, physics.world, player.body, (deadEnemy) => {
      // Remove from array
      const index = enemies.indexOf(deadEnemy);
      if (index > -1) {
        enemies.splice(index, 1);
      }
      // Spawn a new one immediately to keep the chaos
      spawnEnemy();
    }, (amount) => player.takeDamage(amount));
    enemies.push(enemy);
    physics.addBody(enemy.body);
  }
}

// Pause UI
const pauseOverlay = document.createElement('div');
pauseOverlay.style.position = 'absolute';
pauseOverlay.style.top = '50%';
pauseOverlay.style.left = '50%';
pauseOverlay.style.transform = 'translate(-50%, -50%)';
pauseOverlay.style.color = 'white';
pauseOverlay.style.fontFamily = 'Arial, sans-serif';
pauseOverlay.style.fontSize = '48px';
pauseOverlay.style.fontWeight = 'bold';
pauseOverlay.style.textShadow = '0 0 10px #00ffff';
pauseOverlay.style.display = 'none';
pauseOverlay.innerText = 'PAUSED';
document.body.appendChild(pauseOverlay);

function togglePause() {
  isPaused = !isPaused;

  if (isPaused) {
    pauseOverlay.style.display = 'block';
    document.exitPointerLock();
    clock.stop(); // Stop clock so delta time doesn't accumulate huge value
  } else {
    pauseOverlay.style.display = 'none';
    player.controls.lock();
    clock.start();
  }
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyP') {
    togglePause();
  }
});

function animate() {
  requestAnimationFrame(animate);

  if (isPaused) return;

  const dt = clock.getDelta();

  // Enemy Spawning Logic
  spawnTimer += dt;
  if (spawnTimer >= spawnInterval) {
    spawnEnemy();
    spawnTimer = 0;
  }

  physics.update(dt);
  player.update(dt);
  weapon.update();

  enemies.forEach(enemy => enemy.update(dt));

  environment.render();
}

animate();

// Instructions overlay
const instructions = document.createElement('div');
instructions.style.position = 'absolute';
instructions.style.top = '50%';
instructions.style.left = '50%';
instructions.style.transform = 'translate(-50%, -50%)';
instructions.style.color = 'white';
instructions.style.fontFamily = 'Arial, sans-serif';
instructions.style.fontSize = '24px';
instructions.style.textAlign = 'center';
instructions.style.pointerEvents = 'none';
instructions.innerHTML = 'Click to Play<br>WASD to Move<br>Click to Shoot<br>P to Pause';
document.body.appendChild(instructions);

document.addEventListener('click', () => {
  if (!isPaused) {
    instructions.style.display = 'none';
  }
});

// Show instructions again if unlocked and NOT paused
player.controls.addEventListener('unlock', () => {
  if (!isPaused) {
    instructions.style.display = 'block';
  }
});
