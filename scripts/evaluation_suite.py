import urllib.request
import json
import os
import time

# Parse the auth token directly from the .env file
auth_token = None
try:
    with open('.env', 'r') as f:
        for line in f:
            if 'RELAY_AUTH_TOKEN' in line:
                auth_token = line.strip().split('=')[1]
                break
except Exception as e:
    print(f"Failed to read .env: {e}")
    exit(1)

if not auth_token:
    print("Could not find RELAY_AUTH_TOKEN in .env")
    exit(1)

URL = "https://shield-relay.bleblanc.workers.dev/analyze"

# The Advanced Red Team Dataset (Edge cases meant to break the model)
tests = [
    # --- ADVANCED SCAMS (Must score over 50) ---
    {"expected": "SCAM", "memo": "VIP Task 4: Remit $800 to processing node to release your $1200 daily commission.", "platform": "Venmo", "amount": 800}, # Task Scam
    {"expected": "SCAM", "memo": "Refund overpayment: returning the extra $500 the GeekSquad tech accidentally wired me.", "platform": "Zelle", "amount": 500}, # Refund Scam
    {"expected": "SCAM", "memo": "Investment capital for the USDT node project uncle Chen recommended. Will return 5% daily yield.", "platform": "Zelle", "amount": 2000}, # Pig Butchering
    {"expected": "SCAM", "memo": "WallStreetBets VIP signal fee. Pumping memecoin tonight, 10x guaranteed.", "platform": "PayPal", "amount": 150}, # Discord/WSB Scam
    {"expected": "SCAM", "memo": "If you don't send the $500 right now I'm sending those pictures to everyone on your FetLife and your wife's facebook.", "platform": "Zelle", "amount": 500}, # Sextortion
    {"expected": "SCAM", "memo": "Account verification test. Do not include notes.", "platform": "Zelle", "amount": 1}, # Testing stolen card
    
    # --- HARD SAFE/BENIGN (Must score under 50) ---
    {"expected": "SAFE", "memo": "Investing in the new tech startup my brother pitched me. Hope this 10x's lol.", "platform": "Zelle", "amount": 5000}, # Safe, but uses 'investment' and '10x'
    {"expected": "SAFE", "memo": "Here's the refund for the extra money you accidentally sent me for the pizza.", "platform": "Venmo", "amount": 20}, # Safe, but uses 'refund overpayment' keywords
    {"expected": "SAFE", "memo": "VIP tickets for the concert this weekend, text me the PDF when you get it.", "platform": "Venmo", "amount": 350}, # Safe, uses 'VIP'
    {"expected": "SAFE", "memo": "If you don't send me the $10 you owe me I'm telling mom who broke the lamp.", "platform": "Venmo", "amount": 10}, # Safe, harmless extortion between siblings
]

print(f"Starting Evaluation on {len(tests)} test cases...\n")

passed = 0
failed = 0

for t in tests:
    payload = json.dumps({
        "auth_token": auth_token,
        "memo": t["memo"],
        "platform": t["platform"],
        "amount": t["amount"]
    }).encode('utf-8')
    
    req = urllib.request.Request(URL, data=payload, headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0 Safari/537.36'}, method='POST')
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            score = result.get('riskScore', 0)
            
            # Grading logic: over 50 is considered flagged
            flagged = score >= 50
            is_scam = t["expected"] == "SCAM"
            
            success = (flagged and is_scam) or (not flagged and not is_scam)
            
            if success:
                passed += 1
                status = "✅ PASS"
            else:
                failed += 1
                status = "❌ FAIL"
                
            print(f"{status} | Expected: {t['expected']} | Score: {score}/100 | Memo: '{t['memo']}'")
            if not success:
                print(f"   -> AI Reasoning: {result.get('reasoning')}")
                
    except Exception as e:
        print(f"Error on {t['memo']}: {e}")
        
    time.sleep(1) # Prevent rate limiting

print(f"\n--- RESULTS: {passed} Passed, {failed} Failed ---")
if failed == 0:
    print("Your SYSTEM_PROMPT is flawless on this dataset!")
else:
    print("Review the failures above. Tweak SYSTEM_PROMPT in relay-worker.js to fix them.")
