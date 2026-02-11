'use client';

import { useEffect, useRef, useCallback } from 'react';

interface BlobParticle {
  // Rest offset from blob center
  restX: number;
  restY: number;
  // Current offset from blob center (with jelly deformation)
  offsetX: number;
  offsetY: number;
  // Velocity of offset (for spring physics)
  velX: number;
  velY: number;
  // Visual
  angle: number;
  rotationSpeed: number;
  color: string;
  size: number;
  thickness: number;
  shape: 'dash' | 'dot';
}

const COLORS = [
  '#FF4136', // red
  '#FF6B3D', // coral/orange
  '#FFB700', // golden yellow
  '#FF2D78', // hot pink
  '#8B5CF6', // purple
  '#6366F1', // indigo
  '#3B82F6', // blue
  '#EC4899', // pink
];

const BLOB_RADIUS = 350;
const SPRING = 0.012;
const DAMPING = 0.92;
const DEFORM_FACTOR = 0.45;
// Spring-based follow (blob center itself bounces like jelly)
const CENTER_SPRING = 0.025;
const CENTER_DAMPING = 0.85;

function createBlobParticle(ring: number, idx: number, totalInRing: number, ringRadius: number): BlobParticle {
  const a = (idx / totalInRing) * Math.PI * 2;
  const jitter = (Math.random() - 0.5) * 12;
  const r = ringRadius + jitter;
  const shape = Math.random() < 0.4 ? 'dot' : 'dash';

  return {
    restX: Math.cos(a) * r,
    restY: Math.sin(a) * r,
    offsetX: Math.cos(a) * r,
    offsetY: Math.sin(a) * r,
    velX: 0,
    velY: 0,
    angle: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.03,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: shape === 'dot' ? 3 + Math.random() * 4 : 8 + Math.random() * 14,
    thickness: 2 + Math.random() * 2,
    shape,
  };
}

export function ConfettiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<BlobParticle[]>([]);
  const animationRef = useRef<number>(0);

  // Blob center (smoothly follows cursor)
  const blobX = useRef(0);
  const blobY = useRef(0);
  // Blob velocity (for deformation direction)
  const blobVelX = useRef(0);
  const blobVelY = useRef(0);
  // Mouse/cursor target
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const mouseActive = useRef(false);

  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    let cx: number, cy: number;
    if ('touches' in e) {
      cx = e.touches[0].clientX;
      cy = e.touches[0].clientY;
    } else {
      cx = e.clientX;
      cy = e.clientY;
    }
    mouseX.current = cx;
    mouseY.current = cy;
    if (!mouseActive.current) {
      // First move: snap blob center to cursor
      blobX.current = cx;
      blobY.current = cy;
      mouseActive.current = true;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Default blob center
      if (!mouseActive.current) {
        blobX.current = canvas.width / 2;
        blobY.current = canvas.height / 2;
        mouseX.current = canvas.width / 2;
        mouseY.current = canvas.height / 2;
      }
    };
    resize();

    // Create ~100 particles in concentric rings
    const particles: BlobParticle[] = [];
    const rings = [
      { radius: 0, count: 1 },
      { radius: BLOB_RADIUS * 0.18, count: 6 },
      { radius: BLOB_RADIUS * 0.36, count: 12 },
      { radius: BLOB_RADIUS * 0.54, count: 18 },
      { radius: BLOB_RADIUS * 0.72, count: 26 },
      { radius: BLOB_RADIUS * 0.9, count: 37 },
    ];
    for (const ring of rings) {
      for (let i = 0; i < ring.count; i++) {
        particles.push(createBlobParticle(0, i, ring.count, ring.radius));
      }
    }
    particlesRef.current = particles;

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spring-based follow — blob center bounces toward cursor like jelly
      const dx0 = mouseX.current - blobX.current;
      const dy0 = mouseY.current - blobY.current;
      blobVelX.current += dx0 * CENTER_SPRING;
      blobVelY.current += dy0 * CENTER_SPRING;
      blobVelX.current *= CENTER_DAMPING;
      blobVelY.current *= CENTER_DAMPING;
      blobX.current += blobVelX.current;
      blobY.current += blobVelY.current;

      const cx = blobX.current;
      const cy = blobY.current;
      const vx = blobVelX.current;
      const vy = blobVelY.current;

      for (const p of particles) {
        // Jelly deformation: outer particles lag behind more
        const dist = Math.sqrt(p.restX * p.restX + p.restY * p.restY);
        const deformScale = (dist / BLOB_RADIUS) * DEFORM_FACTOR;

        const targetX = p.restX - vx * deformScale * 12;
        const targetY = p.restY - vy * deformScale * 12;

        // Spring force toward deformed rest position
        const dx = targetX - p.offsetX;
        const dy = targetY - p.offsetY;
        p.velX += dx * SPRING;
        p.velY += dy * SPRING;

        // Damping
        p.velX *= DAMPING;
        p.velY *= DAMPING;

        // Update offset
        p.offsetX += p.velX;
        p.offsetY += p.velY;

        // Rotate
        p.angle += p.rotationSpeed;

        // Draw
        const px = cx + p.offsetX;
        const py = cy + p.offsetY;

        ctx.save();
        ctx.globalAlpha = 0.7;

        if (p.shape === 'dot') {
          ctx.beginPath();
          ctx.arc(px, py, p.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        } else {
          ctx.translate(px, py);
          ctx.rotate(p.angle);
          ctx.beginPath();
          ctx.moveTo(-p.size / 2, 0);
          ctx.lineTo(p.size / 2, 0);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.thickness;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, [handlePointerMove]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
