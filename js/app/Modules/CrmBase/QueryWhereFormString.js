Ext.define('Optima5.Modules.CrmBase.QueryWhereFormString' ,{
	extend: 'Optima5.Modules.CrmBase.QueryWhereForm',
			  
	requires: [
		'Optima5.Modules.CrmBase.QueryWhereForm'
	] ,
			  
	bibleId: '',
			  
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 60
			},
			layout: 'anchor',
			items:[{
				xtype: 'fieldset',
				title: 'Boolean value',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype:'textfield',
					name:'condition_string',
					fieldLabel:'Equals'
				}]
			}]
		});
		
		this.callParent() ;
	},
	calcLayout: function(){
		var me = this ;
	}
});
