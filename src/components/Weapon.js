import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Weapon {
    constructor(scene, camera, physicsWorld) {
        this.scene = scene;
        this.camera = camera;
        this.physicsWorld = physicsWorld;
        this.projectiles = [];

        // Simple visual for the weapon (just a box for now attached to camera)
        // In a real game, this would be a model
        // Note: We are not attaching it to camera here to avoid complexity with scene graph/physics sync for now,
        // but we will shoot from camera position.

        document.addEventListener('click', () => this.shoot());
    }

    shoot() {
        if (document.pointerLockElement !== document.body) return;

        const radius = 0.2;
        const geometry = new THREE.SphereGeometry(radius);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 2
        });
        const mesh = new THREE.Mesh(geometry, material);

        // Start position: slightly in front of camera
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);

        const startPos = new THREE.Vector3();
        startPos.copy(this.camera.position);
        startPos.addScaledVector(direction, 1.5); // Offset

        mesh.position.copy(startPos);
        this.scene.add(mesh);

        // Light attached to projectile
        const light = new THREE.PointLight(0x00ffff, 1, 5);
        light.position.copy(startPos);
        this.scene.add(light);

        // Physics
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({
            mass: 0.5,
            position: new CANNON.Vec3(startPos.x, startPos.y, startPos.z),
            shape: shape
        });
        body.userData = { isProjectile: true };

        const shootSpeed = 30;
        body.velocity.set(
            direction.x * shootSpeed,
            direction.y * shootSpeed,
            direction.z * shootSpeed
        );

        this.physicsWorld.addBody(body);

        this.projectiles.push({ mesh, body, light, timeCreated: Date.now() });
    }

    update() {
        // Sync projectiles and cleanup old ones
        const now = Date.now();
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            p.mesh.position.copy(p.body.position);
            p.mesh.quaternion.copy(p.body.quaternion);
            p.light.position.copy(p.body.position);

            // Remove after 5 seconds
            if (now - p.timeCreated > 5000) {
                this.scene.remove(p.mesh);
                this.scene.remove(p.light);
                this.physicsWorld.removeBody(p.body);
                this.projectiles.splice(i, 1);
            }
        }
    }
}
