import {isAsciiDigit, isAsciiLetter, isWhiteSpace} from "../utils/stringUtils.ts"
import {Token} from "../token/token.ts"
import {TokenType} from "../token/tokenType.ts"
import {KeywordsToTokenTypeMapping} from "../token/keywords.ts"

const EOF = '\0'

export class Lexer {
    readonly input: string

    position: number = 0

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
        this.position += 1
    }

    nextToken(): Token {
        this.eatWhiteSpaces()

        let token: Token | undefined;
        switch (this.char) {
            case EOF:
                token = new Token(TokenType.EOF, '')
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
                token = new Token(TokenType.STRING, this.readString())
                break
            default:
                if (isAsciiLetter(this.char)) {
                    const identifier = this.readIdentifier()
                    if (KeywordsToTokenTypeMapping.has(identifier)) {
                        token = new Token(KeywordsToTokenTypeMapping.get(identifier)!, identifier)
                    } else {
                        token = new Token(TokenType.IDENT, identifier)
                    }
                } else if (isAsciiDigit(this.char)) {
                    token = new Token(TokenType.INT, this.readNumber())
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
        return new Token(type, type)
    }
}
