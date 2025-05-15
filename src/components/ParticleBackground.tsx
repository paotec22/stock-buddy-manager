
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useRef } from "react";

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const { theme } = useTheme();

  // Configuration - moved inside component scope
  const particleRadius = 2;
  const particleSpeed = 0.5; // <-- Moved this here to fix the scope issue
  const connectionDistance = 120;
  const lineWidth = 0.5;

  // Particle class definition
  class Particle {
    x: number;
    y: number;
    radius: number;
    color: string;
    vx: number;
    vy: number;

    constructor(x: number, y: number, radius: number, color: string) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.vx = (Math.random() - 0.5) * particleSpeed * 2;
      this.vy = (Math.random() - 0.5) * particleSpeed * 2;
    }

    // Draw particle
    draw(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      ctx.fillStyle = this.color;
      ctx.fill();
    }

    // Update particle position and handle screen boundaries
    update(ctx: CanvasRenderingContext2D, particleColor: string) {
      this.x += this.vx;
      this.y += this.vy;

      const canvas = ctx.canvas;
      // Wrap particles around the screen
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;

      // Update color in case theme changed
      this.color = particleColor;
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Theme-based colors
    const particleColor = theme === 'dark' 
      ? 'rgba(255, 255, 255, 0.7)' 
      : 'rgba(0, 0, 0, 0.6)';
    
    const lineColor = theme === 'dark'
      ? 'rgba(255, 255, 255, 0.25)'
      : 'rgba(0, 0, 0, 0.15)';

    // Initialize particles
    const initParticles = () => {
      if (!canvas) return;
      
      const particleDensity = 0.00007;
      let numParticles = Math.floor(canvas.width * canvas.height * particleDensity);
      if (numParticles < 50) numParticles = 50; // Minimum particles
      if (numParticles > 300) numParticles = 300; // Maximum particles

      particlesRef.current = [];
      for (let i = 0; i < numParticles; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particlesRef.current.push(new Particle(x, y, particleRadius, particleColor));
      }
    };

    // Draw lines between nearby particles
    const connectParticles = () => {
      if (!ctx) return;
      
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            
            // Opacity based on distance
            const opacity = 1 - (distance / connectionDistance);
            
            // Parse the RGB values from lineColor
            const colorParts = lineColor.substring(
              lineColor.indexOf('(') + 1, 
              lineColor.lastIndexOf(')')
            ).split(',');
            
            const r = colorParts[0].trim();
            const g = colorParts[1].trim();
            const b = colorParts[2].trim();
            const baseOpacity = parseFloat(colorParts[3] || "0.3");
            
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity * baseOpacity})`;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
          }
        }
      }
    };

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach(particle => {
        particle.update(ctx, particleColor);
        particle.draw(ctx);
      });

      connectParticles();

      animationRef.current = requestAnimationFrame(animate);
    };

    // Set canvas size
    const resizeCanvas = () => {
      if (!canvas) return;
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    // Set up event listeners and start animation
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [theme]); // Re-initialize when theme changes

  return (
    <canvas 
      ref={canvasRef} 
      id="particle-canvas" 
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
    />
  );
}
