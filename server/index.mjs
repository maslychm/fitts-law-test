import { createApp } from './app.mjs';

const host = '127.0.0.1';
const port = Number(process.env.PORT || 3000);

createApp().listen(port, host, () => {
  console.log(`Local results API listening at http://${host}:${port}`);
});
