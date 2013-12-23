Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoNewCfgPanel',{
	extend:'Ext.form.Panel',
	requires:[
		'Ext.ux.dams.ColorCombo',
		'Ext.ux.dams.ComboBoxCached'
	],

	initComponent: function() {
		var me = this ;
		me.addEvents('proceed') ;
		
		Ext.apply(me,{
			title: 'Encode new promotion',
			padding: '5px 10px',
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 75,
				anchor: '100%'
			},
			layout: 'anchor',
			items: [{
				xtype: 'fieldset',
				title: 'Country of application',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype: 'colorcombo',
					queryMode: 'local',
					forceSelection: true,
					editable: false,
					displayField: 'country_display',
					valueField: 'country_code',
					iconUrlField: 'country_iconurl',
					store: {
						fields: ['country_code','country_display','country_iconurl'],
						data : Optima5.Modules.Spec.WbMrfoxy.HelperCache.countryGetAll()
					},
					
					fieldLabel: 'Country',
					name : 'country_code',
					itemId : 'country_code',
				}]
			},{
				xtype: 'fieldset',
				title: 'Promotion class / Owner brand',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%',
					hideEmptyLabel: false
				},
				layout: 'anchor',
				items: [{
					xtype: 'radio',
					fieldLabel: 'Class',
					name : 'promotion_class',
					boxLabel: 'Official',
					inputValue : 'PROD'
				},{
					xtype: 'radio',
					name : 'promotion_class',
					boxLabel: 'Test / Competition',
					inputValue : 'TEST'
				},{
					xtype: 'comboboxcached',
					queryMode: 'local',
					forceSelection: true,
					editable: false,
					displayField: 'brand_display',
					valueField: 'brand_code',
					store: {
						fields: ['brand_code','brand_display'],
						data : Optima5.Modules.Spec.WbMrfoxy.HelperCache.brandGetAll()
					},
					
					fieldLabel: 'Brand',
					name : 'brand_code',
					itemId : 'brand_code',
				}]
			}],
			frame: true,
			buttons: [
				{ xtype: 'button', text: 'Proceed' , handler:this.onProceed, scope:this }
			]
		});
		
		this.callParent() ;
	},
	
	onProceed: function() {
		var me = this,
			form = this.getForm() ;
			  
		var returnObj = {
			header_countryCode: form.findField('country_code').getValue(),
			header_brandCode: form.findField('brand_code').getValue()
		} ;
		
		me.fireEvent('proceed',this,returnObj) ;
	}
	
	
});