Ext.define('Optima5.Modules.Spec.DbsTracy.OrderFilePanel',{
	extend:'Ext.window.Window',
	
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
				hidden: !Optima5.Modules.Spec.DbsTracy.HelperCache.authHelperQueryPage('GOM'),
				itemId: 'tbValidate',
				iconCls:'op5-sdomains-menu-updateschema',
				text:'<b>Validate</b>',
				menu: [],
				handler: function(tbValidate) {
					if( tbValidate.menu.items.getCount() == 0 ) {
						this.handleSaveHeader(true) ;
					}
				},
				scope: this
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
				}),Ext.create('Optima5.Modules.Spec.DbsTracy.CfgParamField',{
					cfgParam_id: 'ORDERFLOW',
					cfgParam_emptyDisplayText: 'Select...',
					optimaModule: this.optimaModule,
					fieldLabel: '<b>Flow code</b>',
					name: 'flow_code',
					allowBlank: false,
					anchor: '',
					width: 325
				}),{
					xtype: 'op5specdbstracycfgparamtext',
					cfgParam_id: 'LIST_TYPE',
					fieldLabel: '<b>Type</b>',
					name: 'atr_type',
					allowBlank: false,
					forceSelection: true,
					anchor: '',
					width: 325
				},{
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
					name: 'ref_po'
				},{
					xtype: 'textfield',
					fieldLabel: 'Invoice #',
					anchor: '',
					width: 250,
					name: 'ref_invoice'
				},{
					xtype: 'op5specdbstracycfgparamtext',
					cfgParam_id: 'LIST_CONSIGNEE',
					fieldLabel: '<b>Consignee</b>',
					name: 'atr_consignee',
					allowBlank: false,
					forceSelection: false
				},{
					xtype: 'hiddenfield',
					name: 'atr_consignee_create'
				},{
					xtype: 'textfield',
					fieldLabel: '<b>City</b>',
					name: 'txt_location_city'
				},{
					xtype: 'textarea',
					fieldLabel: '<b>Location</b>',
					name: 'txt_location_full'
				},{
					xtype: 'op5specdbstracycfgparamtext',
					cfgParam_id: 'LIST_SERVICE',
					fieldLabel: '<b>Priority</b>',
					anchor: '',
					width: 200,
					name: 'atr_priority'
				},{
					xtype: 'op5specdbstracycfgparamtext',
					cfgParam_id: 'LIST_INCOTERM',
					fieldLabel: '<b>Incoterm</b>',
					anchor: '',
					width: 200,
					name: 'atr_incoterm'
				},{
					xtype: 'fieldset',
					title: 'Volume details',
					items: [{
						xtype: 'numberfield',
						hideTrigger:true,
						xtype: 'textfield',
						anchor: '',
						width: 150,
						fieldLabel: 'Weight (kg)',
						name: 'vol_kg',
						minValue: 0
					},{
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
							minValue: 0
						},{
							xtype: 'box',
							html: '&#160;&#160;<b>W:</b>&#160;'
						},{
							xtype: 'numberfield',
							hideTrigger:true,
							name: 'vol_dim_w',
							width: 50,
							minValue: 0
						},{
							xtype: 'box',
							html: '&#160;&#160;<b>H:</b>&#160;'
						},{
							xtype: 'numberfield',
							hideTrigger:true,
							name: 'vol_dim_h',
							width: 50,
							minValue: 0
						}]
					},{
						xtype: 'numberfield',
						hideTrigger:true,
						xtype: 'textfield',
						anchor: '',
						width: 120,
						fieldLabel: 'NbParcels',
						name: 'vol_count',
						minValue: 0
					}]
				}]
			},{
				flex: 3,
				xtype: 'panel',
				layout: {
					type: 'border',
					align: 'stretch'
				},
				border: false,
				items:[{
					region: 'center',
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
					},{
						hidden: true,
						text: 'Log User',
						width: 100,
						dataIndex: 'log_user'
					}],
					plugins: ( Optima5.Modules.Spec.DbsTracy.HelperCache.authHelperQueryPage('ADMIN') ? [{
						ptype: 'rowediting',
						listeners: {
							edit: this.onAfterEditStep,
							scope: this
						}
					}] : []),
					store: {
						model: 'DbsTracyFileOrderStepModel',
						data: [],
						sorters: [{
							property: 'step_code',
							direction: 'ASC'
						}],
						proxy: {
							type: 'memory',
							reader: {
								type: 'json'
							}
						},
						listeners: {
							datachanged: function(store) {
								store.each( function(record) {
									var curStep = Optima5.Modules.Spec.DbsTracy.HelperCache.getStepByStep( record.get('step_code') ) ;
									if( curStep == null ) {
										return ;
									}
									record.data['step_txt'] = curStep.desc_txt ;
								}) ;
							}
						}
					}
				},{
					region: 'south',
					flex: 2,
					xtype: 'grid',
					itemId: 'pEventsGrid',
					title: 'Warnings',
					collapsible: true,
					collapsed: true,
					store: {
						model: 'DbsTracyFileOrderEventModel',
						data: [],
						sorters: [{
							property: 'event_date',
							direction: 'DESC'
						}],
						proxy: {
							type: 'memory',
							reader: {
								type: 'json'
							}
						}
					},
					viewConfig: {
						itemId: 'view',
						plugins: [{
							pluginId: 'preview',
							ptype: 'preview',
							bodyField: 'event_txt',
							expanded: true
						}],
						getRowClass: function(record) {
							if( record.get('event_is_warning') ) {
								return 'op5-spec-dbstracy-files-warning' ;
							}
						},
						listeners: {
							scope: this
						}
					},
					columns: [{
						text: 'User',
						dataIndex: 'event_user',
						hidden: false,
						flex: 1
					}, {
						text: 'Code',
						dataIndex: 'event_code',
						hidden: false,
						flex: 1,
						renderer: function(v) {
							if( !Ext.isEmpty(v) ) {
								return '<b>'+v+'</b>';
							}
							return '' ;
						}
					}, {
						text: 'Date',
						dataIndex: 'event_date',
						renderer: function(date){
							if (!date) {
									return '';
							}

							var now = new Date(), d = Ext.Date.clearTime(now, true), notime = Ext.Date.clearTime(date, true).getTime();

							if (notime === d.getTime()) {
									return 'Today ' + Ext.Date.format(date, 'g:i a');
							}

							d = Ext.Date.add(d, 'd', -6);
							if (d.getTime() <= notime) {
									return Ext.Date.format(date, 'D g:i a');
							}
							return Ext.Date.format(date, 'Y/m/d g:i a');
						},
						flex: 1
					}]
				}]
			},Ext.create('Optima5.Modules.Spec.DbsTracy.OrderAttachmentsDataview',{
				optimaModule: this.optimaModule,
				flex: 2,
				itemId: 'pAttachments',
				title: 'Attachments'
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
		this.down('#pHeaderForm').getForm().findField('id_soc').setReadOnly(false) ;
		this.down('#pHeaderForm').getForm().findField('flow_code').setReadOnly(false) ;
		this.down('#pHeaderForm').getForm().findField('atr_type').setReadOnly(false) ;
		this.down('#pHeaderForm').getForm().findField('id_dn').setReadOnly(false) ;
		
		//gSteps
		this.down('#pStepsGrid').getEl().mask() ;
		this.down('#pStepsGrid').getStore().removeAll() ;
		
		//gEvents
		this.down('#pEventsGrid').getEl().mask() ;
		this.down('#pEventsGrid').getStore().removeAll() ;
		
		//gAttachments
		this.down('#pAttachments').getEl().mask() ;
		this.down('#pAttachments').setOrderRecord(null) ;
		
		// Title
		this.setTitle('New OrderFile') ;
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
		this._orderNew = false ;
		this._orderFilerecordId = orderRecord.getId() ;
		
		//fHeader
		this.down('#pHeaderForm').getForm().reset() ;
		this.down('#pHeaderForm').getForm().findField('id_soc').setReadOnly(true) ;
		this.down('#pHeaderForm').getForm().findField('flow_code').setReadOnly(true) ;
		this.down('#pHeaderForm').getForm().findField('atr_type').setReadOnly(true) ;
		this.down('#pHeaderForm').getForm().findField('id_dn').setReadOnly(true) ;
		this.down('#pHeaderForm').getForm().loadRecord(orderRecord) ;
		
		//gSteps
		this.down('#pStepsGrid').getEl().unmask() ;
		this.down('#pStepsGrid').getStore().loadRawData(orderRecord.steps().getRange()) ;
		
		//gEvents
		var tmpData = [] ;
		orderRecord.events().each( function(rec) {
			tmpData.push(rec.getData()) ;
		}) ;
		this.down('#pEventsGrid').getEl().unmask() ;
		this.down('#pEventsGrid').getStore().loadData(tmpData) ;
		if( tmpData.length > 0 ) {
			this.down('#pEventsGrid').expand() ;
		}
		
		//gAttachments
		this.down('#pAttachments').getEl().unmask() ;
		this.down('#pAttachments').setOrderRecord(orderRecord) ;
		
		// Title
		this.setTitle('Order: '+orderRecord.get('id_soc')+'/'+orderRecord.get('id_dn')) ;
		
		// Validate steps menu
		var tbValidateMenu = this.down('#tbValidate').menu ;
		tbValidateMenu.removeAll() ;
		tbValidateMenuItems = [] ;
		var curFlow = Optima5.Modules.Spec.DbsTracy.HelperCache.getOrderflow( orderRecord.get('flow_code') );
		if( curFlow ) {
			Ext.Array.each( curFlow.steps, function(curStep) {
				if( !curStep.prompt_order ) {
					return ;
				}
				tbValidateMenuItems.push({
					_stepCode: curStep.step_code,
					text: curStep.desc_txt,
					iconCls:'op5-sdomains-menu-updateschema',
					handler: function(menuitem) {
						this.handleSaveHeader( menuitem._stepCode ) ;
					},
					scope: this
				});
			},this) ;
		}
		tbValidateMenu.add(tbValidateMenuItems) ;
	},
	doReload: function() {
		this.loadOrder( this._orderFilerecordId ) ;
	},
	
	handleSaveHeader: function(validateStepCode, noConfirm) {
		if( !Ext.isEmpty(validateStepCode) && !Optima5.Modules.Spec.DbsTracy.HelperCache.authHelperQueryPage('GOM') ) {
			Ext.Msg.alert('Auth','Not authorized') ;
			return ;
		}
		
		
		var formPanel = this.down('#pHeaderForm'),
			form = formPanel.getForm() ;
		if( !form.isValid() ) {
			return ;
		}
		
		if( !noConfirm ) {
			if( !form.findField('atr_consignee').getSelection() ) {
				Ext.Msg.confirm('Confirm?','Create new consignee ?',function(btn){
					if( btn=='yes' ) {
						form.findField('atr_consignee_create').setValue('true') ;
						this.handleSaveHeader(validateStepCode, true) ;
					}
				},this);
				return ;
			}
		}
		
		var recordData = form.getValues(false,false,false,true) ;
		if( !Ext.isEmpty(validateStepCode) ) {
			var errors = Optima5.Modules.Spec.DbsTracy.HelperCache.checkOrderData(recordData) ;
			if( errors != null ) {
				form.markInvalid(errors) ;
				return ;
			}
		}
		
		recordData['vol_dims'] = recordData['vol_dim_l'] + ' x ' + recordData['vol_dim_w'] + ' x ' + recordData['vol_dim_h'] ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'order_setHeader',
				_is_new: ( this._orderNew ? 1 : 0 ),
				order_filerecord_id: ( this._orderNew ? null : this._orderFilerecordId ),
				data: Ext.JSON.encode(recordData),
				validateStepCode: ( !Ext.isEmpty(validateStepCode) ? validateStepCode : null )
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				var doReload = noConfirm ;
				this.onSaveHeader(ajaxResponse.id, doReload, !Ext.isEmpty(validateStepCode)) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onSaveHeader: function(savedId, doReload, dontClose) {
		this.optimaModule.postCrmEvent('datachange',{}) ;
		if( doReload ) {
			Optima5.Modules.Spec.DbsTracy.HelperCache.fetchConfig() ;
		}
		
		if( this._orderNew || dontClose ) {
			this.loadOrder(savedId) ;
		} else {
			this.fireEvent('candestroy',this) ;
		}
	},
	
	/*
	handleValidate: function(stepCode) {
		var formPanel = this.down('#pHeaderForm'),
			form = formPanel.getForm() ;
		if( !form.isValid() ) {
			Ext.Msg.alert('Error','Header incomplete') ;
			return ;
		}
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'order_stepValidate',
				order_filerecord_id: this._orderFilerecordId,
				step_code: stepCode
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				this.doReload() ;
				this.optimaModule.postCrmEvent('datachange',{}) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	*/
	
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
