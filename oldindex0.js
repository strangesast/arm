const WIDTH = 800;
const HEIGHT = 800;
var canvas = document.getElementById('canvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;

var ctx = canvas.getContext('2d');

var lengths = [86, 116];

//   |\
//   | \  
//   |  \
//   |   \
//   ----- 
//
// a^2 = b^2 + c^2 - 2bc cos(alpha)
// sin^2 + cos^2 = 1
var loadImg = function(src) {
  return new Promise(function(resolve, reject) {
    var img = new Image();
    img.onload = function() {
      return resolve(img);
    }
    img.src = src;
  });
}

var diff = function(a, b) {
  return a.map(function(el, i) {
    return el - b[i];
  });
};

var plot = function(ctx, ar, color) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo.apply(ctx, ar[0]);
  for(var i=1; i < ar.length; i++) {
    ctx.lineTo.apply(ctx, ar[i]);
  }
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
};

document.addEventListener('DOMContentLoaded', function() {
  // load arm images
  Promise.all([
      loadImg('/arm2.png'),
      loadImg('/arm3.png'),
      loadImg('/arm4.png')
  ]).then(function(armImages) {
    canvas.addEventListener('mousemove', function(e) {
      var one = [WIDTH/2, HEIGHT/2];
      var four = [e.clientX, e.clientY]; // target
      ctx.clearRect(0,0,WIDTH,HEIGHT);
      stroke(ctx, 'red', one, four);
      var points = calc(one, four, lengths[0], lengths[1]);
      var two = points[0];
      var three = points[1];
      var five = [three[0]+10, three[1]];
      stroke(ctx,armImages,one,two,three,five);
      ctx.fillText(angle([800, 400], two, one) + '°', 0, 20); // 1st joint rot
      ctx.fillText(angle(diff(two, one), diff(three, two))+ '°', 0, 40); // 2nd joint rot
      ctx.fillText(angle(diff(three,two),diff(five,three))+ '°', 0, 60); 
    });
  });
});

var angle = function(a, b, rel) {
  if(rel) {
    a = [a[0] - rel[0], a[1] - rel[1]];
    b = [b[0] - rel[0], b[1] - rel[1]];
  }
  return Math.round(Math.acos((a[0]*b[0]+a[1]*b[1]) / (len(a[0], a[1])*len(b[0], b[1])))*180/Math.PI) || 0;
};

var len = function() {
  var sum = 0;
  for(var i=0, args = arguments; i < args.length; i++) sum += Math.pow(args[i],2);
  return Math.sqrt(sum);
}

var bnds = function(val, up, low) {
  return Math.min(Math.max(val, low), up);
}

var calc = function(pointA, pointB, a, b) {
  // ret 3 points
  var a0 = pointA[0];
  var a1 = pointA[1];
  var dx = pointB[0] - a0;
  var dy = pointB[1] - a1;
  var c = len(dx, dy);
  var cosb=bnds((Math.pow(a,2)+Math.pow(c,2)-Math.pow(b,2))/(2*a*c), 1, -1);
  var sinb=Math.sqrt(1-Math.pow(cosb,2));
  var dxr = (dx*cosb-dy*sinb)*a/c;
  var dyr = (dx*sinb+dy*cosb)*a/c;
  var l = bnds(c, a+b, a-b)/c;
  return [
    [a0+dxr, a1+dyr],
    [a0+dx*l, a1+dy*l]
  ];
};

var stroke = function(ctx, color) {
  var args = Array.prototype.slice.call(arguments, 2);
  if(typeof color === "string") {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo.apply(ctx, args[0]);
    for(var i=1; i < args.length; i++) {
      ctx.lineTo.apply(ctx, args[i]);
    }
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    var last = args.slice(-1)[0];
    ctx.arc(last[0], last[1], 4, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  } else {
    for(var i=1; i < args.length; i++) {
      ctx.save();
      let dx = args[i][0]-args[i-1][0];
      let dy = args[i][1]-args[i-1][1];
      let a = Math.atan2(dy,dx);
      ctx.translate(args[i-1][0],args[i-1][1]);
      ctx.rotate(a-Math.PI/2);
      ctx.scale(0.5, 0.5);
      ctx.drawImage(color[i-1], -color[0].width/2, -18);
      ctx.restore();
    }
  }
};
