Ext.define('Optima5.Modules.Spec.DbsPeople.RealDayPrintTable',{
	extend: 'Ext.Component',
	
	initComponent: function() {
		this.tpl = new Ext.XTemplate(
			'<div class="op5-spec-dbspeople-printheader-title">{title}</div>',
			
			'<hr>',
			
			'<div class="x-panel x-panel-body x-grid-view">',
			'<table class="x-grid-table">',
			'<tpl for="table">',
			'<tr class="x-grid-row">',
			'<tpl for=".">',
				"<td {[!Ext.isEmpty(values.width) ? 'width=\"'+values.width+'\"' : '']} class=\"x-grid-td x-grid-cell {cls}\" >",
				'<div class="x-grid-cell-inner">{value}</div>',
				"</td>",
			'</tpl>',
			'</tr>',
			'</tpl>',
			'</table>',
			'</div>',
			{
				disableFormats: true
			}
		);
		
		if( this.columns && this.store ) {
			this.data = this.prepareData(this.columns,this.store) ;
		}
		
		this.callParent() ;
	},
	
	update: function( columns, store ) {
		this.data = this.prepareData(columns,store) ;
		this.tpl.overwrite(this.el, this.data);
	},
	
	prepareData: function(columns,store) {
		var title = 'Impression Semaine' ;
		if( this.dateSql ) {
			title = 'Impression jour ' + this.dateSql ;
		}
		
		var activeColumns = [] ;
		Ext.Array.each(columns,function(col) {
			if( !Ext.isEmpty(this.dateSql) && !Ext.isEmpty(col.dateSql) && (col.dateSql != this.dateSql) ) {
				return ;
			}
			activeColumns.push(col) ;
		},this) ;
		
		var table = [] ;
		
		var dataRow = [] ;
		Ext.Array.each( activeColumns, function(col) {
			dataRow.push({
				width: col.width,
				value: col.text
			}) ;
		}) ;
		table.push(dataRow) ;
		
		store.each( function(gridRecord) {
			var dataRow = [] ;
			Ext.Array.each( activeColumns, function(col) {
				var value = gridRecord.get(col.dataIndex) ;
				if( value == null ) {
					dataRow.push({
						width: col.width,
						value: ''
					});
				}
				if( col.renderer ) {
					var metaData = {
						tdCls: '',
						style: ''
					}
					var strValue = col.renderer.call( this, value, metaData, gridRecord ) ;
					
					dataRow.push({
						width: col.width,
						cls: metaData.tdCls,
						value: strValue
					});
				} else {
					dataRow.push({
						width: col.width,
						value: value
					});
				}
			}) ;
			table.push(dataRow) ;
		}) ;
		
		return {
			title: title,
			table: table
		} ;
	}
}) ;