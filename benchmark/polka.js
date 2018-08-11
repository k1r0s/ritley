const polka = require('polka');
const app = polka();

app.get('/', (req, res) => {
  res.end('Hello world!');
}).listen(3001).then(() => {
    console.log(`> Running on localhost:3001`);
});
