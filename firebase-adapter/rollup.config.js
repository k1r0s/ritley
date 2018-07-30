import babel from 'rollup-plugin-babel';

export default {
  input: 'index.js',
  output: [
    { file: 'dist/firebase-adapter.cjs.js', format: 'cjs' }
  ],
  plugins: babel()
}
