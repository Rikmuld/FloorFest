/********************************
 *
 *  Copyright Rik Mulder 2015
 *  -------------------------
 *  corerm.ts some handy stuff for WebGL and more!
 *
 ********************************/

var gl;

class Shader {
    static PROJECTION_MATRIX: number = 100;
    static VIEW_MATRIX: number = 101;
    static MODEL_MATRIX: number = 102;
    static UV_MATRIX: number = 103;
    static COLOR: number = 104;

    programId: number = 0;

    vertices: number;
    UVCoords: number;

    shadVarData: number[] = Array(0);

    matrix: MatrixHandler;

    constructor(shaderVars: {}, vertex: string, fragment: string);
    constructor(shaderVars: {}, name: string);
    constructor(shaderVars: {}, p2: string, p3?: string) {
        var fragmentShader, vertexShader;
        if (typeof p3 == 'undefined') {
            fragmentShader = this.getShader(p2 + "-fs");
            vertexShader = this.getShader(p2 + "-vs");
        } else {
            fragmentShader = this.createShader(p3, gl.FRAGMENT_SHADER);
            vertexShader = this.createShader(p2, gl.VERTEX_SHADER);
        }

        this.programId = gl.createProgram();
        gl.attachShader(this.programId, vertexShader);
        gl.attachShader(this.programId, fragmentShader);
        gl.linkProgram(this.programId);

        if (!gl.getProgramParameter(this.programId, gl.LINK_STATUS)) {
            alert("Unable to initialize the shader program.");
        }
        this.bind();

        this.vertices = gl.getAttribLocation(this.programId, "vertexPos");
        this.UVCoords = gl.getAttribLocation(this.programId, "vertexUV");

        for (var key in shaderVars) {
            if (shaderVars.hasOwnProperty(key)) {
                this.shadVarData[shaderVars[key]] = gl.getUniformLocation(this.programId, key);
            }
        }

        this.matrix = new MatrixHandler(this);
    }

    bind() {
        gl.useProgram(this.programId);
    }

    setMatrix4(shadVar: number, matrix: number[]) {
        gl.uniformMatrix4fv(this.shadVarData[shadVar], false, matrix);
    }

    setInt(shadVar: number, num: number) {
        gl.uniform1i(this.shadVarData[shadVar], num);
    }

    setFloat(shadVar: number, num: number[]) {
        gl.uniformf(this.shadVarData[shadVar], num);
    }

    setVec2(shadVar: number, vec2: number[]) {
        gl.uniform2f(this.shadVarData[shadVar], vec2[0], vec2[1]);
    }

    setVec3(shadVar: number, vec3: number[]) {
        gl.uniform3f(this.shadVarData[shadVar], vec3[0], vec3[1], vec3[2]);
    }

    setVec4(shadVar: number, vec4: number[]) {
        gl.uniform4f(this.shadVarData[shadVar], vec4[0], vec4[1], vec4[2], vec4[3]);
    }

    createShader(data: string, shaderType) {
        var shader = gl.createShader(shaderType)
        gl.shaderSource(shader, data);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    getShader(id: string) {
        var shaderScript, theSource, currentChild, shader;

        shaderScript = document.getElementById(id);

        if (!shaderScript) {
            return null;
        }

        theSource = "";
        currentChild = shaderScript.firstChild;

        while (currentChild) {
            if (currentChild.nodeType == currentChild.TEXT_NODE) {
                theSource += currentChild.textContent;
            }

            currentChild = currentChild.nextSibling;
        }

        if (shaderScript.type == "x-shader/x-fragment") {
            return this.createShader(theSource, gl.FRAGMENT_SHADER)
        } else if (shaderScript.type == "x-shader/x-vertex") {
            return this.createShader(theSource, gl.VERTEX_SHADER)
        } else {
            return null;
        }
    }
}

class MatrixHandler {
    shader: Shader;
    projMat = Matrix4.identity();
    viewMat = Matrix4.identity();

    constructor(shader: Shader) {
        this.shader = shader;
    }

    setProjectionMatrix(matrix) {
        this.shader.setMatrix4(Shader.PROJECTION_MATRIX, matrix)
        this.projMat = matrix;
    }

    setModelMatrix(matrix) {
        this.shader.setMatrix4(Shader.MODEL_MATRIX, matrix)
    }

    setViewMatrix(matrix) {
        this.shader.setMatrix4(Shader.VIEW_MATRIX, matrix)
        this.viewMat = matrix;
    }

    setUVMatrix(matrix) {
        this.shader.setMatrix4(Shader.UV_MATRIX, matrix)
    }
}

class Render {
    attrpBuffs: WebGLBuffer[] = new Array(0);
    attrpIds: WebGLBuffer[] = new Array(0);

    elementBuff: WebGLBuffer[] = new Array(0);
    count = new Array(0);

    shader: Shader;

    addAttrips(attripBuff: WebGLBuffer, id) {
        this.attrpBuffs.push(attripBuff);
        this.attrpIds.push(id);
    }
    addToEnd(elementBuff: WebGLBuffer, count: number) {
        this.elementBuff.push(elementBuff);
        this.count.push(count);
    }
    addVertexes(shader: Shader, vertices: number[]) {
        var buff = gl.createBuffer();
        var id = shader.vertices;
        this.shader = shader;
        gl.bindBuffer(gl.ARRAY_BUFFER, buff);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(id, 2, gl.FLOAT, false, 0, 0);

        this.addAttrips(buff, id);
    }
    addUVCoords(shader: Shader, coords: number[]) {
        var buff = gl.createBuffer();
        var id = shader.UVCoords;
        gl.bindBuffer(gl.ARRAY_BUFFER, buff);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW);
        gl.vertexAttribPointer(id, 2, gl.FLOAT, false, 0, 0);

        this.addAttrips(buff, id);
    }
    addIndieces(indieces: number[]) {
        var count = indieces.length;
        var elementBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuff);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indieces), gl.STATIC_DRAW);

        this.addToEnd(elementBuff, count);
    }
    switchBuff(id: number) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementBuff[id]);
    }
    draw(typ, count: number) {
        gl.drawArray(typ, 0, count);
    }
    drawElements(id: number, typ) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementBuff[id]);
        gl.drawElements(typ, this.count[id], gl.UNSIGNED_SHORT, 0);
    }
    drawSomeElements(ids: number[], typ) {
        for (var id = 0; id < ids.length; id++) {
            if (ids[id]) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementBuff[id]);
                gl.drawElements(typ, this.count[id], gl.UNSIGNED_SHORT, 0);
            }
        }
    }
    start() {
        for (var i = 0; i < this.attrpIds.length; i++) {
            gl.enableVertexAttribArray(this.attrpIds[i]);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.attrpBuffs[i]);
            gl.vertexAttribPointer(this.attrpIds[i], 2, gl.FLOAT, false, 0, 0);
        }
    }
    end() {
        for (var i = 0; i < this.attrpIds.length; i++) {
            gl.disableVertexAttribArray(this.attrpIds[i]);
        }
    }
    drawElementsWithStartEnd(typ, id: number) {
        for (var i = 0; i < this.attrpIds.length; i++) {
            gl.enableVertexAttribArray(this.attrpIds[i]);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.attrpBuffs[i]);
            gl.vertexAttribPointer(this.attrpIds[i], 2, gl.FLOAT, false, 0, 0);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementBuff[id]);
        gl.drawElements(typ, this.count[id], gl.UNSIGNED_SHORT, 0);

        for (var i = 0; i < this.attrpIds.length; i++) {
            gl.disableVertexAttribArray(this.attrpIds[i]);
        }
    }

    drawWithStartEnd(typ, count: number) {
        for (var i = 0; i < this.attrpIds.length; i++) {
            gl.enableVertexAttribArray(this.attrpIds[i]);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.attrpBuffs[i]);
            gl.vertexAttribPointer(this.attrpIds[i], 2, gl.FLOAT, false, 0, 0);
        }

        gl.drawArrays(typ, 0, count);

        for (var i = 0; i < this.attrpIds.length; i++) {
            gl.disableVertexAttribArray(this.attrpIds[i]);
        }
    }
}

class Framebuffer {
    frameBuffer;
    frameTexture;

    constructor(width: number, height: number) {
        this.frameTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.frameTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);

        this.frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        this.frameBuffer.width = width;
        this.frameBuffer.height = height;

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.frameTexture, 0);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    startRenderTo() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, this.frameBuffer.width, this.frameBuffer.height);
    }

    stopRenderTo() {
        gl.bindTexture(gl.TEXTURE_2D, this.frameTexture);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    }

    bindTexture() {
        gl.bindTexture(gl.TEXTURE_2D, this.frameTexture);
    }
}

class TextureManager {
    textureRawMap = {};
    textureMap = {};

    getTextureRaw(key: string): Texture {
        return this.textureRawMap[key];
    }

    getTexture(key: string): TextureBase {
        return this.textureMap[key];
    }

    loadTextureRaw(src: string, key: string, max: number, repeat: boolean, smooth: boolean) {
        this.textureRawMap[key] = this.initTexture(src, max, repeat, smooth);
    }

    loadTexture(key: string, texName: string, xMin: number, yMin: number, width: number, height: number, safe: boolean) {
        this.textureMap[key] = new TextureBase(this.getTextureRaw(texName), new TexCoord(xMin, yMin, width, height, this.getTextureRaw(texName).max, safe));
    }

    initTexture(src: string, max: number, repeat: boolean, smooth: boolean): Texture {
        var texture = gl.createTexture();
        var img = new Image();
        img.onload = () => {
            this.handleTextureLoaded(img, texture, repeat, smooth);
        };
        img.src = src;
        return new Texture(texture, max);
    }

    handleTextureLoaded(image, texture, repeat: boolean, smooth: boolean) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, smooth ? gl.LINEAR : gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, smooth ? gl.LINEAR_MIPMAP_NEAREST : gl.NEAREST_MIPMAP_NEAREST);
        if (repeat) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}

class TexCoord {
    maxX: number;
    maxY: number;
    minX: number;
    minY: number;

    baseWidth: number;
    baseHeight: number;

    constructor(xMin: number, yMin: number, width: number, height: number, max: number, safe: boolean) {
        this.minX = (xMin + (safe ? 0.5 : 0)) / max;
        this.minY = (yMin + (safe ? 0.5 : 0)) / max;
        this.maxX = xMin / max + ((width - (safe ? 0.5 : 0)) / max);
        this.maxY = yMin / max + ((height - (safe ? 0.5 : 0)) / max);

        this.baseWidth = width;
        this.baseHeight = height;
    }

    getWidthFromHeight(height: number): number {
        return ((this.maxX - this.minX) / (this.maxY - this.minY)) * height;
    }

    getHeightFromWidth(width: number): number {
        return ((this.maxY - this.minY) / (this.maxX - this.minX)) * width;
    }

    getXMax(): number {
        return this.maxX;
    }

    getXMin(): number {
        return this.minX;
    }

    getYMax(): number {
        return this.maxY;
    }

    getYMin(): number {
        return this.minY;
    }
}

class Texture {
    texture;
    max: number;

    constructor(texture, max: number) {
        this.texture = texture;
        this.max = max;
    }

    bind() {
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
    }

    getImgMax(): number {
        return this.max;
    }
}

class TextureBase {
    coord: TexCoord;
    base: Texture;

    constructor(texture: Texture, coord: TexCoord) {
        this.base = texture;
        this.coord = coord;
    }

    bind() {
        this.base.bind();
    }

    getCoord(): TexCoord {
        return this.coord;
    }
}

class AudioManager {
    audioMap = {};

    getAudio(key: string): AudioObj {
        return this.audioMap[key];
    }

    loadAudio(key: string, audioName: string) {
        var container = document.createElement("audio");
        var source = document.createElement("source");
        container.setAttribute('id', key);
        source.setAttribute('type', "audio/ogg");
        source.setAttribute('src', audioName);
        container.appendChild(source);
        document.body.appendChild(container);

        this.audioMap[key] = new AudioObj(container);
    }
}

class AudioObj {
    audio: HTMLAudioElement;

    constructor(audio: HTMLAudioElement) {
        this.audio = audio;
    }

    play() {
        this.audio.play();
    }

    pause() {
        this.audio.pause();
    }

    isRunning():boolean {
        return !this.audio.paused
    }

    time(time?: number):number {
        if (typeof time == 'number') this.audio.currentTime = time;
        return this.audio.currentTime;
    }
}

class Mouse {
    static MOUSE_LEFT = 0
    static MOUSE_RIGHT = 1
    static MOUSE_MIDDLE = 2

    static mouseX: number;
    static mouseY: number;
    static buttons: boolean[] = new Array(10);

    static listenForPosition() {
        document.onmousemove = Mouse.mouseMoved;
    }

    static listenForClick() {
        document.body.onmouseup = Mouse.mouseUp;
        document.body.onmousedown = Mouse.mouseDown;
    }

    static listenForPositionCustom(mouseMoved) {
        document.onmousemove = mouseMoved;
    }

    static mouseMoved(event) {
        Mouse.mouseX = event.clientX;
        Mouse.mouseY = event.clientY;
    }

    static mouseUp(event) {
        Mouse.buttons[event.button] = false;
    }

    static mouseDown(event) {
        Mouse.buttons[event.button] = true;
    }

    static hide() {
        document.body.style.cursor = "none";
    }

    static show() {
        document.body.style.cursor = "auto"
    }

    static getX() {
        return Mouse.mouseX;
    }

    static getY() {
        return Mouse.mouseY;
    }

    static isButtonDown(button: number) {
        return Mouse.buttons[button];
    }
}

class Keyboard {
    static currentlyPressedKeys = new Array(128);

    static KEY_LEFT = 37
    static KEY_UP = 38
    static KEY_RIGHT = 39
    static KEY_DOWN = 40
    static KEY_0 = 48;
    static KEY_1 = 49;
    static KEY_2 = 50;
    static KEY_3 = 51;
    static KEY_4 = 52;
    static KEY_5 = 53;
    static KEY_6 = 54;
    static KEY_7 = 55;
    static KEY_8 = 56;
    static KEY_9 = 57;
    static KEY_A = 65;
    static KEY_B = 66;
    static KEY_C = 67;
    static KEY_D = 68;
    static KEY_E = 69;
    static KEY_F = 70;
    static KEY_G = 71;
    static KEY_H = 72;
    static KEY_I = 73;
    static KEY_J = 74;
    static KEY_K = 75;
    static KEY_L = 76;
    static KEY_M = 77;
    static KEY_N = 78;
    static KEY_O = 79;
    static KEY_P = 80;
    static KEY_Q = 81;
    static KEY_R = 82;
    static KEY_S = 83;
    static KEY_T = 84;
    static KEY_U = 85;
    static KEY_V = 86;
    static KEY_W = 87;
    static KEY_X = 88;
    static KEY_Y = 89;
    static KEY_Z = 90;

    static listenForKeysCustom(keyDown, keyUp) {
        document.onkeydown = keyDown;
        document.onkeyup = keyUp;
    }

    static listenForKeys() {
        document.onkeydown = Keyboard.keyDown;
        document.onkeyup = Keyboard.keyUp;
    }

    static keyDown(event) {
        Keyboard.currentlyPressedKeys[event.keyCode] = true;
    }

    static keyUp(event) {
        Keyboard.currentlyPressedKeys[event.keyCode] = false;
    }

    static isKeyDown(key: number) {
        return Keyboard.currentlyPressedKeys[key];
    }
}

type Vec2 = number[];
type Vec3 = number[];
type Vec4 = number[];
type Mat2 = number[];
type Mat3 = number[];
type Mat4 = number[];

type Vec = number[];
type Mat = number[];

class Matrix {
    static clean(size: number): Mat {
        return Vector.clean(size * size);
    }
    static identity(size: number): Mat {
        var mat = [];
        for (var i = 0; i < size * size; i++) {
            mat[i] = (Math.floor(i / size) - i % size) == 0 ? 1 : 0;
        }

        return mat;
    }
    static copy(mat: Mat): Mat {
        return mat.slice();
    }
    static getRow(mat: Mat, row: number): Vec {
        var size = Matrix.size(mat);
        var vec: Vec = [];

        for (var i = 0; i < size; i++) {
            vec[i] = mat[row + i * size];
        }

        return vec;
    }
    static getColom(mat: Mat, colom: number): Vec {
        var size = Matrix.size(mat);
        var vec: Vec = [];

        for (var i = 0; i < size; i++) {
            vec[i] = mat[colom * size + i];
        }

        return vec;
    }
    static getValue(mat: Mat, row: number, colom: number): number {
        var size = Matrix.size(mat);
        return mat[row + colom * size];
    }
    static setRow(mat: Mat, row: number, value: Vector): Mat {
        var size = Matrix.size(mat);
        for (var i = 0; i < size; i++) {
            mat[row + i * size] = value[i];
        }

        return mat;
    }
    static setColom(mat: Mat, colom: number, value: Vector): Mat {
        var size = Matrix.size(mat);
        for (var i = 0; i < size; i++) {
            mat[colom * size + i] = value[i];
        }

        return mat;
    }
    static setvalue(mat: Mat, row: number, colom: number, value: number): Mat {
        var size = Matrix.size(mat);
        mat[row + colom * size] = value;
        return mat;
    }
    static size(mat: Mat): number {
        return Math.sqrt(mat.length);
    }
    static getTranspose(mat: Mat) {
        var size = Matrix.size(mat);
        var matOut: Mat = Matrix.clean(size);

        for (var i = 0; i < size; i++) {
            Matrix.setColom(matOut, i, Matrix.getRow(mat, i));
        }

        return matOut;
    }
}

class Matrix4 extends Matrix {
    static identity(): number[] {
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }

    static mul(mat1: Mat4, mat2: Mat4) {
        return [
            mat1[0] * mat2[0] + mat1[4] * mat2[1] + mat1[8] * mat2[2] + mat1[12] * mat2[3],
            mat1[1] * mat2[0] + mat1[5] * mat2[1] + mat1[9] * mat2[2] + mat1[13] * mat2[3],
            mat1[2] * mat2[0] + mat1[6] * mat2[1] + mat1[10] * mat2[2] + mat1[14] * mat2[3],
            mat1[3] * mat2[0] + mat1[7] * mat2[1] + mat1[11] * mat2[2] + mat1[15] * mat2[3],

            mat1[0] * mat2[4] + mat1[4] * mat2[5] + mat1[8] * mat2[6] + mat1[12] * mat2[7],
            mat1[1] * mat2[4] + mat1[5] * mat2[5] + mat1[9] * mat2[6] + mat1[13] * mat2[7],
            mat1[2] * mat2[4] + mat1[6] * mat2[5] + mat1[10] * mat2[6] + mat1[14] * mat2[7],
            mat1[3] * mat2[4] + mat1[7] * mat2[5] + mat1[11] * mat2[6] + mat1[15] * mat2[7],

            mat1[0] * mat2[8] + mat1[4] * mat2[9] + mat1[8] * mat2[10] + mat1[12] * mat2[11],
            mat1[1] * mat2[8] + mat1[5] * mat2[9] + mat1[9] * mat2[10] + mat1[13] * mat2[11],
            mat1[2] * mat2[8] + mat1[6] * mat2[9] + mat1[10] * mat2[10] + mat1[14] * mat2[11],
            mat1[3] * mat2[8] + mat1[7] * mat2[9] + mat1[11] * mat2[10] + mat1[15] * mat2[11],

            mat1[0] * mat2[12] + mat1[4] * mat2[13] + mat1[8] * mat2[14] + mat1[12] * mat2[15],
            mat1[1] * mat2[12] + mat1[5] * mat2[13] + mat1[9] * mat2[14] + mat1[13] * mat2[15],
            mat1[2] * mat2[12] + mat1[6] * mat2[13] + mat1[10] * mat2[14] + mat1[14] * mat2[15],
            mat1[3] * mat2[12] + mat1[7] * mat2[13] + mat1[11] * mat2[14] + mat1[15] * mat2[15]
        ];
    }

    static translate(x: number, y: number): Mat4;
    static translate(mat: Mat4, x: number, y: number): Mat4;
    static translate(p1: Mat4|number, p2: number, p3?: number): Mat4 {
        if (typeof p3 == "number") {
            var x: number = p2;
            var y: number = p3;
            var mat: Mat4 = <Mat4>p1;

            var newColom = Vector4.create(
                mat[0] * x + mat[4] * y + mat[12],
                mat[1] * x + mat[5] * y + mat[13],
                mat[2] * x + mat[6] * y + mat[14],
                mat[3] * x + mat[7] * y + mat[15]);

            return Matrix4.setColom(mat, 3, newColom);
        } else {
            var x: number = <number>p1;
            var y: number = p2;

            return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, 0, 1];
        }
    }

    static scale(width: number, height: number): Mat4;
    static scale(mat: Mat4, width: number, height: number): Mat4;
    static scale(p1: Mat4|number, p2: number, p3?: number): Mat4 {
        if (typeof p3 == "number") {
            var width: number = p2;
            var height: number = p3;
            var mat: Mat4 = <Mat4>p1;

            var newColom1 = Vector4.create(
                mat[0] * width,
                mat[1] * width,
                mat[2] * width,
                mat[3] * width);

            var newColom2 = Vector4.create(
                mat[4] * height,
                mat[5] * height,
                mat[6] * height,
                mat[7] * height);

            Matrix4.setColom(mat, 0, newColom1);
            Matrix4.setColom(mat, 1, newColom2);

            return mat;
        } else {
            var width: number = <number>p1;
            var height: number = p2;

            return [width, 0, 0, 0, 0, height, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        }
    }

    static rotate(rad: number): Mat4;
    static rotate(mat: Mat4, rad: number): Mat4;
    static rotate(p1: Mat4|number, p2?: number): Mat4 {
        if (typeof p2 == "number") {
            var rad: number = p2;
            var mat: Mat4 = <Mat4>p1;

            var newColom1 = Vector4.create(
                mat[0] * Math.cos(rad) + mat[4] * Math.sin(rad),
                mat[1] * Math.cos(rad) + mat[5] * Math.sin(rad),
                mat[2] * Math.cos(rad) + mat[6] * Math.sin(rad),
                mat[3] * Math.cos(rad) + mat[7] * Math.sin(rad));

            var newColom2 = Vector4.create(
                mat[0] * -Math.sin(rad) + mat[4] * Math.cos(rad),
                mat[1] * -Math.sin(rad) + mat[5] * Math.cos(rad),
                mat[2] * -Math.sin(rad) + mat[6] * Math.cos(rad),
                mat[3] * -Math.sin(rad) + mat[7] * Math.cos(rad));

            Matrix4.setColom(mat, 0, newColom1);
            Matrix4.setColom(mat, 1, newColom2);

            return mat;
        } else {
            var rad: number = <number>p1;

            return [Math.cos(rad), Math.sin(rad), 0, 0, -Math.sin(rad), Math.cos(rad), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        }
    }

    static ortho(left: number, right: number, bottom: number, top: number): Mat4 {
        return [2 / (right - left), 0, 0, 0, 0, 2 / (top - bottom), 0, 0, 0, 0, -2 / (-1 - 1), 0, -(right + left) / (right - left), -(top + bottom) / (top - bottom), -(-1 + 1) / (-1 - 1), 1]
    }
}

class Matrix3 extends Matrix {
    static identity(): Mat3 {
        return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }

    static mul(mat1: Mat3, mat2: Mat3) {
        return [
            mat1[0] * mat2[0] + mat1[3] * mat2[1] + mat1[6] * mat2[2],
            mat1[1] * mat2[0] + mat1[4] * mat2[1] + mat1[7] * mat2[2],
            mat1[2] * mat2[0] + mat1[5] * mat2[1] + mat1[8] * mat2[2],

            mat1[0] * mat2[3] + mat1[3] * mat2[4] + mat1[6] * mat2[5],
            mat1[1] * mat2[3] + mat1[4] * mat2[4] + mat1[7] * mat2[5],
            mat1[2] * mat2[3] + mat1[5] * mat2[4] + mat1[8] * mat2[5],

            mat1[0] * mat2[6] + mat1[3] * mat2[7] + mat1[6] * mat2[8],
            mat1[1] * mat2[6] + mat1[4] * mat2[7] + mat1[7] * mat2[8],
            mat1[2] * mat2[6] + mat1[5] * mat2[7] + mat1[8] * mat2[8],
        ];
    }
}

class Matrix2 extends Matrix {
    static identity(): Mat2 {
        return [1, 0, 0, 1];
    }

    static mul(mat1: Mat4, mat2: Mat4) {
        return [
            mat1[0] * mat2[0] + mat1[2] * mat2[1],
            mat1[1] * mat2[0] + mat1[3] * mat2[1],

            mat1[0] * mat2[2] + mat1[2] * mat2[3],
            mat1[1] * mat2[2] + mat1[3] * mat2[3],
        ];
    }
}

class Vector {
    static clean(n: number): Vec {
        var vector: Vec = [];
        for (var i = 0; i < n; i++) {
            vector[i] = 0;
        }
        return vector;
    }
    static create(...values: number[]): Vec {
        var vector: Vec = [];
        for (var i = 0; i < values.length; i++) {
            vector[i] = values[i];
        }
        return vector;
    }
    static dot(vec1: Vec, vec2: Vec): number {
        var dot: number = 0;
        for (var i = 0; i < vec1.length; i++) {
            dot += vec1[i] * vec2[i];
        }
        return dot;
    }
    static magnitude(vec: Vec): number {
        return Math.sqrt(Vector.dot(vec, vec));
    }
    static angle(vec1: Vec, vec2: Vec): number {
        return Math.acos(Vector.dot(vec1, vec2) / (Vector.magnitude(vec1) * Vector.magnitude(vec2)));
    }
}

class Vector2 extends Vector {
    static clean(): Vec2 {
        return [0, 0];
    }
    static create(x: number, y: number): Vec2 {
        return [x, y];
    }
    static dot(vec1: Vec2, vec2: Vec2): number {
        return vec1[0] * vec2[0] + vec1[1] * vec2[1];
    }
    static fromPoint(point: Geometry.Point): number[] {
        return [point.x, point.y];
    }
    static fromLine(line: Geometry.Line): number[] {
        return [line.p2.x - line.p1.x, line.p2.y - line.p1.y];
    }
}

class Vector3 extends Vector {
    static clean(): Vec3 {
        return [0, 0, 0];
    }
    static create(x: number, y: number, z: number): Vec3 {
        return [x, y, z];
    }
    static dot(vec1: Vec3, vec2: Vec3): number {
        return vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2];
    }
}

class Vector4 extends Vector {
    static clean(): Vec4 {
        return [0, 0, 0, 0];
    }
    static create(x: number, y: number, z: number, w: number): Vec4 {
        return [x, y, z, w];
    }
    static dot(vec1: Vec4, vec2: Vec4): number {
        return vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2] + vec1[3] * vec2[3];
    }
}

var PRECISION = 5;

module Geometry {
    export interface Rectangle {
        x: number;
        y: number;
        width: number;
        height: number;
    }

    export function eqRec(r1: Rectangle, r2: Rectangle): boolean {
        return r1.x == r2.x && r1.y == r2.y && r1.width == r2.width && r1.height == r2.height;
    }

    export interface Line {
        p1: Point;
        p2: Point;
    }

    export function eqLine(l1: Line, l2: Line): boolean {
        return eqPoint(l1.p1, l2.p1) && eqPoint(l1.p2, l2.p2);
    }

    export interface Point {
        x: number;
        y: number;
    }

    export function eqPoint(p1: Point, p2: Point): boolean {
        return p1.x == p2.x && p1.y == p2.y;
    }

    export function point(x: number, y: number): Point {
        return { x: x, y: y };
    }

    export function line(point_1: Point, point_2: Point): Line;
    export function line(x1: number, y1: number, x2: number, y2: number): Line;
    export function line(p1: number|Point, p2: number|Point, p3?: number, p4?: number): Line {
        if (typeof p1 == 'number') return { p1: { x: <number>p1, y: <number>p2 }, p2: { x: p3, y: p4 } }
        else return { p1: <Point>p1, p2: <Point>p2 };
    }

    export function toPoints(line: Line): Point[];
    export function toPoints(line: Rectangle): Point[];
    export function toPoints(p1: Line|Rectangle): Point[] {
        if (typeof (<Rectangle>p1).x != 'undefined') {
            var rect = <Rectangle> p1;
            return [point(rect.x, rect.y), point(rect.width + rect.x, rect.y), point(rect.x + rect.width, rect.y + rect.height), point(rect.x, rect.y + rect.height)];
        }
        else return [(<Line>p1).p1, (<Line>p1).p2];
    }

    export function toLines(points: Point[]): Line[] {
        var lines = [];

        for (var index = 0; index < points.length; index++) {
            lines[index] = (index == points.length - 1) ? line(points[index], points[0]) : line(points[index], points[index + 1]);
        }

        return lines;
    }

    export function rectangle(x: number, y: number, width: number, height: number): Rectangle {
        return { x: x, y: y, width: width, height: height };
    }

    export function rectangleCollTest(rec1: Rectangle, rec2: Rectangle): boolean {
        return (rec1.x < rec2.x + rec2.width && rec1.x + rec1.width > rec2.x && rec1.y < rec2.y + rec2.height && rec1.height + rec1.y > rec2.y);
    }

    export function lineIntersectAt(l1: Line, l2: Line): Point {
        var delta = (l1.p1.x - l1.p2.x) * (l2.p1.y - l2.p2.y) - (l1.p1.y - l1.p2.y) * (l2.p1.x - l2.p2.x);
        if (delta == 0) return null;

        return {
            x: ((l2.p1.x - l2.p2.x) * (l1.p1.x * l1.p2.y - l1.p1.y * l1.p2.x) - (l1.p1.x - l1.p2.x) * (l2.p1.x * l2.p2.y - l2.p1.y * l2.p2.x)) / delta,
            y: ((l2.p1.y - l2.p2.y) * (l1.p1.x * l1.p2.y - l1.p1.y * l1.p2.x) - (l1.p1.y - l1.p2.y) * (l2.p1.x * l2.p2.y - l2.p1.y * l2.p2.x)) / delta
        };
    }

    export function distanceSq(p1: Point, p2: Point): number {
        return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
    }

    export function distance(p1: Point, p2: Point): number {
        return Math.sqrt(distanceSq(p1, p2));
    }

    export function distenceToLine(p: Point, l: Line): number {
        var length = distanceSq(l.p1, l.p2);
        if (length == 0) return distance(p, l.p1);

        var num = ((p.x - l.p1.x) * (l.p2.x - l.p1.x) + (p.y - l.p1.y) * (l.p2.y - l.p1.y)) / length;
        if (num < 0) return distance(p, l.p1)
        if (num > 1) return distance(p, l.p2)
        return distance(p, point(l.p1.x + num * (l.p2.x - l.p1.x), l.p1.y + num * (l.p2.y - l.p1.y)));
    }
}

module QuickGL {
    var loopFc;
    var canvas;
    var shadColFrag = "precision highp float; uniform vec4 color; void main(void){ gl_FragColor = color; }";
    var shadColVertex = " precision highp float; uniform mat4 modelMatrix; uniform mat4 projectionMatrix; uniform mat4 viewMatrix; attribute vec2 vertexPos; void main(void){ gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(vertexPos, 1, 1); }";
    var shadTexFrag = " precision highp float; varying vec2 UV; uniform sampler2D sampler; void main(void){ gl_FragColor = texture2D(sampler, UV); }";
    var shadTexVertex = " precision highp float; uniform mat4 modelMatrix; uniform mat4 projectionMatrix; uniform mat4 viewMatrix; varying vec2 UV; attribute vec2 vertexPos; attribute vec2 vertexUV; void main(void){ gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(vertexPos, 1, 1); UV = vertexUV; }";

    export var width: number;
    export var height: number;

    export function initGL(setupFunc, loopFunc);
    export function initGL(setupFunc, loopFunc, x: number, y: number, width: number, height: number);
    export function initGL(setupFunc, loopFunc, color: number[]);
    export function initGL(setupFunc, loopFunc, x: number, y: number, width: number, height: number, color: number[]);
    export function initGL(setupFunc, loopFunc, p1?: number|number[], p2?: number, p3?: number, p4?: number, p5?: number[]) {
        var width, height, x, y: number;
        if (typeof p3 == 'number') {
            width = p3;
            height = p4;
            x = p1;
            y = p2;
        } else {
            width = window.innerWidth;
            height = window.innerHeight;
            x = 0;
            y = 0;
        }
        var color = typeof p1 != 'number' && typeof p1 != 'undefined' ? p1 : typeof p5 != 'undefined' ? p5 : [1, 1, 1, 1];

        canvas = document.createElement('canvas');
        canvas.setAttribute("width", "" + width);
        canvas.setAttribute("height", "" + height);
        canvas.setAttribute("style", "position:fixed; top:" + y + "px; left:" + x + "px")
        document.body.appendChild(canvas)

        QuickGL.width = width;
        QuickGL.height = height;

        gl = canvas.getContext("experimental-webgl");
        gl.viewport(0, 0, width, height);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(color[0], color[1], color[2], color[3]);
        gl.clear(gl.COLOR_BUFFER_BIT);

        Keyboard.listenForKeys();
        Mouse.listenForPosition();
        Mouse.listenForClick();

        loopFc = loopFunc;
        setupFunc();
        looper()
    }

    function looper() {
        loopFc()
        requestAnimationFrame(looper);
    }

    export function createShader(typ: ShaderType): Shader {
        var shad: Shader;
        if (typ == ShaderType.COLOR) {
            shad = new Shader({ "projectionMatrix": Shader.PROJECTION_MATRIX, "viewMatrix": Shader.VIEW_MATRIX, "modelMatrix": Shader.MODEL_MATRIX, "color": Shader.COLOR }, shadColVertex, shadColFrag);
        } else {
            shad = new Shader({ "projectionMatrix": Shader.PROJECTION_MATRIX, "viewMatrix": Shader.VIEW_MATRIX, "modelMatrix": Shader.MODEL_MATRIX }, shadTexVertex, shadTexFrag);
        }

        shad.matrix.setModelMatrix(Matrix4.identity());
        shad.matrix.setProjectionMatrix(Matrix4.identity());
        shad.matrix.setViewMatrix(Matrix4.identity());

        return shad;
    }

    //SImPle Renderer
    export class SIPRender {
        static RECTANGLE = 0;
        static LINE = 1;

        shader: Shader;
        matrixHandler: MatrixHandler;
        drawer = new Render();
        startType: StartType;

        constructor(shader: Shader, startType: StartType) {
            this.shader = shader;
            this.matrixHandler = shader.matrix;
            this.startType = startType;

            this.drawer.addVertexes(shader, [0, 0, 1, 0, 1, 1, 0, 1]);

            this.drawer.addIndieces([0, 1, 3, 1, 2, 3]);
            this.drawer.addIndieces([0, 2]);

            this.startType = startType;
            if (this.startType == StartType.ONCE) {
                shader.bind();
                this.drawer.start();
            }
        }
        addTexture(texture: TextureBase);
        addTexture(UVCoords: number[]);
        addTexture(par1: any): any {
            if (typeof par1 == "object") {
                var coord = par1.coord;
                this.drawer.addUVCoords(this.shader, [coord.getXMin(), coord.getYMin(), coord.getXMax(), coord.getYMin(), coord.getXMax(), coord.getYMax(), coord.getXMin(), coord.getYMax()]);
            } else this.drawer.addUVCoords(this.shader, par1)
        }
        setColorV3(color: number[]) {
            color[3] = 1;
            if (this.startType == StartType.AUTO) this.shader.bind();
            this.shader.setVec4(Shader.COLOR, color);
        }
        setColorV4(color: number[]) {
            if (this.startType == StartType.AUTO) this.shader.bind();
            this.shader.setVec4(Shader.COLOR, color);
        }
        setColorRGB(r: number, g: number, b: number) {
            if (this.startType == StartType.AUTO) this.shader.bind();
            this.shader.setVec4(Shader.COLOR, [r / 255, g / 255, b / 255, 1]);
        }
        setColorRBGA(r: number, g: number, b: number, a: number) {
            if (this.startType == StartType.AUTO) this.shader.bind();
            this.shader.setVec4(Shader.COLOR, [r / 255, g / 255, b / 255, a / 255]);
        }
        rect(x: number, y: number, width: number, height: number);
        rect(rect: Geometry.Rectangle);
        rect(p1: any, p2?: any, p3?: any, p4?: any) {
            var x, y, w, h: number;
            if (typeof p1 == 'number') {
                x = p1;
                y = p2;
                w = p3;
                h = p4;
            } else {
                x = (<Geometry.Rectangle>p1).x;
                y = (<Geometry.Rectangle>p1).y;
                w = (<Geometry.Rectangle>p1).width;
                h = (<Geometry.Rectangle>p1).height;
            }
            if (this.startType == StartType.AUTO) this.shader.bind();
            this.matrixHandler.setModelMatrix(Matrix4.scale(Matrix4.translate(x, y), w, h));
            this.render(SIPRender.RECTANGLE);
        }
        line(x1: number, y1: number, x2: number, y2: number);
        line(line: Geometry.Line);
        line(p1: any, p2?: any, p3?: any, p4?: any) {
            var x1, y1, x2, y2: number;
            if (typeof p1 == 'number') {
                x1 = p1;
                y1 = p2;
                x2 = p3;
                y2 = p4;
            } else {
                x1 = (<Geometry.Line>p1).p1.x;
                y1 = (<Geometry.Line>p1).p1.y;
                x2 = (<Geometry.Line>p1).p2.x;
                y2 = (<Geometry.Line>p1).p2.y;
            }
            if (this.startType == StartType.AUTO) this.shader.bind();
            this.matrixHandler.setModelMatrix(Matrix4.scale(Matrix4.translate(x1, y1), x2 - x1, y2 - y1));
            this.render(SIPRender.LINE);
        }
        render(id: number) {
            if (this.startType == StartType.AUTO) {
                if (id == 0) this.drawer.drawElementsWithStartEnd(gl.TRIANGLES, 0);
                if (id == 1) this.drawer.drawElementsWithStartEnd(gl.LINES, 1);
            } else {
                if (id == 0) this.drawer.drawElements(0, gl.TRIANGLES);
                else if (id == 1) this.drawer.drawElements(1, gl.LINES);
            }
        }
    }

    export enum StartType { ONCE, AUTO, MANUAL };
    export enum ShaderType { COLOR, TEXTURE }
}

class Camera {
    position = [0, 0];

    setView(x: number, y: number) {
        this.position = [x, y];
    }

    setX(x: number) {
        this.position[0] = x;
    }

    setZ(y: number) {
        this.position[1] = y;
    }

    getViewMatrix() {
        return Matrix4.translate(-this.position[0], -this.position[1]);
    }
}

module MMath {
    var SEED: number = 0;
    var TO_RAD: number = (Math.PI * 2) / 360;
    var TO_DEG: number = 360 / (Math.PI * 2);

    export function setRandomSeed(seed: number) {
        SEED = seed;
    }

    export function random(): number;
    export function random(min: number, max: number): number;
    export function random(min?: number, max?: number): number {
        var floor:boolean = typeof min != 'undefined';
        if (typeof min == 'undefined') {
            min = 0;
            max = 1;
        }

        SEED = (SEED * 9301 + 49297) % 233280;
        var rnd = SEED / 233280;

        var retVal = min + rnd * (max - min);
        return floor ? Math.floor(retVal) : retVal;
    }

    export function toRad(deg: number): number {
        return deg * TO_DEG;
    }

    export function toDeg(rad: number): number {
        return rad * TO_RAD;
    }
}


module GLF {
    export function clearBufferColor() {
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    export function clearColor(color: Vec4) {
        gl.clearColor(color[0], color[1], color[2], color[3]);
    }
}

//A mess, do not VIEw!
module Shadow {
    export function getShadowFan(light: Geometry.Rectangle, shapes: Geometry.Point[][], overlap: boolean): number[] {
        var points: Geometry.Point[] = [];
        var obstrLines: Geometry.Line[] = [];

        var center = Geometry.point(light.x + light.width / 2, light.y + light.height / 2);

        var lightPoints = Geometry.toPoints(light);
        var lightLines = Geometry.toLines(lightPoints);

        lightPoints.forEach((point: Geometry.Point, index: number, array: Geometry.Point[]) => {
            points.push(point);
        });
        lightLines.forEach((line: Geometry.Line, index: number, array: Geometry.Line[]) => {
            obstrLines.push(line);
        });

        var intersectShapes: Geometry.Line[][] = [];

        for (var index = 0; index < shapes.length; index++) {
            var shape = shapes[index];
            var shapeLines = Geometry.toLines(shape);

            if (shapeLines.filter(function (line: Geometry.Line, index: number, array: Geometry.Line[]): boolean {
                return Geometry.distenceToLine(center, line) < light.width / 2;
            }).length > 0) {
                var obstrPoints: Geometry.Point[] = [];
                intersectShapes.push(shapeLines);

                for (var jdex = 0; jdex < shape.length; jdex++) {
                    var point = shape[jdex]
                    var rad = getRad(center, point)

                    var line1 = Geometry.line(center, point)
                    var line2 = castRay(light, center, rad + 0.0001)
                    var line3 = castRay(light, center, rad - 0.0001)

                    var free = true;
                    var free2 = true;
                    var free3 = true;

                    for (var kdex = 0; kdex < shapeLines.length; kdex++) {
                        var line = shapeLines[kdex];

                        var sect1 = Geometry.linesegmentIntersectAt(line, line1);
                        var sect2 = Geometry.linesegmentIntersectAt(line, line2);
                        var sect3 = Geometry.linesegmentIntersectAt(line, line3);

                        if (sect1 != null) {
                            if (!(line1.p2 == line.p1 || line1.p2 == line.p2)) {
                                free = false;
                                break;
                            }
                        }

                        if (sect2 != null) free2 = false;
                        else if (sect3 != null) free3 = false;
                    }

                    if (free) {
                        points.push(point);
                        obstrPoints.push(point);

                        if (free2) points.push(line2.p2);
                        if (free3) points.push(line3.p2);
                    }
                }

                var obstrLinesAdd = Geometry.toLines(obstrPoints);
                for (var index2 = 0; index2 < obstrLinesAdd.length; index2++) {
                    obstrLines.push(obstrLinesAdd[index2]);
                }
            }
        }

        if (overlap) {
            for (var p = 0; p < intersectShapes.length; p++) {
                for (var j = p + 1; j < intersectShapes.length; j++) {
                    var pps = getShapeIntersects(intersectShapes[p], intersectShapes[j]);
                    for (var l = 0; l < pps.length; l++) {
                        var point = pps[l];
                        points.push(point);
                    }
                }
            }
        }

        var sortPoints: Geometry.Point[] = [];
        if (!overlap) {
            var obstrCompare = function (l1: Geometry.Line, l2: Geometry.Line): number {
                var dist1 = Geometry.distenceToLine(center, l1);
                var dist2 = Geometry.distenceToLine(center, l2);

                if (dist1 < dist2) return -1;
                if (dist1 > dist2) return 1;
                return 0;
            }
            obstrLines.sort(obstrCompare)
        }

        for (var index = 0; index < points.length; index++) {
            var point = points[index];
            var rayLine = Geometry.line(center, point);
            var free = true;

            for (var jdex = 0; jdex < obstrLines.length; jdex++) {
                var line = obstrLines[jdex];

                var intersect = Geometry.linesegmentIntersectAt(line, rayLine);
                if (intersect != null) {
                    if (!(Geometry.eqPoint(rayLine.p2, line.p1) || Geometry.eqPoint(rayLine.p2, line.p2))) {
                        if (!overlap) {
                            free = false;
                            sortPoints.push(intersect);
                            break;
                        } else {
                            if (Vector2.magnitude(Vector2.fromLine(rayLine)) > Geometry.distance(center, intersect)) {
                                point = intersect;
                                rayLine = Geometry.line(center, point);
                            }
                        }
                    }
                }
            }

            if (free) sortPoints.push(point);
        }

        var pointCompare = function (p1: Geometry.Point, p2: Geometry.Point): number {
            var rad1 = getRad(center, p1);
            var rad2 = getRad(center, p2);

            if (rad1 < rad2) return -1;
            if (rad1 > rad2) return 1;
            return 0;
        }

        sortPoints.sort(pointCompare)

        var retArray: number[] = [];
        retArray.push(center.x)
        retArray.push(center.y)

        for (var index = 0; index < sortPoints.length; index++) {
            point = sortPoints[index];
            retArray.push(point.x);
            retArray.push(point.y);
        }

        if (sortPoints.length > 0) {
            var firstpoint = sortPoints[0];
            retArray.push(firstpoint.x);
            retArray.push(firstpoint.y);
        }

        return retArray;
    }

    function castRay(box: Geometry.Rectangle, from: Geometry.Point, rad: number): Geometry.Line {
        rad += Math.PI * 0.25;
        if (rad > 2 * Math.PI) rad -= Math.PI * 2;

        var x, y;

        if (rad < Math.PI * 0.5) {
            x = box.x + box.width;
            y = from.y - box.width / 2 * Math.tan(rad - Math.PI * 0.25)
        }
        else if (rad < Math.PI) {
            y = box.y;
            x = from.x - box.height / 2 * Math.tan(rad - Math.PI * 0.75)
        }
        else if (rad < Math.PI * 1.5) {
            x = box.x;
            y = from.y + box.width / 2 * Math.tan(rad - Math.PI * 1.25)
        }
        else if (rad < Math.PI * 2) {
            y = box.y + box.height;
            x = from.x + box.height / 2 * Math.tan(rad - Math.PI * 1.75)
        }

        return Geometry.line(from, Geometry.point(x, y));
    }

    function getRad(point: Geometry.Point, refPoint: Geometry.Point): number {
        var angle = Vector2.angle(Vector2.fromLine(Geometry.line(point, refPoint)), [1, 0]);
        if (refPoint.y > point.y) angle = (2 * Math.PI) - angle;

        return angle;
    }

    function getShapeIntersects(s1: Geometry.Line[], s2: Geometry.Line[]): Geometry.Point[] {
        var pps: Geometry.Point[] = [];

        for (var i = 0; i < s1.length; i++) {
            for (var j = 0; j < s2.length; j++) {
                var p = Geometry.linesegmentIntersectAt(s1[i], s2[j]);
                if (p != null) {
                    pps.push(p);
                }
            }
        }

        return pps;
    }
}

module Geometry {
    export function linesegmentIntersectAt(l1: Line, l2: Line): Point {
        var point = lineIntersectAt(l1, l2);

        if (point == null) return null;
        if (!(point.x >= Math.min(l1.p1.x, l1.p2.x) - 0.001 && point.x <= Math.max(l1.p1.x, l1.p2.x) + 0.001)) return null;
        if (!(point.x >= Math.min(l2.p1.x, l2.p2.x) - 0.001 && point.x <= Math.max(l2.p1.x, l2.p2.x) + 0.001)) return null;
        if (!(point.y >= Math.min(l1.p1.y, l1.p2.y) - 0.001 && point.y <= Math.max(l1.p1.y, l1.p2.y) + 0.001)) return null;
        if (!(point.y >= Math.min(l2.p1.y, l2.p2.y) - 0.001 && point.y <= Math.max(l2.p1.y, l2.p2.y) + 0.001)) return null;

        return point;
    }
}

class List<Item> {
    protected data: Item[];

    constructor(...items: Item[]) {
        if (typeof items != 'undefined' && items.length > 0) this.data = items;
        else this.data = [];
    }

    isEmpty(): boolean {
        return this.size() == 0;
    }
    size(): number {
        return this.data.length;
    }
    iterator(): Item[] {
        return this.data.slice()
    }
    toArray(): Item[] {
        return this.data;
    }
    join(data: List<Item>) {
        this.data = this.toArray().concat(data.toArray());
    }
    apply(index: number): Item {
        return this.data[index];
    }

    protected exch(index: number, index2: number) {
        var old = this.data[index];
        var old2 = this.data[index2];

        this.data[index] = old2;
        this.data[index2] = old;
    }

    protected static exch<Item>(data: Item[], index: number, index2: number) {
        var old = data[index];
        var old2 = data[index2];

        data[index] = old2;
        data[index2] = old;
    }
}

class MutableList<Item> extends List<Item> {
    insert(item: Item) {
        this.data.push(item);
    }
    insertAll(...items: Item[]) {
        for (var i = 0; i < items.length; i++) this.insert(items[i]);
    }
    insertArray(items: Item[]) {
        for (var i = 0; i < items.length; i++) this.insert(items[i]);
    }
    remove(item: Item): number {
        var index = this.indexOf(item);
        if (index >= 0) this.removeAt(index);
        return index;
    }
    removeAt(index: number): Item {
        return this.data.splice(index, 1)[0];
    }
    indexOf(item: Item): number {
        return this.data.indexOf(item);
    }
    contains(item: Item): boolean {
        return this.indexOf(item) >= 0;
    }
    clear() {
        this.data = [];
    }
}

class Queue<Item> extends List<Item> {
    private low: number = 0;

    size(): number {
        return super.size() - this.low;
    }
    enqueue(item: Item) {
        this.data.push(item);
    }
    dequeue(): Item {
        var sample = this.sample();
        delete this.data[this.low];
        this.low++;

        if (this.data.length >= 16 && this.low >= this.size() * 2) {
            this.toArray();
        }

        return sample;
    }
    sample(): Item {
        return this.apply(this.low);
    }
    toArray(): Item[] {
        this.data = this.data.slice(this.low, this.data.length);
        this.low = 0;
        return this.data;
    }
    iterator(): Item[] {
        return this.data.slice(this.low, this.data.length);;
    }
    clear() {
        this.data = [];
    }
}

class Stack<Item> extends List<Item>{
    push(item: Item) {
        this.data.push(item);
    }
    pop(): Item {
        return this.data.pop();
    }
    sample(): Item {
        return this.data[this.size() - 1];
    }
    clear() {
        this.data = [];
    }
}

class OrderdList<Item> extends List<Item> {
    protected compare: (a: Item, b: Item) => number;

    constructor(compare: (a: Item, b: Item) => number, ...items: Item[]) {
        super();
        if (typeof items != 'undefined') this.data = items;
        this.compare = compare;
    }

    sort(): Item[] {
        return this.iterator().sort(this.compare);
    }

    protected less(index: number, index2: number): boolean {
        return this.compare(this.data[index], this.data[index2]) < 0;
    }
    protected more(index: number, index2: number): boolean {
        return this.compare(this.data[index], this.data[index2]) > 0;
    }
    protected equal(index: number, index2: number): boolean {
        return this.compare(this.data[index], this.data[index2]) == 0;
    }

    protected static less<Item>(data: Item[], compare: (a: Item, b: Item) => number, index: number, index2: number): boolean {
        return compare(data[index], data[index2]) < 0;
    }
    protected static more<Item>(data: Item[], compare: (a: Item, b: Item) => number, index: number, index2: number): boolean {
        return compare(data[index], data[index2]) > 0;
    }
    protected static equal<Item>(data: Item[], compare: (a: Item, b: Item) => number, index: number, index2: number): boolean {
        return compare(data[index], data[index2]) == 0;
    }
}

class Heap<Item> extends OrderdList<Item> {
    constructor(compare: (a: Item, b: Item) => number, max: boolean, ...items: Item[]) {
        if (!max) {
            var oldComp = compare;
            compare = (a: Item, b: Item): number => {
                return oldComp(b, a);
            }
        }

        super(compare);

        if (typeof items != 'undefined') this.data = Heap.heapefy(items.slice(), compare, true);
        else this.data = [];
    }

    insertAll(...items: Item[]) {
        for (var i = 0; i < items.length; i++) this.insert(items[i]);
    }
    insertArray(items: Item[]) {
        for (var i = 0; i < items.length; i++) this.insert(items[i]);
    }
    insert(item: Item) {
        this.data.push(item);
        this.swim(this.size() - 1);
    }
    clear() {
        this.data = [];
    }
    pop(): Item {
        this.exch(0, this.size() - 1);
        var item = this.data.pop();
        this.sink(0);
        return item;
    }
    sample(): Item {
        return this.data[0];
    }
    join(collection: List<Item>) {
        this.insertArray(collection.toArray());
    }
    sort(): Item[] {
        return Heap.sort(this.iterator(), this.compare, true, true);
    }

    static sort<Item>(arr: Item[], compare: (a: Item, b: Item) => number, max: boolean, isHeap?: boolean): Item[] {
        if (!max) {
            var oldComp = compare;
            compare = (a: Item, b: Item): number => {
                return oldComp(b, a);
            }
        }
        if (typeof isHeap == 'undefined' || !isHeap) Heap.heapefy(arr, compare, true);

        var size = arr.length;
        while (size > 0) {
            List.exch(arr, 0, size - 1);
            Heap.sink(arr, compare, 0, --size);
        }

        return arr;
    }
    static heapefy<Item>(arr: Item[], compare: (a: Item, b: Item) => number, max: boolean): Item[] {
        if (!max) {
            var oldComp = compare;
            compare = (a: Item, b: Item): number => {
                return oldComp(b, a);
            }
        }

        var size = arr.length;
        for (var i = Math.ceil(size / 2); i >= 0; i--) {
            Heap.sink(arr, compare, i, size);
        }

        return arr;
    }

    private swim(index: number) {
        var parent = Math.floor((index - 1) / 2);

        while (index > 0 && this.less(parent, index)) {
            this.exch(index, parent)
            index = parent;
            parent = Math.floor((index - 1) / 2);
        }
    }
    private sink(index: number) {
        var child = index * 2 + 1;

        while (child < this.size()) {
            if (child < this.size() - 1 && this.less(child, child + 1)) child++;
            if (this.less(index, child)) {
                this.exch(index, child);
                index = child;
                child = index * 2 + 1;
            } else break;
        }
    }
    private static sink<Item>(arr: Item[], compare: (a: Item, b: Item) => number, index: number, size: number) {
        var child = index * 2 + 1;

        while (child < size) {
            if (child < size - 1 && OrderdList.less(arr, compare, child, child + 1)) child++;
            if (OrderdList.less(arr, compare, index, child)) {
                List.exch(arr, index, child);
                index = child;
                child = index * 2 + 1;
            } else break;
        }
    }
}