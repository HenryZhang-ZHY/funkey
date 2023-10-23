export function isWhiteSpace(character: string): boolean {
    if (character.length != 1) {
        return false
    }

    return character === '\n' || character === '\r' || character === '\v' || character === '\f' || character === '\t' || character === ' '
}

export function isAsciiLetter(character: string): boolean {
    if (character.length != 1) {
        return false
    }

    const codepoint = character.charCodeAt(0)
    return (codepoint >= 65 && codepoint <= 90) || (codepoint >= 97 && codepoint <= 122)
}

export function isAsciiDigit(character: string): boolean {
    if (character.length != 1) {
        return false
    }

    return character >= '0' && character <= '9'
}
