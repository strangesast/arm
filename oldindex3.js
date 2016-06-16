var Ball = (() => {
  var Ball = function(radius, color, color2, color3, bounds, target) {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.vr = 0;
    this.radius = radius;
    this.rotation = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.color = color;
    this.color2 = color2;
    this.lineColor = color3;
    this.lineWidth = 1;
    this.bounds = bounds;
    this.path = [];
    this.path2 = [];
    this.target = target;
  };

  Ball.prototype.draw = function(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scaleX, this.scaleY);
    ctx.rotate(this.rotation);
    ctx.beginPath()
    ctx.arc(0, 0, this.radius, 0, Math.PI, true);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0, 0, this.radius, Math.PI, Math.PI*2, true);
    ctx.closePath();
    ctx.fillStyle = this.color2;
    ctx.fill()
    ctx.restore();
  };

  Ball.prototype.move = function(ctx) {
    this.movebounds(this.x + this.vx, this.y + this.vy);
    this.draw(ctx);
    this.path.push([this.x + Math.cos(this.rotation)*this.radius, Math.sin(this.rotation)*this.radius + this.y]);
    this.path2.push([this.x + Math.cos(this.rotation+Math.PI)*this.radius, Math.sin(this.rotation+Math.PI)*this.radius + this.y]);

    var k = 0.0005;
    let dx = this.target[0] - this.x;
    let dy = this.target[1] - this.y;
    let n = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
    let dxn = dx/n;
    let dyn = dy/n;

    let alt = [this.target[0]-dxn*100, this.target[1]-dyn*100];


    this.vx += k*(alt[0]-this.x);
    this.vy += k*(alt[1]-this.y);

    ctx.save()
    ctx.fillStyle = 'yellow';
    ctx.strokeStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(this.target[0], this.target[1], 10, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(alt[0], alt[1]);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
    ctx.restore()
  };

  Ball.prototype.movebounds = function(x1, y1) {
    var ret = [0, 0];
    if(x1 - this.radius < this.bounds[0]) {
      ret[0] = -1;
    } else if (x1 + this.radius > this.bounds[1]) {
      ret[0] = 1;
    }
    if(y1 - this.radius < this.bounds[2]) {
      ret[1] = -1;
    } else if (y1 + this.radius > this.bounds[3]) {
      ret[1] = 1;
    }
    if(ret[0] != 0) {
      this.x = ret[0] == -1 ? this.bounds[0] + this.radius : this.bounds[1] - this.radius;
      this.vx *= -1;
    } else {
      this.x = x1
    }
    if(ret[1] != 0) {
      this.y = ret[1] == -1 ? this.bounds[2] + this.radius : this.bounds[3] - this.radius;
      this.vy *= -1;
    } else {
      this.y = y1;
    }
    if(ret[0] != 0 || ret[1] != 0) {
      this.vr *= -1;
    }
    this.rotation += this.vr;
  }

  Ball.prototype.drawPath = function(ctx) { ctx.beginPath
    var both = [this.path, this.path2];
    var _this = this;
    both = both.map(function(path) {
      ctx.save();
      ctx.beginPath();
      path.forEach(function(elem) {
        ctx.lineTo(elem[0], elem[1]);
      });
      ctx.lineWidth = 3;
      ctx.strokeStyle = _this.lineColor;
      ctx.stroke();
      ctx.restore();
      return path.slice(-100);
    });
    this.path = both[0];
    this.path2 = both[1];
  }

  Ball.prototype.settarget = function(target) {
    this.target = target;
  }

  return Ball;
})();
