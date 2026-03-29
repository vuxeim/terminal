class DYN
{
    /* Stores dynamic data. Fetched asynchronously but without the need for async/await. */

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

class SLEEP
{
    static get sleeping() {
        return !!this.#timeout;
    }

    static #timeout;
    static #cleanup;
    static #cachedPromptFunction;

    static wakeup() {
        clearTimeout(this.#timeout);
        this.#cleanup();
    }

    static sleep(duration) {

        const t = get_terminal();
        t.readOnly = true;

        this.#cachedPromptFunction = FUN.prompt;
        FUN.prompt = Function.prototype;

        this.#cleanup = () => {
            t.readOnly = false;
            TERMINAL.focus();
            FUN.prompt = this.#cachedPromptFunction;
            FUN.prompt();
            this.#cachedPromptFunction = null;
            this.#timeout = null;
            this.#cleanup = null;
        };

        this.#timeout = setTimeout(this.#cleanup, duration*1000);
    }
}

class TERMINAL
{
    static #cached_terminal_element;
    static #terminal_parent;
    static #terminal_next_sibling;

    static get data() {
        return get_terminal().value;
    }

    static get exists() {
        return get_terminal() !== null;
    }

    static get content_length() {
        return get_terminal().textLength;
    }

    static get cursor_position() {
        return get_terminal().selectionStart;
    }

    static get selected() {
        const t = get_terminal();
        return t.selectionStart !== t.selectionEnd;
    }

    static append(text) {
        get_terminal().value += text;
    }

    static scroll_bottom() {
        const t = get_terminal();
        t.scrollTop = t.scrollHeight;
    }

    static focus() {
        get_terminal().focus();
    }

    static clear() {
        const t = get_terminal();
        t.value = "";
        t.selectionStart = 0;
        t.selectionEnd = 0;
    }

    static set_command_line(full_command) {
        const t = get_terminal();
        const value = t.value;
        const prompt_start = value.lastIndexOf(SHELL.prompt);
        const prompt_with_command_line = SHELL.prompt + full_command;
        t.value = value.insert(prompt_start, Infinity, prompt_with_command_line);
    }

    static respawn(initial=false) {
        if (!initial)
            this.#terminal_parent.insertBefore(this.#cached_terminal_element, this.#terminal_next_sibling);

        document.dispatchEvent(new CustomEvent("spawnterminal"));

        get_terminal().addEventListener('beforeinput', handle_beforeinput);
        get_terminal().addEventListener('keydown', handle_keydown);
        get_terminal().dir = "ltr";
        get_terminal().autocorrect = false;
        get_terminal().spellcheck = false;
        document.getElementById("indicator-red").addEventListener('click', FUN.exit);
        document.getElementById("indicator-yellow").addEventListener('click', FUN.maximize);
        document.getElementById("indicator-green").addEventListener('click', FUN.floating);
    }

    static {
        const w = get_window();
        this.#cached_terminal_element = w.cloneNode(true);
        this.#terminal_parent = w.parentNode;
        this.#terminal_next_sibling = w.nextSibling;
    }
};

const MOTD = '>  Hello! Use \'help\' command!  < ';

const FUN = {
    get_random_ascii: () => SPLASH[Math.floor(Math.random()*SPLASH.length)],
    load: () => {
        SHELL.path = '~';
        FUN.update_prompt();
        FUN.clear();
        FUN.print_motd();
        FUN.prompt();
        TERMINAL.focus();
    },
    print_motd: () => FUN.print(MOTD + "\n" + FUN.get_random_ascii()),
    set_command_line: TERMINAL.set_command_line,
    get_command_line: () => TERMINAL.data.split(NL).at(-1).replace(SHELL.prompt, ""),
    get_command_line_start: () => TERMINAL.data.lastIndexOf(SHELL.prompt) + SHELL.prompt.length,
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
    print: (str="") => TERMINAL.append(`${str}${str ? "\n" : ""}`),
    prompt: () => { if (TERMINAL.exists) TERMINAL.append(SHELL.prompt); },
    commands_list: (delim=" ") => Object.keys(COMMAND).filter(Boolean).join(delim),
    aliases_list: (delim=" ") => Object.entries(ALIASES).map(([alias, cmd]) => `${alias}=${cmd}`).filter(Boolean).join(delim),
    content_of: (obj) => Object.entries(obj),
    update_prompt: () => SHELL.prompt = `[${SHELL.user}@${SHELL.host} ${SHELL.path}] $ `,
    keyboard_interrupt: () => {
        FUN.print("^C");
        if (SLEEP.sleeping)
        {
            SLEEP.wakeup();
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
    clear: TERMINAL.clear,
    spawn: () => {
        if (TERMINAL.exists)
            return;
        TERMINAL.respawn();
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
    music: ([subcommand, ...args]) => {
        const prefix = "~ᴘʟᴀʏᴇʀ~";

        if (subcommand === 'load')
        {
            let name = args.shift();
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
            const is_relative = raw.startsWith('+') || raw.startsWith('-');
            if (!Number.isNaN(volume))
                PLAYER.volume = is_relative ? PLAYER.volume + volume : volume;
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
        else if (subcommand === 'loop')
        {
            PLAYER.loop = !PLAYER.loop;
            FUN.print(`${prefix} Loop ${PLAYER.loop ? "on" : "off"}`);
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
            FUN.print('music loop');
            FUN.print('music volume <0..1|n%>');
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
    color: ([code = "0a", ..._]) => {
        const [fore, back] = code.reversed();
        const t = get_terminal();
        [t.style.color, t.style.backgroundColor] = [COLORS[fore], COLORS[back]];
    },
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

        SLEEP.sleep(duration);
    },
    alias: ([arg, ..._]) => {
        if (!arg) return FUN.print(FUN.aliases_list("\n"));
        const d = arg.indexOf('=');
        if (d < 0)
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

const CTRL_HANDLERS = {
    c: FUN.keyboard_interrupt,
    d: FUN.exit,
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

const handle_beforeinput = (e) =>
{
    const before_command_line = TERMINAL.cursor_position < FUN.get_command_line_start();
    const at_command_line_start = TERMINAL.cursor_position === FUN.get_command_line_start();
    const at_command_line_end = TERMINAL.cursor_position === TERMINAL.content_length;
    const is_backspace = e.inputType === 'deleteContentBackward';
    const is_enter = e.inputType === 'insertLineBreak';
    const is_printable = !!e.data;

    if (before_command_line || (is_backspace && at_command_line_start))
    {
        e.preventDefault();
        if (is_printable) TERMINAL.append(e.data);
        return;
    }

    // enter (new line) at the end of command line
    if (is_enter && at_command_line_end)
    {
        e.preventDefault();
        const command_line = FUN.get_command_line();
        TERMINAL.append(NL);

        const [cmd, ...params] = command_line.trim().split(" ").filter(Boolean);

        if (cmd)
        {
            const cmd_lower = cmd.toLowerCase();
            HISTORY.push([cmd, ...params].join(" "));

            if (Object.keys(COMMAND).includes(cmd_lower))
                COMMAND[cmd_lower](params);
            else if (Object.keys(ALIASES).includes(cmd_lower))
                FUN.exec(`${ALIASES[cmd_lower]} ${params.join(" ")}`);
            else
                FUN.print(`shell: command not found: ${cmd}`);
        }

        FUN.prompt();
        TERMINAL.scroll_bottom();
        return;
    }
};

const handle_keydown = (e) => {
    if (e.key === "ArrowUp")
    {
        e.preventDefault();
        FUN.set_command_line(HISTORY.older());
    }
    else if (e.key === "Tab")
    {
        e.preventDefault();
        // TODO tab completion
    }
    else if (e.key === "ArrowDown")
    {
        e.preventDefault();
        FUN.set_command_line(HISTORY.newer());
    }
    else if (e.key === "ArrowLeft")
    {
        // stop at the end of prompt when approaching from the right but allow anywhere else
        if (TERMINAL.cursor_position === FUN.get_command_line_start())
        {
            e.preventDefault();
        }
    }
};

window.addEventListener('DOMContentLoaded', FUN.load);
TERMINAL.respawn(true);

