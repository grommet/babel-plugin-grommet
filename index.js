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
          `(${dependencies.join('|')})(\\${pathUtils.sep}(components|contexts|themes|utils))?$`
        );
        const matches = dependencyPathRegexp.exec(source);
        if (matches) {
          const context = matches[0];
          const stripRegExp = new RegExp(`node_modules\\${pathUtils.sep}|\.js`, 'g');
          const modulesInContext = find.fileSync(
            /\.js$/, pathUtils.join('.', 'node_modules', context)
          ).map(
            file => file.replace(stripRegExp, '')
          ).filter(
            // remove grommet-icons inside grommet node_modules
            file => file.indexOf(pathUtils.join(dependency, 'grommet-icons')) === -1
          );
          const memberImports = path.node.specifiers.filter(
            specifier => specifier.type === 'ImportSpecifier'
          );

          const transforms = [];
          const development = process.env.NODE_ENV === 'development';
          const es6 = `${pathUtils.sep}es6${pathUtils.sep}`;
          memberImports.forEach((memberImport) => {
            const componentName = memberImport.imported.name;
            // filter down to modules that match this componentName
            const matchingModules = modulesInContext.filter(module =>
              module.endsWith(`${pathUtils.sep}${componentName}`))
            // sort production to have es6 first and development to have es5
            // this is because webpack hot reloading doesn't have the es6 stuff
            .sort((m1, m2) =>
              ((development && m1.includes(es6)) ||
              (!development && m2.includes(es6))) ? 1 : -1);
            if (matchingModules.length > 0) {
              const newImportSpecifier = (
                types.importDefaultSpecifier(types.identifier(memberImport.local.name))
              );
              transforms.push(types.importDeclaration(
                [newImportSpecifier],
                types.stringLiteral(matchingModules[0])
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
