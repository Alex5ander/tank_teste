/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas');
canvas.width = 640;
canvas.height = 480;
const ctx = canvas.getContext('2d');
let spriteSheet, tank, barrel, sand, bullet, tracks, smoke, tree;

const socket = io();

let players = [];
let shots = [];
let smokes = [];
let trees = [];

let { sin, cos, PI, floor } = Math;
let keys = [];

const offcanvas = new OffscreenCanvas(canvas.width, canvas.height);
const offctx = offcanvas.getContext('2d');

const drawSprite = (sprite, rect) =>
  ctx.drawImage(spriteSheet, sprite.x, sprite.y, sprite.width, sprite.height, rect.x, rect.y, rect.w, rect.h);

const loop = () => {
  ctx.drawImage(offcanvas, 0, 0);

  trees.forEach(e => {
    drawSprite(tree[e.index], e);
  })

  players.forEach(e => {
    ctx.save();
    let pmx = e.x + e.w / 2;
    let pmy = e.y + e.h / 2;
    ctx.translate(pmx, pmy);
    ctx.rotate(e.angle);
    ctx.translate(-pmx, -pmy);
    drawSprite(tank, e);
    ctx.restore();

    ctx.save();
    ctx.translate(pmx, pmy);
    ctx.rotate(e.angle + e.barrel.angle - PI);
    ctx.translate(-pmx, -pmy);
    drawSprite(barrel, { x: pmx - barrel.width / 2, y: pmy, w: barrel.width, h: barrel.height });
    ctx.restore();
  });

  shots.forEach(e => {
    ctx.save();
    let mx = e.x + e.w / 2;
    let my = e.y + e.h / 2;
    ctx.translate(mx, my);
    ctx.rotate(e.angle);
    ctx.translate(-mx, -my);
    ctx.drawImage(spriteSheet, bullet.x, bullet.y, bullet.width, bullet.height, e.x, e.y, e.w, e.h)
    ctx.restore();
  });

  smokes.forEach(e => {
    let index = 1;
    drawSprite(smoke[index], { ...e, w: smoke[index].width, h: smoke[index].height });
  });

  if (keys.length) {
    socket.volatile.emit('move', { keys });
  }

  setTimeout(loop, 1000 / 30);
}

socket.on('update', e => {
  players = e.players;
  shots = e.shots;
  smokes = e.smokes;
  trees = e.trees;
});

window.addEventListener('keydown', e => {
  if (!keys.includes(e.code)) {
    keys.push(e.code);
  }
});

window.addEventListener('keyup', e => {
  keys = keys.filter(key => key != e.code);
});

(async () => {

  const sheet = await (await fetch('sheet.json')).json();

  tank = sheet.tankBeige;
  barrel = sheet.barrelBeige;
  bullet = sheet.bulletBeigeSilver_outline;
  sand = sheet.sand;
  tracks = sheet.tracksLarge;

  tree = [
    sheet.treeSmall,
    sheet.treeLarge
  ];

  smoke = [
    sheet.smokeGrey3,
    sheet.smokeGrey2,
    sheet.smokeGrey1
  ];

  spriteSheet = new Image();
  spriteSheet.src = "./sheet_tanks.png";
  spriteSheet.onload = () => {
    for (let i = 0; i < canvas.width * canvas.height; i++) {
      let x = i % canvas.width;
      let y = floor(i / canvas.width) % canvas.height;
      offctx.drawImage(spriteSheet, sand.x, sand.y, sand.width, sand.height, x * 128, y * 128, 128, 128);
    }
    loop();
  };
})()

