var fs = require('fs');
var path = require('path');


var walk = function(dir, done,_cutof) {
    var results = [];
    if (typeof _cutof=='undefined'){
        _cutof=dir.length;
    }
    fs.readdir(dir, function(err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function(file) {
            file = path.join(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err, res) {
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    },_cutof);
                } else {
                    results.push(file.substring(_cutof));
                    if (!--pending) done(null, results);
                }
            });
        });
    });
};


var files=[];
var middleware=function(req,res,next){
    if (req.url.indexOf('/tualo-extjs-socketio/') === 0){

        var url_part = req.url.substring(4);
        if (url_part.indexOf('?')>=0){
            url_part = url_part.substring(0,url_part.indexOf('?'));
        }

        if(files.indexOf(url_part)>=0){
            res.sendfile(path.join(__dirname,'..','data',url_part));
        }else{
            res.send(403, 'Sorry! you cant see that.');
        }
        return;
    }else{
        next();
    }
}
walk(path.join(__dirname,'..','data'),function(err,res){
    files = res;
});

exports.middleware = middleware;
