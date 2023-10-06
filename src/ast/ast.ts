import {Token} from '../token/token.ts'

export interface AstVisitor {
    visitProgram: (x: Program) => void
    visitExpressionStatement: (x: ExpressionStatement) => void
    visitBlockStatement: (x: BlockStatement) => void
    visitLetStatement: (x: LetStatement) => void
    visitReturnStatement: (x: ReturnStatement) => void
    visitPrefixExpression: (x: PrefixExpression) => void
    visitInfixExpression: (x: InfixExpression) => void
    visitCallExpression: (x: CallExpression) => void
    visitIndexExpression: (x: IndexExpression) => void
    visitDotExpression: (x: DotExpression) => void
    visitIntegerLiteral: (x: IntegerLiteral) => void
    visitBooleanLiteral: (x: BooleanLiteral) => void
    visitStringLiteral: (x: StringLiteral) => void
    visitArrayLiteral: (x: ArrayLiteral) => void
    visitMapLiteral: (x: MapLiteral) => void
    visitFunctionLiteral: (x: FunctionLiteral) => void
    visitIfExpression: (x: IfExpression) => void
    visitIdentifier: (x: Identifier) => void
}

export interface Node {
    tokenLiteral: string

    accept: (visitor: AstVisitor) => void
}

export interface Statement extends Node {
}

export interface Expression extends Node {
}

export class Program implements Node {
    private readonly _statements: Statement[] = []

    get tokenLiteral(): string {
        let result = ''

        for (const statement of this._statements) {
            result += statement.tokenLiteral
            result += '\n'
        }

        return result
    }

    get statements(): Statement[] {
        return Array.from(this._statements)
    }

    appendStatement(statement: Statement) {
        this._statements.push(statement)
    }

    toString(): string {
        let result = ''

        for (const statement of this._statements) {
            result += `${statement.toString()}\n`
        }

        return result
    }

    accept(visitor: AstVisitor): void {
        visitor.visitProgram(this)
    }
}

export class IntegerLiteral implements Expression {
    private readonly token: Token
    readonly value: number

    constructor(token: Token, value: number) {
        this.token = token
        this.value = value
    }

    get tokenLiteral(): string {
        return this.token.literal
    }

    toString(): string {
        return this.value.toString()
    }

    accept(visitor: AstVisitor): void {
        visitor.visitIntegerLiteral(this)
    }
}

export class BooleanLiteral implements Expression {
    private readonly token: Token
    readonly value: boolean

    constructor(token: Token, value: boolean) {
        this.token = token
        this.value = value
    }

    get tokenLiteral(): string {
        return this.token.literal
    }

    toString(): string {
        return this.value.toString()
    }

    accept(visitor: AstVisitor): void {
        visitor.visitBooleanLiteral(this)
    }
}

export class StringLiteral implements Expression {
    private readonly token: Token
    readonly value: string

    constructor(token: Token, value: string) {
        this.token = token
        this.value = value
    }

    get tokenLiteral(): string {
        return this.token.literal
    }

    toString(): string {
        return this.value.toString()
    }

    accept(visitor: AstVisitor): void {
        visitor.visitStringLiteral(this)
    }
}

export class Identifier implements Expression {
    private readonly token: Token
    readonly value: string

    constructor(token: Token, value: string) {
        this.token = token
        this.value = value
    }

    get tokenLiteral(): string {
        return this.token.literal
    }

    toString(): string {
        return this.value
    }

    accept(visitor: AstVisitor): void {
        visitor.visitIdentifier(this)
    }
}

export class FunctionLiteral implements Expression {
    private readonly token: Token

    readonly parameters: Identifier[]
    readonly body: BlockStatement

    constructor(token: Token, parameters: Identifier[], body: BlockStatement) {
        this.token = token
        this.parameters = parameters
        this.body = body
    }

    get tokenLiteral(): string {
        return this.token.literal
    }

    toString(): string {
        return `fn (${this.parameters.join(', ')}) {
\t${this.body.statements.join('\n\t')}
}`
    }

    accept(visitor: AstVisitor): void {
        visitor.visitFunctionLiteral(this)
    }
}

export class ArrayLiteral implements Expression {
    private readonly token: Token
    readonly elements: Expression[]

    constructor(token: Token, elements: Expression[]) {
        this.token = token
        this.elements = elements
    }

    get tokenLiteral(): string {
        return this.token.literal
    }

    toString(): string {
        return `[${this.elements.join(', ')}]`
    }

    accept(visitor: AstVisitor): void {
        visitor.visitArrayLiteral(this)
    }
}

export class MapLiteral implements Expression {
    private readonly token: Token
    readonly map: Map<Expression, Expression>

    constructor(token: Token, map: Map<Expression, Expression>) {
        this.token = token
        this.map = map
    }

    get tokenLiteral(): string {
        return this.token.literal
    }

    toString(): string {
        const entries = [...this.map.entries()].map(([key, value]) => `${key}:${value}`)
        return `{${entries.join(', ')}}`
    }

    accept(visitor: AstVisitor): void {
        visitor.visitMapLiteral(this)
    }
}

export class CallExpression implements Expression {
    private readonly token: Token

    readonly fn: Expression
    readonly args: Expression[]

    constructor(token: Token, fn: Expression, args: Expression[]) {
        this.token = token
        this.fn = fn
        this.args = args
    }

    get tokenLiteral(): string {
        return this.token.literal
    }

    toString(): string {
        return `${this.fn}(${this.args.join(', ')})`
    }

    accept(visitor: AstVisitor): void {
        visitor.visitCallExpression(this)
    }
}


export class IndexExpression implements Expression {
    private readonly token: Token

    readonly left: Expression
    readonly index: Expression

    constructor(token: Token, left: Expression, index: Expression) {
        this.token = token
        this.left = left
        this.index = index
    }

    get tokenLiteral(): string {
        return this.token.literal
    }

    toString(): string {
        return `(${this.left}[${this.index}])`
    }

    accept(visitor: AstVisitor): void {
        visitor.visitIndexExpression(this)
    }
}

export class DotExpression implements Expression {
    private readonly token: Token

    readonly left: Expression
    readonly right: Identifier

    constructor(token: Token, left: Expression, identifier: Identifier) {
        this.token = token
        this.left = left
        this.right = identifier
    }

    get tokenLiteral(): string {
        return this.token.literal
    }

    toString(): string {
        return `(${this.left}.${this.right})`
    }

    accept(visitor: AstVisitor): void {
        visitor.visitDotExpression(this)
    }
}

export class PrefixExpression implements Expression {
    private readonly token: Token

    readonly operator: string
    readonly value: Expression

    constructor(token: Token, operator: string, value: Expression) {
        this.token = token
        this.operator = operator
        this.value = value
    }

    get tokenLiteral(): string {
        return this.token.literal
    }

    toString(): string {
        return `(${this.operator}${this.value})`
    }

    accept(visitor: AstVisitor): void {
        visitor.visitPrefixExpression(this)
    }
}

export class InfixExpression implements Expression {
    private readonly token: Token

    readonly left: Expression
    readonly operator: string
    readonly right: Expression

    constructor(token: Token, left: Expression, operator: string, right: Expression) {
        this.token = token
        this.left = left
        this.operator = operator
        this.right = right
    }

    get tokenLiteral(): string {
        return this.token.literal
    }

    toString(): string {
        return `(${this.left} ${this.operator} ${this.right})`
    }

    accept(visitor: AstVisitor): void {
        visitor.visitInfixExpression(this)
    }
}

export class IfExpression implements Expression {
    private readonly token: Token

    readonly condition: Expression
    readonly consequence: BlockStatement
    readonly alternative: BlockStatement | undefined

    constructor(token: Token, condition: Expression, consequence: BlockStatement, alternative: BlockStatement | undefined = undefined) {
        this.token = token
        this.condition = condition
        this.consequence = consequence
        this.alternative = alternative
    }

    get tokenLiteral(): string {
        return this.token.literal
    }

    toString(): string {
        let result = `if (${this.condition}) ${this.consequence}`
        if (this.alternative) {
            result += ` else ${this.alternative}`
        }
        return result
    }

    accept(visitor: AstVisitor): void {
        visitor.visitIfExpression(this)
    }
}

export class BlockStatement implements Statement {
    private readonly token: Token

    readonly statements: Statement[] = []

    constructor(token: Token) {
        this.token = token
    }

    get tokenLiteral(): string {
        return this.token.literal
    }

    addStatement(statement: Statement) {
        this.statements.push(statement)
    }

    toString(): string {
        return this.statements.join('\n')
    }

    accept(visitor: AstVisitor): void {
        visitor.visitBlockStatement(this)
    }
}

export class LetStatement implements Statement {
    private readonly token: Token

    readonly identifier: Identifier
    readonly expression: Expression | undefined

    constructor(token: Token, identifier: Identifier, expression: Expression | undefined = undefined) {
        this.token = token
        this.identifier = identifier
        this.expression = expression
    }

    get tokenLiteral(): string {
        return this.token.literal
    }

    toString(): string {
        let result = `let ${this.identifier.value}`

        if (this.expression) {
            result = `${result} = ${this.expression}`
        }

        return `${result};`
    }

    accept(visitor: AstVisitor): void {
        visitor.visitLetStatement(this)
    }
}

export class ReturnStatement implements Statement {
    private readonly token: Token

    readonly expression: Expression | undefined

    constructor(token: Token, expression: Expression | undefined = undefined) {
        this.token = token
        this.expression = expression
    }

    get tokenLiteral(): string {
        return this.token.literal
    }

    toString(): string {
        return `return${this.expression ? ' ' + this.expression : ''};`
    }

    accept(visitor: AstVisitor): void {
        visitor.visitReturnStatement(this)
    }
}

export class ExpressionStatement implements Statement {
    private readonly token: Token

    readonly expression: Expression | undefined

    constructor(token: Token, expression: Expression | undefined = undefined) {
        this.token = token
        this.expression = expression
    }

    get tokenLiteral(): string {
        return this.token.literal
    }

    toString(): string {
        return `${this.expression};`
    }

    accept(visitor: AstVisitor): void {
        visitor.visitExpressionStatement(this)
    }
}
