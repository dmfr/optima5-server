Ext.define('Ext.ux.dams.FieldList',{
	extend:'Ext.form.field.Base',
	alias: 'widget.damsfieldlist',
	requires: ['Ext.util.Format', 'Ext.XTemplate','Ext.grid.Panel'], 
	fieldSubTpl: [  
		'<div id="{id}"></div>',
		{
			compiled: true,          
			disableFormats: true     
		}           
	],

	isFormField: true,
	submitValue: true,
	//resizable: true,
	
	onDestroy: function() {
		if( this.mygrid ) {
			this.mygrid.destroy() ;
		}
		this.callParent();
	},
			  
	afterRender: function() {
		this.callParent();
		
		var width = 200 ;
		var height = 75 ;
		
		this.mygrid = Ext.create('Ext.grid.Panel', {
			store: {
				fields: [
					{name: 'id', type: 'string'},
					{name: 'text', type: 'string'}
				],
				data: [],
				proxy: {
					type: 'memory',
					reader: {
						type: 'json'
					}
				}
			} ,
			hideHeaders: true,
			columns: [{
				flex: 1,
				dataIndex: 'text'
			}],
			renderTo: this.getInputId(),
			width: width,
			height: height
		});
	},
			  
	getSubmitData: function() {
		var stdSubmitData = this.callParent(arguments) ;
		var arrIds = [] ;
		this.mygrid.getStore().each( function(v) {
			arrIds.push( v.get('id') ) ;
		},this) ;
		
		var k = this.getName() ;
		return {
			k: arrIds
		};
	},
	
	setValue: function( data ) {
		if( !this.mygrid ) {
			return ;
		}
		this.mygrid.getStore().loadData(data) ;
	},
	
});
