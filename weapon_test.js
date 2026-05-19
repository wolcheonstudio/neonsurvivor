(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const xpFill = document.getElementById('xpFill'), hpFill = document.getElementById('hpFill'), hpText = document.getElementById('hpText');
  const timeEl = document.getElementById('timeEl'), levelEl = document.getElementById('levelEl');
  
  // ============ ASSETS ============
  const ts = Date.now();
  const assets = { 
    player: new Image(), gas: new Image(), 
    amber: new Image(), emerald: new Image(), sapphire: new Image() 
  };
  assets.player.src = 'assets/player.png?' + ts; 
  assets.gas.src = 'assets/gas_capsule.png?' + ts;
  assets.amber.src = 'assets/enemy_amber.png?' + ts;
  assets.emerald.src = 'assets/enemy_emerald.png?' + ts;
  assets.sapphire.src = 'assets/enemy_sapphire.png?' + ts;

  // New Sounds
  const gunSound = new Audio('audio/gun.mp3'); gunSound.volume = 0.05;
  const snd2Way = new Audio('audio/2way.mp3'); snd2Way.volume = 0.1;
  const snd4Way = new Audio('audio/4way.mp3'); snd4Way.volume = 0.15;

  let W = 0, H = 0;
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = Math.floor(W * (9 / 21)); 
  }
  window.addEventListener('resize', resize);
  resize();

  // ============ TEST STATE ============
  const state = { running: true, time: 0, activeWeapon: 'base' };
  const player = { x: 0, y: 0, r: 32, hp: 1000, maxHp: 1000, speed: 300, level: 1, weapon: { damage: 50, fireRate: 5.0, cooldown: 0 } };
  const enemies = [], bullets = [], gems = [];

  // ============ GLOBAL TEST FUNCTIONS ============
  window.setWeapon = (type, btn) => {
    state.activeWeapon = type;
    document.querySelectorAll('.test-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('currentWep').textContent = type === 'base' ? '기본 (1방향)' : (type === '2way' ? '2방향 (앞뒤)' : '4방향 (십자)');
    document.getElementById('dmgMult').textContent = type === '4way' ? '70%' : '100%';
  };

  window.spawnWave = () => {
    for(let i=0; i<50; i++) {
      const ang = Math.random() * Math.PI * 2, dist = 500 + Math.random() * 300;
      enemies.push({
        x: player.x + Math.cos(ang) * dist, y: player.y + Math.sin(ang) * dist,
        r: 24, hp: 100, speed: 100, img: assets.amber, hitFlash: 0
      });
    }
  };

  function update(dt) {
    state.time += dt;
    let dx = 0, dy = 0;
    if (keys['w']) dy -= 1; if (keys['s']) dy += 1;
    if (keys['a']) dx -= 1; if (keys['d']) dx += 1;
    const mag = Math.hypot(dx, dy);
    if (mag > 0) { player.x += (dx / mag) * player.speed * dt; player.y += (dy / mag) * player.speed * dt; }

    player.weapon.cooldown -= dt;
    if (player.weapon.cooldown <= 0 && enemies.length > 0) {
      let closest = null, dSq = Infinity;
      enemies.forEach(e => { const d = (e.x-player.x)**2+(e.y-player.y)**2; if(d<dSq){dSq=d; closest=e;} });
      if (closest) fireWeapon(closest);
    }

    bullets.forEach((b, i) => {
      b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt;
      if (b.life <= 0) { bullets.splice(i,1); return; }
      for (let j=0; j<enemies.length; j++) {
        const e = enemies[j];
        if (Math.hypot(e.x-b.x, e.y-b.y) < e.r+5) { e.hp -= b.damage; e.hitFlash=0.1; bullets.splice(i,1); break; }
      }
    });

    enemies.forEach((e, i) => {
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      const d = Math.hypot(player.x-e.x, player.y-e.y);
      e.x += ((player.x-e.x)/d)*e.speed*dt; e.y += ((player.y-e.y)/d)*e.speed*dt;
      if (e.hp<=0) enemies.splice(i,1);
    });

    if (enemies.length < 5) spawnWave();
    updateHUD();
  }

  function fireWeapon(target) {
    const ang = Math.atan2(target.y-player.y, target.x-player.x);
    const mode = state.activeWeapon;
    let angles = [ang];
    let dmgMult = 1.0;
    let s;

    if (mode === '2way') {
      angles = [ang, ang + Math.PI];
      s = snd2Way;
    } else if (mode === '4way') {
      angles = [ang, ang + Math.PI/2, ang + Math.PI, ang + 3*Math.PI/2]; 
      dmgMult = 0.7;
      s = snd4Way;
    } else {
      s = gunSound;
    }

    angles.forEach(a => {
      bullets.push({x:player.x, y:player.y, vx:Math.cos(a)*800, vy:Math.sin(a)*800, damage:player.weapon.damage * dmgMult, life:1.5});
    });
    
    // Crisp Sound Logic
    s.pause();
    s.currentTime = 0;
    s.play().catch(()=>{});

    player.weapon.cooldown = 1/player.weapon.fireRate;
  }

  function render() {
    ctx.fillStyle = '#010208'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W/2 - player.x, H/2 - player.y);
    enemies.forEach(e => {
      ctx.save();
      if (e.hitFlash > 0) ctx.filter = 'brightness(3)';
      if (e.img.complete) ctx.drawImage(e.img, e.x - e.r, e.y - e.r, e.r * 2, e.r * 2);
      ctx.restore();
    });
    bullets.forEach(b => { ctx.fillStyle='#fbbf24'; ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI*2); ctx.fill(); });
    if (assets.player.complete) ctx.drawImage(assets.player, player.x - player.r, player.y - player.r, player.r * 2, player.r * 2);
    ctx.restore();
  }

  function updateHUD() {
    hpFill.style.width = (player.hp/player.maxHp)*100+'%';
    hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
    timeEl.textContent = `${Math.floor(state.time/60)}:${Math.floor(state.time%60).toString().padStart(2,'0')}`;
  }

  const keys = Object.create(null);
  document.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
  document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  function loop(t) { 
    const dt = Math.min(0.05, (t - (loop.last || t)) / 1000); 
    loop.last = t; update(dt); render(); requestAnimationFrame(loop); 
  }
  requestAnimationFrame(loop);
})();
