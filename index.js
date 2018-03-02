const types = require('babel-types');
const find = require('find');
const pathUtils = require('path');

module.exports = () => (
  {
    visitor: {
      ImportDeclaration: (path, { opts: { dependencies = ['grommet', 'grommet-icons'] } }) => {
        const source = path.node.source.value;
        const dependency = source.split('/')[0];

        const dependencyPathRegexp = new RegExp(
          `(${dependencies.join('|')})(\\${pathUtils.sep}(components|themes|utils))?$`
        );
        const matches = dependencyPathRegexp.exec(source);
        if (matches) {
          const context = matches[0];
          const modulesInContext = find.fileSync(
            /\.js$/, pathUtils.join('.', 'node_modules', context)
          ).map(
            file => file.replace(new RegExp(`node_modules\\${pathUtils.sep}|\.js`, 'g'), '')
          ).filter(
            // remove grommet-icons inside grommet node_modules
            file => file.indexOf(pathUtils.join(dependency, 'grommet-icons')) === -1
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
              if (module.endsWith(`${pathUtils.sep}${componentName}`)) {
                if (process.env.NODE_ENV === 'development') {
                  // in development webpack alias may be enabled
                  // es6 modules are not available in the source code
                  // we need to remove it and use commonjs structure.
                  newPath = module.replace(`es6${pathUtils.sep}`, '');
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
            if (newPath) {
              transforms.push(types.importDeclaration(
                [newImportSpecifier],
                types.stringLiteral(newPath)
              ));
            }
          });

          if (transforms.length > 0) {
            path.replaceWithMultiple(transforms);
          }
        }
      },
    },
  }
);
