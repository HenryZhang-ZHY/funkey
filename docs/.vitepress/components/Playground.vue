<script setup lang="ts">
import {F_Object, runWithPrint} from '@funkey/interpreter'
import Editor from './Editor.vue'
import {onMounted, ref} from 'vue'

const code = ref<string>(`for (let i = 1; i < 10; i = i + 1) {
    for (let j = 1; j <= i; j = j + 1) {
        print(j);
        print("*");
        print(i);
        print("=");
        print(j*i);
        print(" ");
    }
    print("\\n");
}`)

const onCodeUpdate = (e) => {
  code.value = e
}

const output = ref<HTMLDivElement | null>(null)

const run = () => {
  const buffer: string[] = []
  const print = (...args: F_Object[]) => {
    buffer.push(args.map(x => x.inspect).join(' '))
  }
  try {
    runWithPrint(code.value, print)

  } catch (error) {
    let currentError = error
    let space = ''
    while (currentError) {
      buffer.push(`<span style="color: red">${space}${currentError.message}</span>`)
      space += '&nbsp;&nbsp;'
      currentError = currentError.innerError
    }
  } finally {
    output.value.innerHTML = buffer.join('').replaceAll('\\n', '<br/>')
  }
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
  height: calc(80vh - var(--vp-nav-height));
  min-height: 400px;
  max-width: calc(var(--vp-layout-max-width) - 64px);

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
  min-height: 40%;

  margin: 16px 0;
  padding: 16px;

  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  font-family: Consolas, serif;

  overflow: auto;
}
</style>
