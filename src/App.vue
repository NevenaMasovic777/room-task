<template>
  <div class="p-4">
    <canvas ref="canvas" width="800" height="400"></canvas>
    <ButtonActions :onAction="changeValues" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoomViewer } from "./hooks/useRoomViewer";
import ButtonActions from "./components/ButtonActions.vue";

const canvas = ref<HTMLCanvasElement | null>(null);
const { initialize, changeValues } = useRoomViewer(canvas);

onMounted(() => {
  initialize();
});
</script>
