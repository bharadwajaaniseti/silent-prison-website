import React, { useEffect, useRef } from 'react';

/* ---------- Types ---------- */
interface Shooter {
  x: number; y: number; vx: number; vy: number;
  size: number; trail: number; color: string;
  opacity: number; fadeRate: number; burnOutAt?: number;
  distance: number; traveled: number;
}
interface StaticStar { x: number; y: number; size: number; opacity: number; twinkleSpeed: number; }
interface NebulaBlob { x: number; y: number; r: number; hue: number; alpha: number; }

interface Planet {
  x: number; y: number; r: number;
  texture: HTMLImageElement | null;
  hue: number; alpha: number;
  vx: number; vy: number;
  hasRings: boolean; ringTilt: number; ringWidth: number; ringAlpha: number;
  spin: number; spinSpeed: number;
  atmosphereColor?: string;
  depth: number;
  orbitAngle?: number; // Added for orbital motion
}

/* ---------- Utils ---------- */
const rand = (a: number, b: number) => Math.random() * (b - a) + a;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const hsla = (h: number, s: number, l: number, a: number) => `hsla(${h} ${s}% ${l}% / ${a})`;

/* ---------- Component ---------- */
const ShootingStars: React.FC = () => {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const fgRef = useRef<HTMLCanvasElement>(null);
  const bgCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const fgCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const shootersRef = useRef<Shooter[]>([]);
  const starfieldRef = useRef<StaticStar[]>([]);
  const nebulaeRef = useRef<NebulaBlob[][]>([]);
  const planetsRef = useRef<Planet[]>([]);
  const texturesRef = useRef<HTMLImageElement[]>([]);
  const rafRef = useRef<number>();
  const bgTimerRef = useRef<number>();

  /* Tunables */
  const MAX_SHOOTERS = 5;
  const SPAWN_CHANCE = 0.02;
  const MIN_SPEED = 0.5;
  const MAX_SPEED = 1.0;
  const MIN_SIZE = 1.2;
  const MAX_SIZE = 2.4;
  const MIN_TRAIL = 120;
  const MAX_TRAIL = 280;
  const BURNOUT_PROB = 0.2;

  const STATIC_STARS = 140;
  const NEBULA_COUNT = 2;
  const NEBULA_BLOBS_RANGE: [number, number] = [3, 5];
  const NEBULA_BASE_ALPHA = 0.03;
  const BG_TWINKLE_SPEED: [number, number] = [0.002, 0.01];

  /* Helpers */
  const setupCanvas = (canvas: HTMLCanvasElement) => {
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const { innerWidth: w, innerHeight: h } = window;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  };

  const resizeBoth = () => {
    if (bgRef.current) bgCtxRef.current = setupCanvas(bgRef.current);
    if (fgRef.current) fgCtxRef.current = setupCanvas(fgRef.current);
  };

  const loadAllTextures = async () => {
    const textureNames = [
      'earth.jpg', 'mars.jpg', 'moon.jpg', 'jupiter.jpg', 'saturn.jpg', 'venus.jpg', 'neptune.jpg', 'uranus.jpg', 'mercury.jpg'
    ];
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };
    const textures: HTMLImageElement[] = [];
    for (const name of textureNames) {
      try {
        const img = await loadImage(`/textures/space/${name}`);
        textures.push(img);
      } catch {}
    }
    texturesRef.current = textures;
  };

  const seedStarfield = () => {
    const w = bgRef.current?.clientWidth || 0;
    const h = bgRef.current?.clientHeight || 0;
    starfieldRef.current = Array.from({ length: STATIC_STARS }).map(() => ({
      x: rand(0, w),
      y: rand(0, h),
      size: rand(0.5, 1.5),
      opacity: rand(0.3, 0.9),
      twinkleSpeed: rand(BG_TWINKLE_SPEED[0], BG_TWINKLE_SPEED[1]),
    }));
  };

  const seedNebulas = () => {
    const w = bgRef.current?.clientWidth || 0;
    const h = bgRef.current?.clientHeight || 0;
    nebulaeRef.current = [];
    for (let i = 0; i < NEBULA_COUNT; i++) {
      const cx = rand(0, w);
      const cy = rand(0, h);
      const hue = rand(220, 280);
      const blobs: NebulaBlob[] = [];
      const count = Math.floor(rand(...NEBULA_BLOBS_RANGE));
      const spread = rand(100, 200);
      for (let j = 0; j < count; j++) {
        const ang = rand(0, Math.PI * 2);
        const rad = rand(spread * 0.3, spread);
        blobs.push({
          x: cx + Math.cos(ang) * rad * 0.4,
          y: cy + Math.sin(ang) * rad * 0.4,
          r: rand(80, 140),
          hue,
          alpha: NEBULA_BASE_ALPHA * rand(0.8, 1.3),
        });
      }
      nebulaeRef.current.push(blobs);
    }
  };

  // When seeding planets, give them random slow velocities
  const seedPlanets = () => {
    const w = bgRef.current?.clientWidth || 0;
    const h = bgRef.current?.clientHeight || 0;
    const textures = texturesRef.current as HTMLImageElement[];
    planetsRef.current = [];
    const planetCount = Math.min(textures.length, 7 + Math.floor(Math.random() * 3));
    for (let i = 0; i < planetCount; i++) {
      const r = rand(40, 160);
      const depth = rand(0.2, 1.0);
      const alpha = clamp(0.18 + depth * 0.5, 0.18, 0.7);
      // Give each planet a random slow velocity
      const angle = rand(0, Math.PI * 2);
      const speed = rand(0.15, 0.35) * (1.2 - depth); // Farther = slower
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      planetsRef.current.push({
        x: rand(r, w - r),
        y: rand(r, h - r),
        r: r * depth,
        texture: textures[i],
        hue: rand(0, 360),
        alpha,
        vx,
        vy,
        hasRings: false,
        ringTilt: 0,
        ringWidth: 0,
        ringAlpha: 0,
        spin: rand(0, Math.PI * 2),
        spinSpeed: rand(-0.002, 0.002),
        atmosphereColor: undefined,
        depth,
      });
    }
  };

  const drawPlanets = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    planetsRef.current.forEach(p => {
      p.x += p.vx; 
      p.y += p.vy; 
      p.spin += p.spinSpeed;
      
      // Wrap around screen
      if (p.x < -p.r) p.x = w + p.r;
      if (p.x > w + p.r) p.x = -p.r;
      if (p.y < -p.r) p.y = h + p.r;
      if (p.y > h + p.r) p.y = -p.r;

      ctx.save();
      ctx.globalAlpha = 0.22; // Make planets even dimmer
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);

      // Draw atmosphere glow
      if (p.atmosphereColor) {
        const atmosphereGrad = ctx.createRadialGradient(0, 0, p.r * 0.9, 0, 0, p.r * 1.3);
        atmosphereGrad.addColorStop(0, 'transparent');
        atmosphereGrad.addColorStop(0.7, p.atmosphereColor);
        atmosphereGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = atmosphereGrad;
        ctx.beginPath();
        ctx.arc(0, 0, p.r * 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw planet
      if (p.texture) {
        // Create circular clipping path
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.clip();
        
        // Draw texture
        ctx.drawImage(p.texture, -p.r, -p.r, p.r * 2, p.r * 2);
        
        // Add subtle shading
        const shadeGrad = ctx.createRadialGradient(-p.r * 0.3, -p.r * 0.3, 0, 0, 0, p.r * 1.2);
        shadeGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
        shadeGrad.addColorStop(0.6, 'rgba(0,0,0,0)');
        shadeGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = shadeGrad;
        ctx.fill();
      } else {
        // Fallback gradient if texture fails to load
        const g = ctx.createRadialGradient(-p.r * 0.4, -p.r * 0.4, p.r * 0.2, 0, 0, p.r * 1.2);
        g.addColorStop(0, hsla(p.hue, 60, 70, p.alpha));
        g.addColorStop(0.5, hsla(p.hue, 70, 50, p.alpha * 0.9));
        g.addColorStop(1, hsla(p.hue, 80, 30, p.alpha * 0.6));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Draw rings if planet has them
      if (p.hasRings) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.ringTilt + p.spin * 0.1);
        
        // Multiple ring bands
        for (let i = 0; i < 3; i++) {
          const ringR = p.ringWidth + i * 8;
          const ringAlpha = p.ringAlpha * (1 - i * 0.2);
          
          ctx.strokeStyle = `rgba(200, 180, 120, ${ringAlpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(0, 0, ringR, ringR * 0.2, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    });
  };

  // Orbit planets around a center point and rotate them
  const ORBIT_CENTERS = [
    { x: 0.25, y: 0.7 }, // left-bottom
    { x: 0.75, y: 0.7 }, // right-bottom
    { x: 0.5, y: 0.35 }, // center-top
    { x: 0.5, y: 0.5 },  // center
  ];
  const ORBIT_RADII = [
    0.18, 0.22, 0.32, 0.38, 0.45, 0.52, 0.6
  ];
  const drawDepthPlanets = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Sort planets by depth so far ones are drawn first
    planetsRef.current.sort((a, b) => a.depth - b.depth);
    planetsRef.current.forEach((p, idx) => {
      // Assign each planet an orbit center and radius
      const centerIdx = idx % ORBIT_CENTERS.length;
      const orbitCenter = ORBIT_CENTERS[centerIdx];
      const orbitRadius = ORBIT_RADII[idx % ORBIT_RADII.length] * Math.min(w, h);
      // Calculate orbit angle
    p.orbitAngle = (p.orbitAngle ?? rand(0, Math.PI * 2)) + (0.0003 + 0.0002 * (idx + 1));
      p.x = w * orbitCenter.x + Math.cos(p.orbitAngle) * orbitRadius;
      p.y = h * orbitCenter.y + Math.sin(p.orbitAngle) * orbitRadius;
      // Rotate planet
      p.spin += p.spinSpeed * 0.25 + 0.002;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      if (p.depth < 0.4) {
        ctx.filter = 'blur(2.5px)';
      } else if (p.depth < 0.7) {
        ctx.filter = 'blur(1.2px)';
      } else {
        ctx.filter = 'none';
      }
      if (p.texture) {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(p.texture, -p.r, -p.r, p.r * 2, p.r * 2);
      } else {
        const g = ctx.createRadialGradient(-p.r * 0.4, -p.r * 0.4, p.r * 0.2, 0, 0, p.r * 1.2);
        g.addColorStop(0, hsla(p.hue, 60, 70, p.alpha));
        g.addColorStop(0.5, hsla(p.hue, 70, 50, p.alpha * 0.9));
        g.addColorStop(1, hsla(p.hue, 80, 30, p.alpha * 0.6));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  };

  // Draw cosmic clouds (nebula/fog) - static
  let staticClouds: {cx:number,cy:number,r:number,rot:number,grad:CanvasGradient,ellipseY:number,alpha:number}[] = [];
  const generateStaticClouds = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    staticClouds = [];
    for (let i = 0; i < 4; i++) {
      const cx = rand(w * 0.2, w * 0.8);
      const cy = rand(h * 0.2, h * 0.8);
      const r = rand(180, 420);
      const rot = rand(0, Math.PI * 2);
      const ellipseY = r * rand(0.5, 1.2);
      const alpha = rand(0.08, 0.18);
      const grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
      grad.addColorStop(0, 'rgba(30,30,40,0.7)');
      grad.addColorStop(0.5, 'rgba(20,20,30,0.3)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      staticClouds.push({cx,cy,r,rot,grad,ellipseY,alpha});
    }
  };
  const drawCosmicClouds = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    staticClouds.forEach(cloud => {
      ctx.save();
      ctx.globalAlpha = cloud.alpha;
      ctx.translate(cloud.cx, cloud.cy);
      ctx.rotate(cloud.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, cloud.r, cloud.ellipseY, 0, 0, Math.PI * 2);
      ctx.fillStyle = cloud.grad;
      ctx.fill();
      ctx.restore();
    });
  };

  const drawBackground = () => {
    const ctx = bgCtxRef.current;
    const canvas = bgRef.current;
    if (!ctx || !canvas) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);

    // Draw starfield
    starfieldRef.current.forEach(s => {
      s.opacity += s.twinkleSpeed * (Math.random() < 0.5 ? 1 : -1);
      s.opacity = clamp(s.opacity, 0.2, 1);
      ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw nebulae
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    nebulaeRef.current.forEach(cluster => {
      cluster.forEach(b => {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, hsla(b.hue, 80, 60, b.alpha));
        g.addColorStop(0.5, hsla((b.hue + 15) % 360, 70, 50, b.alpha * 0.7));
        g.addColorStop(1, hsla(b.hue, 60, 40, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    ctx.restore();

    // Draw cosmic clouds
    drawCosmicClouds(ctx, w, h);

    // Draw planets
    drawPlanets(ctx, w, h);
    drawDepthPlanets(ctx, w, h);
  };

  // Draw shooting stars behind planets
  const drawShootingStarsBehindPlanets = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    shootingStarsRef.current.forEach((star) => {
      // Only draw stars flagged as 'behind'
      if (star.behind) {
        ctx.save();
        ctx.globalAlpha = star.alpha;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = star.size;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x - star.vx * 12, star.y - star.vy * 12);
        ctx.stroke();
        ctx.restore();
      }
    });
  };

  // Draw shooting stars in front of planets
  const drawShootingStarsInFrontOfPlanets = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    shootingStarsRef.current.forEach((star) => {
      if (!star.behind) {
        ctx.save();
        ctx.globalAlpha = star.alpha;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = star.size;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x - star.vx * 12, star.y - star.vy * 12);
        ctx.stroke();
        ctx.restore();
      }
    });
  };

  // When seeding shooting stars, randomly assign some to be 'behind'
  function seedShootingStars(count: number, w: number, h: number) {
    const arr = [];
    for (let i = 0; i < count; ++i) {
      arr.push({
        x: rand(0, w),
        y: rand(0, h),
        vx: rand(-2, 2),
        vy: rand(-2, 2),
        alpha: rand(0.5, 1),
        size: rand(1, 2.5),
        behind: Math.random() < 0.4, // 40% go behind planets
      });
    }
    return arr;
  }

  const makeShooter = (): Shooter | null => {
    const w = fgRef.current?.clientWidth || 0;
    const h = fgRef.current?.clientHeight || 0;
    if (!w || !h) return null;

    const margin = 40;
    const edges = ['top', 'right', 'bottom', 'left'] as const;
    const edge = edges[Math.floor(rand(0, edges.length))];

    let sx = 0, sy = 0, tx = 0, ty = 0;
    if (edge === 'top')    { sx = rand(-margin, w + margin); sy = -margin; }
    if (edge === 'bottom') { sx = rand(-margin, w + margin); sy = h + margin; }
    if (edge === 'left')   { sx = -margin; sy = rand(-margin, h + margin); }
    if (edge === 'right')  { sx = w + margin; sy = rand(-margin, h + margin); }

    const aimJitter = 0.25;
    const opposite = edge === 'top'    ? { x: rand(-margin, w + margin), y: h + margin }
                   : edge === 'bottom' ? { x: rand(-margin, w + margin), y: -margin }
                   : edge === 'left'   ? { x: w + margin, y: rand(-margin, h + margin) }
                                       : { x: -margin,   y: rand(-margin, h + margin) };
    tx = clamp(opposite.x + rand(-w * aimJitter, w * aimJitter), -margin, w + margin);
    ty = clamp(opposite.y + rand(-h * aimJitter, h * aimJitter), -margin, h + margin);

    const dx = tx - sx, dy = ty - sy;
    const dist = Math.hypot(dx, dy);
    const speed = rand(MIN_SPEED, MAX_SPEED);
    const ux = dx / dist, uy = dy / dist;

    const hue = Math.floor(rand(0, 360));
    const color = hsla(hue, Math.floor(rand(70, 100)), Math.floor(rand(60, 90)), 1);

    return {
      x: sx, y: sy, vx: ux * speed, vy: uy * speed,
      size: rand(MIN_SIZE, MAX_SIZE),
      trail: rand(MIN_TRAIL, MAX_TRAIL),
      color,
      opacity: rand(0.7, 1),
      fadeRate: rand(0.006, 0.015),
      burnOutAt: Math.random() < BURNOUT_PROB ? rand(0.35, 0.85) : undefined,
      distance: dist, traveled: 0,
    };
  };

  const updateShooter = (s: Shooter): Shooter | null => {
    const w = fgRef.current?.clientWidth || 0;
    const h = fgRef.current?.clientHeight || 0;
    const next = { ...s };
    next.x += next.vx; next.y += next.vy;
    next.traveled += Math.hypot(next.vx, next.vy);

    if (typeof next.burnOutAt === 'number' && next.traveled / next.distance >= next.burnOutAt) {
      next.opacity -= next.fadeRate;
    }

    const margin = 60;
    const out =
      next.opacity <= 0 ||
      next.x < -margin || next.x > w + margin ||
      next.y < -margin || next.y > h + margin ||
      next.traveled > next.distance + margin * 2;

    return out ? null : next;
  };

  const drawShooter = (ctx: CanvasRenderingContext2D, s: Shooter) => {
    const ang = Math.atan2(s.vy, s.vx);
    const tx = s.x - Math.cos(ang) * s.trail;
    const ty = s.y - Math.sin(ang) * s.trail;

    const head = s.color.replace(/[\d.]+\)$/, `${s.opacity})`);
    const tail = s.color.replace(/[\d.]+\)$/, '0)');
    const grad = ctx.createLinearGradient(tx, ty, s.x, s.y);
    grad.addColorStop(0, tail);
    grad.addColorStop(1, head);

    ctx.strokeStyle = grad;
    ctx.lineWidth = s.size;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
  };

  const animate = () => {
    rafRef.current = requestAnimationFrame(animate);
    const ctx = fgCtxRef.current;
    const canvas = fgRef.current;
    if (!ctx || !canvas) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);

    if (shootersRef.current.length < MAX_SHOOTERS && Math.random() < SPAWN_CHANCE) {
      const s = makeShooter();
      if (s) shootersRef.current.push(s);
    }

    shootersRef.current = shootersRef.current
      .map(updateShooter)
      .filter((s): s is Shooter => !!s);

    shootersRef.current.forEach(s => drawShooter(ctx, s));
  };

  useEffect(() => {
    const initialize = async () => {
      resizeBoth();
      window.addEventListener('resize', resizeBoth);

      await loadAllTextures();
      
      seedStarfield();
      seedNebulas();
      seedPlanets();
      const w = bgRef.current?.clientWidth || 0;
      const h = bgRef.current?.clientHeight || 0;
      if (bgCtxRef.current && w && h) {
        generateStaticClouds(bgCtxRef.current, w, h);
      }

      drawBackground();
      bgTimerRef.current = window.setInterval(drawBackground, 50);

      animate();
    };

    initialize();

    return () => {
      window.removeEventListener('resize', resizeBoth);
      cancelAnimationFrame(rafRef.current!);
      clearInterval(bgTimerRef.current!);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={bgRef} style={{ position: 'absolute', inset: 0, background: 'black', zIndex: 0 }} />
      <canvas ref={fgRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
    </div>
  );
};

export default ShootingStars;