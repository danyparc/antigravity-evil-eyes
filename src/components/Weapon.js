import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Weapon {
    constructor(scene, camera, physicsWorld) {
        this.scene = scene;
        this.camera = camera;
        this.physicsWorld = physicsWorld;
        this.projectiles = [];

        this.createGunModel();

        document.addEventListener('click', () => this.shoot());
    }

    createGunModel() {
        // Gun Group
        this.gunGroup = new THREE.Group();
        this.camera.add(this.gunGroup); // Attach to camera so it moves with view

        // Textures
        const loader = new THREE.TextureLoader();
        const texture = loader.load('/textures/cyberpunk_gun_texture.png');

        // Main Body - Smaller dimensions
        const bodyGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.35);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            color: 0x333333,
            roughness: 0.3,
            metalness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        // Position: x (right), y (down), z (forward/back)
        body.position.set(0.25, -0.25, -0.4);
        this.gunGroup.add(body);

        // Barrel - Thinner and shorter
        const barrelGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 16);
        barrelGeometry.rotateX(-Math.PI / 2);
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.5,
            metalness: 0.9
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.set(0.25, -0.22, -0.6); // Extending from body
        this.gunGroup.add(barrel);

        // Glow details
        const glowGeometry = new THREE.BoxGeometry(0.01, 0.01, 0.3);
        const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(0.25, -0.19, -0.4); // Top of body
        this.gunGroup.add(glow);

        // Add light from gun
        const gunLight = new THREE.PointLight(0x00ffff, 0.2, 1);
        gunLight.position.set(0.25, -0.2, -0.6);
        this.gunGroup.add(gunLight);
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

        // Adjust spawn position to match new smaller gun model
        // Gun body x is 0.25, y is -0.25. Barrel tip is around z -0.7 (relative to camera)
        // We need to project this relative offset into world space based on camera direction

        // Simple approximation:
        // Move forward (Z)
        startPos.addScaledVector(direction, 0.8);

        // Move right (relative X) and down (relative Y)
        // We need the camera's right and up vectors for this to be perfect, but for now fixed offsets might work if looking straight.
        // Better: Construct offset vector and apply camera quaternion.

        const offset = new THREE.Vector3(0.25, -0.22, 0); // Match barrel X/Y
        offset.applyQuaternion(this.camera.quaternion);
        startPos.add(offset);

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
