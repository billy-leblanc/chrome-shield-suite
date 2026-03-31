import{d as S,j as r,a as c}from"./assets/client-CYlhr6lt.js";const E={"paypal.com":{name:"PayPal",selectors:['[data-testid="submit-button"]','[data-testid="send-money-submit"]','button[name="payment-submit-btn"]',"#payment-submit-btn","button.send-money-submit","#sendMoneyButton",".paypal-button"]},"venmo.com":{name:"Venmo",selectors:['button[data-testid="pay-button"]','button[aria-label="Pay"]']},"zellepay.com":{name:"Zelle",selectors:["#send-money-zelle-button","#sendmoney-button",'button[type="submit"]']}},j={"venmo.com":/^(Pay|Send)$/i,"zellepay.com":/^Send Money$/i},k=()=>{const o=window.location.hostname;for(const e in E)if(o.includes(e))return{config:E[e],domain:e};return null},M=o=>{const e=document.createElement("style");e.textContent=`
    :host {
      --background: 222 47% 7%;
      --foreground: 210 40% 96%;
      --card: 222 40% 10%;
      --card-foreground: 210 40% 96%;
      --primary: 187 92% 69%;
      --secondary: 222 30% 16%;
      --destructive: 0 86% 71%;
      --destructive-foreground: 222 47% 7%;
      --border: 217 30% 15%;
    }
    .fixed { position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: center; justify-content: center; background-color: rgba(0, 0, 0, 0.7); backdrop-filter: blur(8px); }
    .bg-card { background-color: hsl(var(--card)); border: 1px solid hsl(var(--border)); border-radius: 1.5rem; padding: 2rem; width: 90%; max-width: 400px; box-shadow: 0 0 40px rgba(187, 92, 69, 0.2); }
    .text-center { text-align: center; }
    .font-bold { font-weight: 800; color: #F1F5F9; }
    .text-sm { font-size: 0.875rem; line-height: 1.6; color: #94A3B8; margin: 1.5rem 0; }
    .flex { display: flex; gap: 1rem; }
    .btn { flex: 1; padding: 0.75rem; border-radius: 1rem; font-weight: 700; cursor: pointer; border: none; transition: 0.2s; }
    .btn-secondary { background: #1E293B; color: #94A3B8; }
    .btn-destructive { background: #F87171; color: #0B1120; }
    .btn:hover { opacity: 0.9; transform: scale(1.02); }
  `,o.appendChild(e)},N=()=>{var f;const[o,e]=c.useState(!1),[a,T]=c.useState(null),m=c.useRef(k()),i=c.useRef(!1);if(c.useEffect(()=>{const b=m.current;if(!b)return;const{config:p,domain:w}=b,A=n=>{if(p.selectors.some(t=>n.matches(t)||n.closest(t)))return!0;const d=j[w];if(d){const t=n.tagName==="BUTTON"?n:n.closest("button");if(t&&d.test((t.textContent??"").trim()))return!0}return!1},h=n=>{var v;const d=n.target;if(!A(d)||(n.preventDefault(),n.stopImmediatePropagation(),i.current))return;i.current=!0;const t=document.querySelector('textarea, [contenteditable="true"], input[name*="note"], input[name*="memo"]');let u="";t instanceof HTMLTextAreaElement||t instanceof HTMLInputElement?u=t.value??"":t instanceof HTMLElement&&(u=t.textContent??"");const g=document.querySelector('input[type="number"], .amount-input, input[name*="amount"]'),C=g instanceof HTMLInputElement?g.value:"",x=parseFloat(C),R=isFinite(x)?x:0;if(!((v=chrome.runtime)!=null&&v.id)){i.current=!1;return}chrome.runtime.sendMessage({type:"ANALYZE_RISK",data:{message:u.substring(0,1e3),amount:R,platform:p.name}},s=>{i.current=!1,s&&typeof s=="object"&&typeof s.riskLevel=="string"&&typeof s.score=="number"&&(s.riskLevel==="high"||s.riskLevel==="critical")&&(T(s),e(!0))})};document.addEventListener("click",h,{capture:!0});const y=new MutationObserver(n=>{});return y.observe(document.body,{childList:!0,subtree:!0}),()=>{document.removeEventListener("click",h,!0),y.disconnect()}},[]),!o||!a)return null;const l=(f=m.current)==null?void 0:f.config;return r.jsx("div",{className:"fixed",children:r.jsxs("div",{className:"bg-card text-center",children:[r.jsx("h2",{className:"font-bold",children:a.riskLevel==="critical"?"CRITICAL THREAT DETECTED":`Security Alert: ${(l==null?void 0:l.name)??"Payment"}`}),r.jsx("p",{className:"text-sm",children:a.recommendation||"We've detected potential fraud patterns in this transaction."}),r.jsxs("div",{className:"flex",children:[r.jsx("button",{className:"btn btn-secondary",onClick:()=>e(!1),children:"Cancel Payment"}),r.jsx("button",{className:"btn btn-destructive",onClick:()=>{e(!1),console.warn("[Shield] User ignored high-risk warning.")},children:"Proceed Anyway"})]})]})})},L=()=>{if(!k()||document.getElementById("shield-host"))return;const o=document.createElement("div");o.id="shield-host",document.body.appendChild(o);const e=o.attachShadow({mode:"closed"});M(e);const a=document.createElement("div");e.appendChild(a),S(a).render(r.jsx(N,{}))};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",L,{once:!0}):L();
