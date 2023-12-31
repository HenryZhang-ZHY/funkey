import {Constants as TokenConstants, Token} from '../token/token'
import {
    ArrayLiteral, AssignExpression,
    BlockStatement,
    BooleanLiteral, CallExpression, DotExpression,
    Expression,
    ExpressionStatement, ForStatement,
    FunctionLiteral,
    Identifier,
    IfExpression, IndexExpression,
    InfixExpression,
    IntegerLiteral,
    LetStatement, MapLiteral,
    PrefixExpression,
    Program,
    ReturnStatement,
    Statement, StringLiteral
} from '../ast/ast'
import {Lexer} from '../lexer/lexer'
import {TokenType} from '../token/tokenType'
import {assert} from '../utils/assert'

type PrefixParseFunction = () => Expression | undefined
type InfixParseFunction = (leftExpression: Expression) => Expression | undefined

enum OperatorPrecendence {
    _ = 0,
    LOWEST,
    EQUALS,
    LESSGREATER,
    SUM,
    PRODUCT,
    PREFIX,
    CALL,
    INDEX,
    DOT,
    Assign,
}

const TokenTypePrecedenceMapping = new Map<TokenType, OperatorPrecendence>([
    [TokenType.EQ, OperatorPrecendence.EQUALS],
    [TokenType.NOT_EQ, OperatorPrecendence.EQUALS],
    [TokenType.LT, OperatorPrecendence.LESSGREATER],
    [TokenType.LTE, OperatorPrecendence.LESSGREATER],
    [TokenType.GT, OperatorPrecendence.LESSGREATER],
    [TokenType.GTE, OperatorPrecendence.LESSGREATER],
    [TokenType.PLUS, OperatorPrecendence.SUM],
    [TokenType.MINUS, OperatorPrecendence.SUM],
    [TokenType.SLASH, OperatorPrecendence.PRODUCT],
    [TokenType.ASTERISK, OperatorPrecendence.PRODUCT],
    [TokenType.MOD, OperatorPrecendence.PRODUCT],
    [TokenType.LPAREN, OperatorPrecendence.CALL],
    [TokenType.LBRACKET, OperatorPrecendence.INDEX],
    [TokenType.DOT, OperatorPrecendence.DOT],
    [TokenType.ASSIGN, OperatorPrecendence.Assign],
])

export class Parser {
    private readonly lexer: Lexer
    private readonly _errors: string[] = []

    private readonly prefixParseFunctions = new Map<TokenType, PrefixParseFunction>()
    private readonly infixParseFunctions = new Map<TokenType, InfixParseFunction>()

    _currentToken: Token = TokenConstants.EOF
    _nextToken: Token = TokenConstants.EOF

    constructor(lexer: Lexer) {
        this.registerPrefixParseFunctions()
        this.registerInfixParseFunctions()

        this.lexer = lexer

        this.nextToken()
        this.nextToken()
    }

    private registerPrefixParseFunctions() {
        this.registerPrefixParseFunction(TokenType.IDENT, this.parseIdentifier)

        this.registerPrefixParseFunction(TokenType.INT, this.parseInteger)
        this.registerPrefixParseFunction(TokenType.STRING, this.parseString)

        this.registerPrefixParseFunction(TokenType.TRUE, this.parseBoolean)
        this.registerPrefixParseFunction(TokenType.FALSE, this.parseBoolean)

        this.registerPrefixParseFunction(TokenType.BANG, this.parsePrefixExpression)
        this.registerPrefixParseFunction(TokenType.MINUS, this.parsePrefixExpression)

        this.registerPrefixParseFunction(TokenType.LPAREN, this.parseGroupedExpression)

        this.registerPrefixParseFunction(TokenType.LBRACKET, this.parseArrayLiteralExpression)

        this.registerPrefixParseFunction(TokenType.LBRACE, this.parseMapLiteralExpression)

        this.registerPrefixParseFunction(TokenType.IF, this.parseIfExpression)

        this.registerPrefixParseFunction(TokenType.FUNCTION, this.parseFunctionLiteral)
    }

    private registerPrefixParseFunction(tokenType: TokenType, fn: PrefixParseFunction) {
        this.prefixParseFunctions.set(tokenType, fn.bind(this))
    }

    private registerInfixParseFunctions() {
        this.registerInfixParseFunction(TokenType.PLUS, this.parseInfixExpression)
        this.registerInfixParseFunction(TokenType.MINUS, this.parseInfixExpression)

        this.registerInfixParseFunction(TokenType.SLASH, this.parseInfixExpression)
        this.registerInfixParseFunction(TokenType.ASTERISK, this.parseInfixExpression)
        this.registerInfixParseFunction(TokenType.MOD, this.parseInfixExpression)

        this.registerInfixParseFunction(TokenType.EQ, this.parseInfixExpression)
        this.registerInfixParseFunction(TokenType.NOT_EQ, this.parseInfixExpression)

        this.registerInfixParseFunction(TokenType.LT, this.parseInfixExpression)
        this.registerInfixParseFunction(TokenType.LTE, this.parseInfixExpression)
        this.registerInfixParseFunction(TokenType.GT, this.parseInfixExpression)
        this.registerInfixParseFunction(TokenType.GTE, this.parseInfixExpression)

        this.registerInfixParseFunction(TokenType.LPAREN, this.parseCallExpression)

        this.registerInfixParseFunction(TokenType.DOT, this.parseDotExpression)
        this.registerInfixParseFunction(TokenType.LBRACKET, this.parseIndexExpression)

        this.registerInfixParseFunction(TokenType.ASSIGN, this.parseAssignExpression)
    }

    private registerInfixParseFunction(tokenType: TokenType, fn: InfixParseFunction) {
        this.infixParseFunctions.set(tokenType, fn.bind(this))
    }

    private nextToken() {
        this._currentToken = this._nextToken
        this._nextToken = this.lexer.nextToken()
    }

    get errors(): string[] {
        return Array.from(this._errors)
    }

    parseProgram(): Program {
        const program = new Program()

        while (this._currentToken.type != TokenType.EOF) {
            const statement = this.parseStatement()
            if (statement) {
                program.appendStatement(statement)
            }

            this.nextToken()
        }

        return program
    }

    private parseStatement(): Statement | undefined {
        switch (this._currentToken.type) {
            case TokenType.LET:
                return this.parseLetStatement()
            case TokenType.RETURN:
                return this.parseReturnStatement()
            case TokenType.FOR:
                return this.parseForStatement()
            default:
                return this.parseExpressionStatement()
        }
    }

    private parseLetStatement(): LetStatement | undefined {
        const letToken = this._currentToken

        // TODO: throw exception might be better than returning undefined
        if (!this.assertNextTokenTypeIs(TokenType.IDENT)) {
            return
        }
        this.nextToken()
        const identifier = new Identifier(this._currentToken, this._currentToken.literal)

        if (!this.assertNextTokenTypeIs(TokenType.ASSIGN)) {
            return
        }
        this.nextToken()
        this.nextToken()

        const expression = this.parseExpression(OperatorPrecendence.LOWEST)

        if (!this.assertNextTokenTypeIs(TokenType.SEMICOLON)) {
            return
        }
        this.nextToken()

        return new LetStatement(letToken, identifier, expression)
    }

    private parseReturnStatement(): ReturnStatement | undefined {
        const returnToken = this._currentToken

        this.nextToken()
        const expression = this.parseExpression(OperatorPrecendence.LOWEST)

        if (!this.assertNextTokenTypeIs(TokenType.SEMICOLON)) {
            return
        }
        this.nextToken()

        return new ReturnStatement(returnToken, expression)
    }

    private parseForStatement(): ForStatement | undefined {
        const token = this._currentToken

        this.nextToken()

        if (!this.assertCurrentTokenTypeIs(TokenType.LPAREN)) {
            return
        }
        this.nextToken()

        const initializationStatement = this.parseStatement()
        if (!this.assertCurrentTokenTypeIs(TokenType.SEMICOLON)) {
            return
        }
        this.nextToken()

        const conditionStatement = this.parseExpressionStatement()
        if (!this.assertCurrentTokenTypeIs(TokenType.SEMICOLON)) {
            return
        }
        this.nextToken()

        const updateStatement = this.parseStatement()

        if (!this.assertNextTokenTypeIs(TokenType.RPAREN)) {
            return
        }
        this.nextToken()

        if (!this.assertNextTokenTypeIs(TokenType.LBRACE)) {
            return
        }
        this.nextToken()

        const bodyStatement = this.parseBlockStatement()
        if (!bodyStatement) {
            this.addParseError('parse consequence failed')
            return
        }

        return new ForStatement(token, bodyStatement, initializationStatement, conditionStatement, updateStatement)
    }

    private parseExpressionStatement(): ExpressionStatement {
        const token = this._currentToken
        const expression = this.parseExpression(OperatorPrecendence.LOWEST)

        if (this._nextToken.type == TokenType.SEMICOLON) {
            this.nextToken()
        }

        return new ExpressionStatement(token, expression)
    }

    private parseBlockStatement(): BlockStatement | undefined {
        const token = this._currentToken
        const blockStatement = new BlockStatement(token)

        this.nextToken()

        while (this._currentToken.type !== TokenType.RBRACE && this._currentToken.type !== TokenType.EOF) {
            const statement = this.parseStatement()
            if (statement) {
                blockStatement.addStatement(statement)
            }

            this.nextToken()
        }

        return blockStatement
    }

    private parseExpression(precedence: number = OperatorPrecendence.LOWEST): Expression | undefined {
        const prefix = this.prefixParseFunctions.get(this._currentToken.type)
        if (!prefix) {
            this.addParseError(`could not found prefix parse function for ${this._currentToken.type}`)
            return
        }

        let leftExpression = prefix()
        while (this._nextToken.type !== TokenType.SEMICOLON && precedence < this.nextTokenPrecedence) {
            const infix = this.infixParseFunctions.get(this._nextToken.type)
            if (!infix) {
                return leftExpression
            }

            this.nextToken()

            assert(leftExpression)
            leftExpression = infix(leftExpression)
        }

        return leftExpression
    }

    private parseGroupedExpression(): Expression | undefined {
        this.nextToken()

        const expression = this.parseExpression(OperatorPrecendence.LOWEST)
        if (!this.assertNextTokenTypeIs(TokenType.RPAREN)) {
            return
        }
        this.nextToken()

        return expression
    }

    private parseArrayLiteralExpression(): ArrayLiteral | undefined {
        const token = this._currentToken
        const items = this.parseArrayItems()
        return new ArrayLiteral(token, items)
    }

    private parseArrayItems(): Expression[] {
        const items: Expression[] = []

        if (this._nextToken.type === TokenType.RBRACKET) {
            this.nextToken()
            return items
        }

        this.nextToken()

        const first = this.parseExpression(OperatorPrecendence.LOWEST)
        if (!first) {
            this.addParseError('parse array item failed')
            return items
        }
        items.push(first)

        while (this._nextToken.type === TokenType.COMMA) {
            this.nextToken()
            this.nextToken()

            const item = this.parseExpression(OperatorPrecendence.LOWEST)
            if (!item) {
                this.addParseError('parse array item failed')
                return items
            }
            items.push(item)
        }

        if (!this.assertNextTokenTypeIs(TokenType.RBRACKET)) {
            return items
        }
        this.nextToken()

        return items
    }

    private parseMapLiteralExpression(): MapLiteral | undefined {
        const token = this._currentToken
        const items = this.parseMapItems()
        return new MapLiteral(token, items)
    }

    private parseMapItems(): Map<Expression, Expression> {
        const items = new Map<Expression, Expression>

        if (this._nextToken.type === TokenType.RBRACE) {
            this.nextToken()
            return items
        }

        this.nextToken()

        const firstKey = this.parseExpression(OperatorPrecendence.LOWEST)
        if (!firstKey) {
            this.addParseError('parse map item failed')
            return items
        }
        if (!this.assertNextTokenTypeIs(TokenType.COLON)) {
            this.addParseError('parse map item failed')
            return items
        }
        this.nextToken()
        this.nextToken()
        const firstValue = this.parseExpression(OperatorPrecendence.LOWEST)
        if (!firstValue) {
            this.addParseError('parse map item failed')
            return items
        }
        items.set(firstKey, firstValue)


        while (this._nextToken.type === TokenType.COMMA) {
            this.nextToken()
            this.nextToken()

            const key = this.parseExpression(OperatorPrecendence.LOWEST)
            if (!key) {
                this.addParseError('parse map item failed')
                return items
            }
            if (!this.assertNextTokenTypeIs(TokenType.COLON)) {
                this.addParseError('parse map item failed')
                return items
            }
            this.nextToken()
            this.nextToken()
            const value = this.parseExpression(OperatorPrecendence.LOWEST)
            if (!value) {
                this.addParseError('parse map item failed')
                return items
            }
            items.set(key, value)
        }

        if (!this.assertNextTokenTypeIs(TokenType.RBRACE)) {
            return items
        }
        this.nextToken()

        return items
    }

    private parseIfExpression(): Expression | undefined {
        const token = this._currentToken

        this.nextToken()

        if (!this.assertCurrentTokenTypeIs(TokenType.LPAREN)) {
            return
        }
        this.nextToken()

        const condition = this.parseExpression()
        if (!condition) {
            this.addParseError('parse condition failed')
            return
        }

        if (!this.assertNextTokenTypeIs(TokenType.RPAREN)) {
            return
        }
        this.nextToken()

        if (!this.assertNextTokenTypeIs(TokenType.LBRACE)) {
            return
        }
        this.nextToken()

        const consequence = this.parseBlockStatement()
        if (!consequence) {
            this.addParseError('parse consequence failed')
            return
        }

        if (this._nextToken.type !== TokenType.ELSE) {
            return new IfExpression(token, condition, consequence)
        }
        this.nextToken()

        if (!this.assertNextTokenTypeIs(TokenType.LBRACE)) {
            return
        }
        this.nextToken()

        const alternative = this.parseBlockStatement()
        if (!alternative) {
            this.addParseError('parse alternative failed')
            return
        }

        return new IfExpression(token, condition, consequence, alternative)
    }

    private parseFunctionLiteral(): FunctionLiteral | undefined {
        const token = this._currentToken

        this.nextToken()

        if (!this.assertCurrentTokenTypeIs(TokenType.LPAREN)) {
            return
        }
        this.nextToken()

        const parameters = this.parseParameters()
        if (!parameters) {
            this.addParseError('parse parameters failed')
            return
        }

        if (!this.assertCurrentTokenTypeIs(TokenType.RPAREN)) {
            return
        }
        this.nextToken()

        if (!this.assertCurrentTokenTypeIs(TokenType.LBRACE)) {
            return
        }

        const body = this.parseBlockStatement()
        if (!body) {
            this.addParseError('parse function body failed')
            return
        }

        return new FunctionLiteral(token, parameters, body)
    }

    private parseParameters(): Identifier[] | undefined {
        const result: Identifier[] = []
        while (this._currentToken.type !== TokenType.RPAREN) {
            if (!this.assertCurrentTokenTypeIs(TokenType.IDENT)) {
                return
            }
            result.push(new Identifier(this._currentToken, this._currentToken.literal))

            this.nextToken()

            if (this._currentToken.type === TokenType.COMMA) {
                this.nextToken()
            }
        }
        return result
    }

    private parsePrefixExpression(): Expression | undefined {
        const token = this._currentToken
        this.nextToken()
        const expression = this.parseExpression(OperatorPrecendence.PREFIX)
        if (!expression) {
            this.addParseError('parse expression failed')
            return
        }

        return new PrefixExpression(token, token.literal, expression)
    }

    private parseInfixExpression(leftExpression: Expression): Expression | undefined {
        const token = this._currentToken
        const precedence = this.currentTokenPrecedence
        this.nextToken()
        const rightExpression = this.parseExpression(precedence)
        if (!rightExpression) {
            this.addParseError('parse right side expression failed')
            return
        }
        return new InfixExpression(token, leftExpression, token.literal, rightExpression)
    }

    private parseCallExpression(fn: Expression): CallExpression | undefined {
        const token = this._currentToken
        const args = this.parseCallArguments()
        return new CallExpression(token, fn, args)
    }

    private parseCallArguments(): Expression[] {
        const args: Expression[] = []

        if (this._nextToken.type === TokenType.RPAREN) {
            this.nextToken()
            return args
        }

        this.nextToken()

        const firstArg = this.parseExpression(OperatorPrecendence.LOWEST)
        if (!firstArg) {
            this.addParseError('parse argument failed')
            return args
        }
        args.push(firstArg)

        while (this._nextToken.type === TokenType.COMMA) {
            this.nextToken()
            this.nextToken()

            const arg = this.parseExpression(OperatorPrecendence.LOWEST)
            if (!arg) {
                this.addParseError('parse argument failed')
                return args
            }
            args.push(arg)
        }

        if (!this.assertNextTokenTypeIs(TokenType.RPAREN)) {
            return args
        }
        this.nextToken()

        return args
    }

    private parseDotExpression(left: Expression): DotExpression | undefined {
        const token = this._currentToken

        this.nextToken()

        const right = this.parseIdentifier()
        if (!right) {
            this.addParseError('parse dot expression failed.')
            return
        }

        this.nextToken()

        return new DotExpression(token, left, right)
    }

    private parseIndexExpression(left: Expression): IndexExpression | undefined {
        const token = this._currentToken

        this.nextToken()
        const indexExpression = this.parseExpression(OperatorPrecendence.LOWEST)
        if (!indexExpression) {
            this.addParseError('parse index expression failed.')
            return
        }
        if (!this.assertNextTokenTypeIs(TokenType.RBRACKET)) {
            return
        }
        this.nextToken()

        return new IndexExpression(token, left, indexExpression)
    }

    private parseAssignExpression(left: Expression): AssignExpression | undefined {
        const token = this._currentToken

        this.nextToken()
        const right = this.parseExpression(OperatorPrecendence.LOWEST)
        if (!right) {
            this.addParseError('parse right expression failed.')
            return
        }

        return new AssignExpression(token, left, right)
    }

    private parseIdentifier(): Identifier | undefined {
        return new Identifier(this._currentToken, this._currentToken.literal)
    }

    private parseInteger(): Expression | undefined {
        const value = parseInt(this._currentToken.literal)
        if (!Number.isSafeInteger(value)) {
            this.addParseError(`could not parse ${this._currentToken.literal} as an integer`)
            return
        }

        return new IntegerLiteral(this._currentToken, value)
    }

    private parseString(): Expression | undefined {
        return new StringLiteral(this._currentToken, this._currentToken.literal)
    }

    private parseBoolean(): Expression | undefined {
        return new BooleanLiteral(this._currentToken, this._currentToken.type === TokenType.TRUE)
    }

    private get currentTokenPrecedence(): OperatorPrecendence {
        return TokenTypePrecedenceMapping.get(this._currentToken.type) ?? OperatorPrecendence.LOWEST
    }

    private get nextTokenPrecedence(): OperatorPrecendence {
        return TokenTypePrecedenceMapping.get(this._nextToken.type) ?? OperatorPrecendence.LOWEST
    }

    private assertCurrentTokenTypeIs(type: TokenType): boolean {
        return this._currentToken.type === type
    }

    private assertNextTokenTypeIs(type: TokenType): boolean {
        if (this._nextToken.type === type) {
            return true
        } else {
            this.addParseError(`expected next token to be ${type}, got ${this._nextToken.type} instead`)
            return false
        }
    }

    private addParseError(message: string) {
        this._errors.push(message)
    }
}
