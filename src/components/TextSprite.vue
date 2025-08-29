<script setup>
import { onMounted, onUnmounted, inject, watch } from 'vue';
import * as THREE from 'three';

const props = defineProps({
  text: { type: String, default: '' },
  position: { type: Array, default: () => [0, 0, 0] },
  fontSize: { type: Number, default: 48 },
});

const scene = inject('scene');
let sprite = null;

const createTextSprite = () => {
  if (sprite) {
    scene.remove(sprite);
    sprite.material.map.dispose();
    sprite.material.dispose();
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const font = `${props.fontSize}px Arial`;
  context.font = font;
  const metrics = context.measureText(props.text);
  const textWidth = metrics.width;

  canvas.width = textWidth + 20; // Add some padding
  canvas.height = props.fontSize + 20;

  context.font = font;
  context.fillStyle = 'rgba(0, 0, 0, 0.7)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'white';
  context.fillText(props.text, 10, props.fontSize + 5);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });

  sprite = new THREE.Sprite(material);
  sprite.position.set(...props.position);

  // Scale the sprite to a reasonable size in the scene
  const scale = 0.01;
  sprite.scale.set(canvas.width * scale, canvas.height * scale, 1);

  scene.add(sprite);
};

onMounted(createTextSprite);

// Re-create sprite if props change
watch(props, createTextSprite, { deep: true });

onUnmounted(() => {
  if (sprite) {
    scene.remove(sprite);
    sprite.material.map.dispose();
    sprite.material.dispose();
  }
});
</script>

<template>
</template>