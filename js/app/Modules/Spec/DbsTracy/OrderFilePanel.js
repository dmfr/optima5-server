Ext.define('Optima5.Modules.Spec.DbsTracy.OrderFilePanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsTracy.CfgParamField',
		'Optima5.Modules.Spec.DbsTracy.CfgParamText',
		'Optima5.Modules.Spec.DbsTracy.OrderAttachmentsDataview'
	],
	
	initComponent: function() {
		
		
		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			tbar:[{
				iconCls:'op5-sdomains-menu-submit',
				text:'Save',
				handler: function() {
					this.handleSaveHeader() ;
				},
				scope:this
			},{
				iconCls:'op5-sdomains-menu-updateschema',
				text:'<b>Validate</b>',
				handler: function() {
				},
				scope:this
			}],
			items:[{
				flex: 3,
				xtype: 'form',
				itemId: 'pHeaderForm',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 15,
				layout:'anchor',
				fieldDefaults: {
					labelWidth: 75,
					anchor: '100%'
				},
				items: [Ext.create('Optima5.Modules.Spec.DbsTracy.CfgParamField',{
					cfgParam_id: 'SOC',
					cfgParam_emptyDisplayText: 'Select...',
					optimaModule: this.optimaModule,
					fieldLabel: '<b>Company</b>',
					name: 'id_soc',
					allowBlank: false,
					anchor: '',
					width: 325
				}),{
					xtype: 'textfield',
					fieldLabel: '<b>DN #</b>',
					anchor: '',
					width: 250,
					name: 'id_dn',
					allowBlank: false
				},{
					xtype: 'textfield',
					fieldLabel: 'PO #',
					anchor: '',
					width: 250,
					name: 'ref_po',
					allowBlank: false
				},{
					xtype: 'op5specdbstracycfgparamtext',
					cfgParam_id: 'LIST_CONSIGNEE',
					fieldLabel: '<b>Consignee</b>',
					name: 'atr_consignee',
					allowBlank: false
				},{
					xtype: 'textarea',
					fieldLabel: '<b>Location</b>',
					name: 'txt_location'
				},{
					xtype: 'op5specdbstracycfgparamtext',
					cfgParam_id: 'LIST_SERVICE',
					fieldLabel: '<b>Priority</b>',
					anchor: '',
					width: 200,
					name: 'atr_priority',
					allowBlank: false
				},{
					xtype: 'fieldset',
					title: 'Volume details',
					items: [{
						fieldLabel: 'Dimensions',
						xtype: 'fieldcontainer',
						layout: {
							type: 'hbox',
							align: 'center'
						},
						items: [{
							xtype: 'box',
							html: '&#160;&#160;<b>L:</b>&#160;'
						},{
							xtype: 'numberfield',
							hideTrigger:true,
							name: 'vol_dim_l',
							width: 50,
							allowBlank: false
						},{
							xtype: 'box',
							html: '&#160;&#160;<b>W:</b>&#160;'
						},{
							xtype: 'numberfield',
							hideTrigger:true,
							name: 'vol_dim_w',
							width: 50,
							allowBlank: false
						},{
							xtype: 'box',
							html: '&#160;&#160;<b>H:</b>&#160;'
						},{
							xtype: 'numberfield',
							hideTrigger:true,
							name: 'vol_dim_h',
							width: 50,
							allowBlank: false
						}]
					},{
						xtype: 'numberfield',
						hideTrigger:true,
						xtype: 'textfield',
						anchor: '',
						width: 120,
						fieldLabel: 'NbParcels',
						allowBlank: false,
						name: 'vol_count'
					}]
				}]
			},{
				flex: 3,
				xtype: 'grid',
				itemId: 'pStepsGrid',
				columns: [{
					text: 'Code',
					width: 90,
					dataIndex: 'step_code',
					renderer: function(v) {
						return '<b>'+v+'</b>' ;
					}
				},{
					text: 'Step',
					width: 80,
					dataIndex: 'step_txt'
				},{
					text: 'Status',
					width: 50,
					dataIndex: 'status_is_ok',
					editor:{ xtype:'checkboxfield' },
					renderer: function(v, metaData) {
						if( v ) {
							metaData.tdCls += ' op5-spec-dbslam-stock-ok' ;
						} else {
							return ;
						}
					}
				},{
					text: 'Date OK',
					width: 190,
					dataIndex: 'date_actual',
					renderer: Ext.util.Format.dateRenderer('d/m/Y H:i'),
					editor:{ xtype:'datetimefield' }
				}],
				plugins: [{
					ptype: 'rowediting',
					listeners: {
						edit: this.onAfterEditStep,
						scope: this
					}
				}],
				store: {
					model: 'DbsTracyFileOrderStepModel',
					data: [],
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					},
					listeners: {
						datachanged: function(store) {
							store.each( function(record) {
								var flow = Optima5.Modules.Spec.DbsTracy.HelperCache.getOrderflowByStep( record.get('step_code') ) ;
								if( flow == null ) {
									return ;
								}
								var curStep = null ;
								Ext.Array.each( flow.steps, function(step) {
									if( step.step_code == record.get('step_code') ) {
										curStep = step ;
										return false ;
									}
								});
								if( curStep == null ) {
									return ;
								}
								record.data['step_txt'] = curStep.step_txt ;
							}) ;
						}
					}
				}
			},Ext.create('Optima5.Modules.Spec.DbsTracy.OrderAttachmentsDataview',{
				optimaModule: this.optimaModule,
				flex: 2,
				itemId: 'pAttachments',
				title: 'Attachments',
			})]
		}) ;
		
		this.callParent() ;
		
		this.on('afterrender', function() {
			if( this._orderNew ) {
				this.newOrder() ;
			} else {
				this.loadOrder( this._orderFilerecordId ) ;
			}
		},this) ;
		this.on('beforedestroy',this.onBeforeDestroy,this) ;
		
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
	},
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'attachmentschange' :
				if( this._orderFilerecordId && this._orderFilerecordId == eventParams.orderFilerecordId ) {
					this.loadOrder( this._orderFilerecordId ) ;
				}
				break ;
			default: break ;
		}
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
	},
	
	newOrder: function() {
		this._orderNew = true ;
		
		//fHeader
		this.down('#pHeaderForm').getForm().reset() ;
		this.down('#pHeaderForm').getForm().findField('id_dn').setReadOnly(false) ;
		
		//gSteps
		this.down('#pStepsGrid').getEl().mask() ;
		this.down('#pStepsGrid').getStore().removeAll() ;
		
		//gAttachments
		this.down('#pAttachments').getEl().mask() ;
		this.down('#pAttachments').setOrderRecord(null) ;
	},
	loadOrder: function( filerecordId ) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'order_getRecords',
				filter_orderFilerecordId_arr: Ext.JSON.encode([filerecordId])
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
	onLoadOrder: function( orderRecord ) {
		this._orderFilerecordId = orderRecord.getId() ;
		
		//fHeader
		this.down('#pHeaderForm').getForm().reset() ;
		this.down('#pHeaderForm').getForm().findField('id_dn').setReadOnly(true) ;
		this.down('#pHeaderForm').getForm().loadRecord(orderRecord) ;
		
		//gSteps
		this.down('#pStepsGrid').getEl().unmask() ;
		this.down('#pStepsGrid').getStore().loadRawData(orderRecord.steps().getRange()) ;
		
		//gAttachments
		this.down('#pAttachments').getEl().unmask() ;
		this.down('#pAttachments').setOrderRecord(orderRecord) ;
	},
	doReload: function() {
		this.loadOrder( this._orderFilerecordId ) ;
	},
	
	handleSaveHeader: function() {
		var formPanel = this.down('#pHeaderForm'),
			form = formPanel.getForm() ;
		if( !form.isValid() ) {
			return ;
		}
		
		var recordData = form.getValues(false,false,false,true) ;
		recordData['vol_dims'] = recordData['vol_dim_l'] + ' x ' + recordData['vol_dim_w'] + ' x ' + recordData['vol_dim_h'] ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'order_setHeader',
				_is_new: ( this._orderNew ? 1 : 0 ),
				order_filerecord_id: ( this._orderNew ? null : this._orderFilerecordId ),
				data: Ext.JSON.encode(recordData)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				this.onSaveHeader(ajaxResponse.id) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onSaveHeader: function(savedId) {
		this.optimaModule.postCrmEvent('datachange',{}) ;
		
		if( this._orderNew ) {
			this.loadOrder(savedId) ;
		} else {
			this.fireEvent('candestroy',this) ;
		}
	},
	
	onAfterEditStep: function(editor,editEvent) {
		var me = this,
			editedRecord = editEvent.record ;
		
		if( editedRecord.get('status_is_ok') && Ext.isEmpty(editedRecord.get('date_actual')) ) {
			editedRecord.set('status_is_ok',false) ;
		}
		if( !editedRecord.get('status_is_ok') ) {
			editedRecord.set('date_actual',null) ;
		}
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_dbs_tracy',
			_action: 'order_setStep',
			data: Ext.JSON.encode(editedRecord.getData()),
			orderstep_filerecord_id: editedRecord.get('orderstep_filerecord_id')
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
					return ;
				}
				editedRecord.commit() ;
				this._isDirty = true ;
			},
			scope: this
		});
	},
	
	onBeforeDestroy: function() {
		if( this._isDirty ) {
			this.optimaModule.postCrmEvent('datachange',{}) ;
		}
	}
});
