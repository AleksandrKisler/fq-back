<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Создать новую статью</h1>

    <ArticleForm
        :initial-article="initialArticle"
        @submit="createArticle"
    />
  </div>
</template>

<script setup lang="ts">
import type { Article } from '~/types';

const initialArticle: Partial<Article> = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  main_image: '',
  publish_date: new Date().toISOString().split('T')[0],
  meta_title: '',
  meta_description: ''
};

const { createArticle } = useArticles();
const router = useRouter();

const create = async (article: Partial<Article>) => {
  try {
    const created = await createArticle(article);
    router.push(`/articles/${created.id}`);
  } catch (error) {
    alert('Ошибка при создании статьи');
  }
};
</script>