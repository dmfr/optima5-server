Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoFormPanel',{
	extend: 'Ext.panel.Panel',
	
	requires:['Optima5.Modules.Spec.WbMrfoxy.PromoFormSkuGridPanel'],
	
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
					flex: 2,
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
		
		Ext.defer(function() {
			me.renderGraph() ;
		},1000,me) ;
	},
	
	initHeaderCfg: function() {
		var headerCfg = {
			itemId: 'pHeader',
			xtype:'component',
			cls: 'op5-spec-mrfoxy-promoformheader',
			tpl: [
				'<div class="op5-spec-mrfoxy-promoformheader-wrap">',
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
					'<div class="op5-spec-mrfoxy-promoformheader-close"></div>',
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
					name:'_filerecord_id',
				},{
					xtype:'hidden',
					name:'is_prod',
				},{
					xtype:'hidden',
					name:'country_code',
				},{
					xtype:'hidden',
					name:'brand_code',
				},{
					xtype:'hidden',
					name:'currency',
				},{
					xtype:'hidden',
					name:'cost_forecast',
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
							name: 'date_supply',
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
							fieldLabel: 'Date start',
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
							fieldLabel: 'Date end',
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
								change: function(){ me.calcLayout() },
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
							change: function(){ me.calcLayout() },
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
							xtype:'displayfield',
							name: 'cost_forecast_display',
							fieldStyle: 'font-weight:bold'
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
								change: function(){ me.forecastCalc() },
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
								change: function(){ me.forecastCalc() },
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
						xtype:'container',
						hidden:true,
						itemId: 'cntFinanceGraph',
						cls:'op5-waiting',
						height:32,
						margin: 10
					},{
						xtype:'grid',
						height:200,
						itemId: 'gridBenchmark',
						store: {
							model: 'WbMrfoxyPromoModel',
							data:[]
						},
						columns: [{
							text: '<b>Promo#</b>',
							dataIndex: 'promo_id',
							width: 150,
							renderer: function(v) {
								return ''+v+'' ;
							}
						},{
							text: 'Uplift(kg)',
							dataIndex: 'calc_uplift_vol',
							width: 70
						},{
							text: 'Uplift(%)',
							dataIndex: 'calc_uplift_per',
							width: 70
						},{
							text: 'Cost',
							width: 70,
							renderer: function(v,m,r) {
								if( r.get('cost_real') > 0 ) {
									return r.get('cost_real') ;
								} else {
									return r.get('cost_forecast') ;
								}
							}
						},{
							text: 'Cost/kg',
							width: 70,
							renderer: function(v,m,r) {
								var cost,
									upliftKg = r.get('calc_uplift_vol') ;
								if( upliftKg <= 0 ) {
									return '' ;
								}
								if( r.get('cost_real') > 0 ) {
									cost = r.get('cost_real') ;
								} else {
									cost = r.get('cost_forecast') ;
								}
								return Math.round( (cost/upliftKg)*100 ) / 100 ;
							}
						}]
					},{
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
					}]
				}]
			}],
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'bottom',
				ui: 'footer',
				layout:{
					align: 'stretch',
					pack:'center'
				},
				items: [{
					xtype: 'checkbox',
					padding: '0px 32px 16px 0px',
					boxLabel: '<b>Submit promotion</b>',
					name: '_do_submit',
				},{
					xtype: 'component',
					padding: '0px 0px 16px 0px',
					overCls: 'op5-crmbase-dataimport-go-over',
					renderTpl: Ext.create('Ext.XTemplate',
						'<div class="op5-crmbase-dataimport-go">',
						'<div class="op5-crmbase-dataimport-go-btn">',
						'</div>',
						'</div>',
						{
							compiled:true,
							disableFormats: true
						}
					),
					listeners: {
						afterrender: function(c) {
							c.getEl().on('click',this.handleSubmit,this) ;
						},
						scope: this
					}
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
	renderGraph: function() {
		var me = this,
			cntFinanceGraph = me.query('#cntFinanceGraph')[0] ;
		
		/*
		var store = Ext.create('Ext.data.JsonStore', {
			fields: ['year', 'comedy', 'action', 'drama', 'thriller'],
			data: [
               {year: 2005, comedy: 34000000, action: 23890000, drama: 18450000, thriller: 20060000},
                {year: 2006, comedy: 56703000, action: 38900000, drama: 12650000, thriller: 21000000},
                {year: 2007, comedy: 42100000, action: 50410000, drama: 25780000, thriller: 23040000},
                {year: 2008, comedy: 38910000, action: 56070000, drama: 24810000, thriller: 26940000}
					]
		});

		var chart = Ext.create('Ext.chart.Chart',{
					xtype: 'chart',
					animate: true,
					shadow: true,
					store: store,
					legend: {
						position: 'right'
					},
					axes: [{
						type: 'Numeric',
						position: 'bottom',
						fields: ['comedy', 'action', 'drama', 'thriller'],
						title: false,
						grid: true,
						label: {
							renderer: function(v) {
									return String(v).replace(/(.)00000$/, '.$1M');
							}
						}
					}, {
						type: 'Category',
						position: 'left',
						fields: ['year'],
						title: false
					}],
					series: [{
						type: 'bar',
						axis: 'bottom',
						gutter: 80,
						xField: 'year',
						yField: ['comedy', 'action', 'drama', 'thriller'],
						stacked: true,
						tips: {
							trackMouse: true,
							width: 65,
							height: 28,
							renderer: function(storeItem, item) {
									this.setTitle(String(item.value[1] / 1000000) + 'M');
							}
						}
					}]
			});
		cntFinanceGraph.removeCls('op5-waiting') ;
		cntFinanceGraph.add(chart) ;
		*/
	},
	calcLayout: function() {
		var me = this ;
			form = me.getFormPanel().getForm(),
			isProd = (form.findField('is_prod').getValue()=='PROD') ;
			  
		// partie DATES
		form.findField('date_supply').setVisible( isProd ) ;
		form.findField('date_supply').allowBlank = !(isProd) ;
			
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
			me.getSkuList().setPriceVisible( (cost_billing_code=='DIS' || cost_billing_code=='MX') ) ;
		}
		me.query('#cost_forecast_fix')[0].setVisible( (cost_billing_code=='DIS' || cost_billing_code=='MX' || cost_billing_code=='BB') ) ;
		me.query('#cost_forecast_var')[0].setVisible( (cost_billing_code=='MX' || cost_billing_code=='BB') ) ;
		
		// volet LISTE SKU
		if( !isProd && me.getSkuList() ) {
			//me.getSkuList().destroy() ;
			me.child('panel').remove( me.getSkuList() ) ;
		}
		
		// toolbar (submit)
		if( me.getSkuList() && !(me.getSkuList().collapsed) ) {
			me.getFormPanel().child('toolbar').setVisible(false) ;
		} else {
			me.getFormPanel().child('toolbar').setVisible(true) ;
		}
		
		form.findField('_do_submit').setVisible( isProd ) ;
	},
	evalForm: function() {
		var me = this,
			form = me.getFormPanel().getForm(),
			doSimuGraph, doSkuList ;
		
		if( me.suspendEvents ) {
			return ;
		}
		
		if( form.findField('is_prod').getValue()=='PROD' ) {
			doSimuGraph = false ;
			doSkuList = true ;
		} else {
			doSimuGraph = true ;
			doSkuList = false ;
		}
		if( doSimuGraph ) {
			me.query('#cntSimuGraph')[0].removeAll() ;
			me.query('#cntSimuGraph')[0].addCls('op5-waiting') ;
		}
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_wb_mrfoxy',
				_action: 'promo_formEval',
				data: Ext.JSON.encode(me.getFormPanel().getForm().getValues()),
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
	},
	forecastCalc: function() {
		var me = this,
			values = me.getFormPanel().getForm().getValues() ;
		
		var total = 0,
			cost_forecast_fix = parseInt(values.cost_forecast_fix),
			cost_forecast_var = parseInt(values.cost_forecast_var) ;
		if( cost_forecast_fix != NaN ) {
			total += cost_forecast_fix ;
		}
		if( cost_forecast_var != NaN ) {
			total += cost_forecast_var ;
		}
		if( me.getSkuList() ) {
			total += me.getSkuList().getTotalDiscount() ;
		}
		me.getFormPanel().getForm().findField('cost_forecast').setValue(total) ;
		me.getFormPanel().getForm().findField('cost_forecast_display').setValue(total) ;
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
			headerCmp = me.getComponent('pHeader'),
			headerEl = headerCmp.getEl() ;
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
		headerCmp.update(headerData) ;
		
		if( headerCmp.rendered ) {
			me.headerAttachEvent() ;
		} else {
			headerCmp.on('afterrender',function() {
				me.headerAttachEvent() ;
			},me) ;
		}
		
		var form = me.getFormPanel().getForm() ;
		form.setValues( data ) ;
			  
		Ext.Array.each( me.query('displayfield'), function(df) {
			if( df.displayName == 'currency' ) {
				df.setValue( data.currency ) ;
			}
		}) ;
			  
		if( data.promo_sku && me.getSkuList() ) {
			me.getSkuList().setSkuData(data.promo_sku) ;
		}
		
		me.calcLayout();
		
		me.suspendEvents = false ;
		me.evalForm() ;
		
		me.forecastCalc() ;
	},
	
	headerAttachEvent: function() {
		var me=this,
			headerCmp = me.getComponent('pHeader'),
			headerEl = headerCmp.getEl(),
			btnCloseEl = Ext.get(headerEl.query('div.op5-spec-mrfoxy-promoformheader-close')[0]) ;
		btnCloseEl.un('click',me.onHeaderClose,me) ;
		btnCloseEl.on('click',me.onHeaderClose,me) ;
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
	
	handleSubmit: function() {
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
		if( me.getSkuList() ) {
			data.promo_sku = me.getSkuList().getSkuData() ;
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
	}
	
});