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
						itemId: 'fsSKU',
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
							allowBlank:false,
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
							allowBlank:false,
							fieldLabel: 'Batch',
							name: 'stk_batch'
						},{
							xtype: 'numberfield',
							allowBlank:false,
							fieldLabel: 'QTE',
							name: 'mvt_qty',
							anchor: '',
							width: 120
						}]
					},{
						width: 24,
						xtype: 'box'
					},{
						flex: 1,
						xtype:'fieldset',
						itemId: 'fsDest',
						hidden: false,
						title: 'Dest location',
						fieldDefaults: {
							labelWidth: 50,
							anchor: '100%'
						},
						items: [{
							xtype: 'textfield',
							allowBlank:false,
							fieldLabel: 'Batch',
							name: 'dest_adr'
						}]
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
								this.submitAdr() ;
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
						text: '<b>Adresse</b>',
						icon: 'images/op5img/ico_blocs_small.gif',
						listeners: {
							click: function() {
								this.submitAdr() ;
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
								this.onLiveResponse(null) ;
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
		console.log('doOpenTransfer') ;
		console.dir(formValues) ;
		
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
		var form = this.down('form').getForm(),
			formValues = form.getValues(false,false,false,true) ;
		
		
			  
		console.log('onOpenTransfer') ;
		console.dir(this.transferRecord) ;
		console.dir(this.transferRecord.ligs().getRange()) ;
		
		// checkstatus
		var statuses = [], ligStatus ;
		this.transferRecord.ligs().each( function(transferLigRecord) {
			ligStatus = null ;
			transferLigRecord.steps().each( function(transferLigStepRecord) {
				if( !transferLigStepRecord.get('status_is_ok') ) {
					ligStatus = transferLigStepRecord.get('step_code') ;
					return false ;
				}
			});
			if( ligStatus && !Ext.Array.contains(statuses,ligStatus) ) {
				statuses.push( ligStatus ) ;
			}
		});
		var docStatus = Ext.Array.min(statuses) ;
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
		
		// 
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
		console.dir(rootNode) ;
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
				
				
				// Render it !
				if( adrIsGrouped ) {
					// attach to treenode
					
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
					adrNode.appendChild({
						leaf: true,
						isSku: true,
						nodeKey: transferLigRecord.get('filerecord_id'),
						nodeText: '<b>'+transferLigRecord.get('stk_prod')+'</b>'+' / Qty:'+transferLigRecord.get('mvt_qty')
					}) ;
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