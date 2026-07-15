(function(){
  "use strict";

  var REDUCE_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var POINTER_FINE = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  /* =========================================================
     STORAGE HELPERS (persistent artifact storage, best-effort)
  ========================================================= */
  async function storeGet(key){
    try{
      var r = await window.storage.get(key, false);
      return r ? r.value : null;
    }catch(e){ return null; }
  }
  async function storeSet(key, value){
    try{ await window.storage.set(key, value, false); }catch(e){ /* non-fatal */ }
  }

  /* =========================================================
     FLIP NUMERAL COMPONENT (signature scoreboard motion)
  ========================================================= */
  function flipRender(el, str){
    el.innerHTML = '';
    for(var i=0;i<str.length;i++){
      var ch = str[i];
      var tile = document.createElement('span');
      tile.className = 'flip-tile';
      tile.textContent = ch === ' ' ? '\u00A0' : ch;
      tile.setAttribute('data-val', ch);
      el.appendChild(tile);
    }
  }
  function flipUpdate(el, str){
    var tiles = el.children;
    if(tiles.length !== str.length){ flipRender(el, str); return; }
    for(var i=0;i<str.length;i++){
      var ch = str[i];
      var tile = tiles[i];
      if(tile.getAttribute('data-val') !== ch){
        if(REDUCE_MOTION){
          tile.textContent = ch === ' ' ? '\u00A0' : ch;
          tile.setAttribute('data-val', ch);
        } else {
          (function(tile, ch){
            tile.classList.add('flipping');
            setTimeout(function(){
              tile.textContent = ch === ' ' ? '\u00A0' : ch;
              tile.setAttribute('data-val', ch);
            }, 140);
            setTimeout(function(){ tile.classList.remove('flipping'); }, 320);
          })(tile, ch);
        }
      }
    }
  }

  /* =========================================================
     BOOT SEQUENCE
  ========================================================= */
  (function boot(){
    var bootEl = document.getElementById('boot');
    var word = document.getElementById('boot-word');
    var target = 'PULSE';
    flipRender(word, '#####');
    if(REDUCE_MOTION){
      flipUpdate(word, target);
      setTimeout(function(){ bootEl.classList.add('boot-hide'); }, 250);
      return;
    }
    var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var step = 0;
    var iv = setInterval(function(){
      var scrambled = '';
      for(var i=0;i<target.length;i++){
        scrambled += (i <= step) ? target[i] : letters[Math.floor(Math.random()*letters.length)];
      }
      flipUpdate(word, scrambled);
      step++;
      if(step > target.length){
        clearInterval(iv);
        setTimeout(function(){ bootEl.classList.add('boot-hide'); }, 450);
      }
    }, 110);
  })();

  /* =========================================================
     CUSTOM CURSOR
  ========================================================= */
  if(POINTER_FINE){
    document.documentElement.classList.add('has-cursor');
    var dot = document.getElementById('cursor-dot');
    var ring = document.getElementById('cursor-ring');
    var mx=innerWidth/2, my=innerHeight/2, rx=mx, ry=my;
    window.addEventListener('mousemove', function(e){ mx=e.clientX; my=e.clientY; });
    (function raf(){
      rx += (mx-rx)*0.18; ry += (my-ry)*0.18;
      dot.style.transform = 'translate('+mx+'px,'+my+'px) translate(-50%,-50%)';
      ring.style.transform = 'translate('+rx+'px,'+ry+'px) translate(-50%,-50%)';
      requestAnimationFrame(raf);
    })();
    document.addEventListener('mouseover', function(e){
      var el = e.target.closest('[data-cursor]');
      ring.classList.remove('cur-grow','cur-target','cur-chat','cur-drag');
      if(el){
        var kind = el.getAttribute('data-cursor');
        ring.classList.add('cur-'+kind);
      }
    });
  } else {
    document.getElementById('cursor-dot').style.display='none';
    document.getElementById('cursor-ring').style.display='none';
  }

  /* =========================================================
     CLOCK + TICKER
  ========================================================= */
  function pad(n){ return n<10 ? '0'+n : ''+n; }
  function tickClock(){
    var d = new Date();
    document.getElementById('clock').textContent = pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
  }
  tickClock(); setInterval(tickClock, 1000);

  var tickerFacts = [
    'Host cities: 16 across USA · Mexico · Canada',
    'Gate C flow improved <b>18%</b> after AI reroute',
    'Concierge answered fans in <b>5</b> languages this hour',
    '2,140 fans chose transit over driving today',
    'Avg. queue time down to <b>4.2 min</b> at north gates',
    'Volunteer response time: <b>92 seconds</b> average'
  ];
  var trackEl = document.getElementById('ticker-track');
  var tHtml = tickerFacts.map(function(f){ return '<span>'+f+'</span>'; }).join('');
  trackEl.innerHTML = tHtml + tHtml;

  /* =========================================================
     VIEW TOGGLE (persisted)
  ========================================================= */
  var viewFan = document.getElementById('view-fan');
  var viewOps = document.getElementById('view-ops');
  var tabFan = document.getElementById('tab-fan');
  var tabOps = document.getElementById('tab-ops');
  function setView(v){
    if(v==='ops'){
      viewFan.classList.add('hidden'); viewOps.classList.remove('hidden');
      tabOps.classList.add('active'); tabFan.classList.remove('active');
    } else {
      viewOps.classList.add('hidden'); viewFan.classList.remove('hidden');
      tabFan.classList.add('active'); tabOps.classList.remove('active');
    }
    storeSet('pulse:view', v);
  }
  tabFan.addEventListener('click', function(){ setView('fan'); });
  tabOps.addEventListener('click', function(){ setView('ops'); });
  document.getElementById('cta-ops').addEventListener('click', function(){ setView('ops'); window.scrollTo({top:0,behavior:'smooth'}); });

  var langSelect = document.getElementById('lang-select');
  langSelect.addEventListener('change', function(){ storeSet('pulse:lang', langSelect.value); });

  (async function restorePrefs(){
    var v = await storeGet('pulse:view');
    if(v) setView(v);
    var l = await storeGet('pulse:lang');
    if(l) langSelect.value = l;
  })();

  /* =========================================================
     ICONS
  ========================================================= */
  function icon(path, extra){
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>';
  }
  var ICONS = {
    nav: '<path d="M3 11l19-9-9 19-2-8-8-2z"></path>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
    access: '<circle cx="12" cy="4" r="2"></circle><path d="M19 13v-2a3 3 0 0 0-3-3h-2l-3-3-3 3H6a3 3 0 0 0-3 3v2"></path><path d="M9 13l-2 8"></path><path d="M15 13l2 8"></path><path d="M9 13h6"></path>',
    bus: '<rect x="3" y="6" width="18" height="12" rx="2"></rect><path d="M3 12h18"></path><circle cx="7.5" cy="18.5" r="1.5"></circle><circle cx="16.5" cy="18.5" r="1.5"></circle>',
    leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-6 7-11 15-11 0 8-5 15-11 15-1.5 0-2-.5-3-1z"></path>',
    globe: '<circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"></path>',
    check: '<path d="M4 12l5 5 11-11"></path>'
  };

  /* =========================================================
     PILLAR CARDS
  ========================================================= */
  var pillarData = [
    {icon:ICONS.nav, title:'Live Navigation', body:'AI-guided routes to your gate, seat, and back out again, updated as crowds shift in real time.'},
    {icon:ICONS.users, title:'Crowd Intelligence', body:'Predictive density mapping flags a surge before it becomes a queue anyone complains about.'},
    {icon:ICONS.access, title:'Accessibility First', body:'Step-free routes, sensory-friendly zones, and companion care — one tap from the concierge.'},
    {icon:ICONS.bus, title:'Transit & Parking', body:'Live shuttle ETAs plus an AI advisor that reads today\'s traffic and weather for you.'},
    {icon:ICONS.leaf, title:'Sustainability', body:'Track your footprint match by match and get personalized, specific ways to lower it.'},
    {icon:ICONS.globe, title:'Multilingual Concierge', body:'Ask anything in your language. The answer arrives in the same one — no phrasebook.'}
  ];
  var pillarsEl = document.getElementById('pillars');
  pillarsEl.innerHTML = pillarData.map(function(p){
    return '<div class="pcard" data-cursor="grow"><div class="picon">'+icon(p.icon)+'</div><h3>'+p.title+'</h3><p>'+p.body+'</p></div>';
  }).join('');
  // subtle 3D tilt on pillar cards
  if(POINTER_FINE && !REDUCE_MOTION){
    Array.prototype.forEach.call(pillarsEl.children, function(card){
      card.addEventListener('mousemove', function(e){
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left)/r.width - 0.5;
        var py = (e.clientY - r.top)/r.height - 0.5;
        card.style.transform = 'perspective(600px) rotateX('+(py*-6)+'deg) rotateY('+(px*8)+'deg) translateY(-2px)';
      });
      card.addEventListener('mouseleave', function(){ card.style.transform = ''; });
    });
  }

  var accessListEl = document.getElementById('access-list');
  var accessItems = [
    'Step-free routes marked live at Gates B, D, F and H',
    'Sensory-friendly quiet room — Concourse 200, near Section 214',
    'Accessible seating hosts stationed at every accessible entrance',
    'Live captioning available in-app during broadcast moments'
  ];
  accessListEl.innerHTML = accessItems.map(function(t){
    return '<li>'+icon(ICONS.check)+'<span>'+t+'</span></li>';
  }).join('');

  /* =========================================================
     CROWD DENSITY SIMULATION ENGINE (drives map, hero, KPIs)
  ========================================================= */
  var GATES = ['A','B','C','D','E','F','G','H'];
  var density = {};
  GATES.forEach(function(g){ density[g] = 25 + Math.random()*35; });

  function densityColor(v){
    if(v>80) return getComputedStyle(document.documentElement).getPropertyValue('--ember').trim();
    if(v>50) return getComputedStyle(document.documentElement).getPropertyValue('--gold').trim();
    return getComputedStyle(document.documentElement).getPropertyValue('--turf').trim();
  }

  function renderGateList(containerId, withButton){
    var el = document.getElementById(containerId);
    if(!el) return;
    el.innerHTML = GATES.map(function(g){
      var v = Math.round(density[g]);
      var color = densityColor(v);
      var btn = withButton ? '<button class="gate-btn" data-cursor="target" data-gate="'+g+'" data-action="'+(withButton==='route'?'route':'fill')+'">'+(withButton==='route'?'AI route':'Brief console')+'</button>' : '';
      return '<div class="gate-wrap">'+
        '<div class="gate-row"><div class="gate-label mono">Gate '+g+'</div>'+
        '<div class="gate-track"><div class="gate-fill" style="width:'+v+'%; background:'+color+';"></div></div>'+
        '<div class="gate-pct mono">'+v+'%</div>'+btn+'</div>'+
        (withButton==='route' ? '<div class="gate-answer" id="gate-ans-'+g+'"></div>' : '') +
        '</div>';
    }).join('');
  }
  renderGateList('fan-gate-list','route');
  renderGateList('ops-gate-list','fill');

  document.getElementById('fan-gate-list').addEventListener('click', function(e){
    var btn = e.target.closest('.gate-btn'); if(!btn) return;
    var g = btn.getAttribute('data-gate');
    askGateRoute(g, btn);
  });
  document.getElementById('ops-gate-list').addEventListener('click', function(e){
    var btn = e.target.closest('.gate-btn'); if(!btn) return;
    var g = btn.getAttribute('data-gate');
    var v = Math.round(density[g]);
    document.getElementById('console-text').value = 'Gate '+g+' is running at '+v+'% of comfortable capacity based on live sensors.';
    setView('ops');
  });

  /* KPI + widgets state */
  var kpiEl = document.getElementById('kpi-row');
  var kpiData = [
    {id:'kpi-att', label:'Turnstile Scans', value: 58214, delta:'+ live'},
    {id:'kpi-queue', label:'Avg Queue (min)', value: 4.8, delta:''},
    {id:'kpi-alerts', label:'Active Alerts', value: 0, delta:''},
    {id:'kpi-vol', label:'Volunteers On Duty', value: 342, delta:''}
  ];
  kpiEl.innerHTML = kpiData.map(function(k){
    return '<div class="kpi"><div class="klabel">'+k.label+'</div><div class="flip-num mono" id="'+k.id+'"></div><div class="kdelta">'+k.delta+'</div></div>';
  }).join('');
  kpiData.forEach(function(k){ flipRender(document.getElementById(k.id), String(k.value)); });

  var ecoCount = 0;
  var alerts = [];
  var alertFeedEl = document.getElementById('alert-feed');

  function fmtTime(){
    var d = new Date();
    return pad(d.getHours())+':'+pad(d.getMinutes());
  }
  function pushAlert(text, sev){
    alerts.unshift({text:text, sev:sev, time:fmtTime()});
    if(alerts.length>8) alerts.pop();
    renderAlerts();
  }
  function renderAlerts(){
    alertFeedEl.innerHTML = alerts.map(function(a){
      return '<div class="alert-item" data-cursor="target" data-text="'+a.text.replace(/"/g,'&quot;')+'"><span class="sev-dot sev-'+a.sev+'"></span><div><div>'+a.text+'</div><span class="atime">'+a.time+'</span></div></div>';
    }).join('') || '<div style="color:var(--text-faint); font-size:12.5px;">All quiet. Live events will appear here.</div>';
    flipUpdate(document.getElementById('kpi-alerts'), String(alerts.length));
  }
  alertFeedEl.addEventListener('click', function(e){
    var item = e.target.closest('.alert-item'); if(!item) return;
    document.getElementById('console-text').value = item.getAttribute('data-text');
  });

  var possibleEvents = [
    {text:'Medical assist requested — Section 114', sev:'high'},
    {text:'Lost child reported near Gate C — reunited', sev:'low'},
    {text:'Heat index rising — hydration stations advised', sev:'med'},
    {text:'Volunteer shortage — Concourse 200 level', sev:'med'},
    {text:'Ticket scanner offline briefly at Gate F', sev:'low'},
    {text:'Pitch-side weather delay possibility flagged', sev:'med'}
  ];

  function simTick(){
    GATES.forEach(function(g){
      var drift = (Math.random()-0.46)*16;
      density[g] = Math.min(97, Math.max(6, density[g]+drift));
    });
    if(Math.random()<0.16){
      var g = GATES[Math.floor(Math.random()*GATES.length)];
      density[g] = Math.min(97, density[g]+28);
    }
    renderGateList('fan-gate-list','route');
    renderGateList('ops-gate-list','fill');
    updateCrowdColors();

    // KPI updates
    kpiData[0].value += Math.round(20+Math.random()*70);
    flipUpdate(document.getElementById('kpi-att'), String(kpiData[0].value));
    var avgDensity = GATES.reduce(function(s,g){return s+density[g];},0)/GATES.length;
    var q = (avgDensity/100*11+1).toFixed(1);
    flipUpdate(document.getElementById('kpi-queue'), q);
    var volCount = Math.max(300, Math.min(360, 342 + Math.round((Math.random()-0.5)*10)));
    flipUpdate(document.getElementById('kpi-vol'), String(volCount));

    // alerts from surges
    GATES.forEach(function(g){
      if(density[g]>88 && Math.random()<0.5){
        pushAlert('Queue surge at Gate '+g+' — '+Math.round(density[g])+'% capacity', 'high');
      }
    });
    if(Math.random()<0.22){
      var ev = possibleEvents[Math.floor(Math.random()*possibleEvents.length)];
      pushAlert(ev.text, ev.sev);
    }

    // eco counter
    ecoCount += Math.round(Math.random()*6+1);
    flipRenderIfNeeded('eco-num', String(ecoCount));

    // transit ETAs
    ['eta-1','eta-2','eta-3'].forEach(function(id){
      var el = document.getElementById(id);
      var m = Math.max(1, Math.round(Math.random()*10));
      el.textContent = m+' min';
    });
  }
  function flipRenderIfNeeded(id, val){
    var el = document.getElementById(id);
    if(el.children.length===0) flipRender(el, val); else flipUpdate(el, val);
  }
  renderAlerts();
  pushAlert('Gates opened — welcome to match day', 'low');
  setInterval(simTick, 3600);

  /* =========================================================
     THREE.JS HERO — live 3D crowd/gate visualization
  ========================================================= */
  var crowdPointsMesh, crowdColorsAttr, crowdGateIdx;
  function initStadium(){
    if(typeof THREE === 'undefined') return;
    var canvas = document.getElementById('stadium-canvas');
    var stage = canvas.parentElement;
    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060910, 0.05);
    var camera = new THREE.PerspectiveCamera(45, stage.clientWidth/stage.clientHeight, 0.1, 100);
    camera.position.set(0, 4.6, 10.5);
    camera.lookAt(0,0.4,0);
    var renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true, alpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));

    function resize(){
      var w = stage.clientWidth, h = stage.clientHeight;
      renderer.setSize(w,h,false);
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    // lights
    scene.add(new THREE.HemisphereLight(0x88a2ff, 0x0a0e1a, 0.65));
    var pl1 = new THREE.PointLight(0xff6a3d, 1.1, 20); pl1.position.set(-5,3,4); scene.add(pl1);
    var pl2 = new THREE.PointLight(0x22c55e, 1.1, 20); pl2.position.set(5,3,-4); scene.add(pl2);

    // pitch (canvas texture)
    var pc = document.createElement('canvas'); pc.width=512; pc.height=340;
    var pctx = pc.getContext('2d');
    pctx.fillStyle = '#0d3b22'; pctx.fillRect(0,0,512,340);
    for(var i=0;i<8;i++){ pctx.fillStyle = i%2 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)'; pctx.fillRect(i*64,0,64,340); }
    pctx.strokeStyle='rgba(255,255,255,0.5)'; pctx.lineWidth=2;
    pctx.strokeRect(20,20,472,300);
    pctx.beginPath(); pctx.moveTo(256,20); pctx.lineTo(256,320); pctx.stroke();
    pctx.beginPath(); pctx.arc(256,170,44,0,Math.PI*2); pctx.stroke();
    var pitchTex = new THREE.CanvasTexture(pc);
    var pitch = new THREE.Mesh(
      new THREE.CircleGeometry(4.3, 64),
      new THREE.MeshStandardMaterial({map:pitchTex, roughness:0.92, metalness:0})
    );
    pitch.rotation.x = -Math.PI/2;
    scene.add(pitch);

    // bowl rim
    var bowl = new THREE.Mesh(
      new THREE.TorusGeometry(5.9, 0.045, 8, 96),
      new THREE.MeshBasicMaterial({color:0x22c55e, transparent:true, opacity:0.5})
    );
    bowl.rotation.x = Math.PI/2;
    scene.add(bowl);
    var bowl2 = new THREE.Mesh(
      new THREE.TorusGeometry(5.9, 0.02, 8, 96),
      new THREE.MeshBasicMaterial({color:0xffd166, transparent:true, opacity:0.35})
    );
    bowl2.rotation.x = Math.PI/2; bowl2.position.y = 1.1;
    scene.add(bowl2);

    // crowd points: tiers around bowl, colored by live gate density
    var group = new THREE.Group();
    scene.add(group);
    var tiers = 3, perGateTier = 14;
    var count = GATES.length * perGateTier * tiers;
    var positions = new Float32Array(count*3);
    var colors = new Float32Array(count*3);
    var gateIdx = new Array(count);
    var idx = 0;
    for(var t=0;t<tiers;t++){
      var radius = 6.15 + t*0.5;
      var height = 0.35 + t*0.55;
      for(var gi=0; gi<GATES.length; gi++){
        var baseAngle = (gi/GATES.length)*Math.PI*2;
        for(var k=0;k<perGateTier;k++){
          var spread = (k/perGateTier - 0.5) * (Math.PI*2/GATES.length) * 0.85;
          var a = baseAngle + spread;
          positions[idx*3] = Math.cos(a)*radius;
          positions[idx*3+1] = height + Math.random()*0.15;
          positions[idx*3+2] = Math.sin(a)*radius;
          colors[idx*3]=0.13; colors[idx*3+1]=0.77; colors[idx*3+2]=0.37;
          gateIdx[idx] = gi;
          idx++;
        }
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors,3));
    var mat = new THREE.PointsMaterial({size:0.09, vertexColors:true, transparent:true, opacity:0.92, sizeAttenuation:true});
    var pts = new THREE.Points(geo, mat);
    group.add(pts);
    crowdPointsMesh = pts; crowdColorsAttr = geo.getAttribute('color'); crowdGateIdx = gateIdx;

    var mouseX=0, mouseY=0;
    stage.addEventListener('mousemove', function(e){
      var r = stage.getBoundingClientRect();
      mouseX = ((e.clientX-r.left)/r.width)*2-1;
      mouseY = ((e.clientY-r.top)/r.height)*2-1;
    });

    var camX=0, camY=4.6;
    function animate(){
      requestAnimationFrame(animate);
      if(!REDUCE_MOTION){
        group.rotation.y += 0.0016;
        camX += (mouseX*2.2 - camX)*0.03;
        camY += (4.6 - mouseY*0.8 - camY)*0.03;
        camera.position.x = camX;
        camera.position.y = camY;
        camera.lookAt(0,0.4,0);
      }
      renderer.render(scene, camera);
    }
    animate();
  }
  function updateCrowdColors(){
    if(!crowdPointsMesh || !crowdColorsAttr) return;
    var c = new THREE.Color();
    for(var i=0;i<crowdGateIdx.length;i++){
      var g = GATES[crowdGateIdx[i]];
      var v = density[g];
      var hex = v>80 ? 0xff6a3d : (v>50 ? 0xffd166 : 0x22c55e);
      c.setHex(hex);
      crowdColorsAttr.setXYZ(i, c.r, c.g, c.b);
    }
    crowdColorsAttr.needsUpdate = true;
  }
  try{ initStadium(); }catch(e){ console.warn('Stadium visual unavailable:', e); }

  /* =========================================================
     VOLUNTEER ROSTER (static illustrative data)
  ========================================================= */
  var volunteers = [
    {name:'Concourse 100 Team', zone:'Gates A–B', status:'ok'},
    {name:'Concourse 200 Team', zone:'Gates C–D', status:'busy'},
    {name:'Medical Response', zone:'All zones', status:'ok'},
    {name:'Accessibility Support', zone:'Gates B, D, F, H', status:'ok'},
    {name:'Transit Liaison', zone:'North lot', status:'low'}
  ];
  document.getElementById('vol-list').innerHTML = volunteers.map(function(v){
    return '<div class="vol-row"><div>'+v.name+'</div><div class="mono" style="color:var(--text-dim); font-size:12px;">'+v.zone+'</div><div class="badge '+v.status+'">'+(v.status==='ok'?'Staffed':v.status==='busy'?'Stretched':'Short')+'</div></div>';
  }).join('');

  /* =========================================================
     CLAUDE API HELPER  (real, live GenAI calls)
  ========================================================= */
  async function callClaude(systemPrompt, messages){
    // This calls OUR OWN backend (server.js locally, or api/claude.js on Vercel),
    // which holds the real Anthropic API key server-side and forwards the request.
    // See README.md for setup — the UI still works without this running, the
    // AI-powered buttons will just show a friendly "unavailable" message.
    var res = await fetch('/api/claude', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        max_tokens:1000,
        system: systemPrompt,
        messages: messages
      })
    });
    var data = await res.json();
    if(!res.ok) throw new Error((data && data.error) || ('API error '+res.status));
    var text = (data.content||[]).filter(function(b){return b.type==='text';}).map(function(b){return b.text;}).join('\n').trim();
    return text || '(no response)';
  }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  /* ---- gate route AI (fan view) ---- */
  async function askGateRoute(g, btn){
    var ansEl = document.getElementById('gate-ans-'+g);
    var original = btn.textContent;
    btn.textContent = '…'; btn.disabled = true;
    ansEl.classList.add('show');
    ansEl.textContent = 'Thinking…';
    try{
      var v = Math.round(density[g]);
      var sys = 'You are PULSE, a live stadium navigation assistant for a FIFA World Cup 2026 match. Be concise (max 2 short sentences), warm, and concrete. You are given live simulated gate capacity data — treat it as real-time fact.';
      var user = 'A fan is heading toward Gate '+g+', currently at '+v+'% of comfortable capacity (simulated live sensor). Recommend whether to proceed or consider a nearby gate, and add one brief accessibility note if relevant.';
      var text = await callClaude(sys, [{role:'user', content:user}]);
      ansEl.textContent = text;
    }catch(e){
      ansEl.textContent = 'Live recommendation unavailable right now — please try again in a moment.';
    }finally{
      btn.textContent = original; btn.disabled = false;
    }
  }

  /* ---- eco tip AI ---- */
  document.getElementById('eco-btn').addEventListener('click', async function(){
    var btn = this, ans = document.getElementById('eco-answer');
    var modes = ['public transit', 'the Fan Zone Loop shuttle', 'carpooling with three friends', 'a rented e-bike'];
    var mode = modes[Math.floor(Math.random()*modes.length)];
    btn.disabled = true; btn.textContent = 'Thinking…';
    ans.classList.add('show'); ans.textContent = 'Generating your tip…';
    try{
      var sys = 'You are a friendly sustainability guide for FIFA World Cup 2026 fans. Reply in one short, specific, upbeat sentence (max 30 words), no preamble.';
      var user = 'This fan travelled today via '+mode+'. Give one specific, creative eco tip for the rest of their matchday.';
      ans.textContent = await callClaude(sys, [{role:'user', content:user}]);
    }catch(e){ ans.textContent = 'Tip generator is unavailable right now — please try again shortly.'; }
    finally{ btn.disabled=false; btn.textContent='Get my personal eco tip'; }
  });

  /* ---- transit advisor AI ---- */
  document.getElementById('transit-btn').addEventListener('click', async function(){
    var btn = this, ans = document.getElementById('transit-answer');
    var conditions = [
      'heavy congestion on the north access road, light rail running on schedule',
      'light traffic citywide, one shuttle bay temporarily closed for cleaning',
      'moderate rain expected at final whistle, rideshare surge pricing likely'
    ];
    var cond = conditions[Math.floor(Math.random()*conditions.length)];
    btn.disabled = true; btn.textContent='Thinking…';
    ans.classList.add('show'); ans.textContent = 'Checking conditions…';
    try{
      var sys = 'You are a transit advisor for FIFA World Cup 2026 fans. Reply in max 2 short sentences, concrete and specific, no preamble.';
      var user = 'Current simulated conditions: '+cond+'. Recommend the best way for a fan to get home after the match.';
      ans.textContent = await callClaude(sys, [{role:'user', content:user}]);
    }catch(e){ ans.textContent = 'Transit advisor is unavailable right now — please try again shortly.'; }
    finally{ btn.disabled=false; btn.textContent='Ask AI transit advisor'; }
  });

  /* =========================================================
     CONCIERGE CHAT (real multi-turn Claude conversation)
  ========================================================= */
  var ccPanel = document.getElementById('concierge-panel');
  var ccBody = document.getElementById('cc-body');
  var ccInput = document.getElementById('cc-input');
  var chatHistory = []; // {role, content}
  var langsSeen = 1;

  function ccRenderMsg(role, text, isErr){
    var div = document.createElement('div');
    div.className = 'cc-msg '+(role==='user'?'user':'bot')+(isErr?' err':'');
    div.textContent = text;
    ccBody.appendChild(div);
    ccBody.scrollTop = ccBody.scrollHeight;
  }
  function ccTypingShow(){
    var div = document.createElement('div');
    div.className = 'cc-typing'; div.id = 'cc-typing-el';
    div.innerHTML = '<span></span><span></span><span></span>';
    ccBody.appendChild(div);
    ccBody.scrollTop = ccBody.scrollHeight;
  }
  function ccTypingHide(){ var el = document.getElementById('cc-typing-el'); if(el) el.remove(); }

  var suggestions = [
    'How do I get to Section 118 avoiding crowds?',
    '¿Cuál es la salida más rápida ahora?',
    'Where is the nearest accessible restroom?',
    'What\'s the most sustainable way to get home?'
  ];
  document.getElementById('cc-suggest').innerHTML = suggestions.map(function(s){
    return '<button data-q="'+escapeHtml(s)+'">'+s+'</button>';
  }).join('');
  document.getElementById('cc-suggest').addEventListener('click', function(e){
    var b = e.target.closest('button'); if(!b) return;
    ccInput.value = b.getAttribute('data-q');
    ccSend();
  });

  async function ccSend(){
    var text = ccInput.value.trim();
    if(!text) return;
    ccInput.value = '';
    ccRenderMsg('user', text);
    chatHistory.push({role:'user', content:text});
    storeSet('pulse:chat', JSON.stringify(chatHistory.slice(-20)));
    ccTypingShow();
    try{
      var densitySnapshot = GATES.map(function(g){ return g+':'+Math.round(density[g])+'%'; }).join(', ');
      var sys = 'You are PULSE Concierge, a warm, concise multilingual assistant at a FIFA World Cup 2026 host stadium. ALWAYS reply in the same language the fan just wrote in. Keep replies under 70 words. Cover navigation, accessibility, transportation, and sustainability naturally when relevant. You may reference this live simulated gate capacity snapshot as if it were the real-time feed: '+densitySnapshot+'. Never invent specific real-world facts about actual FIFA policy, ticketing, or security beyond general best practice.';
      var msgsForApi = chatHistory.slice(-8);
      var reply = await callClaude(sys, msgsForApi);
      ccTypingHide();
      ccRenderMsg('bot', reply);
      chatHistory.push({role:'assistant', content:reply});
      storeSet('pulse:chat', JSON.stringify(chatHistory.slice(-20)));
      langsSeen = Math.min(6, langsSeen+ (Math.random()<0.3?1:0));
      flipRenderIfNeeded('lang-num', String(langsSeen));
    }catch(e){
      ccTypingHide();
      ccRenderMsg('bot', 'The concierge link is unavailable right now — please try again in a moment.', true);
    }
  }
  document.getElementById('cc-send').addEventListener('click', ccSend);
  ccInput.addEventListener('keydown', function(e){ if(e.key==='Enter') ccSend(); });

  function ccOpen(prefill){
    ccPanel.classList.add('open');
    if(prefill){ ccInput.value = prefill; }
    if(chatHistory.length===0){
      ccRenderMsg('bot', 'Hi! I\'m PULSE Concierge. Ask me anything about gates, seats, accessibility, transit, or sustainability — in any language.');
    }
  }
  document.getElementById('concierge-fab').addEventListener('click', function(){
    if(ccPanel.classList.contains('open')) ccPanel.classList.remove('open');
    else ccOpen();
  });
  document.getElementById('cc-close').addEventListener('click', function(){ ccPanel.classList.remove('open'); });
  document.getElementById('cta-concierge').addEventListener('click', function(){ ccOpen(); });
  document.getElementById('lang-demo-btn').addEventListener('click', function(){ ccOpen('¿Cuál es la salida más rápida ahora mismo?'); });
  document.getElementById('access-ask').addEventListener('click', function(){ ccOpen('What accessible routes do you recommend for my seat, and where is the nearest quiet room?'); });

  (async function restoreChat(){
    var raw = await storeGet('pulse:chat');
    if(raw){
      try{
        var hist = JSON.parse(raw);
        if(Array.isArray(hist)) chatHistory = hist;
      }catch(e){}
    }
  })();

  /* =========================================================
     OPS DECISION CONSOLE
  ========================================================= */
  var lastPlan = '';
  document.getElementById('console-submit').addEventListener('click', async function(){
    var btn = this;
    var text = document.getElementById('console-text').value.trim();
    var planCard = document.getElementById('plan-card');
    var announceBtn = document.getElementById('console-announce');
    if(!text){ document.getElementById('console-text').focus(); return; }
    btn.disabled = true; var orig = btn.textContent; btn.textContent = 'Analyzing…';
    planCard.classList.add('show');
    planCard.innerHTML = '<span class="pc-tag">Analyzing</span>Reading live gate signals and drafting a plan…';
    try{
      var densitySnapshot = GATES.map(function(g){ return 'Gate '+g+': '+Math.round(density[g])+'%'; }).join(' · ');
      var sys = 'You are an operations AI advisor embedded in a FIFA World Cup 2026 stadium command center. Given a live situation report and gate capacity snapshot, respond in this exact structure with no preamble:\nIMMEDIATE ACTION: one sentence.\nREALLOCATE: 1-2 short bullet-style lines starting with "-".\nNOTIFY: who to alert, one short line.\nKeep the entire reply under 90 words.';
      var user = 'Situation: '+text+'\nLive gate snapshot: '+densitySnapshot;
      var plan = await callClaude(sys, [{role:'user', content:user}]);
      lastPlan = plan;
      planCard.innerHTML = '<span class="pc-tag">AI Recommendation</span>'+escapeHtml(plan);
      announceBtn.disabled = false;
    }catch(e){
      planCard.innerHTML = '<span class="pc-tag">Unavailable</span>The decision console couldn\'t reach the model just now — please try again.';
    }finally{
      btn.disabled = false; btn.textContent = orig;
    }
  });

  document.getElementById('console-announce').addEventListener('click', async function(){
    var btn = this;
    var announceCard = document.getElementById('announce-card');
    if(!lastPlan) return;
    btn.disabled = true; var orig = btn.textContent; btn.textContent = 'Drafting…';
    announceCard.classList.add('show');
    announceCard.innerHTML = '<div style="color:var(--text-faint); font-size:12.5px;">Drafting multilingual announcement…</div>';
    try{
      var sys = 'Turn an internal operations action plan into a short, calm public-address announcement for fans (max 35 words). Provide it in English, Spanish, and French. Respond in exactly this format with no extra text:\nEN: ...\nES: ...\nFR: ...';
      var user = 'Action plan:\n'+lastPlan;
      var out = await callClaude(sys, [{role:'user', content:user}]);
      var lines = out.split('\n').filter(function(l){return l.trim();});
      announceCard.innerHTML = lines.map(function(l){
        var m = l.match(/^([A-Z]{2}):\s*(.*)$/);
        if(m){
          var langName = {EN:'English', ES:'Español', FR:'Français'}[m[1]] || m[1];
          return '<div class="announce-lang"><b>'+langName+'</b>'+escapeHtml(m[2])+'</div>';
        }
        return '<div class="announce-lang">'+escapeHtml(l)+'</div>';
      }).join('');
    }catch(e){
      announceCard.innerHTML = '<div class="announce-lang" style="border-color:var(--ember); color:var(--ember);">Announcement drafting is unavailable right now.</div>';
    }finally{
      btn.disabled=false; btn.textContent=orig;
    }
  });

})();
