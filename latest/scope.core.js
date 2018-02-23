(function () {
  if ( typeof window.CustomEvent === "function" ) return false; //If not IE

  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();
(function () {
    if( typeof Element.closest === 'function' ) return false;

    Element.prototype.matches = function(selector) {
        var node = this, nodes = (node.parentNode || node.document).querySelectorAll(selector), i = -1;
        while (nodes[++i] && nodes[i] != node);
        return !!nodes[i];
    }
})();
(function () {

    if( typeof Element.closest === 'remove' ) return false;

    Element.prototype.remove = function() {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    };
})();
(function () {
    if( typeof Element.closest === 'function' ) return false;
    Element.prototype.closest = function (query) {
        if( this.matches( query ) ){
            return this;
        } if( !this.parentElement ){
            return false;
        } else if( this.parentElement.matches( query ) ){
            return this.parentElement;
        }
        return this.parentElement.closest( query );
    };
})();



window.extend = function(){
    return new Extender( arguments );
}

Extender = function( collection ){
    this.collection = collection;
}
Extender.prototype.with = function( args ){
    for(i=0;i<this.collection.length;i++){
        var item = this.collection[i];
        if( item.hasOwnProperty('prototype') ){
            for(var b in args){
                item.prototype[b] = args[b];
            }
        } else {
            for(var b in args){
                item[b] = args[b];
            }
        }
    }
}

window.serialize = function( obj, prefix ){
    var str = [], p;

    if( typeof prefix == 'undefined' ){
        prefix = '';
    }

    for(p in obj) {
      if (obj.hasOwnProperty(p)) {
        var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
        str.push((v !== null && typeof v === "object") ?
          serialize(v, k) :
          encodeURIComponent(k) + "=" + encodeURIComponent(v));
      }
    }
    return str.join("&");
}

window.Scope = function(){

    this.browser = this.getUserAgent();

    console.log( "Successfully initialize Scope.js" );
}

window.Scope.extend = function( arguments ){
    this.collection = arguments;
    return this;
}

extend( Scope ).with({
    getUserAgent: function(){
        var data = {
            name: 'netscape',
            ua: window.navigator.userAgent
        };

        var ua = window.navigator.userAgent.toLowerCase();

        if( ua.indexOf('.net') !== -1 ){
            data.name = 'ie';
        } else if( ua.indexOf('edge') !== -1 ){
            data.name = 'edge';
        } else if( ua.indexOf('chrome') !== -1 ){
            data.name = 'chrome';
        } else if( ua.indexOf('firefox') !== -1 ){
            data.name = 'ff';
        }

        return data;
    },
    request: {
        validate: function( obj ){
            if( !obj.hasOwnProperty('method') ){
                obj['method'] = 'GET';
            }
            if( !obj.hasOwnProperty('onsuccess') ){
                obj['onsuccess'] = function(){};
            }
            if( !obj.hasOwnProperty('onerror') ){
                obj['onerror'] = function(){};
            }
            if( !obj.hasOwnProperty('data') ){
                obj['data'] = {};
            }
            if( !obj.hasOwnProperty('responseType') ){
                obj['responseType'] = '';
            }
            if( !obj.hasOwnProperty('headers') ){
                obj['headers'] = [];
            }

            if( obj.method.toUpperCase() == 'POST' ){
                obj.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            }

            return obj;
        },
        send: function( obj ){
            var xhr = new XMLHttpRequest();
            xhr.obj = this.validate( obj );

            xhr.open( xhr.obj.method, xhr.obj.url );


            xhr.responseType = obj.responseType;

            if( xhr.obj.method.toUpperCase() == 'POST' ){
                xhr.obj.data = serialize( xhr.obj.data );
            } else {
                if( xhr.obj.data ){
                    xhr.obj.url = xhr.obj.url + '?' + serialize( xhr.obj.data );
                    xhr.obj.data = '';
                }
            }

            for(var i in xhr.obj.headers ){
                xhr.setRequestHeader(i, xhr.obj.headers[i] );
            }

            xhr.onreadystatechange = function( res ){
                if( this.readyState == 4 && xhr.status == 200 ){
                    return this.obj.onsuccess.call( this, this );
                }
            }
            xhr.onerror = xhr.obj.onerror;
            xhr.send( xhr.obj.data );
        }
    },
    get: function( obj ){
        obj.method = 'GET';
        return window.Scope.request.send( obj );
    },
    post: function( obj ){
        obj.method = 'POST';
        return window.Scope.request.send( obj );
    },
    ajax: function( obj ){
        return window.Scope.request.send( obj );
    },
    widgets: function(){

        if( typeof window['widgets'] == 'undefined' ){
            window['widgets'] = [];
        }

        document.find('[widget][widget-state="pending"]').forEach(function(el){
            var widgetClass = el.attr('widget-class');
            if( typeof window[widgetClass] === 'function' ){
                var id = el.attr('id');

                if( id == null ){
                    id = new Date().valueOf();
                }

                if( typeof window['widgets'][widgetClass] == 'undefined' ){
                    window['widgets'][widgetClass] = [];
                }

                window['widgets'][widgetClass][ 'w' + id ] = new window[widgetClass]( el );
            }
        });
    }
});
extend( Element, Document, Window ).with({
    listen: function( a, b, c ){
        var split = a.split(' ');
        for( var i in split ){
            var event = split[i];
            if( typeof c === 'undefined' ){
                // direct
                this.addEventListener( event, b );
            } else {
                // delegate
                this.addEventListener( event, function( originalEvent ) {
                    if( typeof originalEvent.target.matches == 'function' ){
                        if( originalEvent.target.matches( b ) ){
                            // direct;
                            return c.call( originalEvent.target, originalEvent );
                        } else if( closest = originalEvent.target.closest( b ) ) {
                            // via child
                            return c.call( closest, originalEvent );
                        }
                    }

                } )
            }
        }
    },
    dispatch: function( eventType ){
        var event = new CustomEvent( eventType, {
            cancelable: true,
            bubbles: true
        } );
        this.dispatchEvent( event );
        return event;
    }
});
extend( Element, Document ).with({
    find: function( query ){
        return this.querySelectorAll( query );
    },
    findOne: function( query ){
        return this.querySelector( query );
    },
});

extend( Element ).with({
    index: function(){
        for(i=0;i<this.parentNode.children.length;i++){
            if( this.parentNode.children[i] == this ){
                return i;
            }
        }
    },
    addClass: function( className ){
        this.classList.add( className );
    },
    removeClass: function( className ){
        this.classList.remove( className );
    },
    toggleClass: function( className ){
        this.classList.toggle( className );
    },
    replaceClass: function( from, to ){
        this.classList.replace( from, to );
    },
    load: function( obj ){
        onsuccess = obj.onsuccess;
        onerror = obj.onerror;
        obj.onsuccess = function( res ){
            this.innerHTML = res.response;
            if( typeof onsuccess == 'function' ){
                onsuccess.call( this, res );
            }
        }.bind(this);
        obj.onerror = function( err ){
            if( typeof onerror == 'function' ){
                onerror.call( this, err );
            }
        }.bind(this);
        Scope.get( obj );
    },
    attr: function( a, b ){
        if( b === null ){
            this.removeAttribute( a );
        } else if( typeof b === 'undefined' ){
            return this.getAttribute( a );
        } else {
            this.setAttribute( a, b );
        }
    },
    css: function( args ){
        for(var i in args){
            this.style[i] = args[i];
        }
    }
});

extend( HTMLCollection, NodeList ).with({
    listen: function( a, b, c ){
        var split = a.split(' ');
        for( var i in split ){
            var event = split[i];
            for(i=0;i<this.length;i++){
                if( typeof c == 'undefined' ){
                    this[i].listen( event, b );
                } else {
                    this[i].listen( event, b, c );
                }
            }
        }
    },
    dispatch: function( a ){
        for(i=0;i<this.length;i++){
            this[i].dispatch( a );
        }
    }
});

extend( HTMLCollection ).with({
    forEach: function( callable ){
        for(i=0;i<this.length;i++){
            callable.call( this, this[i] );
        }
    }
});

var Scope = new Scope();

document.listen('DOMContentLoaded', function(e){
    document.dispatch('ready');
});

document.listen('touchstart mousedown', '*', function( event ){
    this.isMouseDown = true;

    this[event.type] = {
        x: ( event.type == 'mousedown' ? event.pageX : event.touches[0].pageX ) - this.offsetLeft,
        y: ( event.type == 'mousedown' ? event.pageY : event.touches[0].pageY ) - this.offsetTop
    };

    this.longpressTimeout = window.setTimeout( function(){
        this.dispatch('longpress');
    }.bind( this ), 1500 );
});
document.listen('touchmove mousemove', '*', function( event ){

    if( this.isMouseDown ){

        var startX = ( this[ ( event.type == 'touchmove' ? 'touchstart' : 'mousedown' ) ] ).x;
        var startY = ( this[ ( event.type == 'touchmove' ? 'touchstart' : 'mousedown' ) ] ).y;

        var currentX = ( event.type == 'mousemove' ? event.pageX : event.touches[0].pageX ) - this.offsetLeft;
        var currentY = ( event.type == 'mousemove' ? event.pageY : event.touches[0].pageY ) - this.offsetTop;

        var diffX = Math.abs( startX - currentX );
        var diffY = Math.abs( startY - currentY );

        this['swiping'] = {
            x: {
                start: startX,
                current: currentX,
                diff: diffX
            },
            y: {
                start: startY,
                current: currentY,
                diff: diffY
            },
        };

        var swiping = this.dispatch('swiping');

        if( diffX > 0 || diffY > 0 ){
            window.clearTimeout( this.longpressTimeout );
        }

        if( swiping.defaultPrevented ){
            this.isMouseDown = false;
            return;
        }

        if( startX > currentX ){
            if( diffX > 15 ){
                var swipright = this.dispatch('swiperight');
                if( swipright.defaultPrevented ){
                    this.isMouseDown = false
                }
            }
        } else if( startX < currentX ){
            if( diffX > 15 ){
                var swipeleft = this.dispatch('swipeleft');
                if( swipeleft.defaultPrevented ){
                    this.isMouseDown = false
                }
            }
        }
    }
});

document.listen('touchend mouseup', '*', function( event ){
    window.clearTimeout( this.longpressTimeout );
    this.isMouseDown = false;
});
