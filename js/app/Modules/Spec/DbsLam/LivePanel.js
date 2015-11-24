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
					xtype: 'container',
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
							xtype: 'hidden',
							name: 'mvt_id'
						},{
							xtype: 'hidden',
							name: 'prod_set'
						},{
							xtype: 'combobox',
							fieldLabel: 'P/N',
							name: 'prod_id',
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
							},
							listeners: {
								change: function() {
									this.onSelectProd(null) ;
								},
								select: function(cmb) {
									this.onSelectProd(cmb.getValue()) ;
								},
								blur: function(cmb) {
									if( this.getCurrentProd() == null && !Ext.isEmpty(cmb.getValue()) ) {
										this.onSelectProd(cmb.getValue()) ;
									}
								},
								scope: this
							}
						},{
							xtype: 'textfield',
							allowBlank:false,
							fieldLabel: 'Batch',
							name: 'batch',
							listeners: {
								change: function(cmb) {
									this.onChangeBatch(cmb.getValue()) ;
								},
								scope: this
							}
						},{
							xtype: 'numberfield',
							allowBlank:false,
							fieldLabel: 'QTE',
							name: 'mvt_qty',
							anchor: '',
							width: 120
						}]
					},{
						width: '8',
						xtype: 'box'
					},{
						flex: 1,
						xtype:'fieldset',
						itemId: 'fsAttributes',
						hidden: true,
						title: 'Attributs adresse',
						fieldDefaults: {
							labelWidth: 50,
							anchor: '100%'
						},
						items: atrFields
					},{
						flex: 1,
						xtype:'box',
						itemId: 'fsDummy',
						hidden: true
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
						text: '<b>Adresse!</b>',
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
					anchor: '100%',
					xtype: 'container',
					itemId: 'cntAfter',
					layout: 'hbox',
					defaults: {
						iconAlign: 'top',
						width: 90,
						padding: 10,
						listeners: {
							click: function(btn) {
								this.handleAfterAdrAction( btn.itemId ) ;
							},
							scope: this
						}
					},
					items:[{
						xtype:'button',
						itemId: 'btnNext',
						text: 'Next',
						icon: 'images/op5img/ico_ok_16.gif'
					},{
						xtype:'box',
						width: 16
					},{
						xtype:'button',
						itemId: 'btnRelocate',
						cls: 'op5-spec-dbslam-liveadr-btnrelocate',
						text: 'Autre Adr.',
						icon: 'images/op5img/ico_reload_small.gif'
					},{
						xtype:'box',
						width: 16
					},{
						xtype:'button',
						itemId: 'btnDelete',
						text: 'Supprimer',
						icon: 'images/op5img/ico_delete_16.gif'
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
				border: false,
				flex: 1,
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				items: [{
					itemId: 'pMvt',
					flex: 1,
					xtype: 'grid',
					title: 'Adressages récents',
					store: {
						model: 'DbsLamMovementModel',
						autoLoad: true,
						proxy: this.optimaModule.getConfiguredAjaxProxy({
							extraParams : {
								_moduleId: 'spec_dbs_lam',
								_action: 'live_getGrid'
							},
							reader: {
								type: 'json',
								rootProperty: 'data'
							}
						}),
						sorters:[{
							property : 'mvt_id',
							direction: 'DESC'
						}],
						listeners: {
							beforeload: function(store,options) {
								if( this.getCurrentProd() != null ) {
									options.setParams({
										filter_prod: this.getCurrentProd()
									}) ;
								}
							},
							load: Ext.emptyFn,
							scope: this
						}
					},
					tools: [{
						type:'refresh',
						tooltip: 'Reload',
						handler: function(event, toolEl, panelHeader) {
							panelHeader.ownerCt.getStore().load() ;
						}
					}],
					columns: [{
						xtype: 'actioncolumn',
						items: [{
							icon: 'images/op5img/ico_procedit_16.png',  // Use a URL in the icon config
							tooltip: 'Modifier',
							handler: function(grid, rowIndex, colIndex) {
								var rec = grid.getStore().getAt(rowIndex);
								this.reloadMvt( rec.get('mvt_id') ) ;
							},
							scope: this
						}],
						width: 24
					},{
						xtype: 'datecolumn',
						format:'d/m H:i',
						dataIndex: 'mvt_date',
						text: 'Date',
						width: 80
					},{
						dataIndex: 'adr_id',
						text: 'Adresse',
						width: 90
					},{
						dataIndex: 'prod_id',
						text: 'Article',
						width: 90
					},{
						dataIndex: 'batch',
						text: 'BatchCode',
						width: 100
					},{
						dataIndex: 'mvt_qty',
						text: 'Qty IN',
						align: 'right',
						width: 60
					}]
				},{
					itemId: 'pInv',
					flex: 1,
					title: 'Inventory',
					icon: 'images/op5img/ico_blocs_small.gif',
					xtype: 'grid',
					store: {
						model: 'DbsLamStockGridModel',
						autoLoad: false,
						proxy: this.optimaModule.getConfiguredAjaxProxy({
							extraParams : {
								_moduleId: 'spec_dbs_lam',
								_action: 'prods_getStockGrid'
							},
							reader: {
								type: 'json',
								rootProperty: 'data'
							}
						}),
						sorters:[{
							property : 'adr_id',
							direction: 'ASC'
						}],
						listeners: {
							beforeload: function(store,options) {
								if( this.getCurrentProd() != null ) {
									options.setParams({
										prod_id: this.getCurrentProd()
									}) ;
								} else {
									store.removeAll() ;
									return false ;
								}
							},
							load: Ext.emptyFn,
							scope: this
						}
					},
					columns: [{
						dataIndex: 'adr_id',
						text: 'Adr.ID',
						width: 80
					},{
						dataIndex: 'inv_prod',
						text: 'Article',
						width: 90
					},{
						dataIndex: 'inv_batch',
						text: 'BatchCode',
						width: 100
					},{
						dataIndex: 'inv_qty',
						text: 'Qty disp',
						align: 'right',
						width: 60
					}]
				}]
			}]
		});
		this.callParent();
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		this.onLiveResponse(null) ;
	},
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'datachange' :
				this.down('#pMvt').getStore().load() ;
				this.down('#pInv').getStore().load() ;
				break ;
			default: break ;
		}
	},
	
	onSelectProd: function(prodCode, ajaxData) {
		var fsAttributes = this.down('#fsAttributes'),
			fsDummy = this.down('#fsDummy'),
			pInv = this.down('#pInv') ;
		
		var oldProdSet = this.down('form').getForm().findField('prod_set').getValue() ;
		if( Ext.isEmpty(oldProdSet) ) {
			oldProdSet = null ;
		}
		if( oldProdSet != prodCode ) {
			this.down('form').getForm().findField('prod_set').setValue(prodCode) ;
			this.down('#pMvt').getStore().load() ;
			this.down('#pInv').getStore().load() ;
		}
		
		fsAttributes.setVisible(false) ;
		fsDummy.setVisible(true) ;
		if( prodCode == null ) {
			pInv.setVisible(false) ;
			return ;
		}
		
		if( ajaxData != null ) {
			this.onLoadProd(ajaxData) ;
			return ;
		}
		
		var params = {
			_moduleId: 'spec_dbs_lam',
			_action: 'prods_getGrid'
		};
		Ext.apply( params, {
			entry_key: prodCode
		}) ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: params,
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success ) {
					this.onLoadProd(jsonResponse.data) ;
				}
			},
			scope: this
		});
		
		pInv.setVisible(true) ;
		pInv.getStore().load() ;
	},
	onLoadProd: function(ajaxData) {
		var fsAttributes = this.down('#fsAttributes'),
			fsDummy = this.down('#fsDummy'),
			form = this.down('form').getForm() ;
		
		if( !(ajaxData.length == 1) ) {
			return ;
		}
		var prodData = ajaxData[0] ;
		
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getStockAttributes(), function( stockAttribute ) {
			var atrField = form.findField(stockAttribute.mkey) ;
			if( atrField == null ) {
				return ;
			}
			atrField.setReadOnly( !(stockAttribute.cfg_is_editable) && !Ext.isEmpty(prodData[stockAttribute.mkey]) ) ;
			atrField.reset() ;
			atrField.setValue( prodData[stockAttribute.mkey] ) ;
		}, this) ;
		
		fsAttributes.setVisible(true) ;
		fsDummy.setVisible(false) ;
	},
	getCurrentProd: function() {
		var prodFieldValue = this.down('form').getForm().findField('prod_set').getValue() ;
		return (Ext.isEmpty(prodFieldValue) ? null : prodFieldValue) ;
	},
	
	onChangeBatch: function(value) {
		var gridStore = this.down('#pMvt').getStore() ;
		gridStore.clearFilter() ;
		if( !Ext.isEmpty(this.down('form').getForm().findField('prod_set').getValue()) ) {
			gridStore.filter('batch',value) ;
		}
	},
	
	submitAdr: function() {
		var form = this.down('form').getForm(),
			formValues = form.getValues(),
			fsAttributes = this.down('#fsAttributes') ;
		
		if( !form.isValid() ) {
			return ;
		}
		
		var returnObj = {} ;
		Ext.apply(returnObj, {
			mvt_id: ((!Ext.isEmpty(formValues.mvt_id) && formValues.mvt_id > 0) ? formValues.mvt_id : null),
			mvt_obj: {
				prod_id: formValues.prod_id,
				batch: formValues.batch,
				mvt_qty: formValues.mvt_qty
			}
		}) ;
		if( fsAttributes.isVisible() ) {
			var stockAttributes_obj = {} ;
			Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getStockAttributes(), function( stockAttribute ) {
				stockAttributes_obj[stockAttribute.mkey] = formValues[stockAttribute.mkey] ;
			}) ;
			Ext.apply(returnObj, {
				stockAttributes_obj: stockAttributes_obj
			}) ;
		}
		
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
		
		var params = {
			_moduleId: 'spec_dbs_lam',
			_action: 'live_goAdr'
		};
		Ext.apply( params, {
			form_data: Ext.JSON.encode(returnObj)
		}) ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: params,
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success ) {
					this.onLiveResponse(jsonResponse.data) ;
				} else {
					Ext.Msg.alert('Error',jsonResponse.error) ;
				}
			},
			callback: function() {
				if( this.loadMask ) {
					this.loadMask.destroy() ;
				}
			},
			scope: this
		});
	},
	submitRelocate: function( relocateObj ) {
		var form = this.down('form').getForm(),
			formValues = form.getValues(),
			fsAttributes = this.down('#fsAttributes') ;
		
		if( !form.isValid() ) {
			return ;
		}
		
		var returnObj = {} ;
		Ext.apply(returnObj, {
			mvt_id: ((!Ext.isEmpty(formValues.mvt_id) && formValues.mvt_id > 0) ? formValues.mvt_id : null),
			relocate_obj: {
				check_qty: relocateObj.check_qty,
				check_adr: relocateObj.check_adr
			}
		}) ;
		if( fsAttributes.isVisible() ) {
			var stockAttributes_obj = {} ;
			Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getStockAttributes(), function( stockAttribute ) {
				stockAttributes_obj[stockAttribute.mkey] = formValues[stockAttribute.mkey] ;
			}) ;
			Ext.apply(returnObj, {
				stockAttributes_obj: stockAttributes_obj
			}) ;
		}
		
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
		
		var params = {
			_moduleId: 'spec_dbs_lam',
			_action: 'live_goRelocate'
		};
		Ext.apply( params, {
			form_data: Ext.JSON.encode(returnObj)
		}) ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: params,
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success ) {
					this.onLiveResponse(jsonResponse.data) ;
				} else {
					Ext.Msg.alert('Error',jsonResponse.error) ;
				}
			},
			callback: function() {
				if( this.loadMask ) {
					this.loadMask.destroy() ;
				}
			},
			scope: this
		});
	},
	reloadMvt: function( mvtId ) {
		var params = {
			_moduleId: 'spec_dbs_lam',
			_action: 'live_loadMvt'
		};
		Ext.apply( params, {
			mvt_id: mvtId
		}) ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: params,
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success ) {
					this.onLiveResponse(jsonResponse.data) ;
				} else {
					Ext.Msg.alert('Error',jsonResponse.error) ;
				}
			},
			callback: function() {
				if( this.loadMask ) {
					this.loadMask.destroy() ;
				}
			},
			scope: this
		});
	},
	deleteMvt: function( mvtId ) {
		var params = {
			_moduleId: 'spec_dbs_lam',
			_action: 'live_deleteMvt'
		};
		Ext.apply( params, {
			mvt_id: mvtId
		}) ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: params,
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success ) {
					this.onLiveResponse(null) ;
					this.optimaModule.postCrmEvent('datachange') ;
				} else {
					Ext.Msg.alert('Error',jsonResponse.error) ;
				}
			},
			callback: function() {
				if( this.loadMask ) {
					this.loadMask.destroy() ;
				}
			},
			scope: this
		});
	},
	onLiveResponse: function( ajaxData ) {
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
	
	openRelocatePopup: function() {
		var me = this ;
		var popupPanel = Ext.create('Ext.form.Panel',{
			width:400,
			height:200,
			
			cls: 'ux-noframe-bg',
			
			floating: true,
			renderTo: me.getEl(),
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
				labelWidth: 75
			},
			items:[{
				height: 72,
				xtype: 'component',
				tpl: [
					'<div class="op5-spec-dbslam-liveadr-relocatebanner">',
						'<span>{text}</span>',
					'</div>'
				],
				data: {text: '<b>Déplacement d\'une adresse existante</b><br>Pour confirmer, veuillez saisir l\'adresse concernée et la quantité <u>totale</u> déplacée.'}
			},{
				xtype: 'textfield',
				name: 'check_adr',
				anchor: '',
				width: 180,
				fieldLabel: 'Adresse'
			},{
				xtype: 'numberfield',
				name: 'check_qty',
				anchor: '',
				width: 150,
				fieldLabel: 'Qté totale'
			}],
			buttons: [{
				xtype: 'button',
				text: 'Submit',
				handler:function(btn){ 
					var formPanel = btn.up('form'),
						form = btn.up('form').getForm(),
						relocateObj = form.getValues() ;
					this.submitRelocate(relocateObj) ;
					formPanel.destroy() ;
				},
				scope: this
			}]
		});
		
		popupPanel.on('destroy',function() {
			me.getEl().unmask() ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		popupPanel.show();
		popupPanel.getEl().alignTo(me.getEl(), 'c-c?');
	},
	
	doQuit: function() {
		this.destroy() ;
	}
});