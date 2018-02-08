window['scope.slide'] = function( element ){
    this.element = element;
    this.ul = this.element.findOne('ul');
    this.wrapper = this.element.findOne('.wrapper');
    this.index = 1;

    var count = this.ul.children.length;

    this.ul.css({
        'width': ( 100 * count ) + "%"
    } );

    this.ul.children.forEach(function(el){
        el.css({
            width: ( 100 / count ) + '%'
        });
    });

    this.ul.listen('swipeleft', function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        this.slidePrevious();
    }.bind(this))

    this.ul.listen('longpress', function(e){
        console.log('longpress');
    }.bind(this))

    this.ul.listen('swiperight', function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        this.slideNext();
    }.bind(this))

    this.element.attr('widget-state', 'complete');
}

extend( window['scope.slide'] ).with({
    slideNext: function(){
        var currentIndex = this.getIndex();
        var newIndex = currentIndex + 1;
        if( newIndex <= this.ul.children.length ){
            this.slideTo( newIndex );
        } else {
            this.slideTo( 1 );
        }
    },
    slidePrevious: function(){
        var currentIndex = this.getIndex();
        var newIndex = currentIndex - 1;
        if( newIndex >= 1 ){
            this.slideTo( newIndex );
        } else {
            this.slideTo( this.ul.children.length );
        }
    },
    slideTo: function( i ){
        this.setIndex(i);
        var i = i - 1;

        var step = ( 100 / this.ul.children.length );

        var perc = step * i;

        var offsetLeft = -(perc) + "%";

        this.ul.css({
            transform: 'translateX(' + offsetLeft + ')'
        });
    },
    getIndex: function( i ){
        return this.index;
    },
    setIndex: function( i ){
        this.index = i;
    }
})
