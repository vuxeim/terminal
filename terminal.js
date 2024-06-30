const COLORS = {
    0: "#0C0C0C", 1: "#0037DA", 2: "#13A10E", 3: "#3A96DD",
    4: "#C50F1F", 5: "#881798", 6: "#C19C00", 7: "#CCCCCC",
    8: "#767676", 9: "#3B78FF", a: "#16C60C", b: "#61D6D6",
    c: "#E74856", d: "#B4009E", e: "#F9F1A5", f: "#F2F2F2",
}

const FUN = {
    print: (str="") => t.value += `${str}${str ? "\n" : ""}${SHELL.prompt} `,
    commands_list: () => Object.entries(COMMAND).map(e=>e.at(0)).filter(Boolean).join(" "),
    update_prompt: () => SHELL.prompt = `[${SHELL.user}@${SHELL.host} ${SHELL.path}] $`,
}

const COMMAND = {
    help: () => FUN.print(`Available commands: ${FUN.commands_list()}`),
    clear: () => (t.value = "") || FUN.print(),
    "": () => t.value = t.value.slice(0, -1).trim()+" ",
    ping: ([target, ..._]) => FUN.print(`pong ${target ? target : ""}`),
    color: ([code, ..._]) => (code = [...(code||"0a")].reverse().join("")) && ([t.style.color, t.style.backgroundColor] = [COLORS[code[0]], COLORS[code[1]]]) && FUN.print(),
    pwd: () => FUN.print(`/home/${SHELL.user}`),
    ls: () => FUN.print(FUN.commands_list()),
    user: ([name, ..._]) => (SHELL.user = (name || SHELL.user)) && FUN.update_prompt() && FUN.print(),
    host: ([name, ..._]) => (SHELL.host = (name || SHELL.host)) && FUN.update_prompt() && FUN.print(),
    exit: () => document.getElementById("window").remove(),
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

t.addEventListener("input", () => { 
    if (t.value.slice(-1).charCodeAt(0) === 10) {
        [cmd, ...params] = t.value.split(NL).at(-2).replace(SHELL.prompt, "").trim().split(" ").filter(Boolean);
        (COMMAND[cmd || ""]||(() => FUN.print(`shell: command not found: ${cmd}`)))(params);
    } else if (t.textLength < content_length && t.value.split(NL).at(-1) == SHELL.prompt) {
        t.value = t.value.split(NL).slice(0, -1).join(NL)+(t.value.indexOf(NL) > -1 ? NL : '');
        FUN.print();
    }
    content_length = t.textLength;
});

window.addEventListener('DOMContentLoaded', () => FUN.update_prompt() && COMMAND["clear"]());

