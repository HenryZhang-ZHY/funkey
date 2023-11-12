import {isAsciiDigit, isAsciiLetter, isWhiteSpace} from '../utils/stringUtils'
import {Token} from '../token/token'
import {TokenType} from '../token/tokenType'
import {KeywordsToTokenTypeMapping} from '../token/keywords'

const EOF = '\0'

export class Lexer {
    private readonly input: string

    private position: number = 0

    private line: number = 1
    private column: number = 1

    constructor(input: string) {
        this.input = input
    }

    private get nextPosition(): number {
        return this.position + 1
    }

    private get char(): string {
        if (this.position >= this.input.length) {
            return EOF
        }
        return this.input[this.position]
    }

    private get nextChar(): string {
        if (this.nextPosition >= this.input.length) {
            return EOF
        }
        return this.input[this.nextPosition]
    }

    private next(): void {
        if (this.char === '\n') {
            this.line += 1
            this.column = 1
        } else {
            this.column += 1
        }

        this.position += 1
    }

    nextToken(): Token {
        this.eatWhiteSpaces()

        let token: Token | undefined
        switch (this.char) {
            case EOF:
                token = this.newToken(TokenType.EOF, '')
                break
            case '=':
                if (this.nextChar === '=') {
                    token = this.generateNoLiteralToken(TokenType.EQ)

                    this.next()
                } else {
                    token = this.generateNoLiteralToken(TokenType.ASSIGN)
                }
                break
            case '!':
                if (this.nextChar === '=') {
                    token = this.generateNoLiteralToken(TokenType.NOT_EQ)

                    this.next()
                } else {
                    token = this.generateNoLiteralToken(TokenType.BANG)
                }
                break
            case '<':
                token = this.generateNoLiteralToken(TokenType.LT)
                break
            case '>':
                token = this.generateNoLiteralToken(TokenType.GT)
                break
            case '+':
                token = this.generateNoLiteralToken(TokenType.PLUS)
                break
            case '-':
                token = this.generateNoLiteralToken(TokenType.MINUS)
                break
            case '*':
                token = this.generateNoLiteralToken(TokenType.ASTERISK)
                break
            case '/':
                token = this.generateNoLiteralToken(TokenType.SLASH)
                break
            case '.':
                token = this.generateNoLiteralToken(TokenType.DOT)
                break
            case ',':
                token = this.generateNoLiteralToken(TokenType.COMMA)
                break
            case ':':
                token = this.generateNoLiteralToken(TokenType.COLON)
                break
            case ';':
                token = this.generateNoLiteralToken(TokenType.SEMICOLON)
                break
            case '(':
                token = this.generateNoLiteralToken(TokenType.LPAREN)
                break
            case ')':
                token = this.generateNoLiteralToken(TokenType.RPAREN)
                break
            case '[':
                token = this.generateNoLiteralToken(TokenType.LBRACKET)
                break
            case ']':
                token = this.generateNoLiteralToken(TokenType.RBRACKET)
                break
            case '{':
                token = this.generateNoLiteralToken(TokenType.LBRACE)
                break
            case '}':
                token = this.generateNoLiteralToken(TokenType.RBRACE)
                break
            case '"':
                token = this.newToken(TokenType.STRING, this.readString())
                break
            default:
                if (isAsciiLetter(this.char)) {
                    const identifier = this.readIdentifier()
                    if (KeywordsToTokenTypeMapping.has(identifier)) {
                        token = this.newToken(KeywordsToTokenTypeMapping.get(identifier)!, identifier)
                    } else {
                        token = this.newToken(TokenType.IDENT, identifier)
                    }
                } else if (isAsciiDigit(this.char)) {
                    token = this.newToken(TokenType.INT, this.readNumber())
                } else {
                    token = this.generateNoLiteralToken(TokenType.ILLEGAL)
                }
                break
        }

        this.next()

        return token
    }

    private readIdentifier(): string {
        let result = this.char
        while (isAsciiLetter(this.nextChar)) {
            result += this.nextChar
            this.next()
        }
        return result
    }

    private readNumber(): string {
        let result = this.char
        while (isAsciiDigit(this.nextChar)) {
            result += this.nextChar
            this.next()
        }
        return result
    }

    private readString(): string {
        let result = ''
        while (this.nextChar !== '"') {
            result += this.nextChar
            this.next()
        }
        this.next()
        return result
    }

    private eatWhiteSpaces(): void {
        while (isWhiteSpace(this.char)) {
            this.next()
        }
    }

    private generateNoLiteralToken(type: TokenType): Token {
        return this.newToken(type, type)
    }

    private newToken(type: TokenType, literal: string): Token {
        return new Token(type, literal, this.line, this.column - literal.length + (literal.length > 0 ? 1 : 0))
    }
}
