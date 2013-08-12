(function ($, undefined) {
  "use strict";
  var _ajax,
      _queues = {},
      _keys,
      _objectType,
      Queue;

  Queue = (function(){
    function Queue(name){
      var version = false;

      this.name = name;
      this.requests = [];
      this.running = false;

      this.version = function(v){
        if(typeof v !== 'undefined'){
          version = v;
          resetRequests(this);
          return this;
        }
        return version;
      };
      //Temporary.. Yuck. find a better way to update version internally
      this.incrementVersion = function(v){
        if(typeof v !== 'undefined'){
          version = v;
        }
        if(v === false){
          resetRequests(this);
        }
        return this;
      };
    }
    /* Yuck. Find a better way for this private method */
    // var _private = {};
    // _private.resetRequests = function(){
    //   this.requests.length = 0;
    //   if(this.running){
    //     this.running.abort();
    //   }
    // };
    //_private.resetRequets.call(this);
    function resetRequests(qu){
      qu.requests.length = 0;
      if(qu.running){
        qu.running.abort();
      }
    }
    Queue.findOrCreateByName = function(name, version){
      var newQ;
      if(typeof _queues[name] === 'undefined'){
        newQ = new Queue(name);
        newQ.version(version);
        _queues[name] = newQ;
      } else {
        newQ = _queues[name];
      }
      return newQ;
    };
    Queue.destroyAllByName = function(){
      //pending..
    };
    Queue.prototype.destroy = function(){
      resetRequests(this);
      return $.queueajax('destroy', this.name);
    };
    Queue.prototype.push = function(options){
      this.requests.push(options);
      if (!this.running) {
        this.next();
      }
      return this;
    };
    Queue.prototype.next = function(){
      var toProcess,
          that = this,
          ver = {};

      if(this.requests.length === 0){
        this.running = false;
        return;
      }
      toProcess = this.requests.shift();

      //extract to fn -> queue.mergeVersionWith(toProcess))
      if(this.version() !== false){
        ver = { data: '' };
        if ($.isArray(toProcess.data)) {
          //array
          ver.data = toProcess.data.concat({ name: 'version', value: this.version() });
        } else {
          //hash
          ver.data = $.extend({}, toProcess.data, { version: this.version() });
        }
      }

      //Creating a new hash. In the event this hash gets used somewhere outside this scope, don't want to unexpectedly mutate it..
      this.running = $.ajax(
        $.extend({}, toProcess, ver, {
          complete: function(jqXHR, textStatus){
            var json = {};

            //convert to internal parseJson
            if(jqXHR.aborted !== true){
              try {
                json = $.parseJSON(jqXHR.responseText);//assumes json data for now..
              } catch(e){ }
              if(json === null){ //for safety, not sure if it's better to make version undefined or false and reset everything..
                json = {};
              }
            }

            if(json.version === false && $.isFunction(toProcess['rejected'])){
              toProcess['rejected'].call(this, json);
            }
            if($.isFunction(toProcess['complete'])){
              toProcess['complete'].apply(this, arguments);
            }

            //update version internally to response's version - slightly different than the regular .version() .. dam
            that.incrementVersion(json.version);//passing in false if rejected
            that.next();
          }
        })
      );
    };

    return Queue;
  })();

  _keys = Object.keys || function(obj) {
    var keys = [], key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        keys.push(key);
      }
    }
    return keys;
  };

  _objectType = function(obj){
    var type = Object.prototype.toString.call(obj).toLowerCase();
    switch(type){
    case '[object array]':
      return 'array';
    case '[object object]':
      return 'object';
    default:
      return false;
    }
  };

  $.queueajax = function( method ) {
    var methods,name,version;

    methods = {
      queues : function(){
        return _queues;
      },
      destroy : function( keyspace ){
        //Jumping through hoops because we want to make sure all references pointing to the queue obj in memory are updated
        //Doing a simple queues = {} does not update the actual object in memory, just our _queue pointer
        //so the references returned from the queues method could potentially have "stale data"
        var queuesList = _keys(_queues),
            i, len,
            prefix, wildCard, prefixLength,
            numDeleted = 0;

        if(typeof keyspace === 'string'){
          prefix = keyspace;
          wildCard = prefix.lastIndexOf("*");
          if(wildCard > -1){
            prefixLength = wildCard;
            prefix = prefix.slice(0, wildCard);
          } else {
            prefixLength = keyspace.length;
          }
        }

        for(i=0, len=queuesList.length; i < len; i++){
          if(typeof prefix === 'undefined'){
            //destroy all
            delete _queues[ queuesList[i] ];
            numDeleted++;
          } else if(wildCard > -1){
            //wild card match
            if(queuesList[i].slice(0, wildCard) === prefix){
              delete _queues[ queuesList[i] ];
              numDeleted++;
            }
          } else if(queuesList[i] === prefix) {
            //exact match
            delete _queues[ queuesList[i] ];
            numDeleted++;
            break;//yay! we're done because hashes
          }
        }
        return numDeleted;
      }
    };

    if (typeof methods[method] !== 'undefined'){
      //$.queueajax('queues') -> return all queues
      //$.queueajax('destroy') -> destroy all
      //$.queueajax('destroy', 'queue*') -> detroy all with specific key or namespace
      return methods[ method ].apply(methods, Array.prototype.slice.call( arguments, 1 ));
    } else if (typeof method === 'string'){
      //$.queueajax('monkey') -> creates a queue
      return Queue.findOrCreateByName(method);
    } else if (_objectType(method) === 'object') {
      //$.queueajax({ ... ajaxstuff ... })
      if(typeof method['queue'] === 'undefined'){
        throw new TypeError('Expected $.queueajax to contain queue property');
      }
      name = method['queue'];
      version = method['version'];
      delete method['queue'];
      delete method['version'];
      return Queue.findOrCreateByName(name, version).push(method);
    } else {
      throw new TypeError('$.queueajax did not detect a valid signature');
    }
  };

  $.queuegetJSON = function( url, params ) {
    if(typeof url === 'string' && _objectType(params) === 'object'){
      if(typeof params['queue'] === 'undefined'){
        throw new TypeError('Expected $.queuegetJSON to contain queue property');
      }
      return $.queueajax( $.extend({}, { type:'GET', dataType:'json', url:url }, params) );
    }
    throw new TypeError('$.queuegetJSON did not detect a valid signature');
  };

})(jQuery);