/* eslint-disable no-magic-numbers */
/* eslint-disable max-lines-per-function */
/* eslint-disable max-statements */
/* eslint-disable complexity */
const walk = require("acorn-walk");

// 判断节点是否在全局作用域
function isInGlobalScope(pNode, pVisitors) {
  let programNode = null;
  if (
    pNode.type === "FunctionDeclaration" ||
    pNode.type === "ExportDefaultDeclaration"
  ) {
    programNode = pVisitors[pVisitors.length - 2];
  }

  if (
    pNode.type === "VariableDeclarator" ||
    pNode.type === "AssignmentExpression"
  ) {
    programNode = pVisitors[pVisitors.length - 3];
  }

  return (
    programNode &&
    (programNode.type === "Program" ||
      programNode.type === "ExportNamedDeclaration")
  );
}

// 解析函数名称
function parseFunctionName(pLFunctionDeclarations) {
  return (pNode, pVisitors) => {
    let functionName = "";
    let exportDefault = false;
    let nonFunction = false;

    // 赋值表达式方式 F=function(){}
    if (
      pNode.type === "AssignmentExpression" &&
      isInGlobalScope(pNode, pVisitors)
    ) {
      const { left, right } = pNode;
      if (
        (right.type === "ArrowFunctionExpression" ||
          right.type === "FunctionExpression") &&
        left.type === "Identifier"
      ) {
        functionName = left.name;
      }
    }

    // 变量声明 const F=function(){}
    if (
      pNode.type === "VariableDeclarator" &&
      isInGlobalScope(pNode, pVisitors)
    ) {
      const { id, init } = pNode;
      if (
        (init.type === "ArrowFunctionExpression" ||
          init.type === "FunctionExpression") &&
        id.type === "Identifier"
      ) {
        functionName = id.name;
      }
    }

    // 函数声明 function F(){} | export function F(){}
    if (
      pNode.type === "FunctionDeclaration" &&
      isInGlobalScope(pNode, pVisitors)
    ) {
      const { id } = pNode;
      if (id.type === "Identifier") {
        functionName = id.name;
      }
    }

    // 默认导出函数 export default function F(){}
    if (
      pNode.type === "ExportDefaultDeclaration" &&
      isInGlobalScope(pNode, pVisitors)
    ) {
      const { declaration } = pNode;
      if (
        declaration.type === "FunctionDeclaration" ||
        declaration.type === "ArrowFunctionExpression"
      ) {
        if (declaration.id && declaration.id.type === "Identifier") {
          functionName = declaration.id.name;
        } else {
          functionName = "default";
        }
      } else if (declaration.type === "Identifier") {
        functionName = declaration.name;
        nonFunction = true;
      }
      exportDefault = true;
    }

    if (functionName) {
      const currentFunc = pLFunctionDeclarations.find(
        (_func) => _func.functionName === functionName
      );
      if (!currentFunc && !nonFunction) {
        pLFunctionDeclarations.push({
          functionName,
          exportDefault,
          loc: pNode.loc,
        });
      } else if (currentFunc && nonFunction && exportDefault) {
        currentFunc.exportDefault = exportDefault;
      }
    }
  };
}

module.exports = (pAST, pLFunctionDeclarations) => {
  walk.ancestor(
    pAST,
    {
      AssignmentExpression: parseFunctionName(pLFunctionDeclarations),
      VariableDeclarator: parseFunctionName(pLFunctionDeclarations),
      FunctionDeclaration: parseFunctionName(pLFunctionDeclarations),
      ExportDefaultDeclaration: parseFunctionName(pLFunctionDeclarations),
    },
    walk.base
  );
};
