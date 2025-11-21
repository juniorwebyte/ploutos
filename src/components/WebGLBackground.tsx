// Componente WebGL para animações de fundo na Landing Page
import { useEffect, useRef } from 'react';

interface WebGLBackgroundProps {
  intensity?: number;
  speed?: number;
  colors?: [number, number, number][];
}

export default function WebGLBackground({ 
  intensity = 0.5, 
  speed = 1.0,
  colors = [[0.2, 0.1, 0.4], [0.1, 0.2, 0.5], [0.3, 0.1, 0.3]]
}: WebGLBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.warn('WebGL não suportado, usando fallback CSS');
      return;
    }

    // Configurar tamanho do canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Shader de vértice
    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_uv = (a_position + 1.0) * 0.5;
      }
    `;

    // Shader de fragmento com animação de ondas
    const fragmentShaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_intensity;
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      uniform vec3 u_color3;
      varying vec2 v_uv;
      
      void main() {
        vec2 uv = v_uv;
        
        // Criar padrão de ondas animadas
        float wave1 = sin(uv.x * 3.0 + u_time * 0.5) * 0.5 + 0.5;
        float wave2 = sin(uv.y * 2.0 + u_time * 0.3) * 0.5 + 0.5;
        float wave3 = sin((uv.x + uv.y) * 2.5 + u_time * 0.4) * 0.5 + 0.5;
        
        // Misturar cores baseado nas ondas
        vec3 color = mix(
          mix(u_color1, u_color2, wave1),
          u_color3,
          wave2 * 0.5
        );
        
        // Adicionar brilho
        float glow = sin(uv.x * 5.0 + u_time) * sin(uv.y * 5.0 + u_time) * 0.1;
        color += glow * u_intensity;
        
        gl_FragColor = vec4(color, u_intensity);
      }
    `;

    // Compilar shader
    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Erro ao compilar shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    
    if (!vertexShader || !fragmentShader) return;

    // Criar programa
    const program = gl.createProgram();
    if (!program) return;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Erro ao linkar programa:', gl.getProgramInfoLog(program));
      return;
    }

    // Criar buffer de vértices (quad que cobre toda a tela)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);

    // Configurar atributos
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Obter localizações dos uniforms
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const intensityLocation = gl.getUniformLocation(program, 'u_intensity');
    const color1Location = gl.getUniformLocation(program, 'u_color1');
    const color2Location = gl.getUniformLocation(program, 'u_color2');
    const color3Location = gl.getUniformLocation(program, 'u_color3');

    let startTime = Date.now();

    // Loop de animação
    const animate = () => {
      const currentTime = (Date.now() - startTime) * 0.001 * speed;
      
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      
      gl.uniform1f(timeLocation, currentTime);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(intensityLocation, intensity);
      gl.uniform3f(color1Location, colors[0][0], colors[0][1], colors[0][2]);
      gl.uniform3f(color2Location, colors[1][0], colors[1][1], colors[1][2]);
      gl.uniform3f(color3Location, colors[2][0], colors[2][1], colors[2][2]);
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, [intensity, speed, colors]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}

