Ext.define('Optima5.Modules.ParaCRM.QueryGroupFormDate' ,{
	extend: 'Optima5.Modules.ParaCRM.QueryGroupForm',
			  
	requires: [
		'Optima5.Modules.ParaCRM.QueryGroupForm'
	] ,
			  
	initComponent: function() {
		var me = this ;
		
		Ext.apply( me, {
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 75
			},
			layout: 'anchor',
			items:[{
				xtype: 'fieldset',
				title: 'Aggregate Date Mode',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype: 'combobox',
					name: 'group_date_type',
					fieldLabel: 'Group by',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['mode','lib'],
						data : [
							{mode:'DAY', lib:'Day (Y-m-d)'},
							{mode:'WEEK', lib:'Week (Y-week)'},
							{mode:'MONTH', lib:'Month (Y-m)'},
							{mode:'YEAR', lib:'Year (Y)'}
						]
					},
					queryMode: 'local',
					displayField: 'lib',
					valueField: 'mode'
				}]
			}]
		}) ;
		
		
		
		this.callParent() ;
	},
	calcLayout: function(){
		var me = this ;
	}
}) ;