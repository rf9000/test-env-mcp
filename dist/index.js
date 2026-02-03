#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/ajv/dist/compile/codegen/code.js
var require_code = __commonJS({
  "node_modules/ajv/dist/compile/codegen/code.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.regexpCode = exports.getEsmExportName = exports.getProperty = exports.safeStringify = exports.stringify = exports.strConcat = exports.addCodeArg = exports.str = exports._ = exports.nil = exports._Code = exports.Name = exports.IDENTIFIER = exports._CodeOrName = void 0;
    var _CodeOrName = class {
      static {
        __name(this, "_CodeOrName");
      }
    };
    exports._CodeOrName = _CodeOrName;
    exports.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
    var Name = class extends _CodeOrName {
      static {
        __name(this, "Name");
      }
      constructor(s) {
        super();
        if (!exports.IDENTIFIER.test(s))
          throw new Error("CodeGen: name must be a valid identifier");
        this.str = s;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        return false;
      }
      get names() {
        return { [this.str]: 1 };
      }
    };
    exports.Name = Name;
    var _Code = class extends _CodeOrName {
      static {
        __name(this, "_Code");
      }
      constructor(code) {
        super();
        this._items = typeof code === "string" ? [code] : code;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        if (this._items.length > 1)
          return false;
        const item = this._items[0];
        return item === "" || item === '""';
      }
      get str() {
        var _a;
        return (_a = this._str) !== null && _a !== void 0 ? _a : this._str = this._items.reduce((s, c) => `${s}${c}`, "");
      }
      get names() {
        var _a;
        return (_a = this._names) !== null && _a !== void 0 ? _a : this._names = this._items.reduce((names, c) => {
          if (c instanceof Name)
            names[c.str] = (names[c.str] || 0) + 1;
          return names;
        }, {});
      }
    };
    exports._Code = _Code;
    exports.nil = new _Code("");
    function _(strs, ...args) {
      const code = [strs[0]];
      let i = 0;
      while (i < args.length) {
        addCodeArg(code, args[i]);
        code.push(strs[++i]);
      }
      return new _Code(code);
    }
    __name(_, "_");
    exports._ = _;
    var plus = new _Code("+");
    function str(strs, ...args) {
      const expr = [safeStringify(strs[0])];
      let i = 0;
      while (i < args.length) {
        expr.push(plus);
        addCodeArg(expr, args[i]);
        expr.push(plus, safeStringify(strs[++i]));
      }
      optimize(expr);
      return new _Code(expr);
    }
    __name(str, "str");
    exports.str = str;
    function addCodeArg(code, arg) {
      if (arg instanceof _Code)
        code.push(...arg._items);
      else if (arg instanceof Name)
        code.push(arg);
      else
        code.push(interpolate(arg));
    }
    __name(addCodeArg, "addCodeArg");
    exports.addCodeArg = addCodeArg;
    function optimize(expr) {
      let i = 1;
      while (i < expr.length - 1) {
        if (expr[i] === plus) {
          const res = mergeExprItems(expr[i - 1], expr[i + 1]);
          if (res !== void 0) {
            expr.splice(i - 1, 3, res);
            continue;
          }
          expr[i++] = "+";
        }
        i++;
      }
    }
    __name(optimize, "optimize");
    function mergeExprItems(a, b) {
      if (b === '""')
        return a;
      if (a === '""')
        return b;
      if (typeof a == "string") {
        if (b instanceof Name || a[a.length - 1] !== '"')
          return;
        if (typeof b != "string")
          return `${a.slice(0, -1)}${b}"`;
        if (b[0] === '"')
          return a.slice(0, -1) + b.slice(1);
        return;
      }
      if (typeof b == "string" && b[0] === '"' && !(a instanceof Name))
        return `"${a}${b.slice(1)}`;
      return;
    }
    __name(mergeExprItems, "mergeExprItems");
    function strConcat(c1, c2) {
      return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str`${c1}${c2}`;
    }
    __name(strConcat, "strConcat");
    exports.strConcat = strConcat;
    function interpolate(x) {
      return typeof x == "number" || typeof x == "boolean" || x === null ? x : safeStringify(Array.isArray(x) ? x.join(",") : x);
    }
    __name(interpolate, "interpolate");
    function stringify(x) {
      return new _Code(safeStringify(x));
    }
    __name(stringify, "stringify");
    exports.stringify = stringify;
    function safeStringify(x) {
      return JSON.stringify(x).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    }
    __name(safeStringify, "safeStringify");
    exports.safeStringify = safeStringify;
    function getProperty(key) {
      return typeof key == "string" && exports.IDENTIFIER.test(key) ? new _Code(`.${key}`) : _`[${key}]`;
    }
    __name(getProperty, "getProperty");
    exports.getProperty = getProperty;
    function getEsmExportName(key) {
      if (typeof key == "string" && exports.IDENTIFIER.test(key)) {
        return new _Code(`${key}`);
      }
      throw new Error(`CodeGen: invalid export name: ${key}, use explicit $id name mapping`);
    }
    __name(getEsmExportName, "getEsmExportName");
    exports.getEsmExportName = getEsmExportName;
    function regexpCode(rx) {
      return new _Code(rx.toString());
    }
    __name(regexpCode, "regexpCode");
    exports.regexpCode = regexpCode;
  }
});

// node_modules/ajv/dist/compile/codegen/scope.js
var require_scope = __commonJS({
  "node_modules/ajv/dist/compile/codegen/scope.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ValueScope = exports.ValueScopeName = exports.Scope = exports.varKinds = exports.UsedValueState = void 0;
    var code_1 = require_code();
    var ValueError = class extends Error {
      static {
        __name(this, "ValueError");
      }
      constructor(name) {
        super(`CodeGen: "code" for ${name} not defined`);
        this.value = name.value;
      }
    };
    var UsedValueState;
    (function(UsedValueState2) {
      UsedValueState2[UsedValueState2["Started"] = 0] = "Started";
      UsedValueState2[UsedValueState2["Completed"] = 1] = "Completed";
    })(UsedValueState || (exports.UsedValueState = UsedValueState = {}));
    exports.varKinds = {
      const: new code_1.Name("const"),
      let: new code_1.Name("let"),
      var: new code_1.Name("var")
    };
    var Scope = class {
      static {
        __name(this, "Scope");
      }
      constructor({ prefixes, parent } = {}) {
        this._names = {};
        this._prefixes = prefixes;
        this._parent = parent;
      }
      toName(nameOrPrefix) {
        return nameOrPrefix instanceof code_1.Name ? nameOrPrefix : this.name(nameOrPrefix);
      }
      name(prefix) {
        return new code_1.Name(this._newName(prefix));
      }
      _newName(prefix) {
        const ng = this._names[prefix] || this._nameGroup(prefix);
        return `${prefix}${ng.index++}`;
      }
      _nameGroup(prefix) {
        var _a, _b;
        if (((_b = (_a = this._parent) === null || _a === void 0 ? void 0 : _a._prefixes) === null || _b === void 0 ? void 0 : _b.has(prefix)) || this._prefixes && !this._prefixes.has(prefix)) {
          throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`);
        }
        return this._names[prefix] = { prefix, index: 0 };
      }
    };
    exports.Scope = Scope;
    var ValueScopeName = class extends code_1.Name {
      static {
        __name(this, "ValueScopeName");
      }
      constructor(prefix, nameStr) {
        super(nameStr);
        this.prefix = prefix;
      }
      setValue(value, { property, itemIndex }) {
        this.value = value;
        this.scopePath = (0, code_1._)`.${new code_1.Name(property)}[${itemIndex}]`;
      }
    };
    exports.ValueScopeName = ValueScopeName;
    var line = (0, code_1._)`\n`;
    var ValueScope = class extends Scope {
      static {
        __name(this, "ValueScope");
      }
      constructor(opts) {
        super(opts);
        this._values = {};
        this._scope = opts.scope;
        this.opts = { ...opts, _n: opts.lines ? line : code_1.nil };
      }
      get() {
        return this._scope;
      }
      name(prefix) {
        return new ValueScopeName(prefix, this._newName(prefix));
      }
      value(nameOrPrefix, value) {
        var _a;
        if (value.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const name = this.toName(nameOrPrefix);
        const { prefix } = name;
        const valueKey = (_a = value.key) !== null && _a !== void 0 ? _a : value.ref;
        let vs = this._values[prefix];
        if (vs) {
          const _name = vs.get(valueKey);
          if (_name)
            return _name;
        } else {
          vs = this._values[prefix] = /* @__PURE__ */ new Map();
        }
        vs.set(valueKey, name);
        const s = this._scope[prefix] || (this._scope[prefix] = []);
        const itemIndex = s.length;
        s[itemIndex] = value.ref;
        name.setValue(value, { property: prefix, itemIndex });
        return name;
      }
      getValue(prefix, keyOrRef) {
        const vs = this._values[prefix];
        if (!vs)
          return;
        return vs.get(keyOrRef);
      }
      scopeRefs(scopeName, values = this._values) {
        return this._reduceValues(values, (name) => {
          if (name.scopePath === void 0)
            throw new Error(`CodeGen: name "${name}" has no value`);
          return (0, code_1._)`${scopeName}${name.scopePath}`;
        });
      }
      scopeCode(values = this._values, usedValues, getCode) {
        return this._reduceValues(values, (name) => {
          if (name.value === void 0)
            throw new Error(`CodeGen: name "${name}" has no value`);
          return name.value.code;
        }, usedValues, getCode);
      }
      _reduceValues(values, valueCode, usedValues = {}, getCode) {
        let code = code_1.nil;
        for (const prefix in values) {
          const vs = values[prefix];
          if (!vs)
            continue;
          const nameSet = usedValues[prefix] = usedValues[prefix] || /* @__PURE__ */ new Map();
          vs.forEach((name) => {
            if (nameSet.has(name))
              return;
            nameSet.set(name, UsedValueState.Started);
            let c = valueCode(name);
            if (c) {
              const def = this.opts.es5 ? exports.varKinds.var : exports.varKinds.const;
              code = (0, code_1._)`${code}${def} ${name} = ${c};${this.opts._n}`;
            } else if (c = getCode === null || getCode === void 0 ? void 0 : getCode(name)) {
              code = (0, code_1._)`${code}${c}${this.opts._n}`;
            } else {
              throw new ValueError(name);
            }
            nameSet.set(name, UsedValueState.Completed);
          });
        }
        return code;
      }
    };
    exports.ValueScope = ValueScope;
  }
});

// node_modules/ajv/dist/compile/codegen/index.js
var require_codegen = __commonJS({
  "node_modules/ajv/dist/compile/codegen/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.or = exports.and = exports.not = exports.CodeGen = exports.operators = exports.varKinds = exports.ValueScopeName = exports.ValueScope = exports.Scope = exports.Name = exports.regexpCode = exports.stringify = exports.getProperty = exports.nil = exports.strConcat = exports.str = exports._ = void 0;
    var code_1 = require_code();
    var scope_1 = require_scope();
    var code_2 = require_code();
    Object.defineProperty(exports, "_", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return code_2._;
    }, "get") });
    Object.defineProperty(exports, "str", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return code_2.str;
    }, "get") });
    Object.defineProperty(exports, "strConcat", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return code_2.strConcat;
    }, "get") });
    Object.defineProperty(exports, "nil", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return code_2.nil;
    }, "get") });
    Object.defineProperty(exports, "getProperty", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return code_2.getProperty;
    }, "get") });
    Object.defineProperty(exports, "stringify", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return code_2.stringify;
    }, "get") });
    Object.defineProperty(exports, "regexpCode", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return code_2.regexpCode;
    }, "get") });
    Object.defineProperty(exports, "Name", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return code_2.Name;
    }, "get") });
    var scope_2 = require_scope();
    Object.defineProperty(exports, "Scope", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return scope_2.Scope;
    }, "get") });
    Object.defineProperty(exports, "ValueScope", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return scope_2.ValueScope;
    }, "get") });
    Object.defineProperty(exports, "ValueScopeName", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return scope_2.ValueScopeName;
    }, "get") });
    Object.defineProperty(exports, "varKinds", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return scope_2.varKinds;
    }, "get") });
    exports.operators = {
      GT: new code_1._Code(">"),
      GTE: new code_1._Code(">="),
      LT: new code_1._Code("<"),
      LTE: new code_1._Code("<="),
      EQ: new code_1._Code("==="),
      NEQ: new code_1._Code("!=="),
      NOT: new code_1._Code("!"),
      OR: new code_1._Code("||"),
      AND: new code_1._Code("&&"),
      ADD: new code_1._Code("+")
    };
    var Node = class {
      static {
        __name(this, "Node");
      }
      optimizeNodes() {
        return this;
      }
      optimizeNames(_names, _constants) {
        return this;
      }
    };
    var Def = class extends Node {
      static {
        __name(this, "Def");
      }
      constructor(varKind, name, rhs) {
        super();
        this.varKind = varKind;
        this.name = name;
        this.rhs = rhs;
      }
      render({ es5, _n }) {
        const varKind = es5 ? scope_1.varKinds.var : this.varKind;
        const rhs = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${varKind} ${this.name}${rhs};` + _n;
      }
      optimizeNames(names, constants) {
        if (!names[this.name.str])
          return;
        if (this.rhs)
          this.rhs = optimizeExpr(this.rhs, names, constants);
        return this;
      }
      get names() {
        return this.rhs instanceof code_1._CodeOrName ? this.rhs.names : {};
      }
    };
    var Assign = class extends Node {
      static {
        __name(this, "Assign");
      }
      constructor(lhs, rhs, sideEffects) {
        super();
        this.lhs = lhs;
        this.rhs = rhs;
        this.sideEffects = sideEffects;
      }
      render({ _n }) {
        return `${this.lhs} = ${this.rhs};` + _n;
      }
      optimizeNames(names, constants) {
        if (this.lhs instanceof code_1.Name && !names[this.lhs.str] && !this.sideEffects)
          return;
        this.rhs = optimizeExpr(this.rhs, names, constants);
        return this;
      }
      get names() {
        const names = this.lhs instanceof code_1.Name ? {} : { ...this.lhs.names };
        return addExprNames(names, this.rhs);
      }
    };
    var AssignOp = class extends Assign {
      static {
        __name(this, "AssignOp");
      }
      constructor(lhs, op, rhs, sideEffects) {
        super(lhs, rhs, sideEffects);
        this.op = op;
      }
      render({ _n }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + _n;
      }
    };
    var Label = class extends Node {
      static {
        __name(this, "Label");
      }
      constructor(label) {
        super();
        this.label = label;
        this.names = {};
      }
      render({ _n }) {
        return `${this.label}:` + _n;
      }
    };
    var Break = class extends Node {
      static {
        __name(this, "Break");
      }
      constructor(label) {
        super();
        this.label = label;
        this.names = {};
      }
      render({ _n }) {
        const label = this.label ? ` ${this.label}` : "";
        return `break${label};` + _n;
      }
    };
    var Throw = class extends Node {
      static {
        __name(this, "Throw");
      }
      constructor(error) {
        super();
        this.error = error;
      }
      render({ _n }) {
        return `throw ${this.error};` + _n;
      }
      get names() {
        return this.error.names;
      }
    };
    var AnyCode = class extends Node {
      static {
        __name(this, "AnyCode");
      }
      constructor(code) {
        super();
        this.code = code;
      }
      render({ _n }) {
        return `${this.code};` + _n;
      }
      optimizeNodes() {
        return `${this.code}` ? this : void 0;
      }
      optimizeNames(names, constants) {
        this.code = optimizeExpr(this.code, names, constants);
        return this;
      }
      get names() {
        return this.code instanceof code_1._CodeOrName ? this.code.names : {};
      }
    };
    var ParentNode = class extends Node {
      static {
        __name(this, "ParentNode");
      }
      constructor(nodes = []) {
        super();
        this.nodes = nodes;
      }
      render(opts) {
        return this.nodes.reduce((code, n) => code + n.render(opts), "");
      }
      optimizeNodes() {
        const { nodes } = this;
        let i = nodes.length;
        while (i--) {
          const n = nodes[i].optimizeNodes();
          if (Array.isArray(n))
            nodes.splice(i, 1, ...n);
          else if (n)
            nodes[i] = n;
          else
            nodes.splice(i, 1);
        }
        return nodes.length > 0 ? this : void 0;
      }
      optimizeNames(names, constants) {
        const { nodes } = this;
        let i = nodes.length;
        while (i--) {
          const n = nodes[i];
          if (n.optimizeNames(names, constants))
            continue;
          subtractNames(names, n.names);
          nodes.splice(i, 1);
        }
        return nodes.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((names, n) => addNames(names, n.names), {});
      }
    };
    var BlockNode = class extends ParentNode {
      static {
        __name(this, "BlockNode");
      }
      render(opts) {
        return "{" + opts._n + super.render(opts) + "}" + opts._n;
      }
    };
    var Root = class extends ParentNode {
      static {
        __name(this, "Root");
      }
    };
    var Else = class extends BlockNode {
      static {
        __name(this, "Else");
      }
    };
    Else.kind = "else";
    var If = class _If extends BlockNode {
      static {
        __name(this, "If");
      }
      constructor(condition, nodes) {
        super(nodes);
        this.condition = condition;
      }
      render(opts) {
        let code = `if(${this.condition})` + super.render(opts);
        if (this.else)
          code += "else " + this.else.render(opts);
        return code;
      }
      optimizeNodes() {
        super.optimizeNodes();
        const cond = this.condition;
        if (cond === true)
          return this.nodes;
        let e = this.else;
        if (e) {
          const ns = e.optimizeNodes();
          e = this.else = Array.isArray(ns) ? new Else(ns) : ns;
        }
        if (e) {
          if (cond === false)
            return e instanceof _If ? e : e.nodes;
          if (this.nodes.length)
            return this;
          return new _If(not(cond), e instanceof _If ? [e] : e.nodes);
        }
        if (cond === false || !this.nodes.length)
          return void 0;
        return this;
      }
      optimizeNames(names, constants) {
        var _a;
        this.else = (_a = this.else) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants);
        if (!(super.optimizeNames(names, constants) || this.else))
          return;
        this.condition = optimizeExpr(this.condition, names, constants);
        return this;
      }
      get names() {
        const names = super.names;
        addExprNames(names, this.condition);
        if (this.else)
          addNames(names, this.else.names);
        return names;
      }
    };
    If.kind = "if";
    var For = class extends BlockNode {
      static {
        __name(this, "For");
      }
    };
    For.kind = "for";
    var ForLoop = class extends For {
      static {
        __name(this, "ForLoop");
      }
      constructor(iteration) {
        super();
        this.iteration = iteration;
      }
      render(opts) {
        return `for(${this.iteration})` + super.render(opts);
      }
      optimizeNames(names, constants) {
        if (!super.optimizeNames(names, constants))
          return;
        this.iteration = optimizeExpr(this.iteration, names, constants);
        return this;
      }
      get names() {
        return addNames(super.names, this.iteration.names);
      }
    };
    var ForRange = class extends For {
      static {
        __name(this, "ForRange");
      }
      constructor(varKind, name, from, to) {
        super();
        this.varKind = varKind;
        this.name = name;
        this.from = from;
        this.to = to;
      }
      render(opts) {
        const varKind = opts.es5 ? scope_1.varKinds.var : this.varKind;
        const { name, from, to } = this;
        return `for(${varKind} ${name}=${from}; ${name}<${to}; ${name}++)` + super.render(opts);
      }
      get names() {
        const names = addExprNames(super.names, this.from);
        return addExprNames(names, this.to);
      }
    };
    var ForIter = class extends For {
      static {
        __name(this, "ForIter");
      }
      constructor(loop, varKind, name, iterable) {
        super();
        this.loop = loop;
        this.varKind = varKind;
        this.name = name;
        this.iterable = iterable;
      }
      render(opts) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(opts);
      }
      optimizeNames(names, constants) {
        if (!super.optimizeNames(names, constants))
          return;
        this.iterable = optimizeExpr(this.iterable, names, constants);
        return this;
      }
      get names() {
        return addNames(super.names, this.iterable.names);
      }
    };
    var Func = class extends BlockNode {
      static {
        __name(this, "Func");
      }
      constructor(name, args, async) {
        super();
        this.name = name;
        this.args = args;
        this.async = async;
      }
      render(opts) {
        const _async = this.async ? "async " : "";
        return `${_async}function ${this.name}(${this.args})` + super.render(opts);
      }
    };
    Func.kind = "func";
    var Return = class extends ParentNode {
      static {
        __name(this, "Return");
      }
      render(opts) {
        return "return " + super.render(opts);
      }
    };
    Return.kind = "return";
    var Try = class extends BlockNode {
      static {
        __name(this, "Try");
      }
      render(opts) {
        let code = "try" + super.render(opts);
        if (this.catch)
          code += this.catch.render(opts);
        if (this.finally)
          code += this.finally.render(opts);
        return code;
      }
      optimizeNodes() {
        var _a, _b;
        super.optimizeNodes();
        (_a = this.catch) === null || _a === void 0 ? void 0 : _a.optimizeNodes();
        (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNodes();
        return this;
      }
      optimizeNames(names, constants) {
        var _a, _b;
        super.optimizeNames(names, constants);
        (_a = this.catch) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants);
        (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNames(names, constants);
        return this;
      }
      get names() {
        const names = super.names;
        if (this.catch)
          addNames(names, this.catch.names);
        if (this.finally)
          addNames(names, this.finally.names);
        return names;
      }
    };
    var Catch = class extends BlockNode {
      static {
        __name(this, "Catch");
      }
      constructor(error) {
        super();
        this.error = error;
      }
      render(opts) {
        return `catch(${this.error})` + super.render(opts);
      }
    };
    Catch.kind = "catch";
    var Finally = class extends BlockNode {
      static {
        __name(this, "Finally");
      }
      render(opts) {
        return "finally" + super.render(opts);
      }
    };
    Finally.kind = "finally";
    var CodeGen = class {
      static {
        __name(this, "CodeGen");
      }
      constructor(extScope, opts = {}) {
        this._values = {};
        this._blockStarts = [];
        this._constants = {};
        this.opts = { ...opts, _n: opts.lines ? "\n" : "" };
        this._extScope = extScope;
        this._scope = new scope_1.Scope({ parent: extScope });
        this._nodes = [new Root()];
      }
      toString() {
        return this._root.render(this.opts);
      }
      // returns unique name in the internal scope
      name(prefix) {
        return this._scope.name(prefix);
      }
      // reserves unique name in the external scope
      scopeName(prefix) {
        return this._extScope.name(prefix);
      }
      // reserves unique name in the external scope and assigns value to it
      scopeValue(prefixOrName, value) {
        const name = this._extScope.value(prefixOrName, value);
        const vs = this._values[name.prefix] || (this._values[name.prefix] = /* @__PURE__ */ new Set());
        vs.add(name);
        return name;
      }
      getScopeValue(prefix, keyOrRef) {
        return this._extScope.getValue(prefix, keyOrRef);
      }
      // return code that assigns values in the external scope to the names that are used internally
      // (same names that were returned by gen.scopeName or gen.scopeValue)
      scopeRefs(scopeName) {
        return this._extScope.scopeRefs(scopeName, this._values);
      }
      scopeCode() {
        return this._extScope.scopeCode(this._values);
      }
      _def(varKind, nameOrPrefix, rhs, constant) {
        const name = this._scope.toName(nameOrPrefix);
        if (rhs !== void 0 && constant)
          this._constants[name.str] = rhs;
        this._leafNode(new Def(varKind, name, rhs));
        return name;
      }
      // `const` declaration (`var` in es5 mode)
      const(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.const, nameOrPrefix, rhs, _constant);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.let, nameOrPrefix, rhs, _constant);
      }
      // `var` declaration with optional assignment
      var(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.var, nameOrPrefix, rhs, _constant);
      }
      // assignment code
      assign(lhs, rhs, sideEffects) {
        return this._leafNode(new Assign(lhs, rhs, sideEffects));
      }
      // `+=` code
      add(lhs, rhs) {
        return this._leafNode(new AssignOp(lhs, exports.operators.ADD, rhs));
      }
      // appends passed SafeExpr to code or executes Block
      code(c) {
        if (typeof c == "function")
          c();
        else if (c !== code_1.nil)
          this._leafNode(new AnyCode(c));
        return this;
      }
      // returns code for object literal for the passed argument list of key-value pairs
      object(...keyValues) {
        const code = ["{"];
        for (const [key, value] of keyValues) {
          if (code.length > 1)
            code.push(",");
          code.push(key);
          if (key !== value || this.opts.es5) {
            code.push(":");
            (0, code_1.addCodeArg)(code, value);
          }
        }
        code.push("}");
        return new code_1._Code(code);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(condition, thenBody, elseBody) {
        this._blockNode(new If(condition));
        if (thenBody && elseBody) {
          this.code(thenBody).else().code(elseBody).endIf();
        } else if (thenBody) {
          this.code(thenBody).endIf();
        } else if (elseBody) {
          throw new Error('CodeGen: "else" body without "then" body');
        }
        return this;
      }
      // `else if` clause - invalid without `if` or after `else` clauses
      elseIf(condition) {
        return this._elseNode(new If(condition));
      }
      // `else` clause - only valid after `if` or `else if` clauses
      else() {
        return this._elseNode(new Else());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(If, Else);
      }
      _for(node, forBody) {
        this._blockNode(node);
        if (forBody)
          this.code(forBody).endFor();
        return this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(iteration, forBody) {
        return this._for(new ForLoop(iteration), forBody);
      }
      // `for` statement for a range of values
      forRange(nameOrPrefix, from, to, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.let) {
        const name = this._scope.toName(nameOrPrefix);
        return this._for(new ForRange(varKind, name, from, to), () => forBody(name));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(nameOrPrefix, iterable, forBody, varKind = scope_1.varKinds.const) {
        const name = this._scope.toName(nameOrPrefix);
        if (this.opts.es5) {
          const arr = iterable instanceof code_1.Name ? iterable : this.var("_arr", iterable);
          return this.forRange("_i", 0, (0, code_1._)`${arr}.length`, (i) => {
            this.var(name, (0, code_1._)`${arr}[${i}]`);
            forBody(name);
          });
        }
        return this._for(new ForIter("of", varKind, name, iterable), () => forBody(name));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(nameOrPrefix, obj, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.const) {
        if (this.opts.ownProperties) {
          return this.forOf(nameOrPrefix, (0, code_1._)`Object.keys(${obj})`, forBody);
        }
        const name = this._scope.toName(nameOrPrefix);
        return this._for(new ForIter("in", varKind, name, obj), () => forBody(name));
      }
      // end `for` loop
      endFor() {
        return this._endBlockNode(For);
      }
      // `label` statement
      label(label) {
        return this._leafNode(new Label(label));
      }
      // `break` statement
      break(label) {
        return this._leafNode(new Break(label));
      }
      // `return` statement
      return(value) {
        const node = new Return();
        this._blockNode(node);
        this.code(value);
        if (node.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(Return);
      }
      // `try` statement
      try(tryBody, catchCode, finallyCode) {
        if (!catchCode && !finallyCode)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const node = new Try();
        this._blockNode(node);
        this.code(tryBody);
        if (catchCode) {
          const error = this.name("e");
          this._currNode = node.catch = new Catch(error);
          catchCode(error);
        }
        if (finallyCode) {
          this._currNode = node.finally = new Finally();
          this.code(finallyCode);
        }
        return this._endBlockNode(Catch, Finally);
      }
      // `throw` statement
      throw(error) {
        return this._leafNode(new Throw(error));
      }
      // start self-balancing block
      block(body, nodeCount) {
        this._blockStarts.push(this._nodes.length);
        if (body)
          this.code(body).endBlock(nodeCount);
        return this;
      }
      // end the current self-balancing block
      endBlock(nodeCount) {
        const len = this._blockStarts.pop();
        if (len === void 0)
          throw new Error("CodeGen: not in self-balancing block");
        const toClose = this._nodes.length - len;
        if (toClose < 0 || nodeCount !== void 0 && toClose !== nodeCount) {
          throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`);
        }
        this._nodes.length = len;
        return this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(name, args = code_1.nil, async, funcBody) {
        this._blockNode(new Func(name, args, async));
        if (funcBody)
          this.code(funcBody).endFunc();
        return this;
      }
      // end function definition
      endFunc() {
        return this._endBlockNode(Func);
      }
      optimize(n = 1) {
        while (n-- > 0) {
          this._root.optimizeNodes();
          this._root.optimizeNames(this._root.names, this._constants);
        }
      }
      _leafNode(node) {
        this._currNode.nodes.push(node);
        return this;
      }
      _blockNode(node) {
        this._currNode.nodes.push(node);
        this._nodes.push(node);
      }
      _endBlockNode(N1, N2) {
        const n = this._currNode;
        if (n instanceof N1 || N2 && n instanceof N2) {
          this._nodes.pop();
          return this;
        }
        throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`);
      }
      _elseNode(node) {
        const n = this._currNode;
        if (!(n instanceof If)) {
          throw new Error('CodeGen: "else" without "if"');
        }
        this._currNode = n.else = node;
        return this;
      }
      get _root() {
        return this._nodes[0];
      }
      get _currNode() {
        const ns = this._nodes;
        return ns[ns.length - 1];
      }
      set _currNode(node) {
        const ns = this._nodes;
        ns[ns.length - 1] = node;
      }
    };
    exports.CodeGen = CodeGen;
    function addNames(names, from) {
      for (const n in from)
        names[n] = (names[n] || 0) + (from[n] || 0);
      return names;
    }
    __name(addNames, "addNames");
    function addExprNames(names, from) {
      return from instanceof code_1._CodeOrName ? addNames(names, from.names) : names;
    }
    __name(addExprNames, "addExprNames");
    function optimizeExpr(expr, names, constants) {
      if (expr instanceof code_1.Name)
        return replaceName(expr);
      if (!canOptimize(expr))
        return expr;
      return new code_1._Code(expr._items.reduce((items, c) => {
        if (c instanceof code_1.Name)
          c = replaceName(c);
        if (c instanceof code_1._Code)
          items.push(...c._items);
        else
          items.push(c);
        return items;
      }, []));
      function replaceName(n) {
        const c = constants[n.str];
        if (c === void 0 || names[n.str] !== 1)
          return n;
        delete names[n.str];
        return c;
      }
      __name(replaceName, "replaceName");
      function canOptimize(e) {
        return e instanceof code_1._Code && e._items.some((c) => c instanceof code_1.Name && names[c.str] === 1 && constants[c.str] !== void 0);
      }
      __name(canOptimize, "canOptimize");
    }
    __name(optimizeExpr, "optimizeExpr");
    function subtractNames(names, from) {
      for (const n in from)
        names[n] = (names[n] || 0) - (from[n] || 0);
    }
    __name(subtractNames, "subtractNames");
    function not(x) {
      return typeof x == "boolean" || typeof x == "number" || x === null ? !x : (0, code_1._)`!${par(x)}`;
    }
    __name(not, "not");
    exports.not = not;
    var andCode = mappend(exports.operators.AND);
    function and(...args) {
      return args.reduce(andCode);
    }
    __name(and, "and");
    exports.and = and;
    var orCode = mappend(exports.operators.OR);
    function or(...args) {
      return args.reduce(orCode);
    }
    __name(or, "or");
    exports.or = or;
    function mappend(op) {
      return (x, y) => x === code_1.nil ? y : y === code_1.nil ? x : (0, code_1._)`${par(x)} ${op} ${par(y)}`;
    }
    __name(mappend, "mappend");
    function par(x) {
      return x instanceof code_1.Name ? x : (0, code_1._)`(${x})`;
    }
    __name(par, "par");
  }
});

// node_modules/ajv/dist/compile/util.js
var require_util = __commonJS({
  "node_modules/ajv/dist/compile/util.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.checkStrictMode = exports.getErrorPath = exports.Type = exports.useFunc = exports.setEvaluated = exports.evaluatedPropsToName = exports.mergeEvaluated = exports.eachItem = exports.unescapeJsonPointer = exports.escapeJsonPointer = exports.escapeFragment = exports.unescapeFragment = exports.schemaRefOrVal = exports.schemaHasRulesButRef = exports.schemaHasRules = exports.checkUnknownRules = exports.alwaysValidSchema = exports.toHash = void 0;
    var codegen_1 = require_codegen();
    var code_1 = require_code();
    function toHash(arr) {
      const hash = {};
      for (const item of arr)
        hash[item] = true;
      return hash;
    }
    __name(toHash, "toHash");
    exports.toHash = toHash;
    function alwaysValidSchema(it, schema) {
      if (typeof schema == "boolean")
        return schema;
      if (Object.keys(schema).length === 0)
        return true;
      checkUnknownRules(it, schema);
      return !schemaHasRules(schema, it.self.RULES.all);
    }
    __name(alwaysValidSchema, "alwaysValidSchema");
    exports.alwaysValidSchema = alwaysValidSchema;
    function checkUnknownRules(it, schema = it.schema) {
      const { opts, self } = it;
      if (!opts.strictSchema)
        return;
      if (typeof schema === "boolean")
        return;
      const rules = self.RULES.keywords;
      for (const key in schema) {
        if (!rules[key])
          checkStrictMode(it, `unknown keyword: "${key}"`);
      }
    }
    __name(checkUnknownRules, "checkUnknownRules");
    exports.checkUnknownRules = checkUnknownRules;
    function schemaHasRules(schema, rules) {
      if (typeof schema == "boolean")
        return !schema;
      for (const key in schema)
        if (rules[key])
          return true;
      return false;
    }
    __name(schemaHasRules, "schemaHasRules");
    exports.schemaHasRules = schemaHasRules;
    function schemaHasRulesButRef(schema, RULES) {
      if (typeof schema == "boolean")
        return !schema;
      for (const key in schema)
        if (key !== "$ref" && RULES.all[key])
          return true;
      return false;
    }
    __name(schemaHasRulesButRef, "schemaHasRulesButRef");
    exports.schemaHasRulesButRef = schemaHasRulesButRef;
    function schemaRefOrVal({ topSchemaRef, schemaPath }, schema, keyword, $data) {
      if (!$data) {
        if (typeof schema == "number" || typeof schema == "boolean")
          return schema;
        if (typeof schema == "string")
          return (0, codegen_1._)`${schema}`;
      }
      return (0, codegen_1._)`${topSchemaRef}${schemaPath}${(0, codegen_1.getProperty)(keyword)}`;
    }
    __name(schemaRefOrVal, "schemaRefOrVal");
    exports.schemaRefOrVal = schemaRefOrVal;
    function unescapeFragment(str) {
      return unescapeJsonPointer(decodeURIComponent(str));
    }
    __name(unescapeFragment, "unescapeFragment");
    exports.unescapeFragment = unescapeFragment;
    function escapeFragment(str) {
      return encodeURIComponent(escapeJsonPointer(str));
    }
    __name(escapeFragment, "escapeFragment");
    exports.escapeFragment = escapeFragment;
    function escapeJsonPointer(str) {
      if (typeof str == "number")
        return `${str}`;
      return str.replace(/~/g, "~0").replace(/\//g, "~1");
    }
    __name(escapeJsonPointer, "escapeJsonPointer");
    exports.escapeJsonPointer = escapeJsonPointer;
    function unescapeJsonPointer(str) {
      return str.replace(/~1/g, "/").replace(/~0/g, "~");
    }
    __name(unescapeJsonPointer, "unescapeJsonPointer");
    exports.unescapeJsonPointer = unescapeJsonPointer;
    function eachItem(xs, f) {
      if (Array.isArray(xs)) {
        for (const x of xs)
          f(x);
      } else {
        f(xs);
      }
    }
    __name(eachItem, "eachItem");
    exports.eachItem = eachItem;
    function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues: mergeValues2, resultToName }) {
      return (gen, from, to, toName) => {
        const res = to === void 0 ? from : to instanceof codegen_1.Name ? (from instanceof codegen_1.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to) : from instanceof codegen_1.Name ? (mergeToName(gen, to, from), from) : mergeValues2(from, to);
        return toName === codegen_1.Name && !(res instanceof codegen_1.Name) ? resultToName(gen, res) : res;
      };
    }
    __name(makeMergeEvaluated, "makeMergeEvaluated");
    exports.mergeEvaluated = {
      props: makeMergeEvaluated({
        mergeNames: /* @__PURE__ */ __name((gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => {
          gen.if((0, codegen_1._)`${from} === true`, () => gen.assign(to, true), () => gen.assign(to, (0, codegen_1._)`${to} || {}`).code((0, codegen_1._)`Object.assign(${to}, ${from})`));
        }), "mergeNames"),
        mergeToName: /* @__PURE__ */ __name((gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => {
          if (from === true) {
            gen.assign(to, true);
          } else {
            gen.assign(to, (0, codegen_1._)`${to} || {}`);
            setEvaluated(gen, to, from);
          }
        }), "mergeToName"),
        mergeValues: /* @__PURE__ */ __name((from, to) => from === true ? true : { ...from, ...to }, "mergeValues"),
        resultToName: evaluatedPropsToName
      }),
      items: makeMergeEvaluated({
        mergeNames: /* @__PURE__ */ __name((gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => gen.assign(to, (0, codegen_1._)`${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)), "mergeNames"),
        mergeToName: /* @__PURE__ */ __name((gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => gen.assign(to, from === true ? true : (0, codegen_1._)`${to} > ${from} ? ${to} : ${from}`)), "mergeToName"),
        mergeValues: /* @__PURE__ */ __name((from, to) => from === true ? true : Math.max(from, to), "mergeValues"),
        resultToName: /* @__PURE__ */ __name((gen, items) => gen.var("items", items), "resultToName")
      })
    };
    function evaluatedPropsToName(gen, ps) {
      if (ps === true)
        return gen.var("props", true);
      const props = gen.var("props", (0, codegen_1._)`{}`);
      if (ps !== void 0)
        setEvaluated(gen, props, ps);
      return props;
    }
    __name(evaluatedPropsToName, "evaluatedPropsToName");
    exports.evaluatedPropsToName = evaluatedPropsToName;
    function setEvaluated(gen, props, ps) {
      Object.keys(ps).forEach((p) => gen.assign((0, codegen_1._)`${props}${(0, codegen_1.getProperty)(p)}`, true));
    }
    __name(setEvaluated, "setEvaluated");
    exports.setEvaluated = setEvaluated;
    var snippets = {};
    function useFunc(gen, f) {
      return gen.scopeValue("func", {
        ref: f,
        code: snippets[f.code] || (snippets[f.code] = new code_1._Code(f.code))
      });
    }
    __name(useFunc, "useFunc");
    exports.useFunc = useFunc;
    var Type;
    (function(Type2) {
      Type2[Type2["Num"] = 0] = "Num";
      Type2[Type2["Str"] = 1] = "Str";
    })(Type || (exports.Type = Type = {}));
    function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
      if (dataProp instanceof codegen_1.Name) {
        const isNumber = dataPropType === Type.Num;
        return jsPropertySyntax ? isNumber ? (0, codegen_1._)`"[" + ${dataProp} + "]"` : (0, codegen_1._)`"['" + ${dataProp} + "']"` : isNumber ? (0, codegen_1._)`"/" + ${dataProp}` : (0, codegen_1._)`"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
      }
      return jsPropertySyntax ? (0, codegen_1.getProperty)(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
    }
    __name(getErrorPath, "getErrorPath");
    exports.getErrorPath = getErrorPath;
    function checkStrictMode(it, msg, mode = it.opts.strictSchema) {
      if (!mode)
        return;
      msg = `strict mode: ${msg}`;
      if (mode === true)
        throw new Error(msg);
      it.self.logger.warn(msg);
    }
    __name(checkStrictMode, "checkStrictMode");
    exports.checkStrictMode = checkStrictMode;
  }
});

// node_modules/ajv/dist/compile/names.js
var require_names = __commonJS({
  "node_modules/ajv/dist/compile/names.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var names = {
      // validation function arguments
      data: new codegen_1.Name("data"),
      // data passed to validation function
      // args passed from referencing schema
      valCxt: new codegen_1.Name("valCxt"),
      // validation/data context - should not be used directly, it is destructured to the names below
      instancePath: new codegen_1.Name("instancePath"),
      parentData: new codegen_1.Name("parentData"),
      parentDataProperty: new codegen_1.Name("parentDataProperty"),
      rootData: new codegen_1.Name("rootData"),
      // root data - same as the data passed to the first/top validation function
      dynamicAnchors: new codegen_1.Name("dynamicAnchors"),
      // used to support recursiveRef and dynamicRef
      // function scoped variables
      vErrors: new codegen_1.Name("vErrors"),
      // null or array of validation errors
      errors: new codegen_1.Name("errors"),
      // counter of validation errors
      this: new codegen_1.Name("this"),
      // "globals"
      self: new codegen_1.Name("self"),
      scope: new codegen_1.Name("scope"),
      // JTD serialize/parse name for JSON string and position
      json: new codegen_1.Name("json"),
      jsonPos: new codegen_1.Name("jsonPos"),
      jsonLen: new codegen_1.Name("jsonLen"),
      jsonPart: new codegen_1.Name("jsonPart")
    };
    exports.default = names;
  }
});

// node_modules/ajv/dist/compile/errors.js
var require_errors = __commonJS({
  "node_modules/ajv/dist/compile/errors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extendErrors = exports.resetErrorsCount = exports.reportExtraError = exports.reportError = exports.keyword$DataError = exports.keywordError = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var names_1 = require_names();
    exports.keywordError = {
      message: /* @__PURE__ */ __name(({ keyword }) => (0, codegen_1.str)`must pass "${keyword}" keyword validation`, "message")
    };
    exports.keyword$DataError = {
      message: /* @__PURE__ */ __name(({ keyword, schemaType }) => schemaType ? (0, codegen_1.str)`"${keyword}" keyword must be ${schemaType} ($data)` : (0, codegen_1.str)`"${keyword}" keyword is invalid ($data)`, "message")
    };
    function reportError(cxt, error = exports.keywordError, errorPaths, overrideAllErrors) {
      const { it } = cxt;
      const { gen, compositeRule, allErrors } = it;
      const errObj = errorObjectCode(cxt, error, errorPaths);
      if (overrideAllErrors !== null && overrideAllErrors !== void 0 ? overrideAllErrors : compositeRule || allErrors) {
        addError(gen, errObj);
      } else {
        returnErrors(it, (0, codegen_1._)`[${errObj}]`);
      }
    }
    __name(reportError, "reportError");
    exports.reportError = reportError;
    function reportExtraError(cxt, error = exports.keywordError, errorPaths) {
      const { it } = cxt;
      const { gen, compositeRule, allErrors } = it;
      const errObj = errorObjectCode(cxt, error, errorPaths);
      addError(gen, errObj);
      if (!(compositeRule || allErrors)) {
        returnErrors(it, names_1.default.vErrors);
      }
    }
    __name(reportExtraError, "reportExtraError");
    exports.reportExtraError = reportExtraError;
    function resetErrorsCount(gen, errsCount) {
      gen.assign(names_1.default.errors, errsCount);
      gen.if((0, codegen_1._)`${names_1.default.vErrors} !== null`, () => gen.if(errsCount, () => gen.assign((0, codegen_1._)`${names_1.default.vErrors}.length`, errsCount), () => gen.assign(names_1.default.vErrors, null)));
    }
    __name(resetErrorsCount, "resetErrorsCount");
    exports.resetErrorsCount = resetErrorsCount;
    function extendErrors({ gen, keyword, schemaValue, data, errsCount, it }) {
      if (errsCount === void 0)
        throw new Error("ajv implementation error");
      const err = gen.name("err");
      gen.forRange("i", errsCount, names_1.default.errors, (i) => {
        gen.const(err, (0, codegen_1._)`${names_1.default.vErrors}[${i}]`);
        gen.if((0, codegen_1._)`${err}.instancePath === undefined`, () => gen.assign((0, codegen_1._)`${err}.instancePath`, (0, codegen_1.strConcat)(names_1.default.instancePath, it.errorPath)));
        gen.assign((0, codegen_1._)`${err}.schemaPath`, (0, codegen_1.str)`${it.errSchemaPath}/${keyword}`);
        if (it.opts.verbose) {
          gen.assign((0, codegen_1._)`${err}.schema`, schemaValue);
          gen.assign((0, codegen_1._)`${err}.data`, data);
        }
      });
    }
    __name(extendErrors, "extendErrors");
    exports.extendErrors = extendErrors;
    function addError(gen, errObj) {
      const err = gen.const("err", errObj);
      gen.if((0, codegen_1._)`${names_1.default.vErrors} === null`, () => gen.assign(names_1.default.vErrors, (0, codegen_1._)`[${err}]`), (0, codegen_1._)`${names_1.default.vErrors}.push(${err})`);
      gen.code((0, codegen_1._)`${names_1.default.errors}++`);
    }
    __name(addError, "addError");
    function returnErrors(it, errs) {
      const { gen, validateName, schemaEnv } = it;
      if (schemaEnv.$async) {
        gen.throw((0, codegen_1._)`new ${it.ValidationError}(${errs})`);
      } else {
        gen.assign((0, codegen_1._)`${validateName}.errors`, errs);
        gen.return(false);
      }
    }
    __name(returnErrors, "returnErrors");
    var E = {
      keyword: new codegen_1.Name("keyword"),
      schemaPath: new codegen_1.Name("schemaPath"),
      // also used in JTD errors
      params: new codegen_1.Name("params"),
      propertyName: new codegen_1.Name("propertyName"),
      message: new codegen_1.Name("message"),
      schema: new codegen_1.Name("schema"),
      parentSchema: new codegen_1.Name("parentSchema")
    };
    function errorObjectCode(cxt, error, errorPaths) {
      const { createErrors } = cxt.it;
      if (createErrors === false)
        return (0, codegen_1._)`{}`;
      return errorObject(cxt, error, errorPaths);
    }
    __name(errorObjectCode, "errorObjectCode");
    function errorObject(cxt, error, errorPaths = {}) {
      const { gen, it } = cxt;
      const keyValues = [
        errorInstancePath(it, errorPaths),
        errorSchemaPath(cxt, errorPaths)
      ];
      extraErrorProps(cxt, error, keyValues);
      return gen.object(...keyValues);
    }
    __name(errorObject, "errorObject");
    function errorInstancePath({ errorPath }, { instancePath }) {
      const instPath = instancePath ? (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(instancePath, util_1.Type.Str)}` : errorPath;
      return [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, instPath)];
    }
    __name(errorInstancePath, "errorInstancePath");
    function errorSchemaPath({ keyword, it: { errSchemaPath } }, { schemaPath, parentSchema }) {
      let schPath = parentSchema ? errSchemaPath : (0, codegen_1.str)`${errSchemaPath}/${keyword}`;
      if (schemaPath) {
        schPath = (0, codegen_1.str)`${schPath}${(0, util_1.getErrorPath)(schemaPath, util_1.Type.Str)}`;
      }
      return [E.schemaPath, schPath];
    }
    __name(errorSchemaPath, "errorSchemaPath");
    function extraErrorProps(cxt, { params, message }, keyValues) {
      const { keyword, data, schemaValue, it } = cxt;
      const { opts, propertyName, topSchemaRef, schemaPath } = it;
      keyValues.push([E.keyword, keyword], [E.params, typeof params == "function" ? params(cxt) : params || (0, codegen_1._)`{}`]);
      if (opts.messages) {
        keyValues.push([E.message, typeof message == "function" ? message(cxt) : message]);
      }
      if (opts.verbose) {
        keyValues.push([E.schema, schemaValue], [E.parentSchema, (0, codegen_1._)`${topSchemaRef}${schemaPath}`], [names_1.default.data, data]);
      }
      if (propertyName)
        keyValues.push([E.propertyName, propertyName]);
    }
    __name(extraErrorProps, "extraErrorProps");
  }
});

// node_modules/ajv/dist/compile/validate/boolSchema.js
var require_boolSchema = __commonJS({
  "node_modules/ajv/dist/compile/validate/boolSchema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.boolOrEmptySchema = exports.topBoolOrEmptySchema = void 0;
    var errors_1 = require_errors();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var boolError = {
      message: "boolean schema is false"
    };
    function topBoolOrEmptySchema(it) {
      const { gen, schema, validateName } = it;
      if (schema === false) {
        falseSchemaError(it, false);
      } else if (typeof schema == "object" && schema.$async === true) {
        gen.return(names_1.default.data);
      } else {
        gen.assign((0, codegen_1._)`${validateName}.errors`, null);
        gen.return(true);
      }
    }
    __name(topBoolOrEmptySchema, "topBoolOrEmptySchema");
    exports.topBoolOrEmptySchema = topBoolOrEmptySchema;
    function boolOrEmptySchema(it, valid) {
      const { gen, schema } = it;
      if (schema === false) {
        gen.var(valid, false);
        falseSchemaError(it);
      } else {
        gen.var(valid, true);
      }
    }
    __name(boolOrEmptySchema, "boolOrEmptySchema");
    exports.boolOrEmptySchema = boolOrEmptySchema;
    function falseSchemaError(it, overrideAllErrors) {
      const { gen, data } = it;
      const cxt = {
        gen,
        keyword: "false schema",
        data,
        schema: false,
        schemaCode: false,
        schemaValue: false,
        params: {},
        it
      };
      (0, errors_1.reportError)(cxt, boolError, void 0, overrideAllErrors);
    }
    __name(falseSchemaError, "falseSchemaError");
  }
});

// node_modules/ajv/dist/compile/rules.js
var require_rules = __commonJS({
  "node_modules/ajv/dist/compile/rules.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getRules = exports.isJSONType = void 0;
    var _jsonTypes = ["string", "number", "integer", "boolean", "null", "object", "array"];
    var jsonTypes = new Set(_jsonTypes);
    function isJSONType(x) {
      return typeof x == "string" && jsonTypes.has(x);
    }
    __name(isJSONType, "isJSONType");
    exports.isJSONType = isJSONType;
    function getRules() {
      const groups = {
        number: { type: "number", rules: [] },
        string: { type: "string", rules: [] },
        array: { type: "array", rules: [] },
        object: { type: "object", rules: [] }
      };
      return {
        types: { ...groups, integer: true, boolean: true, null: true },
        rules: [{ rules: [] }, groups.number, groups.string, groups.array, groups.object],
        post: { rules: [] },
        all: {},
        keywords: {}
      };
    }
    __name(getRules, "getRules");
    exports.getRules = getRules;
  }
});

// node_modules/ajv/dist/compile/validate/applicability.js
var require_applicability = __commonJS({
  "node_modules/ajv/dist/compile/validate/applicability.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.shouldUseRule = exports.shouldUseGroup = exports.schemaHasRulesForType = void 0;
    function schemaHasRulesForType({ schema, self }, type) {
      const group = self.RULES.types[type];
      return group && group !== true && shouldUseGroup(schema, group);
    }
    __name(schemaHasRulesForType, "schemaHasRulesForType");
    exports.schemaHasRulesForType = schemaHasRulesForType;
    function shouldUseGroup(schema, group) {
      return group.rules.some((rule) => shouldUseRule(schema, rule));
    }
    __name(shouldUseGroup, "shouldUseGroup");
    exports.shouldUseGroup = shouldUseGroup;
    function shouldUseRule(schema, rule) {
      var _a;
      return schema[rule.keyword] !== void 0 || ((_a = rule.definition.implements) === null || _a === void 0 ? void 0 : _a.some((kwd) => schema[kwd] !== void 0));
    }
    __name(shouldUseRule, "shouldUseRule");
    exports.shouldUseRule = shouldUseRule;
  }
});

// node_modules/ajv/dist/compile/validate/dataType.js
var require_dataType = __commonJS({
  "node_modules/ajv/dist/compile/validate/dataType.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reportTypeError = exports.checkDataTypes = exports.checkDataType = exports.coerceAndCheckDataType = exports.getJSONTypes = exports.getSchemaTypes = exports.DataType = void 0;
    var rules_1 = require_rules();
    var applicability_1 = require_applicability();
    var errors_1 = require_errors();
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var DataType;
    (function(DataType2) {
      DataType2[DataType2["Correct"] = 0] = "Correct";
      DataType2[DataType2["Wrong"] = 1] = "Wrong";
    })(DataType || (exports.DataType = DataType = {}));
    function getSchemaTypes(schema) {
      const types2 = getJSONTypes(schema.type);
      const hasNull = types2.includes("null");
      if (hasNull) {
        if (schema.nullable === false)
          throw new Error("type: null contradicts nullable: false");
      } else {
        if (!types2.length && schema.nullable !== void 0) {
          throw new Error('"nullable" cannot be used without "type"');
        }
        if (schema.nullable === true)
          types2.push("null");
      }
      return types2;
    }
    __name(getSchemaTypes, "getSchemaTypes");
    exports.getSchemaTypes = getSchemaTypes;
    function getJSONTypes(ts) {
      const types2 = Array.isArray(ts) ? ts : ts ? [ts] : [];
      if (types2.every(rules_1.isJSONType))
        return types2;
      throw new Error("type must be JSONType or JSONType[]: " + types2.join(","));
    }
    __name(getJSONTypes, "getJSONTypes");
    exports.getJSONTypes = getJSONTypes;
    function coerceAndCheckDataType(it, types2) {
      const { gen, data, opts } = it;
      const coerceTo = coerceToTypes(types2, opts.coerceTypes);
      const checkTypes = types2.length > 0 && !(coerceTo.length === 0 && types2.length === 1 && (0, applicability_1.schemaHasRulesForType)(it, types2[0]));
      if (checkTypes) {
        const wrongType = checkDataTypes(types2, data, opts.strictNumbers, DataType.Wrong);
        gen.if(wrongType, () => {
          if (coerceTo.length)
            coerceData(it, types2, coerceTo);
          else
            reportTypeError(it);
        });
      }
      return checkTypes;
    }
    __name(coerceAndCheckDataType, "coerceAndCheckDataType");
    exports.coerceAndCheckDataType = coerceAndCheckDataType;
    var COERCIBLE = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
    function coerceToTypes(types2, coerceTypes) {
      return coerceTypes ? types2.filter((t) => COERCIBLE.has(t) || coerceTypes === "array" && t === "array") : [];
    }
    __name(coerceToTypes, "coerceToTypes");
    function coerceData(it, types2, coerceTo) {
      const { gen, data, opts } = it;
      const dataType = gen.let("dataType", (0, codegen_1._)`typeof ${data}`);
      const coerced = gen.let("coerced", (0, codegen_1._)`undefined`);
      if (opts.coerceTypes === "array") {
        gen.if((0, codegen_1._)`${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () => gen.assign(data, (0, codegen_1._)`${data}[0]`).assign(dataType, (0, codegen_1._)`typeof ${data}`).if(checkDataTypes(types2, data, opts.strictNumbers), () => gen.assign(coerced, data)));
      }
      gen.if((0, codegen_1._)`${coerced} !== undefined`);
      for (const t of coerceTo) {
        if (COERCIBLE.has(t) || t === "array" && opts.coerceTypes === "array") {
          coerceSpecificType(t);
        }
      }
      gen.else();
      reportTypeError(it);
      gen.endIf();
      gen.if((0, codegen_1._)`${coerced} !== undefined`, () => {
        gen.assign(data, coerced);
        assignParentData(it, coerced);
      });
      function coerceSpecificType(t) {
        switch (t) {
          case "string":
            gen.elseIf((0, codegen_1._)`${dataType} == "number" || ${dataType} == "boolean"`).assign(coerced, (0, codegen_1._)`"" + ${data}`).elseIf((0, codegen_1._)`${data} === null`).assign(coerced, (0, codegen_1._)`""`);
            return;
          case "number":
            gen.elseIf((0, codegen_1._)`${dataType} == "boolean" || ${data} === null
              || (${dataType} == "string" && ${data} && ${data} == +${data})`).assign(coerced, (0, codegen_1._)`+${data}`);
            return;
          case "integer":
            gen.elseIf((0, codegen_1._)`${dataType} === "boolean" || ${data} === null
              || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`).assign(coerced, (0, codegen_1._)`+${data}`);
            return;
          case "boolean":
            gen.elseIf((0, codegen_1._)`${data} === "false" || ${data} === 0 || ${data} === null`).assign(coerced, false).elseIf((0, codegen_1._)`${data} === "true" || ${data} === 1`).assign(coerced, true);
            return;
          case "null":
            gen.elseIf((0, codegen_1._)`${data} === "" || ${data} === 0 || ${data} === false`);
            gen.assign(coerced, null);
            return;
          case "array":
            gen.elseIf((0, codegen_1._)`${dataType} === "string" || ${dataType} === "number"
              || ${dataType} === "boolean" || ${data} === null`).assign(coerced, (0, codegen_1._)`[${data}]`);
        }
      }
      __name(coerceSpecificType, "coerceSpecificType");
    }
    __name(coerceData, "coerceData");
    function assignParentData({ gen, parentData, parentDataProperty }, expr) {
      gen.if((0, codegen_1._)`${parentData} !== undefined`, () => gen.assign((0, codegen_1._)`${parentData}[${parentDataProperty}]`, expr));
    }
    __name(assignParentData, "assignParentData");
    function checkDataType(dataType, data, strictNums, correct = DataType.Correct) {
      const EQ = correct === DataType.Correct ? codegen_1.operators.EQ : codegen_1.operators.NEQ;
      let cond;
      switch (dataType) {
        case "null":
          return (0, codegen_1._)`${data} ${EQ} null`;
        case "array":
          cond = (0, codegen_1._)`Array.isArray(${data})`;
          break;
        case "object":
          cond = (0, codegen_1._)`${data} && typeof ${data} == "object" && !Array.isArray(${data})`;
          break;
        case "integer":
          cond = numCond((0, codegen_1._)`!(${data} % 1) && !isNaN(${data})`);
          break;
        case "number":
          cond = numCond();
          break;
        default:
          return (0, codegen_1._)`typeof ${data} ${EQ} ${dataType}`;
      }
      return correct === DataType.Correct ? cond : (0, codegen_1.not)(cond);
      function numCond(_cond = codegen_1.nil) {
        return (0, codegen_1.and)((0, codegen_1._)`typeof ${data} == "number"`, _cond, strictNums ? (0, codegen_1._)`isFinite(${data})` : codegen_1.nil);
      }
      __name(numCond, "numCond");
    }
    __name(checkDataType, "checkDataType");
    exports.checkDataType = checkDataType;
    function checkDataTypes(dataTypes, data, strictNums, correct) {
      if (dataTypes.length === 1) {
        return checkDataType(dataTypes[0], data, strictNums, correct);
      }
      let cond;
      const types2 = (0, util_1.toHash)(dataTypes);
      if (types2.array && types2.object) {
        const notObj = (0, codegen_1._)`typeof ${data} != "object"`;
        cond = types2.null ? notObj : (0, codegen_1._)`!${data} || ${notObj}`;
        delete types2.null;
        delete types2.array;
        delete types2.object;
      } else {
        cond = codegen_1.nil;
      }
      if (types2.number)
        delete types2.integer;
      for (const t in types2)
        cond = (0, codegen_1.and)(cond, checkDataType(t, data, strictNums, correct));
      return cond;
    }
    __name(checkDataTypes, "checkDataTypes");
    exports.checkDataTypes = checkDataTypes;
    var typeError = {
      message: /* @__PURE__ */ __name(({ schema }) => `must be ${schema}`, "message"),
      params: /* @__PURE__ */ __name(({ schema, schemaValue }) => typeof schema == "string" ? (0, codegen_1._)`{type: ${schema}}` : (0, codegen_1._)`{type: ${schemaValue}}`, "params")
    };
    function reportTypeError(it) {
      const cxt = getTypeErrorContext(it);
      (0, errors_1.reportError)(cxt, typeError);
    }
    __name(reportTypeError, "reportTypeError");
    exports.reportTypeError = reportTypeError;
    function getTypeErrorContext(it) {
      const { gen, data, schema } = it;
      const schemaCode = (0, util_1.schemaRefOrVal)(it, schema, "type");
      return {
        gen,
        keyword: "type",
        data,
        schema: schema.type,
        schemaCode,
        schemaValue: schemaCode,
        parentSchema: schema,
        params: {},
        it
      };
    }
    __name(getTypeErrorContext, "getTypeErrorContext");
  }
});

// node_modules/ajv/dist/compile/validate/defaults.js
var require_defaults = __commonJS({
  "node_modules/ajv/dist/compile/validate/defaults.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assignDefaults = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    function assignDefaults(it, ty) {
      const { properties, items } = it.schema;
      if (ty === "object" && properties) {
        for (const key in properties) {
          assignDefault(it, key, properties[key].default);
        }
      } else if (ty === "array" && Array.isArray(items)) {
        items.forEach((sch, i) => assignDefault(it, i, sch.default));
      }
    }
    __name(assignDefaults, "assignDefaults");
    exports.assignDefaults = assignDefaults;
    function assignDefault(it, prop, defaultValue) {
      const { gen, compositeRule, data, opts } = it;
      if (defaultValue === void 0)
        return;
      const childData = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(prop)}`;
      if (compositeRule) {
        (0, util_1.checkStrictMode)(it, `default is ignored for: ${childData}`);
        return;
      }
      let condition = (0, codegen_1._)`${childData} === undefined`;
      if (opts.useDefaults === "empty") {
        condition = (0, codegen_1._)`${condition} || ${childData} === null || ${childData} === ""`;
      }
      gen.if(condition, (0, codegen_1._)`${childData} = ${(0, codegen_1.stringify)(defaultValue)}`);
    }
    __name(assignDefault, "assignDefault");
  }
});

// node_modules/ajv/dist/vocabularies/code.js
var require_code2 = __commonJS({
  "node_modules/ajv/dist/vocabularies/code.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateUnion = exports.validateArray = exports.usePattern = exports.callValidateCode = exports.schemaProperties = exports.allSchemaProperties = exports.noPropertyInData = exports.propertyInData = exports.isOwnProperty = exports.hasPropFunc = exports.reportMissingProp = exports.checkMissingProp = exports.checkReportMissingProp = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var names_1 = require_names();
    var util_2 = require_util();
    function checkReportMissingProp(cxt, prop) {
      const { gen, data, it } = cxt;
      gen.if(noPropertyInData(gen, data, prop, it.opts.ownProperties), () => {
        cxt.setParams({ missingProperty: (0, codegen_1._)`${prop}` }, true);
        cxt.error();
      });
    }
    __name(checkReportMissingProp, "checkReportMissingProp");
    exports.checkReportMissingProp = checkReportMissingProp;
    function checkMissingProp({ gen, data, it: { opts } }, properties, missing) {
      return (0, codegen_1.or)(...properties.map((prop) => (0, codegen_1.and)(noPropertyInData(gen, data, prop, opts.ownProperties), (0, codegen_1._)`${missing} = ${prop}`)));
    }
    __name(checkMissingProp, "checkMissingProp");
    exports.checkMissingProp = checkMissingProp;
    function reportMissingProp(cxt, missing) {
      cxt.setParams({ missingProperty: missing }, true);
      cxt.error();
    }
    __name(reportMissingProp, "reportMissingProp");
    exports.reportMissingProp = reportMissingProp;
    function hasPropFunc(gen) {
      return gen.scopeValue("func", {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        ref: Object.prototype.hasOwnProperty,
        code: (0, codegen_1._)`Object.prototype.hasOwnProperty`
      });
    }
    __name(hasPropFunc, "hasPropFunc");
    exports.hasPropFunc = hasPropFunc;
    function isOwnProperty(gen, data, property) {
      return (0, codegen_1._)`${hasPropFunc(gen)}.call(${data}, ${property})`;
    }
    __name(isOwnProperty, "isOwnProperty");
    exports.isOwnProperty = isOwnProperty;
    function propertyInData(gen, data, property, ownProperties) {
      const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} !== undefined`;
      return ownProperties ? (0, codegen_1._)`${cond} && ${isOwnProperty(gen, data, property)}` : cond;
    }
    __name(propertyInData, "propertyInData");
    exports.propertyInData = propertyInData;
    function noPropertyInData(gen, data, property, ownProperties) {
      const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} === undefined`;
      return ownProperties ? (0, codegen_1.or)(cond, (0, codegen_1.not)(isOwnProperty(gen, data, property))) : cond;
    }
    __name(noPropertyInData, "noPropertyInData");
    exports.noPropertyInData = noPropertyInData;
    function allSchemaProperties(schemaMap) {
      return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
    }
    __name(allSchemaProperties, "allSchemaProperties");
    exports.allSchemaProperties = allSchemaProperties;
    function schemaProperties(it, schemaMap) {
      return allSchemaProperties(schemaMap).filter((p) => !(0, util_1.alwaysValidSchema)(it, schemaMap[p]));
    }
    __name(schemaProperties, "schemaProperties");
    exports.schemaProperties = schemaProperties;
    function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
      const dataAndSchema = passSchema ? (0, codegen_1._)`${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data;
      const valCxt = [
        [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, errorPath)],
        [names_1.default.parentData, it.parentData],
        [names_1.default.parentDataProperty, it.parentDataProperty],
        [names_1.default.rootData, names_1.default.rootData]
      ];
      if (it.opts.dynamicRef)
        valCxt.push([names_1.default.dynamicAnchors, names_1.default.dynamicAnchors]);
      const args = (0, codegen_1._)`${dataAndSchema}, ${gen.object(...valCxt)}`;
      return context !== codegen_1.nil ? (0, codegen_1._)`${func}.call(${context}, ${args})` : (0, codegen_1._)`${func}(${args})`;
    }
    __name(callValidateCode, "callValidateCode");
    exports.callValidateCode = callValidateCode;
    var newRegExp = (0, codegen_1._)`new RegExp`;
    function usePattern({ gen, it: { opts } }, pattern) {
      const u = opts.unicodeRegExp ? "u" : "";
      const { regExp } = opts.code;
      const rx = regExp(pattern, u);
      return gen.scopeValue("pattern", {
        key: rx.toString(),
        ref: rx,
        code: (0, codegen_1._)`${regExp.code === "new RegExp" ? newRegExp : (0, util_2.useFunc)(gen, regExp)}(${pattern}, ${u})`
      });
    }
    __name(usePattern, "usePattern");
    exports.usePattern = usePattern;
    function validateArray(cxt) {
      const { gen, data, keyword, it } = cxt;
      const valid = gen.name("valid");
      if (it.allErrors) {
        const validArr = gen.let("valid", true);
        validateItems(() => gen.assign(validArr, false));
        return validArr;
      }
      gen.var(valid, true);
      validateItems(() => gen.break());
      return valid;
      function validateItems(notValid) {
        const len = gen.const("len", (0, codegen_1._)`${data}.length`);
        gen.forRange("i", 0, len, (i) => {
          cxt.subschema({
            keyword,
            dataProp: i,
            dataPropType: util_1.Type.Num
          }, valid);
          gen.if((0, codegen_1.not)(valid), notValid);
        });
      }
      __name(validateItems, "validateItems");
    }
    __name(validateArray, "validateArray");
    exports.validateArray = validateArray;
    function validateUnion(cxt) {
      const { gen, schema, keyword, it } = cxt;
      if (!Array.isArray(schema))
        throw new Error("ajv implementation error");
      const alwaysValid = schema.some((sch) => (0, util_1.alwaysValidSchema)(it, sch));
      if (alwaysValid && !it.opts.unevaluated)
        return;
      const valid = gen.let("valid", false);
      const schValid = gen.name("_valid");
      gen.block(() => schema.forEach((_sch, i) => {
        const schCxt = cxt.subschema({
          keyword,
          schemaProp: i,
          compositeRule: true
        }, schValid);
        gen.assign(valid, (0, codegen_1._)`${valid} || ${schValid}`);
        const merged = cxt.mergeValidEvaluated(schCxt, schValid);
        if (!merged)
          gen.if((0, codegen_1.not)(valid));
      }));
      cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
    }
    __name(validateUnion, "validateUnion");
    exports.validateUnion = validateUnion;
  }
});

// node_modules/ajv/dist/compile/validate/keyword.js
var require_keyword = __commonJS({
  "node_modules/ajv/dist/compile/validate/keyword.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateKeywordUsage = exports.validSchemaType = exports.funcKeywordCode = exports.macroKeywordCode = void 0;
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var code_1 = require_code2();
    var errors_1 = require_errors();
    function macroKeywordCode(cxt, def) {
      const { gen, keyword, schema, parentSchema, it } = cxt;
      const macroSchema = def.macro.call(it.self, schema, parentSchema, it);
      const schemaRef = useKeyword(gen, keyword, macroSchema);
      if (it.opts.validateSchema !== false)
        it.self.validateSchema(macroSchema, true);
      const valid = gen.name("valid");
      cxt.subschema({
        schema: macroSchema,
        schemaPath: codegen_1.nil,
        errSchemaPath: `${it.errSchemaPath}/${keyword}`,
        topSchemaRef: schemaRef,
        compositeRule: true
      }, valid);
      cxt.pass(valid, () => cxt.error(true));
    }
    __name(macroKeywordCode, "macroKeywordCode");
    exports.macroKeywordCode = macroKeywordCode;
    function funcKeywordCode(cxt, def) {
      var _a;
      const { gen, keyword, schema, parentSchema, $data, it } = cxt;
      checkAsyncKeyword(it, def);
      const validate = !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate;
      const validateRef = useKeyword(gen, keyword, validate);
      const valid = gen.let("valid");
      cxt.block$data(valid, validateKeyword);
      cxt.ok((_a = def.valid) !== null && _a !== void 0 ? _a : valid);
      function validateKeyword() {
        if (def.errors === false) {
          assignValid();
          if (def.modifying)
            modifyData(cxt);
          reportErrs(() => cxt.error());
        } else {
          const ruleErrs = def.async ? validateAsync() : validateSync();
          if (def.modifying)
            modifyData(cxt);
          reportErrs(() => addErrs(cxt, ruleErrs));
        }
      }
      __name(validateKeyword, "validateKeyword");
      function validateAsync() {
        const ruleErrs = gen.let("ruleErrs", null);
        gen.try(() => assignValid((0, codegen_1._)`await `), (e) => gen.assign(valid, false).if((0, codegen_1._)`${e} instanceof ${it.ValidationError}`, () => gen.assign(ruleErrs, (0, codegen_1._)`${e}.errors`), () => gen.throw(e)));
        return ruleErrs;
      }
      __name(validateAsync, "validateAsync");
      function validateSync() {
        const validateErrs = (0, codegen_1._)`${validateRef}.errors`;
        gen.assign(validateErrs, null);
        assignValid(codegen_1.nil);
        return validateErrs;
      }
      __name(validateSync, "validateSync");
      function assignValid(_await = def.async ? (0, codegen_1._)`await ` : codegen_1.nil) {
        const passCxt = it.opts.passContext ? names_1.default.this : names_1.default.self;
        const passSchema = !("compile" in def && !$data || def.schema === false);
        gen.assign(valid, (0, codegen_1._)`${_await}${(0, code_1.callValidateCode)(cxt, validateRef, passCxt, passSchema)}`, def.modifying);
      }
      __name(assignValid, "assignValid");
      function reportErrs(errors) {
        var _a2;
        gen.if((0, codegen_1.not)((_a2 = def.valid) !== null && _a2 !== void 0 ? _a2 : valid), errors);
      }
      __name(reportErrs, "reportErrs");
    }
    __name(funcKeywordCode, "funcKeywordCode");
    exports.funcKeywordCode = funcKeywordCode;
    function modifyData(cxt) {
      const { gen, data, it } = cxt;
      gen.if(it.parentData, () => gen.assign(data, (0, codegen_1._)`${it.parentData}[${it.parentDataProperty}]`));
    }
    __name(modifyData, "modifyData");
    function addErrs(cxt, errs) {
      const { gen } = cxt;
      gen.if((0, codegen_1._)`Array.isArray(${errs})`, () => {
        gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`).assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
        (0, errors_1.extendErrors)(cxt);
      }, () => cxt.error());
    }
    __name(addErrs, "addErrs");
    function checkAsyncKeyword({ schemaEnv }, def) {
      if (def.async && !schemaEnv.$async)
        throw new Error("async keyword in sync schema");
    }
    __name(checkAsyncKeyword, "checkAsyncKeyword");
    function useKeyword(gen, keyword, result) {
      if (result === void 0)
        throw new Error(`keyword "${keyword}" failed to compile`);
      return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : { ref: result, code: (0, codegen_1.stringify)(result) });
    }
    __name(useKeyword, "useKeyword");
    function validSchemaType(schema, schemaType, allowUndefined = false) {
      return !schemaType.length || schemaType.some((st) => st === "array" ? Array.isArray(schema) : st === "object" ? schema && typeof schema == "object" && !Array.isArray(schema) : typeof schema == st || allowUndefined && typeof schema == "undefined");
    }
    __name(validSchemaType, "validSchemaType");
    exports.validSchemaType = validSchemaType;
    function validateKeywordUsage({ schema, opts, self, errSchemaPath }, def, keyword) {
      if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) {
        throw new Error("ajv implementation error");
      }
      const deps = def.dependencies;
      if (deps === null || deps === void 0 ? void 0 : deps.some((kwd) => !Object.prototype.hasOwnProperty.call(schema, kwd))) {
        throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`);
      }
      if (def.validateSchema) {
        const valid = def.validateSchema(schema[keyword]);
        if (!valid) {
          const msg = `keyword "${keyword}" value is invalid at path "${errSchemaPath}": ` + self.errorsText(def.validateSchema.errors);
          if (opts.validateSchema === "log")
            self.logger.error(msg);
          else
            throw new Error(msg);
        }
      }
    }
    __name(validateKeywordUsage, "validateKeywordUsage");
    exports.validateKeywordUsage = validateKeywordUsage;
  }
});

// node_modules/ajv/dist/compile/validate/subschema.js
var require_subschema = __commonJS({
  "node_modules/ajv/dist/compile/validate/subschema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extendSubschemaMode = exports.extendSubschemaData = exports.getSubschema = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    function getSubschema(it, { keyword, schemaProp, schema, schemaPath, errSchemaPath, topSchemaRef }) {
      if (keyword !== void 0 && schema !== void 0) {
        throw new Error('both "keyword" and "schema" passed, only one allowed');
      }
      if (keyword !== void 0) {
        const sch = it.schema[keyword];
        return schemaProp === void 0 ? {
          schema: sch,
          schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}`,
          errSchemaPath: `${it.errSchemaPath}/${keyword}`
        } : {
          schema: sch[schemaProp],
          schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}${(0, codegen_1.getProperty)(schemaProp)}`,
          errSchemaPath: `${it.errSchemaPath}/${keyword}/${(0, util_1.escapeFragment)(schemaProp)}`
        };
      }
      if (schema !== void 0) {
        if (schemaPath === void 0 || errSchemaPath === void 0 || topSchemaRef === void 0) {
          throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
        }
        return {
          schema,
          schemaPath,
          topSchemaRef,
          errSchemaPath
        };
      }
      throw new Error('either "keyword" or "schema" must be passed');
    }
    __name(getSubschema, "getSubschema");
    exports.getSubschema = getSubschema;
    function extendSubschemaData(subschema, it, { dataProp, dataPropType: dpType, data, dataTypes, propertyName }) {
      if (data !== void 0 && dataProp !== void 0) {
        throw new Error('both "data" and "dataProp" passed, only one allowed');
      }
      const { gen } = it;
      if (dataProp !== void 0) {
        const { errorPath, dataPathArr, opts } = it;
        const nextData = gen.let("data", (0, codegen_1._)`${it.data}${(0, codegen_1.getProperty)(dataProp)}`, true);
        dataContextProps(nextData);
        subschema.errorPath = (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(dataProp, dpType, opts.jsPropertySyntax)}`;
        subschema.parentDataProperty = (0, codegen_1._)`${dataProp}`;
        subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty];
      }
      if (data !== void 0) {
        const nextData = data instanceof codegen_1.Name ? data : gen.let("data", data, true);
        dataContextProps(nextData);
        if (propertyName !== void 0)
          subschema.propertyName = propertyName;
      }
      if (dataTypes)
        subschema.dataTypes = dataTypes;
      function dataContextProps(_nextData) {
        subschema.data = _nextData;
        subschema.dataLevel = it.dataLevel + 1;
        subschema.dataTypes = [];
        it.definedProperties = /* @__PURE__ */ new Set();
        subschema.parentData = it.data;
        subschema.dataNames = [...it.dataNames, _nextData];
      }
      __name(dataContextProps, "dataContextProps");
    }
    __name(extendSubschemaData, "extendSubschemaData");
    exports.extendSubschemaData = extendSubschemaData;
    function extendSubschemaMode(subschema, { jtdDiscriminator, jtdMetadata, compositeRule, createErrors, allErrors }) {
      if (compositeRule !== void 0)
        subschema.compositeRule = compositeRule;
      if (createErrors !== void 0)
        subschema.createErrors = createErrors;
      if (allErrors !== void 0)
        subschema.allErrors = allErrors;
      subschema.jtdDiscriminator = jtdDiscriminator;
      subschema.jtdMetadata = jtdMetadata;
    }
    __name(extendSubschemaMode, "extendSubschemaMode");
    exports.extendSubschemaMode = extendSubschemaMode;
  }
});

// node_modules/fast-deep-equal/index.js
var require_fast_deep_equal = __commonJS({
  "node_modules/fast-deep-equal/index.js"(exports, module) {
    "use strict";
    module.exports = /* @__PURE__ */ __name(function equal(a, b) {
      if (a === b) return true;
      if (a && b && typeof a == "object" && typeof b == "object") {
        if (a.constructor !== b.constructor) return false;
        var length, i, keys;
        if (Array.isArray(a)) {
          length = a.length;
          if (length != b.length) return false;
          for (i = length; i-- !== 0; )
            if (!equal(a[i], b[i])) return false;
          return true;
        }
        if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
        if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
        if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
        keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length) return false;
        for (i = length; i-- !== 0; )
          if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
        for (i = length; i-- !== 0; ) {
          var key = keys[i];
          if (!equal(a[key], b[key])) return false;
        }
        return true;
      }
      return a !== a && b !== b;
    }, "equal");
  }
});

// node_modules/json-schema-traverse/index.js
var require_json_schema_traverse = __commonJS({
  "node_modules/json-schema-traverse/index.js"(exports, module) {
    "use strict";
    var traverse = module.exports = function(schema, opts, cb) {
      if (typeof opts == "function") {
        cb = opts;
        opts = {};
      }
      cb = opts.cb || cb;
      var pre = typeof cb == "function" ? cb : cb.pre || function() {
      };
      var post = cb.post || function() {
      };
      _traverse(opts, pre, post, schema, "", schema);
    };
    traverse.keywords = {
      additionalItems: true,
      items: true,
      contains: true,
      additionalProperties: true,
      propertyNames: true,
      not: true,
      if: true,
      then: true,
      else: true
    };
    traverse.arrayKeywords = {
      items: true,
      allOf: true,
      anyOf: true,
      oneOf: true
    };
    traverse.propsKeywords = {
      $defs: true,
      definitions: true,
      properties: true,
      patternProperties: true,
      dependencies: true
    };
    traverse.skipKeywords = {
      default: true,
      enum: true,
      const: true,
      required: true,
      maximum: true,
      minimum: true,
      exclusiveMaximum: true,
      exclusiveMinimum: true,
      multipleOf: true,
      maxLength: true,
      minLength: true,
      pattern: true,
      format: true,
      maxItems: true,
      minItems: true,
      uniqueItems: true,
      maxProperties: true,
      minProperties: true
    };
    function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
      if (schema && typeof schema == "object" && !Array.isArray(schema)) {
        pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
        for (var key in schema) {
          var sch = schema[key];
          if (Array.isArray(sch)) {
            if (key in traverse.arrayKeywords) {
              for (var i = 0; i < sch.length; i++)
                _traverse(opts, pre, post, sch[i], jsonPtr + "/" + key + "/" + i, rootSchema, jsonPtr, key, schema, i);
            }
          } else if (key in traverse.propsKeywords) {
            if (sch && typeof sch == "object") {
              for (var prop in sch)
                _traverse(opts, pre, post, sch[prop], jsonPtr + "/" + key + "/" + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
            }
          } else if (key in traverse.keywords || opts.allKeys && !(key in traverse.skipKeywords)) {
            _traverse(opts, pre, post, sch, jsonPtr + "/" + key, rootSchema, jsonPtr, key, schema);
          }
        }
        post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
      }
    }
    __name(_traverse, "_traverse");
    function escapeJsonPtr(str) {
      return str.replace(/~/g, "~0").replace(/\//g, "~1");
    }
    __name(escapeJsonPtr, "escapeJsonPtr");
  }
});

// node_modules/ajv/dist/compile/resolve.js
var require_resolve = __commonJS({
  "node_modules/ajv/dist/compile/resolve.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSchemaRefs = exports.resolveUrl = exports.normalizeId = exports._getFullPath = exports.getFullPath = exports.inlineRef = void 0;
    var util_1 = require_util();
    var equal = require_fast_deep_equal();
    var traverse = require_json_schema_traverse();
    var SIMPLE_INLINED = /* @__PURE__ */ new Set([
      "type",
      "format",
      "pattern",
      "maxLength",
      "minLength",
      "maxProperties",
      "minProperties",
      "maxItems",
      "minItems",
      "maximum",
      "minimum",
      "uniqueItems",
      "multipleOf",
      "required",
      "enum",
      "const"
    ]);
    function inlineRef(schema, limit = true) {
      if (typeof schema == "boolean")
        return true;
      if (limit === true)
        return !hasRef(schema);
      if (!limit)
        return false;
      return countKeys(schema) <= limit;
    }
    __name(inlineRef, "inlineRef");
    exports.inlineRef = inlineRef;
    var REF_KEYWORDS = /* @__PURE__ */ new Set([
      "$ref",
      "$recursiveRef",
      "$recursiveAnchor",
      "$dynamicRef",
      "$dynamicAnchor"
    ]);
    function hasRef(schema) {
      for (const key in schema) {
        if (REF_KEYWORDS.has(key))
          return true;
        const sch = schema[key];
        if (Array.isArray(sch) && sch.some(hasRef))
          return true;
        if (typeof sch == "object" && hasRef(sch))
          return true;
      }
      return false;
    }
    __name(hasRef, "hasRef");
    function countKeys(schema) {
      let count = 0;
      for (const key in schema) {
        if (key === "$ref")
          return Infinity;
        count++;
        if (SIMPLE_INLINED.has(key))
          continue;
        if (typeof schema[key] == "object") {
          (0, util_1.eachItem)(schema[key], (sch) => count += countKeys(sch));
        }
        if (count === Infinity)
          return Infinity;
      }
      return count;
    }
    __name(countKeys, "countKeys");
    function getFullPath(resolver, id = "", normalize3) {
      if (normalize3 !== false)
        id = normalizeId(id);
      const p = resolver.parse(id);
      return _getFullPath(resolver, p);
    }
    __name(getFullPath, "getFullPath");
    exports.getFullPath = getFullPath;
    function _getFullPath(resolver, p) {
      const serialized = resolver.serialize(p);
      return serialized.split("#")[0] + "#";
    }
    __name(_getFullPath, "_getFullPath");
    exports._getFullPath = _getFullPath;
    var TRAILING_SLASH_HASH = /#\/?$/;
    function normalizeId(id) {
      return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
    }
    __name(normalizeId, "normalizeId");
    exports.normalizeId = normalizeId;
    function resolveUrl(resolver, baseId, id) {
      id = normalizeId(id);
      return resolver.resolve(baseId, id);
    }
    __name(resolveUrl, "resolveUrl");
    exports.resolveUrl = resolveUrl;
    var ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
    function getSchemaRefs(schema, baseId) {
      if (typeof schema == "boolean")
        return {};
      const { schemaId, uriResolver } = this.opts;
      const schId = normalizeId(schema[schemaId] || baseId);
      const baseIds = { "": schId };
      const pathPrefix = getFullPath(uriResolver, schId, false);
      const localRefs = {};
      const schemaRefs = /* @__PURE__ */ new Set();
      traverse(schema, { allKeys: true }, (sch, jsonPtr, _, parentJsonPtr) => {
        if (parentJsonPtr === void 0)
          return;
        const fullPath = pathPrefix + jsonPtr;
        let innerBaseId = baseIds[parentJsonPtr];
        if (typeof sch[schemaId] == "string")
          innerBaseId = addRef.call(this, sch[schemaId]);
        addAnchor.call(this, sch.$anchor);
        addAnchor.call(this, sch.$dynamicAnchor);
        baseIds[jsonPtr] = innerBaseId;
        function addRef(ref) {
          const _resolve = this.opts.uriResolver.resolve;
          ref = normalizeId(innerBaseId ? _resolve(innerBaseId, ref) : ref);
          if (schemaRefs.has(ref))
            throw ambiguos(ref);
          schemaRefs.add(ref);
          let schOrRef = this.refs[ref];
          if (typeof schOrRef == "string")
            schOrRef = this.refs[schOrRef];
          if (typeof schOrRef == "object") {
            checkAmbiguosRef(sch, schOrRef.schema, ref);
          } else if (ref !== normalizeId(fullPath)) {
            if (ref[0] === "#") {
              checkAmbiguosRef(sch, localRefs[ref], ref);
              localRefs[ref] = sch;
            } else {
              this.refs[ref] = fullPath;
            }
          }
          return ref;
        }
        __name(addRef, "addRef");
        function addAnchor(anchor) {
          if (typeof anchor == "string") {
            if (!ANCHOR.test(anchor))
              throw new Error(`invalid anchor "${anchor}"`);
            addRef.call(this, `#${anchor}`);
          }
        }
        __name(addAnchor, "addAnchor");
      });
      return localRefs;
      function checkAmbiguosRef(sch1, sch2, ref) {
        if (sch2 !== void 0 && !equal(sch1, sch2))
          throw ambiguos(ref);
      }
      __name(checkAmbiguosRef, "checkAmbiguosRef");
      function ambiguos(ref) {
        return new Error(`reference "${ref}" resolves to more than one schema`);
      }
      __name(ambiguos, "ambiguos");
    }
    __name(getSchemaRefs, "getSchemaRefs");
    exports.getSchemaRefs = getSchemaRefs;
  }
});

// node_modules/ajv/dist/compile/validate/index.js
var require_validate = __commonJS({
  "node_modules/ajv/dist/compile/validate/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getData = exports.KeywordCxt = exports.validateFunctionCode = void 0;
    var boolSchema_1 = require_boolSchema();
    var dataType_1 = require_dataType();
    var applicability_1 = require_applicability();
    var dataType_2 = require_dataType();
    var defaults_1 = require_defaults();
    var keyword_1 = require_keyword();
    var subschema_1 = require_subschema();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var resolve_1 = require_resolve();
    var util_1 = require_util();
    var errors_1 = require_errors();
    function validateFunctionCode(it) {
      if (isSchemaObj(it)) {
        checkKeywords(it);
        if (schemaCxtHasRules(it)) {
          topSchemaObjCode(it);
          return;
        }
      }
      validateFunction(it, () => (0, boolSchema_1.topBoolOrEmptySchema)(it));
    }
    __name(validateFunctionCode, "validateFunctionCode");
    exports.validateFunctionCode = validateFunctionCode;
    function validateFunction({ gen, validateName, schema, schemaEnv, opts }, body) {
      if (opts.code.es5) {
        gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${names_1.default.valCxt}`, schemaEnv.$async, () => {
          gen.code((0, codegen_1._)`"use strict"; ${funcSourceUrl(schema, opts)}`);
          destructureValCxtES5(gen, opts);
          gen.code(body);
        });
      } else {
        gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () => gen.code(funcSourceUrl(schema, opts)).code(body));
      }
    }
    __name(validateFunction, "validateFunction");
    function destructureValCxt(opts) {
      return (0, codegen_1._)`{${names_1.default.instancePath}="", ${names_1.default.parentData}, ${names_1.default.parentDataProperty}, ${names_1.default.rootData}=${names_1.default.data}${opts.dynamicRef ? (0, codegen_1._)`, ${names_1.default.dynamicAnchors}={}` : codegen_1.nil}}={}`;
    }
    __name(destructureValCxt, "destructureValCxt");
    function destructureValCxtES5(gen, opts) {
      gen.if(names_1.default.valCxt, () => {
        gen.var(names_1.default.instancePath, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.instancePath}`);
        gen.var(names_1.default.parentData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentData}`);
        gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentDataProperty}`);
        gen.var(names_1.default.rootData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.rootData}`);
        if (opts.dynamicRef)
          gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.dynamicAnchors}`);
      }, () => {
        gen.var(names_1.default.instancePath, (0, codegen_1._)`""`);
        gen.var(names_1.default.parentData, (0, codegen_1._)`undefined`);
        gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`undefined`);
        gen.var(names_1.default.rootData, names_1.default.data);
        if (opts.dynamicRef)
          gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`{}`);
      });
    }
    __name(destructureValCxtES5, "destructureValCxtES5");
    function topSchemaObjCode(it) {
      const { schema, opts, gen } = it;
      validateFunction(it, () => {
        if (opts.$comment && schema.$comment)
          commentKeyword(it);
        checkNoDefault(it);
        gen.let(names_1.default.vErrors, null);
        gen.let(names_1.default.errors, 0);
        if (opts.unevaluated)
          resetEvaluated(it);
        typeAndKeywords(it);
        returnResults(it);
      });
      return;
    }
    __name(topSchemaObjCode, "topSchemaObjCode");
    function resetEvaluated(it) {
      const { gen, validateName } = it;
      it.evaluated = gen.const("evaluated", (0, codegen_1._)`${validateName}.evaluated`);
      gen.if((0, codegen_1._)`${it.evaluated}.dynamicProps`, () => gen.assign((0, codegen_1._)`${it.evaluated}.props`, (0, codegen_1._)`undefined`));
      gen.if((0, codegen_1._)`${it.evaluated}.dynamicItems`, () => gen.assign((0, codegen_1._)`${it.evaluated}.items`, (0, codegen_1._)`undefined`));
    }
    __name(resetEvaluated, "resetEvaluated");
    function funcSourceUrl(schema, opts) {
      const schId = typeof schema == "object" && schema[opts.schemaId];
      return schId && (opts.code.source || opts.code.process) ? (0, codegen_1._)`/*# sourceURL=${schId} */` : codegen_1.nil;
    }
    __name(funcSourceUrl, "funcSourceUrl");
    function subschemaCode(it, valid) {
      if (isSchemaObj(it)) {
        checkKeywords(it);
        if (schemaCxtHasRules(it)) {
          subSchemaObjCode(it, valid);
          return;
        }
      }
      (0, boolSchema_1.boolOrEmptySchema)(it, valid);
    }
    __name(subschemaCode, "subschemaCode");
    function schemaCxtHasRules({ schema, self }) {
      if (typeof schema == "boolean")
        return !schema;
      for (const key in schema)
        if (self.RULES.all[key])
          return true;
      return false;
    }
    __name(schemaCxtHasRules, "schemaCxtHasRules");
    function isSchemaObj(it) {
      return typeof it.schema != "boolean";
    }
    __name(isSchemaObj, "isSchemaObj");
    function subSchemaObjCode(it, valid) {
      const { schema, gen, opts } = it;
      if (opts.$comment && schema.$comment)
        commentKeyword(it);
      updateContext(it);
      checkAsyncSchema(it);
      const errsCount = gen.const("_errs", names_1.default.errors);
      typeAndKeywords(it, errsCount);
      gen.var(valid, (0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
    }
    __name(subSchemaObjCode, "subSchemaObjCode");
    function checkKeywords(it) {
      (0, util_1.checkUnknownRules)(it);
      checkRefsAndKeywords(it);
    }
    __name(checkKeywords, "checkKeywords");
    function typeAndKeywords(it, errsCount) {
      if (it.opts.jtd)
        return schemaKeywords(it, [], false, errsCount);
      const types2 = (0, dataType_1.getSchemaTypes)(it.schema);
      const checkedTypes = (0, dataType_1.coerceAndCheckDataType)(it, types2);
      schemaKeywords(it, types2, !checkedTypes, errsCount);
    }
    __name(typeAndKeywords, "typeAndKeywords");
    function checkRefsAndKeywords(it) {
      const { schema, errSchemaPath, opts, self } = it;
      if (schema.$ref && opts.ignoreKeywordsWithRef && (0, util_1.schemaHasRulesButRef)(schema, self.RULES)) {
        self.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`);
      }
    }
    __name(checkRefsAndKeywords, "checkRefsAndKeywords");
    function checkNoDefault(it) {
      const { schema, opts } = it;
      if (schema.default !== void 0 && opts.useDefaults && opts.strictSchema) {
        (0, util_1.checkStrictMode)(it, "default is ignored in the schema root");
      }
    }
    __name(checkNoDefault, "checkNoDefault");
    function updateContext(it) {
      const schId = it.schema[it.opts.schemaId];
      if (schId)
        it.baseId = (0, resolve_1.resolveUrl)(it.opts.uriResolver, it.baseId, schId);
    }
    __name(updateContext, "updateContext");
    function checkAsyncSchema(it) {
      if (it.schema.$async && !it.schemaEnv.$async)
        throw new Error("async schema in sync schema");
    }
    __name(checkAsyncSchema, "checkAsyncSchema");
    function commentKeyword({ gen, schemaEnv, schema, errSchemaPath, opts }) {
      const msg = schema.$comment;
      if (opts.$comment === true) {
        gen.code((0, codegen_1._)`${names_1.default.self}.logger.log(${msg})`);
      } else if (typeof opts.$comment == "function") {
        const schemaPath = (0, codegen_1.str)`${errSchemaPath}/$comment`;
        const rootName = gen.scopeValue("root", { ref: schemaEnv.root });
        gen.code((0, codegen_1._)`${names_1.default.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`);
      }
    }
    __name(commentKeyword, "commentKeyword");
    function returnResults(it) {
      const { gen, schemaEnv, validateName, ValidationError: ValidationError2, opts } = it;
      if (schemaEnv.$async) {
        gen.if((0, codegen_1._)`${names_1.default.errors} === 0`, () => gen.return(names_1.default.data), () => gen.throw((0, codegen_1._)`new ${ValidationError2}(${names_1.default.vErrors})`));
      } else {
        gen.assign((0, codegen_1._)`${validateName}.errors`, names_1.default.vErrors);
        if (opts.unevaluated)
          assignEvaluated(it);
        gen.return((0, codegen_1._)`${names_1.default.errors} === 0`);
      }
    }
    __name(returnResults, "returnResults");
    function assignEvaluated({ gen, evaluated, props, items }) {
      if (props instanceof codegen_1.Name)
        gen.assign((0, codegen_1._)`${evaluated}.props`, props);
      if (items instanceof codegen_1.Name)
        gen.assign((0, codegen_1._)`${evaluated}.items`, items);
    }
    __name(assignEvaluated, "assignEvaluated");
    function schemaKeywords(it, types2, typeErrors, errsCount) {
      const { gen, schema, data, allErrors, opts, self } = it;
      const { RULES } = self;
      if (schema.$ref && (opts.ignoreKeywordsWithRef || !(0, util_1.schemaHasRulesButRef)(schema, RULES))) {
        gen.block(() => keywordCode(it, "$ref", RULES.all.$ref.definition));
        return;
      }
      if (!opts.jtd)
        checkStrictTypes(it, types2);
      gen.block(() => {
        for (const group of RULES.rules)
          groupKeywords(group);
        groupKeywords(RULES.post);
      });
      function groupKeywords(group) {
        if (!(0, applicability_1.shouldUseGroup)(schema, group))
          return;
        if (group.type) {
          gen.if((0, dataType_2.checkDataType)(group.type, data, opts.strictNumbers));
          iterateKeywords(it, group);
          if (types2.length === 1 && types2[0] === group.type && typeErrors) {
            gen.else();
            (0, dataType_2.reportTypeError)(it);
          }
          gen.endIf();
        } else {
          iterateKeywords(it, group);
        }
        if (!allErrors)
          gen.if((0, codegen_1._)`${names_1.default.errors} === ${errsCount || 0}`);
      }
      __name(groupKeywords, "groupKeywords");
    }
    __name(schemaKeywords, "schemaKeywords");
    function iterateKeywords(it, group) {
      const { gen, schema, opts: { useDefaults } } = it;
      if (useDefaults)
        (0, defaults_1.assignDefaults)(it, group.type);
      gen.block(() => {
        for (const rule of group.rules) {
          if ((0, applicability_1.shouldUseRule)(schema, rule)) {
            keywordCode(it, rule.keyword, rule.definition, group.type);
          }
        }
      });
    }
    __name(iterateKeywords, "iterateKeywords");
    function checkStrictTypes(it, types2) {
      if (it.schemaEnv.meta || !it.opts.strictTypes)
        return;
      checkContextTypes(it, types2);
      if (!it.opts.allowUnionTypes)
        checkMultipleTypes(it, types2);
      checkKeywordTypes(it, it.dataTypes);
    }
    __name(checkStrictTypes, "checkStrictTypes");
    function checkContextTypes(it, types2) {
      if (!types2.length)
        return;
      if (!it.dataTypes.length) {
        it.dataTypes = types2;
        return;
      }
      types2.forEach((t) => {
        if (!includesType(it.dataTypes, t)) {
          strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`);
        }
      });
      narrowSchemaTypes(it, types2);
    }
    __name(checkContextTypes, "checkContextTypes");
    function checkMultipleTypes(it, ts) {
      if (ts.length > 1 && !(ts.length === 2 && ts.includes("null"))) {
        strictTypesError(it, "use allowUnionTypes to allow union type keyword");
      }
    }
    __name(checkMultipleTypes, "checkMultipleTypes");
    function checkKeywordTypes(it, ts) {
      const rules = it.self.RULES.all;
      for (const keyword in rules) {
        const rule = rules[keyword];
        if (typeof rule == "object" && (0, applicability_1.shouldUseRule)(it.schema, rule)) {
          const { type } = rule.definition;
          if (type.length && !type.some((t) => hasApplicableType(ts, t))) {
            strictTypesError(it, `missing type "${type.join(",")}" for keyword "${keyword}"`);
          }
        }
      }
    }
    __name(checkKeywordTypes, "checkKeywordTypes");
    function hasApplicableType(schTs, kwdT) {
      return schTs.includes(kwdT) || kwdT === "number" && schTs.includes("integer");
    }
    __name(hasApplicableType, "hasApplicableType");
    function includesType(ts, t) {
      return ts.includes(t) || t === "integer" && ts.includes("number");
    }
    __name(includesType, "includesType");
    function narrowSchemaTypes(it, withTypes) {
      const ts = [];
      for (const t of it.dataTypes) {
        if (includesType(withTypes, t))
          ts.push(t);
        else if (withTypes.includes("integer") && t === "number")
          ts.push("integer");
      }
      it.dataTypes = ts;
    }
    __name(narrowSchemaTypes, "narrowSchemaTypes");
    function strictTypesError(it, msg) {
      const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
      msg += ` at "${schemaPath}" (strictTypes)`;
      (0, util_1.checkStrictMode)(it, msg, it.opts.strictTypes);
    }
    __name(strictTypesError, "strictTypesError");
    var KeywordCxt = class {
      static {
        __name(this, "KeywordCxt");
      }
      constructor(it, def, keyword) {
        (0, keyword_1.validateKeywordUsage)(it, def, keyword);
        this.gen = it.gen;
        this.allErrors = it.allErrors;
        this.keyword = keyword;
        this.data = it.data;
        this.schema = it.schema[keyword];
        this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data;
        this.schemaValue = (0, util_1.schemaRefOrVal)(it, this.schema, keyword, this.$data);
        this.schemaType = def.schemaType;
        this.parentSchema = it.schema;
        this.params = {};
        this.it = it;
        this.def = def;
        if (this.$data) {
          this.schemaCode = it.gen.const("vSchema", getData(this.$data, it));
        } else {
          this.schemaCode = this.schemaValue;
          if (!(0, keyword_1.validSchemaType)(this.schema, def.schemaType, def.allowUndefined)) {
            throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`);
          }
        }
        if ("code" in def ? def.trackErrors : def.errors !== false) {
          this.errsCount = it.gen.const("_errs", names_1.default.errors);
        }
      }
      result(condition, successAction, failAction) {
        this.failResult((0, codegen_1.not)(condition), successAction, failAction);
      }
      failResult(condition, successAction, failAction) {
        this.gen.if(condition);
        if (failAction)
          failAction();
        else
          this.error();
        if (successAction) {
          this.gen.else();
          successAction();
          if (this.allErrors)
            this.gen.endIf();
        } else {
          if (this.allErrors)
            this.gen.endIf();
          else
            this.gen.else();
        }
      }
      pass(condition, failAction) {
        this.failResult((0, codegen_1.not)(condition), void 0, failAction);
      }
      fail(condition) {
        if (condition === void 0) {
          this.error();
          if (!this.allErrors)
            this.gen.if(false);
          return;
        }
        this.gen.if(condition);
        this.error();
        if (this.allErrors)
          this.gen.endIf();
        else
          this.gen.else();
      }
      fail$data(condition) {
        if (!this.$data)
          return this.fail(condition);
        const { schemaCode } = this;
        this.fail((0, codegen_1._)`${schemaCode} !== undefined && (${(0, codegen_1.or)(this.invalid$data(), condition)})`);
      }
      error(append, errorParams, errorPaths) {
        if (errorParams) {
          this.setParams(errorParams);
          this._error(append, errorPaths);
          this.setParams({});
          return;
        }
        this._error(append, errorPaths);
      }
      _error(append, errorPaths) {
        ;
        (append ? errors_1.reportExtraError : errors_1.reportError)(this, this.def.error, errorPaths);
      }
      $dataError() {
        (0, errors_1.reportError)(this, this.def.$dataError || errors_1.keyword$DataError);
      }
      reset() {
        if (this.errsCount === void 0)
          throw new Error('add "trackErrors" to keyword definition');
        (0, errors_1.resetErrorsCount)(this.gen, this.errsCount);
      }
      ok(cond) {
        if (!this.allErrors)
          this.gen.if(cond);
      }
      setParams(obj, assign) {
        if (assign)
          Object.assign(this.params, obj);
        else
          this.params = obj;
      }
      block$data(valid, codeBlock, $dataValid = codegen_1.nil) {
        this.gen.block(() => {
          this.check$data(valid, $dataValid);
          codeBlock();
        });
      }
      check$data(valid = codegen_1.nil, $dataValid = codegen_1.nil) {
        if (!this.$data)
          return;
        const { gen, schemaCode, schemaType, def } = this;
        gen.if((0, codegen_1.or)((0, codegen_1._)`${schemaCode} === undefined`, $dataValid));
        if (valid !== codegen_1.nil)
          gen.assign(valid, true);
        if (schemaType.length || def.validateSchema) {
          gen.elseIf(this.invalid$data());
          this.$dataError();
          if (valid !== codegen_1.nil)
            gen.assign(valid, false);
        }
        gen.else();
      }
      invalid$data() {
        const { gen, schemaCode, schemaType, def, it } = this;
        return (0, codegen_1.or)(wrong$DataType(), invalid$DataSchema());
        function wrong$DataType() {
          if (schemaType.length) {
            if (!(schemaCode instanceof codegen_1.Name))
              throw new Error("ajv implementation error");
            const st = Array.isArray(schemaType) ? schemaType : [schemaType];
            return (0, codegen_1._)`${(0, dataType_2.checkDataTypes)(st, schemaCode, it.opts.strictNumbers, dataType_2.DataType.Wrong)}`;
          }
          return codegen_1.nil;
        }
        __name(wrong$DataType, "wrong$DataType");
        function invalid$DataSchema() {
          if (def.validateSchema) {
            const validateSchemaRef = gen.scopeValue("validate$data", { ref: def.validateSchema });
            return (0, codegen_1._)`!${validateSchemaRef}(${schemaCode})`;
          }
          return codegen_1.nil;
        }
        __name(invalid$DataSchema, "invalid$DataSchema");
      }
      subschema(appl, valid) {
        const subschema = (0, subschema_1.getSubschema)(this.it, appl);
        (0, subschema_1.extendSubschemaData)(subschema, this.it, appl);
        (0, subschema_1.extendSubschemaMode)(subschema, appl);
        const nextContext = { ...this.it, ...subschema, items: void 0, props: void 0 };
        subschemaCode(nextContext, valid);
        return nextContext;
      }
      mergeEvaluated(schemaCxt, toName) {
        const { it, gen } = this;
        if (!it.opts.unevaluated)
          return;
        if (it.props !== true && schemaCxt.props !== void 0) {
          it.props = util_1.mergeEvaluated.props(gen, schemaCxt.props, it.props, toName);
        }
        if (it.items !== true && schemaCxt.items !== void 0) {
          it.items = util_1.mergeEvaluated.items(gen, schemaCxt.items, it.items, toName);
        }
      }
      mergeValidEvaluated(schemaCxt, valid) {
        const { it, gen } = this;
        if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
          gen.if(valid, () => this.mergeEvaluated(schemaCxt, codegen_1.Name));
          return true;
        }
      }
    };
    exports.KeywordCxt = KeywordCxt;
    function keywordCode(it, keyword, def, ruleType) {
      const cxt = new KeywordCxt(it, def, keyword);
      if ("code" in def) {
        def.code(cxt, ruleType);
      } else if (cxt.$data && def.validate) {
        (0, keyword_1.funcKeywordCode)(cxt, def);
      } else if ("macro" in def) {
        (0, keyword_1.macroKeywordCode)(cxt, def);
      } else if (def.compile || def.validate) {
        (0, keyword_1.funcKeywordCode)(cxt, def);
      }
    }
    __name(keywordCode, "keywordCode");
    var JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
    var RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
    function getData($data, { dataLevel, dataNames, dataPathArr }) {
      let jsonPointer;
      let data;
      if ($data === "")
        return names_1.default.rootData;
      if ($data[0] === "/") {
        if (!JSON_POINTER.test($data))
          throw new Error(`Invalid JSON-pointer: ${$data}`);
        jsonPointer = $data;
        data = names_1.default.rootData;
      } else {
        const matches = RELATIVE_JSON_POINTER.exec($data);
        if (!matches)
          throw new Error(`Invalid JSON-pointer: ${$data}`);
        const up = +matches[1];
        jsonPointer = matches[2];
        if (jsonPointer === "#") {
          if (up >= dataLevel)
            throw new Error(errorMsg("property/index", up));
          return dataPathArr[dataLevel - up];
        }
        if (up > dataLevel)
          throw new Error(errorMsg("data", up));
        data = dataNames[dataLevel - up];
        if (!jsonPointer)
          return data;
      }
      let expr = data;
      const segments = jsonPointer.split("/");
      for (const segment of segments) {
        if (segment) {
          data = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)((0, util_1.unescapeJsonPointer)(segment))}`;
          expr = (0, codegen_1._)`${expr} && ${data}`;
        }
      }
      return expr;
      function errorMsg(pointerType, up) {
        return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`;
      }
      __name(errorMsg, "errorMsg");
    }
    __name(getData, "getData");
    exports.getData = getData;
  }
});

// node_modules/ajv/dist/runtime/validation_error.js
var require_validation_error = __commonJS({
  "node_modules/ajv/dist/runtime/validation_error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ValidationError2 = class extends Error {
      static {
        __name(this, "ValidationError");
      }
      constructor(errors) {
        super("validation failed");
        this.errors = errors;
        this.ajv = this.validation = true;
      }
    };
    exports.default = ValidationError2;
  }
});

// node_modules/ajv/dist/compile/ref_error.js
var require_ref_error = __commonJS({
  "node_modules/ajv/dist/compile/ref_error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var resolve_1 = require_resolve();
    var MissingRefError = class extends Error {
      static {
        __name(this, "MissingRefError");
      }
      constructor(resolver, baseId, ref, msg) {
        super(msg || `can't resolve reference ${ref} from id ${baseId}`);
        this.missingRef = (0, resolve_1.resolveUrl)(resolver, baseId, ref);
        this.missingSchema = (0, resolve_1.normalizeId)((0, resolve_1.getFullPath)(resolver, this.missingRef));
      }
    };
    exports.default = MissingRefError;
  }
});

// node_modules/ajv/dist/compile/index.js
var require_compile = __commonJS({
  "node_modules/ajv/dist/compile/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveSchema = exports.getCompilingSchema = exports.resolveRef = exports.compileSchema = exports.SchemaEnv = void 0;
    var codegen_1 = require_codegen();
    var validation_error_1 = require_validation_error();
    var names_1 = require_names();
    var resolve_1 = require_resolve();
    var util_1 = require_util();
    var validate_1 = require_validate();
    var SchemaEnv = class {
      static {
        __name(this, "SchemaEnv");
      }
      constructor(env) {
        var _a;
        this.refs = {};
        this.dynamicAnchors = {};
        let schema;
        if (typeof env.schema == "object")
          schema = env.schema;
        this.schema = env.schema;
        this.schemaId = env.schemaId;
        this.root = env.root || this;
        this.baseId = (_a = env.baseId) !== null && _a !== void 0 ? _a : (0, resolve_1.normalizeId)(schema === null || schema === void 0 ? void 0 : schema[env.schemaId || "$id"]);
        this.schemaPath = env.schemaPath;
        this.localRefs = env.localRefs;
        this.meta = env.meta;
        this.$async = schema === null || schema === void 0 ? void 0 : schema.$async;
        this.refs = {};
      }
    };
    exports.SchemaEnv = SchemaEnv;
    function compileSchema(sch) {
      const _sch = getCompilingSchema.call(this, sch);
      if (_sch)
        return _sch;
      const rootId = (0, resolve_1.getFullPath)(this.opts.uriResolver, sch.root.baseId);
      const { es5, lines } = this.opts.code;
      const { ownProperties } = this.opts;
      const gen = new codegen_1.CodeGen(this.scope, { es5, lines, ownProperties });
      let _ValidationError;
      if (sch.$async) {
        _ValidationError = gen.scopeValue("Error", {
          ref: validation_error_1.default,
          code: (0, codegen_1._)`require("ajv/dist/runtime/validation_error").default`
        });
      }
      const validateName = gen.scopeName("validate");
      sch.validateName = validateName;
      const schemaCxt = {
        gen,
        allErrors: this.opts.allErrors,
        data: names_1.default.data,
        parentData: names_1.default.parentData,
        parentDataProperty: names_1.default.parentDataProperty,
        dataNames: [names_1.default.data],
        dataPathArr: [codegen_1.nil],
        // TODO can its length be used as dataLevel if nil is removed?
        dataLevel: 0,
        dataTypes: [],
        definedProperties: /* @__PURE__ */ new Set(),
        topSchemaRef: gen.scopeValue("schema", this.opts.code.source === true ? { ref: sch.schema, code: (0, codegen_1.stringify)(sch.schema) } : { ref: sch.schema }),
        validateName,
        ValidationError: _ValidationError,
        schema: sch.schema,
        schemaEnv: sch,
        rootId,
        baseId: sch.baseId || rootId,
        schemaPath: codegen_1.nil,
        errSchemaPath: sch.schemaPath || (this.opts.jtd ? "" : "#"),
        errorPath: (0, codegen_1._)`""`,
        opts: this.opts,
        self: this
      };
      let sourceCode;
      try {
        this._compilations.add(sch);
        (0, validate_1.validateFunctionCode)(schemaCxt);
        gen.optimize(this.opts.code.optimize);
        const validateCode = gen.toString();
        sourceCode = `${gen.scopeRefs(names_1.default.scope)}return ${validateCode}`;
        if (this.opts.code.process)
          sourceCode = this.opts.code.process(sourceCode, sch);
        const makeValidate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode);
        const validate = makeValidate(this, this.scope.get());
        this.scope.value(validateName, { ref: validate });
        validate.errors = null;
        validate.schema = sch.schema;
        validate.schemaEnv = sch;
        if (sch.$async)
          validate.$async = true;
        if (this.opts.code.source === true) {
          validate.source = { validateName, validateCode, scopeValues: gen._values };
        }
        if (this.opts.unevaluated) {
          const { props, items } = schemaCxt;
          validate.evaluated = {
            props: props instanceof codegen_1.Name ? void 0 : props,
            items: items instanceof codegen_1.Name ? void 0 : items,
            dynamicProps: props instanceof codegen_1.Name,
            dynamicItems: items instanceof codegen_1.Name
          };
          if (validate.source)
            validate.source.evaluated = (0, codegen_1.stringify)(validate.evaluated);
        }
        sch.validate = validate;
        return sch;
      } catch (e) {
        delete sch.validate;
        delete sch.validateName;
        if (sourceCode)
          this.logger.error("Error compiling schema, function code:", sourceCode);
        throw e;
      } finally {
        this._compilations.delete(sch);
      }
    }
    __name(compileSchema, "compileSchema");
    exports.compileSchema = compileSchema;
    function resolveRef(root, baseId, ref) {
      var _a;
      ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, ref);
      const schOrFunc = root.refs[ref];
      if (schOrFunc)
        return schOrFunc;
      let _sch = resolve2.call(this, root, ref);
      if (_sch === void 0) {
        const schema = (_a = root.localRefs) === null || _a === void 0 ? void 0 : _a[ref];
        const { schemaId } = this.opts;
        if (schema)
          _sch = new SchemaEnv({ schema, schemaId, root, baseId });
      }
      if (_sch === void 0)
        return;
      return root.refs[ref] = inlineOrCompile.call(this, _sch);
    }
    __name(resolveRef, "resolveRef");
    exports.resolveRef = resolveRef;
    function inlineOrCompile(sch) {
      if ((0, resolve_1.inlineRef)(sch.schema, this.opts.inlineRefs))
        return sch.schema;
      return sch.validate ? sch : compileSchema.call(this, sch);
    }
    __name(inlineOrCompile, "inlineOrCompile");
    function getCompilingSchema(schEnv) {
      for (const sch of this._compilations) {
        if (sameSchemaEnv(sch, schEnv))
          return sch;
      }
    }
    __name(getCompilingSchema, "getCompilingSchema");
    exports.getCompilingSchema = getCompilingSchema;
    function sameSchemaEnv(s1, s2) {
      return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId;
    }
    __name(sameSchemaEnv, "sameSchemaEnv");
    function resolve2(root, ref) {
      let sch;
      while (typeof (sch = this.refs[ref]) == "string")
        ref = sch;
      return sch || this.schemas[ref] || resolveSchema.call(this, root, ref);
    }
    __name(resolve2, "resolve");
    function resolveSchema(root, ref) {
      const p = this.opts.uriResolver.parse(ref);
      const refPath = (0, resolve_1._getFullPath)(this.opts.uriResolver, p);
      let baseId = (0, resolve_1.getFullPath)(this.opts.uriResolver, root.baseId, void 0);
      if (Object.keys(root.schema).length > 0 && refPath === baseId) {
        return getJsonPointer.call(this, p, root);
      }
      const id = (0, resolve_1.normalizeId)(refPath);
      const schOrRef = this.refs[id] || this.schemas[id];
      if (typeof schOrRef == "string") {
        const sch = resolveSchema.call(this, root, schOrRef);
        if (typeof (sch === null || sch === void 0 ? void 0 : sch.schema) !== "object")
          return;
        return getJsonPointer.call(this, p, sch);
      }
      if (typeof (schOrRef === null || schOrRef === void 0 ? void 0 : schOrRef.schema) !== "object")
        return;
      if (!schOrRef.validate)
        compileSchema.call(this, schOrRef);
      if (id === (0, resolve_1.normalizeId)(ref)) {
        const { schema } = schOrRef;
        const { schemaId } = this.opts;
        const schId = schema[schemaId];
        if (schId)
          baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
        return new SchemaEnv({ schema, schemaId, root, baseId });
      }
      return getJsonPointer.call(this, p, schOrRef);
    }
    __name(resolveSchema, "resolveSchema");
    exports.resolveSchema = resolveSchema;
    var PREVENT_SCOPE_CHANGE = /* @__PURE__ */ new Set([
      "properties",
      "patternProperties",
      "enum",
      "dependencies",
      "definitions"
    ]);
    function getJsonPointer(parsedRef, { baseId, schema, root }) {
      var _a;
      if (((_a = parsedRef.fragment) === null || _a === void 0 ? void 0 : _a[0]) !== "/")
        return;
      for (const part of parsedRef.fragment.slice(1).split("/")) {
        if (typeof schema === "boolean")
          return;
        const partSchema = schema[(0, util_1.unescapeFragment)(part)];
        if (partSchema === void 0)
          return;
        schema = partSchema;
        const schId = typeof schema === "object" && schema[this.opts.schemaId];
        if (!PREVENT_SCOPE_CHANGE.has(part) && schId) {
          baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
        }
      }
      let env;
      if (typeof schema != "boolean" && schema.$ref && !(0, util_1.schemaHasRulesButRef)(schema, this.RULES)) {
        const $ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schema.$ref);
        env = resolveSchema.call(this, root, $ref);
      }
      const { schemaId } = this.opts;
      env = env || new SchemaEnv({ schema, schemaId, root, baseId });
      if (env.schema !== env.root.schema)
        return env;
      return void 0;
    }
    __name(getJsonPointer, "getJsonPointer");
  }
});

// node_modules/ajv/dist/refs/data.json
var require_data = __commonJS({
  "node_modules/ajv/dist/refs/data.json"(exports, module) {
    module.exports = {
      $id: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
      description: "Meta-schema for $data reference (JSON AnySchema extension proposal)",
      type: "object",
      required: ["$data"],
      properties: {
        $data: {
          type: "string",
          anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }]
        }
      },
      additionalProperties: false
    };
  }
});

// node_modules/fast-uri/lib/utils.js
var require_utils = __commonJS({
  "node_modules/fast-uri/lib/utils.js"(exports, module) {
    "use strict";
    var isUUID = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu);
    var isIPv4 = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
    function stringArrayToHexStripped(input) {
      let acc = "";
      let code = 0;
      let i = 0;
      for (i = 0; i < input.length; i++) {
        code = input[i].charCodeAt(0);
        if (code === 48) {
          continue;
        }
        if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
          return "";
        }
        acc += input[i];
        break;
      }
      for (i += 1; i < input.length; i++) {
        code = input[i].charCodeAt(0);
        if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
          return "";
        }
        acc += input[i];
      }
      return acc;
    }
    __name(stringArrayToHexStripped, "stringArrayToHexStripped");
    var nonSimpleDomain = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
    function consumeIsZone(buffer) {
      buffer.length = 0;
      return true;
    }
    __name(consumeIsZone, "consumeIsZone");
    function consumeHextets(buffer, address, output) {
      if (buffer.length) {
        const hex = stringArrayToHexStripped(buffer);
        if (hex !== "") {
          address.push(hex);
        } else {
          output.error = true;
          return false;
        }
        buffer.length = 0;
      }
      return true;
    }
    __name(consumeHextets, "consumeHextets");
    function getIPV6(input) {
      let tokenCount = 0;
      const output = { error: false, address: "", zone: "" };
      const address = [];
      const buffer = [];
      let endipv6Encountered = false;
      let endIpv6 = false;
      let consume = consumeHextets;
      for (let i = 0; i < input.length; i++) {
        const cursor = input[i];
        if (cursor === "[" || cursor === "]") {
          continue;
        }
        if (cursor === ":") {
          if (endipv6Encountered === true) {
            endIpv6 = true;
          }
          if (!consume(buffer, address, output)) {
            break;
          }
          if (++tokenCount > 7) {
            output.error = true;
            break;
          }
          if (i > 0 && input[i - 1] === ":") {
            endipv6Encountered = true;
          }
          address.push(":");
          continue;
        } else if (cursor === "%") {
          if (!consume(buffer, address, output)) {
            break;
          }
          consume = consumeIsZone;
        } else {
          buffer.push(cursor);
          continue;
        }
      }
      if (buffer.length) {
        if (consume === consumeIsZone) {
          output.zone = buffer.join("");
        } else if (endIpv6) {
          address.push(buffer.join(""));
        } else {
          address.push(stringArrayToHexStripped(buffer));
        }
      }
      output.address = address.join("");
      return output;
    }
    __name(getIPV6, "getIPV6");
    function normalizeIPv6(host) {
      if (findToken(host, ":") < 2) {
        return { host, isIPV6: false };
      }
      const ipv6 = getIPV6(host);
      if (!ipv6.error) {
        let newHost = ipv6.address;
        let escapedHost = ipv6.address;
        if (ipv6.zone) {
          newHost += "%" + ipv6.zone;
          escapedHost += "%25" + ipv6.zone;
        }
        return { host: newHost, isIPV6: true, escapedHost };
      } else {
        return { host, isIPV6: false };
      }
    }
    __name(normalizeIPv6, "normalizeIPv6");
    function findToken(str, token) {
      let ind = 0;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === token) ind++;
      }
      return ind;
    }
    __name(findToken, "findToken");
    function removeDotSegments(path9) {
      let input = path9;
      const output = [];
      let nextSlash = -1;
      let len = 0;
      while (len = input.length) {
        if (len === 1) {
          if (input === ".") {
            break;
          } else if (input === "/") {
            output.push("/");
            break;
          } else {
            output.push(input);
            break;
          }
        } else if (len === 2) {
          if (input[0] === ".") {
            if (input[1] === ".") {
              break;
            } else if (input[1] === "/") {
              input = input.slice(2);
              continue;
            }
          } else if (input[0] === "/") {
            if (input[1] === "." || input[1] === "/") {
              output.push("/");
              break;
            }
          }
        } else if (len === 3) {
          if (input === "/..") {
            if (output.length !== 0) {
              output.pop();
            }
            output.push("/");
            break;
          }
        }
        if (input[0] === ".") {
          if (input[1] === ".") {
            if (input[2] === "/") {
              input = input.slice(3);
              continue;
            }
          } else if (input[1] === "/") {
            input = input.slice(2);
            continue;
          }
        } else if (input[0] === "/") {
          if (input[1] === ".") {
            if (input[2] === "/") {
              input = input.slice(2);
              continue;
            } else if (input[2] === ".") {
              if (input[3] === "/") {
                input = input.slice(3);
                if (output.length !== 0) {
                  output.pop();
                }
                continue;
              }
            }
          }
        }
        if ((nextSlash = input.indexOf("/", 1)) === -1) {
          output.push(input);
          break;
        } else {
          output.push(input.slice(0, nextSlash));
          input = input.slice(nextSlash);
        }
      }
      return output.join("");
    }
    __name(removeDotSegments, "removeDotSegments");
    function normalizeComponentEncoding(component, esc) {
      const func = esc !== true ? escape : unescape;
      if (component.scheme !== void 0) {
        component.scheme = func(component.scheme);
      }
      if (component.userinfo !== void 0) {
        component.userinfo = func(component.userinfo);
      }
      if (component.host !== void 0) {
        component.host = func(component.host);
      }
      if (component.path !== void 0) {
        component.path = func(component.path);
      }
      if (component.query !== void 0) {
        component.query = func(component.query);
      }
      if (component.fragment !== void 0) {
        component.fragment = func(component.fragment);
      }
      return component;
    }
    __name(normalizeComponentEncoding, "normalizeComponentEncoding");
    function recomposeAuthority(component) {
      const uriTokens = [];
      if (component.userinfo !== void 0) {
        uriTokens.push(component.userinfo);
        uriTokens.push("@");
      }
      if (component.host !== void 0) {
        let host = unescape(component.host);
        if (!isIPv4(host)) {
          const ipV6res = normalizeIPv6(host);
          if (ipV6res.isIPV6 === true) {
            host = `[${ipV6res.escapedHost}]`;
          } else {
            host = component.host;
          }
        }
        uriTokens.push(host);
      }
      if (typeof component.port === "number" || typeof component.port === "string") {
        uriTokens.push(":");
        uriTokens.push(String(component.port));
      }
      return uriTokens.length ? uriTokens.join("") : void 0;
    }
    __name(recomposeAuthority, "recomposeAuthority");
    module.exports = {
      nonSimpleDomain,
      recomposeAuthority,
      normalizeComponentEncoding,
      removeDotSegments,
      isIPv4,
      isUUID,
      normalizeIPv6,
      stringArrayToHexStripped
    };
  }
});

// node_modules/fast-uri/lib/schemes.js
var require_schemes = __commonJS({
  "node_modules/fast-uri/lib/schemes.js"(exports, module) {
    "use strict";
    var { isUUID } = require_utils();
    var URN_REG = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;
    var supportedSchemeNames = (
      /** @type {const} */
      [
        "http",
        "https",
        "ws",
        "wss",
        "urn",
        "urn:uuid"
      ]
    );
    function isValidSchemeName(name) {
      return supportedSchemeNames.indexOf(
        /** @type {*} */
        name
      ) !== -1;
    }
    __name(isValidSchemeName, "isValidSchemeName");
    function wsIsSecure(wsComponent) {
      if (wsComponent.secure === true) {
        return true;
      } else if (wsComponent.secure === false) {
        return false;
      } else if (wsComponent.scheme) {
        return wsComponent.scheme.length === 3 && (wsComponent.scheme[0] === "w" || wsComponent.scheme[0] === "W") && (wsComponent.scheme[1] === "s" || wsComponent.scheme[1] === "S") && (wsComponent.scheme[2] === "s" || wsComponent.scheme[2] === "S");
      } else {
        return false;
      }
    }
    __name(wsIsSecure, "wsIsSecure");
    function httpParse(component) {
      if (!component.host) {
        component.error = component.error || "HTTP URIs must have a host.";
      }
      return component;
    }
    __name(httpParse, "httpParse");
    function httpSerialize(component) {
      const secure = String(component.scheme).toLowerCase() === "https";
      if (component.port === (secure ? 443 : 80) || component.port === "") {
        component.port = void 0;
      }
      if (!component.path) {
        component.path = "/";
      }
      return component;
    }
    __name(httpSerialize, "httpSerialize");
    function wsParse(wsComponent) {
      wsComponent.secure = wsIsSecure(wsComponent);
      wsComponent.resourceName = (wsComponent.path || "/") + (wsComponent.query ? "?" + wsComponent.query : "");
      wsComponent.path = void 0;
      wsComponent.query = void 0;
      return wsComponent;
    }
    __name(wsParse, "wsParse");
    function wsSerialize(wsComponent) {
      if (wsComponent.port === (wsIsSecure(wsComponent) ? 443 : 80) || wsComponent.port === "") {
        wsComponent.port = void 0;
      }
      if (typeof wsComponent.secure === "boolean") {
        wsComponent.scheme = wsComponent.secure ? "wss" : "ws";
        wsComponent.secure = void 0;
      }
      if (wsComponent.resourceName) {
        const [path9, query] = wsComponent.resourceName.split("?");
        wsComponent.path = path9 && path9 !== "/" ? path9 : void 0;
        wsComponent.query = query;
        wsComponent.resourceName = void 0;
      }
      wsComponent.fragment = void 0;
      return wsComponent;
    }
    __name(wsSerialize, "wsSerialize");
    function urnParse(urnComponent, options) {
      if (!urnComponent.path) {
        urnComponent.error = "URN can not be parsed";
        return urnComponent;
      }
      const matches = urnComponent.path.match(URN_REG);
      if (matches) {
        const scheme = options.scheme || urnComponent.scheme || "urn";
        urnComponent.nid = matches[1].toLowerCase();
        urnComponent.nss = matches[2];
        const urnScheme = `${scheme}:${options.nid || urnComponent.nid}`;
        const schemeHandler = getSchemeHandler(urnScheme);
        urnComponent.path = void 0;
        if (schemeHandler) {
          urnComponent = schemeHandler.parse(urnComponent, options);
        }
      } else {
        urnComponent.error = urnComponent.error || "URN can not be parsed.";
      }
      return urnComponent;
    }
    __name(urnParse, "urnParse");
    function urnSerialize(urnComponent, options) {
      if (urnComponent.nid === void 0) {
        throw new Error("URN without nid cannot be serialized");
      }
      const scheme = options.scheme || urnComponent.scheme || "urn";
      const nid = urnComponent.nid.toLowerCase();
      const urnScheme = `${scheme}:${options.nid || nid}`;
      const schemeHandler = getSchemeHandler(urnScheme);
      if (schemeHandler) {
        urnComponent = schemeHandler.serialize(urnComponent, options);
      }
      const uriComponent = urnComponent;
      const nss = urnComponent.nss;
      uriComponent.path = `${nid || options.nid}:${nss}`;
      options.skipEscape = true;
      return uriComponent;
    }
    __name(urnSerialize, "urnSerialize");
    function urnuuidParse(urnComponent, options) {
      const uuidComponent = urnComponent;
      uuidComponent.uuid = uuidComponent.nss;
      uuidComponent.nss = void 0;
      if (!options.tolerant && (!uuidComponent.uuid || !isUUID(uuidComponent.uuid))) {
        uuidComponent.error = uuidComponent.error || "UUID is not valid.";
      }
      return uuidComponent;
    }
    __name(urnuuidParse, "urnuuidParse");
    function urnuuidSerialize(uuidComponent) {
      const urnComponent = uuidComponent;
      urnComponent.nss = (uuidComponent.uuid || "").toLowerCase();
      return urnComponent;
    }
    __name(urnuuidSerialize, "urnuuidSerialize");
    var http = (
      /** @type {SchemeHandler} */
      {
        scheme: "http",
        domainHost: true,
        parse: httpParse,
        serialize: httpSerialize
      }
    );
    var https3 = (
      /** @type {SchemeHandler} */
      {
        scheme: "https",
        domainHost: http.domainHost,
        parse: httpParse,
        serialize: httpSerialize
      }
    );
    var ws = (
      /** @type {SchemeHandler} */
      {
        scheme: "ws",
        domainHost: true,
        parse: wsParse,
        serialize: wsSerialize
      }
    );
    var wss = (
      /** @type {SchemeHandler} */
      {
        scheme: "wss",
        domainHost: ws.domainHost,
        parse: ws.parse,
        serialize: ws.serialize
      }
    );
    var urn = (
      /** @type {SchemeHandler} */
      {
        scheme: "urn",
        parse: urnParse,
        serialize: urnSerialize,
        skipNormalize: true
      }
    );
    var urnuuid = (
      /** @type {SchemeHandler} */
      {
        scheme: "urn:uuid",
        parse: urnuuidParse,
        serialize: urnuuidSerialize,
        skipNormalize: true
      }
    );
    var SCHEMES = (
      /** @type {Record<SchemeName, SchemeHandler>} */
      {
        http,
        https: https3,
        ws,
        wss,
        urn,
        "urn:uuid": urnuuid
      }
    );
    Object.setPrototypeOf(SCHEMES, null);
    function getSchemeHandler(scheme) {
      return scheme && (SCHEMES[
        /** @type {SchemeName} */
        scheme
      ] || SCHEMES[
        /** @type {SchemeName} */
        scheme.toLowerCase()
      ]) || void 0;
    }
    __name(getSchemeHandler, "getSchemeHandler");
    module.exports = {
      wsIsSecure,
      SCHEMES,
      isValidSchemeName,
      getSchemeHandler
    };
  }
});

// node_modules/fast-uri/index.js
var require_fast_uri = __commonJS({
  "node_modules/fast-uri/index.js"(exports, module) {
    "use strict";
    var { normalizeIPv6, removeDotSegments, recomposeAuthority, normalizeComponentEncoding, isIPv4, nonSimpleDomain } = require_utils();
    var { SCHEMES, getSchemeHandler } = require_schemes();
    function normalize3(uri, options) {
      if (typeof uri === "string") {
        uri = /** @type {T} */
        serialize(parse(uri, options), options);
      } else if (typeof uri === "object") {
        uri = /** @type {T} */
        parse(serialize(uri, options), options);
      }
      return uri;
    }
    __name(normalize3, "normalize");
    function resolve2(baseURI, relativeURI, options) {
      const schemelessOptions = options ? Object.assign({ scheme: "null" }, options) : { scheme: "null" };
      const resolved = resolveComponent(parse(baseURI, schemelessOptions), parse(relativeURI, schemelessOptions), schemelessOptions, true);
      schemelessOptions.skipEscape = true;
      return serialize(resolved, schemelessOptions);
    }
    __name(resolve2, "resolve");
    function resolveComponent(base, relative, options, skipNormalization) {
      const target = {};
      if (!skipNormalization) {
        base = parse(serialize(base, options), options);
        relative = parse(serialize(relative, options), options);
      }
      options = options || {};
      if (!options.tolerant && relative.scheme) {
        target.scheme = relative.scheme;
        target.userinfo = relative.userinfo;
        target.host = relative.host;
        target.port = relative.port;
        target.path = removeDotSegments(relative.path || "");
        target.query = relative.query;
      } else {
        if (relative.userinfo !== void 0 || relative.host !== void 0 || relative.port !== void 0) {
          target.userinfo = relative.userinfo;
          target.host = relative.host;
          target.port = relative.port;
          target.path = removeDotSegments(relative.path || "");
          target.query = relative.query;
        } else {
          if (!relative.path) {
            target.path = base.path;
            if (relative.query !== void 0) {
              target.query = relative.query;
            } else {
              target.query = base.query;
            }
          } else {
            if (relative.path[0] === "/") {
              target.path = removeDotSegments(relative.path);
            } else {
              if ((base.userinfo !== void 0 || base.host !== void 0 || base.port !== void 0) && !base.path) {
                target.path = "/" + relative.path;
              } else if (!base.path) {
                target.path = relative.path;
              } else {
                target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
              }
              target.path = removeDotSegments(target.path);
            }
            target.query = relative.query;
          }
          target.userinfo = base.userinfo;
          target.host = base.host;
          target.port = base.port;
        }
        target.scheme = base.scheme;
      }
      target.fragment = relative.fragment;
      return target;
    }
    __name(resolveComponent, "resolveComponent");
    function equal(uriA, uriB, options) {
      if (typeof uriA === "string") {
        uriA = unescape(uriA);
        uriA = serialize(normalizeComponentEncoding(parse(uriA, options), true), { ...options, skipEscape: true });
      } else if (typeof uriA === "object") {
        uriA = serialize(normalizeComponentEncoding(uriA, true), { ...options, skipEscape: true });
      }
      if (typeof uriB === "string") {
        uriB = unescape(uriB);
        uriB = serialize(normalizeComponentEncoding(parse(uriB, options), true), { ...options, skipEscape: true });
      } else if (typeof uriB === "object") {
        uriB = serialize(normalizeComponentEncoding(uriB, true), { ...options, skipEscape: true });
      }
      return uriA.toLowerCase() === uriB.toLowerCase();
    }
    __name(equal, "equal");
    function serialize(cmpts, opts) {
      const component = {
        host: cmpts.host,
        scheme: cmpts.scheme,
        userinfo: cmpts.userinfo,
        port: cmpts.port,
        path: cmpts.path,
        query: cmpts.query,
        nid: cmpts.nid,
        nss: cmpts.nss,
        uuid: cmpts.uuid,
        fragment: cmpts.fragment,
        reference: cmpts.reference,
        resourceName: cmpts.resourceName,
        secure: cmpts.secure,
        error: ""
      };
      const options = Object.assign({}, opts);
      const uriTokens = [];
      const schemeHandler = getSchemeHandler(options.scheme || component.scheme);
      if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(component, options);
      if (component.path !== void 0) {
        if (!options.skipEscape) {
          component.path = escape(component.path);
          if (component.scheme !== void 0) {
            component.path = component.path.split("%3A").join(":");
          }
        } else {
          component.path = unescape(component.path);
        }
      }
      if (options.reference !== "suffix" && component.scheme) {
        uriTokens.push(component.scheme, ":");
      }
      const authority = recomposeAuthority(component);
      if (authority !== void 0) {
        if (options.reference !== "suffix") {
          uriTokens.push("//");
        }
        uriTokens.push(authority);
        if (component.path && component.path[0] !== "/") {
          uriTokens.push("/");
        }
      }
      if (component.path !== void 0) {
        let s = component.path;
        if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
          s = removeDotSegments(s);
        }
        if (authority === void 0 && s[0] === "/" && s[1] === "/") {
          s = "/%2F" + s.slice(2);
        }
        uriTokens.push(s);
      }
      if (component.query !== void 0) {
        uriTokens.push("?", component.query);
      }
      if (component.fragment !== void 0) {
        uriTokens.push("#", component.fragment);
      }
      return uriTokens.join("");
    }
    __name(serialize, "serialize");
    var URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
    function parse(uri, opts) {
      const options = Object.assign({}, opts);
      const parsed = {
        scheme: void 0,
        userinfo: void 0,
        host: "",
        port: void 0,
        path: "",
        query: void 0,
        fragment: void 0
      };
      let isIP = false;
      if (options.reference === "suffix") {
        if (options.scheme) {
          uri = options.scheme + ":" + uri;
        } else {
          uri = "//" + uri;
        }
      }
      const matches = uri.match(URI_PARSE);
      if (matches) {
        parsed.scheme = matches[1];
        parsed.userinfo = matches[3];
        parsed.host = matches[4];
        parsed.port = parseInt(matches[5], 10);
        parsed.path = matches[6] || "";
        parsed.query = matches[7];
        parsed.fragment = matches[8];
        if (isNaN(parsed.port)) {
          parsed.port = matches[5];
        }
        if (parsed.host) {
          const ipv4result = isIPv4(parsed.host);
          if (ipv4result === false) {
            const ipv6result = normalizeIPv6(parsed.host);
            parsed.host = ipv6result.host.toLowerCase();
            isIP = ipv6result.isIPV6;
          } else {
            isIP = true;
          }
        }
        if (parsed.scheme === void 0 && parsed.userinfo === void 0 && parsed.host === void 0 && parsed.port === void 0 && parsed.query === void 0 && !parsed.path) {
          parsed.reference = "same-document";
        } else if (parsed.scheme === void 0) {
          parsed.reference = "relative";
        } else if (parsed.fragment === void 0) {
          parsed.reference = "absolute";
        } else {
          parsed.reference = "uri";
        }
        if (options.reference && options.reference !== "suffix" && options.reference !== parsed.reference) {
          parsed.error = parsed.error || "URI is not a " + options.reference + " reference.";
        }
        const schemeHandler = getSchemeHandler(options.scheme || parsed.scheme);
        if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
          if (parsed.host && (options.domainHost || schemeHandler && schemeHandler.domainHost) && isIP === false && nonSimpleDomain(parsed.host)) {
            try {
              parsed.host = URL.domainToASCII(parsed.host.toLowerCase());
            } catch (e) {
              parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e;
            }
          }
        }
        if (!schemeHandler || schemeHandler && !schemeHandler.skipNormalize) {
          if (uri.indexOf("%") !== -1) {
            if (parsed.scheme !== void 0) {
              parsed.scheme = unescape(parsed.scheme);
            }
            if (parsed.host !== void 0) {
              parsed.host = unescape(parsed.host);
            }
          }
          if (parsed.path) {
            parsed.path = escape(unescape(parsed.path));
          }
          if (parsed.fragment) {
            parsed.fragment = encodeURI(decodeURIComponent(parsed.fragment));
          }
        }
        if (schemeHandler && schemeHandler.parse) {
          schemeHandler.parse(parsed, options);
        }
      } else {
        parsed.error = parsed.error || "URI can not be parsed.";
      }
      return parsed;
    }
    __name(parse, "parse");
    var fastUri = {
      SCHEMES,
      normalize: normalize3,
      resolve: resolve2,
      resolveComponent,
      equal,
      serialize,
      parse
    };
    module.exports = fastUri;
    module.exports.default = fastUri;
    module.exports.fastUri = fastUri;
  }
});

// node_modules/ajv/dist/runtime/uri.js
var require_uri = __commonJS({
  "node_modules/ajv/dist/runtime/uri.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var uri = require_fast_uri();
    uri.code = 'require("ajv/dist/runtime/uri").default';
    exports.default = uri;
  }
});

// node_modules/ajv/dist/core.js
var require_core = __commonJS({
  "node_modules/ajv/dist/core.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = void 0;
    var validate_1 = require_validate();
    Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return validate_1.KeywordCxt;
    }, "get") });
    var codegen_1 = require_codegen();
    Object.defineProperty(exports, "_", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return codegen_1._;
    }, "get") });
    Object.defineProperty(exports, "str", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return codegen_1.str;
    }, "get") });
    Object.defineProperty(exports, "stringify", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return codegen_1.stringify;
    }, "get") });
    Object.defineProperty(exports, "nil", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return codegen_1.nil;
    }, "get") });
    Object.defineProperty(exports, "Name", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return codegen_1.Name;
    }, "get") });
    Object.defineProperty(exports, "CodeGen", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return codegen_1.CodeGen;
    }, "get") });
    var validation_error_1 = require_validation_error();
    var ref_error_1 = require_ref_error();
    var rules_1 = require_rules();
    var compile_1 = require_compile();
    var codegen_2 = require_codegen();
    var resolve_1 = require_resolve();
    var dataType_1 = require_dataType();
    var util_1 = require_util();
    var $dataRefSchema = require_data();
    var uri_1 = require_uri();
    var defaultRegExp = /* @__PURE__ */ __name((str, flags) => new RegExp(str, flags), "defaultRegExp");
    defaultRegExp.code = "new RegExp";
    var META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes"];
    var EXT_SCOPE_NAMES = /* @__PURE__ */ new Set([
      "validate",
      "serialize",
      "parse",
      "wrapper",
      "root",
      "schema",
      "keyword",
      "pattern",
      "formats",
      "validate$data",
      "func",
      "obj",
      "Error"
    ]);
    var removedOptions = {
      errorDataPath: "",
      format: "`validateFormats: false` can be used instead.",
      nullable: '"nullable" keyword is supported by default.',
      jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
      extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
      missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
      processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
      sourceCode: "Use option `code: {source: true}`",
      strictDefaults: "It is default now, see option `strict`.",
      strictKeywords: "It is default now, see option `strict`.",
      uniqueItems: '"uniqueItems" keyword is always validated.',
      unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
      cache: "Map is used as cache, schema object as key.",
      serialize: "Map is used as cache, schema object as key.",
      ajvErrors: "It is default now."
    };
    var deprecatedOptions = {
      ignoreKeywordsWithRef: "",
      jsPropertySyntax: "",
      unicode: '"minLength"/"maxLength" account for unicode characters by default.'
    };
    var MAX_EXPRESSION = 200;
    function requiredOptions(o) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
      const s = o.strict;
      const _optz = (_a = o.code) === null || _a === void 0 ? void 0 : _a.optimize;
      const optimize = _optz === true || _optz === void 0 ? 1 : _optz || 0;
      const regExp = (_c = (_b = o.code) === null || _b === void 0 ? void 0 : _b.regExp) !== null && _c !== void 0 ? _c : defaultRegExp;
      const uriResolver = (_d = o.uriResolver) !== null && _d !== void 0 ? _d : uri_1.default;
      return {
        strictSchema: (_f = (_e = o.strictSchema) !== null && _e !== void 0 ? _e : s) !== null && _f !== void 0 ? _f : true,
        strictNumbers: (_h = (_g = o.strictNumbers) !== null && _g !== void 0 ? _g : s) !== null && _h !== void 0 ? _h : true,
        strictTypes: (_k = (_j = o.strictTypes) !== null && _j !== void 0 ? _j : s) !== null && _k !== void 0 ? _k : "log",
        strictTuples: (_m = (_l = o.strictTuples) !== null && _l !== void 0 ? _l : s) !== null && _m !== void 0 ? _m : "log",
        strictRequired: (_p = (_o = o.strictRequired) !== null && _o !== void 0 ? _o : s) !== null && _p !== void 0 ? _p : false,
        code: o.code ? { ...o.code, optimize, regExp } : { optimize, regExp },
        loopRequired: (_q = o.loopRequired) !== null && _q !== void 0 ? _q : MAX_EXPRESSION,
        loopEnum: (_r = o.loopEnum) !== null && _r !== void 0 ? _r : MAX_EXPRESSION,
        meta: (_s = o.meta) !== null && _s !== void 0 ? _s : true,
        messages: (_t = o.messages) !== null && _t !== void 0 ? _t : true,
        inlineRefs: (_u = o.inlineRefs) !== null && _u !== void 0 ? _u : true,
        schemaId: (_v = o.schemaId) !== null && _v !== void 0 ? _v : "$id",
        addUsedSchema: (_w = o.addUsedSchema) !== null && _w !== void 0 ? _w : true,
        validateSchema: (_x = o.validateSchema) !== null && _x !== void 0 ? _x : true,
        validateFormats: (_y = o.validateFormats) !== null && _y !== void 0 ? _y : true,
        unicodeRegExp: (_z = o.unicodeRegExp) !== null && _z !== void 0 ? _z : true,
        int32range: (_0 = o.int32range) !== null && _0 !== void 0 ? _0 : true,
        uriResolver
      };
    }
    __name(requiredOptions, "requiredOptions");
    var Ajv2 = class {
      static {
        __name(this, "Ajv");
      }
      constructor(opts = {}) {
        this.schemas = {};
        this.refs = {};
        this.formats = {};
        this._compilations = /* @__PURE__ */ new Set();
        this._loading = {};
        this._cache = /* @__PURE__ */ new Map();
        opts = this.opts = { ...opts, ...requiredOptions(opts) };
        const { es5, lines } = this.opts.code;
        this.scope = new codegen_2.ValueScope({ scope: {}, prefixes: EXT_SCOPE_NAMES, es5, lines });
        this.logger = getLogger(opts.logger);
        const formatOpt = opts.validateFormats;
        opts.validateFormats = false;
        this.RULES = (0, rules_1.getRules)();
        checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED");
        checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn");
        this._metaOpts = getMetaSchemaOptions.call(this);
        if (opts.formats)
          addInitialFormats.call(this);
        this._addVocabularies();
        this._addDefaultMetaSchema();
        if (opts.keywords)
          addInitialKeywords.call(this, opts.keywords);
        if (typeof opts.meta == "object")
          this.addMetaSchema(opts.meta);
        addInitialSchemas.call(this);
        opts.validateFormats = formatOpt;
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        const { $data, meta, schemaId } = this.opts;
        let _dataRefSchema = $dataRefSchema;
        if (schemaId === "id") {
          _dataRefSchema = { ...$dataRefSchema };
          _dataRefSchema.id = _dataRefSchema.$id;
          delete _dataRefSchema.$id;
        }
        if (meta && $data)
          this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], false);
      }
      defaultMeta() {
        const { meta, schemaId } = this.opts;
        return this.opts.defaultMeta = typeof meta == "object" ? meta[schemaId] || meta : void 0;
      }
      validate(schemaKeyRef, data) {
        let v;
        if (typeof schemaKeyRef == "string") {
          v = this.getSchema(schemaKeyRef);
          if (!v)
            throw new Error(`no schema with key or ref "${schemaKeyRef}"`);
        } else {
          v = this.compile(schemaKeyRef);
        }
        const valid = v(data);
        if (!("$async" in v))
          this.errors = v.errors;
        return valid;
      }
      compile(schema, _meta) {
        const sch = this._addSchema(schema, _meta);
        return sch.validate || this._compileSchemaEnv(sch);
      }
      compileAsync(schema, meta) {
        if (typeof this.opts.loadSchema != "function") {
          throw new Error("options.loadSchema should be a function");
        }
        const { loadSchema } = this.opts;
        return runCompileAsync.call(this, schema, meta);
        async function runCompileAsync(_schema, _meta) {
          await loadMetaSchema.call(this, _schema.$schema);
          const sch = this._addSchema(_schema, _meta);
          return sch.validate || _compileAsync.call(this, sch);
        }
        __name(runCompileAsync, "runCompileAsync");
        async function loadMetaSchema($ref) {
          if ($ref && !this.getSchema($ref)) {
            await runCompileAsync.call(this, { $ref }, true);
          }
        }
        __name(loadMetaSchema, "loadMetaSchema");
        async function _compileAsync(sch) {
          try {
            return this._compileSchemaEnv(sch);
          } catch (e) {
            if (!(e instanceof ref_error_1.default))
              throw e;
            checkLoaded.call(this, e);
            await loadMissingSchema.call(this, e.missingSchema);
            return _compileAsync.call(this, sch);
          }
        }
        __name(_compileAsync, "_compileAsync");
        function checkLoaded({ missingSchema: ref, missingRef }) {
          if (this.refs[ref]) {
            throw new Error(`AnySchema ${ref} is loaded but ${missingRef} cannot be resolved`);
          }
        }
        __name(checkLoaded, "checkLoaded");
        async function loadMissingSchema(ref) {
          const _schema = await _loadSchema.call(this, ref);
          if (!this.refs[ref])
            await loadMetaSchema.call(this, _schema.$schema);
          if (!this.refs[ref])
            this.addSchema(_schema, ref, meta);
        }
        __name(loadMissingSchema, "loadMissingSchema");
        async function _loadSchema(ref) {
          const p = this._loading[ref];
          if (p)
            return p;
          try {
            return await (this._loading[ref] = loadSchema(ref));
          } finally {
            delete this._loading[ref];
          }
        }
        __name(_loadSchema, "_loadSchema");
      }
      // Adds schema to the instance
      addSchema(schema, key, _meta, _validateSchema = this.opts.validateSchema) {
        if (Array.isArray(schema)) {
          for (const sch of schema)
            this.addSchema(sch, void 0, _meta, _validateSchema);
          return this;
        }
        let id;
        if (typeof schema === "object") {
          const { schemaId } = this.opts;
          id = schema[schemaId];
          if (id !== void 0 && typeof id != "string") {
            throw new Error(`schema ${schemaId} must be string`);
          }
        }
        key = (0, resolve_1.normalizeId)(key || id);
        this._checkUnique(key);
        this.schemas[key] = this._addSchema(schema, _meta, key, _validateSchema, true);
        return this;
      }
      // Add schema that will be used to validate other schemas
      // options in META_IGNORE_OPTIONS are alway set to false
      addMetaSchema(schema, key, _validateSchema = this.opts.validateSchema) {
        this.addSchema(schema, key, true, _validateSchema);
        return this;
      }
      //  Validate schema against its meta-schema
      validateSchema(schema, throwOrLogError) {
        if (typeof schema == "boolean")
          return true;
        let $schema;
        $schema = schema.$schema;
        if ($schema !== void 0 && typeof $schema != "string") {
          throw new Error("$schema must be a string");
        }
        $schema = $schema || this.opts.defaultMeta || this.defaultMeta();
        if (!$schema) {
          this.logger.warn("meta-schema not available");
          this.errors = null;
          return true;
        }
        const valid = this.validate($schema, schema);
        if (!valid && throwOrLogError) {
          const message = "schema is invalid: " + this.errorsText();
          if (this.opts.validateSchema === "log")
            this.logger.error(message);
          else
            throw new Error(message);
        }
        return valid;
      }
      // Get compiled schema by `key` or `ref`.
      // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
      getSchema(keyRef) {
        let sch;
        while (typeof (sch = getSchEnv.call(this, keyRef)) == "string")
          keyRef = sch;
        if (sch === void 0) {
          const { schemaId } = this.opts;
          const root = new compile_1.SchemaEnv({ schema: {}, schemaId });
          sch = compile_1.resolveSchema.call(this, root, keyRef);
          if (!sch)
            return;
          this.refs[keyRef] = sch;
        }
        return sch.validate || this._compileSchemaEnv(sch);
      }
      // Remove cached schema(s).
      // If no parameter is passed all schemas but meta-schemas are removed.
      // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
      // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
      removeSchema(schemaKeyRef) {
        if (schemaKeyRef instanceof RegExp) {
          this._removeAllSchemas(this.schemas, schemaKeyRef);
          this._removeAllSchemas(this.refs, schemaKeyRef);
          return this;
        }
        switch (typeof schemaKeyRef) {
          case "undefined":
            this._removeAllSchemas(this.schemas);
            this._removeAllSchemas(this.refs);
            this._cache.clear();
            return this;
          case "string": {
            const sch = getSchEnv.call(this, schemaKeyRef);
            if (typeof sch == "object")
              this._cache.delete(sch.schema);
            delete this.schemas[schemaKeyRef];
            delete this.refs[schemaKeyRef];
            return this;
          }
          case "object": {
            const cacheKey = schemaKeyRef;
            this._cache.delete(cacheKey);
            let id = schemaKeyRef[this.opts.schemaId];
            if (id) {
              id = (0, resolve_1.normalizeId)(id);
              delete this.schemas[id];
              delete this.refs[id];
            }
            return this;
          }
          default:
            throw new Error("ajv.removeSchema: invalid parameter");
        }
      }
      // add "vocabulary" - a collection of keywords
      addVocabulary(definitions) {
        for (const def of definitions)
          this.addKeyword(def);
        return this;
      }
      addKeyword(kwdOrDef, def) {
        let keyword;
        if (typeof kwdOrDef == "string") {
          keyword = kwdOrDef;
          if (typeof def == "object") {
            this.logger.warn("these parameters are deprecated, see docs for addKeyword");
            def.keyword = keyword;
          }
        } else if (typeof kwdOrDef == "object" && def === void 0) {
          def = kwdOrDef;
          keyword = def.keyword;
          if (Array.isArray(keyword) && !keyword.length) {
            throw new Error("addKeywords: keyword must be string or non-empty array");
          }
        } else {
          throw new Error("invalid addKeywords parameters");
        }
        checkKeyword.call(this, keyword, def);
        if (!def) {
          (0, util_1.eachItem)(keyword, (kwd) => addRule.call(this, kwd));
          return this;
        }
        keywordMetaschema.call(this, def);
        const definition = {
          ...def,
          type: (0, dataType_1.getJSONTypes)(def.type),
          schemaType: (0, dataType_1.getJSONTypes)(def.schemaType)
        };
        (0, util_1.eachItem)(keyword, definition.type.length === 0 ? (k) => addRule.call(this, k, definition) : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t)));
        return this;
      }
      getKeyword(keyword) {
        const rule = this.RULES.all[keyword];
        return typeof rule == "object" ? rule.definition : !!rule;
      }
      // Remove keyword
      removeKeyword(keyword) {
        const { RULES } = this;
        delete RULES.keywords[keyword];
        delete RULES.all[keyword];
        for (const group of RULES.rules) {
          const i = group.rules.findIndex((rule) => rule.keyword === keyword);
          if (i >= 0)
            group.rules.splice(i, 1);
        }
        return this;
      }
      // Add format
      addFormat(name, format) {
        if (typeof format == "string")
          format = new RegExp(format);
        this.formats[name] = format;
        return this;
      }
      errorsText(errors = this.errors, { separator = ", ", dataVar = "data" } = {}) {
        if (!errors || errors.length === 0)
          return "No errors";
        return errors.map((e) => `${dataVar}${e.instancePath} ${e.message}`).reduce((text, msg) => text + separator + msg);
      }
      $dataMetaSchema(metaSchema, keywordsJsonPointers) {
        const rules = this.RULES.all;
        metaSchema = JSON.parse(JSON.stringify(metaSchema));
        for (const jsonPointer of keywordsJsonPointers) {
          const segments = jsonPointer.split("/").slice(1);
          let keywords = metaSchema;
          for (const seg of segments)
            keywords = keywords[seg];
          for (const key in rules) {
            const rule = rules[key];
            if (typeof rule != "object")
              continue;
            const { $data } = rule.definition;
            const schema = keywords[key];
            if ($data && schema)
              keywords[key] = schemaOrData(schema);
          }
        }
        return metaSchema;
      }
      _removeAllSchemas(schemas, regex) {
        for (const keyRef in schemas) {
          const sch = schemas[keyRef];
          if (!regex || regex.test(keyRef)) {
            if (typeof sch == "string") {
              delete schemas[keyRef];
            } else if (sch && !sch.meta) {
              this._cache.delete(sch.schema);
              delete schemas[keyRef];
            }
          }
        }
      }
      _addSchema(schema, meta, baseId, validateSchema = this.opts.validateSchema, addSchema = this.opts.addUsedSchema) {
        let id;
        const { schemaId } = this.opts;
        if (typeof schema == "object") {
          id = schema[schemaId];
        } else {
          if (this.opts.jtd)
            throw new Error("schema must be object");
          else if (typeof schema != "boolean")
            throw new Error("schema must be object or boolean");
        }
        let sch = this._cache.get(schema);
        if (sch !== void 0)
          return sch;
        baseId = (0, resolve_1.normalizeId)(id || baseId);
        const localRefs = resolve_1.getSchemaRefs.call(this, schema, baseId);
        sch = new compile_1.SchemaEnv({ schema, schemaId, meta, baseId, localRefs });
        this._cache.set(sch.schema, sch);
        if (addSchema && !baseId.startsWith("#")) {
          if (baseId)
            this._checkUnique(baseId);
          this.refs[baseId] = sch;
        }
        if (validateSchema)
          this.validateSchema(schema, true);
        return sch;
      }
      _checkUnique(id) {
        if (this.schemas[id] || this.refs[id]) {
          throw new Error(`schema with key or id "${id}" already exists`);
        }
      }
      _compileSchemaEnv(sch) {
        if (sch.meta)
          this._compileMetaSchema(sch);
        else
          compile_1.compileSchema.call(this, sch);
        if (!sch.validate)
          throw new Error("ajv implementation error");
        return sch.validate;
      }
      _compileMetaSchema(sch) {
        const currentOpts = this.opts;
        this.opts = this._metaOpts;
        try {
          compile_1.compileSchema.call(this, sch);
        } finally {
          this.opts = currentOpts;
        }
      }
    };
    Ajv2.ValidationError = validation_error_1.default;
    Ajv2.MissingRefError = ref_error_1.default;
    exports.default = Ajv2;
    function checkOptions(checkOpts, options, msg, log = "error") {
      for (const key in checkOpts) {
        const opt = key;
        if (opt in options)
          this.logger[log](`${msg}: option ${key}. ${checkOpts[opt]}`);
      }
    }
    __name(checkOptions, "checkOptions");
    function getSchEnv(keyRef) {
      keyRef = (0, resolve_1.normalizeId)(keyRef);
      return this.schemas[keyRef] || this.refs[keyRef];
    }
    __name(getSchEnv, "getSchEnv");
    function addInitialSchemas() {
      const optsSchemas = this.opts.schemas;
      if (!optsSchemas)
        return;
      if (Array.isArray(optsSchemas))
        this.addSchema(optsSchemas);
      else
        for (const key in optsSchemas)
          this.addSchema(optsSchemas[key], key);
    }
    __name(addInitialSchemas, "addInitialSchemas");
    function addInitialFormats() {
      for (const name in this.opts.formats) {
        const format = this.opts.formats[name];
        if (format)
          this.addFormat(name, format);
      }
    }
    __name(addInitialFormats, "addInitialFormats");
    function addInitialKeywords(defs) {
      if (Array.isArray(defs)) {
        this.addVocabulary(defs);
        return;
      }
      this.logger.warn("keywords option as map is deprecated, pass array");
      for (const keyword in defs) {
        const def = defs[keyword];
        if (!def.keyword)
          def.keyword = keyword;
        this.addKeyword(def);
      }
    }
    __name(addInitialKeywords, "addInitialKeywords");
    function getMetaSchemaOptions() {
      const metaOpts = { ...this.opts };
      for (const opt of META_IGNORE_OPTIONS)
        delete metaOpts[opt];
      return metaOpts;
    }
    __name(getMetaSchemaOptions, "getMetaSchemaOptions");
    var noLogs = { log() {
    }, warn() {
    }, error() {
    } };
    function getLogger(logger) {
      if (logger === false)
        return noLogs;
      if (logger === void 0)
        return console;
      if (logger.log && logger.warn && logger.error)
        return logger;
      throw new Error("logger must implement log, warn and error methods");
    }
    __name(getLogger, "getLogger");
    var KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i;
    function checkKeyword(keyword, def) {
      const { RULES } = this;
      (0, util_1.eachItem)(keyword, (kwd) => {
        if (RULES.keywords[kwd])
          throw new Error(`Keyword ${kwd} is already defined`);
        if (!KEYWORD_NAME.test(kwd))
          throw new Error(`Keyword ${kwd} has invalid name`);
      });
      if (!def)
        return;
      if (def.$data && !("code" in def || "validate" in def)) {
        throw new Error('$data keyword must have "code" or "validate" function');
      }
    }
    __name(checkKeyword, "checkKeyword");
    function addRule(keyword, definition, dataType) {
      var _a;
      const post = definition === null || definition === void 0 ? void 0 : definition.post;
      if (dataType && post)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES } = this;
      let ruleGroup = post ? RULES.post : RULES.rules.find(({ type: t }) => t === dataType);
      if (!ruleGroup) {
        ruleGroup = { type: dataType, rules: [] };
        RULES.rules.push(ruleGroup);
      }
      RULES.keywords[keyword] = true;
      if (!definition)
        return;
      const rule = {
        keyword,
        definition: {
          ...definition,
          type: (0, dataType_1.getJSONTypes)(definition.type),
          schemaType: (0, dataType_1.getJSONTypes)(definition.schemaType)
        }
      };
      if (definition.before)
        addBeforeRule.call(this, ruleGroup, rule, definition.before);
      else
        ruleGroup.rules.push(rule);
      RULES.all[keyword] = rule;
      (_a = definition.implements) === null || _a === void 0 ? void 0 : _a.forEach((kwd) => this.addKeyword(kwd));
    }
    __name(addRule, "addRule");
    function addBeforeRule(ruleGroup, rule, before) {
      const i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before);
      if (i >= 0) {
        ruleGroup.rules.splice(i, 0, rule);
      } else {
        ruleGroup.rules.push(rule);
        this.logger.warn(`rule ${before} is not defined`);
      }
    }
    __name(addBeforeRule, "addBeforeRule");
    function keywordMetaschema(def) {
      let { metaSchema } = def;
      if (metaSchema === void 0)
        return;
      if (def.$data && this.opts.$data)
        metaSchema = schemaOrData(metaSchema);
      def.validateSchema = this.compile(metaSchema, true);
    }
    __name(keywordMetaschema, "keywordMetaschema");
    var $dataRef = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function schemaOrData(schema) {
      return { anyOf: [schema, $dataRef] };
    }
    __name(schemaOrData, "schemaOrData");
  }
});

// node_modules/ajv/dist/vocabularies/core/id.js
var require_id = __commonJS({
  "node_modules/ajv/dist/vocabularies/core/id.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var def = {
      keyword: "id",
      code() {
        throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/core/ref.js
var require_ref = __commonJS({
  "node_modules/ajv/dist/vocabularies/core/ref.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.callRef = exports.getValidate = void 0;
    var ref_error_1 = require_ref_error();
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var compile_1 = require_compile();
    var util_1 = require_util();
    var def = {
      keyword: "$ref",
      schemaType: "string",
      code(cxt) {
        const { gen, schema: $ref, it } = cxt;
        const { baseId, schemaEnv: env, validateName, opts, self } = it;
        const { root } = env;
        if (($ref === "#" || $ref === "#/") && baseId === root.baseId)
          return callRootRef();
        const schOrEnv = compile_1.resolveRef.call(self, root, baseId, $ref);
        if (schOrEnv === void 0)
          throw new ref_error_1.default(it.opts.uriResolver, baseId, $ref);
        if (schOrEnv instanceof compile_1.SchemaEnv)
          return callValidate(schOrEnv);
        return inlineRefSchema(schOrEnv);
        function callRootRef() {
          if (env === root)
            return callRef(cxt, validateName, env, env.$async);
          const rootName = gen.scopeValue("root", { ref: root });
          return callRef(cxt, (0, codegen_1._)`${rootName}.validate`, root, root.$async);
        }
        __name(callRootRef, "callRootRef");
        function callValidate(sch) {
          const v = getValidate(cxt, sch);
          callRef(cxt, v, sch, sch.$async);
        }
        __name(callValidate, "callValidate");
        function inlineRefSchema(sch) {
          const schName = gen.scopeValue("schema", opts.code.source === true ? { ref: sch, code: (0, codegen_1.stringify)(sch) } : { ref: sch });
          const valid = gen.name("valid");
          const schCxt = cxt.subschema({
            schema: sch,
            dataTypes: [],
            schemaPath: codegen_1.nil,
            topSchemaRef: schName,
            errSchemaPath: $ref
          }, valid);
          cxt.mergeEvaluated(schCxt);
          cxt.ok(valid);
        }
        __name(inlineRefSchema, "inlineRefSchema");
      }
    };
    function getValidate(cxt, sch) {
      const { gen } = cxt;
      return sch.validate ? gen.scopeValue("validate", { ref: sch.validate }) : (0, codegen_1._)`${gen.scopeValue("wrapper", { ref: sch })}.validate`;
    }
    __name(getValidate, "getValidate");
    exports.getValidate = getValidate;
    function callRef(cxt, v, sch, $async) {
      const { gen, it } = cxt;
      const { allErrors, schemaEnv: env, opts } = it;
      const passCxt = opts.passContext ? names_1.default.this : codegen_1.nil;
      if ($async)
        callAsyncRef();
      else
        callSyncRef();
      function callAsyncRef() {
        if (!env.$async)
          throw new Error("async schema referenced by sync schema");
        const valid = gen.let("valid");
        gen.try(() => {
          gen.code((0, codegen_1._)`await ${(0, code_1.callValidateCode)(cxt, v, passCxt)}`);
          addEvaluatedFrom(v);
          if (!allErrors)
            gen.assign(valid, true);
        }, (e) => {
          gen.if((0, codegen_1._)`!(${e} instanceof ${it.ValidationError})`, () => gen.throw(e));
          addErrorsFrom(e);
          if (!allErrors)
            gen.assign(valid, false);
        });
        cxt.ok(valid);
      }
      __name(callAsyncRef, "callAsyncRef");
      function callSyncRef() {
        cxt.result((0, code_1.callValidateCode)(cxt, v, passCxt), () => addEvaluatedFrom(v), () => addErrorsFrom(v));
      }
      __name(callSyncRef, "callSyncRef");
      function addErrorsFrom(source) {
        const errs = (0, codegen_1._)`${source}.errors`;
        gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`);
        gen.assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
      }
      __name(addErrorsFrom, "addErrorsFrom");
      function addEvaluatedFrom(source) {
        var _a;
        if (!it.opts.unevaluated)
          return;
        const schEvaluated = (_a = sch === null || sch === void 0 ? void 0 : sch.validate) === null || _a === void 0 ? void 0 : _a.evaluated;
        if (it.props !== true) {
          if (schEvaluated && !schEvaluated.dynamicProps) {
            if (schEvaluated.props !== void 0) {
              it.props = util_1.mergeEvaluated.props(gen, schEvaluated.props, it.props);
            }
          } else {
            const props = gen.var("props", (0, codegen_1._)`${source}.evaluated.props`);
            it.props = util_1.mergeEvaluated.props(gen, props, it.props, codegen_1.Name);
          }
        }
        if (it.items !== true) {
          if (schEvaluated && !schEvaluated.dynamicItems) {
            if (schEvaluated.items !== void 0) {
              it.items = util_1.mergeEvaluated.items(gen, schEvaluated.items, it.items);
            }
          } else {
            const items = gen.var("items", (0, codegen_1._)`${source}.evaluated.items`);
            it.items = util_1.mergeEvaluated.items(gen, items, it.items, codegen_1.Name);
          }
        }
      }
      __name(addEvaluatedFrom, "addEvaluatedFrom");
    }
    __name(callRef, "callRef");
    exports.callRef = callRef;
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/core/index.js
var require_core2 = __commonJS({
  "node_modules/ajv/dist/vocabularies/core/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var id_1 = require_id();
    var ref_1 = require_ref();
    var core = [
      "$schema",
      "$id",
      "$defs",
      "$vocabulary",
      { keyword: "$comment" },
      "definitions",
      id_1.default,
      ref_1.default
    ];
    exports.default = core;
  }
});

// node_modules/ajv/dist/vocabularies/validation/limitNumber.js
var require_limitNumber = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/limitNumber.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var ops = codegen_1.operators;
    var KWDs = {
      maximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
      minimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
      exclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
      exclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
    };
    var error = {
      message: /* @__PURE__ */ __name(({ keyword, schemaCode }) => (0, codegen_1.str)`must be ${KWDs[keyword].okStr} ${schemaCode}`, "message"),
      params: /* @__PURE__ */ __name(({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`, "params")
    };
    var def = {
      keyword: Object.keys(KWDs),
      type: "number",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        cxt.fail$data((0, codegen_1._)`${data} ${KWDs[keyword].fail} ${schemaCode} || isNaN(${data})`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/multipleOf.js
var require_multipleOf = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/multipleOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error = {
      message: /* @__PURE__ */ __name(({ schemaCode }) => (0, codegen_1.str)`must be multiple of ${schemaCode}`, "message"),
      params: /* @__PURE__ */ __name(({ schemaCode }) => (0, codegen_1._)`{multipleOf: ${schemaCode}}`, "params")
    };
    var def = {
      keyword: "multipleOf",
      type: "number",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, schemaCode, it } = cxt;
        const prec = it.opts.multipleOfPrecision;
        const res = gen.let("res");
        const invalid = prec ? (0, codegen_1._)`Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}` : (0, codegen_1._)`${res} !== parseInt(${res})`;
        cxt.fail$data((0, codegen_1._)`(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS({
  "node_modules/ajv/dist/runtime/ucs2length.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ucs2length(str) {
      const len = str.length;
      let length = 0;
      let pos = 0;
      let value;
      while (pos < len) {
        length++;
        value = str.charCodeAt(pos++);
        if (value >= 55296 && value <= 56319 && pos < len) {
          value = str.charCodeAt(pos);
          if ((value & 64512) === 56320)
            pos++;
        }
      }
      return length;
    }
    __name(ucs2length, "ucs2length");
    exports.default = ucs2length;
    ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
  }
});

// node_modules/ajv/dist/vocabularies/validation/limitLength.js
var require_limitLength = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/limitLength.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var ucs2length_1 = require_ucs2length();
    var error = {
      message({ keyword, schemaCode }) {
        const comp = keyword === "maxLength" ? "more" : "fewer";
        return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} characters`;
      },
      params: /* @__PURE__ */ __name(({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`, "params")
    };
    var def = {
      keyword: ["maxLength", "minLength"],
      type: "string",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { keyword, data, schemaCode, it } = cxt;
        const op = keyword === "maxLength" ? codegen_1.operators.GT : codegen_1.operators.LT;
        const len = it.opts.unicode === false ? (0, codegen_1._)`${data}.length` : (0, codegen_1._)`${(0, util_1.useFunc)(cxt.gen, ucs2length_1.default)}(${data})`;
        cxt.fail$data((0, codegen_1._)`${len} ${op} ${schemaCode}`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/pattern.js
var require_pattern = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/pattern.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var error = {
      message: /* @__PURE__ */ __name(({ schemaCode }) => (0, codegen_1.str)`must match pattern "${schemaCode}"`, "message"),
      params: /* @__PURE__ */ __name(({ schemaCode }) => (0, codegen_1._)`{pattern: ${schemaCode}}`, "params")
    };
    var def = {
      keyword: "pattern",
      type: "string",
      schemaType: "string",
      $data: true,
      error,
      code(cxt) {
        const { data, $data, schema, schemaCode, it } = cxt;
        const u = it.opts.unicodeRegExp ? "u" : "";
        const regExp = $data ? (0, codegen_1._)`(new RegExp(${schemaCode}, ${u}))` : (0, code_1.usePattern)(cxt, schema);
        cxt.fail$data((0, codegen_1._)`!${regExp}.test(${data})`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/limitProperties.js
var require_limitProperties = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/limitProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error = {
      message({ keyword, schemaCode }) {
        const comp = keyword === "maxProperties" ? "more" : "fewer";
        return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} properties`;
      },
      params: /* @__PURE__ */ __name(({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`, "params")
    };
    var def = {
      keyword: ["maxProperties", "minProperties"],
      type: "object",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        const op = keyword === "maxProperties" ? codegen_1.operators.GT : codegen_1.operators.LT;
        cxt.fail$data((0, codegen_1._)`Object.keys(${data}).length ${op} ${schemaCode}`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/required.js
var require_required = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/required.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: /* @__PURE__ */ __name(({ params: { missingProperty } }) => (0, codegen_1.str)`must have required property '${missingProperty}'`, "message"),
      params: /* @__PURE__ */ __name(({ params: { missingProperty } }) => (0, codegen_1._)`{missingProperty: ${missingProperty}}`, "params")
    };
    var def = {
      keyword: "required",
      type: "object",
      schemaType: "array",
      $data: true,
      error,
      code(cxt) {
        const { gen, schema, schemaCode, data, $data, it } = cxt;
        const { opts } = it;
        if (!$data && schema.length === 0)
          return;
        const useLoop = schema.length >= opts.loopRequired;
        if (it.allErrors)
          allErrorsMode();
        else
          exitOnErrorMode();
        if (opts.strictRequired) {
          const props = cxt.parentSchema.properties;
          const { definedProperties } = cxt.it;
          for (const requiredKey of schema) {
            if ((props === null || props === void 0 ? void 0 : props[requiredKey]) === void 0 && !definedProperties.has(requiredKey)) {
              const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
              const msg = `required property "${requiredKey}" is not defined at "${schemaPath}" (strictRequired)`;
              (0, util_1.checkStrictMode)(it, msg, it.opts.strictRequired);
            }
          }
        }
        function allErrorsMode() {
          if (useLoop || $data) {
            cxt.block$data(codegen_1.nil, loopAllRequired);
          } else {
            for (const prop of schema) {
              (0, code_1.checkReportMissingProp)(cxt, prop);
            }
          }
        }
        __name(allErrorsMode, "allErrorsMode");
        function exitOnErrorMode() {
          const missing = gen.let("missing");
          if (useLoop || $data) {
            const valid = gen.let("valid", true);
            cxt.block$data(valid, () => loopUntilMissing(missing, valid));
            cxt.ok(valid);
          } else {
            gen.if((0, code_1.checkMissingProp)(cxt, schema, missing));
            (0, code_1.reportMissingProp)(cxt, missing);
            gen.else();
          }
        }
        __name(exitOnErrorMode, "exitOnErrorMode");
        function loopAllRequired() {
          gen.forOf("prop", schemaCode, (prop) => {
            cxt.setParams({ missingProperty: prop });
            gen.if((0, code_1.noPropertyInData)(gen, data, prop, opts.ownProperties), () => cxt.error());
          });
        }
        __name(loopAllRequired, "loopAllRequired");
        function loopUntilMissing(missing, valid) {
          cxt.setParams({ missingProperty: missing });
          gen.forOf(missing, schemaCode, () => {
            gen.assign(valid, (0, code_1.propertyInData)(gen, data, missing, opts.ownProperties));
            gen.if((0, codegen_1.not)(valid), () => {
              cxt.error();
              gen.break();
            });
          }, codegen_1.nil);
        }
        __name(loopUntilMissing, "loopUntilMissing");
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/limitItems.js
var require_limitItems = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/limitItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error = {
      message({ keyword, schemaCode }) {
        const comp = keyword === "maxItems" ? "more" : "fewer";
        return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} items`;
      },
      params: /* @__PURE__ */ __name(({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`, "params")
    };
    var def = {
      keyword: ["maxItems", "minItems"],
      type: "array",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        const op = keyword === "maxItems" ? codegen_1.operators.GT : codegen_1.operators.LT;
        cxt.fail$data((0, codegen_1._)`${data}.length ${op} ${schemaCode}`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/runtime/equal.js
var require_equal = __commonJS({
  "node_modules/ajv/dist/runtime/equal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var equal = require_fast_deep_equal();
    equal.code = 'require("ajv/dist/runtime/equal").default';
    exports.default = equal;
  }
});

// node_modules/ajv/dist/vocabularies/validation/uniqueItems.js
var require_uniqueItems = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/uniqueItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var dataType_1 = require_dataType();
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var equal_1 = require_equal();
    var error = {
      message: /* @__PURE__ */ __name(({ params: { i, j } }) => (0, codegen_1.str)`must NOT have duplicate items (items ## ${j} and ${i} are identical)`, "message"),
      params: /* @__PURE__ */ __name(({ params: { i, j } }) => (0, codegen_1._)`{i: ${i}, j: ${j}}`, "params")
    };
    var def = {
      keyword: "uniqueItems",
      type: "array",
      schemaType: "boolean",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, $data, schema, parentSchema, schemaCode, it } = cxt;
        if (!$data && !schema)
          return;
        const valid = gen.let("valid");
        const itemTypes = parentSchema.items ? (0, dataType_1.getSchemaTypes)(parentSchema.items) : [];
        cxt.block$data(valid, validateUniqueItems, (0, codegen_1._)`${schemaCode} === false`);
        cxt.ok(valid);
        function validateUniqueItems() {
          const i = gen.let("i", (0, codegen_1._)`${data}.length`);
          const j = gen.let("j");
          cxt.setParams({ i, j });
          gen.assign(valid, true);
          gen.if((0, codegen_1._)`${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j));
        }
        __name(validateUniqueItems, "validateUniqueItems");
        function canOptimize() {
          return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array");
        }
        __name(canOptimize, "canOptimize");
        function loopN(i, j) {
          const item = gen.name("item");
          const wrongType = (0, dataType_1.checkDataTypes)(itemTypes, item, it.opts.strictNumbers, dataType_1.DataType.Wrong);
          const indices = gen.const("indices", (0, codegen_1._)`{}`);
          gen.for((0, codegen_1._)`;${i}--;`, () => {
            gen.let(item, (0, codegen_1._)`${data}[${i}]`);
            gen.if(wrongType, (0, codegen_1._)`continue`);
            if (itemTypes.length > 1)
              gen.if((0, codegen_1._)`typeof ${item} == "string"`, (0, codegen_1._)`${item} += "_"`);
            gen.if((0, codegen_1._)`typeof ${indices}[${item}] == "number"`, () => {
              gen.assign(j, (0, codegen_1._)`${indices}[${item}]`);
              cxt.error();
              gen.assign(valid, false).break();
            }).code((0, codegen_1._)`${indices}[${item}] = ${i}`);
          });
        }
        __name(loopN, "loopN");
        function loopN2(i, j) {
          const eql = (0, util_1.useFunc)(gen, equal_1.default);
          const outer = gen.name("outer");
          gen.label(outer).for((0, codegen_1._)`;${i}--;`, () => gen.for((0, codegen_1._)`${j} = ${i}; ${j}--;`, () => gen.if((0, codegen_1._)`${eql}(${data}[${i}], ${data}[${j}])`, () => {
            cxt.error();
            gen.assign(valid, false).break(outer);
          })));
        }
        __name(loopN2, "loopN2");
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/const.js
var require_const = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/const.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var equal_1 = require_equal();
    var error = {
      message: "must be equal to constant",
      params: /* @__PURE__ */ __name(({ schemaCode }) => (0, codegen_1._)`{allowedValue: ${schemaCode}}`, "params")
    };
    var def = {
      keyword: "const",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, $data, schemaCode, schema } = cxt;
        if ($data || schema && typeof schema == "object") {
          cxt.fail$data((0, codegen_1._)`!${(0, util_1.useFunc)(gen, equal_1.default)}(${data}, ${schemaCode})`);
        } else {
          cxt.fail((0, codegen_1._)`${schema} !== ${data}`);
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/enum.js
var require_enum = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/enum.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var equal_1 = require_equal();
    var error = {
      message: "must be equal to one of the allowed values",
      params: /* @__PURE__ */ __name(({ schemaCode }) => (0, codegen_1._)`{allowedValues: ${schemaCode}}`, "params")
    };
    var def = {
      keyword: "enum",
      schemaType: "array",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, $data, schema, schemaCode, it } = cxt;
        if (!$data && schema.length === 0)
          throw new Error("enum must have non-empty array");
        const useLoop = schema.length >= it.opts.loopEnum;
        let eql;
        const getEql = /* @__PURE__ */ __name(() => eql !== null && eql !== void 0 ? eql : eql = (0, util_1.useFunc)(gen, equal_1.default), "getEql");
        let valid;
        if (useLoop || $data) {
          valid = gen.let("valid");
          cxt.block$data(valid, loopEnum);
        } else {
          if (!Array.isArray(schema))
            throw new Error("ajv implementation error");
          const vSchema = gen.const("vSchema", schemaCode);
          valid = (0, codegen_1.or)(...schema.map((_x, i) => equalCode(vSchema, i)));
        }
        cxt.pass(valid);
        function loopEnum() {
          gen.assign(valid, false);
          gen.forOf("v", schemaCode, (v) => gen.if((0, codegen_1._)`${getEql()}(${data}, ${v})`, () => gen.assign(valid, true).break()));
        }
        __name(loopEnum, "loopEnum");
        function equalCode(vSchema, i) {
          const sch = schema[i];
          return typeof sch === "object" && sch !== null ? (0, codegen_1._)`${getEql()}(${data}, ${vSchema}[${i}])` : (0, codegen_1._)`${data} === ${sch}`;
        }
        __name(equalCode, "equalCode");
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/index.js
var require_validation = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var limitNumber_1 = require_limitNumber();
    var multipleOf_1 = require_multipleOf();
    var limitLength_1 = require_limitLength();
    var pattern_1 = require_pattern();
    var limitProperties_1 = require_limitProperties();
    var required_1 = require_required();
    var limitItems_1 = require_limitItems();
    var uniqueItems_1 = require_uniqueItems();
    var const_1 = require_const();
    var enum_1 = require_enum();
    var validation = [
      // number
      limitNumber_1.default,
      multipleOf_1.default,
      // string
      limitLength_1.default,
      pattern_1.default,
      // object
      limitProperties_1.default,
      required_1.default,
      // array
      limitItems_1.default,
      uniqueItems_1.default,
      // any
      { keyword: "type", schemaType: ["string", "array"] },
      { keyword: "nullable", schemaType: "boolean" },
      const_1.default,
      enum_1.default
    ];
    exports.default = validation;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/additionalItems.js
var require_additionalItems = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/additionalItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateAdditionalItems = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: /* @__PURE__ */ __name(({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`, "message"),
      params: /* @__PURE__ */ __name(({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`, "params")
    };
    var def = {
      keyword: "additionalItems",
      type: "array",
      schemaType: ["boolean", "object"],
      before: "uniqueItems",
      error,
      code(cxt) {
        const { parentSchema, it } = cxt;
        const { items } = parentSchema;
        if (!Array.isArray(items)) {
          (0, util_1.checkStrictMode)(it, '"additionalItems" is ignored when "items" is not an array of schemas');
          return;
        }
        validateAdditionalItems(cxt, items);
      }
    };
    function validateAdditionalItems(cxt, items) {
      const { gen, schema, data, keyword, it } = cxt;
      it.items = true;
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      if (schema === false) {
        cxt.setParams({ len: items.length });
        cxt.pass((0, codegen_1._)`${len} <= ${items.length}`);
      } else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
        const valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items.length}`);
        gen.if((0, codegen_1.not)(valid), () => validateItems(valid));
        cxt.ok(valid);
      }
      function validateItems(valid) {
        gen.forRange("i", items.length, len, (i) => {
          cxt.subschema({ keyword, dataProp: i, dataPropType: util_1.Type.Num }, valid);
          if (!it.allErrors)
            gen.if((0, codegen_1.not)(valid), () => gen.break());
        });
      }
      __name(validateItems, "validateItems");
    }
    __name(validateAdditionalItems, "validateAdditionalItems");
    exports.validateAdditionalItems = validateAdditionalItems;
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/items.js
var require_items = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/items.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateTuple = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var code_1 = require_code2();
    var def = {
      keyword: "items",
      type: "array",
      schemaType: ["object", "array", "boolean"],
      before: "uniqueItems",
      code(cxt) {
        const { schema, it } = cxt;
        if (Array.isArray(schema))
          return validateTuple(cxt, "additionalItems", schema);
        it.items = true;
        if ((0, util_1.alwaysValidSchema)(it, schema))
          return;
        cxt.ok((0, code_1.validateArray)(cxt));
      }
    };
    function validateTuple(cxt, extraItems, schArr = cxt.schema) {
      const { gen, parentSchema, data, keyword, it } = cxt;
      checkStrictTuple(parentSchema);
      if (it.opts.unevaluated && schArr.length && it.items !== true) {
        it.items = util_1.mergeEvaluated.items(gen, schArr.length, it.items);
      }
      const valid = gen.name("valid");
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      schArr.forEach((sch, i) => {
        if ((0, util_1.alwaysValidSchema)(it, sch))
          return;
        gen.if((0, codegen_1._)`${len} > ${i}`, () => cxt.subschema({
          keyword,
          schemaProp: i,
          dataProp: i
        }, valid));
        cxt.ok(valid);
      });
      function checkStrictTuple(sch) {
        const { opts, errSchemaPath } = it;
        const l = schArr.length;
        const fullTuple = l === sch.minItems && (l === sch.maxItems || sch[extraItems] === false);
        if (opts.strictTuples && !fullTuple) {
          const msg = `"${keyword}" is ${l}-tuple, but minItems or maxItems/${extraItems} are not specified or different at path "${errSchemaPath}"`;
          (0, util_1.checkStrictMode)(it, msg, opts.strictTuples);
        }
      }
      __name(checkStrictTuple, "checkStrictTuple");
    }
    __name(validateTuple, "validateTuple");
    exports.validateTuple = validateTuple;
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/prefixItems.js
var require_prefixItems = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/prefixItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var items_1 = require_items();
    var def = {
      keyword: "prefixItems",
      type: "array",
      schemaType: ["array"],
      before: "uniqueItems",
      code: /* @__PURE__ */ __name((cxt) => (0, items_1.validateTuple)(cxt, "items"), "code")
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/items2020.js
var require_items2020 = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/items2020.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var code_1 = require_code2();
    var additionalItems_1 = require_additionalItems();
    var error = {
      message: /* @__PURE__ */ __name(({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`, "message"),
      params: /* @__PURE__ */ __name(({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`, "params")
    };
    var def = {
      keyword: "items",
      type: "array",
      schemaType: ["object", "boolean"],
      before: "uniqueItems",
      error,
      code(cxt) {
        const { schema, parentSchema, it } = cxt;
        const { prefixItems } = parentSchema;
        it.items = true;
        if ((0, util_1.alwaysValidSchema)(it, schema))
          return;
        if (prefixItems)
          (0, additionalItems_1.validateAdditionalItems)(cxt, prefixItems);
        else
          cxt.ok((0, code_1.validateArray)(cxt));
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/contains.js
var require_contains = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/contains.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: /* @__PURE__ */ __name(({ params: { min, max } }) => max === void 0 ? (0, codegen_1.str)`must contain at least ${min} valid item(s)` : (0, codegen_1.str)`must contain at least ${min} and no more than ${max} valid item(s)`, "message"),
      params: /* @__PURE__ */ __name(({ params: { min, max } }) => max === void 0 ? (0, codegen_1._)`{minContains: ${min}}` : (0, codegen_1._)`{minContains: ${min}, maxContains: ${max}}`, "params")
    };
    var def = {
      keyword: "contains",
      type: "array",
      schemaType: ["object", "boolean"],
      before: "uniqueItems",
      trackErrors: true,
      error,
      code(cxt) {
        const { gen, schema, parentSchema, data, it } = cxt;
        let min;
        let max;
        const { minContains, maxContains } = parentSchema;
        if (it.opts.next) {
          min = minContains === void 0 ? 1 : minContains;
          max = maxContains;
        } else {
          min = 1;
        }
        const len = gen.const("len", (0, codegen_1._)`${data}.length`);
        cxt.setParams({ min, max });
        if (max === void 0 && min === 0) {
          (0, util_1.checkStrictMode)(it, `"minContains" == 0 without "maxContains": "contains" keyword ignored`);
          return;
        }
        if (max !== void 0 && min > max) {
          (0, util_1.checkStrictMode)(it, `"minContains" > "maxContains" is always invalid`);
          cxt.fail();
          return;
        }
        if ((0, util_1.alwaysValidSchema)(it, schema)) {
          let cond = (0, codegen_1._)`${len} >= ${min}`;
          if (max !== void 0)
            cond = (0, codegen_1._)`${cond} && ${len} <= ${max}`;
          cxt.pass(cond);
          return;
        }
        it.items = true;
        const valid = gen.name("valid");
        if (max === void 0 && min === 1) {
          validateItems(valid, () => gen.if(valid, () => gen.break()));
        } else if (min === 0) {
          gen.let(valid, true);
          if (max !== void 0)
            gen.if((0, codegen_1._)`${data}.length > 0`, validateItemsWithCount);
        } else {
          gen.let(valid, false);
          validateItemsWithCount();
        }
        cxt.result(valid, () => cxt.reset());
        function validateItemsWithCount() {
          const schValid = gen.name("_valid");
          const count = gen.let("count", 0);
          validateItems(schValid, () => gen.if(schValid, () => checkLimits(count)));
        }
        __name(validateItemsWithCount, "validateItemsWithCount");
        function validateItems(_valid, block) {
          gen.forRange("i", 0, len, (i) => {
            cxt.subschema({
              keyword: "contains",
              dataProp: i,
              dataPropType: util_1.Type.Num,
              compositeRule: true
            }, _valid);
            block();
          });
        }
        __name(validateItems, "validateItems");
        function checkLimits(count) {
          gen.code((0, codegen_1._)`${count}++`);
          if (max === void 0) {
            gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true).break());
          } else {
            gen.if((0, codegen_1._)`${count} > ${max}`, () => gen.assign(valid, false).break());
            if (min === 1)
              gen.assign(valid, true);
            else
              gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true));
          }
        }
        __name(checkLimits, "checkLimits");
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/dependencies.js
var require_dependencies = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/dependencies.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateSchemaDeps = exports.validatePropertyDeps = exports.error = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var code_1 = require_code2();
    exports.error = {
      message: /* @__PURE__ */ __name(({ params: { property, depsCount, deps } }) => {
        const property_ies = depsCount === 1 ? "property" : "properties";
        return (0, codegen_1.str)`must have ${property_ies} ${deps} when property ${property} is present`;
      }, "message"),
      params: /* @__PURE__ */ __name(({ params: { property, depsCount, deps, missingProperty } }) => (0, codegen_1._)`{property: ${property},
    missingProperty: ${missingProperty},
    depsCount: ${depsCount},
    deps: ${deps}}`, "params")
      // TODO change to reference
    };
    var def = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: exports.error,
      code(cxt) {
        const [propDeps, schDeps] = splitDependencies(cxt);
        validatePropertyDeps(cxt, propDeps);
        validateSchemaDeps(cxt, schDeps);
      }
    };
    function splitDependencies({ schema }) {
      const propertyDeps = {};
      const schemaDeps = {};
      for (const key in schema) {
        if (key === "__proto__")
          continue;
        const deps = Array.isArray(schema[key]) ? propertyDeps : schemaDeps;
        deps[key] = schema[key];
      }
      return [propertyDeps, schemaDeps];
    }
    __name(splitDependencies, "splitDependencies");
    function validatePropertyDeps(cxt, propertyDeps = cxt.schema) {
      const { gen, data, it } = cxt;
      if (Object.keys(propertyDeps).length === 0)
        return;
      const missing = gen.let("missing");
      for (const prop in propertyDeps) {
        const deps = propertyDeps[prop];
        if (deps.length === 0)
          continue;
        const hasProperty = (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties);
        cxt.setParams({
          property: prop,
          depsCount: deps.length,
          deps: deps.join(", ")
        });
        if (it.allErrors) {
          gen.if(hasProperty, () => {
            for (const depProp of deps) {
              (0, code_1.checkReportMissingProp)(cxt, depProp);
            }
          });
        } else {
          gen.if((0, codegen_1._)`${hasProperty} && (${(0, code_1.checkMissingProp)(cxt, deps, missing)})`);
          (0, code_1.reportMissingProp)(cxt, missing);
          gen.else();
        }
      }
    }
    __name(validatePropertyDeps, "validatePropertyDeps");
    exports.validatePropertyDeps = validatePropertyDeps;
    function validateSchemaDeps(cxt, schemaDeps = cxt.schema) {
      const { gen, data, keyword, it } = cxt;
      const valid = gen.name("valid");
      for (const prop in schemaDeps) {
        if ((0, util_1.alwaysValidSchema)(it, schemaDeps[prop]))
          continue;
        gen.if(
          (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties),
          () => {
            const schCxt = cxt.subschema({ keyword, schemaProp: prop }, valid);
            cxt.mergeValidEvaluated(schCxt, valid);
          },
          () => gen.var(valid, true)
          // TODO var
        );
        cxt.ok(valid);
      }
    }
    __name(validateSchemaDeps, "validateSchemaDeps");
    exports.validateSchemaDeps = validateSchemaDeps;
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/propertyNames.js
var require_propertyNames = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/propertyNames.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: "property name must be valid",
      params: /* @__PURE__ */ __name(({ params }) => (0, codegen_1._)`{propertyName: ${params.propertyName}}`, "params")
    };
    var def = {
      keyword: "propertyNames",
      type: "object",
      schemaType: ["object", "boolean"],
      error,
      code(cxt) {
        const { gen, schema, data, it } = cxt;
        if ((0, util_1.alwaysValidSchema)(it, schema))
          return;
        const valid = gen.name("valid");
        gen.forIn("key", data, (key) => {
          cxt.setParams({ propertyName: key });
          cxt.subschema({
            keyword: "propertyNames",
            data: key,
            dataTypes: ["string"],
            propertyName: key,
            compositeRule: true
          }, valid);
          gen.if((0, codegen_1.not)(valid), () => {
            cxt.error(true);
            if (!it.allErrors)
              gen.break();
          });
        });
        cxt.ok(valid);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js
var require_additionalProperties = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var util_1 = require_util();
    var error = {
      message: "must NOT have additional properties",
      params: /* @__PURE__ */ __name(({ params }) => (0, codegen_1._)`{additionalProperty: ${params.additionalProperty}}`, "params")
    };
    var def = {
      keyword: "additionalProperties",
      type: ["object"],
      schemaType: ["boolean", "object"],
      allowUndefined: true,
      trackErrors: true,
      error,
      code(cxt) {
        const { gen, schema, parentSchema, data, errsCount, it } = cxt;
        if (!errsCount)
          throw new Error("ajv implementation error");
        const { allErrors, opts } = it;
        it.props = true;
        if (opts.removeAdditional !== "all" && (0, util_1.alwaysValidSchema)(it, schema))
          return;
        const props = (0, code_1.allSchemaProperties)(parentSchema.properties);
        const patProps = (0, code_1.allSchemaProperties)(parentSchema.patternProperties);
        checkAdditionalProperties();
        cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
        function checkAdditionalProperties() {
          gen.forIn("key", data, (key) => {
            if (!props.length && !patProps.length)
              additionalPropertyCode(key);
            else
              gen.if(isAdditional(key), () => additionalPropertyCode(key));
          });
        }
        __name(checkAdditionalProperties, "checkAdditionalProperties");
        function isAdditional(key) {
          let definedProp;
          if (props.length > 8) {
            const propsSchema = (0, util_1.schemaRefOrVal)(it, parentSchema.properties, "properties");
            definedProp = (0, code_1.isOwnProperty)(gen, propsSchema, key);
          } else if (props.length) {
            definedProp = (0, codegen_1.or)(...props.map((p) => (0, codegen_1._)`${key} === ${p}`));
          } else {
            definedProp = codegen_1.nil;
          }
          if (patProps.length) {
            definedProp = (0, codegen_1.or)(definedProp, ...patProps.map((p) => (0, codegen_1._)`${(0, code_1.usePattern)(cxt, p)}.test(${key})`));
          }
          return (0, codegen_1.not)(definedProp);
        }
        __name(isAdditional, "isAdditional");
        function deleteAdditional(key) {
          gen.code((0, codegen_1._)`delete ${data}[${key}]`);
        }
        __name(deleteAdditional, "deleteAdditional");
        function additionalPropertyCode(key) {
          if (opts.removeAdditional === "all" || opts.removeAdditional && schema === false) {
            deleteAdditional(key);
            return;
          }
          if (schema === false) {
            cxt.setParams({ additionalProperty: key });
            cxt.error();
            if (!allErrors)
              gen.break();
            return;
          }
          if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
            const valid = gen.name("valid");
            if (opts.removeAdditional === "failing") {
              applyAdditionalSchema(key, valid, false);
              gen.if((0, codegen_1.not)(valid), () => {
                cxt.reset();
                deleteAdditional(key);
              });
            } else {
              applyAdditionalSchema(key, valid);
              if (!allErrors)
                gen.if((0, codegen_1.not)(valid), () => gen.break());
            }
          }
        }
        __name(additionalPropertyCode, "additionalPropertyCode");
        function applyAdditionalSchema(key, valid, errors) {
          const subschema = {
            keyword: "additionalProperties",
            dataProp: key,
            dataPropType: util_1.Type.Str
          };
          if (errors === false) {
            Object.assign(subschema, {
              compositeRule: true,
              createErrors: false,
              allErrors: false
            });
          }
          cxt.subschema(subschema, valid);
        }
        __name(applyAdditionalSchema, "applyAdditionalSchema");
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/properties.js
var require_properties = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/properties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var validate_1 = require_validate();
    var code_1 = require_code2();
    var util_1 = require_util();
    var additionalProperties_1 = require_additionalProperties();
    var def = {
      keyword: "properties",
      type: "object",
      schemaType: "object",
      code(cxt) {
        const { gen, schema, parentSchema, data, it } = cxt;
        if (it.opts.removeAdditional === "all" && parentSchema.additionalProperties === void 0) {
          additionalProperties_1.default.code(new validate_1.KeywordCxt(it, additionalProperties_1.default, "additionalProperties"));
        }
        const allProps = (0, code_1.allSchemaProperties)(schema);
        for (const prop of allProps) {
          it.definedProperties.add(prop);
        }
        if (it.opts.unevaluated && allProps.length && it.props !== true) {
          it.props = util_1.mergeEvaluated.props(gen, (0, util_1.toHash)(allProps), it.props);
        }
        const properties = allProps.filter((p) => !(0, util_1.alwaysValidSchema)(it, schema[p]));
        if (properties.length === 0)
          return;
        const valid = gen.name("valid");
        for (const prop of properties) {
          if (hasDefault(prop)) {
            applyPropertySchema(prop);
          } else {
            gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties));
            applyPropertySchema(prop);
            if (!it.allErrors)
              gen.else().var(valid, true);
            gen.endIf();
          }
          cxt.it.definedProperties.add(prop);
          cxt.ok(valid);
        }
        function hasDefault(prop) {
          return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== void 0;
        }
        __name(hasDefault, "hasDefault");
        function applyPropertySchema(prop) {
          cxt.subschema({
            keyword: "properties",
            schemaProp: prop,
            dataProp: prop
          }, valid);
        }
        __name(applyPropertySchema, "applyPropertySchema");
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/patternProperties.js
var require_patternProperties = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/patternProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var util_2 = require_util();
    var def = {
      keyword: "patternProperties",
      type: "object",
      schemaType: "object",
      code(cxt) {
        const { gen, schema, data, parentSchema, it } = cxt;
        const { opts } = it;
        const patterns = (0, code_1.allSchemaProperties)(schema);
        const alwaysValidPatterns = patterns.filter((p) => (0, util_1.alwaysValidSchema)(it, schema[p]));
        if (patterns.length === 0 || alwaysValidPatterns.length === patterns.length && (!it.opts.unevaluated || it.props === true)) {
          return;
        }
        const checkProperties = opts.strictSchema && !opts.allowMatchingProperties && parentSchema.properties;
        const valid = gen.name("valid");
        if (it.props !== true && !(it.props instanceof codegen_1.Name)) {
          it.props = (0, util_2.evaluatedPropsToName)(gen, it.props);
        }
        const { props } = it;
        validatePatternProperties();
        function validatePatternProperties() {
          for (const pat of patterns) {
            if (checkProperties)
              checkMatchingProperties(pat);
            if (it.allErrors) {
              validateProperties(pat);
            } else {
              gen.var(valid, true);
              validateProperties(pat);
              gen.if(valid);
            }
          }
        }
        __name(validatePatternProperties, "validatePatternProperties");
        function checkMatchingProperties(pat) {
          for (const prop in checkProperties) {
            if (new RegExp(pat).test(prop)) {
              (0, util_1.checkStrictMode)(it, `property ${prop} matches pattern ${pat} (use allowMatchingProperties)`);
            }
          }
        }
        __name(checkMatchingProperties, "checkMatchingProperties");
        function validateProperties(pat) {
          gen.forIn("key", data, (key) => {
            gen.if((0, codegen_1._)`${(0, code_1.usePattern)(cxt, pat)}.test(${key})`, () => {
              const alwaysValid = alwaysValidPatterns.includes(pat);
              if (!alwaysValid) {
                cxt.subschema({
                  keyword: "patternProperties",
                  schemaProp: pat,
                  dataProp: key,
                  dataPropType: util_2.Type.Str
                }, valid);
              }
              if (it.opts.unevaluated && props !== true) {
                gen.assign((0, codegen_1._)`${props}[${key}]`, true);
              } else if (!alwaysValid && !it.allErrors) {
                gen.if((0, codegen_1.not)(valid), () => gen.break());
              }
            });
          });
        }
        __name(validateProperties, "validateProperties");
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/not.js
var require_not = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/not.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util();
    var def = {
      keyword: "not",
      schemaType: ["object", "boolean"],
      trackErrors: true,
      code(cxt) {
        const { gen, schema, it } = cxt;
        if ((0, util_1.alwaysValidSchema)(it, schema)) {
          cxt.fail();
          return;
        }
        const valid = gen.name("valid");
        cxt.subschema({
          keyword: "not",
          compositeRule: true,
          createErrors: false,
          allErrors: false
        }, valid);
        cxt.failResult(valid, () => cxt.reset(), () => cxt.error());
      },
      error: { message: "must NOT be valid" }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/anyOf.js
var require_anyOf = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/anyOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var def = {
      keyword: "anyOf",
      schemaType: "array",
      trackErrors: true,
      code: code_1.validateUnion,
      error: { message: "must match a schema in anyOf" }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/oneOf.js
var require_oneOf = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/oneOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: "must match exactly one schema in oneOf",
      params: /* @__PURE__ */ __name(({ params }) => (0, codegen_1._)`{passingSchemas: ${params.passing}}`, "params")
    };
    var def = {
      keyword: "oneOf",
      schemaType: "array",
      trackErrors: true,
      error,
      code(cxt) {
        const { gen, schema, parentSchema, it } = cxt;
        if (!Array.isArray(schema))
          throw new Error("ajv implementation error");
        if (it.opts.discriminator && parentSchema.discriminator)
          return;
        const schArr = schema;
        const valid = gen.let("valid", false);
        const passing = gen.let("passing", null);
        const schValid = gen.name("_valid");
        cxt.setParams({ passing });
        gen.block(validateOneOf);
        cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
        function validateOneOf() {
          schArr.forEach((sch, i) => {
            let schCxt;
            if ((0, util_1.alwaysValidSchema)(it, sch)) {
              gen.var(schValid, true);
            } else {
              schCxt = cxt.subschema({
                keyword: "oneOf",
                schemaProp: i,
                compositeRule: true
              }, schValid);
            }
            if (i > 0) {
              gen.if((0, codegen_1._)`${schValid} && ${valid}`).assign(valid, false).assign(passing, (0, codegen_1._)`[${passing}, ${i}]`).else();
            }
            gen.if(schValid, () => {
              gen.assign(valid, true);
              gen.assign(passing, i);
              if (schCxt)
                cxt.mergeEvaluated(schCxt, codegen_1.Name);
            });
          });
        }
        __name(validateOneOf, "validateOneOf");
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/allOf.js
var require_allOf = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/allOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util();
    var def = {
      keyword: "allOf",
      schemaType: "array",
      code(cxt) {
        const { gen, schema, it } = cxt;
        if (!Array.isArray(schema))
          throw new Error("ajv implementation error");
        const valid = gen.name("valid");
        schema.forEach((sch, i) => {
          if ((0, util_1.alwaysValidSchema)(it, sch))
            return;
          const schCxt = cxt.subschema({ keyword: "allOf", schemaProp: i }, valid);
          cxt.ok(valid);
          cxt.mergeEvaluated(schCxt);
        });
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/if.js
var require_if = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/if.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: /* @__PURE__ */ __name(({ params }) => (0, codegen_1.str)`must match "${params.ifClause}" schema`, "message"),
      params: /* @__PURE__ */ __name(({ params }) => (0, codegen_1._)`{failingKeyword: ${params.ifClause}}`, "params")
    };
    var def = {
      keyword: "if",
      schemaType: ["object", "boolean"],
      trackErrors: true,
      error,
      code(cxt) {
        const { gen, parentSchema, it } = cxt;
        if (parentSchema.then === void 0 && parentSchema.else === void 0) {
          (0, util_1.checkStrictMode)(it, '"if" without "then" and "else" is ignored');
        }
        const hasThen = hasSchema(it, "then");
        const hasElse = hasSchema(it, "else");
        if (!hasThen && !hasElse)
          return;
        const valid = gen.let("valid", true);
        const schValid = gen.name("_valid");
        validateIf();
        cxt.reset();
        if (hasThen && hasElse) {
          const ifClause = gen.let("ifClause");
          cxt.setParams({ ifClause });
          gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
        } else if (hasThen) {
          gen.if(schValid, validateClause("then"));
        } else {
          gen.if((0, codegen_1.not)(schValid), validateClause("else"));
        }
        cxt.pass(valid, () => cxt.error(true));
        function validateIf() {
          const schCxt = cxt.subschema({
            keyword: "if",
            compositeRule: true,
            createErrors: false,
            allErrors: false
          }, schValid);
          cxt.mergeEvaluated(schCxt);
        }
        __name(validateIf, "validateIf");
        function validateClause(keyword, ifClause) {
          return () => {
            const schCxt = cxt.subschema({ keyword }, schValid);
            gen.assign(valid, schValid);
            cxt.mergeValidEvaluated(schCxt, valid);
            if (ifClause)
              gen.assign(ifClause, (0, codegen_1._)`${keyword}`);
            else
              cxt.setParams({ ifClause: keyword });
          };
        }
        __name(validateClause, "validateClause");
      }
    };
    function hasSchema(it, keyword) {
      const schema = it.schema[keyword];
      return schema !== void 0 && !(0, util_1.alwaysValidSchema)(it, schema);
    }
    __name(hasSchema, "hasSchema");
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/thenElse.js
var require_thenElse = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/thenElse.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util();
    var def = {
      keyword: ["then", "else"],
      schemaType: ["object", "boolean"],
      code({ keyword, parentSchema, it }) {
        if (parentSchema.if === void 0)
          (0, util_1.checkStrictMode)(it, `"${keyword}" without "if" is ignored`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/index.js
var require_applicator = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var additionalItems_1 = require_additionalItems();
    var prefixItems_1 = require_prefixItems();
    var items_1 = require_items();
    var items2020_1 = require_items2020();
    var contains_1 = require_contains();
    var dependencies_1 = require_dependencies();
    var propertyNames_1 = require_propertyNames();
    var additionalProperties_1 = require_additionalProperties();
    var properties_1 = require_properties();
    var patternProperties_1 = require_patternProperties();
    var not_1 = require_not();
    var anyOf_1 = require_anyOf();
    var oneOf_1 = require_oneOf();
    var allOf_1 = require_allOf();
    var if_1 = require_if();
    var thenElse_1 = require_thenElse();
    function getApplicator(draft2020 = false) {
      const applicator = [
        // any
        not_1.default,
        anyOf_1.default,
        oneOf_1.default,
        allOf_1.default,
        if_1.default,
        thenElse_1.default,
        // object
        propertyNames_1.default,
        additionalProperties_1.default,
        dependencies_1.default,
        properties_1.default,
        patternProperties_1.default
      ];
      if (draft2020)
        applicator.push(prefixItems_1.default, items2020_1.default);
      else
        applicator.push(additionalItems_1.default, items_1.default);
      applicator.push(contains_1.default);
      return applicator;
    }
    __name(getApplicator, "getApplicator");
    exports.default = getApplicator;
  }
});

// node_modules/ajv/dist/vocabularies/format/format.js
var require_format = __commonJS({
  "node_modules/ajv/dist/vocabularies/format/format.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error = {
      message: /* @__PURE__ */ __name(({ schemaCode }) => (0, codegen_1.str)`must match format "${schemaCode}"`, "message"),
      params: /* @__PURE__ */ __name(({ schemaCode }) => (0, codegen_1._)`{format: ${schemaCode}}`, "params")
    };
    var def = {
      keyword: "format",
      type: ["number", "string"],
      schemaType: "string",
      $data: true,
      error,
      code(cxt, ruleType) {
        const { gen, data, $data, schema, schemaCode, it } = cxt;
        const { opts, errSchemaPath, schemaEnv, self } = it;
        if (!opts.validateFormats)
          return;
        if ($data)
          validate$DataFormat();
        else
          validateFormat();
        function validate$DataFormat() {
          const fmts = gen.scopeValue("formats", {
            ref: self.formats,
            code: opts.code.formats
          });
          const fDef = gen.const("fDef", (0, codegen_1._)`${fmts}[${schemaCode}]`);
          const fType = gen.let("fType");
          const format = gen.let("format");
          gen.if((0, codegen_1._)`typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`, () => gen.assign(fType, (0, codegen_1._)`${fDef}.type || "string"`).assign(format, (0, codegen_1._)`${fDef}.validate`), () => gen.assign(fType, (0, codegen_1._)`"string"`).assign(format, fDef));
          cxt.fail$data((0, codegen_1.or)(unknownFmt(), invalidFmt()));
          function unknownFmt() {
            if (opts.strictSchema === false)
              return codegen_1.nil;
            return (0, codegen_1._)`${schemaCode} && !${format}`;
          }
          __name(unknownFmt, "unknownFmt");
          function invalidFmt() {
            const callFormat = schemaEnv.$async ? (0, codegen_1._)`(${fDef}.async ? await ${format}(${data}) : ${format}(${data}))` : (0, codegen_1._)`${format}(${data})`;
            const validData = (0, codegen_1._)`(typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data}))`;
            return (0, codegen_1._)`${format} && ${format} !== true && ${fType} === ${ruleType} && !${validData}`;
          }
          __name(invalidFmt, "invalidFmt");
        }
        __name(validate$DataFormat, "validate$DataFormat");
        function validateFormat() {
          const formatDef = self.formats[schema];
          if (!formatDef) {
            unknownFormat();
            return;
          }
          if (formatDef === true)
            return;
          const [fmtType, format, fmtRef] = getFormat(formatDef);
          if (fmtType === ruleType)
            cxt.pass(validCondition());
          function unknownFormat() {
            if (opts.strictSchema === false) {
              self.logger.warn(unknownMsg());
              return;
            }
            throw new Error(unknownMsg());
            function unknownMsg() {
              return `unknown format "${schema}" ignored in schema at path "${errSchemaPath}"`;
            }
            __name(unknownMsg, "unknownMsg");
          }
          __name(unknownFormat, "unknownFormat");
          function getFormat(fmtDef) {
            const code = fmtDef instanceof RegExp ? (0, codegen_1.regexpCode)(fmtDef) : opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(schema)}` : void 0;
            const fmt = gen.scopeValue("formats", { key: schema, ref: fmtDef, code });
            if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) {
              return [fmtDef.type || "string", fmtDef.validate, (0, codegen_1._)`${fmt}.validate`];
            }
            return ["string", fmtDef, fmt];
          }
          __name(getFormat, "getFormat");
          function validCondition() {
            if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
              if (!schemaEnv.$async)
                throw new Error("async format in sync schema");
              return (0, codegen_1._)`await ${fmtRef}(${data})`;
            }
            return typeof format == "function" ? (0, codegen_1._)`${fmtRef}(${data})` : (0, codegen_1._)`${fmtRef}.test(${data})`;
          }
          __name(validCondition, "validCondition");
        }
        __name(validateFormat, "validateFormat");
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/format/index.js
var require_format2 = __commonJS({
  "node_modules/ajv/dist/vocabularies/format/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var format_1 = require_format();
    var format = [format_1.default];
    exports.default = format;
  }
});

// node_modules/ajv/dist/vocabularies/metadata.js
var require_metadata = __commonJS({
  "node_modules/ajv/dist/vocabularies/metadata.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.contentVocabulary = exports.metadataVocabulary = void 0;
    exports.metadataVocabulary = [
      "title",
      "description",
      "default",
      "deprecated",
      "readOnly",
      "writeOnly",
      "examples"
    ];
    exports.contentVocabulary = [
      "contentMediaType",
      "contentEncoding",
      "contentSchema"
    ];
  }
});

// node_modules/ajv/dist/vocabularies/draft7.js
var require_draft7 = __commonJS({
  "node_modules/ajv/dist/vocabularies/draft7.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var core_1 = require_core2();
    var validation_1 = require_validation();
    var applicator_1 = require_applicator();
    var format_1 = require_format2();
    var metadata_1 = require_metadata();
    var draft7Vocabularies = [
      core_1.default,
      validation_1.default,
      (0, applicator_1.default)(),
      format_1.default,
      metadata_1.metadataVocabulary,
      metadata_1.contentVocabulary
    ];
    exports.default = draft7Vocabularies;
  }
});

// node_modules/ajv/dist/vocabularies/discriminator/types.js
var require_types = __commonJS({
  "node_modules/ajv/dist/vocabularies/discriminator/types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiscrError = void 0;
    var DiscrError;
    (function(DiscrError2) {
      DiscrError2["Tag"] = "tag";
      DiscrError2["Mapping"] = "mapping";
    })(DiscrError || (exports.DiscrError = DiscrError = {}));
  }
});

// node_modules/ajv/dist/vocabularies/discriminator/index.js
var require_discriminator = __commonJS({
  "node_modules/ajv/dist/vocabularies/discriminator/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var types_1 = require_types();
    var compile_1 = require_compile();
    var ref_error_1 = require_ref_error();
    var util_1 = require_util();
    var error = {
      message: /* @__PURE__ */ __name(({ params: { discrError, tagName } }) => discrError === types_1.DiscrError.Tag ? `tag "${tagName}" must be string` : `value of tag "${tagName}" must be in oneOf`, "message"),
      params: /* @__PURE__ */ __name(({ params: { discrError, tag, tagName } }) => (0, codegen_1._)`{error: ${discrError}, tag: ${tagName}, tagValue: ${tag}}`, "params")
    };
    var def = {
      keyword: "discriminator",
      type: "object",
      schemaType: "object",
      error,
      code(cxt) {
        const { gen, data, schema, parentSchema, it } = cxt;
        const { oneOf } = parentSchema;
        if (!it.opts.discriminator) {
          throw new Error("discriminator: requires discriminator option");
        }
        const tagName = schema.propertyName;
        if (typeof tagName != "string")
          throw new Error("discriminator: requires propertyName");
        if (schema.mapping)
          throw new Error("discriminator: mapping is not supported");
        if (!oneOf)
          throw new Error("discriminator: requires oneOf keyword");
        const valid = gen.let("valid", false);
        const tag = gen.const("tag", (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(tagName)}`);
        gen.if((0, codegen_1._)`typeof ${tag} == "string"`, () => validateMapping(), () => cxt.error(false, { discrError: types_1.DiscrError.Tag, tag, tagName }));
        cxt.ok(valid);
        function validateMapping() {
          const mapping = getMapping();
          gen.if(false);
          for (const tagValue in mapping) {
            gen.elseIf((0, codegen_1._)`${tag} === ${tagValue}`);
            gen.assign(valid, applyTagSchema(mapping[tagValue]));
          }
          gen.else();
          cxt.error(false, { discrError: types_1.DiscrError.Mapping, tag, tagName });
          gen.endIf();
        }
        __name(validateMapping, "validateMapping");
        function applyTagSchema(schemaProp) {
          const _valid = gen.name("valid");
          const schCxt = cxt.subschema({ keyword: "oneOf", schemaProp }, _valid);
          cxt.mergeEvaluated(schCxt, codegen_1.Name);
          return _valid;
        }
        __name(applyTagSchema, "applyTagSchema");
        function getMapping() {
          var _a;
          const oneOfMapping = {};
          const topRequired = hasRequired(parentSchema);
          let tagRequired = true;
          for (let i = 0; i < oneOf.length; i++) {
            let sch = oneOf[i];
            if ((sch === null || sch === void 0 ? void 0 : sch.$ref) && !(0, util_1.schemaHasRulesButRef)(sch, it.self.RULES)) {
              const ref = sch.$ref;
              sch = compile_1.resolveRef.call(it.self, it.schemaEnv.root, it.baseId, ref);
              if (sch instanceof compile_1.SchemaEnv)
                sch = sch.schema;
              if (sch === void 0)
                throw new ref_error_1.default(it.opts.uriResolver, it.baseId, ref);
            }
            const propSch = (_a = sch === null || sch === void 0 ? void 0 : sch.properties) === null || _a === void 0 ? void 0 : _a[tagName];
            if (typeof propSch != "object") {
              throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${tagName}"`);
            }
            tagRequired = tagRequired && (topRequired || hasRequired(sch));
            addMappings(propSch, i);
          }
          if (!tagRequired)
            throw new Error(`discriminator: "${tagName}" must be required`);
          return oneOfMapping;
          function hasRequired({ required }) {
            return Array.isArray(required) && required.includes(tagName);
          }
          __name(hasRequired, "hasRequired");
          function addMappings(sch, i) {
            if (sch.const) {
              addMapping(sch.const, i);
            } else if (sch.enum) {
              for (const tagValue of sch.enum) {
                addMapping(tagValue, i);
              }
            } else {
              throw new Error(`discriminator: "properties/${tagName}" must have "const" or "enum"`);
            }
          }
          __name(addMappings, "addMappings");
          function addMapping(tagValue, i) {
            if (typeof tagValue != "string" || tagValue in oneOfMapping) {
              throw new Error(`discriminator: "${tagName}" values must be unique strings`);
            }
            oneOfMapping[tagValue] = i;
          }
          __name(addMapping, "addMapping");
        }
        __name(getMapping, "getMapping");
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/refs/json-schema-draft-07.json
var require_json_schema_draft_07 = __commonJS({
  "node_modules/ajv/dist/refs/json-schema-draft-07.json"(exports, module) {
    module.exports = {
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "http://json-schema.org/draft-07/schema#",
      title: "Core schema meta-schema",
      definitions: {
        schemaArray: {
          type: "array",
          minItems: 1,
          items: { $ref: "#" }
        },
        nonNegativeInteger: {
          type: "integer",
          minimum: 0
        },
        nonNegativeIntegerDefault0: {
          allOf: [{ $ref: "#/definitions/nonNegativeInteger" }, { default: 0 }]
        },
        simpleTypes: {
          enum: ["array", "boolean", "integer", "null", "number", "object", "string"]
        },
        stringArray: {
          type: "array",
          items: { type: "string" },
          uniqueItems: true,
          default: []
        }
      },
      type: ["object", "boolean"],
      properties: {
        $id: {
          type: "string",
          format: "uri-reference"
        },
        $schema: {
          type: "string",
          format: "uri"
        },
        $ref: {
          type: "string",
          format: "uri-reference"
        },
        $comment: {
          type: "string"
        },
        title: {
          type: "string"
        },
        description: {
          type: "string"
        },
        default: true,
        readOnly: {
          type: "boolean",
          default: false
        },
        examples: {
          type: "array",
          items: true
        },
        multipleOf: {
          type: "number",
          exclusiveMinimum: 0
        },
        maximum: {
          type: "number"
        },
        exclusiveMaximum: {
          type: "number"
        },
        minimum: {
          type: "number"
        },
        exclusiveMinimum: {
          type: "number"
        },
        maxLength: { $ref: "#/definitions/nonNegativeInteger" },
        minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
        pattern: {
          type: "string",
          format: "regex"
        },
        additionalItems: { $ref: "#" },
        items: {
          anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }],
          default: true
        },
        maxItems: { $ref: "#/definitions/nonNegativeInteger" },
        minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
        uniqueItems: {
          type: "boolean",
          default: false
        },
        contains: { $ref: "#" },
        maxProperties: { $ref: "#/definitions/nonNegativeInteger" },
        minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
        required: { $ref: "#/definitions/stringArray" },
        additionalProperties: { $ref: "#" },
        definitions: {
          type: "object",
          additionalProperties: { $ref: "#" },
          default: {}
        },
        properties: {
          type: "object",
          additionalProperties: { $ref: "#" },
          default: {}
        },
        patternProperties: {
          type: "object",
          additionalProperties: { $ref: "#" },
          propertyNames: { format: "regex" },
          default: {}
        },
        dependencies: {
          type: "object",
          additionalProperties: {
            anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }]
          }
        },
        propertyNames: { $ref: "#" },
        const: true,
        enum: {
          type: "array",
          items: true,
          minItems: 1,
          uniqueItems: true
        },
        type: {
          anyOf: [
            { $ref: "#/definitions/simpleTypes" },
            {
              type: "array",
              items: { $ref: "#/definitions/simpleTypes" },
              minItems: 1,
              uniqueItems: true
            }
          ]
        },
        format: { type: "string" },
        contentMediaType: { type: "string" },
        contentEncoding: { type: "string" },
        if: { $ref: "#" },
        then: { $ref: "#" },
        else: { $ref: "#" },
        allOf: { $ref: "#/definitions/schemaArray" },
        anyOf: { $ref: "#/definitions/schemaArray" },
        oneOf: { $ref: "#/definitions/schemaArray" },
        not: { $ref: "#" }
      },
      default: true
    };
  }
});

// node_modules/ajv/dist/ajv.js
var require_ajv = __commonJS({
  "node_modules/ajv/dist/ajv.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv = void 0;
    var core_1 = require_core();
    var draft7_1 = require_draft7();
    var discriminator_1 = require_discriminator();
    var draft7MetaSchema = require_json_schema_draft_07();
    var META_SUPPORT_DATA = ["/properties"];
    var META_SCHEMA_ID = "http://json-schema.org/draft-07/schema";
    var Ajv2 = class extends core_1.default {
      static {
        __name(this, "Ajv");
      }
      _addVocabularies() {
        super._addVocabularies();
        draft7_1.default.forEach((v) => this.addVocabulary(v));
        if (this.opts.discriminator)
          this.addKeyword(discriminator_1.default);
      }
      _addDefaultMetaSchema() {
        super._addDefaultMetaSchema();
        if (!this.opts.meta)
          return;
        const metaSchema = this.opts.$data ? this.$dataMetaSchema(draft7MetaSchema, META_SUPPORT_DATA) : draft7MetaSchema;
        this.addMetaSchema(metaSchema, META_SCHEMA_ID, false);
        this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
      }
      defaultMeta() {
        return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : void 0);
      }
    };
    exports.Ajv = Ajv2;
    module.exports = exports = Ajv2;
    module.exports.Ajv = Ajv2;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Ajv2;
    var validate_1 = require_validate();
    Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return validate_1.KeywordCxt;
    }, "get") });
    var codegen_1 = require_codegen();
    Object.defineProperty(exports, "_", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return codegen_1._;
    }, "get") });
    Object.defineProperty(exports, "str", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return codegen_1.str;
    }, "get") });
    Object.defineProperty(exports, "stringify", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return codegen_1.stringify;
    }, "get") });
    Object.defineProperty(exports, "nil", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return codegen_1.nil;
    }, "get") });
    Object.defineProperty(exports, "Name", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return codegen_1.Name;
    }, "get") });
    Object.defineProperty(exports, "CodeGen", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return codegen_1.CodeGen;
    }, "get") });
    var validation_error_1 = require_validation_error();
    Object.defineProperty(exports, "ValidationError", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return validation_error_1.default;
    }, "get") });
    var ref_error_1 = require_ref_error();
    Object.defineProperty(exports, "MissingRefError", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return ref_error_1.default;
    }, "get") });
  }
});

// node_modules/ajv-formats/dist/formats.js
var require_formats = __commonJS({
  "node_modules/ajv-formats/dist/formats.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.formatNames = exports.fastFormats = exports.fullFormats = void 0;
    function fmtDef(validate, compare) {
      return { validate, compare };
    }
    __name(fmtDef, "fmtDef");
    exports.fullFormats = {
      // date: http://tools.ietf.org/html/rfc3339#section-5.6
      date: fmtDef(date, compareDate),
      // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
      time: fmtDef(getTime(true), compareTime),
      "date-time": fmtDef(getDateTime(true), compareDateTime),
      "iso-time": fmtDef(getTime(), compareIsoTime),
      "iso-date-time": fmtDef(getDateTime(), compareIsoDateTime),
      // duration: https://tools.ietf.org/html/rfc3339#appendix-A
      duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
      uri,
      "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
      // uri-template: https://tools.ietf.org/html/rfc6570
      "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
      // For the source: https://gist.github.com/dperini/729294
      // For test cases: https://mathiasbynens.be/demo/url-regex
      url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
      email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
      hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
      // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
      ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
      ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
      regex,
      // uuid: http://tools.ietf.org/html/rfc4122
      uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
      // JSON-pointer: https://tools.ietf.org/html/rfc6901
      // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
      "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
      "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
      // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
      "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
      // the following formats are used by the openapi specification: https://spec.openapis.org/oas/v3.0.0#data-types
      // byte: https://github.com/miguelmota/is-base64
      byte,
      // signed 32 bit integer
      int32: { type: "number", validate: validateInt32 },
      // signed 64 bit integer
      int64: { type: "number", validate: validateInt64 },
      // C-type float
      float: { type: "number", validate: validateNumber },
      // C-type double
      double: { type: "number", validate: validateNumber },
      // hint to the UI to hide input strings
      password: true,
      // unchecked string payload
      binary: true
    };
    exports.fastFormats = {
      ...exports.fullFormats,
      date: fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, compareDate),
      time: fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareTime),
      "date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareDateTime),
      "iso-time": fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoTime),
      "iso-date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoDateTime),
      // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
      uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
      "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
      // email (sources from jsen validator):
      // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
      // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'wilful violation')
      email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
    };
    exports.formatNames = Object.keys(exports.fullFormats);
    function isLeapYear(year) {
      return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }
    __name(isLeapYear, "isLeapYear");
    var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
    var DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function date(str) {
      const matches = DATE.exec(str);
      if (!matches)
        return false;
      const year = +matches[1];
      const month = +matches[2];
      const day = +matches[3];
      return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
    }
    __name(date, "date");
    function compareDate(d1, d2) {
      if (!(d1 && d2))
        return void 0;
      if (d1 > d2)
        return 1;
      if (d1 < d2)
        return -1;
      return 0;
    }
    __name(compareDate, "compareDate");
    var TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
    function getTime(strictTimeZone) {
      return /* @__PURE__ */ __name(function time(str) {
        const matches = TIME.exec(str);
        if (!matches)
          return false;
        const hr = +matches[1];
        const min = +matches[2];
        const sec = +matches[3];
        const tz = matches[4];
        const tzSign = matches[5] === "-" ? -1 : 1;
        const tzH = +(matches[6] || 0);
        const tzM = +(matches[7] || 0);
        if (tzH > 23 || tzM > 59 || strictTimeZone && !tz)
          return false;
        if (hr <= 23 && min <= 59 && sec < 60)
          return true;
        const utcMin = min - tzM * tzSign;
        const utcHr = hr - tzH * tzSign - (utcMin < 0 ? 1 : 0);
        return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61;
      }, "time");
    }
    __name(getTime, "getTime");
    function compareTime(s1, s2) {
      if (!(s1 && s2))
        return void 0;
      const t1 = (/* @__PURE__ */ new Date("2020-01-01T" + s1)).valueOf();
      const t2 = (/* @__PURE__ */ new Date("2020-01-01T" + s2)).valueOf();
      if (!(t1 && t2))
        return void 0;
      return t1 - t2;
    }
    __name(compareTime, "compareTime");
    function compareIsoTime(t1, t2) {
      if (!(t1 && t2))
        return void 0;
      const a1 = TIME.exec(t1);
      const a2 = TIME.exec(t2);
      if (!(a1 && a2))
        return void 0;
      t1 = a1[1] + a1[2] + a1[3];
      t2 = a2[1] + a2[2] + a2[3];
      if (t1 > t2)
        return 1;
      if (t1 < t2)
        return -1;
      return 0;
    }
    __name(compareIsoTime, "compareIsoTime");
    var DATE_TIME_SEPARATOR = /t|\s/i;
    function getDateTime(strictTimeZone) {
      const time = getTime(strictTimeZone);
      return /* @__PURE__ */ __name(function date_time(str) {
        const dateTime = str.split(DATE_TIME_SEPARATOR);
        return dateTime.length === 2 && date(dateTime[0]) && time(dateTime[1]);
      }, "date_time");
    }
    __name(getDateTime, "getDateTime");
    function compareDateTime(dt1, dt2) {
      if (!(dt1 && dt2))
        return void 0;
      const d1 = new Date(dt1).valueOf();
      const d2 = new Date(dt2).valueOf();
      if (!(d1 && d2))
        return void 0;
      return d1 - d2;
    }
    __name(compareDateTime, "compareDateTime");
    function compareIsoDateTime(dt1, dt2) {
      if (!(dt1 && dt2))
        return void 0;
      const [d1, t1] = dt1.split(DATE_TIME_SEPARATOR);
      const [d2, t2] = dt2.split(DATE_TIME_SEPARATOR);
      const res = compareDate(d1, d2);
      if (res === void 0)
        return void 0;
      return res || compareTime(t1, t2);
    }
    __name(compareIsoDateTime, "compareIsoDateTime");
    var NOT_URI_FRAGMENT = /\/|:/;
    var URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    function uri(str) {
      return NOT_URI_FRAGMENT.test(str) && URI.test(str);
    }
    __name(uri, "uri");
    var BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
    function byte(str) {
      BYTE.lastIndex = 0;
      return BYTE.test(str);
    }
    __name(byte, "byte");
    var MIN_INT32 = -(2 ** 31);
    var MAX_INT32 = 2 ** 31 - 1;
    function validateInt32(value) {
      return Number.isInteger(value) && value <= MAX_INT32 && value >= MIN_INT32;
    }
    __name(validateInt32, "validateInt32");
    function validateInt64(value) {
      return Number.isInteger(value);
    }
    __name(validateInt64, "validateInt64");
    function validateNumber() {
      return true;
    }
    __name(validateNumber, "validateNumber");
    var Z_ANCHOR = /[^\\]\\Z/;
    function regex(str) {
      if (Z_ANCHOR.test(str))
        return false;
      try {
        new RegExp(str);
        return true;
      } catch (e) {
        return false;
      }
    }
    __name(regex, "regex");
  }
});

// node_modules/ajv-formats/dist/limit.js
var require_limit = __commonJS({
  "node_modules/ajv-formats/dist/limit.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.formatLimitDefinition = void 0;
    var ajv_1 = require_ajv();
    var codegen_1 = require_codegen();
    var ops = codegen_1.operators;
    var KWDs = {
      formatMaximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
      formatMinimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
      formatExclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
      formatExclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
    };
    var error = {
      message: /* @__PURE__ */ __name(({ keyword, schemaCode }) => (0, codegen_1.str)`should be ${KWDs[keyword].okStr} ${schemaCode}`, "message"),
      params: /* @__PURE__ */ __name(({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`, "params")
    };
    exports.formatLimitDefinition = {
      keyword: Object.keys(KWDs),
      type: "string",
      schemaType: "string",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, schemaCode, keyword, it } = cxt;
        const { opts, self } = it;
        if (!opts.validateFormats)
          return;
        const fCxt = new ajv_1.KeywordCxt(it, self.RULES.all.format.definition, "format");
        if (fCxt.$data)
          validate$DataFormat();
        else
          validateFormat();
        function validate$DataFormat() {
          const fmts = gen.scopeValue("formats", {
            ref: self.formats,
            code: opts.code.formats
          });
          const fmt = gen.const("fmt", (0, codegen_1._)`${fmts}[${fCxt.schemaCode}]`);
          cxt.fail$data((0, codegen_1.or)((0, codegen_1._)`typeof ${fmt} != "object"`, (0, codegen_1._)`${fmt} instanceof RegExp`, (0, codegen_1._)`typeof ${fmt}.compare != "function"`, compareCode(fmt)));
        }
        __name(validate$DataFormat, "validate$DataFormat");
        function validateFormat() {
          const format = fCxt.schema;
          const fmtDef = self.formats[format];
          if (!fmtDef || fmtDef === true)
            return;
          if (typeof fmtDef != "object" || fmtDef instanceof RegExp || typeof fmtDef.compare != "function") {
            throw new Error(`"${keyword}": format "${format}" does not define "compare" function`);
          }
          const fmt = gen.scopeValue("formats", {
            key: format,
            ref: fmtDef,
            code: opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(format)}` : void 0
          });
          cxt.fail$data(compareCode(fmt));
        }
        __name(validateFormat, "validateFormat");
        function compareCode(fmt) {
          return (0, codegen_1._)`${fmt}.compare(${data}, ${schemaCode}) ${KWDs[keyword].fail} 0`;
        }
        __name(compareCode, "compareCode");
      },
      dependencies: ["format"]
    };
    var formatLimitPlugin = /* @__PURE__ */ __name((ajv) => {
      ajv.addKeyword(exports.formatLimitDefinition);
      return ajv;
    }, "formatLimitPlugin");
    exports.default = formatLimitPlugin;
  }
});

// node_modules/ajv-formats/dist/index.js
var require_dist = __commonJS({
  "node_modules/ajv-formats/dist/index.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var formats_1 = require_formats();
    var limit_1 = require_limit();
    var codegen_1 = require_codegen();
    var fullName = new codegen_1.Name("fullFormats");
    var fastName = new codegen_1.Name("fastFormats");
    var formatsPlugin = /* @__PURE__ */ __name((ajv, opts = { keywords: true }) => {
      if (Array.isArray(opts)) {
        addFormats(ajv, opts, formats_1.fullFormats, fullName);
        return ajv;
      }
      const [formats, exportName] = opts.mode === "fast" ? [formats_1.fastFormats, fastName] : [formats_1.fullFormats, fullName];
      const list = opts.formats || formats_1.formatNames;
      addFormats(ajv, list, formats, exportName);
      if (opts.keywords)
        (0, limit_1.default)(ajv);
      return ajv;
    }, "formatsPlugin");
    formatsPlugin.get = (name, mode = "full") => {
      const formats = mode === "fast" ? formats_1.fastFormats : formats_1.fullFormats;
      const f = formats[name];
      if (!f)
        throw new Error(`Unknown format "${name}"`);
      return f;
    };
    function addFormats(ajv, list, fs5, exportName) {
      var _a;
      var _b;
      (_a = (_b = ajv.opts.code).formats) !== null && _a !== void 0 ? _a : _b.formats = (0, codegen_1._)`require("ajv-formats/dist/formats").${exportName}`;
      for (const f of list)
        ajv.addFormat(f, fs5[f]);
    }
    __name(addFormats, "addFormats");
    module.exports = exports = formatsPlugin;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = formatsPlugin;
  }
});

// src/errors/redact.ts
var redact_exports = {};
__export(redact_exports, {
  ErrorService: () => ErrorService
});
var ErrorService;
var init_redact = __esm({
  "src/errors/redact.ts"() {
    "use strict";
    ErrorService = class {
      static {
        __name(this, "ErrorService");
      }
      /**
       * Patterns to match and redact sensitive information
       *
       * Covers:
       * - Authorization: Bearer <token>
       * - Authorization: Basic <base64>
       * - api_key=value, api-key=value, apikey=value
       * - token=value, secret=value, password=value
       * - Standalone Base64 strings after "Basic"
       */
      static REDACTION_PATTERNS = [
        // Authorization headers with Bearer token
        /Authorization:\s*Bearer\s+[^\s]+/gi,
        // Authorization headers with Basic auth
        /Authorization:\s*Basic\s+[^\s]+/gi,
        // API key patterns (various formats)
        /\b(api[_-]?key|apikey|token|secret|password)\s*[=:]\s*[^\s&,;]+/gi,
        // Base64 encoded credentials (after Basic keyword)
        /Basic\s+[A-Za-z0-9+/]+=*/g,
        // Query parameter tokens
        /([?&])(token|key|secret|password|apikey|api_key)=([^&\s]*)/gi
      ];
      /**
       * Field names that should always be redacted in objects
       */
      static SENSITIVE_FIELD_NAMES = /* @__PURE__ */ new Set([
        "password",
        "token",
        "apikey",
        "api_key",
        "api-key",
        "secret",
        "authorization",
        "auth",
        "bearer",
        "credentials"
      ]);
      /**
       * Redact sensitive information from a string
       *
       * @param text - Input string that may contain secrets
       * @returns Redacted string with secrets replaced by [REDACTED]
       *
       * @example
       * ErrorService.redact('Authorization: Bearer abc123')
       * // Returns: 'Authorization: Bearer [REDACTED]'
       *
       * @example
       * ErrorService.redact('Connect to API with token=secret123')
       * // Returns: 'Connect to API with token=[REDACTED]'
       */
      static redact(text) {
        if (typeof text !== "string") {
          return text;
        }
        let redacted = text;
        for (const pattern of this.REDACTION_PATTERNS) {
          redacted = redacted.replace(pattern, (match2, group1, group2) => {
            if (group1 && group2) {
              return `${group1}=[REDACTED]`;
            } else if (group1) {
              return `${group1}=[REDACTED]`;
            }
            const colonIndex = match2.indexOf(":");
            if (colonIndex !== -1) {
              return match2.substring(0, colonIndex + 1) + " [REDACTED]";
            }
            const equalsIndex = match2.indexOf("=");
            if (equalsIndex !== -1) {
              return match2.substring(0, equalsIndex + 1) + "[REDACTED]";
            }
            return match2.replace(/[^\s:=]+$/, "[REDACTED]");
          });
        }
        return redacted;
      }
      /**
       * Redact sensitive fields in an object recursively
       *
       * @param obj - Object that may contain sensitive fields
       * @returns New object with sensitive fields redacted
       *
       * @example
       * ErrorService.redactObject({ username: 'user', password: 'secret' })
       * // Returns: { username: 'user', password: '[REDACTED]' }
       *
       * @example
       * ErrorService.redactObject({
       *   headers: { Authorization: 'Bearer token123' },
       *   data: { apiKey: 'secret' }
       * })
       * // Returns: {
       * //   headers: { Authorization: '[REDACTED]' },
       * //   data: { apiKey: '[REDACTED]' }
       * // }
       */
      static redactObject(obj) {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          const normalizedKey = key.toLowerCase().replace(/[_-]/g, "");
          const isSensitiveField = this.SENSITIVE_FIELD_NAMES.has(normalizedKey) || Array.from(this.SENSITIVE_FIELD_NAMES).some(
            (field) => normalizedKey.includes(field.toLowerCase())
          );
          if (isSensitiveField && typeof value === "string") {
            result[key] = "[REDACTED]";
          } else if (typeof value === "string") {
            result[key] = this.redact(value);
          } else if (Array.isArray(value)) {
            result[key] = value.map((item) => {
              if (typeof item === "string") {
                return this.redact(item);
              } else if (item && typeof item === "object") {
                return this.redactObject(item);
              }
              return item;
            });
          } else if (value && typeof value === "object") {
            result[key] = this.redactObject(value);
          } else {
            result[key] = value;
          }
        }
        return result;
      }
      /**
       * Check if a string contains any sensitive patterns
       *
       * Useful for logging decisions - avoid logging entirely if sensitive
       *
       * @param text - Text to check
       * @returns true if text contains sensitive information
       */
      static containsSensitiveData(text) {
        if (typeof text !== "string") {
          return false;
        }
        return this.REDACTION_PATTERNS.some((pattern) => pattern.test(text));
      }
    };
  }
});

// node_modules/balanced-match/index.js
var require_balanced_match = __commonJS({
  "node_modules/balanced-match/index.js"(exports, module) {
    "use strict";
    module.exports = balanced;
    function balanced(a, b, str) {
      if (a instanceof RegExp) a = maybeMatch(a, str);
      if (b instanceof RegExp) b = maybeMatch(b, str);
      var r = range(a, b, str);
      return r && {
        start: r[0],
        end: r[1],
        pre: str.slice(0, r[0]),
        body: str.slice(r[0] + a.length, r[1]),
        post: str.slice(r[1] + b.length)
      };
    }
    __name(balanced, "balanced");
    function maybeMatch(reg, str) {
      var m = str.match(reg);
      return m ? m[0] : null;
    }
    __name(maybeMatch, "maybeMatch");
    balanced.range = range;
    function range(a, b, str) {
      var begs, beg, left, right, result;
      var ai = str.indexOf(a);
      var bi = str.indexOf(b, ai + 1);
      var i = ai;
      if (ai >= 0 && bi > 0) {
        if (a === b) {
          return [ai, bi];
        }
        begs = [];
        left = str.length;
        while (i >= 0 && !result) {
          if (i == ai) {
            begs.push(i);
            ai = str.indexOf(a, i + 1);
          } else if (begs.length == 1) {
            result = [begs.pop(), bi];
          } else {
            beg = begs.pop();
            if (beg < left) {
              left = beg;
              right = bi;
            }
            bi = str.indexOf(b, i + 1);
          }
          i = ai < bi && ai >= 0 ? ai : bi;
        }
        if (begs.length) {
          result = [left, right];
        }
      }
      return result;
    }
    __name(range, "range");
  }
});

// node_modules/brace-expansion/index.js
var require_brace_expansion = __commonJS({
  "node_modules/brace-expansion/index.js"(exports, module) {
    var balanced = require_balanced_match();
    module.exports = expandTop;
    var escSlash = "\0SLASH" + Math.random() + "\0";
    var escOpen = "\0OPEN" + Math.random() + "\0";
    var escClose = "\0CLOSE" + Math.random() + "\0";
    var escComma = "\0COMMA" + Math.random() + "\0";
    var escPeriod = "\0PERIOD" + Math.random() + "\0";
    function numeric(str) {
      return parseInt(str, 10) == str ? parseInt(str, 10) : str.charCodeAt(0);
    }
    __name(numeric, "numeric");
    function escapeBraces(str) {
      return str.split("\\\\").join(escSlash).split("\\{").join(escOpen).split("\\}").join(escClose).split("\\,").join(escComma).split("\\.").join(escPeriod);
    }
    __name(escapeBraces, "escapeBraces");
    function unescapeBraces(str) {
      return str.split(escSlash).join("\\").split(escOpen).join("{").split(escClose).join("}").split(escComma).join(",").split(escPeriod).join(".");
    }
    __name(unescapeBraces, "unescapeBraces");
    function parseCommaParts(str) {
      if (!str)
        return [""];
      var parts = [];
      var m = balanced("{", "}", str);
      if (!m)
        return str.split(",");
      var pre = m.pre;
      var body = m.body;
      var post = m.post;
      var p = pre.split(",");
      p[p.length - 1] += "{" + body + "}";
      var postParts = parseCommaParts(post);
      if (post.length) {
        p[p.length - 1] += postParts.shift();
        p.push.apply(p, postParts);
      }
      parts.push.apply(parts, p);
      return parts;
    }
    __name(parseCommaParts, "parseCommaParts");
    function expandTop(str) {
      if (!str)
        return [];
      if (str.substr(0, 2) === "{}") {
        str = "\\{\\}" + str.substr(2);
      }
      return expand2(escapeBraces(str), true).map(unescapeBraces);
    }
    __name(expandTop, "expandTop");
    function embrace(str) {
      return "{" + str + "}";
    }
    __name(embrace, "embrace");
    function isPadded(el) {
      return /^-?0\d/.test(el);
    }
    __name(isPadded, "isPadded");
    function lte(i, y) {
      return i <= y;
    }
    __name(lte, "lte");
    function gte(i, y) {
      return i >= y;
    }
    __name(gte, "gte");
    function expand2(str, isTop) {
      var expansions = [];
      var m = balanced("{", "}", str);
      if (!m) return [str];
      var pre = m.pre;
      var post = m.post.length ? expand2(m.post, false) : [""];
      if (/\$$/.test(m.pre)) {
        for (var k = 0; k < post.length; k++) {
          var expansion = pre + "{" + m.body + "}" + post[k];
          expansions.push(expansion);
        }
      } else {
        var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
        var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
        var isSequence = isNumericSequence || isAlphaSequence;
        var isOptions = m.body.indexOf(",") >= 0;
        if (!isSequence && !isOptions) {
          if (m.post.match(/,(?!,).*\}/)) {
            str = m.pre + "{" + m.body + escClose + m.post;
            return expand2(str);
          }
          return [str];
        }
        var n;
        if (isSequence) {
          n = m.body.split(/\.\./);
        } else {
          n = parseCommaParts(m.body);
          if (n.length === 1) {
            n = expand2(n[0], false).map(embrace);
            if (n.length === 1) {
              return post.map(function(p) {
                return m.pre + n[0] + p;
              });
            }
          }
        }
        var N;
        if (isSequence) {
          var x = numeric(n[0]);
          var y = numeric(n[1]);
          var width = Math.max(n[0].length, n[1].length);
          var incr = n.length == 3 ? Math.abs(numeric(n[2])) : 1;
          var test = lte;
          var reverse = y < x;
          if (reverse) {
            incr *= -1;
            test = gte;
          }
          var pad = n.some(isPadded);
          N = [];
          for (var i = x; test(i, y); i += incr) {
            var c;
            if (isAlphaSequence) {
              c = String.fromCharCode(i);
              if (c === "\\")
                c = "";
            } else {
              c = String(i);
              if (pad) {
                var need = width - c.length;
                if (need > 0) {
                  var z = new Array(need + 1).join("0");
                  if (i < 0)
                    c = "-" + z + c.slice(1);
                  else
                    c = z + c;
                }
              }
            }
            N.push(c);
          }
        } else {
          N = [];
          for (var j = 0; j < n.length; j++) {
            N.push.apply(N, expand2(n[j], false));
          }
        }
        for (var j = 0; j < N.length; j++) {
          for (var k = 0; k < post.length; k++) {
            var expansion = pre + N[j] + post[k];
            if (!isTop || isSequence || expansion)
              expansions.push(expansion);
          }
        }
      }
      return expansions;
    }
    __name(expand2, "expand");
  }
});

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  __name(assertIs, "assertIs");
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  __name(assertNever, "assertNever");
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  __name(joinValues, "joinValues");
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = /* @__PURE__ */ __name((data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
}, "getParsedType");

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = /* @__PURE__ */ __name((obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
}, "quotelessJson");
var ZodError = class _ZodError extends Error {
  static {
    __name(this, "ZodError");
  }
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = /* @__PURE__ */ __name((error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    }, "processError");
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = /* @__PURE__ */ __name((issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
}, "errorMap");
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
__name(setErrorMap, "setErrorMap");
function getErrorMap() {
  return overrideErrorMap;
}
__name(getErrorMap, "getErrorMap");

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = /* @__PURE__ */ __name((params) => {
  const { data, path: path9, errorMaps, issueData } = params;
  const fullPath = [...path9, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
}, "makeIssue");
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
__name(addIssueToContext, "addIssueToContext");
var ParseStatus = class _ParseStatus {
  static {
    __name(this, "ParseStatus");
  }
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = /* @__PURE__ */ __name((value) => ({ status: "dirty", value }), "DIRTY");
var OK = /* @__PURE__ */ __name((value) => ({ status: "valid", value }), "OK");
var isAborted = /* @__PURE__ */ __name((x) => x.status === "aborted", "isAborted");
var isDirty = /* @__PURE__ */ __name((x) => x.status === "dirty", "isDirty");
var isValid = /* @__PURE__ */ __name((x) => x.status === "valid", "isValid");
var isAsync = /* @__PURE__ */ __name((x) => typeof Promise !== "undefined" && x instanceof Promise, "isAsync");

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  static {
    __name(this, "ParseInputLazyPath");
  }
  constructor(parent, value, path9, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path9;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = /* @__PURE__ */ __name((ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
}, "handleResult");
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = /* @__PURE__ */ __name((iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  }, "customMap");
  return { errorMap: customMap, description };
}
__name(processCreateParams, "processCreateParams");
var ZodType = class {
  static {
    __name(this, "ZodType");
  }
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = /* @__PURE__ */ __name((val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    }, "getIssueProperties");
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = /* @__PURE__ */ __name(() => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      }), "setError");
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: /* @__PURE__ */ __name((data) => this["~validate"](data), "validate")
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
__name(timeRegexSource, "timeRegexSource");
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
__name(timeRegex, "timeRegex");
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
__name(datetimeRegex, "datetimeRegex");
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
__name(isValidIP, "isValidIP");
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
__name(isValidJWT, "isValidJWT");
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
__name(isValidCidr, "isValidCidr");
var ZodString = class _ZodString extends ZodType {
  static {
    __name(this, "ZodString");
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
__name(floatSafeRemainder, "floatSafeRemainder");
var ZodNumber = class _ZodNumber extends ZodType {
  static {
    __name(this, "ZodNumber");
  }
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  static {
    __name(this, "ZodBigInt");
  }
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  static {
    __name(this, "ZodBoolean");
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  static {
    __name(this, "ZodDate");
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  static {
    __name(this, "ZodSymbol");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  static {
    __name(this, "ZodUndefined");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  static {
    __name(this, "ZodNull");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  static {
    __name(this, "ZodAny");
  }
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  static {
    __name(this, "ZodUnknown");
  }
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  static {
    __name(this, "ZodNever");
  }
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  static {
    __name(this, "ZodVoid");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  static {
    __name(this, "ZodArray");
  }
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
__name(deepPartialify, "deepPartialify");
var ZodObject = class _ZodObject extends ZodType {
  static {
    __name(this, "ZodObject");
  }
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: /* @__PURE__ */ __name((issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }, "errorMap")
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => ({
        ...this._def.shape(),
        ...augmentation
      }), "shape")
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: /* @__PURE__ */ __name(() => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }), "shape"),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => shape, "shape")
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => shape, "shape")
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: /* @__PURE__ */ __name(() => shape, "shape"),
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: /* @__PURE__ */ __name(() => shape, "shape"),
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  static {
    __name(this, "ZodUnion");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    __name(handleResults, "handleResults");
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types2, params) => {
  return new ZodUnion({
    options: types2,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = /* @__PURE__ */ __name((type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
}, "getDiscriminator");
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  static {
    __name(this, "ZodDiscriminatedUnion");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
__name(mergeValues, "mergeValues");
var ZodIntersection = class extends ZodType {
  static {
    __name(this, "ZodIntersection");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = /* @__PURE__ */ __name((parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    }, "handleParsed");
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  static {
    __name(this, "ZodTuple");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  static {
    __name(this, "ZodRecord");
  }
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  static {
    __name(this, "ZodMap");
  }
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  static {
    __name(this, "ZodSet");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    __name(finalizeSet, "finalizeSet");
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  static {
    __name(this, "ZodFunction");
  }
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    __name(makeArgsIssue, "makeArgsIssue");
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    __name(makeReturnsIssue, "makeReturnsIssue");
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  static {
    __name(this, "ZodLazy");
  }
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  static {
    __name(this, "ZodLiteral");
  }
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
__name(createZodEnum, "createZodEnum");
var ZodEnum = class _ZodEnum extends ZodType {
  static {
    __name(this, "ZodEnum");
  }
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  static {
    __name(this, "ZodNativeEnum");
  }
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  static {
    __name(this, "ZodPromise");
  }
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  static {
    __name(this, "ZodEffects");
  }
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: /* @__PURE__ */ __name((arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      }, "addIssue"),
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = /* @__PURE__ */ __name((acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      }, "executeRefinement");
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  static {
    __name(this, "ZodOptional");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  static {
    __name(this, "ZodNullable");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  static {
    __name(this, "ZodDefault");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  static {
    __name(this, "ZodCatch");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  static {
    __name(this, "ZodNaN");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  static {
    __name(this, "ZodBranded");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  static {
    __name(this, "ZodPipeline");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = /* @__PURE__ */ __name(async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      }, "handleAsync");
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  static {
    __name(this, "ZodReadonly");
  }
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = /* @__PURE__ */ __name((data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    }, "freeze");
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
__name(cleanParams, "cleanParams");
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
__name(custom, "custom");
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = /* @__PURE__ */ __name((cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params), "instanceOfType");
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = /* @__PURE__ */ __name(() => stringType().optional(), "ostring");
var onumber = /* @__PURE__ */ __name(() => numberType().optional(), "onumber");
var oboolean = /* @__PURE__ */ __name(() => booleanType().optional(), "oboolean");
var coerce = {
  string: /* @__PURE__ */ __name(((arg) => ZodString.create({ ...arg, coerce: true })), "string"),
  number: /* @__PURE__ */ __name(((arg) => ZodNumber.create({ ...arg, coerce: true })), "number"),
  boolean: /* @__PURE__ */ __name(((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })), "boolean"),
  bigint: /* @__PURE__ */ __name(((arg) => ZodBigInt.create({ ...arg, coerce: true })), "bigint"),
  date: /* @__PURE__ */ __name(((arg) => ZodDate.create({ ...arg, coerce: true })), "date")
};
var NEVER = INVALID;

// node_modules/@modelcontextprotocol/sdk/dist/esm/types.js
var LATEST_PROTOCOL_VERSION = "2025-06-18";
var SUPPORTED_PROTOCOL_VERSIONS = [LATEST_PROTOCOL_VERSION, "2025-03-26", "2024-11-05", "2024-10-07"];
var JSONRPC_VERSION = "2.0";
var AssertObjectSchema = external_exports.custom((v) => v !== null && (typeof v === "object" || typeof v === "function"));
var ProgressTokenSchema = external_exports.union([external_exports.string(), external_exports.number().int()]);
var CursorSchema = external_exports.string();
var RequestMetaSchema = external_exports.object({
  /**
   * If specified, the caller is requesting out-of-band progress notifications for this request (as represented by notifications/progress). The value of this parameter is an opaque token that will be attached to any subsequent notifications. The receiver is not obligated to provide these notifications.
   */
  progressToken: ProgressTokenSchema.optional()
}).passthrough();
var BaseRequestParamsSchema = external_exports.object({
  /**
   * See [General fields: `_meta`](/specification/draft/basic/index#meta) for notes on `_meta` usage.
   */
  _meta: RequestMetaSchema.optional()
});
var RequestSchema = external_exports.object({
  method: external_exports.string(),
  params: BaseRequestParamsSchema.passthrough().optional()
});
var NotificationsParamsSchema = external_exports.object({
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: external_exports.record(external_exports.string(), external_exports.unknown()).optional()
});
var NotificationSchema = external_exports.object({
  method: external_exports.string(),
  params: NotificationsParamsSchema.passthrough().optional()
});
var ResultSchema = external_exports.object({
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: external_exports.record(external_exports.string(), external_exports.unknown()).optional()
}).passthrough();
var RequestIdSchema = external_exports.union([external_exports.string(), external_exports.number().int()]);
var JSONRPCRequestSchema = external_exports.object({
  jsonrpc: external_exports.literal(JSONRPC_VERSION),
  id: RequestIdSchema
}).merge(RequestSchema).strict();
var isJSONRPCRequest = /* @__PURE__ */ __name((value) => JSONRPCRequestSchema.safeParse(value).success, "isJSONRPCRequest");
var JSONRPCNotificationSchema = external_exports.object({
  jsonrpc: external_exports.literal(JSONRPC_VERSION)
}).merge(NotificationSchema).strict();
var isJSONRPCNotification = /* @__PURE__ */ __name((value) => JSONRPCNotificationSchema.safeParse(value).success, "isJSONRPCNotification");
var JSONRPCResponseSchema = external_exports.object({
  jsonrpc: external_exports.literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  result: ResultSchema
}).strict();
var isJSONRPCResponse = /* @__PURE__ */ __name((value) => JSONRPCResponseSchema.safeParse(value).success, "isJSONRPCResponse");
var ErrorCode;
(function(ErrorCode2) {
  ErrorCode2[ErrorCode2["ConnectionClosed"] = -32e3] = "ConnectionClosed";
  ErrorCode2[ErrorCode2["RequestTimeout"] = -32001] = "RequestTimeout";
  ErrorCode2[ErrorCode2["ParseError"] = -32700] = "ParseError";
  ErrorCode2[ErrorCode2["InvalidRequest"] = -32600] = "InvalidRequest";
  ErrorCode2[ErrorCode2["MethodNotFound"] = -32601] = "MethodNotFound";
  ErrorCode2[ErrorCode2["InvalidParams"] = -32602] = "InvalidParams";
  ErrorCode2[ErrorCode2["InternalError"] = -32603] = "InternalError";
})(ErrorCode || (ErrorCode = {}));
var JSONRPCErrorSchema = external_exports.object({
  jsonrpc: external_exports.literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  error: external_exports.object({
    /**
     * The error type that occurred.
     */
    code: external_exports.number().int(),
    /**
     * A short description of the error. The message SHOULD be limited to a concise single sentence.
     */
    message: external_exports.string(),
    /**
     * Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.).
     */
    data: external_exports.optional(external_exports.unknown())
  })
}).strict();
var isJSONRPCError = /* @__PURE__ */ __name((value) => JSONRPCErrorSchema.safeParse(value).success, "isJSONRPCError");
var JSONRPCMessageSchema = external_exports.union([JSONRPCRequestSchema, JSONRPCNotificationSchema, JSONRPCResponseSchema, JSONRPCErrorSchema]);
var EmptyResultSchema = ResultSchema.strict();
var CancelledNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The ID of the request to cancel.
   *
   * This MUST correspond to the ID of a request previously issued in the same direction.
   */
  requestId: RequestIdSchema,
  /**
   * An optional string describing the reason for the cancellation. This MAY be logged or presented to the user.
   */
  reason: external_exports.string().optional()
});
var CancelledNotificationSchema = NotificationSchema.extend({
  method: external_exports.literal("notifications/cancelled"),
  params: CancelledNotificationParamsSchema
});
var IconSchema = external_exports.object({
  /**
   * URL or data URI for the icon.
   */
  src: external_exports.string(),
  /**
   * Optional MIME type for the icon.
   */
  mimeType: external_exports.string().optional(),
  /**
   * Optional array of strings that specify sizes at which the icon can be used.
   * Each string should be in WxH format (e.g., `"48x48"`, `"96x96"`) or `"any"` for scalable formats like SVG.
   *
   * If not provided, the client should assume that the icon can be used at any size.
   */
  sizes: external_exports.array(external_exports.string()).optional()
});
var IconsSchema = external_exports.object({
  /**
   * Optional set of sized icons that the client can display in a user interface.
   *
   * Clients that support rendering icons MUST support at least the following MIME types:
   * - `image/png` - PNG images (safe, universal compatibility)
   * - `image/jpeg` (and `image/jpg`) - JPEG images (safe, universal compatibility)
   *
   * Clients that support rendering icons SHOULD also support:
   * - `image/svg+xml` - SVG images (scalable but requires security precautions)
   * - `image/webp` - WebP images (modern, efficient format)
   */
  icons: external_exports.array(IconSchema).optional()
});
var BaseMetadataSchema = external_exports.object({
  /** Intended for programmatic or logical use, but used as a display name in past specs or fallback */
  name: external_exports.string(),
  /**
   * Intended for UI and end-user contexts — optimized to be human-readable and easily understood,
   * even by those unfamiliar with domain-specific terminology.
   *
   * If not provided, the name should be used for display (except for Tool,
   * where `annotations.title` should be given precedence over using `name`,
   * if present).
   */
  title: external_exports.string().optional()
});
var ImplementationSchema = BaseMetadataSchema.extend({
  version: external_exports.string(),
  /**
   * An optional URL of the website for this implementation.
   */
  websiteUrl: external_exports.string().optional()
}).merge(IconsSchema);
var ClientCapabilitiesSchema = external_exports.object({
  /**
   * Experimental, non-standard capabilities that the client supports.
   */
  experimental: external_exports.record(external_exports.string(), AssertObjectSchema).optional(),
  /**
   * Present if the client supports sampling from an LLM.
   */
  sampling: AssertObjectSchema.optional(),
  /**
   * Present if the client supports eliciting user input.
   */
  elicitation: external_exports.intersection(external_exports.object({
    /**
     * Whether the client should apply defaults to the user input.
     */
    applyDefaults: external_exports.boolean().optional()
  }).optional(), external_exports.record(external_exports.string(), external_exports.unknown()).optional()),
  /**
   * Present if the client supports listing roots.
   */
  roots: external_exports.object({
    /**
     * Whether the client supports issuing notifications for changes to the roots list.
     */
    listChanged: external_exports.boolean().optional()
  }).optional()
});
var InitializeRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The latest version of the Model Context Protocol that the client supports. The client MAY decide to support older versions as well.
   */
  protocolVersion: external_exports.string(),
  capabilities: ClientCapabilitiesSchema,
  clientInfo: ImplementationSchema
});
var InitializeRequestSchema = RequestSchema.extend({
  method: external_exports.literal("initialize"),
  params: InitializeRequestParamsSchema
});
var ServerCapabilitiesSchema = external_exports.object({
  /**
   * Experimental, non-standard capabilities that the server supports.
   */
  experimental: external_exports.record(external_exports.string(), AssertObjectSchema).optional(),
  /**
   * Present if the server supports sending log messages to the client.
   */
  logging: AssertObjectSchema.optional(),
  /**
   * Present if the server supports sending completions to the client.
   */
  completions: AssertObjectSchema.optional(),
  /**
   * Present if the server offers any prompt templates.
   */
  prompts: external_exports.optional(external_exports.object({
    /**
     * Whether this server supports issuing notifications for changes to the prompt list.
     */
    listChanged: external_exports.optional(external_exports.boolean())
  })),
  /**
   * Present if the server offers any resources to read.
   */
  resources: external_exports.object({
    /**
     * Whether this server supports clients subscribing to resource updates.
     */
    subscribe: external_exports.boolean().optional(),
    /**
     * Whether this server supports issuing notifications for changes to the resource list.
     */
    listChanged: external_exports.boolean().optional()
  }).optional(),
  /**
   * Present if the server offers any tools to call.
   */
  tools: external_exports.object({
    /**
     * Whether this server supports issuing notifications for changes to the tool list.
     */
    listChanged: external_exports.boolean().optional()
  }).optional()
});
var InitializeResultSchema = ResultSchema.extend({
  /**
   * The version of the Model Context Protocol that the server wants to use. This may not match the version that the client requested. If the client cannot support this version, it MUST disconnect.
   */
  protocolVersion: external_exports.string(),
  capabilities: ServerCapabilitiesSchema,
  serverInfo: ImplementationSchema,
  /**
   * Instructions describing how to use the server and its features.
   *
   * This can be used by clients to improve the LLM's understanding of available tools, resources, etc. It can be thought of like a "hint" to the model. For example, this information MAY be added to the system prompt.
   */
  instructions: external_exports.string().optional()
});
var InitializedNotificationSchema = NotificationSchema.extend({
  method: external_exports.literal("notifications/initialized")
});
var PingRequestSchema = RequestSchema.extend({
  method: external_exports.literal("ping")
});
var ProgressSchema = external_exports.object({
  /**
   * The progress thus far. This should increase every time progress is made, even if the total is unknown.
   */
  progress: external_exports.number(),
  /**
   * Total number of items to process (or total progress required), if known.
   */
  total: external_exports.optional(external_exports.number()),
  /**
   * An optional message describing the current progress.
   */
  message: external_exports.optional(external_exports.string())
});
var ProgressNotificationParamsSchema = NotificationsParamsSchema.merge(ProgressSchema).extend({
  /**
   * The progress token which was given in the initial request, used to associate this notification with the request that is proceeding.
   */
  progressToken: ProgressTokenSchema
});
var ProgressNotificationSchema = NotificationSchema.extend({
  method: external_exports.literal("notifications/progress"),
  params: ProgressNotificationParamsSchema
});
var PaginatedRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * An opaque token representing the current pagination position.
   * If provided, the server should return results starting after this cursor.
   */
  cursor: CursorSchema.optional()
});
var PaginatedRequestSchema = RequestSchema.extend({
  params: PaginatedRequestParamsSchema.optional()
});
var PaginatedResultSchema = ResultSchema.extend({
  /**
   * An opaque token representing the pagination position after the last returned result.
   * If present, there may be more results available.
   */
  nextCursor: external_exports.optional(CursorSchema)
});
var ResourceContentsSchema = external_exports.object({
  /**
   * The URI of this resource.
   */
  uri: external_exports.string(),
  /**
   * The MIME type of this resource, if known.
   */
  mimeType: external_exports.optional(external_exports.string()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: external_exports.record(external_exports.string(), external_exports.unknown()).optional()
});
var TextResourceContentsSchema = ResourceContentsSchema.extend({
  /**
   * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
   */
  text: external_exports.string()
});
var Base64Schema = external_exports.string().refine((val) => {
  try {
    atob(val);
    return true;
  } catch (_a) {
    return false;
  }
}, { message: "Invalid Base64 string" });
var BlobResourceContentsSchema = ResourceContentsSchema.extend({
  /**
   * A base64-encoded string representing the binary data of the item.
   */
  blob: Base64Schema
});
var ResourceSchema = BaseMetadataSchema.extend({
  /**
   * The URI of this resource.
   */
  uri: external_exports.string(),
  /**
   * A description of what this resource represents.
   *
   * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
   */
  description: external_exports.optional(external_exports.string()),
  /**
   * The MIME type of this resource, if known.
   */
  mimeType: external_exports.optional(external_exports.string()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: external_exports.optional(external_exports.object({}).passthrough())
}).merge(IconsSchema);
var ResourceTemplateSchema = BaseMetadataSchema.extend({
  /**
   * A URI template (according to RFC 6570) that can be used to construct resource URIs.
   */
  uriTemplate: external_exports.string(),
  /**
   * A description of what this template is for.
   *
   * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
   */
  description: external_exports.optional(external_exports.string()),
  /**
   * The MIME type for all resources that match this template. This should only be included if all resources matching this template have the same type.
   */
  mimeType: external_exports.optional(external_exports.string()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: external_exports.optional(external_exports.object({}).passthrough())
}).merge(IconsSchema);
var ListResourcesRequestSchema = PaginatedRequestSchema.extend({
  method: external_exports.literal("resources/list")
});
var ListResourcesResultSchema = PaginatedResultSchema.extend({
  resources: external_exports.array(ResourceSchema)
});
var ListResourceTemplatesRequestSchema = PaginatedRequestSchema.extend({
  method: external_exports.literal("resources/templates/list")
});
var ListResourceTemplatesResultSchema = PaginatedResultSchema.extend({
  resourceTemplates: external_exports.array(ResourceTemplateSchema)
});
var ResourceRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The URI of the resource to read. The URI can use any protocol; it is up to the server how to interpret it.
   *
   * @format uri
   */
  uri: external_exports.string()
});
var ReadResourceRequestParamsSchema = ResourceRequestParamsSchema;
var ReadResourceRequestSchema = RequestSchema.extend({
  method: external_exports.literal("resources/read"),
  params: ReadResourceRequestParamsSchema
});
var ReadResourceResultSchema = ResultSchema.extend({
  contents: external_exports.array(external_exports.union([TextResourceContentsSchema, BlobResourceContentsSchema]))
});
var ResourceListChangedNotificationSchema = NotificationSchema.extend({
  method: external_exports.literal("notifications/resources/list_changed")
});
var SubscribeRequestParamsSchema = ResourceRequestParamsSchema;
var SubscribeRequestSchema = RequestSchema.extend({
  method: external_exports.literal("resources/subscribe"),
  params: SubscribeRequestParamsSchema
});
var UnsubscribeRequestParamsSchema = ResourceRequestParamsSchema;
var UnsubscribeRequestSchema = RequestSchema.extend({
  method: external_exports.literal("resources/unsubscribe"),
  params: UnsubscribeRequestParamsSchema
});
var ResourceUpdatedNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The URI of the resource that has been updated. This might be a sub-resource of the one that the client actually subscribed to.
   */
  uri: external_exports.string()
});
var ResourceUpdatedNotificationSchema = NotificationSchema.extend({
  method: external_exports.literal("notifications/resources/updated"),
  params: ResourceUpdatedNotificationParamsSchema
});
var PromptArgumentSchema = external_exports.object({
  /**
   * The name of the argument.
   */
  name: external_exports.string(),
  /**
   * A human-readable description of the argument.
   */
  description: external_exports.optional(external_exports.string()),
  /**
   * Whether this argument must be provided.
   */
  required: external_exports.optional(external_exports.boolean())
});
var PromptSchema = BaseMetadataSchema.extend({
  /**
   * An optional description of what this prompt provides
   */
  description: external_exports.optional(external_exports.string()),
  /**
   * A list of arguments to use for templating the prompt.
   */
  arguments: external_exports.optional(external_exports.array(PromptArgumentSchema)),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: external_exports.optional(external_exports.object({}).passthrough())
}).merge(IconsSchema);
var ListPromptsRequestSchema = PaginatedRequestSchema.extend({
  method: external_exports.literal("prompts/list")
});
var ListPromptsResultSchema = PaginatedResultSchema.extend({
  prompts: external_exports.array(PromptSchema)
});
var GetPromptRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The name of the prompt or prompt template.
   */
  name: external_exports.string(),
  /**
   * Arguments to use for templating the prompt.
   */
  arguments: external_exports.record(external_exports.string(), external_exports.string()).optional()
});
var GetPromptRequestSchema = RequestSchema.extend({
  method: external_exports.literal("prompts/get"),
  params: GetPromptRequestParamsSchema
});
var TextContentSchema = external_exports.object({
  type: external_exports.literal("text"),
  /**
   * The text content of the message.
   */
  text: external_exports.string(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: external_exports.record(external_exports.string(), external_exports.unknown()).optional()
});
var ImageContentSchema = external_exports.object({
  type: external_exports.literal("image"),
  /**
   * The base64-encoded image data.
   */
  data: Base64Schema,
  /**
   * The MIME type of the image. Different providers may support different image types.
   */
  mimeType: external_exports.string(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: external_exports.record(external_exports.string(), external_exports.unknown()).optional()
});
var AudioContentSchema = external_exports.object({
  type: external_exports.literal("audio"),
  /**
   * The base64-encoded audio data.
   */
  data: Base64Schema,
  /**
   * The MIME type of the audio. Different providers may support different audio types.
   */
  mimeType: external_exports.string(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: external_exports.record(external_exports.string(), external_exports.unknown()).optional()
});
var EmbeddedResourceSchema = external_exports.object({
  type: external_exports.literal("resource"),
  resource: external_exports.union([TextResourceContentsSchema, BlobResourceContentsSchema]),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: external_exports.record(external_exports.string(), external_exports.unknown()).optional()
});
var ResourceLinkSchema = ResourceSchema.extend({
  type: external_exports.literal("resource_link")
});
var ContentBlockSchema = external_exports.union([
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ResourceLinkSchema,
  EmbeddedResourceSchema
]);
var PromptMessageSchema = external_exports.object({
  role: external_exports.enum(["user", "assistant"]),
  content: ContentBlockSchema
});
var GetPromptResultSchema = ResultSchema.extend({
  /**
   * An optional description for the prompt.
   */
  description: external_exports.optional(external_exports.string()),
  messages: external_exports.array(PromptMessageSchema)
});
var PromptListChangedNotificationSchema = NotificationSchema.extend({
  method: external_exports.literal("notifications/prompts/list_changed")
});
var ToolAnnotationsSchema = external_exports.object({
  /**
   * A human-readable title for the tool.
   */
  title: external_exports.string().optional(),
  /**
   * If true, the tool does not modify its environment.
   *
   * Default: false
   */
  readOnlyHint: external_exports.boolean().optional(),
  /**
   * If true, the tool may perform destructive updates to its environment.
   * If false, the tool performs only additive updates.
   *
   * (This property is meaningful only when `readOnlyHint == false`)
   *
   * Default: true
   */
  destructiveHint: external_exports.boolean().optional(),
  /**
   * If true, calling the tool repeatedly with the same arguments
   * will have no additional effect on the its environment.
   *
   * (This property is meaningful only when `readOnlyHint == false`)
   *
   * Default: false
   */
  idempotentHint: external_exports.boolean().optional(),
  /**
   * If true, this tool may interact with an "open world" of external
   * entities. If false, the tool's domain of interaction is closed.
   * For example, the world of a web search tool is open, whereas that
   * of a memory tool is not.
   *
   * Default: true
   */
  openWorldHint: external_exports.boolean().optional()
});
var ToolSchema = BaseMetadataSchema.extend({
  /**
   * A human-readable description of the tool.
   */
  description: external_exports.string().optional(),
  /**
   * A JSON Schema object defining the expected parameters for the tool.
   */
  inputSchema: external_exports.object({
    type: external_exports.literal("object"),
    properties: external_exports.record(external_exports.string(), AssertObjectSchema).optional(),
    required: external_exports.optional(external_exports.array(external_exports.string()))
  }),
  /**
   * An optional JSON Schema object defining the structure of the tool's output returned in
   * the structuredContent field of a CallToolResult.
   */
  outputSchema: external_exports.object({
    type: external_exports.literal("object"),
    properties: external_exports.record(external_exports.string(), AssertObjectSchema).optional(),
    required: external_exports.optional(external_exports.array(external_exports.string())),
    /**
     * Not in the MCP specification, but added to support the Ajv validator while removing .passthrough() which previously allowed additionalProperties to be passed through.
     */
    additionalProperties: external_exports.optional(external_exports.boolean())
  }).optional(),
  /**
   * Optional additional tool information.
   */
  annotations: external_exports.optional(ToolAnnotationsSchema),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: external_exports.record(external_exports.string(), external_exports.unknown()).optional()
}).merge(IconsSchema);
var ListToolsRequestSchema = PaginatedRequestSchema.extend({
  method: external_exports.literal("tools/list")
});
var ListToolsResultSchema = PaginatedResultSchema.extend({
  tools: external_exports.array(ToolSchema)
});
var CallToolResultSchema = ResultSchema.extend({
  /**
   * A list of content objects that represent the result of the tool call.
   *
   * If the Tool does not define an outputSchema, this field MUST be present in the result.
   * For backwards compatibility, this field is always present, but it may be empty.
   */
  content: external_exports.array(ContentBlockSchema).default([]),
  /**
   * An object containing structured tool output.
   *
   * If the Tool defines an outputSchema, this field MUST be present in the result, and contain a JSON object that matches the schema.
   */
  structuredContent: external_exports.record(external_exports.string(), external_exports.unknown()).optional(),
  /**
   * Whether the tool call ended in an error.
   *
   * If not set, this is assumed to be false (the call was successful).
   *
   * Any errors that originate from the tool SHOULD be reported inside the result
   * object, with `isError` set to true, _not_ as an MCP protocol-level error
   * response. Otherwise, the LLM would not be able to see that an error occurred
   * and self-correct.
   *
   * However, any errors in _finding_ the tool, an error indicating that the
   * server does not support tool calls, or any other exceptional conditions,
   * should be reported as an MCP error response.
   */
  isError: external_exports.optional(external_exports.boolean())
});
var CompatibilityCallToolResultSchema = CallToolResultSchema.or(ResultSchema.extend({
  toolResult: external_exports.unknown()
}));
var CallToolRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The name of the tool to call.
   */
  name: external_exports.string(),
  /**
   * Arguments to pass to the tool.
   */
  arguments: external_exports.optional(external_exports.record(external_exports.string(), external_exports.unknown()))
});
var CallToolRequestSchema = RequestSchema.extend({
  method: external_exports.literal("tools/call"),
  params: CallToolRequestParamsSchema
});
var ToolListChangedNotificationSchema = NotificationSchema.extend({
  method: external_exports.literal("notifications/tools/list_changed")
});
var LoggingLevelSchema = external_exports.enum(["debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"]);
var SetLevelRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The level of logging that the client wants to receive from the server. The server should send all logs at this level and higher (i.e., more severe) to the client as notifications/logging/message.
   */
  level: LoggingLevelSchema
});
var SetLevelRequestSchema = RequestSchema.extend({
  method: external_exports.literal("logging/setLevel"),
  params: SetLevelRequestParamsSchema
});
var LoggingMessageNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The severity of this log message.
   */
  level: LoggingLevelSchema,
  /**
   * An optional name of the logger issuing this message.
   */
  logger: external_exports.string().optional(),
  /**
   * The data to be logged, such as a string message or an object. Any JSON serializable type is allowed here.
   */
  data: external_exports.unknown()
});
var LoggingMessageNotificationSchema = NotificationSchema.extend({
  method: external_exports.literal("notifications/message"),
  params: LoggingMessageNotificationParamsSchema
});
var ModelHintSchema = external_exports.object({
  /**
   * A hint for a model name.
   */
  name: external_exports.string().optional()
});
var ModelPreferencesSchema = external_exports.object({
  /**
   * Optional hints to use for model selection.
   */
  hints: external_exports.optional(external_exports.array(ModelHintSchema)),
  /**
   * How much to prioritize cost when selecting a model.
   */
  costPriority: external_exports.optional(external_exports.number().min(0).max(1)),
  /**
   * How much to prioritize sampling speed (latency) when selecting a model.
   */
  speedPriority: external_exports.optional(external_exports.number().min(0).max(1)),
  /**
   * How much to prioritize intelligence and capabilities when selecting a model.
   */
  intelligencePriority: external_exports.optional(external_exports.number().min(0).max(1))
});
var SamplingMessageSchema = external_exports.object({
  role: external_exports.enum(["user", "assistant"]),
  content: external_exports.union([TextContentSchema, ImageContentSchema, AudioContentSchema])
});
var CreateMessageRequestParamsSchema = BaseRequestParamsSchema.extend({
  messages: external_exports.array(SamplingMessageSchema),
  /**
   * The server's preferences for which model to select. The client MAY modify or omit this request.
   */
  modelPreferences: ModelPreferencesSchema.optional(),
  /**
   * An optional system prompt the server wants to use for sampling. The client MAY modify or omit this prompt.
   */
  systemPrompt: external_exports.string().optional(),
  /**
   * A request to include context from one or more MCP servers (including the caller), to be attached to the prompt. The client MAY ignore this request.
   */
  includeContext: external_exports.enum(["none", "thisServer", "allServers"]).optional(),
  temperature: external_exports.number().optional(),
  /**
   * The requested maximum number of tokens to sample (to prevent runaway completions).
   *
   * The client MAY choose to sample fewer tokens than the requested maximum.
   */
  maxTokens: external_exports.number().int(),
  stopSequences: external_exports.array(external_exports.string()).optional(),
  /**
   * Optional metadata to pass through to the LLM provider. The format of this metadata is provider-specific.
   */
  metadata: AssertObjectSchema.optional()
});
var CreateMessageRequestSchema = RequestSchema.extend({
  method: external_exports.literal("sampling/createMessage"),
  params: CreateMessageRequestParamsSchema
});
var CreateMessageResultSchema = ResultSchema.extend({
  /**
   * The name of the model that generated the message.
   */
  model: external_exports.string(),
  /**
   * The reason why sampling stopped.
   */
  stopReason: external_exports.optional(external_exports.enum(["endTurn", "stopSequence", "maxTokens"]).or(external_exports.string())),
  role: external_exports.enum(["user", "assistant"]),
  content: external_exports.discriminatedUnion("type", [TextContentSchema, ImageContentSchema, AudioContentSchema])
});
var BooleanSchemaSchema = external_exports.object({
  type: external_exports.literal("boolean"),
  title: external_exports.string().optional(),
  description: external_exports.string().optional(),
  default: external_exports.boolean().optional()
});
var StringSchemaSchema = external_exports.object({
  type: external_exports.literal("string"),
  title: external_exports.string().optional(),
  description: external_exports.string().optional(),
  minLength: external_exports.number().optional(),
  maxLength: external_exports.number().optional(),
  format: external_exports.enum(["email", "uri", "date", "date-time"]).optional(),
  default: external_exports.string().optional()
});
var NumberSchemaSchema = external_exports.object({
  type: external_exports.enum(["number", "integer"]),
  title: external_exports.string().optional(),
  description: external_exports.string().optional(),
  minimum: external_exports.number().optional(),
  maximum: external_exports.number().optional(),
  default: external_exports.number().optional()
});
var UntitledSingleSelectEnumSchemaSchema = external_exports.object({
  type: external_exports.literal("string"),
  title: external_exports.string().optional(),
  description: external_exports.string().optional(),
  enum: external_exports.array(external_exports.string()),
  default: external_exports.string().optional()
});
var TitledSingleSelectEnumSchemaSchema = external_exports.object({
  type: external_exports.literal("string"),
  title: external_exports.string().optional(),
  description: external_exports.string().optional(),
  oneOf: external_exports.array(external_exports.object({
    const: external_exports.string(),
    title: external_exports.string()
  })),
  default: external_exports.string().optional()
});
var LegacyTitledEnumSchemaSchema = external_exports.object({
  type: external_exports.literal("string"),
  title: external_exports.string().optional(),
  description: external_exports.string().optional(),
  enum: external_exports.array(external_exports.string()),
  enumNames: external_exports.array(external_exports.string()).optional(),
  default: external_exports.string().optional()
});
var SingleSelectEnumSchemaSchema = external_exports.union([UntitledSingleSelectEnumSchemaSchema, TitledSingleSelectEnumSchemaSchema]);
var UntitledMultiSelectEnumSchemaSchema = external_exports.object({
  type: external_exports.literal("array"),
  title: external_exports.string().optional(),
  description: external_exports.string().optional(),
  minItems: external_exports.number().optional(),
  maxItems: external_exports.number().optional(),
  items: external_exports.object({
    type: external_exports.literal("string"),
    enum: external_exports.array(external_exports.string())
  }),
  default: external_exports.array(external_exports.string()).optional()
});
var TitledMultiSelectEnumSchemaSchema = external_exports.object({
  type: external_exports.literal("array"),
  title: external_exports.string().optional(),
  description: external_exports.string().optional(),
  minItems: external_exports.number().optional(),
  maxItems: external_exports.number().optional(),
  items: external_exports.object({
    anyOf: external_exports.array(external_exports.object({
      const: external_exports.string(),
      title: external_exports.string()
    }))
  }),
  default: external_exports.array(external_exports.string()).optional()
});
var MultiSelectEnumSchemaSchema = external_exports.union([UntitledMultiSelectEnumSchemaSchema, TitledMultiSelectEnumSchemaSchema]);
var EnumSchemaSchema = external_exports.union([LegacyTitledEnumSchemaSchema, SingleSelectEnumSchemaSchema, MultiSelectEnumSchemaSchema]);
var PrimitiveSchemaDefinitionSchema = external_exports.union([EnumSchemaSchema, BooleanSchemaSchema, StringSchemaSchema, NumberSchemaSchema]);
var ElicitRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The message to present to the user.
   */
  message: external_exports.string(),
  /**
   * A restricted subset of JSON Schema.
   * Only top-level properties are allowed, without nesting.
   */
  requestedSchema: external_exports.object({
    type: external_exports.literal("object"),
    properties: external_exports.record(external_exports.string(), PrimitiveSchemaDefinitionSchema),
    required: external_exports.array(external_exports.string()).optional()
  })
});
var ElicitRequestSchema = RequestSchema.extend({
  method: external_exports.literal("elicitation/create"),
  params: ElicitRequestParamsSchema
});
var ElicitResultSchema = ResultSchema.extend({
  /**
   * The user action in response to the elicitation.
   * - "accept": User submitted the form/confirmed the action
   * - "decline": User explicitly decline the action
   * - "cancel": User dismissed without making an explicit choice
   */
  action: external_exports.enum(["accept", "decline", "cancel"]),
  /**
   * The submitted form data, only present when action is "accept".
   * Contains values matching the requested schema.
   */
  content: external_exports.record(external_exports.union([external_exports.string(), external_exports.number(), external_exports.boolean(), external_exports.array(external_exports.string())])).optional()
});
var ResourceTemplateReferenceSchema = external_exports.object({
  type: external_exports.literal("ref/resource"),
  /**
   * The URI or URI template of the resource.
   */
  uri: external_exports.string()
});
var PromptReferenceSchema = external_exports.object({
  type: external_exports.literal("ref/prompt"),
  /**
   * The name of the prompt or prompt template
   */
  name: external_exports.string()
});
var CompleteRequestParamsSchema = BaseRequestParamsSchema.extend({
  ref: external_exports.union([PromptReferenceSchema, ResourceTemplateReferenceSchema]),
  /**
   * The argument's information
   */
  argument: external_exports.object({
    /**
     * The name of the argument
     */
    name: external_exports.string(),
    /**
     * The value of the argument to use for completion matching.
     */
    value: external_exports.string()
  }),
  context: external_exports.object({
    /**
     * Previously-resolved variables in a URI template or prompt.
     */
    arguments: external_exports.record(external_exports.string(), external_exports.string()).optional()
  }).optional()
});
var CompleteRequestSchema = RequestSchema.extend({
  method: external_exports.literal("completion/complete"),
  params: CompleteRequestParamsSchema
});
var CompleteResultSchema = ResultSchema.extend({
  completion: external_exports.object({
    /**
     * An array of completion values. Must not exceed 100 items.
     */
    values: external_exports.array(external_exports.string()).max(100),
    /**
     * The total number of completion options available. This can exceed the number of values actually sent in the response.
     */
    total: external_exports.optional(external_exports.number().int()),
    /**
     * Indicates whether there are additional completion options beyond those provided in the current response, even if the exact total is unknown.
     */
    hasMore: external_exports.optional(external_exports.boolean())
  }).passthrough()
});
var RootSchema = external_exports.object({
  /**
   * The URI identifying the root. This *must* start with file:// for now.
   */
  uri: external_exports.string().startsWith("file://"),
  /**
   * An optional name for the root.
   */
  name: external_exports.string().optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: external_exports.record(external_exports.string(), external_exports.unknown()).optional()
});
var ListRootsRequestSchema = RequestSchema.extend({
  method: external_exports.literal("roots/list")
});
var ListRootsResultSchema = ResultSchema.extend({
  roots: external_exports.array(RootSchema)
});
var RootsListChangedNotificationSchema = NotificationSchema.extend({
  method: external_exports.literal("notifications/roots/list_changed")
});
var ClientRequestSchema = external_exports.union([
  PingRequestSchema,
  InitializeRequestSchema,
  CompleteRequestSchema,
  SetLevelRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
  CallToolRequestSchema,
  ListToolsRequestSchema
]);
var ClientNotificationSchema = external_exports.union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  InitializedNotificationSchema,
  RootsListChangedNotificationSchema
]);
var ClientResultSchema = external_exports.union([EmptyResultSchema, CreateMessageResultSchema, ElicitResultSchema, ListRootsResultSchema]);
var ServerRequestSchema = external_exports.union([PingRequestSchema, CreateMessageRequestSchema, ElicitRequestSchema, ListRootsRequestSchema]);
var ServerNotificationSchema = external_exports.union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  LoggingMessageNotificationSchema,
  ResourceUpdatedNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
  PromptListChangedNotificationSchema
]);
var ServerResultSchema = external_exports.union([
  EmptyResultSchema,
  InitializeResultSchema,
  CompleteResultSchema,
  GetPromptResultSchema,
  ListPromptsResultSchema,
  ListResourcesResultSchema,
  ListResourceTemplatesResultSchema,
  ReadResourceResultSchema,
  CallToolResultSchema,
  ListToolsResultSchema
]);
var McpError = class extends Error {
  static {
    __name(this, "McpError");
  }
  constructor(code, message, data) {
    super(`MCP error ${code}: ${message}`);
    this.code = code;
    this.data = data;
    this.name = "McpError";
  }
};

// node_modules/@modelcontextprotocol/sdk/dist/esm/shared/protocol.js
var DEFAULT_REQUEST_TIMEOUT_MSEC = 6e4;
var Protocol = class {
  static {
    __name(this, "Protocol");
  }
  constructor(_options) {
    this._options = _options;
    this._requestMessageId = 0;
    this._requestHandlers = /* @__PURE__ */ new Map();
    this._requestHandlerAbortControllers = /* @__PURE__ */ new Map();
    this._notificationHandlers = /* @__PURE__ */ new Map();
    this._responseHandlers = /* @__PURE__ */ new Map();
    this._progressHandlers = /* @__PURE__ */ new Map();
    this._timeoutInfo = /* @__PURE__ */ new Map();
    this._pendingDebouncedNotifications = /* @__PURE__ */ new Set();
    this.setNotificationHandler(CancelledNotificationSchema, (notification) => {
      const controller = this._requestHandlerAbortControllers.get(notification.params.requestId);
      controller === null || controller === void 0 ? void 0 : controller.abort(notification.params.reason);
    });
    this.setNotificationHandler(ProgressNotificationSchema, (notification) => {
      this._onprogress(notification);
    });
    this.setRequestHandler(
      PingRequestSchema,
      // Automatic pong by default.
      (_request) => ({})
    );
  }
  _setupTimeout(messageId, timeout, maxTotalTimeout, onTimeout, resetTimeoutOnProgress = false) {
    this._timeoutInfo.set(messageId, {
      timeoutId: setTimeout(onTimeout, timeout),
      startTime: Date.now(),
      timeout,
      maxTotalTimeout,
      resetTimeoutOnProgress,
      onTimeout
    });
  }
  _resetTimeout(messageId) {
    const info = this._timeoutInfo.get(messageId);
    if (!info)
      return false;
    const totalElapsed = Date.now() - info.startTime;
    if (info.maxTotalTimeout && totalElapsed >= info.maxTotalTimeout) {
      this._timeoutInfo.delete(messageId);
      throw new McpError(ErrorCode.RequestTimeout, "Maximum total timeout exceeded", {
        maxTotalTimeout: info.maxTotalTimeout,
        totalElapsed
      });
    }
    clearTimeout(info.timeoutId);
    info.timeoutId = setTimeout(info.onTimeout, info.timeout);
    return true;
  }
  _cleanupTimeout(messageId) {
    const info = this._timeoutInfo.get(messageId);
    if (info) {
      clearTimeout(info.timeoutId);
      this._timeoutInfo.delete(messageId);
    }
  }
  /**
   * Attaches to the given transport, starts it, and starts listening for messages.
   *
   * The Protocol object assumes ownership of the Transport, replacing any callbacks that have already been set, and expects that it is the only user of the Transport instance going forward.
   */
  async connect(transport) {
    var _a, _b, _c;
    this._transport = transport;
    const _onclose = (_a = this.transport) === null || _a === void 0 ? void 0 : _a.onclose;
    this._transport.onclose = () => {
      _onclose === null || _onclose === void 0 ? void 0 : _onclose();
      this._onclose();
    };
    const _onerror = (_b = this.transport) === null || _b === void 0 ? void 0 : _b.onerror;
    this._transport.onerror = (error) => {
      _onerror === null || _onerror === void 0 ? void 0 : _onerror(error);
      this._onerror(error);
    };
    const _onmessage = (_c = this._transport) === null || _c === void 0 ? void 0 : _c.onmessage;
    this._transport.onmessage = (message, extra) => {
      _onmessage === null || _onmessage === void 0 ? void 0 : _onmessage(message, extra);
      if (isJSONRPCResponse(message) || isJSONRPCError(message)) {
        this._onresponse(message);
      } else if (isJSONRPCRequest(message)) {
        this._onrequest(message, extra);
      } else if (isJSONRPCNotification(message)) {
        this._onnotification(message);
      } else {
        this._onerror(new Error(`Unknown message type: ${JSON.stringify(message)}`));
      }
    };
    await this._transport.start();
  }
  _onclose() {
    var _a;
    const responseHandlers = this._responseHandlers;
    this._responseHandlers = /* @__PURE__ */ new Map();
    this._progressHandlers.clear();
    this._pendingDebouncedNotifications.clear();
    this._transport = void 0;
    (_a = this.onclose) === null || _a === void 0 ? void 0 : _a.call(this);
    const error = new McpError(ErrorCode.ConnectionClosed, "Connection closed");
    for (const handler of responseHandlers.values()) {
      handler(error);
    }
  }
  _onerror(error) {
    var _a;
    (_a = this.onerror) === null || _a === void 0 ? void 0 : _a.call(this, error);
  }
  _onnotification(notification) {
    var _a;
    const handler = (_a = this._notificationHandlers.get(notification.method)) !== null && _a !== void 0 ? _a : this.fallbackNotificationHandler;
    if (handler === void 0) {
      return;
    }
    Promise.resolve().then(() => handler(notification)).catch((error) => this._onerror(new Error(`Uncaught error in notification handler: ${error}`)));
  }
  _onrequest(request, extra) {
    var _a, _b;
    const handler = (_a = this._requestHandlers.get(request.method)) !== null && _a !== void 0 ? _a : this.fallbackRequestHandler;
    const capturedTransport = this._transport;
    if (handler === void 0) {
      capturedTransport === null || capturedTransport === void 0 ? void 0 : capturedTransport.send({
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: ErrorCode.MethodNotFound,
          message: "Method not found"
        }
      }).catch((error) => this._onerror(new Error(`Failed to send an error response: ${error}`)));
      return;
    }
    const abortController = new AbortController();
    this._requestHandlerAbortControllers.set(request.id, abortController);
    const fullExtra = {
      signal: abortController.signal,
      sessionId: capturedTransport === null || capturedTransport === void 0 ? void 0 : capturedTransport.sessionId,
      _meta: (_b = request.params) === null || _b === void 0 ? void 0 : _b._meta,
      sendNotification: /* @__PURE__ */ __name((notification) => this.notification(notification, { relatedRequestId: request.id }), "sendNotification"),
      sendRequest: /* @__PURE__ */ __name((r, resultSchema, options) => this.request(r, resultSchema, { ...options, relatedRequestId: request.id }), "sendRequest"),
      authInfo: extra === null || extra === void 0 ? void 0 : extra.authInfo,
      requestId: request.id,
      requestInfo: extra === null || extra === void 0 ? void 0 : extra.requestInfo
    };
    Promise.resolve().then(() => handler(request, fullExtra)).then((result) => {
      if (abortController.signal.aborted) {
        return;
      }
      return capturedTransport === null || capturedTransport === void 0 ? void 0 : capturedTransport.send({
        result,
        jsonrpc: "2.0",
        id: request.id
      });
    }, (error) => {
      var _a2;
      if (abortController.signal.aborted) {
        return;
      }
      return capturedTransport === null || capturedTransport === void 0 ? void 0 : capturedTransport.send({
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: Number.isSafeInteger(error["code"]) ? error["code"] : ErrorCode.InternalError,
          message: (_a2 = error.message) !== null && _a2 !== void 0 ? _a2 : "Internal error"
        }
      });
    }).catch((error) => this._onerror(new Error(`Failed to send response: ${error}`))).finally(() => {
      this._requestHandlerAbortControllers.delete(request.id);
    });
  }
  _onprogress(notification) {
    const { progressToken, ...params } = notification.params;
    const messageId = Number(progressToken);
    const handler = this._progressHandlers.get(messageId);
    if (!handler) {
      this._onerror(new Error(`Received a progress notification for an unknown token: ${JSON.stringify(notification)}`));
      return;
    }
    const responseHandler = this._responseHandlers.get(messageId);
    const timeoutInfo = this._timeoutInfo.get(messageId);
    if (timeoutInfo && responseHandler && timeoutInfo.resetTimeoutOnProgress) {
      try {
        this._resetTimeout(messageId);
      } catch (error) {
        responseHandler(error);
        return;
      }
    }
    handler(params);
  }
  _onresponse(response) {
    const messageId = Number(response.id);
    const handler = this._responseHandlers.get(messageId);
    if (handler === void 0) {
      this._onerror(new Error(`Received a response for an unknown message ID: ${JSON.stringify(response)}`));
      return;
    }
    this._responseHandlers.delete(messageId);
    this._progressHandlers.delete(messageId);
    this._cleanupTimeout(messageId);
    if (isJSONRPCResponse(response)) {
      handler(response);
    } else {
      const error = new McpError(response.error.code, response.error.message, response.error.data);
      handler(error);
    }
  }
  get transport() {
    return this._transport;
  }
  /**
   * Closes the connection.
   */
  async close() {
    var _a;
    await ((_a = this._transport) === null || _a === void 0 ? void 0 : _a.close());
  }
  /**
   * Sends a request and wait for a response.
   *
   * Do not use this method to emit notifications! Use notification() instead.
   */
  request(request, resultSchema, options) {
    const { relatedRequestId, resumptionToken, onresumptiontoken } = options !== null && options !== void 0 ? options : {};
    return new Promise((resolve2, reject) => {
      var _a, _b, _c, _d, _e, _f;
      if (!this._transport) {
        reject(new Error("Not connected"));
        return;
      }
      if (((_a = this._options) === null || _a === void 0 ? void 0 : _a.enforceStrictCapabilities) === true) {
        this.assertCapabilityForMethod(request.method);
      }
      (_b = options === null || options === void 0 ? void 0 : options.signal) === null || _b === void 0 ? void 0 : _b.throwIfAborted();
      const messageId = this._requestMessageId++;
      const jsonrpcRequest = {
        ...request,
        jsonrpc: "2.0",
        id: messageId
      };
      if (options === null || options === void 0 ? void 0 : options.onprogress) {
        this._progressHandlers.set(messageId, options.onprogress);
        jsonrpcRequest.params = {
          ...request.params,
          _meta: {
            ...((_c = request.params) === null || _c === void 0 ? void 0 : _c._meta) || {},
            progressToken: messageId
          }
        };
      }
      const cancel = /* @__PURE__ */ __name((reason) => {
        var _a2;
        this._responseHandlers.delete(messageId);
        this._progressHandlers.delete(messageId);
        this._cleanupTimeout(messageId);
        (_a2 = this._transport) === null || _a2 === void 0 ? void 0 : _a2.send({
          jsonrpc: "2.0",
          method: "notifications/cancelled",
          params: {
            requestId: messageId,
            reason: String(reason)
          }
        }, { relatedRequestId, resumptionToken, onresumptiontoken }).catch((error) => this._onerror(new Error(`Failed to send cancellation: ${error}`)));
        reject(reason);
      }, "cancel");
      this._responseHandlers.set(messageId, (response) => {
        var _a2;
        if ((_a2 = options === null || options === void 0 ? void 0 : options.signal) === null || _a2 === void 0 ? void 0 : _a2.aborted) {
          return;
        }
        if (response instanceof Error) {
          return reject(response);
        }
        try {
          const result = resultSchema.parse(response.result);
          resolve2(result);
        } catch (error) {
          reject(error);
        }
      });
      (_d = options === null || options === void 0 ? void 0 : options.signal) === null || _d === void 0 ? void 0 : _d.addEventListener("abort", () => {
        var _a2;
        cancel((_a2 = options === null || options === void 0 ? void 0 : options.signal) === null || _a2 === void 0 ? void 0 : _a2.reason);
      });
      const timeout = (_e = options === null || options === void 0 ? void 0 : options.timeout) !== null && _e !== void 0 ? _e : DEFAULT_REQUEST_TIMEOUT_MSEC;
      const timeoutHandler = /* @__PURE__ */ __name(() => cancel(new McpError(ErrorCode.RequestTimeout, "Request timed out", { timeout })), "timeoutHandler");
      this._setupTimeout(messageId, timeout, options === null || options === void 0 ? void 0 : options.maxTotalTimeout, timeoutHandler, (_f = options === null || options === void 0 ? void 0 : options.resetTimeoutOnProgress) !== null && _f !== void 0 ? _f : false);
      this._transport.send(jsonrpcRequest, { relatedRequestId, resumptionToken, onresumptiontoken }).catch((error) => {
        this._cleanupTimeout(messageId);
        reject(error);
      });
    });
  }
  /**
   * Emits a notification, which is a one-way message that does not expect a response.
   */
  async notification(notification, options) {
    var _a, _b;
    if (!this._transport) {
      throw new Error("Not connected");
    }
    this.assertNotificationCapability(notification.method);
    const debouncedMethods = (_b = (_a = this._options) === null || _a === void 0 ? void 0 : _a.debouncedNotificationMethods) !== null && _b !== void 0 ? _b : [];
    const canDebounce = debouncedMethods.includes(notification.method) && !notification.params && !(options === null || options === void 0 ? void 0 : options.relatedRequestId);
    if (canDebounce) {
      if (this._pendingDebouncedNotifications.has(notification.method)) {
        return;
      }
      this._pendingDebouncedNotifications.add(notification.method);
      Promise.resolve().then(() => {
        var _a2;
        this._pendingDebouncedNotifications.delete(notification.method);
        if (!this._transport) {
          return;
        }
        const jsonrpcNotification2 = {
          ...notification,
          jsonrpc: "2.0"
        };
        (_a2 = this._transport) === null || _a2 === void 0 ? void 0 : _a2.send(jsonrpcNotification2, options).catch((error) => this._onerror(error));
      });
      return;
    }
    const jsonrpcNotification = {
      ...notification,
      jsonrpc: "2.0"
    };
    await this._transport.send(jsonrpcNotification, options);
  }
  /**
   * Registers a handler to invoke when this protocol object receives a request with the given method.
   *
   * Note that this will replace any previous request handler for the same method.
   */
  setRequestHandler(requestSchema, handler) {
    const method = requestSchema.shape.method.value;
    this.assertRequestHandlerCapability(method);
    this._requestHandlers.set(method, (request, extra) => {
      return Promise.resolve(handler(requestSchema.parse(request), extra));
    });
  }
  /**
   * Removes the request handler for the given method.
   */
  removeRequestHandler(method) {
    this._requestHandlers.delete(method);
  }
  /**
   * Asserts that a request handler has not already been set for the given method, in preparation for a new one being automatically installed.
   */
  assertCanSetRequestHandler(method) {
    if (this._requestHandlers.has(method)) {
      throw new Error(`A request handler for ${method} already exists, which would be overridden`);
    }
  }
  /**
   * Registers a handler to invoke when this protocol object receives a notification with the given method.
   *
   * Note that this will replace any previous notification handler for the same method.
   */
  setNotificationHandler(notificationSchema, handler) {
    this._notificationHandlers.set(notificationSchema.shape.method.value, (notification) => Promise.resolve(handler(notificationSchema.parse(notification))));
  }
  /**
   * Removes the notification handler for the given method.
   */
  removeNotificationHandler(method) {
    this._notificationHandlers.delete(method);
  }
};
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject, "isPlainObject");
function mergeCapabilities(base, additional) {
  const result = { ...base };
  for (const key in additional) {
    const k = key;
    const addValue = additional[k];
    if (addValue === void 0)
      continue;
    const baseValue = result[k];
    if (isPlainObject(baseValue) && isPlainObject(addValue)) {
      result[k] = { ...baseValue, ...addValue };
    } else {
      result[k] = addValue;
    }
  }
  return result;
}
__name(mergeCapabilities, "mergeCapabilities");

// node_modules/@modelcontextprotocol/sdk/dist/esm/validation/ajv-provider.js
var import_ajv = __toESM(require_ajv(), 1);
var import_ajv_formats = __toESM(require_dist(), 1);
function createDefaultAjvInstance() {
  const ajv = new import_ajv.Ajv({
    strict: false,
    validateFormats: true,
    validateSchema: false,
    allErrors: true
  });
  const addFormats = import_ajv_formats.default;
  addFormats(ajv);
  return ajv;
}
__name(createDefaultAjvInstance, "createDefaultAjvInstance");
var AjvJsonSchemaValidator = class {
  static {
    __name(this, "AjvJsonSchemaValidator");
  }
  /**
   * Create an AJV validator
   *
   * @param ajv - Optional pre-configured AJV instance. If not provided, a default instance will be created.
   *
   * @example
   * ```typescript
   * // Use default configuration (recommended for most cases)
   * import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
   * const validator = new AjvJsonSchemaValidator();
   *
   * // Or provide custom AJV instance for advanced configuration
   * import { Ajv } from 'ajv';
   * import addFormats from 'ajv-formats';
   *
   * const ajv = new Ajv({ validateFormats: true });
   * addFormats(ajv);
   * const validator = new AjvJsonSchemaValidator(ajv);
   * ```
   */
  constructor(ajv) {
    this._ajv = ajv !== null && ajv !== void 0 ? ajv : createDefaultAjvInstance();
  }
  /**
   * Create a validator for the given JSON Schema
   *
   * The validator is compiled once and can be reused multiple times.
   * If the schema has an $id, it will be cached by AJV automatically.
   *
   * @param schema - Standard JSON Schema object
   * @returns A validator function that validates input data
   */
  getValidator(schema) {
    var _a;
    const ajvValidator = "$id" in schema && typeof schema.$id === "string" ? (_a = this._ajv.getSchema(schema.$id)) !== null && _a !== void 0 ? _a : this._ajv.compile(schema) : this._ajv.compile(schema);
    return (input) => {
      const valid = ajvValidator(input);
      if (valid) {
        return {
          valid: true,
          data: input,
          errorMessage: void 0
        };
      } else {
        return {
          valid: false,
          data: void 0,
          errorMessage: this._ajv.errorsText(ajvValidator.errors)
        };
      }
    };
  }
};

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/index.js
var Server = class extends Protocol {
  static {
    __name(this, "Server");
  }
  /**
   * Initializes this server with the given name and version information.
   */
  constructor(_serverInfo, options) {
    var _a, _b;
    super(options);
    this._serverInfo = _serverInfo;
    this._loggingLevels = /* @__PURE__ */ new Map();
    this.LOG_LEVEL_SEVERITY = new Map(LoggingLevelSchema.options.map((level, index) => [level, index]));
    this.isMessageIgnored = (level, sessionId) => {
      const currentLevel = this._loggingLevels.get(sessionId);
      return currentLevel ? this.LOG_LEVEL_SEVERITY.get(level) < this.LOG_LEVEL_SEVERITY.get(currentLevel) : false;
    };
    this._capabilities = (_a = options === null || options === void 0 ? void 0 : options.capabilities) !== null && _a !== void 0 ? _a : {};
    this._instructions = options === null || options === void 0 ? void 0 : options.instructions;
    this._jsonSchemaValidator = (_b = options === null || options === void 0 ? void 0 : options.jsonSchemaValidator) !== null && _b !== void 0 ? _b : new AjvJsonSchemaValidator();
    this.setRequestHandler(InitializeRequestSchema, (request) => this._oninitialize(request));
    this.setNotificationHandler(InitializedNotificationSchema, () => {
      var _a2;
      return (_a2 = this.oninitialized) === null || _a2 === void 0 ? void 0 : _a2.call(this);
    });
    if (this._capabilities.logging) {
      this.setRequestHandler(SetLevelRequestSchema, async (request, extra) => {
        var _a2;
        const transportSessionId = extra.sessionId || ((_a2 = extra.requestInfo) === null || _a2 === void 0 ? void 0 : _a2.headers["mcp-session-id"]) || void 0;
        const { level } = request.params;
        const parseResult = LoggingLevelSchema.safeParse(level);
        if (parseResult.success) {
          this._loggingLevels.set(transportSessionId, parseResult.data);
        }
        return {};
      });
    }
  }
  /**
   * Registers new capabilities. This can only be called before connecting to a transport.
   *
   * The new capabilities will be merged with any existing capabilities previously given (e.g., at initialization).
   */
  registerCapabilities(capabilities) {
    if (this.transport) {
      throw new Error("Cannot register capabilities after connecting to transport");
    }
    this._capabilities = mergeCapabilities(this._capabilities, capabilities);
  }
  assertCapabilityForMethod(method) {
    var _a, _b, _c;
    switch (method) {
      case "sampling/createMessage":
        if (!((_a = this._clientCapabilities) === null || _a === void 0 ? void 0 : _a.sampling)) {
          throw new Error(`Client does not support sampling (required for ${method})`);
        }
        break;
      case "elicitation/create":
        if (!((_b = this._clientCapabilities) === null || _b === void 0 ? void 0 : _b.elicitation)) {
          throw new Error(`Client does not support elicitation (required for ${method})`);
        }
        break;
      case "roots/list":
        if (!((_c = this._clientCapabilities) === null || _c === void 0 ? void 0 : _c.roots)) {
          throw new Error(`Client does not support listing roots (required for ${method})`);
        }
        break;
      case "ping":
        break;
    }
  }
  assertNotificationCapability(method) {
    switch (method) {
      case "notifications/message":
        if (!this._capabilities.logging) {
          throw new Error(`Server does not support logging (required for ${method})`);
        }
        break;
      case "notifications/resources/updated":
      case "notifications/resources/list_changed":
        if (!this._capabilities.resources) {
          throw new Error(`Server does not support notifying about resources (required for ${method})`);
        }
        break;
      case "notifications/tools/list_changed":
        if (!this._capabilities.tools) {
          throw new Error(`Server does not support notifying of tool list changes (required for ${method})`);
        }
        break;
      case "notifications/prompts/list_changed":
        if (!this._capabilities.prompts) {
          throw new Error(`Server does not support notifying of prompt list changes (required for ${method})`);
        }
        break;
      case "notifications/cancelled":
        break;
      case "notifications/progress":
        break;
    }
  }
  assertRequestHandlerCapability(method) {
    switch (method) {
      case "completion/complete":
        if (!this._capabilities.completions) {
          throw new Error(`Server does not support completions (required for ${method})`);
        }
        break;
      case "logging/setLevel":
        if (!this._capabilities.logging) {
          throw new Error(`Server does not support logging (required for ${method})`);
        }
        break;
      case "prompts/get":
      case "prompts/list":
        if (!this._capabilities.prompts) {
          throw new Error(`Server does not support prompts (required for ${method})`);
        }
        break;
      case "resources/list":
      case "resources/templates/list":
      case "resources/read":
        if (!this._capabilities.resources) {
          throw new Error(`Server does not support resources (required for ${method})`);
        }
        break;
      case "tools/call":
      case "tools/list":
        if (!this._capabilities.tools) {
          throw new Error(`Server does not support tools (required for ${method})`);
        }
        break;
      case "ping":
      case "initialize":
        break;
    }
  }
  async _oninitialize(request) {
    const requestedVersion = request.params.protocolVersion;
    this._clientCapabilities = request.params.capabilities;
    this._clientVersion = request.params.clientInfo;
    const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion) ? requestedVersion : LATEST_PROTOCOL_VERSION;
    return {
      protocolVersion,
      capabilities: this.getCapabilities(),
      serverInfo: this._serverInfo,
      ...this._instructions && { instructions: this._instructions }
    };
  }
  /**
   * After initialization has completed, this will be populated with the client's reported capabilities.
   */
  getClientCapabilities() {
    return this._clientCapabilities;
  }
  /**
   * After initialization has completed, this will be populated with information about the client's name and version.
   */
  getClientVersion() {
    return this._clientVersion;
  }
  getCapabilities() {
    return this._capabilities;
  }
  async ping() {
    return this.request({ method: "ping" }, EmptyResultSchema);
  }
  async createMessage(params, options) {
    return this.request({ method: "sampling/createMessage", params }, CreateMessageResultSchema, options);
  }
  async elicitInput(params, options) {
    const result = await this.request({ method: "elicitation/create", params }, ElicitResultSchema, options);
    if (result.action === "accept" && result.content && params.requestedSchema) {
      try {
        const validator = this._jsonSchemaValidator.getValidator(params.requestedSchema);
        const validationResult = validator(result.content);
        if (!validationResult.valid) {
          throw new McpError(ErrorCode.InvalidParams, `Elicitation response content does not match requested schema: ${validationResult.errorMessage}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Error validating elicitation response: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return result;
  }
  async listRoots(params, options) {
    return this.request({ method: "roots/list", params }, ListRootsResultSchema, options);
  }
  /**
   * Sends a logging message to the client, if connected.
   * Note: You only need to send the parameters object, not the entire JSON RPC message
   * @see LoggingMessageNotification
   * @param params
   * @param sessionId optional for stateless and backward compatibility
   */
  async sendLoggingMessage(params, sessionId) {
    if (this._capabilities.logging) {
      if (!this.isMessageIgnored(params.level, sessionId)) {
        return this.notification({ method: "notifications/message", params });
      }
    }
  }
  async sendResourceUpdated(params) {
    return this.notification({
      method: "notifications/resources/updated",
      params
    });
  }
  async sendResourceListChanged() {
    return this.notification({
      method: "notifications/resources/list_changed"
    });
  }
  async sendToolListChanged() {
    return this.notification({ method: "notifications/tools/list_changed" });
  }
  async sendPromptListChanged() {
    return this.notification({ method: "notifications/prompts/list_changed" });
  }
};

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/stdio.js
import process2 from "node:process";

// node_modules/@modelcontextprotocol/sdk/dist/esm/shared/stdio.js
var ReadBuffer = class {
  static {
    __name(this, "ReadBuffer");
  }
  append(chunk) {
    this._buffer = this._buffer ? Buffer.concat([this._buffer, chunk]) : chunk;
  }
  readMessage() {
    if (!this._buffer) {
      return null;
    }
    const index = this._buffer.indexOf("\n");
    if (index === -1) {
      return null;
    }
    const line = this._buffer.toString("utf8", 0, index).replace(/\r$/, "");
    this._buffer = this._buffer.subarray(index + 1);
    return deserializeMessage(line);
  }
  clear() {
    this._buffer = void 0;
  }
};
function deserializeMessage(line) {
  return JSONRPCMessageSchema.parse(JSON.parse(line));
}
__name(deserializeMessage, "deserializeMessage");
function serializeMessage(message) {
  return JSON.stringify(message) + "\n";
}
__name(serializeMessage, "serializeMessage");

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/stdio.js
var StdioServerTransport = class {
  static {
    __name(this, "StdioServerTransport");
  }
  constructor(_stdin = process2.stdin, _stdout = process2.stdout) {
    this._stdin = _stdin;
    this._stdout = _stdout;
    this._readBuffer = new ReadBuffer();
    this._started = false;
    this._ondata = (chunk) => {
      this._readBuffer.append(chunk);
      this.processReadBuffer();
    };
    this._onerror = (error) => {
      var _a;
      (_a = this.onerror) === null || _a === void 0 ? void 0 : _a.call(this, error);
    };
  }
  /**
   * Starts listening for messages on stdin.
   */
  async start() {
    if (this._started) {
      throw new Error("StdioServerTransport already started! If using Server class, note that connect() calls start() automatically.");
    }
    this._started = true;
    this._stdin.on("data", this._ondata);
    this._stdin.on("error", this._onerror);
  }
  processReadBuffer() {
    var _a, _b;
    while (true) {
      try {
        const message = this._readBuffer.readMessage();
        if (message === null) {
          break;
        }
        (_a = this.onmessage) === null || _a === void 0 ? void 0 : _a.call(this, message);
      } catch (error) {
        (_b = this.onerror) === null || _b === void 0 ? void 0 : _b.call(this, error);
      }
    }
  }
  async close() {
    var _a;
    this._stdin.off("data", this._ondata);
    this._stdin.off("error", this._onerror);
    const remainingDataListeners = this._stdin.listenerCount("data");
    if (remainingDataListeners === 0) {
      this._stdin.pause();
    }
    this._readBuffer.clear();
    (_a = this.onclose) === null || _a === void 0 ? void 0 : _a.call(this);
  }
  send(message) {
    return new Promise((resolve2) => {
      const json = serializeMessage(message);
      if (this._stdout.write(json)) {
        resolve2();
      } else {
        this._stdout.once("drain", resolve2);
      }
    });
  }
};

// src/services/configurationService.ts
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// src/errors/errors.ts
var AppError = class extends Error {
  constructor(message, details) {
    super(message);
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
  static {
    __name(this, "AppError");
  }
  /**
   * Serialize error to JSON with secret redaction
   * Must dynamically import ErrorService to avoid circular dependencies
   */
  async toJSON() {
    const { ErrorService: ErrorService2 } = await Promise.resolve().then(() => (init_redact(), redact_exports));
    return {
      name: this.name,
      code: this.code,
      message: ErrorService2.redact(this.message),
      retryable: this.retryable,
      details: this.details ? ErrorService2.redactObject(this.details) : void 0
    };
  }
};
var AuthError = class extends AppError {
  static {
    __name(this, "AuthError");
  }
  code = "AUTH_ERROR";
  retryable = false;
};
var RateLimitError = class extends AppError {
  constructor(message, retryAfter, details) {
    super(message, details);
    this.retryAfter = retryAfter;
  }
  static {
    __name(this, "RateLimitError");
  }
  code = "RATE_LIMIT";
  retryable = true;
};
var NotFoundError = class extends AppError {
  static {
    __name(this, "NotFoundError");
  }
  code = "NOT_FOUND";
  retryable = false;
};
var NetworkError = class extends AppError {
  static {
    __name(this, "NetworkError");
  }
  code = "NETWORK_ERROR";
  retryable = true;
};
var ValidationError = class extends AppError {
  static {
    __name(this, "ValidationError");
  }
  code = "VALIDATION_ERROR";
  retryable = false;
};
var CompileError = class extends AppError {
  constructor(message, diagnostics, details) {
    super(message, details);
    this.diagnostics = diagnostics;
  }
  static {
    __name(this, "CompileError");
  }
  code = "COMPILE_ERROR";
  retryable = false;
};
var ConflictError = class extends AppError {
  static {
    __name(this, "ConflictError");
  }
  code = "CONFLICT_ERROR";
  retryable = false;
  // Usually requires parameter changes, not simple retry
};
var TimeoutError = class extends AppError {
  constructor(message, timeoutMs, details) {
    super(message, details);
    this.timeoutMs = timeoutMs;
  }
  static {
    __name(this, "TimeoutError");
  }
  code = "TIMEOUT_ERROR";
  retryable = true;
};
var TestRunnerInfrastructureError = class extends AppError {
  constructor(message, phase, details) {
    super(message, { phase, ...details });
    this.phase = phase;
  }
  static {
    __name(this, "TestRunnerInfrastructureError");
  }
  code = "TEST_RUNNER_INFRASTRUCTURE_ERROR";
  retryable = true;
};

// src/services/configurationService.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var ConfigSchema = external_exports.object({
  api: external_exports.object({
    url: external_exports.string().url().default("https://demoportaldev.continiaonline.com/api/v1.0"),
    timeoutMs: external_exports.number().min(1e3).max(3e5).default(3e4)
  }),
  test: external_exports.object({
    defaultTimeoutSeconds: external_exports.number().min(10).max(7200).default(600),
    initialPollIntervalMs: external_exports.number().min(500).max(1e4).default(2e3),
    maxPollIntervalMs: external_exports.number().min(1e3).max(6e4).default(3e4),
    backoffFactor: external_exports.number().min(1.1).max(5).default(2)
  }),
  logging: external_exports.object({
    level: external_exports.enum(["debug", "info", "warn", "error"]).default("info"),
    format: external_exports.enum(["json", "text"]).default("json")
  }),
  auth: external_exports.object({
    devTenant: external_exports.string().default("default"),
    allowInsecureCertificates: external_exports.boolean().default(false),
    interactivePrompts: external_exports.boolean().default(false)
    // false for MCP, true for VS Code
  }),
  environment: external_exports.object({
    defaultAuthMethod: external_exports.enum(["NavUserPassword", "Windows", "AzureAd"]).default("NavUserPassword")
  }),
  testRunner: external_exports.object({
    /** Path to the Test Runner BC app source */
    sourcePath: external_exports.string().default("C:\\GeneralDev\\MCPDevelopment\\AL Developer Tools - Continia AL Test Runner\\bc-app"),
    /** Enable auto-installation of Test Runner when missing */
    autoInstall: external_exports.boolean().default(true),
    /** Schema update mode for Test Runner publication */
    schemaUpdateMode: external_exports.enum(["synchronize", "forcesync"]).default("forcesync"),
    /** Duration to cache Test Runner status per environment (ms) */
    statusCacheDurationMs: external_exports.number().min(0).max(36e5).default(3e5)
  })
});
var ConfigurationService = class _ConfigurationService {
  static {
    __name(this, "ConfigurationService");
  }
  static instance = null;
  config;
  apiToken;
  constructor() {
    const { config, token } = this.loadConfiguration();
    this.config = config;
    this.apiToken = token;
  }
  /**
   * Get singleton instance
   *
   * Creates instance on first call, returns cached instance thereafter.
   */
  static getInstance() {
    if (!_ConfigurationService.instance) {
      _ConfigurationService.instance = new _ConfigurationService();
    }
    return _ConfigurationService.instance;
  }
  /**
   * Reset singleton instance (for testing)
   *
   * Forces configuration reload on next getInstance() call.
   */
  static resetInstance() {
    _ConfigurationService.instance = null;
  }
  /**
   * Load configuration from multiple sources with priority:
   * 1. Default values (from schema)
   * 2. Config file (mcp-config.json if exists)
   * 3. Environment variables (highest priority)
   *
   * @returns Validated configuration and API token (token may be null)
   * @throws ValidationError if config is invalid (but not for missing token)
   */
  loadConfiguration() {
    const token = this.loadApiToken();
    const fileConfig = this.loadConfigFile();
    const envOverrides = this.loadEnvironmentOverrides();
    const mergedConfig = {
      api: {
        ...fileConfig.api,
        ...envOverrides.api
      },
      test: {
        ...fileConfig.test,
        ...envOverrides.test
      },
      logging: {
        ...fileConfig.logging,
        ...envOverrides.logging
      },
      auth: {
        ...fileConfig.auth,
        ...envOverrides.auth
      },
      environment: {
        ...fileConfig.environment,
        ...envOverrides.environment
      },
      testRunner: {
        ...fileConfig.testRunner,
        ...envOverrides.testRunner
      }
    };
    const config = ConfigSchema.parse(mergedConfig);
    return { config, token };
  }
  /**
   * Load API token from VS Code settings or environment variable
   *
   * Priority:
   * 1. VS Code setting (for extension compatibility)
   * 2. DEMO_PORTAL_TOKEN environment variable
   *
   * @returns API token or null if not found
   */
  loadApiToken() {
    const vsCodeToken = process.env.VSCODE_API_TOKEN;
    const envToken = process.env.DEMO_PORTAL_TOKEN;
    const token = vsCodeToken || envToken;
    if (!token || token.trim().length === 0) {
      console.warn("DEMO_PORTAL_TOKEN not set. API operations will fail until token is configured.");
      return null;
    }
    return token.trim();
  }
  /**
   * Load configuration from mcp-config.json if it exists
   *
   * @returns Partial configuration from file, or empty object if file doesn't exist
   */
  loadConfigFile() {
    const configPaths = [
      "./mcp-config.json",
      join(process.cwd(), "mcp-config.json"),
      join(__dirname, "../../mcp-config.json")
    ];
    for (const configPath of configPaths) {
      if (existsSync(configPath)) {
        try {
          const content = readFileSync(configPath, "utf-8");
          const parsed = JSON.parse(content);
          return parsed;
        } catch (error) {
          console.warn(`Failed to load config file ${configPath}:`, error);
        }
      }
    }
    return {};
  }
  /**
   * Load configuration overrides from environment variables
   *
   * Environment variables have highest priority and override file config.
   */
  loadEnvironmentOverrides() {
    const overrides = {};
    if (process.env.DEMO_PORTAL_BASE_URL) {
      overrides.api = { url: process.env.DEMO_PORTAL_BASE_URL };
    }
    if (process.env.API_TIMEOUT_MS) {
      overrides.api = { ...overrides.api, timeoutMs: parseInt(process.env.API_TIMEOUT_MS, 10) };
    }
    if (process.env.TEST_TIMEOUT_SEC || process.env.POLL_INITIAL_MS || process.env.POLL_MAX_MS || process.env.POLL_BACKOFF) {
      overrides.test = {};
      if (process.env.TEST_TIMEOUT_SEC) {
        overrides.test.defaultTimeoutSeconds = parseInt(process.env.TEST_TIMEOUT_SEC, 10);
      }
      if (process.env.POLL_INITIAL_MS) {
        overrides.test.initialPollIntervalMs = parseInt(process.env.POLL_INITIAL_MS, 10);
      }
      if (process.env.POLL_MAX_MS) {
        overrides.test.maxPollIntervalMs = parseInt(process.env.POLL_MAX_MS, 10);
      }
      if (process.env.POLL_BACKOFF) {
        overrides.test.backoffFactor = parseFloat(process.env.POLL_BACKOFF);
      }
    }
    if (process.env.LOG_LEVEL || process.env.LOG_FORMAT) {
      overrides.logging = {};
      if (process.env.LOG_LEVEL) {
        overrides.logging.level = process.env.LOG_LEVEL;
      }
      if (process.env.LOG_FORMAT) {
        overrides.logging.format = process.env.LOG_FORMAT;
      }
    }
    if (process.env.DEV_TENANT || process.env.ALLOW_INSECURE_CERTS || process.env.INTERACTIVE_PROMPTS) {
      overrides.auth = {};
      if (process.env.DEV_TENANT) {
        overrides.auth.devTenant = process.env.DEV_TENANT;
      }
      if (process.env.ALLOW_INSECURE_CERTS !== void 0) {
        overrides.auth.allowInsecureCertificates = process.env.ALLOW_INSECURE_CERTS === "true";
      }
      if (process.env.INTERACTIVE_PROMPTS !== void 0) {
        overrides.auth.interactivePrompts = process.env.INTERACTIVE_PROMPTS === "true";
      }
    }
    if (process.env.DEFAULT_AUTH_METHOD) {
      overrides.environment = {
        defaultAuthMethod: process.env.DEFAULT_AUTH_METHOD
      };
    }
    if (process.env.TEST_RUNNER_SOURCE_PATH || process.env.TEST_RUNNER_AUTO_INSTALL !== void 0) {
      overrides.testRunner = {};
      if (process.env.TEST_RUNNER_SOURCE_PATH) {
        overrides.testRunner.sourcePath = process.env.TEST_RUNNER_SOURCE_PATH;
      }
      if (process.env.TEST_RUNNER_AUTO_INSTALL !== void 0) {
        overrides.testRunner.autoInstall = process.env.TEST_RUNNER_AUTO_INSTALL === "true";
      }
    }
    return overrides;
  }
  /**
   * Check if a valid API token is configured
   *
   * @returns true if token is configured, false otherwise
   */
  hasValidToken() {
    return this.apiToken !== null && this.apiToken.length > 0;
  }
  /**
   * Get Demo Portal API token
   *
   * @returns Bearer token for Demo Portal API authentication
   * @throws ValidationError if token is not configured
   */
  getApiToken() {
    if (!this.apiToken) {
      throw new ValidationError(
        'DEMO_PORTAL_TOKEN not set. Set it via environment variable:\n  export DEMO_PORTAL_TOKEN=your_token_here\n\nOr add it to your Claude Desktop configuration:\n  "env": { "DEMO_PORTAL_TOKEN": "your_token_here" }',
        {
          missingVariable: "DEMO_PORTAL_TOKEN",
          suggestedActions: ["SetEnvironmentVariable", "UpdateClaudeConfig"]
        }
      );
    }
    return this.apiToken;
  }
  /**
   * Get Demo Portal API base URL
   *
   * @returns Base URL for Demo Portal API (without trailing slash)
   */
  getApiUrl() {
    return this.config.api.url;
  }
  /**
   * Get full configuration object
   *
   * @returns Complete validated configuration
   */
  getConfig() {
    return this.config;
  }
  /**
   * Get a specific configuration value by path
   *
   * @param path - Dot-notation path to config value (e.g., 'api.url')
   * @param defaultValue - Default if path not found
   * @returns Configuration value at path
   *
   * @example
   * config.get('api.url') // 'https://...'
   * config.get('test.defaultTimeoutSeconds') // 600
   */
  get(path9, defaultValue) {
    const parts = path9.split(".");
    let current = this.config;
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        return defaultValue;
      }
    }
    return current;
  }
};

// src/api/httpClient.ts
init_redact();
import axios from "axios";
import { randomUUID } from "crypto";
function createHttpClient(config) {
  const client = axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout ?? 3e4,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...config.headers
    },
    validateStatus: /* @__PURE__ */ __name((status) => {
      return status >= 200 && status < 400;
    }, "validateStatus")
  });
  client.interceptors.request.use(
    (req) => {
      if (!req.headers.Authorization && config.token) {
        req.headers.Authorization = `Bearer ${config.token}`;
      }
      if (!req.headers["X-Request-Id"]) {
        req.headers["X-Request-Id"] = randomUUID();
      }
      req._startTime = Date.now();
      return req;
    },
    async (error) => {
      return Promise.reject(error);
    }
  );
  client.interceptors.response.use(
    (response) => {
      const startTime = response.config._startTime;
      if (startTime) {
        const duration = Date.now() - startTime;
        response.headers["X-Response-Time"] = `${duration}ms`;
      }
      return response;
    },
    async (error) => {
      const status = error.response?.status;
      const requestId = error.config?.headers?.["X-Request-Id"];
      const errorContext = {
        requestId,
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        status
      };
      if (status === 401 || status === 403) {
        throw new AuthError(
          "API authentication failed. Verify DEMO_PORTAL_TOKEN is valid and has necessary permissions.",
          {
            ...errorContext,
            message: "Invalid or expired API token",
            suggestedActions: ["VerifyToken", "CheckPermissions"]
          }
        );
      }
      if (status === 404) {
        throw new NotFoundError(
          `Resource not found: ${error.config?.url ?? "unknown"}`,
          {
            ...errorContext,
            message: "The requested resource does not exist or is not yet available"
          }
        );
      }
      if (status === 429) {
        const retryAfterHeader = error.response?.headers["retry-after"];
        const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
        throw new RateLimitError(
          `API rate limit exceeded. Wait ${retryAfter} seconds before retrying.`,
          retryAfter,
          {
            ...errorContext,
            retryAfter,
            message: "Too many requests to the API"
          }
        );
      }
      if (status && status >= 500) {
        throw new NetworkError(
          `Server error (${status}). The service may be temporarily unavailable. Try again later.`,
          {
            ...errorContext,
            message: "Server-side error",
            retryable: true
          }
        );
      }
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        throw new NetworkError(
          "Request timed out. Check network connection or increase timeout.",
          {
            ...errorContext,
            code: error.code,
            timeout: error.config?.timeout,
            message: "Request exceeded timeout limit"
          }
        );
      }
      if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        throw new NetworkError(
          "Cannot connect to API. Check network connection and API URL.",
          {
            ...errorContext,
            code: error.code,
            baseUrl: error.config?.baseURL,
            message: "Network connectivity issue"
          }
        );
      }
      const redactedMessage = ErrorService.redact(error.message);
      throw new NetworkError(
        `Network request failed: ${redactedMessage}`,
        {
          ...errorContext,
          code: error.code,
          message: redactedMessage
        }
      );
    }
  );
  return client;
}
__name(createHttpClient, "createHttpClient");
function createClientFromConfig(configService) {
  let token = null;
  if (configService.hasValidToken()) {
    try {
      token = configService.getApiToken();
    } catch {
      token = null;
    }
  }
  return createHttpClient({
    baseUrl: configService.getApiUrl(),
    token,
    timeout: configService.getConfig().api.timeoutMs
  });
}
__name(createClientFromConfig, "createClientFromConfig");

// src/utils/logger.ts
init_redact();
var Logger = class _Logger {
  static {
    __name(this, "Logger");
  }
  static instance;
  config;
  /**
   * Private constructor - use getInstance() instead
   */
  constructor(config) {
    this.config = {
      level: "info" /* INFO */,
      format: "json" /* JSON */,
      redactSecrets: true,
      ...config
    };
  }
  /**
   * Get singleton logger instance
   */
  static getInstance(config) {
    if (!_Logger.instance) {
      _Logger.instance = new _Logger(config);
    }
    return _Logger.instance;
  }
  /**
   * Reset singleton instance (useful for testing)
   */
  static reset() {
    _Logger.instance = void 0;
  }
  /**
   * Update logger configuration
   */
  configure(config) {
    this.config = { ...this.config, ...config };
  }
  /**
   * Log a debug message
   */
  debug(operation, context) {
    this.log({
      level: "debug" /* DEBUG */,
      operation,
      ...context
    });
  }
  /**
   * Log an info message
   */
  info(operation, context) {
    this.log({
      level: "info" /* INFO */,
      operation,
      ...context
    });
  }
  /**
   * Log a warning message
   */
  warn(operation, context) {
    this.log({
      level: "warn" /* WARN */,
      operation,
      ...context
    });
  }
  /**
   * Log an error message
   */
  error(operation, error, context) {
    this.log({
      level: "error" /* ERROR */,
      operation,
      outcome: "error",
      error: error instanceof Error ? error.message : error,
      ...context
    });
  }
  /**
   * Log an entry with complete control
   */
  log(entry) {
    if (!this.shouldLog(entry.level)) {
      return;
    }
    const logEntry = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...entry
    };
    const sanitized = this.config.redactSecrets ? this.sanitizeEntry(logEntry) : logEntry;
    if (this.config.format === "json" /* JSON */) {
      this.logJson(sanitized);
    } else {
      this.logText(sanitized);
    }
  }
  /**
   * Check if a log level should be output
   */
  shouldLog(level) {
    const levels = ["debug" /* DEBUG */, "info" /* INFO */, "warn" /* WARN */, "error" /* ERROR */];
    const configLevel = levels.indexOf(this.config.level);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= configLevel;
  }
  /**
   * Sanitize log entry to remove sensitive information
   */
  sanitizeEntry(entry) {
    const sanitized = {
      timestamp: entry.timestamp,
      level: entry.level,
      operation: entry.operation
    };
    if (entry.requestId) {
      sanitized.requestId = entry.requestId;
    }
    if (entry.duration !== void 0) {
      sanitized.duration = entry.duration;
    }
    if (entry.outcome) {
      sanitized.outcome = entry.outcome;
    }
    if (entry.error) {
      sanitized.error = ErrorService.redact(entry.error);
    }
    if (entry.details) {
      sanitized.details = ErrorService.redactObject(entry.details);
    }
    return sanitized;
  }
  /**
   * Output log entry as JSON
   */
  logJson(entry) {
    console.error(JSON.stringify(entry));
  }
  /**
   * Output log entry as human-readable text
   */
  logText(entry) {
    const parts = [];
    parts.push(`[${entry.timestamp}]`);
    parts.push(entry.level.toUpperCase().padEnd(5));
    parts.push(entry.operation);
    if (entry.requestId) {
      parts.push(`[${entry.requestId}]`);
    }
    if (entry.duration !== void 0) {
      parts.push(`(${entry.duration}ms)`);
    }
    if (entry.outcome) {
      const outcomeSymbol = entry.outcome === "success" ? "\u2713" : entry.outcome === "error" ? "\u2717" : "\u25CB";
      parts.push(outcomeSymbol);
    }
    let message = parts.join(" ");
    if (entry.error) {
      message += `
  Error: ${entry.error}`;
    }
    if (entry.details && Object.keys(entry.details).length > 0) {
      message += "\n  Details:";
      for (const [key, value] of Object.entries(entry.details)) {
        message += `
    ${key}: ${JSON.stringify(value)}`;
      }
    }
    console.error(message);
  }
  /**
   * Create a child logger with additional context
   * Useful for adding request-specific context to all logs
   */
  child(context) {
    return new ChildLogger(this, context);
  }
};
var ChildLogger = class {
  constructor(parent, context) {
    this.parent = parent;
    this.context = context;
  }
  static {
    __name(this, "ChildLogger");
  }
  /**
   * Log with inherited context
   */
  logWithContext(level, operation, additionalContext) {
    const logEntry = {
      level,
      operation
    };
    if (this.context.requestId) {
      logEntry.requestId = this.context.requestId;
    }
    const mergedDetails = {
      ...this.context.details,
      ...additionalContext?.details
    };
    if (Object.keys(mergedDetails).length > 0) {
      logEntry.details = mergedDetails;
    }
    if (additionalContext?.duration !== void 0) {
      logEntry.duration = additionalContext.duration;
    }
    if (additionalContext?.outcome) {
      logEntry.outcome = additionalContext.outcome;
    }
    if (additionalContext?.error) {
      logEntry.error = additionalContext.error;
    }
    if (additionalContext?.requestId) {
      logEntry.requestId = additionalContext.requestId;
    }
    this.parent.log(logEntry);
  }
  debug(operation, context) {
    this.logWithContext("debug" /* DEBUG */, operation, context);
  }
  info(operation, context) {
    this.logWithContext("info" /* INFO */, operation, context);
  }
  warn(operation, context) {
    this.logWithContext("warn" /* WARN */, operation, context);
  }
  error(operation, error, context) {
    this.logWithContext("error" /* ERROR */, operation, {
      ...context,
      outcome: "error",
      error: error instanceof Error ? error.message : error
    });
  }
};

// src/api/demoPortalClient.ts
var DemoPortalClient = class {
  constructor(httpClient) {
    this.httpClient = httpClient;
    this.logger = Logger.getInstance();
  }
  static {
    __name(this, "DemoPortalClient");
  }
  logger;
  /**
   * Get the base URL for this client (for logging/debugging)
   */
  getBaseUrl() {
    return this.httpClient.defaults.baseURL || "";
  }
  /**
   * List all environments from Demo Portal
   *
   * @returns Raw array of environment objects from API
   * @throws {AuthError} If authentication fails
   * @throws {RateLimitError} If rate limit exceeded
   * @throws {NetworkError} If network request fails
   */
  async listEnvironmentsRaw() {
    const response = await this.httpClient.get("/environments.json");
    if (!Array.isArray(response.data)) {
      throw new Error("Expected array response from /environments.json");
    }
    return response.data;
  }
  /**
   * Get a single environment by ID
   *
   * @param environmentId - The environment ID to fetch
   * @returns Raw environment object from API
   * @throws {NotFoundError} If environment doesn't exist
   * @throws {AuthError} If authentication fails
   * @throws {NetworkError} If network request fails
   */
  async getEnvironmentRaw(environmentId) {
    try {
      const response = await this.httpClient.get(`/environments/${environmentId}.json`);
      return response.data;
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error;
        if (axiosError.response?.status === 404) {
          throw new NotFoundError(
            `Environment '${environmentId}' not found`,
            { environmentId }
          );
        }
      }
      throw error;
    }
  }
  /**
   * Update an environment (primarily used for start/stop operations)
   *
   * @param environmentId - The environment ID to update
   * @param data - Partial environment data (e.g., { status: 'Running' })
   * @returns Updated environment object from API
   * @throws {NotFoundError} If environment doesn't exist
   * @throws {AuthError} If authentication fails
   * @throws {NetworkError} If network request fails
   *
   * @example
   * // Start an environment
   * await client.patchEnvironment('env-123', { status: 'Running' });
   *
   * @example
   * // Stop an environment
   * await client.patchEnvironment('env-123', { status: 'Stopped' });
   */
  async patchEnvironment(environmentId, data) {
    try {
      const response = await this.httpClient.patch(
        `/environments/${environmentId}.json`,
        data
      );
      return response.data;
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error;
        if (axiosError.response?.status === 404) {
          throw new NotFoundError(
            `Environment '${environmentId}' not found`,
            { environmentId }
          );
        }
      }
      throw error;
    }
  }
  /**
   * Get users for an environment (used for Developer Endpoint authentication)
   *
   * @param environmentId - The environment ID
   * @returns Raw array of user objects from API
   * @throws {NotFoundError} If environment doesn't exist
   * @throws {AuthError} If authentication fails
   * @throws {NetworkError} If network request fails
   */
  async getEnvironmentUsers(environmentId) {
    try {
      const response = await this.httpClient.get(
        `/environments/${environmentId}/users.json`
      );
      if (!Array.isArray(response.data)) {
        throw new Error("Expected array response from users endpoint");
      }
      return response.data;
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error;
        if (axiosError.response?.status === 404) {
          throw new NotFoundError(
            `Environment '${environmentId}' not found`,
            { environmentId }
          );
        }
      }
      throw error;
    }
  }
  /**
   * Create a user for an environment
   *
   * @param environmentId - The environment ID
   * @param userData - User data (username, password, etc.)
   * @returns Created user object from API
   * @throws {NotFoundError} If environment doesn't exist
   * @throws {ValidationError} If user data is invalid
   * @throws {AuthError} If authentication fails
   * @throws {NetworkError} If network request fails
   */
  async createEnvironmentUser(environmentId, userData) {
    try {
      const response = await this.httpClient.post(
        `/environments/${environmentId}/users.json`,
        userData
      );
      return response.data;
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error;
        if (axiosError.response?.status === 404) {
          throw new NotFoundError(
            `Environment '${environmentId}' not found`,
            { environmentId }
          );
        }
      }
      throw error;
    }
  }
  /**
   * Create a test job for an environment
   *
   * Phase 3 implementation - Test execution
   *
   * @param environmentId - The environment ID
   * @param testParams - Test parameters (codeunitId, testMethod, etc.)
   * @param options - Request options (signal for cancellation)
   * @returns Test job object with jobId
   */
  async createTestJob(environmentId, testParams, options) {
    try {
      const requestUrl = `/environments/${environmentId}/tests/jobs.json`;
      this.logger.info("Creating test job - API Request", {
        details: {
          url: requestUrl,
          environmentId,
          requestBody: JSON.stringify(testParams, null, 2),
          testParams,
          parameterKeys: Object.keys(testParams),
          parameterTypes: Object.entries(testParams).reduce((acc, [key, value]) => {
            acc[key] = typeof value;
            return acc;
          }, {})
        }
      });
      const response = await this.httpClient.post(
        requestUrl,
        testParams,
        options?.signal ? { signal: options.signal } : void 0
      );
      this.logger.info("Test job creation - API Response", {
        details: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          responseData: response.data,
          responseDataString: JSON.stringify(response.data, null, 2),
          dataType: typeof response.data,
          dataKeys: response.data && typeof response.data === "object" ? Object.keys(response.data) : []
        }
      });
      let jobIdValue;
      if (!response.data) {
        throw new Error(
          `Empty response from test job creation. Status: ${response.status}, StatusText: ${response.statusText}`
        );
      }
      if (typeof response.data === "number" || typeof response.data === "string") {
        jobIdValue = response.data;
      } else if (typeof response.data === "object") {
        jobIdValue = response.data.jobId ?? response.data.job_id ?? response.data.JobId ?? response.data.id ?? response.data.Id ?? response.data.ID;
        if (!jobIdValue && response.data.job && typeof response.data.job === "object") {
          jobIdValue = response.data.job.id ?? response.data.job.Id ?? response.data.job.ID;
        }
        if (!jobIdValue && response.data.result) {
          if (typeof response.data.result === "number" || typeof response.data.result === "string") {
            jobIdValue = response.data.result;
          } else if (typeof response.data.result === "object") {
            jobIdValue = response.data.result.jobId ?? response.data.result.job_id ?? response.data.result.id;
          }
        }
      }
      if (jobIdValue === void 0 || jobIdValue === null || jobIdValue === "") {
        throw new Error(
          `Could not find job ID in API response. Tried fields: jobId, job_id, JobId, id, Id, ID, job.id, result.jobId. Actual response: ${JSON.stringify(response.data)} (type: ${typeof response.data})`
        );
      }
      this.logger.debug("found_job_id", {
        details: {
          jobId: jobIdValue,
          jobIdType: typeof jobIdValue
        }
      });
      return {
        jobId: String(jobIdValue)
      };
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error;
        if (axiosError.response?.status === 404) {
          throw new NotFoundError(
            `Environment '${environmentId}' not found`,
            { environmentId }
          );
        }
      }
      throw error;
    }
  }
  /**
   * Get test results XML for a completed test job
   *
   * Phase 3 implementation - Test execution
   *
   * Note: Returns 404 while job is still running, 200 when complete
   *
   * @param environmentId - The environment ID
   * @param jobId - The test job ID
   * @param options - Request options (signal for cancellation)
   * @returns Object with statusCode and xml content
   */
  async getTestResultsXml(environmentId, jobId, options) {
    try {
      const config = {
        // Don't throw on 404 - it means job is still running
        validateStatus: /* @__PURE__ */ __name((status) => status === 200 || status === 404, "validateStatus"),
        ...options?.signal ? { signal: options.signal } : {}
      };
      const response = await this.httpClient.get(
        `/environments/${environmentId}/tests/jobs/${jobId}.xml`,
        config
      );
      return {
        statusCode: response.status,
        xml: response.status === 200 ? response.data : void 0
      };
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error;
        if (axiosError.response?.status === 404) {
          throw new NotFoundError(
            `Test job '${jobId}' not found for environment '${environmentId}'`,
            { environmentId, jobId }
          );
        }
      }
      throw error;
    }
  }
  /**
   * Get code coverage CSV for a completed test job
   *
   * Phase 3 implementation - Test execution
   *
   * @param environmentId - The environment ID
   * @param jobId - The test job ID
   * @returns CSV content as string
   * @throws {NotFoundError} If job doesn't exist or has no coverage data
   */
  async getCoverageCsv(environmentId, jobId) {
    try {
      const response = await this.httpClient.get(
        `/environments/${environmentId}/tests/jobs/${jobId}/codecoverage.csv`,
        {
          // CSV response, not JSON
          responseType: "text"
        }
      );
      return response.data;
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error;
        if (axiosError.response?.status === 404) {
          throw new NotFoundError(
            `Code coverage data not found for test job '${jobId}'`,
            { environmentId, jobId }
          );
        }
      }
      throw error;
    }
  }
  // ============================================
  // App Catalog Management
  // ============================================
  /**
   * Get available apps from the Demo Portal catalog
   *
   * Retrieves a list of pre-built apps available for installation,
   * filtered by Business Central version and target platform.
   *
   * @param bcVersion - Business Central version (e.g., "24.0")
   * @param target - Target platform: 'cloud' or 'onprem'
   * @returns Array of available apps from the catalog
   * @throws {AuthError} If authentication fails
   * @throws {NetworkError} If network request fails
   */
  async getAvailableApps(bcVersion, target) {
    const response = await this.httpClient.get("/apps.json", {
      params: {
        bc_version: bcVersion,
        target
      }
    });
    if (!Array.isArray(response.data)) {
      throw new Error("Expected array response from /apps.json");
    }
    return response.data;
  }
  /**
   * Get apps installed on an environment
   *
   * Retrieves a list of apps currently installed on the specified environment.
   *
   * @param environmentId - The environment ID
   * @returns Array of installed apps
   * @throws {NotFoundError} If environment doesn't exist
   * @throws {AuthError} If authentication fails
   * @throws {NetworkError} If network request fails
   */
  async getEnvironmentApps(environmentId) {
    try {
      const response = await this.httpClient.get(
        `/environments/${environmentId}/apps.json`
      );
      if (!Array.isArray(response.data)) {
        throw new Error("Expected array response from apps endpoint");
      }
      return response.data;
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error;
        if (axiosError.response?.status === 404) {
          throw new NotFoundError(
            `Environment '${environmentId}' not found`,
            { environmentId }
          );
        }
      }
      throw error;
    }
  }
  /**
   * Install apps to an environment
   *
   * Installs one or more apps from the Demo Portal catalog to the specified environment.
   *
   * @param environmentId - The environment ID
   * @param apps - Array of apps to install (from catalog)
   * @returns true if installation succeeded
   * @throws {NotFoundError} If environment doesn't exist
   * @throws {AuthError} If authentication fails
   * @throws {ValidationError} If app data is invalid
   * @throws {NetworkError} If network request fails
   */
  async installApps(environmentId, apps) {
    try {
      const response = await this.httpClient.post(
        `/environments/${environmentId}/apps.json`,
        apps
      );
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error;
        if (axiosError.response?.status === 404) {
          throw new NotFoundError(
            `Environment '${environmentId}' not found`,
            { environmentId }
          );
        }
      }
      throw error;
    }
  }
};

// src/api/developerEndpointClient.ts
import { createReadStream } from "fs";
import FormData from "form-data";
import axios2 from "axios";
import https from "https";
init_redact();
var DeveloperEndpointClient = class {
  constructor(credentialsService) {
    this.credentialsService = credentialsService;
  }
  static {
    __name(this, "DeveloperEndpointClient");
  }
  /**
   * Publish an AL app to Business Central Developer Endpoint
   *
   * Workflow:
   * 1. Get authenticated user credentials
   * 2. Build Developer Endpoint URL with tenant parameter
   * 3. Create multipart/form-data with .app file
   * 4. POST to Developer Endpoint with Basic Auth
   * 5. On 401/403: Invalidate credentials, retry once with fresh auth
   *
   * @param params - Publishing parameters
   * @returns Publishing result with status and user
   * @throws {AuthError} If authentication fails after retry
   * @throws {ConflictError} If schema conflict occurs (409)
   * @throws {NetworkError} If request fails
   */
  async publishApp(params) {
    const maxAttempts = 2;
    let attempt = 0;
    let authResult = await this.credentialsService.getDeveloperEndpointAuth({
      id: params.environmentId,
      authenticationMethod: params.authenticationMethod
    });
    while (attempt < maxAttempts) {
      attempt++;
      try {
        const formData = new FormData();
        formData.append("file", createReadStream(params.appPath), {
          filename: params.appFileName
        });
        const url = this.buildDeveloperEndpointUrl(
          params.environmentId,
          params.environmentUrl,
          params.schemaUpdateMode ?? "synchronize",
          params.dependencyPublishingOption
        );
        const httpsAgent = this.createHttpsAgent(params.environmentUrl);
        const response = await axios2.post(url, formData, {
          headers: {
            ...formData.getHeaders(),
            Authorization: authResult.authorization,
            Accept: "application/json",
            "X-Request-Id": crypto.randomUUID()
          },
          httpsAgent,
          timeout: 12e4,
          // 2 minutes for upload + processing
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });
        return {
          success: true,
          status: "completed",
          schemaUpdateMode: params.schemaUpdateMode ?? "synchronize",
          response: response.data,
          user: authResult.user.username
        };
      } catch (error) {
        if (axios2.isAxiosError(error)) {
          const status = error.response?.status;
          if ((status === 401 || status === 403) && attempt < maxAttempts) {
            this.credentialsService.invalidateDeveloperEndpointAuth(params.environmentId);
            authResult = await this.credentialsService.getDeveloperEndpointAuth({
              id: params.environmentId,
              authenticationMethod: params.authenticationMethod
            });
            continue;
          }
          if (status === 401 || status === 403) {
            throw new AuthError(
              "Publishing failed: Invalid credentials after retry. Verify environment permissions and user access.",
              {
                environmentId: params.environmentId,
                user: ErrorService.redact(authResult.user.username),
                statusCode: status
              }
            );
          }
          if (status === 409) {
            throw new ConflictError(
              'Publishing failed: Schema conflict detected. Try schemaUpdateMode="forcesync" to force schema synchronization.',
              {
                currentMode: params.schemaUpdateMode ?? "synchronize",
                suggestedMode: "forcesync"
              }
            );
          }
          const errorMessage = ErrorService.redact(
            error.response?.data?.message || error.response?.data?.error || error.message || "Unknown error"
          );
          throw new Error(
            `Publishing failed with HTTP ${status}: ${errorMessage}`
          );
        }
        throw error;
      }
    }
    throw new AuthError("Publishing failed: Maximum retry attempts exceeded");
  }
  /**
   * Build Developer Endpoint URL
   *
   * Format: {origin}/{environmentId}/dev/apps?tenant={tenant}&SchemaUpdateMode={mode}&DependencyPublishingOption={option}
   *
   * The environment ID (GUID) is used as the BC service instance name, following the pattern
   * established in the Continia Environment Explorer knowledge base.
   *
   * @param environmentId - Environment ID (GUID) to use as service instance
   * @param environmentUrl - Base environment URL (used to extract origin)
   * @param schemaUpdateMode - Schema update mode
   * @param dependencyPublishingOption - Optional dependency publishing option
   * @returns Complete Developer Endpoint URL
   */
  buildDeveloperEndpointUrl(environmentId, environmentUrl, schemaUpdateMode, dependencyPublishingOption) {
    const baseUrl = new URL(environmentUrl);
    const tenant = this.credentialsService.getDevTenant();
    let url = `${baseUrl.origin}/${environmentId}/dev/apps?tenant=${tenant}&SchemaUpdateMode=${schemaUpdateMode}`;
    if (dependencyPublishingOption) {
      url += `&DependencyPublishingOption=${dependencyPublishingOption}`;
    }
    console.error(`[DeveloperEndpoint] Publishing to: ${url}`);
    return url;
  }
  /**
   * Create HTTPS agent with conditional certificate validation
   *
   * - Localhost: Allow self-signed certificates (rejectUnauthorized: false)
   * - Configuration: Check allowInsecureCertificates setting
   * - Production: Validate certificates (default)
   *
   * @param environmentUrl - Environment URL to check
   * @returns Configured HTTPS agent
   */
  createHttpsAgent(environmentUrl) {
    const url = new URL(environmentUrl);
    const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const allowInsecure = this.credentialsService["configService"].get(
      "auth.allowInsecureCertificates",
      false
    ) || false;
    return new https.Agent({
      rejectUnauthorized: !(isLocalhost || allowInsecure)
    });
  }
};

// src/services/environmentService.ts
var RawEnvironmentSchema = external_exports.object({
  id: external_exports.string(),
  name: external_exports.string().optional(),
  displayName: external_exports.string().optional(),
  environmentName: external_exports.string().optional(),
  status: external_exports.string(),
  // API uses "status" field (Running, Stopped, Draft, Starting, Stopping)
  applicationVersion: external_exports.string().optional(),
  bcVersion: external_exports.string().optional(),
  version: external_exports.string().optional(),
  url: external_exports.string().optional(),
  authenticationMethod: external_exports.string().optional()
}).passthrough();
var EnvironmentSchema = external_exports.object({
  id: external_exports.string(),
  name: external_exports.string(),
  status: external_exports.string(),
  bcVersion: external_exports.string()
});
var EnvironmentService = class {
  constructor(demoPortalClient) {
    this.demoPortalClient = demoPortalClient;
  }
  static {
    __name(this, "EnvironmentService");
  }
  /**
   * List all environments from Demo Portal
   *
   * Fetches raw environment data, validates, transforms, and sorts by name.
   *
   * @returns Structured result with environment array and metadata
   * @throws {AuthError} If authentication fails
   * @throws {RateLimitError} If rate limit exceeded
   * @throws {NetworkError} If network request fails
   */
  async listEnvironments() {
    const startTime = Date.now();
    const raw = await this.demoPortalClient.listEnvironmentsRaw();
    const rawEnvironments = external_exports.array(RawEnvironmentSchema).parse(raw);
    const environments = rawEnvironments.map((env) => this.transformEnvironment(env));
    environments.sort((a, b) => a.name.localeCompare(b.name));
    return {
      type: "list_environments_result",
      environments,
      count: environments.length,
      source: { baseUrl: this.demoPortalClient.getBaseUrl() },
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      elapsedMs: Date.now() - startTime
    };
  }
  /**
   * Get a single environment by ID with full details
   *
   * @param environmentId - The environment ID to fetch
   * @returns Structured result with environment and extra details
   * @throws {NotFoundError} If environment doesn't exist
   * @throws {AuthError} If authentication fails
   * @throws {NetworkError} If network request fails
   */
  async getEnvironment(environmentId) {
    const startTime = Date.now();
    try {
      const raw = await this.demoPortalClient.getEnvironmentRaw(environmentId);
      const validated = RawEnvironmentSchema.parse(raw);
      const environment = {
        ...this.transformEnvironment(validated),
        details: this.extractDetails(validated)
      };
      return {
        type: "get_environment_result",
        environment,
        source: { baseUrl: this.demoPortalClient.getBaseUrl() },
        fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
        elapsedMs: Date.now() - startTime
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError(
          "Environment not found. Use list_environments to see available environments.",
          { environmentId }
        );
      }
      throw error;
    }
  }
  /**
   * Start an environment
   *
   * Implements idempotency: if already running, returns no-op status.
   * Handles conflicts: if transitioning, returns conflict status.
   * Optionally waits for environment to reach Running status.
   *
   * @param environmentId - The environment ID to start
   * @param options - Optional wait behavior ('none' or 'untilRunning')
   * @returns Result indicating outcome of start operation
   * @throws {NotFoundError} If environment doesn't exist
   * @throws {TimeoutError} If wait timeout exceeded
   */
  async startEnvironment(environmentId, options) {
    const current = await this.getEnvironment(environmentId);
    if (current.environment.status === "Running") {
      return {
        type: "start_environment_result",
        environmentId,
        previousStatus: "Running",
        newStatus: "Running",
        status: "no_op",
        message: "Environment already running; no action taken.",
        transition: { requested: "start", from: "Running", to: "Running" },
        fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    if (current.environment.status === "Stopping") {
      return {
        type: "start_environment_result",
        environmentId,
        previousStatus: current.environment.status,
        newStatus: current.environment.status,
        status: "conflict_in_progress",
        message: "Environment is stopping. Wait for it to complete before starting.",
        transition: {
          requested: "start",
          from: current.environment.status,
          to: "Running"
        },
        fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    await this.demoPortalClient.patchEnvironment(environmentId, {
      status: "Running"
    });
    if (options?.wait === "untilRunning") {
      return await this.waitForStartStatus(environmentId, "Running");
    }
    return {
      type: "start_environment_result",
      environmentId,
      previousStatus: current.environment.status,
      newStatus: "Starting",
      status: "accepted",
      message: "Environment is starting. This may take several minutes.",
      transition: {
        requested: "start",
        from: current.environment.status,
        to: "Running",
        intermediate: "Starting"
      },
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Stop an environment
   *
   * Implements idempotency: if already stopped, returns no-op status.
   * Optionally waits for environment to reach Stopped status.
   *
   * @param environmentId - The environment ID to stop
   * @param options - Optional wait behavior ('none' or 'untilStopped')
   * @returns Result indicating outcome of stop operation
   * @throws {NotFoundError} If environment doesn't exist
   * @throws {TimeoutError} If wait timeout exceeded
   */
  async stopEnvironment(environmentId, options) {
    const current = await this.getEnvironment(environmentId);
    if (current.environment.status === "Stopped") {
      return {
        type: "stop_environment_result",
        environmentId,
        previousStatus: "Stopped",
        newStatus: "Stopped",
        status: "no_op",
        message: "Environment already stopped; no action taken.",
        fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    await this.demoPortalClient.patchEnvironment(environmentId, {
      status: "Stopped"
    });
    if (options?.wait === "untilStopped") {
      return await this.waitForStopStatus(environmentId, "Stopped");
    }
    return {
      type: "stop_environment_result",
      environmentId,
      previousStatus: current.environment.status,
      newStatus: "Stopping",
      status: "accepted",
      message: "Environment is stopping.",
      transition: {
        requested: "stop",
        from: current.environment.status,
        to: "Stopped",
        intermediate: "Stopping"
      },
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Transform raw API environment to normalized format
   *
   * Handles various name fields (displayName, name, environmentName)
   * and version fields (applicationVersion, bcVersion, version).
   *
   * @private
   */
  transformEnvironment(raw) {
    return {
      id: raw.id,
      name: raw.displayName || raw.name || raw.environmentName || raw.id,
      status: raw.status,
      // Use status as-is from API (Running, Stopped, Draft, etc.)
      bcVersion: String(
        raw.applicationVersion || raw.bcVersion || raw.version || "unknown"
      )
    };
  }
  /**
   * Extract additional details from raw environment
   *
   * Preserves extra fields from API response for detailed view.
   *
   * @private
   */
  extractDetails(raw) {
    const {
      id,
      name,
      displayName,
      environmentName,
      status,
      applicationVersion,
      bcVersion,
      version,
      url,
      authenticationMethod,
      ...rest
    } = raw;
    const result = {
      bcVersion: this.transformEnvironment(raw).bcVersion,
      ...rest
      // Preserve extra fields first
    };
    if (raw.url) {
      result.url = raw.url;
    }
    if (raw.authenticationMethod) {
      result.authenticationMethod = raw.authenticationMethod;
    }
    return result;
  }
  /**
   * Wait for environment to reach Running status with polling
   *
   * Uses exponential backoff with max delay of 30 seconds.
   * Throws TimeoutError if target status not reached within timeout.
   *
   * @private
   */
  async waitForStartStatus(environmentId, targetStatus, timeoutMs = 3e5) {
    const startTime = Date.now();
    let delayMs = 2e3;
    while (Date.now() - startTime < timeoutMs) {
      await this.delay(delayMs);
      const current = await this.getEnvironment(environmentId);
      if (current.environment.status === targetStatus) {
        return {
          type: "start_environment_result",
          environmentId,
          previousStatus: "various",
          newStatus: targetStatus,
          status: "completed",
          message: `Environment successfully transitioned to ${targetStatus}`,
          transition: {
            requested: "start",
            from: "various",
            to: targetStatus
          },
          fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
          elapsedMs: Date.now() - startTime
        };
      }
      delayMs = Math.min(3e4, delayMs * 2);
    }
    throw new TimeoutError(
      `Timeout waiting for environment to reach ${targetStatus} status after ${timeoutMs / 1e3} seconds`,
      timeoutMs,
      {
        environmentId,
        targetStatus,
        elapsedMs: Date.now() - startTime
      }
    );
  }
  /**
   * Wait for environment to reach Stopped status with polling
   *
   * Uses exponential backoff with max delay of 30 seconds.
   * Throws TimeoutError if target status not reached within timeout.
   *
   * @private
   */
  async waitForStopStatus(environmentId, targetStatus, timeoutMs = 3e5) {
    const startTime = Date.now();
    let delayMs = 2e3;
    while (Date.now() - startTime < timeoutMs) {
      await this.delay(delayMs);
      const current = await this.getEnvironment(environmentId);
      if (current.environment.status === targetStatus) {
        return {
          type: "stop_environment_result",
          environmentId,
          previousStatus: "various",
          newStatus: targetStatus,
          status: "completed",
          message: `Environment successfully transitioned to ${targetStatus}`,
          transition: {
            requested: "stop",
            from: "various",
            to: targetStatus
          },
          fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
          elapsedMs: Date.now() - startTime
        };
      }
      delayMs = Math.min(3e4, delayMs * 2);
    }
    throw new TimeoutError(
      `Timeout waiting for environment to reach ${targetStatus} status after ${timeoutMs / 1e3} seconds`,
      timeoutMs,
      {
        environmentId,
        targetStatus,
        elapsedMs: Date.now() - startTime
      }
    );
  }
  /**
   * Delay helper for polling
   *
   * @private
   */
  delay(ms) {
    return new Promise((resolve2) => setTimeout(resolve2, ms));
  }
};

// src/services/testRunnerService.ts
import { XMLParser } from "fast-xml-parser";
import { parse as parseCsv } from "csv-parse/sync";
var TestRunnerService = class {
  constructor(demoPortalClient, config, testRegistry, infrastructureService) {
    this.demoPortalClient = demoPortalClient;
    this.config = config;
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      allowBooleanAttributes: true,
      parseAttributeValue: true
    });
    this.logger = Logger.getInstance();
    this.testRegistry = testRegistry || null;
    this.infrastructureService = infrastructureService || null;
  }
  static {
    __name(this, "TestRunnerService");
  }
  xmlParser;
  logger;
  testRegistry = null;
  infrastructureService = null;
  /**
   * Run tests on a Business Central environment
   *
   * Submits test job, polls for completion, parses results and optionally coverage.
   *
   * @param params - Test execution parameters
   * @returns Test results with summary, failures, and optional coverage
   * @throws {NotFoundError} If environment or job not found
   * @throws {TimeoutError} If test execution exceeds timeout
   */
  async runTests(params) {
    const startTime = Date.now();
    const timeoutMs = (params.timeoutSeconds ?? 600) * 1e3;
    const signal = params.signal ?? AbortSignal.timeout(timeoutMs);
    if (this.infrastructureService) {
      const autoInstall = this.config.get("testRunner.autoInstall", true);
      if (autoInstall) {
        this.logger.info("Ensuring Test Runner infrastructure is installed", {
          details: { environmentId: params.environmentId }
        });
        const ensureResult = await this.infrastructureService.ensureTestRunnerInstalled(
          params.environmentId
        );
        if (ensureResult.status === "installation_failed") {
          throw new ValidationError(
            "Test Runner infrastructure could not be installed. " + ensureResult.message,
            { ensureResult }
          );
        }
        if (ensureResult.status === "newly_installed") {
          this.logger.info("Test Runner was just installed", {
            details: { message: ensureResult.message }
          });
        }
      }
    }
    if (this.testRegistry && params.workspacePath) {
      await this.validateTestsExist(params);
    }
    const testParams = {};
    if (params.codeunitId !== void 0) {
      testParams.testCodeunitId = params.codeunitId;
    }
    if (params.testMethod) {
      testParams.testFunctionName = params.testMethod;
    }
    this.logger.info("Creating test job with standard BC parameters", {
      details: {
        environmentId: params.environmentId,
        testCodeunitId: params.codeunitId,
        testFunctionName: params.testMethod,
        parameterCount: Object.keys(testParams).length,
        testParams
      }
    });
    const { jobId } = await this.demoPortalClient.createTestJob(
      params.environmentId,
      testParams,
      { signal }
    );
    this.logger.info("Test job created successfully", {
      details: {
        jobId,
        environmentId: params.environmentId,
        codeunitId: params.codeunitId,
        testMethod: params.testMethod
      }
    });
    const result = await this.pollForResults(
      params.environmentId,
      jobId,
      signal,
      timeoutMs,
      startTime
    );
    const summary = this.parseTestResults(result.xml);
    if (summary.total === 0 && params.codeunitId !== void 0) {
      this.logger.warn("No tests found for specified codeunit", {
        details: {
          codeunitId: params.codeunitId,
          testMethod: params.testMethod,
          jobId,
          message: "The test job completed but found no tests to execute. Possible causes: 1) The codeunit does not exist in the environment (verify app is published), 2) The codeunit is not a test codeunit (missing Subtype = Test), 3) The codeunit has no test methods (missing [Test] attribute), 4) The test app was compiled but not published to this environment, 5) The API might not be applying the codeunit filter correctly (testCodeunitId parameter)",
          diagnosticHint: "Use the diagnose_tests tool to verify test availability in the environment"
        }
      });
    } else if (summary.total > 0) {
      this.logger.info("Test execution completed", {
        details: {
          jobId,
          totalTests: summary.total,
          passed: summary.passed,
          failed: summary.failed,
          skipped: summary.skipped,
          duration: summary.durationSec
        }
      });
    }
    let coverage;
    if (params.includeCoverage) {
      try {
        const csv = await this.demoPortalClient.getCoverageCsv(
          params.environmentId,
          jobId
        );
        coverage = this.parseCoverage(csv);
      } catch (error) {
        if (!(error instanceof NotFoundError)) {
          throw error;
        }
      }
    }
    return {
      type: "run_tests_result",
      environmentId: params.environmentId,
      job: {
        jobId,
        submittedAt: new Date(startTime).toISOString(),
        completedAt: (/* @__PURE__ */ new Date()).toISOString(),
        elapsedMs: Date.now() - startTime
      },
      summary,
      failures: summary.failed > 0 ? this.extractFailures(result.xml) : [],
      coverage,
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Diagnostic method to troubleshoot test execution issues
   * Runs tests without filters and with various parameter combinations
   */
  async runTestDiagnostics(environmentId, codeunitId) {
    const diagnosticResults = {
      analysis: {
        environmentId,
        requestedCodeunitId: codeunitId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
    this.logger.info("Starting test diagnostics", {
      details: { environmentId, codeunitId }
    });
    try {
      this.logger.info("Step 1: Running tests WITHOUT any filter");
      const withoutFilter = await this.runTests({
        environmentId,
        timeoutSeconds: 60
      });
      diagnosticResults.withoutFilter = withoutFilter;
      diagnosticResults.analysis.totalTestsAvailable = withoutFilter.summary.total;
      diagnosticResults.analysis.testsFound = withoutFilter.summary.total > 0;
      if (withoutFilter.summary.total > 0) {
        this.logger.info("Tests found without filter", {
          details: {
            total: withoutFilter.summary.total,
            passed: withoutFilter.summary.passed,
            failed: withoutFilter.summary.failed
          }
        });
      } else {
        this.logger.warn("NO tests found even without filter!", {
          details: {
            message: "This suggests no test codeunits are available in the environment"
          }
        });
      }
      if (codeunitId !== void 0) {
        this.logger.info("Step 2: Running tests WITH codeunit filter", {
          details: { codeunitId }
        });
        try {
          const withFilter = await this.runTests({
            environmentId,
            codeunitId,
            timeoutSeconds: 60
          });
          diagnosticResults.withFilter = withFilter;
          diagnosticResults.analysis.filterWorking = withFilter.summary.total > 0;
          diagnosticResults.analysis.testsFoundWithFilter = withFilter.summary.total;
          if (withFilter.summary.total === 0) {
            this.logger.warn("Filter returned 0 tests", {
              details: {
                codeunitId,
                message: "The filter is not working or the codeunit has no tests"
              }
            });
          }
        } catch (error) {
          diagnosticResults.analysis.filterError = error instanceof Error ? error.message : String(error);
          this.logger.error("Error running with filter", error, {
            details: { codeunitId }
          });
        }
      }
      diagnosticResults.analysis.recommendations = this.generateRecommendations(diagnosticResults);
      return diagnosticResults;
    } catch (error) {
      this.logger.error("Diagnostic test failed", error);
      throw error;
    }
  }
  generateRecommendations(diagnosticResults) {
    const recommendations = [];
    if (diagnosticResults.analysis.totalTestsAvailable === 0) {
      recommendations.push("No tests available in environment. This indicates the test app is NOT published to this environment.");
      recommendations.push("Action required: Run compile_and_publish to publish your test app to this environment.");
      recommendations.push("Alternative causes: Test runner codeunit not installed, or environment has no test suites configured.");
      recommendations.push("Verify: Use compile_app tool to check if test codeunits were detected during compilation.");
    } else if (diagnosticResults.withFilter?.summary.total === 0) {
      recommendations.push(`Codeunit ${diagnosticResults.analysis.requestedCodeunitId} not found or has no tests.`);
      recommendations.push("Verify the codeunit ID is correct and exists in the published app.");
      recommendations.push("Check that the codeunit has Subtype = Test in its definition.");
      recommendations.push("Ensure test methods have the [Test] attribute.");
      recommendations.push("Note: The test app may be an older version - recompile and republish if changes were made.");
      recommendations.push("Known issue: The Demo Portal API may have issues with the testCodeunitId filtering parameter.");
    }
    return recommendations;
  }
  /**
   * Poll for test results with exponential backoff
   *
   * Uses configured polling intervals from configuration service:
   * - initialPollIntervalMs (default: 2000ms)
   * - maxPollIntervalMs (default: 30000ms)
   * - backoffFactor (default: 2)
   *
   * @param environmentId - Environment ID
   * @param jobId - Test job ID
   * @param signal - Cancellation signal
   * @param timeoutMs - Total timeout in milliseconds
   * @param startTime - Start time for timeout calculation
   * @returns Test results XML
   * @throws {TimeoutError} If polling exceeds timeout
   */
  async pollForResults(environmentId, jobId, signal, timeoutMs, startTime) {
    let attempts = 0;
    const cfg = this.config.getConfig();
    let delayMs = cfg.test.initialPollIntervalMs;
    const maxDelay = cfg.test.maxPollIntervalMs;
    const backoffFactor = cfg.test.backoffFactor;
    while (Date.now() - startTime < timeoutMs) {
      if (signal.aborted) {
        throw new Error("Test execution cancelled");
      }
      if (attempts > 0) {
        await this.delay(delayMs);
      }
      try {
        const result = await this.demoPortalClient.getTestResultsXml(
          environmentId,
          jobId,
          { signal }
        );
        if (result.statusCode === 200 && result.xml) {
          return { xml: result.xml };
        }
      } catch (error) {
        if (error instanceof NotFoundError) {
        } else {
          throw error;
        }
      }
      attempts++;
      delayMs = Math.min(maxDelay, delayMs * backoffFactor);
      delayMs = Math.floor(delayMs * (0.5 + Math.random() * 0.5));
    }
    throw new TimeoutError(
      `Test execution timed out after ${timeoutMs / 1e3} seconds. Check environment status with get_environment tool.`,
      timeoutMs,
      { environmentId, jobId, attempts }
    );
  }
  /**
   * Parse JUnit XML test results
   *
   * Handles different XML structures:
   * - Single testsuite
   * - Multiple testsuites
   * - Nested structures
   *
   * @param xml - JUnit XML content
   * @returns Test summary with totals
   */
  parseTestResults(xml) {
    const parsed = this.xmlParser.parse(xml);
    const testsuites = parsed.testsuites || parsed.testsuite || parsed;
    const suites = Array.isArray(testsuites.testsuite) ? testsuites.testsuite : [testsuites.testsuite || testsuites];
    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let durationSec = 0;
    for (const suite of suites) {
      if (!suite) {
        continue;
      }
      const suiteTests = parseInt(String(suite.tests || "0"));
      const suiteFailures = parseInt(String(suite.failures || "0"));
      const suiteSkipped = parseInt(String(suite.skipped || "0"));
      const suiteTime = parseFloat(String(suite.time || "0"));
      total += suiteTests;
      failed += suiteFailures;
      skipped += suiteSkipped;
      durationSec += suiteTime;
    }
    passed = total - failed - skipped;
    return {
      total,
      passed,
      failed,
      skipped,
      durationSec
    };
  }
  /**
   * Extract test failure details from XML
   *
   * @param xml - JUnit XML content
   * @returns Array of test failures with details
   */
  extractFailures(xml) {
    const parsed = this.xmlParser.parse(xml);
    const failures = [];
    const testsuites = parsed.testsuites || parsed.testsuite || parsed;
    const suites = Array.isArray(testsuites.testsuite) ? testsuites.testsuite : [testsuites.testsuite || testsuites];
    for (const suite of suites) {
      if (!suite) {
        continue;
      }
      const suiteName = String(suite.name || "Unknown");
      const testcases = Array.isArray(suite.testcase) ? suite.testcase : [suite.testcase].filter(Boolean);
      for (const testcase of testcases) {
        if (testcase?.failure) {
          const failure = testcase.failure;
          failures.push({
            suite: suiteName,
            test: String(testcase.name || "Unknown"),
            classname: testcase.classname ? String(testcase.classname) : void 0,
            message: String(failure.message || failure || "Test failed"),
            details: failure["#text"] ? String(failure["#text"]) : void 0,
            timeSec: parseFloat(String(testcase.time || "0"))
          });
        }
      }
    }
    return failures;
  }
  /**
   * Parse CSV code coverage data
   *
   * Expected CSV format:
   * objectType,objectId,objectName,linesCovered,linesNotCovered
   *
   * @param csv - CSV content
   * @returns Coverage summary with per-object breakdown
   */
  parseCoverage(csv) {
    const cleanCsv = csv.replace(/^\uFEFF/, "");
    const records = parseCsv(cleanCsv, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    let linesCovered = 0;
    let linesTotal = 0;
    const byObject = [];
    for (const record of records) {
      const covered = parseInt(record.linesCovered || "0");
      const notCovered = parseInt(record.linesNotCovered || "0");
      const total = covered + notCovered;
      linesCovered += covered;
      linesTotal += total;
      if (record.objectType && record.objectId) {
        byObject.push({
          objectType: record.objectType,
          objectId: parseInt(record.objectId),
          objectName: record.objectName || "Unknown",
          linesCovered: covered,
          linesTotal: total,
          coveredPercent: total > 0 ? covered / total * 100 : 0
        });
      }
    }
    return {
      summary: {
        linesCovered,
        linesTotal,
        coveredPercent: linesTotal > 0 ? linesCovered / linesTotal * 100 : 0
      },
      byObject
    };
  }
  /**
   * Validate that requested tests exist in the workspace
   *
   * @param params - Test parameters including workspace path
   * @throws {ValidationError} If tests are not found in workspace
   */
  async validateTestsExist(params) {
    if (!this.testRegistry || !params.workspacePath) {
      return;
    }
    const validation = await this.testRegistry.validateTestParameters(
      params.workspacePath,
      params.codeunitId,
      params.testMethod
    );
    if (!validation.valid) {
      this.logger.error("Test validation failed", validation.message, {
        details: {
          codeunitId: params.codeunitId,
          testMethod: params.testMethod,
          availableCodeunits: validation.availableCodeunits,
          availableMethods: validation.availableMethods
        }
      });
      let errorMessage = validation.message;
      if (validation.availableCodeunits && validation.availableCodeunits.length > 0) {
        errorMessage += `

Available test codeunits in workspace:
`;
        const testCodeunits = await this.testRegistry.getTestCodeunits(params.workspacePath);
        for (const tc of testCodeunits) {
          errorMessage += `  - Codeunit ${tc.file.object.id} "${tc.file.object.name}" (${tc.testMethods.length} tests)
`;
        }
        errorMessage += `
Use the 'list_tests' tool to see all available tests.`;
      } else if (validation.availableMethods && validation.availableMethods.length > 0) {
        errorMessage += `

Available test methods in codeunit ${params.codeunitId}:
`;
        for (const method of validation.availableMethods) {
          errorMessage += `  - ${method}
`;
        }
      } else {
        errorMessage += `

No test codeunits found in workspace. Please ensure:
`;
        errorMessage += `  1. Test codeunits have 'Subtype = Test'
`;
        errorMessage += `  2. Test methods have [Test] attribute
`;
        errorMessage += `  3. Workspace path is correct
`;
        errorMessage += `
Use the 'list_tests' tool to discover available tests.`;
      }
      throw new ValidationError(errorMessage);
    }
    this.logger.info(`Test validation successful: ${validation.message}`, {
      details: {
        codeunitId: params.codeunitId,
        testMethod: params.testMethod
      }
    });
  }
  /**
   * Delay helper for polling
   *
   * @param ms - Milliseconds to wait
   * @returns Promise that resolves after delay
   */
  delay(ms) {
    return new Promise((resolve2) => setTimeout(resolve2, ms));
  }
};

// src/services/credentialsService.ts
import crypto2 from "crypto";
var BcUserSchema = external_exports.object({
  id: external_exports.string(),
  environmentId: external_exports.string(),
  username: external_exports.string(),
  password: external_exports.string(),
  description: external_exports.string().optional(),
  fullName: external_exports.string().optional()
});
var CredentialsService = class {
  constructor(demoPortalClient, configService) {
    this.demoPortalClient = demoPortalClient;
    this.configService = configService;
  }
  static {
    __name(this, "CredentialsService");
  }
  /** Session-scoped cache: environmentId → BcUser */
  userCache = /* @__PURE__ */ new Map();
  /**
   * Get Developer Endpoint authentication header and selected user
   *
   * Implements intelligent user selection with caching:
   * 1. Check cache first (session-scoped)
   * 2. Fetch users from Demo Portal if not cached
   * 3. Select first user (MCP non-interactive mode)
   * 4. Cache selection for session
   * 5. Create Basic Auth header
   *
   * @param environment - Environment details (id, optional authenticationMethod)
   * @returns Authentication result with header and user
   * @throws {AuthError} If no users found or unsupported auth method
   */
  async getDeveloperEndpointAuth(environment) {
    const cachedUser = this.userCache.get(environment.id);
    if (cachedUser) {
      return this.createAuthResult(cachedUser);
    }
    const users = await this.fetchEnvironmentUsers(environment.id);
    if (users.length === 0) {
      return this.handleNoUsers(environment);
    }
    const selectedUser = users[0];
    if (!selectedUser) {
      throw new AuthError("No users available after fetch", { environmentId: environment.id });
    }
    this.userCache.set(environment.id, selectedUser);
    return this.createAuthResult(selectedUser);
  }
  /**
   * Invalidate cached credentials (called on 401/403 responses)
   *
   * Clears cached user for the environment to force re-fetch on next request.
   * Used by DeveloperEndpointClient when auth fails.
   *
   * @param environmentId - Environment ID to invalidate
   */
  invalidateDeveloperEndpointAuth(environmentId) {
    this.userCache.delete(environmentId);
  }
  /**
   * Get configured tenant for developer endpoint
   *
   * Defaults to 'default' if not configured.
   *
   * @returns Tenant name for Developer Endpoint URLs
   */
  getDevTenant() {
    return this.configService.get("auth.devTenant", "default");
  }
  /**
   * Fetch users for an environment from Demo Portal
   *
   * @param environmentId - Environment ID
   * @returns Array of BC users (validated against schema)
   * @throws {NotFoundError} If environment not found
   * @throws {NetworkError} If API request fails
   */
  async fetchEnvironmentUsers(environmentId) {
    const response = await this.demoPortalClient.getEnvironmentUsers(environmentId);
    return response.map((user) => BcUserSchema.parse(user));
  }
  /**
   * Create authentication result from user
   *
   * Generates Basic Authentication header: `Basic base64(username:password)`
   *
   * @param user - BC user
   * @returns Authentication result with header and user
   */
  createAuthResult(user) {
    const credentials = `${user.username}:${user.password}`;
    const encoded = Buffer.from(credentials).toString("base64");
    return {
      authorization: `Basic ${encoded}`,
      user
    };
  }
  /**
   * Handle case when no users exist for environment
   *
   * In MCP (non-interactive) mode:
   * - Check if auth method is NavUserPassword
   * - Return structured error with suggestedActions
   * - Provide actionable guidance for LLM
   *
   * @param environment - Environment details
   * @returns Never returns - always throws
   * @throws {AuthError} With structured error details
   */
  handleNoUsers(environment) {
    const authMethod = environment.authenticationMethod ?? "NavUserPassword";
    if (authMethod !== "NavUserPassword") {
      throw new AuthError(
        `Developer Endpoint publishing requires NavUserPassword authentication. Current method: ${authMethod}. Please create a NavUserPassword user first.`,
        {
          code: "UNSUPPORTED_AUTH_METHOD",
          suggestedActions: ["CreateNavUserPasswordUser"],
          currentAuthMethod: authMethod,
          supportedAuthMethods: ["NavUserPassword"]
        }
      );
    }
    throw new AuthError(
      "No users found for environment. Create a NavUserPassword user via Demo Portal to proceed.",
      {
        code: "NO_USERS",
        suggestedActions: ["CreateUserViaPortal", "CheckEnvironmentSettings"],
        environmentId: environment.id,
        hint: "Users can be created via the Demo Portal web interface"
      }
    );
  }
  /**
   * Create a new environment user (for future interactive mode)
   *
   * Creates a user with random username and secure password.
   * Currently not used in MCP mode but available for future extensions.
   *
   * @param environmentId - Environment ID
   * @returns Created user
   * @throws {NetworkError} If API request fails
   */
  async createEnvironmentUser(environmentId) {
    const username = `User${Date.now()}`;
    const password = this.generateSecurePassword();
    const response = await this.demoPortalClient.createEnvironmentUser(
      environmentId,
      {
        username,
        password
      }
    );
    return BcUserSchema.parse(response);
  }
  /**
   * Generate cryptographically secure password
   *
   * Generates 16-character password with mixed case, numbers, and symbols.
   *
   * @returns Secure random password
   */
  generateSecurePassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 16; i++) {
      const randomIndex = crypto2.randomInt(0, chars.length);
      password += chars[randomIndex];
    }
    return password;
  }
};

// src/services/compilationService.ts
import { spawn as spawn2 } from "child_process";
import path2 from "path";
import fs from "fs/promises";

// src/services/powershellPublishService.ts
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
var PowerShellPublishService = class {
  static {
    __name(this, "PowerShellPublishService");
  }
  scriptPath;
  constructor() {
    const __dirname2 = path.dirname(fileURLToPath2(import.meta.url));
    this.scriptPath = path.resolve(__dirname2, "../../scripts/Publish-BCApp.ps1");
  }
  /**
   * Publish an AL app to Business Central using PowerShell
   *
   * Executes the Publish-BCApp.ps1 script with the provided parameters.
   * The script handles all the complexity of multipart upload and authentication.
   *
   * @param params - Publishing parameters
   * @returns Publishing result from PowerShell script
   * @throws Error if PowerShell execution fails
   */
  async publishApp(params) {
    return this.executeScript(params, false);
  }
  /**
   * Run diagnostics for publishing without actually publishing
   *
   * Useful for debugging publish failures. Shows:
   * - Constructed URL
   * - Credentials (redacted)
   * - Connectivity test results
   *
   * @param params - Publishing parameters
   * @returns Diagnostic information
   * @throws Error if PowerShell execution fails
   */
  async diagnose(params) {
    return this.executeScript(params, true);
  }
  /**
   * Execute the PowerShell script
   *
   * @param params - Publishing parameters
   * @param diagnose - Whether to run in diagnose mode
   * @returns Script result
   */
  executeScript(params, diagnose) {
    return new Promise((resolve2, reject) => {
      const args = this.buildPowerShellArgs(params, diagnose);
      console.error(`[PowerShellPublish] Executing script: ${this.scriptPath}`);
      console.error(`[PowerShellPublish] Parameters: ${JSON.stringify({
        ...params,
        password: "***REDACTED***"
      })}`);
      const ps = spawn("powershell.exe", [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        this.scriptPath,
        ...args
      ], {
        windowsHide: true,
        env: { ...process.env }
      });
      let stdout = "";
      let stderr = "";
      ps.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      ps.stderr.on("data", (data) => {
        const message = data.toString();
        stderr += message;
        process.stderr.write(message);
      });
      ps.on("error", (error) => {
        console.error(`[PowerShellPublish] Failed to spawn PowerShell: ${error.message}`);
        reject(new Error(`Failed to execute PowerShell script: ${error.message}`));
      });
      ps.on("close", (code) => {
        console.error(`[PowerShellPublish] Script exited with code: ${code}`);
        try {
          const trimmedOutput = stdout.trim();
          if (!trimmedOutput) {
            reject(new Error(
              `PowerShell script produced no output. Exit code: ${code}. Stderr: ${stderr.substring(0, 500)}`
            ));
            return;
          }
          const result = JSON.parse(trimmedOutput);
          resolve2(result);
        } catch (parseError) {
          console.error(`[PowerShellPublish] Failed to parse JSON output: ${stdout}`);
          reject(new Error(
            `Failed to parse PowerShell output as JSON. Output: ${stdout.substring(0, 500)}. Stderr: ${stderr.substring(0, 500)}`
          ));
        }
      });
    });
  }
  /**
   * Build PowerShell command-line arguments
   *
   * @param params - Publishing parameters
   * @param diagnose - Whether to run in diagnose mode
   * @returns Array of command-line arguments
   */
  buildPowerShellArgs(params, diagnose) {
    const args = [
      "-AppPath",
      params.appPath,
      "-EnvironmentId",
      params.environmentId,
      "-EnvironmentUrl",
      params.environmentUrl,
      "-Username",
      params.username,
      "-Password",
      params.password
    ];
    if (params.schemaUpdateMode) {
      args.push("-SchemaUpdateMode", params.schemaUpdateMode);
    }
    if (params.dependencyPublishingOption) {
      args.push("-DependencyPublishingOption", params.dependencyPublishingOption);
    }
    if (params.tenant) {
      args.push("-Tenant", params.tenant);
    }
    if (params.allowInsecureCertificates) {
      args.push("-AllowInsecureCertificates");
    }
    if (diagnose) {
      args.push("-Diagnose");
    }
    return args;
  }
  /**
   * Get the path to the PowerShell script
   *
   * Useful for manual testing/debugging.
   *
   * @returns Absolute path to Publish-BCApp.ps1
   */
  getScriptPath() {
    return this.scriptPath;
  }
};

// src/services/compilationService.ts
var AppJsonSchema = external_exports.object({
  id: external_exports.string().uuid(),
  name: external_exports.string().min(1),
  publisher: external_exports.string().min(1),
  version: external_exports.string().regex(/^\d+\.\d+\.\d+\.\d+$/)
});
var CompilationService = class {
  constructor(demoPortalClient, devEndpointClient, credentialsService, configService) {
    this.demoPortalClient = demoPortalClient;
    this.credentialsService = credentialsService;
    this.configService = configService;
    this.powershellPublishService = new PowerShellPublishService();
    this.devEndpointClient = devEndpointClient;
  }
  static {
    __name(this, "CompilationService");
  }
  powershellPublishService;
  /** HTTP-based endpoint client - kept as fallback option if PowerShell fails */
  devEndpointClient;
  /**
   * Get the HTTP-based developer endpoint client (for fallback publishing)
   *
   * @returns DeveloperEndpointClient instance
   */
  getDevEndpointClient() {
    return this.devEndpointClient;
  }
  /**
   * Compile AL project and publish to BC environment
   *
   * Workflow:
   * 1. Verify AL CLI tools installed
   * 2. Compile AL project
   * 3. Get environment details from Demo Portal
   * 4. Publish .app file to Developer Endpoint
   *
   * @param params - Compilation and publishing parameters
   * @returns Complete result with compile and publish details
   * @throws {ValidationError} If AL tools not installed or invalid config
   * @throws {CompileError} If compilation fails
   * @throws {AuthError} If publishing authentication fails
   * @throws {ConflictError} If schema conflict occurs
   */
  async compileAndPublish(params) {
    await this.verifyAlCliTools();
    const resolvedPackageCachePath = await this.resolvePackageCachePath(
      params.workspacePath,
      params.packageCachePath
    );
    const compileResult = await this.compile({
      projectPath: params.workspacePath,
      packageCachePath: resolvedPackageCachePath,
      rulesetPath: params.rulesetPath
    });
    const environmentResponse = await this.demoPortalClient.getEnvironmentRaw(
      params.environmentId
    );
    const environmentUrl = environmentResponse.url ?? environmentResponse.serverInstance ?? "";
    if (!environmentUrl) {
      throw new ValidationError(
        `Environment '${params.environmentId}' does not have a valid URL. Cannot publish app.`,
        { environmentId: params.environmentId }
      );
    }
    const authMethod = environmentResponse.authenticationMethod ?? "NavUserPassword";
    const authResult = await this.credentialsService.getDeveloperEndpointAuth({
      id: params.environmentId,
      authenticationMethod: authMethod
    });
    const tenant = this.configService.get("auth.devTenant", "default");
    const allowInsecureCerts = this.configService.get("auth.allowInsecureCertificates", false);
    console.error(`[CompilationService] Publishing app using PowerShell script`);
    console.error(`[CompilationService] App: ${compileResult.appPath}`);
    console.error(`[CompilationService] Environment: ${params.environmentId}`);
    console.error(`[CompilationService] URL: ${environmentUrl}`);
    console.error(`[CompilationService] User: ${authResult.user.username}`);
    const psResult = await this.powershellPublishService.publishApp({
      appPath: compileResult.appPath,
      environmentId: params.environmentId,
      environmentUrl,
      username: authResult.user.username,
      password: authResult.user.password,
      schemaUpdateMode: params.schemaUpdateMode ?? "synchronize",
      dependencyPublishingOption: params.dependencyPublishingOption,
      tenant,
      allowInsecureCertificates: allowInsecureCerts
    });
    const publishResult = {
      success: psResult.success,
      status: psResult.status,
      schemaUpdateMode: psResult.schemaUpdateMode,
      user: psResult.user,
      response: psResult.response,
      error: psResult.error
    };
    if (!publishResult.success) {
      if (psResult.error?.includes("Authentication failed") || psResult.error?.includes("401")) {
        this.credentialsService.invalidateDeveloperEndpointAuth(params.environmentId);
        throw new AuthError(
          `Publishing failed: ${psResult.error}. Credentials have been invalidated for retry.`,
          {
            environmentId: params.environmentId,
            user: authResult.user.username,
            url: psResult.url
          }
        );
      }
      throw new ValidationError(
        `Publishing failed: ${psResult.error}`,
        {
          environmentId: params.environmentId,
          url: psResult.url,
          schemaUpdateMode: psResult.schemaUpdateMode
        }
      );
    }
    let verificationStatus = void 0;
    if (publishResult.success) {
      const isTestApp = compileResult.testAppDetected ?? false;
      verificationStatus = await this.verifyPublishedApp(
        params.environmentId,
        compileResult.app,
        isTestApp
      );
    }
    const result = {
      type: "compile_and_publish_result",
      compile: compileResult,
      publish: publishResult,
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (verificationStatus) {
      result.verificationStatus = verificationStatus;
    }
    return result;
  }
  /**
   * Diagnose publishing configuration without actually publishing
   *
   * Useful for debugging publish failures. Shows:
   * - Constructed URL
   * - Credentials (password redacted)
   * - Connectivity test results
   * - Environment configuration
   *
   * @param params - Parameters for diagnosis
   * @returns Diagnostic information
   */
  async diagnosePublish(params) {
    const environmentResponse = await this.demoPortalClient.getEnvironmentRaw(
      params.environmentId
    );
    const environmentUrl = environmentResponse.url ?? environmentResponse.serverInstance ?? "";
    const authMethod = environmentResponse.authenticationMethod ?? "NavUserPassword";
    const authResult = await this.credentialsService.getDeveloperEndpointAuth({
      id: params.environmentId,
      authenticationMethod: authMethod
    });
    const password = authResult.user.password;
    const passwordRedacted = password.length <= 4 ? "****" : password.substring(0, 2) + "*".repeat(password.length - 4) + password.substring(password.length - 2);
    const tenant = this.configService.get("auth.devTenant", "default");
    const schemaUpdateMode = "synchronize";
    const baseUrl = new URL(environmentUrl);
    const constructedUrl = `${baseUrl.origin}/${params.environmentId}/dev/apps?tenant=${tenant}&SchemaUpdateMode=${schemaUpdateMode}`;
    const scriptPath = this.powershellPublishService.getScriptPath();
    let scriptExists = false;
    try {
      await fs.access(scriptPath);
      scriptExists = true;
    } catch {
      scriptExists = false;
    }
    let connectivity = {
      reachable: false
    };
    try {
      const diagResult = await this.powershellPublishService.diagnose({
        appPath: path2.join(params.workspacePath, "app.json"),
        // Just need a file that exists
        environmentId: params.environmentId,
        environmentUrl,
        username: authResult.user.username,
        password: authResult.user.password,
        tenant
      });
      if (diagResult.diagnostics?.connectivity) {
        connectivity = diagResult.diagnostics.connectivity;
      }
    } catch (error) {
      connectivity = {
        reachable: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
    return {
      type: "publish_diagnostics",
      environment: {
        id: params.environmentId,
        url: environmentUrl,
        authMethod
      },
      credentials: {
        username: authResult.user.username,
        passwordRedacted
      },
      url: {
        constructed: constructedUrl,
        tenant,
        schemaUpdateMode
      },
      connectivity,
      powershellScript: {
        path: scriptPath,
        exists: scriptExists
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Verify AL CLI tools are installed
   *
   * Checks that `microsoft.dynamics.businesscentral.development.tools` is installed
   * using `dotnet tool list -g`.
   *
   * @throws {ValidationError} If AL CLI tools not found
   */
  async verifyAlCliTools() {
    const result = await this.executeCommand("dotnet tool list -g");
    if (!result.stdout.includes("microsoft.dynamics.businesscentral.development.tools")) {
      throw new ValidationError(
        "AL CLI tools not installed. Install via: dotnet tool install -g Microsoft.Dynamics.BusinessCentral.Development.Tools",
        {
          command: "dotnet tool install -g Microsoft.Dynamics.BusinessCentral.Development.Tools",
          documentation: "https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-dev-overview"
        }
      );
    }
  }
  /**
   * Detect if an app is a test app based on its app.json
   *
   * Test apps are identified by:
   * - Name containing "Test" or "Test Suite"
   * - ID ranges in test range [94999..95999] or [50000..99999]
   * - Dependencies on Microsoft Test libraries
   *
   * @param appJsonRaw - Raw app.json object
   * @returns true if this is a test app
   */
  isTestApp(appJsonRaw) {
    const name = appJsonRaw.name;
    if (name) {
      const nameLower = name.toLowerCase();
      const testPatterns = [
        /\btest\b/,
        // "test" as a whole word
        /\btests\b/,
        // "tests" as a whole word
        /\btesting\b/,
        // "testing" as a whole word
        /\bmock\b/
        // "mock" as a whole word
      ];
      if (testPatterns.some((pattern) => pattern.test(nameLower))) {
        return true;
      }
    }
    const idRanges = appJsonRaw.idRanges;
    if (idRanges && Array.isArray(idRanges)) {
      for (const range of idRanges) {
        if (range.from >= 94999 && range.to <= 95999) {
          return true;
        }
        if (range.from >= 5e4 && range.from < 1e5) {
          const dependencies2 = appJsonRaw.dependencies;
          if (dependencies2 && Array.isArray(dependencies2)) {
            const hasTestDependencies = dependencies2.some(
              (dep) => dep.name && (dep.name.includes("Test") || dep.name.includes("Library Assert") || dep.name.includes("Test Runner"))
            );
            if (hasTestDependencies) {
              return true;
            }
          }
        }
      }
    }
    const dependencies = appJsonRaw.dependencies;
    if (dependencies && Array.isArray(dependencies)) {
      const testLibraries = [
        "Test Runner",
        "Library Assert",
        "Tests-TestLibraries",
        "System Application Test Library",
        "Library Variable Storage"
      ];
      const hasTestDependency = dependencies.some(
        (dep) => testLibraries.some((lib) => dep.name && dep.name.includes(lib))
      );
      if (hasTestDependency) {
        return true;
      }
    }
    return false;
  }
  /**
   * Verify that a published app is available in the environment
   *
   * Attempts to check if the published app is queryable by:
   * 1. Running a diagnostic test job if it's a test app
   * 2. Checking for available tests in the environment
   *
   * @param environmentId - Environment ID
   * @param appJson - App metadata
   * @param isTestApp - Whether this is a test app
   * @returns Verification status
   */
  async verifyPublishedApp(environmentId, _appJson, isTestApp) {
    try {
      if (isTestApp) {
        const testParams = {};
        const { jobId } = await this.demoPortalClient.createTestJob(
          environmentId,
          testParams
        );
        const maxAttempts = 10;
        let attempts = 0;
        let testsAvailable = 0;
        while (attempts < maxAttempts) {
          await new Promise((resolve2) => setTimeout(resolve2, 2e3));
          try {
            const result = await this.demoPortalClient.getTestResultsXml(
              environmentId,
              jobId
            );
            if (result?.xml) {
              const testCountMatch = result.xml.match(/<testcase/g);
              testsAvailable = testCountMatch ? testCountMatch.length : 0;
              return {
                verified: true,
                testsAvailable,
                message: testsAvailable > 0 ? `Verified: ${testsAvailable} test(s) available in environment` : "App published but no tests detected in environment"
              };
            }
          } catch (pollError) {
          }
          attempts++;
        }
        return {
          verified: false,
          testsAvailable: 0,
          message: "Unable to verify app publication - test job did not complete"
        };
      }
      return {
        verified: true,
        message: "App published successfully (non-test app, verification limited)"
      };
    } catch (error) {
      return {
        verified: false,
        message: `Verification failed: ${error instanceof Error ? error.message : "Unknown error"}`
      };
    }
  }
  /**
   * Detect test codeunits in AL source files
   *
   * Scans .al files for:
   * - Codeunits with Subtype = Test
   * - Methods with [Test] attribute
   *
   * @param projectPath - Path to AL project
   * @returns Test detection information
   */
  async detectTestCodeunits(projectPath) {
    const testCodeunits = [];
    let estimatedTestCount = 0;
    try {
      const alFiles = [];
      const scanDirectory = /* @__PURE__ */ __name(async (dir) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path2.join(dir, entry.name);
          if (entry.isDirectory() && entry.name !== ".alpackages" && entry.name !== "build") {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && entry.name.endsWith(".al")) {
            alFiles.push(fullPath);
          }
        }
      }, "scanDirectory");
      await scanDirectory(projectPath);
      for (const filePath of alFiles) {
        const content = await fs.readFile(filePath, "utf8");
        const codeunitMatch = content.match(/codeunit\s+(\d+)\s+"?([^"{\n]+)"?\s*{/i);
        if (codeunitMatch?.[2]) {
          const codeunitName = codeunitMatch[2];
          const subtypeMatch = content.match(/Subtype\s*=\s*Test/i);
          if (subtypeMatch) {
            testCodeunits.push(codeunitName);
            const testMethodMatches = content.matchAll(/\[Test\]/gi);
            let methodCount = 0;
            for (const _ of testMethodMatches) {
              methodCount++;
            }
            estimatedTestCount += methodCount;
          }
        }
      }
    } catch (error) {
    }
    return {
      testCodeunits,
      estimatedTestCount,
      isTestApp: testCodeunits.length > 0
    };
  }
  /**
   * Get path to AL analyzer DLLs
   *
   * Resolves path based on installed version:
   * Windows: ~/.dotnet/tools/.store/microsoft.dynamics.businesscentral.development.tools/{version}/...
   *
   * @returns Base path to analyzer DLLs
   * @throws {ValidationError} If version cannot be determined or path doesn't exist
   */
  async getAnalyzerPath() {
    const result = await this.executeCommand("dotnet tool list -g");
    const match2 = result.stdout.match(
      /microsoft\.dynamics\.businesscentral\.development\.tools\s+([\d\.-]+[a-z]*)/i
    );
    if (!match2?.[1]) {
      throw new ValidationError("Could not determine AL CLI tools version", {
        hint: 'Run "dotnet tool list -g" manually to verify installation'
      });
    }
    const version = match2[1];
    const userProfile = process.env.USERPROFILE ?? process.env.HOME ?? "";
    if (process.platform !== "win32") {
      throw new ValidationError(
        "AL compilation is only supported on Windows. Use a Windows host or Windows container.",
        { platform: process.platform }
      );
    }
    const analyzerPath = path2.join(
      userProfile,
      ".dotnet",
      "tools",
      ".store",
      "microsoft.dynamics.businesscentral.development.tools",
      version,
      "microsoft.dynamics.businesscentral.development.tools",
      version,
      "lib",
      "net8.0",
      "win-x64"
    );
    return analyzerPath;
  }
  /**
   * Compile AL project
   *
   * Executes `al compile` with:
   * - All three analyzers (CodeCop, AppSourceCop, UICop) for regular apps
   * - Only CodeCop and UICop for test apps (AppSourceCop blocks test ID ranges)
   * - Continue build on error flag
   * - Optional ruleset
   *
   * @param params - Compilation parameters
   * @returns Compilation result with diagnostics
   * @throws {CompileError} If compilation fails
   * @throws {ValidationError} If app.json invalid or output not created
   */
  async compile(params) {
    const appJsonPath = path2.join(params.projectPath, "app.json");
    const appJsonContent = await fs.readFile(appJsonPath, "utf-8");
    const appJsonRaw = JSON.parse(appJsonContent);
    const appJson = AppJsonSchema.parse(appJsonRaw);
    const isTestApp = this.isTestApp(appJsonRaw);
    const outputDir = path2.join(params.projectPath, "build");
    await fs.mkdir(outputDir, { recursive: true });
    const appFileName = `${appJson.publisher}_${appJson.name}_${appJson.version}.app`;
    const outputPath = path2.join(outputDir, appFileName);
    const analyzerBasePath = await this.getAnalyzerPath();
    const analyzers = isTestApp ? [
      // Exclude AppSourceCop for test apps (it blocks test ID ranges)
      path2.join(analyzerBasePath, "Microsoft.Dynamics.Nav.CodeCop.dll"),
      path2.join(analyzerBasePath, "Microsoft.Dynamics.Nav.UICop.dll")
    ] : [
      // Include all analyzers for regular apps
      path2.join(analyzerBasePath, "Microsoft.Dynamics.Nav.CodeCop.dll"),
      path2.join(analyzerBasePath, "Microsoft.Dynamics.Nav.AppSourceCop.dll"),
      path2.join(analyzerBasePath, "Microsoft.Dynamics.Nav.UICop.dll")
    ];
    const args = [
      "compile",
      `/project:"${params.projectPath}"`,
      `/packagecachepath:"${params.packageCachePath}"`,
      `/out:"${outputPath}"`,
      `/analyzer:"${analyzers.join(";")}"`,
      "/continuebuildonerror:+"
    ];
    const rulesetPath = params.rulesetPath ?? path2.join(params.projectPath, ".ruleset.json");
    if (await this.fileExists(rulesetPath)) {
      args.push(`/ruleset:"${rulesetPath}"`);
    }
    return new Promise((resolve2, reject) => {
      const child = spawn2("al", args, {
        cwd: params.projectPath,
        shell: true,
        windowsVerbatimArguments: true
      });
      let stdout = "";
      let stderr = "";
      const diagnostics = [];
      child.stdout.on("data", (data) => {
        const text = data.toString();
        stdout += text;
        this.parseDiagnostics(text, diagnostics);
      });
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      child.on("error", (error) => {
        reject(
          new CompileError(
            `Failed to start AL compiler: ${error.message}. Ensure AL CLI tools are installed.`,
            []
          )
        );
      });
      child.on("exit", async (code) => {
        const hasErrors = diagnostics.some((d) => d.severity === "error");
        if (code !== 0 && hasErrors) {
          reject(
            new CompileError(
              `Compilation failed with ${diagnostics.filter((d) => d.severity === "error").length} errors`,
              diagnostics,
              { exitCode: code, stdout, stderr }
            )
          );
          return;
        }
        try {
          const stats = await fs.stat(outputPath);
          const testInfo = await this.detectTestCodeunits(params.projectPath);
          const testAppStatus = isTestApp ? `Test app detected (by app.json metadata)` : testInfo.isTestApp ? `Test app detected (found ${testInfo.testCodeunits.length} test codeunit(s) with ${testInfo.estimatedTestCount} test method(s))` : "Regular app (no test codeunits found)";
          const testDiagnostics = `
=== Test App Detection ===
App Name: ${appJson.name}
App Version: ${appJson.version}
Status: ${testAppStatus}
Test Codeunits: ${testInfo.testCodeunits.length > 0 ? testInfo.testCodeunits.join(", ") : "None"}
Estimated Test Count: ${testInfo.estimatedTestCount}
`;
          resolve2({
            success: true,
            appPath: outputPath,
            appSize: stats.size,
            app: appJson,
            diagnostics,
            compilerOutput: stdout + testDiagnostics,
            testAppDetected: isTestApp || testInfo.isTestApp,
            estimatedTestCount: testInfo.estimatedTestCount,
            testCodeunits: testInfo.testCodeunits
          });
        } catch {
          reject(
            new CompileError(
              "Compilation command completed but .app file was not created",
              diagnostics
            )
          );
        }
      });
    });
  }
  /**
   * Execute a shell command and capture output
   *
   * @param command - Command to execute
   * @returns stdout and stderr
   * @throws {Error} If command fails
   */
  async executeCommand(command) {
    return new Promise((resolve2, reject) => {
      const child = spawn2(command, [], { shell: true });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      child.on("exit", (code) => {
        if (code !== 0) {
          reject(new Error(`Command failed with exit code ${code ?? "null"}: ${stderr}`));
        } else {
          resolve2({ stdout, stderr });
        }
      });
      child.on("error", (error) => {
        reject(error);
      });
    });
  }
  /**
   * Parse diagnostics from AL compiler output
   *
   * Pattern: file(line,column): severity code: message
   * Example: HelloWorld.al(10,5): error AL0118: The name 'Foo' does not exist
   *
   * @param output - Compiler output text
   * @param diagnostics - Array to append diagnostics to
   */
  parseDiagnostics(output, diagnostics) {
    const lines = output.split("\n");
    const diagnosticPattern = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(\w+):\s+(.+)$/;
    for (const line of lines) {
      const match2 = diagnosticPattern.exec(line.trim());
      if (match2?.[1] && match2[2] && match2[3] && match2[4] && match2[5] && match2[6]) {
        diagnostics.push({
          file: match2[1],
          line: parseInt(match2[2]),
          column: parseInt(match2[3]),
          severity: match2[4],
          code: match2[5],
          message: match2[6]
        });
      }
    }
  }
  /**
   * Check if a file exists
   *
   * @param filePath - Path to check
   * @returns true if file exists, false otherwise
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Resolve package cache path with monorepo support
   *
   * Priority:
   * 1. Explicitly provided path (always used if provided)
   * 2. Workspace-local .alpackages (if exists)
   * 3. Search parent directories for shared .alpackages (monorepo pattern)
   * 4. Fallback to workspace-local (will be created if needed)
   *
   * @param workspacePath - AL project workspace path
   * @param providedPath - User-provided package cache path (optional)
   * @returns Resolved package cache path
   */
  async resolvePackageCachePath(workspacePath, providedPath) {
    if (providedPath) {
      const exists = await this.fileExists(providedPath);
      console.error(`[compile] Using provided packageCachePath: ${providedPath} (exists: ${exists})`);
      return providedPath;
    }
    const localPath = path2.join(workspacePath, ".alpackages");
    if (await this.fileExists(localPath)) {
      console.error(`[compile] Using workspace-local package cache: ${localPath}`);
      return localPath;
    }
    let currentDir = path2.dirname(workspacePath);
    const root = path2.parse(workspacePath).root;
    const maxDepth = 5;
    let depth = 0;
    while (currentDir !== root && depth < maxDepth) {
      const parentPackages = path2.join(currentDir, ".alpackages");
      if (await this.fileExists(parentPackages)) {
        console.error(`[compile] Found monorepo package cache: ${parentPackages}`);
        return parentPackages;
      }
      currentDir = path2.dirname(currentDir);
      depth++;
    }
    console.error(`[compile] No existing package cache found, using default: ${localPath}`);
    return localPath;
  }
};

// src/services/testRunnerInfrastructureService.ts
import path3 from "path";
import fs2 from "fs/promises";
import { spawn as spawn3 } from "child_process";
import axios3 from "axios";
import https2 from "https";
var TestRunnerInfrastructureService = class _TestRunnerInfrastructureService {
  constructor(demoPortalClient, devEndpointClient, credentialsService, config) {
    this.demoPortalClient = demoPortalClient;
    this.devEndpointClient = devEndpointClient;
    this.credentialsService = credentialsService;
    this.config = config;
    this.logger = Logger.getInstance();
  }
  static {
    __name(this, "TestRunnerInfrastructureService");
  }
  logger;
  statusCache = /* @__PURE__ */ new Map();
  /** Default source path for Test Runner BC app */
  static DEFAULT_SOURCE_PATH = "C:\\GeneralDev\\MCPDevelopment\\AL Developer Tools - Continia AL Test Runner\\bc-app";
  /**
   * Ensure Test Runner is installed on the target environment
   *
   * Main entry point - orchestrates detection and conditional installation.
   *
   * @param environmentId - Environment ID to check/install
   * @returns Ensure result with status and optional install details
   */
  async ensureTestRunnerInstalled(environmentId) {
    this.logger.info("Checking Test Runner infrastructure", {
      details: { environmentId }
    });
    const autoInstall = this.config.get("testRunner.autoInstall", true);
    if (!autoInstall) {
      this.logger.info("Test Runner auto-install is disabled");
      return {
        status: "already_installed",
        message: "Auto-install disabled, skipping Test Runner check"
      };
    }
    const status = await this.detectStatus(environmentId);
    if (status.installed) {
      this.logger.info("Test Runner already installed", {
        details: { environmentId, version: status.version, method: status.detectionMethod }
      });
      return {
        status: "already_installed",
        message: `Test Runner is installed (detected via ${status.detectionMethod})`
      };
    }
    this.logger.info("Test Runner not detected, attempting installation", {
      details: { environmentId }
    });
    try {
      const installResult = await this.installTestRunner(environmentId);
      if (installResult.success) {
        this.statusCache.delete(environmentId);
        this.logger.info("Test Runner installation successful", {
          details: { environmentId, elapsedMs: installResult.elapsedMs }
        });
        return {
          status: "newly_installed",
          message: `Test Runner installed successfully in ${installResult.elapsedMs}ms`,
          installResult
        };
      } else {
        return {
          status: "installation_failed",
          message: "Test Runner installation failed",
          installResult
        };
      }
    } catch (error) {
      this.logger.error("Test Runner installation failed", error, {
        details: { environmentId }
      });
      return {
        status: "installation_failed",
        message: error instanceof Error ? error.message : "Unknown installation error"
      };
    }
  }
  /**
   * Detect Test Runner installation status
   *
   * Uses a "test probe" approach:
   * 1. Check cache first
   * 2. Create a test job with no filters
   * 3. Analyze the result to determine if Test Runner is installed
   *
   * @param environmentId - Environment ID to check
   * @returns Detection status
   */
  async detectStatus(environmentId) {
    const cached = this.statusCache.get(environmentId);
    if (cached && Date.now() < cached.expiresAt) {
      this.logger.debug("Using cached Test Runner status", {
        details: { environmentId, installed: cached.status.installed }
      });
      return {
        ...cached.status,
        detectionMethod: "cached"
      };
    }
    this.logger.info("Probing for Test Runner installation", {
      details: { environmentId }
    });
    try {
      const { jobId } = await this.demoPortalClient.createTestJob(
        environmentId,
        {},
        { signal: AbortSignal.timeout(3e4) }
      );
      const result = await this.pollTestProbe(environmentId, jobId);
      const installed = result.testsFound > 0 || result.apiSuccess;
      const status = installed ? {
        installed: true,
        version: "detected",
        detectionMethod: "test_probe",
        checkedAt: (/* @__PURE__ */ new Date()).toISOString()
      } : {
        installed: false,
        detectionMethod: "test_probe",
        checkedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const cacheDurationMs = this.config.get("testRunner.statusCacheDurationMs", 3e5);
      this.statusCache.set(environmentId, {
        status,
        expiresAt: Date.now() + cacheDurationMs
      });
      return status;
    } catch (error) {
      this.logger.warn("Test probe failed, assuming Test Runner not installed", {
        details: {
          environmentId,
          error: error instanceof Error ? error.message : "Unknown error"
        }
      });
      return {
        installed: false,
        detectionMethod: "test_probe",
        checkedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  /**
   * Install Test Runner on the target environment
   *
   * Workflow:
   * 1. Ensure symbols are available
   * 2. Compile the Test Runner app
   * 3. Publish to the environment
   * 4. Verify installation
   *
   * @param environmentId - Environment ID to install to
   * @returns Installation result
   */
  async installTestRunner(environmentId) {
    const startTime = Date.now();
    const sourcePath = this.config.get(
      "testRunner.sourcePath",
      _TestRunnerInfrastructureService.DEFAULT_SOURCE_PATH
    );
    try {
      await fs2.access(sourcePath);
    } catch {
      throw new TestRunnerInfrastructureError(
        `Test Runner source path does not exist: ${sourcePath}`,
        "compilation",
        { sourcePath }
      );
    }
    await this.ensureSymbolsAvailable(environmentId, sourcePath);
    const compilation = await this.compileTestRunnerApp(sourcePath);
    if (!compilation.success) {
      return {
        success: false,
        compilation,
        publication: { success: false, status: "skipped" },
        elapsedMs: Date.now() - startTime
      };
    }
    const publication = await this.publishTestRunnerApp(
      environmentId,
      compilation.appPath
    );
    return {
      success: compilation.success && publication.success,
      compilation,
      publication,
      elapsedMs: Date.now() - startTime
    };
  }
  /**
   * Poll test probe for results
   *
   * @param environmentId - Environment ID
   * @param jobId - Test job ID
   * @returns Probe results
   */
  async pollTestProbe(environmentId, jobId) {
    const maxAttempts = 15;
    let attempts = 0;
    let delayMs = 2e3;
    while (attempts < maxAttempts) {
      await this.delay(delayMs);
      try {
        const result = await this.demoPortalClient.getTestResultsXml(
          environmentId,
          jobId,
          { signal: AbortSignal.timeout(1e4) }
        );
        if (result.statusCode === 200 && result.xml) {
          const testCountMatch = result.xml.match(/<testcase/g);
          const testsFound = testCountMatch ? testCountMatch.length : 0;
          return { testsFound, apiSuccess: true };
        }
      } catch {
      }
      attempts++;
      delayMs = Math.min(delayMs * 1.5, 1e4);
    }
    return { testsFound: 0, apiSuccess: false };
  }
  /**
   * Ensure symbols are available for compilation
   *
   * Downloads required dependencies from the BC environment.
   *
   * @param environmentId - Environment ID
   * @param projectPath - Path to the Test Runner project
   */
  async ensureSymbolsAvailable(environmentId, projectPath) {
    const packagesPath = path3.join(projectPath, ".alpackages");
    await fs2.mkdir(packagesPath, { recursive: true });
    const appJsonPath = path3.join(projectPath, "app.json");
    const appJsonContent = await fs2.readFile(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    const environment = await this.demoPortalClient.getEnvironmentRaw(environmentId);
    const environmentUrl = environment.url ?? "";
    if (!environmentUrl) {
      this.logger.warn("Environment URL not available, skipping symbol download", {
        details: { environmentId }
      });
      return;
    }
    const auth = await this.credentialsService.getDeveloperEndpointAuth({
      id: environmentId,
      authenticationMethod: environment.authenticationMethod
    });
    const platformVersion = appJson.platform || "23.0.0.0";
    const platformDeps = [
      { name: "System", publisher: "Microsoft", version: platformVersion, id: "8874ed3a-0643-4247-9ced-7a7002f7135d" },
      { name: "Application", publisher: "Microsoft", version: platformVersion, id: "00000000-0000-0000-0000-000000000000" }
    ];
    const dependencies = appJson.dependencies || [];
    const allDeps = [...platformDeps, ...dependencies];
    for (const dep of allDeps) {
      try {
        await this.downloadSymbol(environmentUrl, auth.authorization, dep, packagesPath);
      } catch (error) {
        this.logger.warn(`Failed to download symbol: ${dep.publisher}_${dep.name}`, {
          details: { error: error instanceof Error ? error.message : "Unknown error" }
        });
      }
    }
  }
  /**
   * Download a symbol from the BC environment
   *
   * @param environmentUrl - Environment URL
   * @param authorization - Authorization header value
   * @param dep - Dependency to download
   * @param packagesPath - Path to save the symbol
   */
  async downloadSymbol(environmentUrl, authorization, dep, packagesPath) {
    const existingFiles = await fs2.readdir(packagesPath);
    const pattern = `${dep.publisher}_${dep.name}_`;
    if (existingFiles.some((f) => f.startsWith(pattern))) {
      this.logger.debug(`Symbol already exists: ${dep.publisher}_${dep.name}`);
      return;
    }
    let url = `${environmentUrl.replace(/\/$/, "")}/dev/packages?publisher=${encodeURIComponent(dep.publisher)}&appName=${encodeURIComponent(dep.name)}&versionText=${dep.version}`;
    if (dep.id) {
      url += `&appId=${dep.id}`;
    }
    this.logger.info(`Downloading symbol: ${dep.publisher}_${dep.name}`, {
      details: { version: dep.version }
    });
    try {
      const response = await axios3({
        method: "get",
        url,
        headers: {
          Authorization: authorization,
          Accept: "application/octet-stream"
        },
        httpsAgent: new https2.Agent({
          rejectUnauthorized: !this.config.get("auth.allowInsecureCertificates", false)
        }),
        responseType: "arraybuffer",
        timeout: 6e4
      });
      const contentDisposition = response.headers["content-disposition"] || "";
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      const filename = filenameMatch ? filenameMatch[1].replace(/['"]/g, "") : `${dep.publisher}_${dep.name}_${dep.version}.app`;
      const filePath = path3.join(packagesPath, filename);
      await fs2.writeFile(filePath, Buffer.from(response.data));
      this.logger.info(`Downloaded symbol: ${filename}`);
    } catch (error) {
      if (axios3.isAxiosError(error) && error.response?.status === 404) {
        this.logger.warn(`Symbol not found: ${dep.publisher}_${dep.name}`);
      } else {
        throw error;
      }
    }
  }
  /**
   * Compile the Test Runner app
   *
   * @param projectPath - Path to the Test Runner project
   * @returns Compilation result
   */
  async compileTestRunnerApp(projectPath) {
    this.logger.info("Compiling Test Runner app", { details: { projectPath } });
    const toolCheck = await this.executeCommand("dotnet tool list -g");
    if (!toolCheck.stdout.includes("microsoft.dynamics.businesscentral.development.tools")) {
      throw new TestRunnerInfrastructureError(
        "AL CLI tools not installed. Install via: dotnet tool install -g Microsoft.Dynamics.BusinessCentral.Development.Tools",
        "compilation"
      );
    }
    const appJsonPath = path3.join(projectPath, "app.json");
    const appJsonContent = await fs2.readFile(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    const outputDir = path3.join(projectPath, "build");
    await fs2.mkdir(outputDir, { recursive: true });
    const appFileName = `${appJson.publisher}_${appJson.name}_${appJson.version}.app`;
    const outputPath = path3.join(outputDir, appFileName);
    const analyzerPath = await this.getAnalyzerPath();
    const analyzers = [
      path3.join(analyzerPath, "Microsoft.Dynamics.Nav.CodeCop.dll"),
      path3.join(analyzerPath, "Microsoft.Dynamics.Nav.UICop.dll")
    ];
    const args = [
      "compile",
      `/project:"${projectPath}"`,
      `/packagecachepath:"${path3.join(projectPath, ".alpackages")}"`,
      `/out:"${outputPath}"`,
      `/analyzer:"${analyzers.join(";")}"`,
      "/continuebuildonerror:+"
    ];
    return new Promise((resolve2) => {
      const child = spawn3("al", args, {
        cwd: projectPath,
        shell: true,
        windowsVerbatimArguments: true
      });
      const diagnostics = [];
      child.stdout.on("data", (data) => {
        const text = data.toString();
        this.parseDiagnostics(text, diagnostics);
      });
      child.stderr.on("data", () => {
      });
      child.on("error", (error) => {
        resolve2({
          success: false,
          appPath: "",
          diagnostics: [{
            file: "compile",
            line: 0,
            column: 0,
            severity: "error",
            code: "COMPILE_START_FAILED",
            message: error.message
          }]
        });
      });
      child.on("exit", async (code) => {
        const hasErrors = diagnostics.some((d) => d.severity === "error");
        if (code !== 0 || hasErrors) {
          resolve2({
            success: false,
            appPath: outputPath,
            diagnostics
          });
          return;
        }
        try {
          await fs2.access(outputPath);
          this.logger.info("Test Runner compilation successful", {
            details: { appPath: outputPath }
          });
          resolve2({
            success: true,
            appPath: outputPath,
            diagnostics
          });
        } catch {
          resolve2({
            success: false,
            appPath: outputPath,
            diagnostics: [{
              file: "output",
              line: 0,
              column: 0,
              severity: "error",
              code: "OUTPUT_NOT_FOUND",
              message: "Compilation completed but .app file was not created"
            }]
          });
        }
      });
    });
  }
  /**
   * Publish the Test Runner app to the environment
   *
   * @param environmentId - Environment ID
   * @param appPath - Path to the compiled .app file
   * @returns Publication result
   */
  async publishTestRunnerApp(environmentId, appPath) {
    this.logger.info("Publishing Test Runner app", {
      details: { environmentId, appPath }
    });
    try {
      const environment = await this.demoPortalClient.getEnvironmentRaw(environmentId);
      const environmentUrl = environment.url ?? "";
      if (!environmentUrl) {
        throw new TestRunnerInfrastructureError(
          `Environment '${environmentId}' does not have a valid URL`,
          "publication",
          { environmentId }
        );
      }
      const authMethod = environment.authenticationMethod ?? "NavUserPassword";
      const schemaUpdateMode = this.config.get("testRunner.schemaUpdateMode", "forcesync");
      const result = await this.devEndpointClient.publishApp({
        appPath,
        appFileName: path3.basename(appPath),
        environmentId,
        environmentUrl,
        authenticationMethod: authMethod,
        schemaUpdateMode
      });
      return {
        success: result.success,
        status: result.status
      };
    } catch (error) {
      this.logger.error("Test Runner publication failed", error, {
        details: { environmentId }
      });
      return {
        success: false,
        status: error instanceof Error ? error.message : "Publication failed"
      };
    }
  }
  /**
   * Get path to AL analyzer DLLs
   */
  async getAnalyzerPath() {
    const result = await this.executeCommand("dotnet tool list -g");
    const match2 = result.stdout.match(
      /microsoft\.dynamics\.businesscentral\.development\.tools\s+([\d.-]+[a-z]*)/i
    );
    if (!match2?.[1]) {
      throw new TestRunnerInfrastructureError(
        "Could not determine AL CLI tools version",
        "compilation"
      );
    }
    const version = match2[1];
    const userProfile = process.env.USERPROFILE ?? process.env.HOME ?? "";
    return path3.join(
      userProfile,
      ".dotnet",
      "tools",
      ".store",
      "microsoft.dynamics.businesscentral.development.tools",
      version,
      "microsoft.dynamics.businesscentral.development.tools",
      version,
      "lib",
      "net8.0",
      "win-x64"
    );
  }
  /**
   * Execute a shell command
   */
  async executeCommand(command) {
    return new Promise((resolve2, reject) => {
      const child = spawn3(command, [], { shell: true });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      child.on("exit", (code) => {
        if (code !== 0) {
          reject(new Error(`Command failed with exit code ${code ?? "null"}: ${stderr}`));
        } else {
          resolve2({ stdout, stderr });
        }
      });
      child.on("error", (error) => {
        reject(error);
      });
    });
  }
  /**
   * Parse diagnostics from AL compiler output
   */
  parseDiagnostics(output, diagnostics) {
    const lines = output.split("\n");
    const diagnosticPattern = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(\w+):\s+(.+)$/;
    for (const line of lines) {
      const match2 = diagnosticPattern.exec(line.trim());
      if (match2?.[1] && match2[2] && match2[3] && match2[4] && match2[5] && match2[6]) {
        diagnostics.push({
          file: match2[1],
          line: parseInt(match2[2]),
          column: parseInt(match2[3]),
          severity: match2[4],
          code: match2[5],
          message: match2[6]
        });
      }
    }
  }
  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise((resolve2) => setTimeout(resolve2, ms));
  }
};

// src/tools/listEnvironments.ts
var ListEnvironmentsInputSchema = external_exports.object({});
var listEnvironmentsTool = {
  name: "list_environments",
  description: `List all available Business Central environments from the Demo Portal.

Returns a JSON array of environments with:
- id: Unique environment identifier
- name: Human-readable environment name
- status: Current status (Running, Stopped, Draft, Starting, Stopping)
- bcVersion: Business Central version (e.g., "25.0", "24.3")

The results are sorted alphabetically by name for easy scanning.

Use Cases:
- Get an overview of all available environments
- Find environment IDs for other operations (start, stop, get details)
- Check which environments are currently running
- Verify environment existence before performing operations

Example Response:
{
  "type": "list_environments_result",
  "environments": [
    {
      "id": "env-abc123",
      "name": "Development BC25",
      "status": "Running",
      "bcVersion": "25.0"
    },
    {
      "id": "env-def456",
      "name": "Testing BC24",
      "status": "Stopped",
      "bcVersion": "24.3"
    }
  ],
  "count": 2,
  "fetchedAt": "2024-01-15T10:30:00Z",
  "elapsedMs": 245
}

Error Handling:
- AUTH_ERROR: Invalid or expired API token - verify DEMO_PORTAL_TOKEN
- RATE_LIMIT: Too many requests - wait and retry after specified seconds
- NETWORK_ERROR: Connection issues - check network and API availability

Performance:
- Typical response time: 200-500ms
- Returns all environments in a single request (no pagination needed)
- Results are cached at the API level for ~1 minute`,
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};
async function executeListEnvironments(environmentService, input) {
  try {
    ListEnvironmentsInputSchema.parse(input);
    const result = await environmentService.listEnvironments();
    return result;
  } catch (error) {
    if (error instanceof AppError) {
      return {
        type: "error",
        kind: error.code.toLowerCase(),
        message: error.message,
        retryable: error.retryable,
        details: error.details,
        remediation: getRemediation(error)
      };
    }
    throw error;
  }
}
__name(executeListEnvironments, "executeListEnvironments");
function getRemediation(error) {
  switch (error.code) {
    case "AUTH_ERROR":
      return "Verify DEMO_PORTAL_TOKEN environment variable is set with a valid API token. Check token permissions and expiration.";
    case "RATE_LIMIT":
      const retryAfter = error instanceof RateLimitError ? error.retryAfter : 60;
      return `API rate limit exceeded. Wait ${retryAfter} seconds before retrying. Consider reducing request frequency.`;
    case "NETWORK_ERROR":
      return "Check network connection and Demo Portal API availability. Verify baseUrl is correct in configuration.";
    default:
      return "Review error details and try again. Contact support if issue persists.";
  }
}
__name(getRemediation, "getRemediation");

// src/tools/getEnvironment.ts
var GetEnvironmentInputSchema = external_exports.object({
  environmentId: external_exports.string().min(1, "Environment ID is required").describe(
    "The unique identifier of the environment to retrieve. Use list_environments to find valid IDs."
  )
});
var getEnvironmentTool = {
  name: "get_environment",
  description: `Get detailed information about a specific Business Central environment.

Returns comprehensive environment details including:
- Basic info: id, name, status, bcVersion
- Additional details: URL, authentication method, and other metadata
- Real-time status information

Parameters:
- environmentId (required): The unique environment identifier
  Example: "env-abc123" or "12345-67890-abcde"
  Get valid IDs by calling list_environments first

Use Cases:
- Check current status before starting/stopping an environment
- Get environment URL for Developer Endpoint operations
- Verify authentication method before publishing apps
- Retrieve full environment configuration details
- Confirm environment exists before performing operations

Example Response:
{
  "type": "get_environment_result",
  "environment": {
    "id": "env-abc123",
    "name": "Development BC25",
    "status": "Running",
    "bcVersion": "25.0",
    "details": {
      "bcVersion": "25.0",
      "url": "https://bc-env.continiaonline.com/BC250",
      "authenticationMethod": "NavUserPassword"
    }
  },
  "fetchedAt": "2024-01-15T10:30:00Z",
  "elapsedMs": 180
}

Status Values:
- Running: Environment is active and ready for use
- Stopped: Environment is not running (can be started)
- Starting: Environment is in the process of starting up
- Stopping: Environment is in the process of shutting down
- Draft: Environment is not yet fully configured

Error Handling:
- NOT_FOUND: Environment ID doesn't exist - use list_environments to find valid IDs
- AUTH_ERROR: Invalid or expired API token
- NETWORK_ERROR: Connection issues - retry after brief delay

Performance:
- Typical response time: 150-300ms
- Returns real-time status (no caching)
- Use this before start/stop operations to check current state`,
  inputSchema: {
    type: "object",
    properties: {
      environmentId: {
        type: "string",
        description: "The unique identifier of the environment to retrieve. Use list_environments to find valid IDs."
      }
    },
    required: ["environmentId"]
  }
};
async function executeGetEnvironment(environmentService, input) {
  try {
    const validated = GetEnvironmentInputSchema.parse(input);
    const result = await environmentService.getEnvironment(
      validated.environmentId
    );
    return result;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        type: "error",
        kind: "not_found",
        message: error.message,
        retryable: false,
        details: error.details,
        remediation: "Use list_environments tool to see all available environments and their IDs. Verify the environment ID is correct and the environment exists."
      };
    }
    if (error instanceof AppError) {
      return {
        type: "error",
        kind: error.code.toLowerCase(),
        message: error.message,
        retryable: error.retryable,
        details: error.details,
        remediation: getRemediation2(error)
      };
    }
    throw error;
  }
}
__name(executeGetEnvironment, "executeGetEnvironment");
function getRemediation2(error) {
  switch (error.code) {
    case "AUTH_ERROR":
      return "Verify DEMO_PORTAL_TOKEN environment variable is set with a valid API token.";
    case "NETWORK_ERROR":
      return "Check network connection and Demo Portal API availability. Retry after a brief delay.";
    case "VALIDATION_ERROR":
      return "Ensure environmentId parameter is provided and is a valid non-empty string.";
    default:
      return "Review error details and try again. Contact support if issue persists.";
  }
}
__name(getRemediation2, "getRemediation");

// src/tools/startEnvironment.ts
var StartEnvironmentInputSchema = external_exports.object({
  environmentId: external_exports.string().min(1, "Environment ID is required").describe(
    "The unique identifier of the environment to start. Use list_environments to find valid IDs."
  ),
  wait: external_exports.enum(["none", "untilRunning"]).optional().default("none").describe(
    'Wait behavior: "none" (return immediately after issuing command) or "untilRunning" (wait until environment is fully running). Default: "none"'
  )
});
var startEnvironmentTool = {
  name: "start_environment",
  description: `Start a stopped Business Central environment.

This tool initiates the startup process for an environment. Environments typically take 2-5 minutes to fully start.

Parameters:
- environmentId (required): The unique environment identifier
  Example: "env-abc123"
  Get valid IDs using list_environments

- wait (optional): Wait behavior after issuing start command
  - "none" (default): Return immediately after issuing command
    * Use this for non-blocking operations
    * Check status later with get_environment
    * Faster response, but environment may not be ready yet

  - "untilRunning": Wait until environment is fully running
    * Polls status every 2-30 seconds (exponential backoff)
    * Returns when status becomes "Running"
    * Timeout after 5 minutes
    * Use when you need the environment ready immediately

Idempotency:
This tool is fully idempotent - safe to call multiple times:
- If environment is already "Running": Returns no-op status, no action taken
- If environment is "Starting": Returns accepted status (already in progress)
- If environment is "Stopping": Returns conflict error (wait for stop to complete)

Response Types:
1. no_op: Environment already running, no action needed
2. accepted: Start command issued, environment is starting
3. completed: Environment successfully started (only with wait="untilRunning")
4. conflict_in_progress: Environment is stopping, cannot start yet

Example Responses:

Immediate Return (wait="none"):
{
  "type": "start_environment_result",
  "environmentId": "env-abc123",
  "previousStatus": "Stopped",
  "newStatus": "Starting",
  "status": "accepted",
  "message": "Environment is starting. This may take several minutes.",
  "transition": {
    "requested": "start",
    "from": "Stopped",
    "to": "Running",
    "intermediate": "Starting"
  },
  "fetchedAt": "2024-01-15T10:30:00Z"
}

Already Running (idempotent):
{
  "type": "start_environment_result",
  "environmentId": "env-abc123",
  "previousStatus": "Running",
  "newStatus": "Running",
  "status": "no_op",
  "message": "Environment already running; no action taken.",
  "fetchedAt": "2024-01-15T10:30:00Z"
}

Conflict (environment stopping):
{
  "type": "start_environment_result",
  "environmentId": "env-abc123",
  "previousStatus": "Stopping",
  "newStatus": "Stopping",
  "status": "conflict_in_progress",
  "message": "Environment is stopping. Wait for it to complete before starting.",
  "fetchedAt": "2024-01-15T10:30:00Z"
}

Wait Until Running (wait="untilRunning"):
{
  "type": "start_environment_result",
  "environmentId": "env-abc123",
  "previousStatus": "various",
  "newStatus": "Running",
  "status": "completed",
  "message": "Environment successfully transitioned to Running",
  "elapsedMs": 145000,
  "fetchedAt": "2024-01-15T10:32:25Z"
}

Error Handling:
- NOT_FOUND: Environment ID doesn't exist - use list_environments
- TIMEOUT_ERROR: Environment didn't start within 5 minutes (only with wait="untilRunning")
- AUTH_ERROR: Invalid or expired API token
- NETWORK_ERROR: Connection issues - retry after brief delay

Best Practices:
1. Check status first with get_environment to avoid unnecessary calls
2. Use wait="none" for better performance, poll status separately if needed
3. Use wait="untilRunning" when you need the environment ready immediately
4. Handle conflict_in_progress by waiting for stop to complete
5. Always check for no_op to detect already-running environments

Performance:
- wait="none": Returns in 200-400ms
- wait="untilRunning": 2-5 minutes (typical startup time)`,
  inputSchema: {
    type: "object",
    properties: {
      environmentId: {
        type: "string",
        description: "The unique identifier of the environment to start. Use list_environments to find valid IDs."
      },
      wait: {
        type: "string",
        enum: ["none", "untilRunning"],
        description: 'Wait behavior: "none" (return immediately) or "untilRunning" (wait until fully running). Default: "none"',
        default: "none"
      }
    },
    required: ["environmentId"]
  }
};
async function executeStartEnvironment(environmentService, input) {
  try {
    const validated = StartEnvironmentInputSchema.parse(input);
    const result = await environmentService.startEnvironment(
      validated.environmentId,
      { wait: validated.wait }
    );
    return result;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        type: "error",
        kind: "not_found",
        message: error.message,
        retryable: false,
        details: error.details,
        remediation: "Use list_environments tool to see all available environments and their IDs."
      };
    }
    if (error instanceof TimeoutError) {
      return {
        type: "error",
        kind: "timeout_error",
        message: error.message,
        retryable: true,
        details: error.details,
        remediation: "Environment startup is taking longer than expected. Use get_environment to check current status. The environment may still be starting."
      };
    }
    if (error instanceof AppError) {
      return {
        type: "error",
        kind: error.code.toLowerCase(),
        message: error.message,
        retryable: error.retryable,
        details: error.details,
        remediation: getRemediation3(error)
      };
    }
    throw error;
  }
}
__name(executeStartEnvironment, "executeStartEnvironment");
function getRemediation3(error) {
  switch (error.code) {
    case "AUTH_ERROR":
      return "Verify DEMO_PORTAL_TOKEN environment variable is set with a valid API token.";
    case "NETWORK_ERROR":
      return "Check network connection and Demo Portal API availability. Retry after a brief delay.";
    case "VALIDATION_ERROR":
      return 'Ensure environmentId is provided and wait parameter (if specified) is either "none" or "untilRunning".';
    default:
      return "Review error details and try again. Check environment status with get_environment.";
  }
}
__name(getRemediation3, "getRemediation");

// src/tools/stopEnvironment.ts
var StopEnvironmentInputSchema = external_exports.object({
  environmentId: external_exports.string().min(1, "Environment ID is required").describe(
    "The unique identifier of the environment to stop. Use list_environments to find valid IDs."
  ),
  wait: external_exports.enum(["none", "untilStopped"]).optional().default("none").describe(
    'Wait behavior: "none" (return immediately after issuing command) or "untilStopped" (wait until environment is fully stopped). Default: "none"'
  )
});
var stopEnvironmentTool = {
  name: "stop_environment",
  description: `Stop a running Business Central environment.

This tool initiates the shutdown process for an environment. Environments typically take 30-90 seconds to fully stop.

Parameters:
- environmentId (required): The unique environment identifier
  Example: "env-abc123"
  Get valid IDs using list_environments

- wait (optional): Wait behavior after issuing stop command
  - "none" (default): Return immediately after issuing command
    * Use this for non-blocking operations
    * Check status later with get_environment
    * Faster response, but environment may not be stopped yet

  - "untilStopped": Wait until environment is fully stopped
    * Polls status every 2-30 seconds (exponential backoff)
    * Returns when status becomes "Stopped"
    * Timeout after 5 minutes
    * Use when you need to ensure environment is stopped

Idempotency:
This tool is fully idempotent - safe to call multiple times:
- If environment is already "Stopped": Returns no-op status, no action taken
- If environment is "Stopping": Returns accepted status (already in progress)

Response Types:
1. no_op: Environment already stopped, no action needed
2. accepted: Stop command issued, environment is stopping
3. completed: Environment successfully stopped (only with wait="untilStopped")

Example Responses:

Immediate Return (wait="none"):
{
  "type": "stop_environment_result",
  "environmentId": "env-abc123",
  "previousStatus": "Running",
  "newStatus": "Stopping",
  "status": "accepted",
  "message": "Environment is stopping.",
  "transition": {
    "requested": "stop",
    "from": "Running",
    "to": "Stopped",
    "intermediate": "Stopping"
  },
  "fetchedAt": "2024-01-15T10:30:00Z"
}

Already Stopped (idempotent):
{
  "type": "stop_environment_result",
  "environmentId": "env-abc123",
  "previousStatus": "Stopped",
  "newStatus": "Stopped",
  "status": "no_op",
  "message": "Environment already stopped; no action taken.",
  "fetchedAt": "2024-01-15T10:30:00Z"
}

Wait Until Stopped (wait="untilStopped"):
{
  "type": "stop_environment_result",
  "environmentId": "env-abc123",
  "previousStatus": "various",
  "newStatus": "Stopped",
  "status": "completed",
  "message": "Environment successfully transitioned to Stopped",
  "elapsedMs": 45000,
  "fetchedAt": "2024-01-15T10:30:45Z"
}

Error Handling:
- NOT_FOUND: Environment ID doesn't exist - use list_environments
- TIMEOUT_ERROR: Environment didn't stop within 5 minutes (only with wait="untilStopped")
- AUTH_ERROR: Invalid or expired API token
- NETWORK_ERROR: Connection issues - retry after brief delay

Best Practices:
1. Check status first with get_environment to avoid unnecessary calls
2. Use wait="none" for better performance, poll status separately if needed
3. Use wait="untilStopped" when you need to ensure environment is stopped
4. Always check for no_op to detect already-stopped environments
5. Stop environments when not in use to save resources

Use Cases:
- Stop environments after testing to save resources
- Prepare environment for configuration changes that require stopped state
- Stop environments before backup or maintenance operations
- Clean up after development work is complete
- Reduce costs by stopping unused environments

Performance:
- wait="none": Returns in 200-400ms
- wait="untilStopped": 30-90 seconds (typical shutdown time)`,
  inputSchema: {
    type: "object",
    properties: {
      environmentId: {
        type: "string",
        description: "The unique identifier of the environment to stop. Use list_environments to find valid IDs."
      },
      wait: {
        type: "string",
        enum: ["none", "untilStopped"],
        description: 'Wait behavior: "none" (return immediately) or "untilStopped" (wait until fully stopped). Default: "none"',
        default: "none"
      }
    },
    required: ["environmentId"]
  }
};
async function executeStopEnvironment(environmentService, input) {
  try {
    const validated = StopEnvironmentInputSchema.parse(input);
    const result = await environmentService.stopEnvironment(
      validated.environmentId,
      { wait: validated.wait }
    );
    return result;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        type: "error",
        kind: "not_found",
        message: error.message,
        retryable: false,
        details: error.details,
        remediation: "Use list_environments tool to see all available environments and their IDs."
      };
    }
    if (error instanceof TimeoutError) {
      return {
        type: "error",
        kind: "timeout_error",
        message: error.message,
        retryable: true,
        details: error.details,
        remediation: "Environment shutdown is taking longer than expected. Use get_environment to check current status. The environment may still be stopping."
      };
    }
    if (error instanceof AppError) {
      return {
        type: "error",
        kind: error.code.toLowerCase(),
        message: error.message,
        retryable: error.retryable,
        details: error.details,
        remediation: getRemediation4(error)
      };
    }
    throw error;
  }
}
__name(executeStopEnvironment, "executeStopEnvironment");
function getRemediation4(error) {
  switch (error.code) {
    case "AUTH_ERROR":
      return "Verify DEMO_PORTAL_TOKEN environment variable is set with a valid API token.";
    case "NETWORK_ERROR":
      return "Check network connection and Demo Portal API availability. Retry after a brief delay.";
    case "VALIDATION_ERROR":
      return 'Ensure environmentId is provided and wait parameter (if specified) is either "none" or "untilStopped".';
    default:
      return "Review error details and try again. Check environment status with get_environment.";
  }
}
__name(getRemediation4, "getRemediation");

// src/tools/runTests.ts
var RunTestsInputSchema = external_exports.object({
  environmentId: external_exports.string().min(1, "environmentId is required").describe("The ID of the environment to run tests on"),
  codeunitId: external_exports.number().int().positive().optional().describe("Optional codeunit ID to filter tests (e.g., 50100)"),
  testMethod: external_exports.string().optional().describe('Optional test method name to run specific test (e.g., "TestCreateCustomer")'),
  includeCoverage: external_exports.boolean().optional().default(false).describe(
    "Whether to collect code coverage data (default: false). Note: Increases execution time."
  ),
  timeoutSeconds: external_exports.number().int().min(10, "Timeout must be at least 10 seconds").max(3600, "Timeout cannot exceed 3600 seconds (1 hour)").optional().default(600).describe("Maximum time to wait for test completion in seconds (default: 600 = 10 minutes)"),
  workspacePath: external_exports.string().optional().describe("Optional workspace path for test discovery/validation. If provided, will validate tests exist before running.")
}).strict();
var runTestsToolDefinition = {
  name: "run_tests",
  description: `Execute automated AL tests on a Business Central environment.

**Purpose:**
Run automated tests on a Business Central environment via Demo Portal API. Tests are executed asynchronously - the tool submits the test job, polls for completion, and returns results with pass/fail details and optional code coverage.

**When to Use:**
- Execute all tests in an environment (no filters)
- Run tests from a specific test codeunit (codeunitId filter)
- Run a single test method (codeunitId + testMethod filters)
- Collect code coverage metrics (includeCoverage: true)
- Verify app functionality after deployment
- Validate changes during development

**Parameters:**
- environmentId (required): Environment ID from list_environments
- codeunitId (optional): Filter to specific test codeunit (e.g., 50100)
- testMethod (optional): Run single test method (requires codeunitId)
- includeCoverage (optional): Collect code coverage data (default: false)
- timeoutSeconds (optional): Max wait time in seconds (default: 600)

**Response Format:**
Returns structured JSON with:
- job: Job metadata (jobId, timing, duration)
- summary: Test totals (total, passed, failed, skipped, duration)
- failures: Array of test failures with details (only if failed > 0)
- coverage: Code coverage summary and per-object breakdown (if includeCoverage: true)

**Examples:**

Example 1: Run all tests
\`\`\`json
{
  "environmentId": "abc-123"
}
\`\`\`

Example 2: Run specific test codeunit
\`\`\`json
{
  "environmentId": "abc-123",
  "codeunitId": 50100
}
\`\`\`

Example 3: Run single test with coverage
\`\`\`json
{
  "environmentId": "abc-123",
  "codeunitId": 50100,
  "testMethod": "TestCreateCustomer",
  "includeCoverage": true
}
\`\`\`

Example 4: Run with extended timeout
\`\`\`json
{
  "environmentId": "abc-123",
  "timeoutSeconds": 1200
}
\`\`\`

**Response Example (Success):**
\`\`\`json
{
  "type": "run_tests_result",
  "environmentId": "abc-123",
  "job": {
    "jobId": "12345",
    "submittedAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:32:15Z",
    "elapsedMs": 135000
  },
  "summary": {
    "total": 25,
    "passed": 23,
    "failed": 2,
    "skipped": 0,
    "durationSec": 120.5
  },
  "failures": [
    {
      "suite": "Customer Management Tests",
      "test": "TestCreateCustomer",
      "message": "Expected: 1, Actual: 0",
      "details": "Customer was not created...",
      "timeSec": 1.2
    }
  ]
}
\`\`\`

**Error Handling:**

- NOT_FOUND: Environment doesn't exist \u2192 Use list_environments to find valid IDs
- TIMEOUT_ERROR: Tests exceeded timeout \u2192 Increase timeoutSeconds or check environment status
- NETWORK_ERROR: API connection failed \u2192 Retry after brief delay
- AUTH_ERROR: Invalid credentials \u2192 Verify DEMO_PORTAL_TOKEN

**Performance Notes:**
- Typical test suite: 2-5 minutes
- With coverage: +30-50% execution time
- Polling starts at 2s, backs off to max 30s
- Use timeoutSeconds appropriately for large test suites

**Best Practices:**
1. Start without coverage for faster feedback
2. Use filters (codeunitId/testMethod) during development
3. Run full test suite before deployment
4. Set longer timeout for comprehensive test suites
5. Check environment is 'Running' before executing tests
6. Parse failures array for debugging information`,
  inputSchema: {
    type: "object",
    properties: {
      environmentId: {
        type: "string",
        description: "The ID of the environment to run tests on"
      },
      codeunitId: {
        type: "number",
        description: "Optional codeunit ID to filter tests (e.g., 50100)"
      },
      testMethod: {
        type: "string",
        description: 'Optional test method name to run specific test (e.g., "TestCreateCustomer")'
      },
      includeCoverage: {
        type: "boolean",
        description: "Whether to collect code coverage data (default: false). Note: Increases execution time."
      },
      timeoutSeconds: {
        type: "number",
        description: "Maximum time to wait for test completion in seconds (default: 600 = 10 minutes)"
      },
      workspacePath: {
        type: "string",
        description: "Optional workspace path for test discovery/validation. If provided, will validate tests exist before running."
      }
    },
    required: ["environmentId"]
  }
};
async function executeRunTests(testRunnerService, input) {
  try {
    const validated = RunTestsInputSchema.parse(input);
    const result = await testRunnerService.runTests({
      environmentId: validated.environmentId,
      codeunitId: validated.codeunitId,
      testMethod: validated.testMethod,
      includeCoverage: validated.includeCoverage,
      timeoutSeconds: validated.timeoutSeconds,
      workspacePath: validated.workspacePath
    });
    return result;
  } catch (error) {
    if (error instanceof AppError) {
      return {
        type: "error",
        kind: error.code.toLowerCase(),
        message: error.message,
        retryable: error.retryable,
        details: error.details,
        remediation: getRemediation5(error)
      };
    }
    throw error;
  }
}
__name(executeRunTests, "executeRunTests");
function getRemediation5(error) {
  if (error instanceof NotFoundError) {
    return "Environment not found. Use list_environments to see available environments.";
  }
  if (error instanceof TimeoutError) {
    return "Test execution timed out. Possible solutions:\n1. Increase timeoutSeconds parameter\n2. Check environment status with get_environment\n3. Verify environment is running and not overloaded\n4. Try running smaller test subset with codeunitId filter";
  }
  switch (error.code) {
    case "AUTH_ERROR":
      return "Verify DEMO_PORTAL_TOKEN is valid and has necessary permissions.";
    case "RATE_LIMIT":
      return `Wait ${error.retryAfter ?? 60} seconds before retrying.`;
    case "NETWORK_ERROR":
      return "Check network connection and API availability. Retry after brief delay.";
    case "VALIDATION_ERROR":
      return "Check input parameters match schema requirements.";
    default:
      return "Check error details and try again.";
  }
}
__name(getRemediation5, "getRemediation");

// src/tools/compileAndPublish.ts
var CompileAndPublishInputSchema = external_exports.object({
  workspacePath: external_exports.string().min(1, "workspacePath is required").describe("Absolute path to AL project workspace containing app.json"),
  environmentId: external_exports.string().min(1, "environmentId is required").describe("Environment ID to publish to (from list_environments)"),
  packageCachePath: external_exports.string().optional().describe("Optional path to AL package cache directory (default: workspacePath/.alpackages)"),
  rulesetPath: external_exports.string().optional().describe("Optional path to .ruleset.json file (default: workspacePath/.ruleset.json)"),
  schemaUpdateMode: external_exports.enum(["synchronize", "recreate", "forcesync"]).optional().default("synchronize").describe(
    "Schema update mode: synchronize (default) = safe update, recreate = drop+recreate tables, forcesync = force synchronization"
  ),
  dependencyPublishingOption: external_exports.enum(["default", "strict", "ignore"]).optional().describe(
    "Dependency publishing option: default = standard handling, strict = enforce all dependencies, ignore = skip missing dependencies"
  )
}).strict();
var compileAndPublishToolDefinition = {
  name: "compile_and_publish",
  description: `Compile AL code and publish to Business Central environment.

**Purpose:**
Orchestrates the complete workflow for deploying AL apps:
1. Verify AL CLI tools installed (dotnet tool)
2. Compile AL project using 'al compile' command
3. Get environment details from Demo Portal
4. Publish .app file to BC Developer Endpoint

**When to Use:**
- Deploy new AL app to environment
- Update existing AL app after code changes
- Test app changes on specific environment
- Automated deployment workflows

**Prerequisites:**
- AL CLI tools installed: \`dotnet tool install -g Microsoft.Dynamics.BusinessCentral.Development.Tools\`
- Valid AL project with app.json
- Environment must be Running (use start_environment first)
- NavUserPassword user exists for environment (created via Demo Portal)
- Windows OS (AL compilation requires Windows)

**Parameters:**
- workspacePath (required): Absolute path to AL project root (contains app.json)
- environmentId (required): Target environment ID from list_environments
- packageCachePath (optional): AL dependencies location (default: workspacePath/.alpackages)
- rulesetPath (optional): Code analysis rules (default: workspacePath/.ruleset.json)
- schemaUpdateMode (optional): How to update database schema
  - synchronize (default): Safe incremental update
  - recreate: Drop and recreate tables (data loss!)
  - forcesync: Force synchronization on conflicts

**Response Format:**
Returns structured JSON with:
- compile: Compilation results (success, app details, diagnostics, output)
- publish: Publishing results (success, status, schema mode, user)

**Examples:**

Example 1: Basic compile and publish
\`\`\`json
{
  "workspacePath": "C:/Projects/MyALApp",
  "environmentId": "abc-123"
}
\`\`\`

Example 2: With custom package cache
\`\`\`json
{
  "workspacePath": "C:/Projects/MyALApp",
  "environmentId": "abc-123",
  "packageCachePath": "C:/ALPackages"
}
\`\`\`

Example 3: Force schema sync (resolve conflicts)
\`\`\`json
{
  "workspacePath": "C:/Projects/MyALApp",
  "environmentId": "abc-123",
  "schemaUpdateMode": "forcesync"
}
\`\`\`

Example 4: With custom ruleset
\`\`\`json
{
  "workspacePath": "C:/Projects/MyALApp",
  "environmentId": "abc-123",
  "rulesetPath": "C:/Projects/MyALApp/custom.ruleset.json"
}
\`\`\`

**Response Example (Success):**
\`\`\`json
{
  "type": "compile_and_publish_result",
  "compile": {
    "success": true,
    "appPath": "C:/Projects/MyALApp/build/Publisher_MyApp_1.0.0.0.app",
    "appSize": 245760,
    "app": {
      "id": "12345678-1234-1234-1234-123456789012",
      "name": "MyApp",
      "publisher": "Publisher",
      "version": "1.0.0.0"
    },
    "diagnostics": [
      {
        "file": "HelloWorld.al",
        "line": 10,
        "column": 5,
        "severity": "warning",
        "code": "AL0432",
        "message": "Variable 'x' is declared but never used"
      }
    ],
    "compilerOutput": "..."
  },
  "publish": {
    "success": true,
    "status": "completed",
    "schemaUpdateMode": "synchronize",
    "user": "BCUser123"
  },
  "fetchedAt": "2024-01-15T10:30:00Z"
}
\`\`\`

**Error Handling:**

- VALIDATION_ERROR: AL tools not installed \u2192 Install: \`dotnet tool install -g Microsoft.Dynamics.BusinessCentral.Development.Tools\`
- COMPILE_ERROR: Compilation failed \u2192 Check diagnostics array for errors
- NOT_FOUND: Environment doesn't exist \u2192 Use list_environments
- NO_USERS: No BC users for environment \u2192 Create user via Demo Portal
- AUTH_ERROR: Publishing authentication failed \u2192 Verify user permissions
- CONFLICT_ERROR: Schema conflict (409) \u2192 Retry with schemaUpdateMode="forcesync"
- NETWORK_ERROR: Connection failed \u2192 Verify environment is Running, check network

**Performance Notes:**
- Compilation: 10-60 seconds depending on project size
- Publishing: 5-30 seconds depending on app size and network
- Total: Typically 15-90 seconds end-to-end
- Large projects (100+ objects): May take 2-3 minutes

**Best Practices:**
1. Ensure environment is Running before compile/publish
2. Start with schemaUpdateMode="synchronize" (safest)
3. Use "forcesync" only for development/test environments
4. Never use "recreate" on environments with data (causes data loss)
5. Check diagnostics even on successful compilation (warnings)
6. Verify .alpackages directory has all dependencies
7. Keep AL CLI tools updated: \`dotnet tool update -g Microsoft.Dynamics.BusinessCentral.Development.Tools\`
8. Windows OS required - use Windows container if on Linux/Mac

**Troubleshooting:**

Compilation Errors:
- "AL tools not installed" \u2192 Install dotnet tools
- "Could not determine AL CLI tools version" \u2192 Verify installation
- "app.json not found" \u2192 Check workspacePath is correct
- Dependency errors \u2192 Verify .alpackages has required symbols

Publishing Errors:
- "No users found" \u2192 Create NavUserPassword user via Portal
- "Invalid credentials" \u2192 User may lack permissions
- Schema conflicts \u2192 Use forcesync or recreate
- "Environment not found" \u2192 Verify environmentId
- Connection timeout \u2192 Ensure environment Running`,
  inputSchema: {
    type: "object",
    properties: {
      workspacePath: {
        type: "string",
        description: "Absolute path to AL project workspace containing app.json"
      },
      environmentId: {
        type: "string",
        description: "Environment ID to publish to (from list_environments)"
      },
      packageCachePath: {
        type: "string",
        description: "Optional path to AL package cache directory (default: workspacePath/.alpackages)"
      },
      rulesetPath: {
        type: "string",
        description: "Optional path to .ruleset.json file (default: workspacePath/.ruleset.json)"
      },
      schemaUpdateMode: {
        type: "string",
        enum: ["synchronize", "recreate", "forcesync"],
        description: "Schema update mode: synchronize (default) = safe update, recreate = drop+recreate tables, forcesync = force synchronization"
      },
      dependencyPublishingOption: {
        type: "string",
        enum: ["default", "strict", "ignore"],
        description: "Dependency publishing option: default = standard handling, strict = enforce all dependencies, ignore = skip missing dependencies"
      }
    },
    required: ["workspacePath", "environmentId"]
  }
};
async function executeCompileAndPublish(compilationService, input) {
  try {
    console.error("[compile_and_publish] Received input type:", typeof input);
    console.error("[compile_and_publish] Received input:", JSON.stringify(input, null, 2));
    const validated = CompileAndPublishInputSchema.parse(input);
    const result = await compilationService.compileAndPublish({
      workspacePath: validated.workspacePath,
      environmentId: validated.environmentId,
      packageCachePath: validated.packageCachePath,
      rulesetPath: validated.rulesetPath,
      schemaUpdateMode: validated.schemaUpdateMode,
      dependencyPublishingOption: validated.dependencyPublishingOption
    });
    return result;
  } catch (error) {
    if (error instanceof external_exports.ZodError) {
      const inputKeys = input && typeof input === "object" ? Object.keys(input) : [];
      console.error("[compile_and_publish] Validation failed. Received keys:", inputKeys);
      console.error("[compile_and_publish] Validation errors:", JSON.stringify(error.errors, null, 2));
      return {
        type: "error",
        kind: "validation_error",
        message: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
        retryable: false,
        details: {
          validationErrors: error.errors,
          receivedInputType: typeof input,
          receivedInputKeys: inputKeys.length > 0 ? inputKeys : "not an object or empty",
          receivedInput: input
        },
        remediation: "Check that all required parameters are provided. Required: workspacePath, environmentId. The tool received: " + (inputKeys.length > 0 ? inputKeys.join(", ") : typeof input)
      };
    }
    if (error instanceof AppError) {
      return {
        type: "error",
        kind: error.code.toLowerCase(),
        message: error.message,
        retryable: error.retryable,
        details: error.details,
        remediation: getRemediation6(error)
      };
    }
    throw error;
  }
}
__name(executeCompileAndPublish, "executeCompileAndPublish");
function getRemediation6(error) {
  if (error instanceof ValidationError) {
    if (error.message.includes("AL CLI tools not installed")) {
      return "Install AL CLI tools: dotnet tool install -g Microsoft.Dynamics.BusinessCentral.Development.Tools";
    }
    if (error.message.includes("Windows")) {
      return "AL compilation requires Windows OS. Use a Windows machine or Windows container.";
    }
    return "Check input parameters and project configuration. Verify app.json exists.";
  }
  if (error instanceof CompileError) {
    return "Compilation failed. Check diagnostics for specific errors:\n1. Review error messages in diagnostics array\n2. Fix code errors in indicated files\n3. Verify all dependencies in .alpackages\n4. Check ruleset configuration if using custom rules";
  }
  if (error instanceof AuthError) {
    if (error.details?.code === "NO_USERS") {
      return "Create a NavUserPassword user for this environment via Demo Portal web interface.";
    }
    return "Verify BC user exists and has permissions. Check environment authentication settings.";
  }
  if (error instanceof ConflictError) {
    return 'Schema conflict detected. Options:\n1. Use schemaUpdateMode="forcesync" to force synchronization\n2. Use schemaUpdateMode="recreate" for clean slate (CAUTION: Data loss!)\n3. Manually resolve schema conflicts in BC client';
  }
  switch (error.code) {
    case "NOT_FOUND":
      return "Environment not found. Use list_environments to see available environments.";
    case "RATE_LIMIT":
      return `Wait ${error.retryAfter ?? 60} seconds before retrying.`;
    case "NETWORK_ERROR":
      return "Check network connection and environment status:\n1. Verify environment is Running (use get_environment)\n2. Check network connectivity\n3. Verify environment URL is accessible";
    default:
      return "Check error details and try again. Consult BC documentation for specific error codes.";
  }
}
__name(getRemediation6, "getRemediation");

// src/tools/diagnosePublish.ts
var DiagnosePublishInputSchema = external_exports.object({
  workspacePath: external_exports.string().min(1, "workspacePath is required").describe("Absolute path to AL project workspace containing app.json"),
  environmentId: external_exports.string().min(1, "environmentId is required").describe("Environment ID to diagnose publishing for (from list_environments)")
}).strict();
var diagnosePublishToolDefinition = {
  name: "diagnose_publish",
  description: `Diagnose publishing configuration and connectivity without actually publishing.

**Purpose:**
Debug publishing failures by showing:
- Constructed Developer Endpoint URL
- Credentials (password redacted)
- Connectivity test results
- Environment configuration
- PowerShell script location

**When to Use:**
- Publishing fails with unclear errors
- Verifying URL construction is correct
- Testing connectivity to Developer Endpoint
- Debugging authentication issues
- Before first publish to new environment

**Parameters:**
- workspacePath (required): Absolute path to AL project root (contains app.json)
- environmentId (required): Target environment ID from list_environments

**Response Format:**
Returns structured JSON with:
- environment: ID, URL, authentication method
- credentials: username and redacted password
- url: Constructed URL, tenant, schema mode
- connectivity: Whether endpoint is reachable
- powershellScript: Script path and existence check

**Example:**
\`\`\`json
{
  "workspacePath": "C:/Projects/MyALApp",
  "environmentId": "d590df57-680e-43c0-9af0-3f97706d4663"
}
\`\`\`

**Response Example:**
\`\`\`json
{
  "type": "publish_diagnostics",
  "environment": {
    "id": "d590df57-680e-43c0-9af0-3f97706d4663",
    "url": "https://bcserver/BC/",
    "authMethod": "NavUserPassword"
  },
  "credentials": {
    "username": "BCUser123",
    "passwordRedacted": "Pa**********rd"
  },
  "url": {
    "constructed": "https://bcserver/d590df57-680e-43c0-9af0-3f97706d4663/dev/apps?tenant=default&SchemaUpdateMode=synchronize",
    "tenant": "default",
    "schemaUpdateMode": "synchronize"
  },
  "connectivity": {
    "reachable": true,
    "statusCode": 200
  },
  "powershellScript": {
    "path": "C:/path/to/scripts/Publish-BCApp.ps1",
    "exists": true
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

**Troubleshooting:**

If connectivity.reachable is false:
- Check environment URL is correct
- Verify environment is Running
- Check network connectivity

If credentials show wrong username:
- Verify NavUserPassword user exists
- Check user permissions in BC

If URL looks wrong:
- Compare with expected pattern: {scheme}://{host}/{environmentId}/dev/apps?tenant={tenant}&SchemaUpdateMode={mode}
- Verify environmentId is correct`,
  inputSchema: {
    type: "object",
    properties: {
      workspacePath: {
        type: "string",
        description: "Absolute path to AL project workspace containing app.json"
      },
      environmentId: {
        type: "string",
        description: "Environment ID to diagnose publishing for (from list_environments)"
      }
    },
    required: ["workspacePath", "environmentId"]
  }
};
async function executeDiagnosePublish(compilationService, input) {
  try {
    const validated = DiagnosePublishInputSchema.parse(input);
    const result = await compilationService.diagnosePublish({
      workspacePath: validated.workspacePath,
      environmentId: validated.environmentId
    });
    return result;
  } catch (error) {
    if (error instanceof external_exports.ZodError) {
      return {
        type: "error",
        kind: "validation_error",
        message: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
        retryable: false,
        details: {
          validationErrors: error.errors
        }
      };
    }
    if (error instanceof AppError) {
      return {
        type: "error",
        kind: error.code.toLowerCase(),
        message: error.message,
        retryable: error.retryable,
        details: error.details
      };
    }
    throw error;
  }
}
__name(executeDiagnosePublish, "executeDiagnosePublish");

// src/tools/diagnoseTests.ts
var DiagnoseTestsInputSchema = external_exports.object({
  environmentId: external_exports.string().describe("The ID of the environment to diagnose"),
  codeunitId: external_exports.number().optional().describe("Optional codeunit ID to test filtering"),
  workspacePath: external_exports.string().optional().describe("Optional workspace path for source file comparison"),
  verbose: external_exports.boolean().optional().default(true).describe("Include detailed API request/response logs")
});
var DiagnoseTestsTool = class {
  constructor(testRunnerService, testRegistry) {
    this.testRunnerService = testRunnerService;
    this.testRegistry = testRegistry;
  }
  static {
    __name(this, "DiagnoseTestsTool");
  }
  /**
   * Execute the diagnostic
   */
  async execute(input) {
    const params = DiagnoseTestsInputSchema.parse(input);
    try {
      if (params.verbose) {
        process.env.LOG_LEVEL = "debug";
      }
      const diagnosticResults = await this.testRunnerService.runTestDiagnostics(
        params.environmentId,
        params.codeunitId
      );
      let sourceComparison = void 0;
      if (params.workspacePath && this.testRegistry) {
        sourceComparison = await this.compareSourceWithEnvironment(
          params.workspacePath,
          diagnosticResults,
          params.codeunitId
        );
      }
      const formatted = {
        type: "diagnose_tests_result",
        environmentId: params.environmentId,
        diagnostics: {
          testsWithoutFilter: {
            found: diagnosticResults.withoutFilter.summary.total,
            passed: diagnosticResults.withoutFilter.summary.passed,
            failed: diagnosticResults.withoutFilter.summary.failed,
            message: diagnosticResults.withoutFilter.summary.total > 0 ? `Found ${diagnosticResults.withoutFilter.summary.total} tests when running without filter` : "NO TESTS FOUND in environment. This confirms the test app is NOT published. Action required: Run compile_and_publish to publish your test app."
          },
          testsWithFilter: params.codeunitId ? {
            codeunitId: params.codeunitId,
            found: diagnosticResults.withFilter?.summary.total ?? 0,
            message: diagnosticResults.withFilter?.summary.total ?? 0 > 0 ? `Found ${diagnosticResults.withFilter?.summary.total} tests for codeunit ${params.codeunitId}` : `No tests found for codeunit ${params.codeunitId}. Either the codeunit doesn't exist in the published app, it's not a test codeunit (missing Subtype = Test), or the API filtering is not working correctly.`
          } : void 0,
          analysis: diagnosticResults.analysis,
          recommendations: diagnosticResults.analysis.recommendations,
          sourceComparison
        },
        troubleshooting: {
          steps: [
            "1. Use check_test_app_status tool to verify compilation and publication status",
            "2. If app not published, run compile_and_publish to publish test app",
            "3. Check logs above for exact API parameters being sent",
            "4. Verify codeunit ID is correct and exists in the published app",
            "5. Ensure test codeunit has Subtype = Test and methods have [Test] attribute",
            "6. Confirm environment is in Running state before testing"
          ],
          nextActions: this.getNextActions(diagnosticResults)
        }
      };
      return formatted;
    } catch (error) {
      return {
        type: "error",
        kind: "diagnostic_error",
        message: error instanceof Error ? error.message : String(error),
        remediation: "Check environment status and ensure it is running"
      };
    }
  }
  getNextActions(diagnosticResults) {
    const actions = [];
    if (diagnosticResults.analysis.totalTestsAvailable === 0) {
      actions.push("Use compile_and_publish tool to deploy your test app");
      actions.push("Verify test runner codeunit is installed in the environment");
    } else if (diagnosticResults.withFilter?.summary.total === 0) {
      actions.push("Try running with TEST_MINIMAL_PARAMS=true environment variable");
      actions.push("Check the XML response to see which codeunits are actually available");
      actions.push("Consider running tests without filter and parsing results client-side");
    } else {
      actions.push("Tests are working correctly!");
    }
    return actions;
  }
  /**
   * Compare tests found in source files with tests in environment
   */
  async compareSourceWithEnvironment(workspacePath, diagnosticResults, codeunitId) {
    if (!this.testRegistry) {
      return null;
    }
    const sourceTests = await this.testRegistry.getTestCodeunits(workspacePath);
    const sourceCodeunitIds = sourceTests.map((tc) => tc.file.object.id);
    const environmentTests = diagnosticResults.withoutFilter.summary.total;
    const comparison = {
      summary: {
        inSource: sourceTests.length,
        inEnvironment: environmentTests > 0 ? "Tests found" : "No tests found",
        sourceCodeunitIds,
        totalSourceTests: sourceTests.reduce((sum, tc) => sum + tc.testMethods.length, 0)
      }
    };
    if (codeunitId) {
      const sourceCodeunit = sourceTests.find((tc) => tc.file.object.id === codeunitId);
      if (sourceCodeunit) {
        comparison.specificCodeunit = {
          id: codeunitId,
          name: sourceCodeunit.file.object.name,
          inSource: true,
          sourceTestMethods: sourceCodeunit.testMethods.map((m) => m.name),
          sourceTestCount: sourceCodeunit.testMethods.length,
          inEnvironment: diagnosticResults.withFilter?.summary.total > 0,
          environmentTestCount: diagnosticResults.withFilter?.summary.total || 0
        };
        if (sourceCodeunit.testMethods.length > 0 && diagnosticResults.withFilter?.summary.total === 0) {
          comparison.discrepancy = {
            issue: "Tests exist in source but not found in environment",
            possibleCauses: [
              "1. Test app not published or outdated",
              "2. Compilation errors preventing publication",
              "3. Test codeunit ID mismatch between source and published app",
              "4. API filter parameters not working correctly"
            ],
            recommendedActions: [
              "Run compile_and_publish to ensure latest code is published",
              "Use check_test_app_status to verify publication status",
              "Check compilation output for errors"
            ]
          };
        }
      } else {
        comparison.specificCodeunit = {
          id: codeunitId,
          inSource: false,
          message: `Codeunit ${codeunitId} not found in source files`,
          availableInSource: sourceCodeunitIds
        };
      }
    }
    if (sourceTests.length > 0 && environmentTests === 0) {
      comparison.analysis = {
        status: "critical",
        message: "Test codeunits found in source but NO tests in environment",
        action: "Immediate action required: Run compile_and_publish to publish test app"
      };
    } else if (sourceTests.length === 0 && environmentTests > 0) {
      comparison.analysis = {
        status: "warning",
        message: "Tests found in environment but no test source files in workspace",
        action: "Verify workspace path is correct or tests are in a different location"
      };
    } else if (sourceTests.length > 0 && environmentTests > 0) {
      comparison.analysis = {
        status: "ok",
        message: "Tests found in both source and environment",
        note: "Verify test counts match expectations"
      };
    } else {
      comparison.analysis = {
        status: "info",
        message: "No tests found in source or environment",
        action: "Create test codeunits with Subtype = Test and [Test] attributes"
      };
    }
    return comparison;
  }
};

// src/tools/checkTestAppStatus.ts
import path4 from "path";
import fs3 from "fs/promises";
var CheckTestAppStatusTool = class {
  constructor(demoPortalClient) {
    this.demoPortalClient = demoPortalClient;
  }
  static {
    __name(this, "CheckTestAppStatusTool");
  }
  get name() {
    return "check_test_app_status";
  }
  get description() {
    return "Check the compilation and publication status of a test app";
  }
  get schema() {
    return {
      type: "object",
      properties: {
        workspacePath: {
          type: "string",
          description: "Path to the AL project workspace"
        },
        environmentId: {
          type: "string",
          description: "Optional environment ID to check publication status"
        }
      },
      required: ["workspacePath"]
    };
  }
  async checkCompilationStatus(workspacePath) {
    try {
      const appJsonPath = path4.join(workspacePath, "app.json");
      const appJsonContent = await fs3.readFile(appJsonPath, "utf8");
      const appJson = JSON.parse(appJsonContent);
      const buildPath = path4.join(workspacePath, "build");
      const appFileName = `${appJson.publisher}_${appJson.name}_${appJson.version}.app`.replace(/ /g, "_");
      const appFilePath = path4.join(buildPath, appFileName);
      try {
        const stats = await fs3.stat(appFilePath);
        return {
          appFileExists: true,
          appFilePath,
          appFileSize: stats.size,
          lastModified: stats.mtime.toISOString()
        };
      } catch {
        return {
          appFileExists: false,
          appFilePath
        };
      }
    } catch (error) {
      return {
        appFileExists: false
      };
    }
  }
  async analyzeSourceFiles(workspacePath) {
    const testCodeunits = [];
    let estimatedTestCount = 0;
    try {
      const alFiles = [];
      const scanDirectory = /* @__PURE__ */ __name(async (dir) => {
        const entries = await fs3.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path4.join(dir, entry.name);
          if (entry.isDirectory() && entry.name !== ".alpackages" && entry.name !== "build") {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && entry.name.endsWith(".al")) {
            alFiles.push(fullPath);
          }
        }
      }, "scanDirectory");
      await scanDirectory(workspacePath);
      for (const filePath of alFiles) {
        const content = await fs3.readFile(filePath, "utf8");
        const codeunitMatch = content.match(/codeunit\s+(\d+)\s+"?([^"{\n]+)"?\s*{/i);
        if (codeunitMatch?.[2]) {
          const codeunitId = codeunitMatch[1];
          const codeunitName = codeunitMatch[2];
          const subtypeMatch = content.match(/Subtype\s*=\s*Test/i);
          if (subtypeMatch) {
            testCodeunits.push(`${codeunitId}: ${codeunitName}`);
            const testMethodMatches = content.matchAll(/\[Test\]/gi);
            let methodCount = 0;
            for (const _ of testMethodMatches) {
              methodCount++;
            }
            estimatedTestCount += methodCount;
          }
        }
      }
    } catch (error) {
    }
    return {
      testCodeunitsFound: testCodeunits,
      estimatedTestCount,
      isTestApp: testCodeunits.length > 0
    };
  }
  async checkEnvironmentStatus(environmentId) {
    try {
      const testParams = {};
      const { jobId } = await this.demoPortalClient.createTestJob(
        environmentId,
        testParams
      );
      let attempts = 0;
      const maxAttempts = 10;
      let testsAvailable = 0;
      while (attempts < maxAttempts) {
        await new Promise((resolve2) => setTimeout(resolve2, 2e3));
        try {
          const result = await this.demoPortalClient.getTestResultsXml(
            environmentId,
            jobId
          );
          if (result?.xml) {
            const testCountMatch = result.xml.match(/<testcase/g);
            testsAvailable = testCountMatch ? testCountMatch.length : 0;
            break;
          }
        } catch (pollError) {
        }
        attempts++;
      }
      return {
        testsAvailable,
        testJobSuccessful: true,
        message: testsAvailable > 0 ? `Found ${testsAvailable} test(s) available in the environment` : "No tests found in the environment"
      };
    } catch (error) {
      return {
        testsAvailable: 0,
        testJobSuccessful: false,
        message: `Failed to check environment: ${error instanceof Error ? error.message : "Unknown error"}`
      };
    }
  }
  generateRecommendations(status) {
    const recommendations = [];
    if (!status.compilationStatus.appFileExists) {
      recommendations.push("App file not found - run compile_app to compile the test app");
      recommendations.push(`Expected location: ${status.compilationStatus.appFilePath}`);
    } else {
      recommendations.push(`App file found: ${status.compilationStatus.appFilePath} (${status.compilationStatus.appFileSize} bytes)`);
    }
    if (status.sourceAnalysis.testCodeunitsFound.length === 0) {
      recommendations.push("No test codeunits found in source files");
      recommendations.push("Ensure codeunits have Subtype = Test");
      recommendations.push("Ensure test methods have [Test] attribute");
    } else {
      recommendations.push(`Found ${status.sourceAnalysis.testCodeunitsFound.length} test codeunit(s) with ${status.sourceAnalysis.estimatedTestCount} test method(s)`);
    }
    if (status.environmentStatus) {
      if (status.environmentStatus.testsAvailable === 0) {
        if (status.compilationStatus.appFileExists) {
          recommendations.push("App is compiled but NOT published to the environment");
          recommendations.push("Action: Run compile_and_publish to publish the test app");
        } else {
          recommendations.push("App is neither compiled nor published");
          recommendations.push("Action: Run compile_and_publish to compile and publish the test app");
        }
      } else {
        recommendations.push(`Test app is published - ${status.environmentStatus.testsAvailable} test(s) available`);
        if (status.sourceAnalysis.estimatedTestCount > status.environmentStatus.testsAvailable) {
          recommendations.push("Warning: Source has more tests than environment - may need to republish");
        }
      }
    }
    return recommendations;
  }
  async execute(params) {
    try {
      const compilationStatus = await this.checkCompilationStatus(params.workspacePath);
      const sourceAnalysis = await this.analyzeSourceFiles(params.workspacePath);
      let environmentStatus;
      if (params.environmentId) {
        environmentStatus = await this.checkEnvironmentStatus(params.environmentId);
      }
      const status = {
        compilationStatus,
        sourceAnalysis,
        recommendations: []
      };
      if (environmentStatus) {
        status.environmentStatus = environmentStatus;
      }
      status.recommendations = this.generateRecommendations(status);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(status, null, 2)
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: errorMessage,
              recommendations: [
                "Check that the workspace path is correct",
                "Ensure app.json exists in the workspace",
                "Verify AL project structure is valid"
              ]
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
};

// src/logger.ts
var Logger2 = class {
  static {
    __name(this, "Logger");
  }
  name;
  constructor(name) {
    this.name = name;
  }
  log(level, message, data) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const output = `[${timestamp}] [${level}] [${this.name}] ${message}`;
    if (level === "error") {
      console.error(output, data ? data : "");
    } else if (level === "warn") {
      console.warn(output, data ? data : "");
    } else if (process.env.LOG_LEVEL === "debug" || level === "info") {
      console.log(output, data ? data : "");
    }
  }
  debug(message, data) {
    if (process.env.LOG_LEVEL === "debug") {
      this.log("DEBUG", message, data);
    }
  }
  info(message, data) {
    this.log("INFO", message, data);
  }
  warn(message, data) {
    this.log("WARN", message, data);
  }
  error(message, data) {
    this.log("ERROR", message, data);
  }
};

// src/tools/listTests.ts
import * as path5 from "path";
var ListTestsInputSchema = external_exports.object({
  workspacePath: external_exports.string().optional().describe("Path to the workspace containing AL test files. If not provided, uses current working directory."),
  forceRefresh: external_exports.boolean().optional().default(false).describe("Force a fresh scan of test files, bypassing cache"),
  includeDetails: external_exports.boolean().optional().default(true).describe("Include test method details in the output"),
  filter: external_exports.string().optional().describe("Optional filter to search for specific test codeunit names")
});
var listTestsToolDefinition = {
  name: "list_tests",
  description: "List all test codeunits and their test methods found in the AL workspace by scanning source files",
  inputSchema: {
    type: "object",
    properties: {
      workspacePath: {
        type: "string",
        description: "Path to the workspace containing AL test files. If not provided, uses current working directory."
      },
      forceRefresh: {
        type: "boolean",
        description: "Force a fresh scan of test files, bypassing cache",
        default: false
      },
      includeDetails: {
        type: "boolean",
        description: "Include test method details in the output",
        default: true
      },
      filter: {
        type: "string",
        description: "Optional filter to search for specific test codeunit names"
      }
    },
    required: []
  }
};
async function executeListTests(registry, input) {
  const logger = new Logger2("ListTestsTool");
  const startTime = Date.now();
  try {
    const params = ListTestsInputSchema.parse(input || {});
    const workspacePath = params.workspacePath ? path5.resolve(params.workspacePath) : process.cwd();
    logger.info(`Listing tests in workspace: ${workspacePath}`);
    logger.info(`Options: forceRefresh=${params.forceRefresh}, includeDetails=${params.includeDetails}`);
    const testCodeunits = await registry.getTestCodeunits(workspacePath, params.forceRefresh);
    let filteredCodeunits = testCodeunits;
    if (params.filter) {
      logger.info(`Applying filter: ${params.filter}`);
      const lowerFilter = params.filter.toLowerCase();
      filteredCodeunits = testCodeunits.filter(
        (tc) => tc.file.object.name.toLowerCase().includes(lowerFilter)
      );
    }
    const result = {
      type: "success",
      workspacePath,
      totalCodeunits: filteredCodeunits.length,
      totalTests: filteredCodeunits.reduce((sum, tc) => sum + tc.testMethods.length, 0),
      testCodeunits: filteredCodeunits.map((tc) => {
        const testMethods = params.includeDetails ? tc.testMethods.map((tm) => ({
          name: tm.name,
          lineNumber: tm.lineNumber
        })) : void 0;
        return {
          id: tc.file.object.id,
          name: tc.file.object.name,
          path: tc.file.path,
          testCount: tc.testMethods.length,
          ...testMethods && { testMethods }
        };
      }),
      cached: !params.forceRefresh,
      scanDuration: Date.now() - startTime
    };
    logger.info(`Found ${result.totalCodeunits} test codeunits with ${result.totalTests} tests`);
    if (params.filter && filteredCodeunits.length !== testCodeunits.length) {
      logger.info(`Filter reduced from ${testCodeunits.length} to ${filteredCodeunits.length} codeunits`);
    }
    return result;
  } catch (error) {
    logger.error(`Failed to list tests: ${error}`);
    return {
      type: "error",
      workspacePath: process.cwd(),
      totalCodeunits: 0,
      totalTests: 0,
      message: error instanceof Error ? error.message : "Unknown error occurred",
      scanDuration: Date.now() - startTime
    };
  }
}
__name(executeListTests, "executeListTests");

// src/tools/listAvailableApps.ts
var ListAvailableAppsInputSchema = external_exports.object({
  environmentId: external_exports.string().min(1, "environmentId is required").describe("Environment ID to determine BC version and target platform"),
  nameFilter: external_exports.string().optional().describe("Optional filter to search apps by name (case-insensitive)")
}).strict();
var listAvailableAppsTool = {
  name: "list_available_apps",
  description: `List available apps from the Demo Portal catalog that can be installed on an environment.

**Purpose:**
Browse the Demo Portal app catalog to find pre-built apps compatible with your environment.
The app list is filtered by the environment's Business Central version and target platform.

**When to Use:**
- Discover available apps before installation
- Search for specific apps by name
- Check app versions available for your BC version
- Find app IDs needed for the install_app tool

**Parameters:**
- environmentId (required): Environment ID to determine BC version and platform
- nameFilter (optional): Search filter for app names (case-insensitive)

**Response Format:**
Returns a JSON object with:
- apps: Array of available apps with id, name, publisher, version, appId
- count: Number of apps found
- bcVersion: The BC version used for filtering
- target: The target platform (cloud/onprem)
- fetchedAt: Timestamp of the response

**Example Response:**
\`\`\`json
{
  "type": "list_available_apps_result",
  "apps": [
    {
      "id": "app-123",
      "name": "Continia Document Capture",
      "publisher": "Continia Software",
      "version": "14.0.0.0",
      "appId": "12345678-1234-1234-1234-123456789012",
      "bcVersion": "24.0",
      "target": "cloud"
    }
  ],
  "count": 1,
  "bcVersion": "24.0",
  "target": "cloud",
  "fetchedAt": "2024-01-15T10:30:00Z"
}
\`\`\`

**Error Handling:**
- NOT_FOUND: Environment doesn't exist - use list_environments to find valid IDs
- AUTH_ERROR: Invalid or expired API token
- NETWORK_ERROR: Connection issues

**Usage Flow:**
1. Use list_environments to find your environment ID
2. Call list_available_apps with the environment ID
3. Optionally filter by name to find specific apps
4. Use the app ID with install_app to install`,
  inputSchema: {
    type: "object",
    properties: {
      environmentId: {
        type: "string",
        description: "Environment ID to determine BC version and target platform"
      },
      nameFilter: {
        type: "string",
        description: "Optional filter to search apps by name (case-insensitive)"
      }
    },
    required: ["environmentId"]
  }
};
async function executeListAvailableApps(demoPortalClient, input) {
  try {
    const validated = ListAvailableAppsInputSchema.parse(input);
    const environment = await demoPortalClient.getEnvironmentRaw(validated.environmentId);
    const bcVersion = environment.bcVersion ?? "24.0";
    const target = environment.platform === "onprem" ? "onprem" : "cloud";
    let apps = await demoPortalClient.getAvailableApps(bcVersion, target);
    if (validated.nameFilter) {
      const filterLower = validated.nameFilter.toLowerCase();
      apps = apps.filter(
        (app) => app.name.toLowerCase().includes(filterLower) || app.publisher.toLowerCase().includes(filterLower)
      );
    }
    const result = {
      type: "list_available_apps_result",
      apps: apps.map((app) => ({
        id: app.id,
        name: app.name,
        publisher: app.publisher,
        version: app.version,
        appId: app.appId,
        bcVersion: app.bcVersion,
        target: app.target
      })),
      count: apps.length,
      bcVersion,
      target,
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return result;
  } catch (error) {
    if (error instanceof AppError) {
      return {
        type: "error",
        kind: error.code.toLowerCase(),
        message: error.message,
        retryable: error.retryable,
        details: error.details,
        remediation: getRemediation7(error)
      };
    }
    throw error;
  }
}
__name(executeListAvailableApps, "executeListAvailableApps");
function getRemediation7(error) {
  switch (error.code) {
    case "NOT_FOUND":
      return "Environment not found. Use list_environments to see available environments.";
    case "AUTH_ERROR":
      return "Verify DEMO_PORTAL_TOKEN environment variable is set with a valid API token.";
    case "RATE_LIMIT": {
      const retryAfter = error instanceof RateLimitError ? error.retryAfter : 60;
      return `API rate limit exceeded. Wait ${retryAfter} seconds before retrying.`;
    }
    case "NETWORK_ERROR":
      return "Check network connection and Demo Portal API availability.";
    default:
      return "Review error details and try again.";
  }
}
__name(getRemediation7, "getRemediation");

// src/tools/installApp.ts
var InstallAppInputSchema = external_exports.object({
  environmentId: external_exports.string().min(1, "environmentId is required").describe("Environment ID to install the app to"),
  appId: external_exports.string().optional().describe("App ID from the catalog (use list_available_apps to find)"),
  appName: external_exports.string().optional().describe("App name to search for (used if appId not provided)"),
  publisher: external_exports.string().optional().describe("Publisher name to filter by (used with appName)")
}).strict().refine(
  (data) => data.appId || data.appName,
  { message: "Either appId or appName must be provided" }
);
var installAppTool = {
  name: "install_app",
  description: `Install a pre-built app from the Demo Portal catalog to an environment.

**Purpose:**
Install apps from the Demo Portal catalog to your Business Central environment.
You can specify the app by ID (exact match) or by name (search).

**When to Use:**
- Install a specific app by ID from list_available_apps results
- Search and install an app by name
- Add Continia extensions to your environment
- Set up test environments with required apps

**Parameters:**
- environmentId (required): Target environment ID
- appId (optional): Exact app ID from the catalog
- appName (optional): App name to search for (if appId not provided)
- publisher (optional): Publisher filter (used with appName)

**Note:** Either appId or appName must be provided.

**Response Format:**
\`\`\`json
{
  "type": "install_app_result",
  "success": true,
  "app": {
    "id": "app-123",
    "name": "Continia Document Capture",
    "publisher": "Continia Software",
    "version": "14.0.0.0"
  },
  "environmentId": "env-abc123",
  "installedAt": "2024-01-15T10:30:00Z"
}
\`\`\`

**Error Handling:**
- NOT_FOUND: Environment or app doesn't exist
- VALIDATION_ERROR: Neither appId nor appName provided, or multiple matches found
- AUTH_ERROR: Invalid or expired API token
- NETWORK_ERROR: Connection issues

**Usage Flow:**
1. Use list_available_apps to find the app you want to install
2. Call install_app with either:
   - appId: Install exact app by ID
   - appName: Search and install by name (must be unique match)
3. Check the response for success status

**Examples:**

Install by ID:
\`\`\`json
{
  "environmentId": "env-abc123",
  "appId": "app-456"
}
\`\`\`

Install by name:
\`\`\`json
{
  "environmentId": "env-abc123",
  "appName": "Document Capture"
}
\`\`\`

Install by name and publisher:
\`\`\`json
{
  "environmentId": "env-abc123",
  "appName": "Document Capture",
  "publisher": "Continia"
}
\`\`\``,
  inputSchema: {
    type: "object",
    properties: {
      environmentId: {
        type: "string",
        description: "Environment ID to install the app to"
      },
      appId: {
        type: "string",
        description: "App ID from the catalog (use list_available_apps to find)"
      },
      appName: {
        type: "string",
        description: "App name to search for (used if appId not provided)"
      },
      publisher: {
        type: "string",
        description: "Publisher name to filter by (used with appName)"
      }
    },
    required: ["environmentId"]
  }
};
async function executeInstallApp(demoPortalClient, input) {
  try {
    const validated = InstallAppInputSchema.parse(input);
    const environment = await demoPortalClient.getEnvironmentRaw(validated.environmentId);
    const bcVersion = environment.bcVersion ?? "24.0";
    const target = environment.platform === "onprem" ? "onprem" : "cloud";
    const availableApps = await demoPortalClient.getAvailableApps(bcVersion, target);
    let appToInstall;
    if (validated.appId) {
      appToInstall = availableApps.find((app) => app.id === validated.appId);
      if (!appToInstall) {
        throw new NotFoundError(
          `App with ID '${validated.appId}' not found in catalog for BC ${bcVersion} (${target})`,
          { appId: validated.appId, bcVersion, target }
        );
      }
    } else if (validated.appName) {
      const nameLower = validated.appName.toLowerCase();
      let matches = availableApps.filter(
        (app) => app.name.toLowerCase().includes(nameLower)
      );
      if (validated.publisher && matches.length > 1) {
        const publisherLower = validated.publisher.toLowerCase();
        matches = matches.filter(
          (app) => app.publisher.toLowerCase().includes(publisherLower)
        );
      }
      if (matches.length === 0) {
        throw new NotFoundError(
          `No app found matching name '${validated.appName}'${validated.publisher ? ` from publisher '${validated.publisher}'` : ""} in catalog for BC ${bcVersion} (${target})`,
          { appName: validated.appName, publisher: validated.publisher, bcVersion, target }
        );
      }
      if (matches.length > 1) {
        throw new ValidationError(
          `Multiple apps found matching '${validated.appName}'. Please specify appId or add publisher filter. Found: ${matches.map((a) => `${a.name} (${a.publisher})`).join(", ")}`,
          { matches: matches.map((a) => ({ id: a.id, name: a.name, publisher: a.publisher })) }
        );
      }
      appToInstall = matches[0];
    }
    if (!appToInstall) {
      throw new ValidationError(
        "Either appId or appName must be provided",
        { input: validated }
      );
    }
    const success = await demoPortalClient.installApps(validated.environmentId, [appToInstall]);
    if (!success) {
      throw new Error(`Failed to install app '${appToInstall.name}' to environment`);
    }
    const result = {
      type: "install_app_result",
      success: true,
      app: {
        id: appToInstall.id,
        name: appToInstall.name,
        publisher: appToInstall.publisher,
        version: appToInstall.version,
        appId: appToInstall.appId
      },
      environmentId: validated.environmentId,
      installedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return result;
  } catch (error) {
    if (error instanceof AppError) {
      return {
        type: "error",
        kind: error.code.toLowerCase(),
        message: error.message,
        retryable: error.retryable,
        details: error.details,
        remediation: getRemediation8(error)
      };
    }
    throw error;
  }
}
__name(executeInstallApp, "executeInstallApp");
function getRemediation8(error) {
  switch (error.code) {
    case "NOT_FOUND":
      if (error.message.includes("App")) {
        return "Use list_available_apps to see available apps for your environment.";
      }
      return "Environment not found. Use list_environments to see available environments.";
    case "VALIDATION_ERROR":
      if (error.message.includes("Multiple apps")) {
        return "Multiple apps matched your search. Use appId for exact match or add publisher filter.";
      }
      return "Provide either appId (exact) or appName (search) to identify the app.";
    case "AUTH_ERROR":
      return "Verify DEMO_PORTAL_TOKEN environment variable is set with a valid API token.";
    case "RATE_LIMIT": {
      const retryAfter = error instanceof RateLimitError ? error.retryAfter : 60;
      return `API rate limit exceeded. Wait ${retryAfter} seconds before retrying.`;
    }
    case "NETWORK_ERROR":
      return "Check network connection and Demo Portal API availability.";
    default:
      return "Review error details and try again.";
  }
}
__name(getRemediation8, "getRemediation");

// src/alFileScanner.ts
import * as fs4 from "fs/promises";
import * as path7 from "path";

// node_modules/minimatch/dist/esm/index.js
var import_brace_expansion = __toESM(require_brace_expansion(), 1);

// node_modules/minimatch/dist/esm/assert-valid-pattern.js
var MAX_PATTERN_LENGTH = 1024 * 64;
var assertValidPattern = /* @__PURE__ */ __name((pattern) => {
  if (typeof pattern !== "string") {
    throw new TypeError("invalid pattern");
  }
  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new TypeError("pattern is too long");
  }
}, "assertValidPattern");

// node_modules/minimatch/dist/esm/brace-expressions.js
var posixClasses = {
  "[:alnum:]": ["\\p{L}\\p{Nl}\\p{Nd}", true],
  "[:alpha:]": ["\\p{L}\\p{Nl}", true],
  "[:ascii:]": ["\\x00-\\x7f", false],
  "[:blank:]": ["\\p{Zs}\\t", true],
  "[:cntrl:]": ["\\p{Cc}", true],
  "[:digit:]": ["\\p{Nd}", true],
  "[:graph:]": ["\\p{Z}\\p{C}", true, true],
  "[:lower:]": ["\\p{Ll}", true],
  "[:print:]": ["\\p{C}", true],
  "[:punct:]": ["\\p{P}", true],
  "[:space:]": ["\\p{Z}\\t\\r\\n\\v\\f", true],
  "[:upper:]": ["\\p{Lu}", true],
  "[:word:]": ["\\p{L}\\p{Nl}\\p{Nd}\\p{Pc}", true],
  "[:xdigit:]": ["A-Fa-f0-9", false]
};
var braceEscape = /* @__PURE__ */ __name((s) => s.replace(/[[\]\\-]/g, "\\$&"), "braceEscape");
var regexpEscape = /* @__PURE__ */ __name((s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "regexpEscape");
var rangesToString = /* @__PURE__ */ __name((ranges) => ranges.join(""), "rangesToString");
var parseClass = /* @__PURE__ */ __name((glob2, position) => {
  const pos = position;
  if (glob2.charAt(pos) !== "[") {
    throw new Error("not in a brace expression");
  }
  const ranges = [];
  const negs = [];
  let i = pos + 1;
  let sawStart = false;
  let uflag = false;
  let escaping = false;
  let negate = false;
  let endPos = pos;
  let rangeStart = "";
  WHILE: while (i < glob2.length) {
    const c = glob2.charAt(i);
    if ((c === "!" || c === "^") && i === pos + 1) {
      negate = true;
      i++;
      continue;
    }
    if (c === "]" && sawStart && !escaping) {
      endPos = i + 1;
      break;
    }
    sawStart = true;
    if (c === "\\") {
      if (!escaping) {
        escaping = true;
        i++;
        continue;
      }
    }
    if (c === "[" && !escaping) {
      for (const [cls, [unip, u, neg]] of Object.entries(posixClasses)) {
        if (glob2.startsWith(cls, i)) {
          if (rangeStart) {
            return ["$.", false, glob2.length - pos, true];
          }
          i += cls.length;
          if (neg)
            negs.push(unip);
          else
            ranges.push(unip);
          uflag = uflag || u;
          continue WHILE;
        }
      }
    }
    escaping = false;
    if (rangeStart) {
      if (c > rangeStart) {
        ranges.push(braceEscape(rangeStart) + "-" + braceEscape(c));
      } else if (c === rangeStart) {
        ranges.push(braceEscape(c));
      }
      rangeStart = "";
      i++;
      continue;
    }
    if (glob2.startsWith("-]", i + 1)) {
      ranges.push(braceEscape(c + "-"));
      i += 2;
      continue;
    }
    if (glob2.startsWith("-", i + 1)) {
      rangeStart = c;
      i += 2;
      continue;
    }
    ranges.push(braceEscape(c));
    i++;
  }
  if (endPos < i) {
    return ["", false, 0, false];
  }
  if (!ranges.length && !negs.length) {
    return ["$.", false, glob2.length - pos, true];
  }
  if (negs.length === 0 && ranges.length === 1 && /^\\?.$/.test(ranges[0]) && !negate) {
    const r = ranges[0].length === 2 ? ranges[0].slice(-1) : ranges[0];
    return [regexpEscape(r), false, endPos - pos, false];
  }
  const sranges = "[" + (negate ? "^" : "") + rangesToString(ranges) + "]";
  const snegs = "[" + (negate ? "" : "^") + rangesToString(negs) + "]";
  const comb = ranges.length && negs.length ? "(" + sranges + "|" + snegs + ")" : ranges.length ? sranges : snegs;
  return [comb, uflag, endPos - pos, true];
}, "parseClass");

// node_modules/minimatch/dist/esm/unescape.js
var unescape2 = /* @__PURE__ */ __name((s, { windowsPathsNoEscape = false } = {}) => {
  return windowsPathsNoEscape ? s.replace(/\[([^\/\\])\]/g, "$1") : s.replace(/((?!\\).|^)\[([^\/\\])\]/g, "$1$2").replace(/\\([^\/])/g, "$1");
}, "unescape");

// node_modules/minimatch/dist/esm/ast.js
var types = /* @__PURE__ */ new Set(["!", "?", "+", "*", "@"]);
var isExtglobType = /* @__PURE__ */ __name((c) => types.has(c), "isExtglobType");
var startNoTraversal = "(?!(?:^|/)\\.\\.?(?:$|/))";
var startNoDot = "(?!\\.)";
var addPatternStart = /* @__PURE__ */ new Set(["[", "."]);
var justDots = /* @__PURE__ */ new Set(["..", "."]);
var reSpecials = new Set("().*{}+?[]^$\\!");
var regExpEscape = /* @__PURE__ */ __name((s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "regExpEscape");
var qmark = "[^/]";
var star = qmark + "*?";
var starNoEmpty = qmark + "+?";
var AST = class _AST {
  static {
    __name(this, "AST");
  }
  type;
  #root;
  #hasMagic;
  #uflag = false;
  #parts = [];
  #parent;
  #parentIndex;
  #negs;
  #filledNegs = false;
  #options;
  #toString;
  // set to true if it's an extglob with no children
  // (which really means one child of '')
  #emptyExt = false;
  constructor(type, parent, options = {}) {
    this.type = type;
    if (type)
      this.#hasMagic = true;
    this.#parent = parent;
    this.#root = this.#parent ? this.#parent.#root : this;
    this.#options = this.#root === this ? options : this.#root.#options;
    this.#negs = this.#root === this ? [] : this.#root.#negs;
    if (type === "!" && !this.#root.#filledNegs)
      this.#negs.push(this);
    this.#parentIndex = this.#parent ? this.#parent.#parts.length : 0;
  }
  get hasMagic() {
    if (this.#hasMagic !== void 0)
      return this.#hasMagic;
    for (const p of this.#parts) {
      if (typeof p === "string")
        continue;
      if (p.type || p.hasMagic)
        return this.#hasMagic = true;
    }
    return this.#hasMagic;
  }
  // reconstructs the pattern
  toString() {
    if (this.#toString !== void 0)
      return this.#toString;
    if (!this.type) {
      return this.#toString = this.#parts.map((p) => String(p)).join("");
    } else {
      return this.#toString = this.type + "(" + this.#parts.map((p) => String(p)).join("|") + ")";
    }
  }
  #fillNegs() {
    if (this !== this.#root)
      throw new Error("should only call on root");
    if (this.#filledNegs)
      return this;
    this.toString();
    this.#filledNegs = true;
    let n;
    while (n = this.#negs.pop()) {
      if (n.type !== "!")
        continue;
      let p = n;
      let pp = p.#parent;
      while (pp) {
        for (let i = p.#parentIndex + 1; !pp.type && i < pp.#parts.length; i++) {
          for (const part of n.#parts) {
            if (typeof part === "string") {
              throw new Error("string part in extglob AST??");
            }
            part.copyIn(pp.#parts[i]);
          }
        }
        p = pp;
        pp = p.#parent;
      }
    }
    return this;
  }
  push(...parts) {
    for (const p of parts) {
      if (p === "")
        continue;
      if (typeof p !== "string" && !(p instanceof _AST && p.#parent === this)) {
        throw new Error("invalid part: " + p);
      }
      this.#parts.push(p);
    }
  }
  toJSON() {
    const ret = this.type === null ? this.#parts.slice().map((p) => typeof p === "string" ? p : p.toJSON()) : [this.type, ...this.#parts.map((p) => p.toJSON())];
    if (this.isStart() && !this.type)
      ret.unshift([]);
    if (this.isEnd() && (this === this.#root || this.#root.#filledNegs && this.#parent?.type === "!")) {
      ret.push({});
    }
    return ret;
  }
  isStart() {
    if (this.#root === this)
      return true;
    if (!this.#parent?.isStart())
      return false;
    if (this.#parentIndex === 0)
      return true;
    const p = this.#parent;
    for (let i = 0; i < this.#parentIndex; i++) {
      const pp = p.#parts[i];
      if (!(pp instanceof _AST && pp.type === "!")) {
        return false;
      }
    }
    return true;
  }
  isEnd() {
    if (this.#root === this)
      return true;
    if (this.#parent?.type === "!")
      return true;
    if (!this.#parent?.isEnd())
      return false;
    if (!this.type)
      return this.#parent?.isEnd();
    const pl = this.#parent ? this.#parent.#parts.length : 0;
    return this.#parentIndex === pl - 1;
  }
  copyIn(part) {
    if (typeof part === "string")
      this.push(part);
    else
      this.push(part.clone(this));
  }
  clone(parent) {
    const c = new _AST(this.type, parent);
    for (const p of this.#parts) {
      c.copyIn(p);
    }
    return c;
  }
  static #parseAST(str, ast, pos, opt) {
    let escaping = false;
    let inBrace = false;
    let braceStart = -1;
    let braceNeg = false;
    if (ast.type === null) {
      let i2 = pos;
      let acc2 = "";
      while (i2 < str.length) {
        const c = str.charAt(i2++);
        if (escaping || c === "\\") {
          escaping = !escaping;
          acc2 += c;
          continue;
        }
        if (inBrace) {
          if (i2 === braceStart + 1) {
            if (c === "^" || c === "!") {
              braceNeg = true;
            }
          } else if (c === "]" && !(i2 === braceStart + 2 && braceNeg)) {
            inBrace = false;
          }
          acc2 += c;
          continue;
        } else if (c === "[") {
          inBrace = true;
          braceStart = i2;
          braceNeg = false;
          acc2 += c;
          continue;
        }
        if (!opt.noext && isExtglobType(c) && str.charAt(i2) === "(") {
          ast.push(acc2);
          acc2 = "";
          const ext2 = new _AST(c, ast);
          i2 = _AST.#parseAST(str, ext2, i2, opt);
          ast.push(ext2);
          continue;
        }
        acc2 += c;
      }
      ast.push(acc2);
      return i2;
    }
    let i = pos + 1;
    let part = new _AST(null, ast);
    const parts = [];
    let acc = "";
    while (i < str.length) {
      const c = str.charAt(i++);
      if (escaping || c === "\\") {
        escaping = !escaping;
        acc += c;
        continue;
      }
      if (inBrace) {
        if (i === braceStart + 1) {
          if (c === "^" || c === "!") {
            braceNeg = true;
          }
        } else if (c === "]" && !(i === braceStart + 2 && braceNeg)) {
          inBrace = false;
        }
        acc += c;
        continue;
      } else if (c === "[") {
        inBrace = true;
        braceStart = i;
        braceNeg = false;
        acc += c;
        continue;
      }
      if (isExtglobType(c) && str.charAt(i) === "(") {
        part.push(acc);
        acc = "";
        const ext2 = new _AST(c, part);
        part.push(ext2);
        i = _AST.#parseAST(str, ext2, i, opt);
        continue;
      }
      if (c === "|") {
        part.push(acc);
        acc = "";
        parts.push(part);
        part = new _AST(null, ast);
        continue;
      }
      if (c === ")") {
        if (acc === "" && ast.#parts.length === 0) {
          ast.#emptyExt = true;
        }
        part.push(acc);
        acc = "";
        ast.push(...parts, part);
        return i;
      }
      acc += c;
    }
    ast.type = null;
    ast.#hasMagic = void 0;
    ast.#parts = [str.substring(pos - 1)];
    return i;
  }
  static fromGlob(pattern, options = {}) {
    const ast = new _AST(null, void 0, options);
    _AST.#parseAST(pattern, ast, 0, options);
    return ast;
  }
  // returns the regular expression if there's magic, or the unescaped
  // string if not.
  toMMPattern() {
    if (this !== this.#root)
      return this.#root.toMMPattern();
    const glob2 = this.toString();
    const [re, body, hasMagic2, uflag] = this.toRegExpSource();
    const anyMagic = hasMagic2 || this.#hasMagic || this.#options.nocase && !this.#options.nocaseMagicOnly && glob2.toUpperCase() !== glob2.toLowerCase();
    if (!anyMagic) {
      return body;
    }
    const flags = (this.#options.nocase ? "i" : "") + (uflag ? "u" : "");
    return Object.assign(new RegExp(`^${re}$`, flags), {
      _src: re,
      _glob: glob2
    });
  }
  get options() {
    return this.#options;
  }
  // returns the string match, the regexp source, whether there's magic
  // in the regexp (so a regular expression is required) and whether or
  // not the uflag is needed for the regular expression (for posix classes)
  // TODO: instead of injecting the start/end at this point, just return
  // the BODY of the regexp, along with the start/end portions suitable
  // for binding the start/end in either a joined full-path makeRe context
  // (where we bind to (^|/), or a standalone matchPart context (where
  // we bind to ^, and not /).  Otherwise slashes get duped!
  //
  // In part-matching mode, the start is:
  // - if not isStart: nothing
  // - if traversal possible, but not allowed: ^(?!\.\.?$)
  // - if dots allowed or not possible: ^
  // - if dots possible and not allowed: ^(?!\.)
  // end is:
  // - if not isEnd(): nothing
  // - else: $
  //
  // In full-path matching mode, we put the slash at the START of the
  // pattern, so start is:
  // - if first pattern: same as part-matching mode
  // - if not isStart(): nothing
  // - if traversal possible, but not allowed: /(?!\.\.?(?:$|/))
  // - if dots allowed or not possible: /
  // - if dots possible and not allowed: /(?!\.)
  // end is:
  // - if last pattern, same as part-matching mode
  // - else nothing
  //
  // Always put the (?:$|/) on negated tails, though, because that has to be
  // there to bind the end of the negated pattern portion, and it's easier to
  // just stick it in now rather than try to inject it later in the middle of
  // the pattern.
  //
  // We can just always return the same end, and leave it up to the caller
  // to know whether it's going to be used joined or in parts.
  // And, if the start is adjusted slightly, can do the same there:
  // - if not isStart: nothing
  // - if traversal possible, but not allowed: (?:/|^)(?!\.\.?$)
  // - if dots allowed or not possible: (?:/|^)
  // - if dots possible and not allowed: (?:/|^)(?!\.)
  //
  // But it's better to have a simpler binding without a conditional, for
  // performance, so probably better to return both start options.
  //
  // Then the caller just ignores the end if it's not the first pattern,
  // and the start always gets applied.
  //
  // But that's always going to be $ if it's the ending pattern, or nothing,
  // so the caller can just attach $ at the end of the pattern when building.
  //
  // So the todo is:
  // - better detect what kind of start is needed
  // - return both flavors of starting pattern
  // - attach $ at the end of the pattern when creating the actual RegExp
  //
  // Ah, but wait, no, that all only applies to the root when the first pattern
  // is not an extglob. If the first pattern IS an extglob, then we need all
  // that dot prevention biz to live in the extglob portions, because eg
  // +(*|.x*) can match .xy but not .yx.
  //
  // So, return the two flavors if it's #root and the first child is not an
  // AST, otherwise leave it to the child AST to handle it, and there,
  // use the (?:^|/) style of start binding.
  //
  // Even simplified further:
  // - Since the start for a join is eg /(?!\.) and the start for a part
  // is ^(?!\.), we can just prepend (?!\.) to the pattern (either root
  // or start or whatever) and prepend ^ or / at the Regexp construction.
  toRegExpSource(allowDot) {
    const dot = allowDot ?? !!this.#options.dot;
    if (this.#root === this)
      this.#fillNegs();
    if (!this.type) {
      const noEmpty = this.isStart() && this.isEnd();
      const src = this.#parts.map((p) => {
        const [re, _, hasMagic2, uflag] = typeof p === "string" ? _AST.#parseGlob(p, this.#hasMagic, noEmpty) : p.toRegExpSource(allowDot);
        this.#hasMagic = this.#hasMagic || hasMagic2;
        this.#uflag = this.#uflag || uflag;
        return re;
      }).join("");
      let start2 = "";
      if (this.isStart()) {
        if (typeof this.#parts[0] === "string") {
          const dotTravAllowed = this.#parts.length === 1 && justDots.has(this.#parts[0]);
          if (!dotTravAllowed) {
            const aps = addPatternStart;
            const needNoTrav = (
              // dots are allowed, and the pattern starts with [ or .
              dot && aps.has(src.charAt(0)) || // the pattern starts with \., and then [ or .
              src.startsWith("\\.") && aps.has(src.charAt(2)) || // the pattern starts with \.\., and then [ or .
              src.startsWith("\\.\\.") && aps.has(src.charAt(4))
            );
            const needNoDot = !dot && !allowDot && aps.has(src.charAt(0));
            start2 = needNoTrav ? startNoTraversal : needNoDot ? startNoDot : "";
          }
        }
      }
      let end = "";
      if (this.isEnd() && this.#root.#filledNegs && this.#parent?.type === "!") {
        end = "(?:$|\\/)";
      }
      const final2 = start2 + src + end;
      return [
        final2,
        unescape2(src),
        this.#hasMagic = !!this.#hasMagic,
        this.#uflag
      ];
    }
    const repeated = this.type === "*" || this.type === "+";
    const start = this.type === "!" ? "(?:(?!(?:" : "(?:";
    let body = this.#partsToRegExp(dot);
    if (this.isStart() && this.isEnd() && !body && this.type !== "!") {
      const s = this.toString();
      this.#parts = [s];
      this.type = null;
      this.#hasMagic = void 0;
      return [s, unescape2(this.toString()), false, false];
    }
    let bodyDotAllowed = !repeated || allowDot || dot || !startNoDot ? "" : this.#partsToRegExp(true);
    if (bodyDotAllowed === body) {
      bodyDotAllowed = "";
    }
    if (bodyDotAllowed) {
      body = `(?:${body})(?:${bodyDotAllowed})*?`;
    }
    let final = "";
    if (this.type === "!" && this.#emptyExt) {
      final = (this.isStart() && !dot ? startNoDot : "") + starNoEmpty;
    } else {
      const close = this.type === "!" ? (
        // !() must match something,but !(x) can match ''
        "))" + (this.isStart() && !dot && !allowDot ? startNoDot : "") + star + ")"
      ) : this.type === "@" ? ")" : this.type === "?" ? ")?" : this.type === "+" && bodyDotAllowed ? ")" : this.type === "*" && bodyDotAllowed ? `)?` : `)${this.type}`;
      final = start + body + close;
    }
    return [
      final,
      unescape2(body),
      this.#hasMagic = !!this.#hasMagic,
      this.#uflag
    ];
  }
  #partsToRegExp(dot) {
    return this.#parts.map((p) => {
      if (typeof p === "string") {
        throw new Error("string type in extglob ast??");
      }
      const [re, _, _hasMagic, uflag] = p.toRegExpSource(dot);
      this.#uflag = this.#uflag || uflag;
      return re;
    }).filter((p) => !(this.isStart() && this.isEnd()) || !!p).join("|");
  }
  static #parseGlob(glob2, hasMagic2, noEmpty = false) {
    let escaping = false;
    let re = "";
    let uflag = false;
    for (let i = 0; i < glob2.length; i++) {
      const c = glob2.charAt(i);
      if (escaping) {
        escaping = false;
        re += (reSpecials.has(c) ? "\\" : "") + c;
        continue;
      }
      if (c === "\\") {
        if (i === glob2.length - 1) {
          re += "\\\\";
        } else {
          escaping = true;
        }
        continue;
      }
      if (c === "[") {
        const [src, needUflag, consumed, magic] = parseClass(glob2, i);
        if (consumed) {
          re += src;
          uflag = uflag || needUflag;
          i += consumed - 1;
          hasMagic2 = hasMagic2 || magic;
          continue;
        }
      }
      if (c === "*") {
        if (noEmpty && glob2 === "*")
          re += starNoEmpty;
        else
          re += star;
        hasMagic2 = true;
        continue;
      }
      if (c === "?") {
        re += qmark;
        hasMagic2 = true;
        continue;
      }
      re += regExpEscape(c);
    }
    return [re, unescape2(glob2), !!hasMagic2, uflag];
  }
};

// node_modules/minimatch/dist/esm/escape.js
var escape2 = /* @__PURE__ */ __name((s, { windowsPathsNoEscape = false } = {}) => {
  return windowsPathsNoEscape ? s.replace(/[?*()[\]]/g, "[$&]") : s.replace(/[?*()[\]\\]/g, "\\$&");
}, "escape");

// node_modules/minimatch/dist/esm/index.js
var minimatch = /* @__PURE__ */ __name((p, pattern, options = {}) => {
  assertValidPattern(pattern);
  if (!options.nocomment && pattern.charAt(0) === "#") {
    return false;
  }
  return new Minimatch(pattern, options).match(p);
}, "minimatch");
var starDotExtRE = /^\*+([^+@!?\*\[\(]*)$/;
var starDotExtTest = /* @__PURE__ */ __name((ext2) => (f) => !f.startsWith(".") && f.endsWith(ext2), "starDotExtTest");
var starDotExtTestDot = /* @__PURE__ */ __name((ext2) => (f) => f.endsWith(ext2), "starDotExtTestDot");
var starDotExtTestNocase = /* @__PURE__ */ __name((ext2) => {
  ext2 = ext2.toLowerCase();
  return (f) => !f.startsWith(".") && f.toLowerCase().endsWith(ext2);
}, "starDotExtTestNocase");
var starDotExtTestNocaseDot = /* @__PURE__ */ __name((ext2) => {
  ext2 = ext2.toLowerCase();
  return (f) => f.toLowerCase().endsWith(ext2);
}, "starDotExtTestNocaseDot");
var starDotStarRE = /^\*+\.\*+$/;
var starDotStarTest = /* @__PURE__ */ __name((f) => !f.startsWith(".") && f.includes("."), "starDotStarTest");
var starDotStarTestDot = /* @__PURE__ */ __name((f) => f !== "." && f !== ".." && f.includes("."), "starDotStarTestDot");
var dotStarRE = /^\.\*+$/;
var dotStarTest = /* @__PURE__ */ __name((f) => f !== "." && f !== ".." && f.startsWith("."), "dotStarTest");
var starRE = /^\*+$/;
var starTest = /* @__PURE__ */ __name((f) => f.length !== 0 && !f.startsWith("."), "starTest");
var starTestDot = /* @__PURE__ */ __name((f) => f.length !== 0 && f !== "." && f !== "..", "starTestDot");
var qmarksRE = /^\?+([^+@!?\*\[\(]*)?$/;
var qmarksTestNocase = /* @__PURE__ */ __name(([$0, ext2 = ""]) => {
  const noext = qmarksTestNoExt([$0]);
  if (!ext2)
    return noext;
  ext2 = ext2.toLowerCase();
  return (f) => noext(f) && f.toLowerCase().endsWith(ext2);
}, "qmarksTestNocase");
var qmarksTestNocaseDot = /* @__PURE__ */ __name(([$0, ext2 = ""]) => {
  const noext = qmarksTestNoExtDot([$0]);
  if (!ext2)
    return noext;
  ext2 = ext2.toLowerCase();
  return (f) => noext(f) && f.toLowerCase().endsWith(ext2);
}, "qmarksTestNocaseDot");
var qmarksTestDot = /* @__PURE__ */ __name(([$0, ext2 = ""]) => {
  const noext = qmarksTestNoExtDot([$0]);
  return !ext2 ? noext : (f) => noext(f) && f.endsWith(ext2);
}, "qmarksTestDot");
var qmarksTest = /* @__PURE__ */ __name(([$0, ext2 = ""]) => {
  const noext = qmarksTestNoExt([$0]);
  return !ext2 ? noext : (f) => noext(f) && f.endsWith(ext2);
}, "qmarksTest");
var qmarksTestNoExt = /* @__PURE__ */ __name(([$0]) => {
  const len = $0.length;
  return (f) => f.length === len && !f.startsWith(".");
}, "qmarksTestNoExt");
var qmarksTestNoExtDot = /* @__PURE__ */ __name(([$0]) => {
  const len = $0.length;
  return (f) => f.length === len && f !== "." && f !== "..";
}, "qmarksTestNoExtDot");
var defaultPlatform = typeof process === "object" && process ? typeof process.env === "object" && process.env && process.env.__MINIMATCH_TESTING_PLATFORM__ || process.platform : "posix";
var path6 = {
  win32: { sep: "\\" },
  posix: { sep: "/" }
};
var sep = defaultPlatform === "win32" ? path6.win32.sep : path6.posix.sep;
minimatch.sep = sep;
var GLOBSTAR = Symbol("globstar **");
minimatch.GLOBSTAR = GLOBSTAR;
var qmark2 = "[^/]";
var star2 = qmark2 + "*?";
var twoStarDot = "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?";
var twoStarNoDot = "(?:(?!(?:\\/|^)\\.).)*?";
var filter = /* @__PURE__ */ __name((pattern, options = {}) => (p) => minimatch(p, pattern, options), "filter");
minimatch.filter = filter;
var ext = /* @__PURE__ */ __name((a, b = {}) => Object.assign({}, a, b), "ext");
var defaults = /* @__PURE__ */ __name((def) => {
  if (!def || typeof def !== "object" || !Object.keys(def).length) {
    return minimatch;
  }
  const orig = minimatch;
  const m = /* @__PURE__ */ __name((p, pattern, options = {}) => orig(p, pattern, ext(def, options)), "m");
  return Object.assign(m, {
    Minimatch: class Minimatch extends orig.Minimatch {
      static {
        __name(this, "Minimatch");
      }
      constructor(pattern, options = {}) {
        super(pattern, ext(def, options));
      }
      static defaults(options) {
        return orig.defaults(ext(def, options)).Minimatch;
      }
    },
    AST: class AST extends orig.AST {
      static {
        __name(this, "AST");
      }
      /* c8 ignore start */
      constructor(type, parent, options = {}) {
        super(type, parent, ext(def, options));
      }
      /* c8 ignore stop */
      static fromGlob(pattern, options = {}) {
        return orig.AST.fromGlob(pattern, ext(def, options));
      }
    },
    unescape: /* @__PURE__ */ __name((s, options = {}) => orig.unescape(s, ext(def, options)), "unescape"),
    escape: /* @__PURE__ */ __name((s, options = {}) => orig.escape(s, ext(def, options)), "escape"),
    filter: /* @__PURE__ */ __name((pattern, options = {}) => orig.filter(pattern, ext(def, options)), "filter"),
    defaults: /* @__PURE__ */ __name((options) => orig.defaults(ext(def, options)), "defaults"),
    makeRe: /* @__PURE__ */ __name((pattern, options = {}) => orig.makeRe(pattern, ext(def, options)), "makeRe"),
    braceExpand: /* @__PURE__ */ __name((pattern, options = {}) => orig.braceExpand(pattern, ext(def, options)), "braceExpand"),
    match: /* @__PURE__ */ __name((list, pattern, options = {}) => orig.match(list, pattern, ext(def, options)), "match"),
    sep: orig.sep,
    GLOBSTAR
  });
}, "defaults");
minimatch.defaults = defaults;
var braceExpand = /* @__PURE__ */ __name((pattern, options = {}) => {
  assertValidPattern(pattern);
  if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
    return [pattern];
  }
  return (0, import_brace_expansion.default)(pattern);
}, "braceExpand");
minimatch.braceExpand = braceExpand;
var makeRe = /* @__PURE__ */ __name((pattern, options = {}) => new Minimatch(pattern, options).makeRe(), "makeRe");
minimatch.makeRe = makeRe;
var match = /* @__PURE__ */ __name((list, pattern, options = {}) => {
  const mm = new Minimatch(pattern, options);
  list = list.filter((f) => mm.match(f));
  if (mm.options.nonull && !list.length) {
    list.push(pattern);
  }
  return list;
}, "match");
minimatch.match = match;
var globMagic = /[?*]|[+@!]\(.*?\)|\[|\]/;
var regExpEscape2 = /* @__PURE__ */ __name((s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "regExpEscape");
var Minimatch = class {
  static {
    __name(this, "Minimatch");
  }
  options;
  set;
  pattern;
  windowsPathsNoEscape;
  nonegate;
  negate;
  comment;
  empty;
  preserveMultipleSlashes;
  partial;
  globSet;
  globParts;
  nocase;
  isWindows;
  platform;
  windowsNoMagicRoot;
  regexp;
  constructor(pattern, options = {}) {
    assertValidPattern(pattern);
    options = options || {};
    this.options = options;
    this.pattern = pattern;
    this.platform = options.platform || defaultPlatform;
    this.isWindows = this.platform === "win32";
    this.windowsPathsNoEscape = !!options.windowsPathsNoEscape || options.allowWindowsEscape === false;
    if (this.windowsPathsNoEscape) {
      this.pattern = this.pattern.replace(/\\/g, "/");
    }
    this.preserveMultipleSlashes = !!options.preserveMultipleSlashes;
    this.regexp = null;
    this.negate = false;
    this.nonegate = !!options.nonegate;
    this.comment = false;
    this.empty = false;
    this.partial = !!options.partial;
    this.nocase = !!this.options.nocase;
    this.windowsNoMagicRoot = options.windowsNoMagicRoot !== void 0 ? options.windowsNoMagicRoot : !!(this.isWindows && this.nocase);
    this.globSet = [];
    this.globParts = [];
    this.set = [];
    this.make();
  }
  hasMagic() {
    if (this.options.magicalBraces && this.set.length > 1) {
      return true;
    }
    for (const pattern of this.set) {
      for (const part of pattern) {
        if (typeof part !== "string")
          return true;
      }
    }
    return false;
  }
  debug(..._) {
  }
  make() {
    const pattern = this.pattern;
    const options = this.options;
    if (!options.nocomment && pattern.charAt(0) === "#") {
      this.comment = true;
      return;
    }
    if (!pattern) {
      this.empty = true;
      return;
    }
    this.parseNegate();
    this.globSet = [...new Set(this.braceExpand())];
    if (options.debug) {
      this.debug = (...args) => console.error(...args);
    }
    this.debug(this.pattern, this.globSet);
    const rawGlobParts = this.globSet.map((s) => this.slashSplit(s));
    this.globParts = this.preprocess(rawGlobParts);
    this.debug(this.pattern, this.globParts);
    let set = this.globParts.map((s, _, __) => {
      if (this.isWindows && this.windowsNoMagicRoot) {
        const isUNC = s[0] === "" && s[1] === "" && (s[2] === "?" || !globMagic.test(s[2])) && !globMagic.test(s[3]);
        const isDrive = /^[a-z]:/i.test(s[0]);
        if (isUNC) {
          return [...s.slice(0, 4), ...s.slice(4).map((ss) => this.parse(ss))];
        } else if (isDrive) {
          return [s[0], ...s.slice(1).map((ss) => this.parse(ss))];
        }
      }
      return s.map((ss) => this.parse(ss));
    });
    this.debug(this.pattern, set);
    this.set = set.filter((s) => s.indexOf(false) === -1);
    if (this.isWindows) {
      for (let i = 0; i < this.set.length; i++) {
        const p = this.set[i];
        if (p[0] === "" && p[1] === "" && this.globParts[i][2] === "?" && typeof p[3] === "string" && /^[a-z]:$/i.test(p[3])) {
          p[2] = "?";
        }
      }
    }
    this.debug(this.pattern, this.set);
  }
  // various transforms to equivalent pattern sets that are
  // faster to process in a filesystem walk.  The goal is to
  // eliminate what we can, and push all ** patterns as far
  // to the right as possible, even if it increases the number
  // of patterns that we have to process.
  preprocess(globParts) {
    if (this.options.noglobstar) {
      for (let i = 0; i < globParts.length; i++) {
        for (let j = 0; j < globParts[i].length; j++) {
          if (globParts[i][j] === "**") {
            globParts[i][j] = "*";
          }
        }
      }
    }
    const { optimizationLevel = 1 } = this.options;
    if (optimizationLevel >= 2) {
      globParts = this.firstPhasePreProcess(globParts);
      globParts = this.secondPhasePreProcess(globParts);
    } else if (optimizationLevel >= 1) {
      globParts = this.levelOneOptimize(globParts);
    } else {
      globParts = this.adjascentGlobstarOptimize(globParts);
    }
    return globParts;
  }
  // just get rid of adjascent ** portions
  adjascentGlobstarOptimize(globParts) {
    return globParts.map((parts) => {
      let gs = -1;
      while (-1 !== (gs = parts.indexOf("**", gs + 1))) {
        let i = gs;
        while (parts[i + 1] === "**") {
          i++;
        }
        if (i !== gs) {
          parts.splice(gs, i - gs);
        }
      }
      return parts;
    });
  }
  // get rid of adjascent ** and resolve .. portions
  levelOneOptimize(globParts) {
    return globParts.map((parts) => {
      parts = parts.reduce((set, part) => {
        const prev = set[set.length - 1];
        if (part === "**" && prev === "**") {
          return set;
        }
        if (part === "..") {
          if (prev && prev !== ".." && prev !== "." && prev !== "**") {
            set.pop();
            return set;
          }
        }
        set.push(part);
        return set;
      }, []);
      return parts.length === 0 ? [""] : parts;
    });
  }
  levelTwoFileOptimize(parts) {
    if (!Array.isArray(parts)) {
      parts = this.slashSplit(parts);
    }
    let didSomething = false;
    do {
      didSomething = false;
      if (!this.preserveMultipleSlashes) {
        for (let i = 1; i < parts.length - 1; i++) {
          const p = parts[i];
          if (i === 1 && p === "" && parts[0] === "")
            continue;
          if (p === "." || p === "") {
            didSomething = true;
            parts.splice(i, 1);
            i--;
          }
        }
        if (parts[0] === "." && parts.length === 2 && (parts[1] === "." || parts[1] === "")) {
          didSomething = true;
          parts.pop();
        }
      }
      let dd = 0;
      while (-1 !== (dd = parts.indexOf("..", dd + 1))) {
        const p = parts[dd - 1];
        if (p && p !== "." && p !== ".." && p !== "**") {
          didSomething = true;
          parts.splice(dd - 1, 2);
          dd -= 2;
        }
      }
    } while (didSomething);
    return parts.length === 0 ? [""] : parts;
  }
  // First phase: single-pattern processing
  // <pre> is 1 or more portions
  // <rest> is 1 or more portions
  // <p> is any portion other than ., .., '', or **
  // <e> is . or ''
  //
  // **/.. is *brutal* for filesystem walking performance, because
  // it effectively resets the recursive walk each time it occurs,
  // and ** cannot be reduced out by a .. pattern part like a regexp
  // or most strings (other than .., ., and '') can be.
  //
  // <pre>/**/../<p>/<p>/<rest> -> {<pre>/../<p>/<p>/<rest>,<pre>/**/<p>/<p>/<rest>}
  // <pre>/<e>/<rest> -> <pre>/<rest>
  // <pre>/<p>/../<rest> -> <pre>/<rest>
  // **/**/<rest> -> **/<rest>
  //
  // **/*/<rest> -> */**/<rest> <== not valid because ** doesn't follow
  // this WOULD be allowed if ** did follow symlinks, or * didn't
  firstPhasePreProcess(globParts) {
    let didSomething = false;
    do {
      didSomething = false;
      for (let parts of globParts) {
        let gs = -1;
        while (-1 !== (gs = parts.indexOf("**", gs + 1))) {
          let gss = gs;
          while (parts[gss + 1] === "**") {
            gss++;
          }
          if (gss > gs) {
            parts.splice(gs + 1, gss - gs);
          }
          let next = parts[gs + 1];
          const p = parts[gs + 2];
          const p2 = parts[gs + 3];
          if (next !== "..")
            continue;
          if (!p || p === "." || p === ".." || !p2 || p2 === "." || p2 === "..") {
            continue;
          }
          didSomething = true;
          parts.splice(gs, 1);
          const other = parts.slice(0);
          other[gs] = "**";
          globParts.push(other);
          gs--;
        }
        if (!this.preserveMultipleSlashes) {
          for (let i = 1; i < parts.length - 1; i++) {
            const p = parts[i];
            if (i === 1 && p === "" && parts[0] === "")
              continue;
            if (p === "." || p === "") {
              didSomething = true;
              parts.splice(i, 1);
              i--;
            }
          }
          if (parts[0] === "." && parts.length === 2 && (parts[1] === "." || parts[1] === "")) {
            didSomething = true;
            parts.pop();
          }
        }
        let dd = 0;
        while (-1 !== (dd = parts.indexOf("..", dd + 1))) {
          const p = parts[dd - 1];
          if (p && p !== "." && p !== ".." && p !== "**") {
            didSomething = true;
            const needDot = dd === 1 && parts[dd + 1] === "**";
            const splin = needDot ? ["."] : [];
            parts.splice(dd - 1, 2, ...splin);
            if (parts.length === 0)
              parts.push("");
            dd -= 2;
          }
        }
      }
    } while (didSomething);
    return globParts;
  }
  // second phase: multi-pattern dedupes
  // {<pre>/*/<rest>,<pre>/<p>/<rest>} -> <pre>/*/<rest>
  // {<pre>/<rest>,<pre>/<rest>} -> <pre>/<rest>
  // {<pre>/**/<rest>,<pre>/<rest>} -> <pre>/**/<rest>
  //
  // {<pre>/**/<rest>,<pre>/**/<p>/<rest>} -> <pre>/**/<rest>
  // ^-- not valid because ** doens't follow symlinks
  secondPhasePreProcess(globParts) {
    for (let i = 0; i < globParts.length - 1; i++) {
      for (let j = i + 1; j < globParts.length; j++) {
        const matched = this.partsMatch(globParts[i], globParts[j], !this.preserveMultipleSlashes);
        if (matched) {
          globParts[i] = [];
          globParts[j] = matched;
          break;
        }
      }
    }
    return globParts.filter((gs) => gs.length);
  }
  partsMatch(a, b, emptyGSMatch = false) {
    let ai = 0;
    let bi = 0;
    let result = [];
    let which = "";
    while (ai < a.length && bi < b.length) {
      if (a[ai] === b[bi]) {
        result.push(which === "b" ? b[bi] : a[ai]);
        ai++;
        bi++;
      } else if (emptyGSMatch && a[ai] === "**" && b[bi] === a[ai + 1]) {
        result.push(a[ai]);
        ai++;
      } else if (emptyGSMatch && b[bi] === "**" && a[ai] === b[bi + 1]) {
        result.push(b[bi]);
        bi++;
      } else if (a[ai] === "*" && b[bi] && (this.options.dot || !b[bi].startsWith(".")) && b[bi] !== "**") {
        if (which === "b")
          return false;
        which = "a";
        result.push(a[ai]);
        ai++;
        bi++;
      } else if (b[bi] === "*" && a[ai] && (this.options.dot || !a[ai].startsWith(".")) && a[ai] !== "**") {
        if (which === "a")
          return false;
        which = "b";
        result.push(b[bi]);
        ai++;
        bi++;
      } else {
        return false;
      }
    }
    return a.length === b.length && result;
  }
  parseNegate() {
    if (this.nonegate)
      return;
    const pattern = this.pattern;
    let negate = false;
    let negateOffset = 0;
    for (let i = 0; i < pattern.length && pattern.charAt(i) === "!"; i++) {
      negate = !negate;
      negateOffset++;
    }
    if (negateOffset)
      this.pattern = pattern.slice(negateOffset);
    this.negate = negate;
  }
  // set partial to true to test if, for example,
  // "/a/b" matches the start of "/*/b/*/d"
  // Partial means, if you run out of file before you run
  // out of pattern, then that's fine, as long as all
  // the parts match.
  matchOne(file, pattern, partial = false) {
    const options = this.options;
    if (this.isWindows) {
      const fileDrive = typeof file[0] === "string" && /^[a-z]:$/i.test(file[0]);
      const fileUNC = !fileDrive && file[0] === "" && file[1] === "" && file[2] === "?" && /^[a-z]:$/i.test(file[3]);
      const patternDrive = typeof pattern[0] === "string" && /^[a-z]:$/i.test(pattern[0]);
      const patternUNC = !patternDrive && pattern[0] === "" && pattern[1] === "" && pattern[2] === "?" && typeof pattern[3] === "string" && /^[a-z]:$/i.test(pattern[3]);
      const fdi = fileUNC ? 3 : fileDrive ? 0 : void 0;
      const pdi = patternUNC ? 3 : patternDrive ? 0 : void 0;
      if (typeof fdi === "number" && typeof pdi === "number") {
        const [fd, pd] = [file[fdi], pattern[pdi]];
        if (fd.toLowerCase() === pd.toLowerCase()) {
          pattern[pdi] = fd;
          if (pdi > fdi) {
            pattern = pattern.slice(pdi);
          } else if (fdi > pdi) {
            file = file.slice(fdi);
          }
        }
      }
    }
    const { optimizationLevel = 1 } = this.options;
    if (optimizationLevel >= 2) {
      file = this.levelTwoFileOptimize(file);
    }
    this.debug("matchOne", this, { file, pattern });
    this.debug("matchOne", file.length, pattern.length);
    for (var fi = 0, pi = 0, fl = file.length, pl = pattern.length; fi < fl && pi < pl; fi++, pi++) {
      this.debug("matchOne loop");
      var p = pattern[pi];
      var f = file[fi];
      this.debug(pattern, p, f);
      if (p === false) {
        return false;
      }
      if (p === GLOBSTAR) {
        this.debug("GLOBSTAR", [pattern, p, f]);
        var fr = fi;
        var pr = pi + 1;
        if (pr === pl) {
          this.debug("** at the end");
          for (; fi < fl; fi++) {
            if (file[fi] === "." || file[fi] === ".." || !options.dot && file[fi].charAt(0) === ".")
              return false;
          }
          return true;
        }
        while (fr < fl) {
          var swallowee = file[fr];
          this.debug("\nglobstar while", file, fr, pattern, pr, swallowee);
          if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
            this.debug("globstar found match!", fr, fl, swallowee);
            return true;
          } else {
            if (swallowee === "." || swallowee === ".." || !options.dot && swallowee.charAt(0) === ".") {
              this.debug("dot detected!", file, fr, pattern, pr);
              break;
            }
            this.debug("globstar swallow a segment, and continue");
            fr++;
          }
        }
        if (partial) {
          this.debug("\n>>> no match, partial?", file, fr, pattern, pr);
          if (fr === fl) {
            return true;
          }
        }
        return false;
      }
      let hit;
      if (typeof p === "string") {
        hit = f === p;
        this.debug("string match", p, f, hit);
      } else {
        hit = p.test(f);
        this.debug("pattern match", p, f, hit);
      }
      if (!hit)
        return false;
    }
    if (fi === fl && pi === pl) {
      return true;
    } else if (fi === fl) {
      return partial;
    } else if (pi === pl) {
      return fi === fl - 1 && file[fi] === "";
    } else {
      throw new Error("wtf?");
    }
  }
  braceExpand() {
    return braceExpand(this.pattern, this.options);
  }
  parse(pattern) {
    assertValidPattern(pattern);
    const options = this.options;
    if (pattern === "**")
      return GLOBSTAR;
    if (pattern === "")
      return "";
    let m;
    let fastTest = null;
    if (m = pattern.match(starRE)) {
      fastTest = options.dot ? starTestDot : starTest;
    } else if (m = pattern.match(starDotExtRE)) {
      fastTest = (options.nocase ? options.dot ? starDotExtTestNocaseDot : starDotExtTestNocase : options.dot ? starDotExtTestDot : starDotExtTest)(m[1]);
    } else if (m = pattern.match(qmarksRE)) {
      fastTest = (options.nocase ? options.dot ? qmarksTestNocaseDot : qmarksTestNocase : options.dot ? qmarksTestDot : qmarksTest)(m);
    } else if (m = pattern.match(starDotStarRE)) {
      fastTest = options.dot ? starDotStarTestDot : starDotStarTest;
    } else if (m = pattern.match(dotStarRE)) {
      fastTest = dotStarTest;
    }
    const re = AST.fromGlob(pattern, this.options).toMMPattern();
    if (fastTest && typeof re === "object") {
      Reflect.defineProperty(re, "test", { value: fastTest });
    }
    return re;
  }
  makeRe() {
    if (this.regexp || this.regexp === false)
      return this.regexp;
    const set = this.set;
    if (!set.length) {
      this.regexp = false;
      return this.regexp;
    }
    const options = this.options;
    const twoStar = options.noglobstar ? star2 : options.dot ? twoStarDot : twoStarNoDot;
    const flags = new Set(options.nocase ? ["i"] : []);
    let re = set.map((pattern) => {
      const pp = pattern.map((p) => {
        if (p instanceof RegExp) {
          for (const f of p.flags.split(""))
            flags.add(f);
        }
        return typeof p === "string" ? regExpEscape2(p) : p === GLOBSTAR ? GLOBSTAR : p._src;
      });
      pp.forEach((p, i) => {
        const next = pp[i + 1];
        const prev = pp[i - 1];
        if (p !== GLOBSTAR || prev === GLOBSTAR) {
          return;
        }
        if (prev === void 0) {
          if (next !== void 0 && next !== GLOBSTAR) {
            pp[i + 1] = "(?:\\/|" + twoStar + "\\/)?" + next;
          } else {
            pp[i] = twoStar;
          }
        } else if (next === void 0) {
          pp[i - 1] = prev + "(?:\\/|" + twoStar + ")?";
        } else if (next !== GLOBSTAR) {
          pp[i - 1] = prev + "(?:\\/|\\/" + twoStar + "\\/)" + next;
          pp[i + 1] = GLOBSTAR;
        }
      });
      return pp.filter((p) => p !== GLOBSTAR).join("/");
    }).join("|");
    const [open, close] = set.length > 1 ? ["(?:", ")"] : ["", ""];
    re = "^" + open + re + close + "$";
    if (this.negate)
      re = "^(?!" + re + ").+$";
    try {
      this.regexp = new RegExp(re, [...flags].join(""));
    } catch (ex) {
      this.regexp = false;
    }
    return this.regexp;
  }
  slashSplit(p) {
    if (this.preserveMultipleSlashes) {
      return p.split("/");
    } else if (this.isWindows && /^\/\/[^\/]+/.test(p)) {
      return ["", ...p.split(/\/+/)];
    } else {
      return p.split(/\/+/);
    }
  }
  match(f, partial = this.partial) {
    this.debug("match", f, this.pattern);
    if (this.comment) {
      return false;
    }
    if (this.empty) {
      return f === "";
    }
    if (f === "/" && partial) {
      return true;
    }
    const options = this.options;
    if (this.isWindows) {
      f = f.split("\\").join("/");
    }
    const ff = this.slashSplit(f);
    this.debug(this.pattern, "split", ff);
    const set = this.set;
    this.debug(this.pattern, "set", set);
    let filename = ff[ff.length - 1];
    if (!filename) {
      for (let i = ff.length - 2; !filename && i >= 0; i--) {
        filename = ff[i];
      }
    }
    for (let i = 0; i < set.length; i++) {
      const pattern = set[i];
      let file = ff;
      if (options.matchBase && pattern.length === 1) {
        file = [filename];
      }
      const hit = this.matchOne(file, pattern, partial);
      if (hit) {
        if (options.flipNegate) {
          return true;
        }
        return !this.negate;
      }
    }
    if (options.flipNegate) {
      return false;
    }
    return this.negate;
  }
  static defaults(def) {
    return minimatch.defaults(def).Minimatch;
  }
};
minimatch.AST = AST;
minimatch.Minimatch = Minimatch;
minimatch.escape = escape2;
minimatch.unescape = unescape2;

// node_modules/glob/dist/esm/glob.js
import { fileURLToPath as fileURLToPath4 } from "node:url";

// node_modules/lru-cache/dist/esm/index.js
var perf = typeof performance === "object" && performance && typeof performance.now === "function" ? performance : Date;
var warned = /* @__PURE__ */ new Set();
var PROCESS = typeof process === "object" && !!process ? process : {};
var emitWarning = /* @__PURE__ */ __name((msg, type, code, fn) => {
  typeof PROCESS.emitWarning === "function" ? PROCESS.emitWarning(msg, type, code, fn) : console.error(`[${code}] ${type}: ${msg}`);
}, "emitWarning");
var AC = globalThis.AbortController;
var AS = globalThis.AbortSignal;
if (typeof AC === "undefined") {
  AS = class AbortSignal {
    static {
      __name(this, "AbortSignal");
    }
    onabort;
    _onabort = [];
    reason;
    aborted = false;
    addEventListener(_, fn) {
      this._onabort.push(fn);
    }
  };
  AC = class AbortController {
    static {
      __name(this, "AbortController");
    }
    constructor() {
      warnACPolyfill();
    }
    signal = new AS();
    abort(reason) {
      if (this.signal.aborted)
        return;
      this.signal.reason = reason;
      this.signal.aborted = true;
      for (const fn of this.signal._onabort) {
        fn(reason);
      }
      this.signal.onabort?.(reason);
    }
  };
  let printACPolyfillWarning = PROCESS.env?.LRU_CACHE_IGNORE_AC_WARNING !== "1";
  const warnACPolyfill = /* @__PURE__ */ __name(() => {
    if (!printACPolyfillWarning)
      return;
    printACPolyfillWarning = false;
    emitWarning("AbortController is not defined. If using lru-cache in node 14, load an AbortController polyfill from the `node-abort-controller` package. A minimal polyfill is provided for use by LRUCache.fetch(), but it should not be relied upon in other contexts (eg, passing it to other APIs that use AbortController/AbortSignal might have undesirable effects). You may disable this with LRU_CACHE_IGNORE_AC_WARNING=1 in the env.", "NO_ABORT_CONTROLLER", "ENOTSUP", warnACPolyfill);
  }, "warnACPolyfill");
}
var shouldWarn = /* @__PURE__ */ __name((code) => !warned.has(code), "shouldWarn");
var TYPE = Symbol("type");
var isPosInt = /* @__PURE__ */ __name((n) => n && n === Math.floor(n) && n > 0 && isFinite(n), "isPosInt");
var getUintArray = /* @__PURE__ */ __name((max) => !isPosInt(max) ? null : max <= Math.pow(2, 8) ? Uint8Array : max <= Math.pow(2, 16) ? Uint16Array : max <= Math.pow(2, 32) ? Uint32Array : max <= Number.MAX_SAFE_INTEGER ? ZeroArray : null, "getUintArray");
var ZeroArray = class extends Array {
  static {
    __name(this, "ZeroArray");
  }
  constructor(size) {
    super(size);
    this.fill(0);
  }
};
var Stack = class _Stack {
  static {
    __name(this, "Stack");
  }
  heap;
  length;
  // private constructor
  static #constructing = false;
  static create(max) {
    const HeapCls = getUintArray(max);
    if (!HeapCls)
      return [];
    _Stack.#constructing = true;
    const s = new _Stack(max, HeapCls);
    _Stack.#constructing = false;
    return s;
  }
  constructor(max, HeapCls) {
    if (!_Stack.#constructing) {
      throw new TypeError("instantiate Stack using Stack.create(n)");
    }
    this.heap = new HeapCls(max);
    this.length = 0;
  }
  push(n) {
    this.heap[this.length++] = n;
  }
  pop() {
    return this.heap[--this.length];
  }
};
var LRUCache = class _LRUCache {
  static {
    __name(this, "LRUCache");
  }
  // options that cannot be changed without disaster
  #max;
  #maxSize;
  #dispose;
  #disposeAfter;
  #fetchMethod;
  #memoMethod;
  /**
   * {@link LRUCache.OptionsBase.ttl}
   */
  ttl;
  /**
   * {@link LRUCache.OptionsBase.ttlResolution}
   */
  ttlResolution;
  /**
   * {@link LRUCache.OptionsBase.ttlAutopurge}
   */
  ttlAutopurge;
  /**
   * {@link LRUCache.OptionsBase.updateAgeOnGet}
   */
  updateAgeOnGet;
  /**
   * {@link LRUCache.OptionsBase.updateAgeOnHas}
   */
  updateAgeOnHas;
  /**
   * {@link LRUCache.OptionsBase.allowStale}
   */
  allowStale;
  /**
   * {@link LRUCache.OptionsBase.noDisposeOnSet}
   */
  noDisposeOnSet;
  /**
   * {@link LRUCache.OptionsBase.noUpdateTTL}
   */
  noUpdateTTL;
  /**
   * {@link LRUCache.OptionsBase.maxEntrySize}
   */
  maxEntrySize;
  /**
   * {@link LRUCache.OptionsBase.sizeCalculation}
   */
  sizeCalculation;
  /**
   * {@link LRUCache.OptionsBase.noDeleteOnFetchRejection}
   */
  noDeleteOnFetchRejection;
  /**
   * {@link LRUCache.OptionsBase.noDeleteOnStaleGet}
   */
  noDeleteOnStaleGet;
  /**
   * {@link LRUCache.OptionsBase.allowStaleOnFetchAbort}
   */
  allowStaleOnFetchAbort;
  /**
   * {@link LRUCache.OptionsBase.allowStaleOnFetchRejection}
   */
  allowStaleOnFetchRejection;
  /**
   * {@link LRUCache.OptionsBase.ignoreFetchAbort}
   */
  ignoreFetchAbort;
  // computed properties
  #size;
  #calculatedSize;
  #keyMap;
  #keyList;
  #valList;
  #next;
  #prev;
  #head;
  #tail;
  #free;
  #disposed;
  #sizes;
  #starts;
  #ttls;
  #hasDispose;
  #hasFetchMethod;
  #hasDisposeAfter;
  /**
   * Do not call this method unless you need to inspect the
   * inner workings of the cache.  If anything returned by this
   * object is modified in any way, strange breakage may occur.
   *
   * These fields are private for a reason!
   *
   * @internal
   */
  static unsafeExposeInternals(c) {
    return {
      // properties
      starts: c.#starts,
      ttls: c.#ttls,
      sizes: c.#sizes,
      keyMap: c.#keyMap,
      keyList: c.#keyList,
      valList: c.#valList,
      next: c.#next,
      prev: c.#prev,
      get head() {
        return c.#head;
      },
      get tail() {
        return c.#tail;
      },
      free: c.#free,
      // methods
      isBackgroundFetch: /* @__PURE__ */ __name((p) => c.#isBackgroundFetch(p), "isBackgroundFetch"),
      backgroundFetch: /* @__PURE__ */ __name((k, index, options, context) => c.#backgroundFetch(k, index, options, context), "backgroundFetch"),
      moveToTail: /* @__PURE__ */ __name((index) => c.#moveToTail(index), "moveToTail"),
      indexes: /* @__PURE__ */ __name((options) => c.#indexes(options), "indexes"),
      rindexes: /* @__PURE__ */ __name((options) => c.#rindexes(options), "rindexes"),
      isStale: /* @__PURE__ */ __name((index) => c.#isStale(index), "isStale")
    };
  }
  // Protected read-only members
  /**
   * {@link LRUCache.OptionsBase.max} (read-only)
   */
  get max() {
    return this.#max;
  }
  /**
   * {@link LRUCache.OptionsBase.maxSize} (read-only)
   */
  get maxSize() {
    return this.#maxSize;
  }
  /**
   * The total computed size of items in the cache (read-only)
   */
  get calculatedSize() {
    return this.#calculatedSize;
  }
  /**
   * The number of items stored in the cache (read-only)
   */
  get size() {
    return this.#size;
  }
  /**
   * {@link LRUCache.OptionsBase.fetchMethod} (read-only)
   */
  get fetchMethod() {
    return this.#fetchMethod;
  }
  get memoMethod() {
    return this.#memoMethod;
  }
  /**
   * {@link LRUCache.OptionsBase.dispose} (read-only)
   */
  get dispose() {
    return this.#dispose;
  }
  /**
   * {@link LRUCache.OptionsBase.disposeAfter} (read-only)
   */
  get disposeAfter() {
    return this.#disposeAfter;
  }
  constructor(options) {
    const { max = 0, ttl, ttlResolution = 1, ttlAutopurge, updateAgeOnGet, updateAgeOnHas, allowStale, dispose, disposeAfter, noDisposeOnSet, noUpdateTTL, maxSize = 0, maxEntrySize = 0, sizeCalculation, fetchMethod, memoMethod, noDeleteOnFetchRejection, noDeleteOnStaleGet, allowStaleOnFetchRejection, allowStaleOnFetchAbort, ignoreFetchAbort } = options;
    if (max !== 0 && !isPosInt(max)) {
      throw new TypeError("max option must be a nonnegative integer");
    }
    const UintArray = max ? getUintArray(max) : Array;
    if (!UintArray) {
      throw new Error("invalid max value: " + max);
    }
    this.#max = max;
    this.#maxSize = maxSize;
    this.maxEntrySize = maxEntrySize || this.#maxSize;
    this.sizeCalculation = sizeCalculation;
    if (this.sizeCalculation) {
      if (!this.#maxSize && !this.maxEntrySize) {
        throw new TypeError("cannot set sizeCalculation without setting maxSize or maxEntrySize");
      }
      if (typeof this.sizeCalculation !== "function") {
        throw new TypeError("sizeCalculation set to non-function");
      }
    }
    if (memoMethod !== void 0 && typeof memoMethod !== "function") {
      throw new TypeError("memoMethod must be a function if defined");
    }
    this.#memoMethod = memoMethod;
    if (fetchMethod !== void 0 && typeof fetchMethod !== "function") {
      throw new TypeError("fetchMethod must be a function if specified");
    }
    this.#fetchMethod = fetchMethod;
    this.#hasFetchMethod = !!fetchMethod;
    this.#keyMap = /* @__PURE__ */ new Map();
    this.#keyList = new Array(max).fill(void 0);
    this.#valList = new Array(max).fill(void 0);
    this.#next = new UintArray(max);
    this.#prev = new UintArray(max);
    this.#head = 0;
    this.#tail = 0;
    this.#free = Stack.create(max);
    this.#size = 0;
    this.#calculatedSize = 0;
    if (typeof dispose === "function") {
      this.#dispose = dispose;
    }
    if (typeof disposeAfter === "function") {
      this.#disposeAfter = disposeAfter;
      this.#disposed = [];
    } else {
      this.#disposeAfter = void 0;
      this.#disposed = void 0;
    }
    this.#hasDispose = !!this.#dispose;
    this.#hasDisposeAfter = !!this.#disposeAfter;
    this.noDisposeOnSet = !!noDisposeOnSet;
    this.noUpdateTTL = !!noUpdateTTL;
    this.noDeleteOnFetchRejection = !!noDeleteOnFetchRejection;
    this.allowStaleOnFetchRejection = !!allowStaleOnFetchRejection;
    this.allowStaleOnFetchAbort = !!allowStaleOnFetchAbort;
    this.ignoreFetchAbort = !!ignoreFetchAbort;
    if (this.maxEntrySize !== 0) {
      if (this.#maxSize !== 0) {
        if (!isPosInt(this.#maxSize)) {
          throw new TypeError("maxSize must be a positive integer if specified");
        }
      }
      if (!isPosInt(this.maxEntrySize)) {
        throw new TypeError("maxEntrySize must be a positive integer if specified");
      }
      this.#initializeSizeTracking();
    }
    this.allowStale = !!allowStale;
    this.noDeleteOnStaleGet = !!noDeleteOnStaleGet;
    this.updateAgeOnGet = !!updateAgeOnGet;
    this.updateAgeOnHas = !!updateAgeOnHas;
    this.ttlResolution = isPosInt(ttlResolution) || ttlResolution === 0 ? ttlResolution : 1;
    this.ttlAutopurge = !!ttlAutopurge;
    this.ttl = ttl || 0;
    if (this.ttl) {
      if (!isPosInt(this.ttl)) {
        throw new TypeError("ttl must be a positive integer if specified");
      }
      this.#initializeTTLTracking();
    }
    if (this.#max === 0 && this.ttl === 0 && this.#maxSize === 0) {
      throw new TypeError("At least one of max, maxSize, or ttl is required");
    }
    if (!this.ttlAutopurge && !this.#max && !this.#maxSize) {
      const code = "LRU_CACHE_UNBOUNDED";
      if (shouldWarn(code)) {
        warned.add(code);
        const msg = "TTL caching without ttlAutopurge, max, or maxSize can result in unbounded memory consumption.";
        emitWarning(msg, "UnboundedCacheWarning", code, _LRUCache);
      }
    }
  }
  /**
   * Return the number of ms left in the item's TTL. If item is not in cache,
   * returns `0`. Returns `Infinity` if item is in cache without a defined TTL.
   */
  getRemainingTTL(key) {
    return this.#keyMap.has(key) ? Infinity : 0;
  }
  #initializeTTLTracking() {
    const ttls = new ZeroArray(this.#max);
    const starts = new ZeroArray(this.#max);
    this.#ttls = ttls;
    this.#starts = starts;
    this.#setItemTTL = (index, ttl, start = perf.now()) => {
      starts[index] = ttl !== 0 ? start : 0;
      ttls[index] = ttl;
      if (ttl !== 0 && this.ttlAutopurge) {
        const t = setTimeout(() => {
          if (this.#isStale(index)) {
            this.#delete(this.#keyList[index], "expire");
          }
        }, ttl + 1);
        if (t.unref) {
          t.unref();
        }
      }
    };
    this.#updateItemAge = (index) => {
      starts[index] = ttls[index] !== 0 ? perf.now() : 0;
    };
    this.#statusTTL = (status, index) => {
      if (ttls[index]) {
        const ttl = ttls[index];
        const start = starts[index];
        if (!ttl || !start)
          return;
        status.ttl = ttl;
        status.start = start;
        status.now = cachedNow || getNow();
        const age = status.now - start;
        status.remainingTTL = ttl - age;
      }
    };
    let cachedNow = 0;
    const getNow = /* @__PURE__ */ __name(() => {
      const n = perf.now();
      if (this.ttlResolution > 0) {
        cachedNow = n;
        const t = setTimeout(() => cachedNow = 0, this.ttlResolution);
        if (t.unref) {
          t.unref();
        }
      }
      return n;
    }, "getNow");
    this.getRemainingTTL = (key) => {
      const index = this.#keyMap.get(key);
      if (index === void 0) {
        return 0;
      }
      const ttl = ttls[index];
      const start = starts[index];
      if (!ttl || !start) {
        return Infinity;
      }
      const age = (cachedNow || getNow()) - start;
      return ttl - age;
    };
    this.#isStale = (index) => {
      const s = starts[index];
      const t = ttls[index];
      return !!t && !!s && (cachedNow || getNow()) - s > t;
    };
  }
  // conditionally set private methods related to TTL
  #updateItemAge = /* @__PURE__ */ __name(() => {
  }, "#updateItemAge");
  #statusTTL = /* @__PURE__ */ __name(() => {
  }, "#statusTTL");
  #setItemTTL = /* @__PURE__ */ __name(() => {
  }, "#setItemTTL");
  /* c8 ignore stop */
  #isStale = /* @__PURE__ */ __name(() => false, "#isStale");
  #initializeSizeTracking() {
    const sizes = new ZeroArray(this.#max);
    this.#calculatedSize = 0;
    this.#sizes = sizes;
    this.#removeItemSize = (index) => {
      this.#calculatedSize -= sizes[index];
      sizes[index] = 0;
    };
    this.#requireSize = (k, v, size, sizeCalculation) => {
      if (this.#isBackgroundFetch(v)) {
        return 0;
      }
      if (!isPosInt(size)) {
        if (sizeCalculation) {
          if (typeof sizeCalculation !== "function") {
            throw new TypeError("sizeCalculation must be a function");
          }
          size = sizeCalculation(v, k);
          if (!isPosInt(size)) {
            throw new TypeError("sizeCalculation return invalid (expect positive integer)");
          }
        } else {
          throw new TypeError("invalid size value (must be positive integer). When maxSize or maxEntrySize is used, sizeCalculation or size must be set.");
        }
      }
      return size;
    };
    this.#addItemSize = (index, size, status) => {
      sizes[index] = size;
      if (this.#maxSize) {
        const maxSize = this.#maxSize - sizes[index];
        while (this.#calculatedSize > maxSize) {
          this.#evict(true);
        }
      }
      this.#calculatedSize += sizes[index];
      if (status) {
        status.entrySize = size;
        status.totalCalculatedSize = this.#calculatedSize;
      }
    };
  }
  #removeItemSize = /* @__PURE__ */ __name((_i) => {
  }, "#removeItemSize");
  #addItemSize = /* @__PURE__ */ __name((_i, _s, _st) => {
  }, "#addItemSize");
  #requireSize = /* @__PURE__ */ __name((_k, _v, size, sizeCalculation) => {
    if (size || sizeCalculation) {
      throw new TypeError("cannot set size without setting maxSize or maxEntrySize on cache");
    }
    return 0;
  }, "#requireSize");
  *#indexes({ allowStale = this.allowStale } = {}) {
    if (this.#size) {
      for (let i = this.#tail; true; ) {
        if (!this.#isValidIndex(i)) {
          break;
        }
        if (allowStale || !this.#isStale(i)) {
          yield i;
        }
        if (i === this.#head) {
          break;
        } else {
          i = this.#prev[i];
        }
      }
    }
  }
  *#rindexes({ allowStale = this.allowStale } = {}) {
    if (this.#size) {
      for (let i = this.#head; true; ) {
        if (!this.#isValidIndex(i)) {
          break;
        }
        if (allowStale || !this.#isStale(i)) {
          yield i;
        }
        if (i === this.#tail) {
          break;
        } else {
          i = this.#next[i];
        }
      }
    }
  }
  #isValidIndex(index) {
    return index !== void 0 && this.#keyMap.get(this.#keyList[index]) === index;
  }
  /**
   * Return a generator yielding `[key, value]` pairs,
   * in order from most recently used to least recently used.
   */
  *entries() {
    for (const i of this.#indexes()) {
      if (this.#valList[i] !== void 0 && this.#keyList[i] !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) {
        yield [this.#keyList[i], this.#valList[i]];
      }
    }
  }
  /**
   * Inverse order version of {@link LRUCache.entries}
   *
   * Return a generator yielding `[key, value]` pairs,
   * in order from least recently used to most recently used.
   */
  *rentries() {
    for (const i of this.#rindexes()) {
      if (this.#valList[i] !== void 0 && this.#keyList[i] !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) {
        yield [this.#keyList[i], this.#valList[i]];
      }
    }
  }
  /**
   * Return a generator yielding the keys in the cache,
   * in order from most recently used to least recently used.
   */
  *keys() {
    for (const i of this.#indexes()) {
      const k = this.#keyList[i];
      if (k !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) {
        yield k;
      }
    }
  }
  /**
   * Inverse order version of {@link LRUCache.keys}
   *
   * Return a generator yielding the keys in the cache,
   * in order from least recently used to most recently used.
   */
  *rkeys() {
    for (const i of this.#rindexes()) {
      const k = this.#keyList[i];
      if (k !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) {
        yield k;
      }
    }
  }
  /**
   * Return a generator yielding the values in the cache,
   * in order from most recently used to least recently used.
   */
  *values() {
    for (const i of this.#indexes()) {
      const v = this.#valList[i];
      if (v !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) {
        yield this.#valList[i];
      }
    }
  }
  /**
   * Inverse order version of {@link LRUCache.values}
   *
   * Return a generator yielding the values in the cache,
   * in order from least recently used to most recently used.
   */
  *rvalues() {
    for (const i of this.#rindexes()) {
      const v = this.#valList[i];
      if (v !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) {
        yield this.#valList[i];
      }
    }
  }
  /**
   * Iterating over the cache itself yields the same results as
   * {@link LRUCache.entries}
   */
  [Symbol.iterator]() {
    return this.entries();
  }
  /**
   * A String value that is used in the creation of the default string
   * description of an object. Called by the built-in method
   * `Object.prototype.toString`.
   */
  [Symbol.toStringTag] = "LRUCache";
  /**
   * Find a value for which the supplied fn method returns a truthy value,
   * similar to `Array.find()`. fn is called as `fn(value, key, cache)`.
   */
  find(fn, getOptions = {}) {
    for (const i of this.#indexes()) {
      const v = this.#valList[i];
      const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
      if (value === void 0)
        continue;
      if (fn(value, this.#keyList[i], this)) {
        return this.get(this.#keyList[i], getOptions);
      }
    }
  }
  /**
   * Call the supplied function on each item in the cache, in order from most
   * recently used to least recently used.
   *
   * `fn` is called as `fn(value, key, cache)`.
   *
   * If `thisp` is provided, function will be called in the `this`-context of
   * the provided object, or the cache if no `thisp` object is provided.
   *
   * Does not update age or recenty of use, or iterate over stale values.
   */
  forEach(fn, thisp = this) {
    for (const i of this.#indexes()) {
      const v = this.#valList[i];
      const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
      if (value === void 0)
        continue;
      fn.call(thisp, value, this.#keyList[i], this);
    }
  }
  /**
   * The same as {@link LRUCache.forEach} but items are iterated over in
   * reverse order.  (ie, less recently used items are iterated over first.)
   */
  rforEach(fn, thisp = this) {
    for (const i of this.#rindexes()) {
      const v = this.#valList[i];
      const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
      if (value === void 0)
        continue;
      fn.call(thisp, value, this.#keyList[i], this);
    }
  }
  /**
   * Delete any stale entries. Returns true if anything was removed,
   * false otherwise.
   */
  purgeStale() {
    let deleted = false;
    for (const i of this.#rindexes({ allowStale: true })) {
      if (this.#isStale(i)) {
        this.#delete(this.#keyList[i], "expire");
        deleted = true;
      }
    }
    return deleted;
  }
  /**
   * Get the extended info about a given entry, to get its value, size, and
   * TTL info simultaneously. Returns `undefined` if the key is not present.
   *
   * Unlike {@link LRUCache#dump}, which is designed to be portable and survive
   * serialization, the `start` value is always the current timestamp, and the
   * `ttl` is a calculated remaining time to live (negative if expired).
   *
   * Always returns stale values, if their info is found in the cache, so be
   * sure to check for expirations (ie, a negative {@link LRUCache.Entry#ttl})
   * if relevant.
   */
  info(key) {
    const i = this.#keyMap.get(key);
    if (i === void 0)
      return void 0;
    const v = this.#valList[i];
    const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
    if (value === void 0)
      return void 0;
    const entry = { value };
    if (this.#ttls && this.#starts) {
      const ttl = this.#ttls[i];
      const start = this.#starts[i];
      if (ttl && start) {
        const remain = ttl - (perf.now() - start);
        entry.ttl = remain;
        entry.start = Date.now();
      }
    }
    if (this.#sizes) {
      entry.size = this.#sizes[i];
    }
    return entry;
  }
  /**
   * Return an array of [key, {@link LRUCache.Entry}] tuples which can be
   * passed to {@link LRLUCache#load}.
   *
   * The `start` fields are calculated relative to a portable `Date.now()`
   * timestamp, even if `performance.now()` is available.
   *
   * Stale entries are always included in the `dump`, even if
   * {@link LRUCache.OptionsBase.allowStale} is false.
   *
   * Note: this returns an actual array, not a generator, so it can be more
   * easily passed around.
   */
  dump() {
    const arr = [];
    for (const i of this.#indexes({ allowStale: true })) {
      const key = this.#keyList[i];
      const v = this.#valList[i];
      const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
      if (value === void 0 || key === void 0)
        continue;
      const entry = { value };
      if (this.#ttls && this.#starts) {
        entry.ttl = this.#ttls[i];
        const age = perf.now() - this.#starts[i];
        entry.start = Math.floor(Date.now() - age);
      }
      if (this.#sizes) {
        entry.size = this.#sizes[i];
      }
      arr.unshift([key, entry]);
    }
    return arr;
  }
  /**
   * Reset the cache and load in the items in entries in the order listed.
   *
   * The shape of the resulting cache may be different if the same options are
   * not used in both caches.
   *
   * The `start` fields are assumed to be calculated relative to a portable
   * `Date.now()` timestamp, even if `performance.now()` is available.
   */
  load(arr) {
    this.clear();
    for (const [key, entry] of arr) {
      if (entry.start) {
        const age = Date.now() - entry.start;
        entry.start = perf.now() - age;
      }
      this.set(key, entry.value, entry);
    }
  }
  /**
   * Add a value to the cache.
   *
   * Note: if `undefined` is specified as a value, this is an alias for
   * {@link LRUCache#delete}
   *
   * Fields on the {@link LRUCache.SetOptions} options param will override
   * their corresponding values in the constructor options for the scope
   * of this single `set()` operation.
   *
   * If `start` is provided, then that will set the effective start
   * time for the TTL calculation. Note that this must be a previous
   * value of `performance.now()` if supported, or a previous value of
   * `Date.now()` if not.
   *
   * Options object may also include `size`, which will prevent
   * calling the `sizeCalculation` function and just use the specified
   * number if it is a positive integer, and `noDisposeOnSet` which
   * will prevent calling a `dispose` function in the case of
   * overwrites.
   *
   * If the `size` (or return value of `sizeCalculation`) for a given
   * entry is greater than `maxEntrySize`, then the item will not be
   * added to the cache.
   *
   * Will update the recency of the entry.
   *
   * If the value is `undefined`, then this is an alias for
   * `cache.delete(key)`. `undefined` is never stored in the cache.
   */
  set(k, v, setOptions = {}) {
    if (v === void 0) {
      this.delete(k);
      return this;
    }
    const { ttl = this.ttl, start, noDisposeOnSet = this.noDisposeOnSet, sizeCalculation = this.sizeCalculation, status } = setOptions;
    let { noUpdateTTL = this.noUpdateTTL } = setOptions;
    const size = this.#requireSize(k, v, setOptions.size || 0, sizeCalculation);
    if (this.maxEntrySize && size > this.maxEntrySize) {
      if (status) {
        status.set = "miss";
        status.maxEntrySizeExceeded = true;
      }
      this.#delete(k, "set");
      return this;
    }
    let index = this.#size === 0 ? void 0 : this.#keyMap.get(k);
    if (index === void 0) {
      index = this.#size === 0 ? this.#tail : this.#free.length !== 0 ? this.#free.pop() : this.#size === this.#max ? this.#evict(false) : this.#size;
      this.#keyList[index] = k;
      this.#valList[index] = v;
      this.#keyMap.set(k, index);
      this.#next[this.#tail] = index;
      this.#prev[index] = this.#tail;
      this.#tail = index;
      this.#size++;
      this.#addItemSize(index, size, status);
      if (status)
        status.set = "add";
      noUpdateTTL = false;
    } else {
      this.#moveToTail(index);
      const oldVal = this.#valList[index];
      if (v !== oldVal) {
        if (this.#hasFetchMethod && this.#isBackgroundFetch(oldVal)) {
          oldVal.__abortController.abort(new Error("replaced"));
          const { __staleWhileFetching: s } = oldVal;
          if (s !== void 0 && !noDisposeOnSet) {
            if (this.#hasDispose) {
              this.#dispose?.(s, k, "set");
            }
            if (this.#hasDisposeAfter) {
              this.#disposed?.push([s, k, "set"]);
            }
          }
        } else if (!noDisposeOnSet) {
          if (this.#hasDispose) {
            this.#dispose?.(oldVal, k, "set");
          }
          if (this.#hasDisposeAfter) {
            this.#disposed?.push([oldVal, k, "set"]);
          }
        }
        this.#removeItemSize(index);
        this.#addItemSize(index, size, status);
        this.#valList[index] = v;
        if (status) {
          status.set = "replace";
          const oldValue = oldVal && this.#isBackgroundFetch(oldVal) ? oldVal.__staleWhileFetching : oldVal;
          if (oldValue !== void 0)
            status.oldValue = oldValue;
        }
      } else if (status) {
        status.set = "update";
      }
    }
    if (ttl !== 0 && !this.#ttls) {
      this.#initializeTTLTracking();
    }
    if (this.#ttls) {
      if (!noUpdateTTL) {
        this.#setItemTTL(index, ttl, start);
      }
      if (status)
        this.#statusTTL(status, index);
    }
    if (!noDisposeOnSet && this.#hasDisposeAfter && this.#disposed) {
      const dt = this.#disposed;
      let task;
      while (task = dt?.shift()) {
        this.#disposeAfter?.(...task);
      }
    }
    return this;
  }
  /**
   * Evict the least recently used item, returning its value or
   * `undefined` if cache is empty.
   */
  pop() {
    try {
      while (this.#size) {
        const val = this.#valList[this.#head];
        this.#evict(true);
        if (this.#isBackgroundFetch(val)) {
          if (val.__staleWhileFetching) {
            return val.__staleWhileFetching;
          }
        } else if (val !== void 0) {
          return val;
        }
      }
    } finally {
      if (this.#hasDisposeAfter && this.#disposed) {
        const dt = this.#disposed;
        let task;
        while (task = dt?.shift()) {
          this.#disposeAfter?.(...task);
        }
      }
    }
  }
  #evict(free) {
    const head = this.#head;
    const k = this.#keyList[head];
    const v = this.#valList[head];
    if (this.#hasFetchMethod && this.#isBackgroundFetch(v)) {
      v.__abortController.abort(new Error("evicted"));
    } else if (this.#hasDispose || this.#hasDisposeAfter) {
      if (this.#hasDispose) {
        this.#dispose?.(v, k, "evict");
      }
      if (this.#hasDisposeAfter) {
        this.#disposed?.push([v, k, "evict"]);
      }
    }
    this.#removeItemSize(head);
    if (free) {
      this.#keyList[head] = void 0;
      this.#valList[head] = void 0;
      this.#free.push(head);
    }
    if (this.#size === 1) {
      this.#head = this.#tail = 0;
      this.#free.length = 0;
    } else {
      this.#head = this.#next[head];
    }
    this.#keyMap.delete(k);
    this.#size--;
    return head;
  }
  /**
   * Check if a key is in the cache, without updating the recency of use.
   * Will return false if the item is stale, even though it is technically
   * in the cache.
   *
   * Check if a key is in the cache, without updating the recency of
   * use. Age is updated if {@link LRUCache.OptionsBase.updateAgeOnHas} is set
   * to `true` in either the options or the constructor.
   *
   * Will return `false` if the item is stale, even though it is technically in
   * the cache. The difference can be determined (if it matters) by using a
   * `status` argument, and inspecting the `has` field.
   *
   * Will not update item age unless
   * {@link LRUCache.OptionsBase.updateAgeOnHas} is set.
   */
  has(k, hasOptions = {}) {
    const { updateAgeOnHas = this.updateAgeOnHas, status } = hasOptions;
    const index = this.#keyMap.get(k);
    if (index !== void 0) {
      const v = this.#valList[index];
      if (this.#isBackgroundFetch(v) && v.__staleWhileFetching === void 0) {
        return false;
      }
      if (!this.#isStale(index)) {
        if (updateAgeOnHas) {
          this.#updateItemAge(index);
        }
        if (status) {
          status.has = "hit";
          this.#statusTTL(status, index);
        }
        return true;
      } else if (status) {
        status.has = "stale";
        this.#statusTTL(status, index);
      }
    } else if (status) {
      status.has = "miss";
    }
    return false;
  }
  /**
   * Like {@link LRUCache#get} but doesn't update recency or delete stale
   * items.
   *
   * Returns `undefined` if the item is stale, unless
   * {@link LRUCache.OptionsBase.allowStale} is set.
   */
  peek(k, peekOptions = {}) {
    const { allowStale = this.allowStale } = peekOptions;
    const index = this.#keyMap.get(k);
    if (index === void 0 || !allowStale && this.#isStale(index)) {
      return;
    }
    const v = this.#valList[index];
    return this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
  }
  #backgroundFetch(k, index, options, context) {
    const v = index === void 0 ? void 0 : this.#valList[index];
    if (this.#isBackgroundFetch(v)) {
      return v;
    }
    const ac = new AC();
    const { signal } = options;
    signal?.addEventListener("abort", () => ac.abort(signal.reason), {
      signal: ac.signal
    });
    const fetchOpts = {
      signal: ac.signal,
      options,
      context
    };
    const cb = /* @__PURE__ */ __name((v2, updateCache = false) => {
      const { aborted } = ac.signal;
      const ignoreAbort = options.ignoreFetchAbort && v2 !== void 0;
      if (options.status) {
        if (aborted && !updateCache) {
          options.status.fetchAborted = true;
          options.status.fetchError = ac.signal.reason;
          if (ignoreAbort)
            options.status.fetchAbortIgnored = true;
        } else {
          options.status.fetchResolved = true;
        }
      }
      if (aborted && !ignoreAbort && !updateCache) {
        return fetchFail(ac.signal.reason);
      }
      const bf2 = p;
      if (this.#valList[index] === p) {
        if (v2 === void 0) {
          if (bf2.__staleWhileFetching) {
            this.#valList[index] = bf2.__staleWhileFetching;
          } else {
            this.#delete(k, "fetch");
          }
        } else {
          if (options.status)
            options.status.fetchUpdated = true;
          this.set(k, v2, fetchOpts.options);
        }
      }
      return v2;
    }, "cb");
    const eb = /* @__PURE__ */ __name((er) => {
      if (options.status) {
        options.status.fetchRejected = true;
        options.status.fetchError = er;
      }
      return fetchFail(er);
    }, "eb");
    const fetchFail = /* @__PURE__ */ __name((er) => {
      const { aborted } = ac.signal;
      const allowStaleAborted = aborted && options.allowStaleOnFetchAbort;
      const allowStale = allowStaleAborted || options.allowStaleOnFetchRejection;
      const noDelete = allowStale || options.noDeleteOnFetchRejection;
      const bf2 = p;
      if (this.#valList[index] === p) {
        const del = !noDelete || bf2.__staleWhileFetching === void 0;
        if (del) {
          this.#delete(k, "fetch");
        } else if (!allowStaleAborted) {
          this.#valList[index] = bf2.__staleWhileFetching;
        }
      }
      if (allowStale) {
        if (options.status && bf2.__staleWhileFetching !== void 0) {
          options.status.returnedStale = true;
        }
        return bf2.__staleWhileFetching;
      } else if (bf2.__returned === bf2) {
        throw er;
      }
    }, "fetchFail");
    const pcall = /* @__PURE__ */ __name((res, rej) => {
      const fmp = this.#fetchMethod?.(k, v, fetchOpts);
      if (fmp && fmp instanceof Promise) {
        fmp.then((v2) => res(v2 === void 0 ? void 0 : v2), rej);
      }
      ac.signal.addEventListener("abort", () => {
        if (!options.ignoreFetchAbort || options.allowStaleOnFetchAbort) {
          res(void 0);
          if (options.allowStaleOnFetchAbort) {
            res = /* @__PURE__ */ __name((v2) => cb(v2, true), "res");
          }
        }
      });
    }, "pcall");
    if (options.status)
      options.status.fetchDispatched = true;
    const p = new Promise(pcall).then(cb, eb);
    const bf = Object.assign(p, {
      __abortController: ac,
      __staleWhileFetching: v,
      __returned: void 0
    });
    if (index === void 0) {
      this.set(k, bf, { ...fetchOpts.options, status: void 0 });
      index = this.#keyMap.get(k);
    } else {
      this.#valList[index] = bf;
    }
    return bf;
  }
  #isBackgroundFetch(p) {
    if (!this.#hasFetchMethod)
      return false;
    const b = p;
    return !!b && b instanceof Promise && b.hasOwnProperty("__staleWhileFetching") && b.__abortController instanceof AC;
  }
  async fetch(k, fetchOptions = {}) {
    const {
      // get options
      allowStale = this.allowStale,
      updateAgeOnGet = this.updateAgeOnGet,
      noDeleteOnStaleGet = this.noDeleteOnStaleGet,
      // set options
      ttl = this.ttl,
      noDisposeOnSet = this.noDisposeOnSet,
      size = 0,
      sizeCalculation = this.sizeCalculation,
      noUpdateTTL = this.noUpdateTTL,
      // fetch exclusive options
      noDeleteOnFetchRejection = this.noDeleteOnFetchRejection,
      allowStaleOnFetchRejection = this.allowStaleOnFetchRejection,
      ignoreFetchAbort = this.ignoreFetchAbort,
      allowStaleOnFetchAbort = this.allowStaleOnFetchAbort,
      context,
      forceRefresh = false,
      status,
      signal
    } = fetchOptions;
    if (!this.#hasFetchMethod) {
      if (status)
        status.fetch = "get";
      return this.get(k, {
        allowStale,
        updateAgeOnGet,
        noDeleteOnStaleGet,
        status
      });
    }
    const options = {
      allowStale,
      updateAgeOnGet,
      noDeleteOnStaleGet,
      ttl,
      noDisposeOnSet,
      size,
      sizeCalculation,
      noUpdateTTL,
      noDeleteOnFetchRejection,
      allowStaleOnFetchRejection,
      allowStaleOnFetchAbort,
      ignoreFetchAbort,
      status,
      signal
    };
    let index = this.#keyMap.get(k);
    if (index === void 0) {
      if (status)
        status.fetch = "miss";
      const p = this.#backgroundFetch(k, index, options, context);
      return p.__returned = p;
    } else {
      const v = this.#valList[index];
      if (this.#isBackgroundFetch(v)) {
        const stale = allowStale && v.__staleWhileFetching !== void 0;
        if (status) {
          status.fetch = "inflight";
          if (stale)
            status.returnedStale = true;
        }
        return stale ? v.__staleWhileFetching : v.__returned = v;
      }
      const isStale = this.#isStale(index);
      if (!forceRefresh && !isStale) {
        if (status)
          status.fetch = "hit";
        this.#moveToTail(index);
        if (updateAgeOnGet) {
          this.#updateItemAge(index);
        }
        if (status)
          this.#statusTTL(status, index);
        return v;
      }
      const p = this.#backgroundFetch(k, index, options, context);
      const hasStale = p.__staleWhileFetching !== void 0;
      const staleVal = hasStale && allowStale;
      if (status) {
        status.fetch = isStale ? "stale" : "refresh";
        if (staleVal && isStale)
          status.returnedStale = true;
      }
      return staleVal ? p.__staleWhileFetching : p.__returned = p;
    }
  }
  async forceFetch(k, fetchOptions = {}) {
    const v = await this.fetch(k, fetchOptions);
    if (v === void 0)
      throw new Error("fetch() returned undefined");
    return v;
  }
  memo(k, memoOptions = {}) {
    const memoMethod = this.#memoMethod;
    if (!memoMethod) {
      throw new Error("no memoMethod provided to constructor");
    }
    const { context, forceRefresh, ...options } = memoOptions;
    const v = this.get(k, options);
    if (!forceRefresh && v !== void 0)
      return v;
    const vv = memoMethod(k, v, {
      options,
      context
    });
    this.set(k, vv, options);
    return vv;
  }
  /**
   * Return a value from the cache. Will update the recency of the cache
   * entry found.
   *
   * If the key is not found, get() will return `undefined`.
   */
  get(k, getOptions = {}) {
    const { allowStale = this.allowStale, updateAgeOnGet = this.updateAgeOnGet, noDeleteOnStaleGet = this.noDeleteOnStaleGet, status } = getOptions;
    const index = this.#keyMap.get(k);
    if (index !== void 0) {
      const value = this.#valList[index];
      const fetching = this.#isBackgroundFetch(value);
      if (status)
        this.#statusTTL(status, index);
      if (this.#isStale(index)) {
        if (status)
          status.get = "stale";
        if (!fetching) {
          if (!noDeleteOnStaleGet) {
            this.#delete(k, "expire");
          }
          if (status && allowStale)
            status.returnedStale = true;
          return allowStale ? value : void 0;
        } else {
          if (status && allowStale && value.__staleWhileFetching !== void 0) {
            status.returnedStale = true;
          }
          return allowStale ? value.__staleWhileFetching : void 0;
        }
      } else {
        if (status)
          status.get = "hit";
        if (fetching) {
          return value.__staleWhileFetching;
        }
        this.#moveToTail(index);
        if (updateAgeOnGet) {
          this.#updateItemAge(index);
        }
        return value;
      }
    } else if (status) {
      status.get = "miss";
    }
  }
  #connect(p, n) {
    this.#prev[n] = p;
    this.#next[p] = n;
  }
  #moveToTail(index) {
    if (index !== this.#tail) {
      if (index === this.#head) {
        this.#head = this.#next[index];
      } else {
        this.#connect(this.#prev[index], this.#next[index]);
      }
      this.#connect(this.#tail, index);
      this.#tail = index;
    }
  }
  /**
   * Deletes a key out of the cache.
   *
   * Returns true if the key was deleted, false otherwise.
   */
  delete(k) {
    return this.#delete(k, "delete");
  }
  #delete(k, reason) {
    let deleted = false;
    if (this.#size !== 0) {
      const index = this.#keyMap.get(k);
      if (index !== void 0) {
        deleted = true;
        if (this.#size === 1) {
          this.#clear(reason);
        } else {
          this.#removeItemSize(index);
          const v = this.#valList[index];
          if (this.#isBackgroundFetch(v)) {
            v.__abortController.abort(new Error("deleted"));
          } else if (this.#hasDispose || this.#hasDisposeAfter) {
            if (this.#hasDispose) {
              this.#dispose?.(v, k, reason);
            }
            if (this.#hasDisposeAfter) {
              this.#disposed?.push([v, k, reason]);
            }
          }
          this.#keyMap.delete(k);
          this.#keyList[index] = void 0;
          this.#valList[index] = void 0;
          if (index === this.#tail) {
            this.#tail = this.#prev[index];
          } else if (index === this.#head) {
            this.#head = this.#next[index];
          } else {
            const pi = this.#prev[index];
            this.#next[pi] = this.#next[index];
            const ni = this.#next[index];
            this.#prev[ni] = this.#prev[index];
          }
          this.#size--;
          this.#free.push(index);
        }
      }
    }
    if (this.#hasDisposeAfter && this.#disposed?.length) {
      const dt = this.#disposed;
      let task;
      while (task = dt?.shift()) {
        this.#disposeAfter?.(...task);
      }
    }
    return deleted;
  }
  /**
   * Clear the cache entirely, throwing away all values.
   */
  clear() {
    return this.#clear("delete");
  }
  #clear(reason) {
    for (const index of this.#rindexes({ allowStale: true })) {
      const v = this.#valList[index];
      if (this.#isBackgroundFetch(v)) {
        v.__abortController.abort(new Error("deleted"));
      } else {
        const k = this.#keyList[index];
        if (this.#hasDispose) {
          this.#dispose?.(v, k, reason);
        }
        if (this.#hasDisposeAfter) {
          this.#disposed?.push([v, k, reason]);
        }
      }
    }
    this.#keyMap.clear();
    this.#valList.fill(void 0);
    this.#keyList.fill(void 0);
    if (this.#ttls && this.#starts) {
      this.#ttls.fill(0);
      this.#starts.fill(0);
    }
    if (this.#sizes) {
      this.#sizes.fill(0);
    }
    this.#head = 0;
    this.#tail = 0;
    this.#free.length = 0;
    this.#calculatedSize = 0;
    this.#size = 0;
    if (this.#hasDisposeAfter && this.#disposed) {
      const dt = this.#disposed;
      let task;
      while (task = dt?.shift()) {
        this.#disposeAfter?.(...task);
      }
    }
  }
};

// node_modules/path-scurry/dist/esm/index.js
import { posix, win32 } from "node:path";
import { fileURLToPath as fileURLToPath3 } from "node:url";
import { lstatSync, readdir as readdirCB, readdirSync, readlinkSync, realpathSync as rps } from "fs";
import * as actualFS from "node:fs";
import { lstat, readdir, readlink, realpath } from "node:fs/promises";

// node_modules/minipass/dist/esm/index.js
import { EventEmitter } from "node:events";
import Stream from "node:stream";
import { StringDecoder } from "node:string_decoder";
var proc = typeof process === "object" && process ? process : {
  stdout: null,
  stderr: null
};
var isStream = /* @__PURE__ */ __name((s) => !!s && typeof s === "object" && (s instanceof Minipass || s instanceof Stream || isReadable(s) || isWritable(s)), "isStream");
var isReadable = /* @__PURE__ */ __name((s) => !!s && typeof s === "object" && s instanceof EventEmitter && typeof s.pipe === "function" && // node core Writable streams have a pipe() method, but it throws
s.pipe !== Stream.Writable.prototype.pipe, "isReadable");
var isWritable = /* @__PURE__ */ __name((s) => !!s && typeof s === "object" && s instanceof EventEmitter && typeof s.write === "function" && typeof s.end === "function", "isWritable");
var EOF = Symbol("EOF");
var MAYBE_EMIT_END = Symbol("maybeEmitEnd");
var EMITTED_END = Symbol("emittedEnd");
var EMITTING_END = Symbol("emittingEnd");
var EMITTED_ERROR = Symbol("emittedError");
var CLOSED = Symbol("closed");
var READ = Symbol("read");
var FLUSH = Symbol("flush");
var FLUSHCHUNK = Symbol("flushChunk");
var ENCODING = Symbol("encoding");
var DECODER = Symbol("decoder");
var FLOWING = Symbol("flowing");
var PAUSED = Symbol("paused");
var RESUME = Symbol("resume");
var BUFFER = Symbol("buffer");
var PIPES = Symbol("pipes");
var BUFFERLENGTH = Symbol("bufferLength");
var BUFFERPUSH = Symbol("bufferPush");
var BUFFERSHIFT = Symbol("bufferShift");
var OBJECTMODE = Symbol("objectMode");
var DESTROYED = Symbol("destroyed");
var ERROR = Symbol("error");
var EMITDATA = Symbol("emitData");
var EMITEND = Symbol("emitEnd");
var EMITEND2 = Symbol("emitEnd2");
var ASYNC = Symbol("async");
var ABORT = Symbol("abort");
var ABORTED = Symbol("aborted");
var SIGNAL = Symbol("signal");
var DATALISTENERS = Symbol("dataListeners");
var DISCARDED = Symbol("discarded");
var defer = /* @__PURE__ */ __name((fn) => Promise.resolve().then(fn), "defer");
var nodefer = /* @__PURE__ */ __name((fn) => fn(), "nodefer");
var isEndish = /* @__PURE__ */ __name((ev) => ev === "end" || ev === "finish" || ev === "prefinish", "isEndish");
var isArrayBufferLike = /* @__PURE__ */ __name((b) => b instanceof ArrayBuffer || !!b && typeof b === "object" && b.constructor && b.constructor.name === "ArrayBuffer" && b.byteLength >= 0, "isArrayBufferLike");
var isArrayBufferView = /* @__PURE__ */ __name((b) => !Buffer.isBuffer(b) && ArrayBuffer.isView(b), "isArrayBufferView");
var Pipe = class {
  static {
    __name(this, "Pipe");
  }
  src;
  dest;
  opts;
  ondrain;
  constructor(src, dest, opts) {
    this.src = src;
    this.dest = dest;
    this.opts = opts;
    this.ondrain = () => src[RESUME]();
    this.dest.on("drain", this.ondrain);
  }
  unpipe() {
    this.dest.removeListener("drain", this.ondrain);
  }
  // only here for the prototype
  /* c8 ignore start */
  proxyErrors(_er) {
  }
  /* c8 ignore stop */
  end() {
    this.unpipe();
    if (this.opts.end)
      this.dest.end();
  }
};
var PipeProxyErrors = class extends Pipe {
  static {
    __name(this, "PipeProxyErrors");
  }
  unpipe() {
    this.src.removeListener("error", this.proxyErrors);
    super.unpipe();
  }
  constructor(src, dest, opts) {
    super(src, dest, opts);
    this.proxyErrors = (er) => dest.emit("error", er);
    src.on("error", this.proxyErrors);
  }
};
var isObjectModeOptions = /* @__PURE__ */ __name((o) => !!o.objectMode, "isObjectModeOptions");
var isEncodingOptions = /* @__PURE__ */ __name((o) => !o.objectMode && !!o.encoding && o.encoding !== "buffer", "isEncodingOptions");
var Minipass = class extends EventEmitter {
  static {
    __name(this, "Minipass");
  }
  [FLOWING] = false;
  [PAUSED] = false;
  [PIPES] = [];
  [BUFFER] = [];
  [OBJECTMODE];
  [ENCODING];
  [ASYNC];
  [DECODER];
  [EOF] = false;
  [EMITTED_END] = false;
  [EMITTING_END] = false;
  [CLOSED] = false;
  [EMITTED_ERROR] = null;
  [BUFFERLENGTH] = 0;
  [DESTROYED] = false;
  [SIGNAL];
  [ABORTED] = false;
  [DATALISTENERS] = 0;
  [DISCARDED] = false;
  /**
   * true if the stream can be written
   */
  writable = true;
  /**
   * true if the stream can be read
   */
  readable = true;
  /**
   * If `RType` is Buffer, then options do not need to be provided.
   * Otherwise, an options object must be provided to specify either
   * {@link Minipass.SharedOptions.objectMode} or
   * {@link Minipass.SharedOptions.encoding}, as appropriate.
   */
  constructor(...args) {
    const options = args[0] || {};
    super();
    if (options.objectMode && typeof options.encoding === "string") {
      throw new TypeError("Encoding and objectMode may not be used together");
    }
    if (isObjectModeOptions(options)) {
      this[OBJECTMODE] = true;
      this[ENCODING] = null;
    } else if (isEncodingOptions(options)) {
      this[ENCODING] = options.encoding;
      this[OBJECTMODE] = false;
    } else {
      this[OBJECTMODE] = false;
      this[ENCODING] = null;
    }
    this[ASYNC] = !!options.async;
    this[DECODER] = this[ENCODING] ? new StringDecoder(this[ENCODING]) : null;
    if (options && options.debugExposeBuffer === true) {
      Object.defineProperty(this, "buffer", { get: /* @__PURE__ */ __name(() => this[BUFFER], "get") });
    }
    if (options && options.debugExposePipes === true) {
      Object.defineProperty(this, "pipes", { get: /* @__PURE__ */ __name(() => this[PIPES], "get") });
    }
    const { signal } = options;
    if (signal) {
      this[SIGNAL] = signal;
      if (signal.aborted) {
        this[ABORT]();
      } else {
        signal.addEventListener("abort", () => this[ABORT]());
      }
    }
  }
  /**
   * The amount of data stored in the buffer waiting to be read.
   *
   * For Buffer strings, this will be the total byte length.
   * For string encoding streams, this will be the string character length,
   * according to JavaScript's `string.length` logic.
   * For objectMode streams, this is a count of the items waiting to be
   * emitted.
   */
  get bufferLength() {
    return this[BUFFERLENGTH];
  }
  /**
   * The `BufferEncoding` currently in use, or `null`
   */
  get encoding() {
    return this[ENCODING];
  }
  /**
   * @deprecated - This is a read only property
   */
  set encoding(_enc) {
    throw new Error("Encoding must be set at instantiation time");
  }
  /**
   * @deprecated - Encoding may only be set at instantiation time
   */
  setEncoding(_enc) {
    throw new Error("Encoding must be set at instantiation time");
  }
  /**
   * True if this is an objectMode stream
   */
  get objectMode() {
    return this[OBJECTMODE];
  }
  /**
   * @deprecated - This is a read-only property
   */
  set objectMode(_om) {
    throw new Error("objectMode must be set at instantiation time");
  }
  /**
   * true if this is an async stream
   */
  get ["async"]() {
    return this[ASYNC];
  }
  /**
   * Set to true to make this stream async.
   *
   * Once set, it cannot be unset, as this would potentially cause incorrect
   * behavior.  Ie, a sync stream can be made async, but an async stream
   * cannot be safely made sync.
   */
  set ["async"](a) {
    this[ASYNC] = this[ASYNC] || !!a;
  }
  // drop everything and get out of the flow completely
  [ABORT]() {
    this[ABORTED] = true;
    this.emit("abort", this[SIGNAL]?.reason);
    this.destroy(this[SIGNAL]?.reason);
  }
  /**
   * True if the stream has been aborted.
   */
  get aborted() {
    return this[ABORTED];
  }
  /**
   * No-op setter. Stream aborted status is set via the AbortSignal provided
   * in the constructor options.
   */
  set aborted(_) {
  }
  write(chunk, encoding, cb) {
    if (this[ABORTED])
      return false;
    if (this[EOF])
      throw new Error("write after end");
    if (this[DESTROYED]) {
      this.emit("error", Object.assign(new Error("Cannot call write after a stream was destroyed"), { code: "ERR_STREAM_DESTROYED" }));
      return true;
    }
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = "utf8";
    }
    if (!encoding)
      encoding = "utf8";
    const fn = this[ASYNC] ? defer : nodefer;
    if (!this[OBJECTMODE] && !Buffer.isBuffer(chunk)) {
      if (isArrayBufferView(chunk)) {
        chunk = Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
      } else if (isArrayBufferLike(chunk)) {
        chunk = Buffer.from(chunk);
      } else if (typeof chunk !== "string") {
        throw new Error("Non-contiguous data written to non-objectMode stream");
      }
    }
    if (this[OBJECTMODE]) {
      if (this[FLOWING] && this[BUFFERLENGTH] !== 0)
        this[FLUSH](true);
      if (this[FLOWING])
        this.emit("data", chunk);
      else
        this[BUFFERPUSH](chunk);
      if (this[BUFFERLENGTH] !== 0)
        this.emit("readable");
      if (cb)
        fn(cb);
      return this[FLOWING];
    }
    if (!chunk.length) {
      if (this[BUFFERLENGTH] !== 0)
        this.emit("readable");
      if (cb)
        fn(cb);
      return this[FLOWING];
    }
    if (typeof chunk === "string" && // unless it is a string already ready for us to use
    !(encoding === this[ENCODING] && !this[DECODER]?.lastNeed)) {
      chunk = Buffer.from(chunk, encoding);
    }
    if (Buffer.isBuffer(chunk) && this[ENCODING]) {
      chunk = this[DECODER].write(chunk);
    }
    if (this[FLOWING] && this[BUFFERLENGTH] !== 0)
      this[FLUSH](true);
    if (this[FLOWING])
      this.emit("data", chunk);
    else
      this[BUFFERPUSH](chunk);
    if (this[BUFFERLENGTH] !== 0)
      this.emit("readable");
    if (cb)
      fn(cb);
    return this[FLOWING];
  }
  /**
   * Low-level explicit read method.
   *
   * In objectMode, the argument is ignored, and one item is returned if
   * available.
   *
   * `n` is the number of bytes (or in the case of encoding streams,
   * characters) to consume. If `n` is not provided, then the entire buffer
   * is returned, or `null` is returned if no data is available.
   *
   * If `n` is greater that the amount of data in the internal buffer,
   * then `null` is returned.
   */
  read(n) {
    if (this[DESTROYED])
      return null;
    this[DISCARDED] = false;
    if (this[BUFFERLENGTH] === 0 || n === 0 || n && n > this[BUFFERLENGTH]) {
      this[MAYBE_EMIT_END]();
      return null;
    }
    if (this[OBJECTMODE])
      n = null;
    if (this[BUFFER].length > 1 && !this[OBJECTMODE]) {
      this[BUFFER] = [
        this[ENCODING] ? this[BUFFER].join("") : Buffer.concat(this[BUFFER], this[BUFFERLENGTH])
      ];
    }
    const ret = this[READ](n || null, this[BUFFER][0]);
    this[MAYBE_EMIT_END]();
    return ret;
  }
  [READ](n, chunk) {
    if (this[OBJECTMODE])
      this[BUFFERSHIFT]();
    else {
      const c = chunk;
      if (n === c.length || n === null)
        this[BUFFERSHIFT]();
      else if (typeof c === "string") {
        this[BUFFER][0] = c.slice(n);
        chunk = c.slice(0, n);
        this[BUFFERLENGTH] -= n;
      } else {
        this[BUFFER][0] = c.subarray(n);
        chunk = c.subarray(0, n);
        this[BUFFERLENGTH] -= n;
      }
    }
    this.emit("data", chunk);
    if (!this[BUFFER].length && !this[EOF])
      this.emit("drain");
    return chunk;
  }
  end(chunk, encoding, cb) {
    if (typeof chunk === "function") {
      cb = chunk;
      chunk = void 0;
    }
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = "utf8";
    }
    if (chunk !== void 0)
      this.write(chunk, encoding);
    if (cb)
      this.once("end", cb);
    this[EOF] = true;
    this.writable = false;
    if (this[FLOWING] || !this[PAUSED])
      this[MAYBE_EMIT_END]();
    return this;
  }
  // don't let the internal resume be overwritten
  [RESUME]() {
    if (this[DESTROYED])
      return;
    if (!this[DATALISTENERS] && !this[PIPES].length) {
      this[DISCARDED] = true;
    }
    this[PAUSED] = false;
    this[FLOWING] = true;
    this.emit("resume");
    if (this[BUFFER].length)
      this[FLUSH]();
    else if (this[EOF])
      this[MAYBE_EMIT_END]();
    else
      this.emit("drain");
  }
  /**
   * Resume the stream if it is currently in a paused state
   *
   * If called when there are no pipe destinations or `data` event listeners,
   * this will place the stream in a "discarded" state, where all data will
   * be thrown away. The discarded state is removed if a pipe destination or
   * data handler is added, if pause() is called, or if any synchronous or
   * asynchronous iteration is started.
   */
  resume() {
    return this[RESUME]();
  }
  /**
   * Pause the stream
   */
  pause() {
    this[FLOWING] = false;
    this[PAUSED] = true;
    this[DISCARDED] = false;
  }
  /**
   * true if the stream has been forcibly destroyed
   */
  get destroyed() {
    return this[DESTROYED];
  }
  /**
   * true if the stream is currently in a flowing state, meaning that
   * any writes will be immediately emitted.
   */
  get flowing() {
    return this[FLOWING];
  }
  /**
   * true if the stream is currently in a paused state
   */
  get paused() {
    return this[PAUSED];
  }
  [BUFFERPUSH](chunk) {
    if (this[OBJECTMODE])
      this[BUFFERLENGTH] += 1;
    else
      this[BUFFERLENGTH] += chunk.length;
    this[BUFFER].push(chunk);
  }
  [BUFFERSHIFT]() {
    if (this[OBJECTMODE])
      this[BUFFERLENGTH] -= 1;
    else
      this[BUFFERLENGTH] -= this[BUFFER][0].length;
    return this[BUFFER].shift();
  }
  [FLUSH](noDrain = false) {
    do {
    } while (this[FLUSHCHUNK](this[BUFFERSHIFT]()) && this[BUFFER].length);
    if (!noDrain && !this[BUFFER].length && !this[EOF])
      this.emit("drain");
  }
  [FLUSHCHUNK](chunk) {
    this.emit("data", chunk);
    return this[FLOWING];
  }
  /**
   * Pipe all data emitted by this stream into the destination provided.
   *
   * Triggers the flow of data.
   */
  pipe(dest, opts) {
    if (this[DESTROYED])
      return dest;
    this[DISCARDED] = false;
    const ended = this[EMITTED_END];
    opts = opts || {};
    if (dest === proc.stdout || dest === proc.stderr)
      opts.end = false;
    else
      opts.end = opts.end !== false;
    opts.proxyErrors = !!opts.proxyErrors;
    if (ended) {
      if (opts.end)
        dest.end();
    } else {
      this[PIPES].push(!opts.proxyErrors ? new Pipe(this, dest, opts) : new PipeProxyErrors(this, dest, opts));
      if (this[ASYNC])
        defer(() => this[RESUME]());
      else
        this[RESUME]();
    }
    return dest;
  }
  /**
   * Fully unhook a piped destination stream.
   *
   * If the destination stream was the only consumer of this stream (ie,
   * there are no other piped destinations or `'data'` event listeners)
   * then the flow of data will stop until there is another consumer or
   * {@link Minipass#resume} is explicitly called.
   */
  unpipe(dest) {
    const p = this[PIPES].find((p2) => p2.dest === dest);
    if (p) {
      if (this[PIPES].length === 1) {
        if (this[FLOWING] && this[DATALISTENERS] === 0) {
          this[FLOWING] = false;
        }
        this[PIPES] = [];
      } else
        this[PIPES].splice(this[PIPES].indexOf(p), 1);
      p.unpipe();
    }
  }
  /**
   * Alias for {@link Minipass#on}
   */
  addListener(ev, handler) {
    return this.on(ev, handler);
  }
  /**
   * Mostly identical to `EventEmitter.on`, with the following
   * behavior differences to prevent data loss and unnecessary hangs:
   *
   * - Adding a 'data' event handler will trigger the flow of data
   *
   * - Adding a 'readable' event handler when there is data waiting to be read
   *   will cause 'readable' to be emitted immediately.
   *
   * - Adding an 'endish' event handler ('end', 'finish', etc.) which has
   *   already passed will cause the event to be emitted immediately and all
   *   handlers removed.
   *
   * - Adding an 'error' event handler after an error has been emitted will
   *   cause the event to be re-emitted immediately with the error previously
   *   raised.
   */
  on(ev, handler) {
    const ret = super.on(ev, handler);
    if (ev === "data") {
      this[DISCARDED] = false;
      this[DATALISTENERS]++;
      if (!this[PIPES].length && !this[FLOWING]) {
        this[RESUME]();
      }
    } else if (ev === "readable" && this[BUFFERLENGTH] !== 0) {
      super.emit("readable");
    } else if (isEndish(ev) && this[EMITTED_END]) {
      super.emit(ev);
      this.removeAllListeners(ev);
    } else if (ev === "error" && this[EMITTED_ERROR]) {
      const h = handler;
      if (this[ASYNC])
        defer(() => h.call(this, this[EMITTED_ERROR]));
      else
        h.call(this, this[EMITTED_ERROR]);
    }
    return ret;
  }
  /**
   * Alias for {@link Minipass#off}
   */
  removeListener(ev, handler) {
    return this.off(ev, handler);
  }
  /**
   * Mostly identical to `EventEmitter.off`
   *
   * If a 'data' event handler is removed, and it was the last consumer
   * (ie, there are no pipe destinations or other 'data' event listeners),
   * then the flow of data will stop until there is another consumer or
   * {@link Minipass#resume} is explicitly called.
   */
  off(ev, handler) {
    const ret = super.off(ev, handler);
    if (ev === "data") {
      this[DATALISTENERS] = this.listeners("data").length;
      if (this[DATALISTENERS] === 0 && !this[DISCARDED] && !this[PIPES].length) {
        this[FLOWING] = false;
      }
    }
    return ret;
  }
  /**
   * Mostly identical to `EventEmitter.removeAllListeners`
   *
   * If all 'data' event handlers are removed, and they were the last consumer
   * (ie, there are no pipe destinations), then the flow of data will stop
   * until there is another consumer or {@link Minipass#resume} is explicitly
   * called.
   */
  removeAllListeners(ev) {
    const ret = super.removeAllListeners(ev);
    if (ev === "data" || ev === void 0) {
      this[DATALISTENERS] = 0;
      if (!this[DISCARDED] && !this[PIPES].length) {
        this[FLOWING] = false;
      }
    }
    return ret;
  }
  /**
   * true if the 'end' event has been emitted
   */
  get emittedEnd() {
    return this[EMITTED_END];
  }
  [MAYBE_EMIT_END]() {
    if (!this[EMITTING_END] && !this[EMITTED_END] && !this[DESTROYED] && this[BUFFER].length === 0 && this[EOF]) {
      this[EMITTING_END] = true;
      this.emit("end");
      this.emit("prefinish");
      this.emit("finish");
      if (this[CLOSED])
        this.emit("close");
      this[EMITTING_END] = false;
    }
  }
  /**
   * Mostly identical to `EventEmitter.emit`, with the following
   * behavior differences to prevent data loss and unnecessary hangs:
   *
   * If the stream has been destroyed, and the event is something other
   * than 'close' or 'error', then `false` is returned and no handlers
   * are called.
   *
   * If the event is 'end', and has already been emitted, then the event
   * is ignored. If the stream is in a paused or non-flowing state, then
   * the event will be deferred until data flow resumes. If the stream is
   * async, then handlers will be called on the next tick rather than
   * immediately.
   *
   * If the event is 'close', and 'end' has not yet been emitted, then
   * the event will be deferred until after 'end' is emitted.
   *
   * If the event is 'error', and an AbortSignal was provided for the stream,
   * and there are no listeners, then the event is ignored, matching the
   * behavior of node core streams in the presense of an AbortSignal.
   *
   * If the event is 'finish' or 'prefinish', then all listeners will be
   * removed after emitting the event, to prevent double-firing.
   */
  emit(ev, ...args) {
    const data = args[0];
    if (ev !== "error" && ev !== "close" && ev !== DESTROYED && this[DESTROYED]) {
      return false;
    } else if (ev === "data") {
      return !this[OBJECTMODE] && !data ? false : this[ASYNC] ? (defer(() => this[EMITDATA](data)), true) : this[EMITDATA](data);
    } else if (ev === "end") {
      return this[EMITEND]();
    } else if (ev === "close") {
      this[CLOSED] = true;
      if (!this[EMITTED_END] && !this[DESTROYED])
        return false;
      const ret2 = super.emit("close");
      this.removeAllListeners("close");
      return ret2;
    } else if (ev === "error") {
      this[EMITTED_ERROR] = data;
      super.emit(ERROR, data);
      const ret2 = !this[SIGNAL] || this.listeners("error").length ? super.emit("error", data) : false;
      this[MAYBE_EMIT_END]();
      return ret2;
    } else if (ev === "resume") {
      const ret2 = super.emit("resume");
      this[MAYBE_EMIT_END]();
      return ret2;
    } else if (ev === "finish" || ev === "prefinish") {
      const ret2 = super.emit(ev);
      this.removeAllListeners(ev);
      return ret2;
    }
    const ret = super.emit(ev, ...args);
    this[MAYBE_EMIT_END]();
    return ret;
  }
  [EMITDATA](data) {
    for (const p of this[PIPES]) {
      if (p.dest.write(data) === false)
        this.pause();
    }
    const ret = this[DISCARDED] ? false : super.emit("data", data);
    this[MAYBE_EMIT_END]();
    return ret;
  }
  [EMITEND]() {
    if (this[EMITTED_END])
      return false;
    this[EMITTED_END] = true;
    this.readable = false;
    return this[ASYNC] ? (defer(() => this[EMITEND2]()), true) : this[EMITEND2]();
  }
  [EMITEND2]() {
    if (this[DECODER]) {
      const data = this[DECODER].end();
      if (data) {
        for (const p of this[PIPES]) {
          p.dest.write(data);
        }
        if (!this[DISCARDED])
          super.emit("data", data);
      }
    }
    for (const p of this[PIPES]) {
      p.end();
    }
    const ret = super.emit("end");
    this.removeAllListeners("end");
    return ret;
  }
  /**
   * Return a Promise that resolves to an array of all emitted data once
   * the stream ends.
   */
  async collect() {
    const buf = Object.assign([], {
      dataLength: 0
    });
    if (!this[OBJECTMODE])
      buf.dataLength = 0;
    const p = this.promise();
    this.on("data", (c) => {
      buf.push(c);
      if (!this[OBJECTMODE])
        buf.dataLength += c.length;
    });
    await p;
    return buf;
  }
  /**
   * Return a Promise that resolves to the concatenation of all emitted data
   * once the stream ends.
   *
   * Not allowed on objectMode streams.
   */
  async concat() {
    if (this[OBJECTMODE]) {
      throw new Error("cannot concat in objectMode");
    }
    const buf = await this.collect();
    return this[ENCODING] ? buf.join("") : Buffer.concat(buf, buf.dataLength);
  }
  /**
   * Return a void Promise that resolves once the stream ends.
   */
  async promise() {
    return new Promise((resolve2, reject) => {
      this.on(DESTROYED, () => reject(new Error("stream destroyed")));
      this.on("error", (er) => reject(er));
      this.on("end", () => resolve2());
    });
  }
  /**
   * Asynchronous `for await of` iteration.
   *
   * This will continue emitting all chunks until the stream terminates.
   */
  [Symbol.asyncIterator]() {
    this[DISCARDED] = false;
    let stopped = false;
    const stop = /* @__PURE__ */ __name(async () => {
      this.pause();
      stopped = true;
      return { value: void 0, done: true };
    }, "stop");
    const next = /* @__PURE__ */ __name(() => {
      if (stopped)
        return stop();
      const res = this.read();
      if (res !== null)
        return Promise.resolve({ done: false, value: res });
      if (this[EOF])
        return stop();
      let resolve2;
      let reject;
      const onerr = /* @__PURE__ */ __name((er) => {
        this.off("data", ondata);
        this.off("end", onend);
        this.off(DESTROYED, ondestroy);
        stop();
        reject(er);
      }, "onerr");
      const ondata = /* @__PURE__ */ __name((value) => {
        this.off("error", onerr);
        this.off("end", onend);
        this.off(DESTROYED, ondestroy);
        this.pause();
        resolve2({ value, done: !!this[EOF] });
      }, "ondata");
      const onend = /* @__PURE__ */ __name(() => {
        this.off("error", onerr);
        this.off("data", ondata);
        this.off(DESTROYED, ondestroy);
        stop();
        resolve2({ done: true, value: void 0 });
      }, "onend");
      const ondestroy = /* @__PURE__ */ __name(() => onerr(new Error("stream destroyed")), "ondestroy");
      return new Promise((res2, rej) => {
        reject = rej;
        resolve2 = res2;
        this.once(DESTROYED, ondestroy);
        this.once("error", onerr);
        this.once("end", onend);
        this.once("data", ondata);
      });
    }, "next");
    return {
      next,
      throw: stop,
      return: stop,
      [Symbol.asyncIterator]() {
        return this;
      }
    };
  }
  /**
   * Synchronous `for of` iteration.
   *
   * The iteration will terminate when the internal buffer runs out, even
   * if the stream has not yet terminated.
   */
  [Symbol.iterator]() {
    this[DISCARDED] = false;
    let stopped = false;
    const stop = /* @__PURE__ */ __name(() => {
      this.pause();
      this.off(ERROR, stop);
      this.off(DESTROYED, stop);
      this.off("end", stop);
      stopped = true;
      return { done: true, value: void 0 };
    }, "stop");
    const next = /* @__PURE__ */ __name(() => {
      if (stopped)
        return stop();
      const value = this.read();
      return value === null ? stop() : { done: false, value };
    }, "next");
    this.once("end", stop);
    this.once(ERROR, stop);
    this.once(DESTROYED, stop);
    return {
      next,
      throw: stop,
      return: stop,
      [Symbol.iterator]() {
        return this;
      }
    };
  }
  /**
   * Destroy a stream, preventing it from being used for any further purpose.
   *
   * If the stream has a `close()` method, then it will be called on
   * destruction.
   *
   * After destruction, any attempt to write data, read data, or emit most
   * events will be ignored.
   *
   * If an error argument is provided, then it will be emitted in an
   * 'error' event.
   */
  destroy(er) {
    if (this[DESTROYED]) {
      if (er)
        this.emit("error", er);
      else
        this.emit(DESTROYED);
      return this;
    }
    this[DESTROYED] = true;
    this[DISCARDED] = true;
    this[BUFFER].length = 0;
    this[BUFFERLENGTH] = 0;
    const wc = this;
    if (typeof wc.close === "function" && !this[CLOSED])
      wc.close();
    if (er)
      this.emit("error", er);
    else
      this.emit(DESTROYED);
    return this;
  }
  /**
   * Alias for {@link isStream}
   *
   * Former export location, maintained for backwards compatibility.
   *
   * @deprecated
   */
  static get isStream() {
    return isStream;
  }
};

// node_modules/path-scurry/dist/esm/index.js
var realpathSync = rps.native;
var defaultFS = {
  lstatSync,
  readdir: readdirCB,
  readdirSync,
  readlinkSync,
  realpathSync,
  promises: {
    lstat,
    readdir,
    readlink,
    realpath
  }
};
var fsFromOption = /* @__PURE__ */ __name((fsOption) => !fsOption || fsOption === defaultFS || fsOption === actualFS ? defaultFS : {
  ...defaultFS,
  ...fsOption,
  promises: {
    ...defaultFS.promises,
    ...fsOption.promises || {}
  }
}, "fsFromOption");
var uncDriveRegexp = /^\\\\\?\\([a-z]:)\\?$/i;
var uncToDrive = /* @__PURE__ */ __name((rootPath) => rootPath.replace(/\//g, "\\").replace(uncDriveRegexp, "$1\\"), "uncToDrive");
var eitherSep = /[\\\/]/;
var UNKNOWN = 0;
var IFIFO = 1;
var IFCHR = 2;
var IFDIR = 4;
var IFBLK = 6;
var IFREG = 8;
var IFLNK = 10;
var IFSOCK = 12;
var IFMT = 15;
var IFMT_UNKNOWN = ~IFMT;
var READDIR_CALLED = 16;
var LSTAT_CALLED = 32;
var ENOTDIR = 64;
var ENOENT = 128;
var ENOREADLINK = 256;
var ENOREALPATH = 512;
var ENOCHILD = ENOTDIR | ENOENT | ENOREALPATH;
var TYPEMASK = 1023;
var entToType = /* @__PURE__ */ __name((s) => s.isFile() ? IFREG : s.isDirectory() ? IFDIR : s.isSymbolicLink() ? IFLNK : s.isCharacterDevice() ? IFCHR : s.isBlockDevice() ? IFBLK : s.isSocket() ? IFSOCK : s.isFIFO() ? IFIFO : UNKNOWN, "entToType");
var normalizeCache = /* @__PURE__ */ new Map();
var normalize = /* @__PURE__ */ __name((s) => {
  const c = normalizeCache.get(s);
  if (c)
    return c;
  const n = s.normalize("NFKD");
  normalizeCache.set(s, n);
  return n;
}, "normalize");
var normalizeNocaseCache = /* @__PURE__ */ new Map();
var normalizeNocase = /* @__PURE__ */ __name((s) => {
  const c = normalizeNocaseCache.get(s);
  if (c)
    return c;
  const n = normalize(s.toLowerCase());
  normalizeNocaseCache.set(s, n);
  return n;
}, "normalizeNocase");
var ResolveCache = class extends LRUCache {
  static {
    __name(this, "ResolveCache");
  }
  constructor() {
    super({ max: 256 });
  }
};
var ChildrenCache = class extends LRUCache {
  static {
    __name(this, "ChildrenCache");
  }
  constructor(maxSize = 16 * 1024) {
    super({
      maxSize,
      // parent + children
      sizeCalculation: /* @__PURE__ */ __name((a) => a.length + 1, "sizeCalculation")
    });
  }
};
var setAsCwd = Symbol("PathScurry setAsCwd");
var PathBase = class {
  static {
    __name(this, "PathBase");
  }
  /**
   * the basename of this path
   *
   * **Important**: *always* test the path name against any test string
   * usingthe {@link isNamed} method, and not by directly comparing this
   * string. Otherwise, unicode path strings that the system sees as identical
   * will not be properly treated as the same path, leading to incorrect
   * behavior and possible security issues.
   */
  name;
  /**
   * the Path entry corresponding to the path root.
   *
   * @internal
   */
  root;
  /**
   * All roots found within the current PathScurry family
   *
   * @internal
   */
  roots;
  /**
   * a reference to the parent path, or undefined in the case of root entries
   *
   * @internal
   */
  parent;
  /**
   * boolean indicating whether paths are compared case-insensitively
   * @internal
   */
  nocase;
  /**
   * boolean indicating that this path is the current working directory
   * of the PathScurry collection that contains it.
   */
  isCWD = false;
  // potential default fs override
  #fs;
  // Stats fields
  #dev;
  get dev() {
    return this.#dev;
  }
  #mode;
  get mode() {
    return this.#mode;
  }
  #nlink;
  get nlink() {
    return this.#nlink;
  }
  #uid;
  get uid() {
    return this.#uid;
  }
  #gid;
  get gid() {
    return this.#gid;
  }
  #rdev;
  get rdev() {
    return this.#rdev;
  }
  #blksize;
  get blksize() {
    return this.#blksize;
  }
  #ino;
  get ino() {
    return this.#ino;
  }
  #size;
  get size() {
    return this.#size;
  }
  #blocks;
  get blocks() {
    return this.#blocks;
  }
  #atimeMs;
  get atimeMs() {
    return this.#atimeMs;
  }
  #mtimeMs;
  get mtimeMs() {
    return this.#mtimeMs;
  }
  #ctimeMs;
  get ctimeMs() {
    return this.#ctimeMs;
  }
  #birthtimeMs;
  get birthtimeMs() {
    return this.#birthtimeMs;
  }
  #atime;
  get atime() {
    return this.#atime;
  }
  #mtime;
  get mtime() {
    return this.#mtime;
  }
  #ctime;
  get ctime() {
    return this.#ctime;
  }
  #birthtime;
  get birthtime() {
    return this.#birthtime;
  }
  #matchName;
  #depth;
  #fullpath;
  #fullpathPosix;
  #relative;
  #relativePosix;
  #type;
  #children;
  #linkTarget;
  #realpath;
  /**
   * This property is for compatibility with the Dirent class as of
   * Node v20, where Dirent['parentPath'] refers to the path of the
   * directory that was passed to readdir. For root entries, it's the path
   * to the entry itself.
   */
  get parentPath() {
    return (this.parent || this).fullpath();
  }
  /**
   * Deprecated alias for Dirent['parentPath'] Somewhat counterintuitively,
   * this property refers to the *parent* path, not the path object itself.
   */
  get path() {
    return this.parentPath;
  }
  /**
   * Do not create new Path objects directly.  They should always be accessed
   * via the PathScurry class or other methods on the Path class.
   *
   * @internal
   */
  constructor(name, type = UNKNOWN, root, roots, nocase, children, opts) {
    this.name = name;
    this.#matchName = nocase ? normalizeNocase(name) : normalize(name);
    this.#type = type & TYPEMASK;
    this.nocase = nocase;
    this.roots = roots;
    this.root = root || this;
    this.#children = children;
    this.#fullpath = opts.fullpath;
    this.#relative = opts.relative;
    this.#relativePosix = opts.relativePosix;
    this.parent = opts.parent;
    if (this.parent) {
      this.#fs = this.parent.#fs;
    } else {
      this.#fs = fsFromOption(opts.fs);
    }
  }
  /**
   * Returns the depth of the Path object from its root.
   *
   * For example, a path at `/foo/bar` would have a depth of 2.
   */
  depth() {
    if (this.#depth !== void 0)
      return this.#depth;
    if (!this.parent)
      return this.#depth = 0;
    return this.#depth = this.parent.depth() + 1;
  }
  /**
   * @internal
   */
  childrenCache() {
    return this.#children;
  }
  /**
   * Get the Path object referenced by the string path, resolved from this Path
   */
  resolve(path9) {
    if (!path9) {
      return this;
    }
    const rootPath = this.getRootString(path9);
    const dir = path9.substring(rootPath.length);
    const dirParts = dir.split(this.splitSep);
    const result = rootPath ? this.getRoot(rootPath).#resolveParts(dirParts) : this.#resolveParts(dirParts);
    return result;
  }
  #resolveParts(dirParts) {
    let p = this;
    for (const part of dirParts) {
      p = p.child(part);
    }
    return p;
  }
  /**
   * Returns the cached children Path objects, if still available.  If they
   * have fallen out of the cache, then returns an empty array, and resets the
   * READDIR_CALLED bit, so that future calls to readdir() will require an fs
   * lookup.
   *
   * @internal
   */
  children() {
    const cached = this.#children.get(this);
    if (cached) {
      return cached;
    }
    const children = Object.assign([], { provisional: 0 });
    this.#children.set(this, children);
    this.#type &= ~READDIR_CALLED;
    return children;
  }
  /**
   * Resolves a path portion and returns or creates the child Path.
   *
   * Returns `this` if pathPart is `''` or `'.'`, or `parent` if pathPart is
   * `'..'`.
   *
   * This should not be called directly.  If `pathPart` contains any path
   * separators, it will lead to unsafe undefined behavior.
   *
   * Use `Path.resolve()` instead.
   *
   * @internal
   */
  child(pathPart, opts) {
    if (pathPart === "" || pathPart === ".") {
      return this;
    }
    if (pathPart === "..") {
      return this.parent || this;
    }
    const children = this.children();
    const name = this.nocase ? normalizeNocase(pathPart) : normalize(pathPart);
    for (const p of children) {
      if (p.#matchName === name) {
        return p;
      }
    }
    const s = this.parent ? this.sep : "";
    const fullpath = this.#fullpath ? this.#fullpath + s + pathPart : void 0;
    const pchild = this.newChild(pathPart, UNKNOWN, {
      ...opts,
      parent: this,
      fullpath
    });
    if (!this.canReaddir()) {
      pchild.#type |= ENOENT;
    }
    children.push(pchild);
    return pchild;
  }
  /**
   * The relative path from the cwd. If it does not share an ancestor with
   * the cwd, then this ends up being equivalent to the fullpath()
   */
  relative() {
    if (this.isCWD)
      return "";
    if (this.#relative !== void 0) {
      return this.#relative;
    }
    const name = this.name;
    const p = this.parent;
    if (!p) {
      return this.#relative = this.name;
    }
    const pv = p.relative();
    return pv + (!pv || !p.parent ? "" : this.sep) + name;
  }
  /**
   * The relative path from the cwd, using / as the path separator.
   * If it does not share an ancestor with
   * the cwd, then this ends up being equivalent to the fullpathPosix()
   * On posix systems, this is identical to relative().
   */
  relativePosix() {
    if (this.sep === "/")
      return this.relative();
    if (this.isCWD)
      return "";
    if (this.#relativePosix !== void 0)
      return this.#relativePosix;
    const name = this.name;
    const p = this.parent;
    if (!p) {
      return this.#relativePosix = this.fullpathPosix();
    }
    const pv = p.relativePosix();
    return pv + (!pv || !p.parent ? "" : "/") + name;
  }
  /**
   * The fully resolved path string for this Path entry
   */
  fullpath() {
    if (this.#fullpath !== void 0) {
      return this.#fullpath;
    }
    const name = this.name;
    const p = this.parent;
    if (!p) {
      return this.#fullpath = this.name;
    }
    const pv = p.fullpath();
    const fp = pv + (!p.parent ? "" : this.sep) + name;
    return this.#fullpath = fp;
  }
  /**
   * On platforms other than windows, this is identical to fullpath.
   *
   * On windows, this is overridden to return the forward-slash form of the
   * full UNC path.
   */
  fullpathPosix() {
    if (this.#fullpathPosix !== void 0)
      return this.#fullpathPosix;
    if (this.sep === "/")
      return this.#fullpathPosix = this.fullpath();
    if (!this.parent) {
      const p2 = this.fullpath().replace(/\\/g, "/");
      if (/^[a-z]:\//i.test(p2)) {
        return this.#fullpathPosix = `//?/${p2}`;
      } else {
        return this.#fullpathPosix = p2;
      }
    }
    const p = this.parent;
    const pfpp = p.fullpathPosix();
    const fpp = pfpp + (!pfpp || !p.parent ? "" : "/") + this.name;
    return this.#fullpathPosix = fpp;
  }
  /**
   * Is the Path of an unknown type?
   *
   * Note that we might know *something* about it if there has been a previous
   * filesystem operation, for example that it does not exist, or is not a
   * link, or whether it has child entries.
   */
  isUnknown() {
    return (this.#type & IFMT) === UNKNOWN;
  }
  isType(type) {
    return this[`is${type}`]();
  }
  getType() {
    return this.isUnknown() ? "Unknown" : this.isDirectory() ? "Directory" : this.isFile() ? "File" : this.isSymbolicLink() ? "SymbolicLink" : this.isFIFO() ? "FIFO" : this.isCharacterDevice() ? "CharacterDevice" : this.isBlockDevice() ? "BlockDevice" : (
      /* c8 ignore start */
      this.isSocket() ? "Socket" : "Unknown"
    );
  }
  /**
   * Is the Path a regular file?
   */
  isFile() {
    return (this.#type & IFMT) === IFREG;
  }
  /**
   * Is the Path a directory?
   */
  isDirectory() {
    return (this.#type & IFMT) === IFDIR;
  }
  /**
   * Is the path a character device?
   */
  isCharacterDevice() {
    return (this.#type & IFMT) === IFCHR;
  }
  /**
   * Is the path a block device?
   */
  isBlockDevice() {
    return (this.#type & IFMT) === IFBLK;
  }
  /**
   * Is the path a FIFO pipe?
   */
  isFIFO() {
    return (this.#type & IFMT) === IFIFO;
  }
  /**
   * Is the path a socket?
   */
  isSocket() {
    return (this.#type & IFMT) === IFSOCK;
  }
  /**
   * Is the path a symbolic link?
   */
  isSymbolicLink() {
    return (this.#type & IFLNK) === IFLNK;
  }
  /**
   * Return the entry if it has been subject of a successful lstat, or
   * undefined otherwise.
   *
   * Does not read the filesystem, so an undefined result *could* simply
   * mean that we haven't called lstat on it.
   */
  lstatCached() {
    return this.#type & LSTAT_CALLED ? this : void 0;
  }
  /**
   * Return the cached link target if the entry has been the subject of a
   * successful readlink, or undefined otherwise.
   *
   * Does not read the filesystem, so an undefined result *could* just mean we
   * don't have any cached data. Only use it if you are very sure that a
   * readlink() has been called at some point.
   */
  readlinkCached() {
    return this.#linkTarget;
  }
  /**
   * Returns the cached realpath target if the entry has been the subject
   * of a successful realpath, or undefined otherwise.
   *
   * Does not read the filesystem, so an undefined result *could* just mean we
   * don't have any cached data. Only use it if you are very sure that a
   * realpath() has been called at some point.
   */
  realpathCached() {
    return this.#realpath;
  }
  /**
   * Returns the cached child Path entries array if the entry has been the
   * subject of a successful readdir(), or [] otherwise.
   *
   * Does not read the filesystem, so an empty array *could* just mean we
   * don't have any cached data. Only use it if you are very sure that a
   * readdir() has been called recently enough to still be valid.
   */
  readdirCached() {
    const children = this.children();
    return children.slice(0, children.provisional);
  }
  /**
   * Return true if it's worth trying to readlink.  Ie, we don't (yet) have
   * any indication that readlink will definitely fail.
   *
   * Returns false if the path is known to not be a symlink, if a previous
   * readlink failed, or if the entry does not exist.
   */
  canReadlink() {
    if (this.#linkTarget)
      return true;
    if (!this.parent)
      return false;
    const ifmt = this.#type & IFMT;
    return !(ifmt !== UNKNOWN && ifmt !== IFLNK || this.#type & ENOREADLINK || this.#type & ENOENT);
  }
  /**
   * Return true if readdir has previously been successfully called on this
   * path, indicating that cachedReaddir() is likely valid.
   */
  calledReaddir() {
    return !!(this.#type & READDIR_CALLED);
  }
  /**
   * Returns true if the path is known to not exist. That is, a previous lstat
   * or readdir failed to verify its existence when that would have been
   * expected, or a parent entry was marked either enoent or enotdir.
   */
  isENOENT() {
    return !!(this.#type & ENOENT);
  }
  /**
   * Return true if the path is a match for the given path name.  This handles
   * case sensitivity and unicode normalization.
   *
   * Note: even on case-sensitive systems, it is **not** safe to test the
   * equality of the `.name` property to determine whether a given pathname
   * matches, due to unicode normalization mismatches.
   *
   * Always use this method instead of testing the `path.name` property
   * directly.
   */
  isNamed(n) {
    return !this.nocase ? this.#matchName === normalize(n) : this.#matchName === normalizeNocase(n);
  }
  /**
   * Return the Path object corresponding to the target of a symbolic link.
   *
   * If the Path is not a symbolic link, or if the readlink call fails for any
   * reason, `undefined` is returned.
   *
   * Result is cached, and thus may be outdated if the filesystem is mutated.
   */
  async readlink() {
    const target = this.#linkTarget;
    if (target) {
      return target;
    }
    if (!this.canReadlink()) {
      return void 0;
    }
    if (!this.parent) {
      return void 0;
    }
    try {
      const read = await this.#fs.promises.readlink(this.fullpath());
      const linkTarget = (await this.parent.realpath())?.resolve(read);
      if (linkTarget) {
        return this.#linkTarget = linkTarget;
      }
    } catch (er) {
      this.#readlinkFail(er.code);
      return void 0;
    }
  }
  /**
   * Synchronous {@link PathBase.readlink}
   */
  readlinkSync() {
    const target = this.#linkTarget;
    if (target) {
      return target;
    }
    if (!this.canReadlink()) {
      return void 0;
    }
    if (!this.parent) {
      return void 0;
    }
    try {
      const read = this.#fs.readlinkSync(this.fullpath());
      const linkTarget = this.parent.realpathSync()?.resolve(read);
      if (linkTarget) {
        return this.#linkTarget = linkTarget;
      }
    } catch (er) {
      this.#readlinkFail(er.code);
      return void 0;
    }
  }
  #readdirSuccess(children) {
    this.#type |= READDIR_CALLED;
    for (let p = children.provisional; p < children.length; p++) {
      const c = children[p];
      if (c)
        c.#markENOENT();
    }
  }
  #markENOENT() {
    if (this.#type & ENOENT)
      return;
    this.#type = (this.#type | ENOENT) & IFMT_UNKNOWN;
    this.#markChildrenENOENT();
  }
  #markChildrenENOENT() {
    const children = this.children();
    children.provisional = 0;
    for (const p of children) {
      p.#markENOENT();
    }
  }
  #markENOREALPATH() {
    this.#type |= ENOREALPATH;
    this.#markENOTDIR();
  }
  // save the information when we know the entry is not a dir
  #markENOTDIR() {
    if (this.#type & ENOTDIR)
      return;
    let t = this.#type;
    if ((t & IFMT) === IFDIR)
      t &= IFMT_UNKNOWN;
    this.#type = t | ENOTDIR;
    this.#markChildrenENOENT();
  }
  #readdirFail(code = "") {
    if (code === "ENOTDIR" || code === "EPERM") {
      this.#markENOTDIR();
    } else if (code === "ENOENT") {
      this.#markENOENT();
    } else {
      this.children().provisional = 0;
    }
  }
  #lstatFail(code = "") {
    if (code === "ENOTDIR") {
      const p = this.parent;
      p.#markENOTDIR();
    } else if (code === "ENOENT") {
      this.#markENOENT();
    }
  }
  #readlinkFail(code = "") {
    let ter = this.#type;
    ter |= ENOREADLINK;
    if (code === "ENOENT")
      ter |= ENOENT;
    if (code === "EINVAL" || code === "UNKNOWN") {
      ter &= IFMT_UNKNOWN;
    }
    this.#type = ter;
    if (code === "ENOTDIR" && this.parent) {
      this.parent.#markENOTDIR();
    }
  }
  #readdirAddChild(e, c) {
    return this.#readdirMaybePromoteChild(e, c) || this.#readdirAddNewChild(e, c);
  }
  #readdirAddNewChild(e, c) {
    const type = entToType(e);
    const child = this.newChild(e.name, type, { parent: this });
    const ifmt = child.#type & IFMT;
    if (ifmt !== IFDIR && ifmt !== IFLNK && ifmt !== UNKNOWN) {
      child.#type |= ENOTDIR;
    }
    c.unshift(child);
    c.provisional++;
    return child;
  }
  #readdirMaybePromoteChild(e, c) {
    for (let p = c.provisional; p < c.length; p++) {
      const pchild = c[p];
      const name = this.nocase ? normalizeNocase(e.name) : normalize(e.name);
      if (name !== pchild.#matchName) {
        continue;
      }
      return this.#readdirPromoteChild(e, pchild, p, c);
    }
  }
  #readdirPromoteChild(e, p, index, c) {
    const v = p.name;
    p.#type = p.#type & IFMT_UNKNOWN | entToType(e);
    if (v !== e.name)
      p.name = e.name;
    if (index !== c.provisional) {
      if (index === c.length - 1)
        c.pop();
      else
        c.splice(index, 1);
      c.unshift(p);
    }
    c.provisional++;
    return p;
  }
  /**
   * Call lstat() on this Path, and update all known information that can be
   * determined.
   *
   * Note that unlike `fs.lstat()`, the returned value does not contain some
   * information, such as `mode`, `dev`, `nlink`, and `ino`.  If that
   * information is required, you will need to call `fs.lstat` yourself.
   *
   * If the Path refers to a nonexistent file, or if the lstat call fails for
   * any reason, `undefined` is returned.  Otherwise the updated Path object is
   * returned.
   *
   * Results are cached, and thus may be out of date if the filesystem is
   * mutated.
   */
  async lstat() {
    if ((this.#type & ENOENT) === 0) {
      try {
        this.#applyStat(await this.#fs.promises.lstat(this.fullpath()));
        return this;
      } catch (er) {
        this.#lstatFail(er.code);
      }
    }
  }
  /**
   * synchronous {@link PathBase.lstat}
   */
  lstatSync() {
    if ((this.#type & ENOENT) === 0) {
      try {
        this.#applyStat(this.#fs.lstatSync(this.fullpath()));
        return this;
      } catch (er) {
        this.#lstatFail(er.code);
      }
    }
  }
  #applyStat(st) {
    const { atime, atimeMs, birthtime, birthtimeMs, blksize, blocks, ctime, ctimeMs, dev, gid, ino, mode, mtime, mtimeMs, nlink, rdev, size, uid } = st;
    this.#atime = atime;
    this.#atimeMs = atimeMs;
    this.#birthtime = birthtime;
    this.#birthtimeMs = birthtimeMs;
    this.#blksize = blksize;
    this.#blocks = blocks;
    this.#ctime = ctime;
    this.#ctimeMs = ctimeMs;
    this.#dev = dev;
    this.#gid = gid;
    this.#ino = ino;
    this.#mode = mode;
    this.#mtime = mtime;
    this.#mtimeMs = mtimeMs;
    this.#nlink = nlink;
    this.#rdev = rdev;
    this.#size = size;
    this.#uid = uid;
    const ifmt = entToType(st);
    this.#type = this.#type & IFMT_UNKNOWN | ifmt | LSTAT_CALLED;
    if (ifmt !== UNKNOWN && ifmt !== IFDIR && ifmt !== IFLNK) {
      this.#type |= ENOTDIR;
    }
  }
  #onReaddirCB = [];
  #readdirCBInFlight = false;
  #callOnReaddirCB(children) {
    this.#readdirCBInFlight = false;
    const cbs = this.#onReaddirCB.slice();
    this.#onReaddirCB.length = 0;
    cbs.forEach((cb) => cb(null, children));
  }
  /**
   * Standard node-style callback interface to get list of directory entries.
   *
   * If the Path cannot or does not contain any children, then an empty array
   * is returned.
   *
   * Results are cached, and thus may be out of date if the filesystem is
   * mutated.
   *
   * @param cb The callback called with (er, entries).  Note that the `er`
   * param is somewhat extraneous, as all readdir() errors are handled and
   * simply result in an empty set of entries being returned.
   * @param allowZalgo Boolean indicating that immediately known results should
   * *not* be deferred with `queueMicrotask`. Defaults to `false`. Release
   * zalgo at your peril, the dark pony lord is devious and unforgiving.
   */
  readdirCB(cb, allowZalgo = false) {
    if (!this.canReaddir()) {
      if (allowZalgo)
        cb(null, []);
      else
        queueMicrotask(() => cb(null, []));
      return;
    }
    const children = this.children();
    if (this.calledReaddir()) {
      const c = children.slice(0, children.provisional);
      if (allowZalgo)
        cb(null, c);
      else
        queueMicrotask(() => cb(null, c));
      return;
    }
    this.#onReaddirCB.push(cb);
    if (this.#readdirCBInFlight) {
      return;
    }
    this.#readdirCBInFlight = true;
    const fullpath = this.fullpath();
    this.#fs.readdir(fullpath, { withFileTypes: true }, (er, entries) => {
      if (er) {
        this.#readdirFail(er.code);
        children.provisional = 0;
      } else {
        for (const e of entries) {
          this.#readdirAddChild(e, children);
        }
        this.#readdirSuccess(children);
      }
      this.#callOnReaddirCB(children.slice(0, children.provisional));
      return;
    });
  }
  #asyncReaddirInFlight;
  /**
   * Return an array of known child entries.
   *
   * If the Path cannot or does not contain any children, then an empty array
   * is returned.
   *
   * Results are cached, and thus may be out of date if the filesystem is
   * mutated.
   */
  async readdir() {
    if (!this.canReaddir()) {
      return [];
    }
    const children = this.children();
    if (this.calledReaddir()) {
      return children.slice(0, children.provisional);
    }
    const fullpath = this.fullpath();
    if (this.#asyncReaddirInFlight) {
      await this.#asyncReaddirInFlight;
    } else {
      let resolve2 = /* @__PURE__ */ __name(() => {
      }, "resolve");
      this.#asyncReaddirInFlight = new Promise((res) => resolve2 = res);
      try {
        for (const e of await this.#fs.promises.readdir(fullpath, {
          withFileTypes: true
        })) {
          this.#readdirAddChild(e, children);
        }
        this.#readdirSuccess(children);
      } catch (er) {
        this.#readdirFail(er.code);
        children.provisional = 0;
      }
      this.#asyncReaddirInFlight = void 0;
      resolve2();
    }
    return children.slice(0, children.provisional);
  }
  /**
   * synchronous {@link PathBase.readdir}
   */
  readdirSync() {
    if (!this.canReaddir()) {
      return [];
    }
    const children = this.children();
    if (this.calledReaddir()) {
      return children.slice(0, children.provisional);
    }
    const fullpath = this.fullpath();
    try {
      for (const e of this.#fs.readdirSync(fullpath, {
        withFileTypes: true
      })) {
        this.#readdirAddChild(e, children);
      }
      this.#readdirSuccess(children);
    } catch (er) {
      this.#readdirFail(er.code);
      children.provisional = 0;
    }
    return children.slice(0, children.provisional);
  }
  canReaddir() {
    if (this.#type & ENOCHILD)
      return false;
    const ifmt = IFMT & this.#type;
    if (!(ifmt === UNKNOWN || ifmt === IFDIR || ifmt === IFLNK)) {
      return false;
    }
    return true;
  }
  shouldWalk(dirs, walkFilter) {
    return (this.#type & IFDIR) === IFDIR && !(this.#type & ENOCHILD) && !dirs.has(this) && (!walkFilter || walkFilter(this));
  }
  /**
   * Return the Path object corresponding to path as resolved
   * by realpath(3).
   *
   * If the realpath call fails for any reason, `undefined` is returned.
   *
   * Result is cached, and thus may be outdated if the filesystem is mutated.
   * On success, returns a Path object.
   */
  async realpath() {
    if (this.#realpath)
      return this.#realpath;
    if ((ENOREALPATH | ENOREADLINK | ENOENT) & this.#type)
      return void 0;
    try {
      const rp = await this.#fs.promises.realpath(this.fullpath());
      return this.#realpath = this.resolve(rp);
    } catch (_) {
      this.#markENOREALPATH();
    }
  }
  /**
   * Synchronous {@link realpath}
   */
  realpathSync() {
    if (this.#realpath)
      return this.#realpath;
    if ((ENOREALPATH | ENOREADLINK | ENOENT) & this.#type)
      return void 0;
    try {
      const rp = this.#fs.realpathSync(this.fullpath());
      return this.#realpath = this.resolve(rp);
    } catch (_) {
      this.#markENOREALPATH();
    }
  }
  /**
   * Internal method to mark this Path object as the scurry cwd,
   * called by {@link PathScurry#chdir}
   *
   * @internal
   */
  [setAsCwd](oldCwd) {
    if (oldCwd === this)
      return;
    oldCwd.isCWD = false;
    this.isCWD = true;
    const changed = /* @__PURE__ */ new Set([]);
    let rp = [];
    let p = this;
    while (p && p.parent) {
      changed.add(p);
      p.#relative = rp.join(this.sep);
      p.#relativePosix = rp.join("/");
      p = p.parent;
      rp.push("..");
    }
    p = oldCwd;
    while (p && p.parent && !changed.has(p)) {
      p.#relative = void 0;
      p.#relativePosix = void 0;
      p = p.parent;
    }
  }
};
var PathWin32 = class _PathWin32 extends PathBase {
  static {
    __name(this, "PathWin32");
  }
  /**
   * Separator for generating path strings.
   */
  sep = "\\";
  /**
   * Separator for parsing path strings.
   */
  splitSep = eitherSep;
  /**
   * Do not create new Path objects directly.  They should always be accessed
   * via the PathScurry class or other methods on the Path class.
   *
   * @internal
   */
  constructor(name, type = UNKNOWN, root, roots, nocase, children, opts) {
    super(name, type, root, roots, nocase, children, opts);
  }
  /**
   * @internal
   */
  newChild(name, type = UNKNOWN, opts = {}) {
    return new _PathWin32(name, type, this.root, this.roots, this.nocase, this.childrenCache(), opts);
  }
  /**
   * @internal
   */
  getRootString(path9) {
    return win32.parse(path9).root;
  }
  /**
   * @internal
   */
  getRoot(rootPath) {
    rootPath = uncToDrive(rootPath.toUpperCase());
    if (rootPath === this.root.name) {
      return this.root;
    }
    for (const [compare, root] of Object.entries(this.roots)) {
      if (this.sameRoot(rootPath, compare)) {
        return this.roots[rootPath] = root;
      }
    }
    return this.roots[rootPath] = new PathScurryWin32(rootPath, this).root;
  }
  /**
   * @internal
   */
  sameRoot(rootPath, compare = this.root.name) {
    rootPath = rootPath.toUpperCase().replace(/\//g, "\\").replace(uncDriveRegexp, "$1\\");
    return rootPath === compare;
  }
};
var PathPosix = class _PathPosix extends PathBase {
  static {
    __name(this, "PathPosix");
  }
  /**
   * separator for parsing path strings
   */
  splitSep = "/";
  /**
   * separator for generating path strings
   */
  sep = "/";
  /**
   * Do not create new Path objects directly.  They should always be accessed
   * via the PathScurry class or other methods on the Path class.
   *
   * @internal
   */
  constructor(name, type = UNKNOWN, root, roots, nocase, children, opts) {
    super(name, type, root, roots, nocase, children, opts);
  }
  /**
   * @internal
   */
  getRootString(path9) {
    return path9.startsWith("/") ? "/" : "";
  }
  /**
   * @internal
   */
  getRoot(_rootPath) {
    return this.root;
  }
  /**
   * @internal
   */
  newChild(name, type = UNKNOWN, opts = {}) {
    return new _PathPosix(name, type, this.root, this.roots, this.nocase, this.childrenCache(), opts);
  }
};
var PathScurryBase = class {
  static {
    __name(this, "PathScurryBase");
  }
  /**
   * The root Path entry for the current working directory of this Scurry
   */
  root;
  /**
   * The string path for the root of this Scurry's current working directory
   */
  rootPath;
  /**
   * A collection of all roots encountered, referenced by rootPath
   */
  roots;
  /**
   * The Path entry corresponding to this PathScurry's current working directory.
   */
  cwd;
  #resolveCache;
  #resolvePosixCache;
  #children;
  /**
   * Perform path comparisons case-insensitively.
   *
   * Defaults true on Darwin and Windows systems, false elsewhere.
   */
  nocase;
  #fs;
  /**
   * This class should not be instantiated directly.
   *
   * Use PathScurryWin32, PathScurryDarwin, PathScurryPosix, or PathScurry
   *
   * @internal
   */
  constructor(cwd = process.cwd(), pathImpl, sep2, { nocase, childrenCacheSize = 16 * 1024, fs: fs5 = defaultFS } = {}) {
    this.#fs = fsFromOption(fs5);
    if (cwd instanceof URL || cwd.startsWith("file://")) {
      cwd = fileURLToPath3(cwd);
    }
    const cwdPath = pathImpl.resolve(cwd);
    this.roots = /* @__PURE__ */ Object.create(null);
    this.rootPath = this.parseRootPath(cwdPath);
    this.#resolveCache = new ResolveCache();
    this.#resolvePosixCache = new ResolveCache();
    this.#children = new ChildrenCache(childrenCacheSize);
    const split = cwdPath.substring(this.rootPath.length).split(sep2);
    if (split.length === 1 && !split[0]) {
      split.pop();
    }
    if (nocase === void 0) {
      throw new TypeError("must provide nocase setting to PathScurryBase ctor");
    }
    this.nocase = nocase;
    this.root = this.newRoot(this.#fs);
    this.roots[this.rootPath] = this.root;
    let prev = this.root;
    let len = split.length - 1;
    const joinSep = pathImpl.sep;
    let abs = this.rootPath;
    let sawFirst = false;
    for (const part of split) {
      const l = len--;
      prev = prev.child(part, {
        relative: new Array(l).fill("..").join(joinSep),
        relativePosix: new Array(l).fill("..").join("/"),
        fullpath: abs += (sawFirst ? "" : joinSep) + part
      });
      sawFirst = true;
    }
    this.cwd = prev;
  }
  /**
   * Get the depth of a provided path, string, or the cwd
   */
  depth(path9 = this.cwd) {
    if (typeof path9 === "string") {
      path9 = this.cwd.resolve(path9);
    }
    return path9.depth();
  }
  /**
   * Return the cache of child entries.  Exposed so subclasses can create
   * child Path objects in a platform-specific way.
   *
   * @internal
   */
  childrenCache() {
    return this.#children;
  }
  /**
   * Resolve one or more path strings to a resolved string
   *
   * Same interface as require('path').resolve.
   *
   * Much faster than path.resolve() when called multiple times for the same
   * path, because the resolved Path objects are cached.  Much slower
   * otherwise.
   */
  resolve(...paths) {
    let r = "";
    for (let i = paths.length - 1; i >= 0; i--) {
      const p = paths[i];
      if (!p || p === ".")
        continue;
      r = r ? `${p}/${r}` : p;
      if (this.isAbsolute(p)) {
        break;
      }
    }
    const cached = this.#resolveCache.get(r);
    if (cached !== void 0) {
      return cached;
    }
    const result = this.cwd.resolve(r).fullpath();
    this.#resolveCache.set(r, result);
    return result;
  }
  /**
   * Resolve one or more path strings to a resolved string, returning
   * the posix path.  Identical to .resolve() on posix systems, but on
   * windows will return a forward-slash separated UNC path.
   *
   * Same interface as require('path').resolve.
   *
   * Much faster than path.resolve() when called multiple times for the same
   * path, because the resolved Path objects are cached.  Much slower
   * otherwise.
   */
  resolvePosix(...paths) {
    let r = "";
    for (let i = paths.length - 1; i >= 0; i--) {
      const p = paths[i];
      if (!p || p === ".")
        continue;
      r = r ? `${p}/${r}` : p;
      if (this.isAbsolute(p)) {
        break;
      }
    }
    const cached = this.#resolvePosixCache.get(r);
    if (cached !== void 0) {
      return cached;
    }
    const result = this.cwd.resolve(r).fullpathPosix();
    this.#resolvePosixCache.set(r, result);
    return result;
  }
  /**
   * find the relative path from the cwd to the supplied path string or entry
   */
  relative(entry = this.cwd) {
    if (typeof entry === "string") {
      entry = this.cwd.resolve(entry);
    }
    return entry.relative();
  }
  /**
   * find the relative path from the cwd to the supplied path string or
   * entry, using / as the path delimiter, even on Windows.
   */
  relativePosix(entry = this.cwd) {
    if (typeof entry === "string") {
      entry = this.cwd.resolve(entry);
    }
    return entry.relativePosix();
  }
  /**
   * Return the basename for the provided string or Path object
   */
  basename(entry = this.cwd) {
    if (typeof entry === "string") {
      entry = this.cwd.resolve(entry);
    }
    return entry.name;
  }
  /**
   * Return the dirname for the provided string or Path object
   */
  dirname(entry = this.cwd) {
    if (typeof entry === "string") {
      entry = this.cwd.resolve(entry);
    }
    return (entry.parent || entry).fullpath();
  }
  async readdir(entry = this.cwd, opts = {
    withFileTypes: true
  }) {
    if (typeof entry === "string") {
      entry = this.cwd.resolve(entry);
    } else if (!(entry instanceof PathBase)) {
      opts = entry;
      entry = this.cwd;
    }
    const { withFileTypes } = opts;
    if (!entry.canReaddir()) {
      return [];
    } else {
      const p = await entry.readdir();
      return withFileTypes ? p : p.map((e) => e.name);
    }
  }
  readdirSync(entry = this.cwd, opts = {
    withFileTypes: true
  }) {
    if (typeof entry === "string") {
      entry = this.cwd.resolve(entry);
    } else if (!(entry instanceof PathBase)) {
      opts = entry;
      entry = this.cwd;
    }
    const { withFileTypes = true } = opts;
    if (!entry.canReaddir()) {
      return [];
    } else if (withFileTypes) {
      return entry.readdirSync();
    } else {
      return entry.readdirSync().map((e) => e.name);
    }
  }
  /**
   * Call lstat() on the string or Path object, and update all known
   * information that can be determined.
   *
   * Note that unlike `fs.lstat()`, the returned value does not contain some
   * information, such as `mode`, `dev`, `nlink`, and `ino`.  If that
   * information is required, you will need to call `fs.lstat` yourself.
   *
   * If the Path refers to a nonexistent file, or if the lstat call fails for
   * any reason, `undefined` is returned.  Otherwise the updated Path object is
   * returned.
   *
   * Results are cached, and thus may be out of date if the filesystem is
   * mutated.
   */
  async lstat(entry = this.cwd) {
    if (typeof entry === "string") {
      entry = this.cwd.resolve(entry);
    }
    return entry.lstat();
  }
  /**
   * synchronous {@link PathScurryBase.lstat}
   */
  lstatSync(entry = this.cwd) {
    if (typeof entry === "string") {
      entry = this.cwd.resolve(entry);
    }
    return entry.lstatSync();
  }
  async readlink(entry = this.cwd, { withFileTypes } = {
    withFileTypes: false
  }) {
    if (typeof entry === "string") {
      entry = this.cwd.resolve(entry);
    } else if (!(entry instanceof PathBase)) {
      withFileTypes = entry.withFileTypes;
      entry = this.cwd;
    }
    const e = await entry.readlink();
    return withFileTypes ? e : e?.fullpath();
  }
  readlinkSync(entry = this.cwd, { withFileTypes } = {
    withFileTypes: false
  }) {
    if (typeof entry === "string") {
      entry = this.cwd.resolve(entry);
    } else if (!(entry instanceof PathBase)) {
      withFileTypes = entry.withFileTypes;
      entry = this.cwd;
    }
    const e = entry.readlinkSync();
    return withFileTypes ? e : e?.fullpath();
  }
  async realpath(entry = this.cwd, { withFileTypes } = {
    withFileTypes: false
  }) {
    if (typeof entry === "string") {
      entry = this.cwd.resolve(entry);
    } else if (!(entry instanceof PathBase)) {
      withFileTypes = entry.withFileTypes;
      entry = this.cwd;
    }
    const e = await entry.realpath();
    return withFileTypes ? e : e?.fullpath();
  }
  realpathSync(entry = this.cwd, { withFileTypes } = {
    withFileTypes: false
  }) {
    if (typeof entry === "string") {
      entry = this.cwd.resolve(entry);
    } else if (!(entry instanceof PathBase)) {
      withFileTypes = entry.withFileTypes;
      entry = this.cwd;
    }
    const e = entry.realpathSync();
    return withFileTypes ? e : e?.fullpath();
  }
  async walk(entry = this.cwd, opts = {}) {
    if (typeof entry === "string") {
      entry = this.cwd.resolve(entry);
    } else if (!(entry instanceof PathBase)) {
      opts = entry;
      entry = this.cwd;
    }
    const { withFileTypes = true, follow = false, filter: filter2, walkFilter } = opts;
    const results = [];
    if (!filter2 || filter2(entry)) {
      results.push(withFileTypes ? entry : entry.fullpath());
    }
    const dirs = /* @__PURE__ */ new Set();
    const walk = /* @__PURE__ */ __name((dir, cb) => {
      dirs.add(dir);
      dir.readdirCB((er, entries) => {
        if (er) {
          return cb(er);
        }
        let len = entries.length;
        if (!len)
          return cb();
        const next = /* @__PURE__ */ __name(() => {
          if (--len === 0) {
            cb();
          }
        }, "next");
        for (const e of entries) {
          if (!filter2 || filter2(e)) {
            results.push(withFileTypes ? e : e.fullpath());
          }
          if (follow && e.isSymbolicLink()) {
            e.realpath().then((r) => r?.isUnknown() ? r.lstat() : r).then((r) => r?.shouldWalk(dirs, walkFilter) ? walk(r, next) : next());
          } else {
            if (e.shouldWalk(dirs, walkFilter)) {
              walk(e, next);
            } else {
              next();
            }
          }
        }
      }, true);
    }, "walk");
    const start = entry;
    return new Promise((res, rej) => {
      walk(start, (er) => {
        if (er)
          return rej(er);
        res(results);
      });
    });
  }
  walkSync(entry = this.cwd, opts = {}) {
    if (typeof entry === "string") {
      entry = this.cwd.resolve(entry);
    } else if (!(entry instanceof PathBase)) {
      opts = entry;
      entry = this.cwd;
    }
    const { withFileTypes = true, follow = false, filter: filter2, walkFilter } = opts;
    const results = [];
    if (!filter2 || filter2(entry)) {
      results.push(withFileTypes ? entry : entry.fullpath());
    }
    const dirs = /* @__PURE__ */ new Set([entry]);
    for (const dir of dirs) {
      const entries = dir.readdirSync();
      for (const e of entries) {
        if (!filter2 || filter2(e)) {
          results.push(withFileTypes ? e : e.fullpath());
        }
        let r = e;
        if (e.isSymbolicLink()) {
          if (!(follow && (r = e.realpathSync())))
            continue;
          if (r.isUnknown())
            r.lstatSync();
        }
        if (r.shouldWalk(dirs, walkFilter)) {
          dirs.add(r);
        }
      }
    }
    return results;
  }
  /**
   * Support for `for await`
   *
   * Alias for {@link PathScurryBase.iterate}
   *
   * Note: As of Node 19, this is very slow, compared to other methods of
   * walking.  Consider using {@link PathScurryBase.stream} if memory overhead
   * and backpressure are concerns, or {@link PathScurryBase.walk} if not.
   */
  [Symbol.asyncIterator]() {
    return this.iterate();
  }
  iterate(entry = this.cwd, options = {}) {
    if (typeof entry === "string") {
      entry = this.cwd.resolve(entry);
    } else if (!(entry instanceof PathBase)) {
      options = entry;
      entry = this.cwd;
    }
    return this.stream(entry, options)[Symbol.asyncIterator]();
  }
  /**
   * Iterating over a PathScurry performs a synchronous walk.
   *
   * Alias for {@link PathScurryBase.iterateSync}
   */
  [Symbol.iterator]() {
    return this.iterateSync();
  }
  *iterateSync(entry = this.cwd, opts = {}) {
    if (typeof entry === "string") {
      entry = this.cwd.resolve(entry);
    } else if (!(entry instanceof PathBase)) {
      opts = entry;
      entry = this.cwd;
    }
    const { withFileTypes = true, follow = false, filter: filter2, walkFilter } = opts;
    if (!filter2 || filter2(entry)) {
      yield withFileTypes ? entry : entry.fullpath();
    }
    const dirs = /* @__PURE__ */ new Set([entry]);
    for (const dir of dirs) {
      const entries = dir.readdirSync();
      for (const e of entries) {
        if (!filter2 || filter2(e)) {
          yield withFileTypes ? e : e.fullpath();
        }
        let r = e;
        if (e.isSymbolicLink()) {
          if (!(follow && (r = e.realpathSync())))
            continue;
          if (r.isUnknown())
            r.lstatSync();
        }
        if (r.shouldWalk(dirs, walkFilter)) {
          dirs.add(r);
        }
      }
    }
  }
  stream(entry = this.cwd, opts = {}) {
    if (typeof entry === "string") {
      entry = this.cwd.resolve(entry);
    } else if (!(entry instanceof PathBase)) {
      opts = entry;
      entry = this.cwd;
    }
    const { withFileTypes = true, follow = false, filter: filter2, walkFilter } = opts;
    const results = new Minipass({ objectMode: true });
    if (!filter2 || filter2(entry)) {
      results.write(withFileTypes ? entry : entry.fullpath());
    }
    const dirs = /* @__PURE__ */ new Set();
    const queue = [entry];
    let processing = 0;
    const process3 = /* @__PURE__ */ __name(() => {
      let paused = false;
      while (!paused) {
        const dir = queue.shift();
        if (!dir) {
          if (processing === 0)
            results.end();
          return;
        }
        processing++;
        dirs.add(dir);
        const onReaddir = /* @__PURE__ */ __name((er, entries, didRealpaths = false) => {
          if (er)
            return results.emit("error", er);
          if (follow && !didRealpaths) {
            const promises = [];
            for (const e of entries) {
              if (e.isSymbolicLink()) {
                promises.push(e.realpath().then((r) => r?.isUnknown() ? r.lstat() : r));
              }
            }
            if (promises.length) {
              Promise.all(promises).then(() => onReaddir(null, entries, true));
              return;
            }
          }
          for (const e of entries) {
            if (e && (!filter2 || filter2(e))) {
              if (!results.write(withFileTypes ? e : e.fullpath())) {
                paused = true;
              }
            }
          }
          processing--;
          for (const e of entries) {
            const r = e.realpathCached() || e;
            if (r.shouldWalk(dirs, walkFilter)) {
              queue.push(r);
            }
          }
          if (paused && !results.flowing) {
            results.once("drain", process3);
          } else if (!sync2) {
            process3();
          }
        }, "onReaddir");
        let sync2 = true;
        dir.readdirCB(onReaddir, true);
        sync2 = false;
      }
    }, "process");
    process3();
    return results;
  }
  streamSync(entry = this.cwd, opts = {}) {
    if (typeof entry === "string") {
      entry = this.cwd.resolve(entry);
    } else if (!(entry instanceof PathBase)) {
      opts = entry;
      entry = this.cwd;
    }
    const { withFileTypes = true, follow = false, filter: filter2, walkFilter } = opts;
    const results = new Minipass({ objectMode: true });
    const dirs = /* @__PURE__ */ new Set();
    if (!filter2 || filter2(entry)) {
      results.write(withFileTypes ? entry : entry.fullpath());
    }
    const queue = [entry];
    let processing = 0;
    const process3 = /* @__PURE__ */ __name(() => {
      let paused = false;
      while (!paused) {
        const dir = queue.shift();
        if (!dir) {
          if (processing === 0)
            results.end();
          return;
        }
        processing++;
        dirs.add(dir);
        const entries = dir.readdirSync();
        for (const e of entries) {
          if (!filter2 || filter2(e)) {
            if (!results.write(withFileTypes ? e : e.fullpath())) {
              paused = true;
            }
          }
        }
        processing--;
        for (const e of entries) {
          let r = e;
          if (e.isSymbolicLink()) {
            if (!(follow && (r = e.realpathSync())))
              continue;
            if (r.isUnknown())
              r.lstatSync();
          }
          if (r.shouldWalk(dirs, walkFilter)) {
            queue.push(r);
          }
        }
      }
      if (paused && !results.flowing)
        results.once("drain", process3);
    }, "process");
    process3();
    return results;
  }
  chdir(path9 = this.cwd) {
    const oldCwd = this.cwd;
    this.cwd = typeof path9 === "string" ? this.cwd.resolve(path9) : path9;
    this.cwd[setAsCwd](oldCwd);
  }
};
var PathScurryWin32 = class extends PathScurryBase {
  static {
    __name(this, "PathScurryWin32");
  }
  /**
   * separator for generating path strings
   */
  sep = "\\";
  constructor(cwd = process.cwd(), opts = {}) {
    const { nocase = true } = opts;
    super(cwd, win32, "\\", { ...opts, nocase });
    this.nocase = nocase;
    for (let p = this.cwd; p; p = p.parent) {
      p.nocase = this.nocase;
    }
  }
  /**
   * @internal
   */
  parseRootPath(dir) {
    return win32.parse(dir).root.toUpperCase();
  }
  /**
   * @internal
   */
  newRoot(fs5) {
    return new PathWin32(this.rootPath, IFDIR, void 0, this.roots, this.nocase, this.childrenCache(), { fs: fs5 });
  }
  /**
   * Return true if the provided path string is an absolute path
   */
  isAbsolute(p) {
    return p.startsWith("/") || p.startsWith("\\") || /^[a-z]:(\/|\\)/i.test(p);
  }
};
var PathScurryPosix = class extends PathScurryBase {
  static {
    __name(this, "PathScurryPosix");
  }
  /**
   * separator for generating path strings
   */
  sep = "/";
  constructor(cwd = process.cwd(), opts = {}) {
    const { nocase = false } = opts;
    super(cwd, posix, "/", { ...opts, nocase });
    this.nocase = nocase;
  }
  /**
   * @internal
   */
  parseRootPath(_dir) {
    return "/";
  }
  /**
   * @internal
   */
  newRoot(fs5) {
    return new PathPosix(this.rootPath, IFDIR, void 0, this.roots, this.nocase, this.childrenCache(), { fs: fs5 });
  }
  /**
   * Return true if the provided path string is an absolute path
   */
  isAbsolute(p) {
    return p.startsWith("/");
  }
};
var PathScurryDarwin = class extends PathScurryPosix {
  static {
    __name(this, "PathScurryDarwin");
  }
  constructor(cwd = process.cwd(), opts = {}) {
    const { nocase = true } = opts;
    super(cwd, { ...opts, nocase });
  }
};
var Path = process.platform === "win32" ? PathWin32 : PathPosix;
var PathScurry = process.platform === "win32" ? PathScurryWin32 : process.platform === "darwin" ? PathScurryDarwin : PathScurryPosix;

// node_modules/glob/dist/esm/pattern.js
var isPatternList = /* @__PURE__ */ __name((pl) => pl.length >= 1, "isPatternList");
var isGlobList = /* @__PURE__ */ __name((gl) => gl.length >= 1, "isGlobList");
var Pattern = class _Pattern {
  static {
    __name(this, "Pattern");
  }
  #patternList;
  #globList;
  #index;
  length;
  #platform;
  #rest;
  #globString;
  #isDrive;
  #isUNC;
  #isAbsolute;
  #followGlobstar = true;
  constructor(patternList, globList, index, platform) {
    if (!isPatternList(patternList)) {
      throw new TypeError("empty pattern list");
    }
    if (!isGlobList(globList)) {
      throw new TypeError("empty glob list");
    }
    if (globList.length !== patternList.length) {
      throw new TypeError("mismatched pattern list and glob list lengths");
    }
    this.length = patternList.length;
    if (index < 0 || index >= this.length) {
      throw new TypeError("index out of range");
    }
    this.#patternList = patternList;
    this.#globList = globList;
    this.#index = index;
    this.#platform = platform;
    if (this.#index === 0) {
      if (this.isUNC()) {
        const [p0, p1, p2, p3, ...prest] = this.#patternList;
        const [g0, g1, g2, g3, ...grest] = this.#globList;
        if (prest[0] === "") {
          prest.shift();
          grest.shift();
        }
        const p = [p0, p1, p2, p3, ""].join("/");
        const g = [g0, g1, g2, g3, ""].join("/");
        this.#patternList = [p, ...prest];
        this.#globList = [g, ...grest];
        this.length = this.#patternList.length;
      } else if (this.isDrive() || this.isAbsolute()) {
        const [p1, ...prest] = this.#patternList;
        const [g1, ...grest] = this.#globList;
        if (prest[0] === "") {
          prest.shift();
          grest.shift();
        }
        const p = p1 + "/";
        const g = g1 + "/";
        this.#patternList = [p, ...prest];
        this.#globList = [g, ...grest];
        this.length = this.#patternList.length;
      }
    }
  }
  /**
   * The first entry in the parsed list of patterns
   */
  pattern() {
    return this.#patternList[this.#index];
  }
  /**
   * true of if pattern() returns a string
   */
  isString() {
    return typeof this.#patternList[this.#index] === "string";
  }
  /**
   * true of if pattern() returns GLOBSTAR
   */
  isGlobstar() {
    return this.#patternList[this.#index] === GLOBSTAR;
  }
  /**
   * true if pattern() returns a regexp
   */
  isRegExp() {
    return this.#patternList[this.#index] instanceof RegExp;
  }
  /**
   * The /-joined set of glob parts that make up this pattern
   */
  globString() {
    return this.#globString = this.#globString || (this.#index === 0 ? this.isAbsolute() ? this.#globList[0] + this.#globList.slice(1).join("/") : this.#globList.join("/") : this.#globList.slice(this.#index).join("/"));
  }
  /**
   * true if there are more pattern parts after this one
   */
  hasMore() {
    return this.length > this.#index + 1;
  }
  /**
   * The rest of the pattern after this part, or null if this is the end
   */
  rest() {
    if (this.#rest !== void 0)
      return this.#rest;
    if (!this.hasMore())
      return this.#rest = null;
    this.#rest = new _Pattern(this.#patternList, this.#globList, this.#index + 1, this.#platform);
    this.#rest.#isAbsolute = this.#isAbsolute;
    this.#rest.#isUNC = this.#isUNC;
    this.#rest.#isDrive = this.#isDrive;
    return this.#rest;
  }
  /**
   * true if the pattern represents a //unc/path/ on windows
   */
  isUNC() {
    const pl = this.#patternList;
    return this.#isUNC !== void 0 ? this.#isUNC : this.#isUNC = this.#platform === "win32" && this.#index === 0 && pl[0] === "" && pl[1] === "" && typeof pl[2] === "string" && !!pl[2] && typeof pl[3] === "string" && !!pl[3];
  }
  // pattern like C:/...
  // split = ['C:', ...]
  // XXX: would be nice to handle patterns like `c:*` to test the cwd
  // in c: for *, but I don't know of a way to even figure out what that
  // cwd is without actually chdir'ing into it?
  /**
   * True if the pattern starts with a drive letter on Windows
   */
  isDrive() {
    const pl = this.#patternList;
    return this.#isDrive !== void 0 ? this.#isDrive : this.#isDrive = this.#platform === "win32" && this.#index === 0 && this.length > 1 && typeof pl[0] === "string" && /^[a-z]:$/i.test(pl[0]);
  }
  // pattern = '/' or '/...' or '/x/...'
  // split = ['', ''] or ['', ...] or ['', 'x', ...]
  // Drive and UNC both considered absolute on windows
  /**
   * True if the pattern is rooted on an absolute path
   */
  isAbsolute() {
    const pl = this.#patternList;
    return this.#isAbsolute !== void 0 ? this.#isAbsolute : this.#isAbsolute = pl[0] === "" && pl.length > 1 || this.isDrive() || this.isUNC();
  }
  /**
   * consume the root of the pattern, and return it
   */
  root() {
    const p = this.#patternList[0];
    return typeof p === "string" && this.isAbsolute() && this.#index === 0 ? p : "";
  }
  /**
   * Check to see if the current globstar pattern is allowed to follow
   * a symbolic link.
   */
  checkFollowGlobstar() {
    return !(this.#index === 0 || !this.isGlobstar() || !this.#followGlobstar);
  }
  /**
   * Mark that the current globstar pattern is following a symbolic link
   */
  markFollowGlobstar() {
    if (this.#index === 0 || !this.isGlobstar() || !this.#followGlobstar)
      return false;
    this.#followGlobstar = false;
    return true;
  }
};

// node_modules/glob/dist/esm/ignore.js
var defaultPlatform2 = typeof process === "object" && process && typeof process.platform === "string" ? process.platform : "linux";
var Ignore = class {
  static {
    __name(this, "Ignore");
  }
  relative;
  relativeChildren;
  absolute;
  absoluteChildren;
  platform;
  mmopts;
  constructor(ignored, { nobrace, nocase, noext, noglobstar, platform = defaultPlatform2 }) {
    this.relative = [];
    this.absolute = [];
    this.relativeChildren = [];
    this.absoluteChildren = [];
    this.platform = platform;
    this.mmopts = {
      dot: true,
      nobrace,
      nocase,
      noext,
      noglobstar,
      optimizationLevel: 2,
      platform,
      nocomment: true,
      nonegate: true
    };
    for (const ign of ignored)
      this.add(ign);
  }
  add(ign) {
    const mm = new Minimatch(ign, this.mmopts);
    for (let i = 0; i < mm.set.length; i++) {
      const parsed = mm.set[i];
      const globParts = mm.globParts[i];
      if (!parsed || !globParts) {
        throw new Error("invalid pattern object");
      }
      while (parsed[0] === "." && globParts[0] === ".") {
        parsed.shift();
        globParts.shift();
      }
      const p = new Pattern(parsed, globParts, 0, this.platform);
      const m = new Minimatch(p.globString(), this.mmopts);
      const children = globParts[globParts.length - 1] === "**";
      const absolute = p.isAbsolute();
      if (absolute)
        this.absolute.push(m);
      else
        this.relative.push(m);
      if (children) {
        if (absolute)
          this.absoluteChildren.push(m);
        else
          this.relativeChildren.push(m);
      }
    }
  }
  ignored(p) {
    const fullpath = p.fullpath();
    const fullpaths = `${fullpath}/`;
    const relative = p.relative() || ".";
    const relatives = `${relative}/`;
    for (const m of this.relative) {
      if (m.match(relative) || m.match(relatives))
        return true;
    }
    for (const m of this.absolute) {
      if (m.match(fullpath) || m.match(fullpaths))
        return true;
    }
    return false;
  }
  childrenIgnored(p) {
    const fullpath = p.fullpath() + "/";
    const relative = (p.relative() || ".") + "/";
    for (const m of this.relativeChildren) {
      if (m.match(relative))
        return true;
    }
    for (const m of this.absoluteChildren) {
      if (m.match(fullpath))
        return true;
    }
    return false;
  }
};

// node_modules/glob/dist/esm/processor.js
var HasWalkedCache = class _HasWalkedCache {
  static {
    __name(this, "HasWalkedCache");
  }
  store;
  constructor(store = /* @__PURE__ */ new Map()) {
    this.store = store;
  }
  copy() {
    return new _HasWalkedCache(new Map(this.store));
  }
  hasWalked(target, pattern) {
    return this.store.get(target.fullpath())?.has(pattern.globString());
  }
  storeWalked(target, pattern) {
    const fullpath = target.fullpath();
    const cached = this.store.get(fullpath);
    if (cached)
      cached.add(pattern.globString());
    else
      this.store.set(fullpath, /* @__PURE__ */ new Set([pattern.globString()]));
  }
};
var MatchRecord = class {
  static {
    __name(this, "MatchRecord");
  }
  store = /* @__PURE__ */ new Map();
  add(target, absolute, ifDir) {
    const n = (absolute ? 2 : 0) | (ifDir ? 1 : 0);
    const current = this.store.get(target);
    this.store.set(target, current === void 0 ? n : n & current);
  }
  // match, absolute, ifdir
  entries() {
    return [...this.store.entries()].map(([path9, n]) => [
      path9,
      !!(n & 2),
      !!(n & 1)
    ]);
  }
};
var SubWalks = class {
  static {
    __name(this, "SubWalks");
  }
  store = /* @__PURE__ */ new Map();
  add(target, pattern) {
    if (!target.canReaddir()) {
      return;
    }
    const subs = this.store.get(target);
    if (subs) {
      if (!subs.find((p) => p.globString() === pattern.globString())) {
        subs.push(pattern);
      }
    } else
      this.store.set(target, [pattern]);
  }
  get(target) {
    const subs = this.store.get(target);
    if (!subs) {
      throw new Error("attempting to walk unknown path");
    }
    return subs;
  }
  entries() {
    return this.keys().map((k) => [k, this.store.get(k)]);
  }
  keys() {
    return [...this.store.keys()].filter((t) => t.canReaddir());
  }
};
var Processor = class _Processor {
  static {
    __name(this, "Processor");
  }
  hasWalkedCache;
  matches = new MatchRecord();
  subwalks = new SubWalks();
  patterns;
  follow;
  dot;
  opts;
  constructor(opts, hasWalkedCache) {
    this.opts = opts;
    this.follow = !!opts.follow;
    this.dot = !!opts.dot;
    this.hasWalkedCache = hasWalkedCache ? hasWalkedCache.copy() : new HasWalkedCache();
  }
  processPatterns(target, patterns) {
    this.patterns = patterns;
    const processingSet = patterns.map((p) => [target, p]);
    for (let [t, pattern] of processingSet) {
      this.hasWalkedCache.storeWalked(t, pattern);
      const root = pattern.root();
      const absolute = pattern.isAbsolute() && this.opts.absolute !== false;
      if (root) {
        t = t.resolve(root === "/" && this.opts.root !== void 0 ? this.opts.root : root);
        const rest2 = pattern.rest();
        if (!rest2) {
          this.matches.add(t, true, false);
          continue;
        } else {
          pattern = rest2;
        }
      }
      if (t.isENOENT())
        continue;
      let p;
      let rest;
      let changed = false;
      while (typeof (p = pattern.pattern()) === "string" && (rest = pattern.rest())) {
        const c = t.resolve(p);
        t = c;
        pattern = rest;
        changed = true;
      }
      p = pattern.pattern();
      rest = pattern.rest();
      if (changed) {
        if (this.hasWalkedCache.hasWalked(t, pattern))
          continue;
        this.hasWalkedCache.storeWalked(t, pattern);
      }
      if (typeof p === "string") {
        const ifDir = p === ".." || p === "" || p === ".";
        this.matches.add(t.resolve(p), absolute, ifDir);
        continue;
      } else if (p === GLOBSTAR) {
        if (!t.isSymbolicLink() || this.follow || pattern.checkFollowGlobstar()) {
          this.subwalks.add(t, pattern);
        }
        const rp = rest?.pattern();
        const rrest = rest?.rest();
        if (!rest || (rp === "" || rp === ".") && !rrest) {
          this.matches.add(t, absolute, rp === "" || rp === ".");
        } else {
          if (rp === "..") {
            const tp = t.parent || t;
            if (!rrest)
              this.matches.add(tp, absolute, true);
            else if (!this.hasWalkedCache.hasWalked(tp, rrest)) {
              this.subwalks.add(tp, rrest);
            }
          }
        }
      } else if (p instanceof RegExp) {
        this.subwalks.add(t, pattern);
      }
    }
    return this;
  }
  subwalkTargets() {
    return this.subwalks.keys();
  }
  child() {
    return new _Processor(this.opts, this.hasWalkedCache);
  }
  // return a new Processor containing the subwalks for each
  // child entry, and a set of matches, and
  // a hasWalkedCache that's a copy of this one
  // then we're going to call
  filterEntries(parent, entries) {
    const patterns = this.subwalks.get(parent);
    const results = this.child();
    for (const e of entries) {
      for (const pattern of patterns) {
        const absolute = pattern.isAbsolute();
        const p = pattern.pattern();
        const rest = pattern.rest();
        if (p === GLOBSTAR) {
          results.testGlobstar(e, pattern, rest, absolute);
        } else if (p instanceof RegExp) {
          results.testRegExp(e, p, rest, absolute);
        } else {
          results.testString(e, p, rest, absolute);
        }
      }
    }
    return results;
  }
  testGlobstar(e, pattern, rest, absolute) {
    if (this.dot || !e.name.startsWith(".")) {
      if (!pattern.hasMore()) {
        this.matches.add(e, absolute, false);
      }
      if (e.canReaddir()) {
        if (this.follow || !e.isSymbolicLink()) {
          this.subwalks.add(e, pattern);
        } else if (e.isSymbolicLink()) {
          if (rest && pattern.checkFollowGlobstar()) {
            this.subwalks.add(e, rest);
          } else if (pattern.markFollowGlobstar()) {
            this.subwalks.add(e, pattern);
          }
        }
      }
    }
    if (rest) {
      const rp = rest.pattern();
      if (typeof rp === "string" && // dots and empty were handled already
      rp !== ".." && rp !== "" && rp !== ".") {
        this.testString(e, rp, rest.rest(), absolute);
      } else if (rp === "..") {
        const ep = e.parent || e;
        this.subwalks.add(ep, rest);
      } else if (rp instanceof RegExp) {
        this.testRegExp(e, rp, rest.rest(), absolute);
      }
    }
  }
  testRegExp(e, p, rest, absolute) {
    if (!p.test(e.name))
      return;
    if (!rest) {
      this.matches.add(e, absolute, false);
    } else {
      this.subwalks.add(e, rest);
    }
  }
  testString(e, p, rest, absolute) {
    if (!e.isNamed(p))
      return;
    if (!rest) {
      this.matches.add(e, absolute, false);
    } else {
      this.subwalks.add(e, rest);
    }
  }
};

// node_modules/glob/dist/esm/walker.js
var makeIgnore = /* @__PURE__ */ __name((ignore, opts) => typeof ignore === "string" ? new Ignore([ignore], opts) : Array.isArray(ignore) ? new Ignore(ignore, opts) : ignore, "makeIgnore");
var GlobUtil = class {
  static {
    __name(this, "GlobUtil");
  }
  path;
  patterns;
  opts;
  seen = /* @__PURE__ */ new Set();
  paused = false;
  aborted = false;
  #onResume = [];
  #ignore;
  #sep;
  signal;
  maxDepth;
  includeChildMatches;
  constructor(patterns, path9, opts) {
    this.patterns = patterns;
    this.path = path9;
    this.opts = opts;
    this.#sep = !opts.posix && opts.platform === "win32" ? "\\" : "/";
    this.includeChildMatches = opts.includeChildMatches !== false;
    if (opts.ignore || !this.includeChildMatches) {
      this.#ignore = makeIgnore(opts.ignore ?? [], opts);
      if (!this.includeChildMatches && typeof this.#ignore.add !== "function") {
        const m = "cannot ignore child matches, ignore lacks add() method.";
        throw new Error(m);
      }
    }
    this.maxDepth = opts.maxDepth || Infinity;
    if (opts.signal) {
      this.signal = opts.signal;
      this.signal.addEventListener("abort", () => {
        this.#onResume.length = 0;
      });
    }
  }
  #ignored(path9) {
    return this.seen.has(path9) || !!this.#ignore?.ignored?.(path9);
  }
  #childrenIgnored(path9) {
    return !!this.#ignore?.childrenIgnored?.(path9);
  }
  // backpressure mechanism
  pause() {
    this.paused = true;
  }
  resume() {
    if (this.signal?.aborted)
      return;
    this.paused = false;
    let fn = void 0;
    while (!this.paused && (fn = this.#onResume.shift())) {
      fn();
    }
  }
  onResume(fn) {
    if (this.signal?.aborted)
      return;
    if (!this.paused) {
      fn();
    } else {
      this.#onResume.push(fn);
    }
  }
  // do the requisite realpath/stat checking, and return the path
  // to add or undefined to filter it out.
  async matchCheck(e, ifDir) {
    if (ifDir && this.opts.nodir)
      return void 0;
    let rpc;
    if (this.opts.realpath) {
      rpc = e.realpathCached() || await e.realpath();
      if (!rpc)
        return void 0;
      e = rpc;
    }
    const needStat = e.isUnknown() || this.opts.stat;
    const s = needStat ? await e.lstat() : e;
    if (this.opts.follow && this.opts.nodir && s?.isSymbolicLink()) {
      const target = await s.realpath();
      if (target && (target.isUnknown() || this.opts.stat)) {
        await target.lstat();
      }
    }
    return this.matchCheckTest(s, ifDir);
  }
  matchCheckTest(e, ifDir) {
    return e && (this.maxDepth === Infinity || e.depth() <= this.maxDepth) && (!ifDir || e.canReaddir()) && (!this.opts.nodir || !e.isDirectory()) && (!this.opts.nodir || !this.opts.follow || !e.isSymbolicLink() || !e.realpathCached()?.isDirectory()) && !this.#ignored(e) ? e : void 0;
  }
  matchCheckSync(e, ifDir) {
    if (ifDir && this.opts.nodir)
      return void 0;
    let rpc;
    if (this.opts.realpath) {
      rpc = e.realpathCached() || e.realpathSync();
      if (!rpc)
        return void 0;
      e = rpc;
    }
    const needStat = e.isUnknown() || this.opts.stat;
    const s = needStat ? e.lstatSync() : e;
    if (this.opts.follow && this.opts.nodir && s?.isSymbolicLink()) {
      const target = s.realpathSync();
      if (target && (target?.isUnknown() || this.opts.stat)) {
        target.lstatSync();
      }
    }
    return this.matchCheckTest(s, ifDir);
  }
  matchFinish(e, absolute) {
    if (this.#ignored(e))
      return;
    if (!this.includeChildMatches && this.#ignore?.add) {
      const ign = `${e.relativePosix()}/**`;
      this.#ignore.add(ign);
    }
    const abs = this.opts.absolute === void 0 ? absolute : this.opts.absolute;
    this.seen.add(e);
    const mark = this.opts.mark && e.isDirectory() ? this.#sep : "";
    if (this.opts.withFileTypes) {
      this.matchEmit(e);
    } else if (abs) {
      const abs2 = this.opts.posix ? e.fullpathPosix() : e.fullpath();
      this.matchEmit(abs2 + mark);
    } else {
      const rel = this.opts.posix ? e.relativePosix() : e.relative();
      const pre = this.opts.dotRelative && !rel.startsWith(".." + this.#sep) ? "." + this.#sep : "";
      this.matchEmit(!rel ? "." + mark : pre + rel + mark);
    }
  }
  async match(e, absolute, ifDir) {
    const p = await this.matchCheck(e, ifDir);
    if (p)
      this.matchFinish(p, absolute);
  }
  matchSync(e, absolute, ifDir) {
    const p = this.matchCheckSync(e, ifDir);
    if (p)
      this.matchFinish(p, absolute);
  }
  walkCB(target, patterns, cb) {
    if (this.signal?.aborted)
      cb();
    this.walkCB2(target, patterns, new Processor(this.opts), cb);
  }
  walkCB2(target, patterns, processor, cb) {
    if (this.#childrenIgnored(target))
      return cb();
    if (this.signal?.aborted)
      cb();
    if (this.paused) {
      this.onResume(() => this.walkCB2(target, patterns, processor, cb));
      return;
    }
    processor.processPatterns(target, patterns);
    let tasks = 1;
    const next = /* @__PURE__ */ __name(() => {
      if (--tasks === 0)
        cb();
    }, "next");
    for (const [m, absolute, ifDir] of processor.matches.entries()) {
      if (this.#ignored(m))
        continue;
      tasks++;
      this.match(m, absolute, ifDir).then(() => next());
    }
    for (const t of processor.subwalkTargets()) {
      if (this.maxDepth !== Infinity && t.depth() >= this.maxDepth) {
        continue;
      }
      tasks++;
      const childrenCached = t.readdirCached();
      if (t.calledReaddir())
        this.walkCB3(t, childrenCached, processor, next);
      else {
        t.readdirCB((_, entries) => this.walkCB3(t, entries, processor, next), true);
      }
    }
    next();
  }
  walkCB3(target, entries, processor, cb) {
    processor = processor.filterEntries(target, entries);
    let tasks = 1;
    const next = /* @__PURE__ */ __name(() => {
      if (--tasks === 0)
        cb();
    }, "next");
    for (const [m, absolute, ifDir] of processor.matches.entries()) {
      if (this.#ignored(m))
        continue;
      tasks++;
      this.match(m, absolute, ifDir).then(() => next());
    }
    for (const [target2, patterns] of processor.subwalks.entries()) {
      tasks++;
      this.walkCB2(target2, patterns, processor.child(), next);
    }
    next();
  }
  walkCBSync(target, patterns, cb) {
    if (this.signal?.aborted)
      cb();
    this.walkCB2Sync(target, patterns, new Processor(this.opts), cb);
  }
  walkCB2Sync(target, patterns, processor, cb) {
    if (this.#childrenIgnored(target))
      return cb();
    if (this.signal?.aborted)
      cb();
    if (this.paused) {
      this.onResume(() => this.walkCB2Sync(target, patterns, processor, cb));
      return;
    }
    processor.processPatterns(target, patterns);
    let tasks = 1;
    const next = /* @__PURE__ */ __name(() => {
      if (--tasks === 0)
        cb();
    }, "next");
    for (const [m, absolute, ifDir] of processor.matches.entries()) {
      if (this.#ignored(m))
        continue;
      this.matchSync(m, absolute, ifDir);
    }
    for (const t of processor.subwalkTargets()) {
      if (this.maxDepth !== Infinity && t.depth() >= this.maxDepth) {
        continue;
      }
      tasks++;
      const children = t.readdirSync();
      this.walkCB3Sync(t, children, processor, next);
    }
    next();
  }
  walkCB3Sync(target, entries, processor, cb) {
    processor = processor.filterEntries(target, entries);
    let tasks = 1;
    const next = /* @__PURE__ */ __name(() => {
      if (--tasks === 0)
        cb();
    }, "next");
    for (const [m, absolute, ifDir] of processor.matches.entries()) {
      if (this.#ignored(m))
        continue;
      this.matchSync(m, absolute, ifDir);
    }
    for (const [target2, patterns] of processor.subwalks.entries()) {
      tasks++;
      this.walkCB2Sync(target2, patterns, processor.child(), next);
    }
    next();
  }
};
var GlobWalker = class extends GlobUtil {
  static {
    __name(this, "GlobWalker");
  }
  matches = /* @__PURE__ */ new Set();
  constructor(patterns, path9, opts) {
    super(patterns, path9, opts);
  }
  matchEmit(e) {
    this.matches.add(e);
  }
  async walk() {
    if (this.signal?.aborted)
      throw this.signal.reason;
    if (this.path.isUnknown()) {
      await this.path.lstat();
    }
    await new Promise((res, rej) => {
      this.walkCB(this.path, this.patterns, () => {
        if (this.signal?.aborted) {
          rej(this.signal.reason);
        } else {
          res(this.matches);
        }
      });
    });
    return this.matches;
  }
  walkSync() {
    if (this.signal?.aborted)
      throw this.signal.reason;
    if (this.path.isUnknown()) {
      this.path.lstatSync();
    }
    this.walkCBSync(this.path, this.patterns, () => {
      if (this.signal?.aborted)
        throw this.signal.reason;
    });
    return this.matches;
  }
};
var GlobStream = class extends GlobUtil {
  static {
    __name(this, "GlobStream");
  }
  results;
  constructor(patterns, path9, opts) {
    super(patterns, path9, opts);
    this.results = new Minipass({
      signal: this.signal,
      objectMode: true
    });
    this.results.on("drain", () => this.resume());
    this.results.on("resume", () => this.resume());
  }
  matchEmit(e) {
    this.results.write(e);
    if (!this.results.flowing)
      this.pause();
  }
  stream() {
    const target = this.path;
    if (target.isUnknown()) {
      target.lstat().then(() => {
        this.walkCB(target, this.patterns, () => this.results.end());
      });
    } else {
      this.walkCB(target, this.patterns, () => this.results.end());
    }
    return this.results;
  }
  streamSync() {
    if (this.path.isUnknown()) {
      this.path.lstatSync();
    }
    this.walkCBSync(this.path, this.patterns, () => this.results.end());
    return this.results;
  }
};

// node_modules/glob/dist/esm/glob.js
var defaultPlatform3 = typeof process === "object" && process && typeof process.platform === "string" ? process.platform : "linux";
var Glob = class {
  static {
    __name(this, "Glob");
  }
  absolute;
  cwd;
  root;
  dot;
  dotRelative;
  follow;
  ignore;
  magicalBraces;
  mark;
  matchBase;
  maxDepth;
  nobrace;
  nocase;
  nodir;
  noext;
  noglobstar;
  pattern;
  platform;
  realpath;
  scurry;
  stat;
  signal;
  windowsPathsNoEscape;
  withFileTypes;
  includeChildMatches;
  /**
   * The options provided to the constructor.
   */
  opts;
  /**
   * An array of parsed immutable {@link Pattern} objects.
   */
  patterns;
  /**
   * All options are stored as properties on the `Glob` object.
   *
   * See {@link GlobOptions} for full options descriptions.
   *
   * Note that a previous `Glob` object can be passed as the
   * `GlobOptions` to another `Glob` instantiation to re-use settings
   * and caches with a new pattern.
   *
   * Traversal functions can be called multiple times to run the walk
   * again.
   */
  constructor(pattern, opts) {
    if (!opts)
      throw new TypeError("glob options required");
    this.withFileTypes = !!opts.withFileTypes;
    this.signal = opts.signal;
    this.follow = !!opts.follow;
    this.dot = !!opts.dot;
    this.dotRelative = !!opts.dotRelative;
    this.nodir = !!opts.nodir;
    this.mark = !!opts.mark;
    if (!opts.cwd) {
      this.cwd = "";
    } else if (opts.cwd instanceof URL || opts.cwd.startsWith("file://")) {
      opts.cwd = fileURLToPath4(opts.cwd);
    }
    this.cwd = opts.cwd || "";
    this.root = opts.root;
    this.magicalBraces = !!opts.magicalBraces;
    this.nobrace = !!opts.nobrace;
    this.noext = !!opts.noext;
    this.realpath = !!opts.realpath;
    this.absolute = opts.absolute;
    this.includeChildMatches = opts.includeChildMatches !== false;
    this.noglobstar = !!opts.noglobstar;
    this.matchBase = !!opts.matchBase;
    this.maxDepth = typeof opts.maxDepth === "number" ? opts.maxDepth : Infinity;
    this.stat = !!opts.stat;
    this.ignore = opts.ignore;
    if (this.withFileTypes && this.absolute !== void 0) {
      throw new Error("cannot set absolute and withFileTypes:true");
    }
    if (typeof pattern === "string") {
      pattern = [pattern];
    }
    this.windowsPathsNoEscape = !!opts.windowsPathsNoEscape || opts.allowWindowsEscape === false;
    if (this.windowsPathsNoEscape) {
      pattern = pattern.map((p) => p.replace(/\\/g, "/"));
    }
    if (this.matchBase) {
      if (opts.noglobstar) {
        throw new TypeError("base matching requires globstar");
      }
      pattern = pattern.map((p) => p.includes("/") ? p : `./**/${p}`);
    }
    this.pattern = pattern;
    this.platform = opts.platform || defaultPlatform3;
    this.opts = { ...opts, platform: this.platform };
    if (opts.scurry) {
      this.scurry = opts.scurry;
      if (opts.nocase !== void 0 && opts.nocase !== opts.scurry.nocase) {
        throw new Error("nocase option contradicts provided scurry option");
      }
    } else {
      const Scurry = opts.platform === "win32" ? PathScurryWin32 : opts.platform === "darwin" ? PathScurryDarwin : opts.platform ? PathScurryPosix : PathScurry;
      this.scurry = new Scurry(this.cwd, {
        nocase: opts.nocase,
        fs: opts.fs
      });
    }
    this.nocase = this.scurry.nocase;
    const nocaseMagicOnly = this.platform === "darwin" || this.platform === "win32";
    const mmo = {
      // default nocase based on platform
      ...opts,
      dot: this.dot,
      matchBase: this.matchBase,
      nobrace: this.nobrace,
      nocase: this.nocase,
      nocaseMagicOnly,
      nocomment: true,
      noext: this.noext,
      nonegate: true,
      optimizationLevel: 2,
      platform: this.platform,
      windowsPathsNoEscape: this.windowsPathsNoEscape,
      debug: !!this.opts.debug
    };
    const mms = this.pattern.map((p) => new Minimatch(p, mmo));
    const [matchSet, globParts] = mms.reduce((set, m) => {
      set[0].push(...m.set);
      set[1].push(...m.globParts);
      return set;
    }, [[], []]);
    this.patterns = matchSet.map((set, i) => {
      const g = globParts[i];
      if (!g)
        throw new Error("invalid pattern object");
      return new Pattern(set, g, 0, this.platform);
    });
  }
  async walk() {
    return [
      ...await new GlobWalker(this.patterns, this.scurry.cwd, {
        ...this.opts,
        maxDepth: this.maxDepth !== Infinity ? this.maxDepth + this.scurry.cwd.depth() : Infinity,
        platform: this.platform,
        nocase: this.nocase,
        includeChildMatches: this.includeChildMatches
      }).walk()
    ];
  }
  walkSync() {
    return [
      ...new GlobWalker(this.patterns, this.scurry.cwd, {
        ...this.opts,
        maxDepth: this.maxDepth !== Infinity ? this.maxDepth + this.scurry.cwd.depth() : Infinity,
        platform: this.platform,
        nocase: this.nocase,
        includeChildMatches: this.includeChildMatches
      }).walkSync()
    ];
  }
  stream() {
    return new GlobStream(this.patterns, this.scurry.cwd, {
      ...this.opts,
      maxDepth: this.maxDepth !== Infinity ? this.maxDepth + this.scurry.cwd.depth() : Infinity,
      platform: this.platform,
      nocase: this.nocase,
      includeChildMatches: this.includeChildMatches
    }).stream();
  }
  streamSync() {
    return new GlobStream(this.patterns, this.scurry.cwd, {
      ...this.opts,
      maxDepth: this.maxDepth !== Infinity ? this.maxDepth + this.scurry.cwd.depth() : Infinity,
      platform: this.platform,
      nocase: this.nocase,
      includeChildMatches: this.includeChildMatches
    }).streamSync();
  }
  /**
   * Default sync iteration function. Returns a Generator that
   * iterates over the results.
   */
  iterateSync() {
    return this.streamSync()[Symbol.iterator]();
  }
  [Symbol.iterator]() {
    return this.iterateSync();
  }
  /**
   * Default async iteration function. Returns an AsyncGenerator that
   * iterates over the results.
   */
  iterate() {
    return this.stream()[Symbol.asyncIterator]();
  }
  [Symbol.asyncIterator]() {
    return this.iterate();
  }
};

// node_modules/glob/dist/esm/has-magic.js
var hasMagic = /* @__PURE__ */ __name((pattern, options = {}) => {
  if (!Array.isArray(pattern)) {
    pattern = [pattern];
  }
  for (const p of pattern) {
    if (new Minimatch(p, options).hasMagic())
      return true;
  }
  return false;
}, "hasMagic");

// node_modules/glob/dist/esm/index.js
function globStreamSync(pattern, options = {}) {
  return new Glob(pattern, options).streamSync();
}
__name(globStreamSync, "globStreamSync");
function globStream(pattern, options = {}) {
  return new Glob(pattern, options).stream();
}
__name(globStream, "globStream");
function globSync(pattern, options = {}) {
  return new Glob(pattern, options).walkSync();
}
__name(globSync, "globSync");
async function glob_(pattern, options = {}) {
  return new Glob(pattern, options).walk();
}
__name(glob_, "glob_");
function globIterateSync(pattern, options = {}) {
  return new Glob(pattern, options).iterateSync();
}
__name(globIterateSync, "globIterateSync");
function globIterate(pattern, options = {}) {
  return new Glob(pattern, options).iterate();
}
__name(globIterate, "globIterate");
var streamSync = globStreamSync;
var stream = Object.assign(globStream, { sync: globStreamSync });
var iterateSync = globIterateSync;
var iterate = Object.assign(globIterate, {
  sync: globIterateSync
});
var sync = Object.assign(globSync, {
  stream: globStreamSync,
  iterate: globIterateSync
});
var glob = Object.assign(glob_, {
  glob: glob_,
  globSync,
  sync,
  globStream,
  stream,
  globStreamSync,
  streamSync,
  globIterate,
  iterate,
  globIterateSync,
  iterateSync,
  Glob,
  hasMagic,
  escape: escape2,
  unescape: unescape2
});
glob.glob = glob;

// src/alFileScanner.ts
var ALFileScanner = class {
  static {
    __name(this, "ALFileScanner");
  }
  logger;
  constructor(logger) {
    this.logger = logger;
  }
  /**
   * Scans the workspace for all AL files
   * @param workspacePath The root path of the workspace to scan
   * @param testCodeunitsOnly If true, only returns test codeunits
   * @returns Array of AL files found
   */
  async scanWorkspaceForALFiles(workspacePath, testCodeunitsOnly = false) {
    this.logger.info(`Scanning workspace for AL files: ${workspacePath}`);
    try {
      const pattern = path7.join(workspacePath, "**/*.al").replace(/\\/g, "/");
      const files = await glob(pattern, {
        ignore: ["**/node_modules/**", "**/.git/**", "**/.alpackages/**"],
        nodir: true
      });
      this.logger.info(`Found ${files.length} AL files in workspace`);
      const alFiles = [];
      for (const filePath of files) {
        try {
          const content = await fs4.readFile(filePath, "utf-8");
          if (testCodeunitsOnly && !this.isTestCodeunit(content)) {
            continue;
          }
          const alObject = this.extractALObjectFromContent(content, filePath);
          if (alObject) {
            alFiles.push({
              object: alObject,
              path: filePath,
              content
            });
          }
        } catch (error) {
          this.logger.warn(`Failed to process AL file ${filePath}: ${error}`);
        }
      }
      this.logger.info(`Processed ${alFiles.length} ${testCodeunitsOnly ? "test codeunit" : "AL"} files`);
      return alFiles;
    } catch (error) {
      this.logger.error(`Error scanning workspace: ${error}`);
      throw error;
    }
  }
  /**
   * Scans the workspace for test codeunits
   * @param workspacePath The root path of the workspace to scan
   * @returns Array of test codeunits with their test methods
   */
  async scanWorkspaceForTestCodeunits(workspacePath) {
    this.logger.info("Scanning workspace for test codeunits");
    const testFiles = await this.scanWorkspaceForALFiles(workspacePath, true);
    const testCodeunits = [];
    for (const file of testFiles) {
      const testMethods = this.extractTestMethodsFromContent(file.content ?? "");
      if (testMethods.length > 0 || this.isTestCodeunit(file.content ?? "")) {
        testCodeunits.push({
          file,
          testMethods
        });
        this.logger.info(`Found test codeunit: ${file.object.name} (ID: ${file.object.id}) with ${testMethods.length} test methods`);
      }
    }
    this.logger.info(`Total test codeunits found: ${testCodeunits.length}`);
    return testCodeunits;
  }
  /**
   * Checks if the content represents a test codeunit
   * @param content The file content to check
   * @returns True if this is a test codeunit
   */
  isTestCodeunit(content) {
    const testCodeunitPattern = /Sub(t|T)ype\s*=\s*(t|T)est\s*;/;
    return testCodeunitPattern.test(content);
  }
  /**
   * Extracts AL object information from file content
   * @param content The file content
   * @param filePath The path to the file (for error reporting)
   * @returns The AL object or null if not found
   */
  extractALObjectFromContent(content, filePath) {
    try {
      const objectPattern = /^\s*(codeunit|page|pageextension|pagecustomization|tableextension|table|report|reportextension|xmlport|query|enum|enumextension|permissionset|permissionsetextension|profile|controladdin)\s+(\d+)\s+(?:"([^"]+)"|([^\s{]+))/mi;
      const match2 = content.match(objectPattern);
      if (match2?.[1] !== void 0 && match2[2] !== void 0) {
        const type = match2[1].toLowerCase();
        const id = parseInt(match2[2], 10);
        const name = match2[3] ?? match2[4] ?? `Unnamed ${type} ${id}`;
        return {
          type,
          id,
          name
        };
      }
      this.logger.warn(`Could not extract AL object from file: ${filePath}`);
      return null;
    } catch (error) {
      this.logger.error(`Error extracting AL object from ${filePath}: ${error}`);
      return null;
    }
  }
  /**
   * Extracts test methods from codeunit content
   * @param content The codeunit file content
   * @returns Array of test methods found
   */
  extractTestMethodsFromContent(content) {
    const testMethods = [];
    try {
      const lines = content.split(/\r?\n/);
      const testAttributePattern = /^\s*\[Test\]/i;
      const procedurePattern = /^\s*(?:local\s+)?procedure\s+([^\s(]+)/i;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === void 0 || line === "") {
          continue;
        }
        if (testAttributePattern.test(line)) {
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const nextLine = lines[j];
            if (nextLine === void 0 || nextLine === "") {
              continue;
            }
            const procMatch = nextLine.match(procedurePattern);
            if (procMatch?.[1] !== void 0) {
              const methodName = procMatch[1];
              const blockBeforeTest = lines.slice(Math.max(0, i - 5), i).join("\n");
              if (blockBeforeTest.includes("/*") && !blockBeforeTest.includes("*/")) {
                break;
              }
              testMethods.push({
                name: methodName,
                lineNumber: j + 1
                // 1-based line number
              });
              this.logger.debug(`Found test method: ${methodName} at line ${j + 1}`);
              break;
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error extracting test methods: ${error}`);
    }
    return testMethods;
  }
  /**
   * Gets a specific test codeunit by ID
   * @param workspacePath The workspace path
   * @param codeunitId The codeunit ID to find
   * @returns The test codeunit or null if not found
   */
  async getTestCodeunitById(workspacePath, codeunitId) {
    this.logger.info(`Looking for test codeunit with ID: ${codeunitId}`);
    const testCodeunits = await this.scanWorkspaceForTestCodeunits(workspacePath);
    const found = testCodeunits.find((tc) => tc.file.object.id === codeunitId);
    if (found !== void 0) {
      this.logger.info(`Found test codeunit: ${found.file.object.name}`);
    } else {
      this.logger.warn(`Test codeunit with ID ${codeunitId} not found`);
    }
    return found ?? null;
  }
  /**
   * Gets all test codeunit IDs in the workspace
   * @param workspacePath The workspace path
   * @returns Array of codeunit IDs
   */
  async getAllTestCodeunitIds(workspacePath) {
    const testCodeunits = await this.scanWorkspaceForTestCodeunits(workspacePath);
    return testCodeunits.map((tc) => tc.file.object.id);
  }
  /**
   * Creates a test summary report
   * @param workspacePath The workspace path
   * @returns A formatted summary of all tests
   */
  async createTestSummary(workspacePath) {
    const testCodeunits = await this.scanWorkspaceForTestCodeunits(workspacePath);
    if (testCodeunits.length === 0) {
      return "No test codeunits found in workspace";
    }
    let summary = `Found ${testCodeunits.length} test codeunits:

`;
    for (const tc of testCodeunits) {
      summary += `Codeunit ${tc.file.object.id} "${tc.file.object.name}"
`;
      summary += `  Path: ${tc.file.path}
`;
      summary += `  Test Methods: ${tc.testMethods.length}
`;
      if (tc.testMethods.length > 0) {
        for (const method of tc.testMethods) {
          summary += `    - ${method.name} (line ${method.lineNumber})
`;
        }
      }
      summary += "\n";
    }
    return summary;
  }
};

// src/testRegistry.ts
import * as path8 from "path";
var TestRegistry = class {
  static {
    __name(this, "TestRegistry");
  }
  cache = /* @__PURE__ */ new Map();
  scanner;
  logger;
  cacheExpirationMs = 5 * 60 * 1e3;
  // 5 minutes default
  constructor(logger) {
    this.logger = logger;
    this.scanner = new ALFileScanner(logger);
  }
  /**
   * Sets the cache expiration time
   * @param ms Milliseconds before cache expires
   */
  setCacheExpiration(ms) {
    this.cacheExpirationMs = ms;
  }
  /**
   * Gets test codeunits for a workspace, using cache if available
   * @param workspacePath The workspace path
   * @param forceRefresh If true, bypasses cache
   * @returns Array of test codeunits
   */
  async getTestCodeunits(workspacePath, forceRefresh = false) {
    const normalizedPath = path8.normalize(workspacePath);
    if (!forceRefresh) {
      const cached = this.cache.get(normalizedPath);
      if (cached && this.isCacheValid(cached)) {
        this.logger.info(`Using cached test data for ${normalizedPath} (${cached.totalCodeunits} codeunits, ${cached.totalTests} tests)`);
        return cached.testCodeunits;
      }
    }
    this.logger.info(`Scanning workspace for tests: ${normalizedPath}`);
    const testCodeunits = await this.scanner.scanWorkspaceForTestCodeunits(normalizedPath);
    const totalTests = testCodeunits.reduce((sum, tc) => sum + tc.testMethods.length, 0);
    const cacheEntry = {
      workspacePath: normalizedPath,
      lastScanTime: /* @__PURE__ */ new Date(),
      testCodeunits,
      totalTests,
      totalCodeunits: testCodeunits.length
    };
    this.cache.set(normalizedPath, cacheEntry);
    this.logger.info(`Cached test data: ${testCodeunits.length} codeunits with ${totalTests} tests`);
    return testCodeunits;
  }
  /**
   * Gets a specific test codeunit by ID
   * @param workspacePath The workspace path
   * @param codeunitId The codeunit ID
   * @returns The test codeunit or null if not found
   */
  async getTestCodeunitById(workspacePath, codeunitId) {
    const testCodeunits = await this.getTestCodeunits(workspacePath);
    return testCodeunits.find((tc) => tc.file.object.id === codeunitId) || null;
  }
  /**
   * Gets a specific test method
   * @param workspacePath The workspace path
   * @param codeunitId The codeunit ID
   * @param methodName The test method name
   * @returns True if the test exists
   */
  async hasTestMethod(workspacePath, codeunitId, methodName) {
    const codeunit = await this.getTestCodeunitById(workspacePath, codeunitId);
    if (!codeunit) {
      return false;
    }
    return codeunit.testMethods.some((tm) => tm.name === methodName);
  }
  /**
   * Gets all test codeunit IDs
   * @param workspacePath The workspace path
   * @returns Array of codeunit IDs
   */
  async getAllTestCodeunitIds(workspacePath) {
    const testCodeunits = await this.getTestCodeunits(workspacePath);
    return testCodeunits.map((tc) => tc.file.object.id);
  }
  /**
   * Searches for test codeunits by name
   * @param workspacePath The workspace path
   * @param searchTerm The search term (partial match)
   * @returns Matching test codeunits
   */
  async searchTestCodeunitsByName(workspacePath, searchTerm) {
    const testCodeunits = await this.getTestCodeunits(workspacePath);
    const lowerSearch = searchTerm.toLowerCase();
    return testCodeunits.filter(
      (tc) => tc.file.object.name.toLowerCase().includes(lowerSearch)
    );
  }
  /**
   * Gets test statistics for a workspace
   * @param workspacePath The workspace path
   * @returns Test statistics
   */
  async getTestStatistics(workspacePath) {
    const testCodeunits = await this.getTestCodeunits(workspacePath);
    const totalTests = testCodeunits.reduce((sum, tc) => sum + tc.testMethods.length, 0);
    let largestCodeunit = null;
    if (testCodeunits.length > 0) {
      const largest = testCodeunits.reduce(
        (prev, current) => current.testMethods.length > prev.testMethods.length ? current : prev
      );
      largestCodeunit = {
        id: largest.file.object.id,
        name: largest.file.object.name,
        testCount: largest.testMethods.length
      };
    }
    return {
      totalCodeunits: testCodeunits.length,
      totalTests,
      codeunitIds: testCodeunits.map((tc) => tc.file.object.id),
      largestCodeunit
    };
  }
  /**
   * Creates a formatted test inventory
   * @param workspacePath The workspace path
   * @returns Formatted test inventory string
   */
  async createTestInventory(workspacePath) {
    const testCodeunits = await this.getTestCodeunits(workspacePath);
    if (testCodeunits.length === 0) {
      return "No test codeunits found in workspace";
    }
    let inventory = `Test Inventory for ${workspacePath}
`;
    inventory += `${"=".repeat(60)}

`;
    const stats = await this.getTestStatistics(workspacePath);
    inventory += `Total Codeunits: ${stats.totalCodeunits}
`;
    inventory += `Total Test Methods: ${stats.totalTests}
`;
    if (stats.largestCodeunit) {
      inventory += `Largest Codeunit: ${stats.largestCodeunit.name} (${stats.largestCodeunit.testCount} tests)
`;
    }
    inventory += `
Codeunits:
${"\u2500".repeat(40)}
`;
    for (const tc of testCodeunits) {
      inventory += `
\u{1F4C1} Codeunit ${tc.file.object.id} "${tc.file.object.name}"
`;
      inventory += `   Path: ${tc.file.path}
`;
      inventory += `   Tests: ${tc.testMethods.length}
`;
      if (tc.testMethods.length > 0) {
        inventory += `   Methods:
`;
        for (const method of tc.testMethods) {
          inventory += `     \u2022 ${method.name} (line ${method.lineNumber})
`;
        }
      }
    }
    const cached = this.cache.get(path8.normalize(workspacePath));
    if (cached) {
      inventory += `
${"\u2500".repeat(40)}
`;
      inventory += `Cache Status: Valid
`;
      inventory += `Last Scan: ${cached.lastScanTime.toISOString()}
`;
      inventory += `Cache Expires: ${new Date(cached.lastScanTime.getTime() + this.cacheExpirationMs).toISOString()}
`;
    }
    return inventory;
  }
  /**
   * Clears the cache for a specific workspace
   * @param workspacePath The workspace path
   */
  clearCache(workspacePath) {
    if (workspacePath) {
      const normalizedPath = path8.normalize(workspacePath);
      this.cache.delete(normalizedPath);
      this.logger.info(`Cleared cache for ${normalizedPath}`);
    } else {
      this.cache.clear();
      this.logger.info("Cleared all test registry cache");
    }
  }
  /**
   * Checks if cache is valid (not expired)
   * @param cache The cache entry to check
   * @returns True if cache is still valid
   */
  isCacheValid(cache) {
    const now = Date.now();
    const cacheTime = cache.lastScanTime.getTime();
    const isValid2 = now - cacheTime < this.cacheExpirationMs;
    if (!isValid2) {
      this.logger.debug(`Cache expired for ${cache.workspacePath}`);
    }
    return isValid2;
  }
  /**
   * Validates if test parameters match discovered tests
   * @param workspacePath The workspace path
   * @param codeunitId Optional codeunit ID to validate
   * @param testMethod Optional test method name to validate
   * @returns Validation result with details
   */
  async validateTestParameters(workspacePath, codeunitId, testMethod) {
    const testCodeunits = await this.getTestCodeunits(workspacePath);
    if (!codeunitId && !testMethod) {
      return {
        valid: true,
        message: "No filters specified - will run all tests",
        availableCodeunits: testCodeunits.map((tc) => tc.file.object.id)
      };
    }
    if (codeunitId) {
      const codeunit = testCodeunits.find((tc) => tc.file.object.id === codeunitId);
      if (!codeunit) {
        return {
          valid: false,
          message: `Codeunit ${codeunitId} not found in workspace`,
          availableCodeunits: testCodeunits.map((tc) => tc.file.object.id)
        };
      }
      if (testMethod) {
        const method = codeunit.testMethods.find((tm) => tm.name === testMethod);
        if (!method) {
          return {
            valid: false,
            message: `Test method "${testMethod}" not found in codeunit ${codeunitId}`,
            availableMethods: codeunit.testMethods.map((tm) => tm.name)
          };
        }
        return {
          valid: true,
          message: `Found test method "${testMethod}" in codeunit ${codeunitId} "${codeunit.file.object.name}"`
        };
      }
      return {
        valid: true,
        message: `Found codeunit ${codeunitId} "${codeunit.file.object.name}" with ${codeunit.testMethods.length} tests`,
        availableMethods: codeunit.testMethods.map((tm) => tm.name)
      };
    }
    if (testMethod) {
      const foundIn = [];
      for (const tc of testCodeunits) {
        const hasMethod = tc.testMethods.some((tm) => tm.name === testMethod);
        if (hasMethod) {
          foundIn.push({
            codeunitId: tc.file.object.id,
            codeunitName: tc.file.object.name
          });
        }
      }
      if (foundIn.length === 0) {
        return {
          valid: false,
          message: `Test method "${testMethod}" not found in any test codeunit`
        };
      }
      if (foundIn.length === 1) {
        const found = foundIn[0];
        if (found) {
          return {
            valid: true,
            message: `Found test method "${testMethod}" in codeunit ${found.codeunitId} "${found.codeunitName}"`
          };
        }
      }
      const codeunitList = foundIn.map((f) => `${f.codeunitId} "${f.codeunitName}"`).join(", ");
      return {
        valid: true,
        message: `Warning: Test method "${testMethod}" found in multiple codeunits: ${codeunitList}. All will be executed.`
      };
    }
    return {
      valid: true,
      message: "Test parameters validated"
    };
  }
};

// src/index.ts
async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.error("Continia Environment MCP Server");
    console.error("");
    console.error("Usage:");
    console.error("  node dist/index.js          Start MCP server (normal mode)");
    console.error("  node dist/index.js --test   Run diagnostic test");
    console.error("  node dist/index.js --version Show version");
    console.error("  node dist/index.js --help    Show this help message");
    console.error("");
    console.error("Environment Variables:");
    console.error("  DEMO_PORTAL_TOKEN     Required: API token for Demo Portal");
    console.error("  DEMO_PORTAL_BASE_URL  Optional: Override API endpoint");
    console.error("  LOG_LEVEL             Optional: debug, info, warn, error");
    process.exit(0);
  }
  if (args.includes("--version") || args.includes("-v")) {
    try {
      const { readFileSync: readFileSync2 } = await import("fs");
      const { join: join3 } = await import("path");
      const { fileURLToPath: fileURLToPath5 } = await import("url");
      const __dirname2 = join3(fileURLToPath5(import.meta.url), "..");
      const packageJson = JSON.parse(readFileSync2(join3(__dirname2, "../package.json"), "utf-8"));
      console.error(`Continia Environment MCP Server v${packageJson.version}`);
    } catch {
      console.error("Continia Environment MCP Server v0.1.0");
    }
    process.exit(0);
  }
  if (args.includes("--test") || args.includes("-t")) {
    console.error("========================================");
    console.error("Continia MCP Server - Diagnostic Test");
    console.error("========================================");
    console.error("");
    console.error("System Information:");
    console.error("  Node Version:", process.version);
    console.error("  Platform:", process.platform);
    console.error("  Working Dir:", process.cwd());
    console.error("");
    console.error("Configuration Check:");
    try {
      const config = ConfigurationService.getInstance();
      console.error("  \u2713 Configuration loaded successfully");
      console.error("  API URL:", config.getApiUrl());
      console.error("  Token Present:", config.hasValidToken() ? "Yes" : "No");
      if (!config.hasValidToken()) {
        console.error("");
        console.error("  \u26A0 Warning: DEMO_PORTAL_TOKEN not configured");
        console.error("  Set it in your Claude Desktop config or environment");
      }
    } catch (error) {
      console.error("  \u2717 Configuration failed:", error instanceof Error ? error.message : error);
    }
    console.error("");
    console.error("Dependencies Check:");
    const deps = [
      { name: "@modelcontextprotocol/sdk/server/index.js", display: "MCP SDK" },
      { name: "axios", display: "Axios" },
      { name: "zod", display: "Zod" },
      { name: "fast-xml-parser", display: "XML Parser" },
      { name: "csv-parse", display: "CSV Parser" }
    ];
    for (const dep of deps) {
      try {
        await import(dep.name);
        console.error(`  \u2713 ${dep.display} installed`);
      } catch (err) {
        console.error(`  \u2717 ${dep.display} not found`);
      }
    }
    console.error("");
    console.error("========================================");
    console.error("Diagnostic test complete");
    console.error("========================================");
    process.exit(0);
  }
  try {
    const config = ConfigurationService.getInstance();
    const httpClient = createClientFromConfig(config);
    const demoPortalClient = new DemoPortalClient(httpClient);
    const logger = new Logger2("Main");
    const testRegistry = new TestRegistry(logger);
    const environmentService = new EnvironmentService(demoPortalClient);
    const credentialsService = new CredentialsService(demoPortalClient, config);
    const devEndpointClient = new DeveloperEndpointClient(credentialsService);
    const compilationService = new CompilationService(
      demoPortalClient,
      devEndpointClient,
      credentialsService,
      config
    );
    const testRunnerInfrastructureService = new TestRunnerInfrastructureService(
      demoPortalClient,
      devEndpointClient,
      credentialsService,
      config
    );
    const testRunnerService = new TestRunnerService(
      demoPortalClient,
      config,
      testRegistry,
      testRunnerInfrastructureService
    );
    const diagnoseTestsTool = new DiagnoseTestsTool(testRunnerService, testRegistry);
    const checkTestAppStatusTool = new CheckTestAppStatusTool(demoPortalClient);
    const diagnoseTestsToolDefinition = {
      name: "diagnose_tests",
      description: "Diagnose why tests are not running or returning 0 results. Runs tests with and without filters to identify issues. Can compare source tests with environment tests.",
      inputSchema: {
        type: "object",
        properties: {
          environmentId: {
            type: "string",
            description: "The ID of the environment to diagnose"
          },
          codeunitId: {
            type: "number",
            description: "Optional codeunit ID to test filtering"
          },
          workspacePath: {
            type: "string",
            description: "Optional workspace path for source file comparison"
          },
          verbose: {
            type: "boolean",
            description: "Include detailed API logs",
            default: true
          }
        },
        required: ["environmentId"]
      }
    };
    const checkTestAppStatusToolDefinition = {
      name: checkTestAppStatusTool.name,
      description: checkTestAppStatusTool.description,
      inputSchema: checkTestAppStatusTool.schema
    };
    const server = new Server(
      {
        name: "continia-environment-mcp",
        version: "0.1.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          listEnvironmentsTool,
          getEnvironmentTool,
          startEnvironmentTool,
          stopEnvironmentTool,
          runTestsToolDefinition,
          compileAndPublishToolDefinition,
          diagnosePublishToolDefinition,
          diagnoseTestsToolDefinition,
          checkTestAppStatusToolDefinition,
          listTestsToolDefinition,
          listAvailableAppsTool,
          installAppTool
        ]
      };
    });
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args2 } = request.params;
        let result;
        switch (name) {
          case "list_environments":
            result = await executeListEnvironments(
              environmentService,
              args2 || {}
            );
            break;
          case "get_environment":
            result = await executeGetEnvironment(
              environmentService,
              args2 || {}
            );
            break;
          case "start_environment":
            result = await executeStartEnvironment(
              environmentService,
              args2 || {}
            );
            break;
          case "stop_environment":
            result = await executeStopEnvironment(
              environmentService,
              args2 || {}
            );
            break;
          case "run_tests":
            result = await executeRunTests(
              testRunnerService,
              args2 || {}
            );
            break;
          case "compile_and_publish":
            result = await executeCompileAndPublish(
              compilationService,
              args2 || {}
            );
            break;
          case "diagnose_publish":
            result = await executeDiagnosePublish(
              compilationService,
              args2 || {}
            );
            break;
          case "diagnose_tests":
            result = await diagnoseTestsTool.execute(args2 || {});
            break;
          case "check_test_app_status":
            result = await checkTestAppStatusTool.execute(args2 || {});
            break;
          case "list_tests":
            result = await executeListTests(
              testRegistry,
              args2 || {}
            );
            break;
          case "list_available_apps":
            result = await executeListAvailableApps(
              demoPortalClient,
              args2 || {}
            );
            break;
          case "install_app":
            result = await executeInstallApp(
              demoPortalClient,
              args2 || {}
            );
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  type: "error",
                  kind: "internal_error",
                  message: errorMessage,
                  retryable: false
                },
                null,
                2
              )
            }
          ],
          isError: true
        };
      }
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("========================================");
    console.error("Continia Environment MCP Server started successfully");
    console.error("========================================");
    console.error(`API URL: ${config.getApiUrl()}`);
    console.error(`Token Status: ${config.hasValidToken() ? "\u2713 Configured" : "\u26A0 Not configured (tools will fail)"}`);
    console.error("Ready to accept connections via stdio");
    console.error("========================================");
  } catch (error) {
    console.error("========================================");
    console.error("Failed to start Continia Environment MCP Server");
    console.error("========================================");
    console.error("Timestamp:", (/* @__PURE__ */ new Date()).toISOString());
    console.error("Node Version:", process.version);
    console.error("Platform:", process.platform);
    console.error("Working Directory:", process.cwd());
    console.error("");
    if (error instanceof Error) {
      console.error("Error Type:", error.name);
      console.error("Error Message:", error.message);
      if (error.stack) {
        console.error("Stack Trace:");
        console.error(error.stack);
      }
      if (error.name === "ValidationError") {
        console.error("");
        console.error("Configuration Issue Detected!");
        console.error("Please check your Claude Desktop configuration.");
      }
    } else {
      console.error("Error (non-Error object):", JSON.stringify(error, null, 2));
    }
    console.error("");
    console.error("Troubleshooting:");
    console.error("1. Ensure DEMO_PORTAL_TOKEN is set in your Claude Desktop config");
    console.error("2. Check that all dependencies are installed");
    console.error("3. Verify Node.js version is 18 or higher");
    console.error("========================================");
    process.exit(1);
  }
}
__name(main, "main");
process.on("SIGINT", () => {
  console.error("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});
process.on("SIGTERM", () => {
  console.error("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});
main().catch((error) => {
  console.error("========================================");
  console.error("Unhandled error in main():");
  console.error("========================================");
  if (error instanceof Error) {
    console.error("Error:", error.message);
    if (error.stack) {
      console.error("Stack:", error.stack);
    }
  } else {
    console.error("Error:", error);
  }
  console.error("========================================");
  process.exit(1);
});
//# sourceMappingURL=index.js.map
