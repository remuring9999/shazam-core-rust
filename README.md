## Shzam 리버싱

~~1600Hz PCM 파일 지원 (s16le 샘플링)~~

```shell
ffmpeg -i test.mp3 -ar 16000 -ac 1 -f s16le test.pcm
```

.mp3 파일 ffmpeg 자체 변환 지원 O

- 16000Hz 샘플링 지원
- 16 bits depth

오류 발생시 비트 샘플링 ffmpeg로 직접 돌려보시길 ..

Sample Code

```js
const { Shazam } = require("./dist/api");
const shzam = new Shazam();
(async () => {
  const data = await shzam.recognise("file.mp3");
  console.log(data);
})();
```

## Coments

완성체 X
Rust 프로젝트 갈고 닦은것

## Credit

https://github.com/Numenorean/ShazamAPI
https://github.com/shazamio/shazamio-core
