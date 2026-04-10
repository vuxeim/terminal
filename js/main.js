String.prototype.insert = function(idx, rem=0, str="") {
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

Array.prototype.random = function() {
    return this[Math.floor(Math.random() * this.length)];
};

Number.prototype.mod = function(n) {
  return ((this % n) + n) % n;
};

String.prototype.reversed = function() {
    return [...this].reverse().join("");
};

Object.prototype.stringify = function() {
    return JSON.stringify(this).replace(/^"|"$/g, "'").replace(/\\"/g, "\"").replace(/\\\\/g, "\\");
};

Object.prototype.instanceof = function(cls) {
    return (this instanceof cls) || typeof this.valueOf() === cls.name.toLowerCase();
};

String.prototype.unquote = function() {
    return this.replace(/^(['"])(.*)\1$/, '$2');
};

String.prototype.unescape = function() {
    return this.replace(/\\(.)|\\$/g, '$1');
};

Object.defineProperty(String.prototype, 'printableLength', {
  get: function() {
    return this.replace(/[\p{Cc}\p{Cf}]/gv, '').length;
  },
  configurable: true,
  enumerable: false,
});

Number.prototype.numfmt = function({ iec = false, precision = 1, pad = undefined, signed = false } = {}) {
    if (isNaN(this)) return "NaN";

    const SI_UNITS  = ["", "K", "M", "G", "T", "P", "E"];
    const IEC_UNITS = ["", "K", "M", "G", "T", "P", "E"];

    const base  = iec ? 1024 : 1000;
    const units = iec ? IEC_UNITS : SI_UNITS;

    let num = Math.abs(this), i = 0;
    while (num >= base && i < units.length - 1) { num /= base; i++; }

    let str = num.toFixed(precision).replace(/\.0+$/, '') + units[i];

    str = (this < 0 ? "-" : signed ? "+" : "") + str;

    if (pad && pad.instanceof(Number))
    {
        str = str.padStart(pad, " ");
    }

    return str;
};

const get_terminal = () => document.getElementById("terminal");
const get_window = () => document.getElementById("window");

