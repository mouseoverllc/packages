import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import css from 'rollup-plugin-css-only';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    // ESM build
    {
      file: 'dist/quill-image-resizer.esm.js',
      format: 'es',
      sourcemap: false
    },
    // CommonJS build
    {
      file: 'dist/quill-image-resizer.cjs.js',
      format: 'cjs',
      sourcemap: false,
      exports: 'auto'
    },
    // UMD build (optional, usually for <script> tag use)
    {
      file: 'dist/quill-image-resizer.umd.js',
      format: 'umd',
      name: 'QuillImageResizer', // Global variable name if used in <script>
      sourcemap: false,
      exports: 'auto'
    },
    {
      file: 'dist/quill-image-resizer.umd.min.js', // Output file name
      format: 'umd',
      name: 'QuillImageResizer', // Global variable name when loaded in browser
      sourcemap: false,
      exports: 'auto',
      plugins: [terser()]
    }
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