<script setup lang="ts">
</script>

<template>
  <div class="container">
    <div>
      <slot name="left"></slot>
    </div>
    <div>
      <slot name="right"></slot>
    </div>
  </div>
</template>

<style scoped>
.container {
  height: 32px;

  display: flex;
  justify-content: space-between;

  margin-bottom: 8px;

  padding: 0 4px;
}
</style>