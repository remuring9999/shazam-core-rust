const { Shazam } = require("./dist/api");
const shzam = new Shazam();
(async () => {
  const data = await shzam.recognise("file.mp3");
  console.log(data);
})();
