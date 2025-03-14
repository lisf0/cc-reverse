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


/*
 * @Date: 2021-01-20 15:52:22
 */
var BASE64_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
var BASE64_VALUES = new Array(123); // max char code in base64Keys
for (let i = 0; i < 123; ++i) BASE64_VALUES[i] = 64; // fill with placeholder('=') index
for (let i = 0; i < 64; ++i) BASE64_VALUES[BASE64_KEYS.charCodeAt(i)] = i;

// decoded value indexed by base64 char code
var Base64Values = BASE64_VALUES;

var HexChars = '0123456789abcdef'.split('');

var _t = ['', '', '', ''];
var UuidTemplate = _t.concat(_t, '-', _t, '-', _t, '-', _t, '-', _t, _t, _t);
var Indices = UuidTemplate.map(function (x, i) { return x === '-' ? NaN : i; }).filter(isFinite);

// fcmR3XADNLgJ1ByKhqcC5Z -> fc991dd7-0033-4b80-9d41-c8a86a702e59

export function decode_uuid(base64: string) {
    if (typeof base64 != "string") {
        return "";
    }
    if (base64.length !== 22) {
        return base64;
    }
    UuidTemplate[0] = base64[0];
    UuidTemplate[1] = base64[1];
    for (var i = 2, j = 2; i < 22; i += 2) {
        var lhs = Base64Values[base64.charCodeAt(i)];
        var rhs = Base64Values[base64.charCodeAt(i + 1)];
        UuidTemplate[Indices[j++]] = HexChars[lhs >> 2];
        UuidTemplate[Indices[j++]] = HexChars[((lhs & 3) << 2) | rhs >> 4];
        UuidTemplate[Indices[j++]] = HexChars[rhs & 0xF];
    }
    return UuidTemplate.join('');
}