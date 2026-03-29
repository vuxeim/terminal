class PLAYER
{
    static playlist = [
        'BQWc_MgcT0A.opus',
        '4X7ZvpwBiKA.opus',
        'DwVTLrg-2-0.opus',
    ];

    static #DIR = 'music/';
    static #audio = new Audio();
    static #gamma = 3;
    static #ID = 'music-player';

    static {
        this.#audio.volume = this.#scaledVolume(0.35);
        this.#audio.controls = true;
        this.#audio.autoplay = false;
        this.#audio.id = this.#ID;
        this.#audio.classList.add('hidden');
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

    static hide() {
        this.#audio.classList.add('hidden');
    }

    static get audio() {
        return this.#audio;
    }

    static get hidden() {
        return this.#audio.classList.contains('hidden');
    }

    static get name() {
        const src = this.#audio.src;
        if (!src) return "";
        return new URL(this.#audio.src).pathname.replace('/', '').replace(this.#DIR, '');
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

    static get volumeReal() {
        return parseFloat(this.#audio.volume.toFixed(4));
    }

    static set volume(volume) {
        const new_volume = Math.min(1.0, this.#scaledVolume(volume));
        this.#audio.volume = new_volume;
    }

    static load(name) {
        this.stop();
        const full_name = this.#DIR + name;
        this.#audio.src = full_name;
    }

    static play() {
        if (!this.name)
            this.load(this.playlist.random());
        if (this.#audio.paused)
            this.#audio.play();
    }

    static next() {
        if (!this.name)
        {
            this.load(this.playlist.random());
        }
        else
        {
            const name = this.name.replace(this.#DIR, "");
            const index = this.playlist.indexOf(name);
            const next_index = (index + 1).mod(this.playlist.length);
            const next_song = this.playlist[next_index];
            this.load(next_song);
        }
        this.#audio.play();
    }

    static prev() {
        if (!this.name)
        {
            this.load(this.playlist.random());
        }
        else
        {
            const name = this.name.replace(this.#DIR, "");
            const index = this.playlist.indexOf(name);
            const prev_index = (index - 1).mod(this.playlist.length);
            const prev_song = this.playlist[prev_index];
            this.load(prev_song);
        }
        this.#audio.play();
    }

    static pause() {
        this.#audio.pause();
    }

    static stop() {
        this.#audio.src = "";
    }

    static #scaledVolume(x, gamma) {
        gamma ??= this.#gamma;
        return Math.pow(x, gamma);
    }

    static #linearVolume(y, gamma) {
        gamma ??= this.#gamma;
        return Math.pow(y, 1 / gamma);
    }
    
}

