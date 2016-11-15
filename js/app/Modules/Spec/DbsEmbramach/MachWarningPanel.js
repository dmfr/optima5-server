Ext.define('Optima5.Modules.Spec.DbsEmbramach.MachWarningPanel',{
	extend:'Ext.panel.Panel',
	
	requires: ['Optima5.Modules.Spec.DbsEmbramach.CfgParamField'],
	
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
					items: [Ext.create('Optima5.Modules.Spec.DbsEmbramach.CfgParamField',{
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
		
		if( this.machRecord ) {
			var headerData = {
				delivery_id: this.machRecord.get('field_0'),
				shipto_txt: this.machRecord.get('field_4'),
				date_rls: '2016-12-31'
			};
			this.down('#pHeader').update(headerData) ;
			
			this.down('#pForm').getForm().loadRecord(this.machRecord) ;
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
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Picking :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{delivery_id}</td>',
							'</tr>',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Customer :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{shipto_txt}</td>',
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
				_moduleId: 'spec_dbs_embramach',
				_action: 'mach_setWarning',
				flow_code: this.flowCode,
				_filerecord_id: this.machRecord.get('_filerecord_id'),
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
				this.machRecord.set(formData) ;
				this.destroy() ;
			},
			callback: function() {
				this.loadMask.destroy() ;
			},
			scope: this
		}) ;
	}
}) ;
