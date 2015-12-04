/********************************
 *
 *  Copyright Rik Mulder 2015
 *  -------------------------
 *  corerm.ts some handy stuff for WebGL and more!
 *
 ********************************/
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var gl;
var Shader = (function () {
    function Shader(shaderVars, p2, p3) {
        this.programId = 0;
        this.shadVarData = Array(0);
        var fragmentShader, vertexShader;
        if (typeof p3 == 'undefined') {
            fragmentShader = this.getShader(p2 + "-fs");
            vertexShader = this.getShader(p2 + "-vs");
        }
        else {
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
    Shader.prototype.bind = function () {
        gl.useProgram(this.programId);
    };
    Shader.prototype.setMatrix4 = function (shadVar, matrix) {
        gl.uniformMatrix4fv(this.shadVarData[shadVar], false, matrix);
    };
    Shader.prototype.setInt = function (shadVar, num) {
        gl.uniform1i(this.shadVarData[shadVar], num);
    };
    Shader.prototype.setFloat = function (shadVar, num) {
        gl.uniformf(this.shadVarData[shadVar], num);
    };
    Shader.prototype.setVec2 = function (shadVar, vec2) {
        gl.uniform2f(this.shadVarData[shadVar], vec2[0], vec2[1]);
    };
    Shader.prototype.setVec3 = function (shadVar, vec3) {
        gl.uniform3f(this.shadVarData[shadVar], vec3[0], vec3[1], vec3[2]);
    };
    Shader.prototype.setVec4 = function (shadVar, vec4) {
        gl.uniform4f(this.shadVarData[shadVar], vec4[0], vec4[1], vec4[2], vec4[3]);
    };
    Shader.prototype.createShader = function (data, shaderType) {
        var shader = gl.createShader(shaderType);
        gl.shaderSource(shader, data);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    };
    Shader.prototype.getShader = function (id) {
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
            return this.createShader(theSource, gl.FRAGMENT_SHADER);
        }
        else if (shaderScript.type == "x-shader/x-vertex") {
            return this.createShader(theSource, gl.VERTEX_SHADER);
        }
        else {
            return null;
        }
    };
    Shader.PROJECTION_MATRIX = 100;
    Shader.VIEW_MATRIX = 101;
    Shader.MODEL_MATRIX = 102;
    Shader.UV_MATRIX = 103;
    Shader.COLOR = 104;
    return Shader;
})();
var MatrixHandler = (function () {
    function MatrixHandler(shader) {
        this.projMat = Matrix4.identity();
        this.viewMat = Matrix4.identity();
        this.shader = shader;
    }
    MatrixHandler.prototype.setProjectionMatrix = function (matrix) {
        this.shader.setMatrix4(Shader.PROJECTION_MATRIX, matrix);
        this.projMat = matrix;
    };
    MatrixHandler.prototype.setModelMatrix = function (matrix) {
        this.shader.setMatrix4(Shader.MODEL_MATRIX, matrix);
    };
    MatrixHandler.prototype.setViewMatrix = function (matrix) {
        this.shader.setMatrix4(Shader.VIEW_MATRIX, matrix);
        this.viewMat = matrix;
    };
    MatrixHandler.prototype.setUVMatrix = function (matrix) {
        this.shader.setMatrix4(Shader.UV_MATRIX, matrix);
    };
    return MatrixHandler;
})();
var Render = (function () {
    function Render() {
        this.attrpBuffs = new Array(0);
        this.attrpIds = new Array(0);
        this.elementBuff = new Array(0);
        this.count = new Array(0);
    }
    Render.prototype.addAttrips = function (attripBuff, id) {
        this.attrpBuffs.push(attripBuff);
        this.attrpIds.push(id);
    };
    Render.prototype.addToEnd = function (elementBuff, count) {
        this.elementBuff.push(elementBuff);
        this.count.push(count);
    };
    Render.prototype.addVertexes = function (shader, vertices) {
        var buff = gl.createBuffer();
        var id = shader.vertices;
        this.shader = shader;
        gl.bindBuffer(gl.ARRAY_BUFFER, buff);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(id, 2, gl.FLOAT, false, 0, 0);
        this.addAttrips(buff, id);
    };
    Render.prototype.addUVCoords = function (shader, coords) {
        var buff = gl.createBuffer();
        var id = shader.UVCoords;
        gl.bindBuffer(gl.ARRAY_BUFFER, buff);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW);
        gl.vertexAttribPointer(id, 2, gl.FLOAT, false, 0, 0);
        this.addAttrips(buff, id);
    };
    Render.prototype.addIndieces = function (indieces) {
        var count = indieces.length;
        var elementBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuff);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indieces), gl.STATIC_DRAW);
        this.addToEnd(elementBuff, count);
    };
    Render.prototype.switchBuff = function (id) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementBuff[id]);
    };
    Render.prototype.draw = function (typ, count) {
        gl.drawArray(typ, 0, count);
    };
    Render.prototype.drawElements = function (id, typ) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementBuff[id]);
        gl.drawElements(typ, this.count[id], gl.UNSIGNED_SHORT, 0);
    };
    Render.prototype.drawSomeElements = function (ids, typ) {
        for (var id = 0; id < ids.length; id++) {
            if (ids[id]) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementBuff[id]);
                gl.drawElements(typ, this.count[id], gl.UNSIGNED_SHORT, 0);
            }
        }
    };
    Render.prototype.start = function () {
        for (var i = 0; i < this.attrpIds.length; i++) {
            gl.enableVertexAttribArray(this.attrpIds[i]);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.attrpBuffs[i]);
            gl.vertexAttribPointer(this.attrpIds[i], 2, gl.FLOAT, false, 0, 0);
        }
    };
    Render.prototype.end = function () {
        for (var i = 0; i < this.attrpIds.length; i++) {
            gl.disableVertexAttribArray(this.attrpIds[i]);
        }
    };
    Render.prototype.drawElementsWithStartEnd = function (typ, id) {
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
    };
    Render.prototype.drawWithStartEnd = function (typ, count) {
        for (var i = 0; i < this.attrpIds.length; i++) {
            gl.enableVertexAttribArray(this.attrpIds[i]);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.attrpBuffs[i]);
            gl.vertexAttribPointer(this.attrpIds[i], 2, gl.FLOAT, false, 0, 0);
        }
        gl.drawArrays(typ, 0, count);
        for (var i = 0; i < this.attrpIds.length; i++) {
            gl.disableVertexAttribArray(this.attrpIds[i]);
        }
    };
    return Render;
})();
var Framebuffer = (function () {
    function Framebuffer(width, height) {
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
    Framebuffer.prototype.startRenderTo = function () {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, this.frameBuffer.width, this.frameBuffer.height);
    };
    Framebuffer.prototype.stopRenderTo = function () {
        gl.bindTexture(gl.TEXTURE_2D, this.frameTexture);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    };
    Framebuffer.prototype.bindTexture = function () {
        gl.bindTexture(gl.TEXTURE_2D, this.frameTexture);
    };
    return Framebuffer;
})();
var TextureManager = (function () {
    function TextureManager() {
        this.textureRawMap = {};
        this.textureMap = {};
    }
    TextureManager.prototype.getTextureRaw = function (key) {
        return this.textureRawMap[key];
    };
    TextureManager.prototype.getTexture = function (key) {
        return this.textureMap[key];
    };
    TextureManager.prototype.loadTextureRaw = function (src, key, max, repeat, smooth) {
        this.textureRawMap[key] = this.initTexture(src, max, repeat, smooth);
    };
    TextureManager.prototype.loadTexture = function (key, texName, xMin, yMin, width, height, safe) {
        this.textureMap[key] = new TextureBase(this.getTextureRaw(texName), new TexCoord(xMin, yMin, width, height, this.getTextureRaw(texName).max, safe));
    };
    TextureManager.prototype.initTexture = function (src, max, repeat, smooth) {
        var _this = this;
        var texture = gl.createTexture();
        var img = new Image();
        img.onload = function () {
            _this.handleTextureLoaded(img, texture, repeat, smooth);
        };
        img.src = src;
        return new Texture(texture, max);
    };
    TextureManager.prototype.handleTextureLoaded = function (image, texture, repeat, smooth) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, smooth ? gl.LINEAR : gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, smooth ? gl.LINEAR_MIPMAP_NEAREST : gl.NEAREST_MIPMAP_NEAREST);
        if (repeat)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
    return TextureManager;
})();
var TexCoord = (function () {
    function TexCoord(xMin, yMin, width, height, max, safe) {
        this.minX = (xMin + (safe ? 0.5 : 0)) / max;
        this.minY = (yMin + (safe ? 0.5 : 0)) / max;
        this.maxX = xMin / max + ((width - (safe ? 0.5 : 0)) / max);
        this.maxY = yMin / max + ((height - (safe ? 0.5 : 0)) / max);
        this.baseWidth = width;
        this.baseHeight = height;
    }
    TexCoord.prototype.getWidthFromHeight = function (height) {
        return ((this.maxX - this.minX) / (this.maxY - this.minY)) * height;
    };
    TexCoord.prototype.getHeightFromWidth = function (width) {
        return ((this.maxY - this.minY) / (this.maxX - this.minX)) * width;
    };
    TexCoord.prototype.getXMax = function () {
        return this.maxX;
    };
    TexCoord.prototype.getXMin = function () {
        return this.minX;
    };
    TexCoord.prototype.getYMax = function () {
        return this.maxY;
    };
    TexCoord.prototype.getYMin = function () {
        return this.minY;
    };
    return TexCoord;
})();
var Texture = (function () {
    function Texture(texture, max) {
        this.texture = texture;
        this.max = max;
    }
    Texture.prototype.bind = function () {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
    };
    Texture.prototype.getImgMax = function () {
        return this.max;
    };
    return Texture;
})();
var TextureBase = (function () {
    function TextureBase(texture, coord) {
        this.base = texture;
        this.coord = coord;
    }
    TextureBase.prototype.bind = function () {
        this.base.bind();
    };
    TextureBase.prototype.getCoord = function () {
        return this.coord;
    };
    return TextureBase;
})();
var AudioManager = (function () {
    function AudioManager() {
        this.audioMap = {};
    }
    AudioManager.prototype.getAudio = function (key) {
        return this.audioMap[key];
    };
    AudioManager.prototype.loadAudio = function (key, audioName) {
        var container = document.createElement("audio");
        var source = document.createElement("source");
        container.setAttribute('id', key);
        source.setAttribute('type', "audio/mp3");
        source.setAttribute('src', audioName);
        container.appendChild(source);
        document.body.appendChild(container);
        this.audioMap[key] = new AudioObj(container);
    };
    return AudioManager;
})();
var AudioObj = (function () {
    function AudioObj(audio) {
        this.audio = audio;
    }
    AudioObj.prototype.play = function () {
        this.audio.play();
    };
    AudioObj.prototype.pause = function () {
        this.audio.pause();
    };
    AudioObj.prototype.isRunning = function () {
        return !this.audio.paused;
    };
    AudioObj.prototype.time = function (time) {
        if (typeof time == 'number')
            this.audio.currentTime = time;
        return this.audio.currentTime;
    };
    return AudioObj;
})();
var Mouse = (function () {
    function Mouse() {
    }
    Mouse.listenForPosition = function () {
        document.onmousemove = Mouse.mouseMoved;
    };
    Mouse.listenForClick = function () {
        document.body.onmouseup = Mouse.mouseUp;
        document.body.onmousedown = Mouse.mouseDown;
    };
    Mouse.listenForPositionCustom = function (mouseMoved) {
        document.onmousemove = mouseMoved;
    };
    Mouse.mouseMoved = function (event) {
        Mouse.mouseX = event.clientX;
        Mouse.mouseY = event.clientY;
    };
    Mouse.mouseUp = function (event) {
        Mouse.buttons[event.button] = false;
    };
    Mouse.mouseDown = function (event) {
        Mouse.buttons[event.button] = true;
    };
    Mouse.hide = function () {
        document.body.style.cursor = "none";
    };
    Mouse.show = function () {
        document.body.style.cursor = "auto";
    };
    Mouse.getX = function () {
        return Mouse.mouseX;
    };
    Mouse.getY = function () {
        return Mouse.mouseY;
    };
    Mouse.isButtonDown = function (button) {
        return Mouse.buttons[button];
    };
    Mouse.MOUSE_LEFT = 0;
    Mouse.MOUSE_RIGHT = 1;
    Mouse.MOUSE_MIDDLE = 2;
    Mouse.buttons = new Array(10);
    return Mouse;
})();
var Keyboard = (function () {
    function Keyboard() {
    }
    Keyboard.listenForKeysCustom = function (keyDown, keyUp) {
        document.onkeydown = keyDown;
        document.onkeyup = keyUp;
    };
    Keyboard.listenForKeys = function () {
        document.onkeydown = Keyboard.keyDown;
        document.onkeyup = Keyboard.keyUp;
    };
    Keyboard.keyDown = function (event) {
        Keyboard.currentlyPressedKeys[event.keyCode] = true;
    };
    Keyboard.keyUp = function (event) {
        Keyboard.currentlyPressedKeys[event.keyCode] = false;
    };
    Keyboard.isKeyDown = function (key) {
        return Keyboard.currentlyPressedKeys[key];
    };
    Keyboard.currentlyPressedKeys = new Array(128);
    Keyboard.KEY_LEFT = 37;
    Keyboard.KEY_UP = 38;
    Keyboard.KEY_RIGHT = 39;
    Keyboard.KEY_DOWN = 40;
    Keyboard.KEY_0 = 48;
    Keyboard.KEY_1 = 49;
    Keyboard.KEY_2 = 50;
    Keyboard.KEY_3 = 51;
    Keyboard.KEY_4 = 52;
    Keyboard.KEY_5 = 53;
    Keyboard.KEY_6 = 54;
    Keyboard.KEY_7 = 55;
    Keyboard.KEY_8 = 56;
    Keyboard.KEY_9 = 57;
    Keyboard.KEY_A = 65;
    Keyboard.KEY_B = 66;
    Keyboard.KEY_C = 67;
    Keyboard.KEY_D = 68;
    Keyboard.KEY_E = 69;
    Keyboard.KEY_F = 70;
    Keyboard.KEY_G = 71;
    Keyboard.KEY_H = 72;
    Keyboard.KEY_I = 73;
    Keyboard.KEY_J = 74;
    Keyboard.KEY_K = 75;
    Keyboard.KEY_L = 76;
    Keyboard.KEY_M = 77;
    Keyboard.KEY_N = 78;
    Keyboard.KEY_O = 79;
    Keyboard.KEY_P = 80;
    Keyboard.KEY_Q = 81;
    Keyboard.KEY_R = 82;
    Keyboard.KEY_S = 83;
    Keyboard.KEY_T = 84;
    Keyboard.KEY_U = 85;
    Keyboard.KEY_V = 86;
    Keyboard.KEY_W = 87;
    Keyboard.KEY_X = 88;
    Keyboard.KEY_Y = 89;
    Keyboard.KEY_Z = 90;
    Keyboard.KEY_RETURN = 13;
    Keyboard.KEY_SPACE = 32;
    return Keyboard;
})();
var Matrix = (function () {
    function Matrix() {
    }
    Matrix.clean = function (size) {
        return Vector.clean(size * size);
    };
    Matrix.identity = function (size) {
        var mat = [];
        for (var i = 0; i < size * size; i++) {
            mat[i] = (Math.floor(i / size) - i % size) == 0 ? 1 : 0;
        }
        return mat;
    };
    Matrix.copy = function (mat) {
        return mat.slice();
    };
    Matrix.getRow = function (mat, row) {
        var size = Matrix.size(mat);
        var vec = [];
        for (var i = 0; i < size; i++) {
            vec[i] = mat[row + i * size];
        }
        return vec;
    };
    Matrix.getColom = function (mat, colom) {
        var size = Matrix.size(mat);
        var vec = [];
        for (var i = 0; i < size; i++) {
            vec[i] = mat[colom * size + i];
        }
        return vec;
    };
    Matrix.getValue = function (mat, row, colom) {
        var size = Matrix.size(mat);
        return mat[row + colom * size];
    };
    Matrix.setRow = function (mat, row, value) {
        var size = Matrix.size(mat);
        for (var i = 0; i < size; i++) {
            mat[row + i * size] = value[i];
        }
        return mat;
    };
    Matrix.setColom = function (mat, colom, value) {
        var size = Matrix.size(mat);
        for (var i = 0; i < size; i++) {
            mat[colom * size + i] = value[i];
        }
        return mat;
    };
    Matrix.setvalue = function (mat, row, colom, value) {
        var size = Matrix.size(mat);
        mat[row + colom * size] = value;
        return mat;
    };
    Matrix.size = function (mat) {
        return Math.sqrt(mat.length);
    };
    Matrix.getTranspose = function (mat) {
        var size = Matrix.size(mat);
        var matOut = Matrix.clean(size);
        for (var i = 0; i < size; i++) {
            Matrix.setColom(matOut, i, Matrix.getRow(mat, i));
        }
        return matOut;
    };
    return Matrix;
})();
var Matrix4 = (function (_super) {
    __extends(Matrix4, _super);
    function Matrix4() {
        _super.apply(this, arguments);
    }
    Matrix4.identity = function () {
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    };
    Matrix4.mul = function (mat1, mat2) {
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
    };
    Matrix4.translate = function (p1, p2, p3) {
        if (typeof p3 == "number") {
            var x = p2;
            var y = p3;
            var mat = p1;
            var newColom = Vector4.create(mat[0] * x + mat[4] * y + mat[12], mat[1] * x + mat[5] * y + mat[13], mat[2] * x + mat[6] * y + mat[14], mat[3] * x + mat[7] * y + mat[15]);
            return Matrix4.setColom(mat, 3, newColom);
        }
        else {
            var x = p1;
            var y = p2;
            return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, 0, 1];
        }
    };
    Matrix4.scale = function (p1, p2, p3) {
        if (typeof p3 == "number") {
            var width = p2;
            var height = p3;
            var mat = p1;
            var newColom1 = Vector4.create(mat[0] * width, mat[1] * width, mat[2] * width, mat[3] * width);
            var newColom2 = Vector4.create(mat[4] * height, mat[5] * height, mat[6] * height, mat[7] * height);
            Matrix4.setColom(mat, 0, newColom1);
            Matrix4.setColom(mat, 1, newColom2);
            return mat;
        }
        else {
            var width = p1;
            var height = p2;
            return [width, 0, 0, 0, 0, height, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        }
    };
    Matrix4.rotate = function (p1, p2) {
        if (typeof p2 == "number") {
            var rad = p2;
            var mat = p1;
            var newColom1 = Vector4.create(mat[0] * Math.cos(rad) + mat[4] * Math.sin(rad), mat[1] * Math.cos(rad) + mat[5] * Math.sin(rad), mat[2] * Math.cos(rad) + mat[6] * Math.sin(rad), mat[3] * Math.cos(rad) + mat[7] * Math.sin(rad));
            var newColom2 = Vector4.create(mat[0] * -Math.sin(rad) + mat[4] * Math.cos(rad), mat[1] * -Math.sin(rad) + mat[5] * Math.cos(rad), mat[2] * -Math.sin(rad) + mat[6] * Math.cos(rad), mat[3] * -Math.sin(rad) + mat[7] * Math.cos(rad));
            Matrix4.setColom(mat, 0, newColom1);
            Matrix4.setColom(mat, 1, newColom2);
            return mat;
        }
        else {
            var rad = p1;
            return [Math.cos(rad), Math.sin(rad), 0, 0, -Math.sin(rad), Math.cos(rad), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        }
    };
    Matrix4.ortho = function (left, right, bottom, top) {
        return [2 / (right - left), 0, 0, 0, 0, 2 / (top - bottom), 0, 0, 0, 0, -2 / (-1 - 1), 0, -(right + left) / (right - left), -(top + bottom) / (top - bottom), -(-1 + 1) / (-1 - 1), 1];
    };
    return Matrix4;
})(Matrix);
var Matrix3 = (function (_super) {
    __extends(Matrix3, _super);
    function Matrix3() {
        _super.apply(this, arguments);
    }
    Matrix3.identity = function () {
        return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    };
    Matrix3.mul = function (mat1, mat2) {
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
    };
    return Matrix3;
})(Matrix);
var Matrix2 = (function (_super) {
    __extends(Matrix2, _super);
    function Matrix2() {
        _super.apply(this, arguments);
    }
    Matrix2.identity = function () {
        return [1, 0, 0, 1];
    };
    Matrix2.mul = function (mat1, mat2) {
        return [
            mat1[0] * mat2[0] + mat1[2] * mat2[1],
            mat1[1] * mat2[0] + mat1[3] * mat2[1],
            mat1[0] * mat2[2] + mat1[2] * mat2[3],
            mat1[1] * mat2[2] + mat1[3] * mat2[3],
        ];
    };
    return Matrix2;
})(Matrix);
var Vector = (function () {
    function Vector() {
    }
    Vector.clean = function (n) {
        var vector = [];
        for (var i = 0; i < n; i++) {
            vector[i] = 0;
        }
        return vector;
    };
    Vector.create = function () {
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i - 0] = arguments[_i];
        }
        var vector = [];
        for (var i = 0; i < values.length; i++) {
            vector[i] = values[i];
        }
        return vector;
    };
    Vector.dot = function (vec1, vec2) {
        var dot = 0;
        for (var i = 0; i < vec1.length; i++) {
            dot += vec1[i] * vec2[i];
        }
        return dot;
    };
    Vector.magnitude = function (vec) {
        return Math.sqrt(Vector.dot(vec, vec));
    };
    Vector.angle = function (vec1, vec2) {
        return Math.acos(Vector.dot(vec1, vec2) / (Vector.magnitude(vec1) * Vector.magnitude(vec2)));
    };
    return Vector;
})();
var Vector2 = (function (_super) {
    __extends(Vector2, _super);
    function Vector2() {
        _super.apply(this, arguments);
    }
    Vector2.clean = function () {
        return [0, 0];
    };
    Vector2.create = function (x, y) {
        return [x, y];
    };
    Vector2.dot = function (vec1, vec2) {
        return vec1[0] * vec2[0] + vec1[1] * vec2[1];
    };
    Vector2.fromPoint = function (point) {
        return [point.x, point.y];
    };
    Vector2.fromLine = function (line) {
        return [line.p2.x - line.p1.x, line.p2.y - line.p1.y];
    };
    return Vector2;
})(Vector);
var Vector3 = (function (_super) {
    __extends(Vector3, _super);
    function Vector3() {
        _super.apply(this, arguments);
    }
    Vector3.clean = function () {
        return [0, 0, 0];
    };
    Vector3.create = function (x, y, z) {
        return [x, y, z];
    };
    Vector3.dot = function (vec1, vec2) {
        return vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2];
    };
    return Vector3;
})(Vector);
var Vector4 = (function (_super) {
    __extends(Vector4, _super);
    function Vector4() {
        _super.apply(this, arguments);
    }
    Vector4.clean = function () {
        return [0, 0, 0, 0];
    };
    Vector4.create = function (x, y, z, w) {
        return [x, y, z, w];
    };
    Vector4.dot = function (vec1, vec2) {
        return vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2] + vec1[3] * vec2[3];
    };
    return Vector4;
})(Vector);
var PRECISION = 5;
var Geometry;
(function (Geometry) {
    function eqRec(r1, r2) {
        return r1.x == r2.x && r1.y == r2.y && r1.width == r2.width && r1.height == r2.height;
    }
    Geometry.eqRec = eqRec;
    function eqLine(l1, l2) {
        return eqPoint(l1.p1, l2.p1) && eqPoint(l1.p2, l2.p2);
    }
    Geometry.eqLine = eqLine;
    function eqPoint(p1, p2) {
        return p1.x == p2.x && p1.y == p2.y;
    }
    Geometry.eqPoint = eqPoint;
    function point(x, y) {
        return { x: x, y: y };
    }
    Geometry.point = point;
    function line(p1, p2, p3, p4) {
        if (typeof p1 == 'number')
            return { p1: { x: p1, y: p2 }, p2: { x: p3, y: p4 } };
        else
            return { p1: p1, p2: p2 };
    }
    Geometry.line = line;
    function toPoints(p1) {
        if (typeof p1.x != 'undefined') {
            var rect = p1;
            return [point(rect.x, rect.y), point(rect.width + rect.x, rect.y), point(rect.x + rect.width, rect.y + rect.height), point(rect.x, rect.y + rect.height)];
        }
        else
            return [p1.p1, p1.p2];
    }
    Geometry.toPoints = toPoints;
    function toLines(points) {
        var lines = [];
        for (var index = 0; index < points.length; index++) {
            lines[index] = (index == points.length - 1) ? line(points[index], points[0]) : line(points[index], points[index + 1]);
        }
        return lines;
    }
    Geometry.toLines = toLines;
    function rectangle(x, y, width, height) {
        return { x: x, y: y, width: width, height: height };
    }
    Geometry.rectangle = rectangle;
    function rectangleCollTest(rec1, rec2) {
        return (rec1.x < rec2.x + rec2.width && rec1.x + rec1.width > rec2.x && rec1.y < rec2.y + rec2.height && rec1.height + rec1.y > rec2.y);
    }
    Geometry.rectangleCollTest = rectangleCollTest;
    function lineIntersectAt(l1, l2) {
        var delta = (l1.p1.x - l1.p2.x) * (l2.p1.y - l2.p2.y) - (l1.p1.y - l1.p2.y) * (l2.p1.x - l2.p2.x);
        if (delta == 0)
            return null;
        return {
            x: ((l2.p1.x - l2.p2.x) * (l1.p1.x * l1.p2.y - l1.p1.y * l1.p2.x) - (l1.p1.x - l1.p2.x) * (l2.p1.x * l2.p2.y - l2.p1.y * l2.p2.x)) / delta,
            y: ((l2.p1.y - l2.p2.y) * (l1.p1.x * l1.p2.y - l1.p1.y * l1.p2.x) - (l1.p1.y - l1.p2.y) * (l2.p1.x * l2.p2.y - l2.p1.y * l2.p2.x)) / delta
        };
    }
    Geometry.lineIntersectAt = lineIntersectAt;
    function distanceSq(p1, p2) {
        return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
    }
    Geometry.distanceSq = distanceSq;
    function distance(p1, p2) {
        return Math.sqrt(distanceSq(p1, p2));
    }
    Geometry.distance = distance;
    function distenceToLine(p, l) {
        var length = distanceSq(l.p1, l.p2);
        if (length == 0)
            return distance(p, l.p1);
        var num = ((p.x - l.p1.x) * (l.p2.x - l.p1.x) + (p.y - l.p1.y) * (l.p2.y - l.p1.y)) / length;
        if (num < 0)
            return distance(p, l.p1);
        if (num > 1)
            return distance(p, l.p2);
        return distance(p, point(l.p1.x + num * (l.p2.x - l.p1.x), l.p1.y + num * (l.p2.y - l.p1.y)));
    }
    Geometry.distenceToLine = distenceToLine;
})(Geometry || (Geometry = {}));
var QuickGL;
(function (QuickGL) {
    var loopFc;
    var canvas;
    var shadColFrag = "precision highp float; uniform vec4 color; void main(void){ gl_FragColor = color; }";
    var shadColVertex = " precision highp float; uniform mat4 modelMatrix; uniform mat4 projectionMatrix; uniform mat4 viewMatrix; attribute vec2 vertexPos; void main(void){ gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(vertexPos, 1, 1); }";
    var shadTexFrag = " precision highp float; varying vec2 UV; uniform sampler2D sampler; void main(void){ gl_FragColor = texture2D(sampler, UV); }";
    var shadTexVertex = " precision highp float; uniform mat4 modelMatrix; uniform mat4 projectionMatrix; uniform mat4 viewMatrix; varying vec2 UV; attribute vec2 vertexPos; attribute vec2 vertexUV; void main(void){ gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(vertexPos, 1, 1); UV = vertexUV; }";
    function initGL(setupFunc, loopFunc, p1, p2, p3, p4, p5) {
        var width, height, x, y;
        if (typeof p3 == 'number') {
            width = p3;
            height = p4;
            x = p1;
            y = p2;
        }
        else {
            width = window.innerWidth;
            height = window.innerHeight;
            x = 0;
            y = 0;
        }
        var color = typeof p1 != 'number' && typeof p1 != 'undefined' ? p1 : typeof p5 != 'undefined' ? p5 : [1, 1, 1, 1];
        canvas = document.createElement('canvas');
        canvas.setAttribute("width", "" + width);
        canvas.setAttribute("height", "" + height);
        canvas.setAttribute("style", "position:fixed; top:" + y + "px; left:" + x + "px");
        document.body.appendChild(canvas);
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
        looper();
    }
    QuickGL.initGL = initGL;
    function looper() {
        loopFc();
        requestAnimationFrame(looper);
    }
    function createShader(typ) {
        var shad;
        if (typ == ShaderType.COLOR) {
            shad = new Shader({ "projectionMatrix": Shader.PROJECTION_MATRIX, "viewMatrix": Shader.VIEW_MATRIX, "modelMatrix": Shader.MODEL_MATRIX, "color": Shader.COLOR }, shadColVertex, shadColFrag);
        }
        else {
            shad = new Shader({ "projectionMatrix": Shader.PROJECTION_MATRIX, "viewMatrix": Shader.VIEW_MATRIX, "modelMatrix": Shader.MODEL_MATRIX }, shadTexVertex, shadTexFrag);
        }
        shad.matrix.setModelMatrix(Matrix4.identity());
        shad.matrix.setProjectionMatrix(Matrix4.identity());
        shad.matrix.setViewMatrix(Matrix4.identity());
        return shad;
    }
    QuickGL.createShader = createShader;
    //SImPle Renderer
    var SIPRender = (function () {
        function SIPRender(shader, startType) {
            this.drawer = new Render();
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
        SIPRender.prototype.addTexture = function (par1) {
            if (typeof par1 == "object") {
                var coord = par1.coord;
                this.drawer.addUVCoords(this.shader, [coord.getXMin(), coord.getYMin(), coord.getXMax(), coord.getYMin(), coord.getXMax(), coord.getYMax(), coord.getXMin(), coord.getYMax()]);
            }
            else
                this.drawer.addUVCoords(this.shader, par1);
        };
        SIPRender.prototype.setColorV3 = function (color) {
            color[3] = 1;
            if (this.startType == StartType.AUTO)
                this.shader.bind();
            this.shader.setVec4(Shader.COLOR, color);
        };
        SIPRender.prototype.setColorV4 = function (color) {
            if (this.startType == StartType.AUTO)
                this.shader.bind();
            this.shader.setVec4(Shader.COLOR, color);
        };
        SIPRender.prototype.setColorRGB = function (r, g, b) {
            if (this.startType == StartType.AUTO)
                this.shader.bind();
            this.shader.setVec4(Shader.COLOR, [r / 255, g / 255, b / 255, 1]);
        };
        SIPRender.prototype.setColorRBGA = function (r, g, b, a) {
            if (this.startType == StartType.AUTO)
                this.shader.bind();
            this.shader.setVec4(Shader.COLOR, [r / 255, g / 255, b / 255, a / 255]);
        };
        SIPRender.prototype.rect = function (p1, p2, p3, p4) {
            var x, y, w, h;
            if (typeof p1 == 'number') {
                x = p1;
                y = p2;
                w = p3;
                h = p4;
            }
            else {
                x = p1.x;
                y = p1.y;
                w = p1.width;
                h = p1.height;
            }
            if (this.startType == StartType.AUTO)
                this.shader.bind();
            this.matrixHandler.setModelMatrix(Matrix4.scale(Matrix4.translate(x, y), w, h));
            this.render(SIPRender.RECTANGLE);
        };
        SIPRender.prototype.line = function (p1, p2, p3, p4) {
            var x1, y1, x2, y2;
            if (typeof p1 == 'number') {
                x1 = p1;
                y1 = p2;
                x2 = p3;
                y2 = p4;
            }
            else {
                x1 = p1.p1.x;
                y1 = p1.p1.y;
                x2 = p1.p2.x;
                y2 = p1.p2.y;
            }
            if (this.startType == StartType.AUTO)
                this.shader.bind();
            this.matrixHandler.setModelMatrix(Matrix4.scale(Matrix4.translate(x1, y1), x2 - x1, y2 - y1));
            this.render(SIPRender.LINE);
        };
        SIPRender.prototype.render = function (id) {
            if (this.startType == StartType.AUTO) {
                if (id == 0)
                    this.drawer.drawElementsWithStartEnd(gl.TRIANGLES, 0);
                if (id == 1)
                    this.drawer.drawElementsWithStartEnd(gl.LINES, 1);
            }
            else {
                if (id == 0)
                    this.drawer.drawElements(0, gl.TRIANGLES);
                else if (id == 1)
                    this.drawer.drawElements(1, gl.LINES);
            }
        };
        SIPRender.RECTANGLE = 0;
        SIPRender.LINE = 1;
        return SIPRender;
    })();
    QuickGL.SIPRender = SIPRender;
    (function (StartType) {
        StartType[StartType["ONCE"] = 0] = "ONCE";
        StartType[StartType["AUTO"] = 1] = "AUTO";
        StartType[StartType["MANUAL"] = 2] = "MANUAL";
    })(QuickGL.StartType || (QuickGL.StartType = {}));
    var StartType = QuickGL.StartType;
    ;
    (function (ShaderType) {
        ShaderType[ShaderType["COLOR"] = 0] = "COLOR";
        ShaderType[ShaderType["TEXTURE"] = 1] = "TEXTURE";
    })(QuickGL.ShaderType || (QuickGL.ShaderType = {}));
    var ShaderType = QuickGL.ShaderType;
})(QuickGL || (QuickGL = {}));
var Camera = (function () {
    function Camera() {
        this.position = [0, 0];
    }
    Camera.prototype.setView = function (x, y) {
        this.position = [x, y];
    };
    Camera.prototype.setX = function (x) {
        this.position[0] = x;
    };
    Camera.prototype.setZ = function (y) {
        this.position[1] = y;
    };
    Camera.prototype.getViewMatrix = function () {
        return Matrix4.translate(-this.position[0], -this.position[1]);
    };
    return Camera;
})();
var MMath;
(function (MMath) {
    var SEED = 0;
    var TO_RAD = (Math.PI * 2) / 360;
    var TO_DEG = 360 / (Math.PI * 2);
    function setRandomSeed(seed) {
        SEED = seed;
    }
    MMath.setRandomSeed = setRandomSeed;
    function random(min, max) {
        var floor = typeof min != 'undefined';
        if (typeof min == 'undefined') {
            min = 0;
            max = 1;
        }
        SEED = (SEED * 9301 + 49297) % 233280;
        var rnd = SEED / 233280;
        var retVal = min + rnd * (max - min);
        return floor ? Math.floor(retVal) : retVal;
    }
    MMath.random = random;
    function toRad(deg) {
        return deg * TO_RAD;
    }
    MMath.toRad = toRad;
    function toDeg(rad) {
        return rad * TO_DEG;
    }
    MMath.toDeg = toDeg;
    function mod(num, max) {
        return ((num % max) + max) % max;
    }
    MMath.mod = mod;
})(MMath || (MMath = {}));
var GLF;
(function (GLF) {
    function clearBufferColor() {
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    GLF.clearBufferColor = clearBufferColor;
    function clearColor(color) {
        gl.clearColor(color[0], color[1], color[2], color[3]);
    }
    GLF.clearColor = clearColor;
})(GLF || (GLF = {}));
//A mess, do not VIEw!
var Shadow;
(function (Shadow) {
    function getShadowFan(light, shapes, overlap) {
        var points = [];
        var obstrLines = [];
        var center = Geometry.point(light.x + light.width / 2, light.y + light.height / 2);
        var lightPoints = Geometry.toPoints(light);
        var lightLines = Geometry.toLines(lightPoints);
        lightPoints.forEach(function (point, index, array) {
            points.push(point);
        });
        lightLines.forEach(function (line, index, array) {
            obstrLines.push(line);
        });
        var intersectShapes = [];
        for (var index = 0; index < shapes.length; index++) {
            var shape = shapes[index];
            var shapeLines = Geometry.toLines(shape);
            if (shapeLines.filter(function (line, index, array) {
                return Geometry.distenceToLine(center, line) < light.width / 2;
            }).length > 0) {
                var obstrPoints = [];
                intersectShapes.push(shapeLines);
                for (var jdex = 0; jdex < shape.length; jdex++) {
                    var point = shape[jdex];
                    var rad = getRad(center, point);
                    var line1 = Geometry.line(center, point);
                    var line2 = castRay(light, center, rad + 0.0001);
                    var line3 = castRay(light, center, rad - 0.0001);
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
                        if (sect2 != null)
                            free2 = false;
                        else if (sect3 != null)
                            free3 = false;
                    }
                    if (free) {
                        points.push(point);
                        obstrPoints.push(point);
                        if (free2)
                            points.push(line2.p2);
                        if (free3)
                            points.push(line3.p2);
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
        var sortPoints = [];
        if (!overlap) {
            var obstrCompare = function (l1, l2) {
                var dist1 = Geometry.distenceToLine(center, l1);
                var dist2 = Geometry.distenceToLine(center, l2);
                if (dist1 < dist2)
                    return -1;
                if (dist1 > dist2)
                    return 1;
                return 0;
            };
            obstrLines.sort(obstrCompare);
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
                        }
                        else {
                            if (Vector2.magnitude(Vector2.fromLine(rayLine)) > Geometry.distance(center, intersect)) {
                                point = intersect;
                                rayLine = Geometry.line(center, point);
                            }
                        }
                    }
                }
            }
            if (free)
                sortPoints.push(point);
        }
        var pointCompare = function (p1, p2) {
            var rad1 = getRad(center, p1);
            var rad2 = getRad(center, p2);
            if (rad1 < rad2)
                return -1;
            if (rad1 > rad2)
                return 1;
            return 0;
        };
        sortPoints.sort(pointCompare);
        var retArray = [];
        retArray.push(center.x);
        retArray.push(center.y);
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
    Shadow.getShadowFan = getShadowFan;
    function castRay(box, from, rad) {
        rad += Math.PI * 0.25;
        if (rad > 2 * Math.PI)
            rad -= Math.PI * 2;
        var x, y;
        if (rad < Math.PI * 0.5) {
            x = box.x + box.width;
            y = from.y - box.width / 2 * Math.tan(rad - Math.PI * 0.25);
        }
        else if (rad < Math.PI) {
            y = box.y;
            x = from.x - box.height / 2 * Math.tan(rad - Math.PI * 0.75);
        }
        else if (rad < Math.PI * 1.5) {
            x = box.x;
            y = from.y + box.width / 2 * Math.tan(rad - Math.PI * 1.25);
        }
        else if (rad < Math.PI * 2) {
            y = box.y + box.height;
            x = from.x + box.height / 2 * Math.tan(rad - Math.PI * 1.75);
        }
        return Geometry.line(from, Geometry.point(x, y));
    }
    function getRad(point, refPoint) {
        var angle = Vector2.angle(Vector2.fromLine(Geometry.line(point, refPoint)), [1, 0]);
        if (refPoint.y > point.y)
            angle = (2 * Math.PI) - angle;
        return angle;
    }
    function getShapeIntersects(s1, s2) {
        var pps = [];
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
})(Shadow || (Shadow = {}));
var Geometry;
(function (Geometry) {
    function linesegmentIntersectAt(l1, l2) {
        var point = Geometry.lineIntersectAt(l1, l2);
        if (point == null)
            return null;
        if (!(point.x >= Math.min(l1.p1.x, l1.p2.x) - 0.001 && point.x <= Math.max(l1.p1.x, l1.p2.x) + 0.001))
            return null;
        if (!(point.x >= Math.min(l2.p1.x, l2.p2.x) - 0.001 && point.x <= Math.max(l2.p1.x, l2.p2.x) + 0.001))
            return null;
        if (!(point.y >= Math.min(l1.p1.y, l1.p2.y) - 0.001 && point.y <= Math.max(l1.p1.y, l1.p2.y) + 0.001))
            return null;
        if (!(point.y >= Math.min(l2.p1.y, l2.p2.y) - 0.001 && point.y <= Math.max(l2.p1.y, l2.p2.y) + 0.001))
            return null;
        return point;
    }
    Geometry.linesegmentIntersectAt = linesegmentIntersectAt;
})(Geometry || (Geometry = {}));
var List = (function () {
    function List() {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i - 0] = arguments[_i];
        }
        if (typeof items != 'undefined' && items.length > 0)
            this.data = items;
        else
            this.data = [];
    }
    List.prototype.isEmpty = function () {
        return this.size() == 0;
    };
    List.prototype.size = function () {
        return this.data.length;
    };
    List.prototype.iterator = function () {
        return this.data.slice();
    };
    List.prototype.toArray = function () {
        return this.data;
    };
    List.prototype.join = function (data) {
        this.data = this.toArray().concat(data.toArray());
    };
    List.prototype.apply = function (index) {
        return this.data[index];
    };
    List.prototype.exch = function (index, index2) {
        var old = this.data[index];
        var old2 = this.data[index2];
        this.data[index] = old2;
        this.data[index2] = old;
    };
    List.exch = function (data, index, index2) {
        var old = data[index];
        var old2 = data[index2];
        data[index] = old2;
        data[index2] = old;
    };
    return List;
})();
var MutableList = (function (_super) {
    __extends(MutableList, _super);
    function MutableList() {
        _super.apply(this, arguments);
    }
    MutableList.prototype.insert = function (item) {
        this.data.push(item);
    };
    MutableList.prototype.insertAll = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i - 0] = arguments[_i];
        }
        for (var i = 0; i < items.length; i++)
            this.insert(items[i]);
    };
    MutableList.prototype.insertArray = function (items) {
        for (var i = 0; i < items.length; i++)
            this.insert(items[i]);
    };
    MutableList.prototype.remove = function (item) {
        var index = this.indexOf(item);
        if (index >= 0)
            this.removeAt(index);
        return index;
    };
    MutableList.prototype.removeAt = function (index) {
        return this.data.splice(index, 1)[0];
    };
    MutableList.prototype.replace = function (index, number, item) {
        this.data[index] = item;
    };
    MutableList.prototype.indexOf = function (item) {
        return this.data.indexOf(item);
    };
    MutableList.prototype.contains = function (item) {
        return this.indexOf(item) >= 0;
    };
    MutableList.prototype.clear = function () {
        this.data = [];
    };
    return MutableList;
})(List);
var Queue = (function (_super) {
    __extends(Queue, _super);
    function Queue() {
        _super.apply(this, arguments);
        this.low = 0;
    }
    Queue.prototype.size = function () {
        return _super.prototype.size.call(this) - this.low;
    };
    Queue.prototype.enqueue = function (item) {
        this.data.push(item);
    };
    Queue.prototype.dequeue = function () {
        var sample = this.sample();
        delete this.data[this.low];
        this.low++;
        if (this.data.length >= 16 && this.low >= this.size() * 2) {
            this.toArray();
        }
        return sample;
    };
    Queue.prototype.sample = function () {
        return this.apply(this.low);
    };
    Queue.prototype.toArray = function () {
        this.data = this.data.slice(this.low, this.data.length);
        this.low = 0;
        return this.data;
    };
    Queue.prototype.iterator = function () {
        return this.data.slice(this.low, this.data.length);
        ;
    };
    Queue.prototype.clear = function () {
        this.data = [];
    };
    return Queue;
})(List);
var Stack = (function (_super) {
    __extends(Stack, _super);
    function Stack() {
        _super.apply(this, arguments);
    }
    Stack.prototype.push = function (item) {
        this.data.push(item);
    };
    Stack.prototype.pop = function () {
        return this.data.pop();
    };
    Stack.prototype.sample = function () {
        return this.data[this.size() - 1];
    };
    Stack.prototype.clear = function () {
        this.data = [];
    };
    return Stack;
})(List);
var OrderdList = (function (_super) {
    __extends(OrderdList, _super);
    function OrderdList(compare) {
        var items = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            items[_i - 1] = arguments[_i];
        }
        _super.call(this);
        if (typeof items != 'undefined')
            this.data = items;
        this.compare = compare;
    }
    OrderdList.prototype.sort = function () {
        return this.iterator().sort(this.compare);
    };
    OrderdList.prototype.less = function (index, index2) {
        return this.compare(this.data[index], this.data[index2]) < 0;
    };
    OrderdList.prototype.more = function (index, index2) {
        return this.compare(this.data[index], this.data[index2]) > 0;
    };
    OrderdList.prototype.equal = function (index, index2) {
        return this.compare(this.data[index], this.data[index2]) == 0;
    };
    OrderdList.less = function (data, compare, index, index2) {
        return compare(data[index], data[index2]) < 0;
    };
    OrderdList.more = function (data, compare, index, index2) {
        return compare(data[index], data[index2]) > 0;
    };
    OrderdList.equal = function (data, compare, index, index2) {
        return compare(data[index], data[index2]) == 0;
    };
    return OrderdList;
})(List);
var Heap = (function (_super) {
    __extends(Heap, _super);
    function Heap(compare, max) {
        var items = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            items[_i - 2] = arguments[_i];
        }
        if (!max) {
            var oldComp = compare;
            compare = function (a, b) {
                return oldComp(b, a);
            };
        }
        _super.call(this, compare);
        if (typeof items != 'undefined')
            this.data = Heap.heapefy(items.slice(), compare, true);
        else
            this.data = [];
    }
    Heap.prototype.insertAll = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i - 0] = arguments[_i];
        }
        for (var i = 0; i < items.length; i++)
            this.insert(items[i]);
    };
    Heap.prototype.insertArray = function (items) {
        for (var i = 0; i < items.length; i++)
            this.insert(items[i]);
    };
    Heap.prototype.insert = function (item) {
        this.data.push(item);
        this.swim(this.size() - 1);
    };
    Heap.prototype.clear = function () {
        this.data = [];
    };
    Heap.prototype.pop = function () {
        this.exch(0, this.size() - 1);
        var item = this.data.pop();
        this.sink(0);
        return item;
    };
    Heap.prototype.sample = function () {
        return this.data[0];
    };
    Heap.prototype.join = function (collection) {
        this.insertArray(collection.toArray());
    };
    Heap.prototype.sort = function () {
        return Heap.sort(this.iterator(), this.compare, true, true);
    };
    Heap.sort = function (arr, compare, max, isHeap) {
        if (!max) {
            var oldComp = compare;
            compare = function (a, b) {
                return oldComp(b, a);
            };
        }
        if (typeof isHeap == 'undefined' || !isHeap)
            Heap.heapefy(arr, compare, true);
        var size = arr.length;
        while (size > 0) {
            List.exch(arr, 0, size - 1);
            Heap.sink(arr, compare, 0, --size);
        }
        return arr;
    };
    Heap.heapefy = function (arr, compare, max) {
        if (!max) {
            var oldComp = compare;
            compare = function (a, b) {
                return oldComp(b, a);
            };
        }
        var size = arr.length;
        for (var i = Math.ceil(size / 2); i >= 0; i--) {
            Heap.sink(arr, compare, i, size);
        }
        return arr;
    };
    Heap.prototype.swim = function (index) {
        var parent = Math.floor((index - 1) / 2);
        while (index > 0 && this.less(parent, index)) {
            this.exch(index, parent);
            index = parent;
            parent = Math.floor((index - 1) / 2);
        }
    };
    Heap.prototype.sink = function (index) {
        var child = index * 2 + 1;
        while (child < this.size()) {
            if (child < this.size() - 1 && this.less(child, child + 1))
                child++;
            if (this.less(index, child)) {
                this.exch(index, child);
                index = child;
                child = index * 2 + 1;
            }
            else
                break;
        }
    };
    Heap.sink = function (arr, compare, index, size) {
        var child = index * 2 + 1;
        while (child < size) {
            if (child < size - 1 && OrderdList.less(arr, compare, child, child + 1))
                child++;
            if (OrderdList.less(arr, compare, index, child)) {
                List.exch(arr, index, child);
                index = child;
                child = index * 2 + 1;
            }
            else
                break;
        }
    };
    return Heap;
})(OrderdList);
//# sourceMappingURL=corerm.js.map