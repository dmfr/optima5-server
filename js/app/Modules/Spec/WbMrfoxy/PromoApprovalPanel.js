Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoApprovalPanel',{
	extend:'Ext.form.Panel',
	requires:[
		'Ext.ux.dams.ColorCombo',
		'Ext.ux.dams.ComboBoxCached'
	],
	
	statics: {
		static_testRecord: function( promoRecord ) {
			if( !promoRecord || Ext.getClassName(promoRecord) != 'WbMrfoxyPromoModel' ) {
				return false ;
			}
			return true ;
		},
		static_approvalIsOn: function( promoRecord ) {
			if( !this.static_testRecord(promoRecord) ) {
				return false ;
			}
			if(
				Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQueryRole(['ADM','DS','DF']) 
				&& promoRecord.get('is_prod') == 'PROD'
				&& promoRecord.get('status_percent') >= 20
			) {
				return true ;
			}
			return false ;
		},
		static_approvalIsReadOnly: function( promoRecord ) {
			if( !this.static_approvalIsOn(promoRecord) ) {
				return true ;
			}
			if( promoRecord.get('status_percent') > 20 ) {
				return true ;
			}
			return false ;
		},
		static_approvalIsBlink: function( promoRecord ) {
			if( !this.static_approvalIsOn(promoRecord) || this.static_approvalIsReadOnly(promoRecord) ) {
				return false ;
			}
			if( !promoRecord.get('approv_ds') && Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQueryRole(['ADM','DS']) ) {
				return true ;
			}
			if( !promoRecord.get('approv_df') && Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQueryRole(['ADM','DF']) ) {
				return true ;
			}
			return false ;
		}
	},

	initComponent: function() {
		var me = this ;
		me.addEvents('saved') ;
		
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
		
		var forceReadOnly = this.self.static_approvalIsReadOnly( me.rowRecord ) ;
		Ext.apply(me,{
			title: 'Approvals',
			padding: '5px 10px',
			frame: true,
			layout: 'card',
			items: [{
				xtype: 'form',
				itemId: 'form',
				bodyCls: 'ux-noframe-bg',
				border: false,
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
						readOnly: (forceReadOnly || !Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQueryRole('DS'))
					},{
						xtype: 'textfield',
						flex: 1,
						name: 'approv_ds_obs',
						value: me.rowRecord.get('approv_ds_obs'),
						readOnly: (forceReadOnly || !Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQueryRole('DS'))
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
						readOnly: (forceReadOnly || !Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQueryRole('DF'))
					},{
						xtype: 'textfield',
						flex: 1,
						name: 'approv_df_obs',
						value: me.rowRecord.get('approv_df_obs'),
						readOnly: (forceReadOnly || !Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQueryRole('DF'))
					}]
				}],
				buttons: [
					{ xtype: 'button', text: 'Confirm' , handler:this.onProceed, scope:this }
				]
			},{
				xtype: 'panel',
				itemId: 'summary',
				layout: 'fit',
				items: {
					xtype:'component',
					itemId: 'summaryCmp',
					tpl: [
						'<div class="op5-spec-mrfoxy-promoapprovalsummary-wrap" style="position:relative">',
							'<div class="op5-spec-mrfoxy-promoapprovalsummary-title">Validation process complete</div>',
							'<tpl if="approv_df !== undefined">',
							'<div class="op5-spec-mrfoxy-promoapprovalsummary-caption">',
								'<span class="op5-spec-mrfoxy-promoapprovalsummary-captiontitle">Finance director</span>',
								'<span class="op5-spec-mrfoxy-promoapprovalsummary-captionbody">' ,
								"{[this.getApprovalStr(values.approv_df)]}",
								'</span>',
							'</div>',
							'</tpl>',
							'<tpl if="approv_ds !== undefined">',
							'<div class="op5-spec-mrfoxy-promoapprovalsummary-caption">',
								'<span class="op5-spec-mrfoxy-promoapprovalsummary-captiontitle">Sales director</span>',
								'<span class="op5-spec-mrfoxy-promoapprovalsummary-captionbody">' ,
								"{[this.getApprovalStr(values.approv_ds)]}",
								'</span>',
							'</div>',
							'</tpl>',
							'<div class="op5-spec-mrfoxy-promoapprovalsummary-icon"></div>',
						'</div>',
						{
							disableFormats: true,
							getApprovalStr: function( booleanValue ) {
								if( booleanValue ) {
									return 'APPROVED' ;
								} else {
									return 'REJECTED' ;
								}
							}
						}
					]
				}
			}]
		});
		
		this.callParent() ;
	},
	onProceed: function() {
		var me = this,
			form = me.down('#form').getForm() ;
			  
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
					if( !Ext.isEmpty(ajaxData.summary) ) {
						var confirmData = [] ;
						if( ajaxData.summary.approv_df !== undefined ) {
							confirmData.approv_df = ajaxData.summary.approv_df ;
						}
						if( ajaxData.summary.approv_ds !== undefined ) {
							confirmData.approv_ds = ajaxData.summary.approv_ds ;
						}
						// Switch form to template
						var summaryPanel = this.down('#summary'),
							summaryCmp = summaryPanel.down('#summaryCmp'),
							layout = this.getLayout() ;
						summaryCmp.update(confirmData) ;
						layout.setActiveItem(summaryCmp) ;
						me.sendSavedEvent = true ;
					} else {
						me.sendSavedEvent = false ;
						me.destroy() ;
					}
				}
			},
			scope: this
		}) ;
	},
	onDestroy: function() {
		if( this.sendSavedEvent ) {
			this.fireEvent('saved',this) ;
		}
	}
});