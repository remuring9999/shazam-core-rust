import { Shazam } from "./api";
const shazam = new Shazam();

(async () => {
  const recognise = await shazam.recognise("file.mp3");
  console.log(recognise);
})();
