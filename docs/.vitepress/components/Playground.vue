<script setup lang="ts">
import {F_Object, runWithPrint} from '@funkey/interpreter'
import Editor from './Editor.vue'
import {onMounted, ref} from 'vue'

const code = ref<string>(`let add = fn(a, b) { a + b; };

let result = add(512, 2048);

print(result);`)

const onCodeUpdate = (e) => {
  code.value = e
}

const output = ref<HTMLDivElement | null>(null)

const run = () => {
  const lines: string[] = []
  const print = (...args: F_Object[]) => {
    lines.push(args.map(x => x.inspect).join(' '))
  }
  runWithPrint(code.value, print)
  output.value.innerHTML = lines.join('<br/>')
}

onMounted(() => {
  run()
})
</script>

<template>
  <div id="playground">
    <div id="tool-bar">
      <button id="btn-run" @click="run">run</button>
    </div>

    <Editor :model-value="code" :lang="'funkey'" :hide-minimap="false" @update:model-value="onCodeUpdate"/>

    <div id="output" ref="output"></div>
  </div>
</template>

<style scoped>
#playground {
  max-width: calc(var(--vp-layout-max-width) - 64px);
  height: calc(80vh - var(--vp-nav-height));

  margin: 8px auto;
}

#tool-bar {
  height: 32px;

  display: flex;
  flex-direction: row-reverse;

  margin-bottom: 8px;
}

#btn-run {
  width: 64px;
  border-radius: 4px;
  background-color: hsl(141, 60%, 38%);

  color: white;
  font-size: 18px;
}

#output {
  width: 100%;
  height: 28%;

  margin: 16px 0;
  padding: 16px;

  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  font-family: Consolas, serif;
}
</style>
