import babel from 'rollup-plugin-babel';

export default {
  input: 'index.js',
  output: [
    { file: 'dist/ritley.cjs.js', format: 'cjs' }
  ],
  plugins: babel()
}
