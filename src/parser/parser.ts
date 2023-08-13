import {Constants as TokenConstants, Token} from '../token/token.ts'
import {
    BlockStatement,
    BooleanLiteral, CallExpression,
    Expression,
    ExpressionStatement,
    FunctionLiteral,
    Identifier,
    IfExpression,
    InfixExpression,
    IntegerLiteral,
    LetStatement,
    PrefixExpression,
    Program,
    ReturnStatement,
    Statement
} from '../ast/ast.ts'
import {Lexer} from '../lexer/lexer.ts'
import {TokenType} from "../token/tokenType.ts"
import {assert} from "vitest";

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
}

const TokenTypePrecedenceMapping = new Map<TokenType, OperatorPrecendence>([
    [TokenType.EQ, OperatorPrecendence.EQUALS],
    [TokenType.NOT_EQ, OperatorPrecendence.EQUALS],
    [TokenType.LT, OperatorPrecendence.LESSGREATER],
    [TokenType.GT, OperatorPrecendence.LESSGREATER],
    [TokenType.PLUS, OperatorPrecendence.SUM],
    [TokenType.MINUS, OperatorPrecendence.SUM],
    [TokenType.SLASH, OperatorPrecendence.PRODUCT],
    [TokenType.ASTERISK, OperatorPrecendence.PRODUCT],
    [TokenType.LPAREN, OperatorPrecendence.CALL],
]);

export class Parser {
    private readonly lexer: Lexer
    private readonly _errors: string[] = []

    private readonly prefixParseFunctions = new Map<TokenType, PrefixParseFunction>()
    private readonly infixParseFunctions = new Map<TokenType, InfixParseFunction>()

    _currentToken: Token = TokenConstants.EOF
    _nextToken: Token = TokenConstants.EOF

    constructor(lexer: Lexer) {
        this.registerPrefixParseFunctions();
        this.registerInfixParseFunctions();

        this.lexer = lexer;

        this.nextToken()
        this.nextToken()
    }

    private registerPrefixParseFunctions() {
        this.registerPrefixParseFunction(TokenType.IDENT, this.parseIdentifier)

        this.registerPrefixParseFunction(TokenType.INT, this.parseInteger)

        this.registerPrefixParseFunction(TokenType.TRUE, this.parseBoolean)
        this.registerPrefixParseFunction(TokenType.FALSE, this.parseBoolean)

        this.registerPrefixParseFunction(TokenType.BANG, this.parsePrefixExpression)
        this.registerPrefixParseFunction(TokenType.MINUS, this.parsePrefixExpression)

        this.registerPrefixParseFunction(TokenType.LPAREN, this.parseGroupedExpression)

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

        this.registerInfixParseFunction(TokenType.EQ, this.parseInfixExpression)
        this.registerInfixParseFunction(TokenType.NOT_EQ, this.parseInfixExpression)

        this.registerInfixParseFunction(TokenType.LT, this.parseInfixExpression)
        this.registerInfixParseFunction(TokenType.GT, this.parseInfixExpression)

        this.registerInfixParseFunction(TokenType.LPAREN, this.parseCallExpression)
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

        const expression = this.parseExpression(OperatorPrecendence.LOWEST);

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

    private parseExpressionStatement(): ExpressionStatement {
        const token = this._currentToken
        const expression = this.parseExpression(OperatorPrecendence.LOWEST)

        if (this._nextToken.type == TokenType.SEMICOLON) {
            this.nextToken()
        }

        return new ExpressionStatement(token, expression)
    }

    private parseBlockStatement(): BlockStatement | undefined {
        const token = this._currentToken;
        const blockStatement = new BlockStatement(token);

        this.nextToken()

        while (this._currentToken.type !== TokenType.RBRACE && this._currentToken.type !== TokenType.EOF) {
            const statement = this.parseStatement();
            if (statement) {
                blockStatement.addStatement(statement);
            }

            this.nextToken()
        }

        return blockStatement;
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

    private parseIfExpression(): Expression | undefined {
        const token = this._currentToken;

        this.nextToken()

        if (!this.assertCurrentTokenTypeIs(TokenType.LPAREN)) {
            return
        }
        this.nextToken()

        const condition = this.parseExpression()
        if (!condition) {
            this.addParseError("parse condition failed")
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
            this.addParseError("parse consequence failed")
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
            this.addParseError("parse alternative failed")
            return
        }

        return new IfExpression(token, condition, consequence, alternative)
    }

    private parseFunctionLiteral(): FunctionLiteral | undefined {
        const token = this._currentToken;

        this.nextToken()

        if (!this.assertCurrentTokenTypeIs(TokenType.LPAREN)) {
            return
        }
        this.nextToken()

        const parameters = this.parseParameters()
        if (!parameters) {
            this.addParseError("parse parameters failed")
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
            this.addParseError("parse function body failed")
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
            this.addParseError(`parse expression failed`)
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
            this.addParseError(`parse right side expression failed`)
            return
        }
        return new InfixExpression(token, leftExpression, token.literal, rightExpression)
    }

    private parseCallExpression(fn: Expression): CallExpression | undefined {
        const token = this._currentToken
        const args = this.parseCallArguments()
        if (!args) {
            this.addParseError('parse arguments failed')
            return
        }
        return new CallExpression(token, fn, args)
    }

    private parseCallArguments(): Expression[] | undefined {
        const args: Expression[] = []

        if (this._nextToken.type === TokenType.RPAREN) {
            this.nextToken()
            return args
        }

        this.nextToken()

        const firstArg = this.parseExpression(OperatorPrecendence.LOWEST)
        if (!firstArg) {
            this.addParseError("parse argument failed")
            return args
        }
        args.push(firstArg)

        while (this._nextToken.type === TokenType.COMMA) {
            this.nextToken()
            this.nextToken()

            const arg = this.parseExpression(OperatorPrecendence.LOWEST)
            if (!arg) {
                this.addParseError("parse argument failed")
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

    private parseIdentifier(): Expression | undefined {
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
