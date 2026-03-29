class DYN
{
    static SOURCE = {};
    static INFO = {};

    static {
        SOURCE_FILES.forEach((file) => {
            fetch(file).then(r => r.text()).then(t => this.SOURCE[file] = t);
        });

        this.INFO.ip = "127.0.0.1";
        if (!["localhost", "127.0.0.1"].includes(window.location.hostname))
            fetch('/api/ip').then(r => r.text()).then(t => this.INFO.ip = t.trim());
        this.INFO.useragent = navigator.userAgent;
        this.INFO.platform = navigator.platform;
        this.INFO.language = navigator.language;
        this.INFO.resolution = `${screen.width}x${screen.height}`;
        this.INFO.colordepth = screen.colorDepth;
        this.INFO.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
}

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

class STATE
{
    static sleepTimeout;
    static sleepCleanup;
    static cachedPromptFunction;

    static #cached_terminal_element;
    static #terminal_parent;
    static #terminal_next_sibling;
    static #selectionStart;
    static #selectionEnd;
    static #data;
    static #content_length;

    static get content_length() {
        return this.#content_length;
    }

    static save = () => {
        const t = get_terminal();
        if (!t) return;
        this.#data = t.value;
        this.#selectionStart = t.selectionStart;
        this.#selectionEnd = t.selectionEnd;
        this.#content_length = t.textLength;
    }

    static reset = () => {
        const term = get_terminal();
        term.value = this.#data;
        term.selectionStart = this.#selectionStart;
        term.selectionEnd = this.#selectionEnd;
    }

    static clear = () => {
        const term = get_terminal();
        term.value = "";
        term.selectionStart = 0;
        term.selectionEnd = 0;
        this.save();
    }

    static respawn = (initial=false) => {
        if (!initial)
            this.#terminal_parent.insertBefore(this.#cached_terminal_element, this.#terminal_next_sibling);

        document.dispatchEvent(new CustomEvent("spawnterminal"));

        get_terminal().addEventListener('input', handle_input);
        get_terminal().addEventListener('keydown', handle_keydown);
        get_terminal().dir = "ltr";
        get_terminal().autocorrect = false;
        get_terminal().spellcheck = false;
        document.getElementById("indicator-red").addEventListener('click', COMMAND.exit);
        document.getElementById("indicator-yellow").addEventListener('click', FUN.maximize);
        document.getElementById("indicator-green").addEventListener('click', FUN.floating);

        this.save();
    }

    static {
        const w = get_window();
        this.#cached_terminal_element = w.cloneNode(true);
        this.#terminal_parent = w.parentNode;
        this.#terminal_next_sibling = w.nextSibling;
        this.#selectionStart = 0;
        this.#selectionEnd = 0;
        this.#data = "";
        this.#content_length = 0;
    }
};

const MOTD = '>  Hello! Use \'help\' command!  < ';

const FUN = {
    get_random_ascii: () => SPLASH[Math.floor(Math.random()*SPLASH.length)],
    load: () => {
        SHELL.path = '~';
        FUN.update_prompt();
        FUN.clear();
        FUN.print(MOTD + "\n" + FUN.get_random_ascii());
        FUN.prompt();
        get_terminal().focus();
        STATE.save();
    },
    set_command_line: (full_command) => {
        const t = get_terminal();
        t.value = t.value.insert(t.value.lastIndexOf(SHELL.prompt), Infinity, `${SHELL.prompt} ${full_command}`);
        STATE.save();
    },
    get_command_line: () => get_terminal().value.split(NL).at(-1).replace(SHELL.prompt + " ", ""),
    get_prompt_end: () => get_terminal().value.lastIndexOf(SHELL.prompt) + SHELL.prompt.length + 1,
    maximize: () => {
        const w = get_window();
        w.style.width = "100%";
        w.style.height = "100%";
        w.style.position = "static";
    },
    floating: () => {
        const w = get_window();
        w.style.width = "";
        w.style.height = "";
        w.style.position = "fixed";
    },
    print: (str="") => get_terminal().value += `${str}${str ? "\n" : ""}`,
    prompt: () => get_terminal() ? get_terminal().value += `${SHELL.prompt} ` : {},
    commands_list: (delim=" ") => Object.keys(COMMAND).filter(Boolean).join(delim),
    aliases_list: (delim=" ") => Object.entries(ALIASES).map(([alias, cmd]) => `${alias}=${cmd}`).filter(Boolean).join(delim),
    content_of: (obj) => Object.entries(obj),
    update_prompt: () => SHELL.prompt = `[${SHELL.user}@${SHELL.host} ${SHELL.path}] $`,
    keyboard_interrupt: () => {
        FUN.print("^C");
        if (STATE.sleepTimeout)
        {
            clearTimeout(STATE.sleepTimeout);
            STATE.sleepCleanup();
        }
    },
    exit: () => {
        get_window().remove();
        HISTORY.clear();
    },
    replace_special_content: (content) => {
        if ((content.split('%').length !== 3) || !content.startsWith('%') || !content.endsWith('%'))
            return content;

        const key = content.slice(1, -1);
        const [type, value] = key.split('::');

        if (type === 'info') return DYN.INFO[value] ?? content;
        if (type === 'source') return DYN.SOURCE[value] ?? content;

        return content;
    },
    resolve_path: (path) => {
        if (path) path = path.replace(/^~/, '/home/' + SHELL.user);
        const cwd = SHELL.path.startsWith('/') ? SHELL.path : SHELL.path.replace('~', '/home/' + SHELL.user);
        const base = (!path || !path.startsWith('/')) ? cwd.split('/').filter(Boolean) : [];
        const parts = [...base, ...(path || '').split('/').filter(Boolean)];
        const resolved = [];
        for (const part of parts) {
            if (part === '.') continue;
            else if (part === '..') resolved.pop();
            else resolved.push(part);
        }
        return '/' + resolved.join('/');
    },
    clear: () => {
        STATE.clear();
    },
    spawn: () => {
        if (get_terminal())
            return;
        STATE.respawn();
        FUN.load();
    },
    exec: (text="") => {
        const [name, ...args] = text.split(" ");
        const cmd_name = Object.keys(ALIASES).includes(name) ? ALIASES[name] : name;
        COMMAND[cmd_name](args);
    },
    date_fmt: (date) => {
        return [
            date.toLocaleString(undefined, { month: 'short' }),
            date.getDate(),
            date.getFullYear(),
            date.toLocaleString(undefined, { hour: 'numeric', minute: 'numeric', hour12: false }),
        ].join(" ");
    },
    is_dir: (node) => typeof node === 'object' && node != null,
    get_node: (path) => {
        const parts = path.split('/').filter(Boolean);
        let node = FS['/'];
        for (const part of parts)
        {
            if (!FUN.is_dir(node)) return null;
            node = node[part];
        }
        return node ?? null;
    },
}

let ALIASES = {};

const COMMAND = {
    help: ([cmd_name, ..._]) => {
        if (!cmd_name)
        {
            const aliases = Object.entries(ALIASES).map(([alias, cmd]) => `${alias}=${cmd}`).join(" ");
            FUN.print(`Usage: help <command name>`);
            FUN.print(`Available commands:\n${FUN.commands_list()}`);
            FUN.print(`Aliases: ${aliases ? '\n' + aliases : 'none'}`);
        }
        else
            FUN.print(COMMAND_DESCRIPTIONS[cmd_name] ?? `help: no help for: ${cmd_name}`);
    },
    "": () => get_terminal().value = get_terminal().value.slice(0, -1).trim()+" ",
    music: ([subcommand, ...args]) => {
        const prefix = "~ᴘʟᴀʏᴇʀ~";

        if (subcommand === 'load')
        {
            let name = args.shift();
            if (!name) name = PLAYER.playlist.random();
            PLAYER.load(name);
            FUN.print(`${prefix} Loaded: ${PLAYER.name}`);
        }
        else if (subcommand === 'play')
        {
            PLAYER.play();
            FUN.print(`${prefix} Playing: ${PLAYER.name}`);
        }
        else if (subcommand === 'next')
        {
            PLAYER.next();
            FUN.print(`${prefix} Playing: ${PLAYER.name}`);
        }
        else if (subcommand === 'prev')
        {
            PLAYER.prev();
            FUN.print(`${prefix} Playing: ${PLAYER.name}`);
        }
        else if (subcommand === 'pause')
        {
            PLAYER.pause();
            FUN.print(`${prefix} Paused: ${PLAYER.name}`);
        }
        else if (subcommand === 'stop')
        {
            const name = PLAYER.name;
            PLAYER.stop();
            FUN.print(`${prefix} Stopped: ${name}`);
        }
        else if (subcommand === 'volume')
        {
            const raw = args.shift() ?? '';
            const in_percent = raw.endsWith('%');
            const volume = parseFloat(raw) / (in_percent ? 100 : 1);
            if (!Number.isNaN(volume)) PLAYER.volume = volume;
            FUN.print(`${prefix} Volume: ${PLAYER.volume} (${PLAYER.volumeReal})`);
        }
        else if (subcommand === 'show')
        {
            if (PLAYER.hidden)
            {
                FUN.print("Shown!")
                PLAYER.show();
            }
            else
                FUN.print("Already shown...")
        }
        else if (subcommand === 'hide')
        {
            if (PLAYER.hidden)
                FUN.print("Already hidden...")
            else
            {
                FUN.print("Hidden!")
                PLAYER.hide();
            }
        }
        else if (subcommand === 'mute')
        {
            PLAYER.mute = !PLAYER.mute;
            FUN.print(`${prefix} ${PLAYER.mute ? "Muted!" : "Unmuted!"}`);
        }
        else
        {
            FUN.print('music load <name>');
            FUN.print('music play');
            FUN.print('music pause');
            FUN.print('music stop');
            FUN.print('music next');
            FUN.print('music prev');
            FUN.print('music mute');
            FUN.print('music show');
            FUN.print('music hide');
            FUN.print('music volume <0..1>');
        }
    },
    nav: () => {
        const nav = document.getElementById("nav");
        nav.classList.toggle('hidden');
        FUN.print(nav.classList.contains('hidden') ? "Hidden!" : "Shown!");
    },
    reverse: () => {
        const t = get_terminal();
        get_window().firstElementChild.classList.toggle("reversed"); // indicators on the right
        get_window().firstElementChild.firstElementChild.classList.toggle("reversed"); // flipped title
        t.dir = t.dir.split("").reverse().join("");
        t.scrollTop = t.scrollHeight;
    },
    history: () => FUN.print(HISTORY.list().join("\n")),
    ascii: ([num, ..._]) => {
        const int = parseInt(num);
        if (num && !Number.isNaN(int))
            FUN.print(SPLASH[int % SPLASH.length]);
        else
            FUN.print(FUN.get_random_ascii());
        FUN.print("Ascii generated with pyfiglet");
    },
    ping: ([target, ..._]) => FUN.print(`pong ${target ? target : ""}`),
    clear: FUN.clear,
    color: ([code, ..._]) => (code = [...(code||"0a")].reverse().join("")) && ([get_terminal().style.color, get_terminal().style.backgroundColor] = [COLORS[code[0]], COLORS[code[1]]]),
    pwd: () => FUN.print(FUN.resolve_path(SHELL.path)),
    ls: ([path, ..._]) => {
        path = FUN.resolve_path(path);
        const node = FUN.get_node(path);
        if (node === null) return FUN.print(`ls: cannot access '${path}': No such file or directory`);
        const entries = Object.keys(node);
        FUN.print(`total ${entries.length}`);
        const date = new Date(2020, 11, 24, 12, 30, 0);

        const node_content = FUN.content_of(node);
        const directories = node_content.filter(([parent, child]) => FUN.is_dir(child)).sort();
        const files = node_content.filter(([parent, child]) => !FUN.is_dir(child)).sort();

        for (const [name, content] of directories.concat(files)) {
            const size = FUN.is_dir(content) ? Object.keys(content).length : content.length;
            const size_fmt = ("" + size).padStart(2, " ");
            const mode = FUN.is_dir(content) ? 'drwxr-xr-x' : '-rw-r--r--';
            const date_fmt = FUN.date_fmt(date);
            FUN.print(`${mode} ${SHELL.user} ${SHELL.group} ${size_fmt} ${date_fmt} ${name}`);
        }
    },
    cat: ([path, ...rest]) => {
        if (!path) return FUN.print('cat: missing operand');

        if (path.endsWith('*') && (path.slice(-2, -1) === '/' || path.length === 1))
        {
            const dir = path.slice(0, -1) || './';
            const node = FUN.get_node(FUN.resolve_path(dir));
            if (!node) return;
            const files = Object.keys(node).filter(k => !FUN.is_dir(node[k])).map((f) => dir + f);
            path = files.shift();
            rest = [...files, ...rest];
        }
        path = FUN.resolve_path(path);

        const node = FUN.get_node(path);
        if (node === null)
        {
            FUN.print(`cat: ${path}: No such file or directory`);
        }
        else if (FUN.is_dir(node))
        {
            FUN.print(`cat: ${path}: Is a directory`);
        }
        else
        {
            // the actual print
            FUN.print(FUN.replace_special_content(node));
        }
        // recursively cat next path
        if (rest.length) COMMAND.cat(rest);
    },
    su: ([name, ..._]) => (SHELL.user = (name || SHELL.user)) && FUN.update_prompt(),
    hostname: ([name, ..._]) => (SHELL.host = (name || SHELL.host)) && FUN.update_prompt(),
    "?": () => FUN.print('Do you need help? Just type `help`'),
    cd: ([path, ..._]) => {
        if (!path) {
            SHELL.path = '~';
            return FUN.update_prompt();
        }
        path = FUN.resolve_path(path);
        const node = FUN.get_node(path);
        if (node === null) {
            return FUN.print(`cd: no such file or directory: ${path}`);
        }
        if (!FUN.is_dir(node)) {
            return FUN.print(`cd: not a directory: ${path}`);
        }
        const home = `/home/${SHELL.user}`;
        SHELL.path = path.startsWith(home) ? path.replace(home, '~') : path;
        FUN.update_prompt();
    },
    echo: ([...args]) => (FUN.print(args.join(" "))),
    exit: FUN.exit,
    sleep: ([duration, ...args]) => {
        duration = parseFloat(duration) || 1;
        if (args.includes("--hard"))
        {
            const end = Date.now() + duration * 1000;
            while (Date.now() < end);
            return;
        }
        get_terminal().readOnly = true;
        STATE.cachedPromptFunction = FUN.prompt;
        FUN.prompt = Function.prototype;
        STATE.sleepCleanup = () => {
            get_terminal().readOnly = false;
            get_terminal().focus();
            FUN.prompt = STATE.cachedPromptFunction;
            FUN.prompt();
            STATE.cachedPromptFunction = null;
            STATE.sleepTimeout = null;
            STATE.sleepCleanup = null;
        };
        STATE.sleepTimeout = setTimeout(STATE.sleepCleanup, duration*1000);
    },
    alias: ([arg, ..._]) => {
        if (!arg) return FUN.print(FUN.aliases_list("\n"));
        if ((d = arg.indexOf('=')) < 0)
        {
            if (Object.keys(ALIASES).includes(arg))
            {
                const target = ALIASES[arg];
                delete ALIASES[arg];
                FUN.print(`${arg} is no longer an alias for ${target}`);
            }
            return;
        }
        const [new_name, target] = [arg.slice(0, d), arg.slice(d+1)];
        ALIASES[new_name] = target;
        FUN.print(`${new_name} is now an alias of ${target}`);
    },
}

const SHELL = {
    user: "user",
    host: "machine",
    path: "~",
    group: "group",
    prompt: undefined,
}

const CTRL_HANDLERS = {
    c: FUN.keyboard_interrupt,
    d: COMMAND.exit,
    l: FUN.clear,
    e: FUN.spawn,
};

document.addEventListener("keydown", (e) => {
    if (!e.ctrlKey) return;
    if (e.key in CTRL_HANDLERS)
    {
        e.preventDefault();
        CTRL_HANDLERS[e.key]();
        if (CTRL_HANDLERS[e.key] === FUN.clear)
            FUN.prompt();
    }
});

const handle_input = (e) =>
{
    // when editing outside the command line or something is selected
    if (get_terminal().selectionStart != get_terminal().selectionEnd
        || get_terminal().selectionStart <= FUN.get_prompt_end())
    {
        STATE.reset();
        if (e.data)
        {
            get_terminal().value += e.data;
        }
        STATE.save();
        return;
    }

    // enter (new line)
    if (get_terminal().value.slice(-1).charCodeAt(0) === 10)
    {
        [cmd, ...params] = get_terminal().value.split(NL).at(-2).replace(SHELL.prompt, "").trim().split(" ").filter(Boolean);
        if (!cmd) return COMMAND[""](params);
        HISTORY.push([cmd, ...params].join(" "));
        cmd = cmd.toLowerCase();
        if (Object.keys(COMMAND).includes(cmd))
        {
            COMMAND[cmd](params);
        }
        else if (Object.keys(ALIASES).includes(cmd))
        {
            FUN.exec(`${ALIASES[cmd]} ${params.join(" ")}`);
        }
        else
        {
            FUN.print(`shell: command not found: ${cmd}`);
        }
        FUN.prompt();
    }
    // backspace
    else if (get_terminal().textLength < STATE.content_length && get_terminal().value.split(NL).at(-1) === SHELL.prompt)
    {
        get_terminal().value = get_terminal().value.split(NL).slice(0, -1).join(NL)+(get_terminal().value.indexOf(NL) > -1 ? NL : '');
        FUN.prompt();
    }

    STATE.save();
};

const handle_keydown = (e) => {
    if (e.key === "ArrowUp")
    {
        e.preventDefault();
        FUN.set_command_line(HISTORY.older());
    }
    else if (e.key === "ArrowDown")
    {
        e.preventDefault();
        FUN.set_command_line(HISTORY.newer());
    }
    else if (e.key === "ArrowLeft")
    {
        if (get_terminal().selectionStart <= FUN.get_prompt_end())
        {
            e.preventDefault();
        }
    }
};

window.addEventListener('DOMContentLoaded', FUN.load);
STATE.respawn(true);

