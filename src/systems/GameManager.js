import * as THREE from 'three';
import { EyeballEnemy } from '../components/Enemy.js';

export class GameManager {
    constructor(player, physicsWorld, environment) {
        this.player = player;
        this.physicsWorld = physicsWorld;
        this.environment = environment;

        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
        this.isPaused = false;
        this.isGameOver = false;

        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 3;

        this.ui = this.createUI();
        this.setupInput();
    }

    createUI() {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);

        // Score
        const scoreEl = document.createElement('div');
        scoreEl.style.position = 'absolute';
        scoreEl.style.top = '20px';
        scoreEl.style.right = '20px';
        scoreEl.style.color = '#00ffff';
        scoreEl.style.fontFamily = 'Arial, sans-serif';
        scoreEl.style.fontSize = '24px';
        scoreEl.style.fontWeight = 'bold';
        scoreEl.innerText = `Score: 0 | High Score: ${this.highScore}`;
        container.appendChild(scoreEl);

        // Pause Overlay
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
        container.appendChild(pauseOverlay);

        // Game Over Overlay
        const gameOverOverlay = document.createElement('div');
        gameOverOverlay.style.position = 'absolute';
        gameOverOverlay.style.top = '50%';
        gameOverOverlay.style.left = '50%';
        gameOverOverlay.style.transform = 'translate(-50%, -50%)';
        gameOverOverlay.style.textAlign = 'center';
        gameOverOverlay.style.display = 'none';
        gameOverOverlay.style.pointerEvents = 'auto'; // Enable clicking buttons
        gameOverOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        gameOverOverlay.style.padding = '40px';
        gameOverOverlay.style.borderRadius = '20px';
        gameOverOverlay.style.border = '2px solid #00ffff';
        container.appendChild(gameOverOverlay);

        const gameOverTitle = document.createElement('h1');
        gameOverTitle.innerText = 'GAME OVER';
        gameOverTitle.style.color = '#ff0000';
        gameOverTitle.style.fontFamily = 'Arial, sans-serif';
        gameOverTitle.style.fontSize = '64px';
        gameOverTitle.style.margin = '0 0 20px 0';
        gameOverOverlay.appendChild(gameOverTitle);

        const finalScore = document.createElement('div');
        finalScore.style.color = 'white';
        finalScore.style.fontFamily = 'Arial, sans-serif';
        finalScore.style.fontSize = '32px';
        finalScore.style.marginBottom = '30px';
        gameOverOverlay.appendChild(finalScore);

        const restartBtn = document.createElement('button');
        restartBtn.innerText = 'RESTART';
        restartBtn.style.padding = '15px 40px';
        restartBtn.style.fontSize = '24px';
        restartBtn.style.backgroundColor = '#00ffff';
        restartBtn.style.border = 'none';
        restartBtn.style.borderRadius = '5px';
        restartBtn.style.cursor = 'pointer';
        restartBtn.style.fontWeight = 'bold';
        restartBtn.onclick = () => this.restartGame();
        gameOverOverlay.appendChild(restartBtn);

        // Instructions
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
        container.appendChild(instructions);

        return {
            container,
            score: scoreEl,
            pause: pauseOverlay,
            gameOver: gameOverOverlay,
            finalScore: finalScore,
            instructions: instructions
        };
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyP' && !this.isGameOver) {
                this.togglePause();
            }
        });

        document.addEventListener('click', () => {
            if (!this.isPaused && !this.isGameOver) {
                this.ui.instructions.style.display = 'none';
                this.player.controls.lock();
            }
        });

        this.player.controls.addEventListener('unlock', () => {
            if (!this.isPaused && !this.isGameOver) {
                this.ui.instructions.style.display = 'block';
            }
        });
    }

    addScore(points) {
        this.score += points;
        this.updateScoreUI();
    }

    updateScoreUI() {
        this.ui.score.innerText = `Score: ${this.score} | High Score: ${this.highScore}`;
    }

    togglePause() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.ui.pause.style.display = 'block';
            document.exitPointerLock();
        } else {
            this.ui.pause.style.display = 'none';
            this.player.controls.lock();
        }
    }

    gameOver() {
        this.isGameOver = true;
        document.exitPointerLock();

        // Update High Score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }

        this.ui.finalScore.innerText = `Final Score: ${this.score}`;
        this.ui.gameOver.style.display = 'block';
        this.ui.instructions.style.display = 'none';
    }

    restartGame() {
        this.isGameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.updateScoreUI();

        this.ui.gameOver.style.display = 'none';
        this.ui.pause.style.display = 'none';

        // Reset Player
        this.player.reset();

        // Clear Enemies
        this.enemies.forEach(enemy => enemy.die(true)); // true = force cleanup without effects if needed
        this.enemies = [];

        this.player.controls.lock();
    }

    spawnEnemy() {
        if (this.enemies.length < 10) {
            const enemy = new EyeballEnemy(this.environment.scene, this.physicsWorld.world, this.player.body, (deadEnemy) => {
                // Remove from array
                const index = this.enemies.indexOf(deadEnemy);
                if (index > -1) {
                    this.enemies.splice(index, 1);
                }
                // Add Score
                this.addScore(100);

                // Spawn a new one immediately to keep the chaos
                this.spawnEnemy();
            }, (amount) => this.player.takeDamage(amount));

            this.enemies.push(enemy);
            this.physicsWorld.addBody(enemy.body);
        }
    }

    update(dt) {
        if (this.isPaused || this.isGameOver) return;

        // Enemy Spawning
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }

        this.enemies.forEach(enemy => enemy.update(dt));
    }
}
