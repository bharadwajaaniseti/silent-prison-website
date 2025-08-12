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
  hue: number; alpha: number;
  vx: number; vy: number;
  hasRings: boolean; ringTilt: number; ringWidth: number; ringAlpha: number;
  spin: number; spinSpeed: number;
}

interface BlackHole {
  x: number; y: number;
  r: number;            // event horizon radius
  diskR1: number;       // inner disk radius
  diskR2: number;       // outer disk radius
  spin: number;         // radians
  spinSpeed: number;    // radians per tick
  hue: number;          // accretion disk base hue
  alpha: number;        // disk alpha
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
  const NEBULA_COUNT = 3;
  const NEBULA_BLOBS_RANGE: [number, number] = [4, 7];
  const NEBULA_BASE_ALPHA = 0.04;
  const BG_TWINKLE_SPEED: [number, number] = [0.002, 0.01];

  const PLANET_COUNT = 2;
  const PLANET_MIN_R = 70;
  const PLANET_MAX_R = 140;

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

  const seedStarfield = () => {
    const w = bgRef.current?.clientWidth || 0;
    const h = bgRef.current?.clientHeight || 0;
    starfieldRef.current = Array.from({ length: STATIC_STARS }).map(() => ({
      x: rand(0, w),
      y: rand(0, h),
      size: rand(0.5, 1.3),
      opacity: rand(0.35, 0.95),
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
      const hue = rand(190, 320);
      const blobs: NebulaBlob[] = [];
      const count = Math.floor(rand(...NEBULA_BLOBS_RANGE));
      const spread = rand(120, 240);
      for (let j = 0; j < count; j++) {
        const ang = rand(0, Math.PI * 2);
        const rad = rand(spread * 0.25, spread);
        blobs.push({
          x: cx + Math.cos(ang) * rad * 0.35,
          y: cy + Math.sin(ang) * rad * 0.35,
          r: rand(60, 160),
          hue,
          alpha: NEBULA_BASE_ALPHA * rand(0.7, 1.2),
        });
      }
      nebulaeRef.current.push(blobs);
    }
  };

  const seedPlanets = () => {
    const w = bgRef.current?.clientWidth || 0;
    const h = bgRef.current?.clientHeight || 0;
    planetsRef.current = [];
    for (let i = 0; i < PLANET_COUNT; i++) {
      const r = rand(PLANET_MIN_R, PLANET_MAX_R);
      planetsRef.current.push({
        x: rand(-r, w + r),
        y: rand(-r, h + r),
        r,
        hue: rand(0, 360),
        alpha: 0.06,
        vx: rand(-0.04, 0.04),
        vy: rand(-0.04, 0.04),
        hasRings: Math.random() < 0.6,
        ringTilt: rand(-0.7, 0.7),
        ringWidth: rand(r * 1.3, r * 1.8),
        ringAlpha: 0.05,
        spin: rand(0, Math.PI * 2),
        spinSpeed: rand(-0.002, 0.002),
      });
    }
  };

  const seedBlackHole = () => {
    if (!BLACK_HOLE_ENABLED) { blackHoleRef.current = null; return; }
    const w = bgRef.current?.clientWidth || 0;
    const h = bgRef.current?.clientHeight || 0;
    const cx = rand(w * 0.55, w * 0.85);
    const cy = rand(h * 0.2, h * 0.6);
    const r = rand(26, 36);
    blackHoleRef.current = {
      x: cx, y: cy,
      r,
      diskR1: r * 1.8,
      diskR2: r * 3.4,
      spin: rand(0, Math.PI * 2),
      spinSpeed: 0.01,
      hue: rand(10, 60),
      alpha: 0.12,
    };
  };

  const drawPlanets = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    planetsRef.current.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.spin += p.spinSpeed;
      if (p.x < -p.r) p.x = w + p.r;
      if (p.x > w + p.r) p.x = -p.r;
      if (p.y < -p.r) p.y = h + p.r;
      if (p.y > h + p.r) p.y = -p.r;

      const g = ctx.createRadialGradient(p.x - p.r * 0.4, p.y - p.r * 0.4, p.r * 0.2, p.x, p.y, p.r * 1.2);
      g.addColorStop(0, hsla(p.hue, 50, 70, p.alpha));
      g.addColorStop(0.5, hsla(p.hue, 60, 55, p.alpha * 0.9));
      g.addColorStop(1, hsla(p.hue, 70, 35, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      if (p.hasRings) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.ringTilt + p.spin * 0.2);
        ctx.strokeStyle = hsla(p.hue + 30, 80, 75, p.ringAlpha);
        ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i++) {
          const rw = p.ringWidth + i * 6;
          ctx.beginPath();
          ctx.ellipse(0, 0, rw, rw * 0.25, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    });
  };

  const drawBlackHole = (ctx: CanvasRenderingContext2D) => {
    const bh = blackHoleRef.current;
    if (!bh) return;
    bh.spin += bh.spinSpeed;

    ctx.save();
    ctx.beginPath();
    ctx.arc(bh.x, bh.y, bh.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.95)';
    ctx.fill();

    const lens = ctx.createRadialGradient(bh.x, bh.y, bh.r * 1.02, bh.x, bh.y, bh.r * 1.6);
    lens.addColorStop(0, 'rgba(255,255,255,0.10)');
    lens.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = lens;
    ctx.beginPath();
    ctx.arc(bh.x, bh.y, bh.r * 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(bh.x, bh.y);
    ctx.rotate(bh.spin);

    const diskSteps = 6;
    for (let i = 0; i < diskSteps; i++) {
      const t = i / (diskSteps - 1);
      const inner = bh.diskR1 + t * 6;
      const outer = bh.diskR2 - t * 8;
      const g = ctx.createRadialGradient(0, 0, inner, 0, 0, outer);
      const a = bh.alpha * (0.9 - t * 0.7);
      g.addColorStop(0, hsla(bh.hue, 95, 70, a));
      g.addColorStop(0.6, hsla((bh.hue + 20) % 360, 90, 55, a * 0.7));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.save();
      ctx.scale(1, 0.35);
      ctx.arc(0, 0, outer, 0, Math.PI * 2);
      ctx.restore();
      ctx.fill();
    }

    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
  };

  const drawBackground = () => {
    const ctx = bgCtxRef.current;
    const canvas = bgRef.current;
    if (!ctx || !canvas) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);

    starfieldRef.current.forEach(s => {
      s.opacity += s.twinkleSpeed * (Math.random() < 0.5 ? 1 : -1);
      s.opacity = clamp(s.opacity, 0.25, 1);
      ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    nebulaeRef.current.forEach(cluster => {
      cluster.forEach(b => {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, hsla(b.hue, 90, 70, b.alpha));
        g.addColorStop(0.55, hsla((b.hue + 20) % 360, 80, 60, b.alpha * 0.6));
        g.addColorStop(1, hsla(b.hue, 80, 55, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    ctx.restore();

    drawPlanets(ctx, w, h);
    drawBlackHole(ctx);
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
    resizeBoth();
    window.addEventListener('resize', resizeBoth);

    seedStarfield();
    seedNebulas();
    seedPlanets();
    seedBlackHole();

    drawBackground();
    bgTimerRef.current = window.setInterval(drawBackground, 50);

    animate();

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
