import {TokenType} from './tokenType'

export class Token {
    public readonly type: TokenType
    public readonly literal: string
    public readonly line: number
    public readonly column: number

    constructor(type: TokenType, literal: string, line: number, column: number) {
        this.type = type
        this.literal = literal
        this.line = line
        this.column = column
    }
}

export const Constants = {
    EOF: new Token(TokenType.EOF, '', -1, -1),
}
