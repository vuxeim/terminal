class DYN {
    static SOURCE = {};
    static INFO = {};

    static {
        fetch('terminal.js').then(r => r.text()).then(t => this.SOURCE.terminal_js = t);
        fetch('window.js').then(r => r.text()).then(t => this.SOURCE.window_js = t);
        fetch('style.css').then(r => r.text()).then(t => this.SOURCE.style_css = t);
        fetch('index.html').then(r => r.text()).then(t => this.SOURCE.index_html = t);
        this.INFO.useragent = navigator.userAgent;
        this.INFO.platform = navigator.platform;
        this.INFO.language = navigator.language;
        this.INFO.resolution = `${screen.width}x${screen.height}`;
        this.INFO.colordepth = screen.colorDepth;
        this.INFO.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
}

class HISTORY {
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
    static #cached_terminal_element;
    static #terminal_parent;
    static #terminal_next_sibling;
    static #selectionStart;
    static #selectionEnd;
    static #data;

    static sleepTimeout;
    static sleepCleanup;
    static cachedPromptFunction;

    static save = () => {
        if (!get_terminal())
            return;
        this.#data = get_terminal().value;
        this.#selectionStart = get_terminal().selectionStart;
        this.#selectionEnd = get_terminal().selectionEnd;
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
        this.#cached_terminal_element = get_window().cloneNode(true);
        this.#terminal_parent = get_window().parentNode;
        this.#terminal_next_sibling = get_window().nextSibling;
        this.#selectionStart = 0;
        this.#selectionEnd = 0;
        this.#data = "";
    }
};

const NL = String.fromCharCode(10);

const COLORS = {
    0: "#0C0C0C", 1: "#0037DA", 2: "#13A10E", 3: "#3A96DD",
    4: "#C50F1F", 5: "#881798", 6: "#C19C00", 7: "#CCCCCC",
    8: "#767676", 9: "#3B78FF", a: "#16C60C", b: "#61D6D6",
    c: "#E74856", d: "#B4009E", e: "#F9F1A5", f: "#F2F2F2",
}

const FS = {
    '/': {
        'home': {
            'user': {
                'github': "vuxeim",
                'projects': { 'terminal': 'this site github/terminal',
                    'sheltero': 'textual game github/sheltero',
                    'vodo': 'textual todo app github/vodo',
                },
                'software': {
                    'browser': 'librewolf',
                    'terminal': 'URxvt',
                    'shell': "im using zsh",
                    'os': "im using arch btw",
                },
                'source': {
                    'terminal.js': "%source::terminal.js%",
                    'window.js': "%source::window.js%",
                    'style.css': "%source::style.css%",
                    'index.html': "%source::index.html%",
                },
                'info': {
                    'useragent': "%info::useragent%",
                    'platform': "%info::platform%",
                    'language': "%info::language%",
                    'resolution': "%info::resolution%",
                    'colordepth': "%info::colordepth%",
                    'timezone': "%info::timezone%",
                },
            },
        },
    }, 
};

const MOTD = '>  Hello! Use \'help\' command!  < ';

const SPLASH = [
    String.raw`
Yb    dP 88   88 Yb  dP 888888 88 8b    d8
 Yb  dP  88   88  YbdP  88__   88 88b  d88
  YbdP   Y8   8P  dPYb  88""   88 88YbdP88
   YP    #YbodP' dP  Yb 888888 88 88 YY 88
`.replaceAll('#', '`'),
    String.raw`
:::     ::: :::    ::: :::    ::: :::::::::: ::::::::::: ::::    ::::
:+:     :+: :+:    :+: :+:    :+: :+:            :+:     +:+:+: :+:+:+
+:+     +:+ +:+    +:+  +:+  +:+  +:+            +:+     +:+ +:+:+ +:+
+#+     +:+ +#+    +:+   +#++:+   +#++:++#       +#+     +#+  +:+  +#+
 +#+   +#+  +#+    +#+  +#+  +#+  +#+            +#+     +#+       +#+
  #+#+#+#   #+#    #+# #+#    #+# #+#            #+#     #+#       #+#
    ###      ########  ###    ### ########## ########### ###       ###
`,
    String.raw`
██    ██ ██    ██ ██   ██ ███████ ██ ███    ███
██    ██ ██    ██  ██ ██  ██      ██ ████  ████
██    ██ ██    ██   ███   █████   ██ ██ ████ ██
 ██  ██  ██    ██  ██ ██  ██      ██ ██  ██  ██
  ████    ██████  ██   ██ ███████ ██ ██      ██
`,
    String.raw`
██╗   ██╗██╗   ██╗██╗  ██╗███████╗██╗███╗   ███╗
██║   ██║██║   ██║╚██╗██╔╝██╔════╝██║████╗ ████║
██║   ██║██║   ██║ ╚███╔╝ █████╗  ██║██╔████╔██║
╚██╗ ██╔╝██║   ██║ ██╔██╗ ██╔══╝  ██║██║╚██╔╝██║
 ╚████╔╝ ╚██████╔╝██╔╝ ██╗███████╗██║██║ ╚═╝ ██║
  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝╚═╝     ╚═╝
`,
    String.raw`
                                        ##
                                        ""
 ##m  m## ##    ## "##  ##"  m####m   ####    ####m##m
  ##  ##  ##    ##   ####   ##mmmm##    ##    ## ## ##
  "#mm#"  ##    ##   m##m   ##""""""    ##    ## ## ##
   ####   ##mmm###  m#""#m  "##mmmm# mmm##mmm ## ## ##
    ""     """" "" """  """   """""  """""""" "" "" ""
`,
    String.raw`
 _   __ ,   . _  .-   ___  # , _ , _
 |   /  |   |  \,'  .'   # | |' #|' #.
 #  /   |   |  /\   |----' | |   |   |
  \/    #._/| /  \  #.___, / /   '   /
`.replaceAll('#', '`'),
    String.raw`
                                      ,e,
Y88b    / 888  888 Y88b  /   e88~~8e   "  888-~88e-~88e
 Y88b  /  888  888  Y88b/   d888  88b 888 888  888  888
  Y88b/   888  888   Y88b   8888__888 888 888  888  888
   Y8/    888  888   /Y88b  Y888    , 888 888  888  888
    Y     "88_-888  /  Y88b  "88___/  888 888  888  888
`,
    String.raw`
.-.   .-. .-. .-. .-..-. .----. .-. .-.  .-.
 \ \_/ /  | } { | \ {} / } |__} { | }  \/  {
  \   /   \ #-' / / {} \ } '__} | } | {  } |
   #-'     #---'  #-'#-' #----' #-' #-'  #-'
`.replaceAll('#', '`'),
    String.raw`
                          __
.--.--.--.--.--.--.-----.|__|.--------.
|  |  |  |  |_   _|  -__||  ||        |
 \___/|_____|__.__|_____||__||__|__|__|
`,
    String.raw`
                                    d8b
                                    Y8P

888  888 888  888 888  888  .d88b.  888 88888b.d88b.
888  888 888  888 #Y8bd8P' d8P  Y8b 888 888 "888 "88b
Y88  88P 888  888   X88K   88888888 888 888  888  888
 Y8bd8P  Y88b 888 .d8""8b. Y8b.     888 888  888  888
  Y88P    "Y88888 888  888  "Y8888  888 888  888  888
`.replaceAll('#', '`'),
    String.raw`
:::      .::. ...    :::   .,::      .: .,::::::   ::: .        :
';;,   ,;;;'  ;;     ;;;   #;;;,  .,;;  ;;;;''''   ;;; ;;,.    ;;;
 \[[  .[[/   [['     [[[     '[[,,[['    [[cccc    [[[ [[[[, ,[[[[,
  Y$c.$$"    $$      $$$      Y$$$P      $$""""    $$$ $$$$$$$$"$$$
   Y88P      88    .d888    oP"##"Yo,    888oo,__  888 888 Y88" 888o
    MP        "YmmMMMM"" ,m"       "Mm,  """"YUMMM MMM MMM  M'  "MMM
`.replaceAll('#', '`'),
    String.raw`
_  _ _  _ _  _ ____ _ _  _
|  | |  |  \/  |___ | |\/|
 \/  |__| _/\_ |___ | |  |
`,
    String.raw`
                                              ███
                                             ░░░
 █████ █████ █████ ████ █████ █████  ██████  ████  █████████████
░░███ ░░███ ░░███ ░███ ░░███ ░░███  ███░░███░░███ ░░███░░███░░███
 ░███  ░███  ░███ ░███  ░░░█████░  ░███████  ░███  ░███ ░███ ░███
 ░░███ ███   ░███ ░███   ███░░░███ ░███░░░   ░███  ░███ ░███ ░███
  ░░█████    ░░████████ █████ █████░░██████  █████ █████░███ █████
   ░░░░░      ░░░░░░░░ ░░░░░ ░░░░░  ░░░░░░  ░░░░░ ░░░░░ ░░░ ░░░░░
`,
    String.raw`
 █░█ █░█ █░█ ██▀ ▀ ▄▀▄▀▄
 ▀▄▀ ▀▄█ ▄▀▄ █▄▄ █ █░▀░█
`,
    String.raw`
                                           ,,
                                           db

#7M'   #MF'#7MM  #7MM  #7M'   #MF'.gP"Ya #7MM  #7MMpMMMb.pMMMb.
  VA   ,V    MM    MM    #VA ,V' ,M'   Yb  MM    MM    MM    MM
   VA ,V     MM    MM      XMX   8M""""""  MM    MM    MM    MM
    VVV      MM    MM    ,V' VA. YM.    ,  MM    MM    MM    MM
     W       #Mbod"YML..AM.   .MA.#Mbmmd'.JMML..JMML  JMML  JMML.
`.replaceAll('#', '`'),
    String.raw`
                          .__
___  ____ _____  ___ ____ |__| _____
\  \/ /  |  \  \/  // __ \|  |/     \
 \   /|  |  />    <\  ___/|  |  Y Y  \
  \_/ |____//__/\__\\____\|__|__|_|__/
`,
    String.raw`
               ___
\  / |  | \_/ |__  |  |\/|
 \/  \__/ / \ |___ |  |  |
`,
    String.raw`
                                   ||
.... ... ... ...  ... ...   ....  ...  .. .. ..
 '|.  |   ||  ||   '|..'  .|...||  ||   || || ||
  '|.|    ||  ||    .|.   ||       ||   || || ||
   '|     '|..'|. .|  ||.  '|...' .||. .|| || ||.
`,
];

const COMMAND_DESCRIPTIONS = {
    help: "list available commands or get command help",
    su: "switch user",
    hostname: "change hostname",
    ls: "list directory content",
    cat: "concatenate files content",
    clear: "clear screen",
    color: "change fore and background colors",
    ping: "simply respond",
    pwd: "print current working directory",
    sleep: "do nothing",
    alias: "manage command aliases",
    ascii: "print ascii art",
    reverse: "turn reality around",
    history: "command history",
};

const FUN = {
    get_random_ascii: () => SPLASH[Math.floor(Math.random()*SPLASH.length)],
    load: () => {
        SHELL.path = '~';
        FUN.update_prompt();
        FUN.clear();
        FUN.print(MOTD + "\n" + FUN.get_random_ascii());
        FUN.prompt();
        content_length = get_terminal().textLength;
        get_terminal().focus();
        STATE.save();
    },
    set_command_line: (full_command) => {
        const t = get_terminal();
        t.value = t.value.insert(t.value.lastIndexOf(SHELL.prompt), Infinity, `${SHELL.prompt} ${full_command}`);
        STATE.save();
    },
    get_command_line: () => get_terminal().value.split(NL).at(-1).replace(SHELL.prompt + " ", ""),
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

        content = content.replace("%info::useragent%", DYN.INFO.useragent);
        content = content.replace("%info::platform%", DYN.INFO.platform);
        content = content.replace("%info::language%", DYN.INFO.language);
        content = content.replace("%info::resolution%", DYN.INFO.resolution);
        content = content.replace("%info::colordepth%", DYN.INFO.colordepth);
        content = content.replace("%info::timezone%", DYN.INFO.timezone);

        content = content.replace("%source::window.js%", DYN.SOURCE.window_js);
        content = content.replace("%source::style.css%", DYN.SOURCE.style_css);
        content = content.replace("%source::index.html%", DYN.SOURCE.index_html);
        // replacing terminal.js should happen last
        // if other file contains string %source::XYZ% - things will break
        content = content.replace("%source::terminal.js%", DYN.SOURCE.terminal_js);
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
        if (num && int !== NaN)
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
        for (const [parent, child] of FUN.content_of(node)) {
            const size = FUN.is_dir(child) ? Object.keys(child).length : child.length;
            const mode = FUN.is_dir(child) ? 'drwxr-xr-x' : '-rw-r--r--';
            FUN.print(`${mode} ${SHELL.user} ${SHELL.group} ${("" + size).padStart(2, " ")} ${FUN.date_fmt(date)} ${parent}`);
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

let content_length = get_terminal().textLength;

const CTRL_HANDLERS_WITH_DESCRIPTIONS = {
    c: [FUN.keyboard_interrupt, "Kill long-running job"],
    d: [COMMAND.exit, "Close terminal"],
    l: [FUN.clear, "Clear terminal screen"],
    e: [FUN.spawn, "Spawn new terminal"],
};

const add_to_controls = (html) => {
    const text = document.createElement("p");
    text.innerHTML = html;
    document.getElementById("controls").appendChild(text);
};

const CTRL_HANDLERS = {};
for (const [key, [func, desc]] of Object.entries(CTRL_HANDLERS_WITH_DESCRIPTIONS)) {
    CTRL_HANDLERS[key] = func;
    add_to_controls(`<kbd>Ctrl</kbd>+<kbd>${key.toUpperCase()}</kbd> - ${desc}`);
}

for (const [cmd, desc] of Object.entries(COMMAND_DESCRIPTIONS)) {
    add_to_controls(`<samp>${cmd}</samp> - ${desc}`);
}

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
    // when insertion isn't done at the end of textarea
    if (get_terminal().selectionStart != get_terminal().selectionEnd || get_terminal().selectionStart != get_terminal().value.length)
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
    else if (get_terminal().textLength < content_length && get_terminal().value.split(NL).at(-1) === SHELL.prompt)
    {
        get_terminal().value = get_terminal().value.split(NL).slice(0, -1).join(NL)+(get_terminal().value.indexOf(NL) > -1 ? NL : '');
        FUN.prompt();
    }

    content_length = get_terminal()?.textLength;
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
        e.preventDefault();
    }
};

window.addEventListener('DOMContentLoaded', FUN.load);
STATE.respawn(true);

