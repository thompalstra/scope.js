if( !Scope.hasOwnProperty('widgets') ){
    extend( Scope ).with({
        widgets: {}
    });
}

window['datatable'] = function( arg ){
    this.element = null;
    this.dataColumns = [];
    this.searchColumns = [];
    this.dataSource = [];
    this.pagination = {
        pageSize: 10,
        page: 0
    };
    this.query = '';
    this.updateUrl = location.href;

    for(var i in arg){
        if( !this.hasOwnProperty(i) ){
            console.warn('Setting unknown datatable property ' + i + '.');
        } else {
            this[i] = arg[i];
        }
    }

    var c = 0;
    var searchColumns = {};
    for(var dc in this.dataColumns){
        for(var sc in this.searchColumns){
            var dataName = dc;
            var searchName = this.searchColumns[sc];
            if( dataName == searchName ){
                searchColumns[c] = c;
            }
        }
        c++;
    }
    this.searchColumns = searchColumns;

    this.element.listen('dblclick', 'tr td',function(e){
        var td = e.target.closest('td');
        td.removeClass('error');
        td.removeClass('fade');
        var tr = e.target.closest('tr');
        var span = td.findOne('span');
        span.remove();
        var input = td.appendChild( document.createElement('input') );
        input.value = td.attr('data-value');
        var name = 'update[' + tr.attr('data-id') + '][' + td.attr('data-name') + ']';

        input.attr('name', name);

        input.focus();
    }.bind(this))
    this.element.listen('focusout', 'tr td input',function(e){
        var input = e.target.closest('input');
        var tr = e.target.closest('tr');
        var newValue = input.value;
        var name = input.attr('name');

        var data = {};
        data[name] = newValue;
        Scope.post({
            url: this.updateUrl,
            data: data,
            onsuccess: function(e){
                var input = this.closest('input');
                var td = this.closest('td');
                td.attr('data-value', newValue);
                var span = td.appendChild( document.createElement('span') );
                span.innerHTML = td.attr('data-value');
                td.attr('title', null);
                input.remove();
            }.bind(e.target),
            onerror: function(e){
                var input = this.closest('input');
                var td = this.closest('td');
                var span = td.appendChild( document.createElement('span') );
                span.innerHTML = td.attr('data-value');
                td.addClass('error');
                td.addClass('fade');
                td.attr('title', 'Could not update record');
                input.remove();
            }.bind(e.target)
        });
    }.bind(this))
}

extend( datatable ).with({
    construct: function(){
        this.createTable();
        this.data();
        this.display();
    },
    createTable: function(){
        var table = document.createElement('table');
        var thead = table.appendChild( document.createElement('thead') );
        var tbody = table.appendChild( document.createElement('tbody') );
        var tr = thead.appendChild( document.createElement('tr') );
        for(var i in this.dataColumns){
            var th = document.createElement('th');
            th.innerHTML = this.dataColumns[i];
            tr.appendChild( th );
        }
        this.element.appendChild( table );
    },
    createPagination: function( length ){

        this.pages = length / this.pagination.pageSize + 1;

        var ul = this.element.findOne('ul.pagination');
        if( !ul ){
            ul = this.element.appendChild( document.createElement('ul') );
        }

        ul.innerHTML = '';

        ul.className = 'pagination';
        var i = 1;
        while(i < this.pages){
            var li = ul.appendChild( document.createElement('li') );
            li.innerHTML = i;
            li.attr('page', i);
            if( this.pagination !== false && this.pagination.page == (i-1) ){
                li.className = 'active';
            }
            li.listen('click', function(e){
                this.datatable.pagination.page = parseFloat( this.element.attr('page') - 1 );

                var active = this.element.closest('ul').findOne('li.active');
                active.className = '';
                this.element.className = 'active';


                this.datatable.display();
            }.bind({
                datatable: this,
                element: li
            }))
            i++;
        }
    },
    data: function(){
        this.dataSubset = [];
        var subsetCount = 0;
        if( this.query){
            for(var i in this.dataSource){
                var item = this.dataSource[i];
                var key = Object.keys(item)[0];
                var dataItem = item[key];

                for(var i in this.searchColumns){
                    if( this.matches( this.query, dataItem[i] ) == true ){
                        this.dataSubset.push( item );
                        break;
                    }
                }
            }
        } else {
            this.dataSubset = this.dataSource;
        }

        if( this.pagination !== false ){
            this.createPagination( Object.keys(this.dataSubset).length );
        }
    },
    display: function(){

        if( this.pagination !== false ){
            var start = this.pagination.pageSize * this.pagination.page;
            var index = start;
            var end = start + this.pagination.pageSize;
        } else {
            var start = 0;
            var index = start;
            var end = Object.keys(this.dataSource).length;
        }


        var tbody = this.element.findOne('tbody');
        if(tbody){
            tbody.innerHTML = '';
        }

        while( ( index >= start && index < end ) && this.dataSubset[index] !== undefined ){
            var item = this.dataSubset[index];
            var key = Object.keys(item)[0];
            var dataItem = item[key];
            var tr = tbody.appendChild( document.createElement('tr') );

            tr.attr('data-id', key);

            var columnCount = 0;

            for(var i in this.dataColumns){
                var td = tr.appendChild( document.createElement('td') );
                td.attr('data-value', dataItem[columnCount]);
                td.attr('data-name', i);

                if( this.query.length > 0 ){
                    if( this.searchColumns[columnCount] !== undefined ){
                        if( this.matches( this.query, dataItem[columnCount] ) == true ){
                            td.addClass('matches');
                        }
                    }
                }

                var span = td.appendChild( document.createElement('span') );
                span.innerHTML = dataItem[columnCount];
                columnCount++;
            }
            index++;
        }
    },
    matches: function( query, attribute ){
        switch( typeof attribute ){
            case 'number':
                if( attribute == parseFloat( query ) ){
                    console.log('match');
                    return true;
                }
            break;
            case 'string':
                if( attribute.indexOf( query ) !== -1 ){
                    return true;
                }
            break;
        }

        return false;
    },
    search: function( query ){
        this.query = query;
        this.pagination.page = 0;
        this.data();
        this.display();
    }
});

extend( Scope.widgets ).with({
    datatable: datatable
});



// <div>
//     <input id='wo01-search' type="search"/>
// </div>
// <div id='w01' class='datatable'></div>
//
// <script>
//
//     var ds = [
//         {1: [1, 'brothom', 'user@username.com', 1, 0, 1]},
//         {2: [2, 'nickinatorz', 'nickinatorz@username.com', 1, 0, 1]},
//         {3: [3, 'wesley931', 'wesley931@username.com', 1, 0, 1]},
//         {4: [4, 'kecin', 'kecin@gmail.com', 1, 0, 1]},
//         {5: [5, 'dave', 'user@gmail.com', 1, 0, 1]},
//         {6: [6, 'fred', 'user@gmail.com', 1, 0, 1]},
//         {7: [7, 'han', 'user@gmail.com', 1, 0, 1]},
//         {8: [8, 'maik', 'mikkelz@gmail.com', 1, 0, 1]},
//         {9: [9, 'lolo', 'yoyo@yahoo.com', 1, 0, 1]},
//         {10: [10, 'derrik', 'dr@yahoo.com', 1, 0, 1]},
//         {11: [11, 'han sololol', 'griefmeister@yahoo.com', 1, 0, 1]}
//     ];
//     var dc = {
//         id: '#',
//         username: 'user',
//         email: 'mail',
//         is_active: 'active',
//         is_mail_validated: 'mail validated',
//         is_mail_subscribed: 'subscribed'
//     };
//     var sc = ['id', 'username', 'email'];
//     var dt;
//
//
//
//     document.listen('ready', function(e){
//         dt = new Scope.widgets.datatable( {
//             element: document.findOne('#w01'),
//             updateUrl: 'http://scope.php',
//             dataSource: ds,
//             dataColumns: dc,
//             searchColumns: sc,
//             pagination: {
//                 pageSize: 3,
//                 page: 0
//             },
//             query: ''
//         } );
//         dt.construct();
//
//         document.findOne('#wo01-search').listen('input', function(e){
//             dt.search( this.value );
//         })
//
//     })
// </script>
