let mode = 0; //Modo de visualización
let mode_alt = false //Modo alternativo de visualización
let t = 0; //Punto de partida
let speed = 0.5; //Velocidad inicial
let lines = 20; //Número de líneas para mode0()
let mod = 1; //Valor que modifica las funciones de mode0()

let size = 40; //Tamaño de los polígonos que componen el terreno
let w = 1800; //Anchura del terreno
let h = 1000; //Altura del terreno
let cols = w / size; //Número de columnas de polígonos que componen el terreno
let rows = h / size; //Número de filas de polígonos que componen el terreno
let terrain = []; //Array para el terreno
let terrain_advance = 0; //Velocidad inicial para mode2()
let terrain_noise = 0.15; //Ruido para la no uniformidad del terreno

let img; //Imagen de la nave
let ship_angle = 0; //Ángulo de la nave
let ship_translate = 0; //Posición de la nave
let ship_hidden = 0; //Variable que determina si ocultar o no la nave

let stars = [];
let stars_number = 400;
let speed_stars;

let capture; //Variable sobre la que se carga la captura de vídeo
let no_capture; //Video que reemplaza a la cámara si no se otorgan permisos para la misma
let mp4 = false; //Variable que determina si el vídeo ha sido debidamente cargado y configurado
let drops_rate; //Variable que determina la cadencia con la que se generan elipsis en mode3()
let drops_size; //Variable que determina el tamaño de las elipsis construidas en mode3()

function preload() {
  img = loadImage('../assets/spaceship.png'); //Se carga la imagen de la nave

  // Se carga el vídeo que reemplaza a la cámara si no se otorgan permisos para la misma
  loadmp4();
}

function setup() {
  createCanvas(720, 480, WEBGL);

  //Construcción del grid que dará forma al terreno
  for (let x = 0; x < cols; x++) {
    terrain[x] = [];
    for (let y = 0; y < rows; y++) {
      terrain[x][y] = 0; //Se asigna valor 0 como punto de partida
    }
  }

  //Se construye un array tantos objetos de clase Star como se especifique en stars_number
  for (let i = 0; i < stars_number; i++) {
    stars[i] = new Star();
  }

  //Se crea la captura de vídeo para la cámara
  capture = createCapture(VIDEO);
  capture.size(width, height);
  capture.hide();
}

//En función del modo vigente las acciones tomadas son unas u otras
function draw() {
  if (mode == 0) {
    mode0();
  } else if (mode == 1) {
    mode1();
  } else if (mode == 2) {
    mode2();
  } else if (mode == 3) {
    mode3();
  }
  t += speed; //Progreso en función de la velocidad
}

//Se detecta el input del usuario para adecuar el funcionamiento del programa a éste
function keyPressed() {
  if (key == 'a' || key == 'A' || key == '1') {
    background(255);
    mode = 0;
  } else if (key == 's' || key == 'S' || key == '2') {
    mode = 1;
  } else if (key == 'd' || key == 'D' || key == '3') {
    mode = 2;
  } else if (key == 'f' || key == 'F' || key == '4') {
    if (mp4 == false) {
      setupmp4();
      mp4 = true;
    }
    mode = 3;
  }

  //Con las flechas arriba/abajo se ilustran modos alternativos de visualización
  if (keyCode === UP_ARROW) {
    mode_alt = true;
    if (mode == 0) {
      background(255); //En mode0() el modo alternativo sólo necesita del background una vez
    }
  } else if (keyCode === DOWN_ARROW) {
    mode_alt = false;
  }

  //La tecla "h" oculta o muestra la nave
  if (key == 'h' || key == 'H') {
    if (ship_hidden == 0) {
      img = loadImage('');
      ship_hidden = 1;
    } else {
      img = loadImage('../assets/spaceship.png');
      ship_hidden = 0;
    }
  }
}

//Haciendo uso de la rueda del ratón se puede aumentar o disminuir la velocidad
function mouseWheel(event) {
  print(event.delta);
  speed += event.delta / 1000;
}

function mode0() {
  if (mode_alt == false) {
    background(0); //Fondo negro
    strokeWeight(4); //Grosor de las líneas

    //Construcción de las líneas en las que se fundamenta este modo
    for (let i = 0; i < lines; i++) {
      stroke(color(255, 0, 0, 192 / (0.25 * (i + 1)))); //Color y opacidad de la línea posterior
      line(x1(t + i), y1(t + i), x2(t + i), y2(t + i)); //Se construye una línea a partir de la unión de los output de las funciones, que varían al hacerlo t
      stroke(color(0, 0, 255, 192 / (0.25 * (i + 1))));
      line(x1(-t + i), y2(-t + i), x2(-t + i), y1(-t + i));
    }
  } else if (mode_alt == true) {
    stroke(0); //Puntos de color negro
    strokeWeight(4); //Grosor de los puntos

    //Se dibujan los puntos en cuestión a lo largo del recorrido especificado
    point(x1(t), y1(t));
    point(x2(t), y2(t));
    point(x1(t), y2(t));
    point(x2(t), y1(t));
  }

  //Con las flechas izquierda/derecha se modifican las funciones en las que se fundameta este modo
  if (keyIsDown(LEFT_ARROW)) {
    mod -= 0.0025;
  }

  if (keyIsDown(RIGHT_ARROW)) {
    mod += 0.0025
  }
}

//Funciones para mode0()
function x1(t) {
  return sin(t / (mod * 20)) * 100 + sin(t / 5) * 200;
}

function y1(t) {
  return cos(t / (mod * 10)) * 100 + sin(t / 4) * 50;
}

function x2(t) {
  return sin(t / (mod * 10)) * 200 + sin(t) * 2;
}

function y2(t) {
  return cos(t / (mod * 20)) * 200 + cos(t / 12) * 20;
}

function mode1() {
  background(0); //Se limpia el modo previo y se dibuja un canvas negro

  terrain_advance -= 0.1 * speed; //Velocidad de desplazamiento de las deformaciones del terreno
  let yoff = terrain_advance; //Se guarda el valor en una variable

  //Se genera un mapa de ruido para cada casilla del grid
  for (let y = 0; y < rows; y++) {
    let xoff = 0;
    for (let x = 0; x < cols; x++) {
      terrain[x][y] = map(noise(xoff, yoff), 0, 1, -92, 92);
      xoff += terrain_noise;
    }
    yoff += terrain_noise;
  }

  translate(-0.5 * w, -0.5 * h); //Se posiciona debidamente en terreno en la ventana
  //fill(75, 75, 75, 255); //Color de los triángulos

  strokeWeight(3); //Grosor de las líneas
  stroke(0); //Color de las líneas

  //Se dibuja el terreno
  for (let y = 0; y < rows - 1; y++) {
    //El modo alternativo modifica el cómo los vértices interactúan entre ellos
    if (mode_alt == false) {
      beginShape(TRIANGLE_STRIP);
    } else if (mode_alt == true) {
      beginShape(TRIANGLES);
    }
    //Se definen los vértices que construirán los triángulos  
    for (let x = 0; x < cols; x++) {
      fill(x * 7, y * 6, y * 5, 255); //Color de los triángulos
      vertex(x * size, y * size, terrain[x][y]);
      vertex(x * size, (y + 1) * size, terrain[x][y + 1]);
    }
    endShape();
  }

  //Se dibuja el terreno
  for (let y = 0; y < rows - 1; y++) {
    //El modo alternativo modifica el cómo los vértices interactúan entre ellos
    if (mode_alt == false) {
      beginShape(TRIANGLE_STRIP);
    } else if (mode_alt == true) {
      beginShape(TRIANGLES);
    }
    //Se definen los vértices que construirán los triángulos  
    for (let x = 0; x < cols; x++) {
      fill(x * 5, y * 6, y * 7, 255); //Color de los triángulos
      vertex(x * size, y * size, terrain[x][y]);
      vertex(x * size, (y + 0.5) * size, terrain[x][y + 5]); //Se modifican las uniones entre los vértices para el segundo terreno
    }
    endShape();
  }
}

function mode2() {
  background(0); //Se limpia el modo previo y se dibuja un canvas negro

  terrain_advance -= 0.1 * speed; //Velocidad de desplazamiento de las deformaciones del terreno
  var yoff = terrain_advance; //Se guarda el valor en una variable

  //Se genera un mapa de ruido para cada casilla del grid
  for (let y = 0; y < rows; y++) {
    let xoff = 0;
    for (let x = 0; x < cols; x++) {
      terrain[x][y] = map(noise(xoff, yoff), 0, 1, -92, 92);
      xoff += terrain_noise;
    }
    yoff += terrain_noise;
  }

  if (mode_alt == false) {
    translate(0, 0.4 * height); //Altura con respecto al terreno
    rotateX(PI / 3); //Inclinación del terreno
    translate(-0.5 * w, -0.5 * h); //Se posiciona debidamente en terreno en la ventana

    strokeWeight(3); //Grosor de las líneas
    stroke(0); //Color de las líneas

    //Se dibuja el terreno
    for (let y = 0; y < rows - 1; y++) {
      beginShape(TRIANGLE_STRIP);
      //Se definen los vértices que construirán los triángulos  
      for (let x = 0; x < cols; x++) {
        fill(x * 3, y * 9, y * 12, 255);
        vertex(x * size, y * size, terrain[x][y]);
        vertex(x * size, (y + 1) * size, terrain[x][y + 1]);
      }
      endShape();
    }

    //Se dibuja el terreno
    for (let y = 0; y < rows - 1; y++) {
      beginShape(TRIANGLE_STRIP);
      //Se definen los vértices que construirán los triángulos  
      for (let x = 0; x < cols; x++) {
        fill(x * 5, y * 11, y * 14, 255); //Color de los triángulos
        vertex(x * size, y * size, terrain[x][y]);
        vertex(x * size, (y + 0.5) * size, terrain[x][y + 5]); //Se modifican las uniones entre los vértices para el segundo terreno
      }
      endShape();
    }

    translate(0.5 * w, 0.5 * h); //Se posiciona debidamente en terreno en la ventana
    rotateX(-PI / 2.5); //Se define una inclinación para el terreno, generando perspectiva
    translate(0, -0.4 * height); //Altura con respecto al terreno

    //Se posiciona y carga la nave
    rotate(ship_angle);
    translate(ship_translate, 0.175 * height);
    imageMode(CENTER);
    //Los valores aleatorios emulan las turbulencias de la nave
    image(img, random(-0.0025 * speed, 0.0025 * speed) * width, random(-0.0025 * speed, 0.0025 * speed) * height, 0.15 * width, 0.15 * height);

  } else if (mode_alt == true) {
    speed_stars = map(200 * speed, 0, width, 0, 100); //Se define la velocidad de las estrellas en función de la velocidad global

    //Para cada estrella se ejecutan las funciones de la clase, que actualizan su posición/velocidad y redibujan la misma 
    for (let i = 0; i < stars.length; i++) {
      stars[i].update();
      stars[i].show();
    }

    //Se posiciona y carga la nave
    rotate(ship_angle);
    translate(ship_translate, 0);
    imageMode(CENTER);
    image(img, 0, 0.2 * height, 0.15 * width, 0.15 * height);
  }

  //Se definen los controles para la nave
  if (keyIsDown(LEFT_ARROW) && ship_angle < 0.45) {
    ship_angle += 0.01 * PI;
    ship_translate -= 0.0125 * width;
    //print(ship_angle, ship_translate);
  }

  if (keyIsDown(RIGHT_ARROW) && ship_angle > -0.45) {
    ship_angle -= 0.01 * PI;
    ship_translate += 0.0125 * width;
    //print(ship_angle, ship_translate);
  }
}

//Se define la clase Star
function Star() {
  this.x = random(-width, width);
  this.y = random(-height, height);
  this.z = random(width);
  this.pz = this.z;

  //Función para actualizar posición/velocidad
  this.update = function () {
    this.z = this.z - speed_stars;
    if (this.z < 1) {
      this.z = width;
      this.x = random(-width, width);
      this.y = random(-height, height);
      this.pz = this.z;
    }
  }

  //Función para el dibujado de la estrella
  this.show = function () {
    fill(255); //Color blanco
    noStroke(); //Sin bordes

    //Se construyen los mapas sobre los cuales se dibujan las estrellas
    let sx = map(this.x / this.z, 0, 1, 0, width);
    let sy = map(this.y / this.z, 0, 1, 0, height);

    star(sx, sy, width / 800, height / 800, 5); //Se construyen estrellas sobre dicho mapa

    //Se construyen otro set de mapas en otra (o la misma) profundidad
    let px = map(this.x / this.pz, 0, 1, 0, width);
    let py = map(this.y / this.pz, 0, 1, 0, height);

    //this.pz sigue el rastro de this.z para que las líneas a construír con los mapas px y py sigan a sus estrellas asociadas
    this.pz = this.z;

    stroke(255); //Color de la línea (blanco)
    line(px, py, sx, sy); //Se dibujan las líneas en cuestión
  }
}

//Constructor de la estrella
function star(x, y, radius1, radius2, npoints) {
  angle = TWO_PI / npoints;
  halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    sx = x + cos(a) * radius2;
    sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function mode3() {
  colorMode(RGB);
  background(0);

  if (mode_alt == false) {
    drops_rate = 8000;
    drops_size = 20;
  } else if (mode_alt == true) {
    drops_rate = 5000;
    drops_size = 35;
  }

  if (capture.loadedmetadata) {
    for (let i = 0; i < drops_rate; i++) {
      let x = random(width);
      let y = random(height);

      let c = capture.get(int(x), int(y));
      //console.log(capture.get(int(x), int(y)));

      fill(c);
      noStroke();
      ellipse(x - width * 0.5, y - height * 0.5, drops_size, drops_size);
    }
  } else {
    console.log("Your webcam is either not connected or it lacks the metadata needed for this mode to function");

    for (let i = 0; i < drops_rate; i++) {
      let x = random(width);
      let y = random(height);

      let c = no_capture.get(int(x), int(y));
      //console.log(no_capture.get(int(x), int(y)));

      fill(c);
      noStroke();
      ellipse(x - width * 0.5, y - height * 0.5, drops_size, drops_size);
    }
  }
}

function loadmp4() {
  no_capture = createVideo('../assets/no_capture.mp4');
  no_capture.hide();
}

function setupmp4() {
  no_capture.size(width, height);
  no_capture.loop();
}