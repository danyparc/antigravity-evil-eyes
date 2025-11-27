import * as THREE from 'three';

export class LightningBeam {
    constructor(scene) {
        this.scene = scene;
        this.segments = []; // To store the rendered lines
        this.isAlive = true;

        // Configuration
        this.color = 0x00FFFF; // Cyan/Electric Blue
        this.jaggedness = 0.5; // How chaotic the line is
        this.branches = 3;     // Max branches
    }

    // Helper to get a random offset
    getOffset(magnitude) {
        return (Math.random() - 0.5) * magnitude;
    }

    generateBolt(startPoint, endPoint, thickness = 5, depth = 0) {
        const points = [];
        points.push(startPoint);

        const distance = startPoint.distanceTo(endPoint);
        const steps = Math.floor(distance * 5); // 5 vertices per unit of distance

        if (steps <= 0) return;

        // Linear interpolation vector
        // const direction = new THREE.Vector3().subVectors(endPoint, startPoint);

        for (let i = 1; i < steps; i++) {
            const alpha = i / steps;

            // Calculate the point on the straight line
            const currentPoint = new THREE.Vector3().lerpVectors(startPoint, endPoint, alpha);

            // ADD CHAOS: Offset perpendicular to the path
            // We scale chaos by '1 - alpha' so it hits the target precisely at the end
            if (i < steps - 1) { // Don't offset the very last point
                const sway = this.jaggedness;
                currentPoint.x += this.getOffset(sway);
                currentPoint.y += this.getOffset(sway);
                currentPoint.z += this.getOffset(sway);
            }

            points.push(currentPoint);

            // BRANCHING LOGIC
            // Only branch if we aren't too deep in recursion and luck strikes
            if (depth < 2 && Math.random() > 0.95) {
                // Branch target is somewhere loosely in the forward direction
                const branchTarget = currentPoint.clone().add(
                    new THREE.Vector3(
                        this.getOffset(5),
                        this.getOffset(5),
                        this.getOffset(5)
                    )
                );
                this.generateBolt(currentPoint, branchTarget, thickness * 0.5, depth + 1);
            }
        }

        points.push(endPoint);

        // Create Geometry
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: this.color,
            linewidth: thickness // Note: WebGL often ignores linewidth > 1
        });

        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        this.segments.push(line);
    }

    update(source, target) {
        // 1. CLEAR old lines
        this.cleanup();

        // 2. RE-GENERATE lines (This creates the flickering/jitter animation)
        // We regenerate every frame or every other frame to simulate chaos
        this.generateBolt(source, target);
    }

    cleanup() {
        this.segments.forEach(line => {
            this.scene.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        });
        this.segments = [];
    }
}
