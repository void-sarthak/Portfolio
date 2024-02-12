////////////////////////////////////////////////////////////////////////
// A simple WebGL program to draw simple 2D shapes.
//

var gl;
var color;
var matrixStack = [];

// mMatrix is called the model matrix, transforms objects
// from local object space to world space.
var mMatrix = mat4.create();
var uMMatrixLocation;

// Constants for the circle
const numSegments = 50;  // Number of segments to approximate the circle
const radius = 0.5;       // Radius of the circle

var sqVertexPositionBuffer;
var sqTexturePositionBuffer;
var sqVertexIndexBuffer;

var aPositionLocation;
var aTexturePositionLocation;

var uColorLoc;
var uTextureLocation;

var uBrightnessLocation;
var uContrastLocation;
var uForegroundLocation;

var isBackgroundLocation;
var isForegroundLocation;
var isAlphaBlendLocation;

var isGrayScaleLocation;
var isSepiaLocation;

var isSmoothLocation;
var isSharpenLocation;
var isLaplacianLocation;
var isGradientLocation;

var backGroundFile;
var foreGroundFile;

var backTexture;
var foreTexture;

var contrastSlider;
var contrast = 0.0;

var brightnessSlider;
var brightness = 0.0;

var uResolutionLocation;
var resolution;

var isBackground = 0.0;
var isAlphaBlend = 0.0;

var isGrayScale = 0.0;
var isSepia = 0.0;

var isSmooth = 0.0;
var isSharpen = 0.0;
var isLaplacian = 0.0;
var isGradient = 0.0;

var canvas;

const vertexShaderCode = `#version 300 es
in vec2 aPosition;
in vec2 aTexturePosition;
uniform mat4 uMMatrix;

out vec2 fTexturePosition;

void main() {

  fTexturePosition = aTexturePosition;

  gl_Position = uMMatrix * vec4(aPosition,0.0,1.0);
  gl_PointSize = 3.0;
}`;

const fragShaderCode = `#version 300 es
precision mediump float;

in vec2 fTexturePosition;

out vec4 fragColor;

uniform vec4 color;

uniform sampler2D uTexture;
uniform sampler2D uTexture2;

uniform vec2 uResolution;

uniform float contrast;
uniform float brightness;

uniform float alphaBlend;
uniform float backgroundOnly;

uniform float grayScale;
uniform float sepia;

uniform float isSmooth;
uniform float sharpen;
uniform float laplacian;
uniform float gradient;

vec4 colorFilter;

void grayScaleColor() {
  vec3 gray = vec3(0.2126, 0.7152, 0.0722);
  float grayColor = dot(colorFilter.rgb, gray);

  colorFilter = vec4(vec3(grayColor), colorFilter.a);
}

void sepiaColor()
{
  float red = (colorFilter.r * 0.393) + (colorFilter.g * 0.769) + (colorFilter.b * 0.189);
  float green = (colorFilter.r * 0.349) + (colorFilter.g * 0.686) + (colorFilter.b * 0.168);
  float blue = (colorFilter.r * 0.272) + (colorFilter.g * 0.534) + (colorFilter.b * 0.131);

  colorFilter = vec4(red, green, blue, color.a);
}

void alphaBlending() {
  vec4 texColor = texture(uTexture, fTexturePosition);
  vec4 texColor2 = texture(uTexture2, fTexturePosition);

  colorFilter = vec4(texColor2.rgb * texColor2.a + texColor.rgb * (1.0 - texColor2.a), 1.0);
}

void smoothColor()
{
  mat3 kernel = mat3(
    1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, 1.0
  );

  float kernelWeight = 9.0;

  vec4 newColor = vec4(0.0);

  for(int i = -1; i <= 1; i++)
  {
    for(int j = -1; j <= 1; j++)
    {
      vec2 offset = vec2(float(i), float(j)) * uResolution;
      newColor += texture(uTexture, fTexturePosition + offset) * kernel[i+1][j+1];
    }
  }

  colorFilter = newColor/kernelWeight;
}

void sharpenColor()
{
  mat3 kernel = mat3(
    0.0, -1.0, 0.0,
    -1.0, 5.0, -1.0,
    0.0, -1.0, 0.0
  );

  float kernelWeight = 1.0;

  vec4 newColor = vec4(0.0);

  for(int i = -1; i <= 1; i++)
  {
    for(int j = -1; j <= 1; j++)
    {
      vec2 offset = vec2(float(i), float(j)) * uResolution;
      newColor += texture(uTexture, fTexturePosition + offset) * kernel[i+1][j+1];
    }
  }

  colorFilter = newColor/kernelWeight;
}

void laplacianColor()
{
  mat3 kernel = mat3(
    0.0, -1.0, 0.0,
    -1.0, 4.0, -1.0,
    0.0, -1.0, 0.0
  );

  float kernelWeight = 1.0;

  vec4 newColor = vec4(0.0);

  for(int i = -1; i <= 1; i++)
  {
    for(int j = -1; j <= 1; j++)
    {
      vec2 offset = vec2(float(i), float(j)) * uResolution;
      newColor += texture(uTexture, fTexturePosition + offset) * kernel[i+1][j+1];
    }
  }

  colorFilter = vec4(newColor.rgb, 1.0);
}

void gradientColor()
{
  vec4 up = texture(uTexture, fTexturePosition + vec2(0.0, 1.0) * uResolution);
  vec4 down = texture(uTexture, fTexturePosition + vec2(0.0, -1.0) * uResolution);
  vec4 left = texture(uTexture, fTexturePosition + vec2(-1.0, 0.0) * uResolution);
  vec4 right = texture(uTexture, fTexturePosition + vec2(1.0, 0.0) * uResolution);

  vec4 dy = (up - down)* 0.5;
  vec4 dx = (right - left) * 0.5;

  vec4 newColor = sqrt(dy * dy + dx * dx);

  colorFilter = vec4(newColor.rgb, 1.0);
}

void main()
{
  if(alphaBlend == 1.0)
    alphaBlending();
  
  if(backgroundOnly == 1.0)
  {
    if(isSmooth == 1.0)
      smoothColor();

    else if(sharpen == 1.0)
      sharpenColor();

    else if(laplacian == 1.0)
      laplacianColor();

    else if(gradient == 1.0)
      gradientColor();
    else

      colorFilter = texture(uTexture, fTexturePosition);
    }

  //gray scale filter
  if(grayScale == 1.0)
    grayScaleColor();

  //sepia filter
  if(sepia == 1.0)
    sepiaColor();

  vec4 contrastColor = vec4((colorFilter.rgb - vec3(0.5)) * (contrast + 1.0) + vec3(0.5), colorFilter.a);
  fragColor = vec4(contrastColor.rgb * brightness, contrastColor.a);
}`;

function pushMatrix(stack, m) {
  //necessary because javascript only does shallow push
  var copy = mat4.create(m);
  stack.push(copy);
}

function popMatrix(stack) {
  if (stack.length > 0) return stack.pop();
  else console.log("stack has no matrix to pop!");
}

function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function vertexShaderSetup(vertexShaderCode) {
  shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(shader, vertexShaderCode);
  gl.compileShader(shader);
  // Error check whether the shader is compiled correctly
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function fragmentShaderSetup(fragShaderCode) {
  shader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(shader, fragShaderCode);
  gl.compileShader(shader);
  // Error check whether the shader is compiled correctly
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function initShaders(vertexShaderCode, fragShaderCode) {
  shaderProgram = gl.createProgram();

  var vertexShader = vertexShaderSetup(vertexShaderCode);
  var fragmentShader = fragmentShaderSetup(fragShaderCode);

  // attach the shaders
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  //link the shader program
  gl.linkProgram(shaderProgram);

  // check for compilation and linking status
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
  }

  //finally use the program.
  gl.useProgram(shaderProgram);

  return shaderProgram;
}

function initGL(canvas) {
  try {
    gl = canvas.getContext("webgl2"); // the graphics webgl2 context
    gl.viewportWidth = canvas.width; // the width of the canvas
    gl.viewportHeight = canvas.height; // the height
    drawMode = gl.TRIANGLE_FAN; //initial draw mode
  } catch (e) {}
  if (!gl) {
    alert("WebGL initialization failed");
  }
}

function initSquareBuffer() {
  // buffer for point locations
  const sqVertices = new Float32Array([
    0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
  ]);
  sqVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sqVertices, gl.STATIC_DRAW);
  sqVertexPositionBuffer.itemSize = 2;
  sqVertexPositionBuffer.numItems = 4;

  const texVertices = new Float32Array([
    1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
  ]);
  sqTexturePositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sqTexturePositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, texVertices, gl.STATIC_DRAW);
  sqTexturePositionBuffer.itemSize = 2;
  sqTexturePositionBuffer.numItems = 4;

  // buffer for point indices
  const sqIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  sqVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sqIndices, gl.STATIC_DRAW);
  sqVertexIndexBuffer.itemsize = 1;
  sqVertexIndexBuffer.numItems = 6;
}

function drawSquare(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.vertexAttribPointer(
    aPositionLocation,
    sqVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, sqTexturePositionBuffer);
  gl.vertexAttribPointer(
    aTexturePositionLocation,
    sqTexturePositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // buffer for point indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);

  gl.uniform4fv(uColorLoc, color);

  gl.uniform1f(uContrastLocation, contrast);
  gl.uniform1f(uBrightnessLocation, brightness);

  gl.uniform2fv(uResolutionLocation, resolution);

  gl.uniform1f(isBackgroundLocation, isBackground);
  gl.uniform1f(isAlphaBlendLocation, isAlphaBlend);

  gl.uniform1f(isGrayScaleLocation, isGrayScale);
  gl.uniform1f(isSepiaLocation, isSepia);

  gl.uniform1f(isSmoothLocation, isSmooth);
  gl.uniform1f(isSharpenLocation, isSharpen);
  gl.uniform1f(isLaplacianLocation, isLaplacian);
  gl.uniform1f(isGradientLocation, isGradient);

  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  gl.activeTexture(gl.TEXTURE0); // set texture unit 0 to use
  gl.bindTexture(gl.TEXTURE_2D, backTexture); // bind the texture object to the texture unit
  gl.uniform1i(uTextureLocation, 0); // pass the texture unit to the shader

  gl.activeTexture(gl.TEXTURE1); // set texture unit 0 to use
  gl.bindTexture(gl.TEXTURE_2D, foreTexture); // bind the texture object to the texture unit
  gl.uniform1i(uForegroundLocation, 1); // pass the texture unit to the shader

  // now draw the square
  gl.drawElements(
    gl.TRIANGLES,
    sqVertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );
}

function initTextures(textureFile) {
  var tex = gl.createTexture();
  tex.image = new Image();
  tex.image.src = textureFile;
  tex.image.onload = function () {
    handleTextureLoaded(tex);
  };
  return tex;
}

function handleTextureLoaded(texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // use it to flip Y if needed
  gl.texImage2D(
    gl.TEXTURE_2D, // 2D texture
    0, // mipmap level
    gl.RGBA, // internal format
    gl.RGBA, // format
    gl.UNSIGNED_BYTE, // type of data
    texture.image // array or <img>
  );

  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR
  );

  drawScene();
}

function greyScaleFilter()
{
  isGrayScale = 1.0;
  isSepia = 0.0;

  drawScene();
}

function sepiaFilter()
{
  isSepia = 1.0;
  isGrayScale = 0.0;

  drawScene();
}

function contrastFilter()
{
  contrast = parseFloat(contrastSlider.value)/100.0;
  brightness = parseFloat(brightnessSlider.value)/10.0;

  drawScene();
}

function reset()
{
  document.getElementById("Assignment").reset();
}

function smoothFilter()
{
  isGrayScale = 0.0;
  isSepia = 0.0;

  isSmooth = 1.0;
  isSharpen = 0.0;
  isLaplacian = 0.0;
  isGradient = 0.0;

  drawScene();
}

function sharpenFilter()
{
  isGrayScale = 0.0;
  isSepia = 0.0;

  isSmooth = 0.0;
  isSharpen = 1.0;
  isLaplacian = 0.0;
  isGradient = 0.0;

  drawScene();
}

function laplacianFilter()
{
  isGrayScale = 0.0;
  isSepia = 0.0;

  isSmooth = 0.0;
  isSharpen = 0.0;
  isLaplacian = 1.0;
  isGradient = 0.0;

  drawScene();
}

function gradientFilter()
{
  isGrayScale = 0.0;
  isSepia = 0.0;

  isSmooth = 0.0;
  isSharpen = 0.0;
  isLaplacian = 0.0;
  isGradient = 1.0;

  drawScene();
}

function backgroundTexture()
{
  isBackground = 1.0;
  isAlphaBlend = 0.0;

  drawScene();
}

function alphaBlending()
{
  isAlphaBlend = 1.0;
  isBackground = 0.0;

  drawScene();
}

function loadBackgroundImage(event)
{
  const file = event.target.files[0];
  var reader = new FileReader()
  
  reader.onload = function(e)
  {
    backGroundFile = e.target.result;
    backTexture = initTextures(backGroundFile);
  }

  reader.readAsDataURL(file);
}

function loadForegroundImage(event)
{
  const file = event.target.files[0];
  var reader = new FileReader()
  
  reader.onload = function(e)
  {
    foreGroundFile = e.target.result;
    foreTexture = initTextures(foreGroundFile);
  }

  reader.readAsDataURL(file);
}

function save()
{
  drawScene();

  var link = document.createElement('a');
  link.href = canvas.toDataURL();
  link.download = 'screenshot.png';
  link.click();
}

//This is the main drawing space
function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // initialize the model matrix to identity matrix
  model = mat4.identity(mMatrix);
  model = mat4.scale(model, [2.0, 2.0, 1.0]);

  drawSquare([1.0, 0.0, 0.0, 1.0], model);
}

// This is the entry point from the html
function webGLStart() {
  canvas = document.getElementById("Assignment_4");

  contrastSlider = document.getElementById("contrast");
  contrastSlider.addEventListener("input", contrastFilter);

  brightnessSlider = document.getElementById("brightness");
  brightnessSlider.addEventListener("input", contrastFilter);

  initGL(canvas);

  resolution = [1/canvas.width, 1/canvas.height];

  initSquareBuffer();

  shaderProgram = initShaders(vertexShaderCode, fragShaderCode);

  //get locations of attributes declared in the vertex shader
  aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
  aTexturePositionLocation = gl.getAttribLocation(shaderProgram, "aTexturePosition");

  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
  uColorLoc = gl.getUniformLocation(shaderProgram, "color");

  uContrastLocation = gl.getUniformLocation(shaderProgram, "contrast");
  uBrightnessLocation = gl.getUniformLocation(shaderProgram, "brightness");

  uResolutionLocation = gl.getUniformLocation(shaderProgram, "uResolution");

  isBackgroundLocation = gl.getUniformLocation(shaderProgram, "backgroundOnly");
  isAlphaBlendLocation = gl.getUniformLocation(shaderProgram, "alphaBlend");

  isGrayScaleLocation = gl.getUniformLocation(shaderProgram, "grayScale");
  isSepiaLocation = gl.getUniformLocation(shaderProgram, "sepia");

  isSmoothLocation = gl.getUniformLocation(shaderProgram, "isSmooth");
  isSharpenLocation = gl.getUniformLocation(shaderProgram, "sharpen");
  isLaplacianLocation = gl.getUniformLocation(shaderProgram, "laplacian");
  isGradientLocation = gl.getUniformLocation(shaderProgram, "gradient");

  uTextureLocation = gl.getUniformLocation(shaderProgram, "uTexture");
  uForegroundLocation = gl.getUniformLocation(shaderProgram, "uTexture2");

  //enable the attribute arrays
  gl.enableVertexAttribArray(aPositionLocation);
  gl.enableVertexAttribArray(aTexturePositionLocation);
  contrastFilter();
}