import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function optionalFile(path) {
  try { return await readFile(path, 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return ''; throw error; }
}
export async function detectTechnologies(project, explicit = [], approvedStack = '') {
  const evidence = [];
  const tags = new Set(explicit);
  for (const tag of explicit) evidence.push({ technology: tag, source: 'explicit --stack' });
  const add = (tag, source) => { tags.add(tag); evidence.push({ technology: tag, source }); };
  const packageText = await optionalFile(join(project, 'package.json'));
  if (packageText) {
    const pkg = JSON.parse(packageText);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const mapping = { vue: 'vue', nuxt: 'vue', pinia: 'pinia', 'vue-router': 'vue-router', react: 'react', next: 'nextjs', 'react-native': 'react-native', express: 'express', fastify: 'fastify', pg: 'postgres', postgres: 'postgres', '@supabase/supabase-js': 'postgres', mongodb: 'mongodb', mongoose: 'mongodb', redis: 'redis', ioredis: 'redis', vitest: 'vitest', jest: 'jest', '@playwright/test': 'playwright', playwright: 'playwright', cypress: 'cypress', mysql: 'mysql', mysql2: 'mysql' };
    if (deps.express || deps.fastify || Object.values(pkg.scripts ?? {}).some(command => /\bnode\s/.test(command))) add('nodejs', 'package.json server dependency or Node script');
    for (const [dep, tag] of Object.entries(mapping)) if (deps[dep]) {
      if (dep === 'vue' && /^[~^]?2(?:\.|$)/.test(deps[dep])) add('vue2', `package.json ${dep}@${deps[dep]}`);
      else add(tag, `package.json ${dep}@${deps[dep]}`);
    }
  }
  const python = (await optionalFile(join(project, 'pyproject.toml'))) + '\n' + (await optionalFile(join(project, 'requirements.txt')));
  if (python.trim()) {
    add('python', 'pyproject.toml or requirements.txt');
    const stripped = python.split('\n').map(line => line.split('#')[0]).join('\n');
    for (const [name, tag] of Object.entries({ fastapi: 'fastapi', pytest: 'pytest', psycopg: 'postgres', psycopg2: 'postgres', asyncpg: 'postgres', pymongo: 'mongodb', redis: 'redis' })) {
      if (new RegExp(`(^|[\\s"'\\[])${name}([\\[\\s"'\\]><=~!;.-]|$)`, 'm').test(stripped)) add(tag, 'Python dependency/config declaration');
    }
  }
  const prisma = await optionalFile(join(project, 'prisma/schema.prisma'));
  if (/provider\s*=\s*"mysql"/.test(prisma)) add('mysql', 'Prisma datasource provider');
  if (/provider\s*=\s*"postgresql"/.test(prisma)) add('postgres', 'Prisma datasource provider');
  for (const filename of ['compose.yaml', 'compose.yml', 'docker-compose.yaml', 'docker-compose.yml']) {
    const compose = await optionalFile(join(project, filename));
    for (const [image, tag] of Object.entries({postgres:'postgres',redis:'redis',mongo:'mongodb',mysql:'mysql',mariadb:'mysql'})) {
      if (new RegExp(`^\\s+image:\\s*["']?(?:docker.io\\/library\\/)?${image}(?=[:@"'\\s]|$)`, 'm').test(compose)) add(tag, `${filename} service image`);
    }
  }
  if ((await optionalFile(join(project, 'go.mod'))).trim()) add('go', 'go.mod');
  const java = (await optionalFile(join(project, 'pom.xml'))) + (await optionalFile(join(project, 'build.gradle'))) + (await optionalFile(join(project, 'build.gradle.kts')));
  if (java.trim()) { add('java', 'Maven/Gradle manifest'); if (/spring-boot/.test(java)) add('springboot', 'Spring Boot dependency/plugin'); }
  const pubspec = await optionalFile(join(project, 'pubspec.yaml'));
  if (/^\s+sdk:\s*flutter\s*$/m.test(pubspec)) add('flutter', 'pubspec.yaml sdk: flutter');
  // Approved stack is a concrete selection, never raw PRD alternatives or repository prose.
  const patterns = { vue: /\bvue(?:\.js)?(?:\s*3)?\b/i, flutter: /\bflutter\b/i,
    react: /\breact(?:\.js)?\b/i, nextjs: /\bnext(?:\.js|js)\b/i, nodejs: /\bnode(?:\.js|js)\b/i, express: /\bexpress\b/i, fastify: /\bfastify\b/i, python: /\bpython\b/i, fastapi: /\bfastapi\b/i, postgres: /\bpostgres(?:ql)?\b/i, redis: /\bredis\b/i, mongodb: /\bmongodb\b/i, vitest: /\bvitest\b/i, jest: /\bjest\b/i, pytest: /\bpytest\b/i, playwright: /\bplaywright\b/i, cypress: /\bcypress\b/i, mysql: /\bmysql\b/i, go: /\b(?:golang|Go)\b/, java: /\bjava\b/i, springboot: /\bspring\s*boot\b/i };
  for (const [tag, pattern] of Object.entries(patterns)) if (pattern.test(approvedStack)) add(tag, 'approved plan/setup stack');
  if (tags.has('nextjs')) tags.add('react');
  if (tags.has('vue2')) tags.delete('vue');
  return { technologies: [...tags].sort(), evidence };
}
export function selectSkillIds(lock, phase, detection) {
  const ids = new Set(lock.phases[phase] ?? []);
  const matches = [];
  const uncovered = [];
  for (const technology of detection.technologies) {
    const route = lock.technologySkills?.[technology];
    if (!route) { uncovered.push(technology); continue; }
    for (const id of route[phase] ?? []) { ids.add(id); matches.push({ technology, phase, skill: id }); }
  }
  // General web design/testing methods should not impose web tools on native Flutter work.
  if ((detection.technologies.includes('flutter') && !detection.technologies.some(t => ['vue','react','nextjs'].includes(t)))
    || (detection.technologies.includes('react-native') && !detection.technologies.some(t => ['vue','nextjs'].includes(t)))) {
    ids.delete('frontend-design'); ids.delete('webapp-testing');
  }
  return { ...detection, phase, ids: [...ids], matches, uncovered };
}
