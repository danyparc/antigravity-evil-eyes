import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { LightningBeam } from '../effects/LightningBeam.js';

export class EyeballEnemy {
    constructor(scene, physicsWorld, playerBody, onDeath, onDamagePlayer) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.playerBody = playerBody;
        this.onDeath = onDeath;
        this.onDamagePlayer = onDamagePlayer;
        this.health = 3;

        this.mesh = this.createMesh();
        this.body = this.createBody();

        this.scene.add(this.mesh);
        this.physicsWorld.addBody(this.body);

        // Add a point light to the enemy for "psychedelic" effect
        this.light = new THREE.PointLight(0xff0000, 1, 10);
        this.scene.add(this.light);

        // Lightning effect
        this.lightningBeam = new LightningBeam(this.scene);
        this.shootTimer = 0;
        this.shootInterval = 2 + Math.random() * 2; // Random interval between 2-4s

        // Attack States
        this.isCharging = false;
        this.chargeDuration = 1.0; // 1 second warning
        this.currentChargeTime = 0;

        this.isShooting = false;
        this.shootDuration = 0.2; // How long the flash lasts
        this.currentShootTime = 0;

        // Collision handling
        this.body.addEventListener('collide', (e) => {
            if (e.body.userData && e.body.userData.isProjectile) {
                this.takeDamage();
            }
        });
    }

    // ... (takeDamage, die, createMesh, createBody methods remain unchanged)
    // I will use replace_file_content on the update method specifically to avoid context issues if possible, 
    // but here I am replacing a large chunk. Let's target the update method specifically in a separate call or be very precise.
    // Actually, I'll just replace the constructor part first, then the update method.
    // Wait, the tool allows replacing a chunk. I'll replace the constructor init and the update method.
    // Let's do the constructor init first.


    takeDamage() {
        this.health--;

        // Visual feedback (flash white)
        this.mesh.material.emissive.setHex(0xffffff);
        setTimeout(() => {
            if (this.mesh) this.mesh.material.emissive.setHex(0x000000);
        }, 100);

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        // Cleanup
        this.lightningBeam.cleanup();
        this.scene.remove(this.mesh);
        this.scene.remove(this.light);
        this.physicsWorld.removeBody(this.body);

        if (this.onDeath) this.onDeath(this);
    }

    createMesh() {
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        geometry.rotateY(-Math.PI / 2); // Fix texture alignment (center pupil)

        let material;

        const textureLoader = new THREE.TextureLoader();
        const textures = [
            '/textures/psychedelic_eye_texture.png',
            '/textures/blue_eye_texture.png',
            '/textures/red_eye_texture.png'
        ];
        const texturePath = textures[Math.floor(Math.random() * textures.length)];

        // We can't easily check file existence in browser JS synchronously without a request,
        // but TextureLoader handles errors.
        material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.4,
            metalness: 0.1
        });

        textureLoader.load(
            texturePath,
            (texture) => {
                material.map = texture;
                material.needsUpdate = true;
            },
            undefined,
            (err) => {
                console.warn('Texture not found, using procedural fallback');
                // Fallback: Procedural "eye" look using vertex colors or just a color
                material.color.setHex(0xff0000); // Red eye
                material.emissive.setHex(0x330000);
            }
        );

        return new THREE.Mesh(geometry, material);
    }

    createBody() {
        const shape = new CANNON.Sphere(1);
        const body = new CANNON.Body({
            mass: 5,
            position: new CANNON.Vec3(
                (Math.random() - 0.5) * 20,
                5,
                (Math.random() - 0.5) * 20 - 10
            ),
            shape: shape,
            linearDamping: 0.1, // Reduced damping for better movement
            fixedRotation: true // Prevent physics body from rolling
        });
        body.userData = { isEnemy: true };
        return body;
    }

    update(dt) {
        // Sync mesh position to physics
        this.mesh.position.copy(this.body.position);
        this.light.position.copy(this.body.position);

        // Apply anti-gravity force to make them float
        const antiGravity = new CANNON.Vec3(0, 9.82 * this.body.mass, 0);
        this.body.applyForce(antiGravity, this.body.position);

        // Hover effect (bobbing up and down slightly)
        const time = Date.now() * 0.001;
        const hoverForce = Math.sin(time * 2) * 2;
        this.body.applyForce(new CANNON.Vec3(0, hoverForce, 0), this.body.position);

        // Make enemy look at player
        if (this.playerBody) {
            this.mesh.lookAt(
                this.playerBody.position.x,
                this.playerBody.position.y,
                this.playerBody.position.z
            );

            // Move towards player
            const direction = new CANNON.Vec3();
            this.playerBody.position.vsub(this.body.position, direction);
            const distance = direction.length();
            direction.normalize();

            // Chase force
            const speed = 30;
            // Don't get too close, stay at shooting range
            if (distance > 10) {
                this.body.applyForce(direction.scale(speed), this.body.position);
            }

            // Maintain height (dampen Y velocity if too high/low to prevent flying off)
            if (this.body.position.y > 5) this.body.velocity.y *= 0.9;
            if (this.body.position.y < 1) this.body.velocity.y += 1; // Push up if too low

            // SHOOTING LOGIC
            // State Machine: Idle -> Charging -> Shooting -> Idle

            if (!this.isCharging && !this.isShooting) {
                this.shootTimer += dt;
                if (this.shootTimer > this.shootInterval && distance < 20) {
                    // Start Charging
                    this.isCharging = true;
                    this.currentChargeTime = 0;
                    this.shootTimer = 0;
                }
            }

            if (this.isCharging) {
                this.currentChargeTime += dt;

                // Visual Telegraph: Pulse Red/Orange
                const chargeProgress = this.currentChargeTime / this.chargeDuration;
                // Flash faster as we get closer to shooting
                const flashFreq = 10 + (chargeProgress * 20);
                const intensity = 0.5 + Math.sin(Date.now() * 0.01 * flashFreq) * 0.5;

                // Electric Blue glow warning
                // Matching LightningBeam color (2, 8, 20) roughly scaled
                this.mesh.material.emissive.setRGB(0.2 * intensity, 0.8 * intensity, 2.0 * intensity);
                this.light.intensity = 1 + (intensity * 2);
                this.light.color.setRGB(0.2, 0.8, 2.0);

                if (this.currentChargeTime >= this.chargeDuration) {
                    // Finish Charging, Start Shooting
                    this.isCharging = false;
                    this.isShooting = true;
                    this.currentShootTime = 0;

                    // Reset visuals
                    this.mesh.material.emissive.setHex(0x000000); // Or whatever base emissive
                    this.light.intensity = 1;
                    this.light.color.setHex(0xff0000);

                    // Randomize next interval
                    this.shootInterval = 3 + Math.random() * 3;

                    // Damage player
                    if (this.onDamagePlayer) {
                        this.onDamagePlayer(5);
                    }
                }
            }

            if (this.isShooting) {
                this.currentShootTime += dt;

                // Convert CANNON Vec3 to THREE Vector3 for the visual effect
                const start = new THREE.Vector3(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);
                const end = new THREE.Vector3(this.playerBody.position.x, this.playerBody.position.y, this.playerBody.position.z);

                this.lightningBeam.update(start, end);

                if (this.currentShootTime > this.shootDuration) {
                    this.isShooting = false;
                    this.lightningBeam.cleanup();
                }
            }
        }
    }
}
