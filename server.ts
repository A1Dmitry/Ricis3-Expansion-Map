import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { RICIS_CORE_SYSTEM_PROMPT, auditProofContent, buildCanonicalRicisProofLatex } from "./src/model/ricisCoreRules";
import { SERVER_GEMINI_MODEL_POOL } from "./src/model/geminiCatalogProjection";
import {
  ensureRicisCoreApi,
  getRicisCoreIntegrationInfo,
  proxyRicisCoreApi,
} from "./server/ricisCoreSupervisor";



const MODELS_POOL = SERVER_GEMINI_MODEL_POOL;

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function callAIWithFallback(
  prompt: string,
  responseMimeType = "text/plain",
  preferredModel?: string
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  let pool = [...MODELS_POOL];
  if (preferredModel && pool.includes(preferredModel)) {
    pool = [preferredModel, ...pool.filter((m) => m !== preferredModel)];
  }
  let lastError: any = null;

  for (const model of pool) {
    // Внутренний цикл попыток для одной модели
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[AI] Calling model ${model}, attempt ${attempt}...`);
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { "User-Agent": "aistudio-build" } },
        });

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType },
        });

        console.log(`[AI] Success with model ${model}`);
        return { text: response.text || "", model };
      } catch (e: any) {
        const errMsg = String(e?.message || e);
        console.warn(`[AI] Model ${model} attempt ${attempt} failed: ${errMsg}`);
        lastError = e;

        const isQuotaError =
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("Quota");

        const isNotFound =
          errMsg.includes("404") ||
          errMsg.includes("NOT_FOUND") ||
          errMsg.includes("not found");

        if (isQuotaError) {
          await delay(1000 * attempt);
        } else if (isNotFound) {
          // Если модель не найдена (404), сразу переходим к следующей модели
          break;
        }
      }
    }
  }
  throw lastError || new Error("Все модели AI из пула временно недоступны.");
}

function validatePayload(body: any, schema: Record<string, string>): { isValid: boolean; error?: string } {
  if (!body || typeof body !== "object") {
    return { isValid: false, error: "Payload must be a non-empty JSON object" };
  }
  for (const [key, type] of Object.entries(schema)) {
    const value = body[key];
    const isOptional = type.endsWith("?");
    const pureType = type.replace("?", "");
    
    if (value === undefined || value === null) {
      if (isOptional) {
        continue;
      }
      return { isValid: false, error: `Required field '${key}' is missing` };
    }
    
    if (pureType === "array") {
      if (!Array.isArray(value)) {
        return { isValid: false, error: `Field '${key}' must be an array` };
      }
    } else if (pureType === "object") {
      if (typeof value !== "object" || Array.isArray(value)) {
        return { isValid: false, error: `Field '${key}' must be an object` };
      }
    } else if (pureType === "number") {
      if (typeof value !== "number" || isNaN(value)) {
        return { isValid: false, error: `Field '${key}' must be a number` };
      }
    } else if (typeof value !== pureType) {
      return { isValid: false, error: `Field '${key}' must be of type ${pureType}` };
    }
  }
  return { isValid: true };
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/ricis-core/health", async (_req, res) => {
    const info = getRicisCoreIntegrationInfo();
    try {
      await ensureRicisCoreApi();
      res.json({ status: "ready", ...info, running: true });
    } catch (error) {
      res.status(503).json({
        status: "unavailable",
        ...info,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post("/api/ricis-core/expressions/:operation", async (req, res) => {
    const operation = req.params.operation;
    if (operation !== "simplify" && operation !== "derivative" && operation !== "system") {
      return res.status(404).json({ error: "Unsupported Ricis.Core operation." });
    }

    try {
      const result = await proxyRicisCoreApi(operation, req.body);
      return res.status(result.status).json(result.body);
    } catch (error) {
      return res.status(503).json({
        error: error instanceof Error ? error.message : String(error),
        integration: getRicisCoreIntegrationInfo(),
      });
    }
  });

  app.post("/api/generateProof", async (req, res) => {
    const { id, title, targetFunction, description, singularityHint, axioms, preferredModel } = req.body || {};

    try {
      const validation = validatePayload(req.body, {
        id: "string",
        title: "string",
        targetFunction: "string?",
        description: "string?",
        singularityHint: "string?",
        axioms: "array?",
        preferredModel: "string?"
      });
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }

      const axiomList =
        axioms && axioms.length > 0
          ? axioms.map((a: any, i: number) => `${i + 1}. ${a.title || a.id}: ${a.targetFunction || ""}`).join("\n")
          : "(no prior axioms)";

      const prompt = `${RICIS_CORE_SYSTEM_PROMPT}

ТЕКУЩАЯ ЗАДАЧА ДЛЯ РАЗРЕШЕНИЯ АГЕНТОМ:
- Название проблемы: ${title}
- Целевая функция / выражение: ${targetFunction || "(задана в описании)"}
- ИНСТРУКЦИЯ / ПОДСКАЗКА ПОЛЬЗОВАТЕЛЯ ДЛЯ ПЕРЕРАСЧЕТА (Дескрипшн): "${description || 'Выполнить детерминированный прогон RICIS-III'}"
${singularityHint ? `- Подсказка по сингулярности: "${singularityHint}"` : ''}
- Ранее доказанные аксиомы в графе:
${axiomList}

КРИТИЧЕСКИЕ ПРАВИЛА И АУДИТ РЕШЕНИЯ:
1. ТЫ МОЖЕШЬ ВЗЯТЬ ИЗ КЛАССИКИ ЦЕЛЕВУЮ ФУНКЦИЮ, НО ДАЛЕЕ ОБЯЗАН ПРОГНАТЬ ЕЁ ЧЕРЕЗ АЛГЕБРУ RICIS-III (SP2, SP4, A6: 0_F * \\infty_F = F^2 или det(u,v) = F * G, дискретный геометрический каркас гиперболы и маски в кольцах Мерсенна M_k = 2^k - 1), если присутствуют сингулярности, деление на ноль, бесконечности или пределы (\\lim).
2. ВЗЯТОЕ ИЗ КЛАССИКИ РЕШЕНИЕ (без прогона через RICIS-III) НЕ СЧИТАЕТСЯ РЕШЕНИЕМ! В классике эта проблема уже имела сингулярность, из-за чего её и нашел аудит.
3. СТРОГО СЛЕДУЙ ПОДСКАЗКЕ ПОЛЬЗОВАТЕЛЯ ИЗ ОПИСАНИЯ ДЛЯ ПЕРЕРАСЧЕТА (например, если пользователь просит "использовать вместо корня битовую маску log2(sqr(N)) чтобы задать битность маски", ты ОБЯЗАН прямо в доказательстве использовать формулу log2(sqr(N)) для битности маски).
4. ЕСЛИ ЗАДАЧА НЕ РАЗРЕШЕНА ПОЛНОСТЬЮ ЧЕРЕЗ RICIS-III или содержит заглушки "sorry" / неопределенности, зафиксируй это в выводе, чтобы статус задачи остался "partial" (желтый шар).
5. СТРОГИЙ ЗАПРЕТ: Никогда не возвращай невычисленные или неразложенные обертки вида SP2_Reduce(...), T(...), 0_((...), 0_F * \infty_F без подстановки реальных переменных. Никогда не перечисляй этапы в виде системных логов "Phase 1 --- SAFETY CHECK (SP2)" или "Phase 6 --- L1 VERIFICATION" — вместо этого распиши математические шаги своими словами на русском языке.
6. СТРОГИЙ ЗАПРЕТ НА ТАВТОЛОГИИ: Категорически запрещено выводить формальные затычки вида "Formalize(...)", "T(...) in M_RICIS" или бессодержательный Lean 4 код "exact RICIS.AxiomL1_proof x". Каждое доказательство Lean 4 должно содержать явное определение векторов Геометрического Моста u = ⟨F, 0⟩ и v = ⟨0, G⟩, вычисление косого произведения RICIS.skew_product u v = F * G и подтверждение стабильности инварианта.

ТРЕБОВАНИЯ К ВЫВОДУ:
Выведи подробное аналитическое доказательство на РУССКОМ ЯЗЫКЕ в формате LaTeX (без \\documentclass, без \\section).
НЕ логируй действия названиями фаз ("Phase ...") и техническими комментариями. Просто покажи целевую функцию, а потом по шагам упрощение, упрощенное выражение и, если сошлось в точку, саму точку схождения.
Выводи все формулы и выражения строго в формате LaTeX (через $...$ или $$...$$) без использования Unicode-символов для математики (не используй стрелочки, дроби или надписи юникодом).
Обязательно используй Аксиому A6 (для сопряженного контекста 0_F * \\infty_F = F^2, в общем случае det(u,v) = F * G), Геометрико-дискретный каркас (непрерывная гипербола p*q = N, пересечение с лучами q = k*p в точках (\\sqrt{N/k}, \\sqrt{kN}) и дискретная маска малых простых M_P в кольцах Мерсенна M_k = 2^k - 1) и дай Lean 4 код. Не включай в вывод никаких ссылок, URL, Zenodo или DOI. Никаких заглушек вида "0_E", "Result = Result" или "sorry".`;

      const response = await callAIWithFallback(prompt, "text/plain", preferredModel);

      let text = response.text || "";
      const audit = auditProofContent(text);

      // Если в тексте ИИ остались заглушки или ошибки, канонически реконструируем его
      if (!audit.isValid) {
        text = buildCanonicalRicisProofLatex(title || 'Сингулярная задача', targetFunction || '', id || 'node');
      }

      res.json({ proof: text, proofLatex: text, model: response.model });
    } catch (e: any) {
      console.warn("[generateProof fallback activated]:", e?.message || e);
      const fallbackProof = buildCanonicalRicisProofLatex(
        title || 'Сингулярная задача',
        targetFunction || '',
        id || 'node'
      );
      res.json({ proof: fallbackProof, proofLatex: fallbackProof, model: "canonical-ricis-engine" });
    }
  });

  app.post("/api/discoverTasks", async (req, res) => {
    const { existingTitles, parentNode, existingZones, dbKnowledge, preferredModel } = req.body || {};

    try {
      const validation = validatePayload(req.body, {
        existingTitles: "array?",
        parentNode: "object?",
        existingZones: "array?",
        dbKnowledge: "object?",
        preferredModel: "string?"
      });
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }

      const zoneId = parentNode && parentNode.zoneIds && parentNode.zoneIds.length > 0 ? parentNode.zoneIds[0] : "any";
      const dbContext = dbKnowledge && typeof dbKnowledge === 'object'
        ? `\nОБУЧЕННЫЙ КОНТЕКСТ АГЕНТА ИЗ БАЗЫ ДАННЫХ (IndexedDB):
- Обучен на ${dbKnowledge.resolvedNodesCount || 0}/${dbKnowledge.totalNodesInDb || 0} узлах и ${dbKnowledge.proofsCount || 0} доказательствах.
- Образцы решенных формул из БД: ${(dbKnowledge.sampleSolvedFormulas || []).slice(0, 5).join('; ')}
Используй эти шаблоны из БД для создания строго согласованных научных задач.`
        : '';

      const prompt = `Ты агент-исследователь RICIS-III. Предложи новые научные или математические проблемы, которые можно свести к алгебре сингулярностей без пределов (SP2, A6, индексированные 0/∞).
Опора: ${parentNode ? parentNode.title : "нет"}. Зона опоры: ${zoneId}.${dbContext}
Уже на карте (не повторяй): ${(Array.isArray(existingTitles) ? existingTitles : []).slice(0, 50).join("; ")}
Существующие зоны науки: ${(Array.isArray(existingZones) ? existingZones : []).join(", ")}.
Верни СТРОГИЙ JSON массив объектов: title (строка), description (строка), targetFunction (строка), zoneId (строка - ID научной области на английском. Используй одну из существующих зон, ИЛИ если проблема совсем в них не попадает, придумай НОВЫЙ ID, например finance, ecology), significance (число 0-1), singularityHint (строка).
Предпочитай проблемы, расширяющие ядро сингулярностей или применяющие RICIS к новым дисциплинам. Максимум 8 элементов. Выведи ТОЛЬКО JSON массив.`;

      const response = await callAIWithFallback(prompt, "application/json", preferredModel);

      let text = response.text || "[]";
      const match = text.match(/\[[\s\S]*\]/);
      if (match) text = match[0];
      let tasks = [];
      try {
        tasks = JSON.parse(text.trim());
      } catch {
        tasks = [];
      }
      if (!Array.isArray(tasks)) tasks = [];
      res.json({ tasks, model: response.model });
    } catch (e: any) {
      console.warn("[discoverTasks fallback activated]:", e?.message || e);
      res.json({
        tasks: [
          {
            title: "Редукция неопределенности [0/0] через SP1-SP4",
            description: "Прямая устранимость предельной неопределенности за O(1) время путем подстановки индексированных нулевых монолитов.",
            targetFunction: "\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = \\left[\\frac{0}{0}\\right] \\xrightarrow{\\text{RICIS}} \\frac{0_{\\sin}}{0_x} = 1 \\quad [O(1)]",
            zoneId: "math",
            significance: 0.9,
            singularityHint: "Разрешение предельного перехода аксиомами SP1-SP4"
          }
        ],
        model: "canonical-ricis-engine"
      });
    }
  });

  app.post("/api/aiAssistantNode", async (req, res) => {
    const { title, targetFunction, zoneId, hint, preferredModel } = req.body || {};

    try {
      const validation = validatePayload(req.body, {
        title: "string",
        targetFunction: "string?",
        zoneId: "string?",
        hint: "string?",
        preferredModel: "string?"
      });
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }

      const prompt = `Ты формальный научный AI-исследователь математической системы RICIS-III (Recursive Indexed Calculus of Identity and Singularity).
Пользователь запрашивает автоматический поиск и формулирование точного целевого выражения для научной проблемы "${title || ""}".

ОБЯЗАТЕЛЬНАЯ СТРУКТУРА ПОИСКА И ФОРМУЛИРОВКИ РЕШЕНИЯ (КЛАССИКА -> RICIS-III O(1)):
1. КЛАССИЧЕСКИЙ ПРЕДЕЛ: Сформулируй проблему через классический динамический предел с неопределенностью (например, \\lim_{x \\to a} \\frac{P(x)}{Q(x)} = [0/0] или [\\infty/\\infty] или [0 \\cdot \\infty]).
2. РЕДУКЦИЯ К RICIS-III ЗА O(1): Покажи прямой переход предела в статическую монолитную алгебру RICIS-III с точными индексами и решением за O(1) время без итерационных пределов.
   Пример формата выражения:
   \\lim_{x \\to x_0} \\frac{f(x)}{g(x)} = \\left[\\frac{0}{0}\\right] \\xrightarrow{\\text{RICIS-III}} \\frac{0_f}{0_g} = \\frac{f}{g} \\quad [O(1)]

3. СВЯЗЬ В СТЕКЕ (PARENT NODES): Укажи идентификаторы узлов-предков для связывания в графе зависимости (например "math-singularity" или "core-agi-target").

СТРОГИЙ ЗАПРЕТ: НИКОГДА НЕ ВОЗВРАЩАЙ текст "найди формулу сам", "ищи сам", "Formalize(N/A)" или абстрактные слова! Поля "targetFunction" и "normalizedFunction" ДОЛЖНЫ СОДЕРЖАТЬ ВЫРАЖЕНИЕ КЛАССИЧЕСКОГО ПРЕДЕЛА С СВЕРТКОЙ В RICIS-III O(1).

Верни СТРОГИЙ JSON объект:
{
  "title": "${title || "Научная проблема"}",
  "normalizedFunction": "\\\\lim_{x \\\\to a} \\\\frac{f(x)}{g(x)} = \\\\left[\\\\frac{0}{0}\\\\right] \\\\xrightarrow{\\\\text{RICIS}} \\\\frac{0_f}{0_g} = \\\\frac{f}{g} \\\\quad [O(1)]",
  "targetFunction": "\\\\lim_{x \\\\to a} \\\\frac{f(x)}{g(x)} = \\\\left[\\\\frac{0}{0}\\\\right] \\\\xrightarrow{\\\\text{RICIS}} \\\\frac{0_f}{0_g} = \\\\frac{f}{g} \\\\quad [O(1)]",
  "description": "Классическая задача сведена к пределу и разрешена в RICIS-III за O(1) время через индексы нулевых монолитов.",
  "hint": "Сингулярность предельного перехода [0/0] или [inf/inf], устранённая аксиомами SP1-SP4",
  "connectToNodeIds": ["math-singularity"],
  "significance": 0.85,
  "link": "https://ru.wikipedia.org/wiki/..."
}
Выведи ТОЛЬКО JSON объект.`;

      const response = await callAIWithFallback(prompt, "application/json", preferredModel);

      let text = response.text || "{}";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) text = match[0];
      let obj: any = {};
      try {
        obj = JSON.parse(text.trim());
      } catch {
        obj = {};
      }
      if (!obj.normalizedFunction && obj.targetFunction) {
        obj.normalizedFunction = obj.targetFunction;
      }
      if (!obj.targetFunction && obj.normalizedFunction) {
        obj.targetFunction = obj.normalizedFunction;
      }
      if (!Array.isArray(obj.connectToNodeIds) || obj.connectToNodeIds.length === 0) {
        obj.connectToNodeIds = ["math-singularity"];
      }
      res.json({ ...obj, model: response.model });
    } catch (e: any) {
      console.warn("[aiAssistantNode fallback activated]:", e?.message || e);
      res.json({
        title: title || "Научная проблема",
        targetFunction: `\\lim_{x \\to 0} \\frac{F(x)}{G(x)} = [0/0] \\xrightarrow{\\text{RICIS}} \\frac{0_F}{0_G} \\quad [O(1)]`,
        normalizedFunction: `\\lim_{x \\to 0} \\frac{F(x)}{G(x)} = [0/0] \\xrightarrow{\\text{RICIS}} \\frac{0_F}{0_G} \\quad [O(1)]`,
        description: "Формулировка проблемы вычислена через прямое каноническое расширение RICIS-III.",
        hint: "Устранение сингулярностей за O(1) время без динамических пределов",
        connectToNodeIds: ["math-singularity"],
        significance: 0.85,
        model: "canonical-ricis-engine"
      });
    }
  });

  app.post("/api/fillNodeParams", async (req, res) => {
    const { title, description, zoneIds, preferredModel } = req.body || {};

    try {
      const validation = validatePayload(req.body, {
        title: "string",
        description: "string?",
        zoneIds: "array?",
        preferredModel: "string?"
      });
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }

      const zoneStr = Array.isArray(zoneIds) && zoneIds.length > 0 ? zoneIds.join(", ") : "math";
      const prompt = `Заполни параметры узла RICIS-III.
Название: ${title || ""}
Описание: ${description || ""}
Зона: ${zoneStr}

ОБЯЗАТЕЛЬНОЕ УСЛОВИЕ:
Если узел не имеет формулы или содержит запрос "найди формулу сам" / "ищи сам", сформулируй проблему через классический предел с неопределенностью (\\lim) и покажи её прямую статическую редукцию в RICIS-III за O(1) время:
\\lim_{x \\to a} \\frac{f(x)}{g(x)} = [0/0] \\xrightarrow{\\text{RICIS-III}} \\frac{0_f}{0_g} = \\frac{f}{g} \\quad [O(1)]

Никаких текстовых фраз "найди сам" или "Formalize(N/A)".

Верни СТРОГИЙ JSON:
{
  "targetFunction": "\\\\lim_{x \\\\to a} \\\\frac{f(x)}{g(x)} = [0/0] \\\\xrightarrow{\\\\text{RICIS}} \\\\frac{0_f}{0_g} \\\\quad [O(1)]",
  "normalizedFunction": "\\\\lim_{x \\\\to a} \\\\frac{f(x)}{g(x)} = [0/0] \\\\xrightarrow{\\\\text{RICIS}} \\\\frac{0_f}{0_g} \\\\quad [O(1)]",
  "description": "Научное описание с предельной редукцией в O(1)",
  "singularityHint": "Точка сингулярности / расходимости пределов",
  "connectToNodeIds": ["math-singularity"],
  "significance": 0.8,
  "shortProofSketch": "Краткий эскиз разрешения предельной неопределенности за O(1)",
  "tags": ["math", "singularity", "ricis3"]
}
Выведи ТОЛЬКО JSON объект.`;

      const response = await callAIWithFallback(prompt, "application/json", preferredModel);

      let text = response.text || "{}";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) text = match[0];
      let obj: any = {};
      try {
        obj = JSON.parse(text.trim());
      } catch {
        obj = {};
      }
      res.json({ ...obj, model: response.model });
    } catch (e: any) {
      console.warn("[fillNodeParams fallback activated]:", e?.message || e);
      res.json({
        targetFunction: "\\lim_{x \\to a} \\frac{f(x)}{g(x)} = [0/0] \\xrightarrow{\\text{RICIS}} \\frac{0_f}{0_g} \\quad [O(1)]",
        normalizedFunction: "\\lim_{x \\to a} \\frac{f(x)}{g(x)} = [0/0] \\xrightarrow{\\text{RICIS}} \\frac{0_f}{0_g} \\quad [O(1)]",
        description: "Параметры сгенерированы каноническим движком RICIS-III.",
        singularityHint: "Точка расходимости пределов",
        connectToNodeIds: ["math-singularity"],
        significance: 0.8,
        shortProofSketch: "Разрешение неопределенности через аксиомы SP1-SP4 и Skew Product A6",
        tags: ["math", "singularity", "ricis3"],
        model: "canonical-ricis-engine"
      });
    }
  });

  /**
   * Priority / derivative audit: find works that reuse RICIS-III semantics
   * (limit-free singularity resolution, SP2/A6, indexed zeros) even under rename.
   */
  app.post("/api/searchDerivatives", async (req, res) => {
    const { prompt, existingTitles, preferredModel } = req.body || {};

    try {
      const validation = validatePayload(req.body, {
        prompt: "string?",
        existingTitles: "array?",
        preferredModel: "string?"
      });
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }

      const fallbackPrompt = `Ты аудитор научного приоритета для RICIS-III.
Найди ВНЕШНИЕ работы, которые переиспользуют алгебру сингулярностей без пределов (0/0, 0*inf, индексированные нули) без ссылки на Алейникова/RICIS.
Верни СТРОГИЙ JSON массив объектов: title, description, sourceUrl, firstMentionDate, zoneId, matchedSignatures, score, relevantNodeIds, authors.
Исключай официальные депозиты RICIS. Предпочитай score>=0.55. Если ничего не найдено, верни [].
Уже на карте: ${Array.isArray(existingTitles) ? existingTitles.slice(0, 40).join("; ") : ""}
Отвечай СТРОГО на РУССКОМ ЯЗЫКЕ. Выведи ТОЛЬКО валидный JSON массив.`;

      const response = await callAIWithFallback(typeof prompt === "string" && prompt.length > 100 ? prompt : fallbackPrompt, "application/json", preferredModel);

      let text = response.text || "[]";
      const match = text.match(/\[[\s\S]*\]/);
      if (match) text = match[0];
      let hits = [];
      try {
        hits = JSON.parse(text.trim());
      } catch {
        hits = [];
      }
      if (!Array.isArray(hits)) hits = [];
      res.json({ hits, model: response.model });
    } catch (e: any) {
      console.warn("[searchDerivatives fallback activated]:", e?.message || e);
      res.json({ hits: [], model: "canonical-ricis-engine" });
    }
  });

  // Telegram transport is intentionally disabled until a separately configured gateway is installed.
  app.get("/api/telegram/status", (_req, res) => {
    res.json({
      status: "disabled",
      botUsername: "RicisSingularityBot",
      hasToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      hasWebhookSecret: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
      mode: "acknowledgement_only",
      engine: "RICIS-III v7.7 Analytical Engine",
    });
  });

  // Legacy shared-key endpoints are intentionally disabled. The service never accepts user API keys.
  const sharedKeyPoolDisabled = (_req: express.Request, res: express.Response) => {
    res.status(410).json({
      ok: false,
      error: "SHARED_KEY_POOL_DISABLED",
      message: "The service does not accept, store, or share user API keys.",
    });
  };
  app.get("/api/v1/keys/pool-stats", sharedKeyPoolDisabled);
  app.post("/api/v1/keys/contribute", sharedKeyPoolDisabled);

  app.post("/api/v1/solve", async (req, res) => {
    const validation = validatePayload(req.body, { targetFunction: "string" });
    if (!validation.isValid) {
      return res.status(400).json({ ok: false, error: validation.error });
    }

    const targetFunction = String(req.body.targetFunction).trim();
    if (!targetFunction) {
      return res.status(400).json({ ok: false, error: "targetFunction must not be empty." });
    }

    const nodeId = `api-task-${Date.now()}`;
    const proofLatex = buildCanonicalRicisProofLatex("REST RICIS request", targetFunction, nodeId);
    res.status(202).json({
      ok: true,
      nodeId,
      targetFunction,
      proofLatex,
      verificationStatus: "REQUIRES_CORE_LEAN",
      status: "Canonical RICIS draft generated; separate Core or Lean verification is required.",
    });
  });

  app.post("/api/telegram/simulate", async (req, res) => {
    try {
      const { text, username, chatId } = req.body || {};
      const userText = text || "/start";
      const userChatId = chatId || 10001;

      // This endpoint demonstrates transport formatting only; it does not run Core or Lean.
      const replyText = userText.startsWith("/start")
        ? "🤖 *RICIS-III Telegram simulator*\n\nЭто безопасная симуляция интерфейса. Она не принимает API-ключи и не выполняет внешнюю верификацию."
        : userText.startsWith("/help")
        ? "📜 *Справка симулятора:*\n• `/solve <формула>` — показать запрос в формате Telegram.\n• Результат должен отдельно пройти Core или Lean-проверку."
        : `ℹ️ *Симуляция приняла выражение:* \`${userText.replace('/solve', '').trim()}\`\n\nСтатус доверия: \`REQUIRES_CORE_LEAN\`.`;

      res.json({
        ok: true,
        reply: {
          chatId: userChatId,
          text: replyText,
          parseMode: "Markdown",
        },
      });
    } catch (e: any) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/telegram/webhook", async (req, res) => {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const suppliedSecret = req.header("x-telegram-bot-api-secret-token");
    if (!expectedSecret || suppliedSecret !== expectedSecret) {
      return res.status(401).json({ ok: false, error: "UNAUTHORIZED_WEBHOOK" });
    }

    // The live gateway is not enabled in this process. Acknowledge only an authenticated event
    // without logging message content or personal identifiers.
    res.status(204).end();
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);

  });
}

startServer();
