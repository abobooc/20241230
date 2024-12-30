let sprites = {
  // 第一個角色的精靈圖（原有的）
  player1: {
    idle: {
      img: null,
      width: 151.1,
      height: 212,
      frames: 11
    },
    walk: {
      img: null,
      width: 155.75,
      height: 198,
      frames: 8
    },
    
    jump: {
      img: null,
      width: 148,
      height: 188,
      frames: 12
    }
  },
  // 第二個角色的精靈圖
  player2: {
    idle: {
      img: null,
      width: 147.9,
      height: 171,
      frames: 11
    },
    walk: {
      img: null,
      width: 206.8,
      height: 171,
      frames: 6
    },
    jump: {
      img: null,
      width: 153.3,
      height: 214,
      frames: 11
    }
  },
  explosion: {  //爆炸圖
    img: null,
    width: 279.2,
    height: 182,
    frames: 14
  },
  bullet: {  //發射子彈
    img: null,
    width: 43.4,
    height: 27,
    frames: 5
  }
};

let currentFrame1=0;
let currentFrame2=0;
let player1status='idle';
let player2status='idle';

let backgroundImg;

let gameOverDialog = {
  show: false,
  winner: ''
};

let greetingDialog = {
  show: false,
  text: '',
  x: 0,
  y: 0,
  timer: 0
};

function preload(){
   // 載入背景圖片
   backgroundImg = loadImage('assets/background.png');
  
  sprites.player1.idle.img=loadImage('assets/player1/idle.png');
  sprites.player1.walk.img=loadImage('assets/player1/walk.png');
  sprites.player1.jump.img=loadImage('assets/player1/jump.png');

  sprites.player2.idle.img=loadImage('assets/player2/idle.png');
  sprites.player2.walk.img=loadImage('assets/player2/walk.png');
  sprites.player2.jump.img=loadImage('assets/player2/jump.png');

  sprites.explosion.img=loadImage('assets/effects/explosion.png');
  sprites.bullet.img=loadImage('assets/effects/bullet.png');
}

let player1 = {
  x: 100,
  y: 300,
  speedX: 5,
  speedY: 0,
  gravity: 0.8,
  jumpForce: -15,
  isJumping: false,
  groundY: 300,
  currentFrame: 0,
  currentAction: 'idle',
  direction: 1,
  health: 100,
  bullets: []
};

// 新增第二個角色
let player2 = {
  x: 700,
  y: 300,
  speedX: 5,
  speedY: 0,
  gravity: 0.8,
  jumpForce: -15,
  isJumping: false,
  groundY: 300,
  currentFrame: 0,
  currentAction: 'idle',
  direction: -1,
  health: 100,
  bullets: []
};

function setup() {
  // 創建全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  frameRate(60);
  
  // 調整玩家地面位置（上移至 50% 的位置）
  player1.groundY = windowHeight * 0.5;
  player2.groundY = windowHeight * 0.5;
  
  player1.x = windowWidth * 0.1;
  player1.y = player1.groundY;
  
  player2.x = windowWidth * 0.9;
  player2.y = player2.groundY;
}

function windowResized() {
  // 重新設定畫布大小
  resizeCanvas(windowWidth, windowHeight);
  
  // 重新調整玩家位置
  player1.x = constrain(player1.x, 0, windowWidth * 0.8);
  player2.x = constrain(player2.x, 0, windowWidth * 0.8);
  
  player1.y = constrain(player1.y, 0, windowHeight * 0.8);
  player2.y = constrain(player2.y, 0, windowHeight * 0.8);
}

function draw() {
  // 繪製背景
  image(backgroundImg, 0, 0, windowWidth, windowHeight);
  
  // 在頂端繪製系所名稱
  push();
  textSize(32);
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  fill(255);
  stroke(0);
  strokeWeight(3);
  text('淡江教育科技系', width/2, 20);
  pop();
  
  // 在左下角加入操作說明
  push();
  textSize(16);
  textAlign(LEFT, BOTTOM);
  fill(255);  // 白色文字
  stroke(0);  // 黑色邊框
  strokeWeight(2);
  
  let instructions = [
    "玩家1操作：",
    "W - 跳躍",
    "A - 左移",
    "D - 右移",
    "F - 發射",
    "",
    "玩家2操作：",
    "↑ - 跳躍",
    "← - 左移",
    "→ - 右移",
    "空白鍵 - 發射",
    "",
    "按 R 重新開始"
  ];
  
  let startY = height - 20;  // 從底部往上20像素開始
  let lineHeight = 20;  // 行高
  
  for (let i = instructions.length - 1; i >= 0; i--) {
    text(instructions[i], 20, startY - (instructions.length - 1 - i) * lineHeight);
  }
  pop();
  
  // 原有的繪製內容
  checkKeys();
  checkCollisions();
  
  if (!player1.isHit || frameCount % 4 < 2) {
    drawCharacter(player1, sprites.player1);
  }
  if (!player2.isHit || frameCount % 4 < 2) {
    drawCharacter(player2, sprites.player2);
  }
  
  drawHealth();
  
  if (greetingDialog.show) {
    drawGreetingDialog();
  }
  
  if (gameOverDialog.show) {
    drawGameOverDialog();
  }
}

function drawCharacter(player, playerSprites) {
  let currentAnim = playerSprites[player.currentAction];
  if (!currentAnim || !currentAnim.img) return;

  // 根據動作選擇對應的幀
  let frameIndex;
  if (player.currentAction === 'walk') {
    frameIndex = Math.floor(player.x / 30) % currentAnim.frames; // 根據位置決定幀
  } else if (player.currentAction === 'jump') {
    frameIndex = Math.min(Math.floor(Math.abs(player.speedY) / 2), currentAnim.frames - 1);
  } else {
    frameIndex = Math.floor(Date.now() / 200) % currentAnim.frames; // idle 動作慢速循環
  }

  let sx = frameIndex * currentAnim.width;
  let sy = 0;

  push();
  translate(player.x + (player.direction === -1 ? currentAnim.width : 0), player.y);
  scale(player.direction, 1);
  image(currentAnim.img, 
    0, 0, 
    currentAnim.width, currentAnim.height, 
    sx, sy, 
    currentAnim.width, currentAnim.height
  );
  pop();
  
  // 繪製子彈
  drawBullets(player);
}
// 繪製生命值
function drawHealth() {
  textSize(16);
  textAlign(LEFT, CENTER);
  
  // 玩家1生命值 (左側)
  fill(255, 0, 0);
  rect(10, 10, player1.health, 20);
  fill(255);
  text(`HP: ${Math.ceil(player1.health)}`, 15, 20);
  
  // 玩家2生命值 (右側)
  push();
  translate(width - 10, 10);
  fill(255, 0, 0);
  rect(-player2.health, 0, player2.health, 20);
  fill(255);
  textAlign(RIGHT, CENTER);
  text(`HP: ${Math.ceil(player2.health)}`, -player2.health - 5, 10);
  pop();
  
  // 如果生命值為0，顯示遊戲結束
  if (player1.health <= 0 || player2.health <= 0) {
    textAlign(CENTER, CENTER);
    textSize(48);
    fill(255);
    text('GAME OVER', width/2, height/2);
    
    textSize(24);
    let winner = player1.health <= 0 ? 'Player 2' : 'Player 1';
    text(`${winner} Wins!`, width/2, height/2 + 50);
  }
}
// 檢查碰撞
function checkCollisions() {
  if (gameOverDialog.show) return;

  // 檢查玩家1的子彈是否擊中玩家2
  for (let i = player1.bullets.length - 1; i >= 0; i--) {
    let bullet = player1.bullets[i];
    if (checkBulletHit(bullet, player2)) {
      // 扣除血量（可累加）
      player2.health = Math.max(0, player2.health - 10);
      player1.bullets.splice(i, 1);
      
      player2.isHit = true;
      setTimeout(() => {
        player2.isHit = false;
      }, 200);

      // 檢查遊戲結束
      if (player2.health <= 0) {
        gameOverDialog.show = true;
        gameOverDialog.winner = 'Player 1';
      }
    }
  }
  
  // 檢查玩家2的子彈是否擊中玩家1
  for (let i = player2.bullets.length - 1; i >= 0; i--) {
    let bullet = player2.bullets[i];
    if (checkBulletHit(bullet, player1)) {
      // 扣除血量（可累加）
      player1.health = Math.max(0, player1.health - 10);
      player2.bullets.splice(i, 1);
      
      player1.isHit = true;
      setTimeout(() => {
        player1.isHit = false;
      }, 200);

      // 檢查遊戲結束
      if (player1.health <= 0) {
        gameOverDialog.show = true;
        gameOverDialog.winner = 'Player 2';
      }
    }
  }
}
// 檢查子彈是否擊中
function checkBulletHit(bullet, player) {
  let hitbox = {
    width: 120,   // 增加碰撞箱寬度
    height: 170   // 增加碰撞箱高度
  };
  
  return bullet.x > player.x && 
         bullet.x < player.x + hitbox.width &&
         bullet.y > player.y && 
         bullet.y < player.y + hitbox.height;
}
// 鍵盤控制
function keyPressed() {
  // 遊戲結束時按R重新開始
  if ((key === 'r' || key === 'R') && gameOverDialog.show) {
    resetGame();
    return;
  }
  
  // 玩家1發射子彈 (F鍵)
  if (key === 'f' || key === 'F') {
    shoot(player1);
  }
  
  // 玩家2發射子彈 (空白鍵)
  if (keyCode === 32) {
    shoot(player2);
  }
}
function checkKeys() {
  if (gameOverDialog.show) return; // 遊戲結束時不能移動
  
  // 玩家1移動控制
  if (keyIsDown(65)) { // A鍵
    player1.x -= player1.speedX;
    player1.direction = -1;
    player1.currentAction = 'walk';
  } else if (keyIsDown(68)) { // D鍵
    player1.x += player1.speedX;
    player1.direction = 1;
    player1.currentAction = 'walk';
  } else if (!player1.isJumping) {
    player1.currentAction = 'idle';
  }

  if (keyIsDown(87) && !player1.isJumping) { // W鍵
    player1.speedY = player1.jumpForce;
    player1.isJumping = true;
    player1.currentAction = 'jump';
  }

  // 玩家2移動控制
  if (keyIsDown(LEFT_ARROW)) {
    player2.x -= player2.speedX;
    player2.direction = -1;
    player2.currentAction = 'walk';
  } else if (keyIsDown(RIGHT_ARROW)) {
    player2.x += player2.speedX;
    player2.direction = 1;
    player2.currentAction = 'walk';
  } else if (!player2.isJumping) {
    player2.currentAction = 'idle';
  }

  if (keyIsDown(UP_ARROW) && !player2.isJumping) {
    player2.speedY = player2.jumpForce;
    player2.isJumping = true;
    player2.currentAction = 'jump';
  }

  // 更新物理
  updatePhysics(player1);
  updatePhysics(player2);
}
// 發射子彈
function shoot(player) {
  if (gameOverDialog.show) return;
  
  if (player.bullets.length < 3) {
    let bullet = {
      x: player.x + (player.direction === 1 ? 75 : 25),
      y: player.y + 75,
      speed: 15 * player.direction
    };
    
    player.bullets.push(bullet);
    player.currentAction = 'jump';
    
    // 顯示祝福語對話框
    showGreeting(player);
    
    setTimeout(() => {
      if (!player.isJumping) {
        player.currentAction = 'idle';
      }
    }, 500);
  }
}

function showGreeting(player) {
  const greetings = [
    "新年快樂！",
    "恭喜發財！",
    "萬事如意！",
    "龍年大吉！",
    "心想事成！",
    "吉祥如意！",
    "財源廣進！",
    "福氣滿滿！"
  ];
  
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  
  greetingDialog.text = greeting;
  greetingDialog.x = player.x + (player === player1 ? 50 : -50);
  greetingDialog.y = player.y - 50;
  greetingDialog.show = true;
  greetingDialog.timer = 60;
}

function drawGreetingDialog() {
  greetingDialog.timer--;
  if (greetingDialog.timer <= 0) {
    greetingDialog.show = false;
    return;
  }
  
  push();
  translate(greetingDialog.x, greetingDialog.y);
  
  fill(255, 245, 225);
  stroke(255, 200, 0);
  strokeWeight(2);
  
  textSize(16);
  let textWidth = greetingDialog.text.length * 16 + 20;
  let boxHeight = 30;
  
  rect(-textWidth/2, -boxHeight/2, textWidth, boxHeight, 10);
  
  fill(255, 0, 0);
  noStroke();
  textAlign(CENTER, CENTER);
  text(greetingDialog.text, 0, 0);
  
  pop();
}

function drawBullets(player) {
  for (let i = player.bullets.length - 1; i >= 0; i--) {
    let bullet = player.bullets[i];
    
    // 繪製子彈（這裡用簡單的圓形表示）
    fill(255, 255, 0);
    noStroke();
    circle(bullet.x, bullet.y, 10);
    
    // 更新子彈位置
    bullet.x += bullet.speed;
    
    // 移除超出畫面的子彈
    if (bullet.x < 0 || bullet.x > width) {
      player.bullets.splice(i, 1);
    }
  }
}
// 添加物理更新函數
function updatePhysics(player) {
  // 應用重力
  if (player.y < player.groundY) {
    player.speedY += player.gravity;
    player.isJumping = true;
  }
  
  // 更新垂直位置
  player.y += player.speedY;
  
  // 檢查是否著地
  if (player.y >= player.groundY) {
    player.y = player.groundY;
    player.speedY = 0;
    player.isJumping = false;
    if (player.currentAction === 'jump') {
      player.currentAction = 'idle';
    }
  }
  
  // 確保角色不會超出畫面範圍
  if (player.x < 0) {
    player.x = 0;
  }
  if (player.x > width - sprites.player1.idle.width) {
    player.x = width - sprites.player1.idle.width;
  }
  
  // 如果沒有其他動作，回到待機狀態
  if (!player.isJumping && player.currentAction !== 'walk') {
    player.currentAction = 'idle';
  }
}

// 新增遊戲結束對話框繪製函數
function drawGameOverDialog() {
  // 半透明背景
  fill(0, 0, 0, 127);
  rect(0, 0, width, height);
  
  // 對話框背景
  let boxWidth = 400;
  let boxHeight = 200;
  let boxX = (width - boxWidth) / 2;
  let boxY = (height - boxHeight) / 2;
  
  fill(255);
  stroke(0);
  strokeWeight(2);
  rect(boxX, boxY, boxWidth, boxHeight, 20);
  
  // 文字
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(32);
  text('遊戲結束', width/2, height/2 - 40);
  textSize(24);
  text(`${gameOverDialog.winner} 獲勝！`, width/2, height/2);
  textSize(20);
  text('按 R 鍵重新開始', width/2, height/2 + 40);
}

function resetGame() {
  // 重置對話框狀態
  gameOverDialog.show = false;
  gameOverDialog.winner = '';
  
  // 重置玩家1狀態
  player1.x = windowWidth * 0.1;
  player1.y = player1.groundY;
  player1.health = 100;
  player1.speedY = 0;
  player1.isJumping = false;
  player1.currentAction = 'idle';
  player1.direction = 1;
  player1.bullets = [];
  player1.isHit = false;
  
  // 重置玩家2狀態
  player2.x = windowWidth * 0.9;
  player2.y = player2.groundY;
  player2.health = 100;
  player2.speedY = 0;
  player2.isJumping = false;
  player2.currentAction = 'idle';
  player2.direction = -1;
  player2.bullets = [];
  player2.isHit = false;
  
  // 重置祝福語對話框
  greetingDialog.show = false;
  greetingDialog.timer = 0;
}