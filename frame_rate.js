(function() {
  "use strict";

  var interval = 50;
  var decay = 0.35;

  var FrameRate = function() {
    this.rawRate = 0;
    this.ticks = 0;
    this.nextRefresh = null;
    this.rate = 0;
  }

  FrameRate.prototype.tick = function() {
    var now = Date.now();
    if(this.nextRefresh == null || now >= this.nextRefresh) {
      this.nextRefresh = now + interval;
      this.rawRate = this.rawRate * (1 - decay) + this.ticks * decay;
      this.ticks = 0;
      this.rate = Math.round(1000.0 / interval * this.rawRate);
    }
    this.ticks ++;
  }

  FrameRate.prototype

  window.FrameRate = FrameRate;
})();
