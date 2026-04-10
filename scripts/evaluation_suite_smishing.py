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
    # VECTOR 1: USPS & LOGISTICS SMISHING
    # ----------------------------------------------------
    {"expected": "SCAM", "memo": "U.S.P.S: Your parcel is on hold at the distribution center due to an invalid shipping adr. Please update here: usps-delivery-portal.com/track", "platform": "SMS", "amount": 0},
    {"expected": "SCAM", "memo": "FedEx Alert: Delivery failed today. A $2.11 redelivery fee is required. Pay via secure link to schedule tomorrow's dropoff.", "platform": "SMS", "amount": 2.11},
    {"expected": "SCAM", "memo": "Package pending. Cannot deliver until customs duty is cleared. Reply YES for payment link.", "platform": "SMS", "amount": 0},
    {"expected": "SCAM", "memo": "USPS Notice: The address zip code is missing. Please enter your card info to pay the 50 cent correction fee.", "platform": "SMS", "amount": 0.50},
    
    # ----------------------------------------------------
    # VECTOR 2: BANK ANXIETY / ALERT PANIC
    # ----------------------------------------------------
    {"expected": "SCAM", "memo": "Chase Fraud Alert: Did you authorize $985.50 to TARGET? Reply YES or NO. If NO, a secure representative will call you immediately.", "platform": "SMS", "amount": 985.50},
    {"expected": "SCAM", "memo": "Wells Fargo: Your online banking access has been suspended due to 3 failed login attempts. Verify your SSN here to unlock: wf-verify-login.net", "platform": "SMS", "amount": 0},
    {"expected": "SCAM", "memo": "Bank Of America: A Zelle transfer of $1500 was initiated. If you did not make this, transfer funds to the reversing wallet address provided below.", "platform": "SMS", "amount": 1500},
    {"expected": "SCAM", "memo": "URGENT: Your account balance is below zero. Late fees apply in 1 hour. Login to dispute via the attached secure link.", "platform": "SMS", "amount": 0},

    # ----------------------------------------------------
    # VECTOR 3: GEEK SQUAD / AUTO-RENEWAL EXTORTION
    # ----------------------------------------------------
    {"expected": "SCAM", "memo": "Geek Squad Total Tech Support: Your card has been auto-charged $399.99 for your 1-year renewal. To cancel and refund, call 1-800-GEEK-REFUND immediately.", "platform": "Email", "amount": 399.99},
    {"expected": "SCAM", "memo": "Invoice #48192 attached. Norton Anti-Virus Auto-Renewal complete. $450 debited. Call support desk to reverse.", "platform": "Email", "amount": 450},
    {"expected": "SCAM", "memo": "Your McAfee LifeLock subscription was renewed. If you did not authorize this, call our cancellation department to process a refund to your checking account.", "platform": "Email", "amount": 0},
    {"expected": "SCAM", "memo": "Dear Customer, your Amazon Prime annual membership hit your card for $149. Click the document to view details or call our dispute center.", "platform": "Email", "amount": 149},
    {"expected": "SCAM", "memo": "PayPal Receipt: You sent $800 to Coinbase. If unauthorized, call our fraud department at 888-555-0199.", "platform": "SMS", "amount": 800},

    # ----------------------------------------------------
    # VECTOR 4: IRS & TAX PHISHING
    # ----------------------------------------------------
    {"expected": "SCAM", "memo": "IRS Final Notice: You have an outstanding tax balance of $2,450. Warrants will be issued in 24 hours if unpaid. Pay via certified Apple Gift Cards or Wire.", "platform": "SMS", "amount": 2450},
    {"expected": "SCAM", "memo": "Internal Revenue Service: You are eligible for a $1,200 Covid Relief Tax Credit. Click the portal link to claim your funds.", "platform": "Email", "amount": 1200},
    {"expected": "SCAM", "memo": "Tax Audit Department: Discrepancy found on your W2. Call agent John Smith to settle the $900 penalty before legal action.", "platform": "SMS", "amount": 900},

    # ----------------------------------------------------
    # VECTOR 5: SAFE CONTROLS
    # ----------------------------------------------------
    {"expected": "SAFE", "memo": "USPS Tracking 94001: Expected Delivery by 8:00pm. Out for Delivery.", "platform": "SMS", "amount": 0},
    {"expected": "SAFE", "memo": "Chase Alert: Your debit card was used for $14.50 at STARBUCKS. Reply STOP to opt out.", "platform": "SMS", "amount": 14.50},
    {"expected": "SAFE", "memo": "Your one-time passcode for Microsoft is 481923. Don't share this code.", "platform": "SMS", "amount": 0},
    {"expected": "SAFE", "memo": "Amazon: Package dropped off at front porch. Have a nice day!", "platform": "SMS", "amount": 0},
    {"expected": "SAFE", "memo": "Netflix: Your monthly subscription of 15.99 was processed successfully.", "platform": "Email", "amount": 15.99},
    {"expected": "SAFE", "memo": "Hey did you get my package yet? The tracking says delivered.", "platform": "SMS", "amount": 0},
    {"expected": "SAFE", "memo": "Dad, my IRS refund finally direct deposited!", "platform": "SMS", "amount": 0},
    {"expected": "SAFE", "memo": "I just talked to the Geek Squad guy at Best Buy, my laptop is cooked.", "platform": "SMS", "amount": 0},
]

print(f"Starting V4 Smishing/Phishing Evaluation on {len(tests)} advanced edge cases...\n")

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
    print("Incredible. Your AI defeated the advanced Smishing/Phishing evaluation.")
else:
    print(f"AI failed on {failed} smishing edge cases. A prompt update or custom dataset may be required to catch text message nuances.")
