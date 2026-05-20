// VERSION: 출시버전 1 - 정식 배포용 (이어하기, 정책 문서 연동, Z/Q키 시스템 완성)
(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  
  // HUD Elements
  const xpFill = document.getElementById('xpFill'), hpFill = document.getElementById('hpFill'), hpText = document.getElementById('hpText');
  const timeEl = document.getElementById('timeEl'), levelEl = document.getElementById('levelEl'), coinsEl = document.getElementById('coinsEl');
  const ampCountEl = document.getElementById('ampCountEl'), atkVal = document.getElementById('atkVal'), spdVal = document.getElementById('spdVal');
  const startModal = document.getElementById('startModal'), gameoverModal = document.getElementById('gameoverModal'), levelupModal = document.getElementById('levelupModal'), shopModal = document.getElementById('shopModal');
  const pauseOverlay = document.getElementById('pauseOverlay'), resumeBtn = document.getElementById('resumeBtn'), manualSaveBtn = document.getElementById('manualSaveBtn');
  const bossWarning = document.getElementById('bossWarning');
  const startBtn = document.getElementById('startBtn'), restartBtn = document.getElementById('restartBtn'), reviveBtn = document.getElementById('reviveBtn');
  const startShopBtn = document.getElementById('startShopBtn'), gameOverShopBtn = document.getElementById('gameOverShopBtn');
  const upgradeList = document.getElementById('upgradeList'), shopList = document.getElementById('shopList'), weaponList = document.getElementById('weaponList');
  const pauseBtn = document.getElementById('pauseBtn'), closeShopBtn = document.getElementById('closeShopBtn'), gotoShopBtn = document.getElementById('gotoShopBtn');
  const volSlider = document.getElementById('volSlider'), sfxSlider = document.getElementById('sfxSlider'), muteBtn = document.getElementById('muteBtn');
  const volSliderPause = document.getElementById('volSliderPause'), sfxSliderPause = document.getElementById('sfxSliderPause');
  const tabConsumables = document.getElementById('tabConsumables'), tabWeapons = document.getElementById('tabWeapons');

  const bestTimeEl = document.getElementById('bestTime'), bestCoinsEl = document.getElementById('bestCoins');
  const currTimeEl = document.getElementById('currTime'), currCoinsEl = document.getElementById('currCoins');

  // ============ ASSETS ============
  const ts = Date.now();
  const assets = { 
    player: new Image(), gas: new Image(), amp: new Image(), coin: new Image(),
    amber: new Image(), emerald: new Image(), sapphire: new Image(), ruby: new Image(), amethyst: new Image(),
    scout: new Image(), scarab: new Image(), sylph: new Image(), mecha: new Image()
  };
  
  const bossImages = [];
  const bossFiles = ["boss_1.png", "boss_2.png", "boss_3.png", "boss_4.png", "boss_5.png", "boss_6.png", "boss_7.png", "boss_1.png", "boss_2.png", "boss_3.png"];
  bossFiles.forEach(file => { const img = new Image(); img.src = `assets/${file}?${ts}`; bossImages.push(img); });
  
  const bgFiles = [
    "Cosmic_nebula_with_stars_202605160934.jpeg", "Cosmic_nebula_with_stars_202605160935 (1).jpeg",
    "Cosmic_nebula_with_stars_202605160935.jpeg", "Cosmic_nebula_with_stars_202605160936.jpeg",
    "Cosmic_nebula_with_stars_202605160937.jpeg", "Cosmic_nebula_with_stars_202605160938.jpeg",
    "Cosmic_nebula_with_stars_202605160939.jpeg", "Cosmic_nebula_with_stars_202605160940.jpeg"
  ];
  const bgImages = bgFiles.map(file => { const img = new Image(); img.src = `CA/${file}?${ts}`; return img; });

  assets.player.src = 'assets/player.png?' + ts; assets.gas.src = 'assets/gas_capsule.png?' + ts; assets.amp.src = 'assets/ampoule.png?' + ts; assets.coin.src = 'assets/coin.png?' + ts;
  assets.amber.src = 'assets/enemy_amber.png?' + ts; assets.emerald.src = 'assets/enemy_emerald.png?' + ts; assets.sapphire.src = 'assets/enemy_sapphire.png?' + ts;
  assets.ruby.src = 'assets/enemy_ruby.png?' + ts; assets.amethyst.src = 'assets/enemy_amethyst.png?' + ts;
  assets.scout.src = 'assets/enemy_scout.png?' + ts; assets.scarab.src = 'assets/enemy_scarab.png?' + ts;
  assets.sylph.src = 'assets/enemy_sylph.png?' + ts; assets.mecha.src = 'assets/enemy_mecha.png?' + ts;

  // ============ AUDIO & BGM ============
  const gunSound = new Audio('audio/gun.mp3'); gunSound.load();
  const snd2WayFile = new Audio('audio/2way.mp3'); snd2WayFile.load();
  const snd4WayFile = new Audio('audio/4way.mp3'); snd4WayFile.load();
  const bossBomSound = new Audio('audio/bossbom.mp3'); 
  let sfxOn = true, bgmOn = true, sfxVol = 0.7;
  let bgMusic = new Audio(); bgMusic.loop = true;

  function updateAudioVolumes() {
    let bgmValue = 0.5;
    if (volSliderPause) bgmValue = parseFloat(volSliderPause.value);
    else if (volSlider) bgmValue = parseFloat(volSlider.value);
    
    let sfxValue = 0.4; // Softer default sfx multiplier
    if (sfxSliderPause) sfxValue = parseFloat(sfxSliderPause.value);
    else if (sfxSlider) sfxValue = parseFloat(sfxSlider.value);

    bgMusic.volume = bgmValue;
    sfxVol = sfxValue;
    
    // Nerfed SFX multipliers significantly to ensure a rich BGM and non-intrusive sound effects!
    gunSound.volume = sfxVol * 0.25; 
    snd2WayFile.volume = sfxVol * 0.35; 
    snd4WayFile.volume = sfxVol * 0.4; 
    bossBomSound.volume = sfxVol * 0.3;

    // Keep the sliders synchronized
    if (volSlider && volSliderPause) {
      volSlider.value = bgmValue;
      volSliderPause.value = bgmValue;
    }
    if (sfxSlider && sfxSliderPause) {
      sfxSlider.value = sfxValue;
      sfxSliderPause.value = sfxValue;
    }
  }

  let audioCtx = null;
  function ensureAudio() { 
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  const beep = (f, d, t = 'sine', v = 0.1, delay = 0) => { 
    if (!sfxOn) return; 
    setTimeout(() => { 
      ensureAudio();
      if (!audioCtx) return;
      try { 
        const osc = audioCtx.createOscillator(); const g = audioCtx.createGain(); 
        osc.type = t; osc.frequency.setValueAtTime(f, audioCtx.currentTime); 
        // sfxVol 연동
        const finalVol = v * sfxVol;
        g.gain.setValueAtTime(finalVol, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + d); 
        osc.connect(g); g.connect(audioCtx.destination); 
        osc.start(); osc.stop(audioCtx.currentTime + d); 
      } catch (e) { } 
    }, delay); 
  };
  const sndShoot = (mode) => { 
    const s = (mode === '2way' ? snd2WayFile : (mode === '4way' ? snd4WayFile : gunSound)).cloneNode();
    s.volume = sfxVol * (mode === '4way' ? 0.9 : 0.7);
    s.play();
  };
  const sndHit = () => beep(150, 0.05, 'square', 0.03);
  const sndKill = () => beep(100, 0.1, 'sawtooth', 0.05);
  const sndBossDeath = () => { for (let i = 0; i < 5; i++) beep(80 - i * 10, 0.5, 'sawtooth', 0.2, i * 150); bossBomSound.cloneNode().play(); };
  const sndGem = () => beep(800 + Math.random() * 400, 0.05, 'sine', 0.03);
  const sndHeal = () => beep(1200, 0.2, 'sine', 0.05);
  const bgmFiles = ["neon_110_1.mp3", "neon_110_2.mp3", "neon_110_3.mp3", "neon_110_4.mp3", "neon_120_1.mp3", "neon_120_2.mp3", "neon_130_1.mp3", "neon_145_1.mp3", "neon_160_1.mp3"];
  // Seed playlist index daily: unique starting song every calendar day!
  let bgmIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % bgmFiles.length;
  function pickNextBGM() {
    const file = bgmFiles[bgmIndex % bgmFiles.length];
    bgmIndex++;
    bgMusic.src = `audio/${file}`;
    bgMusic.load();
  }

  let W = 0, H = 0;
  function resize() {
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 1024;
    if (document.body.classList.contains('playing') && isMobileDevice) {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      canvas.parentElement.style.width = '100vw';
      canvas.parentElement.style.height = '100vh';
    } else {
      W = canvas.width = window.innerWidth;
      H = canvas.height = Math.floor(W * (10 / 16)); 
      canvas.parentElement.style.height = H + 'px';
      canvas.parentElement.style.width = '100vw';
    }
  }
  window.addEventListener('resize', resize); resize();

  // ============ SECURITY ENGINE ============
  const S_KEY = "N30N_V1CT0RY_2026_STABLE";
  const SECURE_KEYS = { DATA: 'ns_save_v3', HASH: 'ns_hash_v3', SESSION: 'ns_session_v3', SESSION_HASH: 'ns_session_hash_v3' };
  const SecureStore = {
    encrypt(str) { return btoa(encodeURIComponent(str)); },
    decrypt(str) { try { return decodeURIComponent(atob(str)); } catch(e) { return null; } },
    getHash(str) { let hash = 0; for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; } return hash.toString(16); },
    save(obj) { const j = JSON.stringify(obj), e = this.encrypt(j); if (e) { localStorage.setItem(SECURE_KEYS.DATA, e); localStorage.setItem(SECURE_KEYS.HASH, this.getHash(j)); } },
    load() { try { const e = localStorage.getItem(SECURE_KEYS.DATA), h = localStorage.getItem(SECURE_KEYS.HASH); if (!e || !h) return null; const j = this.decrypt(e); if (j && this.getHash(j) === h) return JSON.parse(j); } catch(e) {} return null; },
    saveSession(obj) { const j = JSON.stringify(obj), e = this.encrypt(j); if (e) { localStorage.setItem(SECURE_KEYS.SESSION, e); localStorage.setItem(SECURE_KEYS.SESSION_HASH, this.getHash(j)); } },
    loadSession() { try { const e = localStorage.getItem(SECURE_KEYS.SESSION), h = localStorage.getItem(SECURE_KEYS.SESSION_HASH); if (!e || !h) return null; const j = this.decrypt(e); if (j && this.getHash(j) === h) return JSON.parse(j); } catch(e) {} return null; },
    clearSession() { localStorage.removeItem(SECURE_KEYS.SESSION); localStorage.removeItem(SECURE_KEYS.SESSION_HASH); }
  };

  const DEFAULT_IAP = { purchasedWeapons: ["base"], activeWeapon: "base", adsRemoved: false, playCount: 0 };
  let IAP_DATA = SecureStore.load() || DEFAULT_IAP;
  // Ensure basic structure exists
  if (!IAP_DATA.purchasedWeapons) IAP_DATA.purchasedWeapons = ["base"];
  if (!IAP_DATA.activeWeapon) IAP_DATA.activeWeapon = "base";
  
  function saveIAP() { SecureStore.save(IAP_DATA); }

  // ============ UI EVENTS ============
  if(volSlider) volSlider.oninput = () => { if(volSliderPause) volSliderPause.value = volSlider.value; updateAudioVolumes(); };
  if(sfxSlider) sfxSlider.oninput = () => { if(sfxSliderPause) sfxSliderPause.value = sfxSlider.value; updateAudioVolumes(); };
  if(volSliderPause) volSliderPause.oninput = () => { if(volSlider) volSlider.value = volSliderPause.value; updateAudioVolumes(); };
  if(sfxSliderPause) sfxSliderPause.oninput = () => { if(sfxSlider) sfxSlider.value = sfxSliderPause.value; updateAudioVolumes(); };
  
  let shopSource = 'start'; 

  const playNowBtn = document.getElementById('playNowBtn');
  const landingPage = document.getElementById('landingPage');
  if (playNowBtn) {
    playNowBtn.onclick = (e) => {
      e.preventDefault();
      if (landingPage) landingPage.style.display = 'none';
      startModal.classList.remove('hidden');
      document.getElementById('game-section').scrollIntoView({ behavior: 'smooth' });
    };
  }

  if (startShopBtn) startShopBtn.onclick = () => { 
    shopSource = 'start';
    startModal.classList.add('hidden'); 
    tabWeapons.click(); 
    shopModal.classList.remove('hidden'); 
    document.body.classList.add('shop-open');
    closeShopBtn.textContent = t('back_to_shop');
  };
  if (gameOverShopBtn) gameOverShopBtn.onclick = () => { 
    shopSource = 'gameover';
    gameoverModal.classList.add('hidden'); 
    tabWeapons.click(); 
    shopModal.classList.remove('hidden'); 
    document.body.classList.add('shop-open');
    closeShopBtn.textContent = t('back_to_shop');
  };
  if (gotoShopBtn) gotoShopBtn.onclick = () => { 
    shopSource = 'levelup';
    levelupModal.classList.add('hidden'); 
    tabConsumables.click(); 
    shopModal.classList.remove('hidden'); 
    document.body.classList.add('shop-open');
    closeShopBtn.textContent = t('back_to_shop');
  };
  if (closeShopBtn) closeShopBtn.onclick = () => { 
    shopModal.classList.add('hidden'); 
    document.body.classList.remove('shop-open');
    if (shopSource === 'start') startModal.classList.remove('hidden');
    else if (shopSource === 'gameover') gameoverModal.classList.remove('hidden');
    else if (shopSource === 'levelup') levelupModal.classList.remove('hidden');
  };

  pauseBtn.onclick = () => { 
    if (state.running && !state.gameOver) { 
      state.paused = !state.paused; 
      pauseBtn.textContent = state.paused ? '▶' : '⏸'; 
      if (state.paused) { 
        bgMusic.pause(); 
        document.body.classList.add('paused'); 
        pauseOverlay.classList.remove('hidden');
      } else { 
        if (bgmOn) bgMusic.play(); 
        document.body.classList.remove('paused'); 
        pauseOverlay.classList.add('hidden');
      } 
    } 
    pauseBtn.blur(); 
  };
  if (resumeBtn) resumeBtn.onclick = () => pauseBtn.click();
  if (manualSaveBtn) manualSaveBtn.onclick = () => {
    saveCurrentSession();
    const originalText = manualSaveBtn.textContent;
    manualSaveBtn.textContent = t('save_complete');
    manualSaveBtn.style.borderColor = "#22c55e";
    manualSaveBtn.style.color = "#22c55e";
    beep(800, 0.1, 'sine', 0.1);
    setTimeout(() => {
      manualSaveBtn.textContent = originalText;
      manualSaveBtn.style.borderColor = "var(--accent-amber)";
      manualSaveBtn.style.color = "var(--accent-amber)";
    }, 2000);
  };
  const saveAndExitBtn = document.getElementById('saveAndExitBtn');
  if (saveAndExitBtn) {
    saveAndExitBtn.onclick = () => {
      saveCurrentSession();
      if (bgMusic) bgMusic.pause();
      state.paused = false;
      state.running = false;
      document.body.classList.remove('playing');
      document.body.classList.remove('lock-scroll');
      document.body.classList.remove('paused');
      document.documentElement.classList.remove('playing');
      if (pauseOverlay) pauseOverlay.classList.add('hidden');
      if (pauseBtn) pauseBtn.textContent = '⏸';
      const hero = document.getElementById('hero');
      if (hero) hero.scrollIntoView({ behavior: 'smooth' });
      setTimeout(checkSession, 100);
    };
  }
  tabConsumables.onclick = () => { tabConsumables.classList.add('active'); tabWeapons.classList.remove('active'); shopList.classList.remove('hidden'); weaponList.classList.add('hidden'); renderShop(); };
  tabWeapons.onclick = () => { tabWeapons.classList.add('active'); tabConsumables.classList.remove('active'); weaponList.classList.remove('hidden'); shopList.classList.add('hidden'); renderWeaponShop(); };

  // ============ GAME LOGIC ============
  const state = { running: false, paused: false, gameOver: false, time: 0, shake: 0, flash: 0, isBossDefeated: false, bossSpawnedLevel: 0, isAttractingBossLoot: false, bossWarningActive: false, focusMode: false };
  const player = { x: 0, y: 0, r: 32, hp: 100, maxHp: 100, speed: 280, coins: 0, xp: 0, level: 1, xpNeeded: 3, magnet: 120, iframe: 0, weapon: { damage: 10, fireRate: 3.0, cooldown: 0 }, ampoules: { small: 0, medium: 0, large: 0, giant: 0 } };
  const enemies = [], bullets = [], gems = [], enemyBullets = [];
  let spawnAccum = 0;
  const touchState = { active: false, startX: 0, startY: 0, dx: 0, dy: 0 };

  function update(dt) {
    if (!state.running || state.paused || state.gameOver) return;
    state.time += dt;
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1; if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1; if (keys['d'] || keys['arrowright']) dx += 1;
    
    // Add mobile touch vectors
    if (touchState.active) {
      dx += touchState.dx;
      dy += touchState.dy;
    }

    const mag = Math.hypot(dx, dy); 
    if (mag > 0) { 
      const moveSpeed = state.focusMode ? player.speed * 0.6 : player.speed;
      const factor = touchState.active ? Math.min(1, mag) : 1;
      player.x += (dx / mag) * moveSpeed * factor * dt; 
      player.y += (dy / mag) * moveSpeed * factor * dt; 
    }
    player.iframe = Math.max(0, player.iframe - dt); player.weapon.cooldown -= dt;
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
        if (Math.hypot(e.x-b.x, e.y-b.y) < e.r + (b.r || 5)) { 
          e.hp -= b.damage; e.hitFlash=0.1; sndHit(); bullets.splice(i,1); break; 
        } 
      } 
    });

    enemyBullets.forEach((b, i) => {
      b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt;
      if (b.life <= 0) { enemyBullets.splice(i,1); return; }
      const d = Math.hypot(player.x - b.x, player.y - b.y);
      if (player.iframe <= 0 && d < player.r + b.r) {
        player.hp -= b.damage;
        player.iframe = 0.4;
        state.shake = 15;
        state.flash = 0.2;
        beep(150, 0.1, 'square', 0.1);
        enemyBullets.splice(i, 1);
      }
    });
    const isBossActive = enemies.some(e => e.isBoss);
    enemies.forEach((e, i) => {
      e.hitFlash = Math.max(0, e.hitFlash - dt); 
      const d = Math.hypot(player.x-e.x, player.y-e.y);
      
      // Separation Logic: Prevents clumping
      enemies.forEach(other => {
        if (e === other || e.isBoss || other.isBoss) return;
        const distEnemies = Math.hypot(e.x - other.x, e.y - other.y);
        const minDist = e.r + other.r;
        if (distEnemies < minDist) {
          const force = (minDist - distEnemies) * 0.05;
          const angSep = Math.atan2(e.y - other.y, e.x - other.x);
          e.x += Math.cos(angSep) * force;
          e.y += Math.sin(angSep) * force;
        }
      });

      // Repositioning Logic: Warp enemies that are too far away to maintain density
      if (!e.isBoss && d > 1300) {
        const wrapAng = Math.random() * Math.PI * 2;
        e.x = player.x + Math.cos(wrapAng) * 950;
        e.y = player.y + Math.sin(wrapAng) * 950;
      }

      if (e.isBoss) {
        e.aiTimer = (e.aiTimer || 0) + dt;
        e.fireCooldown = (e.fireCooldown || 0) - dt;
        if (e.fireCooldown <= 0) {
          fireBossWeapon(e);
          e.fireCooldown = Math.max(0.6, 2.0 - player.level * 0.03); 
        }
        const phase = Math.floor(e.aiTimer / 4) % 2;
        if (phase === 0) {
            e.x += ((player.x-e.x)/d)*e.speed*1.5*dt; 
            e.y += ((player.y-e.y)/d)*e.speed*1.5*dt;
        } else {
            const ang = Math.atan2(e.y-player.y, e.x-player.x) + 0.5 * dt;
            const targetX = player.x + Math.cos(ang) * 350;
            const targetY = player.y + Math.sin(ang) * 350;
            e.x += (targetX - e.x) * dt;
            e.y += (targetY - e.y) * dt;
        }
      } else {
        e.x += ((player.x-e.x)/d)*e.speed*dt; e.y += ((player.y-e.y)/d)*e.speed*dt;
      }
      if (player.iframe<=0 && d < e.r+player.r) { player.hp -= 10; player.iframe=0.5; state.shake=10; }
      if (e.hp<=0) { sndKill(); if (e.isBoss) { sndBossDeath(); spawnBossDrop(e.x, e.y); state.isBossDefeated = true; state.shake = 60; state.flash = 0.5; setTimeout(() => { state.isAttractingBossLoot = true; }, 500); setTimeout(() => { state.isAttractingBossLoot = false; if (player.level % 10 === 0) { player.xp = player.xpNeeded; checkLevelUp(); } }, 3000); } else { if (isBossActive) { gems.push({x:e.x, y:e.y, isCoin:true, value:30, vx:(Math.random()-0.5)*100, vy:(Math.random()-0.5)*100}); } else { gems.push({x:e.x, y:e.y, xp:1, vx:(Math.random()-0.5)*100, vy:(Math.random()-0.5)*100}); } } enemies.splice(i,1); player.coins += e.isBoss ? player.level * 500 : (isBossActive ? 0 : 10); }
    });
    gems.forEach((g, i) => { const d = Math.hypot(player.x-g.x, player.y-g.y); const suctionRange = state.isAttractingBossLoot ? 5000 : player.magnet; if (d < suctionRange) { const force = state.isAttractingBossLoot ? 2500 : 1500; g.vx += ((player.x-g.x)/d)*force*dt; g.vy += ((player.y-g.y)/d)*force*dt; } g.vx*=0.85; g.vy*=0.85; g.x += g.vx*dt; g.y += g.vy*dt; if (d < player.r+15) { if (g.isAmp) { player.ampoules[g.type]++; beep(1000, 0.1, 'sine', 0.05); } else if (g.isCoin) { player.coins += g.value; beep(900, 0.08, 'sine', 0.05); } else { player.xp+=g.xp; sndGem(); } gems.splice(i,1); checkLevelUp(); } });
    const isBossLevel = player.level % 10 === 0; 
    spawnAccum += dt; 
    // Accelerated spawn rate for more tension, kept at 1.5s during boss battles
    let spawnRate = isBossActive ? 1.5 : (1.2 / (1 + player.level * 0.18));
    
    if (player.level === 2) spawnRate *= 1.6; 

    // Increased enemy cap to 40
    if (enemies.length >= 40) spawnRate = 999; 
    
    if (state.bossWarningActive) spawnRate = 999;
    if (spawnAccum > spawnRate) {
      spawnAccum = 0; 
      const ang = Math.random() * Math.PI * 2;
      const boss = enemies.find(e => e.isBoss);
      const isBossLevel = player.level % 10 === 0;
      
      // Target position: screen edge normally, but near boss during boss fights
      let dist = isBossLevel ? 500 : (Math.max(W, H) * 0.8 + 450);
      let spawnX = player.x + Math.cos(ang) * dist;
      let spawnY = player.y + Math.sin(ang) * dist;

      if (boss) {
        const guardAng = Math.random() * Math.PI * 2;
        const spawnDist = boss.r + 100 + Math.random() * 150;
        spawnX = boss.x + Math.cos(guardAng) * spawnDist;
        spawnY = boss.y + Math.sin(guardAng) * spawnDist;
      }

      if (isBossLevel && state.bossSpawnedLevel !== player.level && !state.bossWarningActive) { 
        state.bossWarningActive = true; bossWarning.classList.remove('hidden'); beep(50, 2, 'sawtooth', 0.1); 
        setTimeout(() => { 
          state.bossWarningActive = false; bossWarning.classList.add('hidden'); state.bossSpawnedLevel = player.level; 
          const bossIdx = Math.min(9, Math.floor(player.level / 10) - 1);
          const bx = player.x + Math.cos(ang) * 500;
          const by = player.y + Math.sin(ang) * 500;
          
          // Spawn the Boss (Speed upgraded to 100 + 3*level for a faster, challenging experience)
          enemies.push({ x: bx, y: by, r: 120 + (player.level * 2), hp: 300 + (player.level * 70), maxHp: 300 + (player.level * 70), speed: 100 + (player.level * 3), img: bossImages[bossIdx], isBoss: true, hitFlash: 0 });
          
          // Spawn 7-10 Guards near boss (with boosted speed and even spacing)
          const guardCount = 7 + Math.floor(Math.random() * 4);
          for (let i = 0; i < guardCount; i++) {
            const ga = (Math.PI * 2 / guardCount) * i;
            const variants = [assets.amber, assets.emerald, assets.sapphire, assets.ruby, assets.amethyst];
            const guardDist = 120 + (player.level * 2) + 80;
            enemies.push({ 
              x: bx + Math.cos(ga) * guardDist, y: by + Math.sin(ga) * guardDist, 
              r: 20, hp: 40 * (1 + player.level * 0.1), maxHp: 40 * (1 + player.level * 0.1), 
              speed: 160, img: variants[Math.floor(Math.random() * variants.length)], hitFlash: 0 
            });
          }
        }, 2000);
      } else if (!state.bossWarningActive && (!isBossLevel || state.bossSpawnedLevel === player.level)) {
        const variants = [assets.amber, assets.emerald, assets.sapphire, assets.ruby, assets.amethyst, assets.scout, assets.scarab, assets.sylph, assets.mecha];
        const img = variants[Math.floor(Math.random() * variants.length)];
        
        const sizeType = Math.random(); 
        let r = 24, hpMult = 1, speedMult = 1; 
        let sProb = 0.9, mProb = 0.1;
        if (player.level >= 5) { sProb = 0.7; mProb = 0.25; }
        if (player.level >= 10) { sProb = 0.5; mProb = 0.4; }

        if (sizeType < sProb) { r = 18; hpMult = 0.6; speedMult = 1.3; } 
        else if (sizeType < sProb + mProb) { r = 24; hpMult = 0.9; speedMult = 1.0; }
        else { r = 45; hpMult = 3.5; speedMult = 0.6; } 

        const hp = 35 * (1 + (player.level-1)*0.08) * hpMult; 
        const speed = 90 * speedMult * (isBossActive ? 1.6 : 1.0);
        enemies.push({ x: spawnX, y: spawnY, r: r, hp: hp, maxHp: hp, speed: speed, img: img, hitFlash: 0 });
      }
    }
    state.shake *= 0.9; state.flash = Math.max(0, state.flash - dt); updateHUD(); 
    
    if (player.hp <= 0) gameOver();
  }

  function saveCurrentSession() {
    if (!state.running || state.gameOver) return;
    const sessionData = {
      player: { ...player },
      state: { time: state.time, bossSpawnedLevel: state.bossSpawnedLevel }
    };
    SecureStore.saveSession(sessionData);

    // Show visual feedback on HUD
    const msg = document.createElement('div');
    msg.style.position = 'absolute'; msg.style.top = '150px'; msg.style.left = '50%'; msg.style.transform = 'translateX(-50%)';
    msg.style.color = 'var(--accent-amber)'; msg.style.fontWeight = '900'; msg.style.fontSize = '1.5rem'; msg.style.textShadow = '0 0 10px #000';
    msg.textContent = `💾 데이터 저장됨`;
    document.getElementById('game-wrapper').appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
  }

  function fireWeapon(target) {
    const ang = Math.atan2(target.y-player.y, target.x-player.x);
    const mode = IAP_DATA.activeWeapon; 
    let angles = [ang], dmgMult = 1.0;
    
    // Focus Mode (Z key)
    if (state.focusMode) {
      if (mode === '2way') dmgMult = 2.0;
      else if (mode === '4way') dmgMult = 3.2; // 0.8 * 4
      angles = [ang];
    } else {
      if (mode === '2way') angles = [ang, ang + Math.PI]; 
      else if (mode === '4way') { angles = [ang, ang + Math.PI/2, ang + Math.PI, ang + 3*Math.PI/2]; dmgMult = 0.8; }
    }
    
    angles.forEach(a => { 
      bullets.push({
        x:player.x, y:player.y, 
        vx:Math.cos(a)*800, vy:Math.sin(a)*800, 
        damage:player.weapon.damage * dmgMult, 
        r: state.focusMode ? 12 : 5,
        life:1.5
      }); 
    });
    sndShoot(mode); player.weapon.cooldown = 1/player.weapon.fireRate;
  }

  function fireBossWeapon(e) {
    const baseAngle = Math.atan2(player.y - e.y, player.x - e.x);
    beep(250, 0.08, 'sawtooth', 0.04);
    
    if (player.level <= 10) {
      // Level 10 Boss: 3-Way Spread
      const angles = [baseAngle - 0.25, baseAngle, baseAngle + 0.25];
      angles.forEach(a => {
        enemyBullets.push({
          x: e.x, y: e.y,
          vx: Math.cos(a) * 350, vy: Math.sin(a) * 350,
          r: 8, damage: 15, life: 3.5
        });
      });
    } else if (player.level <= 20) {
      // Level 20 Boss: 4-Way Cross
      for (let i = 0; i < 4; i++) {
        const a = baseAngle + (Math.PI / 2) * i;
        enemyBullets.push({
          x: e.x, y: e.y,
          vx: Math.cos(a) * 400, vy: Math.sin(a) * 400,
          r: 8, damage: 20, life: 3.5
        });
      }
    } else if (player.level <= 30) {
      // Level 30 Boss: 8-Bullet Ring
      for (let i = 0; i < 8; i++) {
        const a = baseAngle + (Math.PI / 4) * i;
        enemyBullets.push({
          x: e.x, y: e.y,
          vx: Math.cos(a) * 420, vy: Math.sin(a) * 420,
          r: 10, damage: 25, life: 3.5
        });
      }
    } else if (player.level <= 40) {
      // Level 40 Boss: Alternate Spiral Pattern
      const rot = (e.aiTimer || 0) * 1.5;
      for (let i = 0; i < 6; i++) {
        const a = rot + (Math.PI / 3) * i;
        enemyBullets.push({
          x: e.x, y: e.y,
          vx: Math.cos(a) * 450, vy: Math.sin(a) * 450,
          r: 9, damage: 30, life: 4.0
        });
      }
    } else {
      // Level 50+ Boss: Mega Ring (12 Bullets) + Targeted Sniper Bullet
      for (let i = 0; i < 12; i++) {
        const a = baseAngle + (Math.PI / 6) * i;
        enemyBullets.push({
          x: e.x, y: e.y,
          vx: Math.cos(a) * 450, vy: Math.sin(a) * 450,
          r: 10, damage: 35, life: 4.0
        });
      }
      enemyBullets.push({
        x: e.x, y: e.y,
        vx: Math.cos(baseAngle) * 650, vy: Math.sin(baseAngle) * 650,
        r: 12, damage: 45, life: 3.0, isSniper: true
      });
    }
  }

  function spawnBossDrop(x, y) { ['small', 'medium', 'large'].forEach((t, i) => { gems.push({ x: x + (i - 1) * 40, y: y, isAmp: true, type: t, vx: (Math.random() - 0.5) * 600, vy: (Math.random() - 0.5) * 600 }); }); const totalXp = 3 + player.level * 5, gemCount = 10, xpPerGem = totalXp / gemCount; for (let i = 0; i < gemCount; i++) { gems.push({ x: x, y: y, xp: xpPerGem, vx: (Math.random() - 0.5) * 800, vy: (Math.random() - 0.5) * 800 }); } }
  function drawSprite(img, x, y, r, hitFlash=0) { if (!img || !img.complete || img.naturalWidth === 0) { ctx.fillStyle='#f00'; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); return; } ctx.save(); ctx.beginPath(); ctx.arc(x, y, r * 1.2, 0, Math.PI * 2); ctx.clip(); if (hitFlash > 0) ctx.filter = 'brightness(3)'; ctx.drawImage(img, x - r, y - r, r * 2, r * 2); ctx.restore(); }

  function render() {
    ctx.fillStyle = '#010208'; ctx.fillRect(0, 0, W, H);
    const bgIndex = Math.floor((player.level - 1) / 5) % bgImages.length, currentBg = bgImages[bgIndex];
    if (currentBg && currentBg.complete) { ctx.globalAlpha = 0.4; const s = Math.max(W / currentBg.width, H / currentBg.height) * 1.5, bw = currentBg.width * s, bh = currentBg.height * s, bx = (W - bw) / 2 - (player.x * 0.2) % bw, by = (H - bh) / 2 - (player.y * 0.2) % bh; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) ctx.drawImage(currentBg, bx + i * bw, by + j * bh, bw, bh); ctx.globalAlpha = 1.0; }
    const grid = 100, gx = (W/2 - player.x) % grid, gy = (H/2 - player.y) % grid; ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)'; ctx.beginPath(); for (let x = gx; x < W; x += grid) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = gy; y < H; y += grid) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
    ctx.save(); ctx.translate(W/2 - player.x + (Math.random()-0.5)*state.shake, H/2 - player.y + (Math.random()-0.5)*state.shake);
    gems.forEach(g => { if (g.isAmp) drawSprite(assets.amp, g.x, g.y, 15); else if (g.isCoin) drawSprite(assets.coin, g.x, g.y, 15); else drawSprite(assets.gas, g.x, g.y, 15); });
    enemies.forEach(e => { drawSprite(e.img, e.x, e.y, e.r, e.hitFlash); ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(e.x-e.r, e.y-e.r-15, e.r*2, 6); ctx.fillStyle=e.isBoss ? '#f59e0b' : '#ef4444'; ctx.fillRect(e.x-e.r, e.y-e.r-15, e.r*2*(e.hp/e.maxHp), 6); });
    bullets.forEach(b => { ctx.fillStyle='#fbbf24'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r || 5, 0, Math.PI*2); ctx.fill(); });
    enemyBullets.forEach(b => {
      ctx.fillStyle = b.isSniper ? '#f43f5e' : '#ec4899';
      ctx.shadowBlur = 10;
      ctx.shadowColor = b.isSniper ? '#f43f5e' : '#ec4899';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    drawSprite(assets.player, player.x, player.y, player.r); 

    
    // Focus Aura
    if (state.focusMode) {
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'var(--accent-cyan)';
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    ctx.restore();
  }

  function loop(t) { const dt = Math.min(0.05, (t - (loop.last || t)) / 1000); loop.last = t; update(dt); render(); requestAnimationFrame(loop); }
  function updateHUD() { xpFill.style.width = (player.xp/player.xpNeeded)*100+'%'; hpFill.style.width = (player.hp/player.maxHp)*100+'%'; hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`; timeEl.textContent = formatTime(state.time); levelEl.textContent = player.level; coinsEl.textContent = player.coins; ampCountEl.textContent = player.ampoules.small + player.ampoules.medium + player.ampoules.large + player.ampoules.giant; if (atkVal) atkVal.textContent = player.weapon.damage.toFixed(1); if (spdVal) spdVal.textContent = player.speed.toFixed(0); }
  function formatTime(s) { return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`; }
  function useAmpoule() { let amount = 0; if (player.ampoules.giant > 0) { amount = 200; player.ampoules.giant--; } else if (player.ampoules.large > 0) { amount = 150; player.ampoules.large--; } else if (player.ampoules.medium > 0) { amount = 100; player.ampoules.medium--; } else if (player.ampoules.small > 0) { amount = 50; player.ampoules.small--; } if (amount > 0) { player.hp = Math.min(player.maxHp, player.hp + amount); sndHeal(); updateHUD(); } }

  const keys = Object.create(null);

  // ============ MOBILE TOUCH LISTENERS ============
  const mobileControls = document.getElementById('mobile-controls');
  const joystickZone = document.getElementById('joystick-zone');
  const joystickStick = document.getElementById('joystick-stick');
  const btnTouchSwap = document.getElementById('btn-touch-swap');
  const btnTouchFocus = document.getElementById('btn-touch-focus');
  const btnTouchHeal = document.getElementById('btn-touch-heal');

  if (('ontouchstart' in window) || navigator.maxTouchPoints > 0) {
    if (mobileControls) mobileControls.classList.remove('hidden');
  }

  if (joystickZone && joystickStick) {
    joystickZone.addEventListener('touchstart', e => {
      e.preventDefault();
      ensureAudio();
      const touch = e.touches[0];
      const rect = joystickZone.getBoundingClientRect();
      touchState.active = true;
      touchState.startX = rect.left + rect.width / 2;
      touchState.startY = rect.top + rect.height / 2;
      touchState.maxDist = rect.width * 0.35;
    });

    joystickZone.addEventListener('touchmove', e => {
      if (!touchState.active) return;
      e.preventDefault();
      const touch = e.touches[0];
      let deltaX = touch.clientX - touchState.startX;
      let deltaY = touch.clientY - touchState.startY;
      const distance = Math.hypot(deltaX, deltaY);
      const maxDistance = touchState.maxDist || 50;
      if (distance > maxDistance) {
        deltaX = (deltaX / distance) * maxDistance;
        deltaY = (deltaY / distance) * maxDistance;
      }
      joystickStick.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      touchState.dx = deltaX / maxDistance;
      touchState.dy = deltaY / maxDistance;
    });

    const resetJoystick = () => {
      touchState.active = false;
      touchState.dx = 0;
      touchState.dy = 0;
      joystickStick.style.transform = 'translate(0px, 0px)';
    };

    joystickZone.addEventListener('touchend', resetJoystick);
    joystickZone.addEventListener('touchcancel', resetJoystick);
  }

  if (btnTouchSwap) {
    btnTouchSwap.addEventListener('touchstart', e => {
      e.preventDefault();
      ensureAudio();
      if (state.running && !state.gameOver) toggleWeapon();
    });
  }

  if (btnTouchFocus) {
    btnTouchFocus.addEventListener('touchstart', e => {
      e.preventDefault();
      ensureAudio();
      if (state.running && !state.gameOver) {
        const mode = IAP_DATA.activeWeapon;
        if (mode === 'base') {
          alert(window.currentLang === 'ko' ? "🎯 집중포화(FOCUS) 스킬은 상점에서 '2방향' 또는 '4방향' 전술 무기를 구매하여 장착했을 때만 사용할 수 있습니다!" : "🎯 FOCUS mode can only be activated after purchasing and equipping a premium '2-Way' or '4-Way' weapon from the Shop!");
          return;
        }
        state.focusMode = !state.focusMode;
        btnTouchFocus.classList.toggle('active-focus', state.focusMode);
      }
    });
  }

  if (btnTouchHeal) {
    btnTouchHeal.addEventListener('touchstart', e => {
      e.preventDefault();
      ensureAudio();
      if (state.running && !state.gameOver && !state.paused) useAmpoule();
    });
  }

  const mobileSoundBtn = document.getElementById('mobile-sound-btn');
  if (mobileSoundBtn && pauseBtn) {
    const handleSoundClick = (e) => {
      e.preventDefault();
      ensureAudio();
      pauseBtn.click();
    };
    mobileSoundBtn.addEventListener('touchstart', handleSoundClick);
    mobileSoundBtn.addEventListener('click', handleSoundClick);
  }
  document.addEventListener('keydown', e => { 
    ensureAudio(); 
    const key = e.key.toLowerCase(); 
    if (['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d'].includes(key)) { 
      if (state.running && !state.paused) e.preventDefault(); 
    } 
    keys[key] = true; 
    if (key === 'enter') { 
      if (!state.running) window.startGame(); 
      else if (!state.gameOver) pauseBtn.click(); 
    } 
    else if (key === 'z') {
      const mode = IAP_DATA.activeWeapon;
      if (mode !== 'base') {
        state.focusMode = true;
      }
    }
    else if (key === 'q') {
      if (state.running && !state.gameOver) toggleWeapon();
    }
    else if (state.running && !state.gameOver) { 
      if (key === ' ' && !state.paused) useAmpoule(); 
    } 
  });
  document.addEventListener('keyup', e => { 
    const key = e.key.toLowerCase();
    keys[key] = false; 
    if (key === 'z') state.focusMode = false;
  });

  function checkLevelUp() { 
    if (state.gameOver || state.paused) return;
    if (player.xp >= player.xpNeeded) { 
      if (player.level % 10 === 0 && enemies.some(e => e.isBoss)) return; 
      xpFill.style.width = '100%';
      showLevelUpModal(); 
    } 
  }
  
  function showLevelUpModal() {
    state.paused = true; bgMusic.pause(); document.body.classList.add('level-up'); upgradeList.innerHTML = '';
    const has2way = IAP_DATA.purchasedWeapons.includes('2way'), has4way = IAP_DATA.purchasedWeapons.includes('4way');
    if (!has2way || !has4way) {
      const h = document.createElement('div'); h.innerHTML = `<div style="color:var(--accent-amber); font-weight:900; margin-bottom:12px; font-size:1rem; text-shadow:0 0 10px rgba(245,158,11,0.5);">${t('upg_premium')}</div>`; upgradeList.appendChild(h);
      
      const pRow = document.createElement('div'); pRow.className = 'upgrade-row-layout';
      if (!has2way) createPurchaseBtn('2way', t('upg_2way'), t('upg_2way_desc'), pRow);
      if (!has4way) { const price = has2way ? '$1.00' : '$1.99', sub = has2way ? t('upg_4way_discount') : t('upg_4way_desc'); const title = window.currentLang === 'ko' ? `⚡ 4방향 무기 (${price})` : `⚡ 4-Way Weapon (${price})`; createPurchaseBtn('4way', title, sub, pRow); }
      upgradeList.appendChild(pRow);

      const actionRow = document.createElement('div'); actionRow.className = 'upgrade-row-layout';
      const ampBtn = document.createElement('button'); ampBtn.className = 'btn btn-primary'; ampBtn.style.width = '100%'; ampBtn.style.padding = '15px'; ampBtn.style.background = 'rgba(16, 185, 129, 0.4)'; ampBtn.style.borderColor = '#10b981'; ampBtn.style.color = '#fff'; ampBtn.style.fontWeight = '900'; ampBtn.innerHTML = t('upg_buy_amp'); ampBtn.onclick = () => { shopModal.classList.remove('hidden'); tabConsumables.click(); }; actionRow.appendChild(ampBtn);
      
      if (!IAP_DATA.adsRemoved) { 
        const adBtn = document.createElement('button'); adBtn.className = 'btn btn-primary premium-upgrade-btn'; adBtn.style.width = '100%'; adBtn.style.padding = '15px'; adBtn.style.background = 'rgba(217, 70, 239, 0.4)'; adBtn.style.borderColor = '#d946ef'; adBtn.innerHTML = `<div style="font-weight:900; color:#fff; font-size:0.9rem;">${t('upg_ad_remove')}</div><div style="font-size:0.75rem; color:#fff;">${t('upg_ad_remove_desc')}</div>`; adBtn.onclick = () => { if (confirm(t('confirm_buy'))) { IAP_DATA.adsRemoved = true; player.ampoules.large += 10; saveIAP(); alert(t('purchase_complete')); showLevelUpModal(); } }; actionRow.appendChild(adBtn); 
      }
      upgradeList.appendChild(actionRow);
      
      const hr = document.createElement('hr'); hr.style.border='0'; hr.style.borderTop='1px solid rgba(255,255,255,0.15)'; hr.style.margin='15px 0'; upgradeList.appendChild(hr);
    }
    if (state.isBossDefeated) { const v = document.createElement('div'); v.innerHTML = `<h2 style="color:var(--accent-amber); margin-bottom:15px;">${t('upg_boss_victory')}</h2>`; upgradeList.appendChild(v); renderUpgrades(false, true); } else renderUpgrades(false, false);
    levelupModal.classList.remove('hidden');
  }

  function createPurchaseBtn(id, title, desc, container) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary premium-upgrade-btn';
    btn.style.width = '100%';
    btn.style.padding = '18px';
    btn.style.background = 'rgba(245, 158, 11, 0.45)';
    btn.style.borderColor = 'var(--accent-amber)';
    btn.style.color = '#fff';
    btn.innerHTML = `<div style="font-weight:900; color:var(--accent-amber); font-size:1.2rem;">${title}</div><div style="font-size:0.8rem;">${desc}</div>`;
    btn.onclick = () => {
      alert(window.currentLang === 'ko' ? "이 무기는 상점에서 코인 또는 결제로 즉시 영구 해제할 수 있습니다. 상점으로 이동합니다!" : "This weapon can be permanently unlocked in the Shop. Moving to Shop!");
      shopModal.classList.remove('hidden');
      tabWeapons.click();
    };
    if (container) container.appendChild(btn);
    else upgradeList.appendChild(btn);
  }
  function renderUpgrades(isPremium, isBossVictory) { 
    let mult = isBossVictory ? 2.0 : (isPremium ? 1.6 : 1.0); 
    const u = [
      {title: isBossVictory ? t('atk_up_boss') : t('atk_up'), desc: t('atk_up_desc', Math.round(10*mult)), apply:()=>player.weapon.damage *= (1 + 0.1 * mult)}, 
      {title: isBossVictory ? t('spd_up_boss') : t('spd_up'), desc: t('spd_up_desc', Math.round(10*mult)), apply:()=>player.speed *= (1 + 0.1 * mult)}, 
      {title: isBossVictory ? t('hp_up_boss') : t('hp_up'), desc: t('hp_up_desc', Math.round(20*mult)), apply:()=>{player.maxHp += 20 * mult;}}
    ]; 
    const row = document.createElement('div'); row.className = 'upgrade-row-layout';
    u.forEach(up => { 
      const btn = document.createElement('button'); btn.className = 'btn btn-primary upgrade-btn'; btn.style.width = '100%'; 
      btn.style.padding = '10px 15px'; btn.style.background = 'rgba(34, 211, 238, 0.45)'; btn.style.borderColor = 'var(--accent-cyan)'; btn.style.color = '#fff'; 
      if (isBossVictory) btn.style.borderColor = 'var(--accent-amber)'; 
      btn.innerHTML = `<div style="font-weight:900; font-size:1.3rem; color:${isBossVictory?'var(--accent-amber)':'var(--accent-cyan)'};">${up.title}</div><div style="font-size:0.9rem;">${up.desc}</div>`; 
      btn.onclick=()=>{ 
        up.apply(); 
        player.xp -= player.xpNeeded;
        player.level++;
        player.xpNeeded = Math.round(3 + player.level * 5);
        player.hp = player.maxHp; 
        
        state.isBossDefeated = false; 
        levelupModal.classList.add('hidden'); 
        document.body.classList.remove('level-up'); 
        state.paused=false; 
        if(bgmOn) bgMusic.play(); 
        updateHUD(); 
        checkLevelUp(); 
      }; 
      row.appendChild(btn); 
    }); 
    upgradeList.appendChild(row);
  }

  function toggleWeapon() {
    if (!IAP_DATA.purchasedWeapons || IAP_DATA.purchasedWeapons.length <= 1) return;
    const current = IAP_DATA.activeWeapon;
    const idx = IAP_DATA.purchasedWeapons.indexOf(current);
    const nextIdx = (idx + 1) % IAP_DATA.purchasedWeapons.length;
    IAP_DATA.activeWeapon = IAP_DATA.purchasedWeapons[nextIdx];
    saveIAP();
    beep(400, 0.05, 'sine', 0.1);
    updateHUD();
    
    // Brief visual feedback on HUD
    const weaponName = IAP_DATA.activeWeapon === 'base' ? t('base_gun') : (IAP_DATA.activeWeapon === '2way' ? t('dual_gun') : t('quad_gun'));
    const msg = document.createElement('div');
    msg.style.position = 'absolute'; msg.style.top = '120px'; msg.style.left = '50%'; msg.style.transform = 'translateX(-50%)';
    msg.style.color = 'var(--accent-cyan)'; msg.style.fontWeight = '900'; msg.style.fontSize = '1.2rem'; msg.style.textShadow = '0 0 10px #000';
    msg.textContent = `${t('weapon_swapped')}${weaponName}`;
    document.getElementById('game-wrapper').appendChild(msg);
    setTimeout(() => msg.remove(), 1000);
  }

  function renderShop() { 
    shopList.innerHTML = ''; 
    const items = [
      { id: 'small', title: t('amp_small'), desc: t('amp_small_desc'), price: 100, icon: '🧪' },
      { id: 'medium', title: t('amp_medium'), desc: t('amp_medium_desc'), price: 200, icon: '🧪' },
      { id: 'large', title: t('amp_large'), desc: t('amp_large_desc'), price: 300, icon: '🧪' },
      { id: 'giant', title: t('amp_giant'), desc: t('amp_giant_desc'), price: 400, icon: '🧪' }
    ];
    items.forEach(item => { 
      const card = document.createElement('div'); card.className = 'shop-card'; 
      if (player.coins < item.price) card.style.opacity = '0.5'; 
      card.innerHTML = `<div class="card-info"><div class="title">${item.icon} ${item.title}</div><div class="desc">${item.desc}</div><div class="owned-info" style="font-size:0.7rem; color:var(--accent-cyan);">${t('owned')} ${player.ampoules[item.id]}</div></div><div class="card-price">💰 ${item.price}</div>`; 
      card.onclick = (e) => { e.stopPropagation(); if (player.coins >= item.price) { player.coins -= item.price; player.ampoules[item.id]++; beep(600, 0.1, 'sine', 0.05, 100); updateHUD(); renderShop(); } else { alert(t('not_enough_coins')); } }; 
      shopList.appendChild(card); 
    }); 
  }
  function renderWeaponShop() { 
    weaponList.innerHTML = ''; 
    const h2 = IAP_DATA.purchasedWeapons.includes('2way'); 
    const products = [
      { id: '2way', title: t('w_2way'), desc: t('w_2way_desc'), price: '$0.99', type: 'weapon' },
      { id: '4way', title: t('w_4way'), desc: t('w_4way_desc'), price: h2 ? '$1.00' : '$1.99', type: 'weapon' },
      { id: 'noads', title: t('pkg_noads'), desc: t('pkg_noads_desc'), price: '$2.99', type: 'pkg' }
    ];
    products.forEach(p => { 
      const owned = (p.type==='weapon' && IAP_DATA.purchasedWeapons.includes(p.id)) || (p.id==='noads' && IAP_DATA.adsRemoved); 
      const card = document.createElement('div'); 
      card.className = p.id === 'noads' ? 'weapon-card premium ultimate' : 'weapon-card premium'; 
      card.innerHTML = `<div class="card-info"><div class="title" style="color:var(--accent-amber); font-size:1.1rem;">${p.title}</div><div class="desc" style="font-size:0.8rem; opacity:0.8;">${p.desc}</div></div><div class="card-price">${owned ? t('already_owned') : p.price}</div>`; 
      card.onclick = () => { 
        if (owned) { if (p.type === 'weapon') { IAP_DATA.activeWeapon = p.id; saveIAP(); alert(t('equipped')); renderWeaponShop(); updateHUD(); } return; } 
        
        // Convert USD simulated price to KRW for real PG payments
        let krwPrice = 1000;
        if (p.id === 'noads') krwPrice = 3000;
        else if (p.id === '4way') krwPrice = IAP_DATA.purchasedWeapons.includes('2way') ? 1000 : 2000;
        
        window.NeonPayments.requestPurchase(p.id, p.title, krwPrice, (rsp) => {
          if (p.id === 'noads') { 
            IAP_DATA.adsRemoved = true; 
            player.ampoules.large += 10; 
          } else { 
            IAP_DATA.purchasedWeapons.push(p.id); 
            IAP_DATA.activeWeapon = p.id; 
          } 
          saveIAP(); 
          renderWeaponShop(); 
          updateHUD(); 
          alert(t('purchase_complete')); 
        }, (err) => {
          console.error("[Payments] Checkout failed or canceled:", err);
        });
      }; 
      weaponList.appendChild(card); 
    }); 
  }

  // Expose to window for lang.js dynamic translation updates
  window.renderShop = renderShop;
  window.renderWeaponShop = renderWeaponShop;
  
  function gameOver() {
    state.gameOver = true; bgMusic.pause();
    document.body.classList.add('game-over');
    // Do NOT remove playing state on PC or mobile to avoid jumping!
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const bt = parseFloat(localStorage.getItem('ns_bestTime')) || 0, bc = parseInt(localStorage.getItem('ns_bestCoins')) || 0;
    if (state.time > bt) localStorage.setItem('ns_bestTime', state.time); if (player.coins > bc) localStorage.setItem('ns_bestCoins', player.coins);
    
    // Update Result UI
    if(bestTimeEl) bestTimeEl.textContent = formatTime(localStorage.getItem('ns_bestTime') || 0); 
    if(bestCoinsEl) bestCoinsEl.textContent = localStorage.getItem('ns_bestCoins') || 0;
    if(currTimeEl) currTimeEl.textContent = formatTime(state.time); 
    if(currCoinsEl) currCoinsEl.textContent = player.coins;

    // Fill Rankings (Mockup)
    const tRank = document.getElementById('worldRankTime'), cRank = document.getElementById('worldRankCoins');
    if (tRank) tRank.innerHTML = `<div class="rank-item"><span>1st. K-Survival</span><span>15:20</span></div><div class="rank-item"><span>2nd. GunstarX</span><span>12:45</span></div><div class="rank-item"><span>YOU</span><span>${formatTime(state.time)}</span></div>`;
    if (cRank) cRank.innerHTML = `<div class="rank-item"><span>1st. RichAgent</span><span>99,500</span></div><div class="rank-item"><span>2nd. GoldHunter</span><span>82,300</span></div><div class="rank-item"><span>YOU</span><span>${player.coins}</span></div>`;

    gameoverModal.classList.remove('hidden');
  }

  reviveBtn.onclick = () => {
    window.NeonAds.showRewardedAd(() => {
      player.hp = player.maxHp; player.iframe = 2.0; state.gameOver = false; gameoverModal.classList.add('hidden');
      document.body.classList.add('playing');
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobileDevice) {
        document.body.classList.add('lock-scroll');
      }
      if (bgmOn) bgMusic.play();
      updateHUD();
    }, (err) => {
      console.warn("[Google Ads] Revive rewarded ad canceled or failed:", err);
    });
  };
  const executeStartGame = () => {
    try {
      resize(); 
      player.x = 0; player.y = 0; player.hp = 120; player.maxHp = 120; player.xp = 0; player.level = 10; player.coins = 400; player.speed = 410; 
      player.weapon.damage = 16.1; player.xpNeeded = 53; player.ampoules = { small: 2, medium: 0, large: 0, giant: 0 };
      
      IAP_DATA.purchasedWeapons = ["base", "2way", "4way"];
      IAP_DATA.activeWeapon = "base";
      saveIAP();

      enemies.length = 0; bullets.length = 0; gems.length = 0; enemyBullets.length = 0;
      state.running = true; state.gameOver = false; state.paused = false; state.time = 0; 
      state.isBossDefeated = false; state.bossSpawnedLevel = 0; state.isAttractingBossLoot = false; state.flash = 0;
      state.focusMode = false;
      if (btnTouchFocus) btnTouchFocus.classList.remove('active-focus');

      if (startModal) startModal.classList.add('hidden'); 
      if (gameoverModal) gameoverModal.classList.add('hidden'); 
      if (shopModal) shopModal.classList.add('hidden'); 
      if (levelupModal) levelupModal.classList.add('hidden');
      
      document.body.classList.add('playing');
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobileDevice) {
        document.body.classList.add('lock-scroll');
      }
      document.body.classList.remove('level-up');
      document.body.classList.remove('game-over');
      document.body.classList.remove('shop-open');
      
      const gameSec = document.getElementById('game-section');
      if (gameSec) gameSec.scrollIntoView({ behavior: 'smooth' });
      
      pickNextBGM(); 
      updateAudioVolumes(); 
      if (bgmOn && bgMusic) bgMusic.play().catch(() => {}); 
      ensureAudio(); 
      updateHUD();
      
      IAP_DATA.playCount++; saveIAP();
      SecureStore.clearSession(); // New game starts, clear old session
    } catch(e) { console.error("Start Game Error:", e); }
  };

  window.startGame = () => {
    if (IAP_DATA.adsRemoved) {
      executeStartGame();
      return;
    }
    
    // Show ad if user has played a multiple of 7 games
    if (IAP_DATA.playCount > 0 && IAP_DATA.playCount % 7 === 0) {
      console.log("[Ad Trigger] Play count reached " + IAP_DATA.playCount + ", playing rewarded ad.");
      window.NeonAds.showRewardedAd(() => {
        executeStartGame();
      }, () => {
        executeStartGame();
      });
    } else {
      executeStartGame();
    }
  };

  window.continueGame = () => {
    const session = SecureStore.loadSession();
    if (!session) { alert(t('no_saved_data')); return; }
    
    if (IAP_DATA.adsRemoved) {
      runContinueGameLogic(session);
      return;
    }

    window.NeonAds.showRewardedAd(() => {
      runContinueGameLogic(session);
    }, () => {
      runContinueGameLogic(session);
    });
  };
  
  function runContinueGameLogic(session) {
    try {
      resize();
      Object.assign(player, session.player);
      state.time = session.state.time;
      state.bossSpawnedLevel = session.state.bossSpawnedLevel;
      
      enemies.length = 0; bullets.length = 0; gems.length = 0; enemyBullets.length = 0;
      state.running = true; state.gameOver = false; state.paused = false; 
      state.isBossDefeated = false; state.isAttractingBossLoot = false; state.flash = 0;

      if (startModal) startModal.classList.add('hidden'); 
      if (gameoverModal) gameoverModal.classList.add('hidden'); 
      if (shopModal) shopModal.classList.add('hidden'); 
      if (levelupModal) levelupModal.classList.add('hidden');
      
      document.body.classList.add('playing');
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobileDevice) {
        document.body.classList.add('lock-scroll');
      }
      document.body.classList.remove('level-up');
      
      const gameSec = document.getElementById('game-section');
      if (gameSec) gameSec.scrollIntoView({ behavior: 'smooth' });
      
      pickNextBGM(); 
      updateAudioVolumes(); 
      if (bgmOn && bgMusic) bgMusic.play().catch(() => {}); 
      ensureAudio(); 
      updateHUD();
    } catch(e) { console.error("Continue Game Error:", e); SecureStore.clearSession(); }
  }

  function checkSession() {
    const session = SecureStore.loadSession();
    if (session) {
      // Add Continue Button if session exists
      if (!document.getElementById('continueBtn')) {
        const cBtn = document.createElement('button');
        cBtn.id = 'continueBtn';
        cBtn.className = 'btn btn-primary';
        cBtn.style.width = '100%';
        cBtn.style.padding = '20px';
        cBtn.style.fontSize = '1.2rem';
        cBtn.style.marginBottom = '10px';
        cBtn.style.background = 'var(--accent-cyan)';
        cBtn.style.borderColor = 'var(--accent-cyan)';
        cBtn.innerHTML = t('continue_game', session.player.level);
        cBtn.onclick = window.continueGame;
        startBtn.parentNode.insertBefore(cBtn, startBtn);
        startBtn.textContent = t('new_game');
        startBtn.style.background = "rgba(255,255,255,0.1)";
        startBtn.style.borderColor = "rgba(255,255,255,0.2)";
      }
    }
  }
  
  // Call session check on load
  setTimeout(checkSession, 100);

  if (startBtn) startBtn.onclick = window.startGame; 
  if (restartBtn) restartBtn.onclick = window.startGame; 
  
  // Ensure the loop is running from the start
  requestAnimationFrame(loop);
})();
