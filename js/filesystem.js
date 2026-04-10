const __SOURCE_FILES = [
    'index.html',
    'style.css',

    'js/window.js', 'js/controls.js', 'js/filesystem.js', 'js/music.js',
    'js/splash.js', 'js/constants.js', 'js/main.js', 'js/terminal.js',
    'js/history.js', 'js/shell.js',
];

const __INFO_FILES = {
    'info/ip': "127.0.0.1",
    'info/useragent': navigator.userAgent,
    'info/platform': navigator.platform,
    'info/language': navigator.language,
    'info/resolution': `${screen.width}x${screen.height}`,
    'info/colordepth': screen.colorDepth,
    'info/timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
};

class File
{
    #binary;
    #size;
    #meta_content;
    #content;
    #filename;
    #path;

    get size() { return this.#size; }
    get content() { return this.#content; }
    get name() { return this.#filename; }
    get absolute_path() { return this.#path; } // TODO: fix so that it this.#path is always absolute

    static from_content(full_name, content) {
        const name = full_name.split('/').at(-1);
        const path = full_name.replaceLast(name).replaceLast('/');
        return new File({ filename: name, path: path, content: content });
    }

    constructor({
        filename = null,
        path = null,
        binary = false,
        size = 0,
        meta_content = "%file::empty%",
        content = null
    } = {}) {
        if (content !== null)
        {
            if (!content.instanceof(Uint8Array) && !content.instanceof(String))
                content = content.toString();
            if (meta_content === '%file::empty%')
                meta_content = "%file::nonempty%";
            if (size === 0)
                size = content.length;
        }

        if (!meta_content.includes('::'))
            meta_content = 'file::' + meta_content;
        if (!meta_content.startsWith('%'))
            meta_content = '%' + meta_content;
        if (!meta_content.endsWith('%'))
            meta_content = meta_content + '%';

        this.#binary = binary;
        this.#size = size;
        this.#meta_content = meta_content;
        this.#content = content;

        console.assert(filename !== null);
        console.assert(path !== null);
        this.#filename = filename;
        this.#path = path;
    }
}

const __SOURCE_OBJECT = {};
const __MUSIC_OBJECT = {};
const __INFO_OBJECT = {};
const __FONT_OBJECT = {};
const __COMMAND_OBJECT = {};

const __FS = {
    '/': {
        'home': {
            'user': {
                'projects': {
                    'terminal': 'this site github/terminal',
                    'sheltero': 'textual game github/sheltero',
                    'vodo': 'textual todo app github/vodo',
                },
                'software': {
                    'browser': 'im using librewolf',
                    'terminal': 'im using URxvt',
                    'shell': "im using zsh",
                    'os': "im using arch btw",
                },
                '.shellrc': `color 6\nfont weight 800\n`,
                'source': __SOURCE_OBJECT,
                'music': __MUSIC_OBJECT,
                'info': __INFO_OBJECT,
                'commands': __COMMAND_OBJECT,
                'fonts': __FONT_OBJECT,
            },
        },
        'root': {},
    },
};

const FS = {
    is_dir: (node) => (!(node instanceof File)) && typeof node === 'object' && !node.instanceof(String),

    resolve_path: (shell, path) => {
        if (path) path = path.replace(/^~/, '/home/' + shell.user);
        const cwd = shell.path.startsWith('/') ? shell.path : shell.path.replace('~', '/home/' + shell.user);
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

    get_node: (path) => {
        const parts = path.split('/').filter(Boolean);
        let node = __FS['/'];
        for (const part of parts)
        {
            if (!FS.is_dir(node))
            {
                return null;
            }
            node = node[part];
        }
        return node ?? null;
    },

    list_dir: (node) => Object.entries(node),
};

const __set_fs_object = (root, full_path, value, prefix = null) => {
    const stack = full_path.split('/');
    if (prefix && stack.at(0) === prefix) stack.shift();
    const node = stack.slice(0, -1).reduce((n, name) => {
        n[name] ??= {};
        return n[name];
    }, root);
    node[stack.at(-1)] = value;
};

const set_fs_font_object =
    (path, value) => __set_fs_object(__FONT_OBJECT, path, value, 'fonts');
const set_fs_music_object =
    (path, value) => __set_fs_object(__MUSIC_OBJECT, path, value, 'music');
const set_fs_command_object =
    (path, value) => __set_fs_object(__COMMAND_OBJECT, path, File.from_content(path, value), 'commands');
const __set_info_object =
    (path, value) => __set_fs_object(__INFO_OBJECT, path, File.from_content(path, value), 'info');
const __set_source_object =
    (path, value) => __set_fs_object(__SOURCE_OBJECT, path, File.from_content(path, value), 'source');

__SOURCE_FILES.forEach((file) =>
    fetch(file)
        .then(res => res.text())
        .then(text => __set_source_object(file, text))
);

Object.entries(__INFO_FILES).forEach(([file, text]) => __set_info_object(file, text));

const hostname = window.location.hostname;
if (!["localhost", "127.0.0.1"].includes(hostname) && !["lan", "local"].includes(hostname.split('.').at(-1)))
{
    fetch('/api/ip')
        .then(r => r.text())
        .then(t => __set_info_object('info/ip', t.trim()));
}

// Transform strings into simple files
const __filesystem_traverse = (obj, path = "") => {
    for (const [key, value] of Object.entries(obj)) {
        const current_path = key === '/' ? '' : `${path}/${key}`;
        if (FS.is_dir(value))
        {
            __filesystem_traverse(value, current_path);
        }
        else
        {
            obj[key] = File.from_content(current_path, value);
        }
    }
};
__filesystem_traverse(__FS);
