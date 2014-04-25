Description
===========

tualo-extjs-socketio.

Using
=====

Node part:

    var express = require('express');
    var tualo_extjs_socketio = new (require('tualo-extjs-socketio')).LibLoader();
    ...
    app = express();
    app.use(  tualo_extjs_socketio.middleware );

Browser part:

    <script src="/tualo-extjs-socketio/data/proxy/SocketIO.js"></script>
