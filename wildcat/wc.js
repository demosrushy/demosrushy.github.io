/* Wildcat · lobby. Mismas funciones que el Wildcat original (todo demo, sin pagos reales):
   sesión invitado/logueado, saldo y moneda, billetera Cargar/Retirar, código de regalo REGALO20,
   chat de soporte, ganadores en vivo, perfil (cuenta, movimientos, juego responsable) y Rangos Wildcat. */
(function(){
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function store(k, v){ try{ if(v === undefined) return localStorage.getItem(k); if(v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){ return null; } }
  function pad2(n){ return String(n).padStart(2, '0'); }
  function money(n){ return '$' + Math.round(n).toLocaleString('es-AR'); }
  function digits(s){ return parseInt(String(s).replace(/\D/g, ''), 10) || 0; }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  // ---------- Juegos ----------
  var ORIG = [['o-mines','Mines',59],['o-jet','Wild Jet',1577],['o-blackjack','Blackjack',16],['o-coinflip','Coinflip',26],
    ['o-plinko','Plinko',45],['o-dice','Dice',103],['o-towers','Towers',118],['o-ruleta','Ruleta',31]]
    .map(function(g){ return {img:g[0], name:g[1], pv:'Wildcat Games', on:g[2], own:1, cat:'originales'}; });
  var PROV = function(list, cat){ return list.map(function(g){ return {img:g[0], name:g[1], pv:g[2], on:g[3], cat:cat}; }); };
  var TODOS = PROV([['t-jokers-jewels','Joker\'s Jewels','Pragmatic Play',379],['t-le-prechaun','Le Prechaun','Hacksaw',55],
    ['t-jokers-dice','Joker\'s Jewels Dice','Pragmatic Play',68],['t-aviator','Aviator','Spribe',1320],
    ['t-gates-super','Gates of Olympus Super Scatter','Pragmatic Play',400],['t-balloon','Balloon','SmartSoft',214],
    ['t-sweet-1000','Sweet Bonanza 1000','Pragmatic Play',148],['t-jokers-wild','Joker\'s Jewels Wild','Pragmatic Play',63],
    ['t-chillies','3 Super Hot Chillies','3 Oaks',117]], 'slots');
  var POP = PROV([['p-sweet-2500','Sweet Bonanza 2500','Pragmatic Play',177],['p-gold-party','Gold Party','Pragmatic Play',102],
    ['p-sugar-rush','Sugar Rush 1000','Pragmatic Play',289],['p-fortune-rabbit','Fortune Rabbit','PG Soft',948],
    ['p-le-digger','Le Digger','Hacksaw',41],['p-mummyland','Mummyland Treasures','Belatra',161],
    ['p-gates-1000','Gates of Olympus 1000','Pragmatic Play',392],['p-5-lions','5 Lions Megaways','Pragmatic Play',70],
    ['p-buffalo','Buffalo King Megaways','Pragmatic Play',28]], 'slots');
  var LIVE = PROV([['c-ruleta-vivo','Ruleta en Vivo','Evolution',39],['c-spanish-roulette','Spanish Roulette','Pragmatic Play',48],
    ['c-blackjack-es','Blackjack en Español','Evolution',37],['c-blackjack','Blackjack','Evolution',31],
    ['c-roulette-live','Roulette Live','Evolution',40],['c-ice-fishing','Ice Fishing','Evolution',384],
    ['c-crazy-time','Crazy Time','Evolution',509],['c-relampago','Ruleta Relámpago','Evolution',31],
    ['c-roulette-pp','Roulette','Pragmatic Play',48]], 'vivo');
  var ALL = ORIG.concat(TODOS, POP, LIVE);
  var SLOTS = TODOS.concat(POP);
  function byName(n){ return ALL.filter(function(g){ return g.name === n; })[0]; }
  var RAPIDOS = ['Aviator','Wild Jet','Mines','Balloon','Plinko','Dice','Towers','Coinflip'].map(byName);
  var NUEVOS = ['Le Digger','Ice Fishing','Gates of Olympus Super Scatter','Sweet Bonanza 2500','Mummyland Treasures','Joker\'s Jewels Wild','Buffalo King Megaways','3 Super Hot Chillies'].map(byName);

  setInterval(function(){
    ALL.forEach(function(g){ g.on = Math.max(1, g.on + Math.round((Math.random() - .47) * Math.max(2, g.on * .03))); });
    $$('[data-on]').forEach(function(el){ var g = ALL[+el.getAttribute('data-on')]; if(g) el.textContent = g.on; });
  }, 4000);

  function card(g){
    var i = ALL.indexOf(g);
    return '<a class="game' + (g.own ? ' game--own' : '') + '" href="#" data-game="' + i + '" aria-label="' + esc(g.name) + '">' +
      '<div class="game__cv"><img src="a/g/' + g.img + '.webp" alt="" loading="lazy">' +
      (g.own ? '<span class="game__pv">' + g.pv + '</span><span class="game__tt">' + g.name + '</span>' : '') +
      '<span class="game__play"><span><i class="ph-fill ph-play"></i></span></span></div>' +
      '<span class="game__on"><i></i><b data-on="' + i + '">' + g.on + '</b> jugando</span></a>';
  }
  function row(id, icon, title, list, href){
    return '<section class="row">' +
      '<div class="row__head"><h3><a href="' + href + '"><span class="row__ic">' + icon + '</span>' + title + '<i class="ph-bold ph-caret-right"></i></a></h3>' +
      '<div class="row__nav"><button type="button" data-rail="' + id + '" data-dir="-1" aria-label="Anterior"><i class="ph-bold ph-caret-left"></i></button><button type="button" data-rail="' + id + '" data-dir="1" aria-label="Siguiente"><i class="ph-bold ph-caret-right"></i></button></div></div>' +
      '<div class="rail" id="rail-' + id + '">' + list.map(card).join('') + '</div></section>';
  }
  var IC = { orig:'<img src="a/mark.png" alt="">', grid:'<i class="ph-fill ph-squares-four"></i>', star:'<i class="ph-fill ph-sparkle"></i>', live:'<i class="ph-fill ph-spade"></i>', win:'<i class="ph-fill ph-trophy"></i>' };

  // ---------- Sesión demo ----------
  var SESSION_KEY = 'wc-session', DEMO_USER = 'usuario***07';
  function logged(){ return !!store(SESSION_KEY); }
  function applySession(){ document.documentElement.className = logged() ? 'is-logged' : 'is-guest'; }
  function login(msg){
    store(SESSION_KEY, JSON.stringify({user:DEMO_USER, since:Date.now()}));
    applySession(); renderBalance(); rankDaily(); bump('login', 1, true); renderRankHooks();
    closeModal(); toast(msg || '¡Hola de nuevo! Ya estás adentro');
    if(pendingAfterLogin){ var f = pendingAfterLogin; pendingAfterLogin = null; setTimeout(f, 250); }
    render();
  }
  function logout(){ store(SESSION_KEY, null); applySession(); closeMenus(); toast('Cerraste sesión'); location.hash = 'inicio'; render(); }
  var pendingAfterLogin = null;
  function requireLogin(after){ if(logged()) return true; pendingAfterLogin = after || null; openModal('login'); return false; }

  // ---------- Saldo y moneda ----------
  var BAL_KEY = 'wildcat:balance', MOVES_KEY = 'wildcat:moves', CUR_KEY = 'wildcat:currency';
  var CURS = [['ARS','Peso argentino','🇦🇷'],['USD','Dólar','🇺🇸'],['USDT','Tether','₮']];
  function getBalance(){ var v = parseInt(store(BAL_KEY), 10); return isNaN(v) ? 35000 : v; }
  function cur(){ return store(CUR_KEY) || 'ARS'; }
  function setBalance(v){ store(BAL_KEY, String(Math.max(0, Math.round(v)))); renderBalance(true); }
  function renderBalance(bump){
    $$('[data-balance]').forEach(function(el){ el.textContent = money(getBalance()); if(bump){ el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); } });
    $$('[data-balance-text]').forEach(function(el){ el.textContent = money(getBalance()) + ' ' + cur(); });
    $$('[data-cur]').forEach(function(el){ el.textContent = cur(); });
  }
  function getMoves(){ try{ return JSON.parse(store(MOVES_KEY)) || []; }catch(e){ return []; } }
  function addMove(m){ var l = getMoves(); m.ts = Date.now(); l.unshift(m); store(MOVES_KEY, JSON.stringify(l.slice(0, 40))); }
  function curMenu(){
    return CURS.map(function(c){ return '<button type="button" data-cur-pick="' + c[0] + '"' + (c[0] === cur() ? ' class="is-on"' : '') + '><span class="flag">' + c[2] + '</span><b>' + c[0] + '</b><small>' + c[1] + '</small></button>'; }).join('');
  }

  // ---------- Código de regalo ----------
  var PROMO_CODE = 'REGALO20', PROMO_KEY = 'wildcat:promo';
  function promoApplied(){ return store(PROMO_KEY) === PROMO_CODE; }

  // ---------- Rangos Wildcat ----------
  var RANK_KEY = 'wildcat:rango';
  var RANKS = [
    {id:'bronce', name:'Bronce', min:0, perks:['Cashback semanal del 2%','Retiros en 24 h','Soporte 24/7']},
    {id:'plata', name:'Plata', min:2500, perks:['Cashback semanal del 5%','Bono semanal de $2.000','Retiros en 12 h','Regalo de cumpleaños $5.000']},
    {id:'oro', name:'Oro', min:10000, perks:['Cashback semanal del 8%','Bono semanal de $5.000','Retiros prioritarios','Regalo de cumpleaños $10.000']},
    {id:'platino', name:'Platino', min:25000, perks:['Cashback semanal del 10%','Bono semanal de $10.000','Retiros en 2 h','Cajero VIP']},
    {id:'diamante', name:'Diamante', min:60000, perks:['Cashback semanal del 12%','Bono semanal de $25.000','Retiros en menos de 1 h','Cajero VIP 24/7']},
    {id:'wildcat', name:'Wildcat', min:150000, perks:['Cashback semanal del 15%','Bono semanal de $50.000','Retiros instantáneos','Gerente de cuenta personal']}
  ];
  var MISSIONS = [
    {id:'login', group:'daily', icon:'sign-in', title:'Iniciá sesión hoy', desc:'Entrá a tu cuenta una vez por día.', goal:1, pts:50},
    {id:'sugar', group:'daily', icon:'cherries', title:'Jugá 3 partidas en Sugar Rush 1000', desc:'Cualquier apuesta cuenta como partida.', goal:3, pts:150, game:'Sugar Rush 1000'},
    {id:'load', group:'daily', icon:'coins', title:'Cargá fichas por $5.000 o más', desc:'En una sola carga con el cajero.', goal:1, pts:200, wallet:1},
    {id:'live', group:'daily', icon:'spade', title:'Jugá en una mesa en vivo', desc:'Ruleta, blackjack o shows.', goal:1, pts:100, href:'#vivo'},
    {id:'wins', group:'weekly', icon:'trophy', title:'Ganá 5 veces en slots esta semana', desc:'Cada premio mayor a tu apuesta suma una victoria.', goal:5, pts:600, href:'#casino/slots'},
    {id:'streak', group:'weekly', icon:'flame', title:'Jugá 7 días seguidos', desc:'Entrá y jugá al menos una vez por día.', goal:7, pts:1000},
    {id:'games', group:'weekly', icon:'squares-four', title:'Probá 10 juegos distintos', desc:'Slots, Wildcat Games o mesas en vivo.', goal:10, pts:750, href:'#casino'},
    {id:'ref', group:'social', icon:'user-plus', title:'Invitá a un amigo', desc:'Si se registra con tu código y carga $5.000 o más, te llevás 1.000 puntos.', goal:1, pts:1000, ref:1}
  ];
  function dayKey(d){ d = d || new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function weekKey(){ var d = new Date(); var day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return dayKey(d); }
  function readRank(){
    var s; try{ s = JSON.parse(store(RANK_KEY)); }catch(e){}
    if(!s) s = {points:6200, day:dayKey(), week:weekKey(), progress:{sugar:2, wins:3, games:6, streak:4}, claimed:{}, games:[], history:[{pts:500, label:'Bono de bienvenida al rango', ts:Date.now() - 864e5 * 3}]};
    if(s.day !== dayKey()){ MISSIONS.forEach(function(m){ if(m.group === 'daily'){ delete s.progress[m.id]; delete s.claimed[m.id]; } }); s.day = dayKey(); }
    if(s.week !== weekKey()){ MISSIONS.forEach(function(m){ if(m.group === 'weekly'){ delete s.progress[m.id]; delete s.claimed[m.id]; } }); s.week = weekKey(); }
    return s;
  }
  function saveRank(s){ store(RANK_KEY, JSON.stringify(s)); }
  function rankInfo(p){
    var i = 0; RANKS.forEach(function(r, j){ if(p >= r.min) i = j; });
    var r = RANKS[i], n = RANKS[i + 1];
    return {rank:r, next:n, idx:i, pct:n ? Math.min(100, Math.round((p - r.min) / (n.min - r.min) * 100)) : 100, left:n ? n.min - p : 0};
  }
  function fmtPts(n){ return Math.round(n).toLocaleString('es-AR'); }
  function renderRankHooks(){
    var info = rankInfo(readRank().points), me = logged();
    $$('[data-rank-name]').forEach(function(el){ el.textContent = me ? info.rank.name : RANKS[0].name; });
    var r = me ? info.rank : RANKS[0];
    $$('[data-lvl-coin]').forEach(function(el){ el.src = 'a/rango/' + r.id + '-192.webp'; });
    $$('[data-lvl-k]').forEach(function(el){ el.textContent = me ? 'Tu nivel' : 'Niveles Wildcat'; });
    $$('[data-lvl-name]').forEach(function(el){ el.textContent = me ? r.name : 'Empezá en Bronce'; });
    $$('[data-lvl-bar]').forEach(function(el){ el.style.width = (me ? info.pct : 0) + '%'; });
    $$('[data-lvl-left]').forEach(function(el){ el.textContent = me ? (info.next ? fmtPts(info.left) + ' pts para ' + info.next.name : 'Nivel máximo') : 'Registrate y subí de nivel'; });
  }
  function rankDaily(){ var s = readRank(); saveRank(s); }
  function bump(id, by, set){
    if(!logged()) return;
    var s = readRank(), m = MISSIONS.filter(function(x){ return x.id === id; })[0]; if(!m) return;
    var before = s.progress[id] || 0;
    s.progress[id] = Math.min(m.goal, set ? Math.max(before, by) : before + by);
    saveRank(s);
    if(before < m.goal && s.progress[id] >= m.goal) toast('Misión cumplida: ' + m.title + '. Reclamá tus puntos');
  }
  function claim(id){
    var s = readRank(), m = MISSIONS.filter(function(x){ return x.id === id; })[0];
    if(!m || s.claimed[id] || (s.progress[id] || 0) < m.goal) return;
    var prev = rankInfo(s.points).rank;
    s.claimed[id] = true; s.points += m.pts; s.history.unshift({pts:m.pts, label:m.title, ts:Date.now()}); s.history = s.history.slice(0, 20);
    saveRank(s); renderRankHooks();
    var now = rankInfo(s.points).rank;
    toast(now.id !== prev.id ? '¡Subiste a ' + now.name + '!' : '+' + fmtPts(m.pts) + ' puntos');
    render(true);
  }

  // ---------- Ganadores en vivo ----------
  var WIN_NAMES = ['mati','lucas','flor','santi','nico','cami','juli','agus','fede','sofi','tomi','valen','gonza','facu','rochi','maxi','pau','eze','mica','dani','lean','ari'];
  function pick(l){ return l[Math.floor(Math.random() * l.length)]; }
  function nextWinner(){
    var g = pick(ALL), bet = pick([200,500,1000,1500,2000,5000,10000]), mult = Math.random() < .12 ? (5 + Math.random() * 95) : (1.2 + Math.random() * 4);
    return {g:g, user:pick(WIN_NAMES) + '***' + pad2(Math.floor(Math.random() * 99)), bet:bet, mult:mult, win:bet * mult};
  }
  function winRow(w){
    return '<div class="win"><span class="win__g"><img src="a/g/' + w.g.img + '.webp" alt="">' + esc(w.g.name) + '</span><span class="win__u">' + w.user + '</span><span class="win__b">' + money(w.bet) + '</span><span class="win__m">' + w.mult.toFixed(2) + 'x</span><span class="win__w">' + money(w.win) + '</span></div>';
  }
  var winTimer;
  function winners(){
    clearTimeout(winTimer);
    var box = $('#wins'); if(!box) return;
    var rows = []; for(var i = 0; i < 8; i++) rows.push(winRow(nextWinner()));
    box.innerHTML = rows.join('');
    (function tick(){
      winTimer = setTimeout(function(){
        if(!document.body.contains(box)) return;
        box.insertAdjacentHTML('afterbegin', winRow(nextWinner()));
        box.firstElementChild.classList.add('is-new');
        while(box.children.length > 8) box.lastElementChild.remove();
        tick();
      }, 900 + Math.random() * 1400);
    })();
  }

  // ---------- Vistas ----------
  var SLIDES = [
    {img:'a/hb-3.webp', k:'Niveles<br>Wildcat', aw:[['Cashback','hasta 15%','Todos los lunes'],['Bono','semanal','Según tu nivel'],['Retiros','prioritarios','Desde Oro']], b:'Ir', href:'#rango'},
    {img:'a/hb-4.webp', k:'Jugá con<br>Wildcat', aw:[['Más de','3.000','Juegos'],['Mesas','en vivo','En español'],['Pagos','en minutos','24/7']], b:'Registrarse', act:'registro'},
    {img:'a/hb-5.webp', k:'Jugá con<br>Wildcat', aw:[['Más de','3.000','Juegos'],['Mesas','en vivo','En español'],['Pagos','en minutos','24/7']], b:'Registrarse', act:'registro'}
  ];
  // laurel: hojas a lo largo de un arco (lado izquierdo; el derecho se espeja con CSS)
  var LAUREL = (function(){
    // rama curva de abajo hacia arriba; hojas alternadas a lo largo de la curva
    function bz(t){ var P = [[17,37],[6,31],[3,20],[8,5]], u = 1 - t;
      return [u*u*u*P[0][0] + 3*u*u*t*P[1][0] + 3*u*t*t*P[2][0] + t*t*t*P[3][0], u*u*u*P[0][1] + 3*u*u*t*P[1][1] + 3*u*t*t*P[2][1] + t*t*t*P[3][1]]; }
    var leaves = '';
    for(var i = 0; i < 6; i++){
      var t = 0.12 + i * 0.16, p = bz(t), q = bz(t + 0.02);
      var ang = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI;
      [-1, 1].forEach(function(side){
        var off = side * 3.2, nx = p[0] + off * Math.cos((ang + 90) * Math.PI / 180), ny = p[1] + off * Math.sin((ang + 90) * Math.PI / 180);
        leaves += '<ellipse cx="' + nx.toFixed(1) + '" cy="' + ny.toFixed(1) + '" rx="1.6" ry="3.6" transform="rotate(' + (ang + 90 + side * 35).toFixed(0) + ' ' + nx.toFixed(1) + ' ' + ny.toFixed(1) + ')"/>';
      });
    }
    var tip = bz(1);
    leaves += '<ellipse cx="' + tip[0].toFixed(1) + '" cy="' + (tip[1] - 1.5).toFixed(1) + '" rx="1.6" ry="3.4"/>';
    return '<svg class="aw__l" viewBox="0 0 22 40" aria-hidden="true"><path d="M17 37 C 6 31, 3 20, 8 5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"/><g fill="currentColor">' + leaves + '</g></svg>';
  })();
  function award(a){ return '<span class="aw">' + LAUREL + '<span class="aw__t"><b>' + a[0] + '<br>' + a[1] + '</b><small>' + a[2] + '</small></span>' + LAUREL.replace('class="aw__l"', 'class="aw__l aw__l--r"') + '</span>'; }
  function hero(){
    return '<section class="hero">' +
      '<div class="slider" id="slider">' + SLIDES.map(function(s, i){
        var btn = s.href ? '<a class="btn btn--white" href="' + s.href + '">' + s.b + '</a>' : '<button class="btn btn--white" type="button" data-open="' + (logged() ? 'promo' : s.act) + '">' + s.b + '</button>';
        return '<div class="slide' + (i ? '' : ' is-on') + '"><img src="' + s.img + '" alt="">' +
          '<div class="slide__t slide__t--aw"><span class="slide__k">' + s.k + '</span>' + (s.aw ? '<span class="aws">' + s.aw.map(award).join('') + '</span>' : '') + btn + '</div></div>';
      }).join('') +
      '<div class="sl-nav"><button type="button" data-sl="-1" aria-label="Anterior"><i class="ph-bold ph-caret-left"></i></button><button type="button" data-sl="1" aria-label="Siguiente"><i class="ph-bold ph-caret-right"></i></button></div>' + '<div class="dots">' + SLIDES.map(function(s, i){ return '<button type="button" aria-label="Banner ' + (i + 1) + '"' + (i ? '' : ' class="is-on"') + ' data-dot="' + i + '"></button>'; }).join('') + '</div></div>' +
      '<div class="hero__side">' +
        '<a class="pcard pcard--lvl" href="#rango"><span class="pcard__t"><b>Niveles Wildcat</b><small data-lvl-left>3.800 pts para Oro</small></span><img class="pcard__coin" data-lvl-coin src="a/rango/plata-192.webp" alt=""><span class="pcard__chip"><i></i>Tu nivel: <b data-rank-name>Plata</b></span></a>' +
        '<a class="pcard pcard--inv" href="#rango"><img src="a/card-inv-verde.webp" alt=""><span class="pcard__t"><b>Invitá y ganá</b><small>1.000 puntos por cada amigo</small></span><span class="pcard__chip"><i></i>Código WILD-US07</span></a>' +
      '</div></section>';
  }
  function seo(){
    return '<section class="seo"><h2>Wildcat: plataforma de casino online y juegos en vivo</h2>' +
      '<p>Bienvenido a Wildcat, el casino online hecho para Argentina. Cargás y retirás en pesos al toque, jugás miles de slots de los mejores proveedores, mesas en vivo con crupieres que hablan tu idioma y los juegos exclusivos Wildcat Games. Subís de rango jugando: cashback semanal, bonos y retiros más rápidos en cada nivel de los Rangos Wildcat. Soporte humano 24/7.</p>' +
      '<button class="btn btn--sec" type="button" data-seo><span>Leer más</span><i class="ph-bold ph-caret-down"></i></button></section>';
  }
  function winnersBlock(){
    return '<section class="row"><div class="row__head"><h3><span class="row__ic">' + IC.win + '</span>Ganadores en vivo<span class="live-dot"></span></h3></div>' +
      '<div class="wins"><div class="win win--head"><span>Juego</span><span class="win__u">Usuario</span><span class="win__b">Apuesta</span><span class="win__m">Multiplicador</span><span class="win__w">Premio</span></div><div id="wins"></div></div></section>';
  }
  function needLogin(title, text){
    return '<section class="ph empty"><span class="empty__ic"><i class="ph-fill ph-lock-simple"></i></span><h1>' + title + '</h1><p>' + text + '</p><div class="empty__b"><button class="btn btn--pri" type="button" data-open="login">Iniciar sesión</button><button class="btn btn--sec" type="button" data-open="registro">Registro</button></div></section>';
  }
  function dt(ts){ var d = new Date(ts); return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }

  var V = {
    inicio: function(){
      return hero() +
        row('orig', IC.orig, 'Wildcat Games', ORIG, '#casino/originales') +
        row('todos', IC.grid, 'Todos los juegos', TODOS, '#casino') +
        row('pop', IC.star, 'Populares', POP, '#casino/populares') +
        row('vivo', IC.live, 'Casino en vivo', LIVE, '#vivo') + winnersBlock() + seo();
    },
    casino: function(sub){
      sub = sub || 'lobby';
      if(sub === 'todos') sub = 'lobby';
      var cats = [['lobby','<i class="ph-fill ph-squares-four"></i>','Lobby'],['originales','<img src="a/mark.png" alt="">','Wildcat Games'],['populares','<i class="ph-fill ph-sparkle"></i>','Populares'],['vivo','<i class="ph-fill ph-spade"></i>','Casino en vivo'],['nuevos','<i class="ph-fill ph-seal-check"></i>','Nuevos'],['rapidos','<i class="ph-fill ph-lightning"></i>','Juegos rápidos'],['slots','<i class="ph-fill ph-cherries"></i>','Slots']];
      var lists = {originales:ORIG, populares:POP, vivo:LIVE, nuevos:NUEVOS, rapidos:RAPIDOS, slots:SLOTS};
      var segs = [['lobby','Lobby','#casino'],['vivo','Casino en vivo','#vivo'],['rapidos','Juegos rápidos','#casino/rapidos']];
      var best = ALL.filter(function(g){ return g.name === 'Sugar Rush 1000'; })[0];
      var CS = [
        {img:'a/cb-jet.webp', t:'Wild Jet:<br>multiplicá tu apuesta<br>hasta x1.000', b:'Jugar', play:'Wild Jet'},
        {img:'a/cb-candy.webp', t:'Cashback semanal<br>de hasta 15%<br>en todos los slots', b:'Ver niveles', href:'#rango'}
      ];
      var top = '<div class="cseg">' + segs.map(function(s2){ return '<a href="' + s2[2] + '"' + ((s2[0] === sub || (s2[0] === 'lobby' && ['lobby','originales','populares','nuevos','slots'].indexOf(sub) > -1)) ? ' class="is-on"' : '') + '>' + s2[1] + '</a>'; }).join('') + '</div>' +
        '<section class="chero"><div class="slider slider--c" id="slider">' + CS.map(function(c, i){
          var btn = c.href ? '<a class="btn btn--white" href="' + c.href + '">' + c.b + '</a>' : '<button class="btn btn--white" type="button" data-play-name="' + c.play + '">' + c.b + '</button>';
          return '<div class="slide' + (i ? '' : ' is-on') + '"><img src="' + c.img + '" alt=""><div class="slide__t slide__t--c"><h2>' + c.t + '</h2>' + btn + '</div></div>';
        }).join('') + '<div class="sl-nav"><button type="button" data-sl="-1" aria-label="Anterior"><i class="ph-bold ph-caret-left"></i></button><button type="button" data-sl="1" aria-label="Siguiente"><i class="ph-bold ph-caret-right"></i></button></div></div>' +
        '<div class="best"><img class="best__bg" src="a/cb-best.webp" alt=""><h3>Mejor juego de la semana</h3><a class="best__pv" href="#casino/populares">' + best.pv + '<i class="ph-bold ph-caret-right"></i></a>' +
          '<img class="best__cv" src="a/g/' + best.img + '.webp" alt="' + esc(best.name) + '"><button class="btn best__btn" type="button" data-play-name="' + best.name + '">Jugar</button></div></section>' +
        '<div class="csearch"><label class="search"><i class="ph-bold ph-magnifying-glass"></i><input type="search" placeholder="Buscar" data-search></label><button class="btn btn--sec csearch__pv" type="button" data-open="proveedores"><i class="ph-fill ph-sliders-horizontal"></i>Proveedores</button></div>' +
        '<div class="cchips"><div class="chips" id="cchips">' + cats.map(function(c){ return '<button type="button" data-cat="' + c[0] + '"' + (c[0] === sub ? ' class="is-on"' : '') + '>' + c[1] + c[2] + '</button>'; }).join('') + '</div><button class="cchips__next" type="button" data-chips aria-label="Más categorías"><i class="ph-bold ph-caret-right"></i></button></div>';
      var body = sub === 'lobby'
        ? row('c-orig', IC.orig, 'Wildcat Games', ORIG, '#casino/originales') + row('c-pop', IC.star, 'Populares', POP, '#casino/populares') +
          row('c-rap', '<i class="ph-fill ph-lightning"></i>', 'Juegos rápidos', RAPIDOS, '#casino/rapidos') + row('c-new', '<i class="ph-fill ph-seal-check"></i>', 'Nuevos', NUEVOS, '#casino/nuevos') +
          row('c-vivo', IC.live, 'Casino en vivo', LIVE, '#vivo') + '<section class="row"><div class="row__head"><h3><span class="row__ic">' + IC.grid + '</span>Todos los juegos</h3></div><div class="grid" id="grid">' + ALL.map(card).join('') + '</div></section>'
        : '<div class="grid" id="grid">' + (lists[sub] || ALL).map(card).join('') + '</div>';
      return '<section class="ph ph--c">' + top + body + '</section>';
    },
    vivo: function(sub){
      sub = sub || 'todas';
      var cats = [['todas','<i class="ph-fill ph-broadcast"></i>','Todas'],['ruleta','<i class="ph-fill ph-poker-chip"></i>','Ruleta'],['blackjack','<i class="ph-fill ph-club"></i>','Blackjack'],['shows','<i class="ph-fill ph-television-simple"></i>','Shows']];
      var re = {ruleta:/ruleta|roulette/i, blackjack:/blackjack/i, shows:/crazy|fishing/i}[sub];
      var list = re ? LIVE.filter(function(g){ return re.test(g.name); }) : LIVE;
      var best = byName('Crazy Time');
      var VS = [
        {img:'a/vb-ruleta.webp', t:'Ruleta en vivo<br>con crupieres<br>que hablan tu idioma', b:'Jugar', play:'Ruleta en Vivo'},
        {img:'a/vb-blackjack.webp', t:'Mesas de blackjack<br>abiertas las<br>24 horas', b:'Jugar', play:'Blackjack en Español'}
      ];
      return '<section class="ph ph--c">' +
        '<div class="cseg"><a href="#casino">Lobby</a><a href="#vivo" class="is-on">Casino en vivo</a><a href="#casino/rapidos">Juegos rápidos</a></div>' +
        '<section class="chero"><div class="slider slider--c" id="slider">' + VS.map(function(c, i){
          return '<div class="slide' + (i ? '' : ' is-on') + '"><img src="' + c.img + '" alt=""><div class="slide__t slide__t--c"><h2>' + c.t + '</h2><button class="btn btn--white" type="button" data-play-name="' + c.play + '">' + c.b + '</button></div></div>';
        }).join('') + '<div class="sl-nav"><button type="button" data-sl="-1" aria-label="Anterior"><i class="ph-bold ph-caret-left"></i></button><button type="button" data-sl="1" aria-label="Siguiente"><i class="ph-bold ph-caret-right"></i></button></div></div>' +
        '<div class="best"><img class="best__bg" src="a/cb-best.webp" alt=""><h3>Mesa más jugada de la semana</h3><a class="best__pv" href="#vivo">' + best.pv + '<i class="ph-bold ph-caret-right"></i></a>' +
          '<img class="best__cv" src="a/g/' + best.img + '.webp" alt="' + esc(best.name) + '"><button class="btn best__btn" type="button" data-play-name="' + best.name + '">Jugar</button></div></section>' +
        '<div class="csearch"><label class="search"><i class="ph-bold ph-magnifying-glass"></i><input type="search" placeholder="Buscar mesa" data-search></label><button class="btn btn--sec csearch__pv" type="button" data-open="proveedores"><i class="ph-fill ph-sliders-horizontal"></i>Proveedores</button></div>' +
        '<div class="cchips"><div class="chips">' + cats.map(function(c){ return '<button type="button" data-vcat="' + c[0] + '"' + (c[0] === sub ? ' class="is-on"' : '') + '>' + c[1] + c[2] + '</button>'; }).join('') + '</div></div>' +
        '<div class="grid" id="grid">' + list.map(card).join('') + '</div>' +
        row('pop', IC.star, 'Populares', POP, '#casino/populares') + '</section>';
    },
    jugar: function(sub){
      var g = ALL[+sub]; if(!g) g = ALL[0];
      var sim = ALL.filter(function(x){ return x.cat === g.cat && x !== g; }).slice(0, 8);
      return '<section class="gp">' +
        '<div class="gp__bar"><button class="btn btn--sec gp__back" type="button" data-back><i class="ph-bold ph-caret-left"></i>Volver</button>' +
          '<button class="gp__demo" type="button" data-demo-tg><span>Modo demo</span><i class="tgl2" data-demo></i></button>' +
          '<span class="gp__name">' + esc(g.name) + ' <small>' + g.pv + '</small></span>' +
          '<span class="gp__acts"><button class="side__sq side__sq--lg" type="button" data-copy="' + location.href.split('#')[0] + '#jugar/' + sub + '" aria-label="Compartir"><i class="ph-bold ph-export"></i></button><button class="side__sq side__sq--lg" type="button" data-full aria-label="Pantalla completa"><i class="ph-bold ph-arrows-out-simple"></i></button></span></div>' +
        '<div class="gp__frame" id="gframe"><img class="gp__bg" src="a/g/' + g.img + '.webp" alt="">' +
          '<div class="gp__ask"><b>Acceder al juego en modo demo</b><div class="gp__btns"><button class="btn btn--pri btn--lg" type="button" data-enter="' + sub + '">Entrar</button><button class="btn btn--sec btn--lg" type="button" data-demo-play="' + sub + '">Modo demo</button></div></div>' +
          '<div class="gp__load" hidden><span class="ldr"></span><b></b><small>Cargando el juego del proveedor.</small></div>' +
        '</div>' +
        (sim.length ? row('sim', IC.star, 'Juegos similares', sim, '#casino') : '') + '</section>';
    },
    promos: function(){
      var P = [
        ['a/h-bienvenida.webp','Bienvenida','+500% en tus primeras cargas','Hasta 500% repartido en tus primeras cuatro cargas.','Recibir','registro'],
        ['a/card-regalo.webp','Código de regalo','Bono REGALO20','Aplicá el código y sumá un 20% extra en tu próxima carga.','Ver código','promo',1],
        ['a/card-cash.webp','Todos los lunes','Cashback semanal','Te devolvemos hasta el 15% de lo que perdiste en la semana, según tu rango.','Ver rangos','#rango'],
        ['a/cb-best.webp','Rangos Wildcat','Subí de rango jugando','Cada nivel suma cashback, bonos semanales y retiros más rápidos.','Ver rangos','#rango']
      ];
      return '<section class="ph"><h1>Bonos</h1><div class="promos">' + P.map(function(p){
        var btn = p[5].charAt(0) === '#' ? '<a class="btn btn--pri" href="' + p[5] + '">' + p[4] + '</a>' : '<button class="btn btn--pri" type="button" data-open="' + (p[5] === 'registro' && logged() ? 'promo' : p[5]) + '">' + p[4] + '</button>';
        return '<article class="promo"><div class="promo__img' + (p[6] ? ' promo__img--p' : '') + '"><img src="' + p[0] + '" alt=""></div>' +
          '<div class="promo__b"><small>' + p[1] + '</small><h3>' + p[2] + '</h3><p>' + p[3] + '</p>' + btn + '</div></article>';
      }).join('') + '</div></section>';
    },
    perfil: function(sub){
      if(!logged()) return needLogin('Mi cuenta', 'Iniciá sesión para ver tu saldo, tus movimientos y los ajustes de tu cuenta.');
      sub = sub || 'cuenta';
      var tabs = [['cuenta','Mi cuenta'],['movimientos','Movimientos'],['responsable','Juego responsable']];
      var info = rankInfo(readRank().points), body = '';
      if(sub === 'movimientos'){
        var mv = getMoves();
        body = mv.length ? '<div class="list">' + mv.map(function(m){
          var up = m.type === 'carga' || m.type === 'premio';
          return '<div class="list__r"><span class="list__ic' + (up ? ' is-up' : '') + '"><i class="ph-fill ph-arrow-' + (up ? 'down-left' : 'up-right') + '"></i></span><span class="list__t"><b>' + esc(m.label) + '</b><small>' + dt(m.ts) + ' · ' + esc(m.status) + '</small></span><span class="list__v' + (up ? ' is-up' : '') + '">' + (up ? '+' : '−') + money(m.amount) + '</span></div>';
        }).join('') + '</div>' : '<div class="box empty-s"><i class="ph-fill ph-receipt"></i><b>Todavía no tenés movimientos</b><small>Tus cargas y retiros van a aparecer acá.</small><button class="btn btn--pri" type="button" data-wallet="cargar">Cargar fichas</button></div>';
      } else if(sub === 'responsable'){
        var lim = store('wildcat:limit') || '';
        body = '<div class="box"><h3>Límites</h3><p>Poné un tope a lo que cargás por día. Lo podés bajar cuando quieras; para subirlo hay que esperar 24 h.</p>' +
          '<label class="fld"><span>Límite diario de carga</span><input data-limit inputmode="numeric" placeholder="Sin límite" value="' + (lim ? money(lim) : '') + '"></label>' +
          '<label class="tgl"><input type="checkbox" data-remind' + (store('wildcat:remind') ? ' checked' : '') + '><span></span>Recordarme cada 60 minutos de juego</label>' +
          '<button class="btn btn--pri" type="button" data-save-limits>Guardar límites</button></div>' +
          '<div class="box"><h3>Autoexclusión</h3><p>Si necesitás un descanso, bloqueá tu cuenta por un período. No vas a poder cargar ni jugar hasta que termine.</p>' +
          '<label class="fld"><span>Período</span><select data-excl><option value="1">24 horas</option><option value="7">7 días</option><option value="30">30 días</option><option value="180">6 meses</option></select></label>' +
          '<button class="btn btn--danger" type="button" data-exclude>Autoexcluirme</button></div>';
      } else {
        body = '<div class="box"><h3>Datos de la cuenta</h3>' +
          '<div class="kv"><span>Usuario</span><b data-user>' + DEMO_USER + '</b></div>' +
          '<div class="kv"><span>Teléfono</span><b>+54 11 •••• 6789</b><button class="lnk" type="button" data-soon>Cambiar</button></div>' +
          '<div class="kv"><span>Email</span><b>l•••@gmail.com</b><button class="lnk" type="button" data-soon>Cambiar</button></div>' +
          '<div class="kv"><span>Contraseña</span><b>••••••••</b><button class="lnk" type="button" data-soon>Cambiar</button></div></div>' +
          '<div class="box"><h3>Notificaciones</h3>' +
          '<label class="tgl"><input type="checkbox" checked><span></span>Promos y bonos por WhatsApp</label>' +
          '<label class="tgl"><input type="checkbox" checked><span></span>Avisos de cargas y retiros</label></div>';
      }
      return '<section class="ph"><h1>Mi cuenta</h1>' +
        '<div class="acct"><div class="acct__bal"><small>Saldo disponible</small><b data-balance-text>' + money(getBalance()) + ' ' + cur() + '</b>' +
          (promoApplied() ? '<span class="acct__promo"><i class="ph-fill ph-gift"></i>Bono activo: ' + PROMO_CODE + ' (+20% en la próxima carga)</span>' : '') +
          '<div class="acct__b"><button class="btn btn--pri" type="button" data-wallet="cargar">Cargar</button><button class="btn btn--sec" type="button" data-wallet="retirar">Retirar</button></div></div>' +
          '<a class="acct__rank" href="#rango"><img class="coin" src="a/rango/' + info.rank.id + '-192.webp" alt=""><span><small>Tu rango</small><b>' + info.rank.name + '</b></span>' +
          '<span class="bar"><i style="width:' + info.pct + '%"></i></span><small>' + (info.next ? 'Te faltan ' + fmtPts(info.left) + ' pts para ' + info.next.name : 'Rango máximo') + '</small></a></div>' +
        '<div class="chips">' + tabs.map(function(t){ return '<button type="button" data-ptab="' + t[0] + '"' + (t[0] === sub ? ' class="is-on"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div>' + body + '</section>';
    },
    rango: function(){
      var s = readRank(), info = rankInfo(s.points);
      function mission(m){
        var p = s.progress[m.id] || 0, done = p >= m.goal, cl = s.claimed[m.id];
        var act = !logged() ? '<button class="btn btn--sec" type="button" data-open="login">Iniciá sesión</button>'
          : cl ? '<span class="ms__ok"><i class="ph-fill ph-check-circle"></i>Reclamado</span>'
          : done ? '<button class="btn btn--pri" type="button" data-claim="' + m.id + '">Reclamar</button>'
          : m.wallet ? '<button class="btn btn--sec" type="button" data-wallet="cargar">Cargar</button>'
          : m.ref ? '<button class="btn btn--sec" type="button" data-copy="WILD-US07">Copiar código</button>'
          : m.game ? '<button class="btn btn--sec" type="button" data-play-name="' + m.game + '">Jugar</button>'
          : m.href ? '<a class="btn btn--sec" href="' + m.href + '">Ir</a>' : '';
        return '<div class="ms"><span class="ms__ic"><i class="ph-fill ph-' + m.icon + '"></i></span><span class="ms__t"><b>' + m.title + '</b><small>' + m.desc + '</small>' +
          '<span class="bar bar--s"><i style="width:' + Math.round(Math.min(p, m.goal) / m.goal * 100) + '%"></i></span><small class="ms__p">' + Math.min(p, m.goal) + ' / ' + m.goal + '</small></span>' +
          '<span class="ms__pts">+' + fmtPts(m.pts) + ' pts</span>' + act + '</div>';
      }
      var grp = function(g){ return MISSIONS.filter(function(m){ return m.group === g; }).map(mission).join(''); };
      return '<section class="ph"><h1>Rangos Wildcat</h1>' +
        '<div class="rk"><img class="coin coin--lg" src="a/rango/' + info.rank.id + '-192.webp" alt="">' +
          '<div class="rk__t"><small>' + (logged() ? 'Tu rango actual' : 'Así se ve tu progreso') + '</small><b>' + info.rank.name + '</b>' +
          '<span class="bar"><i style="width:' + info.pct + '%"></i></span>' +
          '<small>' + fmtPts(s.points) + ' pts · ' + (info.next ? 'te faltan ' + fmtPts(info.left) + ' para ' + info.next.name : 'rango máximo') + '</small></div></div>' +
        '<h2 class="sub">Rangos</h2><div class="ranks">' + RANKS.map(function(r, i){
          return '<div class="rcard' + (i === info.idx ? ' is-cur' : '') + (i < info.idx ? ' is-done' : '') + '"><img class="coin" src="a/rango/' + r.id + '-192.webp" alt=""><b>' + r.name + '</b><small>Desde ' + fmtPts(r.min) + ' pts</small><ul>' + r.perks.map(function(p){ return '<li><i class="ph-bold ph-check"></i>' + p + '</li>'; }).join('') + '</ul>' + (i === info.idx ? '<span class="rcard__tag">Tu rango</span>' : '') + '</div>';
        }).join('') + '</div>' +
        '<h2 class="sub">Misiones diarias</h2><div class="mss">' + grp('daily') + '</div>' +
        '<h2 class="sub">Retos de la semana</h2><div class="mss">' + grp('weekly') + '</div>' +
        '<h2 class="sub">Invitá y ganá</h2><div class="mss">' + grp('social') + '</div>' +
        (logged() ? '<h2 class="sub">Historial de puntos</h2><div class="list">' + s.history.map(function(h){ return '<div class="list__r"><span class="list__ic is-up"><i class="ph-fill ph-star"></i></span><span class="list__t"><b>' + esc(h.label) + '</b><small>' + dt(h.ts) + '</small></span><span class="list__v is-up">+' + fmtPts(h.pts) + ' pts</span></div>'; }).join('') + '</div>' : '') +
        '</section>';
    }
  };

  // ---------- Router ----------
  function render(keepScroll){
    var h = (location.hash || '#inicio').slice(1).split('/');
    var key = h[0], sub = h[1];
    if(key === 'ayuda' || key === 'app'){ if(key === 'ayuda') openChat(); else toast('La app se arma en la próxima etapa'); history.replaceState(null, '', '#' + (render.last || 'inicio')); return; }
    if(!V[key]) key = 'inicio';
    render.last = key + (sub ? '/' + sub : '');
    var y = window.scrollY;
    $('#view').innerHTML = V[key](sub);
    var nk = key === 'casino' && sub === 'originales' ? 'originales' : key;
    $$('[data-nav]').forEach(function(a){
      var n = a.getAttribute('data-nav');
      a.classList.toggle('is-on', n === nk || (nk === 'originales' && n === 'casino' && !a.closest('[data-sidenav]')));
    });
    renderBalance(); renderRankHooks(); railState(); slider(); winners();
    window.scrollTo(0, keepScroll === true ? y : 0);
  }
  window.addEventListener('hashchange', function(){ render(); });

  function railState(){
    $$('.rail').forEach(function(r){
      var id = r.id.replace('rail-', '');
      var upd = function(){ var b = $$('[data-rail="' + id + '"]'); if(b.length < 2) return; b[0].disabled = r.scrollLeft < 4; b[1].disabled = r.scrollLeft + r.clientWidth > r.scrollWidth - 4; };
      r.addEventListener('scroll', upd, {passive:true}); upd();
    });
  }
  var timer;
  function slider(){
    clearInterval(timer);
    var s = $('#slider'); if(!s) return;
    var slides = $$('.slide', s), dots = $$('.dots button', s), cur = 0;
    function go(i){ cur = (i + slides.length) % slides.length; slides.forEach(function(el, j){ el.classList.toggle('is-on', j === cur); }); dots.forEach(function(el, j){ el.classList.toggle('is-on', j === cur); }); }
    function restart(){ clearInterval(timer); timer = setInterval(function(){ go(cur + 1); }, 5500); }
    dots.forEach(function(d){ d.addEventListener('click', function(){ go(+d.getAttribute('data-dot')); restart(); }); });
    $$('[data-sl]', s).forEach(function(b){ b.addEventListener('click', function(){ go(cur + +b.getAttribute('data-sl')); restart(); }); });
    var x0 = null;
    s.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; }, {passive:true});
    s.addEventListener('touchend', function(e){ if(x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if(Math.abs(dx) > 40){ go(cur + (dx < 0 ? 1 : -1)); restart(); } x0 = null; });
    restart();
  }

  // ---------- Jugar ----------
  function play(g){ location.hash = 'jugar/' + ALL.indexOf(g); }
  function startGame(g, demo){
    if(!demo){
      if(!requireLogin(function(){ startGame(g, false); })) return;
      var st = readRank();
      if(st.games.indexOf(g.img) < 0){ st.games.push(g.img); saveRank(st); bump('games', st.games.length, true); }
      if(g.cat === 'vivo') bump('live', 1);
      if(g.name === 'Sugar Rush 1000') bump('sugar', 1);
      if(g.cat === 'slots' && Math.random() < .5) bump('wins', 1);
    }
    var fr = $('#gframe'); if(!fr) return;
    fr.classList.add('is-loading'); $('.gp__ask', fr).hidden = true;
    var ld = $('.gp__load', fr); ld.hidden = false;
    $('b', ld).textContent = demo ? 'Abriendo ' + g.name + ' en modo demo…' : 'Abriendo ' + g.name + '…';
    var tg = $('[data-demo]'); if(tg) tg.classList.toggle('is-on', !!demo);
    setTimeout(function(){ if(!document.body.contains(fr)) return; fr.classList.remove('is-loading'); fr.classList.add('is-playing'); $('b', ld).textContent = g.name + (demo ? ' · Modo demo' : ''); $('small', ld).textContent = demo ? 'Jugás con saldo de prueba. En la plataforma real acá corre el juego del proveedor.' : 'En la plataforma real acá corre el juego del proveedor con tu saldo.'; $('.ldr', ld).hidden = true; }, 1600);
  }


  // ---------- Modales ----------
  var CHIPS = [5000, 10000, 20000, 50000, 100000], MIN = 1000, BANK = [['Titular','Wildcat Demo'],['Alias','wildcat.demo'],['CBU','0000000000000000000000']];
  var M = {
    login: function(){
      return '<div class="m__img"><img src="a/h-bienvenida.webp" alt=""><button class="m__x" data-close aria-label="Cerrar"><i class="ph-bold ph-x"></i></button></div>' +
        '<form class="m__b" data-form="login"><h2>Iniciar sesión</h2><p>Entrá a tu cuenta para cargar y jugar.</p>' +
        '<label class="fld"><span>Usuario o teléfono</span><input autocomplete="username" placeholder="Tu usuario"></label>' +
        '<label class="fld"><span>Contraseña</span><input type="password" autocomplete="current-password" placeholder="••••••••"></label>' +
        '<button class="btn btn--pri btn--block btn--lg" type="submit">Iniciar sesión</button>' +
        '<p class="m__alt">¿No tenés cuenta? <button type="button" data-open="registro">Registrate</button></p></form>';
    },
    registro: function(){
      return '<div class="m__img"><img src="a/h-bienvenida.webp" alt=""><button class="m__x" data-close aria-label="Cerrar"><i class="ph-bold ph-x"></i></button></div>' +
        '<form class="m__b" data-form="registro"><h2>Registro</h2><p>Tarda menos de un minuto.</p>' +
        '<div class="m__bonus"><span class="ic"><i class="ph-fill ph-gift"></i></span><span><b>+500% en tus primeras cargas</b><small>Se activa solo cuando cargás</small></span></div>' +
        '<label class="fld"><span>Teléfono</span><input type="tel" inputmode="tel" placeholder="11 2345 6789"></label>' +
        '<label class="fld"><span>Usuario</span><input placeholder="Elegí un usuario"></label>' +
        '<label class="fld"><span>Contraseña</span><input type="password" autocomplete="new-password" placeholder="Mínimo 8 caracteres"></label>' +
        '<label class="fld"><span>Código de invitación (opcional)</span><input placeholder="Ej: WILD-AB12"></label>' +
        '<button class="btn btn--pri btn--block btn--lg" type="submit">Registrarme</button>' +
        '<p class="m__alt">¿Ya tenés cuenta? <button type="button" data-open="login">Iniciá sesión</button></p></form>';
    },
    promo: function(){
      var ok = promoApplied();
      return '<div class="m__img m__img--c"><img src="a/card-regalo.webp" alt=""><button class="m__x" data-close aria-label="Cerrar"><i class="ph-bold ph-x"></i></button></div>' +
        '<div class="m__b"><small class="m__eye">Promoción</small><h2>¡Tenés un bono de regalo!</h2><p>Usá este código para sumar un 20% extra en tu próxima carga.</p>' +
        '<div class="code"><span><small>Tu código</small><b>' + PROMO_CODE + '</b></span><button class="btn btn--sec" type="button" data-copy="' + PROMO_CODE + '"><i class="ph-bold ph-copy"></i>Copiar</button></div>' +
        (ok ? '<button class="btn btn--pri btn--block btn--lg" type="button" data-wallet="cargar">Bono aplicado · Cargar ahora</button>' : '<button class="btn btn--pri btn--block btn--lg" type="button" data-apply-promo>Aplicar bono</button>') +
        '<p class="m__fine">Válido por 7 días · Sujeto a términos y condiciones</p></div>';
    },
    game: function(g){
      return '<div class="m__b gm"><div class="gm__top"><img src="a/g/' + g.img + '.webp" alt=""><span><small>' + g.pv + '</small><h2>' + esc(g.name) + '</h2><span class="game__on"><i></i><b>' + g.on + '</b> jugando</span></span><button class="m__x m__x--in" data-close aria-label="Cerrar"><i class="ph-bold ph-x"></i></button></div>' +
        '<div class="gm__frame"><span class="ldr"></span><p>Abriendo el juego…</p><small>En la plataforma real acá carga el juego del proveedor.</small></div>' +
        '<div class="gm__bal">Tu saldo: <b data-balance-text>' + money(getBalance()) + ' ' + cur() + '</b><button class="btn btn--pri" type="button" data-wallet="cargar">Cargar</button></div></div>';
    },
    wallet: function(tab){
      tab = tab || 'cargar';
      var chips = CHIPS.map(function(a){ return '<button type="button" class="wchip" data-amt="' + a + '">' + a.toLocaleString('es-AR') + '</button>'; }).join('');
      var bank = BANK.map(function(b){ return '<div class="bank__r"><span><small>' + b[0] + '</small><b>' + b[1] + '</b></span><button class="btn btn--sec" type="button" data-copy="' + b[1] + '"><i class="ph-bold ph-copy"></i>Copiar</button></div>'; }).join('');
      return '<div class="m__b w"><div class="w__head"><span class="w__ic"><img src="a/mark.png" alt=""></span><span><h2>Cajero Wildcat</h2><p>Tu saldo: <b data-balance-text>' + money(getBalance()) + ' ' + cur() + '</b></p></span><button class="m__x m__x--in" data-close aria-label="Cerrar"><i class="ph-bold ph-x"></i></button></div>' +
        '<div class="seg"><button type="button" data-wtab="cargar"' + (tab === 'cargar' ? ' class="is-on"' : '') + '>Cargar</button><button type="button" data-wtab="retirar"' + (tab === 'retirar' ? ' class="is-on"' : '') + '>Retirar</button></div>' +
        '<div data-wpanel="cargar"' + (tab === 'cargar' ? '' : ' hidden') + '>' +
          '<div class="steps"><i class="is-on"></i><i></i><i></i></div>' +
          '<section data-step="1"><span class="lbl">Elegí cuánto cargar</span><div class="wchips">' + chips + '</div>' +
            '<label class="fld"><span>Otro monto</span><span class="inp"><em>$</em><input data-wcustom inputmode="numeric" placeholder="Mínimo 1.000"><em data-cur>' + cur() + '</em></span></label>' +
            '<p class="hint" data-whint></p><div class="wbonus" data-wbonus></div>' +
            '<button class="btn btn--pri btn--block btn--lg" type="button" data-wnext disabled>Continuar</button></section>' +
          '<section data-step="2" hidden><button class="back" type="button" data-wback><i class="ph-bold ph-caret-left"></i>Cambiar monto</button>' +
            '<span class="lbl">Transferí a esta cuenta</span><div class="tbox"><span><small>Monto a transferir</small><b data-wtransfer>$0</b></span><span class="timer"><i class="ph-bold ph-clock"></i><span data-wtimer>15:00</span></span></div>' +
            '<div class="bank">' + bank + '</div><p class="note"><b>Datos de ejemplo (demo):</b> no transfieras a esta cuenta. Transferí el monto exacto para que se acredite más rápido.</p>' +
            '<button class="btn btn--pri btn--block btn--lg" type="button" data-wdone>Ya transferí</button></section>' +
          '<section data-step="3" hidden><div class="wstatus" data-wstatus></div></section>' +
        '</div>' +
        '<div data-wpanel="retirar"' + (tab === 'retirar' ? '' : ' hidden') + '>' +
          '<form data-rform novalidate><label class="fld"><span>Monto a retirar</span><span class="inp"><em>$</em><input data-ramt inputmode="numeric" placeholder="Mínimo 1.000"><button type="button" class="max" data-rmax>Máx.</button></span></label><p class="hint" data-rhint></p>' +
            '<label class="fld"><span>Alias o CBU de destino</span><span class="inp"><input data-rdest autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="22" placeholder="tu.alias o CBU de 22 dígitos"></span></label><p class="hint" data-dhint>Tiene que ser una cuenta a tu nombre.</p>' +
            '<button class="btn btn--pri btn--block btn--lg" type="submit">Solicitar retiro</button></form>' +
          '<div class="wstatus" data-rstatus hidden></div>' +
        '</div>' +
        '<button class="whelp" type="button" data-chat>¿Dudas? <span>Hablá con el cajero</span></button><p class="m__fine">Demo sin pagos reales · No se envían datos</p></div>';
    },
    proveedores: function(){
      var pv = {}; ALL.forEach(function(g){ pv[g.pv] = (pv[g.pv] || 0) + 1; });
      return '<div class="m__b pvs"><div class="w__head"><span><h2>Proveedores</h2><p>' + Object.keys(pv).length + ' proveedores</p></span><button class="m__x m__x--in" data-close aria-label="Cerrar"><i class="ph-bold ph-x"></i></button></div>' +
        '<div class="pvs__g">' + Object.keys(pv).sort().map(function(k){ return '<button type="button" data-pv="' + esc(k) + '"><b>' + esc(k) + '</b><small>' + pv[k] + ' juegos</small></button>'; }).join('') + '</div></div>';
    },
    confirm: function(o){
      return '<div class="m__b cf"><span class="cf__ic"><i class="ph-fill ph-warning"></i></span><h2>' + o.title + '</h2><p>' + o.text + '</p><div class="cf__b"><button class="btn btn--sec" type="button" data-close>Cancelar</button><button class="btn btn--danger" type="button" data-confirm-ok>' + o.ok + '</button></div></div>';
    },
    menu: function(){
      return '<div class="m__menu"><div style="display:flex;align-items:center;justify-content:space-between"><span class="brand"><img src="a/mark.png" alt=""><span>Wildcat</span></span><button class="side__sq" data-close aria-label="Cerrar"><i class="ph-bold ph-x"></i></button></div>' + $('.side__scroll').innerHTML + '</div>';
    }
  };
  var modalKind = null, confirmCb = null;
  function openModal(k, arg){
    closeMenus();
    var m = $('#modal'), box = $('.modal__box', m);
    box.className = 'modal__box' + (k === 'wallet' ? ' modal__box--w' : '') + (k === 'game' ? ' modal__box--g' : '');
    box.innerHTML = M[k](arg); m.hidden = false; modalKind = k; document.body.style.overflow = 'hidden';
    if(k === 'wallet') walletSetup();
    var f = $('input:not([type=checkbox])', box); if(f && (k === 'login' || k === 'registro') && matchMedia('(min-width:761px)').matches) setTimeout(function(){ f.focus(); }, 50);
  }
  function closeModal(){ $('#modal').hidden = true; document.body.style.overflow = ''; modalKind = null; walletStop(); }
  function askConfirm(o, cb){ confirmCb = cb; openModal('confirm', o); }
  function toast(t){ var old = $('.toast'); if(old) old.remove(); var el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.appendChild(el); setTimeout(function(){ el.remove(); }, 2600); }
  function copy(t){ try{ navigator.clipboard.writeText(t).then(function(){ toast('Copiado: ' + t); }, function(){ toast('Copiado: ' + t); }); }catch(e){ toast('Copiado: ' + t); } }

  // ---------- Billetera ----------
  var amount = 0, tId = null, vId = null, deadline = 0;
  function walletStop(){ clearInterval(tId); clearTimeout(vId); tId = vId = null; }
  function credited(){ return promoApplied() ? Math.round(amount * 1.2) : amount; }
  function walletSetup(){ amount = 0; walletStop(); }
  function wStep(n){
    var box = $('.modal__box');
    $$('[data-step]', box).forEach(function(s){ s.hidden = +s.getAttribute('data-step') !== n; });
    $$('.steps i', box).forEach(function(d, i){ d.classList.toggle('is-on', i < n); });
    if(n === 2){
      $('[data-wtransfer]', box).textContent = money(amount);
      deadline = Date.now() + 15 * 60 * 1000;
      var tick = function(){ var s = Math.max(0, Math.round((deadline - Date.now()) / 1000)); var el = $('[data-wtimer]'); if(el) el.textContent = pad2(Math.floor(s / 60)) + ':' + pad2(s % 60); };
      tick(); clearInterval(tId); tId = setInterval(tick, 1000);
    }
    if(n === 3){
      clearInterval(tId);
      var st = $('[data-wstatus]', box);
      st.innerHTML = '<span class="ldr"></span><b>Verificando tu transferencia…</b><small>Suele tardar menos de un minuto.</small>';
      vId = setTimeout(function(){
        var c = credited();
        setBalance(getBalance() + c);
        addMove({type:'carga', label:'Carga de fichas' + (promoApplied() ? ' + bono ' + PROMO_CODE : ''), amount:c, status:'Acreditada'});
        if(amount >= 5000) bump('load', 1);
        if(promoApplied()) store(PROMO_KEY, 'usado');
        st.innerHTML = '<span class="okc"><i class="ph-bold ph-check"></i></span><b>¡Listo! Te acreditamos ' + money(c) + '</b><small>Tu saldo nuevo es ' + money(getBalance()) + ' ' + cur() + '.</small><button class="btn btn--pri btn--block btn--lg" type="button" data-close>Ir a jugar</button>';
      }, 2600);
    }
  }
  function wAmount(v, fromChip){
    var box = $('.modal__box'); amount = v;
    $$('.wchip', box).forEach(function(c){ c.classList.toggle('is-on', fromChip && +c.getAttribute('data-amt') === v); });
    var err = v && v < MIN, lim = parseInt(store('wildcat:limit'), 10);
    var hint = $('[data-whint]', box), bonus = $('[data-wbonus]', box);
    if(err) hint.textContent = 'El mínimo es ' + money(MIN) + '.';
    else if(lim && v > lim) hint.textContent = 'Supera tu límite diario de ' + money(lim) + '.';
    else hint.textContent = '';
    bonus.innerHTML = v >= MIN ? (promoApplied() ? '<i class="ph-fill ph-gift"></i>Con tu bono ' + PROMO_CODE + ' recibís <b>' + money(credited()) + '</b>' : '<i class="ph-fill ph-gift"></i>¿Tenés un código? <button type="button" data-open="promo">Usar bono de regalo</button>') : '';
    $('[data-wnext]', box).disabled = !(v >= MIN) || (lim && v > lim);
  }

  // ---------- Chat ----------
  var REPLIES = [
    {re:/carg|deposit|ficha/i, t:'¡Dale! Decime cuánto querés cargar y te paso los datos para transferir. Apenas se acredita, te sumamos las fichas.'},
    {re:/retir|cobr|pag/i, t:'Para retirar, decime el monto y tu CBU o alias. Los retiros se procesan en minutos.'},
    {re:/bono|promo|codigo|código/i, t:'Tenés el código ' + PROMO_CODE + ' de regalo 🎁. Usalo al cargar y te sumamos un 20% extra.'},
    {re:/rango|nivel|vip|cashback/i, t:'Con los Rangos Wildcat subís de nivel jugando: cada rango suma cashback semanal, bonos y retiros más rápidos.'},
    {re:/problema|error|ayuda|no (me )?anda/i, t:'Contame qué pasó y te ayudo. Si es un juego, decime cuál y en qué momento falló.'}
  ];
  function now(){ var d = new Date(); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
  function msg(who, t){ var log = $('#chat-log'); log.insertAdjacentHTML('beforeend', '<div class="msg msg--' + who + '"><p>' + esc(t) + '</p><small>' + now() + '</small></div>'); log.scrollTop = log.scrollHeight; }
  function bot(t, d){ var log = $('#chat-log'); log.insertAdjacentHTML('beforeend', '<div class="msg msg--bot msg--typing"><p><i></i><i></i><i></i></p></div>'); log.scrollTop = log.scrollHeight; setTimeout(function(){ var ty = $('.msg--typing', log); if(ty) ty.remove(); msg('bot', t); }, d || 1100); }
  function userSay(t){ if(!t.trim()) return; msg('me', t); var r = REPLIES.filter(function(x){ return x.re.test(t); })[0]; bot(r ? r.t : '¡Gracias por escribirnos! Un operador te responde en un momento.'); }
  function openChat(){ closeMenus(); var c = $('#chat'); c.hidden = false; document.body.classList.add('chat-open'); if(!$('#chat-log').children.length) bot('¡Hola! 👋 Soy del equipo de Wildcat. ¿En qué te ayudo? Podés cargar, retirar o consultar por bonos.', 500); setTimeout(function(){ $('#chat-input').focus(); }, 60); }
  function closeChat(){ $('#chat').hidden = true; document.body.classList.remove('chat-open'); }

  // ---------- Menús desplegables ----------
  function closeMenus(){ $$('[data-um-menu],[data-cur-menu]').forEach(function(m){ m.hidden = true; }); }

  // ---------- Eventos ----------
  document.addEventListener('click', function(e){
    var t = e.target.closest('[data-open],[data-close],[data-rail],[data-cat],[data-seo],[data-top],[data-game],[data-acc],[data-wallet],[data-logout],[data-chat],[data-chat-close],[data-q],[data-um-btn],[data-cur-btn],[data-cur-pick],[data-copy],[data-apply-promo],[data-wtab],[data-amt],[data-wnext],[data-wback],[data-wdone],[data-rmax],[data-claim],[data-play-name],[data-ptab],[data-save-limits],[data-exclude],[data-confirm-ok],[data-soon],[data-pv],[data-chips],[data-tg],[data-vcat],[data-back],[data-enter],[data-demo-play],[data-demo-tg],[data-full],.m__menu a');
    if(!t){ if(!e.target.closest('.menu')) closeMenus(); return; }
    var a = function(n){ return t.hasAttribute(n); };
    if(a('data-open')){ e.preventDefault(); openModal(t.getAttribute('data-open')); }
    else if(a('data-close')){ closeModal(); if(t.closest('.wstatus') && location.hash !== '#casino') location.hash = 'casino'; }
    else if(a('data-wallet')){ e.preventDefault(); var tab = t.getAttribute('data-wallet'); if(requireLogin(function(){ openModal('wallet', tab); })) openModal('wallet', tab); }
    else if(a('data-logout')){ e.preventDefault(); logout(); }
    else if(a('data-chat')){ e.preventDefault(); if(modalKind) closeModal(); openChat(); }
    else if(a('data-chat-close')){ closeChat(); }
    else if(a('data-q')){ userSay(t.getAttribute('data-q')); }
    else if(a('data-um-btn')){ var m1 = $('[data-um-menu]'); var o1 = m1.hidden; closeMenus(); m1.hidden = !o1; }
    else if(a('data-cur-btn')){ var m2 = $('[data-cur-menu]'); var o2 = m2.hidden; closeMenus(); m2.innerHTML = curMenu(); m2.hidden = !o2; }
    else if(a('data-cur-pick')){ store(CUR_KEY, t.getAttribute('data-cur-pick')); closeMenus(); renderBalance(); toast('Moneda: ' + cur()); }
    else if(a('data-copy')){ copy(t.getAttribute('data-copy')); }
    else if(a('data-apply-promo')){ if(requireLogin(function(){ openModal('promo'); })){ store(PROMO_KEY, PROMO_CODE); toast('Bono ' + PROMO_CODE + ' aplicado: +20% en tu próxima carga'); openModal('promo'); } }
    else if(a('data-wtab')){ var tb = t.getAttribute('data-wtab'); $$('[data-wtab]').forEach(function(b){ b.classList.toggle('is-on', b === t); }); $$('[data-wpanel]').forEach(function(p){ p.hidden = p.getAttribute('data-wpanel') !== tb; }); }
    else if(a('data-amt')){ var v = +t.getAttribute('data-amt'); $('[data-wcustom]').value = ''; wAmount(v, true); }
    else if(a('data-wnext')){ wStep(2); }
    else if(a('data-wback')){ walletStop(); wStep(1); }
    else if(a('data-wdone')){ wStep(3); }
    else if(a('data-rmax')){ $('[data-ramt]').value = getBalance().toLocaleString('es-AR'); }
    else if(a('data-claim')){ claim(t.getAttribute('data-claim')); }
    else if(a('data-play-name')){ var g = ALL.filter(function(x){ return x.name === t.getAttribute('data-play-name'); })[0]; if(g) play(g); }
    else if(a('data-ptab')){ location.hash = 'perfil/' + t.getAttribute('data-ptab'); }
    else if(a('data-save-limits')){ var lv = digits($('[data-limit]').value); store('wildcat:limit', lv ? String(lv) : null); store('wildcat:remind', $('[data-remind]').checked ? '1' : null); toast(lv ? 'Límite diario: ' + money(lv) : 'Límites guardados'); }
    else if(a('data-exclude')){ var d = $('[data-excl]'); var lbl = d.options[d.selectedIndex].text; askConfirm({title:'¿Autoexcluirte por ' + lbl + '?', text:'No vas a poder cargar ni jugar hasta que termine el período. Esta acción no se puede deshacer.', ok:'Sí, autoexcluirme'}, function(){ toast('Listo. Tu cuenta queda en pausa por ' + lbl + ' (demo)'); logout(); }); }
    else if(a('data-confirm-ok')){ var cb = confirmCb; confirmCb = null; closeModal(); if(cb) cb(); }
    else if(a('data-pv')){ var pvn = t.getAttribute('data-pv'); closeModal(); var go2 = function(){ var inp = $('[data-search]'); if(inp){ inp.value = pvn; inp.dispatchEvent(new Event('input', {bubbles:true})); var gr = $('#grid'); if(gr) gr.scrollIntoView({behavior:'smooth', block:'start'}); } }; if(location.hash !== '#casino'){ location.hash = 'casino'; setTimeout(go2, 60); } else go2(); }
    else if(a('data-back')){ if(history.length > 1) history.back(); else location.hash = 'casino'; }
    else if(a('data-enter')){ startGame(ALL[+t.getAttribute('data-enter')], false); }
    else if(a('data-demo-play')){ startGame(ALL[+t.getAttribute('data-demo-play')], true); }
    else if(a('data-demo-tg')){ var gi = +(location.hash.split('/')[1] || 0); var on = !$('[data-demo]').classList.contains('is-on'); if(on) startGame(ALL[gi], true); else { render(true); } }
    else if(a('data-full')){ var fr2 = $('#gframe'); if(fr2 && fr2.requestFullscreen) fr2.requestFullscreen(); else toast('Pantalla completa no disponible'); }
    else if(a('data-vcat')){ location.hash = 'vivo/' + t.getAttribute('data-vcat'); }
    else if(a('data-tg')){ e.preventDefault(); var g = t.closest('.side__grp'); var open = !g.classList.contains('is-open'); g.classList.toggle('is-open', open); t.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    else if(a('data-chips')){ var cc = $('#cchips'); cc.scrollBy({left:240, behavior:'smooth'}); }
    else if(a('data-soon')){ toast('Te mandamos un código por WhatsApp para confirmar el cambio (demo)'); }
    else if(a('data-rail')){ var r = $('#rail-' + t.getAttribute('data-rail')); r.scrollBy({left: r.clientWidth * .9 * +t.getAttribute('data-dir'), behavior:'smooth'}); }
    else if(a('data-cat')){ location.hash = 'casino/' + t.getAttribute('data-cat'); }
    else if(a('data-seo')){ var s = t.parentNode; s.classList.toggle('is-open'); $('span', t).textContent = s.classList.contains('is-open') ? 'Leer menos' : 'Leer más'; }
    else if(a('data-top')){ window.scrollTo({top:0, behavior:'smooth'}); }
    else if(a('data-acc')){ t.nextElementSibling.classList.toggle('is-open'); }
    else if(a('data-game')){ e.preventDefault(); play(ALL[+t.getAttribute('data-game')]); }
    else if(t.closest('.m__menu')){ if(!t.hasAttribute('data-logout')) closeModal(); }
  });
  document.addEventListener('submit', function(e){
    e.preventDefault();
    var f = e.target;
    if(f.id === 'chat-form'){ var i = $('#chat-input'); userSay(i.value); i.value = ''; return; }
    if(f.hasAttribute('data-rform')){
      var v = digits($('[data-ramt]').value), dest = $('[data-rdest]').value.trim(), okD = /^\d{22}$/.test(dest) || /^[a-z0-9.\-]{6,20}$/i.test(dest);
      var rh = $('[data-rhint]'), dh = $('[data-dhint]');
      rh.textContent = v < MIN ? 'El mínimo es ' + money(MIN) + '.' : v > getBalance() ? 'No tenés saldo suficiente.' : '';
      dh.textContent = okD ? 'Tiene que ser una cuenta a tu nombre.' : 'Revisá el alias (6 a 20 caracteres) o el CBU (22 números).';
      dh.classList.toggle('is-err', !okD);
      if(v < MIN || v > getBalance() || !okD) return;
      setBalance(getBalance() - v);
      addMove({type:'retiro', label:'Retiro a ' + dest, amount:v, status:'En proceso'});
      f.hidden = true; var st = $('[data-rstatus]'); st.hidden = false;
      st.innerHTML = '<span class="okc"><i class="ph-bold ph-check"></i></span><b>Pedimos tu retiro de ' + money(v) + '</b><small>Lo vas a recibir en ' + esc(dest) + ' en unos minutos. Saldo: ' + money(getBalance()) + ' ' + cur() + '.</small><button class="btn btn--sec btn--block btn--lg" type="button" data-close>Listo</button>';
      return;
    }
    var kind = f.getAttribute('data-form');
    login(kind === 'registro' ? '¡Cuenta creada! Ya podés cargar y jugar' : null);
  });
  document.addEventListener('input', function(e){
    var t = e.target;
    if(t.hasAttribute('data-wcustom')){ var v = digits(t.value); t.value = v ? v.toLocaleString('es-AR') : ''; wAmount(v, false); return; }
    if(t.hasAttribute('data-ramt') || t.hasAttribute('data-limit')){ var n = digits(t.value); t.value = n ? (t.hasAttribute('data-limit') ? '$' : '') + n.toLocaleString('es-AR') : ''; return; }
    if(!t.hasAttribute('data-search')) return;
    var q = t.value.trim().toLowerCase(), g = $('#grid');
    var list = q ? ALL.filter(function(x){ return (x.name + ' ' + x.pv).toLowerCase().indexOf(q) > -1; }) : ALL;
    g.innerHTML = list.length ? list.map(card).join('') : '<p style="color:var(--mut);grid-column:1/-1">No encontramos juegos con “' + esc(q) + '”.</p>';
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ if(modalKind) closeModal(); else if(!$('#chat').hidden) closeChat(); closeMenus(); } });

  applySession(); renderBalance(); if(logged()) bump('login', 1, true);
  render();
})();
