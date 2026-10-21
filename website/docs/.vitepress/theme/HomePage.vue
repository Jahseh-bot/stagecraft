<script setup lang="ts">
import { withBase } from 'vitepress'
import StageFlow from './StageFlow.vue'
</script>

<template>
  <main id="main-content" class="home">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <a class="release" :href="withBase('/changelog/')">Stagecraft 0.3.0 已发布到 npm <span aria-hidden="true">↗</span></a>
        <h1 id="hero-title">从你的需求，<br>到能运行的应用。</h1>
        <p class="intro">用中文写下想法，把实现交给 Stagecraft。<br class="desktop-break">从澄清、编写到测试，每个关键决定都由你确认。</p>
        <div class="actions"><a class="primary" :href="withBase('/guide/')">开始使用</a><a class="secondary" :href="withBase('/workflow/')">了解工作流程</a></div>
        <p class="prerequisites">从一个小网页开始。需要 Node.js 22+ 和已登录的 Codex CLI。</p>
      </div>
      <div class="workbench" aria-label="终端命令与开发流程示意">
        <div class="terminal">
          <div class="terminal-bar"><span class="terminal-mark" aria-hidden="true">›_</span><span>从一份 PRD.md 开始</span><span class="terminal-label">终端示例</span></div>
          <pre tabindex="0" aria-label="Stagecraft 启动命令"><code>npx --yes @gaaraa/runner@0.3.0 start \
  --prd ./PRD.md --dir ./my-app</code></pre>
          <p class="terminal-note">“我想做一个中文温度换算网页。”</p>
        </div>
        <div class="flow-panel"><StageFlow compact /></div>
        <div class="workbench-foot"><span class="status-dot" aria-hidden="true"></span>自动推进，也为你的决定留出位置。</div>
      </div>
    </section>

    <section class="capabilities" aria-labelledby="capabilities-title">
      <div class="section-lead"><h2 id="capabilities-title">不只生成代码，<br>还要把结果跑起来。</h2><p>把重复的执行交给工具，把重要的判断留给你。</p></div>
      <dl class="capability-list">
        <div><dt>先说清楚，再开始</dt><dd>需求有歧义时会提出问题。你可以接受建议，也可以要求修改方案；确认后才开始实现。</dd></div>
        <div><dt>用真实检查检验结果</dt><dd>执行批准的测试和本机 HTTP 检查，保留失败日志，在预算内尝试修复。交付说明告诉你怎样启动。</dd></div>
        <div><dt>随时暂停，接着完成</dt><dd>保存任务状态和已确认的决定。保留运行目录，用同一版本恢复，不必重新描述整个项目。</dd></div>
      </dl>
    </section>

    <section class="entry-section" aria-labelledby="entry-title">
      <h2 id="entry-title">从你现在的位置开始</h2>
      <p class="section-description">新想法、已有项目，或准备在本机持续运行的应用。</p>
      <div class="entry-list">
        <a class="entry" :href="withBase('/guide/requirements.html')"><span class="entry-symbol" aria-hidden="true">＋</span><div><h3>我有一个想法</h3><p>写下需求，让 runner 带你完成开发和测试。</p></div><span class="entry-link">从需求开始</span></a>
        <a class="entry" :href="withBase('/guide/existing-project.html')"><span class="entry-symbol" aria-hidden="true">✓</span><div><h3>我有一个项目</h3><p>检查现有应用，选择只审计或允许修复。</p></div><span class="entry-link">进入测试</span></a>
        <a class="entry" :href="withBase('/guide/deployment.html')"><span class="entry-symbol" aria-hidden="true">▣</span><div><h3>我想保持应用运行</h3><p>确认配置和方案后，使用本机 Docker Compose。</p></div><span class="entry-link">了解本机部署</span></a>
      </div>
    </section>

    <section class="getting-started" aria-labelledby="getting-started-title">
      <div><h2 id="getting-started-title">第一次打开终端？<br>我们从这里一起开始。</h2><p>跟着完整教程做一个温度换算网页。每一步都有命令、预期结果和遇到问题时的处理方法。</p><a class="primary" :href="withBase('/guide/preparation.html')">准备运行环境</a></div>
      <ol class="reading-path"><li><a :href="withBase('/guide/preparation.html')">安装工具，检查连接</a><span>Node.js、Codex 和 Stagecraft</span></li><li><a :href="withBase('/guide/first-run.html')">启动任务，确认方案</a><span>保存运行目录，提交答案文件</span></li><li><a :href="withBase('/guide/delivery.html')">找到结果，打开网页</a><span>阅读交付说明，亲手试一试</span></li></ol>
    </section>
    <p class="scope-note">Stagecraft 使用你的 Codex 账号及额度。当前提供本机交付与 Compose 部署，不提供云托管。<a :href="withBase('/guide/troubleshooting.html')">查看平台支持与常见问题</a></p>
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
