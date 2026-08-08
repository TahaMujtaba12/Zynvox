/* Small DOM helpers shared by Zynvox pages. All of them no-op when the
   target element is absent, so pages can share scripts safely. */
(function (global) {
  function byId(id) {
    return document.getElementById(id);
  }

  function setText(id, text) {
    var el = byId(id);
    if (el) el.textContent = text;
    return el;
  }

  function setValue(id, value) {
    var el = byId(id);
    if (el) el.value = value;
    return el;
  }

  function setDisplay(id, display) {
    var el = byId(id);
    if (el) el.style.display = display;
    return el;
  }

  function fieldValue(id) {
    var el = byId(id);
    return el ? el.value.trim() : '';
  }

  function createEl(tag, className, html) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (html != null) el.innerHTML = html;
    return el;
  }

  global.ZynvoxDOM = {
    byId: byId,
    setText: setText,
    setValue: setValue,
    setDisplay: setDisplay,
    fieldValue: fieldValue,
    createEl: createEl
  };
})(window);
