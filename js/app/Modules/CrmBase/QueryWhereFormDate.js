Ext.define('Optima5.Modules.CrmBase.QueryWhereFormDate' ,{
	extend: 'Optima5.Modules.CrmBase.QueryWhereForm',
			  
	requires: [
		'Optima5.Modules.CrmBase.QueryWhereForm',
		'Optima5.Modules.CrmBase.BibleTreePicker',
		'Optima5.Modules.CrmBase.BiblePicker'
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
				title: 'Filter Date Mode',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype: 'datefield',
					format: 'Y-m-d',
					width: 100 ,
					fieldLabel: 'After',
					name: 'condition_date_gt'
				},{
					xtype: 'datefield',
					format: 'Y-m-d',
					width: 100 ,
					fieldLabel: 'Before',
					name: 'condition_date_lt'
				}]
			}]
		});
		
		this.callParent() ;
	},
	calcLayout: function(){
		var me = this ;
	}
});
