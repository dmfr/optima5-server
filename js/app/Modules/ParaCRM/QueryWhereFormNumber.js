Ext.define('Optima5.Modules.ParaCRM.QueryWhereFormNumber' ,{
	extend: 'Optima5.Modules.ParaCRM.QueryWhereForm',
			  
	requires: [
		'Optima5.Modules.ParaCRM.QueryWhereForm'
	] ,
			  
	bibleId: '',
			  
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 75
			},
			layout: 'anchor',
			items:[{
				xtype: 'fieldset',
				title: 'Filter numbers Mode',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype: 'numberfield',
					format: 'Y-m-d',
					width: 100 ,
					fieldLabel: 'Min',
					name: 'condition_num_gt'
				},{
					xtype: 'numberfield',
					format: 'Y-m-d',
					width: 100 ,
					fieldLabel: 'Max',
					name: 'condition_num_lt'
				}]
			}]
		});
		
		this.callParent() ;
	},
	calcLayout: function(){
		var me = this ;
	}
});
