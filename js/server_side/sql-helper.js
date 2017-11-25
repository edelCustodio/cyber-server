//SQL Objects
const SqlConnection = require("tedious").Connection;
const Request = require("tedious").Request;
const {ipcMain, BrowserWindow} = require('electron');

//SQL Connection
let connection = null;

let resultSQL = {
  result: {},
  error: null
}

//idComputadora
global.clientID = 0;

//SQL Parameter class
function Parameter(paramName, paramValue, paramType) {
    this.name = paramName;
    this.value = paramValue;
    this.type = paramType;
}

//SQL Parameters array
let parameters = [];
let arrObj = []

//Main SQLHelper object
var SQLHelper = {
    
    //Create SQL Parameter
    sqlParameter: function (paramName, paramValue, paramType) {
        return new Parameter(paramName, paramValue, paramType);
    },
    
    //Add SQL Parameter to the array
    addSqlParameter: function(parameter) {
        parameters.push(parameter);
    },

    //Get the SQL Parameters array
    sqlParameters: function(){
        return parameters;
    },

    //Clear the SQL Parameters array
    clearSqlParameters: function(){
        parameters = [];
    },

    //Get the IP Server
    getIPServer: function() {
        return 'localhost';
    },
  
    getConfig() {
        return config = {
            userName: 'cyber',
            password: 'Cyber2017',
            server: this.getIPServer(),
            options: {
                database: 'CyberDB',
                //useColumnNames: true,
                useUTC: false,
                rowCollectionOnDone: true
            }
        }
    },
  
    //Open the SQL connection
    createConnection: function() {
        connection = new SqlConnection(this.getConfig());
    },

    //Execute any SQL statement, simple SELECT statement or stored procedure.
    executeStatement: function(query, isProcedure) {
        var $this = this;
        var parameters = $this.sqlParameters();
        arrObj = []

        return new Promise((resolve, reject) => {
            connection.on('connect', function (err){
                var request = new Request(query, function(err, rowCount, rows) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }

                    if(isProcedure && rowCount > 1) {
                        rowCount = rowCount - 1
                    }

                    if(arrObj.length === rowCount) {
                        resolve(arrObj);
                    }
                    
                    console.log(rowCount);
                    connection.close();
                });

                //Adding sql parameters
                for(var i = 0; i < parameters.length; i++){
                    request.addParameter(parameters[i].name, parameters[i].type, parameters[i].value);
                }
                
                
                request.on('row', function(columns) {
                    var item = {}
                    columns.forEach(function(column) {
                        item[column.metadata.colName] = column.value; 
                    });
                    
                    arrObj.push(item);
                });
                
                if(isProcedure){
                    connection.callProcedure(request);
                }else{
                    connection.execSql(request);
                }                
            });
        }); 
    },

  }



  module.exports = SQLHelper;