/**
 * Created by 柏然 on 2014/12/12.
 */
Flip.RenderGlobal = RenderGlobal;
function RenderGlobal() {
  this._tasks = new Flip.util.Array();
}
RenderGlobal.EVENT_NAMES = {
  FRAME_START: 'frameStart',
  FRAME_END: 'frameEnd',
  UPDATE: 'update'
};
inherit(RenderGlobal, Flip.util.Object, {
  set activeTask(t) {
    var tasks = this._tasks, target = this._activeTask;
    if (target) target.timeline.stop();
    if (t instanceof RenderTask)
      if (tasks.indexOf(t) > -1 || this.add(t)) target = t;
      else if (typeof t == "string") target = tasks.findBy('name', t);
      else target = null;
    this._activeTask = target;
    if (target) target.timeline.start();
  },
  get activeTask() {
    var t = this._activeTask;
    if (!t) {
      this._tasks.length ? (t = this._tasks[0]) : this.add(t = new RenderTask('default'));
      this._activeTask = t;
    }
    return t;
  },
  add: function (obj) {
    var task, taskName, tasks;
    if (obj instanceof RenderTask) {
      if (!(taskName = obj.name)) throw Error('task must has a name');
      else if ((task = (tasks = this._tasks).findBy('name', taskName)) && task !== obj) throw Error('contains same name task');
      else if (tasks.add(obj)) return !!(obj._global = this);
    }
    else if (obj instanceof Animation || obj instanceof Clock)
      return this.activeTask.add(obj);
    return false;
  },
  init: function (taskName) {
    this.activeTask = taskName;
    this.loop();
    this.activeTask.timeline.start();
    typeof window === "object" && Flip.fallback(window);
    this.init = function () {
      console.warn('The settings have been initiated,do not init twice');
    };
  },
  loop: function () {
    var state = this.createRenderState();
    this.emit(RenderGlobal.EVENT_NAMES.FRAME_START, [state]);
    this.update(state);
    this.render(state);
    this.emit(RenderGlobal.EVENT_NAMES.FRAME_END, [state]);
    window.requestAnimationFrame(this.loop.bind(this), window.document.body);
  },
  render: function (state) {
    state.task.render(state);
  },
  update: function (state) {
    state.global.emit(RenderGlobal.EVENT_NAMES.UPDATE, [state, this]);
    state.task.update(state);
  },
  createRenderState: function () {
    return {global: this, task: this.activeTask}
  }
});
FlipScope.global = new RenderGlobal();

