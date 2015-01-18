/**
 * Created by 柏子 on 2015/1/8.
 */
angular.module('flipEditor').controller('cvsCtrl',['$element','dataFac','actMng',
  function($element,dataFac,actMng){
  var cvs = $element[0], ctx = cvs.getContext('2d'), self = this, PI2 = Math.PI * 2,invalid,arr=Flip.util.Array;
  var dotStyle=(function(color){
    cvs.width=cvs.height=2;
    ctx.fillStyle=color;
    ctx.fillRect(0,0,1,1);
    ctx.fillRect(1,1,1,1);
    ctx.fillStyle='rgba(0,0,0,0)';
    ctx.fillRect(1,0,1,1);
    ctx.fillRect(0,1,1,1);
    var img=new Image();
    img.src=cvs.toDataURL();
    img.onload=function(){
     dotStyle= ctx.createPattern(img,'repeat');
      img=null;
    };
    return color;
  })('#555');
  invalid=(function(_invalid){
    Flip.instance.on('frameStart',function(){
      if(_invalid){
        ctx.save();
        draw();
        ctx.restore();
        _invalid=false;
      }
    });
    return dataFac.invalid=function(){
      _invalid=true;
    }
  })(true);
  dataFac.changeCursor=changeCursor;
  var pointColor={
    data:'red',
    control:'green',
    data_f:'orange',
    control_f:'darkgreen'
  };
  function draw(){
    drawAxis();
    dataFac.lines.forEach(drawLine);
    dataFac.points.forEach(drawPoint);
    dataFac.usedCps.forEach(drawPoint);
  }
  Flip.util.Object.forEach({
    click:function(e){e.preventDefault();},
    mousedown:function(e){
      e.preventDefault();
      var pos=correlatePos(e),hit;
      if(hit=hitTest(pos)){
        hit.button= e.button;
        actMng.act('choose',hit);
      }
    },
    mouseleave:function(e){
      actMng.act('leave',{position:correlatePos(e)});
    },
    mousemove:function(e){
      var pos=correlatePos(e);
      actMng.act('move',{position: pos,hitTest:function(){return hitTest(pos)}});
    },
    mouseup:function(e){
      actMng.act('release',{position:correlatePos(e),button: e.button});
      e.preventDefault();
    },
    mousewheel:function(e){
      dataFac.pointType= e.wheelDelta>0?'control':'data';
    },contextmenu:function(e){
      e.preventDefault();
    }
  },function(handler,name){cvs.addEventListener(name,handler)});
  cvs.width=(cvs.height=600)/3*4;
  function correlatePos(e) {
    return {
      x: parseInt(e.clientX - cvs.offsetLeft - cvs.width / 2),
      y: parseInt(cvs.height / 2 - (e.clientY - cvs.offsetTop))
    };
  }
  function hitTest(p){
    var target,type;
    if(target=hitPoints(p))type='point';
    else if(target=hitLines(p))type='line';
    else return null;
    return {target:target,type:type,position:p};
  }
  function hitPoints(p){
    return arr.first(dataFac.points,hitPoint)||arr.first(dataFac.usedCps,hitPoint);
    function hitPoint(point){
      return ptContain(point,p)
    }
  }
  function hitLines(p){

  }

  function ptContain(cir, p) {
    var x, y, r=cir.focus? 4:2 ;
    return p.x > ((x = cir.x) - r) && p.x < x + r && p.y > ((y = cir.y) - r) && p.y < y + r;
  }
  function drawAxis(color) {
    var w = cvs.width, h = cvs.height;
    ctx.fillStyle = 'white';
    ctx.lineWidth = self.lineWidth;
    ctx.clearRect(0,0,w,h);
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.strokeStyle = color || '#000';
    ctx.stroke();
    ctx.restore();
    ctx.translate(w / 2, h / 2);
    ctx.scale(1,-1);
  }
  function drawPoint (p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.focus? 4:2, 0, PI2);
    ctx.fillStyle = pointColor[p.type];
    ctx.fill();
  }
  function drawLine(line) {
    var i, point, pts = line.points;
    ctx.save();
    ctx.beginPath();
    point = pts[0];
    if (point) ctx.moveTo(point.x, point.y);
    for (point = pts[i = 1]; point; point = pts[++i])
      ctx.lineTo(point.x, point.y);
    ctx.lineWidth = line.lineWidth;
    ctx.strokeStyle = line.color;
    ctx.stroke();
    ctx.restore();
    drawCPDPdotLine(line.cps,line.dps,line.drawCP);
  }
    function drawCPDPdotLine(cps,dps,n){
      if(n<1)return;
      var paint=n==1?cp1:cp2;
      ctx.save();
      ctx.beginPath();
      pathLine(dps[0],cps[0]);
      for(var i= 1,segCount=dps.length- 1,dp=dps[i];i<segCount;dp=dps[++i])
        paint(dp,i);
      if(n==2)
        pathLine(dps[segCount],cps[cps.length-1]);
      ctx.lineCap='dot';
      ctx.strokeStyle=dotStyle;
      ctx.stroke();
      ctx.restore();
      function cp1(dp,i){
        pathLine(dp,cps[i]);
      }
      function cp2(dp,i){
        pathLine(dp,cps[i]);
        pathLine(dp,cps[i+1]);
      }
    }
    function pathLine(p0,p1){
      ctx.moveTo(p0.x,p0.y);
      ctx.lineTo(p1.x,p1.y);
    }
  function changeCursor(pointer){
    cvs.style.cursor=pointer?'pointer':'';
  }
}]);