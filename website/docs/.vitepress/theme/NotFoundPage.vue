<script setup lang="ts">
import { withBase } from 'vitepress'
</script>

<template>
  <main class="vp-doc not-found-page">
    <h1>404 · 这一页还没有登场</h1>
    <p>地址可能已经变化。你可以返回首页，或搜索需要的操作。</p>
    <p>
      <a :href="withBase('/')">返回首页</a>
      ·
      <a :href="withBase('/guide/')">阅读使用指南</a>
    </p>
  </main>
</template>

<style scoped>
.not-found-page {
  max-width: 640px;
  margin: 80px auto;
  padding: 24px;
}
</style>
