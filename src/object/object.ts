import {assert} from "vitest";
import {BlockStatement, Identifier} from "../ast/ast.ts";
import {Environment} from "../evaluator/evaluator.ts";

export type ObjectType = string

const ObjectTypes = {
    Integer: 'Integer',
    Boolean: 'Boolean',
    String: 'String',
    Function: 'Function',
    BuiltinFunction: 'BuiltInFunction',
    Null: 'Null'
}

export interface Object {
    type: ObjectType
    inspect: string

    equals: (other: Object) => boolean
}

export class Integer implements Object {
    private readonly _value: number

    constructor(value: number) {
        this._value = value
    }

    get value(): number {
        return this._value
    }

    get type(): ObjectType {
        return ObjectTypes.Integer
    }

    get inspect(): string {
        return this.value.toString()
    }

    equals(other: Object): boolean {
        if (this.type !== other.type) {
            return false
        }
        assert(other instanceof Integer)
        return this.value === other.value
    }
}

export class Boolean implements Object {
    private readonly _value: boolean

    constructor(value: boolean) {
        this._value = value
    }

    get value(): boolean {
        return this._value
    }

    get type(): ObjectType {
        return ObjectTypes.Boolean
    }

    get inspect(): string {
        return this.value.toString()
    }

    equals(other: Object): boolean {
        if (this.type !== other.type) {
            return false
        }
        assert(other instanceof Boolean)
        return this.value === other.value
    }

    invert(): Boolean {
        return this.value ? Boolean.False : Boolean.True
    }

    static _True = new Boolean(true)
    static get True(): Boolean {
        return this._True
    }

    static _False = new Boolean(false)
    static get False(): Boolean {
        return this._False
    }
}

export class String implements Object {
    private readonly _value: string

    constructor(value: string) {
        this._value = value
    }

    get value(): string {
        return this._value
    }

    get type(): ObjectType {
        return ObjectTypes.String
    }

    get inspect(): string {
        return this.value
    }

    equals(other: Object): boolean {
        if (this.type !== other.type) {
            return false
        }
        assert(other instanceof String)
        return this.value === other.value
    }
}

export class Array implements Object {
    private readonly _elements: Object[]

    constructor(elements: Object[]) {
        this._elements = elements
    }

    get elements(): Object[] {
        return this._elements
    }

    get type(): ObjectType {
        return ObjectTypes.String
    }

    get inspect(): string {
        return `[${this._elements.join(',')}]`
    }

    equals(other: Object): boolean {
        if (this.type !== other.type) {
            return false
        }
        assert(other instanceof Array)
        return this._elements === other._elements
    }
}

export class Function implements Object {
    private readonly _parameters: Identifier[]
    private readonly _body: BlockStatement
    private readonly _environment: Environment

    constructor(parameters: Identifier[], body: BlockStatement, environment: Environment) {
        this._parameters = parameters
        this._body = body
        this._environment = environment
    }

    get type(): ObjectType {
        return ObjectTypes.Function
    }

    get inspect(): string {
        return `fn(${this._parameters.join(', ')}) {
    ${this._body}}`
    }

    get parameters() {
        return this._parameters
    }

    get body() {
        return this._body
    }

    get environment() {
        return this._environment
    }

    equals(other: Object): boolean {
        if (this.type !== other.type) {
            return false
        }
        return this === other
    }
}

export class BuiltinFunction implements Object {
    readonly name: string
    private readonly fn: (...args: Object[]) => Object

    constructor(name:string, fn: (...args: Object[]) => Object) {
       this.name = name
       this.fn = fn
    }

    get type(): ObjectType {
        return ObjectTypes.BuiltinFunction
    }

    get inspect(): string {
        return `[Builtin: ${this.name}]`
    }

    apply(...args: Object[]): Object {
        return this.fn(...args)
    }

    equals(other: Object): boolean {
        if (this.type !== other.type) {
            return false
        }
        return this === other
    }
}

export class Null implements Object {
    get type(): ObjectType {
        return ObjectTypes.Null
    }

    get inspect(): string {
        return 'null'
    }

    equals(other: Object): boolean {
        return other.type === ObjectTypes.Null
    }

    static _instance = new Null()

    static get Instance(): Object {
        return this._instance
    }
}