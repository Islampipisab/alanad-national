import {forwardRef,useMemo,useCallback,useRef,useEffect}from'react';import {jsx}from'react/jsx-runtime';var me=Object.defineProperty;var ee=Object.getOwnPropertySymbols;var ve=Object.prototype.hasOwnProperty,he=Object.prototype.propertyIsEnumerable;var oe=(e,t,o)=>t in e?me(e,t,{enumerable:true,configurable:true,writable:true,value:o}):e[t]=o,D=(e,t)=>{for(var o in t||(t={}))ve.call(t,o)&&oe(e,o,t[o]);if(ee)for(var o of ee(t))he.call(t,o)&&oe(e,o,t[o]);return e};var z=e=>[e.r/255,e.g/255,e.b/255];var H={color1:{r:210,g:21,b:112},color2:{r:140,g:63,b:248},color3:{r:86,g:255,b:195},speed:.5,scale:1.2,type:"aurora",noise:.32};var k={linear:0,conic:1,animated:2,wave:3,silk:4,smoke:5,stripe:6,mesh:7,aurora:8,eclipse:9,caustics:10,nebula:11,rays:12,topo:13,glass:14,fold:15,halftone:16,prism:17,dunes:18,horizon:19},te=Object.keys(k),O={cosmic:{color1:{r:70,g:50,b:220},color2:{r:160,g:150,b:255},color3:{r:6,g:6,b:28},speed:.4,scale:1.2,type:"silk",noise:.1},matrix:{color1:{r:4,g:44,b:48},color2:{r:2,g:8,b:14},color3:{r:40,g:230,b:180},speed:.8,scale:1,type:"silk",noise:.12},electric:{color1:{r:14,g:82,b:255},color2:{r:130,g:220,b:255},color3:{r:255,g:255,b:255},speed:.9,scale:2,type:"animated",noise:.16},inferno:{color1:{r:10,g:16,b:60},color2:{r:255,g:110,b:30},color3:{r:255,g:225,b:180},speed:.9,scale:1.1,type:"wave",noise:.2},mystic:{color1:{r:170,g:170,b:255},color2:{r:6,g:6,b:30},color3:{r:40,g:40,b:160},speed:.7,scale:1.8,type:"smoke",noise:.16},cyber:{color1:{r:20,g:70,b:230},color2:{r:4,g:8,b:30},color3:{r:110,g:220,b:255},speed:.9,scale:2,type:"silk",noise:.2},neon:{color1:{r:255,g:90,b:20},color2:{r:8,g:10,b:30},color3:{r:30,g:90,b:255},speed:.6,scale:1.6,type:"animated",noise:.18},plasma:{color1:{r:255,g:80,b:20},color2:{r:40,g:4,b:10},color3:{r:255,g:190,b:90},speed:.6,scale:1.2,type:"silk",noise:.18},dream:{color1:{r:110,g:165,b:255},color2:{r:255,g:200,b:160},color3:{r:240,g:238,b:255},speed:.5,scale:1,type:"mesh",noise:.06},borealis:{color1:{r:60,g:220,b:200},color2:{r:4,g:8,b:30},color3:{r:70,g:110,b:255},speed:.5,scale:1.2,type:"aurora",noise:.1},magma:{color1:{r:255,g:90,b:20},color2:{r:8,g:10,b:36},color3:{r:255,g:225,b:170},speed:.6,scale:1.2,type:"eclipse",noise:.14},lagoon:{color1:{r:20,g:150,b:190},color2:{r:4,g:40,b:80},color3:{r:190,g:255,b:245},speed:.6,scale:1,type:"caustics",noise:.08},andromeda:{color1:{r:50,g:70,b:230},color2:{r:6,g:6,b:24},color3:{r:255,g:140,b:70},speed:.5,scale:1,type:"nebula",noise:.1},cathedral:{color1:{r:255,g:150,b:60},color2:{r:8,g:12,b:40},color3:{r:255,g:236,b:200},speed:.6,scale:1,type:"rays",noise:.12},atlas:{color1:{r:24,g:70,b:190},color2:{r:8,g:20,b:64},color3:{r:255,g:170,b:90},speed:.5,scale:1,type:"topo",noise:.06},reeded:{color1:{r:30,g:80,b:235},color2:{r:6,g:14,b:56},color3:{r:255,g:120,b:50},speed:.6,scale:1,type:"glass",noise:.1},maelstrom:{color1:{r:30,g:60,b:200},color2:{r:6,g:8,b:30},color3:{r:150,g:215,b:255},speed:.5,scale:1,type:"fold",noise:.12},newsprint:{color1:{r:16,g:24,b:64},color2:{r:243,g:236,b:222},color3:{r:240,g:80,b:30},speed:.6,scale:1,type:"halftone",noise:0},spectrum:{color1:{r:255,g:90,b:30},color2:{r:40,g:90,b:255},color3:{r:120,g:210,b:255},speed:.5,scale:1,type:"prism",noise:.1},sahara:{color1:{r:244,g:132,b:62},color2:{r:26,g:16,b:50},color3:{r:255,g:226,b:176},speed:.6,scale:1,type:"dunes",noise:.14},twilight:{color1:{r:91,g:61,b:245},color2:{r:5,g:4,b:14},color3:{r:244,g:236,b:255},speed:.5,scale:1,type:"horizon",noise:.12},mono:{color1:{r:235,g:235,b:235},color2:{r:10,g:10,b:10},color3:{r:120,g:120,b:120},speed:.5,scale:1.4,type:"smoke",noise:.18}};var re=`
  attribute vec2 position;
  varying vec2 vUv;

  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`,ae=`
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif

  // u_time is the integral of speed over time and u_time2 the integral of
  // speed squared, both accumulated on the CPU. Multiplying a clock by the
  // speed in here instead would make the pattern jump whenever speed changes.
  uniform float u_time;
  uniform float u_time2;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;
  uniform float u_scale;
  uniform int u_type;
  uniform int u_prevType;
  uniform float u_mix;
  uniform float u_noise;
  uniform vec2 u_resolution;
  // xy: pointer in uv space, z: lens strength
  uniform vec3 u_pointer;

  varying vec2 vUv;

  #define PI 3.14159265359


  // @Utility
  float noise(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // @Gradient Types
  vec3 linearGradient(vec2 uv, float time) {
    float t = (uv.y * u_scale) + sin(uv.x * PI + time) * 0.1;
    t = clamp(t, 0.0, 1.0);

    return t < 0.5
      ? mix(u_color1, u_color2, t * 2.0)
      : mix(u_color2, u_color3, (t - 0.5) * 2.0);
  }

  vec3 conicGradient(vec2 uv, float time) {
    vec2 center = vec2(0.5);
    vec2 pos = uv - center;

    float angle = atan(pos.y, pos.x);
    float normalizedAngle = (angle + PI) / (2.0 * PI);

    float t = fract(normalizedAngle * u_scale + time * 0.3);
    float smoothT = t;

    vec3 color;
    if (smoothT < 0.33) {
      color = mix(u_color1, u_color2, smoothstep(0.0, 0.33, smoothT));
    } else if (smoothT < 0.66) {
      color = mix(u_color2, u_color3, smoothstep(0.33, 0.66, smoothT));
    } else {
      color = mix(u_color3, u_color1, smoothstep(0.66, 1.0, smoothT));
    }

    float dist = length(pos);
    color += sin(dist * 8.0 + time * 1.5) * 0.03;

    return color;
  }

  #define S(a,b,t) smoothstep(a,b,t)

  mat2 Rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
  }

  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(2127.1, 81.17)), dot(p, vec2(1269.5, 283.37)));
    return fract(sin(p) * 43758.5453);
  }

  float advancedNoise(in vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u = f * f * (3.0 - 2.0 * f);
    float n = mix(mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                      dot(-1.0 + 2.0 * hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                  mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                      dot(-1.0 + 2.0 * hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
    return 0.5 + 0.5 * n;
  }

  vec3 animatedGradient(vec2 uv, float time) {
    float ratio = u_resolution.x / u_resolution.y;
    vec2 tuv = uv;
    tuv -= 0.5;

    float degree = advancedNoise(vec2(u_time2 * 0.1, tuv.x * tuv.y));
    tuv.y *= 1.0 / ratio;
    tuv *= Rot(radians((degree - 0.5) * 720.0 * u_scale + 180.0));
    tuv.y *= ratio;

    float frequency = 5.0 * u_scale;
    float amplitude = 30.0;
    float speed = u_time2 * 2.0;
    tuv.x += sin(tuv.y * frequency + speed) / amplitude;
    tuv.y += sin(tuv.x * frequency * 1.5 + speed) / (amplitude * 0.5);

    vec3 layer1 = mix(u_color1, u_color2, S(-0.3, 0.2, (tuv * Rot(radians(-5.0))).x));
    vec3 layer2 = mix(u_color2, u_color3, S(-0.3, 0.2, (tuv * Rot(radians(-5.0))).x));

    vec3 finalComp = mix(layer1, layer2, S(0.05, -0.2, tuv.y));

    return finalComp;
  }

  vec3 waveGradient(vec2 uv, float time) {
    float y = uv.y;

    float wave1 = sin(uv.x * PI * u_scale * 0.8 + u_time2 * 0.5) * 0.1;
    float wave2 = sin(uv.x * PI * u_scale * 0.5 + u_time2 * 0.3) * 0.15;
    float wave3 = sin(uv.x * PI * u_scale * 1.2 + u_time2 * 0.8) * 0.2;

    float flowingY = y + wave1 + wave2 + wave3;
    float pattern = smoothstep(0.0, 1.0, clamp(flowingY, 0.0, 1.0));

    vec3 color;
    if (pattern < 0.33) {
      float t = smoothstep(0.0, 0.33, pattern);
      color = mix(u_color1, u_color2, t);
    } else if (pattern < 0.66) {
      float t = smoothstep(0.33, 0.66, pattern);
      color = mix(u_color2, u_color3, t);
    } else {
      float t = smoothstep(0.66, 1.0, pattern);
      color = mix(u_color3, u_color1, t);
    }

    float variation = sin(uv.x * PI * 2.0 + u_time2) *
                      cos(uv.y * PI * 1.5 + u_time2 * 0.7) * 0.02;
    color += variation;

    return clamp(color, 0.0, 1.0);
  }

  vec3 silkGradient(vec2 uv, float time) {
    vec2 fragCoord = uv * u_resolution;
    vec2 invResolution = 1.0 / u_resolution.xy;
    vec2 centeredUv = (fragCoord * 2.0 - u_resolution.xy) * invResolution;

    centeredUv *= u_scale;

    float dampening = 1.0 / (1.0 + u_scale * 0.1);

    float d = -u_time2 * 0.5;
    float a = 0.0;

    for (float i = 0.0; i < 8.0; ++i) {
        a += cos(i - d - a * centeredUv.x) * dampening;
        d += sin(centeredUv.y * i + a) * dampening;
    }

    d += u_time2 * 0.5;

    vec3 patterns = vec3(
      cos(centeredUv.x * d + a) * 0.5 + 0.5,
      cos(centeredUv.y * a + d) * 0.5 + 0.5,
      cos((centeredUv.x + centeredUv.y) * (d + a) * 0.5) * 0.5 + 0.5
    );

    vec3 color1Mix = mix(u_color1, u_color2, patterns.x);
    vec3 color2Mix = mix(u_color2, u_color3, patterns.y);
    vec3 color3Mix = mix(u_color3, u_color1, patterns.z);

    vec3 finalColor = mix(color1Mix, color2Mix, patterns.z);
    finalColor = mix(finalColor, color3Mix, patterns.x * 0.5);

    vec3 originalPattern = vec3(cos(centeredUv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
    originalPattern = cos(originalPattern * cos(vec3(d, a, 2.5)) * 0.5 + 0.5);

    return mix(finalColor, originalPattern * finalColor, 0.3);
  }

  vec3 smokeGradient(vec2 uv, float time) {
    float mr = min(u_resolution.x, u_resolution.y);
    vec2 fragCoord = uv * u_resolution;
    vec2 p = (2.0 * fragCoord.xy - u_resolution.xy) / mr;

    p *= u_scale;

    float iTime = u_time2;

    for(int i = 1; i < 10; i++) {
      vec2 newp = p;
      float fi = float(i);
      newp.x += 0.6 / fi * sin(fi * p.y + iTime + 0.3 * fi) + 1.0;
      newp.y += 0.6 / fi * sin(fi * p.x + iTime + 0.3 * (fi + 10.0)) - 1.4;
      p = newp;
    }

    float redPattern = 1.0;
    float greenPattern = 1.0 - sin(p.y);
    float bluePattern = sin(p.x + p.y);

    greenPattern = clamp(greenPattern, 0.0, 1.0);
    bluePattern = bluePattern * 0.5 + 0.5;

    vec3 color;

    vec3 color12 = mix(u_color1, u_color2, greenPattern);

    color = mix(color12, u_color3, bluePattern);

    return clamp(color, 0.0, 1.0);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * advancedNoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  vec3 meshGradient(vec2 uv, float time) {
    float ratio = u_resolution.x / u_resolution.y;
    vec2 p = vec2(uv.x * ratio, uv.y);
    float t = time * 0.6;

    vec2 c1 = vec2((0.3 + 0.25 * sin(t * 0.9)) * ratio, 0.4 + 0.3 * cos(t * 0.7));
    vec2 c2 = vec2((0.7 + 0.25 * cos(t * 0.8)) * ratio, 0.6 + 0.3 * sin(t * 1.1));
    vec2 c3 = vec2((0.5 + 0.3 * sin(t * 0.6 + 2.0)) * ratio, 0.5 + 0.35 * cos(t * 0.9 + 4.0));

    float falloff = 1.5 + u_scale * 2.5;
    float w1 = exp(-falloff * dot(p - c1, p - c1));
    float w2 = exp(-falloff * dot(p - c2, p - c2));
    float w3 = exp(-falloff * dot(p - c3, p - c3));

    // soft base so areas far from every blob stay colored
    float wBase = 0.08;
    vec3 base = mix(u_color1, u_color3, uv.y);

    vec3 color = (u_color1 * w1 + u_color2 * w2 + u_color3 * w3 + base * wBase)
               / (w1 + w2 + w3 + wBase);

    return clamp(color, 0.0, 1.0);
  }

  vec3 auroraGradient(vec2 uv, float time) {
    float t = time * 0.4;

    // curtains: fbm-driven horizontal displacement, stronger near the top
    float curve = fbm(vec2(uv.x * 2.0 * u_scale + t * 0.5, t * 0.3)) - 0.5;
    float y = uv.y + curve * 0.5;

    float band = smoothstep(0.15, 0.55, y) * smoothstep(1.05, 0.6, y);
    float shimmer = fbm(vec2(uv.x * 5.0 * u_scale - t * 0.8, y * 3.0 + t * 0.5));
    float intensity = band * (0.5 + 0.9 * shimmer);

    // color2 is the sky, color1/color3 tint the curtains bottom-to-top
    vec3 sky = mix(u_color2, u_color2 * 0.35, uv.y);
    vec3 curtain = mix(u_color1, u_color3, clamp(y + (shimmer - 0.5) * 0.6, 0.0, 1.0));

    return clamp(sky + curtain * intensity, 0.0, 1.0);
  }

  vec3 stripeGradient(vec2 uv, float time) {
    vec2 p = ((uv * u_resolution * 2.0 - u_resolution.xy) / (u_resolution.x + u_resolution.y) * 2.0) * u_scale;
    float t = time * 0.7, a = 4.0 * p.y - sin(-p.x * 3.0 + p.y - t);
    a = smoothstep(cos(a) * 0.7, sin(a) * 0.7 + 1.0, cos(a - 4.0 * p.y) - sin(a + 3.0 * p.x));

    vec2 warped = (cos(a) * p + sin(a) * vec2(-p.y, p.x)) * 0.5 + 0.5;
    vec3 color = mix(u_color1, u_color2, warped.x);

    color = mix(color, u_color3, warped.y);
    color *= color + 0.6 * sqrt(color);

    return clamp(color, 0.0, 1.0);
  }

  // ---- shared helpers for the newer types ----------------------------------

  #define TAU 6.28318530718

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  // each octave is rotated and scaled slightly off 2.0 so the lattice never
  // lines up with itself and shows through as a grid
  float vfbm(vec2 p) {
    const mat2 m = mat2(0.8, 0.6, -0.6, 0.8);
    float f = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      f += a * vnoise(p);
      p = m * p * 2.03 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return f / 0.96875;
  }

  float vfbm3(vec2 p) {
    const mat2 m = mat2(0.8, 0.6, -0.6, 0.8);
    float f = 0.5 * vnoise(p);
    p = m * p * 2.03 + vec2(1.7, 9.2);
    f += 0.25 * vnoise(p);
    p = m * p * 2.03 + vec2(1.7, 9.2);
    f += 0.125 * vnoise(p);
    return f / 0.875;
  }

  // centered coordinates, y in [-0.5, 0.5], x stretched by the aspect ratio
  vec2 centered(vec2 uv) {
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / max(u_resolution.y, 1.0);
    return p;
  }

  // @Gradient Types (next)

  // the sun behind a moon: a dark disc with a crisp bright rim and a long soft
  // corona outside it. One side burns brighter, and that side drifts around.
  vec3 eclipseGradient(vec2 uv, float time) {
    vec2 p = centered(uv) * 2.0;
    float t = time * 0.6;

    float r = length(p);
    float a = atan(p.y, p.x);
    float radius = 0.58 / sqrt(max(u_scale, 0.05));

    // whole multiples of the angle only, so the atan seam never shows
    float wobble = 0.007 * sin(a * 3.0 + t * 0.7) + 0.004 * sin(a * 5.0 - t * 0.5);
    float d = r - radius - wobble;
    float away = max(d, 0.0);

    float arc = 0.5 + 0.5 * cos(a - t * 0.35 - 1.2);
    arc *= arc;

    float outside = smoothstep(-0.05, 0.0, d);
    float corona = exp(-away * (6.5 - 4.0 * arc)) * outside;
    float rim = exp(-abs(d) * 46.0);
    float flare = exp(-away * 2.2) * arc * outside;

    vec3 color = u_color2 * (1.0 - 0.45 * smoothstep(0.0, 1.8, r));
    // the disc itself, a shade under the sky around it
    color *= mix(0.4, 1.0, smoothstep(-0.3, 0.02, d));

    color += u_color1 * (corona * (0.5 + 0.5 * arc) + flare * 0.35);
    color += u_color3 * (rim * (0.35 + 0.65 * arc) + corona * corona * arc * 0.55);

    return clamp(color, 0.0, 1.0);
  }

  // light through moving water: an iterated sine warp whose reciprocal length
  // piles up into bright filaments
  vec3 causticsGradient(vec2 uv, float time) {
    vec2 p = centered(uv) * TAU * 0.55 * u_scale - 250.0;
    vec2 i = p;
    float t = time * 0.6;
    float c = 1.0;
    const float inten = 0.005;

    for (int n = 0; n < 5; n++) {
      float tt = t * (1.0 - 3.5 / float(n + 1));
      i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
      c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
    }

    c /= 5.0;
    c = 1.17 - pow(c, 1.4);
    float light = pow(abs(c), 8.0);

    vec3 color = mix(u_color2, u_color1, clamp(light * 1.4 + uv.y * 0.3, 0.0, 1.0));
    color = mix(color, u_color3, clamp(light * light * 1.3, 0.0, 1.0));

    return clamp(color, 0.0, 1.0);
  }

  // one layer of stars on a grid: a pinpoint with a soft halo, twinkling
  float starLayer(vec2 p, float cells, float density, float time) {
    vec2 g = p * cells;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float seed = hash21(id);
    vec2 offset = (vec2(hash21(id + 7.0), hash21(id + 3.0)) - 0.5) * 0.4;
    float d = length(f - offset);
    float size = 0.4 + 0.6 * hash21(id + 11.0);
    // the halo has to die out before it reaches the edge of its cell
    float star = size * 0.006 / (d * d + 0.006) * smoothstep(0.3, 0.04, d);
    star *= 0.65 + 0.35 * sin(time * 2.0 + seed * 40.0);
    return star * step(1.0 - density, seed);
  }

  // glowing gas: a twice-warped cloud lit from inside, with thin bright
  // filaments, dark dust lanes across it, and stars behind
  vec3 nebulaGradient(vec2 uv, float time) {
    vec2 c = centered(uv);
    vec2 p = c * (1.8 * u_scale);
    float t = time * 0.5;

    vec2 q = vec2(vfbm3(p + t * 0.04), vfbm3(p + vec2(5.2, 1.3) - t * 0.03));
    vec2 r = vec2(
      vfbm3(p + 3.0 * q + vec2(1.7, 9.2) + t * 0.02),
      vfbm3(p + 3.0 * q + vec2(8.3, 2.8) - t * 0.02)
    );

    float gas = vfbm(p * 0.9 + 2.6 * r);
    float filament = 1.0 - abs(2.0 * vfbm3(p * 1.4 + 2.2 * r + 3.0) - 1.0);
    filament = pow(filament, 5.0);
    float dust = smoothstep(0.45, 0.72, vfbm3(p * 1.1 - 2.0 * q + 4.0));

    // the cloud is a warped band across the frame, not a fill
    float across = dot(p + (q - 0.5) * 1.4, vec2(0.45, 0.89));
    float cloud = exp(-across * across * 1.1);

    float glow = smoothstep(0.25, 0.7, gas) * cloud;
    float core = smoothstep(0.42, 0.74, gas) * cloud;

    // the cores turn to color3 rather than adding it, so it keeps its hue
    vec3 light = mix(u_color1 * glow * 1.15, u_color3 * 1.15, core * core * 0.85)
               + u_color3 * filament * glow * 0.4;
    light *= 1.0 - 0.6 * dust;

    vec3 color = u_color2 * (0.3 + 0.5 * vfbm3(p * 0.7 + 7.0));

    float stars = starLayer(c, 46.0, 0.1, time) + starLayer(c + 3.7, 17.0, 0.05, time * 0.7) * 1.5;
    color += mix(vec3(1.0), u_color3, 0.3) * stars * (1.0 - 0.85 * glow);

    // roll off instead of clipping, so the bright gas glows
    color += 1.0 - exp(-light * 1.5);

    return clamp(color, 0.0, 1.0);
  }

  // shafts of light: 1d noise in angle around an off-screen source
  vec3 raysGradient(vec2 uv, float time) {
    vec2 p = centered(uv);
    float t = time * 0.6;

    vec2 source = vec2(0.18 * sin(t * 0.2), 0.78);
    vec2 d = p - source;
    float angle = atan(d.x, -d.y);
    float dist = length(d);

    float a = angle * (6.0 * u_scale);
    float shaft = vnoise(vec2(a + t * 0.15, t * 0.1)) * 0.6
                + vnoise(vec2(a * 2.3 - t * 0.22, 3.0 + t * 0.07)) * 0.4;
    shaft = pow(shaft, 1.6);

    float falloff = exp(-dist * 1.35) * smoothstep(1.45, 0.2, abs(angle));
    float beam = shaft * falloff * 2.3;

    vec3 color = mix(u_color2 * 0.55, u_color2, uv.y);
    color += u_color1 * beam;
    color += u_color3 * (pow(beam, 2.5) * 0.9 + exp(-dist * 5.0) * 0.6);

    return clamp(color, 0.0, 1.0);
  }

  float topoHeight(vec2 p, float t) {
    return vfbm(p + vec2(t * 0.06, -t * 0.04));
  }

  // contour map: the height field is sampled three times so the lines can be
  // kept one pixel-width wide wherever the slope changes
  vec3 topoGradient(vec2 uv, float time) {
    float zoom = 2.2 * u_scale;
    vec2 p = centered(uv) * zoom;
    float t = time * 0.7;
    const float levels = 10.0;
    const float e = 0.01;

    float h = topoHeight(p, t);
    float hx = topoHeight(p + vec2(e, 0.0), t);
    float hy = topoHeight(p + vec2(0.0, e), t);
    float slope = length(vec2(hx - h, hy - h)) / e;

    float v = h * levels;
    float pixel = zoom / max(u_resolution.y, 1.0);
    float distPx = abs(fract(v) - 0.5) / (slope * levels * pixel + 0.0001);
    float line = 1.0 - smoothstep(0.5, 1.6, distPx);

    vec3 color = mix(u_color2, u_color1, smoothstep(0.25, 0.8, h));
    color = mix(color, u_color3, line * 0.85);

    return clamp(color, 0.0, 1.0);
  }

  vec3 softField(vec2 p, float t) {
    float a = vfbm3(p * 0.9 + vec2(t * 0.08, t * 0.05));
    float b = vfbm3(p * 0.9 + vec2(4.1, 2.7) - vec2(t * 0.06, -t * 0.07));
    vec3 c = mix(u_color1, u_color2, smoothstep(0.3, 0.7, a));
    return mix(c, u_color3, smoothstep(0.42, 0.75, b));
  }

  // fluted glass: every rib is a cylindrical lens that squeezes and flips the
  // soft field behind it
  vec3 glassGradient(vec2 uv, float time) {
    vec2 p = centered(uv) * 2.0;
    float ribs = 9.0 * u_scale;

    float x = p.x * ribs;
    float f = fract(x) - 0.5;
    float bent = (floor(x) + 0.5 + sin(f * PI) * 1.7) / ribs;

    vec3 color = softField(vec2(bent, p.y), time);

    float edge = smoothstep(0.38, 0.5, abs(f));
    float sheen = pow(1.0 - abs(f) * 2.0, 4.0);
    color *= 1.0 - edge * 0.22;
    color += sheen * 0.07;

    return clamp(color, 0.0, 1.0);
  }

  // panes of glass folded over each other. Each pane has one creased edge
  // that catches the light and thins out to nothing behind it; panes screen
  // over one another, so overlaps get brighter instead of darker.
  vec3 foldGradient(vec2 uv, float time) {
    vec2 q = Rot(0.6) * centered(uv) * 2.0 * u_scale;
    float t = time * 0.6;
    float pixel = 2.0 * u_scale / max(u_resolution.y, 1.0);

    vec3 color = mix(u_color2, u_color2 * 0.45, clamp(length(centered(uv)) * 1.3, 0.0, 1.0));

    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float bend = mod(fi, 2.0) * 2.0 - 1.0;

      float crease = (fi - 2.5) * 0.4
                   + 0.26 * sin(q.x * (1.05 + 0.12 * fi) + fi * 1.9 + t * (0.25 + 0.05 * fi))
                   + 0.1 * bend * q.x * q.x;
      float s = q.y - crease;
      float pane = smoothstep(-pixel, pixel, s);
      float back = max(s, 0.0);

      // thick near the crease, clear further in
      float body = exp(-back * 1.7);
      float fresnel = exp(-back * 8.0);
      // the lit edge, and a fainter line just inside it for the glass's thickness
      float rim = exp(-back * 80.0);
      float inner = exp(-pow((back - 0.045) / 0.014, 2.0));
      float bloom = exp(-abs(s) * 20.0);

      vec3 tint = mix(u_color1, u_color3, clamp(fresnel * 0.6 + 0.08 + 0.14 * sin(fi * 2.1 + q.x * 0.8 + t * 0.2), 0.0, 1.0));
      vec3 light = tint * pane * (body * 0.42 + fresnel * 0.4)
                 + u_color3 * (pane * (rim * 0.6 + inner * 0.12) + bloom * 0.1);

      // screen blend
      color += light * (1.0 - color);
    }

    return clamp(color, 0.0, 1.0);
  }

  // rotated dot screen; the dot radius follows a slow noise field
  vec3 halftoneGradient(vec2 uv, float time) {
    vec2 p = centered(uv);
    float cells = 34.0 * u_scale;
    mat2 screen = Rot(0.5236);
    float t = time * 0.8;

    vec2 g = screen * p * cells;
    vec2 id = floor(g) + 0.5;
    vec2 f = g - id;
    // back to the cell center in unrotated space, so a whole dot shares one value
    vec2 cp = (id / cells) * screen;

    float v = vfbm3(cp * 2.4 + vec2(t * 0.12, t * 0.07));
    v = smoothstep(0.2, 0.8, v + 0.22 * sin(cp.x * 2.0 + t * 0.4));
    float tint = vfbm3(cp * 1.3 + vec2(7.0, 2.0) - t * 0.05);

    float radius = sqrt(v) * 0.62;
    float pixel = cells / max(u_resolution.y, 1.0);
    float dotMask = 1.0 - smoothstep(radius - pixel, radius + pixel, length(f));

    vec3 ink = mix(u_color1, u_color3, smoothstep(0.4, 0.65, tint));

    return mix(u_color2, ink, dotMask);
  }

  float prismBand(float x) {
    float w = 0.5 + 0.5 * cos(TAU * x);
    return w * w * w;
  }

  // light split by a prism: one smoothly folded band field read at three
  // nearby phases, one per color. Where the bands overlap the colors add up
  // toward white, and at their edges they fringe apart.
  vec3 prismGradient(vec2 uv, float time) {
    vec2 p = centered(uv) * (1.15 * u_scale);
    float t = time * 0.5;

    // sines rather than noise: the folds stay glassy at any zoom
    vec2 q = p;
    q += 0.38 * vec2(sin(q.y * 1.7 + t * 0.6), cos(q.x * 1.3 - t * 0.5));
    q += 0.22 * vec2(sin(q.y * 3.1 - t * 0.4 + 1.3), cos(q.x * 2.7 + t * 0.3 + 2.1));

    float base = dot(q, vec2(0.75, 0.66)) * 0.85 + t * 0.06;
    float spread = 0.13 + 0.05 * sin(q.x * 1.1 - q.y * 0.7 + t * 0.3);

    vec3 beam = u_color1 * prismBand(base - spread)
              + u_color2 * prismBand(base)
              + u_color3 * prismBand(base + spread);

    // a wider, dimmer second order behind the first
    float far = base * 0.5 + 0.31;
    vec3 ghost = u_color3 * prismBand(far - spread * 1.6)
               + u_color2 * prismBand(far)
               + u_color1 * prismBand(far + spread * 1.6);

    vec3 color = (u_color1 + u_color2 + u_color3) * 0.035;
    color += ghost * 0.22;
    color += beam;

    // roll off instead of clipping, so overlaps glow rather than flatten
    return 1.0 - exp(-color * 1.2);
  }

  // one ridgeline: skewed swells, a long windward slope into a short slip face
  float duneCrest(float x, float seed) {
    float a = x * 1.1 + seed;
    return sin(a + 0.6 * sin(a)) * 0.6
         + sin(x * 2.3 + seed * 1.7) * 0.25
         + (vfbm3(vec2(x * 1.2, seed)) - 0.5) * 0.3;
  }

  // stacked dunes, far to near, each drifting at its own rate. A ridge's faces
  // split into sunlit and shadowed sides, and the split shears down the slope
  // so it reads as an edge running toward the viewer.
  vec3 dunesGradient(vec2 uv, float time) {
    float ratio = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 p = vec2(uv.x * ratio, uv.y);
    float t = time * 0.8;

    // sky: color3 at the horizon rising into color1, with a low sun in the haze
    vec3 haze = mix(u_color3, u_color1, 0.3);
    vec3 color = mix(u_color3, u_color1, smoothstep(0.5, 1.05, uv.y));
    vec2 sun = vec2(ratio * 0.7, 0.74);
    color = mix(color, u_color3, exp(-length(p - sun) * 3.0) * 0.9);

    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      float depth = fi / 4.0;
      float seed = fi * 3.3;

      float x = p.x * (0.95 + depth * 0.75) * u_scale + fi * 13.7 + t * (0.03 + depth * 0.09);
      float amp = 0.1 + 0.1 * depth;
      float crest = 0.64 - depth * 0.6 + duneCrest(x, seed) * amp;
      float d = crest - p.y;
      float below = smoothstep(-0.003, 0.003, d);
      float fall = max(d, 0.0);

      // the sun is to the right: faces falling away to the right catch it
      float sx = x + fall * (3.0 - depth * 1.4);
      float slope = duneCrest(sx + 0.04, seed) - duneCrest(sx - 0.04, seed);
      float lit = smoothstep(0.02, -0.02, slope);

      vec3 sunlit = mix(u_color1, u_color3, 0.12 + 0.3 * exp(-fall * 7.0));
      // shadows start as a deeper color1 and only reach color2 up close, so the
      // middle distance never mixes into mud
      vec3 shadow = mix(u_color1 * 0.5, u_color2, depth * depth);
      vec3 layer = mix(shadow, sunlit, lit);

      // a bright rim on the crest, and distance fading the far ridges out
      layer = mix(layer, u_color3, exp(-fall * 60.0) * (0.25 + 0.35 * lit));
      layer = mix(layer, haze, (1.0 - depth) * 0.45);
      color = mix(color, layer, below);
    }

    return clamp(color, 0.0, 1.0);
  }

  // a glow on the horizon: two soft-edged hills, a wide one in color1 and a
  // hot one in color3 beneath it, lit like blurred shapes set to plus-lighter
  vec3 horizonGradient(vec2 uv, float time) {
    float x = uv.x - 0.5;
    float t = time * 0.5;
    float rise = 0.42 * u_scale;

    float body = rise + 0.15 * sin(x * 2.6 + t * 0.5 + 0.7) + 0.04 * sin(x * 5.3 - t * 0.35);
    float hot = rise * 0.32 + 0.1 * sin(x * 2.1 - t * 0.4 + 2.2) + 0.03 * sin(x * 4.7 + t * 0.3);

    // the width of each smoothstep is the blur radius
    float glow = smoothstep(0.34, -0.3, uv.y - body);
    float core = smoothstep(0.26, -0.2, uv.y - hot);
    glow *= glow;
    core *= core;

    vec3 color = mix(u_color2, u_color2 * 0.6, uv.y);
    color = mix(color, u_color1, glow);
    color += u_color1 * glow * core * 0.35;
    color += u_color3 * core;

    return clamp(color, 0.0, 1.0);
  }

  vec3 shade(int type, vec2 uv, float time) {
    if (type == 0) return linearGradient(uv, time);
    if (type == 1) return conicGradient(uv, time);
    if (type == 2) return animatedGradient(uv, time);
    if (type == 3) return waveGradient(uv, time);
    if (type == 4) return silkGradient(uv, time);
    if (type == 5) return smokeGradient(uv, time);
    if (type == 6) return stripeGradient(uv, time);
    if (type == 7) return meshGradient(uv, time);
    if (type == 8) return auroraGradient(uv, time);
    if (type == 9) return eclipseGradient(uv, time);
    if (type == 10) return causticsGradient(uv, time);
    if (type == 11) return nebulaGradient(uv, time);
    if (type == 12) return raysGradient(uv, time);
    if (type == 13) return topoGradient(uv, time);
    if (type == 14) return glassGradient(uv, time);
    if (type == 15) return foldGradient(uv, time);
    if (type == 16) return halftoneGradient(uv, time);
    if (type == 17) return prismGradient(uv, time);
    if (type == 18) return dunesGradient(uv, time);
    if (type == 19) return horizonGradient(uv, time);
    return animatedGradient(uv, time);
  }

  // @Main
  void main() {
    vec2 uv = vUv;
    float time = u_time;

    // pointer lens: pull the sample point toward the pointer so the pattern
    // swells underneath it
    if (u_pointer.z > 0.001) {
      vec2 d = uv - u_pointer.xy;
      d.x *= u_resolution.x / max(u_resolution.y, 1.0);
      float lens = exp(-dot(d, d) * 7.0) * u_pointer.z;
      uv -= (uv - u_pointer.xy) * lens * 0.4;
    }

    vec3 color = shade(u_type, uv, time);

    // while a type change is in flight the old pattern dissolves into the
    // new one along a noise front instead of a flat cross-fade
    if (u_mix < 0.999) {
      vec3 from = shade(u_prevType, uv, time);
      float front = vfbm3(centered(uv) * 2.5 + 3.0);
      float k = smoothstep(0.0, 1.0, clamp(u_mix * 1.7 - front * 0.7, 0.0, 1.0));
      color = mix(from, color, k);
    }

    if (u_noise > 0.001) {
      float grain = noise(vUv * 200.0 + time * 0.1);
      color *= (1.0 - u_noise * 0.4 + u_noise * grain * 0.4);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;var ge=["u_time","u_time2","u_color1","u_color2","u_color3","u_scale","u_type","u_prevType","u_mix","u_noise","u_resolution","u_pointer"];function ne(e,t,o){let r=e.createShader(t);return r?(e.shaderSource(r,o),e.compileShader(r),e.getShaderParameter(r,e.COMPILE_STATUS)?r:(e.isContextLost()||console.error("gradflow: shader failed to compile",e.getShaderInfoLog(r)),e.deleteShader(r),null)):null}function be(e){let t=ne(e,e.VERTEX_SHADER,re),o=ne(e,e.FRAGMENT_SHADER,ae),r=e.createProgram();return !t||!o||!r?null:(e.attachShader(r,t),e.attachShader(r,o),e.bindAttribLocation(r,0,"position"),e.linkProgram(r),e.deleteShader(t),e.deleteShader(o),e.getProgramParameter(r,e.LINK_STATUS)?r:(e.isContextLost()||console.error("gradflow: program failed to link",e.getProgramInfoLog(r)),e.deleteProgram(r),null))}function ie(e,t={}){var G;let o=e.getContext("webgl",{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:(G=t.preserveDrawingBuffer)!=null?G:false,powerPreference:"high-performance"});if(!o)return null;let r=null,v=null,i=null,h=()=>{r=be(o),r&&(v=o.createBuffer(),o.bindBuffer(o.ARRAY_BUFFER,v),o.bufferData(o.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),o.STATIC_DRAW),o.enableVertexAttribArray(0),o.vertexAttribPointer(0,2,o.FLOAT,false,0,0),o.useProgram(r),i=Object.fromEntries(ge.map(a=>[a,o.getUniformLocation(r,a)])));},_=a=>{a.preventDefault(),r=null,i=null;},g=()=>h();return e.addEventListener("webglcontextlost",_),e.addEventListener("webglcontextrestored",g),h(),{draw(a,n,d,s,p){!r||!i||(o.viewport(0,0,n,d),o.uniform1f(i.u_time,a.time),o.uniform1f(i.u_time2,a.time2),o.uniform3fv(i.u_color1,a.color1),o.uniform3fv(i.u_color2,a.color2),o.uniform3fv(i.u_color3,a.color3),o.uniform1f(i.u_scale,a.scale),o.uniform1i(i.u_type,a.type),o.uniform1i(i.u_prevType,a.prevType),o.uniform1f(i.u_mix,a.mix),o.uniform1f(i.u_noise,a.noise),o.uniform2f(i.u_resolution,s,p),o.uniform3fv(i.u_pointer,a.pointer),o.drawArrays(o.TRIANGLES,0,3));},dispose(){e.removeEventListener("webglcontextlost",_),e.removeEventListener("webglcontextrestored",g),v&&o.deleteBuffer(v),r&&o.deleteProgram(r),r=null,i=null;}}}var le=e=>({color1:z(e.color1),color2:z(e.color2),color3:z(e.color3),speed:e.speed,scale:e.scale,noise:e.noise}),W=e=>{var t,o;return (o=k[(t=e.type)!=null?t:"animated"])!=null?o:k.animated},Y=(e,t)=>e[0]===t[0]&&e[1]===t[1]&&e[2]===t[2],ye=(e,t)=>Y(e.color1,t.color1)&&Y(e.color2,t.color2)&&Y(e.color3,t.color3)&&e.speed===t.speed&&e.scale===t.scale&&e.noise===t.noise,C=(e,t,o)=>e+(t-e)*o,q=(e,t,o)=>[C(e[0],t[0],o),C(e[1],t[1],o),C(e[2],t[2],o)];function se(e,t={}){let{paused:o=false,transition:r=700,interactive:v=false,preserveDrawingBuffer:i=false}=t,h=useRef(null),_=useRef(e),g=useRef(o),G=useRef(r),a=useRef(null);return useEffect(()=>{let n=h.current;if(!n)return;let d=ie(n,{preserveDrawingBuffer:i});if(!d)return;let s={width:1,height:1,cssWidth:1,cssHeight:1},p=le(_.current),c=p,b=p,m=p,R=0,P=0,l={time:0,time2:0,color1:p.color1,color2:p.color2,color3:p.color3,scale:p.scale,noise:p.noise,type:W(_.current),prevType:W(_.current),mix:1,pointer:[.5,.5,0]},I=[.5,.5,0],L=()=>{l.color1=c.color1,l.color2=c.color2,l.color3=c.color3,l.scale=c.scale,l.noise=c.noise,d.draw(l,s.width,s.height,s.cssWidth,s.cssHeight);},j=()=>{let u=n.parentElement;if(!u)return;let f=u.clientWidth,x=u.clientHeight,y=Math.min(window.devicePixelRatio,2);s.cssWidth=Math.max(f,1),s.cssHeight=Math.max(x,1),s.width=Math.max(Math.round(f*y),1),s.height=Math.max(Math.round(x*y),1),n.width=s.width,n.height=s.height,n.style.width=f+"px",n.style.height=x+"px",L();},U=window.matchMedia("(prefers-reduced-motion: reduce)"),T={inView:true,pageVisible:!document.hidden,reducedMotion:U.matches},w=0,F=null,V=()=>{R=0,c=m,l.mix=1,l.prevType=l.type;},X=u=>{let f=F===null?0:Math.min((u-F)/1e3,.1);if(F=u,R){let y=Math.min((u-R)/P,1),E=y*y*(3-2*y);c={color1:q(b.color1,m.color1,E),color2:q(b.color2,m.color2,E),color3:q(b.color3,m.color3,E),speed:C(b.speed,m.speed,E),scale:C(b.scale,m.scale,E),noise:C(b.noise,m.noise,E)},l.prevType!==l.type&&(l.mix=y),y>=1&&V();}l.time+=f*c.speed,l.time2+=f*c.speed*c.speed;let x=1-Math.exp(-f*6);l.pointer=q(l.pointer,I,x),L(),w=requestAnimationFrame(X);},M=()=>{let u=!g.current&&!T.reducedMotion&&T.inView&&T.pageVisible;u&&!w?(F=null,w=requestAnimationFrame(X)):!u&&w&&(cancelAnimationFrame(w),w=0,R&&(V(),L()));},de=u=>{let f=W(u),x=G.current,y=le(u);if(!(f===l.type&&ye(y,m))){if(m=y,!w||x<=0){l.type=f,V(),L();return}b=c,R=performance.now(),P=x,f!==l.type&&(l.prevType=l.type,l.type=f,l.mix=0);}},pe=(u,f,x)=>{I[0]=u,I[1]=f,I[2]=x?1:0;};a.current={sync:M,setConfig:de,setPointer:pe};let K=new ResizeObserver(j);n.parentElement&&K.observe(n.parentElement),j();let Q=new IntersectionObserver(([u])=>{T.inView=u.isIntersecting,M();});Q.observe(n);let $=()=>{T.pageVisible=!document.hidden,M();};document.addEventListener("visibilitychange",$);let J=()=>{T.reducedMotion=U.matches,M();};U.addEventListener("change",J);let Z=()=>requestAnimationFrame(L);return n.addEventListener("webglcontextrestored",Z),M(),()=>{cancelAnimationFrame(w),K.disconnect(),Q.disconnect(),document.removeEventListener("visibilitychange",$),U.removeEventListener("change",J),n.removeEventListener("webglcontextrestored",Z),a.current=null,d.dispose();}},[i]),useEffect(()=>{var n;g.current=o,(n=a.current)==null||n.sync();},[o]),useEffect(()=>{G.current=r;},[r]),useEffect(()=>{var n;_.current=e,(n=a.current)==null||n.setConfig(e);},[e]),useEffect(()=>{if(!v)return;let n=s=>{var P;let p=h.current;if(!p)return;let c=p.getBoundingClientRect();if(!c.width||!c.height)return;let b=(s.clientX-c.left)/c.width,m=1-(s.clientY-c.top)/c.height,R=b>=0&&b<=1&&m>=0&&m<=1;(P=a.current)==null||P.setPointer(b,m,R);},d=()=>{var s;return (s=a.current)==null?void 0:s.setPointer(.5,.5,false)};return window.addEventListener("pointermove",n,{passive:true}),document.addEventListener("pointerleave",d),()=>{window.removeEventListener("pointermove",n),document.removeEventListener("pointerleave",d),d();}},[v]),{canvasRef:h}}function ce(e){let t=e.trim().replace("#","");t.length===3&&(t=t.split("").map(h=>h+h).join(""));let o=parseInt(t,16),r=o>>16&255,v=o>>8&255,i=o&255;return {r,g:v,b:i}}function xe(e){let{r:t,g:o,b:r}=e;return "#"+((1<<24)+(t<<16)+(o<<8)+r).toString(16).slice(1)}function S(e){return typeof e=="string"?ce(e):e}function ue(e,t){let o=D(D({},H),t?O[t]:void 0);return e&&(e.color1&&(o.color1=S(e.color1)),e.color2&&(o.color2=S(e.color2)),e.color3&&(o.color3=S(e.color3)),e.speed!==void 0&&(o.speed=e.speed),e.scale!==void 0&&(o.scale=e.scale),e.type&&(o.type=e.type),e.noise!==void 0&&(o.noise=e.noise)),o}var Re=forwardRef(function({config:t,preset:o,paused:r=false,transition:v,interactive:i=false,preserveDrawingBuffer:h=false,className:_=""},g){let G=useMemo(()=>ue(t,o),[t,o]),{canvasRef:a}=se(G,{paused:r,transition:v,interactive:i,preserveDrawingBuffer:h}),n=useCallback(d=>{a.current=d,typeof g=="function"?g(d):g&&(g.current=d);},[a,g]);return jsx("canvas",{ref:n,className:`w-full h-full block select-none touch-none ${_}`.trim(),"aria-label":"gradflow animated gradient background"})}),fe=Re;function N(){return {r:Math.floor(Math.random()*256),g:Math.floor(Math.random()*256),b:Math.floor(Math.random()*256)}}function Ee(){return {color1:N(),color2:N(),color3:N()}}export{H as DEFAULT_CONFIG,te as GRADIENT_TYPES,k as GRADIENT_TYPE_NUMBER,fe as GradFlow,O as PRESETS,fe as default,Ee as generateRandomColors,ce as hexToRgb,S as normalizeColor,N as randomRGB,xe as rgbToHex};