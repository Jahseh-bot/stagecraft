<script setup lang="ts">
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
const stages = [
  { title: '创意判断', detail: '研究证据、挑战假设、形成可验证的方向。' },
  { title: '需求规格', detail: '补齐关键规则，形成可观察的验收条件。' },
  { title: '体验设计', detail: '完成流程、状态与响应式设计并检查。' },
  { title: '技术架构', detail: '验证技术约束，确定实现与测试路径。' },
  { title: '开发实现', detail: '实现、自测、诊断和修复。' },
  { title: '测试回归', detail: '执行测试，在授权范围内修复并复验。' },
  { title: '部署验证', detail: '向授权目标发布，验证实际版本与地址。' }
]
</script>

<template>
  <ol class="stage-flow" :class="{ compact }" aria-label="从需求到交付的七个阶段">
    <li v-for="(stage, index) in stages" :key="stage.title" class="stage">
      <span class="step-number" aria-hidden="true">{{ index + 1 }}</span>
      <div class="stage-body"><div class="stage-heading"><strong>{{ stage.title }}</strong></div><p v-if="!compact" class="detail">{{ stage.detail }}</p></div>
    </li>
  </ol>
</template>

<style scoped>
.stage-flow { list-style: none; padding: 0; margin: 28px 0; }
.stage { display: flex; position: relative; gap: 18px; margin: 0; padding: 0 0 28px; }
.stage:not(:last-child)::before { content: ''; position: absolute; left: 16px; top: 33px; bottom: 0; width: 1px; background: var(--sc-line); }
.step-number { border: 1px solid var(--sc-line); background: var(--vp-c-bg); color: var(--vp-c-brand-1); width: 34px; height: 34px; display: grid; place-items: center; border-radius: 10px; font-size: 14px; flex-shrink: 0; }
.stage-body { flex: 1; min-width: 0; }
.stage-heading { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; min-height: 34px; }
.human { font-size: 12px; padding: 0 8px; border-radius: 4px; background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); white-space: nowrap; }
.detail { color: var(--vp-c-text-2); margin: 6px 0 0; font-size: 15px; }
.compact { margin: 0; }
.compact .stage { padding-bottom: 17px; }
.compact .stage:last-child { padding-bottom: 0; }
.compact .stage-heading { justify-content: space-between; }
</style>
