import { defineConfig } from 'vitepress'
const guide = [
  { text: '从零开始', items: [
    { text: '什么是 Stagecraft', link: '/guide/' },
    { text: '准备环境', link: '/guide/preparation' },
    { text: '安装七阶段 Skills', link: '/guide/packages' },
    { text: '创建需求说明', link: '/guide/requirements' },
    { text: '从 PRD 到完整交付', link: '/guide/first-run' },
  ] },
  { text: '理解每一步', items: [
    { text: '不再纠结选哪套 Skill', link: '/guide/methods' },
    { text: '关键方案确认与自动执行', link: '/guide/confirmation' },
    { text: '测试用例与执行', link: '/guide/test-cases' },
    { text: '产物评审与全过程追溯', link: '/guide/artifact-reviews' },
    { text: '查看成果与启动网页', link: '/guide/delivery' }
  ] },
  { text: '继续使用', items: [
    { text: '暂停、恢复与处理失败', link: '/guide/resume' },
    { text: '检查和修复已有项目', link: '/guide/existing-project' },
    { text: '部署与发布验证', link: '/guide/deployment' },
    { text: '故障排查与平台说明', link: '/guide/troubleshooting' },
    { text: '固定版本与升级', link: '/guide/upgrading' }
  ] },
  { text: '覆盖与维护', items: [
    { text: 'Skills 覆盖范围', link: '/guide/skill-coverage' },
    { text: '维护内置三方 Skills', link: '/guide/skill-maintenance' },
    { text: '工作流程', link: '/workflow/' },
    { text: 'CLI 参考', link: '/cli/' },
    { text: '更新记录', link: '/changelog/' }
  ] }
]
const base = process.env.SITE_BASE || '/'

export default defineConfig({
  base,
  lang: 'zh-CN', title: 'Stagecraft',
  description: '把中文需求变成可运行应用。Stagecraft 零基础指南、工作流程、CLI 参考与更新记录。',
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}logo.svg` }], ['meta', { name: 'theme-color', content: '#087F8C' }]],
  cleanUrls: false,
  vite: { server: { host: '127.0.0.1', port: 5173, strictPort: true }, preview: { host: '127.0.0.1', strictPort: true } },
  themeConfig: {
    logo: { src: '/logo.svg', alt: '' },
    nav: [
      { text: '指南', link: '/guide/' }, { text: '工作流程', link: '/workflow/' },
      { text: 'CLI 参考', link: '/cli/' }, { text: '更新记录', link: '/changelog/' },
      { text: 'GitHub', link: 'https://github.com/Jahseh-bot/stagecraft' }
    ],
    sidebar: guide,
    outline: { level: [2, 3], label: '本文目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    sidebarMenuLabel: '文档导航', returnToTopLabel: '返回顶部',
    darkModeSwitchLabel: '外观', darkModeSwitchTitle: '切换到深色模式', lightModeSwitchTitle: '切换到浅色模式',
    notFound: { title: '这一页还没有登场', quote: '地址可能已经变化。回到首页，或搜索你需要的操作。', linkLabel: '返回首页', linkText: '返回首页' },
    search: { provider: 'local', options: {
      locales: { root: { translations: { button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' }, modal: { displayDetails: '显示详细结果', resetButtonTitle: '清空搜索', backButtonTitle: '关闭搜索', noResultsText: '没有找到相关内容', footer: { selectText: '选择', selectKeyAriaLabel: '回车', navigateText: '切换', navigateUpKeyAriaLabel: '向上', navigateDownKeyAriaLabel: '向下', closeText: '关闭', closeKeyAriaLabel: '退出' } } } } },
      miniSearch: { options: { tokenize: (text: string) => text.toLowerCase().match(/[a-z0-9_@./-]+|[\u3400-\u9fff]/g) || [] }, searchOptions: { prefix: true, fuzzy: false } }
    } },
    footer: { message: '在当前 agent 中完成闭环，让每个阶段平滑衔接。', copyright: 'Stagecraft · 在当前 agent 中完成产品交付' }
  }
})
