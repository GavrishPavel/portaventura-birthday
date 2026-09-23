const scratch = document.querySelector('#scratch');
const ctx = scratch.getContext('2d', { willReadFrequently: true });
const hint = document.querySelector('#hint');
const resetButton = document.querySelector('#reset');
const instruction = document.querySelector('#instruction');
const success = document.querySelector('#success');
const confettiCanvas = document.querySelector('#confetti');
const confettiCtx = confettiCanvas.getContext('2d');

let drawing = false;
let revealed = false;
let moves = 0;

function paintCover() {
  const rect = scratch.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  scratch.width = rect.width * ratio;
  scratch.height = rect.height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.globalCompositeOperation = 'source-over';

  const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
  gradient.addColorStop(0, '#b99358');
  gradient.addColorStop(.35, '#e9cf99');
  gradient.addColorStop(.58, '#f8e8bf');
  gradient.addColorStop(1, '#b4874d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, rect.width, rect.height);

  ctx.globalAlpha = .12;
  for (let i = 0; i < rect.width * rect.height / 48; i++) {
    const shade = Math.random() > .5 ? '#fff' : '#222';
    ctx.fillStyle = shade;
    ctx.fillRect(Math.random() * rect.width, Math.random() * rect.height, Math.random() * 2 + .5, .7);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(82,57,36,.28)';
  ctx.font = '700 9px Manrope';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText('СЧАСТЛИВЫЙ БИЛЕТ', rect.width / 2, rect.height - 27);

  revealed = false;
  moves = 0;
  hint.style.opacity = '1';
  scratch.style.opacity = '1';
  scratch.style.pointerEvents = 'auto';
  resetButton.classList.remove('visible');
  success.classList.remove('visible');
  instruction.textContent = 'Проведи пальцем или курсором по золотому кругу';
}

function pointFromEvent(event) {
  const rect = scratch.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function erase(event) {
  if (!drawing || revealed) return;
  const { x, y } = pointFromEvent(event);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x, y, Math.max(25, scratch.clientWidth * .055), 0, Math.PI * 2);
  ctx.fill();
  moves++;
  if (moves > 2) hint.style.opacity = '0';
  if (moves % 9 === 0) checkProgress();
}

function checkProgress() {
  const pixels = ctx.getImageData(0, 0, scratch.width, scratch.height).data;
  let transparent = 0;
  let sampled = 0;
  for (let i = 3; i < pixels.length; i += 4 * 24) {
    sampled++;
    if (pixels[i] < 80) transparent++;
  }
  if (transparent / sampled > .38) revealPrize();
}

function revealPrize() {
  if (revealed) return;
  revealed = true;
  scratch.style.transition = 'opacity .8s ease';
  scratch.style.opacity = '0';
  scratch.style.pointerEvents = 'none';
  hint.style.opacity = '0';
  resetButton.classList.add('visible');
  instruction.textContent = 'Приключение начинается!';
  launchConfetti();
}

scratch.addEventListener('pointerdown', event => {
  drawing = true;
  scratch.setPointerCapture(event.pointerId);
  erase(event);
});
scratch.addEventListener('pointermove', erase);
scratch.addEventListener('pointerup', () => { drawing = false; checkProgress(); });
scratch.addEventListener('pointercancel', () => { drawing = false; });
resetButton.addEventListener('click', paintCover);

function launchConfetti() {
  const ratio = window.devicePixelRatio || 1;
  confettiCanvas.width = innerWidth * ratio;
  confettiCanvas.height = innerHeight * ratio;
  confettiCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const colors = ['#c99a62', '#e7c893', '#f8eee0', '#d7a79a'];
  const pieces = Array.from({ length: 110 }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * 280,
    y: innerHeight * .45,
    vx: (Math.random() - .5) * 12,
    vy: Math.random() * -11 - 5,
    rotation: Math.random() * 6,
    spin: (Math.random() - .5) * .3,
    size: Math.random() * 8 + 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 1
  }));

  function frame() {
    confettiCtx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = false;
    for (const p of pieces) {
      if (p.life <= 0) continue;
      alive = true;
      p.vy += .24;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      p.life -= .009;
      confettiCtx.save();
      confettiCtx.globalAlpha = Math.max(0, p.life);
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate(p.rotation);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      confettiCtx.restore();
    }
    if (alive) requestAnimationFrame(frame);
    else confettiCtx.clearRect(0, 0, innerWidth, innerHeight);
  }
  requestAnimationFrame(frame);
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(paintCover, 180);
});

document.fonts.ready.then(paintCover);
