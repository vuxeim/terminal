const SOURCE_FILES = [
    'index.html',
    'style.css',

    'js/window.js', 'js/controls.js', 'js/filesystem.js', 'js/music.js',
    'js/splash.js', 'js/constants.js', 'js/main.js', 'js/terminal.js',
    'js/history.js', 'js/shell.js',
];

const __FILESYSTEM_SOURCE_OBJECT = {};

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
                'source': __FILESYSTEM_SOURCE_OBJECT,
                'info': {
                    'useragent': "%info::useragent%",
                    'platform': "%info::platform%",
                    'language': "%info::language%",
                    'resolution': "%info::resolution%",
                    'colordepth': "%info::colordepth%",
                    'timezone': "%info::timezone%",
                    'ip': "%info::ip%",
                },
            },
        },
    }, 
};

SOURCE_FILES.forEach((full_path) => {
    const stack = full_path.split('/');
    const node = stack.slice(0, -1).reduce((node, name) => (node[name] ??= {}, node[name]), __FILESYSTEM_SOURCE_OBJECT);
    node[stack.at(-1)] = `%source::${full_path}%`;
});
