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
		
		var storeCfg = {
			fields: ['color','code','text'],
			data : [
				{color:'', code:'_', text:''},
				{color:'green', code:'OK', text:'Approved'},
				{color:'red', code:'NOK', text:'Denied'}
			]
		}
		
		Ext.apply(me,{
			title: 'Approvals',
			padding: '5px 10px',
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 110,
				anchor: '100%'
			},
			layout: 'anchor',
			items: [{
				xtype: 'fieldcontainer',
				fieldLabel: 'Sales Director',
				layout:{
					type:'hbox',
					align:'stretch'
				},
				items:[{
					xtype: 'colorcombo',
					width: 100,
					queryMode: 'local',
					forceSelection: true,
					editable: false,
					displayField: 'text',
					valueField: 'code',
					iconColorField: 'color',
					store: storeCfg,
					allowBlank: true,
					name : 'approv_ds_code',
					value: ( me.rowRecord.get('approv_ds') ? (me.rowRecord.get('approv_ds_ok') ? 'OK' : 'NOK' ) : '_' ),
					readOnly: !Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQuery( me.rowRecord.get('country_code'), 'DS' )
				},{
					xtype: 'textfield',
					flex: 1,
					name: 'approv_ds_obs',
					value: me.rowRecord.get('approv_ds_obs'),
					readOnly: !Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQuery( me.rowRecord.get('country_code'), 'DS' )
				}]
			},{
				xtype: 'fieldcontainer',
				fieldLabel: 'Financial officer',
				layout:{
					type:'hbox',
					align:'stretch'
				},
				items:[{
					xtype: 'colorcombo',
					width: 100,
					queryMode: 'local',
					forceSelection: true,
					editable: false,
					displayField: 'text',
					valueField: 'code',
					iconColorField: 'color',
					store: storeCfg,
					allowBlank: true,
					name : 'approv_df_code',
					value: ( me.rowRecord.get('approv_df') ? (me.rowRecord.get('approv_df_ok') ? 'OK' : 'NOK' ) : '_' ),
					readOnly: !Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQuery( me.rowRecord.get('country_code'), 'DF' )
				},{
					xtype: 'textfield',
					flex: 1,
					name: 'approv_df_obs',
					value: me.rowRecord.get('approv_df_obs'),
					readOnly: !Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQuery( me.rowRecord.get('country_code'), 'DF' )
				}]
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
			approv_ds: 0,
			approv_ds_ok: 0,
			approv_ds_obs: '',
			approv_df: 0,
			approv_df_ok: 0,
			approv_df_obs: 0
		};
		switch( form.findField('approv_ds_code').getValue() ) {
			case 'OK' :
				data.approv_ds_ok = 1 ;
			case 'NOK' :
				data.approv_ds = 1;
				break ;
		}
		data.approv_ds_obs = form.findField('approv_ds_obs').getValue() ;
		switch( form.findField('approv_df_code').getValue() ) {
			case 'OK' :
				data.approv_df_ok = 1 ;
			case 'NOK' :
				data.approv_df = 1;
				break ;
		}
		data.approv_df_obs = form.findField('approv_df_obs').getValue() ;
		
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