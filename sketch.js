var ctracker;
var videoInput;
var VideoGraphics, Graphics, FinalGraphics;
var shader, program, randomPoints, fade;
var startTime = 0;
var openMouth = false;

function setup() {
    
    deb = Date.now();
    
    // setup camera capture
    videoInput = createCapture();
    videoInput.size(800, 600);
    videoInput.hide();
    VideoGraphics = createGraphics(600, 600);
    
    
    // setup canvas
    var cnv = createCanvas(800, 600);
    cnv.position(0, 0);
    
    // setup tracker
    ctracker = new clm.tracker();
    ctracker.init(pModel);
    ctracker.start(videoInput.elt);
    
    
    noStroke();
    Graphics = createGraphics(800, 600);
    FinalGraphics = createGraphics(600, 600);
    
    
    //shader
    shader = createGraphics(600, 600, WEBGL);
    program = shader.createShader(vert, frag);
    shader.noStroke();
    //voronoi
    randomPoints = createGraphics(30, 30);
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
    fade = 1;
    
}

function draw() {
    
    clear();
    var positions = ctracker.getCurrentPosition();
    
    //debug
    // image(videoInput, 600, 0, 800, 600);
    // filter('GRAY');
    
    
    //mono image
    VideoGraphics.image(videoInput, -100, 0, 800, 600);
    VideoGraphics.filter('GRAY');
    Graphics.image(VideoGraphics, 0, 0, 800, 600);
    Graphics.filter('GRAY');
    
    
    //upper lip
    Graphics.stroke(180, 0, 0);
    Graphics.fill(120, 0, 0);
    Graphics.beginShape();
    for(var i=0; i<=upperLip.length; i++){
        if(upperLip[i] < positions.length){
            var index = upperLip[i];
            Graphics.curveVertex(positions[index][0], positions[index][1]);
            if(i == 0 || i == upperLip.length-1) Graphics.curveVertex(positions[index][0], positions[index][1]);
        }
    }
    Graphics.endShape();
    
    //lower lip
    Graphics.beginShape();
    for(var i=0; i<=lowerLip.length; i++){
        if(lowerLip[i] < positions.length){
            var index = lowerLip[i];
            Graphics.curveVertex(positions[index][0], positions[index][1]);
            if(i == 0 || i == lowerLip.length-1) Graphics.curveVertex(positions[index][0], positions[index][1]);
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
    program.setUniform('time', millis());
    program.setUniform('image0', FinalGraphics);
    program.setUniform('image1', VideoGraphics);
    program.setUniform('randomPoints', randomPoints);
    program.setUniform('fade', fade);
    program.setUniform('noise', [noise(millis()), random()]);
    shader.rect(-shader.width/2 ,-shader.height/2, shader.width, shader.height);
    
    image(shader, 0, 0);
    
    drawFace(positions);
    
    
    //open the mouth or not
    if(positions.length > 60){
        var l = positions[57][1] - positions[60][1];
        if(l > 12){
            if(!openMouth){
                openMouth = true;
                startTime = Date.now();
            }
            var threshold = 1000;
            var fadeTime = 4000;
            var nt = Date.now() - startTime;
            if(nt > threshold){ //if 1 seconds passed with opening mouth
                var f = (float)(nt - threshold)/fadeTime;
                fade = 1 - max(min(f, 1),0);
            }
        }
        else{
            openMouth = false;
            fade = 1;
        }
    }
}


function drawFace(positions){
    
    //view face
    noFill();
    var sc;
    if(fade > 0.3) sc = 1;
    else if(fade > 0.1) sc = (fade-0.1) * 5;
    else sc = 0;
    stroke(255, 255, 255, 255*sc);
    push();
    translate(-100, 0);
    
    
    //mouth
    beginShape();
    for(var i=0; i<=upperLip.length; i++){
        if(upperLip[i] < positions.length){
            var index = upperLip[i];
            curveVertex(positions[index][0], positions[index][1]);
            if(i == 0 || i == upperLip.length-1) curveVertex(positions[index][0], positions[index][1]);
        }
    }
    endShape();
    beginShape();
    for(var i=0; i<=lowerLip.length; i++){
        if(lowerLip[i] < positions.length){
            var index = lowerLip[i];
            curveVertex(positions[index][0], positions[index][1]);
            if(i == 0 || i == lowerLip.length-1) curveVertex(positions[index][0], positions[index][1]);
        }
    }
    endShape();
    
    /*
     //eye
     noFill();
     beginShape();
     for(var i=0; i<=rightEye.length; i++){
     if(rightEye[i] < positions.length){
     var index = rightEye[i];
     curveVertex(positions[index][0], positions[index][1]);
     if(i == 0 || i == rightEye.length-1) curveVertex(positions[index][0], positions[index][1]);
     }
     }
     endShape();
     beginShape();
     for(var i=0; i<=leftEye.length; i++){
     if(leftEye[i] < positions.length){
     var index = leftEye[i];
     curveVertex(positions[index][0], positions[index][1]);
     if(i == 0 || i == leftEye.length-1) curveVertex(positions[index][0], positions[index][1]);
     }
     }
     endShape();
     
     //nose
     beginShape();
     for(var i=0; i<=nose.length; i++){
     if(nose[i] < positions.length){
     var index = nose[i];
     curveVertex(positions[index][0], positions[index][1]);
     if(i == 0 || i == nose.length-1) curveVertex(positions[index][0], positions[index][1]);
     }
     }
     endShape();
     */
    pop();
}
var upperLip = [44, 45, 46, 47, 48, 49, 50, 59, 60, 61, 44];
var lowerLip = [44, 56, 57, 58, 50, 51, 52, 53, 54, 55, 44];
var nose = [33, 41, 62, 34, 35, 36, 42, 37, 43, 38, 39, 40];
var rightEye = [23, 63, 24, 64, 25, 65, 26, 66, 23];
var leftEye = [30, 68, 29, 67, 28, 70, 31, 69, 30];



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
uniform sampler2D image1;
uniform sampler2D randomPoints;
uniform float fade;
uniform vec2 noise;

void main(void)
{
    
    vec2 uv = var_vertTexCoord;
    float _noise = noise.x;
    float _random = 2.0 * noise.y - 1.0;
    vec2 st = 2.0*uv - 1.0;
    
    vec4 tex_color = texture2D(image0, uv);
    
    vec4 color = vec4(1.0);
    
    float dist = 1e10;
    float num = 30.0;
    
    for(int y=0; y<30; y++){
        for(int x=0; x<30; x++){
            
            vec2 index = vec2(float(x)/num, float(y)/num);
            vec4 c = texture2D(randomPoints, index);
            float i = float(x+int(num)*y)/(num*num);
            
            float newdist = distance(c.xy, uv);
            if(newdist < dist){
                vec3 tc = texture2D(image0, c.xy).rgb;
                if (dist - newdist < 0.01) {
                    float d = dist - newdist;
                    color.rgb = mix(vec3(0.0), tc, d/0.01);
                }else{
                    color.rgb = tc;
                }
                vec2 nc = c.xy * vec2(2.0) - vec2(1.0);
                
                float r = atan(nc.y, nc.x);
                r *= (5.0*cos(r*PI)+sin(r)) * PI;
                float len = length(nc)/sqrt(2.0);
                len += 0.05*sin(r);
                len = max(0.0, min(1.0,len));
                if( len < fade){
                    // color.rgb = vec3(0.7);
                    // color.rgb = tex_color.rgb;
                    color.rgb = texture2D(image1, uv).rgb;
                }
                dist = newdist;
                
            }
        }
    }
    gl_FragColor = color;
    
}`;
