Ext.define('Optima5.Modules.CrmBase.QbookInputvarForm' ,{
	extend: 'Ext.form.Panel',
			  
	requires: [] ,
			 
	layout: 'anchor',
	fieldDefaults: {
		labelAlign: 'left',
		labelWidth: 75
	},
			  
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			defaults: {
				anchor: '100%'
			}
		});
		
		this.callParent() ;
		
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
