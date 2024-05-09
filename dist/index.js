"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("./api");
const shazam = new api_1.Shazam();
(async () => {
    const recognise = await shazam.recognise("file.mp3");
    console.log(recognise);
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQkFBK0I7QUFDL0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxZQUFNLEVBQUUsQ0FBQztBQUU1QixDQUFDLEtBQUssSUFBSSxFQUFFO0lBQ1YsTUFBTSxTQUFTLEdBQUcsTUFBTSxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3JELE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyJ9