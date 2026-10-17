// script.js - v1.1: improved animations, celebration and final summary

// DOM references
const shotsTakenEl = document.getElementById('shots-taken');
const goalsEl = document.getElementById('goals');
const remainingEl = document.getElementById('shots-remaining');
const resultEl = document.getElementById('result');
const ball = document.getElementById('ball');
const goalkeeper = document.getElementById('goalkeeper');
const shootButtons = Array.from(document.querySelectorAll('.shoot-btn'));
const restartBtn = document.getElementById('restart');
const field = document.querySelector('.field');

// Game state
let totalShots = 5;
let shotsTaken = 0;
let goals = 0;
let inPlay = false; // prevents double-shooting while animation is running

// touch support
shootButtons.forEach(btn => {
  btn.addEventListener('click', () => handleShoot(btn.dataset.dir));
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleShoot(btn.dataset.dir); });
});
restartBtn.addEventListener('click', restartGame);

// initialize UI
updateUI();

// handle shooting
function handleShoot(direction) {
  if (inPlay) return;
  if (shotsTaken >= totalShots) return;

  inPlay = true;
  disableControls(true);
  resultEl.textContent = '...';

  // goalkeeper randomly dives: 'left', 'center', 'right'
  const keeperDirs = ['left','center','right'];
  const keeperChoice = keeperDirs[Math.floor(Math.random()*keeperDirs.length)];

  // small chance the player MISSES the target completely
  const missChance = 0.12; // 12% chance to miss
  const missed = Math.random() < missChance;

  // animate goalkeeper (remove/add classes to trigger CSS transitions)
  goalkeeper.classList.remove('dive-left','dive-center','dive-right');
  // allow the browser to register the change
  setTimeout(()=> goalkeeper.classList.add(`dive-${keeperChoice}`), 40);

  // compute target position for the ball based on direction
  const target = computeBallTarget(direction);

  // add spin variables to the ball for CSS keyframe
  ball.style.setProperty('--tx', `${target.x}px`);
  ball.style.setProperty('--ty', `${target.y}px`);
  ball.classList.add('spin');

  // move the ball with JS for more control (position + rotation)
  animateBallTo(target, 700).then(() => {
    // after animation completes
    shotsTaken++;

    if (missed) {
      showResult('MISSED');
    } else if (keeperChoice === direction) {
      showResult('SAVED');
    } else {
      goals++;
      showResult('GOAL');
      // celebration for goals
      celebrateGoal();
    }

    updateUI();

    // reset after short pause
    setTimeout(()=>{
      goalkeeper.classList.remove('dive-left','dive-center','dive-right');
      resetBall();
      ball.classList.remove('spin');
      inPlay = false;
      // if shots remain, enable controls, otherwise show final summary
      if (shotsTaken >= totalShots) {
        showFinalSummary();
        disableControls(true);
      } else {
        disableControls(false);
      }
    }, 900);
  });
}

// compute where the ball should travel
function computeBallTarget(direction) {
  // Adjusted distances to feel more natural with improved visuals
  const leftX = -170; // px
  const centerX = 0;
  const rightX = 170;
  const targetY = -260; // move upwards (negative translateY)

  let tx = centerX;
  if (direction === 'left') tx = leftX;
  if (direction === 'right') tx = rightX;

  return {x: tx, y: targetY};
}

// animate ball: includes rotation and easing
function animateBallTo(target, duration) {
  return new Promise(resolve => {
    const start = performance.now();
    const startX = 0;
    const startY = 0;
    const startRot = 0;
    const endRot = (target.x < 0) ? -720 : (target.x > 0) ? 720 : 540;

    function step(ts) {
      const elapsed = ts - start;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);

      const curX = Math.round(startX + (target.x - startX) * eased);
      const curY = Math.round(startY + (target.y - startY) * eased);
      const curRot = Math.round(startRot + (endRot - startRot) * eased);

      // apply transform: translateX(px) translateY(px) rotate(deg)
      ball.style.transform = `translateX(${curX}px) translateY(${curY}px) rotate(${curRot}deg)`;

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

// reset ball to starting position
function resetBall() {
  ball.style.transition = 'transform 220ms ease-out';
  // starting position (center bottom). Because we used absolute transforms earlier, set to neutral
  ball.style.transform = 'translateX(-50%) translateY(0)';
  // clear inline styles shortly after
  setTimeout(()=>{ ball.style.transition = ''; ball.style.transform = ''; }, 240);
}

// display result text and highlight
function showResult(text) {
  resultEl.textContent = text;
  resultEl.classList.add('flash');
  setTimeout(()=> resultEl.classList.remove('flash'), 700);
}

// update scoreboard UI
function updateUI() {
  shotsTakenEl.textContent = shotsTaken;
  goalsEl.textContent = goals;
  remainingEl.textContent = Math.max(0, totalShots - shotsTaken);
}

// enable/disable shoot buttons
function disableControls(disabled) {
  shootButtons.forEach(b => b.disabled = disabled || shotsTaken >= totalShots);
}

// celebration: confetti + field glow
function celebrateGoal() {
  // add glow
  field.classList.add('celebrate');
  // create a few small confetti pieces
  const colors = ['#ffd700','#ff6b6b','#6bffb8','#6bb3ff','#ffd96b'];
  const confCount = 18;
  for (let i=0;i<confCount;i++){
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = (50 + (Math.random()*80 - 40)) + '%';
    c.style.top = (30 + Math.random()*40) + 'px';
    c.style.background = colors[Math.floor(Math.random()*colors.length)];
    c.style.transform = `rotate(${Math.random()*360}deg)`;
    field.appendChild(c);

    // small timeout so animations are staggered
    setTimeout(()=> c.classList.add('animate'), 20 + i*25);

    // remove after animation
    setTimeout(()=> { try{ field.removeChild(c); } catch(e){} }, 1400 + i*20);
  }
  // remove glow shortly after
  setTimeout(()=> field.classList.remove('celebrate'), 1400);
}

// show final summary when round complete
function showFinalSummary(){
  const pct = Math.round((goals / totalShots) * 100);
  resultEl.textContent = `Round Complete! You scored ${goals}/${totalShots} penalties (${pct}%).`;
}

// restart the game
function restartGame() {
  shotsTaken = 0;
  goals = 0;
  inPlay = false;
  updateUI();
  resultEl.textContent = 'Good luck!';
  resetBall();
  goalkeeper.classList.remove('dive-left','dive-center','dive-right');
  disableControls(false);
  // remove any lingering confetti
  document.querySelectorAll('.confetti').forEach(n=>n.remove());
}

// Accessibility: keyboard controls
window.addEventListener('keydown', (e) => {
  if (inPlay) return;
  if (shotsTaken >= totalShots) return;
  if (e.key === 'ArrowLeft') handleShoot('left');
  if (e.key === 'ArrowRight') handleShoot('right');
  if (e.key === 'ArrowDown' || e.key === ' ') handleShoot('center');
});

