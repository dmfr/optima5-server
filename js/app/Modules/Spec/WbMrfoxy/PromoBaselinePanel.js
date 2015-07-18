Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoBaselinePanel',{
	extend:'Ext.form.Panel',
	requires:[],

	initComponent: function() {
		var me = this ;
		
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Spec:WbMrfoxy:PromoBaselinePanel','No module reference ?') ;
		}
		if( (me.rowRecord) instanceof WbMrfoxyPromoModel ) {} else {
			Optima5.Helper.logError('Spec:WbMrfoxy:PromoBaselinePanel','No WbMrfoxyPromoModel instance ?') ;
		}
		
		Ext.apply(me,{
			title: 'Baseline Config.',
			padding: '5px 10px',
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 80,
				anchor: '100%'
			},
			layout: 'hbox',
			items: [{
				xtype: 'fieldset',
				flex:1,
				checkboxToggle: true,
				checkboxName: 'baseline_in_force',
				title: 'Force baseline for Selling-In',
				items:[{
					xtype: 'numberfield',
					fieldLabel: 'Volume (kg)',
					name: 'baseline_in_value'
				}]
			},{
				xtype:'box',
				width:16
			},{
				xtype: 'fieldset',
				flex:1,
				checkboxToggle: true,
				checkboxName: 'baseline_out_force',
				title: 'Force baseline for Selling-Out',
				items:[{
					xtype: 'numberfield',
					fieldLabel: 'Volume (kg)',
					name: 'baseline_out_value'
				}]
			}],
			frame: true,
			buttons: [
				{ xtype: 'button', text: 'Confirm' , handler:this.onProceed, scope:this }
			]
		});
		
		this.callParent() ;
		this.getForm().loadRecord(me.rowRecord) ;
	},
	onProceed: function() {
		var me = this,
			form = me.getForm(),
			formValues = form.getValues(false,false,false,true) ;
		
		var ajaxParams = {
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'promo_setBaseline',
			_filerecord_id: me.rowRecord.get('_filerecord_id'),
			data: Ext.JSON.encode(formValues)
		};
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success ) {
					Ext.apply( me.rowRecord.data, formValues ) ;
					me.destroy() ;
				}
			},
			scope: this
		}) ;
	}
	
	
});