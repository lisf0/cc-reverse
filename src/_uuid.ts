/*
 * @Date: 2021-02-01 10:25:37
 */

//23位uuid
export function compress_uuid(uuid: string) {
    let header = uuid.slice(0, 5)
    let content = uuid.slice(5,).replace(/-/g, "") + "f"
    let ArrStr = new Array();
    for (var i = 0; i < content.length - 1; i++) {
        if (i % 2 == 0) {
            //console.log(content.slice(i, i + 2))
            ArrStr.push(parseInt(content.slice(i, i + 2), 16))
        }
    }
    let base64Content = Buffer.from(ArrStr).toString('base64');
    return header + base64Content.slice(0, base64Content.length - 2)
}
//22位UUID
export function decompress_uuid(uuid: string) {
    let header = uuid.slice(0, 2)
    let content = uuid.slice(2, uuid.length).replace(/-/g, "") + "f"
    let ArrStr = new Array();
    for (var i = 0; i < content.length - 1; i++) {
        if (i % 2 == 0) {
            ArrStr.push(parseInt(content.slice(i, i + 2), 16))
        }
    }
    let base64Content = Buffer.from(Uint8Array.from(ArrStr)).toString('base64');
    return header + base64Content
}
//23 => 22
export function original_uuid(uuid: string) {
    //转换成长的uuid
    let header = uuid.slice(0, 5)
    let end = uuid.slice(5,)
    let temp = end
    if (end.length % 3 == 1) {
        temp += "=="
    } else if (end.length % 3 == 1) {
        temp += "="
    }
    let base64Content = Buffer.from(temp, "base64").toString("hex")
    uuid = header + base64Content
    let result = decompress_uuid(uuid).slice(0, 4) + end
    return result
}