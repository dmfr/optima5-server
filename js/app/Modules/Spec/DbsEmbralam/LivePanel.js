Ext.define('DbsEmbralamProdComboboxModel',{
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

Ext.define('DbsEmbralamMovementModel',{
	extend: 'Ext.data.Model',
	idProperty: 'mvt_id',
	fields: [
		{name: 'mvt_id', type:'int'},
		{name: 'mvt_date', type:'date'},
		{name: 'adr_id', type:'string'},
		{name: 'prod_id', type:'string'},
		{name: 'batch', type:'string'},
		{name: 'mvt_qty', type:'number'}
	]
});


Ext.define('Optima5.Modules.Spec.DbsEmbralam.LivePanel',{
	extend:'Ext.panel.Panel',
	initComponent: function() {
		var atrFields = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsEmbralam.HelperCache.getStockAttributes(), function( stockAttribute ) {
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
				items:[{
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
							name: 'prod_toset'
						},{
							xtype: 'combobox',
							fieldLabel: 'P/N',
							name: 'prod_id',
							forceSelection:false,
							allowBlank:false,
							editable:true,
							typeAhead:true,
							selectOnFocus: true,
							queryMode: 'remote',
							displayField: 'prod_id',
							valueField: 'prod_id',
							queryParam: 'filter',
							minChars: 2,
							store: {
								model: 'DbsEmbralamProdComboboxModel',
								proxy: this.optimaModule.getConfiguredAjaxProxy({
									extraParams : {
										_moduleId: 'spec_dbs_embralam',
										_action: 'prods_getGrid',
										limit: 20
									},
									reader: {
										type: 'json',
										root: 'data'
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
								scope: this
							}
						},{
							xtype: 'textfield',
							allowBlank:false,
							fieldLabel: 'Batch',
							name: 'batch'
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
						width: 80,
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
						width: 80,
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
						itemId: 'btnRedo',
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
							'<div class="op5-spec-embralam-liveadr">',
								'<tpl if="adr">',
								'<div class="op5-spec-embralam-liveadr-adr">Adr&#160;:&#160;<span class="op5-spec-embralam-liveadr-adrtxt">{adr}</span></div>',
								'</tpl>',
								'<tpl if="caption">',
								'<div class="op5-spec-embralam-liveadr-caption">',
									'<span class="op5-spec-embralam-liveadr-captiontxt {[this.getCaptionStyle(values)]}">{caption}</span>',
								'</div>',
								'</tpl>',
							'</div>',
							{
								getCaptionStyle: function(values) {
									if( values.caption_warning == true ) {
										return "op5-spec-embralam-liveadr-captionwarning" ;
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
				flex: 1,
				xtype: 'grid',
				title: 'Adressages récents',
				store: {
					model: 'DbsEmbralamMovementModel',
					autoLoad: true,
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_dbs_embralam',
							_action: 'live_getGrid'
						},
						reader: {
							type: 'json',
							root: 'data'
						}
					}),
					sorters:[{
						property : 'mvt_id',
						direction: 'DESC'
					}],
					listeners: {
						beforeload: Ext.emptyFn,
						load: Ext.emptyFn,
						scope: this
					}
				},
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
			}]
		});
		this.callParent();
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		this.onLiveResponse(null) ;
	},
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'datachange' :
				this.child('grid').getStore().load() ;
				break ;
			default: break ;
		}
	},
	
	onSelectProd: function(prodCode) {
		var fsAttributes = this.down('#fsAttributes'),
			fsDummy = this.down('#fsDummy') ;
		
		fsAttributes.setVisible(false) ;
		fsDummy.setVisible(true) ;
		if( prodCode == null ) {
			return ;
		}
		
		var params = {
			_moduleId: 'spec_dbs_embralam',
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
	},
	onLoadProd: function(ajaxData) {
		var fsAttributes = this.down('#fsAttributes'),
			fsDummy = this.down('#fsDummy'),
			form = this.down('form').getForm() ;
		
		if( !(ajaxData.length == 1) ) {
			return ;
		}
		var prodData = ajaxData[0] ;
		
		Ext.Array.each( Optima5.Modules.Spec.DbsEmbralam.HelperCache.getStockAttributes(), function( stockAttribute ) {
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
				mvt_qty: formValues.mvt_qty,
			}
		}) ;
		if( fsAttributes.isVisible() ) {
			var stockAttributes_obj = {} ;
			Ext.Array.each( Optima5.Modules.Spec.DbsEmbralam.HelperCache.getStockAttributes(), function( stockAttribute ) {
				stockAttributes_obj[stockAttribute.mkey] = formValues[stockAttribute.mkey] ;
			}) ;
			Ext.apply(returnObj, {
				stockAttributes_obj: stockAttributes_obj,
			}) ;
		}
		
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
		
		var params = {
			_moduleId: 'spec_dbs_embralam',
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
	reloadMvt: function( mvtId ) {
		var params = {
			_moduleId: 'spec_dbs_embralam',
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
			_moduleId: 'spec_dbs_embralam',
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
			field.setReadOnly(true) ;
			field.setValue( ajaxData.mvt_obj[field.name] ) ;
		}) ;
		
		if( ajaxData.status == 'PROD_TOSET' ) {
			Ext.Array.each( Optima5.Modules.Spec.DbsEmbralam.HelperCache.getStockAttributes(), function( stockAttribute ) {
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
		
		this.onSelectProd( ajaxData.mvt_obj['prod_id'] ) ;
		cntBefore.setVisible(false) ;
		cntAfter.setVisible(true) ;
		
		this.optimaModule.postCrmEvent('datachange') ;
		
		switch( ajaxData.status ) {
			case 'RELOAD' :
				fsResultCmp.update({
					adr: ajaxData.adr_id
				});
				break ;
				
			case 'OK_ADD' :
				fsResultCmp.update({
					adr: ajaxData.adr_id,
					caption: 'Ajout sur emplacement existant (P/N + Batch)'
				});
				break ;
				
			case 'OK_NEW' :
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
			case 'btnRedo' :
				var form = this.down('form').getForm(),
					formValues = form.getValues(),
					currentMvtId = formValues['mvt_id'] ;
				if( Ext.isEmpty(currentMvtId) || !(currentMvtId > 0) ) {
					Ext.Msg.alert('Error','MVT_ID non trouvé') ;
					return ;
				}
				this.submitAdr() ;
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
			this.deleteMvt( mvtId ) ;
		},this) ;
	}
});