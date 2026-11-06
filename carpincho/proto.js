(function(){
  var P = {
    orca:{n:'ORCA', d:{lobby:'Main', slots:'Orca-slots', juego:'Orca-juego', billetera:'Orca-billetera', extra:'Orca-vip'}, x:'Club VIP'},
    falco:{n:'FALCO', d:{lobby:'Falco', slots:'Falco-slots', juego:'Falco-juego', billetera:'Falco-billetera', extra:'Falco-jackpots'}, x:'Jackpots'},
    zorro:{n:'ZORRO', d:{lobby:'Zorro', slots:'Zorro-slots', juego:'Zorro-juego', billetera:'Zorro-billetera', extra:'Zorro-misiones'}, x:'Misiones'},
    kraken:{n:'KRAKEN', d:{lobby:'Kraken', slots:'Kraken-slots', juego:'Kraken-juego', billetera:'Kraken-billetera', extra:'Kraken-tripulacion'}, x:'Tripulación'},
    bandido:{n:'BANDIDO', d:{lobby:'Bandido', slots:'Bandido-slots', juego:null, billetera:'Bandido-billetera', extra:'Bandido-cajas'}, x:'Cajas'},
    carpincho:{n:'CARPINCHO', d:{lobby:'Carpincho', slots:'Carpincho-slots', juego:'Carpincho-juego', billetera:'Carpincho-billetera', extra:'Carpincho-promos'}, x:'Promos'},
    mascara:{n:'MÁSCARA', d:{lobby:'Mascara', slots:'Mascara-slots', juego:'Mascara-juego', billetera:'Mascara-billetera', extra:'Mascara-promos'}, x:'Promos'}
  };
  var cur = window.PV || {}; var plat = P[cur.plat]; if(!plat) return;
  var view = cur.view || 'd';
  function file(screen, v){ var b = plat.d[screen]; if(!b) return null;
    if(v === 'm'){ if(screen === 'lobby'){ b = b === 'Main' ? 'Orca-movil' : b + '-movil'; } else b = b + '-movil'; }
    return b + '.html'; }
  function go(screen, v){ var f = file(screen, v || view); if(!f){ toast('Esta pantalla no está en el prototipo'); return; }
    document.documentElement.classList.add('pv-leave'); setTimeout(function(){ location.href = f; }, 160); }
  // ---- detección automática: celular -> versión celular, compu -> escritorio (salvo que elijas otra con la barra)
  var phone = window.matchMedia ? matchMedia('(max-width: 760px)').matches : innerWidth < 760;
  var forced = null; try { forced = sessionStorage.getItem('pv-v'); } catch(e){}
  var want = phone ? 'm' : (forced || 'd');
  if(want !== view){ var wf = file(cur.screen, want); if(wf){ location.replace(wf); return; } }
  document.documentElement.setAttribute('data-pv-view', view);
  if(phone) document.documentElement.classList.add('pv-phone');
  var ROOT = document.body.firstElementChild;
  var BASE_W = 390;
  // en el celular la pantalla ocupa todo el ancho y el centro se puede scrollear
  function scrollers(){ if(view !== 'm' || !ROOT) return;
    ROOT.querySelectorAll('*').forEach(function(el){ var cs = getComputedStyle(el);
      if(cs.overflowY === 'hidden' && parseFloat(cs.flexGrow) > 0 && el.offsetHeight > 300 && el.parentElement && getComputedStyle(el.parentElement).flexDirection === 'column'){ el.style.overflowY = 'auto'; el.style.overscrollBehavior = 'contain'; el.classList.add('pv-scroll'); Array.prototype.forEach.call(el.children, function(c){ c.style.flexShrink = '0'; }); } }); }
  function fit(){ if(!phone || view !== 'm' || !ROOT) return; var strip = document.querySelector('.pv-strip'); var sh = strip ? strip.offsetHeight : 0;
    var z = innerWidth / BASE_W; ROOT.style.zoom = z;
    ROOT.style.height = Math.max(560, (innerHeight - sh) / z) + 'px'; }

  // ---- barra del prototipo
  var bar = document.createElement('div'); bar.className = 'pv-bar';
  var screens = [['lobby','Inicio'],['slots','Slots'],['juego','Juego'],['billetera','Billetera'],['extra', plat.x]];
  var h = '<a class="pv-home" href="index.html" aria-label="Volver a las plataformas">&#8592;</a><b class="pv-name">' + plat.n + '</b><span class="pv-sep"></span>';
  screens.forEach(function(s){ if(!plat.d[s[0]]) return; h += '<button type="button" data-s="' + s[0] + '" class="' + (s[0] === cur.screen ? 'on' : '') + '">' + s[1] + '</button>'; });
  h += '<span class="pv-sep"></span><span class="pv-seg"><button type="button" data-v="d" class="' + (view === 'd' ? 'on' : '') + '">Escritorio</button><button type="button" data-v="m" class="' + (view === 'm' ? 'on' : '') + '">Celular</button></span>';
  if(phone){ bar = document.createElement('nav'); bar.className = 'pv-strip';
    var sel = '<select aria-label="Ir a otra pantalla">'; screens.forEach(function(s){ if(!plat.d[s[0]]) return; sel += '<option value="' + s[0] + '"' + (s[0] === cur.screen ? ' selected' : '') + '>' + s[1] + '</option>'; }); sel += '</select>';
    h = '<a href="index.html" aria-label="Volver">&#8592;</a><b>' + plat.n + '</b>' + sel; }
  bar.innerHTML = h;
  if(phone){ bar.querySelector('select').addEventListener('change', function(e){ go(e.target.value); }); }
  bar.addEventListener('click', function(e){ var b = e.target.closest('button'); if(!b) return; e.stopPropagation();
    if(b.dataset.s) go(b.dataset.s); else if(b.dataset.v && b.dataset.v !== view){ try { sessionStorage.setItem('pv-v', b.dataset.v); } catch(e){} go(cur.screen, b.dataset.v); } });
  if(phone) document.body.insertBefore(bar, ROOT); else document.body.appendChild(bar);
  scrollers(); fit(); addEventListener('resize', fit);
  var t = document.createElement('div'); t.className = 'pv-toast'; document.body.appendChild(t);
  var tt; function toast(m){ t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(function(){ t.classList.remove('on'); }, 1800); }

  // ---- navegación por clics dentro del diseño
  var K = [
    [/cargar|billetera|deposit|retirar|saldo/, 'billetera'],
    [/^(inicio|lobby|para vos|casino)$/, 'lobby'],
    [/vip|jackpot|misi[oó]n|tripulaci|caja|promo|recompensa|bono|bienvenida|cashback|club|premio|reclamar|invit/, 'extra'],
    [/jugar|probar|entrar|quiero|sumar|unirme|mirar|demo/, 'juego'],
    [/slot|explorar|ver todo|juegos|crash|en vivo|originales|mesas|cargar m[aá]s|ver tabla/, 'slots']
  ];
  function sig(el){ var c = getComputedStyle(el); return c.backgroundColor + '|' + c.color + '|' + c.boxShadow + '|' + c.fontWeight; }
  var VIS = /^(background|background-color|color|box-shadow|border|border-color|outline|font-weight|opacity)$/;
  function decl(el){ var o = {}; (el.getAttribute('style') || '').split(';').forEach(function(d){ var i = d.indexOf(':'); if(i > 0) o[d.slice(0, i).trim()] = d.slice(i + 1).trim(); }); return o; }
  function setDecl(el, o){ el.setAttribute('style', Object.keys(o).map(function(k){ return k + ': ' + o[k]; }).join('; ')); }
  // pestañas, filtros y montos: el elegido toma el estilo del activo
  function toggleGroup(el){ var p = el.parentElement; if(!p) return false;
    var sibs = Array.prototype.filter.call(p.children, function(s){ return s.tagName === el.tagName; }); if(sibs.length < 2 || sibs.length > 12) return false;
    var sg = sibs.map(sig), cnt = {}; sg.forEach(function(s){ cnt[s] = (cnt[s] || 0) + 1; });
    var act = null; if(sibs.length === 2){ if(sg[0] !== sg[1]) act = sibs[0] === el ? sibs[1] : sibs[0]; else return false; }
    else { var u = sibs.filter(function(s, i){ return cnt[sg[i]] === 1; }); if(u.length !== 1) return false; act = u[0]; }
    if(act === el) return true;
    var A = decl(act), B = decl(el), keys = {}; Object.keys(A).concat(Object.keys(B)).forEach(function(k){ if(A[k] !== B[k]) keys[k] = 1; });
    var ks = Object.keys(keys); if(ks.some(function(k){ return !VIS.test(k); })) return false;
    var cA = act.className, cB = el.className; if(!ks.length && cA === cB) return false;
    ks.forEach(function(k){ var t = A[k]; if(B[k] === undefined) delete A[k]; else A[k] = B[k]; if(t === undefined) delete B[k]; else B[k] = t; });
    setDecl(act, A); setDecl(el, B); act.className = cB; el.className = cA;
    // montos: actualiza el resto de la pantalla
    var oldAmt = (act.innerText || '').trim(), newAmt = (el.innerText || '').trim();
    if(/^\$\s?[\d.]+$/.test(oldAmt) && /^\$\s?[\d.]+$/.test(newAmt)){ var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n2, list = [];
      while((n2 = w.nextNode())) list.push(n2);
      list.forEach(function(t){ if(t.parentElement && t.parentElement.parentElement === p) return; if(t.nodeValue.indexOf(oldAmt) >= 0) t.nodeValue = t.nodeValue.split(oldAmt).join(newAmt); });
      document.querySelectorAll('input').forEach(function(i){ if(i.value && i.value.replace(/\D/g, '') === oldAmt.replace(/\D/g, '')) i.value = newAmt.replace(/[^\d.]/g, ''); }); }
    return true; }
  var DONE = [[/^cargar\s?\$/, function(t){ return 'Carga de ' + t.replace(/^cargar\s?/, '') + ' confirmada (demo)'; }], [/copiar/, 'Link copiado'], [/avisarme|avisame/, 'Listo, te avisamos cuando empiece'], [/reclamar/, '¡Premio reclamado!'], [/confirmar|pagar|generar|solicitar|retirar \$/, 'Listo, solicitud enviada (demo)'], [/favorit/, 'Agregado a favoritos'], [/abrir|girar|tirar/, '¡Suerte! (demo)']];
  function done(txt){ for(var i = 0; i < DONE.length; i++){ if(DONE[i][0].test(txt)){ toast(typeof DONE[i][1] === 'function' ? DONE[i][1](txt) : DONE[i][1]); return true; } } return false; }
  document.addEventListener('click', function(e){
    if(e.target.closest('.pv-bar,.pv-strip')) return;
    var el = e.target.closest('a,button,label');
    if(!el){ var sp = e.target.closest('span,div'); if(sp && sp.children.length === 0 && (sp.innerText || '').trim().length < 22 && toggleGroup(sp)) return; return; }
    if(el.tagName === 'LABEL' || el.querySelector('input')) return;
    e.preventDefault();
    if(el.dataset.alias){ try { navigator.clipboard && navigator.clipboard.writeText(el.dataset.alias); } catch(_){} el.classList.remove('pv-press'); void el.offsetWidth; el.classList.add('pv-press'); toast('Alias ' + el.dataset.alias + ' copiado'); return; }
    var txt = (el.innerText || el.getAttribute('aria-label') || '').trim().toLowerCase();
    var img = el.querySelector('img');
    var portrait = img && img.naturalHeight > img.naturalWidth * 1.15 && img.clientWidth > 50;
    var target = null;
    if(portrait) target = 'juego';
    else if(!txt && (img || el.querySelector('svg')) && el.getBoundingClientRect().top < 90 && el.getBoundingClientRect().left < 320) target = 'lobby';
    else if(txt === plat.n.toLowerCase() || txt.indexOf(plat.n.toLowerCase()) === 0 && txt.length < 14) target = 'lobby';
    else for(var i = 0; i < K.length; i++){ if(K[i][0].test(txt)){ target = K[i][1]; break; } }
    if(target === 'juego' && !plat.d.juego) target = 'slots';
    if(/^cargar\s?\$|copiar|avisarme|confirmar/.test(txt) || /reclamar/.test(txt) && cur.screen === 'extra') target = null;
    if(target && target !== cur.screen){ go(target); return; }
    el.classList.remove('pv-press'); void el.offsetWidth; el.classList.add('pv-press');
    if(toggleGroup(el)) return;
    done(txt);
  }, true);
  document.addEventListener('submit', function(e){ e.preventDefault(); });

  // ---- animaciones
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function onReady(){
    if(reduce) return;
    // entrada escalonada de secciones
    var root = document.querySelector('main') || document.body.firstElementChild;
    var blocks = [];
    if(view === 'm'){ var r = ROOT; if(r) blocks = Array.prototype.slice.call(r.querySelectorAll(':scope > *, :scope > div > *')).slice(0, 14); }
    else if(root){ blocks = Array.prototype.slice.call(root.children); }
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('pv-in'); io.unobserve(en.target); } }); }, {threshold: .08}) : null;
    blocks.forEach(function(b, i){ if(b.classList.contains('pv-bar')) return; b.style.setProperty('--pv-d', Math.min(i, 8) * 70 + 'ms'); b.classList.add('pv-rv');
      var top = b.getBoundingClientRect().top; if(top < innerHeight || !io) b.classList.add('pv-in'); else io.observe(b); });
    // barras de progreso
    document.querySelectorAll('[style*="width:"]').forEach(function(el){
      var m = /width:\s*(\d{1,3}(?:\.\d+)?)%/.exec(el.getAttribute('style')); if(!m) return;
      if(el.offsetHeight > 14 || el.offsetHeight < 2 || el.closest('.pv-bar')) return;
      var w = m[1] + '%'; el.style.width = '0%'; el.style.transition = 'width 1.1s cubic-bezier(.2,.7,.2,1)';
      setTimeout(function(){ el.style.width = w; }, 350); });
    // números grandes que cuentan
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); var nodes = [], n;
    while((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function(nd){
      var s = nd.nodeValue.trim(); var p = nd.parentElement; if(!p || p.closest('.pv-bar,header,nav,script,style')) return;
      var mm = /^(\$\s?)([\d.]{5,})$/.exec(s);
      if(mm && parseFloat(getComputedStyle(p).fontSize) >= 24){
        var end = parseInt(mm[2].replace(/\./g, ''), 10); var t0 = null; var start = Math.round(end * .6);
        var fmt = function(v){ return mm[1] + v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
        var step = function(ts){ if(!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 1300); k = 1 - Math.pow(1 - k, 3); nd.nodeValue = nd.nodeValue.replace(/\$\s?[\d.]+/, fmt(Math.round(start + (end - start) * k))); if(k < 1) requestAnimationFrame(step); else if(/jackpot|pozo|mega/i.test((p.closest('section,div')||p).innerText.slice(0, 400))){ setInterval(function(){ end += Math.round(Math.random() * 380 + 40); nd.nodeValue = nd.nodeValue.replace(/\$\s?[\d.]+/, fmt(end)); }, 1600); } };
        requestAnimationFrame(step); return; }
      // cuentas regresivas
      var cd = /(\d+)\s?(d|días|día)?\s?(\d{1,2}):(\d{2}):(\d{2})/.exec(s) || (/(en|termina|arranca|empieza|pr[oó]xim|renuevan|tormenta)/i.test(s) && /()()(\d{1,2}):(\d{2})()/.exec(s));
      if(cd && s.length < 40){
        var hasDays = cd[2] && cd[1]; var secs = (hasDays ? parseInt(cd[1], 10) * 86400 : 0) + parseInt(cd[3], 10) * (cd[5] ? 3600 : 60) + parseInt(cd[4], 10) * (cd[5] ? 60 : 1) + (cd[5] ? parseInt(cd[5], 10) : 0);
        var orig = cd[0]; var pad = function(x){ return (x < 10 ? '0' : '') + x; };
        setInterval(function(){ secs = Math.max(0, secs - 1); var d = Math.floor(secs / 86400), r = secs % 86400, hh = Math.floor(r / 3600), mi = Math.floor(r % 3600 / 60), ss = r % 60, out;
          if(cd[5]){ out = (hasDays ? d + (cd[2] === 'd' ? 'd ' : ' ' + cd[2] + ' ') : '') + pad(hh) + ':' + pad(mi) + ':' + pad(ss); } else { out = pad(Math.floor(secs / 60)) + ':' + pad(secs % 60); }
          nd.nodeValue = nd.nodeValue.replace(orig, out); orig = out; }, 1000);
      }
    });
  }
  if(document.readyState === 'complete') onReady(); else addEventListener('load', onReady);
})();
