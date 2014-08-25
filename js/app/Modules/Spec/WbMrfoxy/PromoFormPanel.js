Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoFormPanel',{
	extend: 'Ext.panel.Panel',
	
	requires:[
		'Optima5.Modules.Spec.WbMrfoxy.PromoFormSkuGridPanel',
		'Optima5.Modules.Spec.WbMrfoxy.FinanceBudgetBar',
		'Optima5.Modules.Spec.WbMrfoxy.BenchmarkGridEmpty'
	],
	
	initComponent: function() {
		var me = this,
			width = me.width ;
		
		me.addEvents('abort','confirm') ;
		
		Ext.apply( me, {
			layout:{
				type:'vbox',
				align:'center'
			},
			bodyCls: 'op5-spec-mrfoxy-mainmenu',
			items:[ Ext.apply(me.initHeaderCfg(),{
				width: width,
				height: 95
			}),{
				xtype:'box',
				html:'&#160;',
				height: 8
			},{
				xtype:'panel',
				layout:'border',
				frame:true,
				width: width,
				flex: 1,
				items:[Ext.apply(me.initFormCfg(),{
					region:'center',
					flex: 2
				}),Ext.create('Optima5.Modules.Spec.WbMrfoxy.PromoFormSkuGridPanel',{
					region:'south',
					flex: 1,
					title: 'Promotion SKUs',
					collapsible: true,
					collapsed: false,
					listeners: {
						collapse: function() {
							this.calcLayout() ;
						},
						expand: function() {
							this.calcLayout() ;
						},
						edit: function() {
							this.forecastCalc() ;
						},
						scope: this
					}
				})]
			}]
		});
		
		this.callParent() ;
		if( me.promoRecord ) {
			me.loadDataFromRecord(me.promoRecord) ;
		}
		if( me.data ) {
			me.loadData(me.data) ;
		}
	},
	
	initHeaderCfg: function() {
		var headerCfg = {
			itemId: 'pHeader',
			xtype:'component',
			cls: 'op5-spec-mrfoxy-promoformheader',
			tpl: [
				'<div class="op5-spec-mrfoxy-promoformheader-wrap" style="position:relative">',
					'<div class="op5-spec-mrfoxy-promoformheader-title">{title}</div>',
					'<div class="op5-spec-mrfoxy-promoformheader-caption">',
						'<span class="op5-spec-mrfoxy-promoformheader-captiontitle">Country</span>',
						'<span class="op5-spec-mrfoxy-promoformheader-captionbody">' ,
							'<div class="op5-spec-mrfoxy-promoformheader-captionicon" style="background-image:url({countryIcon})" ></div>',
							'<span class="op5-spec-mrfoxy-promoformheader-captionicontext">{countryDisplay}</span>',
						'</span>',
					'</div>',
					'<div class="op5-spec-mrfoxy-promoformheader-caption">',
						'<span class="op5-spec-mrfoxy-promoformheader-captiontitle">Brand</span>',
						'<span class="op5-spec-mrfoxy-promoformheader-captionbody">' ,
							'{brandDisplay}',
						'</span>',
					'</div>',
					'<div class="op5-spec-mrfoxy-promoformheader-icon"></div>',
					'<div class="op5-spec-mrfoxy-promoformheader-actions">',
						'<tpl if="action_approval">',
						"<div class=\"op5-spec-mrfoxy-promoformheader-action-btn op5-spec-mrfoxy-promoformheader-action-btn-approval {[values.action_approvalblink ? 'op5-spec-mrfoxy-promoformheader-action-btn-approvalblink' : '']}\">",
						'</div>',
						'</tpl>',
						'<tpl if="action_submit">',
						'<div class="op5-spec-mrfoxy-promoformheader-action-btn op5-spec-mrfoxy-promoformheader-action-btn-submit">',
						'</div>',
						'</tpl>',
						'<tpl if="action_save">',
						'<div class="op5-spec-mrfoxy-promoformheader-action-btn op5-spec-mrfoxy-promoformheader-action-btn-save">',
						'</div>',
						'</tpl>',
						'<tpl if="action_close">',
						'<div class="op5-spec-mrfoxy-promoformheader-action-btn op5-spec-mrfoxy-promoformheader-action-btn-close">',
						'</div>',
						'</tpl>',
					'</div>',
				'</div>'
			]
		} ;
		
		return headerCfg ;
	},
	initFormCfg: function() {
		var me = this ;
		var tabsCfg = {
			xtype:'form',
			border: false,
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 10,
			items:[{
				xtype:'fieldcontainer',
				layout: {
					type: 'hbox'
				},
				items:[{
					xtype:'hidden',
					name:'_filerecord_id'
				},{
					xtype:'hidden',
					name:'is_prod'
				},{
					xtype:'hidden',
					name:'country_code'
				},{
					xtype:'hidden',
					name:'brand_code'
				},{
					xtype:'hidden',
					name:'currency'
				},{
					xtype:'hidden',
					name:'cost_forecast'
				},{
					xtype:'fieldcontainer',
					flex: 4,
					items:[{
						xtype:'fieldset',
						title: 'Scheduled date',
						items:[{
							xtype: 'datefield',
							startDay: 1,
							fieldLabel: 'Supply begins',
							name: 'date_supply_start',
							format: 'Y-m-d',
							allowBlank: false,
							listeners: {
								change: function() {
									me.evalForm() ;
								},
								scope: me
							}
						},{
							xtype: 'datefield',
							startDay: 1,
							fieldLabel: 'Supply ends',
							name: 'date_supply_end',
							format: 'Y-m-d',
							allowBlank: false
						},{
							xtype: 'datefield',
							startDay: 1,
							fieldLabel: 'In-store begins',
							name: 'date_start',
							format: 'Y-m-d',
							allowBlank: false,
							listeners: {
								change: function() {
									me.evalForm() ;
								},
								scope: me
							}
						},{
							xtype: 'datefield',
							startDay: 1,
							fieldLabel: 'In-store ends',
							name: 'date_end',
							format: 'Y-m-d',
							allowBlank: false,
							listeners: {
								change: function() {
									me.evalForm() ;
								},
								scope: me
							}
						}]
					},{
						xtype:'fieldset',
						defaults: {
							anchor: '100%',
							labelWidth: 60
						},
						title: 'Stores',
						items:[{
							xtype: 'op5crmbasebibletreepicker',
							allowBlank:false,
							rootNode: ( me.data != null ? me.data.country_code : null ),
							selectMode: 'single',
							optimaModule: me.optimaModule,
							bibleId: 'IRI_STORE',
							fieldLabel: 'Stores',
							name: 'store_code',
							listeners: {
								change: function() {
									me.evalForm() ;
								},
								scope: me
							}
						},{
							xtype: 'displayfield',
							fieldLabel: 'Corporate',
							name: 'store_master',
							fieldStyle: 'font-weight: bold'
						}]
					},{
						xtype:'fieldset',
						defaults: {
							anchor: '100%',
							labelWidth: 60
						},
						title: 'Products',
						items:[{
							xtype: 'op5crmbasebibletreepicker',
							allowBlank:false,
							selectMode: 'single',
							optimaModule: me.optimaModule,
							bibleId: 'IRI_PROD',
							fieldLabel: 'Products',
							name: 'prod_code',
							listeners: {
								change: function() {
									me.evalForm() ;
								},
								scope: me
							}
						},{
							xtype: 'displayfield',
							fieldLabel: 'Range',
							name: 'prod_master',
							fieldStyle: 'font-weight: bold'
						}]
					},{
						xtype:'fieldset',
						defaults: {
							anchor: '100%',
							labelWidth: 60
						},
						title: 'Promo mechanics',
						items:[{
							xtype: 'checkbox',
							boxLabel: 'Rewards card program',
							name: 'mechanics_rewardcard',
							listeners:{
								change: function(){},
								scope:me
							}
						},{
							xtype: 'op5crmbasebibletreepicker',
							allowBlank:false,
							selectMode: 'single',
							optimaModule: me.optimaModule,
							bibleId: 'PROMO_MECH',
							fieldLabel: 'Type',
							name: 'mechanics_code',
							listeners:{
								change: function(){ me.calcLayout(); },
								scope:me
							}
						},{
							xtype: 'fieldcontainer',
							layout:{
								type: 'hbox',
								align: 'stretch'
							},
							itemId: 'mechanics_mono_discount',
							fieldLabel: 'Discount',
							items:[{
								xtype:'numberfield',
								hideTrigger:true,
								name: 'mechanics_mono_discount',
								width: 30
							},{
								xtype:'box',
								padding:'4px 0px 0px 6px',
								html:'<b>%</b>'
							}]
						},{
							xtype: 'fieldcontainer',
							layout:{
								type: 'hbox',
								align: 'stretch'
							},
							itemId: 'mechanics_mono_pricecut',
							fieldLabel: 'Discount',
							items:[{
								xtype:'numberfield',
								hideTrigger:true,
								name: 'mechanics_mono_pricecut',
								width: 50
							},{
								xtype:'box',
								padding:'4px 0px 0px 6px',
								html:'<b>€/£/...</b>'
							}]
						},{
							xtype: 'comboboxcached',
							itemId: 'mechanics_multi',
							fieldLabel: 'Details',
							name: 'mechanics_multi_combo',
							forceSelection: false,
							editable: true,
							store: {
								fields: ['txt'],
								data : []
							},
							queryMode: 'local',
							displayField: 'txt',
							valueField: 'txt'
						}]
					}]
				},{
					xtype:'box',
					html:'&#160;',
					width: 24
				},{
					xtype:'fieldset',
					itemId: 'fsFinance',
					hidden: true,
					flex: 5,
					title: 'Financial data',
					items:[{
						xtype: 'op5crmbasebibletreepicker',
						allowBlank:false,
						selectMode: 'single',
						optimaModule: me.optimaModule,
						bibleId: 'PROMO_PAYM',
						fieldLabel: 'Payment',
						labelWidth: 60,
						anchor: '100%',
						name: 'cost_billing_code',
						listeners:{
							change: function(){ me.calcLayout(); me.forecastCalc(); },
							scope:me
						}
					},{
						xtype: 'fieldcontainer',
						layout:{
							type: 'hbox',
							align: 'stretch'
						},
						fieldLabel: 'Forecasted cost',
						labelStyle: 'font-style:italic',
						labelWidth: 110,
						items:[{
							xtype: 'displayfield',
							name: 'cost_forecast_display',
							fieldStyle: 'font-weight:bold',
							valueToRaw: function(v) {
								if( isNaN(v) ) {
									return '-' ;
								}
								return Ext.util.Format.number(v,'0,0') ;
							}
						},{
							xtype:'box',
							html:'&#160;',
							width: 6
						},{
							xtype: 'displayfield',
							displayName: 'currency'
						}]
					},{
						xtype: 'fieldcontainer',
						layout:{
							type: 'hbox',
							align: 'stretch'
						},
						fieldLabel: 'Fixed cost',
						itemId: 'cost_forecast_fix',
						labelWidth: 110,
						items:[{
							xtype:'numberfield',
							hideTrigger:true,
							name: 'cost_forecast_fix',
							width: 50,
							minValue: 0,
							value: 0,
							listeners: {
								change: function(){ me.forecastCalc(); },
								scope:me
							}
						},{
							xtype:'box',
							html:'&#160;',
							width: 6
						},{
							xtype: 'displayfield',
							displayName: 'currency'
						}]
					},{
						xtype: 'fieldcontainer',
						layout:{
							type: 'hbox',
							align: 'stretch'
						},
						fieldLabel: 'Variable cost',
						itemId: 'cost_forecast_var',
						labelWidth: 110,
						items:[{
							xtype:'numberfield',
							hideTrigger:true,
							name: 'cost_forecast_var',
							width: 50,
							minValue: 0,
							value: 0,
							listeners: {
								change: function(){ me.forecastCalc(); },
								scope:me
							}
						},{
							xtype:'box',
							html:'&#160;',
							width: 6
						},{
							xtype: 'displayfield',
							displayName: 'currency'
						}]
					},{
						xtype:'op5specmrfoxybudgetbar',
						optimaModule: me.optimaModule,
						height: 100
					},Ext.create('Optima5.Modules.Spec.WbMrfoxy.BenchmarkGridEmpty',{
						itemId: 'gridBenchmark',
						height:200
					}),{
						xtype:'box',
						html:'&#160;',
						height: 16
					}]
				},{
					xtype:'fieldset',
					hidden: true,
					itemId: 'fsSimu',
					flex: 5,
					title: 'Selling-Out Simulation',
					items:[{
						xtype:'container',
						itemId: 'cntSimuGraph',
						layout:'fit',
						cls:'op5-waiting',
						height:300,
						margin: 4
					},{
						xtype:'op5specmrfoxygraphinfo',
						margin: 4
					}]
				}]
			}]
		} ;
		return tabsCfg ;
	},
	getFormPanel: function() {
		return this.child('panel').child('form') ;
	},
	getSkuList: function() {
		return this.child('panel').child('grid') ;
	},
	calcLayout: function() {
		var me = this ;
			form = me.getFormPanel().getForm(),
			isProd = (form.findField('is_prod').getValue()=='PROD') ;
			  
		// partie DATES
		form.findField('date_supply_start').setVisible( isProd ) ;
		form.findField('date_supply_start').allowBlank = !(isProd) ;
		form.findField('date_supply_end').setVisible( isProd ) ;
		form.findField('date_supply_end').allowBlank = !(isProd) ;
			
		// partie MECANIQUE / DETAIL
		var mechanicsCode = form.findField('mechanics_code').getValue() ;
		me.query('#mechanics_mono_discount')[0].setVisible( mechanicsCode=='MONO_DIS' ) ;
		form.findField('mechanics_mono_discount').allowBlank = !(mechanicsCode=='MONO_DIS') ;
		me.query('#mechanics_mono_pricecut')[0].setVisible( mechanicsCode=='MONO_CUT' ) ;
		form.findField('mechanics_mono_pricecut').allowBlank = !(mechanicsCode=='MONO_CUT') ;
		me.query('#mechanics_multi')[0].setVisible( mechanicsCode=='MULTI' ) ;
		form.findField('mechanics_multi_combo').allowBlank = !(mechanicsCode=='MULTI') ;
		
		// partie FINANCE
		me.query('#fsFinance')[0].setVisible( isProd ) ;
		Ext.Array.each( me.query('#fsFinance')[0].query('field'), function(field){
			field.allowBlank = !isProd ;
		});
		me.query('#fsSimu')[0].setVisible( !isProd ) ;
		
		// partie FINANCE FORECAST
		var cost_billing_code = form.findField('cost_billing_code').getValue() ;
		if( me.getSkuList() ) {
			me.getSkuList().setPriceDiscountVisible( (cost_billing_code=='DIS' || cost_billing_code=='MX') ) ;
			me.getSkuList().setPriceCutVisible( (cost_billing_code=='CUT') ) ;
		}
		me.query('#cost_forecast_fix')[0].setVisible( (cost_billing_code=='CUT' || cost_billing_code=='DIS' || cost_billing_code=='MX' || cost_billing_code=='BB') ) ;
		me.query('#cost_forecast_var')[0].setVisible( (cost_billing_code=='MX' || cost_billing_code=='BB') ) ;
		
		// volet LISTE SKU
		if( !isProd && me.getSkuList() ) {
			//me.getSkuList().destroy() ;
			me.child('panel').remove( me.getSkuList() ) ;
		}
		
		// bouton SUBMIT > pour validation
		var headerCmp = me.getComponent('pHeader'),
			headerEl = headerCmp.getEl() ;
		if( headerEl ) {
			headerEl.down('.op5-spec-mrfoxy-promoformheader-action-btn-submit').setVisible( isProd ) ;
		}
	},
	evalForm: function() {
		var me = this,
			form = me.getFormPanel().getForm(),
			formValues = form.getValues(),
			doSimuGraph, doSkuList, doFinanceBudgetBar ;
		
		if( me.suspendEvents ) {
			return ;
		}
		
		if( form.findField('is_prod').getValue()=='PROD' ) {
			doSimuGraph = false ;
			doSkuList = true ;
			doFinanceBudgetBar = true ;
		} else {
			doSimuGraph = true ;
			doSkuList = false ;
			doFinanceBudgetBar = false ;
		}
		if( doSimuGraph ) {
			me.query('#cntSimuGraph')[0].removeAll() ;
			me.query('#cntSimuGraph')[0].addCls('op5-waiting') ;
		}
		
		
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_wb_mrfoxy',
				_action: 'promo_formEval',
				data: Ext.JSON.encode(formValues),
				doSimuGraph: (doSimuGraph ? 1:0),
				doSkuList: (doSkuList ? 1:0)
			},
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == true ) {
					var ajaxDataObj = ajaxData.data ;
					if( ajaxDataObj.store_master != null ) {
						me.getFormPanel().getForm().findField('store_master').setValue( ajaxDataObj.store_master ) ;
					}
					if( ajaxDataObj.prod_master != null ) {
						me.getFormPanel().getForm().findField('prod_master').setValue( ajaxDataObj.prod_master ) ;
					}
					if( ajaxDataObj.currency != null ) {
						me.getFormPanel().getForm().findField('currency').setValue( ajaxDataObj.currency ) ;
						Ext.Array.each( me.query('displayfield'), function(df) {
							if( df.displayName == 'currency' ) {
								df.setValue( ajaxDataObj.currency ) ;
							}
						}) ;
					}
					if( ajaxDataObj.gridBenchmark != null ) {
						me.query('#gridBenchmark')[0].getStore().loadData( ajaxDataObj.gridBenchmark ) ;
					}
					if( ajaxDataObj.mechanics_multi != null ) {
						me.getFormPanel().getForm().findField('mechanics_multi_combo').getStore().loadData( ajaxDataObj.mechanics_multi ) ;
					}
					
					var cntSimuGraph = me.query('#cntSimuGraph')[0] ;
					cntSimuGraph.removeCls('op5-waiting') ;
					if( ajaxDataObj.simu_graph ) {
						cntSimuGraph.removeAll() ;
						cntSimuGraph.add({
							xtype: 'op5crmbasequeryresultchartstatic',
							optimaModule: me.optimaModule,
							ajaxBaseParams: {},
							RESchart_static: ajaxDataObj.simu_graph.RESchart_static,
							drawChartLegend: false
						});
					}
					
					if( ajaxDataObj.list_sku && me.getSkuList() ) {
						me.getSkuList().populateSkuList( ajaxDataObj.list_sku ) ;
					}
				}
			},
			scope: me
		}) ;
		
		if( doFinanceBudgetBar && !Ext.isEmpty(formValues.country_code) && !Ext.isEmpty(formValues.date_start) ) {
			me.down('op5specmrfoxybudgetbar').setData({
				crop_year: formValues.date_start,
				country_code: formValues.country_code
			});
		}
	},
	forecastCalc: function() {
		var me = this,
			values = me.getFormPanel().getForm().getValues() ;
		
		var total = 0,
			cost_forecast_fix = parseInt(values.cost_forecast_fix),
			cost_forecast_var = parseInt(values.cost_forecast_var) ;
		if( me.query('#cost_forecast_fix')[0].isVisible() && cost_forecast_fix != NaN ) {
			total += cost_forecast_fix ;
		}
		if( me.query('#cost_forecast_var')[0].isVisible() && cost_forecast_var != NaN ) {
			total += cost_forecast_var ;
		}
		if( me.getSkuList() ) {
			total += me.getSkuList().getTotalDiscount() ;
		}
		me.getFormPanel().getForm().findField('cost_forecast').setValue(total) ;
		me.getFormPanel().getForm().findField('cost_forecast_display').setValue(total) ;
		me.down('op5specmrfoxybudgetbar').setVariableCost(total) ;
	},
	
	loadDataFromRecord: function( promoRecord ) {
		var data = promoRecord.getData(true) ;
		switch( data['mechanics_code'] ) {
			case 'MONO_DIS' :
				data['mechanics_mono_discount'] = Ext.String.trim(data['mechanics_detail'].substr(0,2)) ;
				break ;
			case 'MONO_CUT' :
				data['mechanics_mono_pricecut'] = Ext.String.trim(data['mechanics_detail'].split(' ')[0]) ;
				break ;
			case 'MULTI' :
				data['mechanics_multi_combo'] = data['mechanics_detail'] ;
				break ;
		}
		this.loadData(data) ;
	},
	loadData: function(data) {
		var me = this ;
		me.suspendEvents = true ;
		
		// prepare header data
		var headerData = {},
			headerCmp = me.getComponent('pHeader') ;
		if( data.promo_id ) {
			headerData['title'] = data.promo_id ;
		} else {
			headerData['title'] = 'New promotion' ;
		}
		if( data.country_code ) {
			var row = Optima5.Modules.Spec.WbMrfoxy.HelperCache.countryGetById(data.country_code) ;
			if( row ) {
				headerData['countryIcon'] = row.get('country_iconurl') ;
				headerData['countryDisplay'] = row.get('country_display') ;
			}
		}
		if( data.brand_code ) {
			var row = Optima5.Modules.Spec.WbMrfoxy.HelperCache.brandGetById(data.brand_code) ;
			if( row ) {
				headerData['brandDisplay'] = row.get('brand_display') ;
			}
		}
		headerData['action_approval'] = Optima5.Modules.Spec.WbMrfoxy.PromoApprovalPanel.static_approvalIsOn(me.promoRecord) ;
		headerData['action_approvalblink'] = Optima5.Modules.Spec.WbMrfoxy.PromoApprovalPanel.static_approvalIsBlink(me.promoRecord) ;
		headerData['action_submit'] = ( Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQueryRole(['ADM','SM']) && data.is_prod ) ;
		headerData['action_save'] = ( Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQueryRole(['ADM','SM']) ) ;
		headerData['action_close'] = true ;
		if( me.promoRecord && me.promoRecord.get('status_percent') >= 30 ) {
			headerData['action_submit'] = false ;
			headerData['action_save'] = false ;
		}
		headerCmp.update(headerData) ;
		if( headerCmp.rendered ) {
			me.headerAttachEvents() ;
		} else {
			headerCmp.on('afterrender',function() {
				me.headerAttachEvents() ;
			},me) ;
		}
		
		var form = me.getFormPanel().getForm() ;
		form.setValues( data ) ;
			  
		if( data.promo_sku && me.getSkuList() ) {
			me.getSkuList().setSkuData(data.promo_sku) ;
		}
		
		// *** Set form to readonly ***
		var readOnly = false ;
		if( !headerData['action_save'] ) {
			readOnly = true ;
		}
		form.getFields().each(function(field) {
			field.setReadOnly( readOnly ) ;
		}) ;
		me.getSkuList().setReadOnly( readOnly ) ;
		
		me.calcLayout();
		
		me.suspendEvents = false ;
		me.evalForm() ;
		
		me.forecastCalc() ;
	},
	
	headerAttachEvents: function() {
		var me=this,
			headerCmp = me.getComponent('pHeader'),
			headerEl = headerCmp.getEl(),
			btnCloseEl = headerEl.down('.op5-spec-mrfoxy-promoformheader-action-btn-close'),
			btnSaveEl = headerEl.down('.op5-spec-mrfoxy-promoformheader-action-btn-save'),
			btnSubmitEl = headerEl.down('.op5-spec-mrfoxy-promoformheader-action-btn-submit'),
			btnApprovalEl = headerEl.down('.op5-spec-mrfoxy-promoformheader-action-btn-approval') ;
		
		if( btnCloseEl ) {
			btnCloseEl.un('click',me.onHeaderClose,me) ;
			btnCloseEl.on('click',me.onHeaderClose,me) ;
		}
		if( btnSaveEl ) {
			btnSaveEl.un('click',me.onHeaderSave,me) ;
			btnSaveEl.on('click',me.onHeaderSave,me) ;
		}
		if( btnSubmitEl ) {
			btnSubmitEl.un('click',me.onHeaderSubmit,me) ;
			btnSubmitEl.on('click',me.onHeaderSubmit,me) ;
		}
		if( btnApprovalEl ) {
			btnApprovalEl.un('click',me.onHeaderApproval,me) ;
			btnApprovalEl.on('click',me.onHeaderApproval,me) ;
		}
	},
	onHeaderClose: function(e,t) {
		var me = this ;
		if( me.promoRecord ) {
			me.sendAbort() ;
			return ;
		}
		Ext.MessageBox.confirm('Abort encoding','Abort new promo definition ?', function(buttonStr) {
			if( buttonStr=='yes' ) {
				me.sendAbort() ;
			}
		},me) ;
	},
	sendAbort: function() {
		var me = this ;
		me.fireEvent('abort',me) ;
	},
	
	onHeaderSave: function() {
		this.handleSubmit(false) ;
	},
	onHeaderSubmit: function() {
		this.handleSubmit(true) ;
	},
	handleSubmit: function(doSubmit) {
		var me = this ;
			form = me.getFormPanel().getForm() ;
			  
		if( form.hasInvalidField() ) {
			Ext.MessageBox.alert('Incomplete','Please fill all required data') ;
			return ;
		}
		
		var str = 'Encode new promotion ?' ;
		if( me.promoRecord && me.promoRecord.get('status_percent') > 0 ) {
			str = 'Commit modifications to promo '+me.promoRecord.get('promo_id')+' ?<br>'+'Warning : This will start over approval process!' ;
		}
		
		var data = me.getFormPanel().getForm().getValues() ;
		data.cost_forecast_fix = ( me.query('#cost_forecast_fix')[0].isVisible() ? data.cost_forecast_fix : 0 ) ;
		data.cost_forecast_var = ( me.query('#cost_forecast_var')[0].isVisible() ? data.cost_forecast_var : 0 ) ;
		if( me.getSkuList() ) {
			data.promo_sku = me.getSkuList().getSkuData() ;
		}
		if( doSubmit ) {
			data['_do_submit'] = 'true' ;
		}
		
		Ext.MessageBox.confirm('Confirmation',str, function(buttonStr) {
			if( buttonStr=='yes' ) {
				me.optimaModule.getConfiguredAjaxConnection().request({
					params: {
						_moduleId: 'spec_wb_mrfoxy',
						_action: 'promo_formSubmit',
						data: Ext.JSON.encode(data),
						_filerecord_id: (me.promoRecord ? me.promoRecord.get('_filerecord_id') : 0)
					},
					success: function(response) {
						var ajaxData = Ext.decode(response.responseText) ;
						if( ajaxData.success == true ) {
							me.fireEvent('saved',me) ;
						}
					},
					scope: me
				}) ;
			}
		},me) ;
	},
	
	onHeaderApproval: function() {
		var me = this,
			promoRecord = me.promoRecord ;
		
		if( Ext.isEmpty(promoRecord) ) {
			return ;
		}
		
		var promoApprovalPanel = Ext.create('Optima5.Modules.Spec.WbMrfoxy.PromoApprovalPanel',{
			optimaModule: me.optimaModule,
			rowRecord: promoRecord,
			
			width:600,
			height:120,
			
			floating: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				}
			}]
		});
		promoApprovalPanel.on('saved',function() {
			me.fireEvent('saved',me) ;
		},me,{single:true}) ;
		promoApprovalPanel.on('destroy',function() {
			if( me.getEl() ) {
				me.getEl().unmask() ;
			}
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		promoApprovalPanel.show();
		promoApprovalPanel.getEl().alignTo(me.getEl(), 'c-c?');
	}
});