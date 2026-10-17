// script.js - beginner-friendly game logic for the penalty shootout

// DOM references
const shotsTakenEl = document.getElementById('shots-taken');
const goalsEl = document.getElementById('goals');
const remainingEl = document.getElementById('shots-remaining');
const resultEl = document.getElementById('result');
const ball = document.getElementById('ball');
const goalkeeper = document.getElementById('goalkeeper');
const shootButtons = Array.from(document.querySelectorAll('.shoot-btn'));
const restartBtn = document.getElementById('restart');

// Game state
let totalShots = 5;
let shotsTaken = 0;
let goals = 0;
let inPlay = false; // prevents double-shooting while animation is running

// Mobile-friendly touch support: allow tapping buttons
shootButtons.forEach(btn => {
  btn.addEventListener('click', () => handleShoot(btn.dataset.dir));
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleShoot(btn.dataset.dir); });
});
restartBtn.addEventListener('click', restartGame);

// initialize UI
updateUI();

// handle shooting in one of three directions
function handleShoot(direction) {
  if (inPlay) return; // ignore if already animating
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

  // animate goalkeeper
  goalkeeper.classList.remove('dive-left','dive-center','dive-right');
  // give a small delay so CSS transition applies after class change
  setTimeout(()=>{
    goalkeeper.classList.add(`dive-${keeperChoice}`);
  }, 40);

  // compute target position for the ball based on direction
  // we will translate the ball using CSS transforms
  const target = computeBallTarget(direction);

  // move the ball with a JS-driven animation using requestAnimationFrame for smoother control
  animateBallTo(target, 650).then(() => {
    // animation finished, determine result
    shotsTaken++;

    if (missed) {
      showResult('MISSED');
    } else if (keeperChoice === direction) {
      showResult('SAVED');
    } else {
      goals++;
      showResult('GOAL');
    }

    updateUI();

    // reset goalkeeper after a short pause and allow next shot (if remaining)
    setTimeout(()=>{
      goalkeeper.classList.remove('dive-left','dive-center','dive-right');
      resetBall();
      inPlay = false;
      disableControls(false);

      if (shotsTaken >= totalShots) {
        // end of round
        resultEl.textContent += ' — Round over. Tap Restart to play again.';
        disableControls(true);
      }
    }, 800);
  });
}

// compute where the ball should travel (in pixels relative to the ball's starting box)
function computeBallTarget(direction) {
  // Using % positions relative to the field. Adjust for responsive sizes.
  // left -> near left side of goal, right -> near right side, center -> center
  const leftX = -140; // translateX values in px
  const centerX = 0;
  const rightX = 140;

  const targetY = -220; // move upwards (negative translateY)

  let tx = centerX;
  if (direction === 'left') tx = leftX;
  if (direction === 'right') tx = rightX;

  return {x: tx, y: targetY};
}

// animate ball to given translation for duration ms. Returns a Promise that resolves when done.
function animateBallTo(target, duration) {
  return new Promise(resolve => {
    const start = performance.now();

    // initial positions
    const startX = 0;
    const startY = 0;

    function step(ts) {
      const elapsed = ts - start;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);

      const curX = startX + (target.x - startX) * eased;
      const curY = startY + (target.y - startY) * eased;

      ball.style.transform = `translateX(${curX}px) translateY(${curY}px)`;

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

// reset ball to starting position smoothly
function resetBall() {
  ball.style.transition = 'transform 240ms ease-out';
  ball.style.transform = 'translateX(-50%) translateY(0)';
  // After transition, clear inline transition so future JS animations aren't affected
  setTimeout(()=>{ ball.style.transition = ''; ball.style.transform = ''; }, 260);
}

// display result text and briefly highlight the message
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
}

// Accessibility: keyboard controls
window.addEventListener('keydown', (e) => {
  if (inPlay) return;
  if (shotsTaken >= totalShots) return;
  if (e.key === 'ArrowLeft') handleShoot('left');
  if (e.key === 'ArrowRight') handleShoot('right');
  if (e.key === 'ArrowDown' || e.key === ' ') handleShoot('center');
});

