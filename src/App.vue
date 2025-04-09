<template>
  <div class="p-4">
    <canvas ref="canvas" width="800" height="400"></canvas>
    <div class="button-container">
      <button @click="changeValues">Change length and width options</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoomViewer } from "./hooks/useRoomViewer";

const canvas = ref<HTMLCanvasElement | null>(null);
const { initialize, changeValues } = useRoomViewer(canvas);

onMounted(() => {
  initialize();
});
</script>
