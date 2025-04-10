<template>
  <div class="button-container">
    <button @click="handleChange">Change length and width options</button>
  </div>
  <div class="button-container">
    <button @click="switchShape">Switch shape</button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  onAction: () => void;
}>();

function switchShape() {
  return location.reload();
}

function handleChange() {
  props.onAction();
}
</script>
