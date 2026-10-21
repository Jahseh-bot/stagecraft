<script setup lang="ts">
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
const stages = [
  { title: '写下需求', detail: '用中文说明给谁用、做什么、怎样算完成。', action: '你来描述' },
  { title: '澄清问题', detail: '回答当前问题，补齐影响开发的关键决定。', action: '你来回答' },
  { title: '确认方案', detail: '审阅功能、技术选择和验收命令，再批准实现。', action: '你来确认' },
  { title: '实现应用', detail: 'Codex 按已确认的方案编写项目文件。' },
  { title: '测试与修复', detail: '执行真实检查，在修复预算内处理失败。' },
  { title: '交付成果', detail: '阅读交付说明，启动应用；按需另行确认本机部署。', action: '你来验收' }
]
</script>

<template>
  <ol class="stage-flow" :class="{ compact }" aria-label="从需求到交付的六个阶段">
    <li v-for="(stage, index) in stages" :key="stage.title" class="stage">
      <span class="step-number" aria-hidden="true">{{ index + 1 }}</span>
      <div class="stage-body"><div class="stage-heading"><strong>{{ stage.title }}</strong><span v-if="stage.action" class="human">{{ stage.action }}</span></div><p v-if="!compact" class="detail">{{ stage.detail }}</p></div>
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
