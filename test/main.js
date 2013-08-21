describe('ajaxQueue', function(){

  it('should expose queueajax on $', function(){
    expect($.queueajax).to.exist;
  });
  it('should expose queuegetJSON on $', function(){
    expect($.queuegetJSON).to.exist;
  });

  describe('$.queueajax signature', function(){
    describe('create', function(){
      it('should create a queue', function(){
        var queues;
        queues = $.queueajax('queues');

        expect(queues).to.be.empty;

        $.queueajax('queue1');

        expect(queues).to.have.keys(['queue1']);

        //clean up
        delete queues['queue1'];
      });
      it('should return the created queue', function(){
        var queues, q;

        q = $.queueajax('queue1');
        q.version(1);
        expect(q.version()).to.equal(1);

        queues = $.queueajax('queues');
        expect(queues).to.have.keys(['queue1']);

        q = $.queueajax('queue1');
        expect(q.version()).to.equal(1);
        expect($.queueajax('queues')).to.have.keys(['queue1']);

        //clean up
        delete queues['queue1'];
      });
      it('should call findOrCreateByName', function(){
        var queues = $.queueajax('queues'),
            Queue = $.queueajax('q').constructor,//cheating a bit..
            name = 'create_me',
            mock;
        delete queues['q'];

        expect(queues).to.not.have.keys([name]);
        mock = sinon.mock(Queue);
        mock.expects('findOrCreateByName').withExactArgs(name);
        $.queueajax(name);

        expect(mock.verify()).to.be.true;

        mock.restore();
      });
    });

    describe('queues', function(){
      it('should return all created queues', function(){
        var queues;
        $.queueajax('queue1');
        $.queueajax('queue2');

        queues = $.queueajax('queues');

        expect(queues).to.have.keys(['queue1','queue2']);

        //manually cleaning up because we don't technically have isolation :(
        delete queues['queue1'];
        delete queues['queue2'];
      });
    });

    describe('destroy', function(){
      it('should destroy all', function(){
        var queues, numDeleted;
        $.queueajax('queue1');
        $.queueajax('queue2');

        queues = $.queueajax('queues');
        expect(queues).to.have.keys(['queue1','queue2']);

        numDeleted = $.queueajax('destroy');

        expect(numDeleted).to.equal(2);
        expect(queues).to.be.empty;
        expect($.queueajax('queues')).to.be.empty;
      });
      it('should destroy specific key', function(){
        var queues, numDeleted;
        $.queueajax('queue1');
        $.queueajax('queue2');

        queues = $.queueajax('queues');
        expect(queues).to.have.keys(['queue1','queue2']);

        numDeleted = $.queueajax('destroy', 'queue1');

        expect(numDeleted).to.equal(1);
        expect(queues).to.have.keys(['queue2']);
        expect($.queueajax('queues')).to.have.keys(['queue2']);

        //cleaning up
        delete queues['queue2'];
      });
      it('should destory keyspace', function(){
        var queues, numDeleted;
        $.queueajax('queue1');
        $.queueajax('queue2');
        $.queueajax('set1');
        $.queueajax('queue');

        queues = $.queueajax('queues');
        expect(queues).to.have.keys(['queue1','queue2','set1', 'queue']);

        numDeleted = $.queueajax('destroy', 'queue*');

        expect(numDeleted).to.equal(3);
        expect(queues).to.have.keys(['set1']);
        expect($.queueajax('queues')).to.have.keys(['set1']);

        //cleaning up
        delete queues['set1'];
      });
    });

    describe('ajax', function(){
      afterEach(function(){
        $.queueajax('destroy');
      });
      it('should include queue to specify under which queue it belongs', function(){
        var stub = sinon.stub($, 'ajax');
        expect(function(){
          $.queueajax({});
        }).to.throw(TypeError);

        expect(function(){
          $.queueajax({queue: 'queue_name'});
        }).to.not.throw(Error);

        $.queueajax('destroy');
        stub.restore();
      });
      it('should call $.ajax', function(){
        var mock = sinon.mock($),
            args = {
              url: '/server',
              type: 'GET',
              dataType: 'json',
              data: { 1 : 2 },
              success: function(){}
            };

        mock.expects('ajax').once();
        $.queueajax( $.extend({}, args, { queue:'name', version:1 }) );
        expect(mock.verify()).to.be.true;
      });
      it('should return an instance of the queue', function(){
        var name = 'create_me',
            args = {
              url: '/server',
              queue: name
            },
            stub = sinon.stub($, 'ajax'),
            returnValue;

        returnValue = $.queueajax(args);

        expect(returnValue.constructor.name).to.equal('Queue');

        $.queueajax('destroy');
        stub.restore();
      });
      describe('queue', function(){
        it('should call findOrCreateByName', function(){
          var queues = $.queueajax('queues'),
              Queue = $.queueajax('q').constructor,//cheating a bit..
              name = 'create_me',
              mock = sinon.mock(Queue);

          delete queues['q'];

          mock.expects('findOrCreateByName').withArgs(name).once().returns({ push: function(){} });
          $.queueajax( { url: '/server', queue:name } );

          expect(mock.verify()).to.be.true;
          mock.restore();
        });
        it('should set version if specified', function(){
          var queues = $.queueajax('queues'),
              Queue = $.queueajax('q').constructor,//cheating a bit..
              name = 'create_me',
              version = 1,
              stub = sinon.stub($, 'ajax');

          delete queues['q'];
          sinon.spy(Queue, 'findOrCreateByName');

          $.queueajax( { url: '/server', queue:name, version: version } );

          expect(Queue.findOrCreateByName.withArgs(name,version).calledOnce).to.be.true;
          expect(queues[name].version()).to.equal(version);

          Queue.findOrCreateByName.restore();
          stub.restore();
        });
        it('should call push', function(){
          var queues = $.queueajax('queues'),
              Queue = $.queueajax('q').constructor,//cheating a bit..
              name = 'create_me',
              mock = sinon.mock(Queue.prototype),
              args = { url: '/server' };

          delete queues['q'];

          mock.expects('push').withExactArgs(args);

          $.queueajax($.extend({}, args, {queue: name, version: 1}));

          expect(mock.verify()).to.be.true;

          $.queueajax('destroy');
        });
      });
    });

    it('should throw a type error if a valid signature is not found', function(){
      expect(function(){
        $.queueajax([]);
      }).to.throw(TypeError);

      expect(function(){
        $.queueajax();
      }).to.throw(TypeError);
    });
  });

  describe('$.queuegetJSON signature', function(){
    it('should throw a type error if a valid signature is not found', function(){
      expect(function(){
        $.queuegetJSON();
      }).to.throw(TypeError);

      expect(function(){
        $.queuegetJSON({});
      }).to.throw(TypeError);

      expect(function(){
        $.queuegetJSON('');
      }).to.throw(TypeError);

      expect(function(){
        $.queuegetJSON(undefined, { queue: 'queue_name' });
      }).to.throw(Error);
    });
    it('should specify under which queue it belongs', function(){
      var stub = sinon.stub($, 'ajax');
      expect(function(){
        $.queuegetJSON('/url', { });
      }).to.throw(Error);

      expect(function(){
        $.queuegetJSON('/url', { queue: 'queue_name' });
      }).to.not.throw(Error);

      $.queueajax('destroy');
      stub.restore();
    });
    it('should proxy to $.queueajax', function(){
      var mock = sinon.mock($),
          args = {
            url: '/server',
            type: 'GET',
            dataType: 'json'
          },
          jsonArgs = {
            queue: 'monkey',
            version: 1,
            success: function(){},
            complete: function(){},
            rejected: function(){}
          };

      mock.expects('queueajax').once().withExactArgs($.extend({}, args, jsonArgs));

      $.queuegetJSON('/server', jsonArgs);

      expect(mock.verify()).to.be.true;
    });
    it('should return an instance of the queue', function(){
      var name = 'create_me',
          stub = sinon.stub($, 'ajax'),
          returnValue;

      returnValue = $.queuegetJSON('/server', {queue: name});

      expect(returnValue.constructor.name).to.equal('Queue');

      $.queueajax('destroy');
      stub.restore();
    });
  });

  describe('Queue', function(){
    beforeEach(function(){
      $.queueajax('destroy');
    });
    afterEach(function(){
      $.queueajax('destroy');
    });
    it('should be a queue', function(){
      var q = $.queueajax('queue_name');
      expect(q.constructor.name).to.equal('Queue');
    });

    describe('interface', function(){
      beforeEach(function(){
        this.q = $.queueajax('queue_name');
      });
      it('should have a name', function(){
        expect(this.q).to.have.ownProperty('name');
      });
      it('should have a version', function(){
        expect(this.q).to.respondTo('version');
      });
      it('should have a requests - default empty array', function(){
        expect(this.q).to.have.ownProperty('requests');
        expect(this.q.requests).to.be.instanceof(Array);
        expect(this.q.requests).to.be.empty;
      });
      it('should have a destroy method', function(){
        expect(this.q).to.respondTo('destroy');
      });
      it('should have a running - default false', function(){
        expect(this.q).to.have.ownProperty('running');
        expect(this.q.running).to.be.false;
      });
      it('should have a push method', function(){
        expect(this.q).to.respondTo('push');
      });
      it('should have a next method', function(){
        expect(this.q).to.respondTo('next');
      });
    });

    describe('class methods', function(){
      beforeEach(function(){
        var queues = $.queueajax('queues');
        this.Queue = $.queueajax('q').constructor;//cheating a bit..
        delete queues['q'];
      });
      afterEach(function(){
        $.queueajax('destroy');
      })
      describe('findOrCreateByName', function(){
        it('should create queue if queue with specified name doesnt exist', function(){
          var queues = $.queueajax('queues'),
              name = 'monkey',
              queue;

          expect(queues).to.be.empty;
          queue = this.Queue.findOrCreateByName(name);

          expect(queues).to.have.keys([name]);
          expect(queues[name]).to.equal(queue);
        });
        it('should set the version', function(){
          var name = 'monkey',
              version = 10,
              queue;

          queue = this.Queue.findOrCreateByName(name, version);
          expect(queue.version()).to.equal(version)
        });
        it('should use existing queue', function(){
          var queues = $.queueajax('queues'),
              name = 'monkey',
              version = 10,
              requests = [1,2,3],
              queue,
              secondPass;

          queue = this.Queue.findOrCreateByName(name, version);
          queue.requests = requests;
          expect(queues).to.have.keys([name]);
          expect(queues[name]).to.equal(queue);

          secondPass = this.Queue.findOrCreateByName(name, 50);

          expect(queues).to.have.keys([name]);
          expect(queues[name]).to.equal(secondPass);
          expect(secondPass.version()).to.equal(10);
          expect(secondPass.requests).to.equal(requests);
        });
      });
    });

    describe('instance methods', function(){
      describe('version', function(){
        it('should return the current version if set', function(){
          var q = $.queueajax('queue_name'),
              version = 1;
          expect(q.version()).to.be.false;
          q.version(version);
          expect(q.version()).to.equal(version);
        });
        it('should reset version', function(){
          var q = $.queueajax('queue_name'),
              version = 1;
          expect(q.version()).to.be.false;
          q.version(version);
          expect(q.version()).to.equal(version);
          q.version(false);
          expect(q.version()).to.be.false;
        });
        it('should return the queue instance', function(){
          var q = $.queueajax('queue_name');
          expect(q.version(1)).to.equal(q);
        });
        it('should clear the request list', function(){
          var q = $.queueajax('queue_name');

          q.version(1);
          q.requests.push({url: '/server'});
          expect(q.requests).to.have.length(1);

          q.version(2);
          expect(q.requests).to.have.length(0);
        });
        it('should abort current ajax', function(){
          var q = $.queueajax('queue_name'),
              options = {
                url: '/monkey',
                type: 'GET',
                dataType: 'json'
              },
              server = sinon.fakeServer.create(),
              running;

          q.version(1);
          q.requests.push(options);
          expect(q.running).to.be.false;
          q.next();

          expect(q.running).to.be.instanceOf(XMLHttpRequest);
          running = q.running;
          expect(running.readyState).to.equal(1);
          expect(running.aborted).to.be.an('undefined');

          q.version(2);

          expect(q.running).to.be.false;
          expect(running.readyState).to.equal(0);
          expect(running.status).to.equal(0);
          expect(running.aborted).to.be.true;

          server.restore();
        });
        it('should not reset requests or running if version is requested', function(){
          var q = $.queueajax('queue_name'),
              r1 = {
                url: '/r1',
                type: 'GET',
                dataType: 'json'
              },
              r2 = {
                url: '/r2',
                type: 'GET',
                dataType: 'json'
              },
              xhr = sinon.useFakeXMLHttpRequest(),
              requests,
              running,
              version;

          version = q.version(1).version();
          expect(version).to.equal(1);

          q.requests.push(r1);
          q.requests.push(r2);

          q.next();
          running = q.running;
          requests = q.requests;

          expect(running).to.be.instanceOf(XMLHttpRequest);
          expect(requests).to.have.length(1);

          expect(q.version()).to.equal(version);
          expect(q.running).to.equal(running);
          expect(q.requests).to.equal(requests);

          xhr.restore();
        });
      });

      describe('destroy', function(){
        afterEach(function(){
          //always ensure that the stub is restored, even if the expectation fails - seems like it should automatically..
          if(typeof this.stub !== 'undefined'){ this.stub.restore(); }
        });
        it('should remove the queue', function(){
          var q = $.queueajax('remove_me'),
              queues = $.queueajax('queues'),
              numDeleted;

          expect(queues).to.have.keys(['remove_me']);
          numDeleted = q.destroy();
          expect(numDeleted).to.equal(1);
          expect(queues).to.be.empty;
        });
        it('should delete the request list', function(){
          var q = $.queueajax('remove_me');

          q.requests.push({url: '/server'});
          expect(q.requests).to.have.length(1);

          this.stub = sinon.stub($, "queueajax");

          q.destroy();

          expect(q.requests).to.have.length(0);
        });
        it('should abort the running ajax request', function(){
          var q = $.queueajax('queue_name'),
              options = {
                url: '/monkey',
                type: 'GET',
                dataType: 'json'
              },
              server = sinon.fakeServer.create(),
              running;

          q.requests.push(options);
          expect(q.running).to.be.false;
          q.next();//run request

          expect(q.running).to.be.instanceOf(XMLHttpRequest);
          running = q.running;
          expect(running.readyState).to.equal(1);
          expect(running.aborted).to.be.an('undefined');

          this.stub = sinon.stub($, "queueajax");
          q.destroy();

          expect(q.running).to.be.false;
          expect(running.readyState).to.equal(0);
          expect(running.status).to.equal(0);
          expect(running.aborted).to.be.true;

          server.restore();
        });
      });

      describe('push', function(){
        beforeEach(function(){
          this.q = $.queueajax('push_me');
        });
        it('should return instance of the queue', function(){
          var options = { url: '/server' },
              returnValue;
          sinon.stub(this.q, 'next');

          returnValue = this.q.push(options);
          expect(returnValue.constructor.name).to.equal('Queue');

          this.q.next.restore();
        });
        it('should append an item to the request list', function(){
          var options = { url: '/server' };
          sinon.stub(this.q, 'next');

          expect(this.q.requests).to.be.empty;

          this.q.push(options);

          expect(this.q.requests).to.have.length(1);
          expect(this.q.requests[0]).to.equal(options);

          this.q.next.restore();
        });
        it('should call next', function(){
          var mock = sinon.mock(this.q),
              options = { url: '/server' };

          mock.expects('next').once();
          this.q.push(options);

          expect(mock.verify()).to.be.true;
        });
        it('should not call next if already running', function(){
          var mock = sinon.mock(this.q),
              req1 = { url: '/monkey' },
              req2 = { url: '/banana' }

          mock.expects('next').once();

          this.q.push(req1);
          this.q.running = new XMLHttpRequest();
          this.q.push(req2);

          expect(mock.verify()).to.be.true;

          mock.restore();
        });
      });

      describe('next', function(){
        beforeEach(function(){
          this.q = $.queueajax('next_me');
        });
        it('should set running to false and not run next if request list is empty', function(){
          var mock = sinon.mock($),
              runnable = {"i'm":"running"};

          mock.expects('ajax').never();
          this.q.running = runnable;

          expect(this.q.requests).to.be.empty;
          expect(this.q.running).to.equal(runnable);

          this.q.next();

          expect(this.q.running).to.be.false;
          expect(mock.verify()).to.be.true;
        });
        it('should shift from requests and set running to currently running xhr object on current queue', function(){
          var options = {
                url: '/monkey',
                type: 'GET',
                dataType: 'json'
              },
              server = sinon.fakeServer.create(),
              q2 = $.queueajax('un-affected');

          server.respondWith(
            '/monkey',
            [200, { 'Content-Type': 'application/json' },
            '{ "success": "banana" }']
          );
          this.q.requests.push(options);

          expect(this.q.running).to.be.false;
          expect(this.q.requests).to.have.length(1);
          expect(q2.running).to.be.false;

          this.q.next();

          expect(this.q.running).to.be.instanceOf(XMLHttpRequest);
          expect(this.q.running.url).to.equal('/monkey');
          expect(this.q.requests).to.have.length(0);

          expect(q2.running).to.be.false;

          server.respond();
          server.restore();
        });
        it('should should run the next xhr in the request list', function(){
          var xhr = sinon.useFakeXMLHttpRequest(),
              requests = [],
              req1 = {
                url: '/monkey_one',
                type: 'GET',
                dataType: 'json'
              },
              req2 = {
                url: '/monkey_two',
                type: 'GET',
                dataType: 'json'
              },
              spy = sinon.spy(this.q, 'next');

          xhr.onCreate = function (xhr) { requests.push(xhr) };

          this.q.requests.push(req1);
          this.q.requests.push(req2);

          //not running, two requests in stack
          expect(this.q.running).to.be.false;
          expect(this.q.requests).to.have.length(2);
          expect(this.q.requests[0].url).to.equal('/monkey_one');
          expect(this.q.requests[1].url).to.equal('/monkey_two');

          //process request 1
          this.q.next();
          expect(this.q.requests).to.have.length(1);
          expect(this.q.requests[0].url).to.equal('/monkey_two');

          //respond to request 1
          requests[0].respond(200, { "Content-Type": "application/json" }, '{ "success": "banana" }');
          //begin processing request 2
          expect(this.q.requests).to.have.length(0);
          expect(this.q.running.url).to.equal('/monkey_two');

          //respond to request 2
          requests[1].respond(200, { "Content-Type": "application/json" }, '{ "success": "banana" }');
          expect(this.q.requests).to.have.length(0);
          expect(this.q.running).to.be.false;
          expect(spy.calledThrice).to.be.true;//initial call, process second request, attempt third and stop

          this.q.next.restore();
          xhr.restore();
        });
        it('should call the complete callback if provided', function(){
          var onCompleteSpy = sinon.spy(),
              options = {
                complete: onCompleteSpy,
                url: '/monkey',
                type: 'GET',
                dataType: 'json'
            },
            server = sinon.fakeServer.create(),
            xhr;

            server.respondWith(
              '/monkey',
              [200, { 'Content-Type': 'application/json' },
              '{ "success": "banana" }']
            );
            this.q.requests.push(options);

            this.q.next();
            xhr = this.q.running;
            server.respond();

            expect(onCompleteSpy.calledOnce).to.be.true;
            expect(onCompleteSpy.calledWith(xhr)).to.be.true;

            server.restore();
        });
        //is it possible for this to happen without the user calling q.next() manually?
        //should we be worried about this?
        it('should not initialize another ajax call if one is running for the same queue')
        it('should call the afterAll callback when the entire queue is completed')
      });
    });

    describe('versioning', function(){
      afterEach(function(){
        $.queueajax('destroy');
      });
      describe('should add current version number to request', function(){
        it('hash format', function(){
          var q = $.queueajax('versioner'),
              server = sinon.fakeServer.create(),
              version = 1,
              baseData = {'monkey': 'banana'},
              request = {
                url: '/monkey',
                type: 'GET',
                data: baseData,
                dataType: 'json'
              },
              actualData,
              expectedData = $.extend({}, baseData, { version: version });

          sinon.spy($, "ajax");

          q.version(version);
          q.requests.push(request);
          q.next();

          //carefully ensure base data isn't changed by our next method
          expect(baseData).to.eql({'monkey':'banana'});

          actualData = $.ajax.getCall(0).args[0].data;
          expect(actualData).to.eql(expectedData);

          $.ajax.restore();
          server.restore();
        });
        it('array format', function(){
          var q = $.queueajax('versioner'),
              server = sinon.fakeServer.create(),
              version = 1,
              baseData = [{'name':'monkey', 'value':'banana'}],
              request = {
                url: '/monkey',
                type: 'GET',
                data: baseData,
                dataType: 'json'
              },
              actualData,
              expectedData = baseData.concat([{'name': 'version', 'value': version}]);

          sinon.spy($, "ajax");

          q.version(version);
          q.requests.push(request);
          q.next();

          expect(baseData).to.eql([{'name':'monkey', 'value':'banana'}]);

          actualData = $.ajax.getCall(0).args[0].data;
          expect(actualData).to.eql(expectedData);

          $.ajax.restore();
          server.restore();
        });
      });
      it('should not add version if it is false', function(){
        var q = $.queueajax('versioner'),
            server = sinon.fakeServer.create(),
            baseData = {'monkey': 'banana'},
            request = {
              url: '/monkey',
              type: 'GET',
              data: baseData,
              dataType: 'json'
            },
            actualData,
            expectedData = baseData;

        sinon.spy($, "ajax");

        q.requests.push(request);
        expect(q.version()).to.be.false;
        q.next();

        actualData = $.ajax.getCall(0).args[0].data;
        expect(actualData).to.eql(expectedData);

        $.ajax.restore();
        server.restore();
      });
      it('should clear the queue if version failure occurs', function(){
        var q = $.queueajax('versioner'),
            xhr = sinon.useFakeXMLHttpRequest(),
            requests = [],
            req1 = {
              url: '/monkey',
              type: 'GET',
              dataType: 'json'
            },
            req2 = {
              url: '/monkey2',
              type: 'GET',
              dataType: 'json'
            };
        xhr.onCreate = function (xhr) { requests.push(xhr) };

        q.requests.push(req1);
        q.requests.push(req2);
        expect(q.requests).to.have.length(2);

        q.next();
        expect(q.requests).to.have.length(1);

        requests[0].respond(409, { "Content-Type": "application/json" }, '{ "failure": "no banana :(", "version": false }');

        expect(q.requests).to.have.length(0);
        expect(q.running).to.be.false;
      });
      it('should run rejected callback if ajax request returns a version failure', function(){
        var q = $.queueajax('versioner'),
            onRejectedSpy = sinon.spy(),
            server = sinon.fakeServer.create(),
            request = {
              url: '/monkey',
              type: 'GET',
              dataType: 'json',
              rejected: onRejectedSpy
            },
            response = '{ "failure": "no banana :{", "version": false }';

        server.respondWith(
          '/monkey',
          [409, { 'Content-Type': 'application/json' },
          response]
        );

        q.requests.push(request);
        q.next();

        server.respond();

        expect(onRejectedSpy.calledOnce).to.be.true;
        expect(onRejectedSpy.calledWith($.parseJSON(response))).to.be.true;

        server.restore();
      });
      it('should not do any version logic if the version key is not in the response', function(){
        var q = $.queueajax('versioner'),
            xhr = sinon.useFakeXMLHttpRequest(),
            request = {
              url: '/monkey',
              type: 'GET',
              dataType: 'json'
            },
            request2 = {
              url: '/monkey2',
              type: 'GET',
              dataType: 'json'
            },
            requests = [],
            version = 10,
            stub;

        xhr.onCreate = function (xhr) { requests.push(xhr) };

        q.version(version);

        q.requests.push(request);
        q.requests.push(request2);
        q.next();
        stub = sinon.stub(q, 'next');

        requests[0].respond(200, { "Content-Type": "application/json" }, '{ "failure": "no banana :P" }');

        expect(q.version()).to.equal(version);
        expect(q.requests).to.have.length(1);
        expect(q.requests[0]).to.eql(request2);

        stub.restore();
        xhr.restore();
      });
      it('should assign the version returned from the server if resource is updated with no conflict', function(){
        var q = $.queueajax('versioner'),
            xhr = sinon.useFakeXMLHttpRequest(),
            request = {
              url: '/monkey',
              type: 'GET',
              dataType: 'json'
            },
            request2 = {
              url: '/monkey2',
              type: 'GET',
              dataType: 'json'
            },
            requests = [],
            startVersion = 1,
            nextVersion = 2,
            stub;

        xhr.onCreate = function (xhr) { requests.push(xhr) };

        q.version(startVersion);
        expect(q.version()).to.equal(startVersion);

        q.requests.push(request);
        q.requests.push(request2);
        q.next();
        stub = sinon.stub(q, 'next');

        requests[0].respond(200, { "Content-Type": "application/json" }, '{ "success": "here is your banana", "version": '+nextVersion+' }');

        expect(q.version()).to.equal(nextVersion);
        expect(q.requests).to.have.length(1);
        expect(q.requests[0]).to.eql(request2);

        stub.restore();
        xhr.restore();
      });
    });
  });
});