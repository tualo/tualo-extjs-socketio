Ext.define ('Tualo.data.proxy.SocketIO', {
    extend: 'Ext.data.proxy.Proxy' ,
    alias: 'proxy.socketio' ,
    config: {
        /**
        * @cfg {String} storeId (required) Id of the store associated
        */
        storeId: '' ,

        /**
        * @cfg {Object} api CRUD operation for the communication with the server
        */
        api: {
            create: 'create' ,
            read: 'read' ,
            update: 'update' ,
            destroy: 'destroy'
        } ,

        /**
        * @cfg {String} url (required) The URL to connect the websocket
        */
        url: '' ,


        /**
        * @cfg {Boolean} autoReconnect If the connection is closed by the server, it tries to re-connect again. The execution interval time of this operation is specified in autoReconnectInterval
        */
        autoReconnect: true ,

        /**
        * @cfg {Int} autoReconnectInterval Execution time slice of the autoReconnect operation, specified in milliseconds.
        */
        autoReconnectInterval: 5000
    },
    callbacks: {},
    constructor: function (cfg) {
        var me = this;


        // Requires a configuration
        if (Ext.isEmpty (cfg)) {
            Ext.Error.raise ('A configuration is needed!');
            return false;
        }

        me.initConfig (cfg);
        me.mixins.observable.constructor.call (me, cfg);


        if (Ext.isEmpty (me.getStoreId ())) {
            Ext.Error.raise ('The storeId field is needed!');
            return false;
        }

        if (Ext.isEmpty (io)){
            Ext.Error.raise ('socket.io is needed!');
            return false;
        }

        if (Ext.isEmpty(me.url)){
            Ext.Error.raise ('An url is needed!');
            return false;
        }
        me.socket = io.connect(me.url);

        if (! Ext.isEmpty(me.getApi().create)){
            me.socket.on (me.getApi().create, function (data) {
                me.completeTask ('create', me.getApi().create, data);
            });
        }

        if (! Ext.isEmpty(me.getApi().read )){
            me.socket.on (me.getApi().read , function (data) {
                me.completeTask ('read', me.getApi().read , data);
            });
        }

        if (! Ext.isEmpty(me.getApi().update )){
            me.socket.on (me.getApi().update , function (data) {
                //console.log('Tualo.data.proxy.SocketIO','update',data);
                me.completeTask ('update', me.getApi().update , data);
            });
        }

        if (! Ext.isEmpty(me.getApi().destroy )){
            me.socket.on (me.getApi().destroy , function (data) {
                me.completeTask ('destroy', me.getApi().destroy , data);
            });
        }
        return me;
    },
    /**
    * @method create
    * Starts a new CREATE operation (pull)
    * The use of this method is discouraged: it's invoked by the store with sync/load operations.
    * Use api config instead
    */
    create: function (operation, callback, scope) {
        this.runTask (this.getApi().create, operation, callback, scope);
    } ,

    /**
    * @method read
    * Starts a new READ operation (pull)
    * The use of this method is discouraged: it's invoked by the store with sync/load operations.
    * Use api config instead
    */
    read: function (operation, callback, scope) {
        this.runTask (this.getApi().read, operation, callback, scope);
    } ,

    /**
    * @method update
    * Starts a new CREATE operation (pull)
    * The use of this method is discouraged: it's invoked by the store with sync/load operations.
    * Use api config instead
    */
    update: function (operation, callback, scope) {
        this.runTask (this.getApi().update, operation, callback, scope);
    } ,

    /**
    * @method destroy
    * Starts a new DESTROY operation (pull)
    * The use of this method is discouraged: it's invoked by the store with sync/load operations.
    * Use api config instead
    */
    destroy: function (operation, callback, scope) {
        this.runTask (this.getApi().destroy, operation, callback, scope);
    },
    
    /**
    * @method runTask
    * Starts a new operation (pull)
    * @private
    */
    runTask: function (action, operation, callback, scope) {
        var me = this ,
            data = {} ,
            i = 0;

        if (typeof operation.sorters === 'undefined'){
            operation.sorters = [];
        }
        if (typeof operation.groupers === 'undefined'){
            operation.groupers = [];
        }
        scope = scope || me;

        // Callbacks store
        me.callbacks[action] = {
            operation: operation ,
            callback: callback ,
            scope: scope
        };

        // Treats 'read' as a string event, with no data inside
        if (action === me.getApi().read) {
            var sorters = operation.sorters ,
                groupers = operation.groupers;

            // Remote sorters
            if (sorters.length > 0) {
                data.sort = [];

                for (i = 0; i < sorters.length; i++) {
                    data.sort.push ({
                        property: sorters[i].property ,
                        direction: sorters[i].direction
                    });
                }
            }

            // Remote groupers
            if (groupers.length > 0) {
                data.group = [];

                for (i = 0; i < groupers.length; i++) {
                    data.group.push ({
                        property: groupers[i].property ,
                        direction: groupers[i].direction
                    });
                }
            }

            // Paging params
            data.page = operation.page;
            data.limit = operation.limit;
            data.start = operation.start;
        }
        // Create, Update, Destroy
        else {
            data = [];

            for (i = 0; i < operation.records.length; i++) {
                data.push (operation.records[i].data);
            }
        }

        me.socket.emit(action, data);
    } ,

    /**
    * @method completeTask
    * Completes a pending operation (push/pull)
    * @private
    */
    completeTask: function (action, event, data) {
        var me = this ,
            resultSet = me.getReader().read (data);

        // Server push case: the store is get up-to-date with the incoming data
        if (Ext.isEmpty (me.callbacks[event])) {
            var store = Ext.StoreManager.lookup (me.getStoreId ());

            if (typeof store === 'undefined') {
                Ext.Error.raise ('Unrecognized store: check if the storeId passed into configuration is right.');
                return false;
            }

            store.loadData (resultSet.records, true);
            store.fireEvent ('load', store);
        }
        // Client request case: a callback function (operation) has to be called
        else {
            var fun = me.callbacks[event] ,
                opt = fun.operation ,
                records = opt.records || data;

            delete me.callbacks[event];

            if (typeof opt.setResultSet === 'function') opt.setResultSet (resultSet);
            else opt.resultSet = resultSet;
            opt.scope = fun.scope;

            opt.setCompleted ();
            opt.setSuccessful ();

            if (typeof fun.callback === 'function'){
                fun.callback.apply (fun.scope, [opt]);
            }
        }
    }
});    