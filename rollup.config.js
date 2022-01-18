import { nodeResolve } from '@rollup/plugin-node-resolve'
import { babel } from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import postcss from 'rollup-plugin-postcss'
import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json'
import ttypescript from 'ttypescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import images from '@rollup/plugin-image';

const lessToJs = require('less-vars-to-js')

const path = require('path')
const fs = require('fs')

const themeVariables = lessToJs(
  fs.readFileSync(path.join(__dirname, './ant-theme.less'), 'utf8'),
  { resolveVariables: true, stripPrefix: true },
)

console.log({themeVariables})

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'lib/index.cjs.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'lib/index.esm.js',
      format: 'es',
      sourcemap: true,
    },
  ],
  // All the used libs needs to be here
  external: ['react', 'react-proptypes'],
  plugins: [
    typescript({
      typescript: ttypescript,
      tsconfig: 'tsconfig.json',
      tsconfigOverride: {
        compilerOptions: {
          declaration: true,
          module: 'ES2015',
        },
      },
    }),
    images(),
    json(),
    nodeResolve(),
    postcss({
      insert: true,
      use: [
        'sass',
        [
          'less',
          {
            javascriptEnabled: true,
            modifyVars: themeVariables,
            math: 'always'
          },
        ],
      ],
    }),
    babel({
      plugins: [['import', { libraryName: 'antd', style: true }]],
      exclude: ['node_modules/**', 'public/**'],
    }),
    commonjs({
      include: 'node_modules/**',
    }),
    peerDepsExternal(),
  ],
}