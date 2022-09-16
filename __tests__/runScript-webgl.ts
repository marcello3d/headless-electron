export default function benchmarkWebgl(): string[] {
  // 4k
  const width = 3840;
  const height = 2160;

  // Create a canvas
  const canvas = window.document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  // Create context
  const options: WebGLContextAttributes = {
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
    failIfMajorPerformanceCaveat: true,
  };
  const gl =
    canvas.getContext("webgl2", options) || canvas.getContext("webgl", options);

  if (!gl) {
    throw new Error("Could not create WebGL context");
  }

  const log: string[] = [];

  log.push(
    `Made WebGL canvas ${gl.drawingBufferWidth} x ${gl.drawingBufferHeight}`
  );

  log.push(
    `WebGL Version: ${gl.getParameter(gl.VENDOR)} ${gl.getParameter(
      gl.VERSION
    )}, ${gl.getParameter(gl.SHADING_LANGUAGE_VERSION)}`
  );

  const glDebug = gl.getExtension("WEBGL_debug_renderer_info");
  if (glDebug) {
    log.push(
      `WebGL Driver:${gl.getParameter(
        glDebug.UNMASKED_RENDERER_WEBGL
      )} (${gl.getParameter(glDebug.UNMASKED_VENDOR_WEBGL)})`
    );
  } else {
    log.push(
      `WebGL Driver: -- could not load extension WEBGL_debug_renderer_info`
    );
  }

  const dimensions = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
  log.push(`MAX_VIEWPORT_DIMS: ${dimensions[0]} x ${dimensions[1]}`);
  log.push(
    `MAX_RENDERBUFFER_SIZE: ${gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)}`
  );
  log.push(`MAX_TEXTURE_SIZE: ${gl.getParameter(gl.MAX_TEXTURE_SIZE)}`);
  log.push(
    `MAX_TEXTURE_IMAGE_UNITS: ${gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)}`
  );
  log.push(
    `MAX_VERTEX_TEXTURE_IMAGE_UNITS: ${gl.getParameter(
      gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS
    )}`
  );
  log.push(
    `MAX_COMBINED_TEXTURE_IMAGE_UNITS: ${gl.getParameter(
      gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS
    )}`
  );

  /*============ Defining and storing the geometry =========*/

  const vertices = [
    -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1,
    -1, 1, 1, -1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, 1, -1, -1, 1, 1, -1,
    1, 1, 1, 1, -1, 1, -1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1, -1, 1, -1,
    -1, 1, 1, 1, 1, 1, 1, 1, -1,
  ];

  const colors = [
    5, 3, 7, 5, 3, 7, 5, 3, 7, 5, 3, 7, 1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 3, 0,
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1,
    0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
  ];

  const indices = [
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
    15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
  ];

  // Create and store data into vertex buffer
  const vertex_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Create and store data into color buffer
  const color_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  // Create and store data into index buffer
  const index_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  /*=================== Shaders =========================*/

  const vertCode =
    "attribute vec3 position;" +
    "uniform mat4 Pmatrix;" +
    "uniform mat4 Vmatrix;" +
    "uniform mat4 Mmatrix;" +
    "attribute vec3 color;" + // the color of the point
    "varying vec3 vColor;" +
    "void main(void) { " + // pre-built function
    "gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);" +
    "vColor = color;" +
    "}";

  const fragCode =
    "precision mediump float;" +
    "varying vec3 vColor;" +
    "void main(void) {" +
    "gl_FragColor = vec4(vColor, 1.);" +
    "}";

  const vertShader = gl.createShader(gl.VERTEX_SHADER);
  if (!vertShader) {
    throw new Error("Could not create vertex shader");
  }
  gl.shaderSource(vertShader, vertCode);
  gl.compileShader(vertShader);

  const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!fragShader) {
    throw new Error("Could not create fragment shader");
  }
  gl.shaderSource(fragShader, fragCode);
  gl.compileShader(fragShader);

  const shaderProgram = gl.createProgram();
  if (!shaderProgram) {
    throw new Error("Could not create shader program");
  }
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.linkProgram(shaderProgram);

  /* ====== Associating attributes to vertex shader =====*/
  const Pmatrix = gl.getUniformLocation(shaderProgram, "Pmatrix");
  const Vmatrix = gl.getUniformLocation(shaderProgram, "Vmatrix");
  const Mmatrix = gl.getUniformLocation(shaderProgram, "Mmatrix");

  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
  const position = gl.getAttribLocation(shaderProgram, "position");
  gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);

  // Position
  gl.enableVertexAttribArray(position);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
  const color = gl.getAttribLocation(shaderProgram, "color");
  gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);

  // Color
  gl.enableVertexAttribArray(color);
  gl.useProgram(shaderProgram);

  /*==================== MATRIX =====================*/

  function get_projection(angle, a, zMin, zMax) {
    const ang = Math.tan((angle * 0.5 * Math.PI) / 180); // angle*.5
    return [
      0.5 / ang,
      0,
      0,
      0,
      0,
      (0.5 * a) / ang,
      0,
      0,
      0,
      0,
      -(zMax + zMin) / (zMax - zMin),
      -1,
      0,
      0,
      (-2 * zMax * zMin) / (zMax - zMin),
      0,
    ];
  }

  const proj_matrix = get_projection(40, canvas.width / canvas.height, 1, 100);

  const mov_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const view_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

  // translating z
  view_matrix[14] = view_matrix[14] - 6; // zoom

  /*==================== Rotation ====================*/

  function rotateZ(m, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const mv0 = m[0],
      mv4 = m[4],
      mv8 = m[8];

    m[0] = c * m[0] - s * m[1];
    m[4] = c * m[4] - s * m[5];
    m[8] = c * m[8] - s * m[9];

    m[1] = c * m[1] + s * mv0;
    m[5] = c * m[5] + s * mv4;
    m[9] = c * m[9] + s * mv8;
  }

  function rotateX(m, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const mv1 = m[1],
      mv5 = m[5],
      mv9 = m[9];

    m[1] = m[1] * c - m[2] * s;
    m[5] = m[5] * c - m[6] * s;
    m[9] = m[9] * c - m[10] * s;

    m[2] = m[2] * c + mv1 * s;
    m[6] = m[6] * c + mv5 * s;
    m[10] = m[10] * c + mv9 * s;
  }

  function rotateY(m, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const mv0 = m[0],
      mv4 = m[4],
      mv8 = m[8];

    m[0] = c * m[0] + s * m[2];
    m[4] = c * m[4] + s * m[6];
    m[8] = c * m[8] + s * m[10];

    m[2] = c * m[2] - s * mv0;
    m[6] = c * m[6] - s * mv4;
    m[10] = c * m[10] - s * mv8;
  }

  /*================= Drawing ===========================*/
  let time_old = 0;

  const animate = function (time) {
    const dt = time - time_old;
    rotateZ(mov_matrix, dt * 0.005); // time
    rotateY(mov_matrix, dt * 0.002);
    rotateX(mov_matrix, dt * 0.003);
    time_old = time;

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0.5, 0.5, 0.5, 0.9);
    gl.clearDepth(1.0);

    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
    gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
    gl.uniformMatrix4fv(Mmatrix, false, mov_matrix);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  };

  function timeInSecs(time) {
    return time[0] + time[1] / 1e9;
  }

  log.push("Starting animation...");
  const numFrames = 10000;
  const startTime = process.hrtime();
  for (let time = 0; time < numFrames; time += 1) {
    animate(time);
    if (time % 1000 === 0) {
      const elapsed = timeInSecs(process.hrtime(startTime));
      log.push(
        `Elapsed: ${elapsed}, ${time} Frames, ${
          Math.round((time / elapsed) * 100) / 100
        } FPS`
      );
    }
  }
  const totalElapsed = timeInSecs(process.hrtime(startTime));

  log.push(
    `Done (took ${totalElapsed}s, or ${
      Math.round((numFrames / totalElapsed) * 100) / 100
    } FPS)`
  );
  return log;
}
