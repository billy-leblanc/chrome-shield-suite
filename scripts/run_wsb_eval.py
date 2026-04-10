import urllib.request
import json
import time

auth_token = None
try:
    with open('.env', 'r') as f:
        for line in f:
            if 'RELAY_AUTH_TOKEN' in line:
                auth_token = line.strip().split('=')[1]
                break
except Exception:
    pass

URL = "https://shield-relay.bleblanc.workers.dev/analyze"

with open('docs/wsb_scrapes.json', 'r') as f:
    scrapes = json.load(f)

print(f"Starting Live WallStreetBets Evaluation on {len(scrapes)} top posts from this month...\n")

for idx, post in enumerate(scrapes):
    memo = post['text'][:300].strip()
    if not memo:
        memo = post['title']
        
    payload = json.dumps({
        "auth_token": auth_token,
        "memo": memo,
        "platform": "Reddit",
        "amount": 0
    }).encode('utf-8')
    
    req = urllib.request.Request(URL, data=payload, headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}, method='POST')
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            score = result.get('riskScore', 0)
            
            print(f"[{idx+1}/{len(scrapes)}] Score: {score}/100 | Title: '{post['title'][:60]}...'")
            if score >= 50:
                print(f"   -> FLAGGED AS SCAM/DEGEN: {result.get('reasoning')}")
            else:
                print(f"   -> MARKED SAFE: {result.get('reasoning')}")
                
    except Exception as e:
        pass
        
    time.sleep(0.5)

print("\n--- DONE ---")
