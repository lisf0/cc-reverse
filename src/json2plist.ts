/*
 * @Date: 2021-02-07 10:31:47
 */
import * as fs from "fs";
import path from 'path';
import { XMLWriter } from 'xml-writer';

export default new class {


    readJson(fileName: string) {
        fs.readFile(fileName + '.json', 'utf-8', (err: any, data: string) => {
            if (err) {
                console.log(err)
            } else {
                var json = JSON.parse(data)
                json = this.addProperties(json, fileName)
                var xml = new XMLWriter()
                xml.startDocument()
                xml.writeDocType('plist', "-//Apple Computer//DTD PLIST 1.0//EN", "http://www.apple.com/DTDs/PropertyList-1.0.dtd");

                xml.startElement('plist')
                xml.writeAttribute('version', "1.0")
                xml.startElement('dict')
                this.parsetoXML(xml, json)

                xml.endElement()
                xml.endElement()
                xml.endDocument()
                //console.log(xml)
                //console.log(xml.toString())
                fs.writeFileSync(fileName + '.plist', xml.toString())
            }
        })
    }

    parsetoXML(xml: XMLWriter, json: any) {
        for (var key in json) {
            var value = json[key]
            if (typeof value == "object") {
                xml.startElement('key')
                xml.text(key)
                xml.endElement()
                if (key == 'frame' || key == 'offset' || key == 'sourceColorRect' || key == 'sourceSize' || key == 'spriteSourceSize') {
                    this.parsetoJson(xml, value)
                } else {
                    xml.startElement('dict')
                    this.parsetoXML(xml, value)
                    xml.endElement()
                }
            } else {
                this.toXML(xml, key, value)
            }
        }
    }

    toXML(xml: XMLWriter, key: string, value: any) {
        xml.startElement('key')
        xml.text(key)
        xml.endElement()
        if (typeof value == 'boolean') {
            xml.startElement(value.toString())
        } else if (typeof value == "number") {
            xml.startElement('integer')
            xml.text(value.toString())
        } else {
            xml.startElement('string')
            xml.text(value.toString())
        }
        xml.endElement()
    }

    parsetoJson(xml: XMLWriter, value: any) {
        xml.startElement('string')
        var json = '{' + value.w + ',' + value.h + '}'
        if (value.x != undefined && value.w != undefined) {
            json = '{{' + value.x + ',' + value.y + '},{' + value.w + ',' + value.h + '}}'
        }
        xml.text(json)
        xml.endElement()
    }

    addProperties(json: any, fileName: string) {

        /*for (var key in json.frames) {
            json.frames[key + ".png"] = json.frames[key]
            delete json.frames[key]
        }*/
        var metadata = {
            format: 3,
            pixelFormat: "RGBA8888",
            premultiplyAlpha: false,
            realTextureFileName: path.basename(fileName) + '.png',
            size: this.sizeof(fileName),
            smartupdate: '$TexturePacker:SmartUpdate:' + this.uuid().replace(/-/g, "") + ":" + this.uuid().replace(/-/g, "") + ":" + this.uuid().replace(/-/g, "") + '$',
            textureFileName: path.basename(fileName) + '.png'
        }
        json['metadata'] = metadata
        delete json['meta']

        return json
    }

    uuid() {
        var uuid = require('uuid')
        return uuid.v1()
    }

    sizeof(fileName: string) {
        var imageinfo = require('imageinfo');
        var filedata = fs.readFileSync(fileName + '.png')
        var info = imageinfo(filedata)
        return '{' + info.width + ',' + info.height + '}'
    }

}

