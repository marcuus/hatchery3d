<script setup>
import { onMounted, onUnmounted, inject, watch } from 'vue';
import * as THREE from 'three';

const props = defineProps({
  position: { type: Array, default: () => [0, 0, 0] },
  diameter: { type: Number, required: true },
  height: { type: Number, required: true },
  color: {type: String, default: '#808080'},
  label: {type: String, required: true},
});

const scene = inject('scene');
let mesh = null;

const createTank = () => {
  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }

  const geometry = new THREE.CylinderGeometry(props.diameter / 2, props.diameter / 2, props.height, 32);
  const material = new THREE.MeshStandardMaterial({color: props.color});
  mesh = new THREE.Mesh(geometry, material);

  // Position the cylinder so its base is at y=0
  mesh.position.set(props.position[0], props.height / 2, props.position[2]);

  // Attach label to userData for raycasting
  mesh.userData = {label: props.label, isTank: true};

  scene.add(mesh);
};

onMounted(createTank);

// Re-create tank if its fundamental properties change
watch(props, createTank, {deep: true});

onUnmounted(() => {
  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
});
</script>

<template>
</template>