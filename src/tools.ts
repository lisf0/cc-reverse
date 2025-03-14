/*
 * @Date: 2021-01-20 17:54:37
 */
import * as fs from "fs";
import path from "path";
import stringRandom from "string-random";
import { Conf } from "./conf";
import json2plist from "./json2plist";
import { decode_uuid } from "./uuid-utils";

const sizeOf = require('image-size');

export default new class {

    initialData = [];
    fileList: string[] = [];
    fileMap = new Map();
    cacheReadList: string[] = [];
    cacheWriteList: string[] = [];
    nodeData: any = {};
    sceneAssets: string[] = [];
    sceneAssetsMap = new Map();
    prefabs = [];
    prefabsMap = new Map();
    spriteFrames = {};
    spriteFramesMap = new Map();
    spriteAtlas = {};
    spriteAtlasMap = new Map();
    audio: any[] = [];
    audioMap = new Map();
    ttfMap = new Map();
    animation: any[] = [];
    animationMap: Map<String, String> = new Map();
    pictureMap = new Map();
    rest = [];
    isFirst = true;
    /**
     * @Description: 初始化数据
     */
    init() {
        this.initialData = [];
        this.fileList = [];
        //读取文件
        this.readFile(global.paths.res, true).then(() => {
            this.convertToFile()
            Conf.init()
        })
    }
    isEmptyObject(obj: Object) {
        for (let key in obj) {
            return false
        };
        return true
    }

    /**
     * @Description: 
     * @param {string} filePath //文件路径
     * @param {boolean} first //第一次
     * @param {boolean} isConvert //是否处理数据
     */
    async readFile(filePath: string, first: boolean) {
        const content = await fs.promises.readdir(filePath);
        for (let file of content) {
            let status = await fs.promises.stat(path.join(filePath, file));
            if (status.isFile()) {
                this.fileList.push(path.join(filePath, file));
                this.fileMap.set(path.basename(path.join(filePath, file).split('.')[0]), path.join(filePath, file))
            } else {
                await this.readFile(path.join(filePath, file), false);
            }
        }
        if (first) {
            if (!this.isEmptyObject(global.settings["subpackages"])) {
                let subpackagesPath = path.dirname(global.paths.res) + String.raw`\subpackages`
                await this.readFile(subpackagesPath, false);
            }
            for (let currPath of this.fileList) {
                if (path.extname(currPath) === '.json') {
                    const currFile = await fs.promises.readFile(currPath, "utf-8");
                    let key = path.basename(currPath).split('.')[0]
                    this.nodeData = JSON.parse(currFile)
                    this.process(key, JSON.parse(currFile))
                }
            }
        }
    }

    /**
     * @Description: 全局查找值
     * @param {object} data
     * @param {string} value
     */
    globalFinding(data: any, key: string, value: string): any {
        for (let res of data) {
            if (Array.isArray(res)) {
                return this.globalFinding(res, key, value)
            } else if (res[key]) {
                return res[key][value]
            }
        }
    }

    /**
     * @Description: 处理数据
     * @param {object} data
     */
    process(key: string, data: any) {
        if (global.settings == "{}") {
            return
        }
        let that = this
        reveal(data).then((res) => {
            writeData(res)
        })
        let count = 0

        function writeData(data: any) {
            //json资源
            if (typeof data === "object" && data["__type__"]) {
                let type = data["__type__"]
                if (type) {
                    if (type == "cc.AudioClip") {
                        let name = data["_name"] + data["_native"]
                        //that.audio.push(data)
                        let _mkdir = "Audio"
                        let uuid = key
                        let metaData = {
                            "ver": "1.2.7",
                            "uuid": uuid,
                            "optimizationPolicy": "AUTO",
                            "asyncLoadAssets": false,
                            "readonly": false,
                            "subMetas": {}
                        }
                        if (that.fileMap.has(uuid)) {
                            let writePath = String.raw`${name}`
                            let currPath = that.fileMap.get(uuid)
                            if (that.cacheWriteList.includes(`${global.paths.output}/assets/Texture/${writePath}`)) {
                                writePath = name + `_${count++}` + path.extname(currPath)
                            }
                            that.cacheReadList.push(currPath)
                            that.cacheWriteList.push(`${global.paths.output}/assets/${_mkdir}/${writePath}`)
                            that.fileMap.delete(uuid)
                        }
                        that.writeFile(_mkdir, name + ".meta", metaData)
                    }
                    if (type == "cc.TextAsset") {
                        let name = data['_name'] + ".json"
                        let uuid = key
                        let _mkdir = "resource"
                        let metaData = {
                            "ver": "1.2.7",
                            "uuid": uuid,
                            "subMetas": {}
                        }
                        that.writeFile(_mkdir, name, data)
                        that.writeFile(_mkdir, name + ".meta", metaData)
                    }
                    //console.log(type)
                    if (type == "cc.AnimationClip") {
                        let name = data["_name"]
                        let _mkdir = "Animation"
                        let filename = name + ".anim"
                        that.writeFile(_mkdir, filename, data)
                        that.animation.push(data)
                        let uuid = key
                        let metaData = {
                            "ver": "1.2.7",
                            "uuid": uuid,
                            "optimizationPolicy": "AUTO",
                            "asyncLoadAssets": false,
                            "readonly": false,
                            "subMetas": {}
                        }
                        that.writeFile(_mkdir, filename + ".meta", metaData)
                    }
                }
            } else {
                for (let i in data) {
                    let type = data[i]['__type__'];
                    if (Array.isArray(data[i])) {
                        writeData(data[i])
                    } else if (type) {
                        if (type === 'cc.SceneAsset') {
                            let filename = data[0]['_name'] + '.fire'
                            let _mkdir = 'Scene'
                            that.sceneAssets.push(JSON.stringify(data))
                            that.writeFile(_mkdir, filename, data)
                            for (let j in that.nodeData) {
                                if (Array.isArray(that.nodeData[j])) {
                                    if (that.nodeData[j][0]["_name"] == data[0]["_name"]) {
                                        let uuid = decode_uuid(that.createLibrary(j, key))
                                        let metaData = {
                                            "ver": "1.2.7",
                                            "uuid": uuid,
                                            "optimizationPolicy": "AUTO",
                                            "asyncLoadAssets": false,
                                            "readonly": false,
                                            "subMetas": {}
                                        }
                                        that.writeFile(_mkdir, filename + ".meta", metaData)
                                    }
                                }
                            }
                        }
                        if (type === 'cc.Prefab') {
                            let name = data[i]['_name']
                            //console.log(name)
                            let filename = name + '.prefab'
                            if (that.prefabsMap.has(filename)) {
                                filename = name + `_${count++}` + ".prefab"
                            }
                            let _mkdir = 'Prefab'
                            that.prefabsMap.set(filename, data)
                            that.writeFile(_mkdir, filename, data)
                            for (let j in that.nodeData) {
                                if (Array.isArray(that.nodeData[j])) {
                                    if (that.nodeData[j][0]["_name"] == data[0]["_name"]) {
                                        let uuid = decode_uuid(that.createLibrary(j, key))
                                        let metaData = {
                                            "ver": "1.2.7",
                                            "uuid": uuid,
                                            "optimizationPolicy": "AUTO",
                                            "asyncLoadAssets": false,
                                            "readonly": false,
                                            "subMetas": {}
                                        }
                                        that.writeFile(_mkdir, filename + ".meta", metaData)
                                    }
                                }
                                if (that.nodeData[j]["__type__"] == 'cc.Prefab' && that.nodeData[j]["_name"] == name) {
                                    let uuid = decode_uuid(that.createLibrary(j, key))
                                    if (key.length > 9) {
                                        uuid = key
                                    }
                                    let metaData = {
                                        "ver": "1.2.7",
                                        "uuid": uuid,
                                        "optimizationPolicy": "AUTO",
                                        "asyncLoadAssets": false,
                                        "readonly": false,
                                        "subMetas": {}
                                    }
                                    that.writeFile(_mkdir, filename + ".meta", metaData)
                                }
                            }
                        }
                        if (type == "cc.AudioClip") {
                            let name = data[i]["_name"] + data[i]["_native"]
                            let _mkdir = "Audio"
                            that.audio.push(data[i])
                            for (let j in that.nodeData) {
                                if (that.nodeData[j]["_name"] && that.nodeData[j]["_name"] == data[i]["_name"]) {
                                    let uuid = decode_uuid(that.createLibrary(j, key))
                                    let metaData = {
                                        "ver": "1.2.7",
                                        "uuid": uuid,
                                        "optimizationPolicy": "AUTO",
                                        "asyncLoadAssets": false,
                                        "readonly": false,
                                        "subMetas": {}
                                    }
                                    if (that.fileMap.has(uuid)) {
                                        let writePath = String.raw`${name}`
                                        let currPath = that.fileMap.get(uuid)
                                        if (that.cacheWriteList.includes(`${global.paths.output}/assets/Texture/${writePath}`)) {
                                            writePath = name + `_${count++}` + path.extname(currPath)
                                        }
                                        that.cacheReadList.push(currPath)
                                        that.cacheWriteList.push(`${global.paths.output}/assets/${_mkdir}/${writePath}`)
                                        that.fileMap.delete(uuid)
                                    }
                                    that.writeFile(_mkdir, name + ".meta", metaData)
                                }
                            }
                        }
                        if (type == "cc.AnimationClip") {
                            let name = data[i]["_name"]
                            let filename = name + ".anim"
                            let _mkdir = "Animation"
                            that.writeFile(_mkdir, filename, data[i])
                            that.animation.push(data[i])
                            for (let j in that.nodeData) {
                                if (that.nodeData[j]["_name"] && that.nodeData[j]["_name"] == data[i]["_name"]) {
                                    that.animationMap.set(filename, decode_uuid(that.createLibrary(j, key)))

                                    let uuid = decode_uuid(that.createLibrary(j, key))
                                    let metaData = {
                                        "ver": "1.2.7",
                                        "uuid": uuid,
                                        "optimizationPolicy": "AUTO",
                                        "asyncLoadAssets": false,
                                        "readonly": false,
                                        "subMetas": {}
                                    }
                                    that.writeFile(_mkdir, filename + ".meta", metaData)
                                }
                            }
                        }
                        if (type == "cc.TTFFont" || type == "cc.BitmapFont" || type == "cc.LabelAtlas") {
                            for (let j in that.nodeData) {
                                if (that.nodeData[j]["_name"] && that.nodeData[j]["_name"] == data[i]["_name"]) {
                                    let uuid = decode_uuid(that.createLibrary(j, key))
                                    that.ttfMap.set(uuid, data[i])
                                }
                            }
                        }
                        //骨骼资源
                        if (type == "dragonBones.DragonBonesAsset") {
                            let name = data[i]["_name"]
                            let _mkdir = "Texture" + "/" + name
                            if (data[i]["_native"]) {
                                let uuid = ""
                                for (let j in that.nodeData) {
                                    if (that.nodeData[j]["_name"] && that.nodeData[j]["_name"] == data[i]["_name"]) {
                                        uuid = decode_uuid(that.createLibrary(j, key))
                                        let filename = name + data[i]["_native"]
                                        let metaData = {
                                            "ver": "1.0.1",
                                            "uuid": uuid,
                                            "subMetas": {}
                                        }
                                        that.writeFile(_mkdir, filename + ".meta", metaData)
                                        if (that.fileMap.has(uuid)) {
                                            let currPath = that.fileMap.get(uuid)
                                            let writePath = String.raw`${name}${path.extname(currPath)}`
                                            if (that.cacheWriteList.includes(`${global.paths.output}/assets/Texture/${writePath}`)) {
                                                writePath = name + `_${count++}` + path.extname(currPath)
                                            }
                                            that.cacheReadList.push(currPath)
                                            that.cacheWriteList.push(`${global.paths.output}/assets/${_mkdir}/${writePath}`)
                                            that.fileMap.delete(uuid)
                                        }
                                    }
                                }
                            } else if (data[i]["_dragonBonesJson"]) {
                                let filename = name + ".json"
                                let _mkdir = "Texture" + "/" + name
                                that.writeFile(_mkdir, filename, JSON.parse(data[i]["_dragonBonesJson"]))
                                for (let j in that.nodeData) {
                                    if (that.nodeData[j]["_name"] && that.nodeData[j]["_name"] == data[i]["_name"]) {
                                        let uuid = decode_uuid(that.createLibrary(j, key))
                                        let metaData = {
                                            "ver": "1.0.1",
                                            "uuid": uuid,
                                            "subMetas": {}
                                        }
                                        that.writeFile(_mkdir, filename + ".meta", metaData)
                                    }
                                }
                            }
                            //JSON格式
                        }
                        //骨骼图集
                        if (type == "dragonBones.DragonBonesAtlasAsset") {
                            let name = data[i]["_name"]
                            let filename = name + ".json"
                            let _mkdir = "Texture" + "/" + name
                            that.writeFile(_mkdir, filename, JSON.parse(data[i]["_atlasJson"]))
                            for (let j in that.nodeData) {
                                if (that.nodeData[j]["_name"] && that.nodeData[j]["_name"] == data[i]["_name"]) {
                                    let uuid = decode_uuid(that.createLibrary(j, key))
                                    let metaData = {
                                        "ver": "1.0.1",
                                        "uuid": uuid,
                                        "subMetas": {}
                                    }
                                    that.writeFile(_mkdir, filename + ".meta", metaData)
                                }
                            }
                            if (that.fileMap.has(decode_uuid(data[i]["_texture"]["__uuid__"]))) {
                                let currPath = that.fileMap.get(decode_uuid(data[i]["_texture"]["__uuid__"]))
                                let writePath = String.raw`${name}${path.extname(currPath)}`
                                if (that.cacheWriteList.includes(`${global.paths.output}/assets/Texture/${writePath}`)) {
                                    writePath = name + `_${count++}` + path.extname(currPath)
                                }
                                that.cacheReadList.push(currPath)
                                that.cacheWriteList.push(`${global.paths.output}/assets/${_mkdir}/${writePath}`)
                                let sprite = {
                                    "__type__": "cc.SpriteFrame",
                                    "content": {
                                        "name": name,
                                        "texture": filename,
                                        "rect": [0, 0, 0, 0],
                                        "offset": [0, 0],
                                        "originalSize": [0, 0],
                                        "capInsets": [0, 0, 0, 0]
                                    }
                                }
                                let pictureWidth = sizeOf(currPath).width
                                let pictureHeight = sizeOf(currPath).height
                                let fileName = writePath
                                that.convertToPictureFile(sprite, decode_uuid(stringRandom(22)), fileName, pictureWidth, pictureHeight, _mkdir)
                                that.fileMap.delete(decode_uuid(data[i]["_texture"]["__uuid__"]))
                            }
                        }
                        //粒子资源                       
                        if (type == 'cc.ParticleAsset') {
                            let name = data[i]["_name"]
                            let filename = data[i]["_name"] + data[i]["_native"]
                            //console.log(name)
                            let _mkdir = "Picture"
                            for (let j in that.nodeData) {
                                if (that.nodeData[j]["_name"] == name) {
                                    let texture = decode_uuid(that.createLibrary(j, key))
                                    that.spriteAtlasMap.set(texture, data[i])
                                    let metaData = {
                                        "ver": "1.0.1",
                                        "uuid": texture,
                                        "subMetas": {}
                                    }
                                    that.writeFile(_mkdir, filename + ".meta", metaData)
                                }
                            }
                        }
                        //Texture资源
                        //图集
                        if (type == 'cc.SpriteAtlas') {
                            let name = data[i]["_name"]
                            for (let j in that.nodeData) {
                                if (that.nodeData[j]["_name"] == name) {
                                    let texture = decode_uuid(that.createLibrary(j, key))
                                    that.spriteAtlasMap.set(texture, data[i])
                                }
                            }
                        }
                        if (type == "cc.SpriteFrame") {
                            let texture = data[i]["content"]["texture"]
                            let temp = new Map()
                            let uuid = ""
                            for (let j in that.nodeData) {
                                //确保同名和uuid相同
                                if (that.nodeData[j]["content"] && that.nodeData[j]["content"]["texture"] == data[i]["content"]["texture"] && that.nodeData[j]["content"]["name"] == data[i]["content"]["name"]) {
                                    uuid = decode_uuid(that.createLibrary(j, key))
                                    that.spriteFramesMap.set(uuid, data[i])
                                    temp.set(uuid, data[i])
                                    if (that.pictureMap.has(texture)) {
                                        if (that.pictureMap.get(texture).has(uuid)) {
                                            continue
                                        }
                                        that.pictureMap.get(texture).set(uuid, data[i])
                                    } else {
                                        that.pictureMap.set(texture, temp)
                                    }
                                }
                            }



                        }
                    }
                }
            }

        }
        async function reveal(jsonObject: any) {
            for (let key in jsonObject) {
                if (typeof (jsonObject[key]) == 'object' && !that.isEmptyObject(jsonObject[key])) {
                    reveal(jsonObject[key]);
                }
                if (key == "__uuid__" && jsonObject[key]) {
                    jsonObject[key] = decode_uuid(jsonObject[key])
                }
            }
            return jsonObject
        }
    }

    createLibrary(index: string, key: string) {
        if (global.settings == "{}") {
            return
        }
        for (let key1 in global.settings["packedAssets"]) {
            if (key == key1) {
                let result = global.settings["packedAssets"][key][index]
                if (typeof global.settings["packedAssets"][key][index] == "number") {
                    return global.settings["uuids"][result]
                } else {
                    return result
                }
            }
        }
    }
    isFileExist(path: string) {
        try {
            fs.accessSync(path, fs.constants.F_OK);
        } catch (e) {
            return false;
        }
        return true;
    }

    copyFile() {
        for (let i in this.cacheReadList) {
            fs.mkdirSync(path.dirname(this.cacheWriteList[i]), {
                recursive: true
            })
            let readStream = fs.createReadStream(this.cacheReadList[i])
            let writeStream = fs.createWriteStream(this.cacheWriteList[i])
            readStream.pipe(writeStream)
            readStream.on('error', (error) => {
                console.log('readStream error', error.message);
            })
            writeStream.on('error', (error) => {
                console.log('writeStream error', error.message);
            })
        }
    }

    convertToSpriteAtlaFile(subMetas: any, filename: string, _uuid: string, plistWidth: number, plistHeight: number) {
        let _subMetas: any = {}
        let _spriteMap: any = {}
        let frames: any = {}
        let plistJson: any = {}
        let count = 0
        let pictureName = filename.split('.')[0]
        let pictureSubMetas: any = {}
        pictureSubMetas[pictureName] = {
            "ver": "1.0.4",
            "uuid": decode_uuid(stringRandom(22)),
            "rawTextureUuid": _uuid,
            "trimType": "auto",
            "trimThreshold": 1,
            "rotated": false,
            "offsetX": 0,
            "offsetY": 0,
            "trimX": 0,
            "trimY": 0,
            "width": plistWidth,
            "height": plistHeight,
            "rawWidth": plistWidth,
            "rawHeight": plistHeight,
            "borderTop": 0,
            "borderBottom": 0,
            "borderLeft": 0,
            "borderRight": 0,
            "spriteType": "normal",
            "subMetas": {}
        }
        let spriteMap = {
            "ver": "2.3.4",
            "uuid": _uuid,
            "type": "sprite",
            "wrapMode": "clamp",
            "filterMode": "bilinear",
            "premultiplyAlpha": false,
            "genMipmaps": false,
            "packable": true,
            "width": plistWidth,
            "height": plistHeight,
            "platformSettings": {},
            "subMetas": pictureSubMetas
        }
        this.writeFile("Picture", filename + ".meta", spriteMap)
        subMetas.forEach((res: any) => {
            let name = res["sprite"]["content"]["name"]
            let _spriteName = name + ".jpeg"
            if (_subMetas[_spriteName]) {
                _spriteName = name + "_" + count + ".jpeg"
            }
            _subMetas[_spriteName] = {
                "ver": "1.0.4",
                "uuid": res["_uuid"],
                "rawTextureUuid": _uuid,
                "trimType": "auto",
                "trimThreshold": 1,
                "rotated": false,
                "offsetX": res["sprite"]["content"]["offset"][0],
                "offsetY": res["sprite"]["content"]["offset"][1],
                "trimX": res["sprite"]["content"]["rect"][0],
                "trimY": res["sprite"]["content"]["rect"][1],
                "width": res["sprite"]["content"]["rect"][2],
                "height": res["sprite"]["content"]["rect"][3],
                "rawWidth": res["sprite"]["content"]["originalSize"][0],
                "rawHeight": res["sprite"]["content"]["originalSize"][1],
                "borderTop": res["sprite"]["content"]["capInsets"][0],
                "borderBottom": res["sprite"]["content"]["capInsets"][1],
                "borderLeft": res["sprite"]["content"]["capInsets"][2],
                "borderRight": res["sprite"]["content"]["capInsets"][3],
                "spriteType": "normal",
                "subMetas": {}
            }
            _spriteMap = {
                "ver": "1.2.4",
                "uuid": res["altas"],
                "rawTextureUuid": _uuid,
                "size": {
                    "width": plistWidth,
                    "height": plistHeight,
                },
                "type": "Texture Packer",
                "subMetas": _subMetas
            }
            let result = res["sprite"]["content"]
            frames[_spriteName] = {
                "aliases": [],
                "spriteOffset": `{${result["offset"][0]},${result["offset"][1]}}`,
                "spriteSize": `{${result["originalSize"][0]},${result["originalSize"][1]}}`,
                "spriteSourceSize": `{${result["originalSize"][0]},${result["originalSize"][1]}}`,
                "textureRect": `{{${result["rect"][0]},${result["rect"][1]}},{${result["rect"][2]},${result["rect"][3]}}}`,
                "textureRotated": false
            }
            plistJson["frames"] = frames
        })

        this.writeFile("Picture", filename.split(".")[0] + ".json", plistJson)
        this.writeFile("Picture", filename.split(".")[0] + '.plist' + ".meta", _spriteMap)
        let fileName = String.raw`${global.paths.output}/assets/Picture/${filename.split(".")[0]}`
        json2plist.readJson(fileName)
        fs.unlinkSync(fileName + '.json')
    }

    convertToPictureFile(sprite: any, uuid: string, filename: string, pictureWidth: number, pictureHeight: number, filePath?: string) {
        let _subMetas: any = {}
        let name = filename.split('.')[0]

        _subMetas[name] = {
            "ver": "1.0.4",
            "uuid": uuid,
            "rawTextureUuid": decode_uuid(sprite["content"]["texture"]),
            "trimType": "auto",
            "trimThreshold": 1,
            "rotated": false,
            "offsetX": sprite["content"]["offset"][0],
            "offsetY": sprite["content"]["offset"][1],
            "trimX": sprite["content"]["rect"][0],
            "trimY": sprite["content"]["rect"][1],
            "width": sprite["content"]["rect"][2],
            "height": sprite["content"]["rect"][3],
            "rawWidth": sprite["content"]["originalSize"][0],
            "rawHeight": sprite["content"]["originalSize"][1],
            "borderTop": sprite["content"]["capInsets"][0],
            "borderBottom": sprite["content"]["capInsets"][1],
            "borderLeft": sprite["content"]["capInsets"][2],
            "borderRight": sprite["content"]["capInsets"][3],
            "spriteType": "normal",
            "subMetas": {}
        }
        let _spriteMap = {
            "ver": "2.3.4",
            "uuid": decode_uuid(sprite["content"]["texture"]),
            "type": "sprite",
            "wrapMode": "clamp",
            "filterMode": "bilinear",
            "premultiplyAlpha": false,
            "genMipmaps": false,
            "packable": true,
            "width": pictureWidth,
            "height": pictureHeight,
            "platformSettings": {},
            "subMetas": _subMetas
        }
        let writePath = "Picture"
        if (filePath) {
            writePath = filePath
        }
        this.writeFile(writePath, filename + ".meta", _spriteMap)
    }

    convertToFile() {
        let count = 0
        //生成图集
        let temp = new Map()
        this.spriteAtlasMap.forEach((spriteAtla, texture) => {
            if (spriteAtla["__type__"] == "cc.ParticleAsset") {
                if (this.fileMap.has(texture)) {
                    let filename = spriteAtla["_name"]
                    let currPath = this.fileMap.get(texture)
                    let writePath = String.raw`${filename}${path.extname(currPath)}`
                    if (this.cacheWriteList.includes(`${global.paths.output}/assets/Picture/${writePath}`)) {
                        writePath = filename + `_${count++}` + path.extname(currPath)
                    }
                    this.cacheReadList.push(currPath)
                    this.cacheWriteList.push(`${global.paths.output}/assets/Picture/${writePath}`)
                }
            }
            for (let key in spriteAtla['_spriteFrames']) {
                let _uuid = spriteAtla['_spriteFrames'][key]["__uuid__"]
                if (this.spriteFramesMap.has(_uuid)) {
                    let sprite = this.spriteFramesMap.get(_uuid)
                    let atlasUuid = decode_uuid(sprite["content"]["texture"])
                    let data = {
                        "texture": texture,
                        "atlas": spriteAtla["_name"]
                    }
                    temp.set(atlasUuid, data)
                }
            }
        })
        this.pictureMap.forEach((value, key) => {
            let texture = decode_uuid(key)
            if (this.fileMap.has(texture)) {
                let currPath = this.fileMap.get(texture)
                if (value.size > 1) {
                    let subMetas: any[] = []
                    let filename = path.basename(currPath).split('.')[0]
                    let plistWidth = sizeOf(currPath).width
                    let plistHeight = sizeOf(currPath).height
                    value.forEach((res: any, uuid: string) => {
                        let subMeta: any = {}
                        let _uuid = decode_uuid(stringRandom(22))
                        if (temp.has(texture)) {
                            _uuid = temp.get(texture)["texture"]
                            filename = temp.get(texture)["atlas"]
                        }
                        subMeta["sprite"] = res
                        subMeta["altas"] = _uuid
                        subMeta["_uuid"] = uuid
                        subMetas.push(subMeta)
                    })
                    let writePath = String.raw`${filename.split(".")[0]}${path.extname(currPath)}`
                    if (this.cacheWriteList.includes(`${global.paths.output}/assets/Picture/${writePath}`)) {
                        writePath = filename.split('.')[0] + `_${count++}` + path.extname(currPath)
                    }
                    filename = writePath
                    this.cacheReadList.push(currPath)
                    this.cacheWriteList.push(`${global.paths.output}/assets/Picture/${writePath}`)
                    this.convertToSpriteAtlaFile(subMetas, filename, texture, plistWidth, plistHeight)
                }
                if (value.size == 1) {
                    value.forEach((res: any, uuid: string) => {
                        let name = res["content"]["name"]
                        if (name.split('_')[0] != "default") {
                            let writePath = name + path.extname(currPath)
                            if (this.cacheWriteList.includes(`${global.paths.output}/assets/Picture/${writePath}`)) {
                                writePath = name.split('.')[0] + `_${count++}` + path.extname(currPath)
                            }
                            let fileName = writePath
                            let pictureWidth = sizeOf(currPath).width
                            let pictureHeight = sizeOf(currPath).height
                            this.cacheReadList.push(currPath)
                            this.cacheWriteList.push(String.raw`${global.paths.output}/assets/Picture/${fileName}`)
                            this.convertToPictureFile(res, uuid, fileName, pictureWidth, pictureHeight)
                        }
                    })
                }
                this.fileMap.delete(texture)
            }
        })

        this.fileMap.forEach((file, key) => {
            if (path.extname(file) == ".png" || path.extname(file) == ".jpg") {
                let name = key
                let currPath = file
                let writePath = name + path.extname(currPath)
                if (this.cacheWriteList.includes(`${global.paths.output}/assets/Picture/${writePath}`)) {
                    writePath = name.split('.')[0] + `_${count++}` + path.extname(currPath)
                }
                let fileName = writePath
                let pictureWidth = sizeOf(currPath).width
                let pictureHeight = sizeOf(currPath).height
                this.cacheReadList.push(currPath)
                this.cacheWriteList.push(String.raw`${global.paths.output}/assets/Picture/${fileName}`)
                let sprite = {
                    "__type__": "cc.SpriteFrame",
                    "content": {
                        "name": stringRandom(4),
                        "texture": name,
                        "rect": [0, 0, 0, 0],
                        "offset": [0, 0],
                        "originalSize": [0, 0],
                        "capInsets": [0, 0, 0, 0]
                    }
                }
                this.convertToPictureFile(sprite, key, fileName, pictureWidth, pictureHeight)

            }
        })
        this.ttfMap.forEach((value, key) => {
            if (value["__type__"] == "cc.BitmapFont" || value["__type__"] == "cc.LabelAtlas") {
                //console.log(key)
                if (value["_name"]) {
                    let count = 0
                    let _fntConfig = value["_fntConfig"]
                    let res = ""
                    for (let key in _fntConfig["fontDefDictionary"]) {
                        let value = _fntConfig["fontDefDictionary"][key]
                        let str = `char id=${key}     x=${value["rect"]["x"]}   y=${value["rect"]["y"]}   width=${value["rect"]["width"]}    height=${value["rect"]["height"]}     xoffset=${value["xOffset"]}     yoffset=${value["yOffset"]}    xadvance=${value["xAdvance"]}     page=0 chnl=0 letter=""`
                        res = res + str
                        count++
                    }
                    let _s = `info face="${value["_name"]}" size=${value["fontSize"]} bold=1 italic=0 charset="" unicode=0 stretchH=100 smooth=1 aa=1 padding=0,0,0,0 spacing=2,2 common lineHeight=${_fntConfig["commonHeight"]} base=${_fntConfig["fontSize"]} scaleW=512 scaleH=256 pages=1 packed=0 page id=0 file="${_fntConfig["atlasName"]}" chars count=${count}`
                    res = (_s + res)
                    res = JSON.parse(JSON.stringify(res))
                    //console.log(res)
                    try {
                        fs.mkdirSync(String.raw`${global.paths.output}/assets/Fonts`, { recursive: true });
                        fs.appendFileSync(String.raw`${global.paths.output}/assets/Fonts/${value["_name"] + ".fnt"}`, res, {
                            encoding: "utf-8",
                            flag: "w+"
                        });
                    } catch (error) {
                        console.log(error)
                    }
                    let uuid = decode_uuid(value["spriteFrame"]["__uuid__"])
                    if (this.spriteFramesMap.has(uuid)) {
                        let meta = {
                            "ver": "2.1.0",
                            "uuid": key,
                            "textureUuid": decode_uuid(this.spriteFramesMap.get(uuid)["content"]["texture"]),
                            "fontSize": 36,
                            "subMetas": {}
                        }
                        this.writeFile("Fonts", value["_name"] + ".fnt" + ".meta", meta)
                    }

                }
            }
        })
        this.copyFile()
    }

    /**
     * @Description: 生成meta文件
     */
    convertToMetaFile(fileMap: Map<string, string>) {

        for (let [key, value] of fileMap) {
            let _mkdir = ""
            let filename = key
            if (path.extname(filename) === ".fire") {
                _mkdir = "Scene"
            }
            if (path.extname(filename) === ".prefab") {
                _mkdir = "Prefab"
            }
            if (path.extname(filename) === ".ts") {
                _mkdir = "Scripts"
            }
            if (path.extname(filename) === ".anim") {
                _mkdir = "Animation"
            }
            if (path.extname(filename) === ".mp3") {
                _mkdir = "Audio"
                let metaData = {
                    "ver": "2.0.0",
                    "uuid": value,
                    "downloadMode": 0,
                    "subMetas": {}
                }
                this.writeFile(_mkdir, filename + '.meta', metaData)
                continue
            }
            let metaData = {
                "ver": "1.2.7",
                "uuid": value,
                "optimizationPolicy": "AUTO",
                "asyncLoadAssets": false,
                "readonly": false,
                "subMetas": {}
            }
            this.writeFile(_mkdir, filename + '.meta', metaData)
        }
    }

    /**
     * @Description: 写入文件
     * @param {string} _mkdir
     * @param {string} filename
     * @param {object} data
     */
    writeFile(_mkdir: string, filename: string, data: any) {

        try {
            fs.mkdirSync(String.raw`${global.paths.output}/assets/${_mkdir}`, { recursive: true })
            fs.appendFileSync(String.raw`${global.paths.output}/assets/${_mkdir}/${filename}`, JSON.stringify(data), {
                encoding: "utf-8",
                flag: "w+"
            });
        } catch (error) {
            console.log(error)
        }
    }
    /**
     * 提取有效信息（含有 uuid）
     * @param {object} data 元数据
     * @returns {object}
     */
    extractValidInfo(data: any) {
        const info: any = {};
        // 记录有用的属性
        const keys = ['__type__', '_name', 'fileId'];
        for (let i = 0; i < keys.length; i++) {
            if (data[keys[i]]) {
                info[keys[i]] = data[keys[i]];
            }
        }
        // 记录包含 uuid 的属性
        for (const key in data) {
            if (data[key], '__uuid__') {
                info[key] = data[key];
            }
        }
        return info;
    }

}