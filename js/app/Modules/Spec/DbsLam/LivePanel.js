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
					xtype:'fieldset',
					itemId: 'fsDocInput',
					title: 'Document selection',
					fieldDefaults: {
						labelWidth: 120,
						anchor: '100%'
					},
					items:[Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamField',{
						cfgParam_id: 'MVTFLOW',
						cfgParam_emptyDisplayText: 'Flow / Step',
						icon: 'images/op5img/ico_blocs_small.gif',
						fieldLabel: 'Transfer type / Step',
						itemId: 'btnWhseSrc',
						optimaModule: this.optimaModule,
						name: 'input_statusCode'
					}),{
						xtype: 'textfield',
						allowBlank:false,
						fieldLabel: 'Doc Barcode',
						name: 'input_transferFilerecordId'
					}]
				},{
					xtype:'fieldset',
					itemId: 'fsDocDisplay',
					title: 'Document selection',
					fieldDefaults: {
						labelWidth: 120,
						anchor: '100%'
					},
					items:[{
						xtype: 'displayfield',
						name: 'display_statusCode'
					},{
						xtype: 'displayfield',
						name: 'display_transferTxt'
					},{
						xtype: 'hiddenfield',
						name: 'display_transferFilerecordId'
					}]
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
		
	},
	
	openDocument: function() {
		
	},
	submitAdr: function() {
		var form = this.down('form').getForm(),
			formValues = form.getValues() ;
		
		if( !form.isValid() ) {
			return ;
		}
		
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