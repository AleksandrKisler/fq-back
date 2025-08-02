import type { Article } from '../types'
import {useRuntimeConfig} from "nuxt/app";

export const useArticles = () => {
  const api = useRuntimeConfig().public.apiBase + '/articles';

  const fetchArticles = async () => {
    return $fetch<Article[]>(api);
  };

  const fetchArticle = async (id: number) => {
    return $fetch<Article>(`${api}/${id}`);
  };

  const createArticle = async (article: Partial<Article>) => {
    return $fetch<Article>(api, {
      method: 'POST',
      body: article
    });
  };

  const updateArticle = async (id: number, article: Partial<Article>) => {
    return $fetch<Article>(`${api}/${id}`, {
      method: 'PUT',
      body: article
    });
  };

  const deleteArticle = async (id: number) => {
    return $fetch(`${api}/${id}`, {
      method: 'DELETE'
    });
  };

  return {
    fetchArticles,
    fetchArticle,
    createArticle,
    updateArticle,
    deleteArticle
  };
};