<script setup lang="ts">
import {ref} from "vue"

interface Sample {
  name: string,
  code: string,
}

interface Chapter {
  name: string
  samples: Sample[]
}

interface Props {
  chapters: Chapter[],
}

const {
  chapters,
} = defineProps<Props>()

const emit = defineEmits(['select:code'])

const select = ref<HTMLSelectElement | null>(null)

const onSelect = () => {
  const selectElement = select.value
  if (!selectElement) {
    return
  }
  const code = selectElement.options[selectElement.selectedIndex].value
  emit('select:code', code)
}

</script>

<template>
  <div>
    <span class="description">Examples: </span>
    <select ref="select" class="select-box" @change="onSelect">
      <option disabled hidden selected>Select an example...</option>
      <optgroup :label="chapter.name" v-for="chapter in chapters">
        <option v-for="sample in chapter.samples" :label="sample.name" :value="sample.code"/>
      </optgroup>
    </select>
  </div>
</template>

<style scoped>
.description {
  font-weight: 400;
  font-size: 19px;
}

.select-box {
  appearance: menulist-button;

  height: 32px;

  border: 1px solid #ced4da;
  border-radius: 8px;

  padding: 4px 4px;

  font-size: 18px;
  line-height: 1.1;
}
</style>