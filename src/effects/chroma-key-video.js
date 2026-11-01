/**
 * White-background video → canvas with alpha (fallback when WebM alpha unavailable).
 * Perf: capped DPR, pause when hidden / offscreen / reduced-motion.
 */
export function mountChromaKeyVideo(
  canvas,
  {
    src,
    video: existingVideo = null,
    poster = '',
    similarity = 0.88,
    softness = 0.12,
    dprMax = 1.25,
    reduced = false,
  } = {},
) {
  const gl =
    canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      powerPreference: 'low-power',
    }) ||
    canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      powerPreference: 'low-power',
    });

  const video = existingVideo || document.createElement('video');
  if (!existingVideo) {
    video.src = src;
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';
  } else if (src && !video.currentSrc) {
    video.src = src;
  }
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  if (poster) video.setAttribute('poster', poster);

  if (!gl) {
    return {
      video,
      async start() {
        await video.play().catch(() => {});
      },
      pause() {
        video.pause();
      },
      resume() {
        video.play().catch(() => {});
      },
      destroy() {
        video.pause();
        video.removeAttribute('src');
        video.load();
      },
    };
  }

  const vs = `#version 300 es
  in vec2 a; out vec2 v;
  void main(){ v=a*0.5+0.5; gl_Position=vec4(a,0.,1.); }`;
  const fs = `#version 300 es
  precision highp float;
  uniform sampler2D uTex;
  uniform float uSim;
  uniform float uSoft;
  in vec2 v; out vec4 o;
  void main(){
    vec2 uv = vec2(v.x, 1.0 - v.y);
    vec4 c = texture(uTex, uv);
    float luma = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    float white = smoothstep(uSim - uSoft, uSim + uSoft, luma);
    float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
    float key = max(white, smoothstep(0.12, 0.02, sat) * smoothstep(0.75, 0.95, luma));
    float a = 1.0 - key;
    o = vec4(c.rgb * a, a);
  }`;

  function compile(type, srcCode) {
    const s = gl.createShader(type);
    gl.shaderSource(s, srcCode);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s));
    }
    return s;
  }

  const isWebGL2 =
    typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
  let program;
  if (isWebGL2) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    program = p;
  } else {
    const vs1 = `attribute vec2 a; varying vec2 v; void main(){ v=a*0.5+0.5; gl_Position=vec4(a,0.,1.); }`;
    const fs1 = `precision highp float; uniform sampler2D uTex; uniform float uSim; uniform float uSoft; varying vec2 v;
      void main(){ vec2 uv=vec2(v.x,1.-v.y); vec4 c=texture2D(uTex,uv);
      float luma=dot(c.rgb,vec3(.299,.587,.114));
      float white=smoothstep(uSim-uSoft,uSim+uSoft,luma);
      float sat=max(c.r,max(c.g,c.b))-min(c.r,min(c.g,c.b));
      float key=max(white, smoothstep(.12,.02,sat)*smoothstep(.75,.95,luma));
      float a=1.-key; gl_FragColor=vec4(c.rgb*a,a); }`;
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs1));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs1));
    gl.linkProgram(p);
    program = p;
  }

  gl.useProgram(program);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uTex = gl.getUniformLocation(program, 'uTex');
  const uSim = gl.getUniformLocation(program, 'uSim');
  const uSoft = gl.getUniformLocation(program, 'uSoft');
  gl.uniform1i(uTex, 0);
  gl.uniform1f(uSim, similarity);
  gl.uniform1f(uSoft, softness);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  let raf = 0;
  let running = false;
  let wantRun = false;
  let destroyed = false;
  let lastDraw = 0;
  const fps = 28;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, dprMax);
    const w = Math.max(1, Math.floor(r.width * dpr));
    const h = Math.max(1, Math.floor(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  function frame(ts) {
    if (!running || destroyed) return;
    raf = requestAnimationFrame(frame);
    const minDt = 1000 / fps;
    if (ts - lastDraw < minDt) return;
    lastDraw = ts;
    resize();
    if (video.readyState >= 2) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  function sync() {
    const should = wantRun && !reduced && !destroyed && !document.hidden;
    if (should && !running) {
      running = true;
      lastDraw = 0;
      video.play().catch(() => {});
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
      video.pause();
    }
  }

  const onVis = () => sync();
  document.addEventListener('visibilitychange', onVis);

  return {
    video,
    async start() {
      wantRun = true;
      resize();
      sync();
    },
    pause() {
      wantRun = false;
      sync();
    },
    resume() {
      wantRun = true;
      sync();
    },
    destroy() {
      destroyed = true;
      wantRun = false;
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      video.pause();
      video.removeAttribute('src');
      video.load();
      gl.deleteTexture(tex);
      gl.deleteProgram(program);
      gl.deleteBuffer(buf);
    },
  };
}
