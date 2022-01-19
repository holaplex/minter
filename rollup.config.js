import typescript from 'rollup-plugin-typescript2';
import ttypescript from 'ttypescript';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { visualizer } from 'rollup-plugin-visualizer';
import { terser } from 'rollup-plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import lessToJs from 'less-vars-to-js';
import postcss from 'rollup-plugin-postcss'
import image from 'rollup-plugin-img';
import fs from 'fs';
import lessTildeImporter from '@ovh-ux/rollup-plugin-less-tilde-importer';
import path from 'path';

const antdLess = fs.readFileSync('./ant-theme.less', 'utf8');

const antdVars = lessToJs(antdLess, {resolveVariables: true, stripPrefix: true});


const input = 'src/index.ts';

const plugins = ({ browser }) => [
  peerDepsExternal(),
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
  lessTildeImporter({
    paths: [
      path.resolve(__dirname, './node_modules'),  
      path.resolve(__dirname, '../../node_modules'),
    ],
  }),
  postcss({
    minimize: true,
    use: {
        sass: null,
        stylus: null,
        less: { javascriptEnabled: true, modifyVars: antdVars }
    }, 
   extract: true
}),
  commonjs(),
  json(),
  image({
    output: 'lib/assets/images', // default the root
    extensions: /\.(png|jpg|jpeg|gif|svg)$/, // support png|jpg|jpeg|gif|svg, and it's alse the default value
    limit: 300000, 
    exclude: 'node_modules/**'
  })
 
];

const config = ({ browser, format } = { browser: false }) => {
  const config = {
    input,
    plugins: plugins({ browser }),
  };

  if (browser) {
    switch (format) {
      case 'esm':
        config.output = {
          file: 'lib/index.browser.esm.js',
          format: 'es',
          sourcemap: true,
        };
        break;
      case 'iife':
        const base = {
          format: 'iife',
          sourcemap: true,
          globals: {
            '@solana/web3.js': 'solanaWeb3',
            '@solana/spl-token': 'splToken',
          },
        };
        config.output = [
          {
            ...base,
            file: 'lib/index.iife.js',
          },
          {
            ...base,
            file: 'lib/index.iife.min.js',
            plugins: [terser(), visualizer()],
          },
        ];
        config.context = 'window';
        break;
      default:
        throw new Error(`Unknown format: ${format}`);
    }
  } else {
    config.output = [
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
    ];
  }

  return config;
};

export default [
  // Node
  config(),
  // Browser
  config({ browser: true, format: 'esm' }),
  config({ browser: true, format: 'iife' }),
];

