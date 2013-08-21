JQuery Ajax Queue
=================
A jquery plugin that wraps $.ajax and $.getJSON (supports jquery < 1.5 - before jQuery.Deferred was introduced - ***yes it doesn't use jquery.Deferred on purpose***). It provides a more or less automatic way of queuing up requests and more importantly a way of optimistic locking via versions on a resource.

Example Usage
-------------

```
//Inclusion
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js" type="text/javascript"></script>
<script src="/js/jquery_ajaxqueue.0.1.0-beta.min.js" type="text/javascript"></script>
```

### $.queueajax signature

```
$.queueajax('queues'); //get all queues in hash format {'queuename': queueObject}

$.queueajax('destroy'); //destroy all queues
$.queueajax('destroy', 'specific_queue'); //destroy queue named 'specific_queue'
$.queueajax('destroy', 'car*'); //destroy all queues that begin with car

$.queueajax('monkey'); //create a queue named 'monkey' and return instance of queueObject. If queue already exists just return an instance of the queueObject

$.queueajax({
  url: '/blah',
  type: 'POST',
  dataType: 'json',
  //all other ajax stuff gets proxied

  //new stuff
  queue: 'car_toyota',
  version: 1,
  rejected: function(json){ }
})
```

### $.queuegetJSON signature
```
$.queuegetJSON('/blah', {
  queue: 'car_toyota',
  success: function(){},
  rejected: function(){},
  complete: function(){}
  //etc options because this  proxies to $.queueajax
})
```
__queue__  -> which queue this request gets added to

__version__ -> version to initialize a new queue with. If a queue already exists setting the version will do nothing, however if the queue does not exist it will create the new queue with the specified version

__rejected__ -> if request gets rejected due to old version this callback will be called with the json the server responded with. (for now this only handles json responses)


### Queue Object
```
//creates new queue instance
var qInstance = $.queueajax('banana');
//returns banana
qInstance.name;

//returns current version if set, returns false if none set
qInstance.version();

//sets the version, aborts the current request, clears request queue
qInstance.version('123');

//returns array of requests in queue
qInstance.requests;

//destroy current queue instance, abort request, clear request queue
qInstance.destroy();

//is the queue currently processing requests
qInstance.running;

//appends an item to the request list (not really needed if you're using $.queueajax or $.queuegetJSON)
qInstance.push({/*ajax stuff*/});

//begin processing the next item in the queue (also not really needed if you are using $.queueajax or $.queuegetJSON)
qInstance.next();
```

### Server Request/Response

#### Request
The version value gets passed two different ways depending on the type of request. If a version is specified for the particular queue it will be either added to the post body or as a url parameter.

__POST__:

```
$.queueajax({
	url: '/server',
	type: 'POST',
	dataType: 'json',
	version: 1,
	queue: 'monkey'
});
```
__url__: /server

__body__: version=1



__GET__:

```
$.queuegetJSON('/server', {
	queue: 'monkey',
	version: 1
});
```
__url__: /server?version=1

__body__:



#### Response
It is expected that the server return the version value in the top level of the json hash. ```{ "version": 1 }```

If the server has denied the request because the version sent was out date simply return false. ```{ "version": false }```


Running the tests
-----------------
### Via Grunt

Grunt 0.4.x requires Node.js version >= 0.8.0

1. Install node ([http://nodejs.org](http://nodejs.org))
2. Install npm ```curl https://npmjs.org/install.sh | sh```
3. Install grunt ([http://gruntjs.com](http://gruntjs.com)) ``` npm install -g grunt-cli ```
4. In ajaxqueue directory run ``` npm install ``` to get dependencies


In your .bash_profile or .bashrc file add the following to be able to access grunt from the command line globally

export PATH="/usr/local/share/npm/bin:$PATH"

### Via Browser
Just load up runner.html in your browser.

Todos
-----
- [ ] queueInstance.incrementVersion <- yuck hack. Need to figure out a better way
- [ ] private resetRequests in Queue object needs to be privatized better
- [ ] $.queueajax has a destroy method that does way too much and is too complicated. Break it up into a few methods and add some of them into the Queue object. More specifically destroyAllByName
- [ ] Complete implement pending tests, and complete the small features they deal with

License
-------
Standard MIT

Copyright (c) 2013 Konstantin Sykulev

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
