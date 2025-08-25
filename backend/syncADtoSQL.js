//LIBRERIAS
const ActiveDirectory = require('activedirectory2');
const sql = require('mssql');
require('dotenv').config();

// 🔹 CONFIGURACIÓN Active Directory
const configAD = {
    url: process.env.AD_URL, 
    baseDN: process.env.AD_BASE_DN,   
    username: process.env.AD_USER,
    password: process.env.AD_PASSWORD,
    
    // Configuraciones básicas - removemos atributos que pueden causar problemas
    reconnect: true,
    connectTimeout: 15000,
    timeout: 15000
};

console.log('🔧 Configuración AD:', {
    url: configAD.url,
    baseDN: configAD.baseDN,
    username: configAD.username ? '***configurado***' : 'NO CONFIGURADO',
    password: configAD.password ? '***configurado***' : 'NO CONFIGURADO'
});

const ad = new ActiveDirectory(configAD);

// 🔹 CONFIGURACIÓN SQL Server
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

// 🔹 FUNCIÓN PARA VERIFICAR CONECTIVIDAD AD
async function testADConnection() {
    return new Promise((resolve, reject) => {
        console.log('🔍 Probando conexión a Active Directory...');
        
        ad.authenticate(configAD.username, configAD.password, (err, authenticated) => {
            if (err) {
                console.error('❌ Error de autenticación AD:', err.message);
                reject(err);
                return;
            }
            
            if (authenticated) {
                console.log('✅ Conexión a AD exitosa!');
                resolve(true);
            } else {
                console.error('❌ Credenciales AD incorrectas');
                reject(new Error('Credenciales incorrectas'));
            }
        });
    });
}

// 🔹 FUNCIÓN PRINCIPAL DE SINCRONIZACIÓN
async function syncUsers() {
    let pool;
    
    try {
        // 1. Verificar conexión AD primero
        await testADConnection();
        
        // 2. Conectar a SQL
        console.log('🔗 Conectando a SQL Server...');
        pool = await sql.connect(dbConfig);
        console.log('✅ Conexión a SQL Server exitosa!');

        console.log('🔍 Buscando usuarios en Active Directory...');
        
        // 3. Buscar usuarios en AD con filtro más específico
        await new Promise((resolve, reject) => {
            // Usar un filtro LDAP más básico para evitar problemas con atributos
            const filter = '(&(objectClass=user)(objectCategory=person))';
            
            ad.findUsers(filter, async (err, users) => {
                if (err) {
                    console.error('❌ Error buscando en AD:', err);
                    reject(err);
                    return;
                }

                if (!users || users.length === 0) {
                    console.log('⚠ No se encontraron usuarios en AD.');
                    resolve();
                    return;
                }

                console.log(`✅ ${users.length} usuarios encontrados en AD.`);

                try {
                    let procesados = 0;
                    let errores = 0;

                    for (const u of users) {
                        try {
                            const usuarioAD = u.sAMAccountName || '';
                            const nombre = u.displayName || '';
                            const correo = u.mail || '';
                            const area = u.department || '';
                            
                            // Verificar si la cuenta está activa (userAccountControl & 2 = 0 significa activa)
                            const cuentaActiva = u.userAccountControl ? !(u.userAccountControl & 2) : true;
                            const rol = 'Empleado'; // Rol por defecto

                            if (!usuarioAD) {
                                console.log(`⚠ Usuario sin sAMAccountName, saltando: ${nombre}`);
                                continue;
                            }

                            console.log(`📝 Procesando: ${usuarioAD} (${nombre})`);

                            //----------AREAS----------//
                            let idArea = null;
                            if (area) {
                                const areaResult = await pool.request()
                                    .input('nombreArea', sql.NVarChar, area)
                                    .query(`
                                        MERGE Areas AS target
                                        USING (SELECT @nombreArea AS nombreArea) AS source
                                        ON target.NombreArea = source.nombreArea
                                        WHEN NOT MATCHED THEN
                                            INSERT (NombreArea) VALUES (@nombreArea)
                                        OUTPUT inserted.IdArea;
                                    `);
                                    
                                if (areaResult.recordset.length > 0) {
                                    idArea = areaResult.recordset[0].IdArea;
                                } else {
                                    const query = await pool.request()
                                        .input('nombreArea', sql.NVarChar, area)
                                        .query(`SELECT IdArea FROM Areas WHERE NombreArea = @nombreArea`);
                                    if (query.recordset.length > 0) idArea = query.recordset[0].IdArea;
                                }
                            }

                            //---------ROLES--------//
                            let idRol = null;
                            if (rol) {
                                const rolResult = await pool.request()
                                    .input('nombreRol', sql.NVarChar, rol)
                                    .query(`
                                        MERGE Roles AS target
                                        USING (SELECT @nombreRol AS nombreRol) AS source
                                        ON target.NombreRol = source.nombreRol
                                        WHEN NOT MATCHED THEN
                                            INSERT (NombreRol) VALUES (@nombreRol)
                                        OUTPUT inserted.IdRol;
                                    `);
                                    
                                if (rolResult.recordset.length > 0) {
                                    idRol = rolResult.recordset[0].IdRol;
                                } else {
                                    const query = await pool.request()
                                        .input('nombreRol', sql.NVarChar, rol)
                                        .query(`SELECT IdRol FROM Roles WHERE NombreRol = @nombreRol`);
                                    if (query.recordset.length > 0) idRol = query.recordset[0].IdRol;
                                }
                            }

                            // 🔹 Insertar o actualizar el usuario
                            await pool.request()
                                .input('usuarioAD', sql.NVarChar, usuarioAD)
                                .input('nombre', sql.NVarChar, nombre)
                                .input('correo', sql.NVarChar, correo)
                                .input('idArea', sql.Int, idArea)
                                .input('idRol', sql.Int, idRol)
                                .input('activo', sql.Bit, cuentaActiva)
                                .query(`
                                    MERGE Usuarios AS target
                                    USING (SELECT @usuarioAD AS usuarioAD) AS source
                                    ON target.UsuarioAD = source.usuarioAD
                                    WHEN MATCHED THEN
                                        UPDATE SET Nombre = @nombre, Correo = @correo, IdArea = @idArea, IdRol = @idRol, Activo = @activo
                                    WHEN NOT MATCHED THEN
                                        INSERT (UsuarioAD, Nombre, Correo, IdArea, IdRol, Activo)
                                        VALUES (@usuarioAD, @nombre, @correo, @idArea, @idRol, @activo);
                                `);

                            procesados++;

                        } catch (userError) {
                            console.error(`❌ Error procesando usuario ${u.sAMAccountName || 'desconocido'}:`, userError.message);
                            errores++;
                        }
                    }

                    console.log(`\n📊 Resumen:`);
                    console.log(`   ✅ Procesados: ${procesados}`);
                    console.log(`   ❌ Errores: ${errores}`);
                    console.log('🎯 Sincronización completada.');
                    
                    resolve();
                    
                } catch (processError) {
                    reject(processError);
                }
            });
        });

    } catch (error) {
        console.error('❌ Error general:', error);
        throw error;
    } finally {
        // Cerrar conexiones
        if (pool) {
            try {
                await pool.close();
                console.log('🔌 Conexión SQL cerrada.');
            } catch (closeError) {
                console.error('⚠ Error cerrando conexión SQL:', closeError);
            }
        }
    }
}

// 🚀 EJECUTAR
console.log('🚀 Iniciando sincronización AD -> SQL...\n');
syncUsers().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
});