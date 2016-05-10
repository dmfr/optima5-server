Ext.define('Optima5.Modules.Spec.DbsTracy.OrderWarningPanel',{
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
					title: 'Warning enabled ?',
					checkboxToggle: true,
					checkboxName: 'warning_is_on',
					items: [Ext.create('Optima5.Modules.Spec.DbsTracy.CfgParamField',{
						cfgParam_id: 'WARNINGCODE',
						cfgParam_emptyDisplayText: 'Select...',
						optimaModule: this.optimaModule,
						fieldLabel: '<b>Reason codes</b>',
						name: 'warning_code',
						allowBlank: false
					}),{
						xtype: 'textarea',
						fieldLabel: 'Explanation',
						name: 'warning_txt'
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
		
		if( this.orderRecord ) {
			var headerData = {
				id_dn: this.orderRecord.get('id_dn'),
				atr_consignee: this.orderRecord.get('atr_consignee'),
				date_rls: (this.orderRecord.steps().findRecord('step_code','10_RLS') ? Ext.util.Format.date(this.orderRecord.steps().findRecord('step_code','10_RLS').get('date_actual'),'d/m/Y') : '-')
			};
			this.down('#pHeader').update(headerData) ;
			
			this.down('#pForm').getForm().loadRecord(this.orderRecord) ;
		}
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
				_action: 'order_setWarning',
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
	}
}) ;
