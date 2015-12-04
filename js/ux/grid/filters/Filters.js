Ext.define('Ext.ux.grid.filters.Filters',{
	extend: 'Ext.grid.filters.Filters',
	alias: 'plugin.uxgridfilters',
	
	bindStore: function(store) {
		this.callParent(arguments) ;
		if( store ) {
			store.on('filterchange',this.updateColumnHeadings,this) ;
		} else if( this.store ) {
			this.store.un('filterchange',this.updateColumnHeadings,this);
		}
	},
	updateColumnHeadings : function () {
		var me = this,
			headerCt = me.grid.getView().headerCt;
		if (headerCt) {
			Ext.Array.each( headerCt.getGridColumns(), function(header) {
				if( !header.origText ) {
					header.origText = header.text ;
				}
				
				var columnFilter = header.filter ;
				if( columnFilter && columnFilter.active ) {
					var addText = '',
						filterData = columnFilter.filter ;
					switch( columnFilter.type ) {
						case 'date' :
						case 'number' :
							Ext.Object.each( filterData, function(comparison,filterDataIdx) {
								var value = filterDataIdx.getValue() ;
								if( !value ) {
									return ;
								}
								if( columnFilter.type == 'date' ) {
									value = Ext.Date.format(value,columnFilter.dateFormat) ;
								}
								switch( comparison ) {
									case 'eq' :
										addText += '&nbsp;'+'='+'&nbsp;'+value+'<br>' ;
										break ;
									case 'lt' :
										addText += '&nbsp;'+'<='+'&nbsp;'+value+'<br>' ;
										break ;
									case 'gt' :
										addText += '&nbsp;'+'>='+'&nbsp;'+value+'<br>' ;
										break ;
								}
							}) ;
							break ;
							
						case 'boolean' :
							var value = filterData.getValue() ;
							if( value === true ) {
								value = 'YES' ;
							}
							if( value === false ) {
								value = 'NO' ;
							}
							addText += '&nbsp;'+'='+'&nbsp;'+value+'<br>' ;
							break ;
							
						default :
							var value = filterData.getValue() ;
							if( Ext.isArray(value) ) {
								value = value.join(' + ') ;
							}
							addText += '&nbsp;'+'='+'&nbsp;'+value+'<br>' ;
							break ;
					}
					header.setText(header.origText+'<div class="ux-filtered-column">'+addText+'</div>') ;
				} else if( header.origText ) {
					header.setText( header.origText ) ;
				}
			},this) ;
			headerCt.updateLayout() ;
		}
	},
	
	getFilterData: function() {
		var me = this,
			store = me.store,
			storeFilters = store.getFilters() ;
		if( !storeFilters ) {
			return [] ;
		}
		var filterArr = [] ;
		storeFilters.each( function(filter) {
			filterArr.push( filter.serialize() ) ;
		}) ;
		return filterArr ;
	}
});