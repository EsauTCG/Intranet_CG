const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Connection, Request, TYPES } = require('tedious');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const passport = require('passport');
const WindowsStrategy = require('passport-windowsauth');

const app = express();
const PORT = process.env.PORT; 
const SECRET_KEY = process.env.JWT_SECRET;

app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
  res.setHeader('Access-Control-Expose-Headers', 'Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['Authorization']
}));

// Configuración de conexión a SQL Server
const dbConfig = {
  server: process.env.DB_SERVER,
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    }
  },
  options: {
    database: process.env.DB_DATABASE,
    trustServerCertificate: true,
    encrypt: false,
    port: parseInt(process.env.DB_PORT, 10)
  }
};

const ActiveDirectory = require('activedirectory2');

const adConfig = {
  url: process.env.AD_URL,
  baseDN: process.env.AD_BASE_DN,
  username: process.env.AD_USER,
  password: process.env.AD_PASSWORD
};
const ad = new ActiveDirectory(adConfig);

app.post('/api/auth/login', express.json(), (req, res) => {
   const { usuario: rawUsuario, password } = req.body;

  if (!rawUsuario || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }

  const usuarioADAuth = rawUsuario;

  let usuarioAD = rawUsuario;
  if (usuarioAD.includes("\\")) {
    usuarioAD = usuarioAD.split("\\")[1];
  } else if (usuarioAD.includes("@")) {
    usuarioAD = usuarioAD.split("@")[0];
  }

  console.log("🧪 Autenticando en AD con:", usuarioADAuth);
  console.log("🔍 Normalizado para BD (sAMAccountName):", usuarioAD);


  ad.authenticate(usuarioADAuth, password, (err, auth) => {
    if (err) {
      console.error('❌ Error en autenticación AD:', err.message);
      return res.status(500).json({ message: 'Error en autenticación AD', debug: err.message });
    }

    if (!auth) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    console.log(`✅ Usuario autenticado en AD: ${usuarioADAuth}`);

    // Aquí validamos si existe en tu BD
    const connection = new Connection(dbConfig);

    connection.on('connect', (err) => {
      if (err) {
        console.error('❌ Error conexión BD:', err.message);
        return res.status(500).json({ message: "Error conexión BD" });
      }

        const sql = `
          SELECT u.IdUsuario, u.Nombre, u.UsuarioAD, u.Activo,
                r.NombreRol as Rol, a.NombreArea as Area
          FROM Usuarios u
          LEFT JOIN Roles r ON u.IdRol = r.IdRol
          LEFT JOIN Areas a ON u.IdArea = a.IdArea
          WHERE LOWER(u.UsuarioAD) = LOWER(@usuarioAD)
        `;

      let user = null;
      const request = new Request(sql, (err, rowCount) => {
        connection.close();

        if (err) {
          console.error('❌ Error consulta BD:', err.message);
          return res.status(500).json({ message: "Error consulta BD" });
        }

        if (!user) {
          console.log("🔍 Comparando en BD con usuarioAD:", usuarioAD);
          return res.status(403).json({ message: "Usuario no registrado en sistema" });
        }

        if (!user.Activo) {
          return res.status(403).json({ message: "Usuario inactivo" });
        }

        const token = jwt.sign(
          {
            id: user.IdUsuario,
            rol: user.Rol || 'empleado',
            area: user.Area || 'general',
            usuarioAD: user.UsuarioAD
          },
          SECRET_KEY,
          { expiresIn: '8h' }
        );

        res.json({ token, user });
      });

      request.on('row', (cols) => {
        user = {};
        cols.forEach(c => {
          user[c.metadata.colName] = c.value;
        });
      });

      request.addParameter('usuarioAD', TYPES.VarChar, usuarioAD);
      console.log("🔍 Comparando en BD con nombre:", usuarioAD);
      connection.execSql(request);
    });

    connection.connect();
  });
});


console.log('🔧 Variables de entorno AD:');
console.log('AD_URL:', process.env.AD_URL || 'NO CONFIGURADO');
console.log('AD_BASE_DN:', process.env.AD_BASE_DN || 'NO CONFIGURADO');
console.log('AD_USER:', process.env.AD_USER ? '***configurado***' : 'NO CONFIGURADO');
console.log('AD_PASSWORD:', process.env.AD_PASSWORD ? '***configurado***' : 'NO CONFIGURADO');

// ✅ CONFIGURACIÓN CORREGIDA DE PASSPORT WINDOWSAUTH
console.log('🔧 Configurando estrategia Windows Authentication...');

// Verificar que las variables de entorno estén completas
if (!process.env.AD_USER || !process.env.AD_PASSWORD || !process.env.AD_URL || !process.env.AD_BASE_DN) {
  console.warn('⚠️ ADVERTENCIA: Variables de entorno AD incompletas. Usando configuración básica.');
  
  // Configuración básica sin LDAP (solo autenticación integrada)
  passport.use(new WindowsStrategy({
    integrated: true,
    passReqToCallback: false
  }, (profile, done) => {
    console.log('✅ Autenticación Windows básica exitosa!');
    console.log('👤 Perfil:', JSON.stringify(profile, null, 2));
    
    // Extraer usuario de diferentes formas
    const usuarioAD = profile._json?.sAMAccountName || 
                     profile.sAMAccountName || 
                     profile._json?.userPrincipalName?.split('@')[0] ||
                     profile.displayName?.toLowerCase();
                     
    console.log('👤 Usuario extraído:', usuarioAD);
    return done(null, { ...profile, usuarioAD });
  }));
  
} else {
  // Configuración completa con LDAP
  try {
    // Formatear correctamente el DN del usuario
    const userDN = `CN=${process.env.AD_USER},${process.env.AD_BASE_DN}`;
    console.log('🔗 User DN construido:', userDN);
    
    passport.use(new WindowsStrategy({
      integrated: true,
      passReqToCallback: false,
      ldap: {
        url: process.env.AD_URL,
        base: process.env.AD_BASE_DN,
        username: userDN, // ✅ DN completo en lugar de solo el username
        password: process.env.AD_PASSWORD
      }
    }, (profile, done) => {
      console.log('✅ Autenticación Windows con LDAP exitosa!');
      console.log('👤 Perfil completo:', JSON.stringify(profile, null, 2));
      
      const usuarioAD = profile._json?.sAMAccountName || 
                       profile.sAMAccountName || 
                       profile._json?.userPrincipalName?.split('@')[0] ||
                       profile.displayName?.toLowerCase();
                       
      console.log('👤 Usuario extraído:', usuarioAD);
      return done(null, { ...profile, usuarioAD });
    }));
    
    console.log('✅ Estrategia Windows con LDAP configurada correctamente');
    
  } catch (error) {
    console.error('❌ Error al configurar LDAP, usando configuración básica:', error.message);
    
    // Fallback a configuración básica
    passport.use(new WindowsStrategy({
      integrated: true,
      passReqToCallback: false
    }, (profile, done) => {
      console.log('✅ Autenticación Windows básica (fallback) exitosa!');
      console.log('👤 Perfil:', JSON.stringify(profile, null, 2));
      
      const usuarioAD = profile._json?.sAMAccountName || 
                       profile.sAMAccountName || 
                       profile._json?.userPrincipalName?.split('@')[0] ||
                       profile.displayName?.toLowerCase();
                       
      return done(null, { ...profile, usuarioAD });
    }));
  }
}

app.use(passport.initialize());

// Función para probar la conexión SQL
const testConnection = () => {
  const connection = new Connection(dbConfig);
  
  connection.on('connect', (err) => {
    if (err) {
      console.error('❌ Error de conexión SQL:', err.message);
    } else {
      console.log('✅ Conexión exitosa a SQL Server');
      connection.close();
    }
  });
  
  connection.connect();
};

testConnection();

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ message: 'Token requerido' });
  }
  
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }
    req.userId = decoded.id;
    next();
  });
};

// Ruta para debug de configuración
app.get('/api/auth/debug', (req, res) => {
  const authHeader = req.get('Authorization');
  const hasNTLM = authHeader?.includes('NTLM');
  const hasNegotiate = authHeader?.includes('Negotiate');
  
  res.json({
    timestamp: new Date().toISOString(),
    server: {
      port: PORT,
      nodeEnv: process.env.NODE_ENV || 'development'
    },
    headers: {
      authorization: authHeader ? `${authHeader.substring(0, 20)}...` : 'NO PRESENTE',
      userAgent: req.get('User-Agent'),
      host: req.get('Host'),
      connection: req.get('Connection')
    },
    auth: {
      hasNTLM,
      hasNegotiate,
      hasAnyAuth: hasNTLM || hasNegotiate
    },
    environment: {
      adConfigured: !!(process.env.AD_URL && process.env.AD_BASE_DN && process.env.AD_USER && process.env.AD_PASSWORD),
      adUrl: process.env.AD_URL ? 'configurado' : 'no configurado',
      adBaseDn: process.env.AD_BASE_DN ? 'configurado' : 'no configurado'
    }
  });
});

// Resto de rutas existentes...
app.get('/api/auth/me', verifyToken, (req, res) => {
  const connection = new Connection(dbConfig);
  
  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ message: "Error de conexión" });
    }
    
    const sql = `
      SELECT 
        u.IdUsuario,
        u.Nombre,
        u.Correo,
        u.UsuarioAD,
        u.Activo,
        r.NombreRol as Rol,
        a.NombreArea as Area
      FROM Usuarios u
      LEFT JOIN Roles r ON u.IdRol = r.IdRol
      LEFT JOIN Areas a ON u.IdArea = a.IdArea
      WHERE u.IdUsuario = @userId
    `;
    
    let user = null;
    
    const request = new Request(sql, (err, rowCount) => {
      connection.close();
      
      if (err) {
        return res.status(500).json({ message: "Error en consulta" });
      }
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      res.json({
        id: user.IdUsuario,
        nombre: user.Nombre,
        email: user.Correo,
        usuarioAD: user.UsuarioAD,
        rol: (user.Rol || 'empleado').toLowerCase(),
        area: (user.Area || 'general').toLowerCase(),
        activo: user.Activo
      });
    });
    
    request.on('row', (columns) => {
      user = {};
      columns.forEach(column => {
        user[column.metadata.colName] = column.value;
      });
    });
    
    request.addParameter('userId', TYPES.Int, req.userId);
    connection.execSql(request);
  });
  
  connection.connect();
});

// Ruta para obtener todos los recursos
app.get('/api/recursos', verifyToken, (req, res) => {
  const recursosEstaticos = [
    {
      categoria: "Manuales",
      items: [
        {
          nombre: "Manual del Usuario",
          url: "/docs/manual-usuario.pdf",
          roles: ["admin", "supervisor", "empleado"],
          areas: ["todas"]
        }
      ]
    }
  ];
  
  res.json(recursosEstaticos);
});

// Ruta de cumpleaños
app.get("/api/cumple-hoy", (req, res) => {
  const connection = new Connection(dbConfig);

  connection.on("connect", (err) => {
    if (err) {
      console.error("❌ Error al conectar:", err.message);
      return res.status(500).json({ error: "Error de conexión" });
    }

    const hoy = new Date();
    const dia = hoy.getDate();
    const mes = hoy.getMonth() + 1;

    const sql = `
      SELECT Nombre, FechaNacimiento
      FROM Usuarios
      WHERE DAY(FechaNacimiento) = @dia
        AND MONTH(FechaNacimiento) = @mes
        AND Activo = 1
    `;

    const cumpleanieros = [];

    const request = new Request(sql, (err) => {
      connection.close();

      if (err) {
        console.error("❌ Error en consulta:", err.message);
        return res.status(500).json({ error: "Error en consulta" });
      }

      res.json({
        tieneCumple: cumpleanieros.length > 0,
        nombres: cumpleanieros.map(c => c.Nombre),
        detalles: cumpleanieros
      });
    });

    request.on("row", (columns) => {
      const persona = {};
      columns.forEach(col => {
        persona[col.metadata.colName] = col.value;
      });
      cumpleanieros.push(persona);
    });

    request.addParameter("dia", TYPES.Int, dia);
    request.addParameter("mes", TYPES.Int, mes);
    connection.execSql(request);
  });

  connection.connect();
});

// Rutas para Carousel
app.get("/api/carousel", (req, res) => {
  const connection = new Connection(dbConfig);

  connection.on("connect", (err) => {
    if (err) {
      console.error("❌ Error de conexión:", err.message);
      return res.status(500).json({ error: "Error de conexión" });
    }

    const sql = `
      SELECT Id, Title, Text, Image, CreatedAt
      FROM Carousel
      WHERE IsActive = 1
      ORDER BY CreatedAt DESC
    `;

    const slides = [];

    const request = new Request(sql, (err) => {
      connection.close();

      if (err) {
        console.error("❌ Error en consulta:", err.message);
        return res.status(500).json({ error: "Error en consulta" });
      }

      res.json(slides);
    });

    request.on("row", (columns) => {
      const slide = {};
      columns.forEach(col => {
        slide[col.metadata.colName] = col.value;
      });
      slides.push(slide);
    });

    connection.execSql(request);
  });

  connection.connect();
});


/* Ruta Carousel POST */

const multer = require('multer');
const path = require('path');

// Configurar multer para subir archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Asegúrate de que esta carpeta existe
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// Modificar tu ruta POST
app.post("/api/carousel", upload.single('image'), (req, res) => {
  const { title, text } = req.body;
  const imageFile = req.file;

  if (!title || !imageFile) {
    return res.status(400).json({ error: "Se requiere título e imagen" });
  }

  // La URL de la imagen será la ruta del archivo
  const imageUrl = `/uploads/${imageFile.filename}`;

  const connection = new Connection(dbConfig);

  connection.on("connect", (err) => {
    if (err) {
      console.error("❌ Error de conexión:", err.message);
      return res.status(500).json({ error: "Error de conexión" });
    }

    const sql = `
      INSERT INTO Carousel (Title, Text, Image, IsActive)
      VALUES (@title, @text, @image, 1)
    `;

    const request = new Request(sql, (err) => {
      connection.close();

      if (err) {
        console.error("❌ Error en insert:", err.message);
        return res.status(500).json({ error: "Error al insertar" });
      }

      res.json({ success: true, message: "✅ Slide agregado correctamente" });
    });

    request.addParameter("title", TYPES.NVarChar, title);
    request.addParameter("text", TYPES.NVarChar, text || null);
    request.addParameter("image", TYPES.NVarChar, imageUrl);

    connection.execSql(request);
  });

  connection.connect();
});

// Servir archivos estáticos
app.use('/uploads', express.static('uploads'));


// Debug de usuarios
app.get('/api/debug/usuarios', (req, res) => {
  const connection = new Connection(dbConfig);
  
  connection.on('connect', (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const sql = `
      SELECT TOP 255 
        u.IdUsuario,
        u.Nombre,
        u.UsuarioAD,
        u.Activo,
        r.NombreRol,
        a.NombreArea
      FROM Usuarios u
      LEFT JOIN Roles r ON u.IdRol = r.IdRol
      LEFT JOIN Areas a ON u.IdArea = a.IdArea
    `;
    
    const users = [];
    
    const request = new Request(sql, (err, rowCount) => {
      connection.close();
      
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ rowCount, users, totalFound: users.length });
    });

    request.on('row', (columns) => {
      const user = {};
      columns.forEach(column => {
        user[column.metadata.colName] = column.value;
      });
      users.push(user);
    });

    connection.execSql(request);
  });
  
  connection.connect();
});

// Logout
app.post('/api/auth/logout', verifyToken, (req, res) => {
  res.json({ message: 'Logout exitoso' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend corriendo en http://0.0.0.0:${PORT}`);
  console.log(`🔗 Configuración AD: ${process.env.AD_URL ? 'Completa' : 'Básica'}`);
});