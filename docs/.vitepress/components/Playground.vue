<script setup lang="ts">
import Console from './Console.vue'
import CodeSampleSelector from './CodeSampleSelector.vue'
import Editor from './Editor.vue'
import ToolBar from './ToolBar.vue'
import {onMounted, ref} from 'vue'
import {F_Object, runWithPrint} from '@funkey/interpreter'
import {data as CodeSamples} from "../data/playground/PlaygroundSamples.data";

const code = ref<string>(`print("Hello World");`)
const output = ref<string>('')

const onSampleSelected = (codeText: string) => {
  code.value = codeText
}

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
    output.value = buffer.join('').replaceAll('\\n', '<br/>')
  }
}

onMounted(() => {
  run()
})
</script>

<template>
  <div id="playground">
    <ToolBar>
      <template #left>
        <CodeSampleSelector :chapters="CodeSamples.chapters" @select:code="onSampleSelected"/>
      </template>
      <template #right>
        <button id="btn-run" @click="run">run</button>
      </template>
    </ToolBar>

    <Editor v-model="code" :lang="'funkey'" :hide-minimap="false"/>

    <Console :content="output"></Console>
  </div>
</template>

<style scoped>
#playground {
  height: calc(80vh - var(--vp-nav-height));
  min-height: 400px;
  max-width: calc(var(--vp-layout-max-width) - 64px);

  margin: 8px auto;
}

#btn-run {
  width: 64px;
  border-radius: 4px;
  background-color: hsl(141, 60%, 38%);

  color: white;
  font-size: 18px;
  font-weight: 400;
}
</style>
