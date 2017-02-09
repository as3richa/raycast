(function() {
  "use strict";

  var fadingIn = 1;
  var fadingOut = 2;
  var seeking = 3;

  var fadeLength = 500;
  var rotationSpeed = 3e-3;
  var translationSpeed = 3e-3;

  var floorColor = "#aaaaaa";
  var ceilingColor = "#ffffff";
  var brickColor = "#a43547";
  var mortarColor = "#eeeeee";
  var fovColor = "rgba(255, 192, 0, 0.5)";

  var initialDirection = new Vector(0, 1);

  var brickTexture = (function() {
    var size = 400;
    var mortarThickness = 5;
    var stackHeight = 4;

    var brickHeight = (size - mortarThickness * (stackHeight - 1)) / stackHeight;
    var shortBrickLength = (size - mortarThickness) * 1 / 3;
    var longBrickLength = 2 * shortBrickLength;

    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");

    canvas.width = canvas.height = size;

    context.translate(0.5, 0.5);

    context.fillStyle = mortarColor;
    context.fillRect(0, 0, size, size);

    context.fillStyle = brickColor;

    for(var i = 0, y = 0; i < stackHeight; i ++)
    {
      if(i % 2 == 0) {
        context.fillRect(0, y, longBrickLength, brickHeight);
        context.fillRect(longBrickLength + mortarThickness, y, shortBrickLength, brickHeight);
      } else {
        context.fillRect(0, y, shortBrickLength, brickHeight);
        context.fillRect(shortBrickLength + mortarThickness, y, longBrickLength, brickHeight);
      }
      y += brickHeight + mortarThickness;
    }

    return canvas;
  })();

  function cast(map, position, direction) {
    var mapX = Math.floor(position.x);
    var mapY = Math.floor(position.y);

    var deltaDistX = Math.sqrt(1 + Math.pow(direction.y / direction.x, 2));
    var deltaDistY = Math.sqrt(1 + Math.pow(direction.x / direction.y, 2));

    var stepX = (direction.x < 0) ? -1 : 1;
    var stepY = (direction.y < 0) ? -1 : 1;

    var sideDistX = (direction.x < 0) ?
      (position.x - mapX) * deltaDistX :
      (mapX + 1 - position.x) * deltaDistX;

    var sideDistY = (direction.y < 0) ?
      (position.y - mapY) * deltaDistY :
      (mapY + 1 - position.y) * deltaDistY;

    var northSouth = false;
    var hit = false;

    while(true) {
      if(sideDistX < sideDistY) {
        sideDistX += deltaDistX;
        mapX += stepX;
        northSouth = true;
      } else {
        sideDistY += deltaDistY;
        mapY += stepY;
        northSouth = false;
      }

      if(mapX < 0 || mapY < 0 || mapX >= map.width || mapY >= map.height) {
        break;
      } else if(map.grid[mapX][mapY]) {
        hit = true;
        break;
      }
    }

    var distance = null;
    var textureX = null;
    if(hit) {
      if(northSouth) {
        distance = (mapX - position.x + (1 - stepX) / 2) / direction.x;
        textureX = position.y + distance * direction.y;
      } else {
        distance = (mapY - position.y + (1 - stepY) / 2) / direction.y;
        textureX = position.x + distance * direction.x;
      }
    }

    textureX %= 1;

    return [hit, distance, textureX, northSouth];
  }

  var Engine = function() {
    this.initialize()
  };

  Engine.prototype.initialize = function() {
    this.state = fadingIn;
    this.startTime = Date.now();

    this.map = new RandomMazeMap(21, 21);
    this.mapTexture = this.map.minimapTexture();
    this.dfsPlan = this.map.dfsPlan();
    this.position = new Vector(this.map.source.x + 0.5, this.map.source.y + 0.5);
    this.direction = initialDirection;
  };

  Engine.prototype.renderMinimap = function (viewportWidth, viewportHeight, plane) {
    var size = Math.max(Math.floor(viewportWidth / 4), Math.floor(viewportHeight / 3));

    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");

    canvas.width = canvas.height = size;

    var unitSize = size / this.map.width;

    context.drawImage(this.mapTexture, 0, 0, size, size);

    var px = this.position.x * unitSize;
    var py = canvas.height - this.position.y * unitSize;

    context.fillStyle = "red";
    context.beginPath();
    context.arc(px, py, unitSize, 0, 2 * Math.PI);
    context.fill();

    var ray = new Vector(this.direction.x, this.direction.y);
    ray.x += plane.x;
    ray.y += plane.y;
    var fovAngleA = ray.angle() * -1;

    ray.x -= 2 * plane.x;
    ray.y -= 2 * plane.y;
    var fovAngleB = ray.angle() * -1;

    var fovRadius = size / 5;

    context.fillStyle = fovColor;
    context.beginPath();
    context.arc(px, py, fovRadius, fovAngleB, fovAngleA);
    context.moveTo(px, py);
    context.lineTo(px + fovRadius * Math.cos(fovAngleA), py + fovRadius * Math.sin(fovAngleA));
    context.lineTo(px + fovRadius * Math.cos(fovAngleB), py + fovRadius * Math.sin(fovAngleB));
    context.lineTo(px, py);
    context.fill();

    return canvas;
  }

  Engine.prototype.render = function(canvas, context) {
    var width = canvas.width;
    var height = canvas.height;

    var magnitude = (width / height) / 2;
    var plane = new Vector(magnitude, 0);
    plane = plane.rotate(this.direction.angle() - Math.PI / 2);

    context.fillStyle = ceilingColor;
    context.fillRect(0, 0, width, height / 2);

    context.fillStyle = floorColor;
    context.fillRect(0, height / 2, width, height);

    for(var x = 0; x < width; x ++) {
      var cameraPlaneX = 2 * x / (width - 1) - 1;
      var rayDirection = new Vector(
        this.direction.x + plane.x * cameraPlaneX,
        this.direction.y + plane.y * cameraPlaneX);

      var result = cast(this.map, this.position, rayDirection);
      var hit = result[0], distance = result[1], textureX = result[2], northSouth = result[3];

      if(hit) {
        var wallHeight = height / distance;
        context.drawImage(brickTexture,
          brickTexture.width * textureX, 0, 1, brickTexture.height,
          x, (height - wallHeight) / 2, 1, wallHeight);

        if(!northSouth) {
          context.fillStyle = "rgba(0, 0, 0, 0.2)";
          context.fillRect(x, (height - wallHeight) / 2, 1, wallHeight);
        }
      }
    }

    var minimapTexture = this.renderMinimap(width, height, plane);

    context.globalAlpha = 0.8;
    context.drawImage(minimapTexture, width - minimapTexture.width * 1.1, minimapTexture.height * 0.1);
    context.globalAlpha = 1;

    if(this.state === fadingIn) {
      context.fillStyle = "rgba(0, 0, 0, " + (1 - Math.min(1, (Date.now() - this.startTime) / fadeLength)) + ")";
      context.fillRect(0, 0, width, height);
    } else if(this.state === fadingOut) {
      context.fillStyle = "rgba(0, 0, 0, " + Math.min(1, (Date.now() - this.startTime) / fadeLength) + ")";
      context.fillRect(0, 0, width, height);
    }
  };

  Engine.prototype.tick = function() {
    var now = Date.now();
    var delta = now - this.startTime;

    var maxTranslation = translationSpeed * delta;
    var maxRotation = rotationSpeed * delta;

    switch(this.state) {
      case fadingIn:
        if(now >= this.startTime + fadeLength) {
          this.state = seeking;
          this.startTime = now;
        }
        break;

      case fadingOut:
        if(now >= this.startTime + fadeLength) {
          this.initialize();
        }
        break;

      case seeking:
        var goalPoint;
        while(this.dfsPlan.length > 0) {
          goalPoint = {x: this.dfsPlan[0].x + 0.5, y: this.dfsPlan[0].y + 0.5};
          if(Math.abs(this.position.x - goalPoint.x) > 1e-5 || Math.abs(this.position.y - goalPoint.y) > 1e-5) {
            break;
          }
          this.dfsPlan.shift();
        }

        if(this.dfsPlan.length === 0) {
          this.state = fadingOut;
          this.startTime = now;
          break;
        }

        var currentBearing = this.direction.angle();
        var requiredBearing = Math.atan2(goalPoint.y - this.position.y, goalPoint.x - this.position.x);

        var clockwiseDistance;
        var counterClockwiseDistance;

        if(currentBearing > requiredBearing) {
          clockwiseDistance = currentBearing - requiredBearing;
          counterClockwiseDistance = 2 * Math.PI - currentBearing + requiredBearing;
        } else {
          clockwiseDistance = currentBearing + 2 * Math.PI - requiredBearing;
          counterClockwiseDistance = requiredBearing - currentBearing;
        }

        if(Math.min(clockwiseDistance, counterClockwiseDistance) > 1e-5) {
          if(clockwiseDistance < counterClockwiseDistance) {
            this.direction = this.direction.rotate(-1 * Math.min(clockwiseDistance, maxRotation));
          } else {
            this.direction = this.direction.rotate(Math.min(counterClockwiseDistance, maxRotation));
          }
        } else {
          var translation;

          if(Math.abs(this.position.x - goalPoint.x) > 1e-5) {
            if(goalPoint.x > this.position.x) {
              translation = new Vector(Math.min(goalPoint.x - this.position.x, maxTranslation), 0);
            } else {
              translation = new Vector(Math.max(goalPoint.x - this.position.x, -1 * maxTranslation), 0);
            }
          } else {
            if(goalPoint.y > this.position.y) {
              translation = new Vector(0, Math.min(goalPoint.y - this.position.y, maxTranslation));
            } else {
              translation = new Vector(0, Math.max(goalPoint.y - this.position.y, -1 * maxTranslation));
            }
          }

          this.position = this.position.add(translation);
        }

        this.startTime = now;
        break;
    }
  };

  window.Engine = Engine;
})();
