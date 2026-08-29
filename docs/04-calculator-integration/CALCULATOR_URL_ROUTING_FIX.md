# Устранение рассинхронизации вкладок в RICIS-7.7 Online Calculator

## 1. Диагностика проблемы (Root Cause Analysis)

При переходе по ссылкам вида `https://remix-ricis-iii-501343051156.europe-west2.run.app/?mode=CDCC&state=%7B%7D` приложение онлайн-калькулятора всегда сбрасывало вкладку на дефолтную страницу **«Solved Calculator Cases»** (Решенные случаи калькулятора). 

### Причина: Гоночное состояние хуков React (React Hook Race Condition)
В файле `src/App.tsx` онлайн-калькулятора реализованы два хука `useEffect`:
1. **Эффект синхронизации URL** (отслеживает `[activeMode]`):
   ```typescript
   useEffect(() => {
     const params = new URLSearchParams(window.location.search);
     if (params.get('mode')?.toUpperCase() !== activeMode) {
       params.set('mode', activeMode);
       if (params.has('state')) params.delete('state');
       window.history.pushState(null, '', `?${params.toString()}`);
     }
   }, [activeMode]);
   ```
2. **Эффект разбора URL на монтировании** (пустой массив зависимостей `[]`):
   ```typescript
   useEffect(() => {
     const params = new URLSearchParams(window.location.search);
     const modeParam = params.get('mode');
     // ... разбор и установка режима
   }, []);
   ```

**Жизненный цикл гонки при загрузке страницы:**
1. Состояние `activeMode` инициализируется значением по умолчанию: `SingularityMode.CASES_AND_SOLUTIONS`.
2. Компонент монтируется. Первым запускается первый эффект (так как его зависимость `[activeMode]` изменилась с `undefined` на начальное значение).
3. Эффект синхронизации видит, что в URL передан параметр `mode=CDCC`, а текущий `activeMode` равен `"CASES_AND_SOLUTIONS"`. Они не совпадают!
4. Эффект немедленно **перезаписывает URL** на `?mode=CASES_AND_SOLUTIONS` и полностью стирает параметр `state`.
5. Только после этого запускается второй эффект монтирования, но он считывает уже перезаписанный URL, где режим равен `"CASES_AND_SOLUTIONS"`, а параметры стерты.

---

## 2. Архитектурное решение (Dynamic Initialization)

Вместо того чтобы инициализировать стейт дефолтным значением и пытаться перезаписать его после монтирования, мы инициализируем `activeMode` **динамически прямо на этапе создания стейта** (Lazy State Initialization).

```typescript
const [activeMode, setActiveMode] = useState<SingularityMode>(() => {
  try {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const modeParam = params.get('mode');
    if (modeParam) {
      let uppercaseMode = modeParam.toUpperCase();
      if (uppercaseMode === 'MALDENBROT') {
        uppercaseMode = 'MANDELBROT';
      }
      if (Object.values(SingularityMode).includes(uppercaseMode as SingularityMode)) {
        return uppercaseMode as SingularityMode;
      }
    }
  } catch (e) {
    console.error('Error determining initial activeMode:', e);
  }
  return SingularityMode.CASES_AND_SOLUTIONS;
});
```

### Преимущества этого решения:
- **Отсутствие гонки:** `activeMode` сразу создается со значением `CDCC` (или любым другим из ссылки), поэтому при первой сборке эффекта синхронизации сравнение `params.get('mode') === activeMode` дает `true`, и URL не перезаписывается.
- **Сохранение параметров:** Состояние `state` успешно дожидается разбора в эффекте монтирования и применяется в `handleLoadPreset`.

---

## 3. Инструкция по применению патча

Вы можете применить готовый патч к репозиторию `RICIS-7.7-online-calculator` с помощью одной команды Git.

### Вариант А: Применение патча через `git apply`
Скопируйте сгенерированный патч `/tools/ricis-calculator-routing-fix.patch` в корень вашего проекта калькулятора и выполните:
```bash
git apply ricis-calculator-routing-fix.patch
```

### Вариант Б: Ручная правка в `src/App.tsx`
Найдите в файле `src/App.tsx` строку:
```typescript
const [activeMode, setActiveMode] = useState<SingularityMode>(SingularityMode.CASES_AND_SOLUTIONS);
```
И замените ее на:
```typescript
const [activeMode, setActiveMode] = useState<SingularityMode>(() => {
  try {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const modeParam = params.get('mode');
    if (modeParam) {
      let uppercaseMode = modeParam.toUpperCase();
      if (uppercaseMode === 'MALDENBROT') {
        uppercaseMode = 'MANDELBROT';
      }
      if (Object.values(SingularityMode).includes(uppercaseMode as SingularityMode)) {
        return uppercaseMode as SingularityMode;
      }
    }
  } catch (e) {
    console.error('Error determining initial activeMode:', e);
  }
  return SingularityMode.CASES_AND_SOLUTIONS;
});
```
После чего выполните повторный билд и деплой калькулятора.
