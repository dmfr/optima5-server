Ext.define('Optima5.Modules.Spec.DbsTracy.TrsptFilePanel',{
	extend:'Ext.window.Window',
	
	requires: [
		'Ext.ux.PreviewPlugin',
		'Optima5.Modules.Spec.DbsTracy.CfgParamField',
		'Optima5.Modules.Spec.DbsTracy.CfgParamText'
	],
	
	_readonlyMode: false,
	
	initComponent: function() {
		var stepsMap = {} ;
		Ext.Array.each( Optima5.Modules.Spec.DbsTracy.HelperCache.getOrderflow('AIR').steps, function(step) {
			stepsMap[step.step_code] = step ;
		}) ;
		
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
			},{
				icon: 'images/op5img/ico_print_16.png',
				text:'<b>Print</b>',
				menu: [{
					icon: 'images/op5img/ico_print_16.png',
					text:'Print <b><i>Livraison navette</i></b>',
					handler: function() {
						this.openPrintPopup('delivery') ;
					},
					scope:this
				},{
					icon: 'images/op5img/ico_print_16.png',
					text:'Print <b><i>Mise à disposition</b>',
					handler: function() {
						this.openPrintPopup('pickup') ;
					},
					scope:this
				}]
			}],
			items:[{
				flex: 2,
				xtype: 'form',
				itemId: 'pHeaderForm',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 15,
				scrollable: 'vertical',
				layout:'anchor',
				fieldDefaults: {
					labelWidth: 80,
					anchor: '100%'
				},
				items: [Ext.create('Optima5.Modules.Spec.DbsTracy.CfgParamField',{
					cfgParam_id: 'SOC',
					cfgParam_emptyDisplayText: 'Select...',
					optimaModule: this.optimaModule,
					fieldLabel: '<b>Company</b>',
					name: 'id_soc',
					allowBlank: false
				}),Ext.create('Optima5.Modules.Spec.DbsTracy.CfgParamField',{
					cfgParam_id: 'ORDERFLOW',
					cfgParam_emptyDisplayText: 'Select...',
					optimaModule: this.optimaModule,
					fieldLabel: '<b>Flow code</b>',
					name: 'flow_code',
					allowBlank: false,
					anchor: ''
				}),{
					xtype: 'op5specdbstracycfgparamtext',
					cfgParam_id: 'LIST_TYPE',
					fieldLabel: '<b>Type</b>',
					name: 'atr_type',
					allowBlank: false,
					forceSelection: true
				},{
					xtype: 'textfield',
					fieldLabel: '<b>WID</b>',
					value: '',
					readOnly: true,
					name: 'id_doc',
					allowBlank: false
				},{
					xtype: 'datefield',
					fieldLabel: 'Created',
					format: 'd/m/Y',
					submitFormat: 'Y-m-d',
					name: 'date_create',
					allowBlank: false
				},{
					xtype: 'op5specdbstracycfgparamtext',
					cfgParam_id: 'LIST_CONSIGNEE',
					fieldLabel: '<b>Consignee</b>',
					allowBlank: false,
					name: 'atr_consignee'
				},{
					xtype: 'op5specdbstracycfgparamtext',
					cfgParam_id: 'LIST_INCOTERM',
					fieldLabel: 'Incoterm',
					allowBlank: false,
					name: 'atr_incoterm'
				},{
					xtype: 'op5specdbstracycfgparamtext',
					cfgParam_id: 'LIST_SERVICE',
					fieldLabel: 'Priority',
					allowBlank: false,
					name: 'atr_priority'
				},{
					hidden: true,
					xtype: 'textfield',
					fieldLabel: '<b>PoD</b>',
					name: 'pod_doc'
				},{
					xtype: 'fieldset',
					title: 'Transport details',
					items: [{
						xtype: 'op5specdbstracycfgparamtext',
						cfgParam_id: 'LIST_AIRPORT',
						fieldLabel: 'Origin',
						allowBlank: false,
						name: 'mvt_origin'
					},{
						xtype: 'op5specdbstracycfgparamtext',
						cfgParam_id: 'LIST_AIRPORT',
						fieldLabel: 'Destination',
						allowBlank: false,
						name: 'mvt_dest'
					},{
						xtype: 'op5specdbstracycfgparamtext',
						cfgParam_id: 'LIST_CARRIER',
						fieldLabel: '<b>Carrier</b>',
						name: 'mvt_carrier'
					},{
						xtype: 'textfield',
						fieldLabel: '<b>Account</b>',
						name: 'mvt_carrier_account'
					}]
				},{
					xtype: 'fieldset',
					title: 'Flight details',
					items: [{
						xtype: 'textfield',
						fieldLabel: 'AWB',
						name: 'flight_awb'
					},{
						xtype: 'datefield',
						fieldLabel: 'Flight date',
						format: 'd/m/Y',
						submitFormat: 'Y-m-d',
						name: 'flight_date'
					},{
						xtype: 'textfield',
						fieldLabel: 'Flight code',
						name: 'flight_code'
					}]
				},{
					xtype: 'fieldset',
					title: 'Customs',
					fieldDefaults: {
						labelWidth: 40,
						anchor: '100%'
					},
					items: [{
						xtype: 'combobox',
						name: 'customs_mode',
						fieldLabel: 'Flow',
						queryMode: 'local',
						forceSelection: true,
						allowBlank: false,
						editable: false,
						store: {
							fields: ['id','text'],
							data: [
								{id: '', text: ''},
								{id: 'OFF', text: 'No customs (EU)'},
								{id: 'ON', text: 'Customs REQ/CLR'}
							]
						},
						valueField: 'id',
						displayField: 'text',
						listeners:{
							change: function(cmb) {
								var formPanel = cmb.up('panel'),
									form = formPanel.getForm() ;
								form.findField('customs_date_request').setVisible(cmb.getValue()=='ON') ;
								form.findField('customs_date_cleared').setVisible(cmb.getValue()=='ON') ;
							}
						}
					},{
						hidden: true,
						xtype: 'datetimefield',
						fieldLabel: 'REQ',
						name: 'customs_date_request'
					},{
						hidden: true,
						xtype: 'datetimefield',
						fieldLabel: 'CLR',
						name: 'customs_date_cleared'
					}]
				},{
					xtype: 'fieldset',
					title: 'EDI Status',
					fieldDefaults: {
						labelWidth: 100,
						anchor: '100%'
					},
					items: [{
						xtype: 'displayfield',
						fieldLabel: 'EDI Status',
						name: 'sword_edi_status'
					},{
						xtype: 'fieldcontainer',
						fieldLabel: 'EDI Resend',
						itemId: 'cntEdiReset',
						items: [{
							xtype: 'button',
							text: 'Do resend',
							handler: function() {
								this.handleEdiReset() ;
							},
							scope: this
						}]
					}]
				}]
			},{
				flex: 3,
				itemId: 'pOrdersGrid',
				xtype: 'grid',
				columns: [{
					text: 'DN #',
					width: 75,
					dataIndex: 'id_dn'
				},{
					text: 'PO #',
					width: 75,
					dataIndex: 'ref_invoice'
				},{
					text: 'Status',
					width: 100,
					dataIndex: 'calc_step',
					renderer: function(v,m,record) {
						var stepRow = this._stepsMap[v] ;
						if( !stepRow ) {
							return ;
						}
						var tmpProgress = stepRow['status_percent'] / 100 ;
						var tmpText = stepRow['desc_txt'] ;
							var b = new Ext.ProgressBar({height: 15, cls: 'op5-spec-mrfoxy-promolist-progress'});
							b.updateProgress(tmpProgress,tmpText);
							v = Ext.DomHelper.markup(b.getRenderTree());
							b.destroy() ;
						return v;
					}
				},{
					text: 'Prcl',
					width: 50,
					dataIndex: 'vol_count',
					align: 'right'
				},{
					text: 'Weight',
					width: 75,
					dataIndex: 'vol_kg',
					align: 'right',
					renderer: function(v) {
						if( !Ext.isEmpty(v) ) {
							return v+'&#160;'+'kg' ;
						}
					}
				},{
					text: 'Dimensions',
					width: 150,
					dataIndex: 'vol_dims'
				}],
				store: {
					model: 'DbsTracyFileTrsptOrderModel',
					data: [],
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					}
				},
				listeners: {
					itemcontextmenu: function(view, record, item, index, event) {
						var gridContextMenuItems = new Array() ;
						
						var selRecord = record ;
						gridContextMenuItems.push({
							disabled: true,
							text: '<b>'+selRecord.get('id_soc')+'/'+selRecord.get('id_dn')+'</b>'
						},'-',{
							iconCls: 'icon-bible-edit',
							text: 'Modify',
							handler : function() {
								this.optimaModule.postCrmEvent('openorder',{orderFilerecordId:record.get('order_filerecord_id')}) ;
							},
							scope : this
						});
						if( Optima5.Modules.Spec.DbsTracy.HelperCache.authHelperQueryPage('ADMIN') ) {
							gridContextMenuItems.push({
								iconCls: 'icon-bible-delete',
								text: 'Unassign',
								handler : function() {
									this.doOrdersRemove( [selRecord] ) ;
								},
								scope : this
							});
						}
						
						var gridContextMenu = Ext.create('Ext.menu.Menu',{
							items : gridContextMenuItems,
							listeners: {
								hide: function(menu) {
									Ext.defer(function(){menu.destroy();},10) ;
								}
							}
						}) ;
						
						gridContextMenu.showAt(event.getXY());
					},
					render: this.onOrdersGridRender,
					scope: this
				},
				_stepsMap: stepsMap
			},{
				flex: 3,
				xtype: 'panel',
				itemId: 'pEvents',
				layout: 'border',
				items:[{
					region: 'north',
					itemId: 'pEventsForm',
					title: 'New action',
					hidden: this._readonlyMode,
					collapsible: true,
					collapsed: true,
					xtype: 'form',
					border: false,
					bodyCls: 'ux-noframe-bg',
					bodyPadding: 8,
					layout: 'anchor',
					fieldDefaults: {
						labelWidth: 75,
						anchor: '100%'
					},
					items: [{
						xtype: 'textfield',
						fieldLabel: 'Action author',
						format: 'Y-m-d',
						width: 175,
						anchor: '',
						name: 'event_user'
					},{
						xtype: 'textarea',
						fieldLabel: 'Comment',
						name: 'event_txt'
					}],
					buttons: [{
						xtype: 'button',
						text: 'OK',
						handler: function( btn ) {
							this.handleSubmitEvent() ;
						},
						scope: this
					}]
				},{
					region: 'center',
					itemId: 'pEventsGrid',
					flex: 3,
					xtype: 'grid',
					cls: 'op5-spec-dbstracy-feedgrid',
					store: {
						model: 'DbsTracyFileTrsptEventModel',
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
						listeners: {
							scope: this
						}
					},
					columns: [{
						text: 'Author',
						dataIndex: 'event_user',
						hidden: false,
						width: 200
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
						width: 200
					}]
				}]
			}]
		}) ;
		this.callParent() ;
		if( this._readonlyMode ) {
			this.down('toolbar').setVisible(false) ;
		}
		
		this.on('afterrender', function() {
			if( this._trsptNew ) {
				this.newTrspt( this._trsptNew_orderRecords ) ;
			} else {
				this.loadTrspt( this._trsptFilerecordId ) ;
			}
		},this) ;
	},
	onOrdersGridRender: function(grid) {
		var me = this ;
		
		var gridPanelDropTargetEl =  grid.body.dom;

		var gridPanelDropTarget = Ext.create('Ext.dd.DropTarget', gridPanelDropTargetEl, {
			ddGroup: 'OrdersDD'+me.optimaModule.sdomainId,
			notifyEnter: function(ddSource, e, data) {
					//Add some flare to invite drop.
					grid.body.stopAnimation();
					grid.body.highlight();
			},
			notifyDrop: function(ddSource, e, data){
					// Reference the record (single selection) for readability
					var selectedNodeRecord = ddSource.dragData.records[0];
					me.doOrdersAdd(selectedNodeRecord) ;
					return true;
			}
		});
	},
	
	newTrspt: function( trsptNew_orderRecords ) {
		this._trsptNew = true ;
		
		//fHeader
		this.down('#pHeaderForm').getForm().reset() ;
		this.down('#pHeaderForm').getForm().findField('id_soc').setReadOnly(false) ;
		this.down('#pHeaderForm').getForm().findField('flow_code').setReadOnly(false) ;
		this.down('#pHeaderForm').getForm().findField('atr_type').setReadOnly(false) ;
		this.down('#pHeaderForm').getForm().findField('id_doc').setReadOnly(false) ;
		this.down('#pHeaderForm').getForm().setValues({
			date_create: new Date(),
			id_doc: 'NEW',
			customs_mode: ''
		});
		this.down('#pHeaderForm').getForm().findField('id_doc').setReadOnly(true) ;
		if( this._readonlyMode ) {
			this.down('#pHeaderForm').getForm().getFields().each( function(field) {
				if( field.setReadOnly ) {
					field.setReadOnly(true) ;
				}
			});
		}
		
		//gOrders
		this.down('#pOrdersGrid').getEl().mask() ;
		this.down('#pOrdersGrid').getStore().removeAll() ;
		
		//gEvents
		this.down('#pEvents').getEl().mask() ;
		this.down('#pEventsGrid').getStore().removeAll() ;
		
		// Title
		this.setTitle('New TrsptFile') ;
		
		if( trsptNew_orderRecords != null && trsptNew_orderRecords.length>0 ){
			var trsptNew_orderLeafRecords = [] ;
			Ext.Array.each( trsptNew_orderRecords, function(trsptNew_orderRecord) {
				trsptNew_orderRecord.cascadeBy( function(trsptNew_orderChildRecord) {
					if( trsptNew_orderChildRecord.isLeaf() ) {
						trsptNew_orderLeafRecords.push(trsptNew_orderChildRecord) ;
					}
				}) ;
			}) ;
			this.down('#pOrdersGrid').getStore().add(trsptNew_orderLeafRecords) ;
			
			var passed = true ;
			Ext.Array.each( trsptNew_orderLeafRecords, function(orderRecord) {
				if( Optima5.Modules.Spec.DbsTracy.HelperCache.checkOrderData(orderRecord.getData()) != null ) {
					passed = false ;
				}
			}) ;
			if( !passed ) {
				this.onNewTrsptError('DN incomplete. Check order details') ;
				return false ;
			}
			
			var copyFields = ['id_soc','flow_code','atr_type','atr_consignee','atr_incoterm','atr_priority'] ;
			var map_copyFields_values = {} ;
			//check ?
			// if OK => setValues
			Ext.Array.each( copyFields, function(copyField) {
				map_copyFields_values[copyField] = [] ;
				Ext.Array.each( trsptNew_orderLeafRecords, function(orderRecord) {
					if( !Ext.Array.contains(map_copyFields_values[copyField],orderRecord.get(copyField)) ) {
						map_copyFields_values[copyField].push( orderRecord.get(copyField) ) ;
					}
				}) ;
			}) ;
			
			var passed = true ;
			var objValues = {} ;
			Ext.Object.each( map_copyFields_values, function(copyField,values) {
				if( values.length != 1 ) {
					passed = false ;
					return false ;
				}
				objValues[copyField] = values[0] ;
			}) ;
			if( !passed ) {
				this.onNewTrsptError('Incompatible DNs') ;
				return false ;
			}
			this.down('#pHeaderForm').getForm().setValues(objValues);
			
			this.down('#pHeaderForm').getForm().findField('id_soc').setReadOnly(true) ;
			this.down('#pHeaderForm').getForm().findField('flow_code').setReadOnly(true) ;
			this.down('#pHeaderForm').getForm().findField('atr_type').setReadOnly(true) ;
		}
	},
	onNewTrsptError: function(msg) {
		if( this.rendered ) {
			this.getEl().mask() ;
			Ext.defer( function() {
				Ext.MessageBox.alert('Error',msg,function(){this.close();},this) ;
			}, 500, this) ;
		} else {
			this.on('afterrender',function() {
				this.onNewTrsptError(msg) ;
			},this,{single: true}) ;
		}
	},
	loadTrspt: function( filerecordId ) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'trspt_getRecords',
				filter_trsptFilerecordId_arr: Ext.JSON.encode([filerecordId])
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false || ajaxResponse.data.length != 1 ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoadTrspt(Ext.ux.dams.ModelManager.create('DbsTracyFileTrsptModel',ajaxResponse.data[0])) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoadTrspt: function( trsptRecord ) {
		this._trsptNew = false ;
		this._trsptFilerecordId = trsptRecord.getId() ;
		this._trsptRecordCopy = trsptRecord ;
		
		//fHeader
		this.down('#pHeaderForm').getForm().reset() ;
		this.down('#pHeaderForm').getForm().findField('id_soc').setReadOnly(true) ;
		this.down('#pHeaderForm').getForm().findField('flow_code').setReadOnly(true) ;
		this.down('#pHeaderForm').getForm().findField('atr_type').setReadOnly(true) ;
		this.down('#pHeaderForm').getForm().findField('id_doc').setReadOnly(true) ;
		this.down('#pHeaderForm').getForm().loadRecord(trsptRecord) ;
		if( this._readonlyMode ) {
			this.down('#pHeaderForm').getForm().getFields().each( function(field) {
				if( field.setReadOnly ) {
					field.setReadOnly(true) ;
				}
			});
		}
		//fHeader compute EDI status
		var ediStatus = '-',
			askReset = false ;
		if( trsptRecord.get('sword_edi_1_sent') ) {
			ediStatus = '<font color="green"><b>Sent</b></font>' ;
			askReset = true ;
		} else if( trsptRecord.get('sword_edi_1_ready') ) {
			ediStatus = '<font color="#FFCD75"><b>Ready</b></font>' ;
		} else if( trsptRecord.get('sword_edi_1_warn') ) {
			ediStatus = '<font color="red"><b>Warning</b></font>' ;
		}
		this.down('#pHeaderForm').getForm().findField('sword_edi_status').setValue(ediStatus) ;
		this.down('#pHeaderForm').down('#cntEdiReset').setVisible(askReset) ;
		
		//gSteps
		this.down('#pOrdersGrid').getEl().unmask() ;
		this.down('#pOrdersGrid').getStore().loadRawData(trsptRecord.orders().getRange()) ;
		
		//gAttachments
		this.down('#pEvents').getEl().unmask() ;
		this.down('#pEventsGrid').getStore().loadRawData(trsptRecord.events().getRange()) ;
		
		// Title
		this.setTitle('Trspt: '+trsptRecord.get('id_doc')) ;
		
		// Validate steps menu
		var tbValidateMenu = this.down('#tbValidate').menu ;
		tbValidateMenu.removeAll() ;
		tbValidateMenuItems = [] ;
		var curFlow = Optima5.Modules.Spec.DbsTracy.HelperCache.getOrderflow( trsptRecord.get('flow_code') );
		if( curFlow ) {
			Ext.Array.each( curFlow.steps, function(curStep) {
				if( !curStep.prompt_trspt ) {
					return ;
				}
				tbValidateMenuItems.push({
					_stepCode: curStep.step_code,
					text: '<b>' + curStep.step_code + '</b>',
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
		this.loadTrspt( this._trsptFilerecordId ) ;
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
	
	handleSaveHeader: function(validateStepCode) {
		if( this._readonlyMode ) {
			return ;
		}
		if( !Ext.isEmpty(validateStepCode) && !Optima5.Modules.Spec.DbsTracy.HelperCache.authHelperQueryPage('GOM') ) {
			Ext.Msg.alert('Auth','Not authorized') ;
			return ;
		}
		
		
		var formPanel = this.down('#pHeaderForm'),
			form = formPanel.getForm() ;
		if( !form.isValid() ) {
			return ;
		}
		
		// Spec is_options
		if( validateStepCode && !(validateStepCode === true) ) {
			var curStep = Optima5.Modules.Spec.DbsTracy.HelperCache.getStepByStep( validateStepCode ) ;
			if( curStep.is_options ) {
				return this.openAdvancedValidationPopup(validateStepCode) ;
			}
		}
		
		var recordData = form.getValues(false,false,false,true) ;
		
		var gridOrders = this.down('#pOrdersGrid'),
			orderFilerecordIds = [] ;
		gridOrders.getStore().each( function(orderRecord) {
			orderFilerecordIds.push(orderRecord.get('order_filerecord_id')) ;
		}) ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'trspt_setHeader',
				_is_new: ( this._trsptNew ? 1 : 0 ),
				trspt_filerecord_id: ( this._trsptNew ? null : this._trsptFilerecordId ),
				data: Ext.JSON.encode(recordData),
				data_orderFilerecordIds: Ext.JSON.encode( orderFilerecordIds ),
				validateStepCode: ( !Ext.isEmpty(validateStepCode) ? validateStepCode : null )
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.error || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				this.onSaveHeader(ajaxResponse.id, !Ext.isEmpty(validateStepCode)) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onSaveHeader: function(savedId, dontClose) {
		this.optimaModule.postCrmEvent('datachange',{}) ;
		
		if( this._trsptNew || dontClose ) {
			this.loadTrspt(savedId) ;
		} else {
			this.fireEvent('candestroy',this) ;
		}
	},
	
	handleEdiReset: function() {
		Ext.Msg.confirm('Confirm?','Reset EDI status / resend ?',function(btn){
			if( btn=='yes' ) {
				this.doEdiReset() ;
			}
		},this);
	},
	doEdiReset: function() {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'trspt_doEdiReset',
				trspt_filerecord_id: this._trsptFilerecordId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.error || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				this.doReload() ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	
	
	doOrdersAdd: function(selectedNodeRecord) {
		if( !Optima5.Modules.Spec.DbsTracy.HelperCache.authHelperQueryPage('ADMIN') ) {
			Ext.Msg.alert('Auth','Not authorized') ;
			return ;
		}
		
		
		var formPanel = this.down('#pHeaderForm'),
			form = formPanel.getForm(),
			recordData = form.getValues(false,false,false,true) ;
			
		if( this._trsptRecordCopy ) {
			recordData = this._trsptRecordCopy.getData() ;
			if( recordData['print_is_ok'] ) {
				Ext.MessageBox.alert('Error','Document already printed') ;
				return ;
			}
		}
		
		var selectedOrderRecords = [] ;
		selectedNodeRecord.cascadeBy( function(node) {
			if( node.get('order_filerecord_id') > 0 ) {
				selectedOrderRecords.push(node) ;
			}
		});
		
		if( selectedOrderRecords.length < 1 ) {
			return ;
		}
		
		// Check soc_code
		var validationRecord = selectedOrderRecords[0] ;
		if( validationRecord.get('id_soc') != recordData['id_soc'] ) {
			Ext.MessageBox.alert('Error','Incompatible (company code)') ;
			return ;
		}
		
		if( Optima5.Modules.Spec.DbsTracy.HelperCache.checkOrderData(validationRecord.getData()) != null ) {
			Ext.MessageBox.alert('Incomplete','DN incomplete. Check order details') ;
			return ;
		}
		
		var fields = [
			'id_soc',
			'flow_code',
			'atr_type',
			'atr_priority',
			'atr_incoterm',
			'atr_consignee'
		];
		var passed = true ;
		Ext.Array.each( fields, function(field) {
			if( validationRecord.get(field) != recordData[field] ) {
				Ext.MessageBox.alert('Error','Incompatible ('+field+')') ;
				passed = false ;
				return false ;
			}
		}) ;
		if( !passed ) {
			return ;
		}
		
		var nbLeft = selectedOrderRecords.length ;
		Ext.Array.each( selectedOrderRecords, function(orderRecord) {
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_moduleId: 'spec_dbs_tracy',
					_action: 'trspt_orderAdd',
					trspt_filerecord_id: this._trsptFilerecordId,
					order_filerecord_id: orderRecord.get('order_filerecord_id')
				},
				success: function(response) {
					var ajaxResponse = Ext.decode(response.responseText) ;
					if( ajaxResponse.success == false ) {
						var error = ajaxResponse.error || 'File not saved !' ;
						Ext.MessageBox.alert('Error',error) ;
						return ;
					}
					nbLeft-- ;
					if( nbLeft == 0 ) {
						this.doReload() ;
						this.optimaModule.postCrmEvent('datachange',{}) ;
					}
				},
				callback: function() {
					this.hideLoadmask() ;
				},
				scope: this
			}) ;
		},this) ;
	},
	doOrdersRemove: function(orderRecords) {
		if( !Optima5.Modules.Spec.DbsTracy.HelperCache.authHelperQueryPage('ADMIN') ) {
			Ext.Msg.alert('Auth','Not authorized') ;
			return ;
		}
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'trspt_orderRemove',
				trspt_filerecord_id: this._trsptFilerecordId,
				order_filerecord_id: orderRecords[0].get('order_filerecord_id')
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
				_action: 'trspt_stepValidate',
				trspt_filerecord_id: this._trsptFilerecordId,
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
	
	handleSubmitEvent: function() {
		if( this._readonlyMode ) {
			return ;
		}
		var formPanel = this.down('#pEventsForm'),
			form = formPanel.getForm() ;
		if( !form.isValid() ) {
			return ;
		}
		
		var recordData = form.getValues(false,false,false,true) ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'trspt_eventAdd',
				trspt_filerecord_id: this._trsptFilerecordId,
				data: Ext.JSON.encode(recordData)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				form.reset() ;
				formPanel.collapse() ;
				this.doReload() ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	
	openPrintPopup: function(printType) {
		if( this._readonlyMode ) {
			return ;
		}
		this.showLoadmask() ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'trspt_printDoc',
				trspt_filerecord_id: this._trsptFilerecordId,
				print_type: printType
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success == true ) {
					this.openPrintPopupDo( this.getTitle(), jsonResponse.html ) ;
					this.doReload() ;
				} else {
					Ext.MessageBox.alert('Error','Print system disabled') ;
				}
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	openPrintPopupDo: function(pageTitle, pageHtml) {
		this.optimaModule.createWindow({
			width:850,
			height:700,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			layout:'fit',
			title: pageTitle,
			items:[Ext.create('Ext.ux.dams.IFrameContent',{
				itemId: 'uxIFrame',
				content:pageHtml
			})],
			tbar:[{
				icon: 'images/op5img/ico_print_16.png',
				text: 'Print',
				handler: function(btn) {
					var uxIFrame = btn.up('window').down('#uxIFrame'),
						uxIFrameWindows = uxIFrame.getWin() ;
					if( uxIFrameWindows == null ) {
						Ext.MessageBox.alert('Problem','Printing disabled !') ;
						return ;
					}
					uxIFrameWindows.print() ;
				},
				scope: this
			},{
				icon: 'images/op5img/ico_save_16.gif',
				text: 'Save as PDF',
				handler: function(btn) {
					var uxIFrame = btn.up('window').down('#uxIFrame') ;
					
					var exportParams = this.optimaModule.getConfiguredAjaxParams() ;
					Ext.apply(exportParams,{
						_moduleId: 'spec_dbs_lam',
						_action: 'util_htmlToPdf',
						html: Ext.JSON.encode(uxIFrame.content)
					}) ;
					Ext.create('Ext.ux.dams.FileDownloader',{
						renderTo: Ext.getBody(),
						requestParams: exportParams,
						requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
						requestMethod: 'POST'
					}) ;
				},
				scope: this
			}]
		}); 
	},
	
	openAdvancedValidationPopup: function(validateStepCode) {
		if( this._readonlyMode ) {
			return ;
		}
		if( this._trsptNew ) {
			return ;
		}
		var popupPanel = Ext.create('Ext.form.Panel',{
			optimaModule: this.optimaModule,
			thisParent: this,
			
			width:420,
			height:250,
			
			cls: 'ux-noframe-bg',
			
			floating: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				}
			}],
			
			xtype: 'form',
			border: false,
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 8,
			layout:'anchor',
			fieldDefaults: {
				labelWidth: 140,
				anchor: '100%'
			},
			items:[{
				height: 72,
				xtype: 'component',
				tpl: [
					'<div class="op5-spec-embralam-liveadr-relocatebanner">',
						'<span>{text}</span>',
					'</div>'
				],
				data: {text: '<b>Validate step procedure</b><br>Step requires additional data<br>'}
			},{
				xtype: 'displayfield',
				fieldLabel: '<b>Step code</b>',
				name: 'step_code',
				value: validateStepCode
			},{
				xtype: 'datetimefield',
				fieldLabel: '<b>Acknowledgment date</b>',
				name: 'date_actual',
				allowBlank: false
			},{
				xtype: 'checkboxfield',
				boxLabel: '<font color="red"><b>Inconsistent step ! Force transaction ?</b></font>',
				name: 'step_doForce',
				hidden: true
			}],
			buttons: [{
				xtype: 'button',
				text: 'Submit',
				handler:function(btn){
					var formPanel = btn.up('form') ;
					formPanel.doSubmitPopup() ;
				},
				scope: this
			}],
			doSubmitPopup: function() {
				var formPanel = this,
					form = formPanel.getForm(),
					formValues = form.getValues(false,false,false,true) ;
				if( !form.isValid() ) {
					return ;
				}
				
				this.getEl().mask('Submitting...') ;
				this.optimaModule.getConfiguredAjaxConnection().request({
					params: {
						_moduleId: 'spec_dbs_tracy',
						_action: 'trspt_setHeader',
						_is_new: 0,
						trspt_filerecord_id: this.thisParent._trsptFilerecordId,
						data: Ext.JSON.encode( this.thisParent.down('#pHeaderForm').getForm().getValues(false,false,false,true) ),
						validateStepCode: formValues['step_code'],
						validateDoForce: (formValues['step_doForce'] ? 1 : 0),
						validateData: Ext.JSON.encode(formValues)
					},
					success: function(response) {
						var ajaxResponse = Ext.decode(response.responseText) ;
						if( ajaxResponse.error_validate ) {
							form.findField('step_doForce').setVisible(true) ;
							return ;
						}
						if( ajaxResponse.success == false ) {
							var error = ajaxResponse.error || 'File not saved !' ;
							Ext.MessageBox.alert('Error',error) ;
							return ;
						}
						this.thisParent.onSaveHeader(ajaxResponse.id, true) ;
						this.destroy() ;
					},
					callback: function() {
						if( this.getEl() ) {
							this.getEl().unmask() ;
						}
					},
					scope: this
				}) ;
			}
		});
		
		popupPanel.on('destroy',function() {
			this.getEl().unmask() ;
		},this,{single:true}) ;
		this.getEl().mask() ;
		
		popupPanel.show();
		popupPanel.getEl().alignTo(this.getEl(), 'c-c?');
	}
});
