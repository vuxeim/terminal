const CTRL_HANDLERS_DESCRIPTIONS = {
    c: "Kill long-running job",
    d: "Close terminal",
    l: "Clear terminal screen",
    e: "Spawn new terminal",
};

const COMMAND_DESCRIPTIONS = {
    help: "list available commands or get command help",
    music: "use music player",
    font: "manipulate font properties",
    history: "command history",
    ls: "list directory content",
    cat: "concatenate files content",
    reverse: "turn reality around",
    color: "change fore and background colors",
    echo: "echo text back to the screen",
    clear: "clear screen",
    pwd: "print current working directory",
    ping: "simply respond",
    sleep: "do nothing",
    alias: "manage command aliases",
    ascii: "print ascii art",
    args: "investigate command line arguments",
    hostname: "change hostname",
    su: "switch user",
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

