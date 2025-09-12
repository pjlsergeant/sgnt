import { getApp } from '~/lib/express';

async function main() {
  const [app] = await getApp();
  // app.use(staticFilesAuth, express.static('public'));

  app.listen(3000, () => console.log('Server started'));
}

main();
