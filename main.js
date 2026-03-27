String.prototype.insert = function(idx, rem, str="") {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};

Array.prototype.remove = function(...forDeletion) {
    forDeletion.forEach(item => {
        let idx;
        while ((idx = this.indexOf(item)) !== -1) this.splice(idx, 1);
    });
    return this;
};

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

String.prototype.replaceLast = function(what, replacement="") {
    const idx = this.lastIndexOf(what);
    if (idx === -1) return this.toString();
    return this.slice(0, idx) + replacement + this.slice(idx + what.length);
};

const get_terminal = () => document.getElementById("terminal");
const get_window = () => document.getElementById("window");

