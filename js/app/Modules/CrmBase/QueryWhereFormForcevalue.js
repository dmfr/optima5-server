Ext.define('Optima5.Modules.CrmBase.QueryWhereFormForcevalue' ,{
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
				title: 'Force debug value',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype:'checkbox',
					name:'condition_forcevalue_isset',
					inputValue: 'true',
					uncheckedValue: 'false',
					boxLabel:'Force data select to value ?'
				},{
					xtype: 'numberfield',
					width: 100 ,
					fieldLabel: 'Static value',
					name: 'condition_forcevalue_value'
				}]
			}]
		});
		
		this.callParent() ;
	},
	calcLayout: function(){
		var me = this ;
		me.down('numberfield').setVisible( me.down('checkbox').getValue() ) ;
	}
});
