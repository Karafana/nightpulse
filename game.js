// Pixel NightPulse - final version with animated city background, static enemies, touch buttons working
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let dpr = Math.max(1, window.devicePixelRatio || 1);
function fit(){
  dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
fit();
window.addEventListener('resize', fit);

// assets
const playerImg = new Image();
playerImg.src = 'assets/player96.png';
const enemyImg = new Image();
enemyImg.src = 'assets/enemy96.png';

// state
let nick = '';
const player = { x:120, y:200, size:64, speed:3 };
let enemies = [];
const enemyCount = 5;
let running = false;
let controls = { left:false,right:false,up:false,down:false };
let pops = [];

// build pixel city buildings with windows which blink
function buildCity(){
  const w = Math.ceil(window.innerWidth/32);
  const h = Math.ceil(window.innerHeight/32);
  const cols = [];
  for(let i=0;i<w;i++){
    const bw = 28 + Math.floor(Math.random()*40); // building height in pixels
    const windows = [];
    const rows = Math.floor(window.innerHeight/24);
    for(let r=0;r<rows;r++){
      // each row has random windows pattern
      windows.push(Math.random());
    }
    cols.push({x:i*32, width:32, offset: Math.random()*120, windows});
  }
  return cols;
}
let city = buildCity();
let tick = 0;

function spawnEnemies(){
  enemies = [];
  const margin = 80;
  for(let i=0;i<enemyCount;i++){
    const ex = margin + Math.random()*(window.innerWidth - margin*2);
    const ey = margin + Math.random()*(window.innerHeight - margin*3);
    enemies.push({x:ex, y:ey, size:64});
  }
}

function drawCity(){
  const w = window.innerWidth;
  const h = window.innerHeight;
  // sky gradient (already CSS) - draw subtle tiles and windows
  ctx.save();
  for(let i=0;i<city.length;i++){
    const col = city[i];
    const bx = col.x % (w+200) - 100;
    const bwidth = col.width;
    // building color blocks
    ctx.fillStyle = 'rgba(8,10,18,0.85)';
    ctx.fillRect(bx, h - 120 - (col.offset%120), bwidth, 120 + (col.offset%120));
    // windows
    const rows = col.windows.length;
    for(let r=0;r<rows;r++){
      for(let c=0;c<3;c++){
        const wx = bx + 6 + c*8;
        const wy = h - 110 - r*12 - (col.offset%120);
        // blinking based on tick and randomness
        const on = (Math.floor((tick/20) + (i+c+r)) % 7) === 0;
        ctx.fillStyle = on ? 'rgba(255,200,120,0.9)' : 'rgba(60,70,90,0.6)';
        ctx.fillRect(wx, wy, 6, 8);
      }
    }
  }
  ctx.restore();
}

// draw player and enemies and HUD
function draw(){
  // clear
  ctx.clearRect(0,0,canvas.width/dpr, canvas.height/dpr);
  // background city
  drawCity();

  // draw enemies
  enemies.forEach(e => {
    ctx.drawImage(enemyImg, e.x - e.size/2, e.y - e.size/2, e.size, e.size);
  });

  // player
  ctx.drawImage(playerImg, player.x - player.size/2, player.y - player.size/2, player.size, player.size);

  // pops
  pops.forEach((p, idx) => {
    ctx.strokeStyle = 'rgba(255,180,200,' + (p.life/20) + ')';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x - p.r/2 - (20-p.life)/2, p.y - p.r/2 - (20-p.life)/2, p.r + (20-p.life), p.r + (20-p.life));
    p.life--;
    if(p.life <= 0) pops.splice(idx,1);
  });

  // hud
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '10px monospace';
  ctx.fillText('Врагов: ' + enemies.length, 10, 18);
}

function update(){
  // movement
  let vx=0, vy=0;
  if(controls.left) vx -= 1;
  if(controls.right) vx += 1;
  if(controls.up) vy -= 1;
  if(controls.down) vy += 1;
  if(vx!==0 || vy!==0){
    const len = Math.hypot(vx,vy) || 1;
    player.x += (vx/len)*player.speed;
    player.y += (vy/len)*player.speed;
    // clamp
    player.x = Math.max(player.size/2, Math.min(window.innerWidth - player.size/2, player.x));
    player.y = Math.max(player.size/2, Math.min(window.innerHeight - player.size/2, player.y));
  }

  // collision with static enemies (they disappear when player touches)
  for(let i=enemies.length-1;i>=0;i--){
    const e = enemies[i];
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx,dy);
    if(dist < (player.size/2 + e.size/2 - 6)){
      // spawn pop
      pops.push({x:e.x, y:e.y, r:e.size, life:18});
      enemies.splice(i,1);
    }
  }

  // tick background animation
  tick++;
  if(tick % 120 === 0){
    // occasionally rebuild some city columns to vary lights
    city = buildCity();
  }
}

function loop(){
  if(!running) return;
  update();
  draw();
  if(enemies.length === 0){
    setTimeout(()=> showEnd(), 120);
    running = false;
    return;
  }
  requestAnimationFrame(loop);
}

// controls binding using pointer events for reliability
function bindBtn(id, key){
  const el = document.getElementById(id);
  el.addEventListener('pointerdown', (e)=>{ e.preventDefault(); controls[key]=true; });
  el.addEventListener('pointerup', (e)=>{ e.preventDefault(); controls[key]=false; });
  el.addEventListener('pointercancel', ()=> controls[key]=false);
  el.addEventListener('pointerout', ()=> controls[key]=false);
  el.addEventListener('pointerleave', ()=> controls[key]=false);
}
bindBtn('left','left'); bindBtn('right','right'); bindBtn('up','up'); bindBtn('down','down');

// start game
document.getElementById('startBtn').addEventListener('click', ()=>{
  nick = document.getElementById('nick').value.trim() || 'Ассасин';
  document.getElementById('nickPreview').textContent = nick;
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('endScreen').style.display = 'none';
  // set initial player pos
  player.x = Math.max(player.size/2, window.innerWidth*0.15);
  player.y = Math.max(player.size/2, window.innerHeight*0.5);
  spawnAndRun();
});

document.getElementById('retry').addEventListener('click', ()=>{
  document.getElementById('endScreen').style.display='none';
  document.getElementById('startScreen').style.display='flex';
});

function spawnAndRun(){
  spawnEnemies();
  running = true;
  loop();
}

// show end screen with message and donation line
function showEnd(){
  document.getElementById('endTitle').textContent = 'Молодец, ' + (nick || 'Ассасин') + '!';
  document.getElementById('endSub').textContent = 'Скиньте Адилхану 5000тг, отдуши';
  document.getElementById('endScreen').style.display = 'flex';
}

// responsive resize - keep canvas fit
window.addEventListener('resize', ()=>{ fit(); draw(); });

// ready
spawnEnemies();
draw();
