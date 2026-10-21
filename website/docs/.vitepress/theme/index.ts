import DefaultTheme from 'vitepress/theme-without-fonts'
import type { Theme } from 'vitepress'
import HomePage from './HomePage.vue'
import StageFlow from './StageFlow.vue'
import './style.css'
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) { app.component('HomePage', HomePage); app.component('StageFlow', StageFlow) }
} satisfies Theme
