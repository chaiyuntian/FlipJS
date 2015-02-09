/**
 * Created by 柏然 on 2014/12/13.
 */
function Animation(opt) {
  if (!(this instanceof Animation))return new Animation(opt);
  var r = Animation.createOptProxy(opt).result;
  this.selector= r.selector||Error('Elements selector required');
  this.clock = r.clock;
  this.lastStyleRule='';
  this.keepWhenFinished= r.keepWhenFinished;
  this._cssMap={};
  this._matCallback={};
  this._cssCallback={};
  this.init(opt);
}
Animation.createOptProxy = function (setter) {
  setter = createProxy(setter);
  if (!setter.proxy.clock)
    setter('clock', new Clock(setter));
  setter('selector');
  setter('keepWhenFinished');
  return setter;
};
Animation.EVENT_NAMES = {
  UPDATE: 'update',
  DESTROY: 'destroy',
  RENDER: 'render',
  FINISHED: 'finished'
};
function animate() {
    var firstParam = typeof arguments[0], constructor, opt;
    if (firstParam === "string") {
      constructor = Flip.animation[arguments[0]];
      opt = arguments[1];
    }
    else if (firstParam === "object") {
      constructor = Flip.animation[arguments[0].animationType];
      opt = arguments[0];
    }
    if (!constructor) constructor = Animation;
    return setAniEnv(animate.createOptProxy(opt, 0, 0, 1).result, new constructor(opt));
  }
function setAniEnv(aniOpt, animation) {
    var global = FlipScope.global;
    if (aniOpt.defaultGlobal)
      (global._tasks.findBy('name', aniOpt.taskName) || global.activeTask).add(animation);
    if (aniOpt.autoStart) animation.start();
    return animation;
  }
animate.createOptProxy = function (setter, autoStart, taskName, defaultGlobal) {
    setter = createProxy(setter);
    setter('autoStart', autoStart, 'taskName', taskName, 'defaultGlobal', defaultGlobal);
    return setter;
  };
Flip.animate = animate;
Flip.css=function(selector,rule){
    var result={},body;
    if(typeof rule==="function")result=rule(result)||result;
    else if(typeof rule==="object") objForEach(rule,cloneFunc,result);
    else throw 'css rule should be object or function';
    if(body=getRuleBody(result)){
      return FlipScope.global.immediate(selector+'{'+body+'}');
    }
  };
function getRuleBody(ruleObj,separator){
    var rules=[];
    objForEach(ruleObj,function(value,key){
       rules.push(key.replace(/[A-Z]/g,function(c){return '-'+ c.toLowerCase()})+':'+value+';');
    });
    return rules.join(separator||'\n');
  }
function invalidWhenTick(state) {
    state.animation.invalid();
    state.animation.emit(Animation.EVENT_NAMES.UPDATE, state);
  }
function removeWhenFinished(state) {
    var ani = state.animation;
    updateAnimationCss(ani,state);
    ani.render(state);
    ani._finished=true;
    ani.emit(Animation.EVENT_NAMES.FINISHED, state);
    if(ani.keepWhenFinished){
      state.global.immediate(ani.lastStyleRule);
    }
    else ani.destroy(state);
  }
function updateAnimation(animation,renderState){
    renderState.animation=animation;
    animation.clock.update(renderState);
    updateAnimationCss(animation,renderState);
    renderState.animatetion=null;
  }
function CssContainer(){
  if(!(this instanceof CssContainer))return new CssContainer();
}
CssContainer.prototype={
  withPrefix:function(key,value){
    var self=this;
    ['-moz-','-ms-','-webkit','-o-'].forEach(function(prefix){
      self[prefix+key]=value;
    });
    return self;
  }
};
function updateAnimationCss(animation,renderState){
    var cssMap=animation._cssMap,ts=animation.selector;
    objForEach(animation._cssCallback,function(cbs,selector){
      var cssRule=new CssContainer();
      cbs.forEach(function(cb){
        cb.apply(animation,[cssRule,renderState])
      });
      selector.split(',').forEach(function(se){cssMap[se.replace(/&/g,ts)]=cssRule;});
    });
    objForEach(animation._matCallback,function(cbs,selector){
      var mat=new Mat3(),matRule;
      cbs.forEach(function(cb){mat=cb.apply(animation,[mat,renderState])||mat});
      matRule=mat.toString();
      selector.split(',').forEach(function(se){
        var key=se.replace(/&/g,ts),cssObj=cssMap[key]||(cssMap[key]={});
        cssObj.transform=cssObj['-webkit-transform']=matRule;
      });
    });
  }
  function setUpdateOpt(animation,obj,type){
     var t=typeof obj;
    if(t==="function")animation[type](obj);
    else if(t==="object"){
      hasNestedObj(obj)? objForEach(obj,function(rule,slt){animation[type](slt,rule)}):animation[type](obj);
    }
  }
  function hasNestedObj(obj){
    return obj&&Object.getOwnPropertyNames(obj).some(function(key){
        var t=typeof obj[key];
        return t=="object"||t=="function"
        });
  }
  function addMap(key,Map,cb){
    var cbs=Map[key];
    if(!cbs)Map[key]=[cb];
    else arrAdd(cbs,cb);
  }
  inherit(Animation, Flip.util.Object, {
    get percent(){
      return this.finished? 1:this.clock.value;
    },
    set clock(c) {
      var oc = this._clock;
      c = c || null;
      if (oc == c)return;
      if (oc && c)throw Error('remove the animation clock before add a new one');
      this._clock = c;
      //add a clock
      if (c) {
        c.ontick = invalidWhenTick;
        c.on(Clock.EVENT_NAMES.FINISHED, removeWhenFinished);
        c.controller = this;
      }//remove a clock
      else if (oc) {
        oc.off(Clock.EVENT_NAMES.TICK, invalidWhenTick);
        oc.off(Clock.EVENT_NAMES.FINISHED, removeWhenFinished);
        oc.controller = null;
      }
    },
    get clock() {
      return this._clock;
    },
    get promise(){
      var v=this._promise,self=this;
      if(!v)
        v=this._promise=FlipScope.Promise(function(resolve){
          self.once('finished',function(state){
            if(state&&state.global)
              state.global.once('frameEnd',go);
            else go();
            function go(){
              resolve(self);
            }
          })
        });
      return v;
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
    init:function(opt){
      this.use(opt);
    },
    use:function(opt){
      setUpdateOpt(this,opt.transform,'transform');
      setUpdateOpt(this,opt.css,'css');
      setUpdateOpt(this,opt.on,'on');
      setUpdateOpt(this,opt.once,'once');
      return this;
    },
    transform:function(selector,matCallback){
      if(typeof selector==="function") {
        matCallback= selector;
        selector ='&';
      }
      addMap(selector,this._matCallback,matCallback);
      return this;
    },
    css:function(selector,cssCallBack){
      if(typeof selector!=="string") {
        cssCallBack = selector;
        selector ='&';
      }
      if(typeof cssCallBack=="object"){
        var cssTo=cssCallBack;
        cssCallBack=function(cssObj){
          objForEach(cssTo,cloneFunc,cssObj);
        }
      }
      addMap(selector,this._cssCallback,cssCallBack);
      return this;
    },
    update: function (state) {
      updateAnimation(this,state);
      return true;
    },
    render: function (state) {
      state.animation = this;
      this.apply(state);
      this.emit(Animation.EVENT_NAMES.RENDER, state);
      state.animation = null;
    },
    invalid: function () {
      if (this._task) this._task.invalid();
    },
    destroy: function (state) {
      var task, clock;
      if (task = this._task)
        task.remove(this);
      if ((clock = this.clock))clock.emit(Animation.EVENT_NAMES.DESTROY, state);
      this.off();
      this.clock = null;
      Animation.apply(this,[{selector:this.selector}]);
    },
    getStyleRule:function(){
      var styles=[];
      objForEach(this._cssMap,function(ruleObj,selector){
        var body=getRuleBody(ruleObj);
        if(body){
          styles.push(selector+'\n{\n'+body+'\n}');
        }
      });
      return this.lastStyleRule=styles.join('\n');
    },
    apply: function (state) {
      state.styleStack.push(this.getStyleRule());
    },
    start:function(){
      var clock=this.clock;
      if(clock){
        clock.start();
      }
      return this;
    },
    stop:function(){
      var clock=this.clock;
      if(clock)clock.stop();
      return this;
    },
    then:function(onFinished,onerror){
      return this.promise.then(onFinished,onerror);
    },
    follow:function(thenables){
      //TODO:directly past Array
      if(arguments.length>1)thenables=Array.prototype.slice.apply(arguments);
      else if(!(thenables instanceof Array))thenables=[thenables];
      return this.promise.then(function(){ return Flip.Promise.all(thenables.map(Flip.Promise))});
    }
  });

Flip.animation = (function () {
  function register(definition) {
    var beforeCallBase, defParam, name = definition.name, Constructor;
    beforeCallBase = definition.beforeCallBase || _beforeCallBase;
    defParam = definition.defParam || {};
    Constructor = function (opt) {
      if (!(this instanceof Constructor))return new Constructor(opt);
      var proxy = createProxy(opt);
      objForEach(defParam, function (value, key) {
        proxy(key, value)
      });
      objForEach(proxy.result, cloneFunc, this);
      beforeCallBase.apply(this, [proxy, opt]);
      Animation.call(this, opt);
    };
    if (name) {
      register[name] = Constructor;
      Constructor.name = name;
    }
    inherit(Constructor, Animation.prototype,{
      init:function(opt){
        this.use(definition).use(opt);
      },
      type:definition.name
    });
    return Constructor;
  }
  return register;
  function _beforeCallBase(proxy, opt, instance) {
    return proxy;
  }
})();

