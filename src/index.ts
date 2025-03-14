import { Command } from "commander";
import * as fs from "fs";
import path from "path";
import { decode } from "punycode";
import stringRandom from "string-random";
import analysis from "./analysis";
import tools from "./tools";



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

function main(args: string[]) {

    const DEBUG = process.env.NODE_DEBUG === "1";

    let parse = "";
    let output = ""
    if (!DEBUG) {
        const program = new Command();

        program.option('-p, --parse', 'parse path')
            .option('-o, --output', 'output path', 'output')
            .parse(args);

        const options = program.opts();

        if (!options.path) {
            console.error('Error: --parse option is required.');
            program.help({ error: true });
            process.exit(1);
        }

        parse = options.path;
        output = options.output;
    } else {
        parse = String.raw`E:\test\NewProject_2\build\web-mobile`
        output = "./output"
    }
    global.paths = {
        ast: path.join("./", "ast"),
        output: output,
        res: path.join(parse, "res") //定义全局res路径
    };

    const settings = fs.readFileSync(path.join(parse, "src", "settings.js")) //setting路径
    const project = fs.readFileSync(path.join(parse, "src", "project.js")) //project路径

    const code = project.toString('utf-8');
    let _ccsettings = "let window = {CCSettings: {}};" + settings.toString('utf-8').split(';')[0]
    global.settings = eval(_ccsettings)
    fs.mkdirSync(global.paths.ast, { recursive: true })



    //读取插件列表
    let jsList = global.settings["jsList"]
    if (jsList) {
        for (let i of jsList) {
            tools.cacheReadList.push(path.dirname(global.paths.res) + `/src/` + i)
            let _mkdir = "Scripts/plugin/"
            let str = `${global.paths.output}/assets/${_mkdir}` + path.basename(i).split(".")[0] + ".js"
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
    analysis.compile(code).then(() => {
        const res = fs.readdirSync(global.paths.ast)
        fs.mkdirSync(`${global.paths.output}/assets/Scripts`, { recursive: true })   //generatorCode内需要生成Scripts文件夹
        for (let i of res) {
            let currPath = path.join(global.paths.ast, i)
            const currFile = fs.readFileSync(currPath, 'utf-8');
            let key = path.basename(currPath).split('.')[0]
            analysis.generate(JSON.parse(currFile), key)
        }
        tools.init()
        delete_dir(global.paths.ast)
    }).catch((err: string) => {
        console.log(err)
    })
}

main(process.argv);