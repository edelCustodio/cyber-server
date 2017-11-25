let SQLHelper = require('../server_side/sql-helper.js');
let TYPES = require('tedious').TYPES;

var Computadora = {
    getDesktops: function () {
        SQLHelper.createConnection();
        var query = 'SELECT * FROM [Catalogo].[Computadora]'
        SQLHelper.clearSqlParameters();
        return SQLHelper.executeStatement(query, false);  
    },

    getDesktopsInUse: function () {
        SQLHelper.createConnection();
        var query = `SELECT idComputadora
                            ,fechaInicio
                            ,fechaFin
                            ,totalPagar 
                        FROM [Entidad].[RegistroComputadora]
                    WHERE CAST(fechaInicio AS DATE) = CAST(GETDATE() AS DATE)
                        AND fechaFin IS NULL`;
        SQLHelper.clearSqlParameters();
        return SQLHelper.executeStatement(query, false);  
    }
}

module.exports = Computadora