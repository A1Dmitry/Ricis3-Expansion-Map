// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function readText(relativePath: string): string {
  return readFileSync(join(repositoryRoot, relativePath), 'utf8');
}

describe('Preview & Render Integrity Check (Верификация работоспособности Превью)', () => {
  it('проверяет, что index.html существует и содержит корневой элемент монтирования React', () => {
    const indexPath = join(repositoryRoot, 'index.html');
    expect(existsSync(indexPath)).toBe(true);

    const indexHtml = readText('index.html');
    
    // Проверка корневого контейнера React
    expect(indexHtml).toContain('<div id="root"></div>');
    
    // Проверка наличия главного скрипта приложения
    expect(indexHtml).toContain('<script type="module" src="/src/main.tsx"></script>');
  });

  it('проверяет наличие социального превью-изображения и логотипа для рендеринга', () => {
    const iconPath = join(repositoryRoot, 'public', 'ricis-expansion-map-icon.png');
    const socialImgPath = join(repositoryRoot, 'public', 'ricis-expansion-map-social-preview.png');
    
    // Проверяем, что файлы изображений объявлены в HTML
    const indexHtml = readText('index.html');
    expect(indexHtml).toContain('ricis-expansion-map-icon.png');
    expect(indexHtml).toContain('ricis-expansion-map-social-preview.png');

    // Проверяем физическое наличие файлов в публичной папке
    expect(existsSync(iconPath)).toBe(true);
    expect(existsSync(socialImgPath)).toBe(true);
  });

  it('проверяет, что сервер разрешает внешние хосты (allowedHosts: true) для стабильного отображения в iframe', () => {
    const serverCode = readText('server.ts');
    
    // Проверяем, что allowedHosts выставлен в true без условий
    expect(serverCode).toContain('allowedHosts: true');
  });

  it('проверяет наличие точки входа React (/src/main.tsx) и базового компонента (/src/App.tsx)', () => {
    const mainPath = join(repositoryRoot, 'src', 'main.tsx');
    const appPath = join(repositoryRoot, 'src', 'App.tsx');
    
    expect(existsSync(mainPath)).toBe(true);
    expect(existsSync(appPath)).toBe(true);

    const mainContent = readText('src/main.tsx');
    expect(mainContent).toContain('createRoot');
    expect(mainContent).toContain('App');
  });
});
