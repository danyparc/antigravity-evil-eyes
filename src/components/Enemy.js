import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class EyeballEnemy {
    constructor(scene, physicsWorld, playerBody, onDeath) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.playerBody = playerBody;
        this.onDeath = onDeath;
        this.health = 3;

        this.mesh = this.createMesh();
        this.body = this.createBody();

        this.scene.add(this.mesh);
        this.physicsWorld.addBody(this.body);

        // Add a point light to the enemy for "psychedelic" effect
        this.light = new THREE.PointLight(0xff0000, 1, 10);
        this.scene.add(this.light);

        // Collision handling
        this.body.addEventListener('collide', (e) => {
            if (e.body.userData && e.body.userData.isProjectile) {
                this.takeDamage();
            }
        });
    }

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
            direction.normalize();

            // Chase force
            const speed = 30;
            this.body.applyForce(direction.scale(speed), this.body.position);

            // Maintain height (dampen Y velocity if too high/low to prevent flying off)
            if (this.body.position.y > 5) this.body.velocity.y *= 0.9;
            if (this.body.position.y < 1) this.body.velocity.y += 1; // Push up if too low
        }
    }
}
