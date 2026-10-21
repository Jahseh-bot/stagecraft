<script setup lang="ts">
import { withBase } from 'vitepress'
import StageFlow from './StageFlow.vue'
</script>

<template>
  <main id="main-content" class="home">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <a class="release" :href="withBase('/changelog/')">Stagecraft 0.4.2 · npm 已发布 <span aria-hidden="true">↗</span></a>
        <h1 id="hero-title">专心做产品，<br>不用纠结选哪套 Skill。</h1>
        <p class="intro">Stagecraft 为各阶段筛选并组合成熟实践。<br class="desktop-break">你选择产品方向，agent 按方法完成设计、实现和验证。</p>
        <div class="actions"><a class="primary" :href="withBase('/guide/')">开始使用</a><a class="secondary" :href="withBase('/workflow/')">了解工作流程</a></div>
        <p class="prerequisites">从一个阶段开始。适配多种 coding agent，无需单独运行 Codex CLI。</p>
      </div>
      <div class="workbench" aria-label="终端命令与开发流程示意">
        <div class="terminal">
          <div class="terminal-bar"><span class="terminal-mark" aria-hidden="true">›_</span><span>在 agent 会话中直接使用</span><span class="terminal-label">对话示例</span></div>
          <pre tabindex="0" aria-label="Stagecraft 启动命令"><code>使用 Stagecraft 七阶段 Skills，
先评审 PRD.md，再实现可运行应用。
关键方案先给选项与理由，等我确认。
逐环节先讨论：推荐选项在前，也可自由补充。
每阶段保存并展示成果，然后结束本轮。
等我回复通过，再讨论下一阶段；修改后重新评审。</code></pre>
          <p class="terminal-note">“我想做一个中文温度换算网页。”</p>
        </div>
        <div class="flow-panel"><StageFlow compact /></div>
        <div class="workbench-foot"><span class="status-dot" aria-hidden="true"></span>方案先选择，成果要评审，记录可追溯。</div>
      </div>
    </section>

    <section class="capabilities" aria-labelledby="capabilities-title">
      <div class="section-lead"><h2 id="capabilities-title">把分散的方法，<br>组织成产品交付流程。</h2><p>方法由 Stagecraft 编排，产品方向由你决定。</p></div>
      <dl class="capability-list">
        <div><dt>按阶段选择合适的方法</dt><dd>需求与产品推敲、视觉方案、架构设计、测试诊断各有对应方法；根据任务自动选择，无需用户逐个挑选。</dd></div>
        <div><dt>方法必须落实为具体成果</dt><dd>从场景、术语和决策，到设计预览、代码与测试证据。每个阶段记录方法实际产生的成果，不能只写“遵循最佳实践”。</dd></div>
        <div><dt>随时暂停，接着完成</dt><dd>统一记录目标、决定、成果与验证证据。换会话或换 agent 后接着做；上游变化时重新核验下游结果。</dd></div>
      </dl>
    </section>

    <section class="entry-section" aria-labelledby="entry-title">
      <h2 id="entry-title">从你现在的位置开始</h2>
      <p class="section-description">新想法、已有项目，或准备发布上线的应用。</p>
      <div class="entry-list">
        <a class="entry" :href="withBase('/guide/requirements.html')"><span class="entry-symbol" aria-hidden="true">＋</span><div><h3>我有一个想法</h3><p>从需求评审到设计、架构、实现与测试。</p></div><span class="entry-link">从需求开始</span></a>
        <a class="entry" :href="withBase('/guide/existing-project.html')"><span class="entry-symbol" aria-hidden="true">✓</span><div><h3>我有一个项目</h3><p>检查现有应用，选择只审计或允许修复。</p></div><span class="entry-link">进入测试</span></a>
        <a class="entry" :href="withBase('/guide/deployment.html')"><span class="entry-symbol" aria-hidden="true">▣</span><div><h3>我想保持应用运行</h3><p>在已授权目标发布，验证实际版本与访问地址。</p></div><span class="entry-link">了解部署验证</span></a>
      </div>
    </section>

    <section class="getting-started" aria-labelledby="getting-started-title">
      <div><h2 id="getting-started-title">第一次打开终端？<br>我们从这里一起开始。</h2><p>跟着完整教程做一个温度换算网页。从安装技能到在 agent 中提出任务，每一步都有操作说明。</p><a class="primary" :href="withBase('/guide/preparation.html')">准备运行环境</a></div>
      <ol class="reading-path"><li><a :href="withBase('/guide/preparation.html')">安装工具，检查连接</a><span>安装器、coding agent 和阶段技能</span></li><li><a :href="withBase('/guide/first-run.html')">在 agent 中开始任务</a><span>七阶段调用提示词与成果评审</span></li><li><a :href="withBase('/guide/delivery.html')">找到结果，打开网页</a><span>阅读交付说明，亲手试一试</span></li></ol>
    </section>
    <p class="scope-note">Stagecraft 使用当前 agent 的账号、工具和权限。能力取决于宿主与环境；安装技能不提供模型或托管服务。<a :href="withBase('/guide/troubleshooting.html')">查看平台支持与常见问题</a></p>
  </main>
</template>

<style scoped>
.home { max-width: 1200px; margin: 0 auto; padding: 0 40px 64px; }
.hero { display: grid; grid-template-columns: 1.08fr 1fr; gap: 56px; align-items: center; padding: 72px 0 86px; }
.hero-copy { min-width: 0; }
.release { display: inline-flex; gap: 20px; align-items: center; color: var(--vp-c-brand-1); font-size: 14px; margin-bottom: 28px; }
h1 { font-size: clamp(36px, 4.3vw, 58px); line-height: 1.22; letter-spacing: -.045em; font-weight: 720; margin: 0 0 28px; }
.intro { color: var(--vp-c-text-2); line-height: 1.9; font-size: 17px; max-width: 31em; }
.actions { display: flex; flex-wrap: wrap; gap: 12px; margin: 30px 0 20px; }
.primary, .secondary { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 10px 22px; border-radius: 7px; font-weight: 600; font-size: 15px; }
.primary { background: #087f8c; color: #fff; }
.primary:hover { background: #066b77; }
.secondary { border: 1px solid var(--sc-line); background: var(--vp-c-bg); }
.secondary:hover { border-color: var(--vp-c-brand-1); }
.prerequisites { max-width: 28em; font-size: 13px; color: var(--vp-c-text-2); line-height: 1.8; }
.workbench { min-width: 0; border: 1px solid var(--sc-line); border-radius: 14px; background: var(--vp-c-bg); box-shadow: 0 18px 55px #102d3610; overflow: hidden; }
.terminal { background: var(--sc-terminal); color: #eef4f5; padding: 20px 24px; }
.terminal-bar { display: flex; align-items: center; gap: 9px; color: #c3d3db; font-size: 12px; }
.terminal-mark { color: #63d9be; font-size: 18px; }
.terminal-label { margin-left: auto; color: #a6bac5; }
pre { overflow-x: auto; font-family: var(--vp-font-family-mono); font-size: 12px; line-height: 1.85; padding: 22px 0 14px; margin: 0; }
.terminal-note { border-top: 1px solid #43505a; padding-top: 14px; color: #b8d8d1; font-size: 13px; }
.flow-panel { padding: 23px 27px; }
.workbench-foot { padding: 14px 22px; background: var(--vp-c-bg-soft); display: flex; gap: 9px; align-items: center; color: var(--vp-c-text-2); font-size: 12px; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--vp-c-brand-1); flex-shrink: 0; }
h2 { font-size: clamp(25px, 2.7vw, 34px); line-height: 1.5; letter-spacing: -.035em; font-weight: 650; }
.capabilities { display: grid; grid-template-columns: 1fr 1.25fr; gap: 80px; border-top: 1px solid var(--sc-line); padding: 64px 0; }
.section-lead p, .section-description { color: var(--vp-c-text-2); line-height: 1.8; margin-top: 14px; }
.capability-list { margin: 0; }
.capability-list > div + div { margin-top: 28px; }
dt { font-size: 18px; font-weight: 600; margin-bottom: 7px; }
dd { font-size: 15px; color: var(--vp-c-text-2); line-height: 1.8; margin: 0; max-width: 38em; }
.entry-section { padding: 20px 0 64px; }
.entry-list { margin-top: 28px; border-top: 1px solid var(--sc-line); }
.entry { display: grid; grid-template-columns: 36px 1fr auto; align-items: center; gap: 20px; padding: 27px 6px; border-bottom: 1px solid var(--sc-line); }
.entry:hover h3, .reading-path a:hover { color: var(--vp-c-brand-1); }
.entry-symbol { color: var(--vp-c-brand-1); font-size: 24px; }
h3 { font-size: 19px; font-weight: 600; }
.entry p { margin-top: 5px; font-size: 14px; color: var(--vp-c-text-2); }
.entry-link { color: var(--vp-c-brand-1); font-size: 14px; }
.getting-started { padding: 42px; background: var(--vp-c-bg-soft); border-radius: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 70px; }
.getting-started p { color: var(--vp-c-text-2); font-size: 15px; line-height: 1.85; margin: 17px 0 23px; max-width: 29em; }
.reading-path { margin: 0; padding-left: 24px; align-self: center; }
.reading-path li { padding: 12px 0 12px 10px; }
.reading-path li::marker { color: var(--vp-c-brand-1); }
.reading-path a { font-size: 16px; font-weight: 600; }
.reading-path span { display: block; color: var(--vp-c-text-2); font-size: 13px; margin-top: 5px; }
.scope-note { color: var(--vp-c-text-2); font-size: 12px; line-height: 1.9; margin-top: 27px; }
.scope-note a { color: var(--vp-c-brand-1); text-decoration: underline; text-underline-offset: 3px; }
@media (max-width: 960px) { .hero { gap: 30px; } .home { padding-inline: 28px; } .desktop-break { display: none; } .capabilities { gap: 40px; } .getting-started { gap: 32px; padding: 30px; } }
@media (max-width: 700px) { .home { padding-inline: 22px; } .hero { grid-template-columns: 1fr; padding: 40px 0 50px; gap: 36px; } h1 { font-size: 42px; } .release { margin-bottom: 22px; } .intro { font-size: 16px; } .capabilities { grid-template-columns: 1fr; gap: 30px; padding: 42px 0; } .entry { grid-template-columns: 24px 1fr; gap: 14px; } .entry-link { grid-column: 2; } .entry p { line-height: 1.8; } .getting-started { grid-template-columns: 1fr; padding: 25px; gap: 16px; } .terminal { padding: 18px; } pre { font-size: 11px; } .flow-panel { padding: 20px; } }
</style>
