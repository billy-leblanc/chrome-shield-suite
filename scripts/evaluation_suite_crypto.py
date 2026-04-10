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

tests = [
    # ----------------------------------------------------
    # VECTOR 1: PUMP & DUMP / FOMO HYPING
    # ----------------------------------------------------
    {"expected": "SCAM", "memo": "Urgent WSB discord drop! Buy $ELONPEPE on PancakeSwap right now before the whales pump it at 4PM EST. 100x guaranteed.", "platform": "Discord", "amount": 500},
    {"expected": "SCAM", "memo": "Insider dev wallet accumulating. Get your bags packed, the liquidity is getting locked tomorrow. Last chance to buy.", "platform": "Telegram", "amount": 200},
    {"expected": "SCAM", "memo": "Doge missed? Don't miss ShibInu2. We are pumping this to the moon in 3 hours. Join the premium channel for the exact entry price.", "platform": "Reddit", "amount": 100},
    {"expected": "SCAM", "memo": "The dev just renounced ownership. It's a guaranteed moonshot. Buy now and hold until we hit 10M market cap.", "platform": "Twitter", "amount": 50},

    # ----------------------------------------------------
    # VECTOR 2: SIGNALS & INVESTMENT GURUS
    # ----------------------------------------------------
    {"expected": "SCAM", "memo": "VIP Platinum Trading Group access fee. Send $500 BTC to unlock my daily guaranteed 5% profit crypto signals.", "platform": "PayPal", "amount": 500},
    {"expected": "SCAM", "memo": "I'll trade your account for you, we just split the profits 50/50. Just send the starting capital of $2000 to this wallet.", "platform": "Zelle", "amount": 2000},
    {"expected": "SCAM", "memo": "Paying my mentor his 10% cut of the profits so he gives me the next 10x altcoin drop.", "platform": "Venmo", "amount": 800},
    {"expected": "SCAM", "memo": "Subscription fee for the options trading wizard who hasn't had a losing month in 4 years.", "platform": "CashApp", "amount": 150},

    # ----------------------------------------------------
    # VECTOR 3: THE PROFESSOR / MENTOR (Pig Butchering)
    # ----------------------------------------------------
    {"expected": "SCAM", "memo": "Adding initial capital to the liquidity node platform that Professor Chen recommended to me.", "platform": "PayPal", "amount": 5000},
    {"expected": "SCAM", "memo": "My uncle's trading algorithm has an inside hook up to the Binance order book. Depositing my savings now.", "platform": "Zelle", "amount": 15000},
    {"expected": "SCAM", "memo": "Auntie said the short-term USDT contract yields 3% daily. I'm transferring from Coinbase to the custom app she sent me.", "platform": "Venmo", "amount": 3500},
    {"expected": "SCAM", "memo": "Funding my account on FTX2-Pro. The girl I met on Tinder guided me through the setup.", "platform": "CashApp", "amount": 1200},

    # ----------------------------------------------------
    # VECTOR 4: ADVANCE FEE / WITHDRAWAL TAX
    # ----------------------------------------------------
    {"expected": "SCAM", "memo": "Paying the 15% Capital Gains Tax required by the exchange before they let me withdraw my $45k profit.", "platform": "Zelle", "amount": 6750},
    {"expected": "SCAM", "memo": "Security deposit to unlock my frozen crypto wallet. Support said it's fully refundable.", "platform": "PayPal", "amount": 2500},
    {"expected": "SCAM", "memo": "The mining pool requires a VIP Tier 3 upgrade fee before I can transfer my Bitcoin to cold storage.", "platform": "Venmo", "amount": 900},
    {"expected": "SCAM", "memo": "Paying the blockchain network congestion priority fee directly to the support admin.", "platform": "CashApp", "amount": 400},

    # ----------------------------------------------------
    # VECTOR 5: RECOVERY SCAMS
    # ----------------------------------------------------
    {"expected": "SCAM", "memo": "Paying the ethical hacker from Instagram to trace the blockchain and get my stolen money back.", "platform": "Zelle", "amount": 1500},
    {"expected": "SCAM", "memo": "Upfront fee for the cyber intelligence firm that promised to freeze the scammer's wallet.", "platform": "PayPal", "amount": 3000},
    {"expected": "SCAM", "memo": "Retainer for the dark web tracer to reverse the transaction from last week.", "platform": "Venmo", "amount": 850},

    # ----------------------------------------------------
    # VECTOR 6: FAKE GIVEAWAYS & PHISHING
    # ----------------------------------------------------
    {"expected": "SCAM", "memo": "Verification deposit. Sending 0.5 ETH to Elon Musk's giveaway address so they double it and send back 1 ETH.", "platform": "PayPal", "amount": 1500},
    {"expected": "SCAM", "memo": "Connecting wallet to the official Tesla airdrop site. I just need to pay gas fees.", "platform": "Venmo", "amount": 50},
    {"expected": "SCAM", "memo": "Coinbase Support: Please remit $5 to verify possession of this hardware wallet.", "platform": "Zelle", "amount": 5},

    # ----------------------------------------------------
    # VECTOR 7: SAFE / LEGITIMATE MARKET DISCUSSIONS
    # ----------------------------------------------------
    {"expected": "SAFE", "memo": "Depositing funds into my Charles Schwab brokerage account for my Roth IRA.", "platform": "Brokerage", "amount": 6000},
    {"expected": "SAFE", "memo": "Transferring fiat to Coinbase so I can buy some Ethereum and hold it.", "platform": "Coinbase", "amount": 1000},
    {"expected": "SAFE", "memo": "Paying you back for covering my share of the Robinhood stock we bought together last year.", "platform": "Venmo", "amount": 450},
    {"expected": "SAFE", "memo": "I literally lost everything trading options on SPY today. My life is ruined.", "platform": "Reddit", "amount": 0},
    {"expected": "SAFE", "memo": "The Fed is totally going to raise rates again tomorrow, market is bleeding.", "platform": "Discord", "amount": 0},
    {"expected": "SAFE", "memo": "Here is the split for the electric bill since my crypto mining rig uses so much power.", "platform": "Zelle", "amount": 120},
    {"expected": "SAFE", "memo": "Check out this breakdown of NVIDIA's earnings report. Bulls are taking over.", "platform": "Twitter", "amount": 0},
]

print(f"Starting V3 Crypto/Investment Evaluation on {len(tests)} advanced edge cases...\n")

passed = 0
failed = 0
failures = []

for idx, t in enumerate(tests):
    payload = json.dumps({
        "auth_token": auth_token,
        "memo": t["memo"],
        "platform": t["platform"],
        "amount": t["amount"]
    }).encode('utf-8')
    
    req = urllib.request.Request(URL, data=payload, headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}, method='POST')
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            score = result.get('riskScore', 0)
            
            flagged = score >= 50
            is_scam = t["expected"] == "SCAM"
            success = (flagged and is_scam) or (not flagged and not is_scam)
            
            if success:
                passed += 1
                status = "✅ PASS"
                print(f"[{idx+1}/{len(tests)}] {status} | Expected: {t['expected']} | Score: {score}/100")
            else:
                failed += 1
                status = "❌ FAIL"
                print(f"[{idx+1}/{len(tests)}] {status} | Expected: {t['expected']} | Score: {score}/100 | Memo: '{t['memo']}'")
                print(f"   -> Reason: {result.get('reasoning')}")
                failures.append(t)
                
    except Exception as e:
        print(f"[{idx+1}/{len(tests)}] ❌ HTTP ERROR on '{t['memo']}': {e}")
        failed += 1
        failures.append(t)
        
    time.sleep(0.5)

print(f"\n--- FINAL RESULTS: {passed} Passed, {failed} Failed ---")
if failed == 0:
    print("Incredible. Your AI defeated the advanced Crypto Red Team evaluation.")
else:
    print(f"AI failed on {failed} crypto edge cases. A prompt update or custom dataset may be required to catch 'Professor'/'Withdrawal Fee' tropes.")
