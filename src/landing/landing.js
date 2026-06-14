  // Demo registry lookup — illustrative only, not a live verdict service.
  const samples = {
    'paypa1-security.com':{v:'risk',t:'High-risk indicators',m:'Impersonates <b style="color:#fff">PayPal</b> · registered 9 days ago · credential-phishing pattern · corroborated by 2 sources.'},
    'legal-aid-services.com':{v:'risk',t:'High-risk indicators',m:'Family-emergency impersonation · urgency + secrecy pressure · linked to a tracked scam campaign.'},
    'amazon.com':{v:'clear',t:'No risk indicators',m:'Established domain · no detections on record · on the verified-sender allowlist.'},
    'paypal.com':{v:'clear',t:'No risk indicators',m:'Established domain · authenticated sender · on the verified-sender allowlist.'}
  };
  function checkDomain(){
    const q=(document.getElementById('regq').value||'').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/\/.*$/,'')||'paypa1-security.com';
    const res=document.getElementById('regres');
    const hit=samples[q]||{v:'risk',t:'Indicators under review',m:'This domain is being evaluated. Corroborated records publish once two independent sources agree.'};
    const vEl=document.getElementById('regverdict');
    vEl.className='reg-verdict '+hit.v;
    document.getElementById('regverdicttext').textContent=hit.t;
    document.getElementById('regdom').textContent=q;
    document.getElementById('regmeta').innerHTML=hit.m;
    res.classList.add('show');
  }
  document.getElementById('regq').addEventListener('keydown',e=>{if(e.key==='Enter')checkDomain()});

  // Count-up on the registry stats when scrolled into view
  const fmt=n=>n.toLocaleString();
  function countUp(el,target){let s=0,step=Math.ceil(target/40);const t=setInterval(()=>{s+=step;if(s>=target){s=target;clearInterval(t)}el.textContent=fmt(s)},24)}
  const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){countUp(document.getElementById('s1'),1737);countUp(document.getElementById('s2'),3284);document.getElementById('s3').textContent='8';io.disconnect()}})},{threshold:.4});
  io.observe(document.querySelector('.reg-stats'));
