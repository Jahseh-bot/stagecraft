import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { host: { type: 'string', default: '127.0.0.1' }, port: { type: 'string', default: '4173' } } });
if (values.host !== '127.0.0.1') throw new Error('本地预览只允许 --host 127.0.0.1');
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('端口必须为 1–65535 的整数');
const root = resolve('docs/.vitepress/dist');
const notFound = await readFile(resolve(root, '404.html'));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const isFile = async p => { try { return (await stat(p)).isFile(); } catch { return false; } };
const server = createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const path = resolve(root, '.' + pathname);
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    let file;
    for (const candidate of [path, path + '.html', resolve(path, 'index.html')]) {
      if (await isFile(candidate)) { file = candidate; break; }
    }
    const data = file ? await readFile(file) : notFound;
    res.writeHead(file ? 200 : 404, { 'Content-Type': file ? (types[extname(file)] || 'application/octet-stream') : types['.html'], 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(400); res.end('Invalid request'); }
});
server.on('error', error => { console.error(`预览启动失败：${error.message}`); process.exitCode = 1; });
server.listen(port, values.host, () => console.log(`Stagecraft 预览：http://127.0.0.1:${port}/`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
