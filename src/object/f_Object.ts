import {assert} from 'vitest'
import {BlockStatement, Identifier} from '../ast/ast'
import {Environment} from '../evaluator/evaluator'

export type ObjectType = string

enum ObjectTypes {
    Integer = 'Integer',
    Boolean = 'Boolean',
    String = 'String',
    Array = 'Array',
    Map = 'Map',
    Function = 'Function',
    BuiltinFunction = 'BuiltInFunction',
    Null = 'Null'
}

export abstract class F_Object {
    abstract type: ObjectType
    abstract inspect: string

    abstract equals(other: F_Object): boolean
}

export class F_Integer extends F_Object {
    private readonly _value: number

    constructor(value: number) {
        super()
        this._value = value
    }

    get value(): number {
        return this._value
    }

    override get type(): ObjectType {
        return ObjectTypes.Integer
    }

    override get inspect(): string {
        return this.value.toString()
    }

    override equals(other: F_Object): boolean {
        if (this.type !== other.type) {
            return false
        }
        assert(other instanceof F_Integer)
        return this.value === other.value
    }
}

export class F_Boolean extends F_Object {
    private readonly _value: boolean

    constructor(value: boolean) {
        super()
        this._value = value
    }

    get value(): boolean {
        return this._value
    }

    override get type(): ObjectType {
        return ObjectTypes.Boolean
    }

    override get inspect(): string {
        return this.value.toString()
    }

    override equals(other: F_Object): boolean {
        if (this.type !== other.type) {
            return false
        }
        assert(other instanceof F_Boolean)
        return this.value === other.value
    }

    invert(): F_Boolean {
        return this.value ? F_Boolean.False : F_Boolean.True
    }

    static _True = new F_Boolean(true)
    static get True(): F_Boolean {
        return this._True
    }

    static _False = new F_Boolean(false)
    static get False(): F_Boolean {
        return this._False
    }
}

export class F_String extends F_Object {
    private readonly _value: string

    constructor(value: string) {
        super()
        this._value = value
    }

    get value(): string {
        return this._value
    }

    override get type(): ObjectType {
        return ObjectTypes.String
    }

    override get inspect(): string {
        return this.value
    }

    get length(): F_Object {
        return packNativeValue(this.value.length)
    }

    override equals(other: F_Object): boolean {
        if (this.type !== other.type) {
            return false
        }
        assert(other instanceof F_String)
        return this.value === other.value
    }
}

export class F_Array extends F_Object {
    private readonly _elements: F_Object[]

    constructor(elements: F_Object[]) {
        super()
        this._elements = elements
    }

    get elements(): F_Object[] {
        return this._elements
    }

    override get type(): ObjectType {
        return ObjectTypes.Array
    }

    override get inspect(): string {
        return `[${this._elements.join(',')}]`
    }

    override equals(other: F_Object): boolean {
        if (this.type !== other.type) {
            return false
        }
        assert(other instanceof F_Array)
        return this._elements === other._elements
    }
}

export class F_Map extends F_Object {
    private readonly _map: Map<string, F_Object>

    constructor(map: Map<string, F_Object>) {
        super()
        this._map = map
    }

    override get type(): ObjectType {
        return ObjectTypes.Map
    }

    override get inspect(): string {
        const entries = [...this._map.entries()].map(([key, value]) => `${key}:${value}`)
        return `{${entries.join(', ')}}`
    }

    override equals(other: F_Object): boolean {
        if (this.type !== other.type) {
            return false
        }
        assert(other instanceof F_Map)
        return this._map === other._map
    }

    get(key: F_String): F_Object {
        return this._map.get(key.value) ?? F_Null.Instance
    }
}

export class F_Function extends F_Object {
    private readonly _parameters: Identifier[]
    private readonly _body: BlockStatement
    private readonly _environment: Environment

    constructor(parameters: Identifier[], body: BlockStatement, environment: Environment) {
        super()
        this._parameters = parameters
        this._body = body
        this._environment = environment
    }

    override get type(): ObjectType {
        return ObjectTypes.Function
    }

    override get inspect(): string {
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

    override equals(other: F_Object): boolean {
        if (this.type !== other.type) {
            return false
        }
        return this === other
    }
}

export class F_BuiltinFunction extends F_Object {
    readonly name: string
    private readonly fn: (...args: F_Object[]) => F_Object

    constructor(name: string, fn: (...args: F_Object[]) => F_Object) {
        super()
        this.name = name
        this.fn = fn
    }

    override get type(): ObjectType {
        return ObjectTypes.BuiltinFunction
    }

    override get inspect(): string {
        return `[Builtin: ${this.name}]`
    }

    apply(...args: F_Object[]): F_Object {
        return this.fn(...args)
    }

    override equals(other: F_Object): boolean {
        if (this.type !== other.type) {
            return false
        }
        return this === other
    }
}

export class F_Null extends F_Object {
    override get type(): ObjectType {
        return ObjectTypes.Null
    }

    override get inspect(): string {
        return 'null'
    }

    override equals(other: F_Object): boolean {
        return other.type === ObjectTypes.Null
    }

    static _instance = new F_Null()

    static get Instance(): F_Object {
        return this._instance
    }
}

export function packNativeValue(value: number): F_Integer
export function packNativeValue(value: boolean): F_Boolean
export function packNativeValue(value: number | boolean): F_Object {
    if (typeof value === 'number') {
        return new F_Integer(value)
    } else {
        return value ? F_Boolean.True : F_Boolean.False
    }
}