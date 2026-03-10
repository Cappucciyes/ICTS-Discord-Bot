const fs = require("fs");

function readJSON(path) {
    const fileData = fs.readFileSync(path, "utf-8");
    const savedData = JSON.parse(fileData);
    return savedData;
}

function writeJSON(path, data){
    fs.writeFileSync(path, JSON.stringify(data,null, 4));
}

module.exports = {
    readJSON,
    writeJSON
}