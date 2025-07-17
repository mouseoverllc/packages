import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
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
  ],
  external: [
    'quill'
  ],
};