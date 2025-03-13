import * as fs from "fs";
import path from "path";
import { decode } from "punycode";
import stringRandom from "string-random";
import analysis from "./analysis";
import tools from "./tools";



global.buildPath = String.raw`E:\test\NewProject_2\build\web-mobile` //定义全局build路径
global.filePath = path.join("./", String.raw`astTree`)

global.currPath = path.join(global.buildPath, "res") //定义全局res路径
const settings = fs.readFileSync(path.join(global.buildPath, String.raw`src\settings.js`)) //setting路径
const project = fs.readFileSync(path.join(global.buildPath, String.raw`src\project.js`)) //project路径

const code = project.toString('utf-8');
let _ccsettings = "let window = {CCSettings: {}};" + settings.toString('utf-8').split(';')[0]
global.Settings = eval(_ccsettings)
fs.mkdirSync(global.filePath, {
    recursive: true
})

function delete_dir(dirPath: string) {
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach(function (file) {
            let curPath = path.join(dirPath, file);
            if (fs.statSync(curPath).isDirectory()) {
                delete_dir(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(dirPath);
    }
}
//读取插件列表
let jsList = global.Settings["jsList"]
if (jsList) {
    for (let i of jsList) {
        tools.cacheReadList.push(path.dirname(global.currPath) + `/src/` + i)
        let _mkdir = "Scripts/plugin/"
        let str = `./project/assets/${_mkdir}` + path.basename(i).split(".")[0] + ".js"
        tools.cacheWriteList.push(str)
        let meta = {
            "ver": "1.0.8",
            "uuid": decode(stringRandom(22)),
            "isPlugin": true,
            "loadPluginInWeb": true,
            "loadPluginInNative": true,
            "loadPluginInEditor": false,
            "subMetas": {}
        }
        tools.writeFile(_mkdir, path.basename(i).split('.')[0] + '.js' + ".meta", meta)
    }
}
analysis.splitCompile(code).then(() => {
    const res = fs.readdirSync(global.filePath)
    for (let i of res) {
        let currPath = path.join(global.filePath, i)
        const currFile = fs.readFileSync(currPath, 'utf-8');
        let key = path.basename(currPath).split('.')[0]
        analysis.generatorCode(JSON.parse(currFile), key)
    }
    tools.init()
    delete_dir(global.filePath)
}).catch((err: string) => {
    console.log(err)
})