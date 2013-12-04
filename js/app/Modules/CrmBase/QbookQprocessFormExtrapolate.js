Ext.define('Optima5.Modules.CrmBase.QbookQprocessFormExtrapolate' ,{
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
				title: 'Extrapolate on timeline',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype: 'combobox',
					fieldLabel: 'Base from',
					name: 'extrapolate_src_date_from',
					forceSelection: true,
					editable: false,
					multiSelect: false,
					store: this.comboboxGetStoreCfg(),
					queryMode: 'local',
					displayField: this.comboboxGetStoreDisplayField(),
					valueField: this.comboboxGetStoreValueField(),
				},{
					xtype: 'combobox',
					fieldLabel: 'Output from',
					name: 'extrapolate_calc_date_from',
					forceSelection: true,
					editable: false,
					multiSelect: false,
					store: this.comboboxGetStoreCfg(),
					queryMode: 'local',
					displayField: this.comboboxGetStoreDisplayField(),
					valueField: this.comboboxGetStoreValueField(),
				},{
					xtype: 'combobox',
					fieldLabel: 'Output to',
					name: 'extrapolate_calc_date_to',
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