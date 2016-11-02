Ext.define('Optima5.Modules.Spec.DbsTracy.HatFilePanel',{
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
					fieldLabel: '<b>HID</b>',
					value: '',
					readOnly: true,
					name: 'id_hat',
					allowBlank: false
				},{
					xtype: 'datefield',
					fieldLabel: 'Created',
					format: 'd/m/Y',
					submitFormat: 'Y-m-d',
					name: 'date_create',
					allowBlank: false
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
					model: 'DbsTracyFileHatOrderModel',
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
			}]
		}) ;
		this.callParent() ;
		if( this._readonlyMode ) {
			this.down('toolbar').setVisible(false) ;
		}
		
		this.on('afterrender', function() {
			if( this._hatNew ) {
				this.newHat( this._hatNew_orderRecords ) ;
			} else {
				this.loadHat( this._hatFilerecordId ) ;
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
	
	newHat: function( hatNew_orderRecords ) {
		this._hatNew = true ;
		
		//fHeader
		this.down('#pHeaderForm').getForm().reset() ;
		this.down('#pHeaderForm').getForm().findField('id_soc').setReadOnly(false) ;
		this.down('#pHeaderForm').getForm().findField('id_hat').setReadOnly(false) ;
		this.down('#pHeaderForm').getForm().setValues({
			date_create: new Date(),
			id_hat: ''
		});
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
		
		// Title
		this.setTitle('New ShipGroup') ;
		
		if( hatNew_orderRecords != null && hatNew_orderRecords.length>0 ){
			this.down('#pOrdersGrid').getStore().add(hatNew_orderRecords) ;
			
			var passed = true ;
			Ext.Array.each( hatNew_orderRecords, function(orderRecord) {
				if( Optima5.Modules.Spec.DbsTracy.HelperCache.checkOrderData(orderRecord.getData()) != null ) {
					passed = false ;
				}
			}) ;
			if( !passed ) {
				this.onNewHatError('DN incomplete. Check order details') ;
				return false ;
			}
			
			var copyFields = ['id_soc','flow_code','atr_type','atr_consignee','atr_incoterm','atr_priority'] ;
			var map_copyFields_values = {} ;
			//check ?
			// if OK => setValues
			Ext.Array.each( copyFields, function(copyField) {
				map_copyFields_values[copyField] = [] ;
				Ext.Array.each( hatNew_orderRecords, function(orderRecord) {
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
				this.onNewHatError('Incompatible DNs') ;
				return false ;
			}
			this.down('#pHeaderForm').getForm().setValues(objValues);
			
			this.down('#pHeaderForm').getForm().findField('id_soc').setReadOnly(true) ;
		}
	},
	onNewHatError: function(msg) {
		if( this.rendered ) {
			this.getEl().mask() ;
			Ext.defer( function() {
				Ext.MessageBox.alert('Error',msg,function(){this.close();},this) ;
			}, 500, this) ;
		} else {
			this.on('afterrender',function() {
				this.onNewHatError(msg) ;
			},this,{single: true}) ;
		}
	},
	loadHat: function( filerecordId ) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'hat_getRecords',
				filter_hatFilerecordId_arr: Ext.JSON.encode([filerecordId])
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false || ajaxResponse.data.length != 1 ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoadHat(Ext.ux.dams.ModelManager.create('DbsTracyFileHatModel',ajaxResponse.data[0])) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoadHat: function( hatRecord ) {
		this._hatNew = false ;
		this._hatFilerecordId = hatRecord.getId() ;
		this._hatRecordCopy = hatRecord ;
		
		//fHeader
		this.down('#pHeaderForm').getForm().reset() ;
		this.down('#pHeaderForm').getForm().findField('id_soc').setReadOnly(true) ;
		this.down('#pHeaderForm').getForm().findField('id_hat').setReadOnly(true) ;
		this.down('#pHeaderForm').getForm().loadRecord(hatRecord) ;
		if( this._readonlyMode ) {
			this.down('#pHeaderForm').getForm().getFields().each( function(field) {
				if( field.setReadOnly ) {
					field.setReadOnly(true) ;
				}
			});
		}
		
		//gSteps
		this.down('#pOrdersGrid').getEl().unmask() ;
		this.down('#pOrdersGrid').getStore().loadRawData(hatRecord.orders().getRange()) ;
		
		// Title
		this.setTitle('ShipGroup: '+hatRecord.get('id_hat')) ;
	},
	doReload: function() {
		this.loadHat( this._hatFilerecordId ) ;
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
				_action: 'hat_setHeader',
				_is_new: ( this._hatNew ? 1 : 0 ),
				hat_filerecord_id: ( this._hatNew ? null : this._hatFilerecordId ),
				data: Ext.JSON.encode(recordData),
				data_orderFilerecordIds: Ext.JSON.encode( orderFilerecordIds )
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
		
		if( this._hatNew || dontClose ) {
			this.loadHat(savedId) ;
		} else {
			this.fireEvent('candestroy',this) ;
		}
	},
	
	
	doOrdersAdd: function(selectedNodeRecord) {
		if( !Optima5.Modules.Spec.DbsTracy.HelperCache.authHelperQueryPage('ADMIN') ) {
			Ext.Msg.alert('Auth','Not authorized') ;
			return ;
		}
		
		
		var formPanel = this.down('#pHeaderForm'),
			form = formPanel.getForm(),
			recordData = form.getValues(false,false,false,true) ;
			
		// Check soc_code
		var validationRecord = selectedNodeRecord ;
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
		
		var selectedOrderRecords = [] ;
		selectedNodeRecord.cascadeBy( function(node) {
			if( node.get('order_filerecord_id') > 0 ) {
				selectedOrderRecords.push(node) ;
			}
		});
		
		var nbLeft = selectedOrderRecords.length ;
		Ext.Array.each( selectedOrderRecords, function(orderRecord) {
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_moduleId: 'spec_dbs_tracy',
					_action: 'hat_orderAdd',
					hat_filerecord_id: this._hatFilerecordId,
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
				_action: 'hat_orderRemove',
				hat_filerecord_id: this._hatFilerecordId,
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
	}
});
