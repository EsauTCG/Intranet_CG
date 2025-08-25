const ActiveDirectory = require('activedirectory2');
require('dotenv').config();

const configAD = {
    url: process.env.AD_URL, 
    baseDN: process.env.AD_BASE_DN,   
    username: process.env.AD_USER,
    password: process.env.AD_PASSWORD,
    
    // Configuraciones adicionales importantes:
    attributes: {
        user: ['dn', 'userPrincipalName', 'sAMAccountName', 'mail', 'displayName', 'cn'],
        group: ['dn', 'cn', 'description']
    },
    
    // Configuraciones de conexión
    reconnect: true,
    connectTimeout: 10000,
    timeout: 10000,
    
    // Para evitar problemas con certificados SSL (solo en desarrollo)
    tlsOptions: {
        rejectUnauthorized: false
    }
};

console.log('🔧 Configuración AD:', {
    url: configAD.url,
    baseDN: configAD.baseDN,
    username: configAD.username ? '***configurado***' : 'NO CONFIGURADO',
    password: configAD.password ? '***configurado***' : 'NO CONFIGURADO'
});

const ad = new ActiveDirectory(configAD);

// Solo prueba la autenticación primero
ad.authenticate(configAD.username, configAD.password, (err, authenticated) => {
  if (err) {
    console.log('❌ Error de autenticación:', err.message);
    console.log('❌ Código de error:', err.code);
    console.log('❌ Stack:', err.stack);
    return;
  }
  if (authenticated) {
    console.log('✅ Autenticación exitosa!');
  } else {
    console.log('❌ Credenciales incorrectas');
  }
});