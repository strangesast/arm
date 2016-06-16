mainCanvas = document.getElementById('canvas');
mainCanvas.width = 1000;
mainCanvas.height = 600;
const WIDTH = mainCanvas.width;
const HEIGHT = mainCanvas.height;
const LENGTHA = 130;
const LENGTHB = 174;
var x;
var y;

const centerX = Math.min(WIDTH/2,HEIGHT/2);
const centerY = HEIGHT/2;

var lastr1 = 0;
var lastr2 = 0;

var lena = function(ar) {
  return Math.sqrt(ar.map((el)=>Math.pow(el,2)).reduce((a,b)=>a+b));
}
var len = function() {
  return lena(Array.prototype.slice.call(arguments,0));
}
var diff = function(a, b) {
  return a.map((el,i)=>el-b[i]);
}
var plus = function(a, b) {
  return a.map((el, i)=>el+b[i]);
}
var angle = function(a, b) {
  return +(Math.acos((a[0]*b[0]+a[1]*b[1]) / (len(a[0], a[1])*len(b[0], b[1])))*180/Math.PI) || 0;
}
var below = function(val, thr) {
  return Math.abs(val) < thr ? true : false;
}

// initialized with target, may also send new target
// end on reaching target
var controller = function* (target) {
  var goal = null;

  // displacement
  var r1 = lastr1;
  var r2 = lastr2;

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
      var goal = calc([val[0]-centerX, val[1]-centerY], LENGTHA, LENGTHB); // for intermediate angle calc
    }
    if(goal !== null) {
      ta = goal[2]; // target alpha
      tb = goal[3]; // target beta

      ar1 = (ta-r1)/100;
      ar1 = Math.abs(ar1) > 0.001 ? ar1 : 0;
      ar1 = Math.max(Math.min(ar1,0.1),-0.1);

      vr1 += ar1
      vr1 *= 0.85

      r1 += vr1;

      ar2 = (tb-r2)/100;
      ar2 = Math.abs(ar2) > 0.001 ? ar2 : 0;
      ar2 = Math.max(Math.min(ar2,0.1),-0.1);

      vr2 += ar2;
      vr2 *= 0.85

      r2 += vr2;

      b = (v)=>below(v,0.001);
      if([ta-r1,tb-r2,vr1,vr2].every(b)){
        break;
      }
    }
  }
}

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
  var dx2 = Math.cos(beta)*b+dx1;
  var dy2 = Math.sin(beta)*b+dy1;
  return [[dx1, dy1], [dx2, dy2]];
}

var stroke = function(ctx, images) {
  var args = Array.prototype.slice.call(arguments,2);
  if(images.every((el)=>el!==null)){
    images.forEach(function(img,i) {
      ctx.save();
      ctx.translate(args[i][0],args[i][1]);
      ctx.rotate(-Math.atan2(args[i+1][0]-args[i][0],args[i+1][1]-args[i][1]));
      ctx.scale(0.75, 0.75);
      ctx.drawImage(img, -img.width/2, -18);
      ctx.restore();
    });
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(args[0][0], args[0][1]);
    for(var i=1,pnt; pnt=args[i],i < args.length; i++) {
      ctx.lineTo(pnt[0],pnt[1]);
    }
    ctx.stroke();
    ctx.restore();
  }
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
  var val; // last mouse position
  var images = [null, null];  // lazy load image data
  loadImages(['/img/arm2.png', '/img/arm3.png']).then(function(imgs) {
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
          ctx.beginPath();
          var one = [centerX, centerY];
          var two = plus(one,points[0]);
          var three=plus(one,points[1]);
          stroke(ctx, images, one, two, three);
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

  canvasElement.addEventListener('mousedown', function(e) {
    x = e.clientX;
    y = e.clientY;

    if(activeController === null) {
      activeController = controller([x, y]);
      activeController.next();
      activeController.next([x, y]);
    } else {
      activeController.next([x, y]);
    }

    if(frameRequest === null) {
      drawFrame();
    }
  });
})(mainCanvas);

var monitor = function() {
  var canvas = document.createElement('canvas');
  var width = 300;
  var height = 300;
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext('2d');
  mainCanvas.parentElement.appendChild(canvas);

  var updateGraph = function(data) {
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(data[0][0],data[0][1]);
    for(var i=0; i < data.length; i++){
      ctx.lineTo(data[i][0],data[i][1]);
    }
    ctx.stroke()
  };
  return {
    update: updateGraph
  }
};
