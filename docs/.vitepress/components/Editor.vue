<script setup lang="ts">
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import {computed, onMounted, ref} from 'vue'

interface Props {
  modelValue: string
  lang?: string
  hideMinimap?: boolean
}

const {
  hideMinimap,
  lang = 'funkey',
  modelValue,
} = defineProps<Props>()

const emits = defineEmits(['update:modelValue'])

const vModel = computed<string>({
  get: () => modelValue,
  set: (newVal: string) => {
    emits('update:modelValue', newVal)
  },
})

self.MonacoEnvironment = {
  getWorker: () => new EditorWorker()
}

const root = ref<HTMLDivElement>()

onMounted(async () => {
  const {editor: monacoEditor, languages} = await import('monaco-editor')

  if (!root.value) {
    return
  }

  languages.register({id: 'funkey'})
  languages.setMonarchTokensProvider('funkey', {
    keywords: [
      'let', 'fn', 'return', 'if', 'true', 'false',
    ],

    operators: [
      '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
      '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
      '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
      '%=', '<<=', '>>=', '>>>='
    ],

    // we include these common regular expressions
    symbols: /[=><!~?:&|+\-*\/^%]+/,

    // The main tokenizer for our languages
    tokenizer: {
      root: [
        // identifiers and keywords
        [/[a-z_$][\w$]*/, {
          cases: {
            '@keywords': 'keyword',
            '@default': 'identifier'
          }
        }],
        [/[A-Za-z][\w$]*/, 'type.identifier'],  // to show class names nicely

        // whitespace
        {include: '@whitespace'},

        // delimiters and operators
        [/[{}()\[\]]/, '@brackets'],
        [/[<>](?!@symbols)/, '@brackets'],
        [/@symbols/, {
          cases: {
            '@operators': 'operator',
            '@default': ''
          }
        }],

        // numbers
        [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
        [/\d+/, 'number'],

        // delimiter: after number because of .\d floats
        [/[;,.]/, 'delimiter'],

        // strings
        [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
        [/"/, {token: 'string.quote', bracket: '@open', next: '@string'}],

        // characters
        [/'[^\\']'/, 'string'],
        [/'/, 'string.invalid']
      ],

      string: [
        [/[^\\"]+/, 'string'],
        [/"/, {token: 'string.quote', bracket: '@close', next: '@pop'}]
      ],

      whitespace: [[/[ \t\r\n]+/, 'white'],],
    },
  })

  const model = monacoEditor.createModel(vModel.value, lang)
  model.onDidChangeContent(() => {
    vModel.value = model.getValue()
  })

  monacoEditor.create(root.value, {
    model,
    theme: 'vs',
    foldingStrategy: 'indentation',
    selectOnLineNumbers: true,
    scrollbar: {
      verticalScrollbarSize: 4,
      horizontalScrollbarSize: 4,
    },
    tabSize: 2,
    automaticLayout: true,
    minimap: {
      enabled: !hideMinimap,
    },
    fontSize: 16,
  })
})
</script>

<template>
  <div class="editor" ref="root"></div>
</template>

<style scoped>
.editor {
  width: 100%;
  height: 70%;

  margin: 0;
  padding: 16px 4px 16px 0;

  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>