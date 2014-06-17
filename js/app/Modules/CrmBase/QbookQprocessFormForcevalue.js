Ext.define('Optima5.Modules.CrmBase.QbookQprocessFormForcevalue' ,{
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
				title: 'Force static dataValue',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype: 'combobox',
					fieldLabel: 'Is On ?',
					name: 'condition_forcevalue_isset',
					forceSelection: true,
					editable: false,
					multiSelect: false,
					store: this.comboboxGetStoreCfg('bool'),
					queryMode: 'local',
					displayField: this.comboboxGetStoreDisplayField(),
					valueField: this.comboboxGetStoreValueField()
				},{
					xtype: 'combobox',
					fieldLabel: 'Value',
					name: 'condition_forcevalue_value',
					forceSelection: true,
					editable: false,
					multiSelect: false,
					store: this.comboboxGetStoreCfg('number'),
					queryMode: 'local',
					displayField: this.comboboxGetStoreDisplayField(),
					valueField: this.comboboxGetStoreValueField()
				}]
			}]
		}) ;
		
		this.callParent() ;
	}
}) ;