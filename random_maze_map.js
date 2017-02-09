(function() {
  "use strict";

  function v(x, y) {
    return {x: x, y: y};
  }

  var adj = [
    v(1, 0),
    v(0, 1),
    v(-1, 0),
    v(0, -1)
  ];

  function RandomMazeMap(width, height) {
    this.texture = null;

    if(width % 2 == 0) {
      width ++;
    }

    if(height % 2 == 0) {
      height ++;
    }

    this.width = width;
    this.height = height;

    this.grid = [];
    var mark = [];
    for(var x = 0; x < width; x ++)
    {
      var column = [];
      var markColumn = [];
      for(var row = 0; row < height; row ++)
      {
        column.push(true);
        markColumn.push(false);
      }
      this.grid.push(column);
      mark.push(markColumn);
    }

    this.source = v(1, 1);
    this.sink = v(width - 2, height - 2);

    this.grid[this.source.x][this.source.y] = false;

    var candidateWalls = [
      v(this.source.x + 1, this.source.y),
      v(this.source.x, this.source.y + 1)
    ];

    mark[this.source.x][this.source.y] = true;
    mark[this.source.x + 1][this.source.y] = true;
    mark[this.source.x][this.source.y + 1] = true;

    while(candidateWalls.length > 0) {
      var index = Math.floor(Math.random() * candidateWalls.length);
      var wall = candidateWalls[index];
      candidateWalls.splice(index, 1);

      var unvisitedCell = null;

      if(wall.x % 2 == 0) {
        if(!mark[wall.x - 1][wall.y]) {
          unvisitedCell = v(wall.x - 1, wall.y);
        } else if(!mark[wall.x + 1][wall.y]) {
          unvisitedCell = v(wall.x + 1, wall.y);
        }
      } else {
        if(!mark[wall.x][wall.y - 1]) {
          unvisitedCell = v(wall.x, wall.y - 1);
        } else if(!mark[wall.x][wall.y + 1]) {
          unvisitedCell = v(wall.x, wall.y + 1);
        }
      }

      if(unvisitedCell != null) {
        this.grid[wall.x][wall.y] = false;
        this.grid[unvisitedCell.x][unvisitedCell.y] = false;

        mark[unvisitedCell.x][unvisitedCell.y] = true;

        for(var i = 0; i < 4; i ++) {
          var potentialWall = v(unvisitedCell.x + adj[i].x, unvisitedCell.y + adj[i].y);
          if(potentialWall.x > 0 && potentialWall.y > 0 && potentialWall.x < width - 1 && potentialWall.y < height - 1) {
            if(!mark[potentialWall.x][potentialWall.y]) {
              mark[potentialWall.x][potentialWall.y] = true;
              candidateWalls.push(potentialWall);
            }
          }
        }
      }
    }
  }

  RandomMazeMap.prototype.pretty = function() {
    var result = "";
    for(var y = 0; y < this.height; y ++) {
      for(var x = 0; x < this.width; x ++) {
        result += (this.grid[x][y]) ? '*' : ' ';
      }
      result += '\n';
    }
    return result;
  };

  RandomMazeMap.prototype.minimapTexture = function() {
    var scale = 20;

    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");

    canvas.width = scale * this.width;
    canvas.height = scale * this.height;

    context.translate(0.5, 0.5);

    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "black";

    for(var x = 0; x < this.width; x ++) {
      for(var y = 0; y < this.height; y ++) {
        if(this.grid[x][y]) {
          context.fillStyle = "black";
        } else if(x == this.source.x && y == this.source.y) {
          context.fillStyle = "blue";
        } else if(x == this.sink.x && y == this.sink.y) {
          context.fillStyle = "green";
        } else {
          context.fillStyle = "white";
        }

        context.fillRect(x * scale, canvas.height - scale - y * scale, scale + 1, scale + 1);
      }
    }

    return canvas;
  };

  RandomMazeMap.prototype.dfsPlan = function() {
    var self = this;

    var stack = [];
    var path = [];
    var mark = {};

    function dfs(x, y) {
      if(x == self.sink.x && y == self.sink.y) {
        path.push(v(x, y));
        return true;
      } else if((x * self.height + y) in mark) {
        return false;
      }

      path.push(v(x, y));

      mark[x * self.height + y] = true;

      for(var i = 0; i < 4; i ++) {
        var next = v(x + adj[i].x, y + adj[i].y);
        if(next.x >= 0 && next.y >= 0 && next.x < self.width && next.y < self.height) {
          if(!self.grid[next.x][next.y]) {
            if(dfs(next.x, next.y)) {
              return true;
            }
          }
        }

        path.push(v(x, y));
      }

      return false;
    }

    dfs(this.source.x, this.source.y);
    return path;
  };

  window.RandomMazeMap = RandomMazeMap;
})();
