<script setup lang="ts">
interface Props {
  content?: string
}

const {
  content = ''
} = defineProps<Props>()
</script>

<template>
  <div class="container" v-html="content"></div>
</template>

<style scoped>
.container {
  width: 100%;
  min-height: 40%;

  margin: 16px 0;
  padding: 16px;

  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  font-family: Consolas, serif;

  overflow: auto;
}
</style>