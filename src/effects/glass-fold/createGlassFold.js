/**
 * Vanilla WebGL port of GradFlow "fold" (GlassFold) — folded translucent panes.
 * Shader source extracted from `gradflow` (MIT). No React.
 */
import vertSrc from './vertex.glsl?raw';
import fragSrc from './fragment.glsl?raw';

const TYPE_FOLD = 15;

function hexToRgb01(hex) {
  const t = hex.replace('#', '').trim();
  const full =
    t.length === 3
      ? t
          .split('')
          .map((c) => c + c)
          .join('')
      : t;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
}

function compile(gl, type, source) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(info || 'shader compile failed');
  }
  return sh;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} [opts]
 */
export function createGlassFold(canvas, opts = {}) {
  const config = {
    color1: '#1F6B45',
    color2: '#08291D',
    color3: '#B5D95B',
    speed: 0.42,
    scale: 1.05,
    noise: 0.12,
    dprMax: 1.75,
    ...opts,
  };

  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  });

  if (!gl) {
    canvas.classList.add('is-fallback');
    return { destroy() {}, pause() {}, resume() {}, resize() {} };
  }

  const vs = compile(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'link failed');
  }
  gl.useProgram(program);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const locPos = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(locPos);
  gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, 0, 0);

  const uni = {
    time: gl.getUniformLocation(program, 'u_time'),
    time2: gl.getUniformLocation(program, 'u_time2'),
    color1: gl.getUniformLocation(program, 'u_color1'),
    color2: gl.getUniformLocation(program, 'u_color2'),
    color3: gl.getUniformLocation(program, 'u_color3'),
    scale: gl.getUniformLocation(program, 'u_scale'),
    type: gl.getUniformLocation(program, 'u_type'),
    prevType: gl.getUniformLocation(program, 'u_prevType'),
    mix: gl.getUniformLocation(program, 'u_mix'),
    noise: gl.getUniformLocation(program, 'u_noise'),
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    pointer: gl.getUniformLocation(program, 'u_pointer'),
  };

  let c1 = hexToRgb01(config.color1);
  let c2 = hexToRgb01(config.color2);
  let c3 = hexToRgb01(config.color3);
  let speed = config.speed;
  let scale = config.scale;
  let noise = config.noise;

  let time = 0;
  let time2 = 0;
  let raf = 0;
  let last = null;
  let destroyed = false;
  let running = false;
  let inView = true;
  let pageVisible = !document.hidden;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pointer = [0.5, 0.5, 0];

  function resize() {
    const parent = canvas.parentElement || canvas;
    const rect = parent.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width || window.innerWidth));
    const h = Math.max(1, Math.floor(rect.height || window.innerHeight));
    const dpr = Math.min(window.devicePixelRatio || 1, config.dprMax);
    const bw = Math.floor(w * dpr);
    const bh = Math.floor(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      gl.viewport(0, 0, bw, bh);
    }
    draw();
  }

  function draw() {
    gl.uniform1f(uni.time, time);
    gl.uniform1f(uni.time2, time2);
    gl.uniform3fv(uni.color1, c1);
    gl.uniform3fv(uni.color2, c2);
    gl.uniform3fv(uni.color3, c3);
    gl.uniform1f(uni.scale, scale);
    gl.uniform1i(uni.type, TYPE_FOLD);
    gl.uniform1i(uni.prevType, TYPE_FOLD);
    gl.uniform1f(uni.mix, 1);
    gl.uniform1f(uni.noise, noise);
    gl.uniform2f(uni.resolution, canvas.width, canvas.height);
    gl.uniform3fv(uni.pointer, pointer);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(ts) {
    if (!running || destroyed) return;
    const dt = last == null ? 0 : Math.min((ts - last) / 1000, 0.1);
    last = ts;
    time += dt * speed;
    time2 += dt * speed * speed;
    draw();
    raf = requestAnimationFrame(frame);
  }

  function sync() {
    const should = !reduced && inView && pageVisible && !destroyed;
    if (should && !running) {
      running = true;
      last = null;
      raf = requestAnimationFrame(frame);
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
      draw(); // still frame
    }
  }

  const onVis = () => {
    pageVisible = !document.hidden;
    sync();
  };
  document.addEventListener('visibilitychange', onVis);

  const ro = new ResizeObserver(() => resize());
  ro.observe(canvas.parentElement || canvas);

  const io = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  });
  io.observe(canvas);

  const onPointer = (e) => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = (e.clientX - r.left) / r.width;
    const y = 1 - (e.clientY - r.top) / r.height;
    const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
    pointer[0] = x;
    pointer[1] = y;
    pointer[2] = inside ? 1 : 0;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  resize();
  sync();
  if (reduced) draw();

  return {
    resize,
    pause() {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    },
    resume() {
      sync();
    },
    setColors({ color1, color2, color3 }) {
      if (color1) c1 = hexToRgb01(color1);
      if (color2) c2 = hexToRgb01(color2);
      if (color3) c3 = hexToRgb01(color3);
      draw();
    },
    destroy() {
      destroyed = true;
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onPointer);
      ro.disconnect();
      io.disconnect();
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    },
  };
}

export default createGlassFold;
