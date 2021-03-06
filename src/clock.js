/**
 * animation timing clock ,do not operate clock until you know what you are doing
 * @namespace Clock
 * @alias Flip.Clock
 * @param opt
 * @returns {Clock}
 * @constructor
 */
function Clock(opt) {
  if (!(this instanceof Clock))return new Clock(opt);
  objForEach(Clock.createOptProxy(opt, 1, Clock.EASE.linear, 0, 1, 0,0).result, cloneFunc, this);
  this.reset(1,0,0,0);
}
Flip.Clock = Clock;
/**
 * triggered when animation iterate
 * @event Flip.Animation#iterate
 */
/**
 * triggered when animation reverse play
 * @event Flip.Animation#reverse
 */
/**
 * triggered when animation first update(not constructed)
 * @event Flip.Animation#init
 */
var CLOCK_EVT=Clock.EVENT_NAMES =Object.seal({
  UPDATE: 'update',
  INIT:'init',
  ITERATE: 'iterate',
  START: 'start',
  REVERSE: 'reverse',
  TICK: 'tick',
  FINISH: 'finish',
  FINALIZE: 'finalize',
  CONTROLLER_CHANGE: 'controllerChange'
});
inherit(Clock, obj, {
    get controller() {
      return this._controller || null;
    },
    set controller(c) {
      var oc = this.controller;
      c = c || null;
      if (oc === c)return;
      this._controller = c;
      this.emit(CLOCK_EVT.CONTROLLER_CHANGE, {before: oc, after: c, clock: this});
    },
    get started(){
      return this._startTime!==-1;
    },
    get finished() {
      return this._finished;
    },
    get paused() {
      return this._paused;
    },
    get ease() {
      return this._tf;
    },
    set ease(src) {
      var tf;
      if ((isFunc(tf=src))||(tf = Clock.EASE[src]))
        this._tf = tf;
    },
    start: function () {
      if (this.t == 0) {
        this.reset(0, 1).emit(CLOCK_EVT.START, this);
        return !(this._finished=false);
      }
      return false;
    },
    reverse: function () {
      if (this.t == 1) {
        this.reset(0, 1, 1, 1,1);
        return true;
      }
      return false;
    },
    restart: function () {
      this.t = 0;
      return this.start();
    },
    reset: function (finished, keepIteration,delayed, atEnd, reverseDir, pause) {
      if(arguments.length==0)
      //reset to a new clock
        return this.reset(0,0,0,0);
      this._startTime = -1;
      if (!keepIteration)
        this.i = this.iteration||1;
      this._delayed=!!delayed;
      this.d = !reverseDir;
      if(atEnd!==undefined)
        this.t = this.value = atEnd ? 1 : 0;
      this._paused = !!pause;
      this._finished=!!finished;
      return this;
    },
    finish: function (evtArg) {
      this.emit(CLOCK_EVT.FINISH, evtArg);
      this.reset(1,1,1);
      this._finished=true;
    },
    end: function (evtArg) {
      this.autoReverse ? this.reverse(evtArg) : this.iterate(evtArg);
    },
    iterate: function (evtArg) {
      if (--this.i > 0 ||this.infinite)
        this.reset(0, 1,1,0);
      else
        this.finish(evtArg);
    },
    pause: function () {
      if (!this._paused) {
        this._pausedTime = -1;
        this._pausedDur = 0;
        this._paused = true;
      }
    },
    resume: function () {
      if (this._paused && this._startTime > 0) {
        this._startTime += this._pausedDur;
        this._paused = false;
      }
    },
    finalize:function(){
      var task;
      if(task=this._task)
        task.toFinalize(this);
      else{
        this.reset(1);
        this.emit(CLOCK_EVT.FINALIZE);
      }
    },
    update:function(state){
      var task;
      if(this.finished&&(task=this._task)){
        task.toFinalize(this);
      }else{
        updateClock(state.clock=this,state);
        state.clock=null;
      }
    }
  });
objForEach(CLOCK_EVT, function (evtName, key) {
    Object.defineProperty(this, 'on' + evtName, {
      set: function (func) {
        this.on(CLOCK_EVT[key], func);
      }
    })
  }, Clock.prototype);
function emitWithCtrl(clock,evtName,arg){
  var ctrl=clock.controller;
  clock.emit(evtName,arg);
  if(ctrl&&isFunc(ctrl.emit))ctrl.emit(evtName,arg);
}
function updateClock(c,state) {
  if (c&&!c.finished) {
    var timeline = state.timeline;
    state.clock=c;
    if (c._startTime == -1) {
      c._startTime = timeline.now;
      emitWithCtrl(c,CLOCK_EVT[c.d?(c.i== c.iteration? 'INIT':'ITERATE'):'REVERSE'],state);
    //  evtName= ;
     // c.emit(evtName,state);
     // controller&&controller.emit(evtName,state);
      return true;
    }
    else if (c._paused) {
      var pt = c._pausedTime;
      pt == -1 ? c._pausedTime = timeline.now : c._pausedDur = timeline.now - pt;
      return false;
    }
    var dur = (timeline.now - c._startTime) / timeline.ticksPerSecond - (c._delayed? 0:c.delay),
      curValue;
    if (dur > 0) {
      var ov = c.value, t;
      //only delay once
      if(!c._delayed){
        c._delayed=1;
        c._startTime+=c.delay*timeline.ticksPerSecond;
        emitWithCtrl(c,CLOCK_EVT.START,state);
      }
      t = c.t = c.d ? dur / c.duration : 1 - dur / c.duration;
      if (t > 1)t = c.t = 1;
      else if (t < 0)t = c.t = 0;
      curValue = c.value = c.ease(t);
      if (ov != curValue) c.emit(CLOCK_EVT.TICK,state);
      if (t == 1)c.end(state);
      else if (t == 0)c.iterate(state);
      state.task.invalid();
      return true;
    }
    state.clock=null;
  }
}
Clock.createOptProxy = function (opt, duration, ease, infinite, iteration, autoReverse,delay) {
  var setter = createProxy(opt);
  setter('duration', duration, 'ease', ease, 'infinite', infinite, 'iteration', iteration, 'autoReverse', autoReverse,'delay',delay);
  return setter;
};
Flip.EASE = Clock.EASE = (function () {
  /**
   * from jQuery.easing
   * @lends Clock.EASE
   * @lends Flip.EASE
   * @memberof Flip
   * @readonly
   * @public
   * @enum {function}
   * @property {function} linear
   * @property {function} zeroStep
   * @property {function} halfStep
   * @property {function} oneStep
   * @property {function} random
   * @property {function} randomLimit
   * @property {function} backOut
   * @property {function} backIn
   * @property {function} backInOut
   * @property {function} cubicOut
   * @property {function} cubicIn
   * @property {function} cubicInOut
   * @property {function} expoOut
   * @property {function} expoIn
   * @property {function} expoInOut
   * @property {function} circOut
   * @property {function} circIn
   * @property {function} circInOut
   * @property {function} sineOut
   * @property {function} sineIn
   * @property {function} sineInOut
   * @property {function} bounceOut
   * @property {function} bounceIn
   * @property {function} bounceInOut
   * @property {function} elasticOut
   * @property {function} elasticIn
   * @property {function} elasticInOut
   * @property {function} quintOut
   * @property {function} quintIn
   * @property {function} quintInOut
   * @property {function} quartOut
   * @property {function} quartIn
   * @property {function} quartInOut
   * @property {function} quadOut
   * @property {function} quadIn
   * @property {function} quadInOut
   */
  var F = {
    linear: function (t) {
      return t;
    },
    zeroStep: function (t) {
      return t <= 0 ? 0 : 1;
    },
    halfStep: function (t) {
      return t < .5 ? 0 : 1;
    },
    oneStep: function (t) {
      return t >= 1 ? 1 : 0;
    },
    random: function () {
      return Math.random();
    },
    randomLimit: function (t) {
      return Math.random() * t;
    }
  };
  var pow = Math.pow, PI = Math.PI;
  (function (obj) {
    objForEach(obj, function (func, name) {
      var easeIn = func;
      F[name + 'In'] = easeIn;
      F[name + 'Out'] = function (t) {
        return 1-easeIn(1-t);
      };
      F[name + 'InOut'] = function (t) {
        return t < 0.5 ? easeIn(t * 2) / 2 : 1 - easeIn(t * -2 + 2) / 2;
      };
    });
  })({
    back: function (t) {
      return t * t * ( 3 * t - 2 );
    },
    elastic: function (t) {
      return t === 0 || t === 1 ? t : -pow(2, 8 * (t - 1)) * Math.sin(( (t - 1) * 80 - 7.5 ) * PI / 15);
    },
    sine: function (t) {
      return 1 - Math.cos(t * PI / 2);
    },
    circ: function (t) {
      return 1 - Math.sqrt(1 - t * t);
    },
    cubic: function (t) {
      return t * t * t;
    },
    expo: function (t) {
      return t == 0 ? 0 : pow(2, 10 * (t - 1));
    },
    quad: function (t) {
      return t * t;
    },
    quart: function (t) {
      return pow(t, 4)
    },
    quint: function (t) {
      return pow(t, 5)
    },
    bounce: function (t) {
      var pow2, bounce = 4;
      while (t < ( ( pow2 = pow(2, --bounce) ) - 1 ) / 11);
      return 1 / pow(4, 3 - bounce) - 7.5625 * pow(( pow2 * 3 - 2 ) / 22 - t, 2);
    }
  });

  return Object.freeze(F);
})();