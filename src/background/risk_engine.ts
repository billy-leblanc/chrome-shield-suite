/**
 * Risk Engine: The "Brain" of Chrome Shield Suite.
 * Designed to handle polymorphic AI threats and social engineering tactics.
 */

export interface RiskAnalysis {
  score: number; // 0 to 100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  recommendation: string;
}

interface LLMRiskResult {
  riskScore: number; // 0 to 100
  flags: string[];
  reasoning: string;
}

// Safe numeric clamp: returns `fallback` if value is NaN or out of range.
function clampScore(value: number, fallback = 0): number {
  if (typeof value !== 'number' || !isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, value));
}

function scoreToRiskLevel(score: number): RiskAnalysis['riskLevel'] {
  if (score >= 80) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 20) return 'medium';
  return 'low';
}

/**
 * Calls the Claude API to analyze a transaction memo for social engineering patterns.
 * Returns null if no API key is configured, if the memo is empty/whitespace, or if
 * the call fails or times out.
 */
async function analyzeMemoWithLLM(memo: string): Promise<LLMRiskResult | null> {
  // Skip LLM call entirely for empty or whitespace-only memos.
  if (!memo || !memo.trim()) return null;

  let apiKey: string | undefined;
  try {
    const stored = await chrome.storage.local.get('anthropic_api_key');
    apiKey = stored.anthropic_api_key;
  } catch {
    return null;
  }

  if (!apiKey) return null;

  // Create a fresh AbortController per request — never reuse across calls.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: `You are a fraud detection engine for a payment security extension.
Analyze the provided payment memo/note for social engineering patterns.
Look specifically for: urgency/pressure tactics, impersonation (bank, government, family),
fear tactics, romance scam indicators, grandparent/family emergency scams,
lottery/prize fraud, advance fee fraud, and phishing language.
Respond ONLY with a valid JSON object in this exact shape:
{"riskScore": <number 0-100>, "flags": [<string>, ...], "reasoning": "<one sentence>"}
A riskScore of 0 means no threat. 100 means certain fraud. Return no other text.`,
        messages: [
          { role: 'user', content: `Payment memo: ${memo}` }
        ],
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const json = await response.json();
    const text: string = json?.content?.[0]?.text ?? '';
    if (!text) return null;

    let parsed: LLMRiskResult;
    try {
      parsed = JSON.parse(text);
    } catch {
      return null;
    }

    if (
      typeof parsed.riskScore !== 'number' ||
      !Array.isArray(parsed.flags) ||
      typeof parsed.reasoning !== 'string'
    ) {
      return null;
    }

    // Clamp and validate riskScore — guard against NaN or out-of-range LLM output.
    parsed.riskScore = clampScore(parsed.riskScore, 0);

    // Sanitize flags: keep only string values.
    parsed.flags = parsed.flags.filter((f): f is string => typeof f === 'string');

    return parsed;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

export class RiskEngine {
  private static SCAN_PATTERNS = [
    { pattern: /urgent|immediately|action required|suspended|locked/i, category: 'Urgency', weight: 30 },
    { pattern: /grandchild|family|accident|hospital|bail/i, category: 'Social Engineering (Family)', weight: 40 },
    { pattern: /winner|lottery|prize|inheritance|claim now/i, category: 'Scam (Lottery)', weight: 50 },
    { pattern: /verify your account|security update|identity verification/i, category: 'Phishing', weight: 30 },
    { pattern: /pay to release|service fee|activation fee/i, category: 'Advance Fee Fraud', weight: 40 },
    { pattern: /Zelle|Venmo|CashApp|Apple Pay/i, category: 'Platform Hook', weight: 10 },
  ];

  /**
   * Analyzes a transaction and returns a risk report.
   * Never throws — returns a safe low-risk default on any error.
   * @param data Contextual data from the page/transaction.
   */
  public static analyze(data: { message?: string; amount?: number; recipient?: string }): RiskAnalysis {
    try {
      // Guard: treat null/undefined data as empty
      if (!data || typeof data !== 'object') {
        return this.safeDefault();
      }

      let score = 0;
      const flags: string[] = [];

      // 1. Heuristic Pattern Matching (Polymorphic Detection)
      const rawMessage = typeof data.message === 'string' ? data.message : '';

      if (rawMessage) {
        this.SCAN_PATTERNS.forEach(({ pattern, category, weight }) => {
          if (pattern.test(rawMessage)) {
            score += weight;
            flags.push(category);
          }
        });

        // Detect "Polymorphic" variations (e.g., character substitutions)
        const cleanedMessage = rawMessage.replace(/[0-9!@#$%^&*()_+]/g, ' ');
        if (cleanedMessage !== rawMessage) {
          this.SCAN_PATTERNS.forEach(({ pattern, category, weight }) => {
            if (pattern.test(cleanedMessage)) {
              score += weight * 0.8; // Slightly lower weight for fuzzy matches
              if (!flags.includes(category)) flags.push(`Fuzzy ${category}`);
            }
          });
        }
      }

      // 2. High Amount Threshold
      const amount = typeof data.amount === 'number' && isFinite(data.amount) ? data.amount : 0;
      if (amount > 500) {
        score += 20;
        flags.push('High Amount Transaction');
      }

      // 3. Clamp Score (handles NaN, overflow, negative)
      score = clampScore(score, 0);

      // 4. Determine Risk Level
      const riskLevel = scoreToRiskLevel(score);

      return {
        score,
        riskLevel,
        flags,
        recommendation: this.getRecommendation(riskLevel),
      };
    } catch {
      // Last-resort fallback: never crash the background worker.
      return this.safeDefault();
    }
  }

  private static safeDefault(): RiskAnalysis {
    return {
      score: 0,
      riskLevel: 'low',
      flags: [],
      recommendation: this.getRecommendation('low'),
    };
  }

  public static buildRecommendation(level: RiskAnalysis['riskLevel']): string {
    return this.getRecommendation(level);
  }

  private static getRecommendation(level: RiskAnalysis['riskLevel']): string {
    switch (level) {
      case 'critical': return 'BLOCK IMMEDIATELY. High probability of malicious intent.';
      case 'high': return 'INTERCEPT. Verify recipient identity through a secondary channel.';
      case 'medium': return 'CAUTION. This transaction has flags common in social engineering.';
      default: return 'SAFE. No significant threats detected.';
    }
  }
}

// Background Listener for Risk Analysis and Extension Management
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    interceptEnabled: true,
    threatLog: [],
    stats: { blocked: 0, warnings: 0, safe: 0 },
  });
  console.log("Chrome Shield Suite: Initialized");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Only accept messages from content scripts in extension tabs — reject external senders.
  if (!sender.id || sender.id !== chrome.runtime.id) return false;

  if (message.type === 'ANALYZE_RISK') {
    // Validate payload shape before processing.
    const data = message.data && typeof message.data === 'object' ? message.data : {};

    const heuristicAnalysis = RiskEngine.analyze(data);

    // Run LLM analysis; fall back to heuristics only on failure/timeout.
    // Empty/whitespace memo skips LLM call inside analyzeMemoWithLLM.
    const memo = typeof data.message === 'string' ? data.message.trim() : '';
    analyzeMemoWithLLM(memo).then((llmResult) => {
      let analysis = heuristicAnalysis;

      if (llmResult) {
        // Blend: heuristics 60%, LLM 40%.
        // If LLM returns 0 but heuristics are high, heuristic score still dominates (60%).
        // Both scores are pre-clamped 0–100, so blended result is always 0–100.
        const blendedScore = clampScore(
          Math.round(heuristicAnalysis.score * 0.6 + llmResult.riskScore * 0.4),
          heuristicAnalysis.score // fallback to pure heuristic if blending yields invalid result
        );
        const mergedFlags = Array.from(new Set([...heuristicAnalysis.flags, ...llmResult.flags]));
        const riskLevel = scoreToRiskLevel(blendedScore);

        analysis = {
          score: blendedScore,
          riskLevel,
          flags: mergedFlags,
          recommendation: RiskEngine.buildRecommendation(riskLevel),
        };
      }

      // Log threat if risk is high or critical
      if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
        chrome.storage.local.get(["threatLog", "stats"], (storageData) => {
          if (chrome.runtime.lastError) return;
          const newLog = [{
            text: `Intercepted ${analysis.flags.join(', ')}`,
            time: new Date().toLocaleTimeString(),
            type: 'blocked'
          }, ...(storageData.threatLog || [])].slice(0, 50);

          const newStats = { ...(storageData.stats || { blocked: 0, warnings: 0, safe: 0 }) };
          if (analysis.riskLevel === 'critical') newStats.blocked = (newStats.blocked || 0) + 1;
          else newStats.warnings = (newStats.warnings || 0) + 1;

          chrome.storage.local.set({ threatLog: newLog, stats: newStats });
        });
      } else {
        chrome.storage.local.get("stats", (storageData) => {
          if (chrome.runtime.lastError) return;
          const currentStats = storageData.stats || { blocked: 0, warnings: 0, safe: 0 };
          const newStats = { ...currentStats, safe: (currentStats.safe || 0) + 1 };
          chrome.storage.local.set({ stats: newStats });
        });
      }

      sendResponse(analysis);
    }).catch(() => {
      // If the entire async chain throws unexpectedly, respond with heuristic result.
      sendResponse(heuristicAnalysis);
    });

    return true; // Keep the message channel open for the async response
  }

  if (message.type === "GET_STATS") {
    chrome.storage.local.get(["stats", "threatLog", "interceptEnabled"], (data) => {
      if (chrome.runtime.lastError) {
        sendResponse({});
        return;
      }
      sendResponse(data);
    });
    return true;
  }

  if (message.type === "TOGGLE_INTERCEPT") {
    chrome.storage.local.get("interceptEnabled", (data) => {
      if (chrome.runtime.lastError) {
        sendResponse({ interceptEnabled: true });
        return;
      }
      const next = !data.interceptEnabled;
      chrome.storage.local.set({ interceptEnabled: next }, () => {
        sendResponse({ interceptEnabled: next });
      });
    });
    return true;
  }
});
