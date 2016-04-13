Ext.define('Optima5.Modules.Spec.DbsTracy.TrsptFilePanel',{
	extend:'Ext.window.Window',
	
	requires: [
		'Ext.ux.PreviewPlugin',
		'Optima5.Modules.Spec.DbsTracy.CfgParamField',
		'Optima5.Modules.Spec.DbsTracy.CfgParamText'
	],
	
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
				iconCls:'op5-sdomains-menu-updateschema',
				text:'<b>Validate</b>',
				menu: [{
					iconCls:'op5-sdomains-menu-updateschema',
					text:'Validate <b>60_TRSPTREADY</b>',
					handler: function() {
						this.handleSaveHeader('60_TRSPTREADY') ;
					},
					scope:this
				},{
					iconCls:'op5-sdomains-menu-updateschema',
					text:'Validate <b>70_PICKUP</b>',
					handler: function() {
						this.handleSaveHeader('70_PICKUP') ;
					},
					scope:this
				},{
					iconCls:'op5-sdomains-menu-updateschema',
					text:'Validate <b>90_POD</b>',
					handler: function() {
						this.handleSaveHeader('90_POD') ;
					},
					scope:this
				},{
					iconCls:'op5-sdomains-menu-updateschema',
					text:'Validate <b>99_LTA</b>',
					handler: function() {
						this.handleSaveHeader('99_LTA') ;
					},
					scope:this
				}]
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
					allowBlank: false
				}),{
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
					title: 'Customs request',
					checkboxName: 'customs_is_on',
					checkboxToggle: true,
					fieldDefaults: {
						labelWidth: 40,
						anchor: '100%'
					},
					items: [{
						xtype: 'datetimefield',
						fieldLabel: 'REQ',
						name: 'customs_date_request'
					},{
						xtype: 'datetimefield',
						fieldLabel: 'CLR',
						name: 'customs_date_cleared'
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
						var tmpText = stepRow['step_txt'] ;
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
						},{
							iconCls: 'icon-bible-delete',
							text: 'Unassign',
							handler : function() {
								this.doOrdersRemove( [selRecord] ) ;
							},
							scope : this
						});
						
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
		
		this.on('afterrender', function() {
			if( this._trsptNew ) {
				this.newTrspt() ;
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
					var selectedRecord = ddSource.dragData.records[0];
					me.doOrdersAdd([selectedRecord]) ;
					return true;
			}
		});
	},
	
	newTrspt: function() {
		this._trsptNew = true ;
		
		//fHeader
		this.down('#pHeaderForm').getForm().reset() ;
		this.down('#pHeaderForm').getForm().setValues({
			date_create: new Date(),
			id_doc: 'NEW',
			customs_is_on: false
		});
		
		//gOrders
		this.down('#pOrdersGrid').getEl().mask() ;
		this.down('#pOrdersGrid').getStore().removeAll() ;
		
		//gEvents
		this.down('#pEvents').getEl().mask() ;
		this.down('#pEventsGrid').getStore().removeAll() ;
		
		// Title
		this.setTitle('New TrsptFile') ;
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
		
		//fHeader
		this.down('#pHeaderForm').getForm().reset() ;
		this.down('#pHeaderForm').getForm().findField('id_soc').setReadOnly(true) ;
		this.down('#pHeaderForm').getForm().findField('id_doc').setReadOnly(true) ;
		this.down('#pHeaderForm').getForm().loadRecord(trsptRecord) ;
		
		//gSteps
		this.down('#pOrdersGrid').getEl().unmask() ;
		this.down('#pOrdersGrid').getStore().loadRawData(trsptRecord.orders().getRange()) ;
		
		//gAttachments
		this.down('#pEvents').getEl().unmask() ;
		this.down('#pEventsGrid').getStore().loadRawData(trsptRecord.events().getRange()) ;
		
		// Title
		this.setTitle('Trspt: '+trsptRecord.get('id_doc')) ;
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
		var formPanel = this.down('#pHeaderForm'),
			form = formPanel.getForm() ;
		if( !form.isValid() ) {
			return ;
		}
		
		var recordData = form.getValues(false,false,false,true) ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'trspt_setHeader',
				_is_new: ( this._trsptNew ? 1 : 0 ),
				trspt_filerecord_id: ( this._trsptNew ? null : this._trsptFilerecordId ),
				data: Ext.JSON.encode(recordData),
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
	
	
	doOrdersAdd: function(orderRecords) {
		var formPanel = this.down('#pHeaderForm'),
			form = formPanel.getForm(),
			recordData = form.getValues(false,false,false,true) ;
		
		// Check soc_code
		var orderRecord = orderRecords[0] ;
		if( orderRecord.get('id_soc') != recordData['id_soc'] ) {
			Ext.MessageBox.alert('Error','Incompatible (company code)') ;
			return ;
		}
		
		if( Optima5.Modules.Spec.DbsTracy.HelperCache.checkOrderData(orderRecord.getData()) != null ) {
			Ext.MessageBox.alert('Incomplete','DN incomplete. Check order details') ;
			return ;
		}
		
		var fields = [
			'atr_priority',
			'atr_incoterm',
			'atr_consignee'
		];
		var passed = true ;
		Ext.Array.each( fields, function(field) {
			if( orderRecord.get(field) != recordData[field] ) {
				Ext.MessageBox.alert('Error','Incompatible ('+field+')') ;
				passed = false ;
				return false ;
			}
		}) ;
		if( !passed ) {
			return ;
		}
		
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
				this.doReload() ;
				this.optimaModule.postCrmEvent('datachange',{}) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	doOrdersRemove: function(orderRecords) {
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
	}
});
