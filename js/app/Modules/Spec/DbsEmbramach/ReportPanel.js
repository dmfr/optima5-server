Ext.define('DbsEmbramachReportRowModel', {
	extend: 'Ext.data.Model',
	fields: [
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
	
	initComponent: function() {
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
			}]
		});
		
		this.callParent() ;
		
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
				flow_code: this.flowCode
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success != true ) {
					return ;
				}
				this.onConfigure( jsonResponse ) ;
			},
			callback: function() {
				//this.hideLoadmask() ;
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
		Ext.util.CSS.createStyleSheet(cssBlob, 'op5specdbsembralamcolors-'+this.getId());
		
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
				return 'Total heures :' ;
			}
		}] ;
		
		var uniqueRenderer = function(value, metaData, record, rowIndex, colIndex, store, view) {
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
				return '' ;
			}
			if( retValue == 0 ) {
				return '' ;
			}
			meta.tdCls += ' op5-spec-dbsembramach-report-sums' ;
			return retValue ;
		} ;
		
		Ext.Array.each( jsonResponse.cfg.date, function(cfgDate) {
			var objDate = Ext.Date.parse(cfgDate.date_start,'Y-m-d') ;
				timeKey = cfgDate.time_key;
				
			var childColumns = [] ;
			Ext.Array.each( jsonResponse.cfg.shift, function(cfgShift) {
				childColumns.push({
					text: 'shift : <b>'+cfgShift.shift_txt+'</b>',
					align: 'center',
					_timeKey: timeKey,
					_shiftId: cfgShift.shift_id,
					menuDisabled: true,
					columns: [{
						text: 'Nb',
						sortable: false,
						dataIndex: timeKey,
						menuDisabled: true,
						_timeKey: timeKey,
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
						_timeKey: timeKey,
						_shiftId: cfgShift.shift_id,
						_modePercent: true,
						width: 45,
						align: 'center',
						renderer: uniqueRenderer,
						summaryType: summaryTypeFn,
						summaryRenderer: summaryRendererFn
					}]
				}) ;
			});
			childColumns.push({
				text: '<b>All day</b>',
				align: 'center',
				_timeKey: timeKey,
				menuDisabled: true,
				columns: [{
					text: 'Nb',
					sortable: false,
					dataIndex: timeKey,
					menuDisabled: true,
					_timeKey: timeKey,
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
					_timeKey: timeKey,
					_shiftId: null,
					_modePercent: true,
					width: 45,
					align: 'center',
					renderer: uniqueRenderer,
					summaryType: summaryTypeFn,
					summaryRenderer: summaryRendererFn
				}]
			}) ;
			
			columns.push({
				text: '<b>'+Ext.Date.format(objDate,'l') + ' ' + Ext.Date.format(objDate,'d/m')+'</b>',
				_timeKey: timeKey,
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
			listeners: {},
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
				flow_code: this.flowCode
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
					}) ;
					rowRecord[timeKey] = timeValue ;
				}) ;
				
				data.push(rowRecord) ;
			});
		});
		
		this.down('grid').getStore().loadData(data) ;
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
	
	onDestroy: function() {
		
	}
});