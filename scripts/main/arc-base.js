
class ArcBase {

  _debounceIndex(name) {
    return this._debouncers.findIndex(item => item.name === name);
  }
  /**
   * Prohibits execution of a task for some `time`.
   *
   * The task is executed at the end of this time.
   *
   * ```
   * this.debounce('ajax-call', function() {
   *  this.makeAjaxCall();
   * }, 2000);
   * ```
   *
   * @param {String} name Name of the task
   * @param {Function} callback A function to call.
   * @param {Number} time Number of milliseconds after which the task is executed.
   */
  debounce(name, callback, time) {
    if (!this._debouncers) {
      this._debouncers = [];
    }
    var index = this._debounceIndex(name);
    if (index !== -1) {
      return;
    }
    var cancelId = setTimeout(() => {
      var index = this._debounceIndex(name);
      this._debouncers.splice(index, 1);
      callback.call(this);
    }, time);

    this._debouncers.push({
      name: name,
      id: cancelId
    });
  }
  /**
   * Cancels previously set debounce timer.
   *
   * @param {String} name Name of the task
   */
  cancelDebounce(name) {
    var index = this._debounceIndex(name);
    if (index === -1) {
      return;
    }
    var debounce = this._debouncers[index];
    clearTimeout(debounce.id);
    this._debouncers.splice(index, 1);
  }
}
exports.ArcBase = ArcBase;
