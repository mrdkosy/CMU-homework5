var ctracker;
var videoInput;
var Graphics, FinalGraphics;
var shader, program, randomPoints, fade, nosePoint;
var realColorImage;

var slider;

function setup() {
  

  // setup camera capture
  videoInput = createCapture();
  videoInput.size(800, 600);
  videoInput.hide();
  
  
  // setup canvas
  var cnv = createCanvas(1600, 600);
  cnv.position(0, 0);

  // setup tracker
  ctracker = new clm.tracker();
  ctracker.init(pModel);
  ctracker.start(videoInput.elt);

  //その他
  noStroke();
  Graphics = createGraphics(800, 600);
  FinalGraphics = createGraphics(600, 600);


  //shader
  shader = createGraphics(600, 600, WEBGL);
  program = shader.createShader(vert, frag);
  shader.noStroke();
  //voronoiのポイントとなる点
  randomPoints = createGraphics(20, 20);
  randomPoints.noStroke();
  randomPoints.fill(255, 0, 0);
  randomPoints.rect(0, 0, randomPoints.width, randomPoints.height);

  randomPoints.loadPixels();
  var d = randomPoints.pixelDensity();
  var size = 4 * (randomPoints.width * d) * (randomPoints.height * d);
  for (var i = 0; i < size; i += 4) {
    randomPoints.pixels[i] = random(0, 255);
    randomPoints.pixels[i + 1] = random(0, 255);
    randomPoints.pixels[i + 2] = 0;//blue(c);
    randomPoints.pixels[i + 3] = 255;
  }
  randomPoints.updatePixels();
  nosePoint = createVector(0,0);

  //slider 
  slider = createSlider(0, 100, 0);
  slider.position(650, 20);
}

function draw() {
  clear();
  var positions = ctracker.getCurrentPosition();  

  //口の色を取得
  image(videoInput, 0, 0, 800, 600);
  realColorImage = get();

  


  //モノクロイメージ
  Graphics.image(videoInput, 0, 0, 800, 600);
  Graphics.filter('GRAY');
  image(realColorImage, 600, 0); 

  
  //上唇
  Graphics.stroke(120, 0, 0);
  Graphics.fill(120, 0, 0);
  Graphics.beginShape();
  for(var i=0; i<=upperLip.length; i++){
    if(upperLip[i] < positions.length){
      var index = upperLip[i];
      Graphics.vertex(positions[index][0], positions[index][1]);      
    }
  }
  Graphics.endShape();

  //下唇
  Graphics.beginShape();
  for(var i=0; i<=lowerLip.length; i++){
    if(lowerLip[i] < positions.length){
      var index = lowerLip[i];
      Graphics.vertex(positions[index][0], positions[index][1]);
    }
  }
  Graphics.endShape();


  FinalGraphics.push();
  FinalGraphics.image(Graphics, -100, 0);
  FinalGraphics.pop();
  //image(FinalGraphics,0,0);


  //draw shader
  shader.background(0);
  shader.fill(255);
  shader.shader(program);
  program.setUniform('resolution', [shader.width, shader.height]);
  program.setUniform('time', 1);
  program.setUniform('image0', FinalGraphics);
  program.setUniform('randomPoints', randomPoints);
  fade = slider.value()/100;
  program.setUniform('fade', fade);
  program.setUniform('nodePoint'[nosePoint.x, nosePoint.y]);
  shader.rect(-shader.width/2 ,-shader.height/2, shader.width, shader.height);

  image(shader, 0, 0);

  image(randomPoints, 600, 0);
  //image(FinalGraphics, 0, 0);
}
var upperLip = [44, 45, 46, 47, 48, 49, 50, 59, 60, 61, 44];
var lowerLip = [44, 56, 57, 58, 50, 51, 52, 53, 54, 55, 44];

/* メモ
後から実装するもの
・ビデオイメージからの色取得
・笑ったアクション取得
・歯の色取得
 - voronoi


グリッチ
https://www.shadertoy.com/view/XstXD2
*/


var vert = `
#ifdef GL_ES
precision highp float;
precision highp int;

#endif

// attributes, in
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;
attribute vec4 aVertexColor;

// attributes, out
varying vec3 var_vertPos;
varying vec4 var_vertCol;
varying vec3 var_vertNormal;
varying vec2 var_vertTexCoord;

// matrices
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
//uniform mat3 uNormalMatrix;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);

  // var_vertPos      = aPosition;
  // var_vertCol      = aVertexColor;
  // var_vertNormal   = aNormal;
  var_vertTexCoord = aTexCoord;

}`;

var frag = `
precision highp float;
#define PI 3.14159265359
varying vec2 var_vertTexCoord;

uniform vec2 resolution;
uniform float time;
uniform sampler2D image0;
uniform sampler2D randomPoints;
uniform float fade;
uniform vec2 nodePoint;

void main(void)
{

  vec2 uv = var_vertTexCoord;
  vec2 st = 2.0*uv - 1.0;

  vec4 tex_color = texture2D(image0, uv);

  vec4 color = vec4(1.0);

  float dist = 1e10;
  for(int y=0; y<20; y++){
    for(int x=0; x<20; x++){


      vec2 index = vec2(float(x)/20.0, float(y)/20.0);
      vec4 c = texture2D(randomPoints, index);

      float newdist = distance(c.xy, uv);
      if(newdist < dist){
        vec3 tc = texture2D(image0, c.xy).rgb;
        if (dist - newdist < 0.01) {
          float d = dist - newdist;
          color.rgb = mix(vec3(0.0), tc, d/0.01);
        }else{
          color.rgb = tc;
        }
        dist = newdist;
      }
    }
  }
  gl_FragColor = color;

}`;