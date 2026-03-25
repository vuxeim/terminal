// get_window is accessible from terminal.js, since terminal.js is loaded first.
//const get_window = () => document.getElementById("window");

let dragging = x = y = old_x = old_y = 0;

const drag = (e) => {
    if (!e.target.closest(".topbar"))
        return;
    if (e.target.closest(".indicator"))
        return;
    dragging = true;
    old_x = e.clientX;
    old_y = e.clientY;
    console.debug(1);
};

document.addEventListener("spawnterminal", () => {
    get_window().addEventListener('mousedown', drag);
});

get_window().addEventListener('mousedown', drag);

document.addEventListener('mouseup', (e) => {
    dragging = false;
});

document.addEventListener('mousemove', (e) => {
    if (!dragging)
        return;
    e.preventDefault();

    const terminal = get_window();

    const dx = e.clientX - old_x;
    const dy = e.clientY - old_y;

    old_x = e.clientX;
    old_y = e.clientY;

    const maxX = window.innerWidth  - terminal.offsetWidth;
    const maxY = window.innerHeight - terminal.offsetHeight;

    const newX = Math.max(0, Math.min(terminal.offsetLeft + dx, maxX));
    const newY = Math.max(0, Math.min(terminal.offsetTop  + dy, maxY));

    terminal.style.left = newX + "px";
    terminal.style.top  = newY + "px";
});

document.addEventListener('selectstart', (e) => dragging && e.preventDefault());

