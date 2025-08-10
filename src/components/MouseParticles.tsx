import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  radius: number;
  targetRadius: number;
  angularVelocity: number;
  size: number;
  opacity: number;
  color: string;
  trail: { x: number; y: number; opacity: number }[];
  mass: number;
}

const MouseParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const lastMoveTimeRef = useRef(Date.now());
  const isMovingRef = useRef(false);

  const colors = ['#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B'];
  const particleCount = 8;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize particles with orbital properties
    particlesRef.current = Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 30 + Math.random() * 40;
      return {
        id: i,
        x: mouseRef.current.x + Math.cos(angle) * radius,
        y: mouseRef.current.y + Math.sin(angle) * radius,
        angle: angle,
        radius: radius,
        targetRadius: radius,
        angularVelocity: -0.008 - Math.random() * 0.004, // Always counter-clockwise, slower
        size: Math.random() * 2 + 1, // Smaller particles
        opacity: Math.random() * 0.4 + 0.2, // Lower opacity
        color: colors[Math.floor(Math.random() * colors.length)],
        trail: [],
        mass: Math.random() * 0.5 + 0.5
      };
    });

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      lastMoveTimeRef.current = Date.now();
      isMovingRef.current = true;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const currentTime = Date.now();
      const timeSinceLastMove = currentTime - lastMoveTimeRef.current;
      
      // Check if mouse stopped moving
      if (timeSinceLastMove > 200) {
        isMovingRef.current = false;
      }

      // Draw black hole effect at mouse position
      if (isMovingRef.current) {
        const gradient = ctx.createRadialGradient(
          mouseRef.current.x, mouseRef.current.y, 0,
          mouseRef.current.x, mouseRef.current.y, 50
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
        gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(mouseRef.current.x, mouseRef.current.y, 50, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw subtle event horizon
        ctx.beginPath();
        ctx.arc(mouseRef.current.x, mouseRef.current.y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      particlesRef.current.forEach((particle, index) => {
        // Update trail
        particle.trail.push({ x: particle.x, y: particle.y, opacity: particle.opacity });
        if (particle.trail.length > 6) { // Shorter trails
          particle.trail.shift();
        }

        if (isMovingRef.current) {
          // Smooth counter-clockwise orbital motion
          const dx = mouseRef.current.x - particle.x;
          const dy = mouseRef.current.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Gentle gravitational pull
          const gravitationalForce = Math.min(800 / (distance * distance), 0.2);
          
          // Maintain consistent orbital radius
          particle.targetRadius = Math.max(20, Math.min(70, distance - gravitationalForce * 30));
          
          // Very smooth radius transition
          particle.radius += (particle.targetRadius - particle.radius) * 0.02;
          
          // Consistent counter-clockwise motion with slight distance-based variation
          const baseVelocity = -0.008; // Always counter-clockwise
          const velocityMultiplier = Math.max(0.8, Math.min(1.5, 50 / distance));
          particle.angularVelocity = baseVelocity * velocityMultiplier;
          
          // Smooth angular update
          particle.angle += particle.angularVelocity;
          
          // Calculate orbital position
          const targetX = mouseRef.current.x + Math.cos(particle.angle) * particle.radius;
          const targetY = mouseRef.current.y + Math.sin(particle.angle) * particle.radius;
          
          // Very smooth movement to orbital position
          particle.x += (targetX - particle.x) * 0.05;
          particle.y += (targetY - particle.y) * 0.05;
          
          // Gentle opacity increase when orbiting
          particle.opacity = Math.min(0.6, particle.opacity + 0.01);
          
        } else {
          // Gentle scatter effect when mouse stops
          particle.radius += 1;
          particle.angularVelocity *= 0.98;
          particle.angle += particle.angularVelocity;
          
          const scatterX = mouseRef.current.x + Math.cos(particle.angle) * particle.radius;
          const scatterY = mouseRef.current.y + Math.sin(particle.angle) * particle.radius;
          
          particle.x += (scatterX - particle.x) * 0.02;
          particle.y += (scatterY - particle.y) * 0.02;
          
          // Fade out when scattering
          particle.opacity = Math.max(0.05, particle.opacity - 0.005);
          
          // Reset if too far
          if (particle.radius > 150) {
            particle.radius = 30 + Math.random() * 40;
            particle.targetRadius = particle.radius;
            particle.angularVelocity = -0.008 - Math.random() * 0.004;
          }
        }

        // Keep particles on screen with wrapping
        if (particle.x < -50) particle.x = canvas.width + 50;
        if (particle.x > canvas.width + 50) particle.x = -50;
        if (particle.y < -50) particle.y = canvas.height + 50;
        if (particle.y > canvas.height + 50) particle.y = -50;

        // Draw subtle trail
        particle.trail.forEach((trailPoint, trailIndex) => {
          const trailOpacity = (trailIndex / particle.trail.length) * particle.opacity * 0.2;
          const trailSize = particle.size * (trailIndex / particle.trail.length) * 0.5;
          
          ctx.beginPath();
          ctx.arc(trailPoint.x, trailPoint.y, trailSize, 0, Math.PI * 2);
          ctx.fillStyle = particle.color + Math.floor(trailOpacity * 255).toString(16).padStart(2, '0');
          ctx.fill();
        });

        // Draw particle with subtle glow
        const glowSize = particle.size * 2;
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, glowSize
        );
        gradient.addColorStop(0, particle.color + '80');
        gradient.addColorStop(0.5, particle.color + '40');
        gradient.addColorStop(1, particle.color + '00');
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw core particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();

        // Add subtle connection lines to nearby particles
        particlesRef.current.forEach((otherParticle, otherIndex) => {
          if (otherIndex <= index) return;
          
          const distance = Math.sqrt(
            Math.pow(particle.x - otherParticle.x, 2) + 
            Math.pow(particle.y - otherParticle.y, 2)
          );
          
          if (distance < 50) {
            const connectionOpacity = (1 - distance / 50) * particle.opacity * otherParticle.opacity * 0.1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${connectionOpacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default MouseParticles;