const types = require('babel-types');
const find = require('find');

module.exports = () => (
  {
    visitor: {
      ImportDeclaration: (path) => {
        const source = path.node.source.value;

        if (source.startsWith('grommet')) {
          const context = /grommet(\/(components|themes|utils))?/.exec(source)[0];
          const modulesInContext = find.fileSync(
            /\.js$/, `./node_modules/${context}`
          ).map(
            file => file.replace(/node_modules\/|\.js/g, '')
          );
          const memberImports = path.node.specifiers.filter(
            specifier => specifier.type === 'ImportSpecifier'
          );

          const transforms = [];
          memberImports.forEach((memberImport) => {
            const componentName = memberImport.imported.name;
            let newPath;
            modulesInContext.some((module) => {
              if (module.endsWith(`/${componentName}`)) {
                newPath = module;
                return true;
              }
              return false;
            });
            const newImportSpecifier = (
              types.importDefaultSpecifier(types.identifier(memberImport.local.name))
            );
            transforms.push(types.importDeclaration(
              [newImportSpecifier],
              types.stringLiteral(newPath)
            ));
          });

          if (transforms.length > 0) {
            path.replaceWithMultiple(transforms);
          }
        }
      },
    },
  }
);
