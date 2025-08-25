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
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }

  console.log("🧪 Intentando autenticar en AD:", usuario);


  ad.authenticate(usuario, password, (err, auth) => {
    if (err) {
      console.error('❌ Error en autenticación AD:', err.message);
      return res.status(500).json({ message: 'Error en autenticación AD', debug: err.message });
    }

    if (!auth) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    console.log(`✅ Usuario autenticado en AD: ${usuario}`);

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
          WHERE LOWER(u.Nombre) = LOWER(@nombre)
        `;

      let user = null;
      const request = new Request(sql, (err, rowCount) => {
        connection.close();

        if (err) {
          console.error('❌ Error consulta BD:', err.message);
          return res.status(500).json({ message: "Error consulta BD" });
        }

        if (!user) {
          console.log("🔍 Comparando en BD con usuarioAD:", usuario);
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

      request.addParameter('nombre', TYPES.VarChar, usuario);
      console.log("🔍 Comparando en BD con nombre:", usuario);
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

// Ruta de prueba
app.get("/api/test", (req, res) => {
  console.log("🔍 Authorization:", req.get("Authorization") || "NO PRESENTE");
  console.log("🍪 Cookies:", req.get("Cookie") || "NO COOKIES");
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// 🔹 RUTA SSO MEJORADA
app.get('/api/auth/ssologin',
  (req, res, next) => {
    console.log('\n🔍 === INICIO DE AUTENTICACIÓN SSO ===');
    console.log('🕒 Timestamp:', new Date().toISOString());
    console.log('🌐 User-Agent:', req.get('User-Agent'));
    console.log('🔑 Authorization Header:', req.get('Authorization') || 'NO PRESENTE');
    console.log('🍪 Cookies:', req.get('Cookie') || 'NO COOKIES');
    console.log('🌍 Remote Address:', req.connection.remoteAddress);
    console.log('🔗 Host:', req.get('Host'));
    
    // Headers específicos para autenticación Windows
    res.setHeader("WWW-Authenticate", "Negotiate, NTLM");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    
    console.log('=====================================\n');
    next();
  },
  
  // Middleware de autenticación con manejo mejorado de errores
  (req, res, next) => {
    console.log('🔐 Iniciando autenticación Passport...');
    
    passport.authenticate('WindowsAuthentication', {
      session: false,
      failWithError: true
    })(req, res, (err) => {
      if (err) {
        console.error('❌ Error en Passport authenticate:', err);
        return next(err);
      }
      console.log('✅ Passport authenticate completado exitosamente');
      next();
    });
  },
  
  // Handler de éxito
  (req, res) => {
    try {
      console.log('🎉 Autenticación exitosa - procesando usuario...');
      console.log('👤 Objeto user completo:', JSON.stringify(req.user, null, 2));

      const usuarioAD = req.user.usuarioAD || 
                       req.user._json?.sAMAccountName || 
                       req.user.sAMAccountName ||
                       req.user._json?.userPrincipalName?.split('@')[0];
                       
      console.log('👤 UsuarioAD extraído final:', usuarioAD);

      if (!usuarioAD) {
        console.error('❌ No se pudo extraer usuario de Active Directory');
        console.log('🔍 Propiedades disponibles en req.user:', Object.keys(req.user));
        console.log('🔍 req.user._json keys:', req.user._json ? Object.keys(req.user._json) : 'No _json');
        
        return res.status(500).json({
          message: "Error: No se pudo obtener información del usuario desde AD",
          debug: {
            userKeys: Object.keys(req.user),
            jsonKeys: req.user._json ? Object.keys(req.user._json) : null
          }
        });
      }

      // Conectar a la base de datos para validar usuario
      const connection = new Connection(dbConfig);
      
      connection.on('connect', (err) => {
        if (err) {
          console.error('❌ Error conexión BD:', err.message);
          return res.status(500).json({ 
            message: "Error de conexión a la base de datos",
            debug: err.message
          });
        }

        console.log('🔍 Buscando usuario en BD:', usuarioAD);
        
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
            return res.status(500).json({ 
              message: "Error en consulta de base de datos",
              debug: err.message
            });
          }
          
          console.log('📊 Filas encontradas en BD:', rowCount);
          
          if (!user) {
            console.error('❌ Usuario no encontrado en BD:', usuarioAD);
            return res.status(403).json({ 
              message: `Usuario '${usuarioAD}' no está registrado en el sistema`,
              help: "Contacte al administrador para que agregue su usuario a la base de datos"
            });
          }
          
          if (!user.Activo) {
            console.error('❌ Usuario inactivo:', usuarioAD);
            return res.status(403).json({ 
              message: "Usuario inactivo. Contacte al administrador.",
              usuario: usuarioAD
            });
          }

          console.log('✅ Usuario encontrado y activo:', user.Nombre);

          // Generar JWT
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

          // Preparar datos del usuario para el frontend
          const userData = {
            id: user.IdUsuario,
            nombre: user.Nombre,
            usuarioAD: user.UsuarioAD,
            rol: user.Rol ? user.Rol.toLowerCase().trim() : null,  // 👈 aquí llega "Administrador", "Sistemas"
            area: user.Area ? user.Area.toLowerCase().trim() : null,
            activo: user.Activo
          };


          console.log('🎫 Token generado exitosamente para:', user.Nombre);
          console.log('📤 Enviando respuesta exitosa');
          
          res.json({ 
            token, 
            user: userData,
            message: "Autenticación exitosa",
            timestamp: new Date().toISOString()
          });
        });

        request.on('row', (cols) => {
          user = {};
          cols.forEach(c => {
            user[c.metadata.colName] = c.value;
            console.log(`  - ${c.metadata.colName}: ${c.value}`);
          });
        });

        request.addParameter('usuarioAD', TYPES.VarChar, usuarioAD);
        connection.execSql(request);
      });
      
      connection.connect();
      
    } catch (error) {
      console.error('❌ Error inesperado en handler de éxito:', error);
      res.status(500).json({
        message: "Error interno del servidor",
        debug: error.message
      });
    }
  },

  // Error handler mejorado
  (err, req, res, next) => {
    console.error('❌ Error en autenticación SSO completo:', err);
    console.error('❌ Error stack:', err.stack);
    
    // Si ya se envió respuesta, no hacer nada
    if (res.headersSent) {
      return next(err);
    }
    
    // Diferentes tipos de errores
    if (err.message && (err.message.includes('LDAP') || err.message.includes('ldap'))) {
      return res.status(500).json({
        message: "Error de conexión con Active Directory",
        help: "Contacte al administrador del sistema",
        debug: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    if (err.status === 401 || err.message?.includes('401') || err.message?.includes('Unauthorized')) {
      return res.status(401).json({
        message: "Credenciales requeridas o inválidas",
        help: "Use sus credenciales de Windows del dominio",
        action: "retry"
      });
    }
    
    // Error de credenciales
    if (err.message?.includes('credentials') || err.message?.includes('password') || err.message?.includes('authentication')) {
      return res.status(401).json({
        message: "Usuario o contraseña incorrectos",
        help: "Verifique sus credenciales de Windows",
        action: "retry"
      });
    }
    
    // Error genérico
    res.status(500).json({
      message: "Error de autenticación",
      help: "Intente nuevamente o contacte al administrador",
      debug: process.env.NODE_ENV === 'development' ? err.message : undefined,
      action: "retry"
    });
  }
);

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