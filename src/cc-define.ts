
export interface IMeta {
    uuid: string;

    width?: number;
    height?: number;
}

export abstract class CCMeta implements IMeta {
    ver: string = "1.0.0";
    uuid: string;
    importer?: string;
    subMetas: Record<string, any> = {};

    constructor(info: IMeta) {
        this.uuid = info.uuid;
    }

    toObj() {
        return Object.assign({}, this);
    }

    static create<T extends CCMeta>(this: new (info: IMeta) => T, info: IMeta): T {
        return new this(info);
    }
}

export class SceneMeta extends CCMeta {
    ver = "1.3.2";
    importer = "scene";
    asyncLoadAssets = false;
    autoReleaseAssets = false;
}

export class PrefabMeta extends CCMeta {
    ver = "1.3.2";
    importer = "prefab";
    optimizationPolicy = "AUTO";
    asyncLoadAssets = false;
    readonly = false;
}

export class ScriptMeta extends CCMeta {
    ver = "1.1.0";
    isPlugin: boolean = false;
    loadPluginInWeb: boolean = true;
    loadPluginInNative: boolean = true;
    loadPluginInEditor: boolean = false;
}
export class JavaScriptMeta extends ScriptMeta {
    importer = "javascript";
}
export class TypeScriptMeta extends ScriptMeta {
    importer = "typescript";
}

export class AnimationClipMeta extends CCMeta {
    ver = "2.1.2";
    importer = "animation-clip";
}

export class AudioMeta extends CCMeta {
    ver: string = "2.0.3";
    downloadMode: number = 0;
    duration?: number;
}

export class JsonMeta extends CCMeta {
    ver = "1.0.2";
    importer = "json";
}

export class DragonbonesMeta extends CCMeta {
    ver = "1.0.3";
    importer = "dragonbones";
}
export class DragonbonesAtlasMeta extends CCMeta {
    ver = "1.0.3";
    importer = "dragonbones-atlas";
}

/**
 * 纹理图集信息 构建后的结构
 */
export interface ISpriteFrameInfo {
    textureUuid: string;    //非标准cc结构字段 自定义字段
    rotated?: boolean;
    offset: number[];
    rect: number[];
    originalSize: number[];
    capInsets: number[];
}


export class SpriteFrameMate extends CCMeta {
    ver = "1.0.6"
    importer = "sprite-frame";
    rawTextureUuid: string = "";
    trimType = "auto";
    trimThreshold = 1;
    rotated = false;
    offsetX: number = 0;
    offsetY: number = 0;
    trimX: number = 0;
    trimY: number = 0;
    width: number = 0;
    height: number = 0;
    rawWidth: number = 0;
    rawHeight: number = 0;
    borderTop: number = 0;
    borderBottom: number = 0;
    borderLeft: number = 0;
    borderRight: number = 0;
    spriteType = "normal";


    constructor(info: IMeta);
    constructor(info: IMeta & ISpriteFrameInfo) {
        super(info);
        this.rawTextureUuid = info.textureUuid;
        this.rotated = info.rotated ?? false;
        if (info.offset) {
            this.offsetX = info.offset[0];
            this.offsetY = info.offset[1];
        }
        this.trimX = info.rect[0];
        this.trimY = info.rect[1];
        this.width = info.rect[2];
        this.height = info.rect[3];
        this.rawWidth = info.originalSize[0];
        this.rawHeight = info.originalSize[1];
        if (info.capInsets) {
            this.borderTop = info.capInsets[0];
            this.borderBottom = info.capInsets[1];
            this.borderLeft = info.capInsets[2];
            this.borderRight = info.capInsets[3];
        }
    }
}

/**
 * 大小信息 非cc的正式结构
 */
export interface ISizeInfo {
    width: number;
    height: number;
}


export class TextureMeta extends CCMeta {
    ver = "2.3.7";
    importer = "texture";
    type = "sprite";
    wrapMode = "clamp";
    filterMode = "bilinear";
    premultiplyAlpha = false;
    genMipmaps = false;
    packable = true;
    width: number;
    height: number;
    platformSettings: Record<string, any> = {};

    constructor(info: IMeta);
    constructor(info: IMeta & ISizeInfo) {
        super(info);
        this.width = info.width;
        this.height = info.height;
    }

    addSubMetaInfo(key: string, sub: SpriteFrameMate) {
        this.subMetas[key] = sub.toObj();
    }
}