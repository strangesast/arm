mainCanvas = document.getElementById('canvas');
mainCanvas.width = 1000;
mainCanvas.height = 600;

const WIDTH = mainCanvas.width;
const HEIGHT = mainCanvas.height;
const LENGTHA = 130;
const LENGTHB = 174;
const centerX = Math.min(WIDTH/2,HEIGHT/2);
const centerY = HEIGHT/2;

var hoverpos = [0, 0]

var x;
var y;
var lastr1 = 0;
var lastr2 = 0;

var lena = function(ar) {
  return Math.sqrt(ar.map((el)=>Math.pow(el,2)).reduce((a,b)=>a+b));
};
var len = function() {
  return lena(Array.prototype.slice.call(arguments,0));
};
var diff = function(a, b) {
  return a.map((el,i)=>el-b[i]);
};
var plus = function(a, b) {
  return a.map((el, i)=>el+b[i]);
};
var angle = function(a, b) {
  return +(Math.acos((a[0]*b[0]+a[1]*b[1]) / (len(a[0], a[1])*len(b[0], b[1])))*180/Math.PI) || 0;
};
var below = function(val, thr) {
  return Math.abs(val) < thr ? true : false;
};
var norm = function(a, b) {
  let d = diff(a, b);
  return d.map((el)=>el/lena(d))
};
var mmag = function(a, b) {
  return Math.abs(a) < Math.abs(b) ? a : b;
};
var absmin = function(val, max) {
  return Math.sign(val)*Math.min(Math.abs(val), max);
};

// initialized with target, may also send new target
// end on reaching target
var controller = function* (target, mon1, mon2) {
  var goal = null;
  var damp = function(d, v) {
    var r = 0.85;
    return r;
  };

  // displacement
  r1 = lastr1;
  r2 = lastr2;

  // velocity
  var vr1 = 0;
  var vr2 = 0;

  // acceleration
  var ar1 = 0;
  var ar2 = 0;

  // target
  var ta = 0;
  var tb = 0;

  while(true) {
    val = yield [r1,r2];
    if(val !== undefined) {
      goal = calc([val[0]-centerX, val[1]-centerY], LENGTHA, LENGTHB) || goal; // for intermediate angle calc
    }
    if(goal !== null) {
      ta = goal[2]; // target alpha
      tb = goal[3]; // target beta

      // limit acceleration
      let d1 = mmag(ta-r1,ta+2*Math.PI-r1);
      ar1 = absmin(d1/100, 0.01);
      ar1 = Math.abs(ar1) > 0.001 ? ar1 : 0;
      ar1 = Math.max(Math.min(ar1,0.1),-0.1);

      vr1 = vr1 + ar1;
      vr1 *= damp(d1, vr1);


      r1 = (r1 + vr1) % (2*Math.PI);

      if(mon1) {
        mon1.addpt(r1);
        mon1.update();
      }

      let d2 = mmag(tb-r2,tb+2*Math.PI-r2);
      ar2 = absmin(d2/100, 0.01);
      ar2 = Math.abs(ar2) > 0.001 ? ar2 : 0;
      ar2 = Math.max(Math.min(ar2,0.1),-0.1);

      vr2 = vr2 + ar2;
      vr2 *= damp(d2, vr2);

      r2 = (r2 + vr2) % (2*Math.PI);

      if(mon2) {
        mon2.addpt(Math.PI-r2+r1);
        mon2.update();
      }

      b = (v)=>below(v,0.001);

      // no accleration, no velocity -> quit
      if([ar1,ar2,vr1,vr2].every(b)){
        break;
      }
    } else {
      break;
    }
  }
};

var calc = function(B, a, b) {
  var dx = B[0];
  var dy = B[1];
  var c = lena(B);
  var cosb=Math.min(Math.max((Math.pow(a,2)+Math.pow(c,2)-Math.pow(b,2))/(2*a*c),-1),1);
  var sinb=Math.sqrt(1-Math.pow(cosb,2));
  var dxr = (dx*cosb-dy*sinb)*a/c;
  var dyr = (dx*sinb+dy*cosb)*a/c;
  var l = Math.max(Math.min(c,a+b),a-b)/c;
  var alpha = Math.atan2(dyr, dxr);
  var beta = Math.atan2(dy*l-dyr, dx*l-dxr);

  return (c < b - a) || (a + b < c) ? null : [
    [dxr, dyr],
    [dx*l, dy*l],
    alpha,
    beta
  ];
};

var set = function(alpha, beta, a, b) {
  var dx1 = Math.cos(alpha)*a;
  var dy1 = Math.sin(alpha)*a;
  var dx2 = Math.cos(beta)*b+dx1;
  var dy2 = Math.sin(beta)*b+dy1;
  return [[dx1, dy1], [dx2, dy2]];
};

var stroke = function(ctx, images) {
  var args = Array.prototype.slice.call(arguments,2);
  for(var i=1,pt1,pt2;pt1=args[i-1],pt2=args[i],i<args.length;i++){
    if(i-1 < images.length && images[i-1] !== null) {
      let img = images[i-1];
      ctx.save();
      ctx.translate(pt1[0],pt1[1]);
      ctx.rotate(-Math.atan2(pt2[0]-pt1[0],pt2[1]-pt1[1]));
      ctx.scale(0.75, 0.75);
      ctx.drawImage(img, -img.width/2, -18);
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pt1[0],pt1[1]);
      ctx.lineTo(pt2[0],pt2[1]);
      ctx.stroke();
      ctx.restore();
    }
  }
};

var angles = function(ctx) {
  var args = Array.prototype.slice.call(arguments,1);
  var lang = 0;
  for(var i=1; i < args.length; i+=2) {
    ctx.save();
    let pnt = args[i-1]; // angle
    let ang = args[i];
    ctx.translate(pnt[0], pnt[1]);
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, ang);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
    lang = ang;
  }
};

var drawText = function(ctx, text, x0, y0) {
  ctx.font = "20px serif";
  ctx.fillStyle = 'black';
  ctx.fillText(String(text), x0, y0);
};

var loadImages = function(urls) {
  return Promise.all(urls.map(function(url) {
    return new Promise(function(resolve, reject) {
      var img = new Image();
      img.onload = function() {
        return resolve(img);
      };
      img.src = url;
    });
  }));
};

(function(canvasElement) {
  // animation stuff
  var fps = 60;
  var now;
  var then = Date.now();
  var interval = 1000/fps;
  var delta;

  var activeController = null; // generator
  var ctx = canvasElement.getContext('2d');
  var frameRequest; // control framerate / cancels
  var val=[lastr1,lastr2]; // last mouse position
  var images = [null, null, null];  // lazy load image data
  loadImages(['/img/arm2.png', '/img/arm3.png', '/img/arm4.png']).then(function(imgs) {
    images = imgs;
  });
  var drawFrame = function(time) {
    frameRequest = window.requestAnimationFrame(drawFrame, canvasElement);
  
    now = Date.now();
    delta = now - then;
  
    if (delta > interval) {
      then = now - (delta % interval);

      if(activeController !== null) {
        var n = activeController.next();
        if(n.done) {
          window.cancelAnimationFrame(frameRequest);
          frameRequest = null;
          activeController = null;
          lastr1 = val[0];
          lastr2 = val[1];
        } else {
          val = n.value;
          var points = set(val[0], val[1], LENGTHA, LENGTHB);
          ctx.clearRect(0, 0, WIDTH, HEIGHT);
          ctx.save();
          ctx.beginPath();
          // 3rd param will be wrong if lena and lenb mag changes
          // red area
          ctx.arc(centerX, centerY, LENGTHB+LENGTHA, 0, Math.PI*2);
          ctx.rect(WIDTH, 0, -WIDTH, HEIGHT);
          ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(centerX, centerY, LENGTHB-LENGTHA, 0, Math.PI*2);
          ctx.fill();
          ctx.restore();
          // angles
          //drawText(ctx, Math.round(val[0]*180/Math.PI), 0, 20);
          //drawText(ctx, Math.round(val[1]*180/Math.PI), 0, 40);

          // imgs
          ctx.beginPath();
          var one = [centerX, centerY];
          var two = plus(one,points[0]);
          var three=plus(one,points[1]);
          //var four =plus(three,norm(plus(one,[400,0]),one).map((el)=>el*200));
          var four =plus(three,norm(hoverpos,three).map((el)=>el*200));
          stroke(ctx, images, one, two, three, four);
          //angles(ctx, one, val[0], two, val[1], three);
          // mouse dot
          ctx.beginPath();
          ctx.fillStyle = 'yellow';
          ctx.arc(x, y, 6, 0, Math.PI*2);
          ctx.fill();
        }
      }
    }
  };
  
  try {
    drawFrame();
  } catch (e) {
    window.cancelAnimationFrame(frameRequest);
    frameRequest = null;
  }

  canvasElement.addEventListener('click', function(e) {
    x = e.clientX;
    y = e.clientY;

    if(activeController === null) {
      activeController = controller([x, y], monit1, monit2);
      activeController.next();
      activeController.next([x, y]);
    } else {
      activeController.next([x, y]);
    }

    if(frameRequest === null) {
      drawFrame();
    }
  });
  canvasElement.addEventListener('dblclick',function(e) {
    hoverpos = [e.clientX, e.clientY];
  });
})(mainCanvas);

var monitor = function() {
  var data = [];
  var canvas = document.createElement('canvas');
  var width = 300;
  var height = 300;
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext('2d');
  mainCanvas.parentElement.appendChild(canvas);


  var updateGraph = function() {
    if(data.length < 2) {
      return;
    }
    max = Math.max.apply(null,data);
    min = Math.min.apply(null,data);

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(0,(data[0]-min)/(max-min)*height);
    for(var i=0; i < data.length; i++){
      let x0 = data[i];
      ctx.lineTo(i/data.length*width, (x0-min)/(max-min)*height);
    }
    ctx.stroke();
  };
  var addpt = function(pt) {
    data.push(pt);
    data = data.slice(-100);
  }
  return {
    update: updateGraph,
    addpt: addpt
  }
};

var monit1 = monitor();
var monit2 = monitor();
