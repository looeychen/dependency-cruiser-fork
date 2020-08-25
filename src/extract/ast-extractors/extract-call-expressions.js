/* eslint-disable max-lines-per-function */
/* eslint-disable complexity */
const walk = require("acorn-walk");

// 解析函数调用
function parseCallExpression(pLCallExpressions, pLDependencies) {
  return (pNode) => {
    let callExpressionName = "";
    const { loc, callee } = pNode;

    let importFuncs = [];
    pLDependencies.forEach((_dep) => {
      const _funcs =
        _dep.importedFuncs &&
        _dep.importedFuncs.map((_func) => {
          return {
            ..._func,
            depSource: _dep.module,
          };
        });
      importFuncs = importFuncs.concat(_funcs);
    });

    if (pNode.type === "CallExpression") {
      if (callee.type === "Identifier") {
        callExpressionName = callee.name;
      } else if (callee.type === "MemberExpression") {
        const { object, property } = callee;
        if (object.type === "Identifier" && property.type === "Identifier") {
          callExpressionName = `${object.name}.${property.name}`;
        }
      }
    }

    if (callExpressionName) {
      let callMainName = callExpressionName;
      if (callExpressionName.includes(".")) {
        callMainName = callExpressionName.split(".")[0];
      }

      const calledImportFunc = importFuncs.find(
        (_func) => _func && _func.local === callMainName
      );
      if (calledImportFunc) {
        pLCallExpressions.push({
          callExpressionName,
          loc,
          callDepend: {
            source: calledImportFunc.depSource,
            functionName:
              calledImportFunc.imported === "all"
                ? callExpressionName.replace(`${callMainName}.`, "")
                : calledImportFunc.imported,
          },
        });
      }
    }
  };
}

module.exports = (pAST, pLCallExpressions, pLDependencies) => {
  walk.ancestor(
    pAST,
    {
      CallExpression: parseCallExpression(pLCallExpressions, pLDependencies),
    },
    walk.base
  );
};
