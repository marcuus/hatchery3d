<script setup>
import { ref, onMounted, onUnmounted, provide } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

import TankGroup from '@/components/TankGroup.vue';

// DOM element reference
const canvasContainer = ref(null);

// Scene objects - **CHANGE #1: Make `scene` a ref**
const scene = ref(null);
let camera, renderer, controls;
let animationFrameId;

// --- Reactive State for Popup ---
const popup = ref({
  visible: false,
  label: '',
  x: 0,
  y: 0,
});

// --- Data for Tanks ---
const FLOOR_WIDTH = 25;
const FLOOR_DEPTH = 26;
const southEastTanks = [
  { pos: [5, 5], labelPrefix: 'SE-A' }, { pos: [10, 5], labelPrefix: 'SE-B' },
  { pos: [5, 10], labelPrefix: 'SE-C' }, { pos: [10, 10], labelPrefix: 'SE-D' },
];
const northWestTanks = [
  { pos: [-5, -3], labelPrefix: 'NW-A' }, { pos: [-10, -3], labelPrefix: 'NW-B' },
  { pos: [-5, -6.5], labelPrefix: 'NW-C' }, { pos: [-10, -6.5], labelPrefix: 'NW-D' },
  { pos: [-7.5, -10], labelPrefix: 'NW-E' },
];

// --- Main Setup Function ---
onMounted(() => {
  // 1. Initialize Scene - **CHANGE #2: Assign to scene.value**
  scene.value = new THREE.Scene();
  scene.value.background = new THREE.Color(0xf0f0f0);

  // Provide the actual scene object to child components
  provide('scene', scene.value);

  // 2. Initialize Camera
  camera = new THREE.PerspectiveCamera(60, canvasContainer.value.clientWidth / canvasContainer.value.clientHeight, 0.1, 1000);
  camera.position.set(0, 20, 25);
  camera.lookAt(0, 0, 0);

  // 3. Initialize Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  canvasContainer.value.appendChild(renderer.domElement);

  // 4. Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2.1;

  // 5. Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.value.add(ambientLight); // **Use .value**
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(-10, 20, 10);
  directionalLight.castShadow = true;
  scene.value.add(directionalLight); // **Use .value**

  // 6. Create Geometry
  createFactoryLayout();

  // 7. Event Listeners
  window.addEventListener('resize', handleResize);
  renderer.domElement.addEventListener('click', handleObjectClick);

  // 8. Start Animation Loop
  animate();
});

// --- Cleanup ---
onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', handleResize);
  if (renderer) {
    renderer.domElement.removeEventListener('click', handleObjectClick);
    renderer.dispose();
  }
  if(controls) controls.dispose();
});


// --- Helper Functions ---

const createFactoryLayout = () => {
  const WALL_HEIGHT = 4;
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xd3d3d3, side: THREE.DoubleSide });

  // Floor
  const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(FLOOR_WIDTH, FLOOR_DEPTH),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.value.add(floor); // **Use .value**

  // North Wall
  const northWall = new THREE.Mesh(new THREE.BoxGeometry(FLOOR_WIDTH, WALL_HEIGHT, 0.1), wallMaterial);
  northWall.position.set(0, WALL_HEIGHT / 2, -FLOOR_DEPTH / 2);
  scene.value.add(northWall); // **Use .value**

  // East Wall
  const eastWall = new THREE.Mesh(new THREE.BoxGeometry(FLOOR_DEPTH, WALL_HEIGHT, 0.1), wallMaterial);
  eastWall.position.set(FLOOR_WIDTH / 2, WALL_HEIGHT / 2, 0);
  eastWall.rotation.y = Math.PI / 2;
  scene.value.add(eastWall); // **Use .value**

  // West Wall
  const westWall = new THREE.Mesh(new THREE.BoxGeometry(FLOOR_DEPTH, WALL_HEIGHT, 0.1), wallMaterial);
  westWall.position.set(-FLOOR_WIDTH / 2, WALL_HEIGHT / 2, 0);
  westWall.rotation.y = Math.PI / 2;
  scene.value.add(westWall); // **Use .value**

  // South Wall (with entrance)
  const ENTRANCE_WIDTH = 3, ENTRANCE_FROM_EAST = 8;
  const southWallEastPos = FLOOR_WIDTH / 2 - ENTRANCE_FROM_EAST;
  const southWallWestPos = southWallEastPos - ENTRANCE_WIDTH;

  const southWallPart1Length = (FLOOR_WIDTH / 2) - southWallEastPos;
  const southWallPart1 = new THREE.Mesh(new THREE.BoxGeometry(southWallPart1Length, WALL_HEIGHT, 0.1), wallMaterial);
  southWallPart1.position.set(southWallEastPos + southWallPart1Length / 2, WALL_HEIGHT / 2, FLOOR_DEPTH / 2);
  scene.value.add(southWallPart1); // **Use .value**

  const southWallPart2Length = southWallWestPos - (-FLOOR_WIDTH / 2);
  const southWallPart2 = new THREE.Mesh(new THREE.BoxGeometry(southWallPart2Length, WALL_HEIGHT, 0.1), wallMaterial);
  southWallPart2.position.set(southWallWestPos - southWallPart2Length / 2, WALL_HEIGHT / 2, FLOOR_DEPTH / 2);
  scene.value.add(southWallPart2); // **Use .value**

  // Incubation Room (4m W x 6m D in SW corner)
  const roomW = 4, roomD = 6;
  const roomMaterial = new THREE.MeshStandardMaterial({ color: 0xa0a0ff, side: THREE.DoubleSide });
  const roomGroup = new THREE.Group();
  const roomWall1 = new THREE.Mesh(new THREE.BoxGeometry(roomD, WALL_HEIGHT, 0.1), roomMaterial);
  roomWall1.rotation.y = Math.PI / 2;
  roomWall1.position.x = roomW / 2;
  roomGroup.add(roomWall1);
  const roomWall2 = new THREE.Mesh(new THREE.BoxGeometry(roomW, WALL_HEIGHT, 0.1), roomMaterial);
  roomWall2.position.z = -roomD / 2;
  roomGroup.add(roomWall2);
  roomGroup.position.set(-FLOOR_WIDTH / 2 + roomW / 2, WALL_HEIGHT / 2, FLOOR_DEPTH / 2 - roomD / 2);
  scene.value.add(roomGroup); // **Use .value**
};

const animate = () => {
  animationFrameId = requestAnimationFrame(animate);
  controls.update();
  // **CHANGE #3: Check if scene.value exists before rendering**
  if (scene.value) {
    renderer.render(scene.value, camera);
  }
};

const handleResize = () => {
  if (!camera || !renderer) return;
  camera.aspect = canvasContainer.value.clientWidth / canvasContainer.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight);
};

const handleObjectClick = (event) => {
  if (!scene.value) return; // **Guard clause**

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.value.children, true); // **Use .value**

  const tankIntersect = intersects.find(i => i.object.userData.isTank);

  if (tankIntersect) {
    popup.value = { visible: true, label: tankIntersect.object.userData.label, x: event.clientX, y: event.clientY };
  } else {
    popup.value.visible = false;
  }
};

const exportToGLB = () => {
  if (!scene.value) return; // **Guard clause**
  const exporter = new GLTFExporter();
  exporter.parse(
      scene.value, // **Use .value**
      (result) => {
        const blob = new Blob([result], { type: 'model/gltf-binary' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'factory-floor-plan.glb';
        link.click();
        URL.revokeObjectURL(link.href);
      },
      (error) => { console.error('An error occurred during export:', error); },
      { binary: true }
  );
};
</script>

<template>
  <div class="relative w-screen h-screen">
    <div ref="canvasContainer" class="w-full h-full"></div>

    <div class="absolute top-4 left-4 flex flex-col gap-2">
      <button @click="exportToGLB"
              class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
        Export to Blender (.glb)
      </button>
    </div>

    <div v-if="popup.visible"
         class="absolute bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg pointer-events-none text-lg font-semibold"
        :style="{ left: `${popup.x + 15}px`, top: `${popup.y + 15}px` }">
      {{ popup.label }}
    </div>

    <template v-if="scene">
      <TankGroup
          v-for="(group, index) in southEastTanks"
          :key="`se-${index}`"
          :position="[group.pos[0], 0, group.pos[1]]"
          :diameter="5"
          :height="3"
          :label-prefix="group.labelPrefix"
          color="#c2b280"
      />
      <TankGroup
          v-for="(group, index) in northWestTanks"
          :key="`nw-${index}`"
          :position="[group.pos[0], 0, group.pos[1]]"
          :diameter="3"
          :height="1.2"
          :label-prefix="group.labelPrefix"
          color="#87ceeb"
      />
    </template>
  </div>
</template>