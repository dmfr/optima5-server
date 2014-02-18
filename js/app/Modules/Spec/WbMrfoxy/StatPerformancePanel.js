Ext.define('Optima5.Modules.Spec.WbMrfoxy.StatPerformancePanel',{
	extend: 'Ext.panel.Panel',
	
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
			items:[
				Ext.apply(me.initHeaderCfg(),{
					width: width,
					height: 72
				}),{
					xtype:'box',
					html:'&#160;',
					height: 8
				},
				Ext.apply(me.initTabsCfg(),{
					width:width,
					height: 90
				}),{
					xtype:'box',
					html:'&#160;',
					height: 8
				},{
					xtype:'container',
					width: width,
					flex:1,
					layout:'fit',
					itemId: 'cntQueryResult'
				}
			]
		});
		
		this.callParent() ;
	},
	
	initHeaderCfg: function() {
		var headerCfg = {
			itemId: 'pHeader',
			xtype:'component',
			cls: 'op5-spec-mrfoxy-statheader',
			tpl: [
				'<div class="op5-spec-mrfoxy-statheader-wrap">',
					'<div class="op5-spec-mrfoxy-statheader-title">{title}</div>',
					'<div class="op5-spec-mrfoxy-statheader-icon {iconCls}"></div>',
					'<div class="op5-spec-mrfoxy-statheader-close"></div>',
				'</div>'
			],
			data:{
				iconCls: 'op5-spec-mrfoxy-icon-statperf',
				title: 'Performance Analysis'
			},
			listeners:{
				afterrender: function() {
					this.headerAttachEvent() ;
				},
				scope: this
			}
		} ;
		
		return headerCfg ;
	},
	initTabsCfg: function() {
		var me = this ;
		var tabsCfg = {
			xtype:'form',
			frame:true,
			bodyPadding: '2px 10px',
			style: "text-align:left", // HACK
			items:[{
				xtype:'fieldset',
				defaults: {
					anchor: '100%',
					labelWidth: 60
				},
				title: 'Query parameters',
				items:[{
					xtype:'fieldcontainer',
					fieldLabel: 'Location',
					itemId: 'cntLocation',
					layout: {
						type: 'hbox'
					},
					items:[{
						width: 200,
						xtype: 'colorcombo',
						queryMode: 'local',
						forceSelection: true,
						editable: false,
						displayField: 'country_display',
						valueField: 'country_code',
						iconUrlField: 'country_iconurl',
						store: {
							fields: ['country_code','country_display','country_iconurl'],
							data : Optima5.Modules.Spec.WbMrfoxy.HelperCache.countryGetAll()
						},
						allowBlank: false,
						name : 'country_code',
						itemId : 'country_code',
						listeners: {
							change: function() {
								me.evalForm() ;
								me.buildStorePicker() ;
							},
							scope: me
						}
					},{
						width:16,
						xtype:'box',
						html:'&#160;'
					}]
				},{
					xtype: 'op5crmbasebibletreepicker',
					anchor: '75%',
					allowBlank:false,
					rootNode: ( me.data != null ? me.data.country_code : null ),
					selectMode: 'single',
					optimaModule: me.optimaModule,
					bibleId: 'IRI_PROD',
					fieldLabel: 'Products',
					name: 'product_code',
					listeners: {
						change: function() {
							me.evalForm() ;
						},
						scope: me
					}
				}]
			}]
		} ;
		return tabsCfg ;
	},
	buildStorePicker: function() {
		var me = this,
			countryCode = me.child('form').getForm().getValues()['country_code'],
			locationCnt = me.query('#cntLocation')[0],
			pickerCfg = {
				flex:1,
				xtype: 'op5crmbasebibletreepicker',
				allowBlank:false,
				rootNode: ( countryCode != '' ? countryCode : null ),
				selectMode: 'single',
				optimaModule: me.optimaModule,
				bibleId: 'IRI_STORE',
				name: 'store_code',
				listeners: {
					change: function() {
						me.evalForm() ;
					},
					scope: me
				}
			} ;
		
		if( locationCnt.query()[2] != null ) {
			locationCnt.remove( locationCnt.query()[2] ) ;
		}
		locationCnt.add(pickerCfg) ;
	},
	
	headerAttachEvent: function() {
		var me=this,
			headerCmp = me.getComponent('pHeader'),
			headerEl = headerCmp.getEl(),
			btnCloseEl = Ext.get(headerEl.query('div.op5-spec-mrfoxy-statheader-close')[0]) ;
		btnCloseEl.un('click',me.onHeaderClose,me) ;
		btnCloseEl.on('click',me.onHeaderClose,me) ;
	},
	onHeaderClose: function(e,t) {
		var me = this ;
		me.fireEvent('quit') ;
	},
	
	evalForm: function() {
		var me = this,
			form = me.child('form').getForm() ;
		
		me.query('#cntQueryResult')[0].removeAll() ;
		//me.query('#cntQueryResult')[0].addCls('op5-waiting') ;
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_wb_mrfoxy',
				_action: 'stat_performance_getResult',
				data: Ext.JSON.encode(me.child('form').getForm().getValues())
			},
			success: function(response) {
				//me.query('#cntQueryResult')[0].removeCls('op5-waiting') ;
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == true && ajaxData.tabs != null ) {
					me.query('#cntQueryResult')[0].add( me.buildResultPanel( ajaxData.tabs[0] ) ) ;
				}
			},
			scope: me
		}) ;
	},
	buildResultPanel: function( tabData ) {
		var me = this ;
		
		Optima5.Modules.CrmBase.QueryTemplateManager.loadStyle(me.optimaModule);
		
		var getRowClassFn = function(record,index) {
			var cssClasses = [] ;
			
			if( record.get('detachedRow') ) {
				cssClasses.push('op5crmbase-detachedrow') ;
			}
			
			return cssClasses.join(' ') ;
		} ;
		
		var columns = [] ;
		var fields = [{
			name:'_rowIdx', // server-side rowIdx ( ie related to row_pivotMap )
			type:'int'
		},{
			name:'_id',     // node "_id" (not used here but server available)
			type:'string'
		},{
			name:'_tdCls',     // node "_id" (not used here but server available)
			type:'string'
		}] ;
		Ext.Array.each(tabData.columns, function(columnDef,colIdx) {
			if( columnDef.text_bold == true ) {
				columnDef.text = '<b>'+columnDef.text+'</b>' ;
			}
			if( columnDef.text_italic == true ) {
				columnDef.text = '<i>'+columnDef.text+'</i>' ;
			}
			if( columnDef.is_bold == true ) {
				Ext.apply(columnDef,{
					renderer: function(value,metaData,record) {
						if( record.get('detachedRow') ) {
							return '<i>'+value+'</i>' ;
						} else {
							return '<b>'+value+'</b>' ;
						}
					}
				}) ;
			}
			else if( columnDef.detachedColumn == true ) {
				Ext.apply(columnDef,{
					tdCls: 'op5crmbase-detachedcolumn'
				}) ;
			}
			else if( columnDef.progressColumn == true ) {
				Ext.apply(columnDef,{
					tdCls: 'op5crmbase-progresscolumn',
					renderer: function(value,meta) {
						if( value > 0 ) {
							meta.tdCls = 'op5crmbase-progresscell-pos' ;
							return '+ '+Math.abs(value) ;
						} else if( value < 0 ) {
							meta.tdCls = 'op5crmbase-progresscell-neg' ;
							return '- '+Math.abs(value) ;
						} else if( value==='' ) {
							return '' ;
						} else {
							return '=' ;
						}
					}
				}) ;
			}
			else {
				Ext.apply(columnDef,{
					tdCls: 'op5crmbase-datacolumn'
				}) ;
			}
			Ext.apply(columnDef,{
				align:''
			});
			if( !columnDef.invisible ) {
				columns.push(columnDef);
			}
			
			fields.push({
				name:columnDef.dataIndex,
				type:columnDef.dataType
			});
		},me);
			
		var tmpModelName = 'QueryResultModel-' + me.getId() ;
		//console.log('Defining a model '+tmpModelName) ;
		Ext.define(tmpModelName, {
			extend: 'Ext.data.Model',
			fields: fields
		});
		
		var tabstore = Ext.create('Ext.data.Store',{
			model:tmpModelName,
			pageSize: (tabData.data.length > 50 ? tabData.data.length : 50 ),
			//pageSize: tabData.data.length,
			buffered: true,
			remoteSort: true, // this just keeps sorting from being disabled
			data: tabData.data,
			proxy:{
				type:'memory'
			},
			
			/* 
			* Custom sort function that overrides the normal store sort function.
			* Basically this pulls all the buffered data into a MixedCollection
			* and applies the sort to that, then it puts the SORTED data back
			* into the buffered store.               
			*/                    
			sort: function(sorters) {
				var collection = new Ext.util.MixedCollection();
				collection.addAll(this.getProxy().data);
				collection.sort(sorters);
				
				this.pageMap.clear();
				this.getProxy().data = collection.getRange();
				this.load();
			}
		});
		
		var tabgrid = Ext.create('Ext.grid.Panel',{
			xtype:'grid',
			border:false,
			frame: true,
			cls:'op5crmbase-querygrid-'+me.optimaModule.sdomainId,
			columns:columns,
			store:tabstore,
			/* verticalScroller: {
				numFromEdge: 5,
				trailingBufferZone: 10,
				leadingBufferZone: 20
			},*/
			plugins: [Ext.create('Ext.ux.ColumnAutoWidthPlugin', {allColumns:true, minAutoWidth:90, singleOnly:true})],
			viewConfig: { 
				getRowClass: getRowClassFn
			}
		});
		
		return tabgrid ;
	}
	
});