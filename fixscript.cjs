const fs = require("fs");
const filePath = "c:/Users/madhu/Dheeraj/slu-alumni-connect/src/app/mentorship/page.tsx";
let content = fs.readFileSync(filePath, "utf8");
console.log("File length:", content.length);
const appIdx = content.indexOf("APP-");
console.log("APP- at:", appIdx);
if(appIdx > 0) {
  console.log("Context:", content.substring(appIdx - 100, appIdx + 100));
}
