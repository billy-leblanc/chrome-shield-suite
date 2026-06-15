(function(){
  // reveal on scroll
  var rev=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12,rootMargin:'0px 0px -8% 0px'});
    rev.forEach(function(e){io.observe(e);});
  } else rev.forEach(function(e){e.classList.add('in');});

  // demo tabs + intercept
  var stage=document.querySelector('[data-demo]');
  if(stage){
    var tabs=stage.querySelectorAll('.demo-tab');
    var screens=stage.querySelectorAll('[data-screen]');
    var ics=stage.querySelectorAll('.intercept');
    var url=stage.querySelector('[data-url]');
    var t;
    function play(name){
      tabs.forEach(function(x){x.classList.toggle('active',x.dataset.tab===name);});
      screens.forEach(function(s){s.style.display=(s.dataset.screen===name)?'':'none';});
      if(url) url.textContent=(name==='mail')?'mail.google.com':'zellepay.com/send';
      ics.forEach(function(ic){ic.classList.remove('show');});
      var a=stage.querySelector('.intercept[data-for="'+name+'"]');
      clearTimeout(t);
      if(a) t=setTimeout(function(){a.classList.add('show');},850);
    }
    tabs.forEach(function(x){x.addEventListener('click',function(){play(x.dataset.tab);});});
    var rep=document.querySelector('[data-replay]');
    if(rep) rep.addEventListener('click',function(){var c=stage.querySelector('.demo-tab.active');play(c?c.dataset.tab:'pay');});
    var played=false;
    if('IntersectionObserver' in window){
      var io2=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&!played){played=true;play('pay');}});},{threshold:.4});
      io2.observe(stage);
    } else play('pay');
  }

  // registry: animated stat counters
  var rs=document.querySelector('#registry .reg-stats');
  if(rs && 'IntersectionObserver' in window){
    var ioR=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting) return; ioR.unobserve(e.target);
      e.target.querySelectorAll('.reg-n[data-count]').forEach(function(n){
        var to=parseInt(n.getAttribute('data-count'),10),st=Date.now(),d=1100;
        (function tick(){var p=Math.min(1,(Date.now()-st)/d),v=Math.floor((1-Math.pow(1-p,3))*to);
          n.textContent=v.toLocaleString(); if(p<1)requestAnimationFrame(tick);})();
      });
    });},{threshold:.4}); ioR.observe(rs);
  }
  // registry: demo lookup
  var SAMPLES={
    'robiox.com.ua':{t:'high',f:'Registered 14 days before first report. Hosted on AS-RETN. Imitates <b>Roblox</b>.',c:'Part of a 3-domain campaign: roblox.et, roblox.com.ml'},
    'roblox.et':{t:'high',f:'Lookalike domain. Credential-phishing indicators reported by 2 sources.',c:'Part of a 3-domain campaign: robiox.com.ua, roblox.com.ml'},
    'bet365f.vip':{t:'high',f:'Typosquat of bet365. Registrar Dynadot. Gambling-lure indicators.',c:null},
    'delivery-do-ze.shop':{t:'high',f:'Delivery-payment scam pattern. Recently registered .shop domain.',c:'Part of a 3-domain campaign: deliverys-do-ze.shop, deliverysbebidas-do-ze.shop'},
    'example.com':{t:'safe',f:'No high-risk indicators. Established domain, not on any abuse feed.',c:null}
  };
  var inp=document.getElementById('reg-input'),res=document.getElementById('reg-result');
  function card(dom,d){
    var hi=d.t==='high';
    res.innerHTML='<div class="reg-card"><span class="reg-tier '+d.t+'">'+
      '<i data-lucide="'+(hi?'alert-triangle':'shield-check')+'"></i>'+(hi?'High-risk indicators':'No indicators reported')+'</span>'+
      '<div class="reg-dom">'+dom+'</div><div class="reg-facts">'+d.f+'</div>'+
      (d.c?'<div class="reg-camp">\u{1F578}️ '+d.c+'</div>':'')+'</div>';
    if(window.lucide) window.lucide.createIcons();
  }
  if(inp){
    function look(){var v=(inp.value||'').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/\/.*$/,'');
      if(SAMPLES[v]){card(v,SAMPLES[v]);} else if(v.length>3){
        res.innerHTML='<div class="reg-card"><span class="reg-tier safe"><i data-lucide="search"></i>Not in registry</span><div class="reg-dom">'+v+'</div><div class="reg-facts">No record yet. The public lookup opens with the full index soon.</div></div>';
        if(window.lucide)window.lucide.createIcons();
      } else { res.innerHTML=''; }
    }
    inp.addEventListener('input',look);
    setTimeout(function(){inp.value='robiox.com.ua';look();},600);
  }

  if(window.lucide) window.lucide.createIcons();
})();
