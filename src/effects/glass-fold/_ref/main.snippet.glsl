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
