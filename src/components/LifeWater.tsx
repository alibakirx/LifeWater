import React, { useEffect, useRef } from 'react';
import type p5 from 'p5';

// Define a class for underwater creatures
interface Creature {
  position: p5.Vector;
  velocity: p5.Vector;
  acceleration: p5.Vector;
  maxSpeed: number;
  size: number;
  color: any; // Changed from number[] to any to accommodate p5.Color or array
}

const LifeWater: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || typeof window === 'undefined') return;

    // Dynamically import p5 only on client side
    import('p5').then((p5Module) => {
      const p5 = p5Module.default;
      
      const sketch = (p: p5) => {
        // Simulation parameters
        const N = 10;                 // Number of energy systems
        const threshold = 5;          // Basic energy conversion threshold
        const thresholdFast = 7;      // Fast conversion threshold (technology breakthroughs)
        const thresholdDead = 1;      // Low access threshold (energy poverty)
        let cellSize = 10;            // Pixel size - will be dynamic
        const voronoi_count = 20;     // Number of energy regions
        const voronoi_offset = true;  // Use offset by region
        const scan_left = 2;          // Neighborhood scan range
        const scan_right = 2;
        const scan_up = 2;
        const scan_down = 2;

        let cols: number, rows: number;
        let grid: number[][], nextGrid: number[][];
        let sites: p5.Vector[] = [];
        let colors: p5.Color[] = [];
        let cellOwners: number[][] = [];
        let energyStates: p5.Color[];
        let d = 0.5;

        // Underwater life simulation
        const creatureCount = 70;  // Number of creatures - increased from 50
        let creatures: Creature[] = [];

        // Calculate appropriate cell size
        function calculateCellSize() {
          // Dynamic cell size based on screen size - works even on very small screens
          return Math.max(5, Math.floor(Math.min(p.width, p.height) / 100));
        }

        p.setup = () => {
          // Create canvas at full window size
          p.createCanvas(p.windowWidth, p.windowHeight);
          
          // Adjust cell size based on screen size
          cellSize = calculateCellSize();
          
          // Calculate grid dimensions
          cols = p.floor(p.width / cellSize);
          rows = p.floor(p.height / cellSize);
          
          // Colors representing different energy sources and systems with white colors
          energyStates = [
            p.color(117, 187, 253, 60),  // Light blue: Clean drinking water
            p.color(0, 119, 182, 65),    // Dark blue: Water resources
            p.color(72, 202, 228, 55),   // Turquoise: Sustainable water management
            p.color(0, 150, 199, 65),    // Blue-green: Wastewater treatment
            p.color(21, 67, 96, 70),     // Navy blue: Water efficiency
            p.color(126, 167, 216, 60),  // Gray-blue: Rainwater harvesting
            p.color(70, 130, 180, 65),   // Steel blue: Water ecosystem protection
            p.color(255, 255, 255, 50),  // Pure white: Clean water waves
            p.color(240, 248, 255, 55),  // Alice blue white: Gentle water movement
            p.color(255, 250, 250, 45),  // Snow white: Foam and bubbles
          ];

          // Create cell owner array
          cellOwners = new Array(cols);
          for (let x = 0; x < cols; x++) {
            cellOwners[x] = new Array(rows).fill(0);
          }

          init_voronoi();
          initializeGrid();
          initializeCreatures();
        };

        function initializeCreatures() {
          creatures = [];
          // Create underwater creatures
          for (let i = 0; i < creatureCount; i++) {
            // Determine if this will be a small fish or a larger fish
            const isLargeFish = p.random(1) > 0.8;
            
            const creature: Creature = {
              position: p.createVector(p.random(p.width), p.random(p.height)),
              velocity: p5.Vector.random2D().mult(p.random(0.5, 2)),
              acceleration: p.createVector(0, 0),
              maxSpeed: isLargeFish ? p.random(0.8, 2) : p.random(1.5, 3),
              size: isLargeFish ? p.random(8, 12) : p.random(3, 7),
              color: isLargeFish ? p.color(10, 10, 10, 255) : p.color(0, 0, 0, 230)
            };
            creatures.push(creature);
          }
        }

        function updateCreatures() {
          for (let i = 0; i < creatures.length; i++) {
            const creature = creatures[i];
            
            // Apply flocking behavior
            const separation = separate(creature, i);
            const alignment = align(creature, i);
            const cohesion = cohere(creature, i);
            const wanderForce = p.createVector(
              p.noise(creature.position.x * 0.01, creature.position.y * 0.01, p.frameCount * 0.01) - 0.5, 
              p.noise(creature.position.y * 0.01, p.frameCount * 0.01) - 0.5
            );
            
            // Apply forces with weights
            separation.mult(1.5);
            alignment.mult(1.0);
            cohesion.mult(1.0);
            wanderForce.mult(0.5);
            
            creature.acceleration.add(separation);
            creature.acceleration.add(alignment);
            creature.acceleration.add(cohesion);
            creature.acceleration.add(wanderForce);
            
            // Update velocity and position
            creature.velocity.add(creature.acceleration);
            creature.velocity.limit(creature.maxSpeed);
            creature.position.add(creature.velocity);
            
            // Reset acceleration
            creature.acceleration.mult(0);
            
            // Wrap around edges
            if (creature.position.x < 0) creature.position.x = p.width;
            if (creature.position.y < 0) creature.position.y = p.height;
            if (creature.position.x > p.width) creature.position.x = 0;
            if (creature.position.y > p.height) creature.position.y = 0;
          }
        }
        
        function separate(creature: Creature, index: number): p5.Vector {
          const desiredSeparation = 25;
          const steer = p.createVector(0, 0);
          let count = 0;
          
          for (let i = 0; i < creatures.length; i++) {
            if (i !== index) {
              const other = creatures[i];
              const d = p5.Vector.dist(creature.position, other.position);
              
              if (d < desiredSeparation) {
                const diff = p5.Vector.sub(creature.position, other.position);
                diff.normalize();
                diff.div(d);  // Weight by distance
                steer.add(diff);
                count++;
              }
            }
          }
          
          if (count > 0) {
            steer.div(count);
          }
          
          if (steer.mag() > 0) {
            steer.normalize();
            steer.mult(creature.maxSpeed);
            steer.sub(creature.velocity);
            steer.limit(0.5);
          }
          
          return steer;
        }
        
        function align(creature: Creature, index: number): p5.Vector {
          const neighborDist = 50;
          const sum = p.createVector(0, 0);
          let count = 0;
          
          for (let i = 0; i < creatures.length; i++) {
            if (i !== index) {
              const other = creatures[i];
              const d = p5.Vector.dist(creature.position, other.position);
              
              if (d < neighborDist) {
                sum.add(other.velocity);
                count++;
              }
            }
          }
          
          if (count > 0) {
            sum.div(count);
            sum.normalize();
            sum.mult(creature.maxSpeed);
            sum.sub(creature.velocity);
            sum.limit(0.3);
          }
          
          return sum;
        }
        
        function cohere(creature: Creature, index: number): p5.Vector {
          const neighborDist = 50;
          const sum = p.createVector(0, 0);
          let count = 0;
          
          for (let i = 0; i < creatures.length; i++) {
            if (i !== index) {
              const other = creatures[i];
              const d = p5.Vector.dist(creature.position, other.position);
              
              if (d < neighborDist) {
                sum.add(other.position);
                count++;
              }
            }
          }
          
          if (count > 0) {
            sum.div(count);
            return seek(creature, sum);
          }
          
          return p.createVector(0, 0);
        }
        
        function seek(creature: Creature, target: p5.Vector): p5.Vector {
          const desired = p5.Vector.sub(target, creature.position);
          desired.normalize();
          desired.mult(creature.maxSpeed);
          
          const steer = p5.Vector.sub(desired, creature.velocity);
          steer.limit(0.3);
          return steer;
        }

        function drawCreatures() {
          for (let i = 0; i < creatures.length; i++) {
            const creature = creatures[i];
            
            p.push();
            p.translate(creature.position.x, creature.position.y);
            
            // Calculate rotation based on velocity
            const angle = p.atan2(creature.velocity.y, creature.velocity.x);
            p.rotate(angle);
            
            // Set fish color
            p.fill(creature.color);
            p.noStroke();
            
            // Draw fish body (ellipse)
            p.ellipse(0, 0, creature.size * 2, creature.size);
            
            // Draw tail
            p.triangle(
              -creature.size * 1.5, 0,
              -creature.size * 2.5, -creature.size * 0.5,
              -creature.size * 2.5, creature.size * 0.5
            );
            
            // Draw eye
            p.fill(255);
            p.ellipse(creature.size * 0.3, -creature.size * 0.2, creature.size * 0.3);
            p.fill(0);
            p.ellipse(creature.size * 0.4, -creature.size * 0.2, creature.size * 0.15);
            
            p.pop();
          }
        }

        p.draw = () => {
          // Simulate energy system evolution (faster)
          if (p.frameCount % 2 === 0) updateGrid((d + 0.3) / 1.3);
          update_voronoi();
          displayGrid();
          
          // Update and draw marine creatures
          updateCreatures();
          drawCreatures();
          
          // Evolution cycle (faster)
          d = p.constrain(d + deltaHop(p.millis() / 1500), 0, 1);
        };

        function pinch(v: number, x: number): number {
          const a = p.max(v, x) - x;
          const b = x - p.min(v, x);
          return 2 * a * a - 2 * b * b + x;
        }

        function noiseHopper(x: number): number {
          return pinch((pinch(p.noise(x), 1) + pinch(p.noise(0, x), 0)) / 2, 0.5);
        }

        function deltaHop(t: number): number {
          return (noiseHopper(t) - 0.5);
        }

        // Initialize energy regions
        function init_voronoi() {
          sites = [];
          colors = [];
          for (let i = 0; i < voronoi_count; i++) {
            sites.push(p.createVector(p.random(p.width), p.random(p.height)));
            colors.push(p.color(
              p.random(100, 200),
              p.random(100, 200), 
              p.random(50, 150)
            ));
          }
        }

        // Evolution of energy regions
        function update_voronoi() {
          for (let i = 0; i < voronoi_count; i++) {
            sites[i].x = p.lerp(sites[i].x, p.width / 2, 0.001);
            sites[i].x = p.constrain(sites[i].x + p.noise(i * 1000 + p.millis() / 500.0) - 0.5, 0, p.width);
            sites[i].y = p.lerp(sites[i].y, p.height / 2, 0.001);
            sites[i].y = p.constrain(sites[i].y + 2.0 * p.noise(i * 2000 + p.millis() / 500.0) - 1.00, 0, p.height);
          }

          // Assign each cell to nearest energy region
          for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
              let closest = -1;
              let minDist = Infinity;
              for (let i = 0; i < sites.length; i++) {
                const dx = sites[i].x - (x * cellSize);
                const dy = sites[i].y - (y * cellSize);
                const d = (dx * dx + dy * dy);
                if (d < minDist) {
                  minDist = d;
                  closest = i;
                }
              }
              cellOwners[x][y] = closest;
            }
          }
        }

        // Assign random initial energy states
        function initializeGrid() {
          grid = new Array(cols).fill(0).map(() => new Array(rows).fill(0).map(() => p.floor(p.random(N))));
          nextGrid = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
        }

        // Simulate energy transitions (cellular automaton)
        function updateGrid(border: number) {
          for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
              const currentState = grid[x][y];

              // Simulate energy transitions at region boundaries
              if (p.random(1) < border) {
                for (let m = 0; m < 2; m++) {
                  for (let q = 0; q < 2; q++) {
                    if (x - m < 0 || y - q < 0) continue;
                    if (cellOwners[x][y] !== cellOwners[x - m][y - q]) {
                      nextGrid[x - m][y - q] = p.int((p.random(N) + 1) % N);
                    }
                  }
                }
              }

              // Energy interaction between neighboring cells
              let count = 0;
              for (let dx = -scan_left; dx <= scan_right; dx++) {
                for (let dy = -scan_up; dy <= scan_down; dy++) {
                  const nx = (x + dx + cols) % cols;
                  const ny = (y + dy + rows) % rows;
                  if (grid[nx][ny] === (currentState + 1) % N) {
                    count++;
                  }
                }
              }

              // Energy transformation rules
              do {
                nextGrid[x][y] = currentState;
                
                if (count >= threshold) {
                  nextGrid[x][y] = (currentState + 1) % N;
                  break;
                }
                
                if (count >= thresholdFast) {
                  nextGrid[x][y] = (currentState + 2) % N;
                  break;
                }
                
                if (count <= thresholdDead) {
                  nextGrid[x][y] = (currentState + N - 1) % N;
                  break;
                }
              } while (false);
            }
          }
          const tmp = grid;
          grid = nextGrid;
          nextGrid = tmp;
        }

        // Visualization
        function displayGrid() {
          p.background(16, 33, 51, 20); // Dark blue sea background
          p.noStroke();
          
          const skipFactor = 2; // Draw every 2nd cell for smoother waves
          
          for (let x = 0; x < cols; x += skipFactor) {
            for (let y = 0; y < rows; y += skipFactor) {
              const stateIndex = (grid[x][y] + (voronoi_offset ? cellOwners[x][y] % 3 : 0)) % N;
              p.fill(energyStates[stateIndex]);
              
              // Organic wave effect
              const waveEffect = p.sin(x * 0.1 + y * 0.08 + p.frameCount * 0.05) * 0.5 + 1.2;
              const finalSize = cellSize * skipFactor * waveEffect;
              
              p.rect(
                x * cellSize, 
                y * cellSize, 
                finalSize, 
                finalSize
              );
            }
          }
        }

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
          cellSize = calculateCellSize();
          cols = p.floor(p.width / cellSize);
          rows = p.floor(p.height / cellSize);
          
          // Reinitialize arrays with new dimensions
          cellOwners = new Array(cols);
          for (let x = 0; x < cols; x++) {
            cellOwners[x] = new Array(rows).fill(0);
          }
          
          initializeGrid();
          init_voronoi();
        };
      };

      const p5Instance = new p5(sketch, canvasRef.current || undefined);
      return () => {
        p5Instance.remove();
      };
    });
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      bottom: 0, 
      right: 0, 
      overflow: 'hidden',
      width: '100vw', 
      height: '100vh',
      margin: 0,
      padding: 0
    }}>
      <div ref={canvasRef} style={{ 
        width: '100%', 
        height: '100%' 
      }} />
    </div>
  );
};

export default LifeWater;