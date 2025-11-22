import * as CANNON from 'cannon-es';

export class Physics {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); // Standard gravity, can be adjusted for "floaty" feel
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;

        this.bodies = [];
        this.createGround();
    }

    createGround() {
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(groundBody);
        this.bodies.push(groundBody);
    }

    update(dt) {
        this.world.step(1 / 60, dt, 3);
    }

    addBody(body) {
        this.world.addBody(body);
        this.bodies.push(body);
    }
}
