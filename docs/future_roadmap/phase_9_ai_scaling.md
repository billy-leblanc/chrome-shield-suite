# Phase 9: AI Scaling & QR Protection

## Strategic Objectives
Transform the Shield from a text-based interceptor into a multi-modal AI security layer.

### 1. Vision Integration (QR Scams)
- **Challenge**: Scammers increasingly use malicious QR codes in social engineering memos.
- **Solution**: Implement a background "eyes" feature that scans visible QR codes on payment pages and cross-references them with a threat database.

### 2. Deepfake Voice & Social Engineering Hooks
- **Challenge**: "Grandparent" and "Family Emergency" scams are moving to AI-generated voice clones.
- **Solution**: Use the `chrome.tabs.onUpdated` listener to detect when a user is in an active VoIP call (or meeting tab) while processing a payment, triggering an "Active Social Engineering" high-alert modal.

### 3. Secure API Relay Enclave
- **Challenge**: Current API keys are stored in local storage (vulnerable to XSS or extraction).
- **Solution**: 
    - Deploy a Cloudflare Worker or AWS Lambda relay.
    - The extension sends hashed transaction context to the relay.
    - The relay performs the Anthropic/OpenAI call and returns only the `RiskScore`.
    - Result: No local API keys; fully protected quota.

### 4. Advanced Polymorphic Detection
- **AI Feedback Loop**: Allow the Risk Engine to "learn" from locally corrected detections to improve future heuristics without central server dependency (Local LLM approach).
