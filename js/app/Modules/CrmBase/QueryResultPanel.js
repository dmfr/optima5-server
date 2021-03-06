Ext.define('Optima5.Modules.CrmBase.QueryResultPanel' ,{
	extend: 'Ext.panel.Panel',
			  
	requires: [
		'Optima5.Modules.CrmBase.QueryTemplateManager',
		'Ext.ux.dams.IFrameContent',
		'Ext.ux.ColumnAutoWidthPlugin',
		'Ext.ux.AddTabButton',
		'Optima5.Modules.CrmBase.QueryResultChartPanelStatic',
		'Optima5.Modules.CrmBase.QueryResultChartPanelSingle',
		'Optima5.Modules.CrmBase.QueryResultChartPanelMixed'
	],
			  
	ajaxBaseParams:{},
	ajaxResponse:null,
	RES_id: '',
	activeCssId: null,
	
	chartsVisible : false,
	chartsDisabled: false,
			  
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:QueryPanel','No module reference ?') ;
		}
		if( me.RES_id ) {
			Ext.apply(me.ajaxBaseParams,{
				RES_id: me.RES_id
			});
			if( me.qbook_ztemplate_ssid ) {
				Ext.apply(me.ajaxBaseParams,{
					qbook_ztemplate_ssid: me.qbook_ztemplate_ssid
				});
			}
		}
		
		Ext.apply( me, {
			border:false,
			layout: 'border',
			autoDestroy: true,
			items:[{
				xtype:'box',
				cls:'op5-waiting',
				flex:1
			}],
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'top',
				items: [{
					itemId: 'exportexcel',
					text: 'Export Excel',
					icon: 'images/op5img/ico_save_16.gif',
					handler: me.exportExcel,
					scope:me
				},{
					itemId: 'kchart',
					hidden: true,
					text: 'Charts/Graphs',
					iconCls: 'op5-crmbase-qresultmenu-kchart',
					menu:[{
						itemId: 'enabled',
						text: 'Charting enabled',
						checked: false,
						listeners: {
							checkchange: function( ci, checked ) {
								this.setChartsVisible( checked ) ;
							},
							scope: me
						}
					},{
						itemId: 'separator',
						xtype: 'menuseparator'
					},{
						itemId: 'save',
						text: 'Save defined charts',
						iconCls: 'op5-crmbase-qresultmenu-save',
						handler: function() {
							this.chartsDoSave() ;
						},
						scope:me
					},{
						itemId: 'delete',
						text: 'Delete all charts',
						iconCls: 'op5-crmbase-qresultmenu-delete',
						handler: function() {
							Ext.Msg.confirm('Remove charts', 'Discard configured charts ?', function(btn){
								if( btn == 'yes' ) {
									this.chartsDoDelete() ;
								}
							},this) ;
						},
						scope:me
					}]
				}]
			}]
		}) ;
		this.callParent() ;
		this.on('destroy',function() {
			if( this.activeCssId != null ) {
				//console.log('removing CSS '+this.activeCssId) ;
				Ext.util.CSS.removeStyleSheet( this.activeCssId ) ;
			}
		},this) ;
		
		Optima5.Modules.CrmBase.QueryTemplateManager.loadStyle(me.optimaModule);
		
		/*
		 * Query grid RESULTS
		 */
		var ajaxParams = {} ;
		Ext.apply(ajaxParams,me.ajaxBaseParams) ;
		Ext.apply(ajaxParams,{
			_subaction:'res_get'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					me.destroy() ;
				}
				else {
					me.ajaxResponse = Ext.decode(response.responseText) ;
					me.initAddToolbar( me.ajaxResponse ) ;
					if( me.ajaxResponse.tabs ) {
						me.initAddTabs( me.ajaxResponse ) ;
					} else if( me.ajaxResponse.html ) {
						me.initAddHtml( me.ajaxResponse ) ;
					}
				}
			},
			scope: me
		});
	},
	initAddToolbar:function( ajaxData ){
		var dockedTopToolbar = this.query('toolbar')[0] ;
	},
	initAddHtml: function( ajaxData ) {
		var me = this ;
		me.removeAll() ;
		me.add(Ext.create('Ext.ux.dams.IFrameContent',{
			content:ajaxData.html
		})) ;
	},
	initAddTabs:function( ajaxData ){
		var me = this ;
		
		/*
		 * Apply CSS style to grid Rows
		 * (NB: "this" context = Ext.view.Table )
		 */
		var getRowClassFn = function(record,index) {
			var cssClasses = [] ;
			
			var rowIdx = record.get('_rowIdx'),
				color = ( this.colorMapObj==null ? null : this.colorMapObj[rowIdx] ) ;
			if( color != null ) {
				cssClasses.push('op5-crmbase-qresult-kchart-rowserie') ;
				cssClasses.push('ux-grid-row-bk-'+color) ;
			}
			
			if( record.get('detachedRow') ) {
				cssClasses.push('op5crmbase-detachedrow') ;
			}
			
			return cssClasses.join(' ') ;
		} ;
		
		var tabitems = new Array() ;
		var columns = null ;
		var fields = null ;
		var tabCount = -1 ;
		Ext.Array.each( ajaxData.tabs , function(tabData) {
			tabCount++ ;
			
			if( tabData.html ) {
				tabitems.push( Ext.create('Ext.ux.dams.IFrameContent',{
					title:tabData.tab_title,
					content:tabData.html
				}) ) ;
				return true ;
			}
			
			columns = [] ;
			fields = [{
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
			
			
			var tmpModelName = 'QueryResultModel-' + me.ajaxBaseParams._transaction_id + '-' + me.RES_id + '-' + tabCount ;
			//console.log('Defining a model '+tmpModelName) ;
			Ext.define(tmpModelName, {
				extend: 'Ext.data.Model',
				fields: fields
			});
			
			if( tabData.cfg_doTreeview && tabData.data_root ) {
				Ext.apply( columns[0], {
					xtype: 'treecolumn'
				}) ;
				
				var tabgrid = Ext.create('Ext.tree.Panel',{
					border:false,
					cls:'op5crmbase-querygrid-'+me.optimaModule.sdomainId,
					tmpModelName: tmpModelName,
					store: {
						model: tmpModelName,
						nodeParam: '_id',
						folderSort: true,
						root: tabData.data_root,
						clearOnLoad: true
					},
					useArrows: false,
					rootVisible: true,
					multiSelect: false,
					singleExpand: false,
					// viewConfig:{toggleOnDblClick: false},
					columns: columns,
					//plugins: [Ext.create('Ext.ux.ColumnAutoWidthPlugin', {allColumns:true, minAutoWidth:90, singleOnly:true})],
					listeners: {
						itemcontextmenu: me.onRowRightClick,
						scope:me
					},
					viewConfig: { 
						//stripeRows: false,
						preserveScrollOnRefresh: true,
						listeners: {
							beforerefresh: function(view) {
								var treePanel = view.up('treepanel') ;
								me.onBeforeGridRefresh( treePanel ) ;
							},
							scope: me
						},
						getRowClass: getRowClassFn
					}
				}) ;
				
			} else {
				var tabgrid = Ext.create('Ext.grid.Panel',{
					xtype:'grid',
					border:false,
					cls:'op5crmbase-querygrid-'+me.optimaModule.sdomainId,
					columns:columns,
					tmpModelName: tmpModelName,
					store:{
						model:tmpModelName,
						data: tabData.data,
						proxy:{
							type:'memory'
						}
					},
					listeners: {
						itemcontextmenu: me.onRowRightClick,
						scope:me
					},
					plugins: [
						//Ext.create('Ext.ux.ColumnAutoWidthPlugin', {allColumns:true, minAutoWidth:90, singleOnly:true}),
					{
						ptype: 'bufferedrenderer'
					}],
					viewConfig: { 
						//stripeRows: false,
						listeners: {
							beforerefresh: function(view) {
								var gridPanel = view.up('gridpanel') ;
								me.onBeforeGridRefresh( gridPanel ) ;
							},
							scope: me
						},
						getRowClass: getRowClassFn
					}
				});
			}
			
			tabgrid.on('destroy',function(tabgrid){
				Ext.ux.dams.ModelManager.unregister( tabgrid.tmpModelName ) ;
			},me);
			
			tabgrid.getView().headerCt.on('menucreate',me.onColumnsMenuCreate,me) ;
			
			if( tabData.SQL_debug ) {
				Ext.apply(tabgrid,{
					region:'center',
					flex:1
				}) ;
				var tabitem = {
					xtype:'panel',
					layout:'border',
					title:tabData.tab_title,
					border:false,
					isTabItem: true,
					items:[tabgrid,{
						xtype:'panel',
						region:'north',
						collapsible:true,
						collapsed: ( tabData.SQL_debug.sql_error ? false : true ),
						height: ( tabData.SQL_debug.sql_error ? '100%' : 300 ),
						border:true,
						split:true,
						layout:'fit',
						//title: 'Charts',
						title: 'SQL debug',
						scrollable: 'vertical',
						items:[{
							xtype: 'component',
							tpl: [
								'<div style="padding:10px">',
									'<b>Executed query :</b><br>',
									'{sql_query}',
									'<br>','<br>',
									'<tpl if="sql_error">',
										'<font color="red">',
										'<b>Error :</b><br>',
										'{sql_error}',
										'</font>',
										'<br>','<br>',
									'</tpl>',
								'</div>'
							],
							data: tabData.SQL_debug
						}]
					}]
				}
				tabitems.push(tabitem);
				return true ;
			}
			if( tabData.RESchart_static ) {
				Ext.apply(tabgrid,{
					region:'center',
					flex:1
				}) ;
				var tabitem = {
					xtype:'panel',
					layout:'border',
					title:tabData.tab_title,
					border:false,
					isTabItem: true,
					items:[tabgrid,{
						xtype:'panel',
						region:'south',
						collapsible:true,
						flex:1,
						border:false,
						split:true,
						layout:'fit',
						//title: 'Charts',
						items:[{
							xtype: 'op5crmbasequeryresultchartstatic',
							optimaModule: me.optimaModule,
							ajaxBaseParams: me.ajaxBaseParams,
							RESchart_static: tabData.RESchart_static
						}]
					}]
				}
				tabitems.push(tabitem);
				return true ;
			}
			Ext.apply(tabgrid,{
				title:tabData.tab_title,
				isTabItem: true
			}) ;
			tabitems.push(tabgrid);
			return true ;
		},me) ;
		
		var pResult ;
		if( tabitems.length==1 && ( tabitems[0].title=='' || tabitems[0].title=='' ) ) {
			pResult = tabitems[0] ;
			delete(pResult['title']) ;
		} else {
			pResult = {
				xtype:'tabpanel' ,
				activeTab: 0,
				items: tabitems,
				listeners:{
					tabchange: me.onResultTabChange,
					scope: me
				}
			} ;
		}
		Ext.apply(pResult,{
			itemId: 'pResult',
			//frame: true,
			region:'center',
			flex:1,
			border:false
		}) ;
		
		me.removeAll() ;
		me.add(pResult,{
			xtype:'tabpanel',
			region:'south',
			itemId: 'pCharts',
			flex: 1,
			split:true,
			title: 'Charts',
			hidden:true,
			collapsible: true,
			defaults:{
				listeners: {
					serieschanged: me.onChartSeriesChange,
					scope:me
				}
			},
			plugins:[{ 
				ptype: 'AddTabButton', 
				iconCls: 'icon-add', 
				toolTip: 'New empty chart',
				panelConfig: {
					xtype: 'op5crmbasequeryresultchartsingle',
					optimaModule: me.optimaModule,
					ajaxBaseParams: me.ajaxBaseParams,
					chartCfgRecord: null
				}
			}],
			listeners:{
				/*
				* Attach listeners to pCharts to monitor visibility/tabchange
				* => triggers pResult view refresh ( show series )
				*/
				show:me.onChartsVisibilityChange,
				hide:me.onChartsVisibilityChange,
				collapse:me.onChartsVisibilityChange,
				expand:me.onChartsVisibilityChange,
				tabchange:me.onChartsVisibilityChange,
				scope:me,
				
				/*
				* Attach managed listener to pCharts tabBar (right click)
				*/
				afterlayout:{
					fn: function(p) {
						this.mon( p.getTabBar().el, {
							contextmenu: this.onTabChartRightClick, 
							scope: this,
							delegate: 'a.x-tab'
						}) ;
					},
					scope: this,
					single: true
				}
			}
		}) ;
		
		if( ajaxData.disable_charts == true ) {
			me.disableCharts() ;
			return ;
		}
		
		var kchartBtn = me.query('toolbar')[0].child('#kchart') ;
		kchartBtn.setVisible(true) ;
		/*
		 * Query charts configuration (server-side charts cfg , if any)
		 */
		var ajaxParams = {} ;
		Ext.apply(ajaxParams,me.ajaxBaseParams) ;
		Ext.apply(ajaxParams,{
			_subaction:'chart_cfg_load'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == true ) {
					ajaxCharts = Ext.decode(response.responseText) ;
					me.initLoadCharts( ajaxCharts ) ;
				}
			},
			scope: me
		});
	},
	initLoadCharts: function( ajaxCharts ) {
		var me = this,
			enabled = ajaxCharts.enabled,
			arr_QueryResultChartModel = (enabled ? ajaxCharts.arr_QueryResultChartModel : []) ;
		if( !enabled ) {
			me.setChartsVisible(false);
			return ;
		}
		var i=0,
			chartsLn = arr_QueryResultChartModel.length,
			queryResultChartModel = null,
			pCharts = me.child('#pCharts') ;
			pChartsItems = [] 
			
		for( ; i < chartsLn ; i++ ) {
			queryResultChartModel = arr_QueryResultChartModel[i] ;
			
			pChartsItems.push({
				xtype:'op5crmbasequeryresultchartsingle',
				optimaModule: me.optimaModule,
				ajaxBaseParams: me.ajaxBaseParams,
				chartCfgRecord: Ext.ux.dams.ModelManager.create('QueryResultChartModel',queryResultChartModel)
			});
		}
		pCharts.removeAll() ;
		pCharts.add(pChartsItems) ;
		pCharts.setActiveTab(0) ;
		me.setChartsVisible(true);
		me.chartsEvalMixed() ;
	},
	getActiveResultPanel: function() {
		var me = this,
			pResult = me.child('#pResult') ;
		return (pResult.isXType('tabpanel') ? pResult.getActiveTab() : pResult) ;
	},
	getMapGroupsForPanel: function(rPanel) {
		var me = this,
			pResult = me.child('#pResult'),
			tabIndex = (pResult.isXType('tabpanel') ? pResult.items.indexOf(rPanel) : 0) ,
			mapGroups = me.ajaxResponse.tabs[tabIndex].MAP_groups ;
		//console.dir(mapGroups) ;
		return mapGroups ;
	},
	getPivotForRow: function(rPanel,rowRecord) {
		var me = this,
			pResult = me.child('#pResult'),
			tabIndex = (pResult.isXType('tabpanel') ? pResult.items.indexOf(rPanel) : 0) ,
			mapGroups = me.ajaxResponse.tabs[tabIndex].MAP_groups,
			rowIdx = rowRecord.get('_rowIdx'),
			rowPivot = mapGroups.row_pivotMap[rowIdx] ;
		
		if( rowPivot == null ) {
			return null ;
		}
		var rowPivotGroups = Ext.clone(rowPivot) ;
		delete(rowPivotGroups['=']) ;
		return rowPivotGroups ;
	},
	getSelectidsForRow: function(rPanel,rowRecord) {
		var me = this,
			pResult = me.child('#pResult'),
			tabIndex = (pResult.isXType('tabpanel') ? pResult.items.indexOf(rPanel) : 0) ,
			mapGroups = me.ajaxResponse.tabs[tabIndex].MAP_groups,
			rowIdx = rowRecord.get('_rowIdx'),
			rowPivot = mapGroups.row_pivotMap[rowIdx] ;
		
		if( rowPivot == null ) {
			return null ;
		}
		return rowPivot['='] ;
	},
	getPivotForColumn: function(rPanel,columnDataIndex) {
		var me = this,
			pResult = me.child('#pResult'),
			tabIndex = (pResult.isXType('tabpanel') ? pResult.items.indexOf(rPanel) : 0) ,
			mapGroups = me.ajaxResponse.tabs[tabIndex].MAP_groups,
			colPivot = mapGroups.col_pivotMap[columnDataIndex] ;
		
		if( colPivot == null ) {
			return null ;
		}
		var colPivotGroups = Ext.clone(colPivot) ;
		delete(colPivotGroups['=']) ;
		return colPivotGroups ;
	},
	getSelectidsForColumn: function(rPanel,columnDataIndex) {
		var me = this,
			pResult = me.child('#pResult'),
			tabIndex = (pResult.isXType('tabpanel') ? pResult.items.indexOf(rPanel) : 0) ,
			mapGroups = me.ajaxResponse.tabs[tabIndex].MAP_groups,
			colPivot = mapGroups.col_pivotMap[columnDataIndex] ;
		
		if( colPivot == null ) {
			return null ;
		}
		return colPivot['='] ;
	},
	getIterationsForRows: function(rPanel) {
		var me = this,
			pResult = me.child('#pResult'),
			tabIndex = (pResult.isXType('tabpanel') ? pResult.items.indexOf(rPanel) : 0) ,
			mapGroups = me.ajaxResponse.tabs[tabIndex].MAP_groups ;
			
		return mapGroups.col_iterations ;
	},
	getIterationsForColumns: function(rPanel) {
		var me = this,
			pResult = me.child('#pResult'),
			tabIndex = (pResult.isXType('tabpanel') ? pResult.items.indexOf(rPanel) : 0) ,
			mapGroups = me.ajaxResponse.tabs[tabIndex].MAP_groups ;
		
		return mapGroups.row_iterations ;
	},
	disableCharts: function() {
		var me = this,
			kchartBtn = me.query('toolbar')[0].child('#kchart') ;
		kchartBtn.setVisible(false) ;
		me.chartsVisible = false ;
		me.setChartsVisible(false) ;
	},
	setChartsVisible: function(torf) {
		/* Components to hide/show :
		 * - main toolbar's kchart checkbox + menu items
		 * - docked (south) chart panel
		 */
		var me = this,
			kchartMenu = me.query('toolbar')[0].child('#kchart').menu,
			chartTabPanel = me.child('#pCharts') ;
		
		torf = ( me.chartsDisabled ? false : torf ) ;
		
		me.chartsVisible = torf ;
		kchartMenu.items.each( function(menuitem) {
			switch( menuitem.itemId ) {
				case 'enabled' :
					menuitem.setChecked(torf) ;
					break ;
					
				case 'separator' :
				case 'save' :
				case 'delete':
					menuitem.setVisible(torf) ;
					break ;
			}
		},me) ;
		chartTabPanel.setVisible(torf) ;
	},
	exportExcel: function(){
		var me = this ;
		
		var ajaxParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(ajaxParams,me.ajaxBaseParams) ;
		Ext.apply(ajaxParams,{
			_subaction:'exportXLS'
		});
		
		
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: ajaxParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;		
	},
	
	onChartsVisibilityChange: function() {
		var me = this ;
		//console.log('onChartsVisibilityChange') ;
		me.getActiveResultPanel().getView().refresh() ;
	},
	onChartSeriesChange: function() {
		var me = this ;
		//console.log('onChartSeriesChange') ;
		me.getActiveResultPanel().getView().refresh() ;
	},
	onResultTabChange: function(tPanel, rPanel, oldRPanel) {
		var me = this ;
		//console.log('onResultTabChange') ;
		if( rPanel instanceof Ext.panel.Table ) {
			rPanel.getView().refresh() ;
		}
	},
	
	onBeforeGridRefresh: function( rPanel ) {
		//console.log('onBeforeGridRefresh') ;
		var me = this,
			chartPanel = me.getActiveChartPanel(),
			cssId = 'cssId-'+me.getId() ;
		
		var me = this,
			pResult = me.child('#pResult'),
			rPanelUp = (rPanel.isTabItem ? rPanel : rPanel.up()) ;
			tabIndex = (pResult.isXType('tabpanel') ? pResult.items.indexOf(rPanelUp) : 0) ,
			mapGroups = me.ajaxResponse.tabs[tabIndex].MAP_groups,
			rowsColorMapObj={},
			colsColorMapObj={} ;
		if( mapGroups == null ) {
			return ;
		}
		
		Ext.Array.each( me.ajaxResponse.tabs[tabIndex].data, function(rec) {
			var rowIdx = rec['_rowIdx'] ,
				rowPivot = mapGroups.row_pivotMap[rowIdx],
				rowPivotGroups, 
				rowSelectIds,
				color ;
				
			if( rowPivot != null ) {
				rowPivotGroups = Ext.clone(rowPivot) ;
				delete(rowPivotGroups['=']) ;
				rowSelectIds = rowPivot['='] ;
			}
			color = ( (chartPanel!=null && rowPivot!=null) ? chartPanel.getPivotColor( rowPivotGroups, rowSelectIds ) : null ) ;
			if( color != null ) {
				rowsColorMapObj[rowIdx] = color ;
			}
		},me) ;
		rPanel.getView().colorMapObj = rowsColorMapObj ;
		
		rPanel.getView().headerCt.items.each( function(col) {
			var colDataIndex = col.dataIndex,
				colPivot = mapGroups.col_pivotMap[colDataIndex],
				colPivotGroups,
				colSelectIds,
				color ;
			
			if( colPivot != null ) {
				colPivotGroups = Ext.clone(colPivot) ;
				delete(colPivotGroups['=']) ;
				colSelectIds = colPivot['='] ;
			}
			color = ( (chartPanel!=null && colPivot!=null) ? chartPanel.getPivotColor( colPivotGroups, colSelectIds ) : null ) ;
			if( color != null ) {
				colsColorMapObj[colDataIndex] = color ;
				if( !col.tdClsOrig ) {
					col.tdClsOrig = col.tdCls ;
				}
				col.tdCls += ' ' + 'ux-grid-cell-bk-' + color ;
				col.addCls('op5-crmbase-qresult-kchart-colserie') ;
			} else {
				if( col.tdClsOrig != null ) {
					col.tdCls = col.tdClsOrig ;
					delete( col.tdClsOrig ) ;
				}
				col.removeCls('op5-crmbase-qresult-kchart-colserie') ;
			}
		},me) ;
		
		// ajust CSS styles to highlight selected series
		var cssBlob = '' ;
		Ext.Object.each( rowsColorMapObj, function(k,v) {
			cssBlob += ".ux-grid-row-bk-"+v+" .x-grid-cell { background-color: #"+v+" !important ; }\r\n" ;
		},me) ;
		Ext.Object.each( colsColorMapObj, function(k,v) {
			cssBlob += ".ux-grid-cell-bk-"+v+" { background-color: #"+v+" !important ; }\r\n" ;
		},me) ;
		if( this.activeCssId != null ) {
			Ext.util.CSS.removeStyleSheet( cssId ) ;
			this.activeCssId = null ;
		}
		Ext.util.CSS.createStyleSheet( cssBlob, this.activeCssId=cssId ) ;
	},
	
	onColumnsMenuCreate: function( headerCt, menu ) {
		var me = this;
		menu.on('beforeshow', me.onColumnsMenuBeforeShow, me);
	},
	onColumnsMenuBeforeShow: function( menu ) {
		var me = this,
			columnDataIndex = menu.activeHeader.dataIndex,
			rPanel = menu.up('tablepanel'),
			chartPanel = me.getActiveChartPanel() ;
			
		if( !menu.child('#chrt-btn-add') ) {
			menu.add('-') ;
			menu.add({
				itemId: 'chrt-btn-disabled',
				iconCls: 'op5-crmbase-qresult-warning',
				text: 'Cannot add to chart',
				disabled: true
			});
			menu.add({
				itemId: 'chrt-btn-add',
				iconCls: 'op5-crmbase-qresult-kchart-add' ,
				text: '&#160;',
				handler: null,
				menu:[]
			});
			menu.add({
				itemId: 'chrt-btn-delete',
				iconCls: 'op5-crmbase-qresult-kchart-remove' ,
				text: 'Remove from chart',
				handler: function( menuitem ) {
					Ext.callback( menuitem.handlerFn , me, arguments ) ;
					Ext.menu.Manager.hideAll();
				}
			});
		}
		
		
		var menuSeparator = menu.query('menuseparator')[1],
			  menuItemAdd = menu.child('#chrt-btn-add'),
			  menuItemDel = menu.child('#chrt-btn-delete'),
			  menuItemDis = menu.child('#chrt-btn-disabled') ;
		
		if( !(me.chartsVisible) ) {
			menuSeparator.setVisible(false) ;
			menuItemAdd.setVisible(false) ;
			menuItemDel.setVisible(false) ;
			menuItemDis.setVisible(false) ;
			return ;
		}
		
		
		/*
		 * Show context items for Charts IF :
		 * - column type is group ( != label ), ie has pivotMap entry
		 * - panel is type GRID ( tree uses areastacked on nodes )
		 * - only one iteration on ROWS
		 * - charting is enabled + current chart panel != null + current chart panel compatible
		 */
		
		var colPivot = me.getPivotForColumn(rPanel,columnDataIndex),
			  colSelectIds = me.getSelectidsForColumn(rPanel,columnDataIndex),
			  colIterations = me.getIterationsForColumns(rPanel) ;
			  colIteration  = ( colIterations.length == 1 ? colIterations[0] : null ) ;
			  
		if( !(me.chartsVisible)
			|| !(rPanel instanceof Ext.grid.Panel)
			|| !(colPivot) ) {
			menuSeparator.setVisible(false) ;
			menuItemAdd.setVisible(false) ;
			menuItemDel.setVisible(false) ;
			menuItemDis.setVisible(false) ;
			return ;
		}
		
		if( !chartPanel ) {
			menuSeparator.setVisible(true) ;
			menuItemAdd.setVisible(false) ;
			menuItemDel.setVisible(false) ;
			menuItemDis.setText('No defined charts below') ;
			menuItemDis.setVisible(true) ;
			return ;
		}
		
		if( !(colIteration) || !(chartPanel.testChartIteration(colIteration)) || (colSelectIds.length != 1) ) {
			menuSeparator.setVisible(true) ;
			menuItemAdd.setVisible(false) ;
			menuItemDel.setVisible(false) ;
			menuItemDis.setText('Cannot add serie to chart') ;
			menuItemDis.setVisible(true) ;
			return ;
		}
		
		
		var existingSerie = (chartPanel.searchPivot(colPivot,colSelectIds) != null) ;
		
		if( !me.chartColorPicker ) {
			me.chartColorPicker = Ext.create('Ext.menu.Menu',{
				layout:'fit',
				items:[{
					xtype:'colorpicker',
					handler: function(picker, color) {
						Ext.callback( picker.handlerFn , me, arguments ) ;
						Ext.menu.Manager.hideAll();
					},
					scope:me
				}]
			});
		}
		var colorPickerMenu = me.chartColorPicker,
			colorPicker = colorPickerMenu.child('colorpicker') ;
		colorPicker.select( '000000', true ) ;
		colorPicker.handlerFn = function(picker, color) {
			me.onChartAddColumn( rPanel, colPivot, colSelectIds[0], color ) ;
			Ext.menu.Manager.hideAll();
		} ;
		menuItemAdd.menu = colorPickerMenu ;
		
		menuItemDel.handlerFn = function() {
			me.onChartRemoveColumn( rPanel, colPivot, colSelectIds[0] ) ;
			Ext.menu.Manager.hideAll();
		} ;
		
		menu.query('menuseparator')[1].setVisible(true) ;
		menuItemAdd.setText( (existingSerie ? 'Change serie color' : 'Add serie to chart') ) ;
		menuItemAdd.setVisible(true) ;
		menuItemDel.setVisible(existingSerie) ;
		menuItemDis.setVisible(false) ;
	},
	
	onRowRightClick: function(rPanelView,record,targetElement,index,event) {
		var me = this,
			rPanel = rPanelView.up('tablepanel'),
			chartPanel = me.getActiveChartPanel() ;
			
		if( !(me.chartsVisible) ) {
			return ;
		}
		
		var rowPivot = me.getPivotForRow(rPanel,record),
			  rowSelectIds = me.getSelectidsForRow(rPanel,record),
			  rowIterations = me.getIterationsForRows(rPanel) ;
			  rowIteration   = ( rowIterations.length == 1 ? rowIterations[0] : null ) ;
			  
		if( !(me.chartsVisible) || !(rowPivot) ) {
			return ;
		}
		
		var gridContextMenuItems = [] ;
		
		if( !chartPanel ) {
			gridContextMenuItems.push({
				iconCls: 'op5-crmbase-qresult-warning',
				text: 'No defined charts below',
				disabled: true
			});
		} else if( !(rowIteration) || !(chartPanel.testChartIteration(rowIteration)) || (rowSelectIds.length != 1) ) {
			gridContextMenuItems.push({
				iconCls: 'op5-crmbase-qresult-warning',
				text: 'Cannot add serie to chart',
				disabled: true
			});
		} else {
			var existingSerie = (chartPanel.searchPivot(rowPivot,rowSelectIds) != null) ;
			
			if( chartPanel.isEmpty() && rPanel.getXType()=='treepanel' ) {
				gridContextMenuItems.push({
					iconCls: 'op5-crmbase-qresult-chart-areastacked' ,
					text: 'Add child nodes to chart',
					handler: function(){}
				});
			}
			gridContextMenuItems.push({
				iconCls: 'op5-crmbase-qresult-kchart-add' ,
				text: (existingSerie ? 'Change serie color' : 'Add serie to chart'),
				menu: Ext.create('Ext.menu.Menu',{
					layout:'fit',
					items:[{
						xtype:'colorpicker',
						value:'000000',
						handler: function(picker, color) {
							me.onChartAddRow( rPanel, rowPivot, rowSelectIds[0], color ) ;
							Ext.menu.Manager.hideAll();
						},
						scope:me
					}]
				}),
				handler: function(){}
			});
			if( existingSerie ) {
				gridContextMenuItems.push({
					iconCls: 'op5-crmbase-qresult-kchart-remove' ,
					text: 'Remove from chart',
					handler: function() {
						me.onChartRemoveRow( rPanel, rowPivot, rowSelectIds[0] ) ;
					},
					scope: me
				});
			}
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
	
	
	onTabChartRightClick: function(event, targetElement) {
		var me = this,
			tabBar = me.child('#pCharts').getTabBar()
			tab = tabBar.getChildByElement(targetElement),
			tabIndex = tabBar.items.indexOf(tab),
			cPanel = me.getChartPanelAtIndex(tabIndex) ;
			
		var menuItems ;
		switch( cPanel.getXType() ) {
			case 'op5crmbasequeryresultchartsingle' :
				menuItems = [{
					text: 'Rename to',
					handler: null,
					menu: {
						items:[{
							xtype:'textfield' ,
							value: tab.getText(),
							width:150
						},{
							xtype:'button',
							text:'Ok',
							handler: function(button) {
								var textfield = button.up('menu').query('textfield')[0],
									textValue = textfield.getValue() ;
								me.getChartPanelAtIndex(tabIndex).setChartName(textValue) ;
								Ext.menu.Manager.hideAll();
							},
							scope:me
						}]
					}
				},{
					xtype: 'menuseparator'
				},{
					text: 'Area stacked',
					itemId: 'sChartAreaStacked',
					iconCls: 'op5-crmbase-qresult-chart-areastacked'
				},{
					text: 'Bar chart',
					itemId: 'sChartBar',
					iconCls: 'op5-crmbase-qresult-chart-bar'
				},{
					text: 'Line chart',
					itemId: 'sChartLine',
					iconCls: 'op5-crmbase-qresult-chart-line'
				},{
					text: 'Pie chart',
					itemId: 'sChartPie',
					iconCls: 'op5-crmbase-qresult-chart-pie'
				},{
					text: 'Pie chart (swap-series)',
					itemId: 'sChartPieSwap',
					iconCls: 'op5-crmbase-qresult-chart-pieswap'
				},{
					xtype: 'menuseparator'
				},{
					text: 'Remove all series',
					itemId: 'removeSeries',
					hidden: cPanel.isEmpty(),
					iconCls: 'op5-crmbase-qresult-removeseries'
				},{
					text: 'Delete chart',
					itemId: 'delete',
					iconCls: 'op5-crmbase-qresult-deletechart'
				},{
					xtype: 'menuseparator'
				},{
					text: 'on Mixed chart',
					itemId: 'mixed',
					handler: null,
					menu:{
						defaults: {
							listeners: {
								checkchange: function(menuItem, checked) {
									menuItem.up().items.each(function(menuItemOther) {
										if( checked && menuItemOther != menuItem ) {
											menuItemOther.setChecked(false) ;
										}
									}) ;
									me.onTabChartMenuMixedcfgChange( tabIndex, menuItem.itemId, checked ) ;
								},
								scope: me
							}
						},
						items: [{
							text: 'Y-<b>left</b> serie',
							itemId: 'cbMixedchartYleft',
							checked: ( cPanel.getTomixedAxis() == 'left' )
						},{
							text: 'Y-<b>right</b> serie',
							itemId: 'cbMixedchartYright',
							checked: ( cPanel.getTomixedAxis() == 'right' )
						}]
					}
				}] ;
				break ;
			case 'op5crmbasequeryresultchartmixed' :
				menuItems = [{
					text: 'Reset mixed series',
					itemId: 'clearMixed',
					iconCls: 'op5-crmbase-qresult-removeseries'
				}] ;
				break ;
		}
		/*
		 * Builds and displays a context menu for current chart
		 * - destroy chart
		 * - change chart type (query available types ?)
		 * - rename chart
		 */
		var menu = Ext.create('Ext.menu.Menu',{
			defaults: {
				handler: function(menuItem) {
					me.onTabChartMenuItemClick( tabIndex, menuItem.itemId ) ;
				},
				scope: me
			},
			items: menuItems,
			listeners: {
				hide: function(menu) {
					Ext.defer(function(){menu.destroy();},10) ;
				}
			}
		}) ;
		event.preventDefault();
		menu.items.each( function(menuitem) {
			var menuItemId = menuitem.itemId,
				cPanelType = ((cPanel != null && cPanel.getXType()=='op5crmbasequeryresultchartsingle') ? cPanel.getChartType() : '') ;
			if( (menuItemId!=null) && (menuItemId.indexOf('sChart') === 0) && (cPanel != null) ) {
				switch( menuItemId ) {
					case 'sChartAreaStacked' :
						targetChartType = 'areastacked' ;
						break ;
					case 'sChartBar' :
						targetChartType = 'bar' ;
						break ;
					case 'sChartLine' :
						targetChartType = 'line' ;
						break ;
					case 'sChartPie' :
						targetChartType = 'pie' ;
						break ;
					case 'sChartPieSwap' :
						targetChartType = 'pieswap' ;
						break ;
				}
				if( targetChartType == cPanelType ) {
					menuitem.addCls('op5-crmbase-menuitem-boldunderline') ;
				}
			}
		},me) ;
		menu.showAt(event.getXY());
	},
	onTabChartMenuItemClick: function( tabIndex, menuItemId ) {
		var me = this ;
		if( menuItemId == 'delete' ) {
			me.handleDeleteChartPanelAtIndex(tabIndex) ;
			return ;
		}
		if( menuItemId == 'removeSeries' ) {
			me.getChartPanelAtIndex(tabIndex).doEmpty() ;
			return ;
		}
		if( menuItemId == 'clearMixed' ) {
			me.child('#pCharts').items.each( function(chartPanel) {
				if( chartPanel.getXType() == 'op5crmbasequeryresultchartsingle' ) {
					chartPanel.setTomixedCfg( false, null ) ;
				}
			});
			me.chartsEvalMixed() ;
			return ;
		}
		if( menuItemId.indexOf('sChart') === 0 ) {
			var targetChartType = '' ;
			switch( menuItemId ) {
				case 'sChartAreaStacked' :
					targetChartType = 'areastacked' ;
					break ;
				case 'sChartBar' :
					targetChartType = 'bar' ;
					break ;
				case 'sChartLine' :
					targetChartType = 'line' ;
					break ;
				case 'sChartPie' :
					targetChartType = 'pie' ;
					break ;
				case 'sChartPieSwap' :
					targetChartType = 'pieswap' ;
					break ;
			}
			me.getChartPanelAtIndex(tabIndex).setChartType(targetChartType) ;
			return ;
		}
	},
	onTabChartMenuMixedcfgChange: function( tabIndex, menuItemId, checked ) {
		var me = this,
			chartPanel = me.getChartPanelAtIndex(tabIndex),
			axis ;
		switch( menuItemId ) {
			case 'cbMixedchartYleft':
				axis = 'left' ;
				break ;
			case 'cbMixedchartYright' :
				axis = 'right' ;
				break ;
		}
		chartPanel.setTomixedCfg(checked, axis) ;
		me.chartsEvalMixed() ;
	},
	
	onChartAddColumn: function( rPanel, colPivot, dataSelectId, color ) {
		var me = this,
			chartPanel = me.getActiveChartPanel(),
			colIteration = me.getIterationsForColumns(rPanel)[0] ;
		if( !chartPanel || !colIteration ) {
			return ;
		}
		chartPanel.defineChartIteration( colIteration ) ;
		chartPanel.addPivot( color, colPivot, dataSelectId ) ;
	},
	onChartRemoveColumn: function( rPanel, colPivot, dataSelectId ) {
		var me = this,
			chartPanel = me.getActiveChartPanel() ;
		if( !chartPanel ) {
			return ;
		}
		chartPanel.removePivot( colPivot, dataSelectId ) ;
	},
	onChartAddRow: function( rPanel, rowPivot, dataSelectId, color ) {
		var me = this,
			chartPanel = me.getActiveChartPanel(),
			rowIteration = me.getIterationsForRows(rPanel)[0] ;
		if( !chartPanel || !rowIteration ) {
			return ;
		}
		chartPanel.defineChartIteration( rowIteration ) ;
		chartPanel.addPivot( color, rowPivot, dataSelectId ) ;
	},
	onChartRemoveRow: function( rPanel, rowPivot, dataSelectId ) {
		var me = this,
			chartPanel = me.getActiveChartPanel() ;
		if( !chartPanel ) {
			return ;
		}
		chartPanel.removePivot( rowPivot, dataSelectId ) ;
	},
	onChartAddNodeRow: function() {
		
	},
	getActiveChartPanel: function() {
		var me = this,
			pCharts = me.child('#pCharts') ;
		return ( (me.chartsVisible && pCharts.getActiveTab() && pCharts.getActiveTab().getXType()=='op5crmbasequeryresultchartsingle') ? pCharts.getActiveTab() : null ) ;
	},
	getChartPanelAtIndex: function( index ) {
		var me = this,
			panel = me.child('#pCharts').items.getAt(index) ;
		return panel ;
	},
	handleDeleteChartPanelAtIndex: function( index ) {
		var me = this,
			panel = me.getChartPanelAtIndex(index),
			panelTitle = panel.title ;
		Ext.Msg.confirm('Delete chart', 'Remove chart '+panelTitle+' ?', function(btn){
			if( btn == 'yes' ) {
				me.child('#pCharts').remove(panel) ;
			}
		},me) ;
	},
	
	
	chartsDoSave: function() {
		var me = this ;
		if( !me.chartsVisible ) {
			return ;
		}
		
		var arr_QueryResultChartModel = [],
			chartTabPanel = me.child('#pCharts'),
			getAssociatedData = true ;
		chartTabPanel.items.each( function(chartPanel) {
			if( !(chartPanel instanceof Optima5.Modules.CrmBase.QueryResultChartPanel)
				|| chartPanel.chartCfgRecord == null
			) {
				return ;
			}
			arr_QueryResultChartModel.push( chartPanel.chartCfgRecord.getData(getAssociatedData=true) ) ;
		},me) ;
				
		var ajaxParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(ajaxParams,me.ajaxBaseParams) ;
		Ext.apply(ajaxParams,{
			_subaction: 'chart_cfg_save',
					  
			arr_QueryResultChartModel: Ext.JSON.encode(arr_QueryResultChartModel)
		});
		
		me.loadMask = Ext.create('Ext.LoadMask',{
			msg:'Saving charts',
			target: me
		});
		me.loadMask.show() ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
			},
			callback: function() {
				me.loadMask.hide() ;
			},
			scope: me
		});
	},
	chartsDoDelete: function() {
		var me = this ;
		if( !me.chartsVisible ) {
			return ;
		}
		
		var ajaxParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(ajaxParams,me.ajaxBaseParams) ;
		Ext.apply(ajaxParams,{
			_subaction: 'chart_cfg_save',
					  
			arr_QueryResultChartModel: null
		});
		
		me.loadMask = Ext.create('Ext.LoadMask',{
			msg:'Discarding charts',
			target: me
		});
		me.loadMask.show() ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				} else {
					me.child('#pCharts').removeAll() ;
					me.setChartsVisible(false) ;
				}
			},
			callback: function() {
				me.loadMask.hide() ;
			},
			scope: me
		});
	},
	chartsEvalMixed: function() {
		var me = this,
			pCharts = me.child('#pCharts') ;
			
		if( !pCharts.child('op5crmbasequeryresultchartmixed') ) {
			pCharts.insert(0,{
				xtype:'op5crmbasequeryresultchartmixed',
				optimaModule: me.optimaModule,
				ajaxBaseParams: me.ajaxBaseParams,
				title: '<font color="red">Mixed</font>',
				hidden: true
			}) ;
		}
		var pMixedchart = pCharts.child('op5crmbasequeryresultchartmixed') ;
		
		var arrQueryResultChartModel = [] ;
		pCharts.items.each( function(chartPanel) {
			if( !(chartPanel.getXType('op5crmbasequeryresultchartsingle'))
				|| chartPanel.chartCfgRecord == null
				|| chartPanel.getTomixedAxis() == null
			) {
				return ;
			}
			
			
			var chartCfgRecord = chartPanel.chartCfgRecord ;
			arrQueryResultChartModel.push(chartCfgRecord) ;
		},me) ;
		
		if( arrQueryResultChartModel.length>0 ) {
			pMixedchart.tab.show() ;
		} else {
			pMixedchart.tab.hide() ;
		}
		pMixedchart.pushModels( arrQueryResultChartModel ) ;
	}
}) ;
