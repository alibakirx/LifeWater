import { useEffect, useState } from "react";

export default function SpaceView() {
  const [isMouseDown, setIsMouseDown] = useState(false);

  useEffect(() => {
    class PerlinNoise {
        constructor() {
          this.permutation = new Array(256).fill(0).map((_, i) => i);
          for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
          }
          this.p = [...this.permutation, ...this.permutation];
        }
  
        fade(t) {
          return t * t * t * (t * (t * 6 - 15) + 10);
        }
  
        lerp(t, a, b) {
          return a + t * (b - a);
        }
  
        grad(hash, x, y, z) {
          const h = hash & 15;
          const u = h < 8 ? x : y;
          const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
          return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
        }
  
        noise(x, y, z) {
          const X = Math.floor(x) & 255;
          const Y = Math.floor(y) & 255;
          const Z = Math.floor(z) & 255;
  
          x -= Math.floor(x);
          y -= Math.floor(y);
          z -= Math.floor(z);
  
          const u = this.fade(x);
          const v = this.fade(y);
          const w = this.fade(z);
  
          const A = this.p[X] + Y;
          const AA = this.p[A] + Z;
          const AB = this.p[A + 1] + Z;
          const B = this.p[X + 1] + Y;
          const BA = this.p[B] + Z;
          const BB = this.p[B + 1] + Z;
  
          return this.lerp(
            w,
            this.lerp(
              v,
              this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)),
              this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))
            ),
            this.lerp(
              v,
              this.lerp(
                u,
                this.grad(this.p[AA + 1], x, y, z - 1),
                this.grad(this.p[BA + 1], x - 1, y, z - 1)
              ),
              this.lerp(
                u,
                this.grad(this.p[AB + 1], x, y - 1, z - 1),
                this.grad(this.p[BB + 1], x - 1, y - 1, z - 1)
              )
            )
          );
        }
      }

    const canvas = document.querySelector(".space-canvas");
    const ctx = canvas.getContext("2d");
    const perlin = new PerlinNoise();
    let time = 0;

    const width = canvas.width = 800; 
    const height = canvas.height = 600;

    function draw() {
        ctx.clearRect(0, 0, width, height); 
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, width, height); 
      
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
      
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      
        time += isMouseDown ? 0.01 : 0.001; 
      
        for (let i = 0; i < 100; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 2;
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      
        for (let i = 0; i < 5; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 30 + 10; 
          ctx.fillStyle = `rgba(200, 200, 200, ${Math.random()})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      
        for (let i = 0; i < 3; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const length = Math.random() * 30 + 20; 
          ctx.strokeStyle = "rgba(150, 150, 150, 0.8)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + length, y + length / 2);
          ctx.stroke();
        }

      requestAnimationFrame(draw);
    }

    canvas.addEventListener("mousedown", () => setIsMouseDown(true));
    canvas.addEventListener("mouseup", () => setIsMouseDown(false));

    draw();

    return () => {
      canvas.removeEventListener("mousedown", () => setIsMouseDown(true));
      canvas.removeEventListener("mouseup", () => setIsMouseDown(false));
    };
  }, [isMouseDown]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        margin: 0,
        background: "#222", 
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "800px",
          height: "600px",
          border: "10px solid white", 
          borderRadius: "20px", 
          overflow: "hidden",
          position: "relative",
        }}
      >
        <canvas className="space-canvas"></canvas>
      </div>
    </div>
  );
}