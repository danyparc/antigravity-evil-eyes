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

        // Laser projectile (Cylinder)
        const radius = 0.02; // Very thin
        const length = 2.0; // Long
        const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
        geometry.rotateX(Math.PI / 2); // Rotate geometry so cylinder lies on Z axis (pointing forward)

        // Remove texture for now to ensure color/shape is correct first, or use a simple color material if texture is causing issues.
        // User asked for "red and look like long lines".
        const material = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 5,
            transparent: true,
            opacity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);

        // Start position: slightly in front of camera and lower (like a gun position)
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);

        const startPos = new THREE.Vector3();
        startPos.copy(this.camera.position);
        startPos.addScaledVector(direction, 1.0); // Closer
        startPos.y -= 0.2; // Lower to look like it comes from a weapon
        startPos.x += 0.2; // Slightly to the right

        mesh.position.copy(startPos);

        // Align mesh Z axis (which we rotated geometry to) with direction
        mesh.lookAt(
            startPos.x + direction.x,
            startPos.y + direction.y,
            startPos.z + direction.z
        );

        this.scene.add(mesh);

        // Light attached to projectile
        const light = new THREE.PointLight(0xff0000, 2, 5);
        light.position.copy(startPos);
        this.scene.add(light);

        // Physics
        const shape = new CANNON.Sphere(0.1); // Keep physics shape simple
        const body = new CANNON.Body({
            mass: 0.1,
            position: new CANNON.Vec3(startPos.x, startPos.y, startPos.z),
            shape: shape,
            linearDamping: 0.0
        });
        body.userData = { isProjectile: true };

        const shootSpeed = 100;
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
            // p.mesh.quaternion.copy(p.body.quaternion); // Don't sync rotation, keep initial lookAt direction
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
