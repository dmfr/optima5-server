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
				height: 250,
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
					items: [{
						hidden: true,
						xtype: 'displayfield',
						name: 'warning_date',
						fieldLabel: 'Date set',
						renderer: Ext.util.Format.dateRenderer('d/m/Y H:i')
					},Ext.create('Optima5.Modules.Spec.DbsEmbramach.CfgParamField',{
						cfgParam_id: 'WARNINGCODE',
						cfgParam_emptyDisplayText: 'Select...',
						optimaModule: this.optimaModule,
						fieldLabel: '<b>Reason codes</b>',
						name: 'warning_code',
						allowBlank: false,
						listeners: {
							change: this.onChangeWarningCode,
							scope: this
						}
					}),{
						xtype: 'textarea',
						fieldLabel: 'Explanation',
						name: 'warning_txt'
					},{
						hidden: true,
						xtype: 'fieldset',
						itemId: 'fsInputfields',
						title: 'Warning details',
						items: []
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
			
			var machRecordData = this.machRecord.getData();
			
			this.down('#pForm').getForm().setValues(machRecordData) ;
			if( !Ext.isEmpty(machRecordData['warning_date']) ) {
				this.down('#pForm').getForm().findField('warning_date').setVisible(true) ;
			}
			
			var mapFields_name_value = {} ;
			if( machRecordData['warning_fields'] ) {
				Ext.Array.each(machRecordData['warning_fields'], function(row) {
					mapFields_name_value[row.name] = row.value ;
				});
			}
			Ext.Array.each( this.down('#pForm').down('#fsInputfields').query('field'), function(field) {
				if( mapFields_name_value.hasOwnProperty(field.name) ) {
					field.setValue(mapFields_name_value[field.name]) ;
				} else {
					field.reset() ;
				}
			}) ;
		}
		
		this.down('#pForm').getForm().getFields().each(function(field) {
			field.on('change',function(){
				me.onChange() ;
			},me) ;
		},me) ;
	},
	onChange: function() {
		this.down('#pForm').getForm().findField('warning_date').setVisible(false) ;
	},
	onChangeWarningCode: function(cmb,newValue) {
		var fsInputfields = this.down('#fsInputfields') ;
		
		var cfgWarningRows = Optima5.Modules.Spec.DbsEmbramach.HelperCache.getListData('LIST_WARNINGCODE'),
			cfgWarningRow = null ;
		Ext.Array.each( cfgWarningRows, function(row) {
			if( row.id==newValue ) {
				cfgWarningRow = row ;
			}
		}) ;
		if( cfgWarningRow && cfgWarningRow.input_fields ) {
			fsInputfields.removeAll();
			fsInputfields.add( cfgWarningRow.input_fields ) ;
			fsInputfields.setVisible(true) ;
		} else {
			fsInputfields.removeAll();
			fsInputfields.setVisible(false) ;
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
		if( !form.isValid() ) {
			Ext.MessageBox.alert('Error', 'Incomplete warning description');
			return ;
		}
		
		var fieldsData = [] ;
		Ext.Array.each( formPanel.down('#fsInputfields').query('field'), function(field) {
			fieldsData.push({
				name: field.name,
				value: formData[field.name]
			});
		}) ;
		var recordData = {
			warning_is_on: formData['warning_is_on'],
			warning_code: formData['warning_code'],
			warning_date: new Date(),
			warning_txt: formData['warning_txt'],
			warning_fields: fieldsData
		};
		
			  
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
				data: Ext.JSON.encode(recordData)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				this.optimaModule.postCrmEvent('datachange',{}) ;
				this.machRecord.set(recordData) ;
				this.destroy() ;
			},
			callback: function() {
				this.loadMask.destroy() ;
			},
			scope: this
		}) ;
	}
}) ;
