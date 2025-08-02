<template>
  <div class="editor">
    <QuillEditor
        ref="quill"
        :content="modelValue"
        contentType="html"
        :modules="modules"
        @update:content="updateContent"
    />
    <input
        type="file"
        ref="fileInput"
        style="display: none"
        @change="handleImageUpload"
    />
  </div>
</template>

<script setup lang="ts">
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vuequill/dist/vue-quill.snow.css';
import {ref} from 'vue';

const props = defineProps({
  modelValue: String
});

const emit = defineEmits(['update:modelValue']);

const quill = ref();
const fileInput = ref<HTMLInputElement>();

const modules = {
  toolbar: {
    container: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ header: 1 }, { header: 2 }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],
      ['clean'],
      ['link', 'image', 'video']
    ],
    handlers: {
      image: () => {
        fileInput.value?.click();
      }
    }
  }
};

const updateContent = (content: string) => {
  emit('update:modelValue', content);
};

const handleImageUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  const formData = new FormData();
  formData.append('image', file);

  try {
    // В реальном приложении замените на ваш API эндпоинт
    const { url } = await $fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const range = quill.value.getQuill().getSelection();
    quill.value.getQuill().insertEmbed(range.index, 'image', url);
  } catch (error) {
    console.error('Upload failed:', error);
  }

  input.value = '';
};
</script>