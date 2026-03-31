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
   * @param data Contextual data from the page/transaction.
   */
  public static analyze(data: { message?: string; amount?: number; recipient?: string }): RiskAnalysis {
    let score = 0;
    const flags: string[] = [];

    // 1. Heuristic Pattern Matching (Polymorphic Detection)
    if (data.message) {
      this.SCAN_PATTERNS.forEach(({ pattern, category, weight }) => {
        if (pattern.test(data.message!)) {
          score += weight;
          flags.push(category);
        }
      });

      // Detect "Polymorphic" variations (e.g., character substitutions)
      const cleanedMessage = data.message.replace(/[0-9!@#$%^&*()_+]/g, ' ');
      if (cleanedMessage !== data.message) {
        this.SCAN_PATTERNS.forEach(({ pattern, category, weight }) => {
          if (pattern.test(cleanedMessage)) {
            score += weight * 0.8; // Slightly lower weight for fuzzy matches
            if (!flags.includes(category)) flags.push(`Fuzzy ${category}`);
          }
        });
      }
    }

    // 2. High Amount Threshold
    if (data.amount && data.amount > 500) {
      score += 20;
      flags.push('High Amount Transaction');
    }

    // 3. Normalize Score
    score = Math.min(score, 100);

    // 4. Determine Risk Level
    let riskLevel: RiskAnalysis['riskLevel'] = 'low';
    if (score >= 80) riskLevel = 'critical';
    else if (score >= 50) riskLevel = 'high';
    else if (score >= 20) riskLevel = 'medium';

    return {
      score,
      riskLevel,
      flags,
      recommendation: this.getRecommendation(riskLevel),
    };
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
  if (message.type === 'ANALYZE_RISK') {
    const analysis = RiskEngine.analyze(message.data);
    
    // Log threat if risk is high
    if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
      chrome.storage.local.get(["threatLog", "stats"], (data) => {
        const newLog = [{
          text: `Intercepted ${analysis.flags.join(', ')}`,
          time: new Date().toLocaleTimeString(),
          type: 'blocked'
        }, ...(data.threatLog || [])].slice(0, 50);
        
        const newStats = { ...data.stats };
        if (analysis.riskLevel === 'critical') newStats.blocked++;
        else newStats.warnings++;
        
        chrome.storage.local.set({ threatLog: newLog, stats: newStats });
      });
    } else {
      chrome.storage.local.get("stats", (data) => {
        const newStats = { ...data.stats, safe: (data.stats?.safe || 0) + 1 };
        chrome.storage.local.set({ stats: newStats });
      });
    }

    sendResponse(analysis);
    return true;
  }

  if (message.type === "GET_STATS") {
    chrome.storage.local.get(["stats", "threatLog", "interceptEnabled"], (data) => {
      sendResponse(data);
    });
    return true;
  }

  if (message.type === "TOGGLE_INTERCEPT") {
    chrome.storage.local.get("interceptEnabled", (data) => {
      const next = !data.interceptEnabled;
      chrome.storage.local.set({ interceptEnabled: next }, () => {
        sendResponse({ interceptEnabled: next });
      });
    });
    return true;
  }
});
