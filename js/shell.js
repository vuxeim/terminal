/* global
    FS, // filesystem.js
*/

class SHELL
{
    static #path = "~";
    static #user = "user";
    static #host = "machine";
    static #group = "group";

    static get FS() { return FS; }
    static get prompt() { return `[${this.#user}@${this.#host} ${this.#path}] $ `; }

    static get path() { return this.#path; }
    static get user() { return this.#user; }
    static get host() { return this.#host; }
    static get group() { return this.#group; }

    static set path(path) { this.#path = path; }
    static set user(user) { this.#user = user; }
    static set host(host) { this.#host = host; }
    static set group(group) { this.#group = group; }
}

