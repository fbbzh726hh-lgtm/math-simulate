// ▼ モーダル開閉状態の管理 ▼
let isModalOpen = true;

// HTML側のボタンが押されたときに呼ばれる
window.onModalClosed = function() {
  isModalOpen = false;
};
window.onModalOpened = function() {
  isModalOpen = true;
};
window.resetToInitialState = function() {
  resetProblems();
  resetSimulation();
};

// ▼ 歩行者P（旋回中心との固定距離測定） ▼
let pX = 260;
let pY = 410;
let dragging = false;

const ZOOM = 2.0;    
const PAN_X = 0;     
const PAN_Y = -300;  
const PX_TO_M = 0.04; 

const OX = 305;
const OY = 395;
let showGrid = false; 

// ▼ 状態管理変数 ▼
let currentProblem = 1; // 1: 領域の式問題, 2: 面積問題
let showExplanation = false; 
let userAnswerQ1 = ""; 
let userAnswerQ2Text = ""; 

// ▼ UI再描画フラグ ▼
let uiNeedsUpdate = true;

let vehicleType = "4wheel"; 
let vehicleSize = "medium"; 
let carX = 330; 
let carY = 550;
let carAngle = -Math.PI / 2;
let speed = 1.0; 
let steering = 0;

let wheelbase = 75;
let halfWidth = 24;
let frontOverhang = 85;
let rearOverhang = -10;
let R_target = 95;
let peakSteer = 0;

let carPolygonsTrail = [];
let frontWheelTrail = [];
let rearWheelTrail = [];
let driveState = "STOP"; 

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent('canvas-container');
  onVehicleConfigChange();
}

function toggleGrid() {
  const toggle = document.getElementById('grid-toggle');
  if (toggle) showGrid = toggle.checked;
}

// Q1の解答送信
function submitAnswerQ1() {
  const options = document.getElementsByName('q1-ans');
  for (let opt of options) {
    if (opt.checked) {
      userAnswerQ1 = opt.value;
    }
  }
  showExplanation = true;
  uiNeedsUpdate = true;
}

// Q2の解答送信
function submitAnswerQ2() {
  const ansInput = document.getElementById('user-answer-q2');
  if (ansInput) {
    userAnswerQ2Text = ansInput.value.trim();
  }
  showExplanation = true; 
  uiNeedsUpdate = true;
}

// 次の問題へ遷移
function nextProblem() {
  currentProblem = 2;
  showExplanation = false;
  userAnswerQ2Text = "";
  uiNeedsUpdate = true;
}

// リセット（全体）
function resetProblems() {
  currentProblem = 1;
  showExplanation = false;
  userAnswerQ1 = "";
  userAnswerQ2Text = "";
  uiNeedsUpdate = true;
}

function updateVehicleParams() {
  if (vehicleSize === "bus") {
    wheelbase = 105; halfWidth = 28; frontOverhang = 145; rearOverhang = -30; R_target = 115;
  } else {
    wheelbase = 75; halfWidth = 25; frontOverhang = 105; rearOverhang = -20; R_target = 95;
  }
  peakSteer = Math.atan(wheelbase / R_target);
}

function onVehicleConfigChange() {
  const sizeElem = document.getElementById('vehicle-size');
  if (sizeElem) {
    vehicleSize = sizeElem.value;
  }
  resetProblems(); 
  resetSimulation();
}

function resetSimulation() {
  driveState = "STOP";
  carX = 330; 
  carY = 550;
  carAngle = -Math.PI / 2;
  steering = 0;
  carPolygonsTrail = [];
  frontWheelTrail = [];
  rearWheelTrail = [];
  updateVehicleParams();
}

function draw() {
  rectMode(CENTER);
  background(120);
  
  push();
  scale(ZOOM);
  translate(PAN_X, PAN_Y);
  
  // 背景と道路
  fill(120);
  noStroke();
  rect(400, 300, 200, 600);
  rect(400, 300, 800, 200);
  fill(120);
  rect(150, 100, 300, 200);
  rect(650, 100, 300, 200);
  rect(150, 500, 300, 200);
  rect(650, 500, 300, 200);

  push();
  translate(-14, 14);

  stroke(255);
  strokeWeight(4);
  noFill();
  const cornerR = 30;
  line(305, 0, 305, 175);
  arc(275, 175, cornerR * 2, cornerR * 2, 0, HALF_PI);
  line(275, 205, 0, 205);
  line(495, 0, 495, 175);
  arc(525, 175, cornerR * 2, cornerR * 2, HALF_PI, PI);
  line(525, 205, 800, 205);
  line(0, 395, 275, 395);
  arc(275, 425, cornerR * 2, cornerR * 2, -HALF_PI, 0);
  line(305, 425, 305, 600);
  line(525, 395, 800, 395);
  arc(525, 425, cornerR * 2, cornerR * 2, PI, PI + HALF_PI);
  line(495, 425, 495, 600);
  
  stroke(255, 200, 0);
  line(400, 450, 400, 480);
  stroke(255);
  drawingContext.setLineDash([10, 15]);
  line(400, 480, 400, 600);
  drawingContext.setLineDash([]);
  stroke(255, 200, 0);
  line(400, 150, 400, 120);
  stroke(255);
  drawingContext.setLineDash([10, 15]);
  line(400, 120, 400, 0);
  drawingContext.setLineDash([]);
  stroke(255, 200, 0);
  line(250, 300, 220, 300);
  stroke(255);
  drawingContext.setLineDash([10, 15]);
  line(220, 300, 0, 300);
  drawingContext.setLineDash([]);
  
  strokeWeight(4);
  stroke(255);
  for(let i=315; i<490; i+=15) {
    line(i, 415, i, 435);
    line(i, 165, i, 185);
  }
  for(let i=215; i<390; i+=15) {
    line(265, i, 285, i);
    line(515, i, 535, i);
  }
  
  strokeWeight(6);
  stroke(255);
  line(305, 450, 400, 450);
  line(400, 150, 495, 150);
  line(250, 205, 300, 205);
  line(500, 395, 550, 395);
  pop(); 

  if (showGrid) {
    push();
    stroke(0, 200, 255, 60);
    strokeWeight(1 / ZOOM);
    for (let x = -350; x <= 350; x += 50) {
      line(OX + x, OY - 350, OX + x, OY + 350);
    }
    for (let y = -350; y <= 350; y += 50) {
      line(OX - 350, OY + y, OX + 350, OY + y);
    }
    stroke(0, 200, 255, 200);
    strokeWeight(2 / ZOOM);
    line(OX - 350, OY, OX + 350, OY); 
    line(OX, OY - 350, OX, OY + 350); 
    fill(0, 150, 255);
    noStroke();
    textSize(12 / ZOOM);
    textAlign(CENTER, TOP);
    for (let x = -300; x <= 300; x += 50) {
      if (x === 0) continue;
      text((x * PX_TO_M).toFixed(0), OX + x, OY + 5 / ZOOM);
      stroke(0, 200, 255, 200);
      strokeWeight(1 / ZOOM);
      line(OX + x, OY - 3 / ZOOM, OX + x, OY + 3 / ZOOM);
      noStroke();
    }
    text("x (m)", OX + 330, OY + 5 / ZOOM);
    textAlign(RIGHT, CENTER);
    for (let y = -300; y <= 300; y += 50) {
      if (y === 0) continue;
      text((-y * PX_TO_M).toFixed(0), OX - 5 / ZOOM, OY + y); 
      stroke(0, 200, 255, 200);
      strokeWeight(1 / ZOOM);
      line(OX - 3 / ZOOM, OY + y, OX + 3 / ZOOM, OY + y);
      noStroke();
    }
    text("y (m)", OX - 5 / ZOOM, OY - 330);
    textAlign(RIGHT, TOP);
    text("O", OX - 4 / ZOOM, OY + 4 / ZOOM);
    pop();
  }
  
  if (driveState === "DRIVING") {
    let targetEndAngle = -Math.PI;
    let targetY = 395 - halfWidth; 
    let startTurnY = targetY + R_target + 10; 
    let targetSteering = 0;

    if (carAngle > targetEndAngle) {
      let remainAngle = carAngle - targetEndAngle;
      if (remainAngle < 0.15) {
        targetSteering = 0;
      } else if (carY <= startTurnY) {
        targetSteering = -peakSteer;
      }
    } else {
      targetSteering = 0;
    }

    steering += (targetSteering - steering) * (0.1 * speed);
    carX += speed * Math.cos(carAngle);
    carY += speed * Math.sin(carAngle);

    if (carAngle > targetEndAngle) {
      carAngle += (speed / wheelbase) * Math.tan(steering);
      let remainAngle = carAngle - targetEndAngle;
      if (remainAngle < 0.1 && remainAngle > 0) {
        carAngle += (targetEndAngle - carAngle) * (0.08 * speed);
      }
      if (carAngle <= targetEndAngle) {
        carAngle = targetEndAngle;
        carY = targetY; 
      }
    } else {
      carAngle = targetEndAngle;
      carY = targetY; 
    }
    if (carX < -250) driveState = "FINISHED"; 
    
    let currentCarPoly = [
      { x: carX + frontOverhang * Math.cos(carAngle) - halfWidth * Math.sin(carAngle), y: carY + frontOverhang * Math.sin(carAngle) + halfWidth * Math.cos(carAngle) },
      { x: carX + frontOverhang * Math.cos(carAngle) + halfWidth * Math.sin(carAngle), y: carY + frontOverhang * Math.sin(carAngle) - halfWidth * Math.cos(carAngle) },
      { x: carX + rearOverhang * Math.cos(carAngle) + halfWidth * Math.sin(carAngle), y: carY + rearOverhang * Math.sin(carAngle) - halfWidth * Math.cos(carAngle) },
      { x: carX + rearOverhang * Math.cos(carAngle) - halfWidth * Math.sin(carAngle), y: carY + rearOverhang * Math.sin(carAngle) + halfWidth * Math.cos(carAngle) }
    ];
    carPolygonsTrail.push(currentCarPoly);
    
    let fwX = carX + wheelbase * Math.cos(carAngle) + halfWidth * Math.sin(carAngle);
    let fwY = carY + wheelbase * Math.sin(carAngle) - halfWidth * Math.cos(carAngle);
    let rwX = carX + halfWidth * Math.sin(carAngle);
    let rwY = carY - halfWidth * Math.cos(carAngle);
    
    frontWheelTrail.push({x: fwX, y: fwY});
    rearWheelTrail.push({x: rwX, y: rwY});
  }

  if (carPolygonsTrail.length > 0) {
    fill(255, 220, 150, 10);
    noStroke();
    for (let poly of carPolygonsTrail) {
      beginShape();
      for (let pt of poly) vertex(pt.x, pt.y);
      endShape(CLOSE);
    }
  }
  
  if (frontWheelTrail.length > 0) {
    noFill();
    strokeWeight(2);
    drawingContext.setLineDash([6, 6]);
    stroke(255, 50, 50);
    beginShape();
    for (let pt of rearWheelTrail) vertex(pt.x, pt.y);
    endShape();
    stroke(50, 100, 255);
    beginShape();
    for (let pt of frontWheelTrail) vertex(pt.x, pt.y);
    endShape();
    drawingContext.setLineDash([]);
  }

  let cx_draw = 25 - R_target; 
  let cy_draw = 25 - R_target; 
  let center_x = OX + cx_draw;
  let center_y = OY - cy_draw;

  if (currentProblem === 2) {
    push();
    
    // 旋回中心Cの十字
    stroke(255, 120, 0, showExplanation ? 255 : 120);
    strokeWeight((showExplanation ? 2 : 1) / ZOOM);
    let crossSize = 8 / ZOOM;
    line(center_x - crossSize, center_y, center_x + crossSize, center_y);
    line(center_x, center_y - crossSize, center_x, center_y + crossSize);
    
    if (showExplanation) {
      fill(255, 120, 0);
      noStroke();
      textSize(12 / ZOOM);
      textAlign(RIGHT, BOTTOM);
      text("旋回中心 C", center_x - 5 / ZOOM, center_y - 5 / ZOOM);
    }

    let W_px = halfWidth * 2;
    let R_r_px = R_target - (W_px / 2);
    let R_fw_px = Math.sqrt(Math.pow(R_r_px, 2) + Math.pow(wheelbase, 2));
    let alpha_rad = Math.atan(wheelbase / R_r_px);
    let alpha_deg = alpha_rad * 180 / Math.PI;
    let beta_deg = alpha_deg;
    let b_ext = radians(90 + beta_deg);

    if (!showExplanation) {
      // ▼ 問題画面のとき（補助線の枠線のみ）
      strokeWeight(1.5 / ZOOM);
      drawingContext.setLineDash([4/ZOOM, 4/ZOOM]);
      stroke(0, 255, 0, 80); line(center_x, center_y, center_x + R_r_px, center_y);
      stroke(255, 0, 255, 80); line(center_x, center_y, center_x + R_fw_px * Math.cos(alpha_rad), center_y - R_fw_px * Math.sin(alpha_rad));
      stroke(255, 0, 255, 80); line(center_x, center_y, center_x, center_y - R_fw_px);
      stroke(0, 255, 255, 80); line(center_x, center_y, center_x + R_fw_px * Math.cos(b_ext), center_y - R_fw_px * Math.sin(b_ext));
      drawingContext.setLineDash([]);
    } else {
      // ▼ 解説画面のとき（扇形の詳細なループ描画）
      stroke(0, 255, 0, 180); strokeWeight(1.5 / ZOOM);
      for (let a = 0; a <= alpha_deg; a += 3.5) {
        let rad = radians(a);
        let x1 = center_x + R_r_px * Math.cos(rad);
        let y1 = center_y - R_r_px * Math.sin(rad);
        let x2 = center_x + R_r_px; 
        let y2 = center_y - R_r_px * Math.tan(rad);
        line(x1, y1, x2, y2);
      }
      stroke(255, 0, 255, 180); strokeWeight(1.5 / ZOOM);
      for (let a = alpha_deg + 1; a <= 90; a += 3.5) {
        let rad = radians(a);
        let x1 = center_x + R_r_px * Math.cos(rad);
        let y1 = center_y - R_r_px * Math.sin(rad);
        let x2 = center_x + R_fw_px * Math.cos(rad); 
        let y2 = center_y - R_fw_px * Math.sin(rad);
        line(x1, y1, x2, y2);
      }
      stroke(0, 255, 255, 180); strokeWeight(1.5 / ZOOM);
      for (let a = 90 + 1; a <= 90 + beta_deg; a += 3.5) {
        let rad = radians(a);
        let x1 = center_x + R_r_px / Math.tan(rad); 
        let y1 = center_y - R_r_px; 
        let x2 = center_x + R_fw_px * Math.cos(rad); 
        let y2 = center_y - R_fw_px * Math.sin(rad);
        line(x1, y1, x2, y2);
      }

      stroke(0, 255, 0); strokeWeight(3 / ZOOM); line(center_x, center_y, center_x + R_r_px, center_y);
      stroke(255, 0, 255); strokeWeight(3 / ZOOM); line(center_x, center_y, center_x + R_fw_px * Math.cos(alpha_rad), center_y - R_fw_px * Math.sin(alpha_rad));
      stroke(255, 0, 255); strokeWeight(3 / ZOOM); line(center_x, center_y, center_x, center_y - R_fw_px);
      stroke(0, 255, 255); strokeWeight(3 / ZOOM); line(center_x, center_y, center_x + R_fw_px * Math.cos(b_ext), center_y - R_fw_px * Math.sin(b_ext));
    }

    // ▼▼ 問題画面・解説画面共通の表示（直角二等辺三角形のハイライトと太く濃いマーク） ▼▼
    
    let rMarkSize = 12 / ZOOM; // 直角マークの大きさを少し拡大

    // 1. 進入部（緑）の直角二等辺三角形
    fill(0, 255, 0, 40); noStroke();
    beginShape();
    vertex(center_x, center_y);
    vertex(center_x + R_r_px, center_y);
    vertex(center_x + R_r_px, center_y - R_r_px);
    endShape(CLOSE);
    
    // 進入部の直角マーク（∟）と 45°
    stroke(0, 100, 0); // より濃い緑
    strokeWeight(2.5 / ZOOM); // 線を太く
    noFill();
    line(center_x + R_r_px - rMarkSize, center_y, center_x + R_r_px - rMarkSize, center_y - rMarkSize);
    line(center_x + R_r_px - rMarkSize, center_y - rMarkSize, center_x + R_r_px, center_y - rMarkSize);
    
    strokeWeight(1.5 / ZOOM); // 弧は少し細めに
    arc(center_x, center_y, 40/ZOOM, 40/ZOOM, -QUARTER_PI, 0); 
    
    fill(0, 100, 0); noStroke(); 
    textSize(13 / ZOOM); // 文字を少し大きく
    textStyle(BOLD); // 太字
    textAlign(LEFT, CENTER);
    text("45°", center_x + 24/ZOOM, center_y - 8/ZOOM);
    textStyle(NORMAL); // 元に戻す

    // ★ 同じ長さマーク（進入部の短辺2つ）
    drawEqualLengthMark(center_x + R_r_px / 2, center_y); // 底辺
    drawEqualLengthMark(center_x + R_r_px, center_y - R_r_px / 2); // 高さ

    // 2. 脱出部（水色）の直角二等辺三角形
    fill(0, 200, 255, 40); noStroke();
    beginShape();
    vertex(center_x, center_y);
    vertex(center_x, center_y - R_r_px);
    vertex(center_x - R_r_px, center_y - R_r_px); 
    endShape(CLOSE);

    // 脱出部の直角マーク（∟）と 45°
    stroke(0, 100, 180); // より濃い水色
    strokeWeight(2.5 / ZOOM); // 線を太く
    noFill();
    line(center_x, center_y - R_r_px + rMarkSize, center_x - rMarkSize, center_y - R_r_px + rMarkSize); 
    line(center_x - rMarkSize, center_y - R_r_px + rMarkSize, center_x - rMarkSize, center_y - R_r_px); 
    
    strokeWeight(1.5 / ZOOM);
    arc(center_x, center_y, 40/ZOOM, 40/ZOOM, -PI + QUARTER_PI, -HALF_PI); 
    
    fill(0, 100, 180); noStroke(); 
    textSize(13 / ZOOM); 
    textStyle(BOLD); 
    textAlign(RIGHT, CENTER);
    text("45°", center_x - 12/ZOOM, center_y - 25/ZOOM);
    textStyle(NORMAL);

    // ★ 同じ長さマーク（脱出部の短辺2つ）
    drawEqualLengthMark(center_x, center_y - R_r_px / 2); // 右側の高さ (y軸線上)
    drawEqualLengthMark(center_x - R_r_px / 2, center_y - R_r_px); // 上辺 (左側)

    pop();
  }
  
  // ▼▼ 歩行者P（旋回中心Cとの距離計測） ▼▼
  push();
  stroke(255, 120, 0, 180);
  strokeWeight(1.5 / ZOOM);
  drawingContext.setLineDash([4 / ZOOM, 4 / ZOOM]);
  line(pX, pY, center_x, center_y);
  drawingContext.setLineDash([]);
  
  let distToC = dist(pX, pY, center_x, center_y) * PX_TO_M;
  push();
  translate((pX + center_x) / 2, (pY + center_y) / 2);
  let angleToP = atan2(pY - center_y, pX - center_x);
  if (angleToP > HALF_PI || angleToP < -HALF_PI) angleToP += PI;
  rotate(angleToP);
  fill(255, 100, 0);
  noStroke();
  textSize(12 / ZOOM);
  textAlign(CENTER, BOTTOM);
  text(`距離: ${distToC.toFixed(1)}m`, 0, -3 / ZOOM);
  pop();
  
  let pX_m = ((pX - center_x) * PX_TO_M).toFixed(1);
  let pY_m = (-(pY - center_y) * PX_TO_M).toFixed(1);

  fill(255, 100, 0); 
  noStroke();
  textSize(12 / ZOOM);
  textAlign(CENTER, BOTTOM);
  text(`P(${pX_m}m, ${pY_m}m)`, pX, pY - 12 / ZOOM);

  if (checkDanger(pX, pY, center_x, center_y)) {
    fill(255, 50, 50);
    noStroke();
    textSize(14 / ZOOM);
    textAlign(CENTER, BOTTOM);
    text("⚠️ 危険領域内", pX, pY - 28 / ZOOM); 
  }

  fill(0, 0, 255);
  stroke(255);
  strokeWeight(2);
  circle(pX, pY, 20 / ZOOM); 
  pop();
  
  // 車両の描画
  if (driveState !== "FINISHED") {
    push();
    translate(carX, carY);
    rotate(carAngle);
    stroke(0);
    strokeWeight(2 / ZOOM);
    fill(200);
    rectMode(CORNERS);
    rect(rearOverhang, -halfWidth, frontOverhang, halfWidth);
    fill(150, 200, 255);
    rect(wheelbase - 25, -halfWidth+2, frontOverhang-5, halfWidth-2);
    fill(30);
    rectMode(CENTER);
    rect(0, -halfWidth, 16, 6);
    rect(0, halfWidth, 16, 6);
    push(); translate(wheelbase, -halfWidth); rotate(steering); rect(0, 0, 16, 6); pop();
    push(); translate(wheelbase, halfWidth); rotate(steering); rect(0, 0, 16, 6); pop();
    pop();
  }
  
  pop(); 
  
  // ▼ 操作方法の常時表示（目立たせるUI） ▼
  push();
  fill(255, 255, 255, 240); // 半透明の白背景
  stroke(220, 50, 50);      // 赤い枠線
  strokeWeight(2);
  rectMode(CORNER);
  rect(10, 10, 550, 42, 8); // 角丸の背景パネル
  
  fill(220, 50, 50);        // 赤い文字
  noStroke();
  textSize(18);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text("【操作】 スペースキー : 車の走行 ｜ 歩行者(青点) : ドラッグ", 20, 31);
  pop();
  // ▲ ここまで ▲
  
  fill(255, 240); stroke(100); strokeWeight(1); rectMode(CORNER);
  rect(580, 15, 200, 115, 5);
  fill(0); noStroke(); textSize(14); textAlign(LEFT, CENTER);
  text("■ 凡例（左折時）", 590, 35);
  stroke(50, 100, 255); strokeWeight(2); drawingContext.setLineDash([4, 4]);
  line(595, 60, 625, 60); noStroke(); text("前輪の軌跡", 635, 60);
  stroke(255, 50, 50); line(595, 85, 625, 85); noStroke(); text("後輪の軌跡", 635, 85);
  drawingContext.setLineDash([]);
  fill(255, 220, 150); stroke(100); strokeWeight(1);
  rect(595, 102, 30, 16); noStroke(); fill(0); text("車体の占有領域", 635, 110);
  
  updateUI();
}

function updateUI() {
  let W = halfWidth * 2;
  let R = wheelbase / Math.tan(peakSteer);
  let R_r_m = (R - (W / 2)) * PX_TO_M;
  let L_m = wheelbase * PX_TO_M;
  let R_f_m = Math.sqrt(Math.pow(R_r_m, 2) + Math.pow(L_m, 2)); 

  const diffElem = document.getElementById('inner-wheel-diff');
  let innerDiff = R_f_m - R_r_m;
  if (diffElem) {
    diffElem.innerHTML = `内輪差 (理論値): <span style="font-size: 18px; font-weight: bold;">${innerDiff.toFixed(2)}m</span>`;
  }

  if (uiNeedsUpdate) {
    const titleElem = document.getElementById('problem-title');
    const contentElem = document.getElementById('problem-content');
    const answerUIElem = document.getElementById('answer-ui-container');

    if (!titleElem || !contentElem || !answerUIElem) return;

    if (currentProblem === 1) {
      titleElem.innerText = "第1問：図形と方程式（領域の式）";
      
      if (!showExplanation) {
        contentElem.innerHTML = `
          <div style="padding: 12px; background-color: #f8f9fa; border-left: 5px solid #007bff; border-radius: 4px;">
            <strong style="color: #007bff; font-size: 15px;">【演習問題】</strong><br>
            シミュレータ上で車が旋回する際、前輪と後輪が描く軌跡の間の領域が「内輪差の危険領域」となる。<br>
            数学的なモデルとして、<strong>旋回中心を原点 $(0,0)$</strong> とし、車両が <strong>第1象限 ($x \\ge 0, y \\ge 0$)</strong> を走行していると仮定する。<br><br>
            このとき、後輪の軌跡を半径 $R_r$ の円、前輪の軌跡を半径 $R_f$ の円とした場合、危険領域（内側の円の外かつ外側の円の内）を表す連立不等式として正しいものを下から選べ。
          </div>
        `;
        answerUIElem.innerHTML = `
          <label style="font-size: 13px; font-weight: bold; color: #333;">回答を選択:</label>
          <div class="answer-input-group" style="flex-direction: column; align-items: stretch;">
            <label style="cursor: pointer; padding: 4px;"><input type="radio" name="q1-ans" value="1"> ① $x^2+y^2 < R_r^2$ かつ $x^2+y^2 > R_f^2$ かつ $x \\ge 0, y \\ge 0$</label>
            <label style="cursor: pointer; padding: 4px;"><input type="radio" name="q1-ans" value="2"> ② $x^2+y^2 \\ge R_r^2$ かつ $x^2+y^2 \\le R_f^2$ かつ $x \\ge 0, y \\ge 0$</label>
            <label style="cursor: pointer; padding: 4px;"><input type="radio" name="q1-ans" value="3"> ③ $x+y \\ge R_r$ かつ $x+y \\le R_f$ かつ $x \\ge 0, y \\ge 0$</label>
            <button type="button" class="btn-submit" onclick="submitAnswerQ1()" style="margin-top: 10px;">回答して解説を見る</button>
          </div>
        `;
      } else {
        let feedback = "";
        if (userAnswerQ1 === "2") {
          feedback = `<div style="padding: 8px 12px; background-color: #d4edda; color: #155724; border-radius: 4px; margin-bottom: 10px; font-weight: bold;">⭕ 正解です！</div>`;
        } else if (userAnswerQ1 !== "") {
          feedback = `<div style="padding: 8px 12px; background-color: #f8d7da; color: #721c24; border-radius: 4px; margin-bottom: 10px; font-weight: bold;">❌ 惜しい！</div>`;
        }

        contentElem.innerHTML = `
          ${feedback}
          <div style="padding: 8px 12px; background-color: #e8f5e9; border: 1px solid #4caf50; border-radius: 4px; margin-bottom: 10px;">
            <strong>【解答・解説】 正解は ②</strong><br>
            円 $(x-a)^2 + (y-b)^2 = r^2$ を境界とする領域において、<br>
            ・円の外部は $(x-a)^2 + (y-b)^2 > r^2$<br>
            ・円の内部は $(x-a)^2 + (y-b)^2 < r^2$<br>
            となります。<br><br>
            危険領域は、「半径 $R_r$ の円の外側」かつ「半径 $R_f$ の円の内側」にあるため、<br>
            $x^2+y^2 \\ge R_r^2$<br>
            $x^2+y^2 \\le R_f^2$<br>
            となります。また、第1象限に限定するため、$x \\ge 0, y \\ge 0$ の直線による境界条件（直線の右側・上側）が加わります。
          </div>
        `;
        answerUIElem.innerHTML = `
          <button type="button" class="btn-next" onclick="nextProblem()">次の問題（面積計算）へ進む ＞</button>
        `;
      }
    } 
    else if (currentProblem === 2) {
      titleElem.innerText = "第2問：内輪差面積の計算";

      let S1 = 0.5 * Math.pow(R_r_m, 2) - Math.PI * Math.pow(R_r_m, 2) * (45 / 360);
      let S2 = Math.PI * (Math.pow(R_f_m, 2) - Math.pow(R_r_m, 2)) * (45 / 360);
      let S3 = Math.PI * Math.pow(R_f_m, 2) * (45 / 360) - 0.5 * Math.pow(R_r_m, 2);
      let total_S = Math.PI * (Math.pow(R_f_m, 2) - Math.pow(R_r_m, 2)) * (90 / 360); 
      
      let r_r_disp = R_r_m.toFixed(2);
      let r_f_disp = R_f_m.toFixed(2);

      let S1_disp = S1.toFixed(2);
      let S2_disp = S2.toFixed(2);
      let S3_disp = S3.toFixed(2);
      let total_disp = total_S.toFixed(2);

      if (!showExplanation) {
        contentElem.innerHTML = `
          <div style="padding: 12px; background-color: #f8f9fa; border-left: 5px solid #007bff; border-radius: 4px;">
            <strong style="color: #007bff; font-size: 15px;">【演習問題】</strong><br>
            先ほど求めた領域の実際の面積 $S$ （シミュレータの前輪の軌跡と後輪の軌跡に挟まれた部分）を求めよ。<br><br>
            <strong>＜条件（現在の車両設定）＞</strong><br>
            ・前輪軌跡の半径 $R_f \\approx ${r_f_disp}\\,\\text{m}$、後輪軌跡の半径 $R_r = ${r_r_disp}\\,\\text{m}$ とする。<br>
            ・前輪が直線から曲線へ切り替わる角度を $\\alpha = 45^\\circ$ とする。<br><br>
            <strong>💡 ヒント</strong><br>
            領域全体を3つに分割して近似してみよう。（シミュレータ上に補助線のアウトラインを表示しています）
          </div>
        `;
        answerUIElem.innerHTML = `
          <label for="user-answer-q2" style="font-size: 13px; font-weight: bold; color: #333;">回答欄（面積 $S$ の値を入力）:</label>
          <div class="answer-input-group">
            <input type="number" id="user-answer-q2" step="0.01" placeholder="例: 15.00">
            <span style="font-size: 14px; font-weight: bold;">$\\text{m}^2$</span>
            <button type="button" class="btn-submit" onclick="submitAnswerQ2()">回答する</button>
          </div>
        `;
      } else {
        let feedbackHtml = "";
        let numAns = parseFloat(userAnswerQ2Text);
        if (!isNaN(numAns)) {
          let diff = Math.abs(numAns - total_S);
          if (diff <= 0.15) {
            feedbackHtml = `<div style="padding: 8px 12px; background-color: #d4edda; color: #155724; border-radius: 4px; margin-bottom: 10px;">⭕ 正解です！（回答: ${numAns} $\\text{m}^2$）</div>`;
          } else {
            feedbackHtml = `<div style="padding: 8px 12px; background-color: #f8d7da; color: #721c24; border-radius: 4px; margin-bottom: 10px;">❌ 惜しい！（回答: ${numAns} $\\text{m}^2$ / 正解: 約 ${total_disp} $\\text{m}^2$）</div>`;
          }
        }

        contentElem.innerHTML = `
          ${feedbackHtml}
          <div style="margin-bottom: 8px;">
            <strong>【解答・解説（3分割近似モデル）】</strong><br>
            <span style="font-size: 11px; color:#555;">※問題の条件より、直線と曲線の切り替わり角を $\\alpha=\\beta = 45^\\circ$ として計算します。</span>
          </div>
          <div style="padding: 8px; background-color: #e8f5e9; border-radius: 5px; margin-bottom: 8px; border-left: 4px solid #4caf50;">
            <strong>① 進入部（緑）: 直角二等辺三角形 $-$ 小扇形</strong><br>
            <span style="font-size: 11px; color:#555;">※曲がり始めの角度を45°に設定しているため、直角三角形の残りの角も45°になり、底辺と高さが等しい直角二等辺三角形となります。</span><br>
            $S_1 = \\frac{1}{2}R_r^2 - \\pi R_r^2 \\times \\frac{45}{360}$<br>
            $\\phantom{S_1} = \\frac{1}{2}(${r_r_disp})^2 - \\pi(${r_r_disp})^2 \\times \\frac{1}{8} \\approx \\mathbf{${S1_disp} \\, m^2}$
          </div>
          <div style="padding: 8px; background-color: #fce4ec; border-radius: 5px; margin-bottom: 8px; border-left: 4px solid #e91e63;">
            <strong>② 旋回部（ピンク）: 大扇形 $-$ 小扇形</strong><br>
            中心角 $\\gamma = 90^\\circ - 45^\\circ = 45^\\circ$<br>
            $S_2 = \\pi (R_f^2 - R_r^2) \\times \\frac{45}{360}$<br>
            $\\phantom{S_2} = \\pi ((${r_f_disp})^2 - (${r_r_disp})^2) \\times \\frac{1}{8} \\approx \\mathbf{${S2_disp} \\, m^2}$
          </div>
          <div style="padding: 8px; background-color: #e1f5fe; border-radius: 5px; margin-bottom: 8px; border-left: 4px solid #03a9f4;">
            <strong>③ 脱出部（水色）: 大扇形 $-$ 直角二等辺三角形</strong><br>
            $S_3 = \\pi R_f^2 \\times \\frac{45}{360} - \\frac{1}{2}R_r^2$<br>
            $\\phantom{S_3} = \\pi(${r_f_disp})^2 \\times \\frac{1}{8} - \\frac{1}{2}(${r_r_disp})^2 \\approx \\mathbf{${S3_disp} \\, m^2}$
          </div>
          <div style="padding: 10px; background-color: #fff3e0; border-radius: 5px; border: 1px solid #ffb74d;">
            <strong>【最終的な近似総面積】</strong><br>
            $S = S_1 + S_2 + S_3 = \\mathbf{${total_disp} \\, m^2}$<br>
            <span style="font-size: 11px; color:#555;">※計算上、$S_1$ と $S_3$ の直角二等辺三角形部分が相殺され、結果的に $S = \\pi (R_f^2 - R_r^2) \\times \\frac{90}{360}$ の公式と完全に一致します。</span>
          </div>
        `;
        answerUIElem.innerHTML = `
          <button type="button" class="btn-next" onclick="showOutroModal()" style="background-color: #6c757d;">まとめを見る</button>
        `;
      }
    }

    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([document.getElementById('problem-card')]).catch((err) => console.log(err));
    }
    
    uiNeedsUpdate = false;
  }
}

function mousePressed() {
  if (isModalOpen) return; 
  let logicalMx = mouseX / ZOOM - PAN_X;
  let logicalMy = mouseY / ZOOM - PAN_Y;
  
  let dP = dist(logicalMx, logicalMy, pX, pY);
  
  // マウスに一番近いものをドラッグ状態にする
  if (dP < 20 / ZOOM) {
    dragging = true;
  }
}

function mouseDragged() {
  if (isModalOpen) return; 
  if (dragging) { 
    pX = mouseX / ZOOM - PAN_X; 
    pY = mouseY / ZOOM - PAN_Y; 
  }
}

function mouseReleased() { 
  dragging = false;
}

function keyPressed() {
  if (isModalOpen) return;

  if (document.activeElement && document.activeElement.id === 'user-answer-q2') {
    if (keyCode === ENTER) submitAnswerQ2(); 
    return;
  }
  if (key === ' ') {
    if (driveState === "STOP" || driveState === "FINISHED") {
      resetSimulation();
      driveState = "DRIVING";
    }
  }
}

// 危険領域を判定する関数
function checkDanger(px, py, cx, cy) {
  let isDangerPolygon = false;
  for (let poly of carPolygonsTrail) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      let xi = poly[i].x, yi = poly[i].y;
      let xj = poly[j].x, yj = poly[j].y;
      let intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    if (inside) { isDangerPolygon = true; break; }
  }

  let isDangerTheory = false;
  let W_px_val = halfWidth * 2;
  let R_r_px_val = R_target - (W_px_val / 2);
  let R_fw_px_val = Math.sqrt(Math.pow(R_r_px_val, 2) + Math.pow(wheelbase, 2));
  let alpha_rad_val = Math.atan(wheelbase / R_r_px_val);
  let alpha_deg_val = alpha_rad_val * 180 / Math.PI;
  let beta_deg_val = alpha_deg_val;

  let dx = px - cx;
  let dy = cy - py;
  let r_pt = Math.sqrt(dx * dx + dy * dy);
  let theta_pt = Math.atan2(dy, dx);
  let deg_pt = theta_pt * 180 / Math.PI;

  if (deg_pt >= 0 && deg_pt <= alpha_deg_val) {
    let r_out = R_r_px_val / Math.cos(theta_pt);
    if (r_pt >= R_r_px_val && r_pt <= r_out) isDangerTheory = true;
  } else if (deg_pt > alpha_deg_val && deg_pt <= 90) {
    if (r_pt >= R_r_px_val && r_pt <= R_fw_px_val) isDangerTheory = true;
  } else if (deg_pt > 90 && deg_pt <= 90 + beta_deg_val) {
    let r_in = R_r_px_val / Math.sin(theta_pt);
    if (r_pt >= r_in && r_pt <= R_fw_px_val) isDangerTheory = true;
  }

  return isDangerPolygon || isDangerTheory;
}

// 同じ長さマーク（赤い2本斜線）を描画する関数
function drawEqualLengthMark(x, y) {
  push();
  translate(x, y);
  rotate(-PI / 4); // 斜めに傾ける
  stroke(255, 0, 0); // より濃く鮮やかな赤色に変更
  strokeWeight(2.5 / ZOOM); // 線をより太く変更
  let gap = 3.5 / ZOOM; // 2本の線の間隔を広げる
  let len = 8 / ZOOM; // 線の長さをより長く変更
  line(-gap, -len, -gap, len); // 1本目
  line(gap, -len, gap, len);   // 2本目
  pop();
}
