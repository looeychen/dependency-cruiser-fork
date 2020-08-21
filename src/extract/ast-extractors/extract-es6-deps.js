/* eslint-disable complexity */
/* eslint-disable max-lines-per-function */
const walk = require("acorn-walk");
const estreeHelpers = require("./estree-helpers");

function pushImportNodeValue(pDependencies) {
  return (pNode) => {
    if (estreeHelpers.isStringLiteral(pNode.source)) {
      pDependencies.push({
        module: pNode.source.value,
        moduleSystem: "es6",
        dynamic: true,
        exoticallyRequired: false,
      });
    } else if (estreeHelpers.isPlaceholderlessTemplateLiteral(pNode.source)) {
      pDependencies.push({
        module: pNode.source.quasis[0].value.cooked,
        moduleSystem: "es6",
        dynamic: true,
        exoticallyRequired: false,
      });
    }
  };
}

module.exports = (pAST, pDependencies) => {
  function pushSourceValue(pNode) {
    if (pNode.source && pNode.source.value) {
      let importedFuncs = [];
      if (pNode.type === "ImportDeclaration") {
        const { specifiers } = pNode;
        specifiers.forEach((_specifier) => {
          const { type, imported, local } = _specifier;
          if (
            type === "ImportDefaultSpecifier" &&
            local &&
            local.type === "Identifier"
          ) {
            importedFuncs.push({
              imported: "default",
              local: local.name,
            });
          }

          if (
            type === "ImportNamespaceSpecifier" &&
            local &&
            local.type === "Identifier"
          ) {
            importedFuncs.push({
              imported: "all",
              local: local.name,
            });
          }

          if (
            type === "ImportSpecifier" &&
            imported &&
            imported.type === "Identifier" &&
            local &&
            local.type === "Identifier"
          ) {
            importedFuncs.push({
              imported: imported.name,
              local: local.name,
            });
          }
        });
      }

      pDependencies.push({
        module: pNode.source.value,
        moduleSystem: "es6",
        dynamic: false,
        exoticallyRequired: false,
        importedFuncs,
      });
    }
  }

  walk.simple(
    pAST,
    {
      ImportDeclaration: pushSourceValue,
      ImportExpression: pushImportNodeValue(pDependencies),
      ExportAllDeclaration: pushSourceValue,
      ExportNamedDeclaration: pushSourceValue,
    },
    // see https://github.com/acornjs/acorn/issues/746
    walk.base
  );
};
