import typescript from 'rollup-plugin-typescript2';
import ttypescript from 'ttypescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import images from '@rollup/plugin-image';
import json from '@rollup/plugin-json';
import { visualizer } from 'rollup-plugin-visualizer';
import { terser } from 'rollup-plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import lessToJs from 'less-vars-to-js';
import postcss from 'rollup-plugin-postcss'
import less from 'rollup-plugin-less';
import fs from 'fs';
import lessTildeImporter from '@ovh-ux/rollup-plugin-less-tilde-importer';
import path from 'path';

const antdLess = fs.readFileSync('./ant-theme.less', 'utf8');

const antdVars = lessToJs(antdLess, {resolveVariables: true, stripPrefix: true});

console.log({antdVars})

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
  resolve({
    browser,
    dedupe: ['bn.js', 'buffer', 'crypto-hash'],
    preferBuiltins: !browser,
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
  // less({insert: true,option: {javascriptEnabled: true, modifyVars: antdVars}}),
  commonjs(),
  json(),
  images(),
];

const config = ({ browser, format } = { browser: false }) => {
  const config = {
    input,
    plugins: plugins({ browser }),
    // Default external, can be overrided
    external: [
      '@solana/spl-token',
      '@solana/web3.js',
      '@types/bs58',
      'axios',
      'bn.js',
      'borsh',
      'bs58',
      'buffer',
      'crypto-hash',
    ],
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
        config.external = ['@solana/web3.js', '@solana/spl-token'];
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

