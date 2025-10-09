import { useEffect, useRef } from 'react';

interface LiquidGlassCanvasProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export function LiquidGlassCanvas({ containerRef }: LiquidGlassCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Initialize WebGL
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
      console.warn('WebGL not supported');
      return;
    }
    glRef.current = gl;

    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 position;
      varying vec2 vUV;
      void main() {
        vUV = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment shader with subtle liquid glass effect
    const fragmentShaderSource = `
      precision highp float;
      varying vec2 vUV;
      uniform float time;
      uniform vec2 resolution;
      
      // Noise function
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      
      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      
      // Fractal Brownian Motion for organic patterns
      float fbm(vec2 st) {
        float value = 0.0;
        float amplitude = 0.5;
        
        for(int i = 0; i < 3; i++) {
          value += amplitude * noise(st);
          st *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }
      
      void main() {
        vec2 uv = vUV;
        
        // Very subtle flowing pattern
        float t = time * 0.05;
        vec2 st = uv * 2.0 + vec2(t * 0.1, t * 0.08);
        
        // Generate soft noise pattern
        float n = fbm(st);
        
        // Edge fade - strong falloff to avoid visible borders
        float edgeX = abs(uv.x - 0.5);
        float edgeY = abs(uv.y - 0.5);
        float edgeDist = max(edgeX, edgeY);
        float edgeFade = 1.0 - smoothstep(0.3, 0.5, edgeDist);
        
        // Very subtle highlight pattern
        float highlight = (n - 0.5) * 0.08 * edgeFade;
        
        // Output barely visible white overlay
        vec3 color = vec3(1.0);
        float alpha = highlight * 0.15 * edgeFade;
        
        gl_FragColor = vec4(color, max(0.0, alpha));
      }
    `;

    // Compile shaders
    function compileShader(type: number, source: string): WebGLShader | null {
      const shader = gl.createShader(type);
      if (!shader) return null;
      
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;

    // Create program
    const program = gl.createProgram();
    if (!program) return;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    
    programRef.current = program;
    gl.useProgram(program);

    // Setup geometry (fullscreen quad)
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const timeLocation = gl.getUniformLocation(program, 'time');
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');

    // Resize handler
    function resize() {
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }

    resize();
    window.addEventListener('resize', resize);

    // Render loop
    function render() {
      if (!gl || !canvas || !program) return;

      const time = (Date.now() - startTimeRef.current) / 1000;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Enable blending
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // Update uniforms
      gl.uniform1f(timeLocation, time);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

      // Draw
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (gl && program) {
        gl.deleteProgram(program);
      }
    };
  }, [containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 rounded-xl"
      style={{
        mixBlendMode: 'screen',
        opacity: 0.6,
        zIndex: 1,
      }}
    />
  );
}
