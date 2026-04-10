const ParseError = Object.freeze({
    TRAILING_BACKSLASH: 'trailing_backslash',
    UNCLOSED_QUOTE: 'unclosed_quote',

});

const ExpansionError = Object.freeze({
    NO_MATCHES: 'no_matches',
});

const parse_args = (text) => {
    const args = [];
    let current = '';
    let quote = null;
    let quoteStart = -1;
    let escaped = false;

    for (const [i, char] of Array.from(text).entries())
    {
        if (escaped)
        {
            current += char;
            escaped = false;
        }
        else if (char === '\\')
        {
            escaped = true;
            current += char;
        }
        else if (quote)
        {
            if (char === quote)
            {
                quote = null;
                quoteStart = -1;
                current += char;
            }
            else
            {
                current += char;
            }
        }
        else if (char === '"' || char === "'")
        {
            quote = char;
            quoteStart = i;
            current += char;
        }
        else if (char === ' ')
        {
            if (current)
            {
                args.push(current);
                current = '';
            }
        }
        else
        {
            current += char;
        }
    }

    if (current)
    {
        args.push(current);
    }

    const error = escaped
        ? { type: ParseError.TRAILING_BACKSLASH, index: text.length - 1 }
        : quote !== null
        ? { type: ParseError.UNCLOSED_QUOTE, char: quote, from: quoteStart, to: text.length }
        : null;

    if (error) throw Object.assign(new SyntaxError(
        error.type === ParseError.TRAILING_BACKSLASH
            ? `trailing backslash at index ${error.index}`
            : `unclosed quote ${error.char} from index ${error.from} to ${error.to}`
    ), error);

    return args;
};


const expand_args = (SHELL, args) =>
{
    const expand_star = (arg) =>
    {
        if (arg.endsWith('*') && (arg.slice(-2, -1) === '/' || arg.length === 1))
        {
            const dir = arg.slice(0, -1) || './';
            const node = SHELL.FS.get_node(SHELL.FS.resolve_path(SHELL, dir));
            if (!node)
            {
                const error = { type: ExpansionError.NO_MATCHES, arg: arg };
                const syntax_error = new SyntaxError(`no matches found: ${error.arg}`);
                throw Object.assign(syntax_error, error);
            }
            const files = Object.keys(node).map((f) => dir + f);
            return files;
        }
        return arg;
    };

    if (!args) return [];
    return args.flatMap(expand_star).map(a => a.unquote().unescape());
};
