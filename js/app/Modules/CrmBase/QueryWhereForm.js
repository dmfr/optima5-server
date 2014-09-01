Ext.define('Optima5.Modules.CrmBase.QueryWhereForm' ,{
	extend: 'Ext.form.Panel',
			  
	requires: [] ,
			 
	layout: 'anchor',
	fieldDefaults: {
		labelAlign: 'left',
		labelWidth: 75
	},
	items:[],

			  
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			defaults: {
				anchor: '100%'
			}
		});
		
		this.callParent() ;
		
		// console.dir( me.query('combobox') ) ;
		
		this.getForm().getFields().each(function(field) {
			field.on('change',function(){
				me.calcLayout() ;
				me.fireEvent('change') ;
			},me) ;
		},me) ;
	},
			  
	calcLayout: function() {
		
	}
});
