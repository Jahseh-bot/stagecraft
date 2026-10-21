import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
const base = process.env.SITE_BASE || '/';
const root = resolve('docs/.vitepress/dist');
function files(dir) { return readdirSync(dir).flatMap(name => { const p = join(dir, name); return statSync(p).isDirectory() ? files(p) : [p]; }); }
function target(path) {
  assert.ok(path.startsWith(base), `链接逃离部署路径: ${path}`);
  const p = join(root, decodeURIComponent(path.slice(base.length)));
  if (path.endsWith('/')) return join(p, 'index.html');
  if (existsSync(p) && statSync(p).isFile()) return p;
  // Use real static files: GitHub Pages has no custom URL rewrite server.
  return join(p, 'index.html');
}
const decode = text => text.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
test('生产构建输出所有关键页面及可读元数据', () => {
  for (const path of ['index.html', 'guide/index.html', 'guide/preparation.html', 'guide/requirements.html', 'guide/first-run.html', 'guide/confirmation.html', 'guide/delivery.html', 'guide/resume.html', 'guide/deployment.html', 'guide/existing-project.html', 'guide/packages.html', 'guide/troubleshooting.html', 'guide/upgrading.html', 'cli/index.html', 'workflow/index.html', 'changelog/index.html', '404.html']) {
    const html = readFileSync(join(root, path), 'utf8');
    assert.match(html, /<html[^>]*lang="zh-CN"/);
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(html, /name="description" content="[^\"]+"/);
    assert.ok(html.includes('Stagecraft'), path);
    assert.ok(html.includes('/logo.svg'), `favicon: ${path}`);
    assert.doesNotMatch(html, /\/Users\/curveslink|fonts\.googleapis|placehold\.co/);
  }
});
test('每个生产页面的站内链接、锚点和静态资源均可解析', () => {
  const pages = files(root).filter(p => p.endsWith('.html'));
  assert.ok(pages.length >= 17);
  for (const file of pages) {
    const html = readFileSync(file, 'utf8');
    const pageURL = new URL(base + file.slice(root.length + 1), 'http://site.local');
    for (const [, raw] of html.matchAll(/(?:href|src)="([^\"]+)"/g)) {
      if (/^(?:https?:|mailto:|data:|tel:)/.test(raw)) continue;
      const url = new URL(decode(raw), pageURL);
      const dest = target(url.pathname);
      assert.ok(existsSync(dest), `${file.slice(root.length)} → ${raw}`);
      if (url.hash && dest.endsWith('.html')) {
        const id = decodeURIComponent(url.hash.slice(1));
        assert.ok(readFileSync(dest, 'utf8').includes(`id="${id}"`), `不存在的锚点 ${raw} in ${file.slice(root.length)}`);
      }
    }
  }
});
