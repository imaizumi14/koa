FrameRate = 30
CanvasWidth = 504
CanvasHeight = 168
Xmin = 0
Xmax = 504
Ymin = -39
Ymax = 129
KirbySize = 24
KirbySpriteCountX = 6
KirbySpriteCountY = 3
KirbyPosOffsetX = 48
KirbyVelX = 2.5
KirbyVelYmax = 8
KirbyVelYmin = -6
KirbyPosYmin = 0
KirbyVelYmaxDead = 5.4
KirbyVelYminDead = -10
KirbyPosYminDead = -140
KirbySquatTime = 7
GravityY = -0.45
GravityHoverRate = 0.05
GravityDeadRate = 0.8
EnemySize = 16
EnemyPosYmin = 0
EnemyPosYmax = 96
EnemyGenerateCounterInc = 0.0003
EnemySpeedMax = 2
StarSize = 8
StarInitialSpeed = 11
StarSpeedDec = 2.3
StarInitialLifeTime = 10
DeadStarInitialLifeTime = 7
BigStarSize = 16
BigStarInitialSpeed = 14
BigStarSpeedDec = 1.4
BigStarSpeedMin = 1
HalScore = 86
ScoreMax = 999
ScreenShakeValue = 2
GameOverWaitTime = 30
SinCos45 = 0.7071
Epsilon = 0.0001

IsDebugMode = false

let kirbyImg
let enemyImg
let starImg
let bgImg
let numberImg

let kirbyPosX
let kirbyPosY
let kirbyVelY
let kirbyAnimIndex
let kirbyAnimUpdateCounter
let isInputActive
let isStart
let isAir
let isHover
let isHoverCancel
let isSquat
let isDead
let isStartDeadAnimation
let deadAnimationStartCounter
let enemyInfoList // [x, y, v, isPoint, isCollide, isHal, animCount]
let lastEnemyGeneratePosX
let lastEnemyGeneratePosY
let enemyGenerateCounter
let enemyTotal
let enemyGenerateBanXmax
let starInfoList // [x, y, speed, xd, yd, lifeTime]
let lastGenerateStarDirection
let generateDeadStarCounter
let bigStarInfoList // [x, y, speed, xd, yd]
let bigStarAnimUpdateCounter
let score
let screenShakeOffsetX
let screenShakeOffsetY
let screenShakeCounter
let isGameOver
let gameOverCounter

function preload() {
  kirbyImg = loadImage('img/kirby.png')
  enemyImg = loadImage('img/enemy.png')
  starImg = loadImage('img/star.png')
  bgImg = loadImage('img/bg.png')
  numberImg = loadImage('img/number.png')
}

function setup() {
  frameRate(FrameRate)
  createCanvas(CanvasWidth, CanvasHeight).parent(document.getElementById('p5pos'))
  initializeParam()
}

function draw() {
  update()
  drawImpl()
  cleanInput()
}

function keyPressed() {
  // 'Enter' or 'space' or 'j'
  if (keyCode == 13 || keyCode === 32 || keyCode === 74) {
    if (!isStart) {
      isStart = true
    } else { 
      isInputActive = true
    }
  }
}

function isInCanvas() {
  return 0 < mouseX && mouseX < CanvasWidth && 0 < mouseY && mouseY < CanvasHeight
}

function mousePressed() { 
  if (!isStart && isInCanvas()) {
    isStart = true
    return
  }

  if (!isStart) {
    return
  }

  isInputActive = true
}


function touchStarted() {
  if (!isStart && isInCanvas()) {
    isStart = true
    return
  }

  if (!isStart) {
    return
  }

  isInputActive = true
}

function initializeParam() {
  kirbyPosX = 48
  kirbyPosY = 0
  kirbyVelY = 0
  kirbyAnimIndex = 0
  kirbyAnimUpdateCounter = 0
  isInputActive = false
  isStart = false
  isAir = false
  isHover = false
  isHoverCancel = false
  isSquat = false
  isDead = false
  isStartDeadAnimation = false
  deadAnimationStartCounter = 0
  enemyInfoList = []
  lastEnemyGeneratePosX = -1e12
  lastEnemyGeneratePosY = -1e12
  enemyGenerateCounter = 0
  enemyTotal = 0
  enemyGenerateBanXmax = 0
  starInfoList = []
  lastGenerateStarDirection = -1
  generateDeadStarCounter = 0
  bigStarInfoList = []
  bigStarAnimUpdateCounter = 0
  score = 0
  screenShakeOffsetX = 0
  screenShakeOffsetY = 0
  screenShakeCounter = 0
  isGameOver = false
  gameOverCounter = 0
}

function update() {
  updateKirby()
  updateEnemy()
  updateCollision()
  updateStar()
  updateSystem()
}

function updateKirby() {
  if (isGameOver) {
    return
  }

  if (isDead) {
    updateKirbyActionDead()
  }
  else {
    updateKirbyActionNormal()
  }

  kirbyAnimUpdateCounter++
  if (!isStart) {
    if ((30 < kirbyAnimUpdateCounter && kirbyAnimUpdateCounter < 33) ||
      (36 < kirbyAnimUpdateCounter && kirbyAnimUpdateCounter < 39))
    {
      kirbyAnimIndex = 23
    } else {
      kirbyAnimIndex = 22
    }
    if (kirbyAnimUpdateCounter > 47) {
      kirbyAnimUpdateCounter = 0
    }
  } else if (isDead) {
    if (isStartDeadAnimation) {
      if (kirbyAnimUpdateCounter < 7) {
        kirbyAnimIndex = 18
      } else if (kirbyAnimUpdateCounter < 13) {
        kirbyAnimIndex = 19
      } else if (kirbyAnimUpdateCounter < 19) {
        kirbyAnimIndex = 20
      } else {
        kirbyAnimIndex = 21
      }
      if (kirbyAnimUpdateCounter > 23) {
        kirbyAnimUpdateCounter = 0
      }

      generateDeadStarCounter++
      if (generateDeadStarCounter >= 5) {
        generateDeadStarCounter = 0
        generateStar()
      }
    } else {
      kirbyAnimIndex = 18
    }
  } else if (isSquat) {
    kirbyAnimIndex = 4
    kirbyAnimUpdateCounter++
    if (kirbyAnimUpdateCounter > KirbySquatTime) {
      kirbyAnimUpdateCounter = 0
      isSquat = false
    }
  } else if (isHoverCancel) {
    if (kirbyAnimUpdateCounter < 3) {
      kirbyAnimIndex = 15
    } else if (kirbyAnimUpdateCounter < 5) {
      kirbyAnimIndex = 14
    } else if (kirbyAnimUpdateCounter < 7) {
      kirbyAnimIndex = 13
    } else if (kirbyAnimUpdateCounter < 9) {        
      kirbyAnimIndex = 12
    }

    if (kirbyAnimUpdateCounter > 7) {        
      isHoverCancel = false
      kirbyAnimUpdateCounter = 0
    }
  } else {
    if (kirbyPosY <= 0) {
      // 地面
      if (kirbyAnimUpdateCounter < 4) {
        kirbyAnimIndex = 0
      } else if (kirbyAnimUpdateCounter < 7) {
        kirbyAnimIndex = 1
      } else if (kirbyAnimUpdateCounter < 10) {
        kirbyAnimIndex = 2
      } else {
        kirbyAnimIndex = 3
      }
  
      if (kirbyAnimUpdateCounter > 11) {
        kirbyAnimUpdateCounter = 0
      }
    } else {
      // 空中
      if (isHover) {
        if (kirbyAnimUpdateCounter < 3) {
          kirbyAnimIndex = 12
        } else if (kirbyAnimUpdateCounter < 5) {
          kirbyAnimIndex = 13
        } else if (kirbyAnimUpdateCounter < 7) {
          kirbyAnimIndex = 14
        } else if (kirbyAnimUpdateCounter < 9) {        
          kirbyAnimIndex = 15
        } else if (kirbyAnimUpdateCounter < 17) {
          kirbyAnimIndex = 16
        } else {
          kirbyAnimIndex = 17
        }
  
        if (kirbyAnimUpdateCounter > 23) {
          kirbyAnimUpdateCounter = 8
        }
      } else {
        if (kirbyVelY >= 0) {
          // 上昇      
          kirbyAnimIndex = 6
        } else {
          // 下降
          if (kirbyAnimIndex == 6) {
            kirbyAnimUpdateCounter = 0
          } else if (kirbyAnimIndex >= 12) {
            kirbyAnimUpdateCounter = 10
          }
  
          if (kirbyAnimUpdateCounter < 2) {
            kirbyAnimIndex = 7
          } else if (kirbyAnimUpdateCounter < 4) {
            kirbyAnimIndex = 8
          } else if (kirbyAnimUpdateCounter < 6) {
            kirbyAnimIndex = 9
          } else {        
            kirbyAnimIndex = 10
          }
        }
      }
    }
  }
}

function updateKirbyActionNormal() {
  if (!isStart) {
    return
  }

  if (isInputActive && !isHoverCancel) {
    kirbyAnimUpdateCounter = 0
    if (kirbyPosY <= KirbyPosYmin + Epsilon) {
      kirbyVelY = KirbyVelYmax
      isAir = true
      isSquat = false
    } else {
      isHover = !isHover
      if (isHover) {
        kirbyVelY = 0
      } else {
        isHoverCancel = true
      }
    }
  }
 
  g = GravityY
  if (isHover) {
    g *= GravityHoverRate
  }
  kirbyVelY = Math.max(kirbyVelY + g, KirbyVelYmin)

  kirbyPosX += KirbyVelX
  kirbyPosY = Math.max(kirbyPosY + kirbyVelY, KirbyPosYmin) 

  if (kirbyPosY <= KirbyPosYmin + Epsilon) {
    if (isHover) {
      kirbyAnimUpdateCounter = 0
      isAir = false
      isHover = false
      isHoverCancel = true
    } else if (isAir) {
      isAir = false
      if (kirbyVelY <= KirbyVelYmin + Epsilon) {
        isSquat = true
        generateStar()
        kirbyAnimUpdateCounter = 0
      }
    }
  }
}

function updateKirbyActionDead() {
  if (!isStart) {
    return
  }

  if (isStartDeadAnimation) {
    kirbyVelY = Math.max(kirbyVelY + (GravityY * GravityDeadRate), KirbyVelYminDead)
    kirbyPosY = Math.max(kirbyPosY + kirbyVelY, KirbyPosYminDead)
  } else {
    deadAnimationStartCounter++
    if (deadAnimationStartCounter > 20) {
      isStartDeadAnimation = true
      kirbyAnimUpdateCounter = 0
      kirbyVelY = KirbyVelYmaxDead
      
      // generate big star
      bigStarInfoList.push([kirbyPosX + 12, kirbyPosY + 8, BigStarInitialSpeed, -SinCos45, SinCos45])
      bigStarInfoList.push([kirbyPosX + 12, kirbyPosY + 8, BigStarInitialSpeed, 0, 1])
      bigStarInfoList.push([kirbyPosX + 12, kirbyPosY + 8, BigStarInitialSpeed, SinCos45, SinCos45])
      bigStarInfoList.push([kirbyPosX + 12, kirbyPosY + 8, BigStarInitialSpeed, 1, 0])
      bigStarInfoList.push([kirbyPosX + 12, kirbyPosY + 8, BigStarInitialSpeed, SinCos45, -SinCos45])
      bigStarInfoList.push([kirbyPosX + 12, kirbyPosY + 8, BigStarInitialSpeed, 0, -1])
      bigStarInfoList.push([kirbyPosX + 12, kirbyPosY + 8, BigStarInitialSpeed, -SinCos45, -SinCos45])
      bigStarInfoList.push([kirbyPosX + 12, kirbyPosY + 8, BigStarInitialSpeed, -1, 0])
      bigStarAnimUpdateCounter = 0
    }
  }

  if (kirbyPosY < KirbyPosYminDead + 1) {
    startScreenShake()
    starInfoList = []
    isGameOver = true
  }
}

function updateEnemy() {
  if (!isStart || isDead) {
    return
  }

  if (enemyTotal == HalScore) {
    // H
    x = kirbyPosX + (2 * CanvasWidth)
    y = EnemyPosYmax
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    x += EnemySize + 1
    y = EnemyPosYmax - (2 * (EnemySize + 1))
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    x += EnemySize + 1
    y = EnemyPosYmax
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    // A
    x += 2 * (EnemySize + 1)
    y = EnemyPosYmax - EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    x += EnemySize + 1
    y = EnemyPosYmax
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= 2 * (EnemySize + 1)
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    x += EnemySize + 1
    y = EnemyPosYmax - EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    // L
    x += 2 * (EnemySize + 1)
    y = EnemyPosYmax
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    y -= EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    x += EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    x += EnemySize + 1
    enemyInfoList.push([x, y, 0, false, false, true, 0])
    enemyGenerateBanXmax = x + CanvasWidth
    enemyTotal++
  } else {
    enemyGenerateCounter += EnemyGenerateCounterInc
    enemyGenerateCounter += 1 / HalScore * score * score * EnemyGenerateCounterInc
    if (enemyGenerateCounter > random()) {
      x = kirbyPosX + CanvasWidth
      y = random(EnemyPosYmin, EnemyPosYmax)
      if (Math.abs(x - lastEnemyGeneratePosX) > EnemySize + 1 &&
        Math.abs(y - lastEnemyGeneratePosY) > EnemySize + 1 &&
        x > enemyGenerateBanXmax)
      {
        v = random(-EnemySpeedMax, EnemySpeedMax)
        enemyInfoList.push([x, y, v, false, false, false, 0])
        lastEnemyGeneratePosX = x
        lastEnemyGeneratePosY = y
        enemyGenerateCounter = 0
        enemyTotal++
      }
    }
  }

  enemyInfoList = enemyInfoList.filter(info => info[0] > kirbyPosX - (2 * KirbyPosOffsetX))

  enemyInfoList.forEach(info => {
    info[1] += info[2]
    if (info[1] < EnemyPosYmin) {
      info[1] = EnemyPosYmin
      info[2] *= -1
    } else if (info[1] > EnemyPosYmax) {
      info[1] = EnemyPosYmax
      info[2] *= -1
    }

    if (!info[3] && !info[5] && info[0] + EnemySize < kirbyPosX) {
      info[3] = true
      score = Math.min(score + 1, ScoreMax)
    }

    if (info[6] > 35) {
      info[6] = 0
    }
    info[6]++
  })
}

function isCollide(x, y) {
  kr = 7
  if (isSquat) {
    kr = 4
  } else if (kirbyAnimIndex == 16 || kirbyAnimIndex == 17) {
    kr = 10
  }
  kcx = kirbyPosX + 12
  kcy = kirbyPosY + kr
  ecx = x + (EnemySize / 2)
  ecy = y + (EnemySize / 2)
  d = ((kcx - ecx) ** 2) + ((kcy - ecy) ** 2)
  return d < (kr + (EnemySize / 2)) ** 2
}

function updateCollision() {
  if (isDead) {
    return
  }

  if (enemyInfoList.some(info => isCollide(info[0], info[1]))) {
    startScreenShake()
    isDead = true
    starInfoList = []
    kirbyAnimUpdateCounter = 0
  }
}

function generateStar() {
  directionNumber = 0
  xd = 0
  yd = 0
  for (;;) {
    directionNumber = random([0, 1, 2, 3, 4, 5, 6, 7])
    if (directionNumber != lastGenerateStarDirection) {
      lastGenerateStarDirection = directionNumber
      break
    }
  }

  switch (directionNumber) {
    case 0:
      xd = -SinCos45
      yd = SinCos45
      break
    case 1:
      xd = 0
      yd = 1
      break
    case 2:
      xd = SinCos45
      yd = SinCos45
      break
    case 3:
      xd = 1
      yd = 0
      break
    case 4:
      xd = SinCos45
      yd = -SinCos45
      break
    case 5:
      xd = 0
      yd = -1
      break
    case 6:
      xd = -SinCos45
      yd = -SinCos45
      break
    case 7:
      xd = -1
      yd = 0
      break
  }

  starInfoList.push([kirbyPosX + 12, kirbyPosY + 6, StarInitialSpeed, xd, yd, isDead ? DeadStarInitialLifeTime : StarInitialLifeTime])
}

function updateStar() {
  if (isGameOver) {
    return
  }

  starInfoList.forEach(info => {
    info[2] = Math.max(info[2] - StarSpeedDec, 0)
    info[0] += info[2] * info[3]
    info[1] += info[2] * info[4]
    info[5]--
  })
  starInfoList = starInfoList.filter(info => info[5] > 0)

  bigStarAnimUpdateCounter++
  bigStarInfoList.forEach(info => {
    info[2] = Math.max(info[2] - BigStarSpeedDec, BigStarSpeedMin)
    info[0] += info[2] * info[3]
    info[1] += info[2] * info[4]
  })
}

function startScreenShake() {
  if (screenShakeCounter <= 0) { 
    screenShakeCounter = 8
  }
}

function updateSystem() {
  // カーソル
  if (isInCanvas() && !isStart) {
    cursor('pointer')
  } else {
    cursor('default')
  }

  // 画面揺れ
  switch (screenShakeCounter) {
    case 8:
    case 4:
      screenShakeOffsetX = -ScreenShakeValue
      screenShakeOffsetY = ScreenShakeValue
      break
    case 7:
    case 3:
      screenShakeOffsetX = ScreenShakeValue
      screenShakeOffsetY = -ScreenShakeValue
      break
    case 6:
    case 2:
      screenShakeOffsetX = -ScreenShakeValue
      screenShakeOffsetY = -ScreenShakeValue
      break
    case 5:
    case 1:
      screenShakeOffsetX = ScreenShakeValue
      screenShakeOffsetY = ScreenShakeValue
      break
    default:
      screenShakeOffsetX = 0
      screenShakeOffsetY = 0
      break
  }
  screenShakeCounter = Math.max(screenShakeCounter - 1 , 0)

  // ゲームオーバー
  if (isGameOver) {
    gameOverCounter++
    if (gameOverCounter > GameOverWaitTime) {
      playerName = prompt(`スコア：${score}\nプレイヤー名を入力してください：`, "Kirby")
      if (playerName != null) {   
        console.log(`${score}, ${playerName}`)
      }
      if (score >= HalScore) {
        alert("スコア 86 到達！！\nおめでとう！！")
      }
      initializeParam()
    }
  }
}

function drawImpl() {
  clear()
  drawBackground()
  drawEnemy()
  drawStar()
  drawKirby()
  drawInfo()
  drawBlankFrame()
}

function drawKirby() {
  drawImage(kirbyImg, kirbyPosX, kirbyPosY, KirbySize, KirbySize,
    (kirbyAnimIndex % KirbySpriteCountX) * (KirbySize + 1), (Math.floor(kirbyAnimIndex / KirbySpriteCountX) * (KirbySize + 1)) + 1)
}

function drawStar() {
  starInfoList.forEach(info => {
    drawImage(starImg, info[0] - (StarSize / 2), info[1] - (StarSize / 2), 8, 8, 0, 17)
  })

  offsetX = Math.floor((bigStarAnimUpdateCounter - 1) / 3) * 17
  bigStarInfoList.forEach(info => {
    drawImage(starImg, info[0] - (BigStarSize / 2), info[1] - (BigStarSize / 2), 16, 16, offsetX, 0) 
  })

  if (bigStarAnimUpdateCounter > 11) {
    bigStarAnimUpdateCounter = 0
  }
}

function drawEnemy() {
  enemyInfoList.forEach(info => {
    if (info[4] || (!isStartDeadAnimation && isCollide(info[0], info[1]))) {
      info[4] = true
      offset = 35
      if (info[6] > 18) {
        offset += 17
      }
      drawImage(enemyImg, info[0], info[1], EnemySize, EnemySize, offset, 1)
    } else {
      offset = 1
      if (info[6] > 18) {
        offset += 17
      }
      drawImage(enemyImg, info[0], info[1], EnemySize, EnemySize, offset, 1)
    }
  })
}

function drawBackground() {
  drawImage(bgImg, 0, Ymin, 776, 168, 0, 0)
  offset = (Math.floor((kirbyPosX - KirbyPosOffsetX -  776) / 256) * 256) + 776
  for (i = 0; i < 17; ++i) {
    x = offset + 256 * i
    if (x < 776) {
      continue
    }
    drawImage(bgImg, x, Ymin, 256, 168, 520, 0)
  }
}

function drawBlankFrame() {
  noStroke()
  fill(255)
  if (screenShakeOffsetY < 0) {
    rect(0, 0, CanvasWidth, -screenShakeOffsetY)
  } else if (screenShakeOffsetY > 0) {
    rect(0, CanvasHeight - screenShakeOffsetY, CanvasWidth, screenShakeOffsetY)
  }
  if (screenShakeOffsetX > 0) {
    rect(0, 0, screenShakeOffsetX, CanvasHeight)
  } else if (screenShakeOffsetX < 0) {
    rect(CanvasWidth + screenShakeOffsetX, 0, -screenShakeOffsetX, CanvasHeight)
  }
}

function drawInfo() {
  x = 8
  y = 8
  sizeX = 7
  sizeY = 8
  offsetY = 1
  numberSize = 8
  third = Math.floor(score / 100)
  offsetX = 1 + (numberSize * third)
  image(numberImg, x, y, sizeX, sizeY, offsetX, offsetY, sizeX, sizeY)
  x += 9
  second = Math.floor(score / 10) % 10
  offsetX = 1 + (numberSize * second)
  image(numberImg, x, y, sizeX, sizeY, offsetX, offsetY, sizeX, sizeY)
  x += 9
  first = score % 10
  offsetX = 1 + (numberSize * first)
  image(numberImg, x, y, sizeX, sizeY, offsetX, offsetY, sizeX, sizeY)

  if (IsDebugMode) {
    kr = 7
    if (isSquat) {
      kr = 4
    } else if (kirbyAnimIndex == 16 || kirbyAnimIndex == 17) {
      kr = 10
    }
    kcx = kirbyPosX + 12
    kcy = kirbyPosY + kr
    drawEllipse(kcx - kr, kcy - kr, 2 * kr, 2 * kr, 0, 0, 255, 100)
    enemyInfoList.forEach(info => {
      drawEllipse(info[0], info[1], EnemySize, EnemySize, 255, 0, 0, 100)
    })
  }
}

function drawImage(targetImg, x, y, sizeX, sizeY, offsetX, offsetY) {
  image(targetImg, Math.round(x - kirbyPosX + KirbyPosOffsetX + screenShakeOffsetX), Math.round(Ymax - y - sizeY - screenShakeOffsetY),
    sizeX, sizeY, offsetX, offsetY, sizeX, sizeY)
}

function drawRect(x, y, w, h, r, g, b, a) {
  noStroke()
  fill(r, g, b, a)
  rect(x - kirbyPosX + KirbyPosOffsetX + screenShakeOffsetX,
    Ymax - y - h - screenShakeOffsetY, w, h)
}

function drawEllipse(x, y, w, h, r, g, b, a) {
  noStroke()
  fill(r, g, b, a)
  ellipse(x - kirbyPosX + KirbyPosOffsetX + (w / 2) + screenShakeOffsetX,
    Ymax - y - h + (h / 2) - screenShakeOffsetY, w, h)
}

function cleanInput() {
  isInputActive = false
}
