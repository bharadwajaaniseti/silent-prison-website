import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  trail: number;
  opacity: number;
}

const ShootingStars: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationFrameRef = useRef<number>();

  // Initialize a star with random properties
  const createStar = (): Star => {
    const canvas = canvasRef.current;
    if (!canvas) return {} as Star;

    // Random starting position (mostly from edges)
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x, y;
    
    switch (edge) {
      case 0: // top
        x = Math.random() * canvas.width;
        y = -20;
        break;
      case 1: // right
        x = canvas.width + 20;
        y = Math.random() * canvas.height;
        break;
      case 2: // bottom
        x = Math.random() * canvas.width;
        y = canvas.height + 20;
        break;
      default: // left
        x = -20;
        y = Math.random() * canvas.height;
        break;
    }

    // Calculate angle based on starting position (tend towards center-ish)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let angle = Math.atan2(centerY - y, centerX - x);
    // Add some randomness to the angle
    angle += (Math.random() - 0.5) * Math.PI / 2;

    return {
      x,
      y,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 2 + 1, // Reduced speed range
      angle,
      trail: Math.random() * 30 + 20, // Longer trails
      opacity: Math.random() * 0.3 + 0.3 // Slightly more subtle
    };
  };

  // Update star position
  const updateStar = (star: Star): Star => {
    const canvas = canvasRef.current;
    if (!canvas) return star;

    const dx = Math.cos(star.angle) * star.speed;
    const dy = Math.sin(star.angle) * star.speed;

    return {
      ...star,
      x: star.x + dx,
      y: star.y + dy,
      opacity: star.opacity - 0.005
    };
  };

  // Check if star is out of bounds
  const isStarOutOfBounds = (star: Star): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return true;

    const margin = 50;
    return (
      star.x < -margin ||
      star.x > canvas.width + margin ||
      star.y < -margin ||
      star.y > canvas.height + margin ||
      star.opacity <= 0
    );
  };

  // Draw a single star
  const drawStar = (ctx: CanvasRenderingContext2D, star: Star) => {
    ctx.save();
    ctx.beginPath();
    
    // Create gradient for the trail
    const gradient = ctx.createLinearGradient(
      star.x - Math.cos(star.angle) * star.trail,
      star.y - Math.sin(star.angle) * star.trail,
      star.x,
      star.y
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(1, `rgba(255, 255, 255, ${star.opacity})`);
    
    ctx.strokeStyle = gradient;
    ctx.lineCap = 'round';
    ctx.lineWidth = star.size;
    
    // Draw the trail
    ctx.moveTo(
      star.x - Math.cos(star.angle) * star.trail,
      star.y - Math.sin(star.angle) * star.trail
    );
    ctx.lineTo(star.x, star.y);
    ctx.stroke();
    
    // Draw the star point
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
    ctx.arc(star.x, star.y, star.size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };

  // Animation loop
  const animate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas with slight fade effect
    ctx.fillStyle = 'rgba(17, 24, 39, 0.2)'; // Using bg-gray-900 color with more fade
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw stars
    starsRef.current = starsRef.current
      .map(updateStar)
      .filter(star => !isStarOutOfBounds(star));

    // Add new stars randomly with reduced frequency
    if (Math.random() < 0.03 && starsRef.current.length < 12) { // Lower spawn rate and fewer max stars
      starsRef.current.push(createStar());
    }

    // Draw all stars
    starsRef.current.forEach(star => drawStar(ctx, star));

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Handle window resize
  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
};

export default ShootingStars;
