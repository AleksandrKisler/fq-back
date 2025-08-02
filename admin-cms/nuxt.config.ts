// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  css: ['@vueup/vue-quill/dist/vue-quill.snow.css'],
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3001/api'
    }
  },
  vite: {
    optimizeDeps: {
      include: ['quill']
    }
  }
});