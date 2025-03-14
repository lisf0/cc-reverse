import * as fs from "fs";
import path from "path";
import stringRandom from "string-random";
import { decode_uuid } from "./uuid-utils";

/*
 * @Date: 2021-02-25 11:32:54
 */

// const decodeUuid = require("./decode");

const _name = "project"
const id = decode_uuid(stringRandom(22))
const project = {
    "engine": "cocos-creator-js",
    "packages": "packages",
    "name": _name,
    "id": id,
    "version": "2.3.4",
    "isNew": false
}
const jsconfig = {
    "compilerOptions": {
        "target": "es6",
        "module": "commonjs",
        "experimentalDecorators": true
    },
    "exclude": [
        "node_modules",
        ".vscode",
        "library",
        "local",
        "settings",
        "temp"
    ]
}
const tsconfig = {
    "compilerOptions": {
        "module": "commonjs",
        "lib": ["es2015", "es2017", "dom"],
        "target": "es5",
        "experimentalDecorators": true,
        "skipLibCheck": true,
        "outDir": "temp/vscode-dist",
        "forceConsistentCasingInFileNames": true
    },
    "exclude": [
        "node_modules",
        "library",
        "local",
        "temp",
        "build",
        "settings"
    ]
}
const settings_project = {
    "group-list": "", //global.Settings["groupList"],
    "collision-matrix": "", //global.Settings["collisionMatrix"],
    "excluded-modules": [
        "3D Physics/Builtin"
    ],
    "last-module-event-record-time": 1613784461638,
    "design-resolution-width": 960,
    "design-resolution-height": 640,
    "fit-width": false,
    "fit-height": true,
    "use-project-simulator-setting": false,
    "simulator-orientation": false,
    "use-customize-simulator": true,
    "simulator-resolution": {
        "height": 640,
        "width": 960
    },
    "assets-sort-type": "name",
    "facebook": {
        "appID": "",
        "audience": {
            "enable": false
        },
        "enable": false,
        "live": {
            "enable": false
        }
    },
    "migrate-history": [],
    "start-scene": "current"
}

export class Conf {
    static init() {
        settings_project["group-list"] = global.settings["groupList"]
        settings_project["collision-matrix"] = global.settings["collisionMatrix"]
        settings_project["start-scene"] = path.basename(global.settings["launchScene"]).split(".")[0]
        fs.mkdirSync(`${global.paths.output}/settings`, { recursive: true })
        fs.appendFileSync(`${global.paths.output}/settings/project.json`, JSON.stringify(settings_project))
        fs.writeFileSync(`${global.paths.output}/project.json`, JSON.stringify(project))
        fs.writeFileSync(`${global.paths.output}/jsconfig.json`, JSON.stringify(jsconfig))
        fs.writeFileSync(`${global.paths.output}/tsconfig.json`, JSON.stringify(tsconfig))
    }

}

