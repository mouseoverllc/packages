import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import css from 'rollup-plugin-css-only';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/quill-image-resizer.js',
      format: 'umd',
      name: 'QuillImageResizer',
      sourcemap: true,
    },
    {
      file: 'dist/quill-image-resizer.min.js',
      format: 'umd',
      name: 'QuillImageResizer',
      sourcemap: true,
      plugins: [terser()]
    },
  ],
  plugins: [
    typescript(),
    resolve(),  // Locates modules in `node_modules`
    commonjs(), // Converts CommonJS modules to ES6
    css({ output: 'style.css' }), // ➤ write dist/style.css
    copy({
      targets: [
        { src: 'src/trash.svg', dest: 'dist' }, // ➤ copy icon to dist
        { src: 'src/style.css', dest: 'dist' } // optional: also copy raw css
      ]
    })
  ],
  external: [
    'quill'
  ],
};