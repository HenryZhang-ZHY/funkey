import {TokenType} from './TokenType'

export class Token {
    public readonly type: TokenType
    public readonly literal: string

    constructor(type: TokenType, literal: string) {
        this.type = type
        this.literal = literal
    }
}

export const Constants = {
    EOF: new Token(TokenType.EOF, ''),
}
