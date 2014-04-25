var fs = require('fs'),
    path = require('path'),
    queryFile = '/tualo-extjs-socketio/data/proxy/SocketIO.js',
    loadFile = path.join(__dirname,'..','data','proxy','SocketIO.js');

/**
* @class LibLoader
* 
* @param [{Object}] options The option parameters, if none given the defaults will be loaded.
*/
var LibLoader = function(options){
    var me = this;
    /**
    * @property {Object} [options=undefined] Keeps the configuration. 
    * @property {String} [options.loadFile=../data/proxy/SocketIO.js] The local filename which the middleware should load.
    * @property {String} [options.queryFile=/tualo-extjs-socketio/data/proxy/SocketIO.js] The filename which the middleware should react on.
    * @property {String} [options.className=Tualo.data.proxy.SocketIO] The classname for Ext JS.
    */
    if (typeof options === 'undefined'){
        options = {};
    }
    
    if (typeof options.loadFile === 'undefined'){
        options.loadFile = loadFile;
    }
    
    if (typeof options.queryFile === 'undefined'){
        options.queryFile = queryFile;
    }
    
    if (typeof options.className === 'undefined'){
        options.className = 'Tualo.data.proxy.SocketIO';
    }
    
    me.options = options;
    me.queryFile = options.queryFile;
    me.fileData = '';
    fs.readFile(options.loadFile, 'utf8', function (err,data) {
        if (err) {
            throw err;
        }
        me.fileData = data.toString().replace('Tualo.data.proxy.SocketIO',options.className);
        
        
    });
    return me;
}

/**
* @method middleware
* 
* @param {Object} req The http request object.
* @param {Object} res The http result object.
* @param {Function} next The next function called if the requested url does not fit
*
*/
LibLoader.prototype.middleware = function(req,res,next){
    var me = this;
    
    if (req.url === me.queryFile){
        res.send('200',me.fileData);
    }else{
        next();
    }
}
    
exports.LibLoader = LibLoader;
