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
    });
    enemies.push(enemy);
    physics.addBody(enemy.body);
  }
}

setInterval(spawnEnemy, 3000);

function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();

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
instructions.innerHTML = 'Click to Play<br>WASD to Move<br>Click to Shoot';
document.body.appendChild(instructions);

document.addEventListener('click', () => {
  instructions.style.display = 'none';
});

// Show instructions again if unlocked
player.controls.addEventListener('unlock', () => {
  instructions.style.display = 'block';
});
