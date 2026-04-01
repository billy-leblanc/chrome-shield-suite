/**
 * FraudDetector: Platform-agnostic core detection logic.
 * No Chrome APIs, no DOM, no extension-specific code.
 * Runnable in Node.js, Cloudflare Workers, or a browser extension.
 */

export interface RiskAnalysis {
  score: number; // 0 to 100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  recommendation: string;
}

export interface LLMRiskResult {
  riskScore: number; // 0 to 100
  flags: string[];
  reasoning: string;
}

export interface TransactionData {
  message?: string;
  amount?: number;
  recipient?: string;
  platform?: string;
}

// Safe numeric clamp: returns `fallback` if value is NaN or out of range.
export function clampScore(value: number, fallback = 0): number {
  if (typeof value !== 'number' || !isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, value));
}

export function scoreToRiskLevel(score: number): RiskAnalysis['riskLevel'] {
  if (score >= 80) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 20) return 'medium';
  return 'low';
}

export const SCAN_PATTERNS = [
  { pattern: /urgent|immediately|action required|suspended|locked/i, category: 'Urgency', weight: 30 },
  { pattern: /grandchild|family|accident|hospital|bail/i, category: 'Social Engineering (Family)', weight: 40 },
  { pattern: /winner|lottery|prize|inheritance|claim now/i, category: 'Scam (Lottery)', weight: 50 },
  { pattern: /verify your account|security update|identity verification/i, category: 'Phishing', weight: 30 },
  { pattern: /pay to release|service fee|activation fee/i, category: 'Advance Fee Fraud', weight: 40 },
  { pattern: /Zelle|Venmo|CashApp|Apple Pay/i, category: 'Platform Hook', weight: 10 },
];

/**
 * Calls the relay API to analyze a transaction memo for social engineering patterns.
 * Returns null if memo is empty/whitespace, or if the call fails or times out.
 * @param memo The transaction memo text to analyze.
 * @param authToken The relay API auth token.
 * @param relayUrl The URL of the relay API endpoint.
 * @param timeoutMs Optional timeout in milliseconds (default: 5000).
 */
export async function callRelayAPI(
  memo: string,
  authToken: string,
  relayUrl: string,
  timeoutMs = 5000,
): Promise<LLMRiskResult | null> {
  // Skip LLM call entirely for empty or whitespace-only memos.
  if (!memo || !memo.trim()) return null;

  // Create a fresh AbortController per request — never reuse across calls.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(relayUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        memo,
        platform: 'unknown',
        auth_token: authToken,
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const parsed: LLMRiskResult = await response.json();

    if (
      typeof parsed.riskScore !== 'number' ||
      !Array.isArray(parsed.flags) ||
      typeof parsed.reasoning !== 'string'
    ) {
      return null;
    }

    // Clamp and validate riskScore — guard against NaN or out-of-range relay output.
    parsed.riskScore = clampScore(parsed.riskScore, 0);

    // Sanitize flags: keep only string values.
    parsed.flags = parsed.flags.filter((f): f is string => typeof f === 'string');

    return parsed;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

/**
 * Blends heuristic and LLM scores.
 * Default weight: heuristics 60%, LLM 40%.
 * Both scores must be pre-clamped 0–100; blended result is always 0–100.
 * @param heuristicScore Pre-clamped heuristic score (0–100).
 * @param llmScore Pre-clamped LLM score (0–100).
 * @param heuristicWeight Fraction for heuristics (default 0.6); LLM gets (1 - heuristicWeight).
 */
export function blendScores(
  heuristicScore: number,
  llmScore: number,
  heuristicWeight = 0.6,
): number {
  return clampScore(
    Math.round(heuristicScore * heuristicWeight + llmScore * (1 - heuristicWeight)),
    heuristicScore, // fallback to pure heuristic if blending yields invalid result
  );
}

export class FraudDetector {
  /**
   * Analyzes a transaction and returns a risk report.
   * @param data Contextual data from the page/transaction.
   */
  public static analyze(data: TransactionData): RiskAnalysis {
    try {
      let score = 0;
      const flags: string[] = [];

      // 1. Heuristic Pattern Matching (Polymorphic Detection)
      const rawMessage = typeof data.message === 'string' ? data.message : '';
      if (rawMessage) {
        SCAN_PATTERNS.forEach(({ pattern, category, weight }) => {
          if (pattern.test(rawMessage)) {
            score += weight;
            flags.push(category);
          }
        });

        // Detect "Polymorphic" variations (e.g., character substitutions)
        const cleanedMessage = rawMessage.replace(/[0-9!@#$%^&*()_+]/g, ' ');
        if (cleanedMessage !== rawMessage) {
          SCAN_PATTERNS.forEach(({ pattern, category, weight }) => {
            if (pattern.test(cleanedMessage)) {
              score += weight * 0.8; // Slightly lower weight for fuzzy matches
              if (!flags.includes(category)) flags.push(`Fuzzy ${category}`);
            }
          });
        }
      }

      // 2. Platform-Specific Intelligence
      if (data.platform === 'Zelle' || data.platform === 'Venmo') {
        score += 10; // Elevate risk slightly for P2P-only high-fraud platforms
        flags.push(`${data.platform} Context`);
      }

      // 3. High Amount Threshold
      const amount = typeof data.amount === 'number' && isFinite(data.amount) ? data.amount : 0;
      if (amount > 500) {
        score += 20;
        flags.push('High Amount Transaction');
      }

      // 4. Normalize and Clamp Score
      score = clampScore(score, 0);

      // 5. Determine Risk Level using helper
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

  public static safeDefault(): RiskAnalysis {
    return {
      score: 0,
      riskLevel: 'low',
      flags: [],
      recommendation: this.getRecommendation('low'),
    };
  }

  public static getRecommendation(level: RiskAnalysis['riskLevel']): string {
    switch (level) {
      case 'critical': return 'BLOCK IMMEDIATELY. High probability of malicious intent.';
      case 'high': return 'INTERCEPT. Verify recipient identity through a secondary channel.';
      case 'medium': return 'CAUTION. This transaction has flags common in social engineering.';
      default: return 'SAFE. No significant threats detected.';
    }
  }
}
