Ext.define('Optima5.Modules.CrmBase.QbookQprocessFormString' ,{
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
				title: 'String condition',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype: 'combobox',
					fieldLabel: 'Equals',
					name: 'condition_string',
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