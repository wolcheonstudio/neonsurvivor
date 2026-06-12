  const keys = Object.create(null);
  document.addEventListener('keydown', e => {
    ensureAudio();
    const code = e.code;
    keys[code] = true;
    keys[e.key.toLowerCase()] = true;
    
    // 1. Block scroll for all movement & action keys
    const moveKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'];
    if (moveKeys.includes(code)) {
      if (state.running) e.preventDefault();
    }

    // 2. Start Game
    if (!state.running && (code === 'Enter' || code === 'Space')) {
      window.startGame();
    } 
    // 3. Toggle Pause during gameplay
    else if (state.running && !state.gameOver && (code === 'Enter' || code === 'Space')) {
      state.paused = !state.paused;
      pauseBtn.textContent = state.paused ? '▶' : '⏸';
      if (state.paused) bgMusic.pause(); else if (bgmOn) bgMusic.play();
      e.preventDefault();
    }
  });
  document.addEventListener('keyup', e => {
    keys[e.code] = false;
    keys[e.key.toLowerCase()] = false;
  });
