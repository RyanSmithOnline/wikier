import * as fs from "fs";
import * as url from "url";
import path from "path";
import http from "http";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url)),
  wikiPath = path.join(__dirname, "wiki");

let createMenuPaths = (dir, done) => {
  let results = [];
  fs.readdir(dir, (_, list) => {
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, function (_, stat) {
        if (stat && stat.isDirectory()) {
          createMenuPaths(file, function (_, res) {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file.replace(wikiPath + "\\", ""));
          next();
        }
      });
    })();
  });
};

let menu = [];

createMenuPaths(wikiPath, function (err, results) {
  if (err) throw err;
  menu = results.filter((e) => {
    return e.includes(".attachments") !== true;
  });
});

(() =>
  http.createServer((req, res) => {
    if (req.url === "/api/menu" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(menu));
    } else if (req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(fs.readFileSync("wikier.html"));
    } else {
      let filePath = wikiPath + decodeURIComponent(req.url);
      fs.readFile(filePath, function (error, content) {
        if (error) {
          console.log(error);
          return;
        }
        res.writeHead(200, { "Content-Type": "text/markdown" });
        res.end(content, "utf-8");
      });
    }
  }))().listen(3000);
