import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

export class Player {
    constructor(camera, domElement, physicsWorld) {
        this.camera = camera;
        this.physicsWorld = physicsWorld;

        this.controls = new PointerLockControls(camera, domElement);

        this.health = 100;
        this.createHealthUI();

        // Physics Body
        const radius = 0.5;
        this.shape = new CANNON.Sphere(radius);
        this.body = new CANNON.Body({
            mass: 1, // Dynamic body
            position: new CANNON.Vec3(0, 2, 0),
            shape: this.shape,
            material: new CANNON.Material({ friction: 0.0, restitution: 0.0 }) // Low friction for smooth movement
        });
        this.body.linearDamping = 0.9; // Simulate air resistance/drag for "floaty" feel
        this.body.userData = { isPlayer: true }; // Tag for collision
        this.physicsWorld.addBody(this.body);

        this.body.addEventListener('collide', (e) => {
            if (e.body.userData && e.body.userData.isEnemy) {
                this.takeDamage(10);
            }
        });

        // Input state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;

        this.setupInput();
    }

    createHealthUI() {
        const healthContainer = document.createElement('div');
        healthContainer.style.position = 'absolute';
        healthContainer.style.top = '20px';
        healthContainer.style.left = '20px';
        healthContainer.style.width = '200px';
        healthContainer.style.height = '20px';
        healthContainer.style.backgroundColor = '#333';
        healthContainer.style.border = '2px solid #fff';
        document.body.appendChild(healthContainer);

        this.healthBar = document.createElement('div');
        this.healthBar.style.width = '100%';
        this.healthBar.style.height = '100%';
        this.healthBar.style.backgroundColor = '#00ff00';
        this.healthBar.style.transition = 'width 0.2s';
        healthContainer.appendChild(this.healthBar);

        // Health Text
        this.healthText = document.createElement('div');
        this.healthText.style.position = 'absolute';
        this.healthText.style.top = '20px';
        this.healthText.style.left = '230px'; // To the right of the bar
        this.healthText.style.color = '#00ff00';
        this.healthText.style.fontFamily = 'Arial, sans-serif';
        this.healthText.style.fontSize = '20px';
        this.healthText.style.fontWeight = 'bold';
        this.healthText.innerText = '100%';
        document.body.appendChild(this.healthText);

        // Crosshair
        const crosshair = document.createElement('div');
        crosshair.style.position = 'absolute';
        crosshair.style.top = '50%';
        crosshair.style.left = '50%';
        crosshair.style.width = '20px';
        crosshair.style.height = '20px';
        crosshair.style.border = '2px solid rgba(0, 255, 255, 0.8)';
        crosshair.style.borderRadius = '50%';
        crosshair.style.transform = 'translate(-50%, -50%)';
        crosshair.style.pointerEvents = 'none';

        // Center dot
        const dot = document.createElement('div');
        dot.style.position = 'absolute';
        dot.style.top = '50%';
        dot.style.left = '50%';
        dot.style.width = '4px';
        dot.style.height = '4px';
        dot.style.backgroundColor = 'rgba(0, 255, 255, 1)';
        dot.style.borderRadius = '50%';
        dot.style.transform = 'translate(-50%, -50%)';
        crosshair.appendChild(dot);

        document.body.appendChild(crosshair);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;

        this.healthBar.style.width = `${this.health}%`;
        this.healthText.innerText = `${this.health}%`;

        // Flash red
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        overlay.style.pointerEvents = 'none';
        document.body.appendChild(overlay);
        setTimeout(() => overlay.remove(), 100);

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        console.log("Player died");
        // Simple game over for now
        document.exitPointerLock();
        alert("GAME OVER! Reload to restart.");
        location.reload();
    }

    setupInput() {
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        document.addEventListener('click', () => {
            this.controls.lock();
        });
    }

    onKeyDown(event) {
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
                if (this.canJump) {
                    this.body.velocity.y = 5; // Jump impulse
                    this.canJump = false;
                }
                break;
        }
    }

    onKeyUp(event) {
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
        }
    }

    update(dt) {
        if (this.controls.isLocked) {
            // Calculate movement direction based on camera look direction
            const inputVector = new THREE.Vector3(0, 0, 0);
            if (this.moveForward) inputVector.z -= 1;
            if (this.moveBackward) inputVector.z += 1;
            if (this.moveLeft) inputVector.x -= 1;
            if (this.moveRight) inputVector.x += 1;

            // Normalize input
            if (inputVector.length() > 0) inputVector.normalize();

            // Get camera direction (ignoring Y for movement on plane)
            const direction = new THREE.Vector3();
            this.camera.getWorldDirection(direction);
            direction.y = 0;
            direction.normalize();

            const right = new THREE.Vector3();
            right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize(); // Right vector

            // Calculate force vector
            const force = new THREE.Vector3();
            force.addScaledVector(direction, -inputVector.z); // Forward/Back
            force.addScaledVector(right, inputVector.x); // Left/Right

            // Apply force to body
            const speed = 15;
            this.body.applyForce(new CANNON.Vec3(force.x * speed, 0, force.z * speed), this.body.position);
        }

        // Sync camera to physics body
        this.camera.position.copy(this.body.position);

        // Simple ground check (raycasting would be better but checking Y is simple for flat floor)
        if (this.body.position.y <= 0.6) { // Radius + small buffer
            this.canJump = true;
        }
    }
}
