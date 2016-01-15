Ext.define('DbsLamLiveTreeModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'nodeKey', type:'string'},
		{name: 'nodeText', type:'string'}
	]
});

Ext.define('DbsLamProdComboboxModel',{
	extend: 'Ext.data.Model',
	idProperty: 'prod_id',
	fields: [
		{name: 'prod_id', type:'string'},
		{name: 'prod_txt', type:'string'},
		{
			name: 'txt',
			type: 'string',
			convert: function(v, record) {
				return record.data.prod_id + ' / ' + record.data.prod_txt ;
			}
		}
	]
});

Ext.define('DbsLamMovementModel',{
	extend: 'Ext.data.Model',
	idProperty: 'mvt_id',
	fields: [
		{name: 'mvt_id', type:'int'},
		{name: 'mvt_date', type:'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'adr_id', type:'string'},
		{name: 'prod_id', type:'string'},
		{name: 'batch', type:'string'},
		{name: 'mvt_qty', type:'number'}
	]
});


Ext.define('Optima5.Modules.Spec.DbsLam.LivePanel',{
	extend:'Ext.panel.Panel',
	
	requires: ['Optima5.Modules.Spec.DbsLam.CfgParamField'],
	
	transferRecord: null,
	transferLigRecord_arr: null,
	
	initCloseFieldsetCfg: function() {
		var headerCfg = {
			itemId: 'pHeader',
			xtype:'component',
			cls: 'op5-spec-dbslam-closeheader',
			html: [
				'<div class="op5-spec-dbslam-closeheader-wrap" style="position:relative">',
					'<div class="op5-spec-dbslam-closeheader-btn">',
					'</div>',
				'</div>'
			]
		} ;
		
		return headerCfg ;
	},
	
	initComponent: function() {
		var atrFields = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getStockAttributes(), function( stockAttribute ) {
			var atrField = {
				xtype:'op5crmbasebibletreepicker',
				selectMode: 'single',
				optimaModule: this.optimaModule,
				bibleId: stockAttribute.bible_code,
				fieldLabel: stockAttribute.atr_txt,
				name: stockAttribute.mkey,
				readOnly: !(stockAttribute.cfg_is_editable)
			} ;
			atrFields.push(atrField) ;
		}, this) ;
		
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items:[{
				border: false,
				flex:1,
				xtype: 'form',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 15,
				layout:'anchor',
				tbar:[{
					icon: 'images/op5img/ico_back_16.gif',
					text: '<u>Back</u>',
					handler: function(){
						this.doQuit() ;
					},
					scope: this
				}],
				items:[{
					height: 72,
					xtype: 'component',
					tpl: [
						'<div class="op5-spec-dbslam-livelogo">',
							'<span>{title}</span>',
							'<div class="op5-spec-dbslam-livelogo-left"></div>',
							'<div class="op5-spec-dbslam-livelogo-right"></div>',
						'</div>'
					],
					data: {title: '&#160;'}
				},{
					xtype:'fieldset',
					itemId: 'fsDocInput',
					title: 'Document selection',
					fieldDefaults: {
						labelWidth: 120,
						anchor: '100%'
					},
					items:[Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamField',{
						cfgParam_id: 'MVTFLOWSTEP',
						cfgParam_emptyDisplayText: 'Flow / Step',
						icon: 'images/op5img/ico_blocs_small.gif',
						fieldLabel: 'Transfer type / Step',
						optimaModule: this.optimaModule,
						name: 'input_statusCode'
					}),{
						xtype: 'textfield',
						allowBlank:false,
						fieldLabel: 'Doc Barcode',
						name: 'input_transferFilerecordId',
						enableKeyEvents: true,
						listeners: {
							keypress: function(field,e) {
								if( e.getKey() == e.ENTER ) {
									this.doOpenTransfer() ;
								}
							},
							scope: this
						}
					}]
				},{
					xtype:'fieldset',
					itemId: 'fsDocLigInput',
					title: 'Document selection',
					fieldDefaults: {
						labelWidth: 120,
						anchor: '100%'
					},
					layout: {
						type:'hbox',
						align: 'stretch'
					},
					items:[{
						flex:1,
						xtype: 'fieldcontainer',
						width: 400,
						layout: 'anchor',
						cls: 'op5-spec-dbslam-fieldset',
						items:[Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamField',{
							cfgParam_id: 'MVTFLOWSTEP',
							cfgParam_emptyDisplayText: 'Flow / Step',
							icon: 'images/op5img/ico_blocs_small.gif',
							fieldLabel: 'Transfer type / Step',
							optimaModule: this.optimaModule,
							name: 'display_statusCode',
							readOnly: true
						}),{
							xtype: 'displayfield',
							name: 'display_transferTxt',
							fieldLabel: 'Doc Barcode'
						},{
							xtype: 'textfield',
							allowBlank:false,
							fieldLabel: 'Item Barcode',
							name: 'input_transferLigFilerecordId',
							enableKeyEvents: true,
							listeners: {
								keypress: function(field,e) {
									if( e.getKey() == e.ENTER ) {
										this.doOpenTransferLig() ;
									}
								},
								scope: this
							}
						}]
					},Ext.apply(this.initCloseFieldsetCfg(),{
						listeners: {
							afterrender: function(cmp) {
								var headerEl = cmp.getEl(),
									btnCloseEl = headerEl.down('.op5-spec-dbslam-closeheader-btn') ;
								btnCloseEl.on('click',function() {
									this.resetForm() ;
								},this) ;
							},
							scope: this
						}
					})]
				},{
					xtype: 'container',
					itemId: 'cntSkuInput',
					layout: {
						type: 'hbox',
						align: 'stretch'
					},
					items: [{
						flex: 1,
						xtype:'fieldset',
						itemId: 'fsLeftBlank',
						title: '',
						fieldDefaults: {
							labelWidth: 40,
							anchor: '100%'
						}
					},{
						flex: 1,
						xtype:'fieldset',
						itemId: 'fsLeftSku',
						title: 'SKU Data',
						fieldDefaults: {
							labelWidth: 40,
							anchor: '100%'
						},
						items:[{
							xtype: 'combobox',
							fieldLabel: 'P/N',
							name: 'stk_prod',
							forceSelection:false,
							allowBlank:true,
							editable:true,
							typeAhead:false,
							selectOnFocus: true,
							selectOnTab: false,
							queryMode: 'remote',
							displayField: 'prod_id',
							valueField: 'prod_id',
							queryParam: 'filter',
							minChars: 2,
							fieldStyle: 'text-transform:uppercase',
							store: {
								model: 'DbsLamProdComboboxModel',
								proxy: this.optimaModule.getConfiguredAjaxProxy({
									extraParams : {
										_moduleId: 'spec_dbs_lam',
										_action: 'prods_getGrid',
										limit: 20
									},
									reader: {
										type: 'json',
										rootProperty: 'data'
									}
								})
							}
						},{
							xtype: 'textfield',
							allowBlank:true,
							fieldLabel: 'Batch',
							name: 'stk_batch'
						},{
							xtype: 'numberfield',
							allowBlank:true,
							fieldLabel: 'QTE',
							name: 'mvt_qty',
							anchor: '',
							width: 120
						},{
							xtype: 'textfield',
							allowBlank:true,
							fieldLabel: 'S/N',
							name: 'stk_sn'
						}]
					},{
						width: 24,
						xtype: 'box'
					},{
						flex: 1,
						xtype:'fieldset',
						itemId: 'fsLeftBlank',
						title: '',
						fieldDefaults: {
							labelWidth: 40,
							anchor: '100%'
						}
					},{
						flex: 1,
						xtype:'fieldset',
						itemId: 'fsRightLocation',
						hidden: false,
						title: 'Dest location',
						fieldDefaults: {
							labelWidth: 50,
							anchor: '100%'
						},
						items: [{
							labelWidth: 60,
							xtype: 'textfield',
							allowBlank:false,
							fieldLabel: 'Location',
							name: 'dest_adr'
						}]
					},{
						flex: 1,
						xtype:'fieldset',
						itemId: 'fsRightChecklist',
						hidden: false,
						title: 'Checklist',
						fieldDefaults: {
							labelWidth: 50,
							anchor: '100%'
						},
						items: []
					},{
						flex: 1,
						xtype:'fieldset',
						itemId: 'fsRightAttributes',
						hidden: false,
						title: 'Attributes',
						fieldDefaults: {
							labelWidth: 50,
							anchor: '100%'
						},
						items: []
					}]
				},{
					anchor: '100%',
					xtype: 'container',
					itemId: 'cntOpen',
					layout: 'hbox',
					defaults: {
						iconAlign: 'top',
						width: 90,
						padding: 10
					},
					items:[{
						xtype:'button',
						text: '<b>Open</b>',
						icon: 'images/op5img/ico_new_16.gif',
						listeners: {
							click: function() {
								this.handleOpen() ;
							},
							scope: this
						}
					}]
				},{
					anchor: '100%',
					xtype: 'container',
					itemId: 'cntBefore',
					layout: 'hbox',
					defaults: {
						iconAlign: 'top',
						width: 90,
						padding: 10
					},
					items:[{
						xtype:'button',
						text: '<b>Submit</b>',
						icon: 'images/op5img/ico_ok_16.gif',
						listeners: {
							click: function() {
								this.handleSubmit() ;
							},
							scope: this
						}
					},{
						xtype:'box',
						width: 16
					},{
						xtype:'button',
						text: 'Reset',
						icon: 'images/op5img/ico_cancel_small.gif',
						listeners: {
							click: function() {
								this.resetForm() ;
							},
							scope: this
						}
					}]
				},{
					margin: '20 0 10 0',
					xtype:'fieldset',
					itemId: 'fsResult',
					title: 'Résultat Adressage',
					items:[{
						padding: 10,
						xtype: 'component',
						itemId: 'fsResultCmp',
						tpl: [
							'<div class="op5-spec-dbslam-liveadr">',
								'<tpl if="adr">',
								'<div class="op5-spec-dbslam-liveadr-adr">Adr&#160;:&#160;<span class="op5-spec-dbslam-liveadr-adrtxt">{adr}</span></div>',
								'</tpl>',
								'<tpl if="caption">',
								'<div class="op5-spec-dbslam-liveadr-caption">',
									'<span class="op5-spec-dbslam-liveadr-captiontxt {[this.getCaptionStyle(values)]}">{caption}</span>',
								'</div>',
								'</tpl>',
							'</div>',
							{
								getCaptionStyle: function(values) {
									if( values.caption_warning == true ) {
										return "op5-spec-dbslam-liveadr-captionwarning" ;
									}
									return "" ;
								}
							}
						]
					}]
				},{
					hidden: true,
					anchor: '100%',
					xtype: 'container',
					layout: 'hbox',
					defaults: {
						iconAlign: 'top',
						width: 120,
						padding: 10
					},
					items:[{
						xtype:'button',
						text: 'Impression',
						icon: 'images/op5img/ico_print_16.png'
					}]
				}]
				
			},{
				xtype: 'panel',
				itemId: 'pTree',
				border: false,
				frame: true,
				flex: 1,
				layout: {
					type: 'fit'
				}
			}]
		});
		this.callParent();
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		this.resetForm() ;
	},
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'datachange' :
				break ;
			default: break ;
		}
	},
	
	resetForm: function() {
		this.transferRecord = null ;
		this.transferLigRecord_arr = null ;
		
		var formPanel = this.down('form'),
			 form = this.down('form').getForm(),
			formValues = form.getValues(false,false,false,true),
			input_statusCode = null ;
		if( formValues.input_statusCode ) {
			input_statusCode = formValues.input_statusCode ;
		}
		form.reset() ;
		if( input_statusCode ) {
			form.setValues({input_statusCode: input_statusCode}) ;
		}
		
		formPanel.down('#fsDocInput').setVisible(true);
		formPanel.down('#fsDocLigInput').setVisible(false);
		formPanel.down('#cntSkuInput').setVisible(false) ;
		formPanel.down('#cntOpen').setVisible(true) ;
		formPanel.down('#cntBefore').setVisible(false) ;
		formPanel.down('#fsResult').setVisible(false) ;
			  
		form.findField('input_transferFilerecordId').focus(false,100) ;
	},
	
	handleOpen: function() {
		if( this.transferRecord ) {
			this.doOpenTransferLig() ;
		} else {
			this.doOpenTransfer() ;
		}
	},
	
	doOpenTransfer: function() {
		var form = this.down('form').getForm(),
			formValues = form.getValues(false,false,false,true) ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transfer_getTransfer',
				filter_transferFilerecordId: formValues.input_transferFilerecordId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false || ajaxResponse.data.length != 1 ) {
					Ext.MessageBox.alert('Error','Error', function() {
						this.resetForm() ;
					},this) ;
					return ;
				}
				var ajaxDataRow = ajaxResponse.data[0] ;
				this.transferRecord = Ext.ux.dams.ModelManager.create('DbsLamTransferOneModel',ajaxDataRow) ;
				this.onOpenTransfer() ;
			},
			scope: this
		}) ;
	},
	onOpenTransfer: function() {
		var formPanel = this.down('form'),
			 form = this.down('form').getForm(),
			formValues = form.getValues(false,false,false,true) ;
		
		// check status
		var docStatus = this.transferRecord.get('step_code') ;
		if( docStatus != formValues.input_statusCode ) {
			Ext.MessageBox.alert('Error','Specified step not applicable for Doc', function() {
				this.resetForm() ;
			},this) ;
			return ;
		}
		
		
		// buildTree
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action: 'data_getBibleTreeOne',
				bible_code: 'ADR'
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					return ;
				}
				var dataRoot = ajaxResponse.dataRoot ;
				this.onLoadTree(dataRoot) ;
			},
			scope: this
		}) ;
		
		// layout Form
		formPanel.down('#fsDocInput').setVisible(false);
		formPanel.down('#fsDocLigInput').setVisible(true);
		formPanel.down('#cntSkuInput').setVisible(false) ;
		formPanel.down('#cntOpen').setVisible(true) ;
		formPanel.down('#cntBefore').setVisible(false) ;
		formPanel.down('#fsResult').setVisible(false) ;
		
		form.setValues({
			display_statusCode: formValues.input_statusCode,
			display_transferTxt: '<b>'+this.transferRecord.get('transfer_txt')+'</b>',
			input_transferLigFilerecordId: ''
		}) ;
		form.findField('input_transferLigFilerecordId').setReadOnly(false) ;
		form.findField('input_transferLigFilerecordId').focus(false,100) ;
	},
	onLoadTree: function( dataRoot ) {
		var form = this.down('form').getForm(),
			formValues = form.getValues(false,false,false,true) ;
			  
			  
		var treeStore = Ext.create('Ext.data.TreeStore',{
			model: 'DbsLamLiveTreeModel',
			data: dataRoot,
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
		}) ;
		
		var rootNode = treeStore.getRoot() ;
		rootNode.cascadeBy(function(node) {
			node.set('leaf',false) ;
			node.set('checked',null) ;
		}) ;
		
		this.transferRecord.ligs().each( function(transferLigRecord) {
			var adrEntry, adrTreenode, adrIsGrouped ;
			transferLigRecord.steps().each( function(transferLigStepRecord) {
				if( transferLigStepRecord.get('step_code') != formValues.input_statusCode ) {
					return ;
				}
				
				if( transferLigStepRecord.get('status_is_ok') ) {
					adrEntry = transferLigStepRecord.get('dest_adr_entry') ;
					adrTreenode = transferLigStepRecord.get('dest_adr_treenode') ;
					adrIsGrouped = transferLigStepRecord.get('dest_adr_is_grouped') ;
				} else {
					adrEntry = transferLigStepRecord.get('src_adr_entry') ;
					adrTreenode = transferLigStepRecord.get('src_adr_treenode') ;
					adrIsGrouped = transferLigStepRecord.get('src_adr_is_grouped') ;
				}
				
				var skuModel = {
					leaf: true,
					isSku: true,
					nodeKey: transferLigRecord.get('transferlig_filerecord_id'),
					nodeText: '<b>'+transferLigRecord.get('stk_prod')+'</b>'+' / Qty:'+transferLigRecord.get('mvt_qty')
				}
				
				if( transferLigRecord.get('status_is_reject') ) {
					skuModel['icon'] = 'images/op5img/ico_cancel_small.gif' ;
				}else if( transferLigStepRecord.get('status_is_ok') ) {
					skuModel['icon'] = 'images/op5img/ico_ok_16.gif' ;
				} else {
					skuModel['icon'] = 'images/op5img/ico_wait_small.gif' ;
				}
				
				
				// Render it !
				if( adrIsGrouped ) {
					// attach to treenode
					var treenodeNode = rootNode.findChild('nodeKey',adrTreenode,true) ;
					treenodeNode.expand();
					treenodeNode.appendChild(skuModel) ;
				} else {
					var adrNode = rootNode.findChild('nodeKey',adrEntry,true) ;
					if( !adrNode ) {
						var treenodeNode = rootNode.findChild('nodeKey',adrTreenode,true) ;
						treenodeNode.expand() ;
						adrNode = treenodeNode.appendChild({
							expanded: true,
							nodeKey: adrEntry,
							nodeText: adrEntry
						}) ;
					}
					adrNode.appendChild(skuModel) ;
				}
				return false ;
			});
		});
		
		while(true) {
			var nodesToRemove = [] ;
			treeStore.getRoot().cascadeBy(function(node) {
				if( !node.isLeaf() && !node.hasChildNodes() ) {
					nodesToRemove.push(node) ;
					return false ;
				}
			}) ;
			if( nodesToRemove.length == 0 ) {
				break ;
			}
			Ext.Array.each(nodesToRemove, function(node) {
				node.remove();
			});
		}
		
		
		this.down('#pTree').removeAll() ;
		this.down('#pTree').add({
			xtype: 'treepanel',
			bufferedRenderer: false,
			store: treeStore ,
			displayField: 'nodeText',
			rootVisible: false,
			useArrows: true
		});
	},
	
	doOpenTransferLig: function() {
		var form = this.down('form').getForm(),
			formValues = form.getValues(false,false,false,true) ;
		
		var treePanel = this.down('#pTree').down('treepanel'),
			treeStore = treePanel.getStore(),
			treeRoot = treeStore.getRoot() ;
		var foundNode = treeRoot.findChild('nodeKey',formValues.input_transferLigFilerecordId,true) ;
		var transferLigFilerecordId_arr = [] ;
		if( !foundNode ) {
			Ext.MessageBox.alert('Error','Specified SKU not found in doc', function() {
				this.onOpenTransfer() ;
			},this) ;
			return ;
		}
		foundNode.cascadeBy( function(node) {
			if( node.get('isSku') ) {
				transferLigFilerecordId_arr.push(node.get('nodeKey')) ;
			}
		}) ;
		if( transferLigFilerecordId_arr.length == 0 ) {
			Ext.MessageBox.alert('Error','Specified SKU not found in doc', function() {
				this.onOpenTransfer() ;
			},this) ;
			return ;
		}
		
		this.transferLigRecord_arr = [] ;
		this.transferRecord.ligs().each( function(transferLigRecord) {
			if( Ext.Array.contains( transferLigFilerecordId_arr, transferLigRecord.get('transferlig_filerecord_id').toString() ) ) {
				this.transferLigRecord_arr.push( transferLigRecord ) ;
			}
		},this) ;
		this.onOpenTransferLig() ;
	},
	onOpenTransferLig: function() {
		var formPanel = this.down('form'),
			form = this.down('form').getForm(),
			formValues = form.getValues(false,false,false,true) ;
		form.findField('input_transferLigFilerecordId').setReadOnly(true) ;
			  
		formPanel.down('#fsRightChecklist').setVisible(false) ;
		formPanel.down('#fsRightAttributes').setVisible(false) ;
		formPanel.down('#fsRightLocation').setVisible(false) ;
			  
		if( this.transferLigRecord_arr.length == 1 ) {
			var transferLigRecord = this.transferLigRecord_arr[0] ;
			formPanel.down('#fsLeftSku').setVisible(true) ;
			  formPanel.down('#fsLeftBlank').setVisible(false) ;
			Ext.Array.each( formPanel.down('#fsLeftSku').query('field'), function(field) {
				field.setReadOnly(true) ;
			}) ;
			
			// *** Set form fields ****
			form.setValues({
				stk_prod: transferLigRecord.get('stk_prod'),
				stk_batch: transferLigRecord.get('stk_batch'),
				mvt_qty: transferLigRecord.get('mvt_qty'),
				stk_sn: transferLigRecord.get('stk_sn')
			});
			
			// *** Load prod ***
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_moduleId: 'spec_dbs_lam',
					_action: 'prods_getGrid',
					entry_key: transferLigRecord.get('stk_prod')
				},
				success: function(response) {
					var jsonResponse = Ext.JSON.decode(response.responseText) ;
					if( jsonResponse.success ) {
						this.onLoadProd(jsonResponse.data) ;
					}
				},
				scope: this
			});
		} else {
			formPanel.down('#fsLeftSku').setVisible(false) ;
			formPanel.down('#fsLeftBlank').setVisible(true) ;
		}
		
		// Checklist
		var fsRightChecklist = formPanel.down('#fsRightChecklist'),
			doChecks = false,
			docFlow = this.transferRecord.get('flow_code'),
			flowRecord = Optima5.Modules.Spec.DbsLam.HelperCache.getMvtflow(docFlow) ;
		Ext.Array.each( flowRecord.steps, function(step) {
			if( step.step_code == this.transferRecord.get('step_code') && step.is_checklist ) {
				doChecks = true ;
			}
		},this) ;
		fsRightChecklist.removeAll() ;
		if( doChecks ) {
			Ext.Array.each( flowRecord.checks, function(check) {
				fsRightChecklist.add({
					xtype: 'checkboxfield',
					name: 'CHECK_'+check.check_code,
					boxLabel: check.check_txt,
					checked: true
				});
			});
			fsRightChecklist.setVisible(true) ;
		} else {
			this.onAfterChecks() ;
		}
		
		formPanel.down('#cntSkuInput').setVisible(true) ;
			  
		formPanel.down('#cntOpen').setVisible(false) ;
		formPanel.down('#cntBefore').setVisible(true) ;
		formPanel.down('#fsResult').setVisible(false) ;
	},
	onLoadProd: function(ajaxData) {
		var formPanel = this.down('form'),
			form = this.down('form').getForm(),
			fsAttributes = formPanel.down('#fsRightAttributes') ;
			
		var prodData = ajaxData[0] ;
		
		fsAttributes.removeAll() ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getAttributeAll(), function( attribute ) {
			if( !attribute.PROD_fieldcode ) {
				return ;
			}
			var fieldDefinition = {
				xtype:'op5crmbasebibletreepicker',
				selectMode: 'single',
				optimaModule: this.optimaModule,
				bibleId: attribute.bible_code,
				fieldLabel: attribute.atr_txt,
				name: attribute.mkey,
				readOnly: !(attribute.cfg_is_editable) && !Ext.isEmpty(prodData[attribute.mkey]),
				value: prodData[attribute.mkey]
			} ;
			fsAttributes.add(fieldDefinition);
		},this) ;
	},
	
	handleSubmit: function() {
		var formPanel = this.down('form'),
			form = this.down('form').getForm(),
			fsAttributes = formPanel.down('#fsRightAttributes') ;
		if( formPanel.down('#fsRightChecklist').isVisible() ) {
			this.doProcessChecks() ;
		} else {
			this.doProcessAdr() ;
		}
	},
	doProcessChecks: function() {
		var formPanel = this.down('form'),
			form = this.down('form').getForm() ;
		
		// Checklist
		var fsRightChecklist = formPanel.down('#fsRightChecklist'),
			docFlow = this.transferRecord.get('flow_code'),
			flowRecord = Optima5.Modules.Spec.DbsLam.HelperCache.getMvtflow(docFlow) ;
		
		var failedChecks = [] ;
		Ext.Array.each( flowRecord.checks, function(check) {
			var checkField = form.findField('CHECK_'+check.check_code) ;
			if( !checkField.getValue() ) {
				failedChecks.push( check.check_code ) ;
			}
		});
		if( failedChecks.length == 0 ) {
			this.onAfterChecks() ;
			return ;
		}
		
		var transferLigFilerecordId_arr = [] ;
		Ext.Array.each( this.transferLigRecord_arr, function(transferLigRecord) {
			transferLigFilerecordId_arr.push(transferLigRecord.get('transferlig_filerecord_id')) ;
		}) ;
		
		
		Ext.MessageBox.confirm('Confirmation',"Confirm reject ?", function(buttonStr) {
			if( buttonStr != 'yes' ) {
				return ;
			}
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_moduleId: 'spec_dbs_lam',
					_action: 'transfer_saveReject',
					transferFilerecordId: this.transferRecord.get('transfer_filerecord_id'),
					transferLigFilerecordId_arr: Ext.JSON.encode(transferLigFilerecordId_arr),
					transferStepCode: this.transferRecord.get('step_code'),
					rejectCheckCode_arr: Ext.JSON.encode(failedChecks)
				},
				success: function(response) {
					var jsonResponse = Ext.JSON.decode(response.responseText) ;
					if( jsonResponse.success ) {
						this.doOpenTransfer() ;
					}
				},
				scope: this
			});
		},this) ;
		
	},
	onAfterChecks: function() {
		var formPanel = this.down('form'),
			form = this.down('form').getForm() ;
		formPanel.down('#fsRightChecklist').setVisible(false) ;
		formPanel.down('#fsRightAttributes').setVisible(false) ;
		formPanel.down('#fsRightLocation').setVisible(false) ;
			  
		
		// Checklist
		var fsRightChecklist = formPanel.down('#fsRightChecklist'),
			docFlow = this.transferRecord.get('flow_code'),
			flowRecord = Optima5.Modules.Spec.DbsLam.HelperCache.getMvtflow(docFlow),
			stepRecord ;
		Ext.Array.each( flowRecord.steps, function(step) {
			if( step.step_code == this.transferRecord.get('step_code') ) {
				stepRecord = step ;
				return false ;
			}
		},this) ;
		
		if( stepRecord.is_attach_parent ) {
			formPanel.down('#fsRightLocation').setVisible(true) ;
		} else if( stepRecord.is_final ) {
			formPanel.down('#fsRightAttributes').setVisible(true) ;
		} else {
			formPanel.down('#fsRightBlank').setVisible(true) ;
		}
	},
	
	doProcessAdr: function() {
		var formPanel = this.down('form'),
			form = this.down('form').getForm(),
			formValues = form.getValues(false,false,false,true) ;
			  
		var transferLigFilerecordId_arr = [] ;
		Ext.Array.each( this.transferLigRecord_arr, function(transferLigRecord) {
			transferLigFilerecordId_arr.push(transferLigRecord.get('transferlig_filerecord_id')) ;
		}) ;
		  
		
		if( formPanel.down('#fsRightLocation').isVisible() ) {
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_moduleId: 'spec_dbs_lam',
					_action: 'transfer_commitAdrTmp',
					transferFilerecordId: this.transferRecord.get('transfer_filerecord_id'),
					transferLigFilerecordId_arr: Ext.JSON.encode(transferLigFilerecordId_arr),
					transferStepCode: this.transferRecord.get('step_code'),
					location: formValues.dest_adr
				},
				success: function(response) {
					var jsonResponse = Ext.JSON.decode(response.responseText) ;
					if( jsonResponse.success ) {
						this.doOpenTransfer() ;
					}
				},
				scope: this
			});
		}
	},
	
	doSubmit: function() {
		
	},
	
	submitRejection: function() {
		
	},
	
	submitAdr: function() {
		
	},
	submitAdrMan: function() {
		var form = this.down('form').getForm(),
			formValues = form.getValues() ;
		
		if( !form.isValid() ) {
			return ;
		}
		
	},
	submitAdrAuto: function() {
		
	},
	
	onLiveResponse: function( ajaxData ) {
		return ;
		var form = this.down('form').getForm(),
			fsSKU = this.down('#fsSKU'),
			fsAttributes = this.down('#fsAttributes'),
			fsDummy = this.down('#fsDummy'),
			cntBefore = this.down('#cntBefore'),
			cntAfter = this.down('#cntAfter'),
			fsResult = this.down('#fsResult'),
			fsResultCmp = fsResult.down('#fsResultCmp') ;
		
		if( ajaxData == null ) {
			// reset FORM
			this.onSelectProd(null) ;
			form.reset() ;
			Ext.Array.each( fsSKU.query('field'),function(field) {
				field.setReadOnly(false) ;
			}) ;
			cntBefore.setVisible(true) ;
			cntAfter.setVisible(false) ;
			fsResult.setVisible(false) ;
			fsResultCmp.update(null) ;
			return ;
		}
		
		// Set MVT_OBJ to readonly
		Ext.Array.each( fsSKU.query('field'),function(field) {
			if( !ajaxData.mvt_obj.hasOwnProperty(field.name) ) {
				return ;
			}
			field.setReadOnly(true) ;
			field.setValue( ajaxData.mvt_obj[field.name] ) ;
		}) ;
		
		if( ajaxData.status == 'PROD_TOSET' ) {
			Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getStockAttributes(), function( stockAttribute ) {
				var atrField = form.findField(stockAttribute.mkey) ;
				if( atrField == null ) {
					return ;
				}
				atrField.setReadOnly( false ) ;
				atrField.reset() ;
				atrField.setValue( null ) ;
			}, this) ;
			
			fsAttributes.setVisible(true) ;
			fsDummy.setVisible(false) ;
			
			fsResultCmp.update({
				caption: 'Article non renseigné. Précisez les attributs',
				caption_warning: true
			}) ;
			fsResult.setVisible(true) ;
			
			return ;
		}
		
		if( ajaxData.stockAttributes_obj ) {
			var prodRecord = {
				prod_id: ajaxData.mvt_obj['prod_id']
			} ;
			Ext.apply(prodRecord,ajaxData.stockAttributes_obj) ;
			var prodRecords = [prodRecord] ;
		}
		this.onSelectProd( ajaxData.mvt_obj['prod_id'], prodRecords ) ;
		
		cntBefore.setVisible(false) ;
		cntAfter.setVisible(true) ;
		
		switch( ajaxData.status ) {
			case 'RELOAD' :
				fsResultCmp.update({
					adr: ajaxData.adr_id
				});
				break ;
				
			case 'OK_ADD' :
				this.optimaModule.postCrmEvent('datachange') ;
				fsResultCmp.update({
					adr: ajaxData.adr_id,
					caption: 'Ajout sur emplacement existant (P/N + Batch)'
				});
				break ;
				
			case 'OK_NEW' :
				this.optimaModule.postCrmEvent('datachange') ;
				fsResultCmp.update({
					adr: ajaxData.adr_id,
					caption: 'Nouvel emplacement'
				});
				break ;
			
			default: break ;
		}
		fsResult.setVisible(true) ;
	},
	
	handleAfterAdrAction: function( btnId ) {
		switch( btnId ) {
			case 'btnNext' :
				this.onLiveResponse(null) ;
				break ;
			case 'btnRelocate' :
				var form = this.down('form').getForm(),
					formValues = form.getValues(),
					currentMvtId = formValues['mvt_id'] ;
				if( Ext.isEmpty(currentMvtId) || !(currentMvtId > 0) ) {
					Ext.Msg.alert('Error','MVT_ID non trouvé') ;
					return ;
				}
				this.openRelocatePopup() ;
				break ;
			case 'btnDelete' :
				this.handleAfterAdrActionDelete() ;
				break ;
		}
	},
	handleAfterAdrActionDelete: function() {
		var form = this.down('form').getForm(),
			mvtId = form.findField('mvt_id').getValue() ;
		Ext.Msg.confirm('Delete','Supprimer mouvement ?', function(btn) {
			if( btn == 'yes') {
				this.deleteMvt( mvtId ) ;
			}
		},this) ;
	},
	
	
	doQuit: function() {
		this.destroy() ;
	}
});