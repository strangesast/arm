canvas = document.getElementById('canvas');
canvas.width = 1200;
canvas.height = 1200;

var lena = function(ar) {
  return Math.sqrt(ar.map((el)=>Math.pow(el,2)).reduce((a,b)=>a+b));
}
var len = function() {
  return lena(Array.prototype.slice.call(arguments,0));
}
var diff = function(a, b) {
  return a.map((el,i)=>el-b[i]);
}
var angle = function(a, b) {
  return +(Math.acos((a[0]*b[0]+a[1]*b[1]) / (len(a[0], a[1])*len(b[0], b[1])))*180/Math.PI) || 0;
}

//var set = function(alpha, beta, a, b) {
//  var dx = a*Math.cos(alpha);
//  var dy = a*Math.sin(alpha);
//  var cost = Math.cos(beta);
//  var sint = Math.cos(beta);
//  var dxp = (x+dx)*cost - (y+dy)*sint;
//  var dyp = (x+dx)*sint + (y+dy)*cost;
//  return [dx, dy, dxp, dyp];
//};

var calc = function(B, a, b) {
  var dx = B[0];
  var dy = B[1];
  var c = lena(B);
  var cosb=Math.min(Math.max((Math.pow(a,2)+Math.pow(c,2)-Math.pow(b,2))/(2*a*c),-1),1);
  var sinb=Math.sqrt(1-Math.pow(cosb,2));
  var dxr = (dx*cosb-dy*sinb)*a/c;
  var dyr = (dx*sinb+dy*cosb)*a/c;
  var l = Math.max(Math.min(c,a+b),a-b)/c;
  var alpha = Math.atan2(dy,dx);  // (a % (2*pi))*180/pi
  var beta = Math.acos(((dx*l-dxr)*dxr+(dy*l-dyr)*dyr)/(a*b)) || 0;

  return [
    [dxr, dyr],
    [dx*l, dy*l],
    alpha,
    beta
  ]
};

var set = function(alpha, beta, a, b) {
  var dx1 = Math.cos(alpha)*a;
  var dy1 = Math.sin(alpha)*a;
  var dx2 = Math.cos(alpha-beta)*b+dx1;
  var dy2 = Math.sin(alpha-beta)*b+dy1;
  console.log(len(dx1,dy1))
  var ret = [dx1, dy1, dx2, dy2];
  return ret;
}

var stroke = function(ctx) {
  var args = Array.prototype.slice.call(arguments,1);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(args[0][0], args[0][1]);
  for(var i=1,pnt; pnt=args[i],i < args.length; i++) {
    ctx.lineTo(pnt[0],pnt[1]);
  }
  ctx.stroke();
  ctx.restore();
};

(function(canvasElement) {
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // animation stuff
  var fps = 60;
  var now;
  var then = Date.now();
  var interval = 1000/fps;
  var delta;

  var x = 0;
  var y = 0;
  var ballx = 0;
  var bally = 0;
  var vx = 0;
  var vy = 0;
  var vt1 = 0;
  var vt2 = 0;

  var ctx = canvasElement.getContext('2d');
  var frameRequest;
  var drawFrame = function(time) {
    frameRequest = window.requestAnimationFrame(drawFrame, canvas);
  
    now = Date.now();
    delta = now - then;
  
    if (delta > interval) {
      then = now - (delta % interval);
      var goalpoints = calc([x-WIDTH/2, y-HEIGHT/2], 200, 200); // for intermediate angle calc
      var points = calc([ballx-WIDTH/2, bally-HEIGHT/2], 200, 200); // for drawing

      var setv1 = goalpoints[2];
      var setv2 = goalpoints[3];
      var av1 = points[2];
      var av2 = points[3];

      console.log(setv1*180/Math.PI)
      console.log(setv2*180/Math.PI)
      var nt = set(setv1, setv2, 200, 200);
      points[0]=nt.slice(0, 2)
      points[1]=nt.slice(2)
      //console.log([nt[0]+WIDTH/2,nt[1]+HEIGHT/2,nt[2]+WIDTH/2,nt[3]+HEIGHT/2])
      //console.log(nt);
      //console.log(points.slice(0,2).reduce((a,b)=>a.concat(b)));

      //vt1 = (setv1 - av1)/10;
      //vt1 = Math.abs(vt1) > 0.01 ? vt1 : 0;
      //vt2 = (setv2 - av2)/10;
      //vt2 = Math.abs(vt2) > 0.01 ? vt2 : 0;

      //av1+=vt1
      //av2+=vt2

      //var vals = set(av1, av2, 200, 200)
      //ballx = WIDTH/2+vals[2];
      //bally = HEIGHT/2+vals[3];
      //points = [vals.slice(0,2), vals.slice(2)]

      //vx = (x-ballx)/10;
      //vx = Math.abs(vx) > 0.01 ? vx : 0;
      //vy = (y-bally)/10;
      //vy = Math.abs(vy) > 0.01 ? vy : 0;

      //ballx += vx
      //bally += vy
      //ballx = WIDTH/2+vals[3];
      //bally = HEIGHT/2+vals[4];


      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.beginPath();
      var one = [WIDTH/2, HEIGHT/2];
      var two = [WIDTH/2+points[0][0], HEIGHT/2+points[0][1]];
      var three = [WIDTH/2+points[1][0], HEIGHT/2+points[1][1]];
      stroke(ctx, one, two, three);

      ctx.save();
      ctx.strokeStyle = 'red';
      stroke(ctx, one, [ballx, bally]);
      ctx.fillStyle = 'black';
      ctx.translate(WIDTH/2+points[1][0], HEIGHT/2+points[1][1]);
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI*2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      if(vx == 0 && vy == 0 && vt1 == 0 && vt2 == 0) {
        window.cancelAnimationFrame(frameRequest);
        frameRequest = null;
      }
    }
  };
  
  drawFrame();

  canvasElement.addEventListener('mousedown', function(e) {
    x = e.clientX;
    y = e.clientY;

    if(frameRequest === null) {
      drawFrame();
    }
  });
})(canvas);
