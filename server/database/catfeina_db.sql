-- ==========================================================
-- SCRIPT BASE DE DATOS CATFEINA 
-- Autor: Ana Isabel Navarro Jiménez
-- Estructura completa con gestión del catcafe
-- ==========================================================

-- 1 .LIMPIEZA Y CREACIÓN DE BASE DE DATOS
DROP DATABASE IF EXISTS catfeina_db;
CREATE DATABASE catfeina_db CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;
USE catfeina_db;

-- 2. ESTRUCTURA DE TABLAS
-- TABLA: ROL
CREATE TABLE Rol (
    id_rol INT PRIMARY KEY AUTO_INCREMENT,
    nombre_rol VARCHAR(50) NOT NULL,
    descripcion TEXT
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- TABLA: USUARIOS
CREATE TABLE Usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    id_rol INT,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(20), 
    password VARCHAR(255) NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE, 
    FOREIGN KEY (id_rol) REFERENCES Rol(id_rol) ON DELETE SET NULL,
    INDEX (id_rol)
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- TABLA: GATOS
CREATE TABLE Gatos (
    id_gato INT PRIMARY KEY AUTO_INCREMENT,
    nombre_gato VARCHAR(50) NOT NULL,
    fecha_nacimiento DATE,
    fecha_llegada DATE DEFAULT (CURRENT_DATE),
    sexo ENUM('Macho', 'Hembra') NOT NULL,
    raza VARCHAR(50) DEFAULT 'Común Europeo',
    color VARCHAR(50),
    esterilizado BOOLEAN DEFAULT FALSE,
    salud TEXT, 
    personalidad VARCHAR(100), 
    historia TEXT, 
    apto_perros BOOLEAN DEFAULT FALSE,
    apto_ninos BOOLEAN DEFAULT FALSE,
    apto_otros_gatos BOOLEAN DEFAULT TRUE,
    estado_adopcion ENUM('En Adopción', 'Reservado', 'Adoptado', 'No Disponible', 'Urgente', 'Residente VIP') DEFAULT 'En Adopción',
    imagen_url VARCHAR(255), 
    fecha_adopcion DATE DEFAULT NULL,
    activo BOOLEAN DEFAULT TRUE,
    INDEX (estado_adopcion),
    INDEX (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- TABLA: Gato_Imagenes
CREATE TABLE Gato_Imagenes (
    id_imagen INT PRIMARY KEY AUTO_INCREMENT,
    id_gato INT NOT NULL,
    url VARCHAR(255) NOT NULL,
    FOREIGN KEY (id_gato) REFERENCES Gatos(id_gato) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- TABLA: PADRINAZGOS
CREATE TABLE Padrinazgos (
    id_padrinazgo INT PRIMARY KEY AUTO_INCREMENT,
    id_gato INT,
    id_usuario INT,
    aportacion_mensual DECIMAL(10,2),
    fecha_inicio DATE,
    fecha_fin DATE,
    transferido_a INT DEFAULT NULL,
    archivado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_gato) REFERENCES Gatos(id_gato) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (transferido_a) REFERENCES Padrinazgos(id_padrinazgo) ON DELETE SET NULL,
    INDEX (id_usuario),
    INDEX (id_gato)
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- TABLA: SERVICIOS
CREATE TABLE Servicios (
    id_servicio INT PRIMARY KEY AUTO_INCREMENT,
    nombre_servicio ENUM('estandar', 'nomada', 'grupal', 'diario', 'residente') NOT NULL,
    descripcion TEXT,
    precio_hora DECIMAL(10,2),
    capacidad_max INT,
    activo BOOLEAN DEFAULT TRUE
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- TABLA: RESERVAS
CREATE TABLE Reservas (
    id_reserva INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT,
    id_servicio INT,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    num_personas INT NOT NULL DEFAULT 1, 
    tiempo_minutos INT DEFAULT 60,
    estado_reserva ENUM('Pendiente', 'Confirmada', 'Cancelada', 'Completada') DEFAULT 'Pendiente',
    pagado BOOLEAN DEFAULT FALSE,
    observaciones TEXT, 
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_servicio) REFERENCES Servicios(id_servicio) ON DELETE CASCADE,
    INDEX (fecha),
    INDEX (id_usuario)
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- TABLA: PRODUCTOS
CREATE TABLE Productos (
    id_producto INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    descripcion TEXT,
    precio DECIMAL(10,2),
    stock INT,
    categoria ENUM('Juguetes', 'Ropa', 'Merchandising', 'Muebles', 'Alimentación') DEFAULT 'Merchandising', 
    imagen_url VARCHAR(255),
    pedido_online BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (categoria)
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- TABLA: Producto_Imagenes
CREATE TABLE Producto_Imagenes (
    id_imagen INT PRIMARY KEY AUTO_INCREMENT,
    id_producto INT NOT NULL,
    url VARCHAR(255) NOT NULL,
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- TABLA: EVENTOS
CREATE TABLE Eventos (
    id_evento INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    hora TIME,
    ubicacion VARCHAR(100),
    categoria ENUM('Taller', 'Social', 'Noticia', 'Adopción Exitosa', 'Nueva Llegada', 'Coworking', 'Charla') DEFAULT 'Social',
    precio DECIMAL(10,2) DEFAULT 0.00,
    imagen_url VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    INDEX (fecha)
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- TABLA: INSCRIPCIONES
CREATE TABLE Inscripciones_Eventos (
    id_inscripcion INT PRIMARY KEY AUTO_INCREMENT,
    id_evento INT,
    id_usuario INT,
    fecha_inscripcion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado_pago ENUM('Pendiente', 'Pagado', 'Gratis') DEFAULT 'Pendiente',
    num_personas INT DEFAULT 1,
    observaciones TEXT,
    FOREIGN KEY (id_evento) REFERENCES Eventos(id_evento) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    INDEX (id_evento),
    INDEX (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- TABLA: PEDIDOS
CREATE TABLE Pedidos (
    id_pedido INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT,
    fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_pago DECIMAL(10,2),
    estado_envio ENUM('Preparando', 'Listo para recoger', 'Entregado', 'Cancelado') DEFAULT 'Preparando',
    pagado BOOLEAN DEFAULT TRUE,
    direccion_envio TEXT, 
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    INDEX (id_usuario)
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- TABLA: DETALLE PEDIDOS
CREATE TABLE Pedido_detalle (
    id_detalle INT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT,
    id_producto INT,
    cantidad INT,
    precio_unitario DECIMAL(10,2),
    FOREIGN KEY (id_pedido) REFERENCES Pedidos(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto) ON DELETE CASCADE,
    INDEX (id_pedido)
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- TABLA: COMENTARIOS
CREATE TABLE Comentarios (
    id_comentario INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT,
    puntuacion INT CHECK (puntuacion BETWEEN 1 AND 5),
    texto TEXT NOT NULL,
    fecha_comentario DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    INDEX (estado)
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- TABLA: GESTIÓN DE ADOPCIONES
CREATE TABLE Solicitudes_adopcion (
    id_solicitud INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_gato INT NOT NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('Pendiente', 'En Proceso', 'Aceptada', 'Rechazada') DEFAULT 'Pendiente',
    pdf_url VARCHAR(255), 
    motivo_decision TEXT,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_gato) REFERENCES Gatos(id_gato) ON DELETE CASCADE,
    INDEX (id_usuario),
    INDEX (id_gato)
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- ==========================================================
-- 3. DATOS INICIALES COMPLETOS
-- ==========================================================

-- ROLES
INSERT INTO Rol (id_rol, nombre_rol, descripcion) VALUES 
(1, 'Administrador', 'Acceso total al panel de control'),
(2, 'Empleado', 'Gestión de reservas y gatos'),
(3, 'Padrino', 'Usuario VIP con descuentos'),
(4, 'Miembro', 'Usuario registrado estándar');

-- USUARIOS 
INSERT INTO Usuarios (id_rol, nombre, apellidos, email, telefono, password) VALUES 
(1, 'Ana Isabel', 'Navarro', 'admin@catfeina.com', '600123456', '$2b$10$sQN5QyePwJfkRNjl9kBBc.6hPROxjlwZ7wM6RVBz7agVWHHOnmp4G'), -- admin1234.!
(2, 'Carlos', 'García', 'carlos@catfeina.com', '600987654', '$2b$10$P0FrI.vyxEFhURByCLbsQOodcd4dKJMtXtEbo30ItcsHIDXMcZ4H6'), -- carlos1234.!
(3, 'Maria', 'Lopez', 'maria@email.com', '600123459', '$2b$10$5y60rfS/rm9Mc7s3IpAGm.n9/SuS7Htplo3voJ.yaKbjS01XMXpCq'), -- maria1234.!
(4, 'Juan', 'Tomas', 'juan@email.com', '600123419', '$2b$10$uTgv9Cwqxw7eD/.prAwxuemccOuYa3nopowWOVj9dSkKx/gnmSmtO'); -- juan1234.!

-- GATOS 
INSERT INTO Gatos (nombre_gato, fecha_nacimiento, sexo, estado_adopcion, raza, color, esterilizado, personalidad, historia, apto_perros, apto_ninos, apto_otros_gatos, imagen_url) VALUES
('Kali', '2025-02-26', 'Hembra', 'Residente VIP', 'Común Europeo', 'Negro Azabache', TRUE, 'Juguetona y Reina', 'Kali es el origen de Catfeina. Fue la primera en llegar y su silueta negra inspiró nuestro logo. Es la reina absoluta del local: juguetona, divertida y siempre dispuesta a una carrera. Ella no busca hogar, porque ya tiene su hogar.', TRUE, TRUE, TRUE, 'kali.webp'),
('Dicotomía', '2023-09-10', 'Hembra', 'En Adopción', 'Maine Coon', 'Bicolor', TRUE, 'Mágica y Especial', 'Dicotomía es una obra de arte de la naturaleza. Su cara está perfectamente dividida en dos colores y posee heterocromía, una mutación que hace que sus ojos sean de distinto color. Es tranquila, elegante y sabe que es única en el mundo.', FALSE, FALSE, TRUE, 'dicotomia.webp'),
('Luna', '2021-03-15', 'Hembra', 'Residente VIP', 'Mestiza de pelo largo', 'Tricolor', TRUE, 'Protectora y sabia', 'Luna tiene un pasado difícil: nació en un criadero donde, al detectarle un soplo en el corazón, iban a sacrificarla porque \"no era vendible\". Nosotros la rescatamos justo a tiempo. Debido a su delicada condición cardíaca, que requiere medicación estricta y vigilancia diaria, decidimos que el estrés de una mudanza sería peligroso para ella. Así se convirtió en nuestra inquilina eterna. Ella es la \"Jefa de Recursos Felinos\": recibe a los gatos nuevos, pone paz y duerme en el mostrador vigilando a los clientes. Ella no busca hogar, porque Catfeina es su hogar.', FALSE, TRUE, TRUE, 'luna.webp'),
('Houdini', '2026-01-01', 'Macho', 'Urgente', 'Mestizo', 'Gris', TRUE, 'Escapista y Sociable', 'Houdini sobrevivió a un maltrato extremo encerrado en una jaula. Es un escapista profesional pero adora la compañía de otros gatos.', TRUE, FALSE, TRUE, 'houdini.webp'),
('Oliver', '2023-01-20', 'Macho', 'En Adopción', 'Mestizo', 'Naranja', FALSE, 'Dormilón y glotón', 'Oliver es la definición de vivir la buena vida. Es el gato más pacífico del mundo; su día consiste en una estricta rutina de siesta al sol, siesta en el sofá y siesta en tu regazo.', TRUE, TRUE, TRUE, 'oliver.webp'),
('Simba', '2024-02-15', 'Macho', 'En Adopción', 'Naranja Tabby', 'Naranja', TRUE, 'Juguetón', 'Haciendo honor a su nombre, Simba se cree el rey absoluto de la sala. Es extremadamente inteligente: ha aprendido a abrir puertas y cajones, así que ningún premio está a salvo con él.', TRUE, TRUE, TRUE, 'simba.webp'),
('Mia', '2025-01-10', 'Hembra', 'En Adopción', 'Mestizo', 'Tricolor', TRUE, 'Tranquila', 'Mia es dulzura en estado puro. Fue rescatada de una colonia donde los otros gatos no la dejaban comer por ser demasiado dócil. Tiene una mirada que te llega al alma.', FALSE, TRUE, TRUE, 'mia.webp'),
('Oreo', '2025-06-20', 'Macho', 'En Adopción', 'Común Europeo', 'Blanco y Negro', TRUE, 'Curioso', 'Un pequeño explorador vestido de etiqueta. Desde que llegó, no ha dejado un solo rincón sin inspeccionar; si traes una bolsa de la compra, Oreo tiene que ver qué hay dentro.', TRUE, TRUE, TRUE, 'oreo.webp'),
('Nube', '2025-10-05', 'Hembra', 'Reservado', 'Angora Mix', 'Gris Humo', FALSE, 'Dormilona', 'Nube hace honor a su nombre: parece una bolita de algodón flotando por la cafetería. Es tan suave que acariciarla es terapéutico. Su gran pasión es la tecnología.', FALSE, TRUE, TRUE, 'nube.webp'),
('Leo', '2025-02-01', 'Macho', 'En Adopción', 'Atigrado', 'Pardo', TRUE, 'Juguetón', 'Leo es incombustible. Tiene una reserva de energía infinita y es el mejor amigo de Simba; juntos organizan carreras de obstáculos por todo el local.', TRUE, FALSE, TRUE, 'leo.webp'),
('Raja', '2025-11-15', 'Macho', 'En Adopción', 'Siamés', 'Manchado', FALSE, 'Curioso', 'El benjamín del grupo. Fue encontrado maullando solito bajo un coche, sucio y hambriento, pero con la valentía de un tigre de bengala.', TRUE, TRUE, TRUE, 'raja.webp'),
('Freya', '2025-01-20', 'Hembra', 'En Adopción', 'Común Europeo', 'Blanco', TRUE, 'Curiosa', 'Elegante, misteriosa y con un porte aristocrático digno de la diosa nórdica. Freya rara vez pisa el suelo; le encantan las alturas.', FALSE, TRUE, TRUE, 'freya.webp'),
('Casper', '2024-08-12', 'Macho', 'Urgente', 'Ragdoll', 'Blanco y gris', TRUE, 'Miedoso y sensible', 'Casper es nuestro gato fantasma. Fue rescatada de una casa donde sufría acoso por parte de otros animales. Necesita ser el único rey de la casa.', FALSE, FALSE, FALSE, 'casper.webp'),
('Apolo', '2025-01-25', 'Macho', 'En Adopción', 'Siamés', 'Chocolate Point', TRUE, 'Tranquilo', 'Apolo es nuestro panel solar oficial. Tiene un radar especial para detectar dónde da el rayo de sol y tumbarse ahí durante horas.', TRUE, TRUE, TRUE, 'apolo.webp'),
('Brownie', '2025-11-20', 'Macho', 'En Adopción', 'Común Europeo', 'Marrón', FALSE, 'Amoroso y Dormilón', 'Brownie es pura dulzura concentrada en 3 meses de vida. Es un experto en encontrar el rincón más cómodo para sus siestas infinitas y le encanta que le acaricien la barriguita mientras duerme.', TRUE, TRUE, TRUE, 'brownie.webp'),
('Timón y Pumba', '2024-06-15', 'Macho', 'En Adopción', 'Siameses', 'Point', TRUE, 'Inseparables y Leales', 'Fueron abandonados juntos y desde entonces prometieron no soltarse nunca. Son dos almas en un solo corazón; donde va uno, va el otro. Por su bienestar emocional, solo se entregan en adopción conjunta.', FALSE, TRUE, TRUE, 'timonypumba.webp'),
('Mochi', '2024-05-10', 'Macho', 'Adoptado', 'Común europeo', 'Negro', TRUE, 'Aventurero y Dulce', 'Mochi fue el experto en parkour felino que llegó en una noche de tormenta. Pronto se ganó el corazón de todos con su curiosidad infinita. Ahora vive en una casa con jardín donde no para de explorar y jugar.', TRUE, TRUE, TRUE, 'mochi.webp'),
('Nala', '2023-11-12', 'Hembra', 'Adoptado', 'Mestizo', 'Gris Humo', TRUE, 'Reina del sofá', 'Nala llegó con un pelo muy descuidado y algo de miedo. Tras meses de mimos en Catfeina, recuperó su esplendor. Fue adoptada por una familia que le da todo el espacio y el amor que siempre mereció.', FALSE, TRUE, TRUE, 'nala.webp'),
('Simón', '2022-08-20', 'Macho', 'Adoptado', 'Común Europeo', 'Atigrado', TRUE, 'El gran mediador', 'Simón era el abuelo de la sala. Siempre ponía paz entre los más jóvenes y recibía a los nuevos con un lametón. Ahora disfruta de unas tardes tranquilas de sol y descanso en su hogar definitivo.', TRUE, FALSE, TRUE, 'simon.webp'),
('Koli', '2025-01-05', 'Hembra', 'Adoptado', 'Azul Ruso Mix', 'Gris Azulado', TRUE, 'Elegante y Observadora', 'Koli destacaba por su porte aristocrático y sus ojos verdes profundos. Aunque al principio era algo reservada, una vez que te elegía, el vínculo era para siempre. Ahora es la reina absoluta de su casa.', FALSE, FALSE, FALSE, 'koli.webp');

-- IMAGENES GATOS
INSERT INTO Gato_Imagenes (id_gato, url) VALUES 
(1, 'kali2.webp'), (1, 'kali3.webp'), (1, 'kali4.webp'), 
(2, 'dicotomia2.webp'), 
(3, 'luna2.webp'), (3, 'luna3.webp'), (3, 'luna4.webp'), (3, 'luna5.webp'), 
(4, 'houdini2.webp'), 
(5, 'oliver2.webp'), (5, 'olver3.webp'), (5, 'oliver4.webp'), 
(6, 'simba2.webp'), (6, 'simba3.webp'), (6, 'simba4.webp'), 
(7, 'mia2.webp'), (7, 'mia3.webp'), (7, 'mia4.webp'), 
(8, 'oreo2.webp'), (8, 'oreo3.webp'), (8, 'oreo4.webp'), 
(9, 'nube2.webp'), (9, 'nube3.webp'), 
(10, 'leo2.webp'), (10, 'leo3.webp'), 
(11, 'raja2.webp'), (11, 'raja3.webp'), (11, 'raja4.webp'), 
(12, 'freya2.webp'), (12, 'freya3.webp'), 
(13, 'casper2.webp'), (13, 'casper3.webp'), 
(14, 'apolo2.webp'), (14, 'apolo3.webp'), 
(15, 'brownie2.webp'), (15, 'brownie3.webp'), 
(16, 'timonypumba2.webp'), (16, 'timonypumba3.webp'), 
(18, 'nala2.webp');


-- PADRINAZGOS, SERVICIOS, RESERVAS (Originales)
INSERT INTO Padrinazgos (id_gato, id_usuario, aportacion_mensual, fecha_inicio) VALUES 
(1, 3, 15.00, '2026-01-10'), (5, 3, 10.00, '2026-02-15'), (17, 3, 5.00, '2026-01-05'), (18, 3, 10.00, '2026-01-20'), (19, 3, 25.00, '2026-02-01'), (20, 3, 5.00, '2026-02-10'), (3, 2, 20.00, '2026-02-05'); 

INSERT INTO Servicios (nombre_servicio, descripcion, precio_hora, capacidad_max) VALUES 
('estandar', 'Mesa para tomar café e interactuar con los gatos.', 4.00, 15),
('nomada', 'Wifi alta velocidad, bebida y dulce artesano.', 12.90, 10),
('grupal', 'Sala de reuniones privada 4K (min. 4 personas).', 12.90, 1),
('diario', 'Pase de día completo con snack y bebida.', 35.00, 5),
('residente', 'Membresía mensual con escritorio propio.', 400.00, 5);

INSERT INTO Reservas (id_usuario, id_servicio, fecha, hora_inicio, num_personas, estado_reserva, pagado, observaciones) VALUES 
(3, 3, '2026-03-15', '11:00:00', 4, 'Confirmada', TRUE, 'Reunión de planificación del equipo'),
(3, 4, '2026-03-20', '09:00:00', 1, 'Confirmada', TRUE, 'Jornada intensiva de estudio'),
(3, 1, '2026-02-28', '17:00:00', 2, 'Completada', TRUE, 'Merienda tranquila post-trabajo'),
(3, 2, '2026-02-10', '10:00:00', 1, 'Completada', TRUE, 'Sesión matinal de lectura'),
(4, 3, '2026-03-15', '11:00:00', 4, 'Confirmada', TRUE, 'Reunión de planificación del equipo'),
(4, 4, '2026-03-20', '09:00:00', 1, 'Confirmada', TRUE, 'Jornada intensiva de estudio'),
(4, 1, '2026-02-28', '17:00:00', 2, 'Completada', TRUE, 'Merienda tranquila post-trabajo'),
(4, 2, '2026-02-10', '10:00:00', 1, 'Completada', TRUE, 'Sesión matinal de lectura');

-- PRODUCTOS
INSERT INTO Productos (nombre, descripcion, precio, stock, categoria, imagen_url) VALUES 
('Pack enrequicimiento natural artesanal', 'Experiencia de enriquecimiento definitiva con este set de regalo con los 18 juguetes que hacemos en nuestro taller, hechos a mano con materiales naturales y ecológicos. Perfecto para los gatos mas curiosos.', 20.00, 100, 'Juguetes', 'tienda-loteregalo.webp'),
('Traje de recuperación', 'Traje artesana para la recuperación de intervenciones, en especial para el postoperatorio de esterilizaciones. Agarre especial para facilitar el movimiento y las curas de tu pequeño.', 5.50, 50, 'Juguetes', 'tienda-trajerecuperacion.webp'),
('Bolas ecologicas de Catnip', 'Pack de bolas de fieltro prensado con hieba gatera, 100% lana natural.', 5.50, 50, 'Juguetes', 'tienda-bolascatnip.webp'),
('Gatitos Crochet Amigurumi', 'Gatitos hechos a mano con técnica crochet. Suaves y seguros.', 15.00, 8, 'Juguetes', 'tienda-gatitoscrotchet.webp'),
('Peluche sensorial Corazón', 'Juguete de enrequicimiento con valeriana natural. Gracias a las diferentes texturas, sonidos y olores estimulan los sentidos de tu gato. Fomenta el juego activo.', 4.50, 40, 'Juguetes', 'tienda-juguetecorazon.webp'),
('Caña de pescar de Pulpo', 'Divertido pulpo de peluche artesano con hilo seguro para gatos con tecnica de crotché. Irresistible.', 8.90, 25, 'Juguetes', 'tienda-pulpo.webp'),
('Ratón Clásico con Cascabel', 'El juguete infalible. Pack de 2 ratones con sonido de cascabel, hecho con tela de alta calidad para soportar a los gatos más curiosos.', 3.50, 100, 'Juguetes', 'tienda-raton.webp'),
('Sudadera Catfeina', 'Sudadera premium , opciones con o sin capucha y logo bordado. Unisex y sostenible.', 24.00, 15, 'Ropa', 'tienda-sudadera.webp'),
('Taza Catfeina "Miau"', 'Taza de cerámica mate con ilustración original de catfeina.', 12.50, 60, 'Merchandising', 'tienda-taza.webp'),
('Totebag "Save a Life"', 'Bolsa de tela de algodón reciclado. Gran capacidad y resistencia.', 10.00, 80, 'Merchandising', 'tienda-totebag.webp'),
('Cama trenzada de lana Azul', 'Cama tejida a mano con lana de primera calidad suave y cómoda. Su diseño afelpado ofrece un espacio seguro y reconfortante para que se acurruque y se sienta seguro.', 29.90, 15, 'Muebles', 'tienda-cama-azul.webp'),
('Cama trenzada de lana Gris Perla', 'Cama tejida a mano con lana de primera calidad suave y cómoda. Su diseño afelpado ofrece un espacio seguro y reconfortante para que se acurruque y se sienta seguro.', 24.50, 20, 'Muebles', 'tienda-cama-gris.webp'),
('Cama Artesanal Hilo Trenzado', 'Hecha a mano con algodón 100% natural. Fresca para el verano y acogedora.', 32.00, 10, 'Muebles', 'tienda-cama-hilo-trenzado.webp'),
('Rascador Corazón Pasión', 'Rascador vertical con base estable y juguete de corazón rojo. Decorativo y funcional.', 19.95, 12, 'Muebles', 'tienda-rascador-corazon-rojo.webp'),
('Rascador Corazón Ébano', 'Versión elegante en negro azabache de nuestro rascador de corazón.', 19.95, 10, 'Muebles', 'tienda-rascador-corazon-negro.webp'),
('Snacks Pollo Liofilizado', 'Premios 100% naturales de pechuga de pollo. Sin aditivos ni conservantes.', 6.95, 45, 'Alimentación', 'tienda-premios.webp');

-- IMAGENES PRODUCTOS
INSERT INTO Producto_Imagenes (id_producto, url) VALUES 
(1, 'tienda-loteregalo2.webp'), 
(2, 'tienda-trajerecuperacion2.webp'),(2, 'tienda-trajerecuperacion3.webp'), 
(3, 'tienda-bolascatnip2.webp'),(3, 'tienda-bolascatnip3.webp'), 
(4, 'tienda-gatitoscrotchet2.webp'),
(5, 'tienda-juguetecorazon2.webp'),
(6, 'tienda-pulpo2.webp'), (6, 'tienda-pulpo3.webp'), 
(7, 'tienda-raton2.webp'),
(10, 'tienda-totebag2.webp'),
(10, 'tienda-totebag3.webp'),
(11, 'tienda-cama-azul2.webp'),
(12, 'tienda-cama-gris2.webp'),
(14, 'tienda-rascador-corazon-rojo2.webp'),
(14, 'tienda-rascador-corazon-rojo3.webp'), 
(16, 'tienda-premios2.webp');


-- EVENTOS 
INSERT INTO Eventos (titulo, descripcion, fecha, hora, ubicacion, categoria, precio, imagen_url) VALUES 
('Yoga entre Ronroneos', 'Una experiencia de relajación total rodeado de nuestros gatos residentes. Practica tus asanas mientras los gatos pasean entre las esterillas. La vibración de sus ronroneos ayuda a profundizar en la meditación.', '2026-04-10', '09:30:00', 'Sala Zen (Coworking)', 'Social', 15.00, 'evento-gato-yoga.webp'),
('Taller de Latte Art & Matcha', 'Aprende a crear figuras felinas en tu café o matcha ceremonial. Nuestros baristas te enseñarán la técnica del vertido libre y el dibujo con punzón.', '2026-04-15', '17:00:00', 'Barra Principal', 'Taller', 20.00, 'evento-latteart-gato.webp'),
('Pequeños Cuidadores (+6 años)', 'Un evento educativo donde los más pequeños aprenderán el lenguaje corporal gatuno, cómo acariciarlos correctamente y la importancia de la adopción responsable.', '2026-04-22', '11:00:00', 'Zona Lounge', 'Social', 10.00, 'evento-clase-aprendizaje-niños.webp'),
('Masterclass: Cuidados Felinos', 'Charla técnica sobre nutrición, salud y enriquecimiento ambiental. Aprende de la mano de expertos cómo mejorar la vida de tu compañero.', '2026-04-05', '18:30:00', 'Sala Grupal', 'Charla', 5.00, 'evento-cuidados-gato.webp'),
('Noche de Juegos de Mesa', 'Disfruta de nuestra ludoteca de más de 50 títulos en la mejor compañía. Una noche social perfecta para conocer a otros catlovers mientras juegas una partida de Catan.', '2026-04-12', '19:00:00', 'Zona Lounge', 'Social', 12.00, 'evento-.juegos-de-mesa.webp'),
('Taller de Crochet: Michis', 'Aprende a tejer divertidos juguetes rellenos de catnip para tus compañeros felinos. No se requiere experiencia previa. Todos los materiales están incluidos.', '2026-04-20', '11:00:00', 'Zona Creativa', 'Taller', 10.00, 'tienda-pulpo2.webp');


-- COMENTARIOS
INSERT INTO Comentarios (id_usuario, puntuacion, texto, estado) VALUES 
(4, 1, 'No he ido porque no me gustan los pelos en la comida.', 'rechazado'),
(2, 5, 'Entrar en Catfeina es como entrar en un oasis de paz. Ver a Luna durmiendo plácidamente en el mostrador te recuerda lo importante que es dar segundas oportunidades. Es un lugar con alma y un café excelente.', 'aprobado'),
(3, 5, 'Kali me robó el corazón con su energía. La tranquilidad que transmiten estos michis mientras disfrutas de un matcha es algo que todo el mundo debería experimentar. Volveré seguro.', 'aprobado'),
(4, 5, 'Pasamos una noche de juegos increíble. Oliver no paraba de intentar \"ayudarnos\" con las fichas del tablero. Es maravilloso ver lo bien cuidados que están y la labor tan bonita que hace todo el equipo.', 'aprobado'),
(4, 5, 'Adopté a Nala hace unos meses y es la mejor decisión que he tomado. El proceso de adopción fue muy serio y profesional, se nota que lo primero es el bienestar del animal. ¡Gracias por todo!', 'aprobado');

-- INSCRIPCIONES A EVENTOS
INSERT INTO Inscripciones_Eventos (id_evento, id_usuario, estado_pago, num_personas) VALUES 
(1, 3, 'Pagado', 1), 
(2, 3, 'Pendiente', 2),
(3, 3, 'Pagado', 3), 
(4, 3, 'Pendiente', 4),
(1, 4, 'Pagado', 1), 
(2, 4, 'Pendiente', 2),
(3, 4, 'Pagado', 2),
(5, 4, 'Pagado', 1), 
(6, 4, 'Pagado', 2);

-- PEDIDOS
INSERT INTO Pedidos (id_pedido, id_usuario, total_pago, estado_envio, pagado) VALUES
(105, 3, 56.85, 'Entregado', TRUE),
(106, 3, 36.50, 'Preparando', TRUE),
(107, 4, 38.85, 'Listo para recoger', TRUE),
(108, 4, 29.50, 'Preparando', TRUE);

INSERT INTO Pedido_detalle (id_pedido, id_producto, cantidad, precio_unitario) VALUES
(105, 11, 1, 29.90), 
(105, 1, 1, 20.00),  
(105, 16, 1, 6.95),  
(106, 8, 1, 24.00), 
(106, 9, 1, 12.50),  
(107, 14, 1, 19.95), 
(107, 6, 1, 8.90),  
(107, 10, 1, 10.00), 
(108, 4, 1, 15.00),  
(108, 3, 1, 5.50),  
(108, 2, 1, 5.50),   
(108, 7, 1, 3.50);  


-- SOLICITUDES DE ADOPCIÓN 
INSERT INTO Solicitudes_adopcion (id_usuario, id_gato, estado, pdf_url) VALUES 
(3, 2, 'Pendiente', '/uploads/adopciones/solicitud-maria-dicotomia-73.pdf'),
(3, 16, 'En proceso', '/uploads/adopciones/solicitud-maria-timonypumba-73.pdf');

