Ext.define('DbsTracyTrsptTreeParcelModel',{
	extend: 'Ext.data.Model',
	fields:[
		{ name: 'vol_count', type: 'int', allowNull:true },
		{ name: 'vol_kg', type: 'number', allowNull:true },
		{ name: 'vol_dims', type: 'auto', allowNull:true }
	]
});
Ext.define('DbsTracyTrsptTreeModel',{
	extend: 'Ext.data.Model',
	fields:[
		{ name: 'type', type: 'string' },
		{ name: 'hat_filerecord_id', type: 'int' },
		{ name: 'order_filerecord_id', type: 'int' },
		{ name: 'id_soc', type: 'string' },
		{ name: 'id_hat', type: 'string' },
		{ name: 'id_dn', type: 'string' },
		{ name: 'ref_invoice', type: 'string' },
		{ name: 'calc_step', type: 'string' }
	],
	hasMany: [{
		model: 'DbsTracyTrsptTreeParcelModel',
		name: 'parcels',
		associationKey: 'parcels'
	}]
});

Ext.define('Optima5.Modules.Spec.DbsTracy.TrsptFilePanel',{
	extend:'Ext.window.Window',
	
	requires: [
		'Ext.ux.PreviewPlugin',
		'Optima5.Modules.Spec.DbsTracy.CfgParamField',
		'Optima5.Modules.Spec.DbsTracy.CfgParamText',
		'Optima5.Modules.Spec.DbsTracy.TrsptLabelPanel'
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
					text:'Print / <b>Sélection Auto</b>',
					handler: function() {
						this.openPrintPopup(null) ;
					},
					scope:this
				},'-',{
					icon: 'images/op5img/ico_print_16.png',
					text:'Print / <i>Autres Modèles</i>',
					menu: [{
						icon: 'images/op5img/ico_print_16.png',
						text:'Print <i>Livraison navette</i></b>',
						handler: function() {
							this.openPrintPopup('delivery') ;
						},
						scope:this
					},{
						icon: 'images/op5img/ico_print_16.png',
						text:'Print <i>Mise à disposition</i>',
						handler: function() {
							this.openPrintPopup('pickup') ;
						},
						scope:this
					},{
						icon: 'images/op5img/ico_print_16.png',
						text:'Print <i>Intégrateur</i>',
						handler: function() {
							this.openPrintPopup('integrateur') ;
						},
						scope:this
					}]
				}]
			},{
				icon: 'images/modules/dbstracy-label-16.png',
				text: '<b>Generate Label</b>',
				handler: function() {
					this.handleDoLabel() ;
				},
				scope:this
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
						//allowBlank: false,
						name: 'mvt_origin'
					},{
						xtype: 'op5specdbstracycfgparamtext',
						cfgParam_id: 'LIST_AIRPORT',
						fieldLabel: 'Destination',
						//allowBlank: false,
						name: 'mvt_dest'
					},{
						xtype: 'op5specdbstracycfgparamtext',
						cfgParam_id: 'LIST_CARRIER',
						fieldLabel: '<b>Carrier</b>',
						name: 'mvt_carrier',
						listeners:{
							change: function(cmb) {
								this.onChangeCarrier() ;
							},
							scope: this
						}
					},{
						xtype: 'comboboxcached',
						//cfgParam_id: 'LIST_CARRIERPROD',
						fieldLabel: '<b>Product</b>',
						name: 'mvt_carrier_prod',
						forceSelection: true,
						editable: false,
						store: {
							fields: [
								{name: 'code', type: 'string'},
								{name: 'txt', type: 'string'}
							],
							data: []
						},
						queryMode: 'local',
						displayField: 'txt',
						valueField: 'code'
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
					itemId: 'fsCustoms',
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
						allowBlank: true,
						editable: false,
						store: {
							fields: ['id','text'],
							data: [
								{id: ' ', text: ' '},
								{id: 'OFF', text: 'No customs (EU)'},
								{id: 'MAN', text: 'Manual Customs (CEQ/REQ)'},
								{id: 'AUTO', text: 'EDI Broker'}
							]
						},
						valueField: 'id',
						displayField: 'text',
						listeners:{
							change: function(cmb) {
								var formPanel = cmb.up('panel'),
									form = formPanel.getForm() ;
								form.findField('customs_date_request').setVisible(cmb.getValue()=='MAN') ;
								form.findField('customs_date_cleared').setVisible(cmb.getValue()=='MAN') ;
								//formPanel.down('#cntCustomsTransaction').setVisible(cmb.getValue()=='AUTO') ;
								formPanel.down('#customs_date_request_cnt').setVisible(cmb.getValue()=='AUTO') ;
								form.findField('customs_date_cleared_ro').setVisible(cmb.getValue()=='AUTO') ;
								form.findField('customs_mode_auto').setVisible(cmb.getValue()=='AUTO') ;
							}
						}
					},{
						xtype: 'combobox',
						name: 'customs_mode_auto',
						fieldLabel: 'EDI mode',
						queryMode: 'local',
						forceSelection: true,
						allowBlank: true,
						editable: false,
						store: {
							fields: ['id','text'],
							data: [
								{id: ' ', text: ' '},
								{id: 'EMAIL', text: 'Email'},
								{id: 'XML', text: 'XML'}
							]
						},
						valueField: 'id',
						displayField: 'text',
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
					},{
						hidden: true,
						xtype: 'fieldcontainer',
						fieldLabel: 'EDI',
						itemId: 'cntCustomsTransaction',
						items: [{
							xtype: 'button',
							text: 'Generate XML',
							menu: [{
								iconCls:'op5-sdomains-menu-updateschema',
								text: 'Send/Resend REQ',
								handler: function() {
									this.handleSaveHeader(null,{
										customs_date_request_do: true
									});
								},
								scope: this
							},{
								iconCls:'op5-sdomains-menu-updateschema',
								text: 'Acknowledge CLR',
								handler: function() {
									this.handleSaveHeader(null,{
										customs_date_cleared_do: true
									});
								},
								scope: this
							}]
						}]
					},{
						hidden: true,
						xtype: 'fieldcontainer',
						fieldLabel: 'REQ',
						itemId: 'customs_date_request_cnt',
						layout: {
							type: 'hbox'
						},
						items: [{
							xtype: 'displayfield',
							name: 'customs_date_request_ro',
						},{
							hidden: true,
							itemId: 'customs_date_request_btn',
							margin: '0px 10px',
							xtype: 'button',
							text: 'Download XML',
							handler: function() {
								
							},
							scope: this
						}]
					},{
						hidden: true,
						xtype: 'displayfield',
						fieldLabel: 'CLR',
						name: 'customs_date_cleared_ro'
					}]
				},{
					xtype: 'fieldset',
					itemId: 'fsSword1',
					collapsible: true,
					collapsed: true,
					title: 'EDI Sword 1 : File > Carrier',
					fieldDefaults: {
						labelWidth: 100,
						anchor: '100%'
					},
					items: [{
						itemId: 'txtDisplay',
						xtype: 'displayfield',
						fieldLabel: 'EDI Status',
						name: 'sword_edi_status'
					},{
						xtype: 'fieldcontainer',
						fieldLabel: 'EDI Resend',
						itemId: 'cntReset',
						items: [{
							xtype: 'button',
							text: 'Do resend',
							handler: function() {
								this.handleEdiReset(1) ;
							},
							scope: this
						}]
					}]
				},{
					xtype: 'fieldset',
					itemId: 'fsSword3',
					collapsible: true,
					collapsed: true,
					title: 'EDI Sword 3 : AWB > SAP',
					fieldDefaults: {
						labelWidth: 100,
						anchor: '100%'
					},
					items: [{
						itemId: 'txtDisplay',
						xtype: 'displayfield',
						fieldLabel: 'EDI Status',
						name: 'sword_edi_status'
					},{
						xtype: 'fieldcontainer',
						fieldLabel: 'EDI Resend',
						itemId: 'cntReset',
						items: [{
							xtype: 'button',
							text: 'Do resend',
							handler: function() {
								this.handleEdiReset(3) ;
							},
							scope: this
						}]
					}]
				}]
			},{
				flex: 3,
				itemId: 'pOrdersGrid',
				xtype: 'treepanel',
				useArrows: true,
				rootVisible: false,
				columns: [{
					xtype: 'treecolumn',
					text: 'DN #',
					width: 130,
					dataIndex: 'id',
					renderer: function(v,m,r) {
						switch( r.get('type') ) {
							case 'hat' :
								return '<b>'+r.get('id_hat')+'</b>' ;
							case 'order' :
								return r.get('id_dn') ;
							default :
								return '?' ;
						}
					}
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
					//dataIndex: 'vol_count',
					align: 'right',
					renderer: function(v,m,r) {
						var txt = [] ;
						r.parcels().each( function(dimRecord) {
							txt.push( dimRecord.get('vol_count') ) ;
						}) ;
						return txt.join('<br>') ;
					}
				},{
					text: 'Weight',
					width: 75,
					//dataIndex: 'vol_kg',
					align: 'right',
					renderer: function(v,m,r) {
						var txt = [] ;
						r.parcels().each( function(dimRecord) {
							txt.push( dimRecord.get('vol_kg')+'&#160;'+'kg' ) ;
						}) ;
						return txt.join('<br>') ;
					}
				},{
					text: 'Dimensions',
					width: 150,
					//dataIndex: 'vol_dims',
					renderer: function(v,m,r) {
						var txt = [] ;
						r.parcels().each( function(dimRecord) {
							txt.push( dimRecord.get('vol_dims').join(' x ') ) ;
						}) ;
						return txt.join('<br>') ;
					}
				}],
				store: {
					model: 'DbsTracyTrsptTreeModel',
					root: {root: true, children:[]},
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
						if( record.get('order_filerecord_id') > 0 ) {
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
						}
						if( record.get('hat_filerecord_id') > 0 ) {
							gridContextMenuItems.push({
								disabled: true,
								text: '<b>'+selRecord.get('id_soc')+'/'+selRecord.get('id_hat')+'</b>'
							},'-',{
								iconCls: 'icon-bible-edit',
								text: 'Modify',
								handler : function() {
									this.optimaModule.postCrmEvent('openhat',{hatFilerecordId:record.get('hat_filerecord_id')}) ;
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
				flex: 2,
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
		this.down('#pOrdersGrid').setRootNode({root:true, children:[]}) ;
		
		//gEvents
		this.down('#pEvents').getEl().mask() ;
		this.down('#pEventsGrid').getStore().removeAll() ;
		
		// Title
		this.setTitle('New TrsptFile') ;
		
		if( trsptNew_orderRecords != null && trsptNew_orderRecords.length>0 ){
			var trsptNew_orderLeafRecords = [],
				trsptNew_hatRecords = [] ;
			Ext.Array.each( trsptNew_orderRecords, function(trsptNew_orderRecord) {
				trsptNew_orderRecord.cascadeBy( function(trsptNew_orderChildRecord) {
					if( trsptNew_orderChildRecord.isLeaf() ) {
						trsptNew_orderLeafRecords.push(trsptNew_orderChildRecord) ;
					} else {
						trsptNew_hatRecords.push(trsptNew_orderChildRecord) ;
					}
				}) ;
			}) ;
			var rootNode = this.doBuildRootNode( trsptNew_hatRecords, trsptNew_orderLeafRecords ) ;
			this.down('#pOrdersGrid').setRootNode(rootNode) ;
			
			var errors ;
			var passed = true ;
			Ext.Array.each( trsptNew_orderLeafRecords, function(orderRecord) {
				if( (errors=Optima5.Modules.Spec.DbsTracy.HelperCache.checkOrderData(orderRecord.getData())) != null ) {
					passed = false ;
				}
			}) ;
			if( !passed ) {
				this.onNewTrsptError('DN incomplete. Check order details<br>'+Ext.Object.getValues(errors).join('<br>')) ;
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
	doBuildRootNode( trspt_hatRecords, trspt_orderRecords ) {
		var map_hatId_arrOrderIds = {},
			map_orderId_orderRecord = {} ;
		map_hatId_arrOrderIds[0] = [] ;
		Ext.Array.each( trspt_orderRecords, function( orderRecord ) {
			var hatId = ( orderRecord.get('calc_hat_is_active') ? orderRecord.get('calc_hat_filerecord_id') : 0 ) ;
			if( !map_hatId_arrOrderIds.hasOwnProperty(hatId) ) {
				map_hatId_arrOrderIds[hatId] = [] ;
			}
			map_hatId_arrOrderIds[hatId].push( orderRecord.get('order_filerecord_id') ) ;
			
			map_orderId_orderRecord[orderRecord.get('order_filerecord_id')] = orderRecord ;
		}) ;
		
		var map_hatId_hatRecord = {} ;
		Ext.Array.each( trspt_hatRecords, function( hatRecord ) {
			map_hatId_hatRecord[hatRecord.get('hat_filerecord_id')] = hatRecord ;
		}) ;
		
		var treeMembers = [] ;
		Ext.Object.each( map_hatId_arrOrderIds, function(hatId, arrOrderIds) {
			if( hatId == 0 ) {
				return ;
			}
			var leafs = [] ;
			Ext.Array.each( arrOrderIds, function(orderId) {
				leafs.push( Ext.apply({leaf:true, type: 'order'},map_orderId_orderRecord[orderId].getData()) ) ;
			}) ;
			
			var hatRow = map_hatId_hatRecord[hatId].getData(true) ;
			var treeMember = {} ;
			treeMember['hat_filerecord_id'] = hatRow['hat_filerecord_id'] ;
			treeMember['id_soc'] = hatRow['id_soc'] ;
			treeMember['id_hat'] = hatRow['id_hat'] ;
			treeMember['calc_step'] = hatRow['calc_step'] ;
			treeMember['parcels'] = hatRow['parcels'] ;
			treeMember['children'] = leafs ;
			treeMember['expanded'] = true ;
			treeMember['type'] = 'hat' ;
			treeMember['leaf'] = false ;
			treeMembers.push( treeMember ) ;
		}) ;
		Ext.Array.each( map_hatId_arrOrderIds[0], function(orderId) {
			treeMembers.push( Ext.apply({leaf:true, type: 'order'},map_orderId_orderRecord[orderId].getData()) ) ;
		}) ;
		
		return {
			root: true,
			expanded: true,
			children: treeMembers
		};
	},
	onLoadTrspt: function( trsptRecord ) {
		this._trsptNew = false ;
		this._trsptFilerecordId = trsptRecord.getId() ;
		this._trsptRecordCopy = trsptRecord ;
		
		//fHeader
		var headerFormValues = trsptRecord.getData() ;
		this.down('#pHeaderForm').getForm().reset() ;
		this.down('#pHeaderForm').getForm().findField('id_soc').setReadOnly(true) ;
		this.down('#pHeaderForm').getForm().findField('flow_code').setReadOnly(true) ;
		this.down('#pHeaderForm').getForm().findField('atr_type').setReadOnly(true) ;
		this.down('#pHeaderForm').getForm().findField('id_doc').setReadOnly(true) ;
		//this.down('#pHeaderForm').down('#customs_date_request_btn').setVisible( !Ext.isEmpty(headerFormValues.customs_date_request) ) ;
		Ext.apply(headerFormValues, {
			customs_date_request_ro: Ext.util.Format.date(headerFormValues.customs_date_request, 'd/m/Y H:i'),
			customs_date_cleared_ro: Ext.util.Format.date(headerFormValues.customs_date_cleared, 'd/m/Y H:i')
		}) ;
		this.down('#pHeaderForm').getForm().setValues(headerFormValues) ;
		
		if( this._readonlyMode ) {
			this.down('#pHeaderForm').getForm().getFields().each( function(field) {
				if( field.setReadOnly ) {
					field.setReadOnly(true) ;
				}
			});
		}
		
		
		//console.dir( trsptRecord.get('sword_edi_1_sent') ) ;
		Ext.Array.each( this.down('#pHeaderForm').down('#fsCustoms').query('field'), function(field) {
			if( field.setReadOnly ) {
				// TODO : set Readonly
				//field.setReadOnly(true) ;
			}
		}) ;
		
		
		
		//fHeader compute EDI status Sword 1
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
		this.down('#pHeaderForm').down('#fsSword1').down('#txtDisplay').setValue(ediStatus) ;
		this.down('#pHeaderForm').down('#fsSword1').down('#cntReset').setVisible(askReset) ;
		
		//fHeader compute EDI status Sword 3
		var ediStatus = '-',
			askReset = false ;
		if( trsptRecord.get('sword_edi_3_sent') ) {
			ediStatus = '<font color="green"><b>Sent</b></font>' ;
			askReset = true ;
		} else if( trsptRecord.get('sword_edi_3_ready') ) {
			ediStatus = '<font color="#FFCD75"><b>Ready</b></font>' ;
		}
		this.down('#pHeaderForm').down('#fsSword3').down('#txtDisplay').setValue(ediStatus) ;
		this.down('#pHeaderForm').down('#fsSword3').down('#cntReset').setVisible(askReset) ;
		
		//gSteps
		this.down('#pOrdersGrid').getEl().unmask() ;
		//this.down('#pOrdersGrid').getStore().loadRawData(trsptRecord.orders().getRange()) ;
		var rootNode = this.doBuildRootNode( trsptRecord.hats().getRange(), trsptRecord.orders().getRange() ) ;
		this.down('#pOrdersGrid').setRootNode(rootNode) ;
		
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
	
	handleSaveHeader: function(validateStepCode, additionalData=null, callbackCfg=null) {
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
		if(additionalData) {
			Ext.apply(recordData,additionalData) ;
		}
		
		var gridOrders = this.down('#pOrdersGrid'),
			orderFilerecordIds = [] ;
		gridOrders.getRootNode().cascadeBy( function(orderRecord) {
			if( orderRecord.get('order_filerecord_id') > 0 ) {
				orderFilerecordIds.push(orderRecord.get('order_filerecord_id')) ;
			}
		}) ;
		
		if( !callbackCfg ) {
			this.showLoadmask() ;
		}
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
						var error ;
						if( Ext.isArray(ajaxResponse.error) ) {
							var error = '* Errors / missing data :'+'<br>'+ajaxResponse.error.join("<br>") ;
						} else {
							var error = ajaxResponse.error || 'File not saved !' ;
						}
						Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				this.onSaveHeader(ajaxResponse.id, (!Ext.isEmpty(validateStepCode)||!Ext.isEmpty(additionalData)||callbackCfg)) ;
				if( callbackCfg && callbackCfg.fn ) {
					Ext.callback( callbackCfg.fn, callbackCfg.scope||this ) ;
				}
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
	
	onChangeCarrier: function() {
		var formPanel = this.down('#pHeaderForm'),
			form = formPanel.getForm() ;
		
		var carrierCode = form.findField('mvt_carrier').getValue() ;
		
		var carrierProdField = form.findField('mvt_carrier_prod'),
			carrierProdFieldStore = carrierProdField.getStore(),
			carrierProdFieldStoreData = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsTracy.HelperCache.getListData('LIST_CARRIERPROD'), function(prodRow) {
			if( prodRow.node != carrierCode ) {
				return ;
			}
			carrierProdFieldStoreData.push({
				code: prodRow.id,
				txt: prodRow.text
			});
		});
		carrierProdField.setVisible(carrierProdFieldStoreData.length>0) ;
		carrierProdFieldStore.loadData(carrierProdFieldStoreData) ;
	},
	
	handleEdiReset: function(swordEdiId) {
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
				trspt_filerecord_id: this._trsptFilerecordId,
				sword_edi_id: swordEdiId
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
		
		var errors ;
		if( (errors=Optima5.Modules.Spec.DbsTracy.HelperCache.checkOrderData(validationRecord.getData())) != null ) {
			Ext.MessageBox.alert('Incomplete','DN incomplete. Check order details<br>'+Ext.Object.getValues(errors).join('<br>')) ;
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
	},
	
	handleDoLabel: function() {
		// save + TMS
		// then open
		if( this._labelMessageBox ) {
			this._labelMessageBox.close() ;
			this._labelMessageBox = null ;
		}
		this._labelMessageBox = Ext.Msg.wait('Label generation. Please Wait.')
		this.handleSaveHeader(null,null,{
			fn: function() {
				this.doFetchLabel() ;
			},
			scope: this
		}) 
	},
	doFetchLabel: function() {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'trspt_createLabelTMS',
				trspt_filerecord_id: this._trsptFilerecordId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success ) {
					this.openLabelPanel(ajaxResponse.trsptevent_filerecord_id) ;
				} else {
					if( this._labelMessageBox ) {
						this._labelMessageBox.close() ;
						this._labelMessageBox = null ;
					}
					var strErr = Ext.util.Format.nl2br(ajaxResponse.error) ;
					Ext.defer(function(){Ext.MessageBox.alert('Error',strErr);},100) ;
				}
			},
			callback: function() {
				if( this._labelMessageBox ) {
					this._labelMessageBox.close() ;
					this._labelMessageBox = null ;
				}
				this.doReload() ;
			},
			scope: this
		}) ;
	},
	openLabelPanel: function(trspteventFilerecordId) {
		this.getEl().mask() ;
		// Open panel
		var createPanel = Ext.create('Optima5.Modules.Spec.DbsTracy.TrsptLabelPanel',{
			width:100, // dummy initial size, for border layout to work
			height:100, // ...
			floating: true,
			draggable: false,
			resizable: false,
			constrain: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				},
				scope: this
			}],
			applySizeFromParent: function(p) {
				this.setWidth( p.getWidth() * 0.9 ) ;
				this.setHeight( p.getHeight() * 0.9 ) ;
				this.getEl().alignTo(p.getEl(), 'c-c?');
			}
		});
		createPanel.on('destroy',function(p) {
			this.getEl().unmask() ;
		},this,{single:true}) ;
		
		createPanel.mon(this,'resize',function(p) {
			console.dir(p) ;
			console.dir(this) ;
			console.log('on parent resize') ;
			this.applySizeFromParent( p ) ;
		},createPanel) ;
		
		createPanel.show();
		createPanel.applySizeFromParent(this) ;
		
		createPanel.loadFromTrsptEvent( this._trsptFilerecordId, trspteventFilerecordId ) ;
	}
});
