<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Управление статьями</h1>
      <NuxtLink to="/articles/create" class="btn btn-primary">
        + Новая статья
      </NuxtLink>
    </div>

    <div v-if="pending" class="text-center py-10">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="alert alert-error">
      {{ error.message }}
    </div>

    <div v-else>
      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
          <tr>
            <th>ID</th>
            <th>Заголовок</th>
            <th>Дата публикации</th>
            <th>Действия</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="article in articles" :key="article.id">
            <td>{{ article.id }}</td>
            <td>{{ article.title }}</td>
            <td>{{ formatDate(article.publish_date) }}</td>
            <td class="flex space-x-2">
              <NuxtLink :to="`/articles/${article.id}`" class="btn btn-sm btn-info">
                Просмотр
              </NuxtLink>
              <NuxtLink :to="`/articles/edit/${article.id}`" class="btn btn-sm btn-warning">
                Редактировать
              </NuxtLink>
              <button @click="deleteArticle(article.id)" class="btn btn-sm btn-error">
                Удалить
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Article } from '../../types';
import {useArticles} from "../../composables/useArticles";
import {useAsyncData} from "nuxt/app";

const { fetchArticles, deleteArticle: deleteArticleApi } = useArticles();

const { data: articles, pending, error, refresh } = useAsyncData<Article[]>(
    'articles',
    () => fetchArticles()
);

const deleteArticle = async (id: number) => {
  if (confirm('Вы уверены, что хотите удалить эту статью?')) {
    try {
      await deleteArticleApi(id);
      refresh();
    } catch (err) {
      alert('Ошибка при удалении статьи');
    }
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};
</script>