import {TokenType} from './tokenType'

export const Keywords = {
    fn: 'fn',
    let: 'let',
    true: 'true',
    false: 'false',
    if: 'if',
    else: 'else',
    return: 'return',
    for: 'for',
}

export const KeywordsToTokenTypeMapping = new Map<string, TokenType>([
    [Keywords.fn, TokenType.FUNCTION],
    [Keywords.let, TokenType.LET],
    [Keywords.true, TokenType.TRUE],
    [Keywords.false, TokenType.FALSE],
    [Keywords.if, TokenType.IF],
    [Keywords.else, TokenType.ELSE],
    [Keywords.return, TokenType.RETURN],
    [Keywords.for, TokenType.FOR],
])