(function() {
  "use strict";

  function Vector(x, y) {
    this.x = x;
    this.y = y;
  }

  Vector.prototype.rotate = function(angle) {
    var s = Math.sin(angle);
    var c = Math.cos(angle);

    var nx = c * this.x - s * this.y;
    var ny = s * this.x + c * this.y;

    return new Vector(nx, ny);
  };

  Vector.prototype.angle = function() {
    return Math.atan2(this.y, this.x);
  };

  Vector.prototype.add = function(other) {
    return new Vector(this.x + other.x, this.y + other.y);
  };

  window.Vector = Vector;
})();
