const fs = require('fs');
let text = fs.readFileSync('src/renderer/PixelEnemyRenderer.js', 'utf8');

const drawBumble = `
  /**
   * Draw Honey Bumble (UNIQUE Climax Boss)
   * Crowned giant queen bee with amber cannon stinger and detailed multi-layered wings
   */
  drawHoneyBumble(ctx, screenX, screenY, width, height, enemy) {
    if (enemy.isDead && enemy.defeatTimer > enemy.defeatDuration) return;

    ctx.save();
    ctx.translate(screenX + width / 2, screenY + height / 2);

    // Subtle hover bobbing
    const hoverOffset = Math.sin(this.tick * 3) * 8;
    ctx.translate(0, hoverOffset);

    // If hurting, flash white
    if (enemy.isHurt) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = '#ffffff';
    }

    // Directional facing
    if (enemy.vx > 0) ctx.scale(-1, 1);

    // --- 1. Stinger Cannon ---
    ctx.fillStyle = '#78350f'; // Dark stinger base
    ctx.beginPath();
    ctx.moveTo(120, -10);
    ctx.lineTo(200, 0);
    ctx.lineTo(120, 10);
    ctx.fill();

    // Stinger glow
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(160, -2, 20, 4);

    // --- 2. Giant Armored Abdomen ---
    // Yellow/Black stripes with high contrast
    const abW = 160;
    const abH = 140;
    ctx.fillStyle = P.ENEMY_YELLOW;
    ctx.beginPath();
    ctx.ellipse(40, 10, abW/2, abH/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Stripes
    ctx.fillStyle = '#1e1b4b'; // Deep dark purple/black
    ctx.beginPath(); ctx.ellipse(40, 10, abW/2, abH/2, 0, Math.PI*1.5, Math.PI*2.5); ctx.fill();
    ctx.fillStyle = P.ENEMY_YELLOW;
    ctx.beginPath(); ctx.ellipse(40, 10, abW/2 - 20, abH/2 - 5, 0, Math.PI*1.5, Math.PI*2.5); ctx.fill();
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath(); ctx.ellipse(40, 10, abW/2 - 40, abH/2 - 10, 0, Math.PI*1.5, Math.PI*2.5); ctx.fill();
    ctx.fillStyle = P.ENEMY_YELLOW;
    ctx.beginPath(); ctx.ellipse(40, 10, abW/2 - 60, abH/2 - 15, 0, Math.PI*1.5, Math.PI*2.5); ctx.fill();

    // --- 3. Thorax & Fur ---
    ctx.fillStyle = '#b45309'; // Fluffy orange fur
    ctx.beginPath();
    ctx.arc(-40, -10, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(-40, -20, 45, 0, Math.PI * 2);
    ctx.fill();

    // --- 4. Armored Head ---
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.arc(-110, 0, 50, 0, Math.PI * 2);
    ctx.fill();

    // Mandibles
    ctx.fillStyle = '#78350f';
    ctx.beginPath(); ctx.moveTo(-150, 10); ctx.lineTo(-190, 30); ctx.lineTo(-140, 40); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-150, 10); ctx.lineTo(-180, -10); ctx.lineTo(-140, 0); ctx.fill();

    // Giant Red Angry Eye
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(-120, -10, 15, 25, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.ellipse(-125, -15, 4, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // --- 5. Royal Crown ---
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-130, -40);
    ctx.lineTo(-160, -90);
    ctx.lineTo(-110, -70);
    ctx.lineTo(-90, -100);
    ctx.lineTo(-70, -70);
    ctx.lineTo(-20, -80);
    ctx.lineTo(-60, -40);
    ctx.fill();
    // Crown Jewels
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(-130, -70, 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(-90, -80, 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(-50, -65, 6, 0, Math.PI*2); ctx.fill();

    // --- 6. Triple Crystal Wings (Animated) ---
    const wingAngle = Math.sin(this.tick * 40) * 0.8;
    ctx.translate(-40, -40);
    ctx.rotate(wingAngle);
    
    // Front Wing
    ctx.fillStyle = 'rgba(186, 230, 253, 0.7)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(20, -80, 30, 120, 0.3, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    
    // Middle Wing
    ctx.rotate(-0.5);
    ctx.beginPath();
    ctx.ellipse(0, -90, 25, 110, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Back Wing
    ctx.rotate(-0.4);
    ctx.beginPath();
    ctx.ellipse(-20, -70, 20, 90, -0.2, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.restore();
  }
`;

text = text.replace('drawHoneyBeetle(ctx, screenX, screenY, width, height, enemy) {', drawBumble + '\n  drawHoneyBeetle(ctx, screenX, screenY, width, height, enemy) {');
fs.writeFileSync('src/renderer/PixelEnemyRenderer.js', text);
