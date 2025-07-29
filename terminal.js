const COLORS = {
    0: "#0C0C0C", 1: "#0037DA", 2: "#13A10E", 3: "#3A96DD",
    4: "#C50F1F", 5: "#881798", 6: "#C19C00", 7: "#CCCCCC",
    8: "#767676", 9: "#3B78FF", a: "#16C60C", b: "#61D6D6",
    c: "#E74856", d: "#B4009E", e: "#F9F1A5", f: "#F2F2F2",
}

const FUN = {
    print: (str="") => t.value += `${str}${str ? "\n" : ""}${SHELL.prompt} `,
    commands_list: (delim=" ") => Object.entries(COMMAND).map(e=>e.at(0)).filter(Boolean).join(delim),
    aliases_list: (delim=" ") => Object.entries(ALIASES).map(e=>`${e.at(0)}=${e.at(1)}`).filter(Boolean).join(delim),
    update_prompt: () => SHELL.prompt = `[${SHELL.user}@${SHELL.host} ${SHELL.path}] $`,
    keyboard_interrupt: () => FUN.print("Ctrl-C"),
    exec: (text="") => {
        const [name, ...args] = text.split(" ");
        const cmd_name = Object.keys(ALIASES).includes(name) ? ALIASES[name] : name;
        COMMAND[cmd_name](args);
    },
}

let ALIASES = {};

const COMMAND = {
    help: () => FUN.print(`Available commands: ${FUN.commands_list()}\nAliases: ${Object.keys(ALIASES)}`),
    clear: () => (t.value = "") || FUN.print(),
    "": () => t.value = t.value.slice(0, -1).trim()+" ",
    ping: ([target, ..._]) => FUN.print(`pong ${target ? target : ""}`),
    color: ([code, ..._]) => (code = [...(code||"0a")].reverse().join("")) && ([t.style.color, t.style.backgroundColor] = [COLORS[code[0]], COLORS[code[1]]]) && FUN.print(),
    pwd: () => FUN.print((SHELL.path === "~") ? `/home/${SHELL.user}` : SHELL.path),
    ls: () => FUN.print('No files yet'),
    user: ([name, ..._]) => (SHELL.user = (name || SHELL.user)) && FUN.update_prompt() && FUN.print(),
    host: ([name, ..._]) => (SHELL.host = (name || SHELL.host)) && FUN.update_prompt() && FUN.print(),
    exit: () => document.getElementById("window").remove(),
    "?": () => FUN.print('Do you need help? Then just type `help`'),
    cd: ([path, ..._]) => (SHELL.path = (path ? SHELL.path + `/${path}` : "~")) && FUN.update_prompt() && FUN.print(),
    echo: ([...args]) => (FUN.print(args.join(" "))),
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
    prompt: undefined,
}

const NL = String.fromCharCode(10);

const t = document.getElementById("terminal");

let content_length = t.textLength;

const CTRL_HANDLERS = {
    c: FUN.keyboard_interrupt,
    d: COMMAND.exit,
    l: COMMAND.clear,
}

document.addEventListener("keydown", (e) => {
    if (!e.ctrlKey) return;
    if (Object.keys(CTRL_HANDLERS).includes(e.key))
    {
        CTRL_HANDLERS[e.key]();
        e.preventDefault();
    }
});

t.addEventListener("input", (e) => {
    // enter (new line)
    if (t.value.slice(-1).charCodeAt(0) === 10)
    {
        [cmd, ...params] = t.value.split(NL).at(-2).replace(SHELL.prompt, "").trim().split(" ").filter(Boolean);
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
    }
    // backspace
    else if (t.textLength < content_length && t.value.split(NL).at(-1) === SHELL.prompt)
    {
        t.value = t.value.split(NL).slice(0, -1).join(NL)+(t.value.indexOf(NL) > -1 ? NL : '');
        FUN.print();
    }
    content_length = t.textLength;
});

window.addEventListener('DOMContentLoaded', () => FUN.update_prompt() && COMMAND.clear() && t.focus());

