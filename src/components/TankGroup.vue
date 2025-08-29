<script setup>
import { computed } from 'vue';
import Tank from './Tank.vue';
import TextSprite from './TextSprite.vue';

const props = defineProps({
  // Center position of the pair
  position: {type: Array, required: true},
  diameter: {type: Number, required: true},
  height: {type: Number, required: true},
  labelPrefix: {type: String, required: true},
  color: {type: String, default: '#808080'}
});

// Calculate positions for the two tanks in the pair, aligned North-South (along Z-axis)
const tank1Pos = computed(() => {
  const offset = props.diameter / 2 + 0.5; // Half diameter + 0.5m spacing
  return [props.position[0], 0, props.position[2] - offset];
});

const tank2Pos = computed(() => {
  const offset = props.diameter / 2 + 0.5;
  return [props.position[0], 0, props.position[2] + offset];
});

const label1Pos = computed(() => [tank1Pos.value[0], props.height + 0.5, tank1Pos.value[2]]);
const label2Pos = computed(() => [tank2Pos.value[0], props.height + 0.5, tank2Pos.value[2]]);
</script>

<template>
  <Tank
      :position="tank1Pos"
      :diameter="diameter"
      :height="height"
      :color="color"
      :label="`${labelPrefix}-1`"
  />
  <TextSprite :text="`${labelPrefix}-1`" :position="label1Pos"/>

  <Tank
      :position="tank2Pos"
      :diameter="diameter"
      :height="height"
      :color="color"
      :label="`${labelPrefix}-2`"
  />
  <TextSprite :text="`${labelPrefix}-2`" :position="label2Pos"/>
</template>