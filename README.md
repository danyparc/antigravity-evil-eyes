# Psychedelic Cyberpunk Shooter
<img width="1506" height="760" alt="image" src="https://github.com/user-attachments/assets/2de6d624-1373-4970-8176-75473166ee19" />

A 3D browser-based First-Person Shooter (FPS) built with **Three.js** and **Cannon-es**, featuring a "Psychedelic Cyberpunk" aesthetic.

## 🎮 Game Overview
Explore a neon-lit cyberpunk world, fight off floating eyeball enemies, and survive as long as you can.

### Features
-   **Immersive Environment**:
    -   Infinite neon grid floor (400x400).
    -   Cyberpunk city skyline skybox.
    -   Distant glowing towers with custom generated textures.
    -   Atmospheric dark fog and dynamic lighting.
-   **Physics-Based Gameplay**:
    -   "Floaty" player movement using Cannon-es physics.
    -   PointerLock controls for immersive first-person view.
    -   Physics-based projectiles and collisions.
-   **Combat System**:
    -   **Enemies**: Floating eyeballs that chase the player. They have 3 HP, flash when hit, and respawn endlessly.
    -   **Weapon**: High-speed glowing red laser bolts.
    -   **Player Health**: You have 100 HP. Taking damage flashes the screen red. Reaching 0 HP triggers Game Over.
-   **Visuals**:
    -   Custom generated textures for enemies, skybox, towers, and projectiles.
    -   Emissive materials for neon glow effects.

## 🛠 Tech Stack
-   **Vite**: Build tool and dev server.
-   **Three.js**: 3D rendering engine.
-   **Cannon-es**: 3D physics engine.
-   **Vanilla JavaScript**: Core game logic.

## 🚀 How to Run
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
3.  Open the local URL (usually `http://localhost:5173`).

---

## 🧠 Development Log & Reasoning Chain

This project was built iteratively through a pair-programming session. Below is the log of user requests and the reasoning behind the implementation steps.

### 1. Project Initialization
**User Request**: "Build Psychedelic Cyberpunk Shooter... 3D browser game... Three.js and Cannon-es..."
-   **Reasoning**: Started by setting up the foundational architecture.
    -   Initialized Vite project.
    -   Created core classes: `Environment` (Three.js setup), `Physics` (Cannon-es world), `Player` (Controls + Physics body).
    -   Implemented a basic loop in `main.js`.

### 2. Core Mechanics & Bug Fixes
**User Request**: Fix enemies spinning and player falling.
-   **Reasoning**:
    -   **Gravity**: The player was falling because there was no ground physics body. Added a static `CANNON.Plane`.
    -   **Enemy Rotation**: Enemies were spinning uncontrollably because their physics bodies were rolling. Set `fixedRotation: true` and manually updated `mesh.lookAt(player)` for visual orientation.

### 3. Environment Enhancements
**User Request**: "Generate a futuristic tower texture... make some glowing effect..."
-   **Reasoning**: The world felt empty.
    -   **Skybox**: Generated a cyberpunk city panorama to add depth.
    -   **Towers**: Created a `createTowers` function in `Environment.js`. Generated a "futuristic tower" texture and applied it with an `emissiveMap` to make the windows glow against the dark fog.

### 4. Combat System
**User Request**: "Make the enemies and the projectiles collide... enemy should die after 3 shots... generate a new enemy..."
-   **Reasoning**: The game needed a loop.
    -   **Health**: Added `health` property to `EyeballEnemy`.
    -   **Collision**: Used Cannon-es collision events (`body.addEventListener('collide')`).
    -   **Tags**: Added `userData: { isProjectile: true }` to identify collision partners.
    -   **Respawn**: Implemented a callback system where `Enemy` notifies `main.js` on death to spawn a replacement.

### 5. Player Health & UI
**User Request**: "Create player life bar... 100 points of life... green life bar..."
-   **Reasoning**: The player needed stakes.
    -   **UI**: Created a simple HTML/CSS overlay for the health bar.
    -   **Logic**: Added `health` to `Player.js`. On collision with an enemy, reduce health and update the UI width percentage.
    -   **Feedback**: Added a red flash overlay on damage.

### 6. Weapon Visuals Upgrade
**User Request**: "Make the projectiles look a bit smaller and like a glowing laser... make them red and look like long lines..."
-   **Reasoning**: Spheres looked generic.
    -   **Texture**: Generated a "laser bolt" texture.
    -   **Geometry**: Switched to `CylinderGeometry` to represent a beam/bolt.
    -   **Material**: Used high `emissiveIntensity` for a neon glow.

### 7. Visual Bug Fixes
**User Request**: "Projectiles are being shot in wrong position... is still a sideways bar... fix it."
-   **Reasoning**:
    -   **Orientation**: The cylinder was spawning sideways. Rotated the geometry `Math.PI / 2` on X-axis to align with the Z-axis (forward).
    -   **Update Loop Bug**: Even after rotation, they looked wrong. Found that `weapon.update()` was copying the physics body's quaternion to the mesh every frame. Since the physics body (a sphere) rotates freely or differently, it was overriding the visual orientation.
    -   **Fix**: Disabled the quaternion sync for projectiles in the update loop, allowing them to maintain their initial "arrow" orientation along their flight path.

---
*Generated by Antigravity*
