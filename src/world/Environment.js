import * as THREE from 'three';

export class Environment {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.02); // Dark fog

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.6, 5); // Eye level

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        this.setupLighting();
        this.createSkybox();
        this.createNeonGrid();
        this.createTowers();

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    createSkybox() {
        const loader = new THREE.TextureLoader();
        const texture = loader.load('/textures/cyberpunk_skybox.png');
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.background = texture;
        this.scene.environment = texture;
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
        this.scene.add(ambientLight);

        // Point lights will be attached to entities, but let's add a general one for now
        const pointLight = new THREE.PointLight(0xff00ff, 1, 100);
        pointLight.position.set(10, 10, 10);
        this.scene.add(pointLight);
    }

    createNeonGrid() {
        const size = 400;
        const divisions = 100;
        const gridHelper = new THREE.GridHelper(size, divisions, 0xff00ff, 0x00ffff);
        this.scene.add(gridHelper);

        // Add a floor plane for physics reference (visual only here, physics body separate)
        const geometry = new THREE.PlaneGeometry(size, size);
        const material = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -0.01; // Slightly below grid
        this.scene.add(plane);
    }

    createTowers() {
        const geometry = new THREE.BoxGeometry(10, 50, 10);

        const loader = new THREE.TextureLoader();
        const texture = loader.load('/textures/futuristic_tower_texture.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 5);

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            emissive: 0xffffff,
            emissiveMap: texture,
            emissiveIntensity: 0.5,
            roughness: 0.2,
            metalness: 0.8
        });

        for (let i = 0; i < 20; i++) {
            const tower = new THREE.Mesh(geometry, material);
            const x = (Math.random() - 0.5) * 300;
            const z = (Math.random() - 0.5) * 300;

            // Keep center clear
            if (Math.abs(x) < 50 && Math.abs(z) < 50) continue;

            tower.position.set(x, 25, z);
            this.scene.add(tower);

            // Add some neon lights to towers
            const light = new THREE.PointLight(0x00ff00, 1, 50);
            light.position.set(x, 40, z);
            this.scene.add(light);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
