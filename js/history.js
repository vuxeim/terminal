class HISTORY
{
    static #index = 0;
    static #registry = [""];

    static debug() { return `[|${this.#registry.join("|")}|] << ${this.#index} (${this.get()})`; }
    static list() { return this.#registry.slice(0, -1); }
    static get size() { return this.#registry.length; }
    static reset() { this.#index = 0; }
    static clear() {
        this.reset();
        this.#registry.splice(0, this.size - 1);
    }
    static push(full_command) {
        this.reset();
        if (this.seek(1) !== full_command)
        {
            this.#registry.splice(-1, 0, full_command);
        }
    }
    static seek(offset=0) { return this.#registry.at(-1 -(offset + this.#index).clamp(0, this.size - 1)); }
    static get(offset=0) {
        this.#index += offset;
        this.#index = this.#index.clamp(0, this.size - 1);
        return this.#registry.at(-1 - this.#index) ?? "";
    }
    static older() {
        return this.get(1);
    }
    static newer() {
        return this.get(-1);
    }
}

