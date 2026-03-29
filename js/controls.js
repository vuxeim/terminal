const CTRL_HANDLERS_DESCRIPTIONS = {
    c: "Kill long-running job",
    d: "Close terminal",
    l: "Clear terminal screen",
    e: "Spawn new terminal",
};

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

const add_to_controls = (html) => {
    const text = document.createElement("p");
    text.innerHTML = html;
    document.getElementById("controls").appendChild(text);
};

for (const [key, desc] of Object.entries(CTRL_HANDLERS_DESCRIPTIONS)) {
    add_to_controls(`<kbd>Ctrl</kbd>+<kbd>${key.toUpperCase()}</kbd> - ${desc}`);
}

for (const [cmd, desc] of Object.entries(COMMAND_DESCRIPTIONS)) {
    add_to_controls(`<samp>${cmd}</samp> - ${desc}`);
}

