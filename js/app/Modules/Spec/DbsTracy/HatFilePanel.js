Ext.define('Optima5.Modules.Spec.DbsTracy.HatFileDimensionsField',{
	extend: 'Ext.form.FieldContainer',
	mixins: {
		field: 'Ext.form.field.Base'
	},
	alias: 'widget.op5specdbstracydimensionsfield',
	initComponent: function() {
		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'center'
			},
			isFormField: true,
			items: [{
				xtype: 'box',
				html: '&#160;'+'&#160;'+'&#160;'+'h:'
			},{
				xtype: 'numberfield',
				hideTrigger: true,
				width: 50,
				isFormField: false
			},{
				xtype: 'box',
				html: '&#160;'+'&#160;'+'&#160;'+'w:'
			},{
				xtype: 'numberfield',
				hideTrigger: true,
				width: 50,
				isFormField: false
			},{
				xtype: 'box',
				html: '&#160;'+'&#160;'+'&#160;'+'d:'
			},{
				xtype: 'numberfield',
				hideTrigger: true,
				width: 50,
				isFormField: false
			}]
		});
		this.callParent() ;
	},
	getValue: function() {
		var fields = this.query('numberfield'),
			value = [] ;
		Ext.Array.each( fields, function(field) {
			value.push(field.getValue()||0) ;
		}) ;
		return value ;
	},
	setValue: function(value) {
		var fields = this.query('numberfield') ;
		if( Ext.isArray(value) && value.length==3 ) {
			Ext.Array.each(fields, function(field,idx) {
				field.setValue(value[idx]) ;
			}) ;
		} else {
			Ext.Array.each(fields, function(field,idx) {
				field.reset() ;
			}) ;
		}
	},
	
	isValid: function() {
		var me = this,
			disabled = me.disabled,
			validate = me.forceValidation || !disabled;

		return validate ? me.validateValue(me.getValue()) : disabled;
	},
	getErrors: function(value) {
		if( Ext.isArray(value) && value.length==3 && value[0]>0 && value[1]>0 && value[2]>0 ) {
			return [] ;
		} else {
			return ['Incorrect dimensions'] ;
		}
	},
	markInvalid: function(errors) {
		var fields = this.query('numberfield') ;
			Ext.Array.each(fields, function(field,idx) {
				field.markInvalid('Invalid') ;
			}) ;
	},
	clearInvalid: function() {
		var fields = this.query('numberfield') ;
			Ext.Array.each(fields, function(field,idx) {
				field.clearInvalid('') ;
			}) ;
	}
});

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
				flex: 1,
				xtype: 'container',
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				items: [{
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
					itemId: 'pDimensionsGrid',
					title: 'Dimensions',
					xtype: 'grid',
					tbar: [{
						itemId: 'tbNew',
						icon: 'images/add.png',
						text: 'Add',
						handler: function() {
							this.handleParcelNew();
						},
						scope: this
					},'-',{
						disabled: true,
						itemId: 'tbDelete',
						icon: 'images/delete.png',
						text: 'Delete',
						handler: function() {
							this.handleParcelDelete();
						},
						scope: this
					}],
					plugins: [{
						ptype: 'rowediting',
						pluginId: 'rowediting',
						listeners: {
							beforeedit: this.onBeforeEditParcel,
							edit: this.onAfterEditParcel,
							canceledit: this.onCancelEditParcel,
							scope: this
						}
					}],
					columns: [{
						align: 'center',
						text: 'NbParcels',
						width: 80,
						dataIndex: 'vol_count',
						renderer: function(v) {
							if( v>0 ) {
								return '<b>'+v+'</b>' ;
							}
						},
						editor: {
							xtype: 'numberfield',
							hideTrigger: true,
							validator: function(v) {
								if( v > 0 ) {
									return true ;
								} else {
									return 'Empty count' ;
								}
							}
						}
					},{
						align: 'center',
						text: 'Weigth(kg)',
						width: 90,
						dataIndex: 'vol_kg',
						renderer: function(v) {
							if( v>0 ) {
								return '<b>'+v+'</b>'+'&#160;'+'kg' ;
							}
						},
						editor: {
							xtype: 'numberfield',
							hideTrigger: true,
							validator: function(v) {
								if( v > 0 ) {
									return true ;
								} else {
									return 'Empty weight' ;
								}
							}
						}
					},{
						align: 'center',
						text: 'Dimensions(mm)',
						width: 250,
						dataIndex: 'vol_dims',
						renderer: function(v) {
							if( Ext.isArray(v) && v.length == 3 ) {
								return v.join('&#160;'+'x'+'&#160;') ;
							}
						},
						editor: {
							xtype: 'op5specdbstracydimensionsfield'
						}
					}],
					store: {
						model: 'DbsTracyFileHatParcelEditModel',
						data: []
					},
					listeners: {
						selectionchange: function(selModel,records) {
							this.down('#pDimensionsGrid').down('toolbar').down('#tbDelete').setDisabled( !(records && records.length > 0) ) ;
						},
						scope: this
					}
				}]
			},{
				flex: 1,
				itemId: 'pOrdersGrid',
				xtype: 'grid',
				columns: [{
					text: 'DN #',
					width: 100,
					dataIndex: 'id_dn'
				},{
					text: 'PO #',
					width: 100,
					dataIndex: 'ref_invoice'
				},{
					text: 'Status',
					width: 130,
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
							gridContextMenuItems.push('-',{
								iconCls: 'icon-bible-delete',
								text: 'Unassign',
								handler : function() {
									var txt = '<b>'+selRecord.get('id_soc')+'/'+selRecord.get('id_dn')+'</b>' ;
									Ext.Msg.confirm('Confirm?','Unassign order '+txt+' ?',function(btn){
										if( btn=='yes' ) {
											this.doOrdersRemove( [selRecord] ) ;
										}
									},this) ;
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
			
			var errors ;
			var passed = true ;
			Ext.Array.each( hatNew_orderRecords, function(orderRecord) {
				if( orderRecord.get('calc_hat_is_active') ) {
					//this.onNewHatError('DN already attached to ShipGroup') ;
					//return false ;
				}
				if( (errors=Optima5.Modules.Spec.DbsTracy.HelperCache.checkOrderData(orderRecord.getData())) != null ) {
					passed = false ;
				}
			},this) ;
			if( !passed ) {
				this.onNewHatError('DN incomplete. Check order details<br>'+Ext.Object.getValues(errors).join('<br>')) ;
				return false ;
			}
			
			var copyFields = ['id_soc','flow_code','atr_type','atr_consignee','atr_incoterm','atr_priority','calc_link_trspt_filerecord_id'] ;
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
		
		var parcelsData = [] ;
		hatRecord.parcels().each(function(parcelRecord) {
			parcelsData.push(parcelRecord.getData()) ;
		}) ;
		this.down('#pDimensionsGrid').getStore().loadData(parcelsData) ;
		
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
	
	
	
	
	onBeforeEditParcel: function(editor,context) {
		if(editor._disabled){
			return false ;
		}
	},
	onAfterEditParcel: function(editor,context) {
		context.record.set('_phantom',false) ;
		context.record.commit() ;
	},
	onCancelEditParcel: function(editor,context) {
		if( context.record.get('_phantom') ) {
			context.grid.getStore().remove(context.record) ;
		}
	},
	handleParcelNew: function() {
		var dimensionsGrid = this.down('#pDimensionsGrid') ;
		if( dimensionsGrid.getPlugin('rowediting')._disabled ) {
			return ;
		}
		var newRecords = dimensionsGrid.getStore().add( Ext.create('DbsTracyFileHatParcelEditModel',{
			_phantom: true
		}) ) ;
		dimensionsGrid.getPlugin('rowediting').startEdit(newRecords[0]) ;
	},
	handleParcelDelete: function() {
		var dimensionsGrid = this.down('#pDimensionsGrid') ;
		if( dimensionsGrid.getPlugin('rowediting')._disabled ) {
			return ;
		}
		var toDeleteRecords = dimensionsGrid.getSelectionModel().getSelection() ;
		if( toDeleteRecords && toDeleteRecords.length>0 ) {
			dimensionsGrid.getStore().remove(toDeleteRecords) ;
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
		
		recordData['parcels'] = [] ;
		this.down('#pDimensionsGrid').getStore().each(function( hatParcelRecord ) {
			recordData['parcels'].push(hatParcelRecord.getData()) ;
		});
		
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
		
		var errors ;
		if( (errors=Optima5.Modules.Spec.DbsTracy.HelperCache.checkOrderData(validationRecord.getData())) != null ) {
			Ext.MessageBox.alert('Incomplete','DN incomplete. Check order details<br>'+Ext.Object.getValues(errors).join('<br>')) ;
			return ;
		}
		
		var gridOrders = this.down('#pOrdersGrid'),
			storeOrders = gridOrders.getStore(),
			rowOrderValidation = ( storeOrders.getCount()>0 ? storeOrders.getAt(0).getData() : null );
		
		if( rowOrderValidation ) {
			var fields = [
				'id_soc',
				'flow_code',
				'atr_type',
				'atr_priority',
				'atr_incoterm',
				'atr_consignee',
				'calc_link_trspt_filerecord_id'
			];
			var passed = true ;
			Ext.Array.each( fields, function(field) {
				if( validationRecord.get(field) != rowOrderValidation[field] ) {
					Ext.MessageBox.alert('Error','Incompatible ('+field+')') ;
					passed = false ;
					return false ;
				}
			}) ;
			if( !passed ) {
				return ;
			}
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
