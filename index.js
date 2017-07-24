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
          ).reverse(); // reverse so es6 modules have higher priority
          const memberImports = path.node.specifiers.filter(
            specifier => specifier.type === 'ImportSpecifier'
          );

          const transforms = [];
          memberImports.forEach((memberImport) => {
            const componentName = memberImport.imported.name;
            let newPath;
            modulesInContext.some((module) => {
              // if webpack alias is enabled the es6 path does not exist.
              if (module.endsWith(`/${componentName}`)) {
                if (process.env.NODE_ENV === 'development') {
                  // in development webpack alias may be enabled
                  // es6 modules are not available in the source code
                  // we need to remove it and use commonjs structure.
                  newPath = module.replace('es6/', '');
                } else {
                  newPath = module;
                }
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
