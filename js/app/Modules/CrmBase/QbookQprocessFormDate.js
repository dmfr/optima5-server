Ext.define('Optima5.Modules.CrmBase.QbookQprocessFormDate' ,{
	extend: 'Optima5.Modules.CrmBase.QbookQprocessForm',
			  
	requires: [
		'Optima5.Modules.CrmBase.QbookQprocessForm'
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
				title: 'Date condition (from/to)',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype: 'combobox',
					fieldLabel: 'After',
					name: 'condition_date_gt',
					forceSelection: true,
					editable: false,
					multiSelect: false,
					store: this.comboboxGetStoreCfg(),
					queryMode: 'local',
					displayField: this.comboboxGetStoreDisplayField(),
					valueField: this.comboboxGetStoreValueField()
				},{
					xtype: 'combobox',
					fieldLabel: 'Before',
					name: 'condition_date_lt',
					forceSelection: true,
					editable: false,
					multiSelect: false,
					store: this.comboboxGetStoreCfg(),
					queryMode: 'local',
					displayField: this.comboboxGetStoreDisplayField(),
					valueField: this.comboboxGetStoreValueField()
				}]
			}]
		}) ;
		
		this.callParent() ;
	}
}) ;