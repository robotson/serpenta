(() => {
  "use strict";

  const MAX_POINTS = 96;

  const vertexSource = `#version 300 es
    in vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `#version 300 es
    precision highp float;

    uniform vec2 u_resolution;
    uniform vec2 u_points[${MAX_POINTS}];
    uniform int u_count;
    uniform vec2 u_direction;
    out vec4 outColor;

    float segmentDistance(vec2 point, vec2 a, vec2 b, out float position) {
      vec2 span = b - a;
      position = clamp(dot(point - a, span) / max(dot(span, span), 0.001), 0.0, 1.0);
      return length(point - (a + span * position));
    }

    float lineDistance(vec2 point, vec2 a, vec2 b) {
      float position;
      return segmentDistance(point, a, b, position);
    }

    float scalePattern(vec2 point) {
      vec2 grid = point / vec2(5.5, 4.2);
      float row = floor(grid.y);
      grid.x += mod(row, 2.0) * 0.5;
      vec2 diamond = abs(fract(grid) - 0.5);
      return smoothstep(0.37, 0.48, diamond.x + diamond.y);
    }

    void main() {
      vec2 point = gl_FragCoord.xy;
      float closest = 10000.0;
      float along = 0.0;
      float radiusAtClosest = 0.0;

      for (int i = 0; i < ${MAX_POINTS - 1}; i++) {
        if (i >= u_count - 1) break;
        float position;
        float distanceToSegment = segmentDistance(point, u_points[i], u_points[i + 1], position);
        float progress = (float(i) + position) / max(float(u_count - 1), 1.0);
        float radius = mix(19.5, 8.0, pow(progress, 1.7));
        float signedDistance = distanceToSegment - radius;
        if (signedDistance < closest) {
          closest = signedDistance;
          along = float(i) + position;
          radiusAtClosest = radius;
        }
      }

      vec2 head = u_points[0];
      vec2 forward = normalize(u_direction);
      vec2 side = vec2(-forward.y, forward.x);
      vec2 fromHead = point - head;
      float headForward = dot(fromHead, forward);
      float headSide = dot(fromHead, side);
      float headShape = length(vec2(headForward / 1.18, headSide)) - 20.5;
      closest = min(closest, headShape);

      float outerAlpha = 1.0 - smoothstep(2.2, 4.8, closest);
      if (outerAlpha <= 0.0) discard;

      vec3 violet = vec3(0.39, 0.08, 0.58);
      vec3 blackScale = vec3(0.018, 0.014, 0.025);
      vec3 boneScale = vec3(0.86, 0.81, 0.67);
      float stripeWarp = sin(point.x * 0.17 + point.y * 0.11) * 0.055;
      float band = step(0.47, fract(along * 0.78 + 0.08 + stripeWarp));
      float scales = scalePattern(point + vec2(along * 2.1, along * 1.4));
      vec3 body = mix(blackScale, boneScale, band);
      body *= mix(0.90, 1.08, scales);
      float centerDistance = max(0.0, closest + radiusAtClosest);
      float roundness = clamp(1.0 - centerDistance / max(radiusAtClosest, 1.0), 0.0, 1.0);
      body *= 0.62 + roundness * 0.58;
      body += pow(roundness, 5.0) * vec3(0.16, 0.12, 0.20);
      float core = 1.0 - smoothstep(-0.8, 1.0, closest);
      float rim = 1.0 - smoothstep(-3.8, 0.6, abs(closest + 2.0));
      vec3 color = mix(violet, body, core);
      color += violet * rim * 0.8;

      float eyeForward = headForward - 6.5;
      float eyeA = length(vec2(eyeForward / 1.55, headSide - 7.0)) - 3.5;
      float eyeB = length(vec2(eyeForward / 1.55, headSide + 7.0)) - 3.5;
      float eyeWhites = 1.0 - smoothstep(0.0, 1.0, min(eyeA, eyeB));
      color = mix(color, vec3(0.93, 0.90, 0.80), eyeWhites);
      float pupilA = length(vec2((eyeForward + 0.8) / 1.2, headSide - 7.0)) - 1.7;
      float pupilB = length(vec2((eyeForward + 0.8) / 1.2, headSide + 7.0)) - 1.7;
      float pupils = 1.0 - smoothstep(0.0, 0.75, min(pupilA, pupilB));
      color = mix(color, vec3(0.04, 0.02, 0.05), pupils);
      float glintA = length(vec2(eyeForward + 0.1, headSide - 6.4)) - 0.7;
      float glintB = length(vec2(eyeForward + 0.1, headSide + 7.6)) - 0.7;
      float glints = 1.0 - smoothstep(0.0, 0.5, min(glintA, glintB));
      color = mix(color, vec3(0.72, 1.0, 0.34), glints);

      vec2 tongueStart = head + forward * 15.0;
      vec2 tongueEnd = head + forward * 27.0;
      float tongue = lineDistance(point, tongueStart, tongueEnd);
      float forkA = lineDistance(point, tongueEnd, tongueEnd + forward * 5.0 + side * 4.0);
      float forkB = lineDistance(point, tongueEnd, tongueEnd + forward * 5.0 - side * 4.0);
      float tongueMask = 1.0 - smoothstep(1.1, 2.0, min(tongue, min(forkA, forkB)));
      color = mix(color, vec3(0.78, 0.10, 0.55), tongueMask);
      outerAlpha = max(outerAlpha, tongueMask);

      float highlight = smoothstep(radiusAtClosest, 0.0, abs(headSide)) * 0.08;
      color += highlight;
      outColor = vec4(color, outerAlpha);
    }
  `;

  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation failed");
    }
    return shader;
  }

  function createRenderer(board, width, height) {
    const canvas = document.createElement("canvas");
    canvas.className = "snake-canvas";
    canvas.width = width;
    canvas.height = height;
    canvas.setAttribute("aria-hidden", "true");
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance"
    });
    if (!gl) return null;

    try {
      const program = gl.createProgram();
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexSource));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || "Shader link failed");
      }

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.useProgram(program);
      gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), width, height);
      const pointsLocation = gl.getUniformLocation(program, "u_points[0]");
      const countLocation = gl.getUniformLocation(program, "u_count");
      const directionLocation = gl.getUniformLocation(program, "u_direction");
      gl.viewport(0, 0, width, height);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      board.appendChild(canvas);

      let previousSignature = "";
      let available = true;
      canvas.addEventListener("webglcontextlost", event => {
        event.preventDefault();
        available = false;
        canvas.hidden = true;
      });
      return {
        canvas,
        draw(snake, direction, cellSize) {
          if (!available) return false;
          const visible = snake.slice(0, MAX_POINTS);
          const signature = `${direction.x},${direction.y}|${visible.map(part => `${part.x},${part.y}`).join("|")}`;
          if (signature === previousSignature) return true;
          previousSignature = signature;
          const points = new Float32Array(MAX_POINTS * 2);
          visible.forEach((part, index) => {
            points[index * 2] = part.x * cellSize + cellSize / 2;
            points[index * 2 + 1] = height - (part.y * cellSize + cellSize / 2);
          });
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.useProgram(program);
          gl.uniform2fv(pointsLocation, points);
          gl.uniform1i(countLocation, visible.length);
          gl.uniform2f(directionLocation, direction.x, -direction.y);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          return true;
        }
      };
    } catch (error) {
      console.warn("Serpenta WebGL renderer unavailable; using sprite fallback.", error);
      return null;
    }
  }

  window.createSerpentaSnakeRenderer = createRenderer;
})();
