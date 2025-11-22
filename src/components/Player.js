import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

export class Player {
    constructor(camera, domElement, physicsWorld) {
        this.camera = camera;
        this.physicsWorld = physicsWorld;

        this.controls = new PointerLockControls(camera, domElement);

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
        this.physicsWorld.addBody(this.body);

        // Input state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;

        this.setupInput();
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
