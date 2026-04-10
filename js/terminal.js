/* global
    FS, set_fs_command_object, // filesystem.js
    NL, VER, COLORS, // constants.js
    get_terminal, get_window, // main.js
    SHELL, // shell.js
    SPLASH, // splash.js
    HISTORY, // history.js
    COMMAND_DESCRIPTIONS, // controls.js
    PLAYER, // music.js
    ParseError, parse_args, ExpansionError, expand_args, // parser.js
    FONTMANAG, // fonts.js
 */

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

    static get font_weight() {
        const normal = 400;
        const t = get_terminal();
        t.style.fontWeight ||= normal.toString();
        return t.style.fontWeight;
    }

    static set font_weight(weight) {
        get_terminal().style.fontWeight = weight.toString();
    }

    static get font() {
        const family = get_terminal().style.fontFamily || "Default";
        return family.split(',').at(0).unquote();
    }

    static set font(name) {
        get_terminal().style.fontFamily = `"${name}", monospace`;
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
        FUN.clear();
        FUN.print_motd();
        FUN.prompt();
        TERMINAL.focus();
    },
    print_motd: () => {
        const elements = [MOTD, FUN.get_random_ascii(), FUN.get_version()];
        const string = elements.join(NL);
        FUN.print(string);
    },
    get_version: () => VER,
    set_command_line: TERMINAL.set_command_line,
    get_command_line: () => TERMINAL.data.split(SHELL.prompt).at(-1),
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
    print: (str="") => TERMINAL.append(str+NL),
    prompt: () => { if (TERMINAL.exists) TERMINAL.append(SHELL.prompt); },
    commands_list: (delim=" ") => Object.keys(COMMAND).filter(Boolean).join(delim),
    aliases_list: (delim=" ") => Object.entries(ALIASES).map(([alias, cmd]) => `${alias}=${cmd}`).filter(Boolean).join(delim),
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
    clear: TERMINAL.clear,
    spawn: () => {
        if (TERMINAL.exists)
            return;
        TERMINAL.respawn();
        FUN.load();
    },
    date_fmt: (date) => {
        const year_ago = new Date();
        year_ago.setFullYear(year_ago.getFullYear()-1);
        return [
            date.toLocaleString(undefined, { month: 'short' }),
            date.getDate().toString().padStart(2, " "),
            (year_ago > date)
                ? date.getFullYear().toString().padStart(5, " ")
                : date.toLocaleString(undefined, { hour: 'numeric', minute: 'numeric', hour12: false }),
        ].join(" ");
    },
};

const ALIASES = {};

const COMMAND = {
    help: ([cmd_name, ..._]) => {
        if (!cmd_name)
        {
            const aliases = Object.entries(ALIASES).map(([alias, cmd]) => `${alias}=${cmd}`).join(" ");
            FUN.print(`Usage: help <command name>`);
            FUN.print(`Available commands:${NL}${FUN.commands_list()}`);
            FUN.print(`Aliases: ${aliases ? NL + aliases : 'none'}`);
        }
        else
            FUN.print(COMMAND_DESCRIPTIONS[cmd_name] ?? `help: no help for: ${cmd_name}`);
    },
    args: ([...args]) => args.forEach(arg => FUN.print(arg)),
    font: ([subcommand, ...args]) => {
        if (subcommand === 'weight')
        {
            const raw = args.shift() ?? '';
            const value = parseInt(raw);
            if (!Number.isNaN(value))
                TERMINAL.font_weight = value.toString();
            FUN.print(`Font weight: ${TERMINAL.font_weight}`);
        }
        else if (subcommand === 'face')
        {
            const name = args.shift();
            if (!FONTMANAG.exist(name))
            {
                if (name)
                {
                    FUN.print(`Unknown font: ${name}`);
                }
                else
                {
                    FUN.print(`Font: ${TERMINAL.font}`);
                }
                FUN.print('Available:');
                FONTMANAG.names.forEach(f => FUN.print(f));
            }
            else
            {
                FONTMANAG.load_if(name);
                TERMINAL.font = name;
            }
        }
        else
        {
            FUN.print('font weight');
            FUN.print('font face');
        }
    },
    music: ([subcommand, ...args]) => {
        const prefix = "~ᴘʟᴀʏᴇʀ~";

        if (subcommand === 'play')
        {
            PLAYER.play();
            FUN.print(`${prefix} Playing: ${PLAYER.pretty_name}`);
        }
        else if (subcommand === 'next')
        {
            PLAYER.next();
            const d = PLAYER.details;
            FUN.print(`${prefix} (${d.index}/${d.playlist_length}) Now playing: ${PLAYER.pretty_name}`);
        }
        else if (subcommand === 'prev')
        {
            PLAYER.prev();
            const d = PLAYER.details;
            FUN.print(`${prefix} (${d.index}/${d.playlist_length}) Now playing: ${PLAYER.pretty_name}`);
        }
        else if (subcommand === 'pause')
        {
            PLAYER.pause();
            FUN.print(`${prefix} Paused: ${PLAYER.pretty_name}`);
        }
        else if (subcommand === 'stop')
        {
            const name = PLAYER.pretty_name;
            PLAYER.stop();
            FUN.print(`${prefix} Stopped: ${name}`);
        }
        else if (subcommand === 'volume')
        {
            const raw = args.shift() ?? '';
            const in_percent = raw.endsWith('%');
            const is_relative = raw.startsWith('+') || raw.startsWith('-');
            const value = parseFloat(raw);
            let volume = value / (in_percent ? 100 : 1);
            if (!in_percent && value > 1) volume /= 100;
            if (!Number.isNaN(volume))
                PLAYER.volume = is_relative ? PLAYER.volume + volume : volume;
            FUN.print(`${prefix} Volume: ${PLAYER.volume*100}%`);
        }
        else if (subcommand === 'info')
        {
            const d = PLAYER.details;
            FUN.print(`(${d.index}/${d.playlist_length})`);
            FUN.print(`Title: ${d.title}`);
            FUN.print(`Artist: ${d.artist}`);
            FUN.print(`Link: ${d.link}`);
            FUN.print(`Size: ${d.size}`);
        }
        else if (subcommand === 'playlist')
        {
            PLAYER.playlist.forEach((details) => {
                FUN.print(`${details.index}. ${details.title} by ${details.artist}`);
            });
        }
        else if (subcommand === 'show')
        {
            if (PLAYER.hidden)
            {
                FUN.print("Shown!");
                PLAYER.show();
            }
            else
                FUN.print("Already shown...");
        }
        else if (subcommand === 'hide')
        {
            if (PLAYER.hidden)
                FUN.print("Already hidden...");
            else
            {
                FUN.print("Hidden!");
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
            FUN.print('music play');
            FUN.print('music pause');
            FUN.print('music stop');
            FUN.print('music next');
            FUN.print('music prev');
            FUN.print('music mute');
            FUN.print('music show');
            FUN.print('music hide');
            FUN.print('music loop');
            FUN.print('music info');
            FUN.print('music playlist');
            FUN.print('music volume <0..1|n%>');
        }
    },
    version: () => FUN.print(FUN.get_version()),
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
    history: () => FUN.print(HISTORY.list().join(NL)),
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
    pwd: () => FUN.print(FS.resolve_path(SHELL, SHELL.path)),
    ls: ([...paths]) =>
    {
        let path = paths.shift();
        path = FS.resolve_path(SHELL, path);
        const node = FS.get_node(path);
        if (node === null)
        {
            FUN.print(`ls: cannot access '${path}': No such file or directory`);
            return;
        }

        let nodes;
        if (FS.is_dir(node))
        {
            const entries = Object.keys(node);
            FUN.print(`total ${entries.length}`);

            const node_content = FS.list_dir(node);
            const directories = node_content.filter(([_parent, child]) => FS.is_dir(child)).sort();
            const files = node_content.filter(([_parent, child]) => !FS.is_dir(child)).sort();
            nodes = directories.concat(files);
        }
        else
        {
            nodes = [[node.name, node]];
        }

        const lengths = nodes.map(([_name, content]) => {
            if (FS.is_dir(content))
                return Object.keys(content).length.toString().length;
            else
                return content.size.numfmt().length;
        });

        const pad = Math.max(...lengths) + 1;

        const date = new Date(2024, 11, 24, 12, 30, 0);

        for (const [name, content] of nodes) {
            const size = FS.is_dir(content) ? Object.keys(content).length : content.size;
            const size_fmt = FS.is_dir(content) ? size.toString().padStart(pad) : size.numfmt({ pad: pad });
            const mode = FS.is_dir(content) ? 'drwxr-xr-x' : '-rw-r--r--';
            const date_fmt = FUN.date_fmt(date);
            FUN.print(`${mode} ${SHELL.user} ${SHELL.group} ${size_fmt} ${date_fmt} ${name}`);
        }

        if (paths.length) COMMAND.ls(paths);
    },
    cat: ([...paths]) => {
        let path = paths.shift();
        if (!path) return FUN.print('cat: missing operand');

        path = FS.resolve_path(SHELL, path);

        const node = FS.get_node(path);
        if (node === null)
        {
            FUN.print(`cat: ${path}: No such file or directory`);
        }
        else if (FS.is_dir(node))
        {
            FUN.print(`cat: ${path}: Is a directory`);
        }
        else
        {
            // the actual print
            const content = node.content.replaceLast(NL);
            if (content.length > 0)
            {
                FUN.print(content);
            }
        }

        if (paths.length) COMMAND.cat(paths);
    },
    su: ([name, ..._]) => {
        if (name)
            SHELL.user = name;
    },
    hostname: ([name, ..._]) => {
        if (name)
            SHELL.host = name;
    },
    "?": () => FUN.print('Do you need help? Just type `help`'),
    cd: ([path, ..._]) => {
        if (!path) {
            SHELL.path = '~';
            return;
        }
        path = FS.resolve_path(SHELL, path);
        const node = FS.get_node(path);
        if (node === null) {
            return FUN.print(`cd: no such file or directory: ${path}`);
        }
        if (!FS.is_dir(node)) {
            return FS.print(`cd: not a directory: ${path}`);
        }
        const home = FS.resolve_path(SHELL, '~');
        SHELL.path = path.startsWith(home) ? path.replace(home, '~') : path;
    },
    echo: ([...args]) => FUN.print(args.join(" ")),
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
        if (!arg) return FUN.print(FUN.aliases_list(NL));
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
};

Object.keys(COMMAND).forEach(cmd => set_fs_command_object('commands/'+cmd, COMMAND_DESCRIPTIONS[cmd] ?? ""));

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
    const after_command_line = !before_command_line;
    const at_command_line_start = TERMINAL.cursor_position === FUN.get_command_line_start();
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
    if (is_enter && after_command_line)
    {
        e.preventDefault();
        const command_line = FUN.get_command_line();
        HISTORY.push(command_line);
        TERMINAL.append(NL);

        let args;
        try
        {
            args = parse_args(command_line);
        }
        catch (err)
        {
            const absolute = SHELL.prompt.length;

            if (err.type === ParseError.UNCLOSED_QUOTE)
            {
                FUN.print((" ".repeat(absolute+err.from)) + "^" + (" ".repeat(err.to-err.from-1)) + "^");
            }
            else if (err.type === ParseError.TRAILING_BACKSLASH)
            {
                const index = err.index;
                FUN.print((" ".repeat(absolute+index)) + "^");
            }

            FUN.print(`shell: ${err.message}`);
        }

        let cmd;
        try
        {
            [cmd, ...args] = expand_args(SHELL, args);
        }
        catch (err)
        {
            if (err.type === ExpansionError.NO_MATCHES)
            {
                FUN.print(`shell: ${err.message}`);
            }
        }

        if (cmd)
        {
            const cmd_lower = cmd.toLowerCase();

            if (Object.keys(COMMAND).includes(cmd_lower))
                COMMAND[cmd_lower](args);
            else if (Object.keys(ALIASES).includes(cmd_lower))
                COMMAND[ALIASES[cmd_lower]](args);
            else
                FUN.print(`shell: command not found: ${cmd}`);
        }

        FUN.prompt();
        TERMINAL.scroll_bottom();
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

