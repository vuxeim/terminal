/* global
    File, set_fs_music_object // filesystem.js
*/

const MUSIC_FILES = [
    'fovqDOmdgFQ.opus',
    'BQWc_MgcT0A.opus',
    '4X7ZvpwBiKA.opus',
    'DwVTLrg-2-0.opus',
    'oROoI-bYgGQ.opus',
];

const __MUSIC_DECODER = new TextDecoder('utf-8');
const __MUSIC_HEADER = { Range: "bytes=0-2048" };

class Song
{
    #title;
    #id;
    #artist;
    #filename;
    #size;

    get url() { return this.#filename; }
    get title() { return this.#title; }
    get artist() { return this.#artist; }
    get link() { return "https://youtu.be/" + this.#id; }
    get size() { return this.#size.numfmt(); }

    #fetch() {
        const parse = (buffer) => {
            if (!buffer)
            {
                console.error('No buffer');
                return;
            }

            const bytes = new Uint8Array(buffer);
            const view = new DataView(buffer);
            const decoded = __MUSIC_DECODER.decode(bytes.slice(0, 128).map(byte => byte & 0x7f));

            const index = decoded.indexOf("OpusTags");

            if (index === -1)
            {
                console.error('Cannot find OpusTags tag');
                return;
            }

            let ptr = index + 8;
            ptr += 4 + view.getUint32(ptr, true);

            const comment_count = view.getUint32(ptr, true);
            ptr += 4;
            const comments = {};

            for (let i = 0; i < comment_count; i++)
            {
                const length = view.getUint32(ptr, true);
                ptr += 4;
                const str = __MUSIC_DECODER.decode(bytes.slice(ptr, ptr + length));
                ptr += length;
                const [key, ...values] = str.split('=');
                comments[key.toLowerCase()] = values.join('=');
            }

            this.#artist = comments.artist;
            this.#title = comments.title;
            const file = new File({ filename: this.#filename.replace(PLAYER.DIR, ''), path: this.#filename, binary: true, size: this.#size, meta_content: this.#filename, content: bytes });
            set_fs_music_object(this.#filename, file);
        };

        const handle_response = (response) => {
            const code = response.status;
            const is_ok = code === 200;
            const is_partial = code === 206;

            if (!is_ok && !is_partial)
            {
                return;
            }

            if (!is_partial)
            {
                // python http.server doesn't support range header, although apache does
                console.warn(`Header ${__MUSIC_HEADER.stringify()} is not supported. Entire file will be downloaded!`);
            }

            const headers = response.headers;
            const content_range = headers.get('content-range');
            const content_length = headers.get('content-length');
            this.#size = parseInt((content_range === null) ? content_length : content_range.split('/').at(-1));
            return response.arrayBuffer();
        };

        fetch(this.#filename, { headers: __MUSIC_HEADER })
            .then(handle_response)
            .then(parse);
    }

    constructor(filename) {
        this.#filename = filename;
        const id = filename.split('/').at(-1).split('.').at(0);
        this.#id = id;
        this.#title = id;
        this.#fetch();
    }
}

class PLAYER
{
    static DIR = 'music/';
    static #GAMMA = 3;
    static #ID = 'music-player';
    static #index = null;
    static #playlist = [];
    static #audio = new Audio();
    static #autonext = true;

    static {
        this.#audio.volume = this.#scaledVolume(0.35);
        this.#audio.controls = true;
        this.#audio.autoplay = false;
        this.#audio.id = this.#ID;
        this.#audio.classList.add('hidden');
        this.#audio.addEventListener('ended', () => {
            if (!this.loop && this.#autonext) this.next();
        });
        MUSIC_FILES.forEach(f => this.#playlist.push(new Song(this.DIR + f)));
    }

    static get playlist_length() {
        return this.#playlist.length;
    }

    static get loop() {
        return this.#audio.loop;
    }

    static set loop(value) {
        this.#audio.loop = value;
    }

    static get autonext() {
        return this.#autonext;
    }

    static set autonext(value) {
        this.#autonext = value;
    }

    static hide() {
        this.#audio.classList.add('hidden');
    }

    static get audio() {
        return this.#audio;
    }

    static get hidden() {
        return this.#audio.classList.contains('hidden');
    }

    static get details() {
        return this.playlist[this.#index] ?? {
            playlist_length: this.playlist_length,
            title: "-",
            artist: "-",
            index: this.#index + 1,
            link: "-",
            size: "0",
        } ;
    }

    static get playlist() {
        return this.#playlist.map((song) => ({
            playlist_length: this.playlist_length,
            title: song.title,
            artist: song.artist,
            index: this.#playlist.indexOf(song) + 1,
            link: song.link,
            size: song.size,
        }));
    }

    static get pretty_name() {
        if (this.#index === null) return "";
        const d = this.details;
        return `${d.title} by ${d.artist}`;
    }

    static get mute() {
        return this.#audio.muted;
    }

    static set mute(value) {
        this.#audio.muted = value;
    }

    static get volume() {
        return parseFloat(this.#linearVolume(this.#audio.volume).toFixed(4));
    }

    static set volume(volume) {
        const new_volume = Math.min(1.0, this.#scaledVolume(volume));
        this.#audio.volume = new_volume;
    }

    static show() {
        const player = document.getElementById(this.#ID);

        if (!player) {
            const sheet = new CSSStyleSheet();
            sheet.insertRule(String.raw`
                #${this.#ID} {
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    left: 0;
                    transform: translate(-50%);
                    transform: none;
                    opacity: 0.5;
                }
            `);
            document.body.appendChild(this.#audio);
            document.adoptedStyleSheets.push(sheet);
            this.#audio.classList.remove('hidden');
        }

        player?.classList.remove('hidden');
    }

    static #load(song) {
        this.#index = this.#playlist.indexOf(song);
        this.#audio.src = song.url;
    }

    static play() {
        if (this.playlist_length === 0) return;
        if (!this.#audio.src)
            this.#load(this.#playlist[0]);
        if (this.#audio.paused)
            this.#audio.play();
    }

    static next() {
        if (this.playlist_length === 0) return;
        this.#index = (this.#index + 1).mod(this.playlist_length);
        this.#load(this.#playlist[this.#index]);
        this.#audio.play();
    }

    static prev() {
        if (this.playlist_length === 0) return;
        this.#index = (this.#index - 1).mod(this.playlist_length);
        this.#load(this.#playlist[this.#index]);
        this.#audio.play();
    }

    static pause() {
        this.#audio.pause();
    }

    static stop() {
        this.#audio.pause();
        this.#audio.currentTime = 0;
        this.#audio.removeAttribute("src");
    }

    static #scaledVolume(x, gamma) {
        gamma ??= this.#GAMMA;
        return Math.pow(x, gamma);
    }

    static #linearVolume(y, gamma) {
        gamma ??= this.#GAMMA;
        return Math.pow(y, 1 / gamma);
    }
}

