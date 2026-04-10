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
except Exception as e:
    pass

URL = "https://shield-relay.bleblanc.workers.dev/analyze"

tests = [
    # ----------------------------------------------------
    # VECTOR 1: ROMANCE & AFFINITY SCAMS (Norton Research)
    # ----------------------------------------------------
    {"expected": "SCAM", "memo": "For my flight to come visit you finally my love. The visa fees were more than I thought.", "platform": "Zelle", "amount": 800},
    {"expected": "SCAM", "memo": "Paying the hospital bill for my daughter, she is in critical condition and I am stuck on the oil rig.", "platform": "Venmo", "amount": 1500},
    {"expected": "SCAM", "memo": "Customs fee for the package of gold I sent you from my deployment in Syria.", "platform": "PayPal", "amount": 2000},
    {"expected": "SCAM", "memo": "Need to pay off my commander so I can get leave and we can finally be together.", "platform": "CashApp", "amount": 500},
    {"expected": "SCAM", "memo": "My webcam broke, need money to buy a new one so we can video chat.", "platform": "Venmo", "amount": 120},
    {"expected": "SCAM", "memo": "I know we haven't met, but my landlord is kicking me out tonight. Please help, you're the only one I trust.", "platform": "Zelle", "amount": 600},
    {"expected": "SCAM", "memo": "Lawyer fees to unlock my inheritance, then we will be rich together my darling.", "platform": "PayPal", "amount": 2500},

    # ----------------------------------------------------
    # VECTOR 2: SMISHING & FAKE ALERTS (CNB Research)
    # ----------------------------------------------------
    {"expected": "SCAM", "memo": "Zelle Alert: Did you authorize $985.00 to Coinbase? If NO, secure your funds by sending them to your verification wallet.", "platform": "Zelle", "amount": 985},
    {"expected": "SCAM", "memo": "BofA Security: Your account is locked. Transfer balance to provisional holding account immediately to prevent loss.", "platform": "Zelle", "amount": 4500},
    {"expected": "SCAM", "memo": "Fraud dept test: Please remit 1.00 to verify possession of this account.", "platform": "Venmo", "amount": 1},
    {"expected": "SCAM", "memo": "Wells Fargo Alert: Unusual activity detected. Send funds to your reversal Zelle address attached to this number.", "platform": "Zelle", "amount": 1500},
    {"expected": "SCAM", "memo": "To stop the unauthorized Amazon charge of $799, process this reversal ticket.", "platform": "PayPal", "amount": 799},
    {"expected": "SCAM", "memo": "Chase Bank: Temporary block on account. Send $50 test transaction to unlock routing features.", "platform": "Zelle", "amount": 50},
    
    # ----------------------------------------------------
    # VECTOR 3: TECH SUPPORT / OVERPAYMENT (Refund Scams)
    # ----------------------------------------------------
    {"expected": "SCAM", "memo": "Geek squad refund return. The tech accidentally sent me 5000 instead of 500.", "platform": "Zelle", "amount": 4500},
    {"expected": "SCAM", "memo": "Refunding the overpayment for the Norton antivirus cancellation so the agent doesn't lose his job.", "platform": "Venmo", "amount": 1800},
    {"expected": "SCAM", "memo": "Returning the accidental deposit from Amazon customer service.", "platform": "PayPal", "amount": 2000},
    {"expected": "SCAM", "memo": "Sending back the extra funds they wired to my bank account by mistake.", "platform": "Zelle", "amount": 9500},
    {"expected": "SCAM", "memo": "I am sending this back to the Microsoft technician who made an error on my refund.", "platform": "Zelle", "amount": 3500},
    {"expected": "SCAM", "memo": "Reversing the extra zero on my BestBuy tech support refund.", "platform": "Venmo", "amount": 900},

    # ----------------------------------------------------
    # VECTOR 4: PIG BUTCHERING & CRYPTO (WallStreetBets/Nodes)
    # ----------------------------------------------------
    {"expected": "SCAM", "memo": "Funding my liquidity node pool for the USDT project Professor Chen told me about.", "platform": "PayPal", "amount": 5000},
    {"expected": "SCAM", "memo": "VIP WallStreetBets discord signal fee. Need to pay before the coin pumps at 8PM.", "platform": "Venmo", "amount": 250},
    {"expected": "SCAM", "memo": "Paying the 10% tax margin so my trading platform will let me withdraw my $50k profit.", "platform": "Zelle", "amount": 5000},
    {"expected": "SCAM", "memo": "Exclusive ETH presale allocation. Sending to the smart contract developer.", "platform": "Zelle", "amount": 2000},
    {"expected": "SCAM", "memo": "Upgrading to VIP Level 3 on the trading exchange so I can unlock my frozen assets.", "platform": "CashApp", "amount": 1200},
    {"expected": "SCAM", "memo": "Sending my sister's friend's trading boss the capital for the guaranteed 5% daily return.", "platform": "Zelle", "amount": 3000},
    {"expected": "SCAM", "memo": "Gas fees to unwrap the airdrop tokens I won on twitter.", "platform": "PayPal", "amount": 150},

    # ----------------------------------------------------
    # VECTOR 5: PRETEXTING & BEC (Associated Bank Research)
    # ----------------------------------------------------
    {"expected": "SCAM", "memo": "CEO directed urgent wire for confidential acquisition. Do not alert finance team.", "platform": "Zelle", "amount": 8500},
    {"expected": "SCAM", "memo": "Our supplier changed their bank routing last minute, sending the invoice payment here instead.", "platform": "PayPal", "amount": 5400},
    {"expected": "SCAM", "memo": "Owner asked me to buy these Apple gift cards for client bonuses today and reimburse myself.", "platform": "Zelle", "amount": 1000},
    {"expected": "SCAM", "memo": "Urgent vendor payment to avoid supply chain halt, as requested by the boss's personal email.", "platform": "Venmo", "amount": 3200},
    {"expected": "SCAM", "memo": "Paying the new contractor directly because payroll system is down.", "platform": "CashApp", "amount": 950},
    {"expected": "SCAM", "memo": "Confidential legal retainer fee requested by CEO via text message.", "platform": "Zelle", "amount": 4000},

    # ----------------------------------------------------
    # VECTOR 6: TASK & EMPLOYMENT SCAMS
    # ----------------------------------------------------
    {"expected": "SCAM", "memo": "Recharging my merchant tier so I can complete my 40 optimization tasks today and withdraw my salary.", "platform": "Venmo", "amount": 800},
    {"expected": "SCAM", "memo": "Paying for my at-home office equipment, the company HR prep-paid my first check.", "platform": "Zelle", "amount": 1200},
    {"expected": "SCAM", "memo": "Clearing the negative task balance to unlock my commission.", "platform": "PayPal", "amount": 450},
    {"expected": "SCAM", "memo": "Equipment fee for my new remote data entry job. They check is clearing now.", "platform": "Venmo", "amount": 300},
    {"expected": "SCAM", "memo": "VIP Node 4 activation fee for app review tasks.", "platform": "CashApp", "amount": 600},

    # ----------------------------------------------------
    # VECTOR 7: SEXTORTION, PANIC & THREATS (The Edge Cases)
    # ----------------------------------------------------
    {"expected": "SCAM", "memo": "If I don't pay this immediately they are sending the webcam video to my wife's facebook.", "platform": "Zelle", "amount": 1500},
    {"expected": "SCAM", "memo": "Bail money for my grandson who just got into a car accident and the police will arrest him if I don't pay the victim.", "platform": "Venmo", "amount": 2500},
    {"expected": "SCAM", "memo": "IRS Agent Smith said my social security number is suspended and warrants are issued unless I pay this bond.", "platform": "PayPal", "amount": 3000},
    {"expected": "SCAM", "memo": "Paying the cartel so they don't hurt my family, they sent pictures of my house.", "platform": "Zelle", "amount": 1000},
    {"expected": "SCAM", "memo": "The escrow agency will get me deported if I don't cover the immigration processing fee.", "platform": "Zelle", "amount": 1800},
    {"expected": "SCAM", "memo": "Hush money for the escort service underage situation.", "platform": "Venmo", "amount": 2000},
    {"expected": "SCAM", "memo": "Secret service fine for clicking that illegal link.", "platform": "PayPal", "amount": 500},

    # ----------------------------------------------------
    # VECTOR 8: THE HARD BENIGN (These MUST SCORE UNDER 50)
    # ----------------------------------------------------
    {"expected": "SAFE", "memo": "Here is the rent for March + Utilities.", "platform": "Zelle", "amount": 1400},
    {"expected": "SAFE", "memo": "Bailing you out since you forgot your wallet at the bar you idiot.", "platform": "Venmo", "amount": 45},
    {"expected": "SAFE", "memo": "Invested in the new tech startup my brother pitched. Hope this 10x's!", "platform": "Zelle", "amount": 5000},
    {"expected": "SAFE", "memo": "Refunding you for the extra cash you sent for the pizza last night.", "platform": "Venmo", "amount": 15},
    {"expected": "SAFE", "memo": "Paying you back for fixing the virus on my laptop.", "platform": "PayPal", "amount": 75},
    {"expected": "SAFE", "memo": "VIP concert tickets for next weekend.", "platform": "Venmo", "amount": 350},
    {"expected": "SAFE", "memo": "Medical bill for mom's surgery copay.", "platform": "Zelle", "amount": 450},
    {"expected": "SAFE", "memo": "Extortion money because you bought me lunch yesterday.", "platform": "Venmo", "amount": 12},
    {"expected": "SAFE", "memo": "My flight to visit you! Finally bought the tickets.", "platform": "Zelle", "amount": 380},
    {"expected": "SAFE", "memo": "Customs duties on the shoes I ordered from japan.", "platform": "PayPal", "amount": 80},
    {"expected": "SAFE", "memo": "Testing if my zelle works. Do not include notes.", "platform": "Zelle", "amount": 1},
    {"expected": "SAFE", "memo": "Boss told me to buy coffee for the office.", "platform": "Venmo", "amount": 48},
    {"expected": "SAFE", "memo": "Recharging my merchant tier on that stupid farming game.", "platform": "PayPal", "amount": 14},
    {"expected": "SAFE", "memo": "Happy birthday! Buy yourself something nice from uncle dan.", "platform": "CashApp", "amount": 100},
]

print(f"Starting V2 Deep Evaluation on {len(tests)} advanced test cases...\n")

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
    print("Incredible. Your AI defeated the advanced 50-point Red Team evaluation.")
else:
    print(f"AI failed on {failed} advanced edge cases. Updating SYSTEM_PROMPT required.")
