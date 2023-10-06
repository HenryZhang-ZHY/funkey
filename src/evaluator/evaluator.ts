import {
    ArrayLiteral,
    AstVisitor, BlockStatement,
    BooleanLiteral, CallExpression, DotExpression,
    ExpressionStatement, FunctionLiteral, Identifier, IfExpression, IndexExpression, InfixExpression,
    IntegerLiteral, LetStatement, MapLiteral,
    Node,
    PrefixExpression,
    Program, ReturnStatement, StringLiteral
} from "../ast/ast.ts"
import {
    F_Array,
    F_Boolean,
    F_BuiltinFunction,
    F_Function,
    F_Integer, F_Map,
    F_Null,
    F_Object,
    F_String,
    packNativeValue
} from "../object/f_Object.ts"
import {assert} from "vitest"

class ReturnTrap {
    readonly value: F_Object

    constructor(value: F_Object) {
        this.value = value
    }
}

export class EvaluatingError extends Error {
    readonly innerError: Error | undefined

    constructor(message: string, innerError: Error | undefined = undefined) {
        super(message)

        this.innerError = innerError
    }
}

export class Environment {
    private readonly variableMap: Map<string, Box<F_Object>>
    private readonly parent: Environment | undefined

    constructor(parent: Environment | undefined = undefined) {
        this.variableMap = new Map<string, Box<F_Object>>()
        this.parent = parent
    }

    private getVariableBoxRecursive(identifier: string): Box<F_Object> | undefined {
        return this.getVariableBox(identifier) ?? this.parent?.getVariableBoxRecursive(identifier)
    }

    private getVariableBox(identifier: string): Box<F_Object> | undefined {
        return this.variableMap.get(identifier)
    }

    declareVariable(identifier: string) {
        const box = this.getVariableBox(identifier)
        if (box) {
            throw new Error(`identifier has been declared`)
        }

        this.variableMap.set(identifier, new Box<F_Object>(F_Null.Instance))
    }

    hasVariable(identifier: string): boolean {
        return !!(this.getVariableBoxRecursive(identifier))
    }

    getVariableValue(identifier: string): F_Object {
        const box = this.getVariableBoxRecursive(identifier)
        if (!box) {
            throw new Error(`identifier not found: ${identifier}`)
        }

        return box.value
    }

    setVariableValue(identifier: string, value: F_Object) {
        const box = this.getVariableBoxRecursive(identifier)
        if (!box) {
            throw new Error(`identifier not found: ${identifier}`)
        }

        box.value = value
    }
}

class Box<T> {
    value: T

    constructor(value: T) {
        this.value = value
    }
}

class AstEvaluatorVisitor implements AstVisitor {
    private _result: F_Object = F_Null.Instance
    private readonly environment: Environment
    private readonly builtins: Map<string, F_BuiltinFunction>

    constructor(environment: Environment | undefined = undefined) {
        this.environment = environment ?? new Environment()
        this.builtins = AstEvaluatorVisitor.constructingBuiltins()
    }

    private static constructingBuiltins(): Map<string, F_BuiltinFunction> {
        const builtins = []

        builtins.push(new F_BuiltinFunction('len', (...args: F_Object[]) => {
            if (args.length != 1) {
                throw new Error(`wrong number of arguments. got=${args.length}, want=1`)
            }

            const arg = args[0]
            if (!(arg instanceof F_String)) {
                throw new Error(`argument to \`len\` not supported, got ${arg.type}`)
            }

            return packNativeValue(arg.value.length)
        }))

        return new Map<string, F_BuiltinFunction>(builtins.map(x => [x.name, x]))
    }

    visitProgram(x: Program) {
        try {
            for (const statement of x.statements) {
                statement.accept(this)
            }
        } catch (error) {
            if (error instanceof ReturnTrap) {
                this._result = error.value
            } else if (error instanceof Error) {
                throw new EvaluatingError('evaluating failed', error)
            } else {
                throw new EvaluatingError(`evaluating failed, reason: [${error}]`)
            }
        }
    }

    visitExpressionStatement(x: ExpressionStatement) {
        x.expression!.accept(this)
    }

    visitBlockStatement(x: BlockStatement) {
        for (const statement of x.statements) {
            statement.accept(this)
        }
    }

    visitReturnStatement(x: ReturnStatement) {
        x.expression?.accept(this)
        throw new ReturnTrap(this._result)
    }

    visitLetStatement(x: LetStatement) {
        const identifier = x.identifier.value;
        this.environment.declareVariable(identifier)
        if (x.expression) {
            this.environment.setVariableValue(identifier, evaluate(x.expression, this.environment))
        }
    }

    visitPrefixExpression(x: PrefixExpression) {
        switch (x.operator) {
            case '!':
                evaluateBang(this)
                break
            case '-':
                evaluateMinus(this)
                break
        }

        function evaluateBang(visitor: AstEvaluatorVisitor) {
            const expressionValue = evaluate(x.value, visitor.environment)
            visitor._result = packNativeValue(!visitor.isTruthy(expressionValue))
        }

        function evaluateMinus(visitor: AstEvaluatorVisitor) {
            const expressionValue = evaluate(x.value, visitor.environment)
            if (expressionValue instanceof F_Integer) {
                visitor._result = new F_Integer(-expressionValue.value)
            } else {
                throw new Error(`unknown operator: -${expressionValue.type}`)
            }
        }
    }

    visitInfixExpression(x: InfixExpression) {
        const left = evaluate(x.left, this.environment)
        const right = evaluate(x.right, this.environment)
        switch (x.operator) {
            case '+':
            case '-':
            case '*':
            case '/':
                if (left instanceof F_Integer && right instanceof F_Integer) {
                    this._result = evaluateArithmeticExpression(left, x.operator, right)
                    break
                } else if (left instanceof F_String && right instanceof F_String && x.operator === '+') {
                    this._result = new F_String(`${left.value}${right.value}`)
                    break
                } else {
                    if (left.type !== right.type) {
                        throw new Error(`type mismatch: ${left.type} ${x.operator} ${right.type}`)
                    } else {
                        throw new Error(`unknown operator: ${left.type} ${x.operator} ${right.type}`)
                    }
                }
            case '>':
            case '<':
                assert(left instanceof F_Integer)
                assert(right instanceof F_Integer)
                this._result = evaluateComparingExpression(left, x.operator, right)
                break
            case '==':
                this._result = evaluateEquals(left, right)
                break
            case '!=':
                this._result = evaluateEquals(left, right).invert()
                break
        }

        function evaluateArithmeticExpression(left: F_Integer, operator: '+' | '-' | '*' | '/', right: F_Integer): F_Integer {
            switch (operator) {
                case "+":
                    return packNativeValue(left.value + right.value)
                case "-":
                    return packNativeValue(left.value - right.value)
                case "*":
                    return packNativeValue(left.value * right.value)
                case "/":
                    return packNativeValue(left.value / right.value)
            }
        }

        function evaluateComparingExpression(left: F_Integer, operator: '>' | '<' | '==' | '!=', right: F_Integer): F_Boolean {
            switch (operator) {
                case ">":
                    return packNativeValue(left.value > right.value)
                case "<":
                    return packNativeValue(left.value < right.value)
                case "==":
                    return packNativeValue(left.value == right.value)
                case "!=":
                    return packNativeValue(left.value != right.value)
            }
        }

        function evaluateEquals(left: F_Object, right: F_Object): F_Boolean {
            return packNativeValue(left.equals(right))
        }
    }

    visitCallExpression(x: CallExpression) {
        const fn = evaluate(x.fn, this.environment)
        const args = x.args.map(arg => evaluate(arg, this.environment))

        if (fn instanceof F_Function) {
            this.applyFunctionCall(fn, args)
        } else if (fn instanceof F_BuiltinFunction) {
            this._result = fn.apply(...args)
        } else {
            throw new Error('it is not a function')
        }
    }

    private applyFunctionCall(fn: F_Function, args: F_Object[]) {
        if (fn.parameters.length !== args.length) {
            throw new Error('arguments count mismatch')
        }

        const environment = new Environment(fn.environment)
        fn.parameters.forEach((parameter, index) => {
            const variableName = parameter.value;
            environment.declareVariable(variableName)
            environment.setVariableValue(variableName, args[index])
        })

        this._result = evaluate(fn.body, environment)
    }

    visitDotExpression(x: DotExpression) {
        const left = evaluate(x.left, this.environment)
        // @ts-ignore
        const result = left[x.right.value]

        if (!(result instanceof F_Object)) {
            throw new Error('invalid operation')
        }

        this._result = result
    }

    visitIndexExpression(x: IndexExpression) {
        const left = evaluate(x.left, this.environment)
        const index = evaluate(x.index, this.environment)

        if (!(left instanceof F_Array) || !(index instanceof F_Integer)) {
            throw new Error(`index expression is not valid`)
        }
        if (index.value < 0 || index.value > left.elements.length) {
            throw new Error(`index out of bound`)
        }

        this._result = left.elements[index.value]
    }

    visitIfExpression(x: IfExpression) {
        const condition = evaluate(x.condition, this.environment)
        if (this.isTruthy(condition)) {
            this._result = evaluate(x.consequence, this.environment)
        } else {
            if (x.alternative) {
                this._result = evaluate(x.alternative, this.environment)
            } else {
                this._result = F_Null.Instance
            }
        }
    }

    visitBooleanLiteral(x: BooleanLiteral) {
        this._result = x.value ? F_Boolean.True : F_Boolean.False
    }

    visitIntegerLiteral(x: IntegerLiteral) {
        this._result = new F_Integer(x.value)
    }

    visitStringLiteral(x: StringLiteral) {
        this._result = new F_String(x.value)
    }

    visitArrayLiteral(x: ArrayLiteral) {
        this._result = new F_Array(x.elements.map(e => evaluate(e, this.environment)))
    }

    visitMapLiteral(x: MapLiteral) {
        const result = new Map<string, F_Object>()
        for (const [keyExpression, valueExpression] of x.map) {
            const key = evaluate(keyExpression, this.environment)
            if (!(key instanceof F_String)) {
                throw new Error('invalid map key')
            }
            result.set(key.value, evaluate(valueExpression, this.environment))
        }
        this._result = new F_Map(result)
    }

    visitFunctionLiteral(x: FunctionLiteral) {
        this._result = new F_Function(x.parameters, x.body, this.environment)
    }

    visitIdentifier(x: Identifier) {
        if (this.environment.hasVariable(x.value)) {
            this._result = this.environment.getVariableValue(x.value)
            return
        }

        if (this.builtins.has(x.value)) {
            this._result = this.builtins.get(x.value)!
            return
        }

        throw new Error(`identifier not found: ${x.value}`)
    }

    get result(): F_Object {
        return this._result
    }

    private isTruthy(x: F_Object) {
        if (x instanceof F_Integer) {
            return x.value !== 0
        } else if (x instanceof F_Boolean) {
            return x.value
        } else {
            return false
        }
    }
}

export function evaluate(node: Node, environment: Environment | undefined = undefined): F_Object {
    const evaluatorVisitor = new AstEvaluatorVisitor(environment)
    node.accept(evaluatorVisitor)
    return evaluatorVisitor.result
}
