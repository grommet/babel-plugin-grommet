# babel-plugin-grommet

Babel plugin to convert member style imports to default imports.

:warning: **Experimental**: This plugin only works with [Grommet Next](https://github.com/grommet/grommet/tree/NEXT) (current branch for Grommet 2.0). DO NOT use this with Grommet 1.X.


Transforms this:

```javascript
  import { Grommet, Button } from 'grommet';
```

into this:

```javascript
  import Grommet from 'grommet/components/grommet';
  import Button from 'grommet/components/button';
```

## Install

`npm install babel-plugin-grommet --save-dev`

or

`yarn add babel-plugin-grommet --dev`

## Usage

Add the plugin to your `.babelrc`

```json
{
  "plugins": ["grommet"]
}
```

## Why?

Grommet Next already adds all the bits and pieces for tree shaking to work. But most module bundlers today still don't exclude the modules that are not being used. We tested our library against Webpack and RollUp and both of them include all components that are not being used just for the fact that it has been imported like this `import { Button } from 'grommet'`. This is why you need to use this plugin.
