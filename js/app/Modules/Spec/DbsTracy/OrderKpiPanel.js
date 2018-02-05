Ext.define('Optima5.Modules.Spec.DbsTracy.OrderKpiPanel',{
	extend:'Ext.panel.Panel',
	
	editDisabled: null,

	initComponent: function() {
		var me = this ;
		Ext.apply( me, {
			layout:{
				type:'vbox',
				align:'stretch'
			},
			frame: true,
			items:[ me.initHeaderCfg(), {
				itemId: 'pForm',
				border: false,
				xtype:'form',
				height: 150,
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 15,
				layout:'anchor',
				fieldDefaults: {
					labelWidth: 100,
					anchor: '100%'
				},
				items: [{
					xtype: 'fieldset',
					title: 'KPI detail',
					items: [{
						xtype: 'checkbox',
						boxLabel: 'KPI success ?',
						name: 'kpi_is_ok',
						listeners: {
							change: function(chk,val) {
								if( val==true ) {
									chk.up('form').getForm().findField('kpi_code').reset() ;
								}
							}
						}
					},Ext.create('Optima5.Modules.Spec.DbsTracy.CfgParamField',{
						cfgParam_id: 'KPICODE',
						cfgParam_emptyDisplayText: 'Select...',
						optimaModule: this.optimaModule,
						fieldLabel: '<b>Reason codes</b>',
						name: 'kpi_code',
						allowBlank: false
					}),{
						xtype: 'textarea',
						fieldLabel: 'Explanation',
						name: 'kpi_txt'
					}]
				}]
			}],
			buttons:[{
				itemId: 'btnSubmit',
				text: 'Validation',
				handler: function() {
					this.onSubmit() ;
				},
				scope: this
			}]
		});
		
		this.callParent() ;
		
		if( this._orderFilerecordId ) {
			this.loadOrder(this._orderFilerecordId) ;
		}
	},
	loadOrder: function( orderFilerecordId ) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'order_getRecords',
				filter_orderFilerecordId_arr: Ext.JSON.encode([orderFilerecordId])
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false || ajaxResponse.data.length != 1 ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoadOrder(Ext.ux.dams.ModelManager.create('DbsTracyFileOrderModel',ajaxResponse.data[0])) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoadOrder: function(orderRecord) {
		this.orderRecord = orderRecord ;
			var headerData = {
				id_dn: this.orderRecord.get('id_dn'),
				atr_consignee: this.orderRecord.get('atr_consignee'),
				date_rls: Ext.util.Format.date(this.orderRecord.steps().findRecord('step_code','10_RLS').get('date_actual'),'d/m/Y H:i:s'),
				kpi_calc_step: this.orderRecord.get('kpi_calc_step'),
				kpi_calc_date_target: Ext.util.Format.date(this.orderRecord.get('kpi_calc_date_target'),'d/m/Y H:i:s'),
				kpi_calc_date_actual: Ext.util.Format.date(this.orderRecord.get('kpi_calc_date_actual'),'d/m/Y H:i:s')
			};
			this.down('#pHeader').update(headerData) ;
			
			this.down('#pForm').getForm().loadRecord(this.orderRecord) ;
	},
	initHeaderCfg: function() {
		var headerCfg = {
			itemId: 'pHeader',
			xtype:'component',
			tpl: [
				'<div class="op5-spec-dbspeople-realvalidhdr">',
					'<div class="op5-spec-dbspeople-realvalidhdr-inline-tbl">',
						'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem op5-spec-dbstracy-warning-icon">',
						'</div>',
						'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem">',
							'<table class="op5-spec-dbspeople-realvalidhdr-tbl">',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">DN / BL :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{id_dn}</td>',
							'</tr>',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Consignee :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{atr_consignee}</td>',
							'</tr>',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Date RLS :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{date_rls}</td>',
							'</tr>',
							'</table>',
						'</div>',
						'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem">',
							'<table class="op5-spec-dbspeople-realvalidhdr-tbl">',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Target step :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{kpi_calc_step}</td>',
							'</tr>',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Target time :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{kpi_calc_date_target}</td>',
							'</tr>',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Actual step time :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{kpi_calc_date_actual}</td>',
							'</tr>',
							'</table>',
						'</div>',
					'</div>',
				'</div>',
				{
					disableFormats: true
				}
			]
		} ;
		
		return headerCfg ;
	},
	
	onSubmit: function() {
		var formPanel = this.down('#pForm'),
			form = formPanel.getForm(),
			formData = form.getValues(false,false,false,true) ;
			  
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'order_setKpi',
				order_filerecord_id: this.orderRecord.get('order_filerecord_id'),
				data: Ext.JSON.encode(formData)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				this.optimaModule.postCrmEvent('datachange',{}) ;
				this.destroy() ;
			},
			callback: function() {
				this.loadMask.destroy() ;
			},
			scope: this
		}) ;
	},
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	}
}) ;
