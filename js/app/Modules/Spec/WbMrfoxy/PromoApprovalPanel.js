Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoApprovalPanel',{
	extend:'Ext.form.Panel',
	requires:[
		'Ext.ux.dams.ColorCombo',
		'Ext.ux.dams.ComboBoxCached'
	],

	initComponent: function() {
		var me = this ;
		me.addEvents('proceed') ;
		
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Spec:WbMrfoxy:PromoApprovalPanel','No module reference ?') ;
		}
		if( (me.rowRecord) instanceof WbMrfoxyPromoModel ) {} else {
			Optima5.Helper.logError('Spec:WbMrfoxy:PromoApprovalPanel','No WbMrfoxyPromoModel instance ?') ;
		}
		
		Ext.apply(me,{
			title: 'Approvals',
			padding: '5px 10px',
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 75,
				anchor: '100%'
			},
			layout: 'anchor',
			items: [{
				xtype: 'checkbox',
				boxLabel: 'Approved by Sales Director',
				readOnly: !Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQuery( me.rowRecord.get('country_code'), 'DS' ),
				checked: me.rowRecord.get('approv_ds'),
				boxLabelCls: (!Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQuery( me.rowRecord.get('country_code'), 'DS' ) ? 'op5-spec-mrfoxy-promorow-approval-disabled' : 'op5-spec-mrfoxy-promorow-approval-enabled'),
				name: 'approv_ds'
			},{
				xtype: 'checkbox',
				boxLabel: 'Approved by Financial Officer',
				readOnly: !Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQuery( me.rowRecord.get('country_code'), 'DF' ),
				boxLabelCls: (!Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQuery( me.rowRecord.get('country_code'), 'DF' ) ? 'op5-spec-mrfoxy-promorow-approval-disabled' : 'op5-spec-mrfoxy-promorow-approval-enabled'),
				checked: me.rowRecord.get('approv_df'),
				name: 'approv_df'
			}],
			frame: true,
			buttons: [
				{ xtype: 'button', text: 'Confirm' , handler:this.onProceed, scope:this }
			]
		});
		
		this.callParent() ;
	},
	onProceed: function() {
		var me = this,
			form = me.getForm() ;
			  
		var data = {
			approv_ds: form.findField('approv_ds').getValue(),
			approv_df: form.findField('approv_df').getValue()
		};
		
		var ajaxParams = {
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'promo_setApproval',
			_filerecord_id: me.rowRecord.get('_filerecord_id'),
			data: Ext.JSON.encode(data)
		};
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success ) {
					Ext.apply( me.rowRecord.data, data ) ;
					me.destroy() ;
				}
			},
			scope: this
		}) ;
	}
	
	
});