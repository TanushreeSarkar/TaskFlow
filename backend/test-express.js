const express = require('express');
const app = express();

try {
  app.get('*', (req, res) => res.send('ok'));
  console.log("'*' worked");
} catch (e) {
  console.error("'*' failed:", e.message);
}

try {
  app.get('(.*)', (req, res) => res.send('ok'));
  console.log("'(.*)' worked");
} catch (e) {
  console.error("'(.*)' failed:", e.message);
}

try {
  app.get('/*', (req, res) => res.send('ok'));
  console.log("'/*' worked");
} catch (e) {
  console.error("'/*' failed:", e.message);
}

try {
  app.get(/.*/, (req, res) => res.send('ok'));
  console.log("/.*/ worked");
} catch (e) {
  console.error("/.*/ failed:", e.message);
}
