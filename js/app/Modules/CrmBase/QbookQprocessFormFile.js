Ext.define('Optima5.Modules.CrmBase.QbookQprocessFormFile' ,{
	extend: 'Optima5.Modules.CrmBase.QbookQprocessForm',
			  
	requires: [
		'Optima5.Modules.CrmBase.QbookQprocessForm'
	] ,
			  
	initComponent: function() {
		var me = this ;
		
		Ext.apply( me, {
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 90
			},
			layout: 'anchor',
			items:[{
				xtype: 'fieldset',
				title: 'Match filerecords',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype: 'combobox',
					fieldLabel: 'Node / Record',
					name: 'condition_file_ids',
					forceSelection: true,
					editable: false,
					multiSelect: false,
					store: this.comboboxGetStoreCfg(),
					queryMode: 'local',
					displayField: this.comboboxGetStoreDisplayField(),
					valueField: this.comboboxGetStoreValueField(),
				}]
			}]
		}) ;
		
		this.callParent() ;
	}
}) ;