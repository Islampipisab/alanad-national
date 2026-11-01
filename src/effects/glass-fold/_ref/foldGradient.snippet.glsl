foldGradient(vec2 uv, float time) {
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

    vec3 