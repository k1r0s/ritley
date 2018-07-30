import babel from 'rollup-plugin-babel';

export default {
  input: 'index.js',
  output: [
    { file: 'dist/raw-adapter.cjs.js', format: 'cjs' }
  ],
  plugins: babel()
}
