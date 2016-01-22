function draw() {
  var canvas = document.getElementById('tutorial');
  var ctx = canvas.getContext('2d');

  ctx.lineWidth = 20;

  for (var i = 0; i < 15; i++) {
    ctx.strokeStyle = getRndColor();
    var x0 = 61 * (1 + i)
    ctx.beginPath();
    ctx.moveTo(x0, -5);
    var x_ = x0 + (Math.random() - 0.5) * 100;
    var l = 70 + Math.random() * 50;
    var n = 0;
    for (var j=0; j<2; j++) {
      var dx = (Math.random() - 0.5) * 30;
      ctx.quadraticCurveTo(x_, n * l + l/2, x_ + dx, n * l + l)
      n++;
      x_ = x_ + 2 * dx;
    }
    ctx.stroke();
    
    var x = x_-dx;
    var y = n*l;
    ctx.translate(x, y);
    ctx.rotate( Math.atan2(-1.8*dx, l) - Math.PI/2 );
    ctx.fillStyle = '#fff';
    
    ctx.font = "12px DIN";
    ctx.fillText('VEGI', 8, 3)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}
function getRndColor() {
    var h = 360*Math.random()|0;
    return 'hsla(' + h +',100%,30%,0.5)';
}
