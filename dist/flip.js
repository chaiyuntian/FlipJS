(function(){var FlipScope = {readyFuncs: []};
/**
 * construct an animation with {@link AnimationOptions} or invoke function until dom ready
 * @namespace Flip
 * @global
 * @type {function}
 * @param {function|AnimationOptions} readyFuncOrAniOpt
 * @example
 * Flip(function(Flip){
 *  //this will executed until dom ready
 * });
 * //it will construct until dom ready
 * Flip({
 *  duration:1,
 *  selector:'.ani',
 *  transform:function(mat){
 *    var s=1-this.percent;
  *    mat.scale(s,s)
  *   }
 * });
 */
function Flip (readyFuncOrAniOpt) {
  var func, readyFuncs = FlipScope.readyFuncs;
  if(isObj(readyFuncOrAniOpt)) func=function(){animate(readyFuncOrAniOpt)};
  else if(isFunc(readyFuncOrAniOpt)) func=readyFuncOrAniOpt;
  else throw Error('argument should be an animation option or a function');
  readyFuncs ? arrAdd(FlipScope.readyFuncs, func) : func(Flip);
}
Object.defineProperty(Flip, 'instance', {get: function () {
  return FlipScope.global;
}});
Flip.fallback = function (window) {
  if (!window.requestAnimationFrame)
  {
    //IE9
    window.requestAnimationFrame = function (callback) {
      setTimeout(callback, 30);
    };
    Flip.Mat3.prototype.applyContext2D=function(ctx){
      //there is a bug in IE9 ctx.apply
      var eles=this.elements;
      ctx.transform(eles[0],eles[1],eles[2],eles[3],eles[4],eles[5]);
    }
  }
  if (!window.Float32Array) {
    window.Float32Array = inherit(function (lengthOrArray) {
      if (!(this instanceof arguments.callee))return new arguments.callee(lengthOrArray);
      var i = 0, from, len;
      if (typeof lengthOrArray === "number") {
        from = [0];
        len = lengthOrArray;
      } else
        len = (from = lengthOrArray).length;
      for (i; i < len; i++)
        this[i] = from[i] || 0;
    }, Array.prototype)
  }
};

/**
 * @typedef  AnimationOptions
 * @type {Object}
 * @property {?string} [animationType] a registered animation name
 * @property {?string} [selector='']  css selector to apply animation
 * @property {?boolean}[persistAfterFinished] if set true the css and transform will keep after animation finished
 * @property {?number} [duration=.7] animation duration (in second)
 * @property {?number} [iteration=1] how many times the animation will iterate
 * @property {?number} [delay=0] how many seconds it will begin after it starts
 * @property {?boolean}[infinite=false] if set true the animation will loop forever
 * @property {?boolean}[autoReverse=false] if set true,the animation will replay in reverse order(one iteration including the reversing time if has)
 * @property {?boolean}[autoStart] if set false the animation will starts until Animation#start() is called
 * @property {?Flip.EASE|function}[ease=Flip.EASE.LINEAR] the easing function of the animation
 * @property {?Object} [css] the css rules for the animation
 * @property {?Object} [transform] the transform rules for the animation
 * @property {?Object} [on] register event handler for the animation
 * @property {?Object} [once] register event handler once for the animation
 * @property {?Object} [variable] variable parameter of the animation(every frame the value update with animation#percent)
 * @property {?Object} [immutable] immutable parameter of the animation
 */

/**
 * @typedef  AnimationCssOptions
 * @type {Object}
 * @example
 * // css can pass a function
 * Flip.animate({
 *  selector:'.expand',
 *  css:function(css){
 *    //increase css property width from 0 - 500 px, border-width from 0-2 px;
 *    css.width=this.percent*500+'px';
 *    css.borderWidth=this.percent*2+'px';
 *  }
 * });
 * //or can be an object with multiple css rule
 * Flip.animate({
 *  selector:'.dropText'
 *  css:{
 *    '&':{//& replace the animation selector
 *      overflow:'hidden',
 *      height:'300px'
 *     },
 *     '& p':{// .dropText p
 *      height:function(css){
 *        css.height=300*this.percent+'px';
 *      }
 *     }
 *  }
 * });
 */
/**
 * @see {@tutorial use-matrix}
 * @typedef  AnimationTransformOptions
 * @type {Object}
 * @example
 * //use the css matrix property can do a lot of amazing things,but manually write matrix can be extremely tedious.
 * //just do matrix manipulation don't worry about the calculation
 * Flip.animate({
 *  selector:'div',
 *  transform:function(mat){
 *    var p=this.percent;
 *    mat.translate(p*300,p*120).rotate(Math.PI*2*p);
 *    //it like a rolling cubic
 *  }
 * });
 * //pass multiple transform rules
 * Flip.animate({
 *  selector:'.roll',
 *  duration:2,//2 seconds
 *  infinite:true,// infinite loop
 *  transform{
 *    '&':function(mat){
 *      mat.rotate(Math.PI*2*this.percent).translate(200)
 *    },
 *    '& .rotate':function(mat){
 *      mat.rotate(Math.PI*4*this.percent);
 *    }//two manipulations are irrelevant
 *  }
 * })
 */
/**
 *
 * @callback transformUpdate
 * @param {Flip.Mat3} mat the {@link Flip.Mat3}for manipulation
 * @param {Object} param the calculation param
 */

/**
 * @callback cssUpdate
 * @param {CssProxy} css the {@link CssProxy} for update
 * @param {Object} param the calculation param
*/
Flip.util = {Object: obj, Array: array, inherit: inherit};
function createProxy(obj) {
  var from, result = {}, func, objType = typeof obj;
  if (objType == "function")from = obj.proxy;
  else if (objType == "object") from = obj;
  else from = {};
  func = function () {
    for (var i = 0, v, prop, value, len = arguments.length; i < len; i += 2) {
      prop = arguments[i];
      value = arguments[i + 1];
      if (!from.hasOwnProperty(prop)) {
        v = value;
        delete from[prop];
      }
      else v = from[prop];
      result[prop] = v;
    }
    if(len==1)
      return v;
  };
  func.source = function () {
    if (arguments.length == 1)return from[arguments[0]];
    for (var i = 0, prop, len = arguments.length; i < len; i += 2) {
      prop = arguments[i];
      if (!from.hasOwnProperty(prop))from[prop] = arguments[i + 1];
    }
    return from[arguments[0]];
  };
  func.result = result;
  func.proxy = from;
  return func;
}
function inherit(constructor, baseproto, expando, propertyObj) {
  if (typeof  baseproto == "function")baseproto = new baseproto();
  baseproto = baseproto || {};
  var proto = constructor.prototype = Object.create(baseproto), proDes;
  if (expando)
    for (var i in expando) {
      proDes = Object.getOwnPropertyDescriptor(expando, i);
      if (proDes) Object.defineProperty(proto, i, proDes);
      else
        proto[i] = expando[i];
    }
  if (propertyObj)
    obj.forEach(propertyObj, function (key, value) {
      Object.defineProperty(proto, key, value);
    });
  return constructor;
}

function array(arrayLike) {
  if (!(this instanceof array))return new array(arrayLike);
  if (arrayLike && arrayLike.length)
    for (var i = 0, len = arrayLike.length; i < len; i++)
      this[i] = arrayLike[i];
}
function arrAdd(array, item) {
  var i = array.indexOf(item);
  if (i == -1)
    return !!array.push(item);
  return false;
}
function arrSort(array, func_ProName, des) {
  var compare = arrMapFun(func_ProName);
  return array.sort(des ? function (a, b) {
    return compare(a) < compare(b)
  } : function (a, b) {
    return compare(a) > compare(b)
  });
}
function arrFirst(array, func_ProName) {
  for (var i = 0, item, len = array.length, compare = arrMapFun(func_ProName); i < len; i++)
    if (compare(item = array[i]))return item;
}
function arrRemove(array, item) {
  var i = array.indexOf(item);
  if (i >= 0)
    return !!array.splice(i, 1);
  return false;
}
function arrMapFun(func_ProName) {
  var ct = typeof func_ProName;
  if (ct === "string")return function (item) {
    return item[func_ProName]
  };
  else if (ct === "function")return func_ProName;
  return function (item) {
    return item
  };
}
/*function arrSameSeq(arr, func_ProName, des) {
  if (arr.length == 1)return true;
  var compare = arrMapFun(func_ProName);
  des = !!des;
  for (var i = 1, len = arr.length; i < len; i++)
    if (des != (compare(arr[i]) < compare(arr[i - 1])))return false;
  return true;
}*/
array.remove = arrRemove;
array.add = arrAdd;
array.first = arrFirst;
function mapProName(proNameOrFun) {
  if (typeof proNameOrFun == "function")return proNameOrFun;
  else if (proNameOrFun && typeof proNameOrFun == "string")
    return function (item) {
      return item ? item[proNameOrFun] : undefined;
    };
  else return function (item) {
      return item;
    }
}
function arrFind(array, proNameOrFun, value, unstrict,index) {
  var fun = mapProName(proNameOrFun), i, item;
  if(value===undefined)value=true;
  if (unstrict) {
    for (i = 0, item = array[0]; item; item = array[++i]) if (fun(item) == value)return index? i:item;
  }
  else {
    for (i = 0, item = array[0]; item; item = array[++i]) if (fun(item) === value)return index? i:item;
  }
  return undefined;
}
array.findBy = arrFind;
function arrSafeFilter(array, filter, thisObj) {
  var copy = array.slice();
  if (thisObj == undefined)thisObj = array;
  return copy.filter(filter, thisObj).filter(function (item) {
    return array.indexOf(item) > -1;
  }).concat(array.filter(function (item) {
    return copy.indexOf(item) == -1;
  }));
}
array.safeFilter = arrSafeFilter;
array.sort = arrSort;
inherit(array, Array, {
  add: function (item) {
    return arrAdd(this, item);
  },
  findBy: function (proNameOrFun, value, unstrict) {
    return arrFind(this, proNameOrFun, value, unstrict);
  },
  remove: function (item) {
    return arrRemove(this, item);
  },
  safeFilter: function (callback, thisObj) {
    return arrSafeFilter(this, callback, thisObj);
  },
  first: function (func_proName) {
    return arrFirst(this, func_proName);
  }
});

function obj(from) {
  if (!(this instanceof obj))return new obj(from);
  if (typeof from === "object")
    objForEach(from, function (value, key) {
      var pro;
      if (pro = Object.getOwnPropertyDescriptor(from, key))
        Object.defineProperty(this, key, pro);
      else this[key] = value;
    }, this);
}
function addEventListener(obj, evtName, handler) {
  if (typeof evtName == "string" && evtName && typeof handler == "function") {
    var cbs, hs;
    if (!obj.hasOwnProperty('_callbacks'))obj._callbacks = {};
    cbs = obj._callbacks;
    if (!(hs = cbs[evtName]))hs = cbs[evtName] = [];
    arrAdd(hs, handler);
  }
  return obj;
}
obj.on = addEventListener;
function emitEvent(obj, evtName, argArray, thisObj) {
  var callbacks , handlers;
  if (!(obj.hasOwnProperty('_callbacks')) || !(handlers = (callbacks = obj._callbacks)[evtName]))return false;
  if (!argArray)argArray = [];
  else if (!(argArray instanceof Array)) argArray = [argArray];
  if (thisObj === undefined) thisObj = obj;
  return (callbacks[evtName] = arrSafeFilter(handlers, function (call) {
    return call.apply(thisObj, argArray) != -1;
  })).length;
}
obj.emit = emitEvent;
function removeEventListener(obj, evtName, handler) {
  var cbs, hs;
  if (evtName === undefined)delete obj._callbacks;
  else if ((cbs = obj._callbacks) && (hs = cbs[evtName]) && hs) {
    if (handler) array.remove(hs, handler);
    else delete cbs[evtName];
  }
  return obj;
}
obj.off = removeEventListener;
function addEventListenerOnce(obj, evtName, handler) {
  if (typeof handler == "function")
    obj.on(evtName, function () {
      handler.apply(obj, arguments);
      return -1;
    });
  return obj;
}
obj.once = addEventListenerOnce;
function objForEach(object, callback, thisObj, arg) {
  if (isObj(object)) {
    if (thisObj == undefined)thisObj = object;
    if(object instanceof Array) object.forEach(callback,thisObj);
    else
      for (var i = 0, names = Object.getOwnPropertyNames(object), name = names[0]; name; name = names[++i])
        callback.apply(thisObj, [object[name], name, arg]);
  }
  return object;
}
obj.forEach = objForEach;
inherit(obj, null, {
  on: function (evtName, handler) {
    return addEventListener(this, evtName, handler);
  },
  emit: function (evtName, argArray, thisObj) {
    return emitEvent(this, evtName, argArray, thisObj);
  },
  off: function (evtName, handler) {
    return removeEventListener(this, evtName, handler);
  },
  once: function (evtName, handler) {
    return addEventListenerOnce(this, evtName, handler);
  },
  forEach: function (callback, thisObj, arg) {
    return objForEach(this, callback, thisObj, arg);
  }
});
function cloneFunc(value, key) {
  this[key] = value;
}
function mixObj(){
  var ret={};
  for(var i=0,len=arguments.length;i<len;i++){
    objForEach(arguments[i],cloneFunc,ret)
  }
  return ret;
}
function isFunc(value){return typeof value==="function"}
function isObj(value){return (typeof value==="object") && value}
function noop(){}
if (typeof module !== "undefined" && module.exports)
  module.exports = Flip;
else if(typeof define!=="undefined")define(function(){return Flip});
else if (window) {
  window.Flip = Flip;
}
function CssProxy(obj){
  if(!(this instanceof CssProxy))return new CssProxy(obj);
  this.merge(obj);
}
(function(){
  var p=CssProxy.prototype={
    toString:function(){
     var rules=[];
     objForEach(this,function(value,key){
       rules.push(key.replace(/[A-Z]/g,function(c){return '-'+ c.toLowerCase()})+':'+value);
     });
     return rules.join(';')
   },
    /**
     * combine key with prefixes
     * @param {string} key   css rule name
     * @param {string} value css value
     * @param {Array<String>}[prefixes=['-moz-','-ms-','-webkit-','-o-','']] prefixes to combine
     * @returns {CssProxy} return itself
     * @example
     * css.withPrefix('border-radius','50%')
     * //add css rules: -moz-border-radius,-webkit-border-radius,-ms-border-radius
     */
   withPrefix:function(key,value,prefixes){
     var self=this;
     (prefixes||['-moz-','-ms-','-webkit-','-o-','']).forEach(function(prefix){
       self[prefix+key]=value;
     });
     return self;
   },
    /**
     * combine another css rules
     * @param {CssProxy|Object}obj
     * @returns {CssProxy} return itself
     */
   merge:function(obj){
     if(isObj(obj)&&obj!==this)
       objForEach(obj,cloneFunc,this);
     return this;
   },
    /**
     * format string
     * @param {string} stringTemplate
     * @returns {string}
     * @example
     * function(css,param){
     *  css.boxShadow=css.template('0 0 ${1} ${2} ${3} inset',param.blurBase+param.blurRange,param.spread,param.blurColor);
     *  //instead of
     *  //css.boxShadow='0 0'+param.blurBase+param.blurRange+' '+ param.spread +' '+param.blurColor+' inset';
     * }
     */
   template:function(stringTemplate){
     var arg=arguments,r;
     return stringTemplate.replace(/\{(\d+)\}/g,function($i,i){
       return ((r=arg[i])==undefined)?$i:formatValue(r);
     })
   }
 };

  Flip.stringTemplate=p.t=p.template;
})();
function Render(){
}
inherit(Flip.Render=Render,Flip.util.Object,{
  update:function(){},
  render:function(){},
  invalid:function(){
    var t,p;
    if(t=this._task) t.invalid();
    else if(p=this.parent) p.invalid();
    this._invalid=true;
  }
});
function RenderTask(name) {
  if (!(this instanceof  RenderTask))return new RenderTask(name);
  this.name = name;
  this.timeline = new TimeLine(this);
  this._updateObjs = [];
  this._finalizeObjs=[];
  this._global = null;
}
Flip.RenderTask = RenderTask;
RenderTask.EVENT_NAMES = {
  RENDER_START: 'renderStart',
  RENDER_END: 'renderEnd',
  UPDATE: 'update',
  BEFORE_CONSUME_EVENTS: 'beforeConsumeEvents',
  AFTER_CONSUME_EVENTS: 'afterConsumeEvents'
};
inherit(RenderTask, Flip.util.Object, {
  update:noop,
  invalid: function () {
    var g;
    this._invalid = true;
    if(g=this._global)
      g.invalid();
  },
  toFinalize:function(obj){
   return this._updateObjs.indexOf(obj)>-1 && arrAdd(this._finalizeObjs,obj);
  },
  add: function (obj, type) {
    if (type == 'update') return arrAdd(this._updateObjs, obj);
    if (obj instanceof Clock || obj instanceof Render)
      if(arrAdd(this._updateObjs, obj) && (obj._task = this)){

      }
    this.invalid();
  },
  remove: function (obj) {
    if (obj._task == this && arrRemove(this._updateObjs, obj)){
      obj._task = null;
      this.toFinalize(obj);
      this.invalid();
    }
  }
});
function filterIUpdate(item) {
  if (!isObj(item)||item.disabled)return false;
  else if (isFunc(item.update))
    item.update(this);
  else if (isFunc(item.emit))
    item.emit(RenderTask.EVENT_NAMES.UPDATE, this);
  return true;
}
function TimeLine(task) {
  this.last = this.now = this._stopTime = 0;
  this._startTime = this._lastStop = Date.now();
  this.task = task;
  this._isStop = true;
}
inherit(TimeLine, Flip.util.Object, {
  ticksPerSecond: 1000,
  stop: function () {
    if (!this._isStop) {
      this._isStop = true;
      this._lastStop = Date.now();
    }
  },
  start: function () {
    if (this._isStop) {
      this._isStop = false;
      this._stopTime += Date.now() - this._lastStop;
    }
  },
  move: function () {
    if (!this._isStop) {
      this.last = this.now;
      this.now = Date.now() - this._startTime - this._stopTime;
    }
  }
});
/**
 * @namespace Flip.Animation
 * @param {AnimationOptions} opt
 * @returns {Flip.Animation}
 * @property {number} percent the percentage of the animation [0-1]
 * @property {boolean} finished if the animation is finished
 * @property {Flip.Promise} promise the animation promise for continuation
 * @property {Flip.Clock} clock animation clock for timing
 * @constructor
 */
function Animation(opt) {
  if (!(this instanceof Animation))return new Animation(opt);
  var r = Animation.createOptProxy(opt).result;
  this.selector= r.selector||Error('Elements selector required');
  this.clock = r.clock;
  this.persistAfterFinished= r.persistAfterFinished;
  this._cssMap={};
  this._matCallback={};
  this._cssCallback={};
  this._immutable={};
  this._variable={};
  this._param={};
  this.current={};
  this.use(opt);
  this.init();
}
inherit(Animation,Render,
  /**
   * @lends Flip.Animation.prototype
   */
  {
  get percent(){
    return this.clock.value||0;
  },
  set clock(c) {
    var oc = this._clock;
    c = c || null;
    if (oc == c)return;
    if (oc && c)throw Error('remove the animation clock before add a new one');
    this._clock = c;
    //add a clock
    if (c) {
      c.controller = this;
    }//remove a clock
    else if (oc) {
      oc.controller = null;
    }
  },
  get clock() {
    return this._clock;
  },
  get promise(){
    return this._promise||(this._promise=getPromiseByAni(this));
  },
  get finished() {
    return this._finished;
  },
  get id() {
    if (!this._id)this._id = nextUid('Animation'+this.type);
    return this._id;
  },
  get elements() {
    return Flip.$(this.selector);
  },
    /**
     * mostly you don't need to call this manually
     * @alias Flip.Animation#init
     * @function
     */
  init:function(){
    this._promise=null;
    this._canceled=this._finished=false;
    this.invalid();
  },
    /**
     * reset the animation
     * @alias Flip.Animation#reset
     * @function
     * @return {Flip.Animation} the animation itself
     */
  reset:function(skipInit){
    var clock;
    if(clock=this.clock)
      clock.reset(1);
    if(!skipInit)
      this.init();
    return this;
  },
  use:function(opt){
    useAniOption(this,opt);
    return this;
  },
    /**
     * set the animation calculate parameter
     * @alias Flip.Animation#param
     * @param {string|Object}key
     * @param {?any}value
     * @param {?boolean}immutable is it an immutable param
     * @returns {Flip.Animation}
     * @example
     * ani.param('rotation',Math.PI*2);
     * ani.param({
     *  translateX:100,
     *  translateY:200
     * });
     * // you can use {@link AnimationOptions} to set param when construct
     * Flip({
     *  immutable:{
     *    width:200
     *  },
     *  variable:{
     *    scaleX:2
     *  }
     * })
     */
  param:function(key,value,immutable){
    if(isObj(key))
      cloneWithPro(key,this[value?'_immutable':'_variable']);
    else if(typeof key==="string")
      this[immutable?'_immutable':'_variable'][key]=value;
    return this;
  },
    /**
     * set the animation transform update function
     * @see {@link Flip.Mat3} for matrix manipulation
     * @alias Flip.Animation#transform
     * @param {string|transformUpdate|AnimationTransformOptions}selector
     * @param {transformUpdate}matCallback
     * @returns {Flip.Animation}
     * @example
     * ani.transform(function(mat,param){
     *  mat.translate(param.translateX,param.translateY)
     * });
     * ani.transform('.rotate',function(mat,param){
     *  mat.rotate(param.rotation)
     * });
     * //or set with {@link AnimationOptions}
     * ani.transform({
     *  '&':function(mat){};
     *  '& div':function(mat){};
     * })
     */
  transform:function(selector,matCallback){
    var map=this._matCallback;
    objForEach(normalizeMapArgs(arguments),function(callback,selector){
      addMap(selector,map,callback)
    });
    return this;
  },
    /**
     * set the css update function
     * @alias Flip.Animation#css
     * @param {string|cssUpdate|AnimationCssOptions}selector
     * @param {Object} [mapOrFunc]
     * @returns {Flip.Animation}
     * @see {@link Flip.CssProxy}
     * @example
     * ani.css('&:hover',{fontSize:'larger'});
     * ani.css(function(css,param){
     *  css.withPrefix('border-radius',param.borderRadius);
     * });
     * //set multiple rules
     * ani.css({
     *  '&.invalid':{
     *    backgroundColor:'#333'
     *  },
     *  '&.invalid >*':function(css){
     *    css.opacity=1-this.percent
     *  }
     * })
     */
  css:function(selector,mapOrFunc){
    var map=this._cssCallback;
    objForEach(normalizeMapArgs(arguments),function(callback,selector){
      addMap(selector,map,callback)
    });
    return this;
  },
  update: function (state) {
    updateAnimation(this,state);
  },
  render: function (state) {
    renderAnimation(this,state);
  },
  invalid: function () {
    if (this._task)this._task.invalid();
  },
  finalize:function(){
    var task;
    if(task=this._task)
    {
      this._ltName=task.name;
      task.toFinalize(this);
    }
    else if(!this._canceled) {
      this.reset(1);
      this.emit(ANI_EVT.FINALIZE);
    }
    return this;
  },
  getStyleRule:function(){
    return getAnimationStyle(this);
  },
    /**
     * start the animation, it won't take effect on started animation
     * @returns {Flip.Animation} return itself
     */
  start:function(){
    findTaskToAddOrThrow(this);
    return this._canceled? this.restart():invokeClock(this,'start');
  },
    /**
     * @alias Flip.Animation#resume
     * @param {Object} [evt] trigger event param
     * @returns {Flip.Animation} returns itself
     */
  resume:function(evt){
    return invokeClock(this,'resume',ANI_EVT.RESUME,evt);
  },
    /**
     * @alias Flip.Animation#pause
     * @param {Object} [evt] trigger event param
     * @returns {Flip.Animation} returns itself
     */
  pause:function(evt){
    return invokeClock(this,'pause',ANI_EVT.PAUSE,evt);
  },
    /**
     * @alias Flip.Animation#cancel
     * @param {Object} [evt] trigger event param
     * @returns {Flip.Animation} returns itself
     */
  cancel:function(evt){
    var t;
    if(!this._canceled &&!this._finished){
      if(t=this._task)this._ltName=t.name;
      this._canceled=true;
      this.emit(ANI_EVT.CANCEL,evt);
      this.finalize();
    }
    return this;
  },
    /**
     * @alias Flip.Animation#restart
     * @returns {Flip.Animation} returns itself
     */
  restart:function(opt){
    findTaskToAddOrThrow(this,opt);
    this.clock.reset();
    this.init();
    return this.start();
  },
    /**
     * @alias Flip.Animation#then
     * @param {function} [onFinished] callback when animation finished
     * @param {function} [onerror] callback when animation interrupted
     * @returns {Flip.Promise}
     */
  then:function(onFinished,onerror){
    return this.promise.then(onFinished,onerror);
  }
});
/** triggered when in every frame after animation starts
 * @event Flip.Animation#update  */
/** triggered when animation render new frame
 * @event Flip.Animation#render  */
/** triggered when animation ends
 * @event Flip.Animation#finish  */
/** triggered when animation is finalized
 * @event Flip.Animation#finilize  */
/** triggered when animation is canceled
 * @event Flip.Animation#cancel  */
/** triggered when animation is paused
 * @event Flip.Animation#pause   */
/** triggered when animation is resumed from pause
 * @event Flip.Animation#resume  */
var ANI_EVT=Animation.EVENT_NAMES =Object.seal({
  UPDATE: 'update',
  FINALIZE: 'finalize',
  RENDER: 'render',
  FINISH: 'finish',
  CANCEL:'cancel',
  PAUSE:'pause',
  RESUME:'resume'
});
function findTaskToAddOrThrow(ani,opt){
  var t,global;
  if(!(t=ani._task)){
    opt=opt||{};
    t=opt.task||(global=opt.global||FlipScope.global).getTask(opt.taskName||ani._ltName)||global.defaultTask;
    if(t instanceof RenderTask)
      t.add(ani);
    else
      throw Error('please specify the render task for animation to restart');
  }return t;
}
function invokeClock(animation,method,evtName,evtArg){
  var clock=animation.clock;
  if(clock){
    clock[method]();
    if(evtName) animation.emit(evtName,evtArg);
  }
  return animation;
}
function getPromiseByAni(ani){
  return FlipScope.Promise(function(resolve,reject){
    ani.once(ANI_EVT.FINISH,function(state){
      if(state&&state.global)
        state.global.once('frameEnd',go);
      else go();
    }).once(ANI_EVT.CANCEL,function(){reject(ani)});
    function go(){resolve(ani);}
  });
}
function cloneWithPro(from,to){
  var pro,getter;
  to=to||{};
  objForEach(from,function(value,key){
    if((pro=Object.getOwnPropertyDescriptor(from,key))&&(typeof (getter=pro.get)=="function"))
      Object.defineProperty(to,key,{get:getter});
    else to[key]=value
  });
  return to;
}
Animation.createOptProxy = function (setter,selector,persist) {
  setter = createProxy(setter);
  if (!setter.proxy.clock)
    setter('clock', new Clock(setter));
  setter('selector',selector);
  setter('persistAfterFinished',persist);
  return setter;
};
/**
 * construct an animation instance see {@link AnimationOptions}
 * you can also construct an animation by {@link Flip.Animation}
 * @function
 * @param {AnimationOptions} opt
 * @memberof Flip
 * @return {Flip.Animation}
 * @example
 * //start animation when dom ready
 * Flip(function(){
 *  //imitate 3D rotateZ
 *  Flip.animate({
 *     selector:'.double-face',
 *    duration:.8,
 *    autoReverse:true,
 *    iteration:2,
 *    immutable:{
 *      width:150
 *    },
 *    variable:{
 *      rotation:Math.PI,// every frame,it will refresh the param.rotation from 0 to Math.PI
 *      showFront:function(percent){
 *        //if it rotate to back end the front end will not display
 *        return percent <= 0.5
 *      }
 *    },
 *    css:{
 *      '&,& div':function(css,param){
 *        css.width=css.height=param.width+'px';
 *      },
 *      '& .front':function(css,param){
 *        css.display=param.showFront? 'block':'none';
 *        css.backgroundColor='orange';
 *      },
 *      '& .back':function(css,param){
 *        css.display=!param.showFront? 'block':'none';
 *        css.backgroundColor='yellow';
 *      }
 *    },
 *    transform:{
 *     '&':function(mat,param){
 *        mat.flip(param.rotation);
 *      }
 *    }
 *  })
 * });
 */
function animate(opt) {
  if (isObj(opt)) {
    var  constructor = Flip.animation[arguments[0].animationType];
    opt = arguments[0];
  }
  else throw Error('cannot construct an animation');
  if (!constructor) constructor = Animation;
  return setAniEnv(animate.createOptProxy(opt).result, new constructor(opt));
  }
function setAniEnv(aniOpt, animation) {
  (aniOpt.renderGlobal||FlipScope.global).getTask(aniOpt.taskName,true).add(animation);
  if(aniOpt.autoStart!==false)
    animation.start();
  return animation;
}
animate.createOptProxy = function (setter, autoStart, taskName, defaultGlobal) {
    setter = createProxy(setter);
    setter('autoStart', autoStart, 'taskName', taskName, 'renderGlobal', defaultGlobal);
    return setter;
};

Flip.animate = animate;
/**
 * set css style immediately,you can cancel it later
 * @param {string|AnimationCssOptions} selector
 * @param {?Object} rule
 * @memberof Flip
 * @returns {function} cancel the css style
 * @example
 * var cancel=Flip.css('.content',{
 *  width:document.documentElement.clientWidth+'px',
 *  height:document.documentElement.clientHeight+'px'
 * });
 *  //cancel the style 2s later
 *  setTimeout(cancel,2000);
 *  // you can pass multiple style rules
 *  Flip.css({
 *    body:{
 *      margin:0
 *    },
 *    '.danger':{
 *       color:'red',
 *       borderColor:'orange'
 *    }
 *  })
 */
Flip.css=function(selector,rule){
  var literal=[];
  if(arguments.length==2){
    resolve(rule,selector);
  }
  else if(isObj(selector)){
    objForEach(selector,resolve)
  }
  else throw Error('argument error');
  return FlipScope.global.immediate(literal.join('\n'));
  function resolve(rule,selector){
    var str=getStyleRuleStr(resolveCss(rule),selector,'\n',1);
    if(str)literal.push(str);
  }
};
/**
 * set transform style immediately
 * @param {string|AnimationTransformOptions} selector
 * @param {?Object|Flip.Mat3} rule
 * @memberof Flip
 * @returns {function} cancel the css style
 * @example
 * Flip.transform('.scale',Flip.Mat3().scale(0.5))
 */
Flip.transform=function(selector,rule){
  var matMap={},literal=[];
  if(arguments.length==2)
    warpMatrix(rule,selector);
  else if(isObj(selector))
    objForEach(selector,warpMatrix);
  else throw Error('argument error');
  objForEach(matMap,function(mat,selector){
    literal.push(selector,'{','transform:'+mat,'}')
  });
  return FlipScope.global.immediate(literal.join('\n'));
  function warpMatrix(val,selector){
    var mat;
    if(isFunc(val)) mat=val(mat=new Mat3())||mat;
    else if(val instanceof Mat3) mat=val;
    else mat=new Mat3(val);
    matMap[selector]=mat;
  }
};
Flip.animation = (function () {
  function register(definition) {
    var beforeCallBase, name = definition.name, Constructor,afterCallBase;
    beforeCallBase = definition.beforeCallBase || _beforeCallBase;
    Constructor = function (opt) {
      if (!(this instanceof Constructor))return new Constructor(opt);
      var proxy = createProxy(opt);
      beforeCallBase.apply(this, [proxy, opt]);
      Animation.call(this,opt);
      (definition.afterInit||noop).call(this,proxy,opt);
    };
    if (name) {
      register[name] = Constructor;
      Constructor.name = name;
    }
    inherit(Constructor, Animation.prototype,{
      type:definition.name,
      use:function(opt){
        return useAniOption(this,definition,opt);
      }
    });
    return Constructor;
  }
  return register;
  function _beforeCallBase(proxy, opt, definition) {
    return proxy;
  }
})();
function useAniOption(animation){
  for(var i= 1,opt=arguments[1],optPro;opt;opt=arguments[++i])
  {
    useAniOption.pros.forEach(function(proName){
      if(isFunc(optPro=opt[proName]))
        animation[proName](optPro);
      else if(isObj(optPro)){
        hasNestedObj(optPro)? objForEach(optPro,function(rule,slt){animation[proName](slt,rule)})
          :animation[proName](optPro);
      }});
    animation.param(opt.param).param(opt.variable).param(opt.immutable,true);
  }
  return animation;
}
useAniOption.pros=['transform','css','on','once'];
function normalizeMapArgs(args){
  var ret={},arg;
  if(args.length==2){
    ret[args[0]]=args[1];
  }
  else if(isFunc(arg=args[0])||!hasNestedObj(arg)){
    ret['&']=arg;
  }
  else if(!isObj(arg)) throw Error('argument Error');
  //isNestedObj
  else{
    ret=arg;
  }
  return ret;
}
function hasNestedObj(obj){
  return isObj(obj)&&Object.getOwnPropertyNames(obj).some(function(key){
      var t=typeof obj[key];
      return t=="object"||t=="function"
    });
}
Flip.Animation=Animation;


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
(function (Flip) {
  function $(slt, ele) {
    var r = [], root = ele || document;
    if (slt)
      slt.split(',').forEach(function (selector) {
        r.push.apply(r, r.slice.apply(root.querySelectorAll(selector)))
      });
    return r;
  }

  Flip.$ = Flip.$ = $;
  document.addEventListener('DOMContentLoaded', function () {
    var funcs=FlipScope.readyFuncs;
    FlipScope.global.init();
    FlipScope.readyFuncs = null;
    funcs.forEach(function (callback) {
      callback(Flip);
    });

  });
})(Flip);

function RenderGlobal(opt) {
  if(!(this instanceof RenderGlobal))return new RenderGlobal(opt);
  opt=opt||{};
  this._tasks = {};
  this._defaultTaskName=opt.defaultTaskName||'default';
  this._invalid=true;
  this._persistStyles={};
  this._persistElement=document.createElement('style');
  this._styleElement=document.createElement('style');
}
Flip.RenderGlobal = RenderGlobal;
RenderGlobal.EVENT_NAMES = {
  FRAME_START: 'frameStart',
  FRAME_END: 'frameEnd',
  UPDATE: 'update'
};
inherit(RenderGlobal, Flip.util.Object, {
  get defaultTask(){
    var taskName=this._defaultTaskName,t=this._tasks[taskName];
    if(!t)this.add(t=new RenderTask(taskName));
    return t;
  },
  getTask:function(name,createIfNot){
    if(!name)return this.defaultTask;
    var r=this._tasks[name];
    if(!r&&createIfNot) {
      r=new RenderTask(name);
      this.add(r)
    }
    return r;
  },
  add: function (obj) {
    var task, taskName, tasks;
    if (obj instanceof RenderTask) {
      if (!(taskName = obj.name))
        throw Error('task must has a name');
      else if ((tasks=this._tasks).hasOwnProperty(taskName))
        throw Error('contains same name task');
      else if (tasks[taskName]=obj) {
        obj._global=this;
        obj.timeline.start();
        return this.invalid();
      }
    }
    else if (obj instanceof Render || obj instanceof Clock)
      return this.defaultTask.add(obj);
    return false;
  },
  immediate:function(style){
    var styles=this._persistStyles,uid=nextUid('immediateStyle'),self=this,cancel;
    styles[uid]=style;
    cancel=function cancelImmediate(){
      var style=styles[uid];
      delete styles[uid];
      self._persistStyle=false;
      return style;
    };
    cancel.id=uid;
    this._persistStyle=false;
    return cancel;
  },
  refresh:function(){
    this._foreceRender=true;
  },
  init: function () {
    if(typeof window==="object"){
      var head=document.head,self=this;
      if(!this._styleElement.parentNode){
        head.appendChild(this._styleElement);
        head.appendChild(this._persistElement);
      }
      Flip.fallback(window);
      window.addEventListener('resize',function(){self.refresh()});
      this.loop();
    }
    this.init = function () {
      console.warn('The settings have been initiated,do not init twice');
    };
  },
  invalid:function(){
    return this._invalid=true;
  },
  loop: function (element) {
    loopGlobal(this);
    window.requestAnimationFrame(this.loop.bind(this), element||window.document.body);
  },
  apply:function(){
    if(!this._persistStyle){
      var styles=[];
      objForEach(this._persistStyles,function(style){styles.push(style);});
      this._persistElement.innerHTML=styles.join('\n');
      this._persistStyle=true;
    }
  },
  createRenderState: function () {
    return {global: this, task:null,styleStack:[],forceRender:this._foreceRender}
  }
});
FlipScope.global = new RenderGlobal();



function Mat3(arrayOrX1,y1,dx,x2,y2,dy){
  if(!(this instanceof Mat3))return new Mat3(arrayOrX1,y1,dx,x2,y2,dy);
  var eles;
  if(arrayOrX1==undefined)eles=[1,0,0,0,1,0,0,0,1];
  else if(y1==undefined)eles=arrayOrX1;
  else eles=[arrayOrX1,y1,0,x2,y2,dx,dy,1];
  this.elements=new Float32Array(eles);
}

var sin=Math.sin,cos=Math.cos,tan=Math.tan,map2DArray=(function(){
  var seq=[0,1,3,4,6,7];
  function getFloat(d) {
    return (+d).toFixed(5);
  }
  return function(eles){
    return seq.map(function(i){return getFloat(eles[i])})
  }
})();
Flip.Mat3=Mat3;
function defaultIfNaN(v,def){
  var ret=+v;
  return isNaN(ret)?def:ret;
}
/**
 * @alias Flip.Mat3.prototype
 */
Mat3.prototype={
  /**
   * print the matrix elements
   * @alias Flip.Mat3#print
   * @returns {string}
   */
  print:function(){
    var e=this.elements,ret=[];
    for(var i=0;i<3;i++){
      for(var j=0;j<3;j++)
        ret.push(e[j+i*3].toFixed(2));
      ret.push('\n')
    }
    return ret.join(' ');
  },
  reset:function(arr){
    this.elements=new Float32Array(arr);
    return this;
  },
  /**
   * set element value
   * @param {number}col column index (from 0 to 2)
   * @param {number}row row index (from 0 to 2)
   * @param {number}value
   * @returns {Flip.Mat3} itself
   */
  set:function(col,row,value){
    this.elements[col*3+row]=value;
    return this;
  },
  /**
   * matrix multiplication
   * @param {Flip.Mat3|Array} matOrArray
   * @returns {Flip.Mat3} itself
   */
  concat:function(matOrArray){
    var other=matOrArray instanceof Mat3? matOrArray.elements:matOrArray;
    return multiplyMat(this,other);
  },
  /**
   *
   * @param {number} rotationX
   * @param {number} rotationY
   * @returns {Flip.Mat3} itself
   */
  axonProject:function(rotationX,rotationY){
    rotationX=rotationX||0;rotationY=rotationY||0;
    var cosX=cos(rotationX),sinX=sin(rotationX),cosY=cos(rotationY),sinY=sin(rotationY);
    return multiplyMat(this,[cosY,sinX*sinY,0,0,cosX,0,sinY,-cosY*sinX,0],1)
  },
  /**
   *
   * @param {number} rV
   * @param {number} rH
   * @returns {Flip.Mat3} itself
   */
  obliqueProject:function(rV,rH){
    rH=rH||0;rV=rV||0;
    var s=1/tan(rV),sSin=sin(rH)*s,sCos=cos(rH)*s;
    return multiplyMat(this,[1,0,0,0,1,0,sCos,sSin,0],1)
  },
  toString: function(){
    return 'matrix('+map2DArray(this.elements).join(',')+')'
  },
  /**
   * use matrix for canvas2d context
   * @param {CanvasRenderingContext2D} ctx
   * @returns {Flip.Mat3} itself
   */
  applyContext2D:function(ctx){
    ctx.transform.apply(ctx,map2DArray(this.elements));
    return this
  },
  /**
   * construct a matrix with the same elements (deep clone)
   * @returns {Flip.Mat3}
   */
  clone:function(){
    return new Mat3(this.elements);
  },
  /**
   * @param {number} [x=1]
   * @param {number} [y=1]
   * @returns {Flip.Mat3} itself
   */
  scale:function(x,y){
    return multiplyMat(this,[defaultIfNaN(x,1),0,0,0,defaultIfNaN(y,1),0,0,0,1]);
  },
  /**
   *
   * @param {number} angleX
   * @param {number} angleY
   * @returns {Flip.Mat3} itself
   */
  skew:function(angleX,angleY){
    return multiplyMat(this,[1,tan(angleX),0,tan(angleY),1,0,0,1])
  },
  transform:function(m11,m12,m21,m22,dx,dy){
    return multiplyMat(this,[m11,m21,0,m12,m22,0,dx||0,dy||0,1])
  },
  /**
   *
   * @param {number} [x=0]
   * @param {number} [y=0]
   * @param {number} [z=0]
   * @returns {Flip.Mat3} itself
   */
  translate:function(x,y,z){
    return multiplyMat(this,[1,0,0,0,1,0,x||0,y||0,z||0])
  },
  /**
   *
   * @param {number} angle
   * @param {boolean}[horizontal]
   * @returns {Flip.Mat3} itself
   */
  flip:function(angle,horizontal){
    var sinA = sin(angle), cosA = cos(angle);
    return multiplyMat(this,horizontal?[1,0,0,-sinA,cosA,0,0,0,1]:[cosA,sinA,0,0,1,0,0,0,1]);
  },
  /**
   *
   * @param {number} angle
   * @returns {Flip.Mat3} itself
   */
  rotate:function(angle){
    return this.rotateZ(angle);
  },
  /**
   *
   * @param {number} angle
   * @returns {Flip.Mat3} itself
   */
  rotateX:function(angle){
    var sina=sin(angle),cosa=cos(angle);
    return multiplyMat(this,[1,0,0,0,cosa,sina,0,-sina,cosa]);
  },
  /**
   *
   * @param {number} angle
   * @returns {Flip.Mat3} itself
   */
  rotateY:function(angle){
    var sina=sin(angle),cosa=cos(angle);
    return multiplyMat(this,[cosa,0,-sina,0,1,0,sina,0,cosa])
  },
  /**
   *
   * @param {number} angle
   * @returns {Flip.Mat3} itself
   */
  rotateZ:function(angle){
    var sina=sin(angle),cosa=cos(angle);
    return multiplyMat(this,[cosa,sina,0,-sina,cosa,0,0,0,1])
  }
};
function multiplyMat(mat,other,reverse){
  var a=other,b=mat.elements,out=b;
  if(reverse){
    b=other;
    a=out=mat.elements;
  }
  else{
    a=other;
    b=out=mat.elements;
  }
   var a00 = a[0], a01 = a[1], a02 = a[2],
    a10 = a[3], a11 = a[4], a12 = a[5],
    a20 = a[6], a21 = a[7], a22 = a[8],

    b00 = b[0], b01 = b[1], b02 = b[2],
    b10 = b[3], b11 = b[4], b12 = b[5],
    b20 = b[6], b21 = b[7], b22 = b[8];

  out[0] = a00*b00+a01*b10+a02*b20;
  out[1] = a00*b01+a01*b11+a02*b21;
  out[2] = a00*b02+a01*b12+a02*b22;

  out[3] = a10*b00+a11*b10+a12*b20;
  out[4] = a10*b01+a11*b11+a12*b21;
  out[5] = a10*b02+a11*b12+a12*b22;

  out[6] = a20*b00+a21*b10+a22*b20;
  out[7] = a20*b01+a21*b11+a22*b21;
  out[8] = a20*b02+a21*b12+a22*b22;
  return mat;
}
/**
 * @tutorial use-matrix
 */
(function(Flip){
  var strictRet=true,syncEnqueue;
  function enqueue(callback){
   syncEnqueue? callback():setTimeout(callback,0);
  }
  function Thenable(opt){
    if(!(this instanceof Thenable))return new Thenable(opt);
    this.then=opt.then;
    this.get=opt.get;
  }
  function castToPromise(value){
    if(value instanceof Animation)return value.promise;
    else if(value instanceof Array)return Promise.all(value.map(castToPromise));
    else if(likePromise(value))return value;
    throw Error('cannot cast to promise');
  }
  function resolvePromise(future){
    if(likePromise(future))return future;
    return new Thenable({
      then:function resolved(callback){
        try{
          return resolvePromise(castToPromise(acceptAnimation(callback(future))));
        }
        catch (ex){
          return rejectPromise(ex);
        }
      },
      get:function (proName){
        return proName? future[proName]:future;
      }
    })
  }
  function rejectPromise(reason){
    if(likePromise(reason))return reason;
    return new Thenable({
      then: function rejected(callback,errorback){
        try{
          return resolvePromise(errorback(reason));
        }
        catch (ex){
          return rejectPromise(ex);
        }
      }
    })
  }

  /**
   * @namespace Flip.Promise
   * @param {function|Flip.Animation|AnimationOptions} resolver
   * @returns {Thenable}
   * @constructor
   */
  function Promise(resolver){
    if(!(this instanceof Promise))return new Promise(resolver);
    var resolvedPromise,pending=[],ahead=[],resolved;
    if(typeof resolver==="function")
        resolver(resolve,reject);
    else
      return acceptAnimation(resolver);
    function resolve(future){
      try{
        receive(acceptAnimation(future));
      }
      catch (ex){
        receive(undefined,ex);
      }
    }
    function reject(reason){
      receive(undefined,reason||new Error(''));
    }
    function receive(future,reason){
      if(!resolved){
        resolvedPromise=reason==undefined?resolvePromise(future):rejectPromise(reason);
        resolved=true;
        for(var i= 0,len=pending.length;i<len;i++)
        {
          enqueue(function(args,con){
            return function(){
              var ret=resolvedPromise.then.apply(resolvedPromise,args);
              if(con)ret.then.apply(ret,con);
            }
          }(pending[i],ahead[i]))
        }
        pending=ahead=undefined;
      }
    }
    function next(resolve,reject){
      ahead.push([resolve,reject]);
    }
    return new Thenable({
      then:function(thenable,errorBack){
        var _success=ensureThenable(thenable,function(v){return v}),
          _fail=ensureThenable(errorBack,function(e){throw e});
        if(resolvedPromise){
          enqueue(function(){resolvedPromise.then(_success,_fail); });
          return new Promise(function(resolver){resolvedPromise.then(resolver); })
        }
        else{
          pending.push([_success,_fail]);
          return new Promise(function(resolve,reject){next(resolve,reject);})
        }
      },
      get:function(proname){
        return resolvedPromise? resolvedPromise.get(proname):undefined;
      }
    })
  }
  function ensureThenable(obj,def){
    var t;
    if((t=typeof obj)==="object")
      return function(){return obj;};
    else if(t==="function")return obj;
    return def;
  }
  function acceptAnimation(obj){
    var t,ani;
    if(strictRet){
      if(obj instanceof Animation)return obj._finished? obj:obj.promise;
      if((t=typeof obj)=="object"){
        if(likePromise(obj))return obj;
        else if(obj instanceof Array)
          return obj.map(acceptAnimation);
        else{
          ani=Flip.animate(obj);
          return ani.promise;
        }
      }
      else if(typeof t==="function")
        return acceptAnimation(obj());
      throw Error('cannot cast to animation');
    }
    return obj;
  }
  function likePromise(obj){return obj instanceof Thenable}
  function promiseAll(promises){
    return new Promise(function(resolve,reject){
      var fail,num,r=new Array(num=promises.length);
      promises.forEach(function(promise,i){
        promise.then(function(pre){
          check(pre,i);
        },function(err){
          check(err,i,true);
        })
      });
      function check(value,i,error){
        if(!error){
          try{
            r[i]=value instanceof Animation? value:acceptAnimation(value);
          }
          catch (ex){
            error=ex;
         }
        }
        if(error){
          fail=true;
          r[i]=error;
        }
        if(num==1)fail? reject(r):resolve(r);
        else num--;
      }
    })
  }

  /**
   * continue when all promises finished
   * @memberof Flip.Promise
   * @param {Array<Flip.Promise|AnimationOptions|function>}
   * @returns Flip.Promise
   */
  Promise.all=promiseAll;
  /**
   * @memberof Flip.Promise
   * @returns {{resolve:function,reject:function,promise:Flip.Promise}}
   */
  Promise.defer=function(){
    var defer={};
    defer.promise=Promise(function(resolver,rejector){
       defer.resolve=resolver;
       defer.reject=rejector;
    });
    return defer;
  };
  Promise.option=function(opt){
    if(!opt)return;
    strictRet=!!opt.acceptAnimationOnly;
    syncEnqueue=!!opt.sync;
  };
  FlipScope.Promise=Flip.Promise=Promise;
})(Flip);
function loopGlobal(global){
  var state = global.createRenderState();
  global.emit(RenderGlobal.EVENT_NAMES.FRAME_START, [state]);
  updateGlobal(global,state);
  renderGlobal(global,state);
  global.emit(RenderGlobal.EVENT_NAMES.FRAME_END, [state]);
}
function updateGlobal(global,state){
  state.global.emit(RenderGlobal.EVENT_NAMES.UPDATE, [state,global]);
  objForEach(global._tasks,function(task){updateTask(task,state)});
  global.apply();
}
function updateTask(task,state){
  if(!task.disabled){
    var updateParam = [state, state.task=task];
    (state.timeline = task.timeline).move();
    task.update(state);
    task.emit(RenderTask.EVENT_NAMES.UPDATE, updateParam);
    task._updateObjs = arrSafeFilter(task._updateObjs, filterIUpdate, state);
  }
}
function renderGlobal(global,state){
  if(global._invalid||state.forceRender){
    objForEach(global._tasks,function(task){renderTask(task,state);});
    global._styleElement.innerHTML=state.styleStack.join('\n');
    FlipScope.forceRender=global._invalid=false;
  }
  objForEach(global._tasks,function(task){finalizeTask(task,state)});
}
function renderTask(task,state){
  if(!task.disabled){
    var evtParam = [state, state.task=task];
    if (task._invalid||state.forceRender) {
      task.emit(RenderTask.EVENT_NAMES.RENDER_START, evtParam);
      task._updateObjs.forEach(function (item) {if(isFunc(item.render)&&!item.disabled)item.render(state);});
      task._invalid = false;
    }
    task.emit(RenderTask.EVENT_NAMES.RENDER_END, evtParam);
  }
}
function finalizeTask(task,state){
  var taskItems=(state.task=task)._updateObjs,index,finItems=task._finalizeObjs;
  if(finItems.length){
    task.invalid();
    finItems.forEach(function(item){
      if((index=taskItems.indexOf(item))!=-1)
        taskItems[index]=null;
      if(item._task==task)
        item._task=null;
      isObj(item)&&isFunc(item.finalize)&&item.finalize(state);
    });
    task._finalizeObjs=[];
  }
}
function finalizeAnimation(animation){
  if(!animation.persistAfterFinished){
    animation.finalize();
  }
}

function updateAnimation(animation,renderState){
  var clock=animation.clock;
  renderState.animation=animation;
  if(updateClock(clock,renderState)){
    animation.invalid();
    updateAnimationParam(animation);
    animation.emit(ANI_EVT.UPDATE, renderState);
  }
  if(clock.finished){
    //trigger finished event after render
    animation._finished=true;
    finalizeAnimation(animation);
  }
  renderState.animatetion=null;
  return true;
}

function renderAnimation(ani,state){
  state.animation = ani;
  updateAnimationCss(ani);
  state.styleStack.push(getAnimationStyle(ani));
  ani.emit(ANI_EVT.RENDER, state);
  if(ani._finished)ani.emit(ANI_EVT.FINISH,state);
  state.animation = null;
}
function updateAnimationParam(animation){
  var p=animation.percent,cur=animation.current=Object.create(animation._immutable);
  objForEach(animation._variable,function(value,key){
    cur[key]=isFunc(value)? value(p,cur):(isNaN(value)?value:p*value);
  });
}
function updateAnimationCss(animation){
  var cssMap=animation._cssMap={},cssRule,cur=animation.current;
  objForEach(animation._cssCallback,function(cbs,selector){
    cssRule=new CssProxy();
    cbs.forEach(function(cb){resolveCss(cb,animation,cssRule,cur)});
    mergeRule(cssMap,selector,cssRule);
  });
  objForEach(animation._matCallback,function(cbs,selector){
    var mat=new Mat3(),arg=[mat,cur];
    cssRule=new CssProxy();
    cbs.forEach(function(cb){mat=cb.apply(animation,arg)||mat});
    cssRule.withPrefix('transform',mat.toString());
    mergeRule(cssMap,selector,cssRule);
  });
}
function resolveCss(rule,thisObj,cssContainer,e){
  var ret=cssContainer||new CssProxy(),arg=[ret,e];
  if(isObj(rule))
    objForEach(rule,cloneFunc,ret);
  else if(isFunc(rule))
     ret=rule.apply(thisObj,arg)||ret;
  return ret;
}
function formatValue(value){
  return isNaN(value)? value:Number(value).toFixed(5).replace(/\.0+$/,'')
}
function formatKey(key){
  return key.replace(/[A-Z]/g,function(c){return '-'+ c.toLowerCase()})
}
function getStyleRuleStr(ruleObj,selector,separator,ignoreEmpty){
  var rules=[];
  objForEach(ruleObj,function(value,key){
    rules.push(formatKey(key)+':'+formatValue(value)+';');
  });
  if(!rules.length&&ignoreEmpty)return '';
  separator=separator||'\n';
  return selector +'{'+separator+rules.join(separator)+separator+'}';
}
function addMap(key,Map,cb){
  var cbs=Map[key];
  if(!cbs)Map[key]=[cb];
  else arrAdd(cbs,cb);
}
function getAnimationStyle(ani){
  var styles=[],slt=ani.selector||'';
  objForEach(ani._cssMap,function(ruleObj,selector){
    styles.push(getStyleRuleStr(ruleObj,selector.replace(/&/g,slt)));
  });
  return ani.lastStyleRule=styles.join('\n');
}
function mergeRule(map,selector,cssContainer){
  var oriRule=map[selector];
  if(oriRule)oriRule.merge(cssContainer);
  else map[selector]=cssContainer;
}
Flip.RenderGlobal = RenderGlobal;
function RenderGlobal(opt) {
  if(!(this instanceof RenderGlobal))return new RenderGlobal(opt);
  opt=opt||{};
  this._tasks = {};
  this._defaultTaskName=opt.defaultTaskName||'default';
  this._invalid=true;
  this._persistStyles={};
  this._persistElement=document.createElement('style');
  this._styleElement=document.createElement('style');
}
RenderGlobal.EVENT_NAMES = {
  FRAME_START: 'frameStart',
  FRAME_END: 'frameEnd',
  UPDATE: 'update'
};
inherit(RenderGlobal, Flip.util.Object, {
  get defaultTask(){
    var taskName=this._defaultTaskName,t=this._tasks[taskName];
    if(!t)this.add(t=new RenderTask(taskName));
    return t;
  },
  getTask:function(name,createIfNot){
    if(!name)return this.defaultTask;
    var r=this._tasks[name];
    if(!r&&createIfNot) {
      r=new RenderTask(name);
      this.add(r)
    }
    return r;
  },
  add: function (obj) {
    var task, taskName, tasks;
    if (obj instanceof RenderTask) {
      if (!(taskName = obj.name))
        throw Error('task must has a name');
      else if ((tasks=this._tasks).hasOwnProperty(taskName))
        throw Error('contains same name task');
      else if (tasks[taskName]=obj) {
        obj._global=this;
        obj.timeline.start();
        return this.invalid();
      }
    }
    else if (obj instanceof Animation || obj instanceof Clock)
      return this.defaultTask.add(obj);
    return false;
  },
  immediate:function(style){
    var styles=this._persistStyles,uid=nextUid('immediateStyle'),self=this,cancel;
    styles[uid]=style;
    cancel=function cancelImmediate(){
      var style=styles[uid];
      delete styles[uid];
      self._persistStyle=false;
      return style;
    };
    cancel.id=uid;
    this._persistStyle=false;
    return cancel;
  },
  refresh:function(){
    this._foreceRender=true;
  },
  init: function () {
    if(typeof window==="object"){
      var head=document.head,self=this;
      if(!this._styleElement.parentNode){
        head.appendChild(this._styleElement);
        head.appendChild(this._persistElement);
      }
      Flip.fallback(window);
      window.addEventListener('resize',function(){self.refresh()});
      this.loop();
    }
    this.init = function () {
      console.warn('The settings have been initiated,do not init twice');
    };
  },
  invalid:function(){
    return this._invalid=true;
  },
  loop: function (element) {
    loopGlobal(this);
    window.requestAnimationFrame(this.loop.bind(this), element||window.document.body);
  },
  apply:function(){
    if(!this._persistStyle){
      var styles=[];
      objForEach(this._persistStyles,function(style){styles.push(style);});
      this._persistElement.innerHTML=styles.join('\n');
      this._persistStyle=true;
    }
  },
  createRenderState: function () {
    return {global: this, task:null,styleStack:[],forceRender:this._foreceRender}
  }
});
FlipScope.global = new RenderGlobal();


var nextUid=(function(map){
  return function (type){
    if(!map[type])map[type]=1;
    return map[type]++;
  }
})({});
Flip.animation({
  name: 'flip',
  immutable:{
    vertical:true
  },
  variable: {
    angle: Math.PI
  },
  beforeCallBase: function (proxy) {
    proxy.source('ease', Clock.EASE.sineInOut);
  },
  transform:function(mat,param){
    mat.flip(param.angle,!param.vertical);
  },
  css:{
    '&':{'transform-origin':'center'}
  }
});
(function (register) {
  function formatMoney(n, c, d, t) {
    var s = n < 0 ? "-" : "", i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j;
    j = (j = i.length) > 3 ? j % 3 : 0;
    c = isNaN(c = Math.abs(c)) ? 2 : c;
    d = d == undefined ? "." : d;
    t = t == undefined ? "," : t;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
  }

  function mapValue(ele) {
    var v = ele.innerHTML || ele.value, d = v.replace(/\,|[^\d\.]/g, '');
    ele.unit = v.replace(/.*\d(.*)/, '$1');
    return parseFloat(d);
  }

  function applyValue(ele, value, prec) {
    ele.innerHTML = ele.value = prec == -1 ? value + ele.unit : formatMoney(value, prec).replace(/\.0+$/, '');
  }

  register(
    {
      name: 'increase',
      beforeCallBase: function (proxy) {
        var eles = proxy.source('elements', Flip.$(proxy.source('selector')));
        this.targets = eles.map(mapValue);
        proxy.source('duration', 1.2);
      },
      param: {
        fracPrecision: 1
      },
      prototype: {
        apply: function () {
          var v = this.clock.value, targets = this.targets, precition = this.finished ? -1 : this.fracPrecision;
          this.elements.forEach(function (ele, i) {
            applyValue(ele, targets[i] * v, precition);
          });
        }
      }
    }
  )
})(Flip.animation);
Flip.animation({
  name:'polygon',
  variable:{
    rotateY:Math.PI*2,
    faceTranslate:0
  },
  immutable:{
    projectY:Math.PI/6,
    projectX:Math.PI/6,
    faceWidth:100,
    faceHeight:100,
    faceCount:4
  },
  css:{
    '&':{
      position:'relative'
    }
  },
  afterInit:function(proxy){
    var imm=this._immutable, n=imm.faceCount,self=this,faceClass=proxy('faceClass')||'f';
    var faceRotate=Math.PI*2/ n,dz=-imm.faceWidth/2/Math.tan(faceRotate/2),rotateY=this._variable.rotateY|| 0,ryFunc,lastAngle,indices;
    ryFunc=typeof rotateY=="number"?function(p){return rotateY*p}:rotateY;
    for(var i=0;i<n;i++)
      registerFace(i);
    this.param('zIndices',function(p){
      var ry=ryFunc(p),ret=[],rf=faceRotate,min=1,max=-1;
      if(lastAngle&&Math.abs(lastAngle-ry)<rf)return indices;
      for(var i= 0,v;i<n;i++){
        v=ret[i]=Math.cos(ry+rf*i);
        if(v<=min)min=v;
        if(v>=max)max=v;
      }
      var range=max-min;
      return indices= ret.map(function(num){
        return Math.round((num-min)/range*6);
      })
    });
    Flip.$(proxy('selector')+'> *[class]').forEach(function(ele){
      ele.className+=' '+faceClass;
    });
    this.css('& .'+faceClass,{
      width:imm.faceWidth+'px',
      height:imm.faceHeight+'px',
      position:'absolute',
      transformOrigin:'center'
    });
    function registerFace(index){
      var selector='& .'+faceClass+index,fR=faceRotate*i;
      self.css(selector,function(css,param){
        css.zIndex=param.zIndices[index]});
      self.transform(selector,function(mat,param){
        mat.rotateY(fR).translate(0,0,dz-param.faceTranslate).axonProject(param.projectX,param.projectY+param.rotateY)
      })
    }
  }
});
Flip.animation({
  name: 'rotate',
  variable: {
    angle: Math.PI * 2
  },
  beforeCallBase: function (proxy) {
    proxy.source('ease', Flip.EASE.circInOut);
  },
  transform: function (mat,param) {
    mat.rotate(param.angle)
  }
});
Flip.animation({
  name: 'scale',
  immutable:{
    sx:0,sy:0
  },
  variable: {
    dx:1,dy:1
  },
  beforeCallBase: function (proxy) {
    proxy.source('ease', Flip.EASE.sineInOut);
  },
  transform: function (mat,param) {
    mat.scale(param.sx+param.dx,param.sy+param.dy)
  }
});
Flip.animation({
  name: 'translate',
  immutable:{sx:0,sy:0},
  variable: {
    dx: 100, dy: 0
  },
  transform:function (mat,param) {
    mat.translate(param.dx+param.sx,param.dy+param.sy);
  }
});})();