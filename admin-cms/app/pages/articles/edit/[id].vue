<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="pending" class="text-center py-10">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="alert alert-error">
      {{ error.message }}
    </div>

    <div v-else>
      <h1 class="text-3xl font-bold mb-6">Редактировать статью</h1>
      <ArticleForm
          :initial-article="article"
          @submit="update"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Article } from '../../../types';
import {useAsyncData, useRoute} from "nuxt/app";
import {useArticles} from "~/composables/useArticles";


const route = useRoute();
const id = parseInt(route.params.id as string);

const { fetchArticle, updateArticle } = useArticles();

const { data: article, pending, error } = useAsyncData<Article>(
    `article-${id}`,
    () => fetchArticle(id)
);

const update = async (updatedArticle: Partial<Article>) => {
  try {
    await updateArticle(id, updatedArticle);
    alert('Статья успешно обновлена!');
  } catch (error) {
    alert('Ошибка при обновлении статьи');
  }
};
</script>