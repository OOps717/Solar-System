"use strict"

// ---------------------------------------------------------------------
//  SKYBOX SHADERS
// ---------------------------------------------------------------------
var sky_vert =
`#version 300 es
layout(location=0) in vec3 position_in;

out vec3 tex_coord;

uniform mat4 projectionviewMatrix;

void main()
{
	tex_coord = position_in;
	gl_Position = projectionviewMatrix * vec4(position_in, 1.0);
}  
`;

var sky_frag =
`#version 300 es
precision highp float;

in vec3 tex_coord;
out vec4 frag;

uniform samplerCube TU;

void main()
{	
	frag = texture(TU, tex_coord);
}
`;

// ---------------------------------------------------------------------
//  SUN SHADERS
// ---------------------------------------------------------------------
var sunVertexShader = 
` #version 300 es
layout(location=1) in vec3 position_in;
layout(location=2) in vec2 textureCoord_in;

out vec2 v_textureCoord;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrixRotation;

void main()
{
    v_textureCoord = textureCoord_in;
	gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrixRotation * vec4( position_in, 1.0 );
}
`

var sunFragmentShader = 
`#version 300 es
precision highp float;

in vec2 v_textureCoord;
out vec4 oFragmentColor;

uniform sampler2D TUsun;

void main()
{
    oFragmentColor = texture( TUsun, v_textureCoord );
}
`

// ---------------------------------------------------------------------
//  PLANET SHADERS
// ---------------------------------------------------------------------
var planetVertexShader =
`#version 300 es
layout(location=5) in vec3 position_in;
layout(location=6) in vec3 normal_in;
layout(location=7) in vec2 textureCoord_in;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat3 uNormalMatrix;

uniform float uTime;

out vec2 v_textureCoord;            // output vector for the texture of the clouds
out vec2 v_staticTextureCoord;      // output vector for the texture of the planets
out vec3 v_position;                // output vector of the current position of the planet (static texture)
out vec3 v_normal;                  // output vector of the normal

void main()
{   
    v_staticTextureCoord = textureCoord_in; 
    v_textureCoord = vec2(abs(textureCoord_in.x-mix(0.0,1.0,uTime)), textureCoord_in.y);
    v_normal = uNormalMatrix * normal_in;
    v_position = (uProjectionMatrix * uViewMatrix * uModelMatrix * vec4( position_in , 1.0 )).xyz;

    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4( position_in , 1.0 ) ;
}
`;

var planetFragmentShader =
`#version 300 es
precision highp float;

#define M_PI 3.14159265358979

in vec2 v_textureCoord;
in vec2 v_staticTextureCoord;
in vec3 v_normal;
in vec3 v_position;

out vec4 oFragmentColor;

uniform sampler2D TUplanet;
uniform sampler2D TUclouds;
uniform sampler2D TUnight;
uniform int currentPlanet;

void main()
{
    vec4 planetTexture = texture(TUplanet,v_staticTextureCoord);

    vec3 p = v_position;
    vec3 n = normalize( v_normal );
    
    // CREATE LIGHTNING (copied from the correction of TP3)
    float LightIntensity = 0.8;
    vec3 LightPosition = vec3(0.0,0.0,0.0); 
    
    vec3 lightDir = LightPosition-p;
    float d2 = dot(lightDir, lightDir);
    lightDir /= sqrt(d2);
    float diffuseTerm = max( 0.0, dot(n,lightDir) );
    vec3 Id = (LightIntensity/d2) * planetTexture.xyz * vec3( diffuseTerm );
    Id = Id / M_PI;
    
    vec3 uKs = vec3 (1.0,1.0,1.0);
    vec3 Is = vec3( 0.0 );
	if ( diffuseTerm > 0.0 )
	{
		vec3 viewDir = normalize( -p.xyz );
		vec3 halfDir = normalize( viewDir + lightDir ); 
		float specularTerm = max( 0.0, pow( dot( n, halfDir ), 0.5 ) ); 
		Is = LightIntensity * uKs * vec3( specularTerm );
		Is /= (0.5 + 2.0) / (2.0 * M_PI);
	}

    // APPLY LIGHTING ON TEXTURES
    if (currentPlanet == 2){                                    // if it is the Earth
        vec3 Ia = vec3(0.0,0.0,0.0);
        vec3 color = (0.3 * Ia) + (0.3 * Id) + (0.3 * Is);      // light side
        vec3 night_col = vec3(1.0,1.0,1.0) - color;             // dark side 

        vec4 cloudsTexture = texture(TUclouds,v_textureCoord);
        vec4 nightTexture = texture(TUnight, v_staticTextureCoord);
        vec4 preFragmentColor = planetTexture * 0.5 + cloudsTexture * 0.5;  // combine the texture of the clouds and the daymap 
        oFragmentColor = vec4(preFragmentColor.rgb*color + nightTexture.rgb*night_col,preFragmentColor.a);
    }else{
        vec3 Ia = vec3(0.12,0.12,0.12);
        vec3 color = (0.3 * Ia) + (0.3 * Id) + (0.3 * Is);
        oFragmentColor = vec4(planetTexture.rgb*color,planetTexture.a);
    }
}
`

// ---------------------------------------------------------------------
//  RING SHADERS
// ---------------------------------------------------------------------
var ringVertexShader =
`#version 300 es
layout(location=5) in vec3 position_in;
layout(location=7) in vec2 textureCoord_in;

out vec2 v_textureCoord;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;

void main()
{   
    v_textureCoord = textureCoord_in; 
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4( position_in , 1.0 ) ;
}
`;

var ringFragmentShader =
`#version 300 es
precision highp float;

in vec2 v_textureCoord;
out vec4 oFragmentColor;

uniform sampler2D TUring;
uniform sampler2D TUring_trans;

void main()
{
    vec4 ring_color = texture(TUring,v_textureCoord);
    vec4 ring = texture(TUring_trans,v_textureCoord);
    oFragmentColor = ring * ring_color * vec4(0.3,0.3,0.3,1.0);
}
`

// ---------------------------------------------------------------------
//  ASTEROID SHADERS
// ---------------------------------------------------------------------
var asteroid_vertex_shader = 
` #version 300 es
// INPUTS
layout(location=0) in vec3 position_in;
layout(location=1) in vec3 normal_in;
layout(location=2) in vec2 textureCoord_in;
layout(location=3) in mat4 modelMatrix;

out vec2 v_textureCoord;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrixRotationSun;
uniform mat4 uModifiedModelMatrix;

void main()
{
    v_textureCoord = textureCoord_in;
	gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrixRotationSun * modelMatrix * uModifiedModelMatrix * vec4(position_in, 1.0 );
}
`

var asteroid_fragment_shader = 
`#version 300 es
precision highp float;

in vec2 v_textureCoord;
out vec4 oFragmentColor;

uniform sampler2D uSampler;

void main()
{
    oFragmentColor = texture(uSampler, v_textureCoord);

}
`

//--------------------------------------------------------------------------------------------------------

// Global variables : textures, FBOs, prog_shaders, mesh, renderer, and a lot of parameters

// SHADERS
var prg_envMap = null;
var planet_shaderProgram = null;
var asteroid_shaderProgram = null;
var sun_shaderProgram = null;
var ring_shaderProgram = null;

// TEXTURES
var tex_envMap = null;
var tex_sun = null;
var texture_asteroid = null;
var tex_mercury = null;
var tex_venus = null;
var tex_earth = null;
var tex_earth_clouds = null;
var tex_earth_night = null;
var tex_mars = null;
var tex_jupiter = null;
var tex_saturn = null;
var tex_uranus = null;
var tex_neptune = null;
var tex_saturn_ring_color = null;
var tex_saturn_ring = null;
var tex_uranus_ring_color = null;
var tex_uranus_ring = null;

// RENDERERS
var sky_rend = null;
var sun_rend = null;
var asteroid_rend = null;
var planet_rend = null;
var ring_rend = null;

// FOR THE INTERFACE
var checkbox_view = null;

var slider_speed_around_sun;
var slider_speed_around_planet;
var slider_size_of_planet;
var slider_distance;

var slider_speed_rotation_asteroid;
var slider_asteroid_rotation_sun;
var slider_size_of_asteroid;

// VIEW MATRIX USED FOR LIGHTING
var view;

// BOOLEANS USED FOR CHANGING EYE POSITION
var mercury = false;
var venus = false;
var earth = false;
var mars = false;
var jupiter = false;
var saturn = false;
var uranus = false;
var neptune = false;


// -------------------------------------------------------------------------------------------------------------------------------------
//  INIT
// -------------------------------------------------------------------------------------------------------------------------------------
function init_wgl()
{
    ewgl.continuous_update = true;

    // Initialize textures 
    tex_sun = Texture2d();
    // Sun texture
    tex_sun.load("./images/2k_sun.jpg",gl.RGB8);
    // Asteroid texture
    texture_asteroid = Texture2d();
    texture_asteroid.load("./rock/rock.png", gl.RGB8);
    // Planets texture + clouds
	tex_mercury = Texture2d();
    tex_mercury.load("./images/2k_mercury.jpg",gl.RGB8);
    tex_venus = Texture2d();
    tex_venus.load("./images/2k_venus.jpg",gl.RGB8);
    tex_earth = Texture2d();
    tex_earth.load("./images/2k_earth_daymap.jpg",gl.RGB8);
    tex_earth_clouds = Texture2d();
    tex_earth_clouds.load("./images/2k_earth_clouds.jpg");
    tex_earth_night = Texture2d();
    tex_earth_night.load("./images/2k_earth_nightmap.jpg");
    tex_mars = Texture2d();
    tex_mars.load("./images/2k_mars.jpg",gl.RGB8);
    tex_jupiter = Texture2d();
    tex_jupiter.load("./images/2k_jupiter.jpg",gl.RGB8);
    tex_saturn = Texture2d();
    tex_saturn.load("./images/2k_saturn.jpg",gl.RGB8);
    tex_uranus = Texture2d();
    tex_uranus.load("./images/2k_uranus.jpg",gl.RGB8);
    tex_neptune = Texture2d();
    tex_neptune.load("./images/2k_neptune.jpg",gl.RGB8);
    //Ring textures
    tex_saturn_ring_color = Texture2d();
    tex_saturn_ring_color.load("./additional_images/saturnringcolor.jpg", gl.RGB8);
    tex_saturn_ring = Texture2d();
    tex_saturn_ring.load("./additional_images/saturnringpattern.gif", gl.RGB8);
    tex_uranus_ring_color = Texture2d();
    tex_uranus_ring_color.load("./additional_images/uranusringcolour.jpg", gl.RGB8);
    tex_uranus_ring = Texture2d();
    tex_uranus_ring.load("./additional_images/uranusringtrans.gif", gl.RGB8);
	
    // Initialize texture cubeMap for the skybox
    tex_envMap = TextureCubeMap();
    var stars = "./images/skybox_4k.png";
    var cloud = "./images/skybox_milky_way_4k.png";
	tex_envMap.load([cloud, stars, stars, stars, stars, stars]).then( update_wgl );
    
    
    // Create a mesh cube and his renderer
    sky_rend = Mesh.Cube().renderer(0, -1, -1);
    prg_envMap = ShaderProgram(sky_vert,sky_frag,'sky shader');
    
    // Create meshes of sphere and renderers
    sun_rend = Mesh.Sphere(50).renderer(1, -1, 2);
    sun_shaderProgram = ShaderProgram(sunVertexShader, sunFragmentShader, 'sun shader');
    planet_rend = Mesh.Sphere(50).renderer(5, 6, 7);
    planet_shaderProgram = ShaderProgram(planetVertexShader, planetFragmentShader, 'planet shader');
    ring_rend = Mesh.Tore(10,40,0.2,0.8).renderer(5,-1,7);
    ring_shaderProgram = ShaderProgram(ringVertexShader,ringFragmentShader,'ring shader')

	// Set the radius and the center of the scene
	ewgl.scene_camera.set_scene_radius(sky_rend.BB.radius+35.0);    // set a radius of the scene and add 35 to avoid a disappearance of the planets
    ewgl.scene_camera.set_scene_center(sky_rend.BB.center);	        // set a center of the scene
    ewgl.scene_camera.look(Vec3(0,0,22),Vec3(0,0,-1),Vec3(0,1,0));  // set the intial eye position
    view = ewgl.scene_camera.get_view_matrix();                     // get the initial value of the view matrix usefull to add the right direction of the light

    // Asteroid Belt
    // ----------------------------------------------------------------------------------------------------
    asteroid_shaderProgram = ShaderProgram(asteroid_vertex_shader, asteroid_fragment_shader, "asteroid shader");
    let nbAsteroids = 18000;

    const matrixData = new Float32Array(4 * 4 * nbAsteroids);

    var random_distance_X = 0.0;
    var random_distance_Z = 0.0;
    var random_size = 0.0; 

    // For each asteroid
    for(let i = 0; i < nbAsteroids; ++i){
        
        var model;
        random_distance_X = getRandomMinMax(4.9,7.2);
        random_distance_Z = getRandomMinMax(-0.19,0.19);
        random_size = getRandomMinMax(0.02,0.1);

        // Compute a matrix model
        var normalizeView = Matrix.rotateX(270.0);                                                          // set the position of the asteroids on the horizontal axis
        var rotateSunMatrix = Matrix.rotateZ(getRandomMax(360.0));                                          // set a random location of each asteroid around the sun
        var translateMatrix = Matrix.translate(random_distance_X, 0.0, random_distance_Z);                  // set a random location on the x-axis(distance between the sun and asteroid) and on the z-axis
        var rotationMatrix = Matrix.mult(Matrix.rotateX(getRandomMax(360.0)),                               // set a random position of the asteroid
                                        Matrix.rotateY(getRandomMax(360.0)),
                                        Matrix.rotateZ(getRandomMax(360.0)));
        var scaleMatrix = Matrix.scale(0.0854 * random_size, 0.0854 * random_size, 0.0854 * random_size);   // set a random size for each asteroid
        
        model = Matrix.mult(normalizeView, rotateSunMatrix, translateMatrix, rotationMatrix, scaleMatrix);
        var index = 16 * i;
        matrixData.set(model.data, index);
    }

    // VBO for model matrix of each instance
    const matrixBuffer = VBO(matrixData);
    Mesh.loadObjFile("./rock/rock.obj").then((meshes) =>
    {
        asteroid_rend = meshes[0].instanced_renderer([
            [3, matrixBuffer, 1, 4 * 4, 0 * 4, 4],
            [4, matrixBuffer, 1, 4 * 4, 1 * 4, 4],
            [5, matrixBuffer, 1, 4 * 4, 2 * 4, 4],
            [6, matrixBuffer, 1, 4 * 4, 3 * 4, 4]],
            0, 1, 2);
    });

    
    // User interface
    // ----------------------------------------------------------------------------------------------------
    UserInterface.begin();
        UserInterface.use_field_set( 'H', "Operating keys:" );
        UserInterface.add_text_input('1 - Mercury');
        UserInterface.add_text_input('2 - Venus');
        UserInterface.add_text_input('3 - Earth');
        UserInterface.add_text_input('4 - Mars');
        UserInterface.add_text_input('5 - Jupiter');
        UserInterface.add_text_input('6 - Saturn');
        UserInterface.add_text_input('7 - Uranus');
        UserInterface.add_text_input('8 - Neptune');
        UserInterface.add_text_input('0 - initial camera position');
        UserInterface.add_text_input('P - Pause');
        UserInterface.end_use();
        
        UserInterface.use_field_set( 'V', "View changer" );
        checkbox_view  = UserInterface.add_check_box( 'Top view', false, update_wgl );
        UserInterface.end_use();

        UserInterface.use_field_set( 'V', "Basic manipulations with planets" );
        slider_speed_around_sun = UserInterface.add_slider( 'The speed of the planet around the sun', 0.0, 1000.0, 200, update_wgl );
        slider_speed_around_planet = UserInterface.add_slider( 'The speed of the planet rotation around itself', 0.0, 1000.0, 200, update_wgl );
        slider_size_of_planet = UserInterface.add_slider( 'The size of the planet ', 0.0, 2000.0, 500, update_wgl );
        slider_distance = UserInterface.add_slider( 'The distance from the planets to the sun', 0.0, 10.0, 1, update_wgl );
        UserInterface.end_use();

        UserInterface.use_field_set( 'V', "Basic manipulations with ateroids" );
        slider_asteroid_rotation_sun = UserInterface.add_slider( 'The speed of the ateroids around the sun', 0.0, 1000.0, 200, update_wgl );
        slider_speed_rotation_asteroid = UserInterface.add_slider( 'The speed of the asteroids rotation', 0.0, 1000.0, 200, update_wgl );
        slider_size_of_asteroid = UserInterface.add_slider( 'The size of the asteroids', 0.0, 2000.0, 500, update_wgl );
        UserInterface.end_use();

    UserInterface.end();
    
    gl.clearColor(0, 0, 0 , 1);
    gl.enable(gl.DEPTH_TEST);
}

function getRandomMax(max)
{
	return Math.random() * Math.floor(max);
}

function getRandomMinMax(min, max)
{
	return Math.random() * (max - min) + min;
}

// -------------------------------------------------------------------------------------------------------------------------------------
//  DRAW
// -------------------------------------------------------------------------------------------------------------------------------------
function draw_wgl()
{	
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
    // RENDER SKYBOX
    prg_envMap.bind();

	Uniforms.projectionviewMatrix = ewgl.scene_camera.get_matrix_for_skybox();
	Uniforms.TU = tex_envMap.bind(0);
	sky_rend.draw(gl.TRIANGLES);
    unbind_texture_cube();
    
    // RENDER THE SUN
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    sun_shaderProgram.bind();
    
    Uniforms.uProjectionMatrix = ewgl.scene_camera.get_projection_matrix();                                             // get the projection matrix
    if (checkbox_view.checked)
        Uniforms.uViewMatrix = Matrix.mult(ewgl.scene_camera.get_view_matrix(),Matrix.rotateX(90));                     // get the view matrix from the top view
    else
        Uniforms.uViewMatrix = ewgl.scene_camera.get_view_matrix();                                                     // get the view matrix from the side view        
    Uniforms.uModelMatrixRotation = Matrix.rotateY(-10 * ewgl.current_time);                                            // create a model matrix by rotating the sun about itself
    Uniforms.TUsun = tex_sun.bind(0);                                                                                   // bind sun texture 
    sun_rend.draw(gl.TRIANGLES);

    // RENDER ALL THE PLANETS
    // -------------------------------------------------------------------------------------------------------------------------
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);   
    planet_shaderProgram.bind();

    Uniforms.uProjectionMatrix = ewgl.scene_camera.get_projection_matrix();                                             // get the projection matrix
    if (checkbox_view.checked)
        Uniforms.uViewMatrix = Matrix.mult(ewgl.scene_camera.get_view_matrix());                                        // get the view matrix from the top view
    else
        Uniforms.uViewMatrix = Matrix.mult(ewgl.scene_camera.get_view_matrix(),Matrix.rotateX(270.0));                  // get the view matrix from the side view
    Uniforms.TUclouds = tex_earth_clouds.bind(1);                                                                       // bind the texture of clouds on Earth
    Uniforms.TUnight = tex_earth_night.bind(2);                                                                         // bind the texture of the nightmap of Earth             
    
    // Different specific values for the planets (numbers are approximate but not real)
    var textures = [tex_mercury,tex_venus,tex_earth,tex_mars,tex_jupiter,tex_saturn,tex_uranus,tex_neptune];    
    var radiuses = [0.03, 0.078, 0.0854, 0.0407, 0.5040, 0.3362, 0.1642, 0.1536];                                              
    var distances = [1.26,2.08,2.95,4.0,8.86,12.34,16.6,23];                                                            // the distances between the planets and the Sun         
    var rotation_speed = [58.0*23.93, -243.0*23.93, 23.93, 24.62, 9.92, 10.65, 17.24, 16.11];                           // the rotation speed of the planets about their axis
    var rotation_speed_sun = [88.0, 224.7, 365.25, 689.0, 11.87*365.25, 29.45*365.25, 84.07*365.25, 164.89*365.25];     // the rotation speed of the planets about around the Sun
    var inclination = [0.1,177,23,25,3,27,98,30];                                                                       // the degree of the inclination
    var distance_between_camera = [0.3,0.7,0.8,0.4,5,3.3,1.6,1.5];                                                      // the distance between eye position and the planet
    var planets = [mercury,venus,earth,mars,jupiter,saturn,uranus,neptune];

    Uniforms.uTime = ewgl.current_time%100/100;
    
    for (var i = 0; i < radiuses.length; i++) {
        
        Uniforms.currentPlanet = i;
        Uniforms.TUplanet = textures[i].bind(0);  

        // Model matrix building
        var modelMatrixRotationSun = Matrix.rotateZ((slider_speed_around_sun.value/200)*10*ewgl.current_time*365.25/rotation_speed_sun[i]);             // rotate around the sun 
        var translationMatrix = Matrix.translate(distances[i]*slider_distance.value,0,0);                                                               // translate current origin to the center of each planet
        var modelMatrixInclination = Matrix.rotateX(inclination[i]);                                                                                    // set the incalnation for each planet
        var modelMatrixRotation = Matrix.rotateZ((slider_speed_around_planet.value/200)*24*ewgl.current_time*365.25/rotation_speed[i]);                 // rotate the each planet around the origin of the planet
        var matrixScale = Matrix.scale(radiuses[i] * slider_size_of_planet.value/500,                                                                   // rescale each planet
                                        radiuses[i] * slider_size_of_planet.value/500,
                                        radiuses[i] * slider_size_of_planet.value/500);
        var modelMatrix = Matrix.mult(modelMatrixRotationSun, translationMatrix, modelMatrixInclination, modelMatrixRotation,matrixScale);
        Uniforms.uModelMatrix = modelMatrix;
        
        // Normal matrix building for lighting
        let mvm = Matrix.mult(view, Matrix.rotateX((slider_speed_around_sun.value/200)*10*ewgl.current_time*365.25/rotation_speed_sun[i]), Matrix.rotateY(290),modelMatrix);
        Uniforms.uNormalMatrix = mvm.inverse3transpose();
        
        // Draw each planet
        planet_rend.draw(gl.TRIANGLES);

        // Change the eye position according to the selected planet
        if (planets[i]){
            var eye_position_angle = (slider_speed_around_sun.value/200)*10*ewgl.current_time*365.25/(rotation_speed_sun[i]*57.3);
            var modified_distance = distances[i]*slider_distance.value;
            if (checkbox_view.checked){
                ewgl.scene_camera.look(Vec3(modified_distance*Math.cos(eye_position_angle),modified_distance*Math.sin(eye_position_angle),distance_between_camera[i]),
                                        Vec3(0.0,0.0,-1.0),
                                        Vec3(0.0,1.0,0.0));
            }
            else{
                ewgl.scene_camera.look(Vec3(modified_distance*Math.cos(-eye_position_angle),0,modified_distance*Math.sin(-eye_position_angle)+distance_between_camera[i]),
                                        Vec3(0.0,0.0,-1.0),
                                        Vec3(0.0,1.0,0.0));
            }
        }
    }
    // -------------------------------------------------------------------------------------------------------------------------
    
    // RENDER RINGS OF SOME PLANETS
    // -------------------------------------------------------------------------------------------------------------------------
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);   
    ring_shaderProgram.bind();
    
    var color_ring_textures = [tex_saturn_ring_color,tex_uranus_ring_color];
    var ring_textures = [tex_saturn_ring,tex_uranus_ring];
    var resize = [0.9,0.4];                                      

    for (var i=0; i<2; i++){
        Uniforms.TUring = color_ring_textures[i].bind(0);
        Uniforms.TUring_trans = ring_textures[i].bind(1);  
        
        Uniforms.uProjectionMatrix = ewgl.scene_camera.get_projection_matrix();                                             // get the projection matrix
        if (checkbox_view.checked)
            Uniforms.uViewMatrix = Matrix.mult(ewgl.scene_camera.get_view_matrix());                                        // get the view matrix from the top view
        else
            Uniforms.uViewMatrix = Matrix.mult(ewgl.scene_camera.get_view_matrix(),Matrix.rotateX(270.0));                  // get the view matrix from the side view
        
        // Model matrix building
        var modelMatrixRotationSun = Matrix.rotateZ((slider_speed_around_sun.value/200)*10*ewgl.current_time*365.25/rotation_speed_sun[5+i]);           // rotate the ring along with the planet about the sun
        var translationMatrix = Matrix.translate(distances[5+i]*slider_distance.value,0,0);                                                             // set the origin to the center of the planet
        var modelMatrixInclination = Matrix.rotateX(inclination[5+i]);                                                                                  // set the incalnation according to the planet
        var modelMatrixRotation = Matrix.rotateZ((slider_speed_around_planet.value/200)*24*ewgl.current_time*365.25/rotation_speed[5+i]);               // rotate the each ring about the planet
        var matrixScale = Matrix.scale(resize[i]*slider_size_of_planet.value/500,resize[i]*slider_size_of_planet.value/500,0.01);                       // rescale each ring          
        Uniforms.uModelMatrix = Matrix.mult(modelMatrixRotationSun, translationMatrix, modelMatrixInclination, modelMatrixRotation, matrixScale);
            
        // Draw each ring
        ring_rend.draw(gl.TRIANGLES);
    }
    // -------------------------------------------------------------------------------------------------------------------------

    // RENDER ASTEROIDS
    // -------------------------------------------------------------------------------------------------------------------------
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    asteroid_shaderProgram.bind();
    Uniforms.uSampler = texture_asteroid.bind(0);                                                                               // bind asteroid texture

    Uniforms.uProjectionMatrix = ewgl.scene_camera.get_projection_matrix();                                                     // get the projection matrix
    if (checkbox_view.checked)
        Uniforms.uViewMatrix = Matrix.mult(ewgl.scene_camera.get_view_matrix(),Matrix.rotateX(90.0));                           // get the view matrix from the top view
    else
        Uniforms.uViewMatrix = Matrix.mult(ewgl.scene_camera.get_view_matrix());                                                // get the view matrix from the top view
    
    Uniforms.uModelMatrixRotationSun = Matrix.rotateY(ewgl.current_time * 5.0 * (slider_asteroid_rotation_sun.value/200));      // rotate of the asteroid around the Sun
    var rotationX = Matrix.rotateX(ewgl.current_time * 60.0 * (slider_speed_rotation_asteroid.value/200));                      // rotate of the asteroid by X axis
    var rotationY = Matrix.rotateY(ewgl.current_time * 80.0 * (slider_speed_rotation_asteroid.value/200));                      // rotate of the asteroid by Y axis
    var matrixScale = Matrix.scale(slider_size_of_asteroid.value/500,                                                           // rescale each asteroid
                                    slider_size_of_asteroid.value/500,
                                    slider_size_of_asteroid.value/500);
    Uniforms.uModifiedModelMatrix = Matrix.mult(rotationX,rotationY,matrixScale)

    if(asteroid_rend != null) {
        asteroid_rend.draw(gl.TRIANGLES,18000);
    }
    // -------------------------------------------------------------------------------------------------------------------------

    gl.bindVertexArray(null);
	gl.useProgram(null);	
}

function onkeydown_wgl(k)
{
    if (k=='1'){                    // Mecury has been selected
        mercury = true;
        venus = false;
        earth = false;
        mars = false;
        jupiter = false;
        saturn = false;
        uranus = false;
        neptune = false;
    }
    if (k=='2'){                    // Venus has been selected
        mercury = false;
        venus = true;
        earth = false;
        mars = false;
        jupiter = false;
        saturn = false;
        uranus = false;
        neptune = false;
    }
    if (k=='3'){                    // Earth has been selected
        mercury = false;
        venus = false;
        earth = true;
        mars = false;
        jupiter = false;
        saturn = false;
        uranus = false;
        neptune = false;
    }
    if (k=='4'){                    // Mars has been selected
        mercury = false;
        venus = false;
        earth = false;
        mars = true;
        jupiter = false;
        saturn = false;
        uranus = false;
        neptune = false;
    }
    if (k=='5'){                    // Jupiter has been selected
        mercury = false;
        venus = false;
        earth = false;
        mars = false;
        jupiter = true;
        saturn = false;
        uranus = false;
        neptune = false;
    }
    if (k=='6'){                    // Saturn has been selected
        mercury = false;
        venus = false;
        earth = false;
        mars = false;
        jupiter = false;
        saturn = true;
        uranus = false;
        neptune = false;
    }
    if (k=='7'){                    // Uranus has been selected
        mercury = false;
        venus = false;
        earth = false;
        mars = false;
        jupiter = false;
        saturn = false;
        uranus = true;
        neptune = false;
    }
    if (k=='8'){                    // Neptune has been selected
        mercury = false;
        venus = false;
        earth = false;
        mars = false;
        jupiter = false;
        saturn = false;
        uranus = false;
        neptune = true;
    }
    if (k=='0'){                    // Return to initial eye position
        mercury = false;
        venus = false;
        earth = false;
        mars = false;
        jupiter = false;
        saturn = false;
        uranus = false;
        neptune = false;
        ewgl.scene_camera.look(Vec3(0,0,22),Vec3(0,0,-1),Vec3(0,1,0));
    }

    else if (k=='p' || k=='P'){     // Pause 
        if (ewgl_common.pause_mode == true)
            ewgl_common.pause_mode = false;
        else
            ewgl_common.pause_mode = true;
    }
}

ewgl.launch_3d();
