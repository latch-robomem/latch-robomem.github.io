// Hero banner: a real LATCH rollout (SO-101, Swap Cubes) with the MEASURED gate values of the released checkpoint.
// window.BANNER_GATES (banner_gates.js) comes from replaying this exact rollout through the checkpoint with the robot's
// serving protocol and recording both gates at each policy call.
// At video time t the banner shows the most recent call: its memory frames (32 sampled uniformly from frame 0 to now),
// the read-gate bias b_i of each frame (glow, scaled within the call) and the write-gate scale g_i in [0, 2] (bar).
(function () {
  var root = document.getElementById('banner'); if (!root) return;
  var G = window.BANNER_GATES; if (!G) return;
  var video = root.querySelector('video'), grid = root.querySelector('.mem'),
      phaseEl = root.querySelector('.phase'), timeEl = root.querySelector('.ptime');
  var N = 32, SPRITE_COLS = 18, SPRITE_ROWS = 9, SPRITE_FPS = 4, NTHUMB = 162;
  var SEC_PER_STEP = G.video_seconds / G.video_frames;   // recording: one video frame per control step

  // What the robot is doing (read off the video; describes the scene, not the gates).
  var PHASES = [
    { t: 0,  text: 'Red cube first: moving it to the free plate' },
    { t: 8,  text: 'White cube into the red cube’s original place' },
    { t: 14, text: 'Red cube into the white cube’s original place' },
    { t: 22.5, text: 'Every cube moved: the policy stops instead of repeating' }
  ];

  var slots = [];
  for (var i = 0; i < N; i++) {
    var d = document.createElement('div'); d.className = 'slot';
    d.innerHTML = '<i class="img"></i><b class="wg"><span></span></b>';
    grid.appendChild(d); slots.push(d);
  }
  function thumbPos(step) {
    var idx = Math.min(NTHUMB - 1, Math.round(step * SEC_PER_STEP * SPRITE_FPS));
    var c = idx % SPRITE_COLS, r = Math.floor(idx / SPRITE_COLS);
    return (c * 100 / (SPRITE_COLS - 1)) + '% ' + (r * 100 / (SPRITE_ROWS - 1)) + '%';
  }

  var lastCall = -1, btFixed = null;
  function frame() {
    var t = btFixed != null ? btFixed : (video.currentTime || 0);
    var step = t / SEC_PER_STEP;
    var ci = 0;
    for (var k = 0; k < G.calls.length; k++) if (G.calls[k].step <= step) ci = k;
    if (ci !== lastCall) {
      lastCall = ci;
      var call = G.calls[ci], f = call.frames, b = call.read, g = call.write;
      var bmin = Math.min.apply(null, b), bmax = Math.max.apply(null, b), span = Math.max(bmax - bmin, 1e-6);
      var gmin = Math.min.apply(null, g), gmax = Math.max.apply(null, g), gspan = Math.max(gmax - gmin, 1e-6);
      for (var i = 0; i < N; i++) {
        var s = slots[i];
        if (i >= f.length) { s.className = 'slot empty'; s.style.removeProperty('--r'); s.style.opacity = ''; continue; }
        var r = f.length > 1 ? (b[i] - bmin) / span : 0;   // read bias, 0..1 within this call
        s.className = 'slot m';
        s.style.setProperty('--r', r.toFixed(3));
        var w = f.length > 1 ? (g[i] - gmin) / gspan : 1;   // write scale, 0..1 within this call
        s.style.opacity = (0.4 + 0.6 * w).toFixed(3);
        s.firstChild.style.backgroundPosition = thumbPos(f[i]);
        s.querySelector('.wg span').style.height = Math.round(15 + 85 * w) + '%';
        s.title = 'frame ' + f[i] + ' (t = ' + (f[i] * SEC_PER_STEP).toFixed(1) + ' s) · read bias b = ' + b[i].toFixed(3) +
                  ' · write scale g = ' + g[i].toFixed(3);
      }
      timeEl.textContent = 'policy call ' + (ci + 1) + ' of ' + G.calls.length + ' · ' + f.length + ' memory frames · measured read bias ' +
        bmin.toFixed(3) + ' to ' + bmax.toFixed(3) + ' · write scale ' + gmin.toFixed(3) + ' to ' + gmax.toFixed(3) + ' (shown relative within the call)';
    }
    var phase = PHASES[0];
    PHASES.forEach(function (p) { if (t >= p.t) phase = p; });
    if (phaseEl.textContent !== phase.text) phaseEl.textContent = phase.text;
    requestAnimationFrame(frame);
  }
  root.addEventListener('click', function () { if (video.paused) video.play(); else video.pause(); });
  var bt = (location.hash.match(/bt=([\d.]+)/) || [])[1];   // #bt=12 -> banner frozen at 12 s (for checking)
  btFixed = bt ? +bt : null;
  if (bt) { video.pause(); }
  else { var p = video.play(); if (p && p.catch) p.catch(function () { video.controls = true; }); }
  requestAnimationFrame(frame);
})();
