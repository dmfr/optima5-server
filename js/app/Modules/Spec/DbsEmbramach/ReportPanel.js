Ext.define('DbsEmbramachReportRowModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: '_is_footer', type:'boolean'},
		{name: 'row_color', type:'string'},
		{name: 'prio_id', type:'string'},
		{name: 'prio_txt',  type: 'string'},
		{name: 'tat_code', type:'string'},
		{name: 'tat_name',  type: 'string'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsEmbramach.ReportPanel',{
	extend:'Ext.panel.Panel',
	requires: [],
	
	viewMode: 'day',
	
	initComponent: function() {
		this.viewMode = 'day' ;
		var viewModeItems = [{
			itemId: 'day',
			text: 'by Day',
			iconCls: 'op5-spec-dbsembramach-report-view-day'
		},{
			itemId: 'week',
			text: 'by Week',
			iconCls: 'op5-spec-dbsembramach-report-view-week'
		},{
			itemId: 'month',
			text: 'by Month',
			iconCls: 'op5-spec-dbsembramach-report-view-month'
		}] ;
		
		if( this._readonlyMode ) {
			this.viewMode = 'month' ;
			var viewModeItems = [{
				itemId: 'month',
				text: 'by Month',
				iconCls: 'op5-spec-dbsembramach-report-view-month'
			}] ;
		}
		
		
		Ext.apply(this,{
			layout: 'fit',
			border: false,
			items: [{
				xtype:'box',
				cls:'op5-waiting',
				flex:1
			}],
			tbar:[{
				hidden: this.noDestroy,
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Retour menu</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},{
				iconCls: 'op5-crmbase-datatoolbar-refresh',
				text: 'Refresh',
				handler: function() {
					this.doRefresh() ;
				},
				scope: this
			},{
				iconCls: 'op5-spec-dbsembramach-report-clock',
				itemId: 'tbViewmode',
				viewConfig: {forceFit: true},
				menu: {
					defaults: {
						handler:function(menuitem) {
							//console.log('ch view '+menuitem.itemId) ;
							this.onViewSet( menuitem.itemId ) ;
						},
						scope:this
					},
					items: viewModeItems
				}
			},'->',{
				hidden: this._readonlyMode,
				itemId: 'xlsExport',
				text: 'Export XLS',
				icon: 'images/op5img/ico_save_16.gif',
				handler: function() {
					this.handleDownload() ;
				},
				scope: this
			}]
		});
		
		this.callParent() ;
		this.updateToolbar() ;
		
		this.tmpModelName = 'DbsEmbramachReportRowModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpModelName ) ;
		}) ;
		
		this.doConfigure() ;
	},
	
	doConfigure: function() {
		//this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_embramach',
				_action: 'stats_getPicking',
				flow_code: this.flowCode,
				cfg_date: this.viewMode
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success != true ) {
					this.removeAll() ;
					return ;
				}
				this.onConfigure( jsonResponse ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onConfigure: function( jsonResponse ) {
		//console.dir(jsonResponse) ;
		
		var cssBlob = '',
			colors = [] ;
		Ext.Array.each( jsonResponse.cfg.tat, function(cfgTat) {
			cssRoot = '.color-'+cfgTat.color.substr(1,6) ;
			cssBlob += cssRoot+" .x-grid-cell-inner { background-color:"+cfgTat.color+" }\r\n" ;
		}) ;
		Ext.util.CSS.createStyleSheet(cssBlob, 'op5specdbsembramachcolors-'+this.getId());
		
		// create Model + Grid
		var pushModelfields = [] ;
		var columns = [{
			locked: true,
			hidden: true,
			text: 'Priority',
			dataIndex: 'prio_id',
			width: 10
		},{
			locked: true,
			text: 'Tat interval',
			dataIndex: 'tat_name',
			width: 200,
			renderer: function(v) {
				return '<b>'+v+'</b>' ;
			},
			summaryType: 'count',
			summaryRenderer: function(v) {
				return '<i><b>Total</b></i>' ;
			}
		}] ;
		
		var uniqueRenderer = function(value, metaData, record, rowIndex, colIndex, store, view) {
			if( record.data._is_footer ) {
				return '' ;
			}
			var column = view.ownerCt.columns[colIndex] ;
			if( column._shiftId ) {
				retValue = value.obj_shifts[column._shiftId].value_count ;
				totValue = value.obj_shifts[column._shiftId].value_total ;
			} else {
				retValue = value.value_count ;
				totValue = value.value_total ;
			}
			if( Ext.isEmpty(retValue) || retValue == 0 ) {
				return '' ;
			}
			if( column._modePercent ) {
				retValue = (retValue / totValue) * 100 ;
				retValue = Math.round(retValue) ;
				retValue = retValue + '&#160;' + '%' ;
			}
			
			if( Ext.isEmpty(column._shiftId) 
			|| Ext.isEmpty(record.get('row_color')) || record.get('row_color').toUpperCase() == '#FFFFFF' ) {
				retValue = '<b>' + retValue + '</b>' ;
			}
			return retValue ;
		} ;
		var summaryTypeFn = function(records,values) {
			return values ;
		} ;
		var summaryRendererFn = function(values, summaryData, field, meta) {
			var column = this ;
			
			var retValue = 0 ;
			if( column._shiftId ) {
				retValue = 0 ;
				Ext.Array.each( values, function(value) {
					retValue += value.obj_shifts[column._shiftId].value_count ;
				}) ;
			} else {
				retValue = 0 ;
				Ext.Array.each( values, function(value) {
					retValue += value.value_count ;
				}) ;
			}
			
			if( column._modePercent ) {
				var footerRowRecord = column.up('grid').getStore().findRecord('_is_footer',true),
					footerTimekeyObj = footerRowRecord.get(column.dataIndex),
					percentRetValue ;
				if( column._shiftId ) {
					percentRetValue = retValue / footerTimekeyObj.obj_shifts[column._shiftId].value_count ;
				} else {
					percentRetValue = retValue / footerTimekeyObj.value_count ;
				}
				if( isNaN(percentRetValue) || percentRetValue == 1 ) {
					return '' ;
				}
				return Math.round(percentRetValue * 100) + '&#160;' + '%' ;
			}
			if( retValue == 0 ) {
				return '' ;
			}
			meta.tdCls += ' op5-spec-dbsembramach-report-sums' ;
			return retValue ;
		} ;
		
		Ext.Array.each( jsonResponse.cfg.date, function(cfgDate) {
			var timeTitle = cfgDate.time_title,
				timeObj = cfgDate,
				timeKey = cfgDate.time_key;
				
			var childColumns = [] ;
			Ext.Array.each( jsonResponse.cfg.shift, function(cfgShift) {
				childColumns.push({
					text: 'shift : <b>'+cfgShift.shift_txt+'</b>',
					align: 'center',
					_timeObj: timeObj,
					_shiftId: cfgShift.shift_id,
					menuDisabled: true,
					columns: [{
						text: 'Nb',
						sortable: false,
						dataIndex: timeKey,
						menuDisabled: true,
						_timeObj: timeObj,
						_shiftId: cfgShift.shift_id,
						_modePercent: false,
						width: 45,
						align: 'center',
						renderer: uniqueRenderer,
						summaryType: summaryTypeFn,
						summaryRenderer: summaryRendererFn
					},{
						text: '%',
						sortable: false,
						dataIndex: timeKey,
						menuDisabled: true,
						_timeObj: timeObj,
						_shiftId: cfgShift.shift_id,
						_modePercent: true,
						width: 45,
						align: 'center',
						renderer: uniqueRenderer,
						summaryType: summaryTypeFn,
						summaryRenderer: summaryRendererFn,
						
						tdCls: 'op5-spec-dbsembramach-report-column-separator-inner'
					}]
				}) ;
			});
			childColumns.push({
				text: '<b>All day</b>',
				align: 'center',
				_timeObj: timeObj,
				menuDisabled: true,
				columns: [{
					text: 'Nb',
					sortable: false,
					dataIndex: timeKey,
					menuDisabled: true,
					_timeObj: timeObj,
					_shiftId: null,
					_modePercent: false,
					width: 45,
					align: 'center',
					renderer: uniqueRenderer,
					summaryType: summaryTypeFn,
					summaryRenderer: summaryRendererFn
				},{
					text: '%',
					sortable: false,
					dataIndex: timeKey,
					menuDisabled: true,
					_timeObj: timeObj,
					_shiftId: null,
					_modePercent: true,
					width: 45,
					align: 'center',
					renderer: uniqueRenderer,
					summaryType: summaryTypeFn,
					summaryRenderer: summaryRendererFn,
					
					tdCls: 'op5-spec-dbsembramach-report-column-separator-outer'
				}]
			}) ;
			
			columns.push({
				text: '<b>'+timeTitle+'</b>',
				_timeObj: timeObj,
				menuDisabled: true,
				columns: childColumns
			});
			
			pushModelfields.push({
				name: timeKey,
				type: 'auto'
			});
		});
		
		
		
		
		
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName, {
			extend: 'DbsEmbramachReportRowModel',
			fields: pushModelfields
		});
		
		var columnDefaults = {
			menuDisabled: false,
			draggable: false,
			sortable: false,
			hideable: false,
			resizable: false,
			groupable: false,
			lockable: false
		} ;
		Ext.Array.each( columns, function(column) {
			Ext.applyIf( column, columnDefaults ) ;
			if( !Ext.isEmpty(column['_groupBy']) ) {
				// false groupable to enable columnMenu
				column['groupable'] = true ;
			}
		}) ;
		
		
		
		
		
		this.removeAll() ;
		this.add({
			border: false,
			xtype:'grid',
			store: {
				model: this.tmpModelName,
				data: [],
				groupField: 'prio_id',
				proxy:{
					type:'memory'
				}
			},
			enableLocking: true,
			plugins: [],
			features: [{
				ftype: 'groupingsummary',
				hideGroupedHeader: false,
				enableGroupingMenu: false,
				enableNoGroups: false,
				groupHeaderTpl:Ext.create('Ext.XTemplate',
					'<div>{[this.renderer(values)]}</div>',
					{
						renderer: function(values) {
							if( values.rows.length == 0 ) {
								return '' ;
							}
							switch( values.groupField ) {
								case 'prio_id' :
									return values.rows[0].data.prio_txt ;
								default :
									return '' ;
							}
						}
					}
				)
			}],
			columns: columns,
			listeners: {
				itemclick: function( gridview, record, node, index, e ) {
					var cellNode = e.getTarget(gridview.cellSelector),
						column = gridview.getHeaderByCell(cellNode),
						value = record.get(column.dataIndex) ;
					if( !value || !value.value_count || value.value_count <= 0 ) {
						return ;
					}
					
					var machFilters = {
						prio_id: record.get('prio_id'),
						tat_code: record.get('tat_code'),
						date_start: column._timeObj.date_start,
						date_end: column._timeObj.date_end,
						shift_id: column._shiftId
					} ;
					this.openMachPopup(machFilters) ;
				},
				scope: this
			},
			viewConfig: {
				preserveScrollOnRefresh: true,
				getRowClass: function(record, index, rowParams, ds) {
					return 'color-'+record.get('row_color').substr(1,6) ;
				}
			}
		}) ;
		
		// forward
		this.onLoad(jsonResponse) ;
	},
	doLoad: function() {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_embramach',
				_action: 'stats_getPicking',
				flow_code: this.flowCode,
				cfg_date: this.viewMode
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success != true ) {
					return ;
				}
				this.onLoad( jsonResponse ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoad: function( jsonResponse ) {
		var sortObj = {}, sortKey ; 
		// prio_id => tat_code => date_sql => shift_id => ++count
		// prio_id => _ => date_sql => shift_id => ++count
		Ext.Array.each( jsonResponse.data, function(dataRow) {
			//console.dir(dataRow) ;
			sortKey = [dataRow.prio_id,dataRow.value_TAT,dataRow.time_key,dataRow.shift_id].join('%%') ;
			if( !sortObj.hasOwnProperty(sortKey) ) {
				sortObj[sortKey] = 0 ;
			}
			sortObj[sortKey]+= dataRow.value_count ;
			
			if( !dataRow.value_TAT ) {
				return ;
			}
			
			sortKey = [dataRow.prio_id,'_',dataRow.time_key,dataRow.shift_id].join('%%') ;
			if( !sortObj.hasOwnProperty(sortKey) ) {
				sortObj[sortKey] = 0 ;
			}
			sortObj[sortKey]+= dataRow.value_count ;
		}) ;
		
		// create Records
		var data = [], rowRecord ;
		var footerRowRecord = {
			_is_footer: true,
			prio_id: 9
		} ;
		Ext.Array.each( jsonResponse.cfg.priority, function( cfgPriority ) {
			Ext.Array.each( jsonResponse.cfg.tat, function( cfgTat ) {
				if( cfgTat.prio_id != cfgPriority.prio_id ) {
					return ;
				}
				rowRecord = {
					prio_id: cfgPriority.prio_id,
					prio_txt: cfgPriority.prio_txt,
					tat_code: cfgTat.tat_code,
					tat_name: cfgTat.tat_name,
					row_color: cfgTat.color
				} ;
				
				Ext.Array.each( jsonResponse.cfg.date, function( cfgDate ) {
					var timeKey = cfgDate.time_key ;
					var timeValue = {
						value_count: 0,
						value_total: 0,
						obj_shifts: {}
					} ;
					Ext.Array.each( jsonResponse.cfg.shift, function( cfgShift ) {
						if( !timeValue.obj_shifts.hasOwnProperty(cfgShift.shift_id) ) {
							timeValue.obj_shifts[cfgShift.shift_id] = {
								value_count: 0,
								value_total: 0
							}
						}
						// dig information from sortObj
						sortKey = [cfgPriority.prio_id,cfgTat.tat_code,timeKey,cfgShift.shift_id].join('%%') ;
						if( sortObj.hasOwnProperty(sortKey) ) {
							timeValue.value_count += sortObj[sortKey] ;
							timeValue.obj_shifts[cfgShift.shift_id].value_count += sortObj[sortKey] ;
						}
						sortKey = [cfgPriority.prio_id,'_',timeKey,cfgShift.shift_id].join('%%') ;
						if( sortObj.hasOwnProperty(sortKey) ) {
							timeValue.value_total += sortObj[sortKey] ;
							timeValue.obj_shifts[cfgShift.shift_id].value_total += sortObj[sortKey] ;
						}
						
						
						
						// Footer row
						if( !footerRowRecord.hasOwnProperty(timeKey) ) {
							footerRowRecord[timeKey] = {
								value_count: 0,
								obj_shifts: {}
							};
						}
						if( !footerRowRecord[timeKey].obj_shifts.hasOwnProperty(cfgShift.shift_id) ) {
							footerRowRecord[timeKey].obj_shifts[cfgShift.shift_id] = {
								value_count: 0
							} ;
						}
						
						sortKey = [cfgPriority.prio_id,cfgTat.tat_code,timeKey,cfgShift.shift_id].join('%%') ;
						if( sortObj.hasOwnProperty(sortKey) ) {
							footerRowRecord[timeKey].value_count += sortObj[sortKey] ;
							footerRowRecord[timeKey].obj_shifts[cfgShift.shift_id].value_count += sortObj[sortKey] ;
						}
					}) ;
					rowRecord[timeKey] = timeValue ;
				}) ;
				
				data.push(rowRecord) ;
			});
			data.push(footerRowRecord) ;
		});
		
		this.down('grid').getStore().loadData(data) ;
	},
	
	
	onViewSet: function( viewId ) {
		var tbViewmode = this.child('toolbar').getComponent('tbViewmode'),
			tbViewmodeItem = tbViewmode.menu.getComponent(viewId),
			iconCls, text ;
		if( tbViewmodeItem ) {
			var oldViewMode = this.viewMode ;
			this.viewMode = viewId ;
		}
		
		this.updateToolbar() ;
		this.showLoadmask() ;
		this.doConfigure() ;
	},
	updateToolbar: function(doActivate) {
		var tbViewmode = this.child('toolbar').getComponent('tbViewmode') ;
		
		// View mode
		var tbViewmodeItem = tbViewmode.menu.getComponent(this.viewMode) ;
		if( tbViewmodeItem ) {
			tbViewmode.setText( 'View :'+'&#160;'+'<b>' + tbViewmodeItem.text + '</b>' );
			tbViewmode.setIconCls( tbViewmodeItem.iconCls );
		}
	},
	
	
	doQuit: function() {
		this.destroy() ;
	},
	doRefresh: function() {
		this.doLoad(true) ;
	},
	
	
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	
	openMachPopup: function(machFilters) {
		if( this.machPopup ) {
			this.machPopup.destroy() ;
		}
		
		if( this._readonlyMode ) {
			return ;
		}
		
		var panelSize = this.getSize() ;
		this.machPopup = Ext.create('Ext.panel.Panel',{
			width: panelSize.width,
			height: panelSize.height,
			
			floating: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				}
			}],
			
			layout: 'fit',
			items: [Ext.create('Optima5.Modules.Spec.DbsEmbramach.MachPanel',{
				optimaModule: this.optimaModule,
				noDestroy: false,
				flowCode: 'PICKING',
				
				_popupMode: true,
				_popupFilters: machFilters
			})]
		});

		// Size + position
		this.machPopup.setSize({
			width: this.getSize().width - 60,
			height: this.getSize().height - 60
		}) ;
		this.machPopup.on('destroy',function() {
			this.getEl().unmask() ;
		},this,{single:true}) ;
		this.getEl().mask() ;
		
		this.machPopup.show();
		this.machPopup.getEl().alignTo(this.getEl(), 'c-c?');
	},
	
	
	handleDownload: function() {
		var me = this ;
		
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_dbs_embramach',
			_action: 'stats_getPickingXls',
			flow_code: this.flowCode,
			cfg_date: this.viewMode
		}) ;
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	},
	
	
	onDestroy: function() {
		Ext.util.CSS.removeStyleSheet('op5specdbsembramachcolors-'+this.getId());
	}
});