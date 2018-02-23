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
        var td = e.target.closest('td');
        var newValue = input.value;
        var name = input.attr('name');

        var data = {};
        data[name] = newValue;
        Scope.post({
            url: this.updateUrl,
            data: data,
            onsuccess: function(e){
                var input = this.element.closest('input');
                var td = this.element.closest('td');

                var page = this.datatable.pagination.page;

                var offset = page * this.datatable.pagination.pageSize;
                var index = ( tr.index() + offset );

                this.datatable.dataSource[index][tr.attr('data-id')][td.attr('data-id')] = newValue;

                td.attr('data-value', newValue);
                var span = td.appendChild( document.createElement('span') );
                span.innerHTML = td.attr('data-value');
                td.attr('title', null);
                input.remove();
            }.bind({
                element: e.target,
                datatable: this
            }),
            onerror: function(e){
                var input = this.element.closest('input');
                var td = this.element.closest('td');
                var span = td.appendChild( document.createElement('span') );
                span.innerHTML = td.attr('data-value');
                td.addClass('error');
                td.addClass('fade');
                td.attr('title', 'Could not update record');
                input.remove();
            }.bind({
                element: e.target,
                datatable: this
            })
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

        var tr = thead.appendChild( document.createElement('tr') );
        var c = 0;
        for(var i in this.dataColumns){
            if( typeof this.searchColumns[c] !== 'undefined'){
                var th = document.createElement('th');
                var input = th.appendChild( document.createElement('input') );
                input.attr('name', 'search['+c+']' );
                input.attr('type', 'search');

                input.listen('input',function(e){
                    var inputs = this.datatable.element.find('input[type="search"]');
                    var search = {};
                    for(i=0;i<inputs.length;i++){
                        if( inputs[i].value.length > 0 ){
                            var index = inputs[i].name.replace('search[', '').replace(']','');
                            search[index] = inputs[i].value;
                        }
                    }
                    this.datatable.search( search );
                }.bind({
                    element: input,
                    datatable: this
                }));

                tr.appendChild( th );
            }
            c++;
        }

        this.element.appendChild( table );
    },
    createPagination: function( length ){

        this.pages = parseInt( Math.round( length / this.pagination.pageSize ) );

        var ul = this.element.findOne('ul.pagination');
        if( !ul ){
            ul = this.element.appendChild( document.createElement('ul') );
        }

        ul.innerHTML = '';

        ul.className = 'pagination';
        var range = 3;

        var start = this.pagination.page - (range-2);
        if( start < 1 ){
            start = 1;
        }
        var end = this.pagination.page + range;
        if( end > this.pages ){
            end = this.pages;
        }

        for(i=start;i<=end;i++){
            var li = ul.appendChild( document.createElement('li') );
            li.innerHTML = i; li.attr('page', i);
            if( (i-1) == this.pagination.page ){
                li.className = 'active';
            }

            li.listen('click', function(e){
                this.datatable.pagination.page = parseFloat( this.element.attr('page') - 1 );

                var active = this.element.closest('ul').findOne('li.active');
                active.className = '';
                this.element.className = 'active';
                this.datatable.data();
                this.datatable.display();
            }.bind({
                datatable: this,
                element: li
            }))
        }

    },
    data: function(){
        this.dataSubset = [];
        var subsetCount = 0;

        var skip = true;
        if( typeof this.query == 'object' ){
            for(var i in this.query){
                if( this.query[i].length == 0 ){
                    delete this.query[i];

                } else {
                    skip = false;
                }
            }
        }

        if( skip == false ){
            if( typeof this.query == 'object' ){
                for(var ds in this.dataSource){
                    var item = this.dataSource[ds];
                    var key = Object.keys(item)[0];
                    var dataItem = item[key];

                    for(var i in this.query){
                        if( this.query[i].length > 0 ){
                            if( this.matches( this.query[i], dataItem[i] ) == true ){
                                this.dataSubset.push( item );
                                break;
                            }
                        }
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
                td.attr('data-id', columnCount);
                td.attr('data-value', dataItem[columnCount]);
                td.attr('data-name', i);

                var span = td.appendChild( document.createElement('span') );
                span.innerHTML = dataItem[columnCount];
                columnCount++;
            }
            index++;
        }
        var span = this.element.findOne('.summary');
        if( span ){
            span.remove();
        }
        span = this.element.appendChild( document.createElement('span') );
        span.className = 'summary';
        span.innerHTML = start + "-" + ( this.dataSubset.length)
    },
    matches: function( query, attribute ){
        if( attribute.toString().indexOf( query ) !== -1 ){
            return true;
        }
        return false;
    },
    search: function( query, column ){
        this.query = query;
        this.pagination.page = 0;
        this.data();
        this.display();
    }
});

extend( Scope.widgets ).with({
    datatable: datatable
});



<div>
    <input id='w01-search' type="search"/>
</div>
<div id='w01' class='datatable'></div>

<script>

//     // var ds = [
//     //     {1: [1, 'brothom', 'user@username.com', 1, 0, 1]},
//     //     {2: [2, 'nickinatorz', 'nickinatorz@username.com', 1, 0, 1]},
//     //     {3: [3, 'wesley931', 'wesley931@username.com', 1, 0, 1]},
//     //     {4: [4, 'kecin', 'kecin@gmail.com', 1, 0, 1]},
//     //     {5: [5, 'dave', 'user@gmail.com', 1, 0, 1]},
//     //     {6: [6, 'fred', 'user@gmail.com', 1, 0, 1]},
//     //     {7: [7, 'han', 'user@gmail.com', 1, 0, 1]},
//     //     {8: [8, 'maik', 'mikkelz@gmail.com', 1, 0, 1]},
//     //     {9: [9, 'lolo', 'yoyo@yahoo.com', 1, 0, 1]},
//     //     {10: [10, 'derrik', 'dr@yahoo.com', 1, 0, 1]},
//     //     {11: [11, 'han sololol', 'griefmeister@yahoo.com', 1, 0, 1]}
//     // ];
//
//     var ds = [];
//     i = 1;
//     while(i<=93){
//         var obj = {};
//
//         var isActive = Math.floor(Math.random() * (1 - 0 + 1)) + 0;
//         var mailValidated = Math.floor(Math.random() * (1 - 0 + 1)) + 0;
//         var mailSubscribed = Math.floor(Math.random() * (1 - 0 + 1)) + 0;
//
//         var mails = ['gmail', 'yahoo', 'hotmail', 'outlook', 'live'];
//         var mail = mails [ Math.floor(Math.random()*( ( mails.length -1 ) - ( 0 ) +1)+( 0 )) ];
//
//         obj[i] = [i, 'han sololol_' + i, 'griefmeister@' +mail+ '.com', isActive, mailValidated, mailSubscribed];
//         ds.push(obj);
//         i++;
//     }
//
//
//     var dc = {
//         id: '#',
//         username: 'user',
//         email: 'mail',
//         is_active: 'active',
//         is_mail_validated: 'validated',
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
//                 pageSize: 20,
//                 page: 0
//             },
//             query: ''
//         } );
//         dt.construct();
//
//         document.findOne('#w01-search').listen('input', function(e){
//             if( this.value.length > 0 ){
//                 dt.search( {
//                     1: this.value
//                 } );
//             } else {
//                 dt.search();
//             }
//         })
//
//     })
// </script>
