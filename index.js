const fs = require("fs");
const handler = require("serve-handler");
const http = require("http");
/** @type { Array<{relPath: string, name: string}> } */
const files = [];
function addFile(relPath, name = null) {
  files.push({
    relPath,
    name,
  });
}

async function generateHtml() {
  return new Promise(async resolve => {
    async function readFiles(path) {
      let stop = false;
      fs.opendir(path, async (err, dir) => {
        while (!stop) {
          console.log("Reading dir at path ", path);
          const dirEnt = await dir.read();
          if (!!dirEnt) console.log("Found something at ", dirEnt.name);
          if (!dirEnt) stop = true;
          // read() will return falsey if no entries are left
          else if (dirEnt.isFile() && !!dirEnt.name.indexOf(".mp3")) {
            addFile(path + "/" + dirEnt.name);
          } else if (dirEnt.isDirectory()) {
            // It's a directory - recurse
            readFiles(path + "/" + dirEnt.name);
          }
        }
      });
    }
    await readFiles("./files");
    /** @param {{name: string, relPath: string}} file */
    function createHtmlTag(file) {
      return `<button class="file" onclick="this.getElementsByTagName('audio')[0].play()">${file.relPath}<audio src="${file.relPath}"></audio></button>`;
    }
    fs.readFile("./template.html", async (err, data) => {
      let html = "";
      for (const file of files) {
        console.log(file);
        html += createHtmlTag(file);
      }
      fs.writeFile(
        "index.html",
        data.toString().replace("{{DATA}}", `${html}`),
        {},
        () => {
          console.log("Generated html");
          resolve(true)}
      );
    });
  
  });
}

function serve() {
  console.log("Starting server at http://localhost:3154");
  const server = http.createServer((request, response) => {
    return handler(request, response);
  });

  server.listen(3154, () => {
    console.log("Running at http://localhost:3154");
  });
}

generateHtml().then(() => serve());
