'use strict';"use strict";
var o = require('../output/output_ast');
var identifiers_1 = require('../identifiers');
var exceptions_1 = require('angular2/src/facade/exceptions');
var lang_1 = require('angular2/src/facade/lang');
var IMPLICIT_RECEIVER = o.variable('#implicit');
var ExpressionWithWrappedValueInfo = (function () {
    function ExpressionWithWrappedValueInfo(expression, needsValueUnwrapper) {
        this.expression = expression;
        this.needsValueUnwrapper = needsValueUnwrapper;
    }
    return ExpressionWithWrappedValueInfo;
}());
exports.ExpressionWithWrappedValueInfo = ExpressionWithWrappedValueInfo;
function convertCdExpressionToIr(nameResolver, implicitReceiver, expression, valueUnwrapper) {
    var visitor = new _AstToIrVisitor(nameResolver, implicitReceiver, valueUnwrapper);
    var irAst = expression.visit(visitor, _Mode.Expression);
    return new ExpressionWithWrappedValueInfo(irAst, visitor.needsValueUnwrapper);
}
exports.convertCdExpressionToIr = convertCdExpressionToIr;
function convertCdStatementToIr(nameResolver, implicitReceiver, stmt) {
    var visitor = new _AstToIrVisitor(nameResolver, implicitReceiver, null);
    var statements = [];
    flattenStatements(stmt.visit(visitor, _Mode.Statement), statements);
    return statements;
}
exports.convertCdStatementToIr = convertCdStatementToIr;
var _Mode;
(function (_Mode) {
    _Mode[_Mode["Statement"] = 0] = "Statement";
    _Mode[_Mode["Expression"] = 1] = "Expression";
})(_Mode || (_Mode = {}));
function ensureStatementMode(mode, ast) {
    if (mode !== _Mode.Statement) {
        throw new exceptions_1.BaseException("Expected a statement, but saw " + ast);
    }
}
function ensureExpressionMode(mode, ast) {
    if (mode !== _Mode.Expression) {
        throw new exceptions_1.BaseException("Expected an expression, but saw " + ast);
    }
}
function convertToStatementIfNeeded(mode, expr) {
    if (mode === _Mode.Statement) {
        return expr.toStmt();
    }
    else {
        return expr;
    }
}
var _AstToIrVisitor = (function () {
    function _AstToIrVisitor(_nameResolver, _implicitReceiver, _valueUnwrapper) {
        this._nameResolver = _nameResolver;
        this._implicitReceiver = _implicitReceiver;
        this._valueUnwrapper = _valueUnwrapper;
        this.needsValueUnwrapper = false;
    }
    _AstToIrVisitor.prototype.visitBinary = function (ast, mode) {
        var op;
        switch (ast.operation) {
            case '+':
                op = o.BinaryOperator.Plus;
                break;
            case '-':
                op = o.BinaryOperator.Minus;
                break;
            case '*':
                op = o.BinaryOperator.Multiply;
                break;
            case '/':
                op = o.BinaryOperator.Divide;
                break;
            case '%':
                op = o.BinaryOperator.Modulo;
                break;
            case '&&':
                op = o.BinaryOperator.And;
                break;
            case '||':
                op = o.BinaryOperator.Or;
                break;
            case '==':
                op = o.BinaryOperator.Equals;
                break;
            case '!=':
                op = o.BinaryOperator.NotEquals;
                break;
            case '===':
                op = o.BinaryOperator.Identical;
                break;
            case '!==':
                op = o.BinaryOperator.NotIdentical;
                break;
            case '<':
                op = o.BinaryOperator.Lower;
                break;
            case '>':
                op = o.BinaryOperator.Bigger;
                break;
            case '<=':
                op = o.BinaryOperator.LowerEquals;
                break;
            case '>=':
                op = o.BinaryOperator.BiggerEquals;
                break;
            default:
                throw new exceptions_1.BaseException("Unsupported operation " + ast.operation);
        }
        return convertToStatementIfNeeded(mode, new o.BinaryOperatorExpr(op, ast.left.visit(this, _Mode.Expression), ast.right.visit(this, _Mode.Expression)));
    };
    _AstToIrVisitor.prototype.visitChain = function (ast, mode) {
        ensureStatementMode(mode, ast);
        return this.visitAll(ast.expressions, mode);
    };
    _AstToIrVisitor.prototype.visitConditional = function (ast, mode) {
        var value = ast.condition.visit(this, _Mode.Expression);
        return convertToStatementIfNeeded(mode, value.conditional(ast.trueExp.visit(this, _Mode.Expression), ast.falseExp.visit(this, _Mode.Expression)));
    };
    _AstToIrVisitor.prototype.visitPipe = function (ast, mode) {
        var input = ast.exp.visit(this, _Mode.Expression);
        var args = this.visitAll(ast.args, _Mode.Expression);
        var pipeResult = this._nameResolver.callPipe(ast.name, input, args);
        this.needsValueUnwrapper = true;
        return convertToStatementIfNeeded(mode, this._valueUnwrapper.callMethod('unwrap', [pipeResult]));
    };
    _AstToIrVisitor.prototype.visitFunctionCall = function (ast, mode) {
        return convertToStatementIfNeeded(mode, ast.target.visit(this, _Mode.Expression)
            .callFn(this.visitAll(ast.args, _Mode.Expression)));
    };
    _AstToIrVisitor.prototype.visitImplicitReceiver = function (ast, mode) {
        ensureExpressionMode(mode, ast);
        return IMPLICIT_RECEIVER;
    };
    _AstToIrVisitor.prototype.visitInterpolation = function (ast, mode) {
        ensureExpressionMode(mode, ast);
        var args = [o.literal(ast.expressions.length)];
        for (var i = 0; i < ast.strings.length - 1; i++) {
            args.push(o.literal(ast.strings[i]));
            args.push(ast.expressions[i].visit(this, _Mode.Expression));
        }
        args.push(o.literal(ast.strings[ast.strings.length - 1]));
        return o.importExpr(identifiers_1.Identifiers.interpolate).callFn(args);
    };
    _AstToIrVisitor.prototype.visitKeyedRead = function (ast, mode) {
        return convertToStatementIfNeeded(mode, ast.obj.visit(this, _Mode.Expression).key(ast.key.visit(this, _Mode.Expression)));
    };
    _AstToIrVisitor.prototype.visitKeyedWrite = function (ast, mode) {
        var obj = ast.obj.visit(this, _Mode.Expression);
        var key = ast.key.visit(this, _Mode.Expression);
        var value = ast.value.visit(this, _Mode.Expression);
        return convertToStatementIfNeeded(mode, obj.key(key).set(value));
    };
    _AstToIrVisitor.prototype.visitLiteralArray = function (ast, mode) {
        return convertToStatementIfNeeded(mode, this._nameResolver.createLiteralArray(this.visitAll(ast.expressions, mode)));
    };
    _AstToIrVisitor.prototype.visitLiteralMap = function (ast, mode) {
        var parts = [];
        for (var i = 0; i < ast.keys.length; i++) {
            parts.push([ast.keys[i], ast.values[i].visit(this, _Mode.Expression)]);
        }
        return convertToStatementIfNeeded(mode, this._nameResolver.createLiteralMap(parts));
    };
    _AstToIrVisitor.prototype.visitLiteralPrimitive = function (ast, mode) {
        return convertToStatementIfNeeded(mode, o.literal(ast.value));
    };
    _AstToIrVisitor.prototype.visitMethodCall = function (ast, mode) {
        var args = this.visitAll(ast.args, _Mode.Expression);
        var result = null;
        var receiver = ast.receiver.visit(this, _Mode.Expression);
        if (receiver === IMPLICIT_RECEIVER) {
            var varExpr = this._nameResolver.getVariable(ast.name);
            if (lang_1.isPresent(varExpr)) {
                result = varExpr.callFn(args);
            }
            else {
                receiver = this._implicitReceiver;
            }
        }
        if (lang_1.isBlank(result)) {
            result = receiver.callMethod(ast.name, args);
        }
        return convertToStatementIfNeeded(mode, result);
    };
    _AstToIrVisitor.prototype.visitPrefixNot = function (ast, mode) {
        return convertToStatementIfNeeded(mode, o.not(ast.expression.visit(this, _Mode.Expression)));
    };
    _AstToIrVisitor.prototype.visitPropertyRead = function (ast, mode) {
        var result = null;
        var receiver = ast.receiver.visit(this, _Mode.Expression);
        if (receiver === IMPLICIT_RECEIVER) {
            result = this._nameResolver.getVariable(ast.name);
            if (lang_1.isBlank(result)) {
                receiver = this._implicitReceiver;
            }
        }
        if (lang_1.isBlank(result)) {
            result = receiver.prop(ast.name);
        }
        return convertToStatementIfNeeded(mode, result);
    };
    _AstToIrVisitor.prototype.visitPropertyWrite = function (ast, mode) {
        var receiver = ast.receiver.visit(this, _Mode.Expression);
        if (receiver === IMPLICIT_RECEIVER) {
            var varExpr = this._nameResolver.getVariable(ast.name);
            if (lang_1.isPresent(varExpr)) {
                throw new exceptions_1.BaseException('Cannot reassign a variable binding');
            }
            receiver = this._implicitReceiver;
        }
        return convertToStatementIfNeeded(mode, receiver.prop(ast.name).set(ast.value.visit(this, _Mode.Expression)));
    };
    _AstToIrVisitor.prototype.visitSafePropertyRead = function (ast, mode) {
        var receiver = ast.receiver.visit(this, _Mode.Expression);
        return convertToStatementIfNeeded(mode, receiver.isBlank().conditional(o.NULL_EXPR, receiver.prop(ast.name)));
    };
    _AstToIrVisitor.prototype.visitSafeMethodCall = function (ast, mode) {
        var receiver = ast.receiver.visit(this, _Mode.Expression);
        var args = this.visitAll(ast.args, _Mode.Expression);
        return convertToStatementIfNeeded(mode, receiver.isBlank().conditional(o.NULL_EXPR, receiver.callMethod(ast.name, args)));
    };
    _AstToIrVisitor.prototype.visitAll = function (asts, mode) {
        var _this = this;
        return asts.map(function (ast) { return ast.visit(_this, mode); });
    };
    _AstToIrVisitor.prototype.visitQuote = function (ast, mode) {
        throw new exceptions_1.BaseException('Quotes are not supported for evaluation!');
    };
    return _AstToIrVisitor;
}());
function flattenStatements(arg, output) {
    if (lang_1.isArray(arg)) {
        arg.forEach(function (entry) { return flattenStatements(entry, output); });
    }
    else {
        output.push(arg);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwcmVzc2lvbl9jb252ZXJ0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkaWZmaW5nX3BsdWdpbl93cmFwcGVyLW91dHB1dF9wYXRoLUZJREpaYU85LnRtcC9hbmd1bGFyMi9zcmMvY29tcGlsZXIvdmlld19jb21waWxlci9leHByZXNzaW9uX2NvbnZlcnRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsSUFBWSxDQUFDLFdBQU0sc0JBQXNCLENBQUMsQ0FBQTtBQUMxQyw0QkFBMEIsZ0JBQWdCLENBQUMsQ0FBQTtBQUUzQywyQkFBNEIsZ0NBQWdDLENBQUMsQ0FBQTtBQUM3RCxxQkFBc0QsMEJBQTBCLENBQUMsQ0FBQTtBQUVqRixJQUFJLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7QUFTaEQ7SUFDRSx3Q0FBbUIsVUFBd0IsRUFBUyxtQkFBNEI7UUFBN0QsZUFBVSxHQUFWLFVBQVUsQ0FBYztRQUFTLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBUztJQUFHLENBQUM7SUFDdEYscUNBQUM7QUFBRCxDQUFDLEFBRkQsSUFFQztBQUZZLHNDQUE4QixpQ0FFMUMsQ0FBQTtBQUVELGlDQUNJLFlBQTBCLEVBQUUsZ0JBQThCLEVBQUUsVUFBcUIsRUFDakYsY0FBNkI7SUFDL0IsSUFBSSxPQUFPLEdBQUcsSUFBSSxlQUFlLENBQUMsWUFBWSxFQUFFLGdCQUFnQixFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ2xGLElBQUksS0FBSyxHQUFpQixVQUFVLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDdEUsTUFBTSxDQUFDLElBQUksOEJBQThCLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ2hGLENBQUM7QUFOZSwrQkFBdUIsMEJBTXRDLENBQUE7QUFFRCxnQ0FBdUMsWUFBMEIsRUFBRSxnQkFBOEIsRUFDMUQsSUFBZTtJ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LENBQUMsS0FBSSxFQUFFLElBQUksQ0FBQyxFQUFyQixDQUFxQixDQUFDLENBQUM7SUFBQyxDQUFDO0lBQ2hHLG9DQUFVLEdBQVYsVUFBVyxHQUFnQixFQUFFLElBQVc7UUFDdEMsTUFBTSxJQUFJLDBCQUFhLENBQUMsMENBQTBDLENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBQ0gsc0JBQUM7QUFBRCxDQUFDLEFBdkxELElBdUxDO0FBRUQsMkJBQTJCLEdBQVEsRUFBRSxNQUFxQjtJQUN4RCxFQUFFLENBQUMsQ0FBQyxjQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ1QsR0FBSSxDQUFDLE9BQU8sQ0FBQyxVQUFDLEtBQUssSUFBSyxPQUFBLGlCQUFpQixDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsRUFBaEMsQ0FBZ0MsQ0FBQyxDQUFDO0lBQ3BFLENBQUM7SUFBQyxJQUFJLENBQUMsQ0FBQztRQUNOLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDbkIsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZEFzdCBmcm9tICcuLi9leHByZXNzaW9uX3BhcnNlci9hc3QnO1xuaW1wb3J0ICogYXMgbyBmcm9tICcuLi9vdXRwdXQvb3V0cHV0X2FzdCc7XG5pbXBvcnQge0lkZW50aWZpZXJzfSBmcm9tICcuLi9pZGVudGlmaWVycyc7XG5cbmltcG9ydCB7QmFzZUV4Y2VwdGlvbn0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9leGNlcHRpb25zJztcbmltcG9ydCB7aXNCbGFuaywgaXNQcmVzZW50LCBpc0FycmF5LCBDT05TVF9FWFBSfSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2xhbmcnO1xuXG52YXIgSU1QTElDSVRfUkVDRUlWRVIgPSBvLnZhcmlhYmxlKCcjaW1wbGljaXQnKTtcblxuZXhwb3J0IGludGVyZmFjZSBOYW1lUmVzb2x2ZXIge1xuICBjYWxsUGlwZShuYW1lOiBzdHJpbmcsIGlucHV0OiBvLkV4cHJlc3Npb24sIGFyZ3M6IG8uRXhwcmVzc2lvbltdKTogby5FeHByZXNzaW9uO1xuICBnZXRWYXJpYWJsZShuYW1lOiBzdHJpbmcpOiBvLkV4cHJlc3Npb247XG4gIGNyZWF0ZUxpdGVyYWxBcnJheSh2YWx1ZXM6IG8uRXhwcmVzc2lvbltdKTogby5FeHByZXNzaW9uO1xuICBjcmVhdGVMaXRlcmFsTWFwKHZhbHVlczogQXJyYXk8QXJyYXk8c3RyaW5nIHwgby5FeHByZXNzaW9uPj4pOiBvLkV4cHJlc3Npb247XG59XG5cbmV4cG9ydCBjbGFzcyBFeHByZXNzaW9uV2l0aFdyYXBwZWRWYWx1ZUluZm8ge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgZXhwcmVzc2lvbjogby5FeHByZXNzaW9uLCBwdWJsaWMgbmVlZHNWYWx1ZVVud3JhcHBlcjogYm9vbGVhbikge31cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRDZEV4cHJlc3Npb25Ub0lyKFxuICAgIG5hbWVSZXNvbHZlcjogTmFtZVJlc29sdmVyLCBpbXBsaWNpdFJlY2VpdmVyOiBvLkV4cHJlc3Npb24sIGV4cHJlc3Npb246IGNkQXN0LkFTVCxcbiAgICB2YWx1ZVVud3JhcHBlcjogby5SZWFkVmFyRXhwcik6IEV4cHJlc3Npb25XaXRoV3JhcHBlZFZhbHVlSW5mbyB7XG4gIHZhciB2aXNpdG9yID0gbmV3IF9Bc3RUb0lyVmlzaXRvcihuYW1lUmVzb2x2ZXIsIGltcGxpY2l0UmVjZWl2ZXIsIHZhbHVlVW53cmFwcGVyKTtcbiAgdmFyIGlyQXN0OiBvLkV4cHJlc3Npb24gPSBleHByZXNzaW9uLnZpc2l0KHZpc2l0b3IsIF9Nb2RlLkV4cHJlc3Npb24pO1xuICByZXR1cm4gbmV3IEV4cHJlc3Npb25XaXRoV3JhcHBlZFZhbHVlSW5mbyhpckFzdCwgdmlzaXRvci5uZWVkc1ZhbHVlVW53cmFwcGVyKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRDZFN0YXRlbWVudFRvSXIobmFtZVJlc29sdmVyOiBOYW1lUmVzb2x2ZXIsIGltcGxpY2l0UmVjZWl2ZXI6IG8uRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0bXQ6IGNkQXN0LkFTVCk6IG8uU3RhdGVtZW50W10ge1xuICB2YXIgdmlzaXRvciA9IG5ldyBfQXN0VG9JclZpc2l0b3IobmFtZVJlc29sdmVyLCBpbXBsaWNpdFJlY2VpdmVyLCBudWxsKTtcbiAgdmFyIHN0YXRlbWVudHMgPSBbXTtcbiAgZmxhdHRlblN0YXRlbWVudHMoc3RtdC52aXNpdCh2aXNpdG9yLCBfTW9kZS5TdGF0ZW1lbnQpLCBzdGF0ZW1lbnRzKTtcbiAgcmV0dXJuIHN0YXRlbWVudHM7XG59XG5cbmVudW0gX01vZGUge1xuICBTdGF0ZW1lbnQsXG4gIEV4cHJlc3Npb25cbn1cblxuZnVuY3Rpb24gZW5zdXJlU3RhdGVtZW50TW9kZShtb2RlOiBfTW9kZSwgYXN0OiBjZEFzdC5BU1QpIHtcbiAgaWYgKG1vZGUgIT09IF9Nb2RlLlN0YXRlbWVudCkge1xuICAgIHRocm93IG5ldyBCYXNlRXhjZXB0aW9uKGBFeHBlY3RlZCBhIHN0YXRlbWVudCwgYnV0IHNhdyAke2FzdH1gKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBlbnN1cmVFeHByZXNzaW9uTW9kZShtb2RlOiBfTW9kZSwgYXN0OiBjZEFzdC5BU1QpIHtcbiAgaWYgKG1vZGUgIT09IF9Nb2RlLkV4cHJlc3Npb24pIHtcbiAgICB0aHJvdyBuZXcgQmFzZUV4Y2VwdGlvbihgRXhwZWN0ZWQgYW4gZXhwcmVzc2lvbiwgYnV0IHNhdyAke2FzdH1gKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0VG9TdGF0ZW1lbnRJZk5lZWRlZChtb2RlOiBfTW9kZSwgZXhwcjogby5FeHByZXNzaW9uKTogby5FeHByZXNzaW9uIHwgby5TdGF0ZW1lbnQge1xuICBpZiAobW9kZSA9PT0gX01vZGUuU3RhdGVtZW50KSB7XG4gICAgcmV0dXJuIGV4cHIudG9TdG10KCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cbn1cblxuY2xhc3MgX0FzdFRvSXJWaXNpdG9yIGltcGxlbWVudHMgY2RBc3QuQXN0VmlzaXRvciB7XG4gIHB1YmxpYyBuZWVkc1ZhbHVlVW53cmFwcGVyOiBib29sZWFuID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfbmFtZVJlc29sdmVyOiBOYW1lUmVzb2x2ZXIsIHByaXZhdGUgX2ltcGxpY2l0UmVjZWl2ZXI6IG8uRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfdmFsdWVVbndyYXBwZXI6IG8uUmVhZFZhckV4cHIpIHt9XG5cbiAgdmlzaXRCaW5hcnkoYXN0OiBjZEFzdC5CaW5hcnksIG1vZGU6IF9Nb2RlKTogYW55IHtcbiAgICB2YXIgb3A7XG4gICAgc3dpdGNoIChhc3Qub3BlcmF0aW9uKSB7XG4gICAgICBjYXNlICcrJzpcbiAgICAgICAgb3AgPSBvLkJpbmFyeU9wZXJhdG9yLlBsdXM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnLSc6XG4gICAgICAgIG9wID0gby5CaW5hcnlPcGVyYXRvci5NaW51cztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICcqJzpcbiAgICAgICAgb3AgPSBvLkJpbmFyeU9wZXJhdG9yLk11bHRpcGx5O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJy8nOlxuICAgICAgICBvcCA9IG8uQmluYXJ5T3BlcmF0b3IuRGl2aWRlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJyUnOlxuICAgICAgICBvcCA9IG8uQmluYXJ5T3BlcmF0b3IuTW9kdWxvO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJyYmJzpcbiAgICAgICAgb3AgPSBvLkJpbmFyeU9wZXJhdG9yLkFuZDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd8fCc6XG4gICAgICAgIG9wID0gby5CaW5hcnlPcGVyYXRvci5PcjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICc9PSc6XG4gICAgICAgIG9wID0gby5CaW5hcnlPcGVyYXRvci5FcXVhbHM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnIT0nOlxuICAgICAgICBvcCA9IG8uQmluYXJ5T3BlcmF0b3IuTm90RXF1YWxzO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJz09PSc6XG4gICAgICAgIG9wID0gby5CaW5hcnlPcGVyYXRvci5JZGVudGljYWw7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnIT09JzpcbiAgICAgICAgb3AgPSBvLkJpbmFyeU9wZXJhdG9yLk5vdElkZW50aWNhbDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICc8JzpcbiAgICAgICAgb3AgPSBvLkJpbmFyeU9wZXJhdG9yLkxvd2VyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJz4nOlxuICAgICAgICBvcCA9IG8uQmluYXJ5T3BlcmF0b3IuQmlnZ2VyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJzw9JzpcbiAgICAgICAgb3AgPSBvLkJpbmFyeU9wZXJhdG9yLkxvd2VyRXF1YWxzO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJz49JzpcbiAgICAgICAgb3AgPSBvLkJpbmFyeU9wZXJhdG9yLkJpZ2dlckVxdWFscztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgQmFzZUV4Y2VwdGlvbihgVW5zdXBwb3J0ZWQgb3BlcmF0aW9uICR7YXN0Lm9wZXJhdGlvbn1gKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29udmVydFRvU3RhdGVtZW50SWZOZWVkZWQoXG4gICAgICAgIG1vZGUsIG5ldyBvLkJpbmFyeU9wZXJhdG9yRXhwcihvcCwgYXN0LmxlZnQudmlzaXQodGhpcywgX01vZGUuRXhwcmVzc2lvbiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3QucmlnaHQudmlzaXQodGhpcywgX01vZGUuRXhwcmVzc2lvbikpKTtcbiAgfVxuICB2aXNpdENoYWluKGFzdDogY2RBc3QuQ2hhaW4sIG1vZGU6IF9Nb2RlKTogYW55IHtcbiAgICBlbnN1cmVTdGF0ZW1lbnRNb2RlKG1vZGUsIGFzdCk7XG4gICAgcmV0dXJuIHRoaXMudmlzaXRBbGwoYXN0LmV4cHJlc3Npb25zLCBtb2RlKTtcbiAgfVxuICB2aXNpdENvbmRpdGlvbmFsKGFzdDogY2RBc3QuQ29uZGl0aW9uYWwsIG1vZGU6IF9Nb2RlKTogYW55IHtcbiAgICB2YXIgdmFsdWU6IG8uRXhwcmVzc2lvbiA9IGFzdC5jb25kaXRpb24udmlzaXQodGhpcywgX01vZGUuRXhwcmVzc2lvbik7XG4gICAgcmV0dXJuIGNvbnZlcnRUb1N0YXRlbWVudElmTmVlZGVkKFxuICAgICAgICBtb2RlLCB2YWx1ZS5jb25kaXRpb25hbChhc3QudHJ1ZUV4cC52aXNpdCh0aGlzLCBfTW9kZS5FeHByZXNzaW9uKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN0LmZhbHNlRXhwLnZpc2l0KHRoaXMsIF9Nb2RlLkV4cHJlc3Npb24pKSk7XG4gIH1cbiAgdmlzaXRQaXBlKGFzdDogY2RBc3QuQmluZGluZ1BpcGUsIG1vZGU6IF9Nb2RlKTogYW55IHtcbiAgICB2YXIgaW5wdXQgPSBhc3QuZXhwLnZpc2l0KHRoaXMsIF9Nb2RlLkV4cHJlc3Npb24pO1xuICAgIHZhciBhcmdzID0gdGhpcy52aXNpdEFsbChhc3QuYXJncywgX01vZGUuRXhwcmVzc2lvbik7XG4gICAgdmFyIHBpcGVSZXN1bHQgPSB0aGlzLl9uYW1lUmVzb2x2ZXIuY2FsbFBpcGUoYXN0Lm5hbWUsIGlucHV0LCBhcmdzKTtcbiAgICB0aGlzLm5lZWRzVmFsdWVVbndyYXBwZXIgPSB0cnVlO1xuICAgIHJldHVybiBjb252ZXJ0VG9TdGF0ZW1lbnRJZk5lZWRlZChtb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZVVud3JhcHBlci5jYWxsTWV0aG9kKCd1bndyYXAnLCBbcGlwZVJlc3VsdF0pKTtcbiAgfVxuICB2aXNpdEZ1bmN0aW9uQ2FsbChhc3Q6IGNkQXN0LkZ1bmN0aW9uQ2FsbCwgbW9kZTogX01vZGUpOiBhbnkge1xuICAgIHJldHVybiBjb252ZXJ0VG9TdGF0ZW1lbnRJZk5lZWRlZChtb2RlLCBhc3QudGFyZ2V0LnZpc2l0KHRoaXMsIF9Nb2RlLkV4cHJlc3Npb24pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2FsbEZuKHRoaXMudmlzaXRBbGwoYXN0LmFyZ3MsIF9Nb2RlLkV4cHJlc3Npb24pKSk7XG4gIH1cbiAgdmlzaXRJbXBsaWNpdFJlY2VpdmVyKGFzdDogY2RBc3QuSW1wbGljaXRSZWNlaXZlciwgbW9kZTogX01vZGUpOiBhbnkge1xuICAgIGVuc3VyZUV4cHJlc3Npb25Nb2RlKG1vZGUsIGFzdCk7XG4gICAgcmV0dXJuIElNUExJQ0lUX1JFQ0VJVkVSO1xuICB9XG4gIHZpc2l0SW50ZXJwb2xhdGlvbihhc3Q6IGNkQXN0LkludGVycG9sYXRpb24sIG1vZGU6IF9Nb2RlKTogYW55IHtcbiAgICBlbnN1cmVFeHByZXNzaW9uTW9kZShtb2RlLCBhc3QpO1xuICAgIHZhciBhcmdzID0gW28ubGl0ZXJhbChhc3QuZXhwcmVzc2lvbnMubGVuZ3RoKV07XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhc3Quc3RyaW5ncy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgIGFyZ3MucHVzaChvLmxpdGVyYWwoYXN0LnN0cmluZ3NbaV0pKTtcbiAgICAgIGFyZ3MucHVzaChhc3QuZXhwcmVzc2lvbnNbaV0udmlzaXQodGhpcywgX01vZGUuRXhwcmVzc2lvbikpO1xuICAgIH1cbiAgICBhcmdzLnB1c2goby5saXRlcmFsKGFzdC5zdHJpbmdzW2FzdC5zdHJpbmdzLmxlbmd0aCAtIDFdKSk7XG4gICAgcmV0dXJuIG8uaW1wb3J0RXhwcihJZGVudGlmaWVycy5pbnRlcnBvbGF0ZSkuY2FsbEZuKGFyZ3MpO1xuICB9XG4gIHZpc2l0S2V5ZWRSZWFkKGFzdDogY2RBc3QuS2V5ZWRSZWFkLCBtb2RlOiBfTW9kZSk6IGFueSB7XG4gICAgcmV0dXJuIGNvbnZlcnRUb1N0YXRlbWVudElmTmVlZGVkKFxuICAgICAgICBtb2RlLCBhc3Qub2JqLnZpc2l0KHRoaXMsIF9Nb2RlLkV4cHJlc3Npb24pLmtleShhc3Qua2V5LnZpc2l0KHRoaXMsIF9Nb2RlLkV4cHJlc3Npb24pKSk7XG4gIH1cbiAgdmlzaXRLZXllZFdyaXRlKGFzdDogY2RBc3QuS2V5ZWRXcml0ZSwgbW9kZTogX01vZGUpOiBhbnkge1xuICAgIHZhciBvYmo6IG8uRXhwcmVzc2lvbiA9IGFzdC5vYmoudmlzaXQodGhpcywgX01vZGUuRXhwcmVzc2lvbik7XG4gICAgdmFyIGtleTogby5FeHByZXNzaW9uID0gYXN0LmtleS52aXNpdCh0aGlzLCBfTW9kZS5FeHByZXNzaW9uKTtcbiAgICB2YXIgdmFsdWU6IG8uRXhwcmVzc2lvbiA9IGFzdC52YWx1ZS52aXNpdCh0aGlzLCBfTW9kZS5FeHByZXNzaW9uKTtcbiAgICByZXR1cm4gY29udmVydFRvU3RhdGVtZW50SWZOZWVkZWQobW9kZSwgb2JqLmtleShrZXkpLnNldCh2YWx1ZSkpO1xuICB9XG4gIHZpc2l0TGl0ZXJhbEFycmF5KGFzdDogY2RBc3QuTGl0ZXJhbEFycmF5LCBtb2RlOiBfTW9kZSk6IGFueSB7XG4gICAgcmV0dXJuIGNvbnZlcnRUb1N0YXRlbWVudElmTmVlZGVkKFxuICAgICAgICBtb2RlLCB0aGlzLl9uYW1lUmVzb2x2ZXIuY3JlYXRlTGl0ZXJhbEFycmF5KHRoaXMudmlzaXRBbGwoYXN0LmV4cHJlc3Npb25zLCBtb2RlKSkpO1xuICB9XG4gIHZpc2l0TGl0ZXJhbE1hcChhc3Q6IGNkQXN0LkxpdGVyYWxNYXAsIG1vZGU6IF9Nb2RlKTogYW55IHtcbiAgICB2YXIgcGFydHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFzdC5rZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBwYXJ0cy5wdXNoKFthc3Qua2V5c1tpXSwgYXN0LnZhbHVlc1tpXS52aXNpdCh0aGlzLCBfTW9kZS5FeHByZXNzaW9uKV0pO1xuICAgIH1cbiAgICByZXR1cm4gY29udmVydFRvU3RhdGVtZW50SWZOZWVkZWQobW9kZSwgdGhpcy5fbmFtZVJlc29sdmVyLmNyZWF0ZUxpdGVyYWxNYXAocGFydHMpKTtcbiAgfVxuICB2aXNpdExpdGVyYWxQcmltaXRpdmUoYXN0OiBjZEFzdC5MaXRlcmFsUHJpbWl0aXZlLCBtb2RlOiBfTW9kZSk6IGFueSB7XG4gICAgcmV0dXJuIGNvbnZlcnRUb1N0YXRlbWVudElmTmVlZGVkKG1vZGUsIG8ubGl0ZXJhbChhc3QudmFsdWUpKTtcbiAgfVxuICB2aXNpdE1ldGhvZENhbGwoYXN0OiBjZEFzdC5NZXRob2RDYWxsLCBtb2RlOiBfTW9kZSk6IGFueSB7XG4gICAgdmFyIGFyZ3MgPSB0aGlzLnZpc2l0QWxsKGFzdC5hcmdzLCBfTW9kZS5FeHByZXNzaW9uKTtcbiAgICB2YXIgcmVzdWx0ID0gbnVsbDtcbiAgICB2YXIgcmVjZWl2ZXIgPSBhc3QucmVjZWl2ZXIudmlzaXQodGhpcywgX01vZGUuRXhwcmVzc2lvbik7XG4gICAgaWYgKHJlY2VpdmVyID09PSBJTVBMSUNJVF9SRUNFSVZFUikge1xuICAgICAgdmFyIHZhckV4cHIgPSB0aGlzLl9uYW1lUmVzb2x2ZXIuZ2V0VmFyaWFibGUoYXN0Lm5hbWUpO1xuICAgICAgaWYgKGlzUHJlc2VudCh2YXJFeHByKSkge1xuICAgICAgICByZXN1bHQgPSB2YXJFeHByLmNhbGxGbihhcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlY2VpdmVyID0gdGhpcy5faW1wbGljaXRSZWNlaXZlcjtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzQmxhbmsocmVzdWx0KSkge1xuICAgICAgcmVzdWx0ID0gcmVjZWl2ZXIuY2FsbE1ldGhvZChhc3QubmFtZSwgYXJncyk7XG4gICAgfVxuICAgIHJldHVybiBjb252ZXJ0VG9TdGF0ZW1lbnRJZk5lZWRlZChtb2RlLCByZXN1bHQpO1xuICB9XG4gIHZpc2l0UHJlZml4Tm90KGFzdDogY2RBc3QuUHJlZml4Tm90LCBtb2RlOiBfTW9kZSk6IGFueSB7XG4gICAgcmV0dXJuIGNvbnZlcnRUb1N0YXRlbWVudElmTmVlZGVkKG1vZGUsIG8ubm90KGFzdC5leHByZXNzaW9uLnZpc2l0KHRoaXMsIF9Nb2RlLkV4cHJlc3Npb24pKSk7XG4gIH1cbiAgdmlzaXRQcm9wZXJ0eVJlYWQoYXN0OiBjZEFzdC5Qcm9wZXJ0eVJlYWQsIG1vZGU6IF9Nb2RlKTogYW55IHtcbiAgICB2YXIgcmVzdWx0ID0gbnVsbDtcbiAgICB2YXIgcmVjZWl2ZXIgPSBhc3QucmVjZWl2ZXIudmlzaXQodGhpcywgX01vZGUuRXhwcmVzc2lvbik7XG4gICAgaWYgKHJlY2VpdmVyID09PSBJTVBMSUNJVF9SRUNFSVZFUikge1xuICAgICAgcmVzdWx0ID0gdGhpcy5fbmFtZVJlc29sdmVyLmdldFZhcmlhYmxlKGFzdC5uYW1lKTtcbiAgICAgIGlmIChpc0JsYW5rKHJlc3VsdCkpIHtcbiAgICAgICAgcmVjZWl2ZXIgPSB0aGlzLl9pbXBsaWNpdFJlY2VpdmVyO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNCbGFuayhyZXN1bHQpKSB7XG4gICAgICByZXN1bHQgPSByZWNlaXZlci5wcm9wKGFzdC5uYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnZlcnRUb1N0YXRlbWVudElmTmVlZGVkKG1vZGUsIHJlc3VsdCk7XG4gIH1cbiAgdmlzaXRQcm9wZXJ0eVdyaXRlKGFzdDogY2RBc3QuUHJvcGVydHlXcml0ZSwgbW9kZTogX01vZGUpOiBhbnkge1xuICAgIHZhciByZWNlaXZlcjogby5FeHByZXNzaW9uID0gYXN0LnJlY2VpdmVyLnZpc2l0KHRoaXMsIF9Nb2RlLkV4cHJlc3Npb24pO1xuICAgIGlmIChyZWNlaXZlciA9PT0gSU1QTElDSVRfUkVDRUlWRVIpIHtcbiAgICAgIHZhciB2YXJFeHByID0gdGhpcy5fbmFtZVJlc29sdmVyLmdldFZhcmlhYmxlKGFzdC5uYW1lKTtcbiAgICAgIGlmIChpc1ByZXNlbnQodmFyRXhwcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEJhc2VFeGNlcHRpb24oJ0Nhbm5vdCByZWFzc2lnbiBhIHZhcmlhYmxlIGJpbmRpbmcnKTtcbiAgICAgIH1cbiAgICAgIHJlY2VpdmVyID0gdGhpcy5faW1wbGljaXRSZWNlaXZlcjtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnZlcnRUb1N0YXRlbWVudElmTmVlZGVkKFxuICAgICAgICBtb2RlLCByZWNlaXZlci5wcm9wKGFzdC5uYW1lKS5zZXQoYXN0LnZhbHVlLnZpc2l0KHRoaXMsIF9Nb2RlLkV4cHJlc3Npb24pKSk7XG4gIH1cbiAgdmlzaXRTYWZlUHJvcGVydHlSZWFkKGFzdDogY2RBc3QuU2FmZVByb3BlcnR5UmVhZCwgbW9kZTogX01vZGUpOiBhbnkge1xuICAgIHZhciByZWNlaXZlciA9IGFzdC5yZWNlaXZlci52aXNpdCh0aGlzLCBfTW9kZS5FeHByZXNzaW9uKTtcbiAgICByZXR1cm4gY29udmVydFRvU3RhdGVtZW50SWZOZWVkZWQoXG4gICAgICAgIG1vZGUsIHJlY2VpdmVyLmlzQmxhbmsoKS5jb25kaXRpb25hbChvLk5VTExfRVhQUiwgcmVjZWl2ZXIucHJvcChhc3QubmFtZSkpKTtcbiAgfVxuICB2aXNpdFNhZmVNZXRob2RDYWxsKGFzdDogY2RBc3QuU2FmZU1ldGhvZENhbGwsIG1vZGU6IF9Nb2RlKTogYW55IHtcbiAgICB2YXIgcmVjZWl2ZXIgPSBhc3QucmVjZWl2ZXIudmlzaXQodGhpcywgX01vZGUuRXhwcmVzc2lvbik7XG4gICAgdmFyIGFyZ3MgPSB0aGlzLnZpc2l0QWxsKGFzdC5hcmdzLCBfTW9kZS5FeHByZXNzaW9uKTtcbiAgICByZXR1cm4gY29udmVydFRvU3RhdGVtZW50SWZOZWVkZWQoXG4gICAgICAgIG1vZGUsIHJlY2VpdmVyLmlzQmxhbmsoKS5jb25kaXRpb25hbChvLk5VTExfRVhQUiwgcmVjZWl2ZXIuY2FsbE1ldGhvZChhc3QubmFtZSwgYXJncykpKTtcbiAgfVxuICB2aXNpdEFsbChhc3RzOiBjZEFzdC5BU1RbXSwgbW9kZTogX01vZGUpOiBhbnkgeyByZXR1cm4gYXN0cy5tYXAoYXN0ID0+IGFzdC52aXNpdCh0aGlzLCBtb2RlKSk7IH1cbiAgdmlzaXRRdW90ZShhc3Q6IGNkQXN0LlF1b3RlLCBtb2RlOiBfTW9kZSk6IGFueSB7XG4gICAgdGhyb3cgbmV3IEJhc2VFeGNlcHRpb24oJ1F1b3RlcyBhcmUgbm90IHN1cHBvcnRlZCBmb3IgZXZhbHVhdGlvbiEnKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmbGF0dGVuU3RhdGVtZW50cyhhcmc6IGFueSwgb3V0cHV0OiBvLlN0YXRlbWVudFtdKSB7XG4gIGlmIChpc0FycmF5KGFyZykpIHtcbiAgICAoPGFueVtdPmFyZykuZm9yRWFjaCgoZW50cnkpID0+IGZsYXR0ZW5TdGF0ZW1lbnRzKGVudHJ5LCBvdXRwdXQpKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQucHVzaChhcmcpO1xuICB9XG59Il19