Ext.define('Optima5.Modules.CrmBase.QueryResultPanel' ,{
	extend: 'Ext.panel.Panel',
			  
	requires: [
		'Optima5.Modules.CrmBase.QueryTemplateManager',
		'Ext.ux.dams.IFrameContent',
		'Ext.ux.ColumnAutoWidthPlugin',
		'Ext.ux.AddTabButton',
		'Optima5.Modules.CrmBase.QueryResultChartPanel'
	],
			  
	ajaxBaseParams:{},
	ajaxResponse:null,
	RES_id: '',
	
	chartsVisible : false,
			  
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:QueryPanel','No module reference ?') ;
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
					text: 'Charts/Graphs',
					iconCls: 'op5-crmbase-qresultmenu-kchart',
					menu:[{
						itemId: 'enabled',
						text: 'Charting enabled',
						checked: false,
						listeners: {
							checkchange: function( ci, checked ) {
								me.setChartsVisible( checked ) ;
							},
							scope: me
						}
					},{
						itemId: 'separator',
						xtype: 'menuseparator'
					},{
						itemId: 'save',
						text: 'Save defined charts',
						iconCls: 'op5-crmbase-qresultmenu-save'
					},{
						itemId: 'delete',
						text: 'Delete all charts',
						iconCls: 'op5-crmbase-qresultmenu-delete'
					}]
				}]
			}]
		}) ;
		this.callParent() ;
		
		Optima5.Modules.CrmBase.QueryTemplateManager.loadStyle(me.optimaModule);
		
		var ajaxParams = {} ;
		Ext.apply(ajaxParams,me.ajaxBaseParams) ;
		Ext.apply(ajaxParams,{
			_subaction:'res_get',
			RES_id:me.RES_id
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
				
				var tabtree = Ext.create('Ext.tree.Panel',{
					border:false,
					tabIdx: tabCount,
					title:tabData.tab_title,
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
					plugins: [Ext.create('Ext.ux.ColumnAutoWidthPlugin', {allColumns:true, minAutoWidth:90, singleOnly:true})],
					listeners: {
						itemcontextmenu: me.onRowRightClick,
						scope:me
					},
					viewConfig: { 
						//stripeRows: false,
						listeners: {
							beforerefresh: function(view) {
								var treePanel = view.up('treepanel') ;
								me.onBeforeGridRefresh( treePanel.tabIdx, treePanel ) ;
							},
							scope: me
						},
						getRowClass: function(record,index) {
							var rowIdx = record.get('_rowIdx'),
								color = this.colorMapObj[rowIdx] ;
								
							if( color != null ) {
								return 'ux-grid-row-bk-'+color ;
							}
						}
					}
				}) ;
				
				tabtree.on('destroy',function(){
					// console.log('Unregistering model '+tmpModelName) ;
					Ext.ModelManager.unregister( tmpModelName ) ;
				},me);
				
				tabtree.getView().headerCt.on('menucreate',me.onColumnsMenuCreate,me) ;
				
				tabitems.push(tabtree);
				return true ;
			}
			
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
				cls:'op5crmbase-querygrid-'+me.optimaModule.sdomainId,
				tabIdx: tabCount,
				title:tabData.tab_title,
				columns:columns,
				store:tabstore,
				/* verticalScroller: {
					numFromEdge: 5,
					trailingBufferZone: 10,
					leadingBufferZone: 20
				},*/
				listeners: {
					itemcontextmenu: me.onRowRightClick,
					scope:me
				},
				plugins: [Ext.create('Ext.ux.ColumnAutoWidthPlugin', {allColumns:true, minAutoWidth:90, singleOnly:true})],
				viewConfig: { 
					//stripeRows: false,
					listeners: {
						beforerefresh: function(view) {
							var gridPanel = view.up('gridpanel') ;
							me.onBeforeGridRefresh( gridPanel.tabIdx, gridPanel ) ;
						},
						scope: me
					},
					getRowClass: function(record,index) { 
						return record.get('detachedRow') ? 'op5crmbase-detachedrow' : ''; 
					}
				}
			});
			
			tabgrid.on('destroy',function(){
				// console.log('Unregistering model '+tmpModelName) ;
				Ext.ModelManager.unregister( tmpModelName ) ;
			},me);
			
			tabgrid.getView().headerCt.on('menucreate',me.onColumnsMenuCreate,me) ;
			
			tabitems.push(tabgrid);
			return true ;
		},me) ;
		
		me.removeAll() ;
		me.add({
			xtype:'tabpanel' ,
			itemId: 'pResult',
			//frame: true,
			region:'center',
			flex:2,
			border:false,
			activeTab: 0,
			defaults :{
					// bodyPadding: 10
			},
			items: tabitems
		},{
			xtype:'tabpanel',
			region:'south',
			itemId: 'pCharts',
			flex: 1,
			title: 'Charts',
			collapsible: true,
			defaults:{
				listeners: {
					serieschanged: function() {
						me.getActiveResultPanel().getView().refresh() ;
					},
					scope:me
				}
			},
			plugins:[{ 
				ptype: 'AddTabButton', 
				iconCls: 'icon-add', 
				toolTip: 'New empty chart',
				panelConfig: {
					xtype: 'op5crmbasequeryresultchart'
				}
			}],
			listeners:{
				afterlayout:{
					fn: function(p) {
						this.mon( p.getTabBar().el, {
							contextmenu: this.onTabChartRightClick, 
							scope: this,
							delegate: 'div.x-tab'
						}) ;
					},
					scope: this,
					single: true
				}
			}
		}) ;
		
		/*
		 * Attach listeners to pCharts to monitor visibility/tabchange
		 * => triggers pResult view refresh ( show series )
		 */
		me.child('#pCharts').on({
			show:me.onChartsVisibilityChange,
			hide:me.onChartsVisibilityChange,
			collapse:me.onChartsVisibilityChange,
			expand:me.onChartsVisibilityChange,
			tabchange:me.onChartsVisibilityChange,
			scope:me
		}) ;
		
		
		// TODO: use server-side charts cfg
		me.setChartsVisible(false) ;
	},
	getActiveResultPanel: function() {
		var me = this,
			pResult = me.child('#pResult') ;
		return pResult.getActiveTab() ;
	},
	getActiveResultPanelMapGroups: function() {
		var me = this,
			tabIndex = me.child('#pResult').items.indexOf(me.getActiveResultPanel());
			mapGroups = me.ajaxResponse.tabs[tabIndex].MAP_groups ;
		//console.dir(mapGroups) ;
		return mapGroups ;
	},
	getMapGroupsForPanel: function(rPanel) {
		var me = this,
			tabIndex = me.child('#pResult').items.indexOf(rPanel);
			mapGroups = me.ajaxResponse.tabs[tabIndex].MAP_groups ;
		//console.dir(mapGroups) ;
		return mapGroups ;
	},
	getPivotForRow: function(rPanel,rowRecord) {
		var me = this,
			tabIndex = me.child('#pResult').items.indexOf(rPanel),
			mapGroups = me.ajaxResponse.tabs[tabIndex].MAP_groups,
			rowIdx = rowRecord.get('_rowIdx'),
			rowPivot = mapGroups.row_pivotMap[rowIdx] ;
			
		return rowPivot ;
	},
	getPivotForColumn: function(rPanel,columnDataIndex) {
		var me = this,
			tabIndex = me.child('#pResult').items.indexOf(rPanel),
			mapGroups = me.ajaxResponse.tabs[tabIndex].MAP_groups,
			colPivot = mapGroups.col_pivotMap[columnDataIndex] ;
		
		return colPivot ;
	},
	getIterationsForRows: function(rPanel) {
		var me = this,
			tabIndex = me.child('#pResult').items.indexOf(rPanel),
			mapGroups = me.ajaxResponse.tabs[tabIndex].MAP_groups ;
			
		return mapGroups.col_iterations ;
	},
	getIterationsForColumns: function(rPanel) {
		var me = this,
			tabIndex = me.child('#pResult').items.indexOf(rPanel),
			mapGroups = me.ajaxResponse.tabs[tabIndex].MAP_groups ;
		
		return mapGroups.row_iterations ;
	},
	setChartsVisible: function(torf) {
		/* Components to hide/show :
		 * - main toolbar's kchart checkbox + menu items
		 * - docked (south) chart panel
		 */
		var me = this,
			kchartMenu = me.query('toolbar')[0].child('#kchart').menu,
			chartTabPanel = me.child('#pCharts') ;
			
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
			_subaction:'exportXLS',
			RES_id:me.RES_id
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
		console.log('onChartsVisibilityChange') ;
		me.getActiveResultPanel().getView().refresh() ;
	},
	
	onBeforeGridRefresh: function( tabIndex, rPanel ) {
		console.log('onBeforeGridRefresh') ;
		var me = this,
			chartPanel = me.getActiveChartPanel(),
			cssId = 'cssId-'+me.getId() ;
		
		var me = this,
			tabIndex = me.child('#pResult').items.indexOf(rPanel),
			mapGroups = me.ajaxResponse.tabs[tabIndex].MAP_groups,
			colorMapObj={} ;
		
		Ext.Array.each( me.ajaxResponse.tabs[tabIndex].data, function(rec) {
			var rowIdx = rec['_rowIdx'] ,
				rowPivot = mapGroups.row_pivotMap[rowIdx],
				color = (chartPanel!=null ? chartPanel.getPivotColor( rowPivot ) : null ) ;
				
			if( color != null ) {
				colorMapObj[rowIdx] = color ;
			}
		},me) ;
		rPanel.getView().colorMapObj = colorMapObj ;
		
		// ajust CSS styles to highlight selected series
		// console.dir(arguments) ;
		var cssBlob = '' ;
		Ext.Object.each( colorMapObj, function(k,v) {
			cssBlob += ".ux-grid-row-bk-"+v+" .x-grid-cell { background-color: #"+v+" !important ; }\r\n" ;
		},me) ;
		console.log(cssBlob) ;
		Ext.util.CSS.removeStyleSheet( cssId ) ;
		Ext.util.CSS.createStyleSheet( cssBlob, cssId ) ;
	},
	
	onColumnsMenuCreate: function( headerCt, menu ) {
		var me = this;
		me.getColorPicker() ;
		menu.on('beforeshow', me.onColumnsMenuBeforeShow, me);
	},
	onColumnsMenuBeforeShow: function( menu ) {
		var me = this,
			columnDataIndex = menu.activeHeader.dataIndex,
			rPanel = menu.up('tablepanel'),
			chartPanel = me.getActiveChartPanel() ;
			
		console.dir(rPanel) ;
		
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
				listeners: {
					scope: me
				}
			});
			menu.add({
				itemId: 'chrt-btn-delete',
				iconCls: 'op5-crmbase-qresult-kchart-remove' ,
				text: 'Remove from chart',
				listeners: {
					scope: me
				}
			});
		}
		
		
		
		/*
		 * Show context items for Charts IF :
		 * - column type is group ( != label ), ie has pivotMap entry
		 * - panel is type GRID ( tree uses areastacked on nodes )
		 * - only one iteration on ROWS
		 * - charting is enabled + current chart panel != null + current chart panel compatible
		 */
		
		var menuSeparator = menu.query('menuseparator')[1],
			  menuItemAdd = menu.child('#chrt-btn-add'),
			  menuItemDel = menu.child('#chrt-btn-delete'),
			  menuItemDis = menu.child('#chrt-btn-disabled') ;
		
		var colPivot = me.getPivotForColumn(rPanel,columnDataIndex),
			  colIterations = me.getIterationsForColumns(rPanel) ;
			  colIteration  = ( colIterations.length == 1 ? colIterations[0] : null ) ;
			  
		console.dir(colPivot) ;
		
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
		
		if( !(colIteration) || !(chartPanel.testChartIteration(colIteration)) ) {
			menuSeparator.setVisible(true) ;
			menuItemAdd.setVisible(false) ;
			menuItemDel.setVisible(false) ;
			menuItemDis.setText('Cannot add serie to chart') ;
			menuItemDis.setVisible(true) ;
			return ;
		}
		
		menuItemAdd.menu = me.getColorPicker() ;
		
		menu.query('menuseparator')[1].setVisible(true) ;
		menuItemAdd.setVisible(true) ;
		menuItemDel.setVisible(true) ;
		menuItemDis.setVisible(false) ;
	},
	
	onRowRightClick: function(rPanelView,record,targetElement,index,event) {
		var me = this,
			rPanel = rPanelView.up('tablepanel'),
			chartPanel = me.getActiveChartPanel() ;
			
		var rowPivot = me.getPivotForRow(rPanel,record),
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
		} else if( !(rowIteration) || !(chartPanel.defineChartIteration(rowIteration)) ) {
			gridContextMenuItems.push({
				iconCls: 'op5-crmbase-qresult-warning',
				text: 'Cannot add serie to chart',
				disabled: true
			});
		} else {
			gridContextMenuItems.push({
				iconCls: 'op5-crmbase-qresult-kchart-add' ,
				text: '&#160;',
				menu: {
					layout:'fit',
					items:[{
						xtype: 'colorpicker',
						handler: function(picker, color) {
							me.onChartAddRow( rPanel, rowPivot, color ) ;
							Ext.menu.Manager.hideAll();
						},
						scope:me
					}]
				},
				handler: function(){}
			});
			gridContextMenuItems.push({
				iconCls: 'op5-crmbase-qresult-kchart-remove' ,
				text: 'Remove from chart',
				listeners: {
					scope: me
				}
			});
		}
		
		var gridContextMenu = Ext.create('Ext.menu.Menu',{
			items : gridContextMenuItems
		}) ;
		
		gridContextMenu.showAt(event.getXY());
	},
	
	
	onTabChartRightClick: function(event, targetElement) {
		var me = this,
			tabBar = me.child('#pCharts').getTabBar()
			tab = tabBar.getChildByElement(targetElement),
			tabIndex = tabBar.items.indexOf(tab);
			
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
			items: [{
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
				xtype: 'menuseparator'
			},{
				text: 'Delete chart',
				itemId: 'delete',
				iconCls: 'op5-crmbase-qresult-deletechart'
			}]
		}) ;
		event.preventDefault();
		menu.showAt(event.getXY());
	},
	onTabChartMenuItemClick: function( tabIndex, menuItemId ) {
		var me = this ;
		if( menuItemId == 'delete' ) {
			me.handleDeleteChartPanelAtIndex(tabIndex) ;
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
			}
			me.getChartPanelAtIndex(tabIndex).setChartType(targetChartType) ;
			return ;
		}
	},
	
	onChartAddColumn: function() {
		
	},
	onChartAddRow: function( rPanel, rowPivot, color ) {
		var me = this,
			chartPanel = me.getActiveChartPanel(),
			rowIteration = me.getIterationsForRows(rPanel)[0] ;
		if( !chartPanel || !rowIteration ) {
			return ;
		}
		chartPanel.defineChartIteration( rowIteration ) ;
		chartPanel.addPivot( color, rowPivot ) ;
	},
	onChartAddNodeRow: function() {
		
	},
	getColorPicker: function() {
		var me = this ;
		if( !me.chartColorPicker ) {
			me.chartColorPicker = Ext.create('Ext.menu.Menu',{
				layout:'fit',
				items:[{
					xtype:'colorpicker'
				}]
			});
		}
		return me.chartColorPicker ;
	},
	getActiveChartPanel: function() {
		var me = this,
			pCharts = me.child('#pCharts') ;
		return pCharts.getActiveTab() ;
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
	}
}) ;