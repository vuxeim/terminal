/* global
    File, set_fs_font_object, // filesystem.js
*/

const FONTS = {
    'Anonymous Pro': 'anonymous-pro.woff2',
    'Inconsolata': 'inconsolata.woff2',
    'JetBrains Mono': 'jetbrains-mono.woff2',
    'SourceCode Pro': 'source-code-pro.woff2',
};

class FONTMANAG
{
    static #DIR = 'fonts';

    static get #list() {
        return Object.freeze([...document.fonts]);
    }

    static get names() {
        return Object.keys(FONTS);
    }

    static exist(name) {
        return this.names.includes(name);
    }

    static load_if(name) {
        if (!FONTMANAG.#loaded(name))
        {
            FONTMANAG.#load(name);
        }
    }

    static #loaded(name) {
        return this.#list.map(f => f.family.unquote()).includes(name.unquote());
    }

    static #load(name) {
        const location = FONTS[name];
        const font = new FontFace(name, `url(${this.#DIR}/${location})`);
        font.load().then(f => document.fonts.add(f));
    }

    static
    {
        Object.values(FONTS).forEach((f) =>
        {
            const filename = 'fonts/'+f;

            fetch(filename, { method: 'HEAD' }).then((response) =>
            {
                if (response.status !== 200) return;
                const headers = response.headers;
                const content_length = headers.get('content-length');
                const size = parseInt(content_length);
                const file = new File({
                    filename: f,
                    path: filename,
                    binary: true,
                    size: size,
                    meta_content: filename,
                    content: "",
                });
                set_fs_font_object(filename, file);
            });
        });
    }
}


