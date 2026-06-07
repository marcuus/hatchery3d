<template>
  <div class="relative w-full h-screen min-h-svh">

    <div class="absolute top-10 left-4 flex flex-col gap-2">
      <button @click="exportToGLB"
              class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
        Export to Blender (.glb)
      </button>
      <button @click="resetCamera"
              class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
        Reset Camera
      </button>
      <button @click="logout"
              class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
        Log out
      </button>
    </div>

    <div class="text-center font-bold text-3xl text-white bg-blue-500">Hatchery Floor Plan</div>

    <canvas ref="canvasRef" class="w-full h-full"></canvas>

    <div v-if="popup.visible"
        :style="{ top: popup.y + 'px', left: popup.x + 'px' }"
        class="absolute bg-white p-2 rounded shadow-lg border border-gray-300 pointer-events-none">
      <div class="font-bold">{{ popup.data.label }}</div>
      <div class="text-sm">
        <div><b>Type:</b> {{ popup.data.type }}</div>
        <div><b>Diameter:</b> {{ popup.data.diameter }}</div>
        <div><b>Height:</b> {{ popup.data.height }}</div>
        <div><b>Volume:</b> {{ popup.data.volume }}</div>
        <div><b>Location:</b> {{ popup.data.location }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {onMounted, onUnmounted, reactive, ref} from 'vue';
import {
  ArcRotateCamera,
  Color3,
  Engine,
  HemisphericLight,
  MeshBuilder,
  PointerEventTypes,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { GLTF2Export } from "@babylonjs/serializers";
import router from "@/router/index.js";

const canvasRef = ref(null);
const camera = ref(null);

// Babylon engine/scene are kept at script scope so non-render handlers
// (e.g. exportToGLB) can access the populated scene built in onMounted.
let engine = null;
let scene = null;
const emit = defineEmits(['cylinder-selected', 'export-complete', 'export-error']);
const popup = reactive({
  visible: false,
  x: 0,
  y: 0,
  label: ''
});

// Factory dimensions
const factoryWidth = 25; // meters (x-axis)
const factoryLength = 26; // meters (z-axis)
const wallHeight = 4; // meters (y-axis)

// 8 cylinders on the southeast side (2 rows of 4 pairs)
// Aligned north-south, in pairs, 5m diameter, 3m high
const northWestTanks = [
  { labelPrefix: 'Big Tank A', x: -4.5, y: 1.5, z: 10, d:5, h:3 },
  { labelPrefix: 'Big Tank B', x: -10,  y: 1.5, z: 10, d:5, h:3 },
  { labelPrefix: 'Big Tank C', x: -4.5, y: 1.5, z: 4.5, d:5, h:3 },
  { labelPrefix: 'Big Tank D', x: -10,  y: 1.5, z: 4.5, d:5, h:3 },
  { labelPrefix: 'Big Tank E', x: -4.5, y: 1.5, z: -1.0, d:5, h:3 },
  { labelPrefix: 'Big Tank F', x: -10,  y: 1.5, z: -1.0, d:5, h:3 },
  { labelPrefix: 'Big Tank G', x: -4.5, y: 1.5, z: -7, d:5, h:3 },
  { labelPrefix: 'Big Tank H', x: -10,  y: 1.5, z: -7, d:5, h:3 },
];
// 10 cylinders on the northwest side (2 rows of 5 pairs)
// Aligned north-south, in pairs, 3m diameter, 1.2m high
const southEastTanks = [
  { labelPrefix: 'Small Tank A', x: 10, y: 1.5, z: 4.4, d:3, h:1.2  },
  { labelPrefix: 'Small Tank B', x: 5,  y: 1.5, z: 4.4, d:3, h:1.2  },
  { labelPrefix: 'Small Tank C', x: 10, y: 1.5, z: 0.4, d:3, h:1.2  },
  { labelPrefix: 'Small Tank D', x: 5,  y: 1.5, z: 0.4, d:3, h:1.2  },
  { labelPrefix: 'Small Tank E', x: 10, y: 1.5, z: -3.4, d:3, h:1.2  },
  { labelPrefix: 'Small Tank F', x: 5,  y: 1.5, z: -3.4, d:3, h:1.2  },
  { labelPrefix: 'Small Tank G', x: 10, y: 1.5, z: -7.4, d:3, h:1.2  },
  { labelPrefix: 'Small Tank H', x: 5,  y: 1.5, z: -7.4, d:3, h:1.2  },
  { labelPrefix: 'Small Tank I', x: 10, y: 1.5, z: -11.4, d:3, h:1.2  },
  { labelPrefix: 'Small Tank J', x: 5,  y: 1.5, z: -11.4, d:3, h:1.2  },
];

/**
 *
 * @param radius (m)
 * @param height (m)
 * @returns {string}
 */
function calculateCylinderVolume(radius, height) {
  // Check if inputs are valid numbers
  if (typeof radius !== 'number' || typeof height !== 'number' || radius < 0 || height < 0) {
    return "Invalid input: Radius and height must be non-negative numbers.";
  }

  const radiusCm = radius*100;
  const heightCm = height*100;

  // Calculate volume in cubic centimeters
  const volumeCubicCm = Math.PI * Math.pow(radiusCm, 2) * heightCm;
  // Convert cubic centimeters to liters (1000 cm³ = 1 liter)
  const volumeLitres = volumeCubicCm / 1000;

  return volumeLitres.toLocaleString();
}

onMounted(() => {
  if (!canvasRef.value) return;

  engine = new Engine(canvasRef.value, true);
  scene = new Scene(engine);
  scene.clearColor = new Color3(0.7, 0.8, 0.9);

  // Camera setup
  camera.value = new ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 3,
      50,
      new Vector3(12.5, 0, 13),
      scene
  );
  camera.value.setTarget(Vector3.Zero());
  camera.value.attachControl(canvasRef.value, true);
  camera.value.wheelPrecision = 0.5;
  camera.value.lowerRadiusLimit = 5;

  // Light setup
  const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
  light.intensity = 0.7;

  // Floor plane
  const floor = MeshBuilder.CreateGround('floor', { width: factoryWidth, height: factoryLength }, scene);
  const floorMat = new StandardMaterial('floorMat', scene);
  floorMat.diffuseColor = new Color3(0.5, 0.5, 0.5);
  floor.material = floorMat;

  // Walls
  const createWall = (name, width, height, position) => {
    const wall = MeshBuilder.CreateBox(name, { width, height, depth: 0.1 }, scene);
    wall.position = position;
    const wallMat = new StandardMaterial('wallMat', scene);
    wallMat.diffuseColor = new Color3(0.8, 0.8, 0.8);
    wall.material = wallMat;
    return wall;
  };

  // North Wall (length 26m)
  createWall('northWall', factoryWidth, wallHeight, new Vector3(0, wallHeight/2, -(factoryWidth/2)-0.5));

  // South Wall (length 26m, with entrance)
  createWall('southWallEast', 10.5, wallHeight, new Vector3(4.25, wallHeight/2, (factoryWidth/2)+0.5));
  createWall('southWallWest', 8.5, wallHeight, new Vector3(-8.25, wallHeight/2, (factoryWidth/2)+0.5));

  // East Wall (length 25m)
  const eastWall = createWall('eastWall', factoryLength, wallHeight, new Vector3((factoryLength/2 - 0.5), 2, 0));
  eastWall.rotation.y = Math.PI / 2;

  // West Wall (length 25m)
  const westWall = createWall('westWall', factoryLength, wallHeight, new Vector3((-factoryLength/2 + 0.5), 2, 0));
  westWall.rotation.y = Math.PI / 2;

  // Incubation room
  const createRoom = (name, width, height, depth, position) => {
    const room = MeshBuilder.CreateBox(name, { width, height, depth }, scene);
    room.position = position;
    const roomMat = new StandardMaterial('roomMat', scene);
    roomMat.diffuseColor = new Color3(0.9, 0.9, 0.9);
    roomMat.alpha = 0.5; // Make it semi-transparent
    room.material = roomMat;
    return room;
  };

  createRoom('incubationRoom', 4, 3, 6, new Vector3(10.5, 1.5, 10));

  // Cylinders
  const cylinders = [];
  const createCylinder = (name, diameter, height, position, colour) => {
    const cylinder = MeshBuilder.CreateCylinder(name, { diameter, height }, scene);
    cylinder.position = position;
    const mat = new StandardMaterial(name + 'Mat', scene);
    mat.diffuseColor = colour;
    cylinder.material = mat;
    cylinder.metadata = {
      label: name,
      type: 'Tank',
      height:`${height}m`,
      diameter:`${diameter}m`,
      volume: `${calculateCylinderVolume(diameter/2, height)} litres`,
      location:`X:${position.x.toFixed(1)}, Y:${position.y.toFixed(1)}`
    };
    cylinders.push(cylinder);
    return cylinder;
  };

  // 8 cylinders on the southeast side (2 rows of 4 pairs)
  // Aligned north-south, in pairs, 5m diameter, 3m high
  for (const tank of northWestTanks) {
    createCylinder(tank.labelPrefix, tank.d, tank.h, new Vector3(tank.x, tank.y, tank.z), new Color3(0,0,0.9));
  }

  // 10 cylinders on the northwest side (2 rows of 5 pairs)
  // Aligned north-south, in pairs, 3m diameter, 1.2m high
  for (const tank of southEastTanks) {
    createCylinder(tank.labelPrefix, tank.d, tank.h, new Vector3(tank.x, tank.y, tank.z),new Color3(0,0.9,0.0));
  }

  // Click event handling for popups
  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
      const pickResult = scene.pick(
          scene.pointerX,
          scene.pointerY
      );
      if (pickResult.hit && pickResult.pickedMesh && pickResult.pickedMesh.metadata && pickResult.pickedMesh.metadata.label) {
        // Show popup
        popup.visible = true;
        popup.data = pickResult.pickedMesh.metadata;
        popup.x = scene.pointerX;
        popup.y = scene.pointerY;
      } else {
        // Hide popup if click is not on a cylinder
        popup.visible = false;
      }
    }
  });

  // Render loop
  engine.runRenderLoop(() => {
    scene.render();
  });

  // Handle window resize
  const handleResize = () => {
    engine.resize();
  };
  window.addEventListener('resize', handleResize);


  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    engine.dispose();
  });
});

const resetCamera = () => {
  if (camera.value) {
    camera.value.setTarget(Vector3.Zero());
    camera.value.alpha = Math.PI / 4;
    camera.value.beta = Math.PI / 3;
    camera.value.radius = 40;
  }
};

const logout = () => {
  router.push('/login');
}

const exportToGLB = async() => {
  if (!scene) {
    console.error('Scene not available for export');
    return;
  }

  try {
    // Export the live scene directly. GLTF2Export reads the meshes without
    // mutating the scene, so there's no need to clone into a throwaway scene.
    const gltfData = await GLTF2Export.GLTFAsync(scene, 'factory-floor-plan');

    // Create download link
    const blob = new Blob([gltfData.glTFFiles['factory-floor-plan.gltf']], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'factory-floor-plan.gltf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Also download binary files if they exist
    if (gltfData.glTFFiles['factory-floor-plan.bin']) {
      const binBlob = new Blob([gltfData.glTFFiles['factory-floor-plan.bin']], { type: 'application/octet-stream' });
      const binUrl = URL.createObjectURL(binBlob);

      const binLink = document.createElement('a');
      binLink.href = binUrl;
      binLink.download = 'factory-floor-plan.bin';
      document.body.appendChild(binLink);
      binLink.click();
      document.body.removeChild(binLink);
      URL.revokeObjectURL(binUrl);
    }

    emit('export-complete', 'GLTF export completed successfully!');

  } catch (error) {
    console.error('Error exporting to GLTF:', error);
    emit('export-error', 'Failed to export GLTF: ' + error.message);
  }
}

</script>