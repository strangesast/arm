var keycodes = {
  'left':37,
  'right':39,
  'up':38,
  'down':40
}

var canvas = document.getElementById('canvas');
canvas.width = 1000;
canvas.height = 1000;
var ctx = canvas.getContext('2d');

var target = [200, 200];
var ball = new Ball(50, 'blue', 'red', 'yellow', [0, 1000, 0, 1000], target);
ball.x = 200;
ball.y = 400;
ball.vr = 0.1;
ball.vx = 0;
ball.vy = 0;

var ball2 = new Ball(50, 'orange', 'purple', 'yellow', [0, 1000, 0, 1000], [ball.x, ball.y]);
ball2.x = 200;
ball2.y = 200;

var fps = 60;
var now;
var then = Date.now();
var interval = 1000/fps;
var delta;

var g= 9.81;
var ts = 0.01;


var drawFrame = function(time) {

  window.requestAnimationFrame(drawFrame, canvas)

  now = Date.now();
  delta = now - then;

  if (delta > interval) {
    then = now - (delta % interval);

    ctx.save();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ball2.settarget([ball.x, ball.y])
    ball.move(ctx);
    ball2.move(ctx);
    ball.drawPath(ctx);
    ball2.drawPath(ctx);

    // gravity
    //ball.vy += g*ts;

  }
};


drawFrame();

mouseMoveListener = function(evt) {
  target[0] = evt.clientX;
  target[1] = evt.clientY;
}
canvas.addEventListener('mousemove', mouseMoveListener);

mouseClickListener = function(evt) {
  console.log(evt);
  canvas.removeEventListener('click', mouseClickListener);
  canvas.removeEventListener('mousemove', mouseMoveListener);
  setTimeout(function() {
    canvas.addEventListener('click', mouseClickListener);
    canvas.addEventListener('mousemove', mouseMoveListener);
  }, 1000);
}
canvas.addEventListener('click', mouseClickListener);
