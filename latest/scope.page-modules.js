document.listen('dragstart', '.page-modules .toolbox li', function( event ){
    var modules = this.closest('.page-modules');
    modules.dragging = this;
});
document.listen('dragstart', '.page-modules .content *', function( event ){
    var modules = this.closest('.page-modules');
    modules.dragging = this;
});
document.listen('dragover', '.page-modules .content', function( event ){
    var modules = this.closest('.page-modules');
    if( modules.dragging ){
        event.preventDefault();
    }
});

document.listen('dragenter', '.page-modules .content', function( event ){
    var target = event.target;
    if( target.attr('sc-allow-children') == true ){
        target.attr('focus', '')
    }
});
document.listen('dragleave', '.page-modules .content', function( event ){
    event.target.attr('focus', null);
});

document.listen('keydown keyup mouseleave', '.page-modules .content', function( event ){
    var modules = this.closest('.page-modules');
    var textarea = modules.findOne('textarea');
    textarea.innerHTML = this.innerHTML;
});

document.listen('drop', '.page-modules .content', function( event ){
    var modules = this.closest('.page-modules');
    if( modules.dragging ){
        var nodeType = modules.dragging.attr('sc-node-type');

        if( nodeType == null ){
            nodeType = 'widget';
        }

        var isTool = modules.dragging.closest('.page-modules .toolbox');

        var node = document.createElement(nodeType);

        node.attr( 'sc-node-type', modules.dragging.attr('sc-node-type') );

        node.attr( 'sc-allow-edit', modules.dragging.attr('sc-allow-edit') );
        node.attr( 'sc-allow-children', modules.dragging.attr('sc-allow-children') );
        node.attr( 'sc-allow-text-form', modules.dragging.attr('sc-allow-text-form') );
        node.attr( 'draggable', 'true' );

        if( modules.dragging.attr('sc-allow-edit') == true ){
            node.attr('contenteditable', 'true');
        }
        if( nodeType === 'widget' ){
            node.attr( 'widget-class', modules.dragging.attr('widget-class') );
            node.attr( 'sc-widget-class', modules.dragging.attr('sc-widget-class') );
            node.innerHTML = modules.dragging.attr('sc-widget-attributes');
        } else if( modules.dragging.attr('sc-allow-children')  == false ){
            node.innerHTML = modules.dragging.attr('title');
        }

        if( event.target.attr('sc-allow-children') == true || event.target == this ){
            event.target.appendChild( node );
        }
        event.target.attr('focus', null);
    }
});
