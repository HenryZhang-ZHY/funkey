export function isWhiteSpace(character: string): boolean {
  if (character.length != 1) {
    throw new Error('only accept character')
  }

  return character === '\n' || character === '\r' || character === '\v' || character === '\f' || character === '\t' || character === ' '
}

export function isAsciiLetter(character: string): boolean {
  if (character.length != 1) {
    throw new Error('only accept character')
  }

  const codepoint = character.charCodeAt(0)
  return (codepoint >= 65 && codepoint <= 90) || (codepoint >= 97 && codepoint <= 122);
}

export function isDigit(character: string): boolean {
  if (character.length != 1) {
    throw new Error('only accept character')
  }

  return character >= '0' && character <= '9'
}
