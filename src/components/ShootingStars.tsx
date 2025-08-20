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
}

interface BlackHole {
  x: number; y: number;
  eventHorizonR: number;
  photonSphereR: number;
  diskInnerR: number;
  diskOuterR: number;
  spin: number;
  spinSpeed: number;
  diskRotation: number;
  diskRotationSpeed: number;
  jetLength: number;
  jetWidth: number;
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
  const blackHoleRef = useRef<BlackHole | null>(null);
  const texturesRef = useRef<{ earth: HTMLImageElement | null; mars: HTMLImageElement | null }>({
    earth: null,
    mars: null
  });
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

  const PLANET_COUNT = 2;
  const PLANET_MIN_R = 60;
  const PLANET_MAX_R = 120;

  const BLACK_HOLE_ENABLED = true;

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

  const loadTextures = async () => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    try {
      const [earth, mars] = await Promise.all([
        loadImage('/textures/space/earth.jpg'),
        loadImage('/textures/space/mars.jpg')
      ]);
      texturesRef.current = { earth, mars };
    } catch (error) {
      console.warn('Could not load planet textures:', error);
      texturesRef.current = { earth: null, mars: null };
    }
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

  const seedPlanets = () => {
    const w = bgRef.current?.clientWidth || 0;
    const h = bgRef.current?.clientHeight || 0;
    planetsRef.current = [];
    
    const planetConfigs = [
      {
        texture: texturesRef.current.earth,
        atmosphereColor: 'rgba(100, 150, 255, 0.3)',
        hasRings: false
      },
      {
        texture: texturesRef.current.mars,
        atmosphereColor: 'rgba(255, 100, 50, 0.2)',
        hasRings: Math.random() < 0.3
      }
    ];

    for (let i = 0; i < PLANET_COUNT; i++) {
      const r = rand(PLANET_MIN_R, PLANET_MAX_R);
      const config = planetConfigs[i] || planetConfigs[0];
      
      planetsRef.current.push({
        x: rand(-r, w + r),
        y: rand(-r, h + r),
        r,
        texture: config.texture,
        hue: rand(0, 360),
        alpha: 0.8,
        vx: rand(-0.03, 0.03),
        vy: rand(-0.03, 0.03),
        hasRings: config.hasRings,
        ringTilt: rand(-0.5, 0.5),
        ringWidth: rand(r * 1.4, r * 1.9),
        ringAlpha: 0.4,
        spin: rand(0, Math.PI * 2),
        spinSpeed: rand(-0.001, 0.001),
        atmosphereColor: config.atmosphereColor,
      });
    }
  };

  const seedBlackHole = () => {
    if (!BLACK_HOLE_ENABLED) { blackHoleRef.current = null; return; }
    const w = bgRef.current?.clientWidth || 0;
    const h = bgRef.current?.clientHeight || 0;
    
    // Position black hole in upper right area like the reference image
    const cx = rand(w * 0.6, w * 0.9);
    const cy = rand(h * 0.1, h * 0.4);
    const eventHorizonR = rand(25, 35);
    
    blackHoleRef.current = {
      x: cx,
      y: cy,
      eventHorizonR,
      photonSphereR: eventHorizonR * 1.5,
      diskInnerR: eventHorizonR * 2.5,
      diskOuterR: eventHorizonR * 6,
      spin: rand(0, Math.PI * 2),
      spinSpeed: 0.005,
      diskRotation: 0,
      diskRotationSpeed: 0.008,
      jetLength: eventHorizonR * 8,
      jetWidth: eventHorizonR * 0.8,
    };
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

  const drawRealisticBlackHole = (ctx: CanvasRenderingContext2D) => {
    const bh = blackHoleRef.current;
    if (!bh) return;
    
    bh.spin += bh.spinSpeed;
    bh.diskRotation += bh.diskRotationSpeed;

    ctx.save();
    ctx.translate(bh.x, bh.y);

    // Draw relativistic jets (polar emissions)
    ctx.save();
    ctx.rotate(bh.spin);
    
    // Top jet
    const jetGrad1 = ctx.createLinearGradient(0, -bh.eventHorizonR, 0, -bh.jetLength);
    jetGrad1.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
    jetGrad1.addColorStop(0.3, 'rgba(150, 220, 255, 0.4)');
    jetGrad1.addColorStop(1, 'rgba(200, 240, 255, 0.1)');
    
    ctx.fillStyle = jetGrad1;
    ctx.beginPath();
    ctx.moveTo(-bh.jetWidth/2, -bh.eventHorizonR);
    ctx.lineTo(-bh.jetWidth/4, -bh.jetLength);
    ctx.lineTo(bh.jetWidth/4, -bh.jetLength);
    ctx.lineTo(bh.jetWidth/2, -bh.eventHorizonR);
    ctx.closePath();
    ctx.fill();
    
    // Bottom jet
    const jetGrad2 = ctx.createLinearGradient(0, bh.eventHorizonR, 0, bh.jetLength);
    jetGrad2.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
    jetGrad2.addColorStop(0.3, 'rgba(150, 220, 255, 0.4)');
    jetGrad2.addColorStop(1, 'rgba(200, 240, 255, 0.1)');
    
    ctx.fillStyle = jetGrad2;
    ctx.beginPath();
    ctx.moveTo(-bh.jetWidth/2, bh.eventHorizonR);
    ctx.lineTo(-bh.jetWidth/4, bh.jetLength);
    ctx.lineTo(bh.jetWidth/4, bh.jetLength);
    ctx.lineTo(bh.jetWidth/2, bh.eventHorizonR);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();

    // Draw accretion disk with realistic colors and rotation
    ctx.save();
    ctx.rotate(bh.diskRotation);
    
    // Multiple disk layers for depth
    const diskLayers = 8;
    for (let i = 0; i < diskLayers; i++) {
      const t = i / (diskLayers - 1);
      const innerR = bh.diskInnerR + t * (bh.diskOuterR - bh.diskInnerR) * 0.3;
      const outerR = bh.diskInnerR + t * (bh.diskOuterR - bh.diskInnerR);
      
      // Temperature gradient - hotter (bluer) near center, cooler (redder) outside
      const temp = 1 - t * 0.8;
      const hue = temp * 60 + 10; // From blue-white to orange-red
      const sat = 90 - t * 20;
      const light = 80 - t * 30;
      const alpha = (0.6 - t * 0.4) * (1 - Math.sin(bh.diskRotation + t * Math.PI) * 0.2);
      
      const diskGrad = ctx.createRadialGradient(0, 0, innerR, 0, 0, outerR);
      diskGrad.addColorStop(0, hsla(hue, sat, light, alpha));
      diskGrad.addColorStop(0.4, hsla(hue + 10, sat - 10, light - 10, alpha * 0.8));
      diskGrad.addColorStop(0.8, hsla(hue + 20, sat - 20, light - 20, alpha * 0.4));
      diskGrad.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = diskGrad;
      ctx.save();
      ctx.scale(1, 0.3); // Flatten the disk
      ctx.beginPath();
      ctx.arc(0, 0, outerR, 0, Math.PI * 2);
      ctx.arc(0, 0, innerR, 0, Math.PI * 2, true);
      ctx.fill();
      ctx.restore();
    }
    
    ctx.restore();

    // Draw photon sphere (gravitational lensing effect)
    const lensGrad = ctx.createRadialGradient(0, 0, bh.photonSphereR * 0.9, 0, 0, bh.photonSphereR * 1.1);
    lensGrad.addColorStop(0, 'rgba(255,255,255,0)');
    lensGrad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
    lensGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = lensGrad;
    ctx.beginPath();
    ctx.arc(0, 0, bh.photonSphereR, 0, Math.PI * 2);
    ctx.fill();

    // Draw event horizon (pure black)
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.beginPath();
    ctx.arc(0, 0, bh.eventHorizonR, 0, Math.PI * 2);
    ctx.fill();

    // Add subtle rim lighting
    ctx.strokeStyle = 'rgba(255,200,100,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, bh.eventHorizonR + 1, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
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

    // Draw planets
    drawPlanets(ctx, w, h);
    
    // Draw realistic black hole
    drawRealisticBlackHole(ctx);
  };

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

      await loadTextures();
      
      seedStarfield();
      seedNebulas();
      seedPlanets();
      seedBlackHole();

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