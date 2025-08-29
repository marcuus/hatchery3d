<template>
  <canvas id="babylonCanvas"></canvas>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

// Define emits
const emit = defineEmits(['cylinder-selected', 'export-complete', 'export-error'])

// Private variables (not reactive)
let engine = null
let scene = null
let camera = null

// Methods
const resetCamera = () => {
  if (camera) {
    camera.setTarget(BABYLON.Vector3.Zero())
    camera.alpha = Math.PI / 4
    camera.beta = Math.PI / 3
    camera.radius = 40
  }
}

const exportToGLTF = async () => {
  if (!scene) {
    emit('export-error', 'Scene not available for export')
    return
  }

  try {
    const exportScene = new BABYLON.Scene(engine)

    scene.meshes.forEach(mesh => {
      if (mesh.name !== 'camera') {
        mesh.clone(mesh.name + '_export', null, exportScene)
      }
    })

    const gltfData = await BABYLON.GLTF2Export.GLTFAsync(exportScene, 'factory-floor-plan')

    // Download logic...

    exportScene.dispose()

    emit('export-complete', 'GLTF export completed successfully!')

  } catch (error) {
    emit('export-error', 'Failed to export GLTF: ' + error.message)
  }
}

const createScene = () => {
  // Scene creation logic...
}

// Lifecycle hooks
onMounted(() => {
  createScene()
  engine.runRenderLoop(() => {
    scene.render()
  })
  window.addEventListener('resize', () => {
    engine.resize()
  })
})

onUnmounted(() => {
  if (engine) {
    engine.dispose()
  }
})

// Expose methods to parent
defineExpose({ resetCamera, exportToGLTF })
</script>